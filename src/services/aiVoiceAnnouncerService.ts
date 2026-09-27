import { GoogleGenAI, Modality } from '@google/genai';
import { TextChannel, AttachmentBuilder, Message, EmbedBuilder } from 'discord.js';
import https from 'https';
import { voiceRadioService } from './voiceRadioService';
import { store } from './store';
import { aiKnowledgeService, getDefaultOpenRouterApiKey } from './aiKnowledgeService';

export type VoiceCapsuleType = 'spam_warning' | 'morning_relance' | 'motivation_shift' | 'level_congrats' | 'custom';
export type VoiceEngineType = 'google_fr' | 'gemini';

export interface CandidateVoiceContext {
  memberId?: string;
  username?: string;
  currentModuleId?: string;
  currentModuleTitle?: string;
  candidateState?: string;
  validatedModulesCount?: number;
  totalModulesCount?: number;
  isBlockedByQuizFailures?: boolean;
  blockedQuizTitle?: string;
  simulationScheduledAt?: string;
  daysActive?: number;
}

export interface VoiceCapsuleConfig {
  type: VoiceCapsuleType;
  customText?: string;
  targetName?: string;
  candidateContext?: CandidateVoiceContext;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'French_Natural';
  engine?: VoiceEngineType;
  channelId?: string;
  broadcastToVoice?: boolean;
}

export interface GeneratedVoiceCapsule {
  id: string;
  type: VoiceCapsuleType;
  title: string;
  script: string;
  voiceName: string;
  audioBuffer: Buffer;
  mimeType: string;
  durationEstimateSeconds: number;
  timestamp: string;
  candidateContext?: CandidateVoiceContext;
}

/**
 * Fetches high-quality natural French speech MP3 audio from the Google TTS engine
 * Splits text into natural sentence fragments to prevent length cutoff
 */
async function fetchGoogleSpeechMp3(text: string, lang = 'fr'): Promise<Buffer> {
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  const words = clean.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).trim().length > 160) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = (currentChunk + ' ' + word).trim();
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  if (chunks.length === 0) chunks.push(clean || 'Bonjour');

  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const buf = await new Promise<Buffer>((resolve, reject) => {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`TTS Service HTTP ${res.statusCode}`));
          }
          const data: Buffer[] = [];
          res.on('data', (d) => data.push(d));
          res.on('end', () => resolve(Buffer.concat(data)));
        }
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('TTS timeout'));
      });
    });
    buffers.push(buf);
  }

  return Buffer.concat(buffers);
}

/**
 * Wraps raw 16-bit Mono PCM buffer (24000Hz) into a valid RIFF/WAVE file container.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  if (pcmBuffer.length >= 4 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Generates a clean synthetic WAV melodic chime tone as an emergency fallback
 */
function generateSyntheticAlertWav(durationSeconds = 2.5, frequency = 440, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const pcm = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-3 * t);
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5 +
                   Math.sin(2 * Math.PI * (frequency * 1.5) * t) * envelope * 0.25;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    pcm.writeInt16LE(intSample, i * 2);
  }

  return pcmToWav(pcm, sampleRate);
}

class AiVoiceAnnouncerService {
  private autoSpamVoiceEnabled = true;
  private morningRelanceVoiceEnabled = true;
  private engine: VoiceEngineType = 'google_fr'; // Default to ultra-reliable natural French voice
  private preferredVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'French_Natural' = 'French_Natural';

  // Anti-spam tracker (userId -> Array of timestamps)
  private userMessageHistory = new Map<string, { timestamps: number[]; lastContent: string }>();

  // Cooldown tracker to prevent spamming audio warnings
  private spamWarningCooldowns = new Map<string, number>();

  public getSettings() {
    return {
      autoSpamVoiceEnabled: this.autoSpamVoiceEnabled,
      morningRelanceVoiceEnabled: this.morningRelanceVoiceEnabled,
      engine: this.engine,
      preferredVoice: this.preferredVoice,
    };
  }

  public updateSettings(settings: {
    autoSpamVoiceEnabled?: boolean;
    morningRelanceVoiceEnabled?: boolean;
    engine?: VoiceEngineType;
    preferredVoice?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'French_Natural';
  }) {
    if (settings.autoSpamVoiceEnabled !== undefined) this.autoSpamVoiceEnabled = settings.autoSpamVoiceEnabled;
    if (settings.morningRelanceVoiceEnabled !== undefined) this.morningRelanceVoiceEnabled = settings.morningRelanceVoiceEnabled;
    if (settings.engine) this.engine = settings.engine;
    if (settings.preferredVoice) this.preferredVoice = settings.preferredVoice;
  }

  /**
   * Generates natural French speech scripts based on action type
   */
  /**
   * Generates natural French speech scripts based on action type and candidate context
   */
  public getPresetScript(type: VoiceCapsuleType, targetName?: string, candidateContext?: CandidateVoiceContext): { title: string; script: string; defaultVoice: any } {
    const name = targetName || candidateContext?.username || 'candidat';
    switch (type) {
      case 'spam_warning':
        return {
          title: '🚨 Alerte Modération Vocale — Anti-Spam',
          script: `Alerte modération Pawako ! Le flood et l'envoi de messages répétés sont strictement interdits. Merci de respecter la tranquillité du salon et d'attendre les réponses.`,
          defaultVoice: 'Fenrir',
        };
      case 'morning_relance': {
        const modTitle = candidateContext?.currentModuleTitle ? ` — ${candidateContext.currentModuleTitle}` : '';
        return {
          title: `☀️ Relance Matinale Coach Pawako${modTitle}`,
          script: this.getContextualFallbackScript(type, name, candidateContext),
          defaultVoice: 'French_Natural',
        };
      }
      case 'motivation_shift':
        return {
          title: '⚡ Capsule Énergie & Motivation Chatting',
          script: `Flash motivation Pawako ! Les équipes au top gardent une cadence constante et des messages soignés. Appliquez les bonnes méthodes, soyez réactifs et dépassez vos objectifs aujourd'hui !`,
          defaultVoice: 'French_Natural',
        };
      case 'level_congrats':
        return {
          title: '🏆 Félicitations Palier & Badge Obtenu',
          script: `Bravo ${name} pour ton nouveau palier franchi ! Tes efforts et ton sérieux portent leurs fruits. Continue sur cette excellente lancée !`,
          defaultVoice: 'French_Natural',
        };
      case 'custom':
      default:
        return {
          title: '🎙️ Message Vocal Officiel Pawako',
          script: `Message d'annonce officiel de l'équipe Pawako. Restez à l'écoute des prochaines consignes.`,
          defaultVoice: this.preferredVoice,
        };
    }
  }

  /**
   * Multi-variation contextual fallback pool with deterministic daily rotation.
   * Guarantees that the candidate hears a DIFFERENT phrase every day of the week,
   * specifically adapted to their current module and exact progression stage.
   */
  public getContextualFallbackScript(
    type: VoiceCapsuleType,
    targetName?: string,
    context?: CandidateVoiceContext
  ): string {
    const name = targetName || context?.username || 'candidat';

    // 1. Calculate deterministic Day-of-Year and candidate seed hash
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const candidateSeed = (context?.memberId || name || 'pawako').toLowerCase();
    let hash = 0;
    for (let i = 0; i < candidateSeed.length; i++) {
      hash = ((hash << 5) - hash) + candidateSeed.charCodeAt(i);
      hash |= 0;
    }
    const daySeed = Math.abs(dayOfYear + hash);

    if (type !== 'morning_relance') {
      const nonMorningPools: Record<string, string[]> = {
        spam_warning: [
          `Alerte modération Pawako ! Merci de ne pas inonder le salon de messages répétés et de patienter tranquillement.`,
          `Attention modération. Merci d'éviter les envois successifs et de respecter le calme du salon.`,
          `Rappel de modération Pawako. Les messages multiples à la suite sont proscrits, merci d'attendre la réponse du staff.`,
        ],
        motivation_shift: [
          `Flash motivation Pawako ! Les meilleurs chatteurs gardent une cadence soutenue et soignée. Soyez réactifs et dépassez vos objectifs !`,
          `Énergie au maximum pour l'équipe Pawako ! Appliquez les techniques du guide et faites la différence aujourd'hui !`,
          `Focus et rigueur pour tous les chatteurs ! Chaque échange compte, personnalisez vos approches et montez en puissance !`,
          `La régularité bat le talent ! Restez constants, soignez votre orthographe et gardez le lead sur vos conversations !`,
        ],
        level_congrats: [
          `Bravo ${name} pour ton nouveau palier franchi ! Tes efforts et ton sérieux portent leurs fruits, continue comme ça !`,
          `Félicitations ${name} ! Ce niveau validé confirme ta progression. Fonce vers la prochaine étape !`,
          `Super travail ${name} ! Tu passes au palier supérieur avec brio. Reste concentré pour la suite de ton aventure !`,
        ],
        custom: [
          `Message d'annonce officiel de la formation Pawako. Restez concentrés et attentifs aux prochaines consignes.`,
        ],
      };
      const p = nonMorningPools[type] || nonMorningPools.custom;
      return p[daySeed % p.length];
    }

    // 2. Morning Relance: Route according to candidate's exact module and state

    // A) Blocked by 3 quiz failures
    if (context?.isBlockedByQuizFailures) {
      const blockedPool = [
        `Salut ${name}, c'est ton coach vocal. Un échec au quiz est juste une étape d'ajustement. Revois tes fiches clés et fais signe au Staff pour retenter avec succès !`,
        `Hello ${name} ! Pas d'inquiétude sur ton dernier quiz, la persévérance forge les meilleurs profils. Relis calmement le cours et demande ton déblocage dès que tu es prêt.`,
        `Bonjour ${name} ! Garde confiance. Les erreurs au quiz permettent d'ancrer les bons réflexes de chatting. Revois tes fiches et sollicite le Staff pour débloquer ton test.`,
        `Salut ${name} ! Prends quelques minutes aujourd'hui pour réviser les notions qui ont posé souci. Montre ta détermination au Staff et valide ton module !`,
      ];
      return blockedPool[daySeed % blockedPool.length];
    }

    // B) Simulation Stage
    const isSimu = context?.candidateState === 'simulation' || ((context?.validatedModulesCount || 0) >= (context?.totalModulesCount || 5) && (context?.totalModulesCount || 0) > 0);
    if (isSimu) {
      if (context?.simulationScheduledAt) {
        const sched = context.simulationScheduledAt;
        const simuScheduledPool = [
          `Rappel important ${name} : ton rendez-vous de simulation est programmé pour ${sched}. Sois connecté en avance, concentré et prêt à briller en direct !`,
          `Bonjour ${name} ! Dernière ligne droite avant ton test de simulation prévu ${sched}. Respire, relis les consignes de chatting et donne le meilleur de toi-même !`,
          `Salut ${name} ! N'oublie pas ton rendez-vous de simulation ${sched}. Sois ponctuel, réactif sur tes réponses et applique les techniques de vente avec assurance.`,
          `Hello ${name} ! Ton créneau de simulation est confirmé pour ${sched}. Prépare tes arguments, ta concentration et montre au coach ton niveau !`,
        ];
        return simuScheduledPool[daySeed % simuScheduledPool.length];
      } else {
        const simuGeneralPool = [
          `Félicitations pour tes modules ${name} ! Tu es désormais aux portes de la simulation. Reste naturel, réactif et applique les techniques de closing !`,
          `Salut ${name} ! C'est le moment de vérité avec la simulation pratique. Mets-toi dans la peau d'un chatteur d'élite, sois rapide et crée du lien avec le fan.`,
          `Bonjour ${name} ! Tous tes cours théoriques sont validés. Prépare-toi mentalement pour la simulation : gestion de la pression, relances vives et empathie !`,
          `Hello ${name} ! Prêt pour la simulation ? Reste calme, réponds avec précision et applique la méthode Pawako. On a hâte de voir tes performances !`,
          `Salut ${name} ! La simulation approche. Revois tes techniques de teasing et de relance, c'est l'occasion idéale de prouver ta valeur à l'équipe !`,
        ];
        return simuGeneralPool[daySeed % simuGeneralPool.length];
      }
    }

    // C) Tools / Outils Stage
    if (context?.candidateState === 'formation_outils' || context?.candidateState === 'outils') {
      const toolsPool = [
        `Bravo pour ta simulation validée ${name} ! Concentre-toi maintenant sur la prise en main des outils et logiciels de l'agence. La rigueur technique fait la différence !`,
        `Salut ${name} ! Tu es sur l'étape finale des outils professionnels. Maîtrise les fonctionnalités clés pour être opérationnel dès tes premières sessions.`,
        `Bonjour ${name} ! L'apprentissage des outils de l'agence est primordial pour ta productivité. Prends le temps de tout explorer et valide cette ultime étape !`,
        `Hello ${name} ! Dernière ligne droite sur la formation outils. Sois attentif aux consignes pour intégrer rapidement nos plannings de shift !`,
      ];
      return toolsPool[daySeed % toolsPool.length];
    }

    // D) Per Module Specific Pools
    const mId = (context?.currentModuleId || '').toLowerCase();
    const mTitle = (context?.currentModuleTitle || '').toLowerCase();

    // Module 1 : Mindset & Bases
    if (mId.includes('1') || mTitle.includes('mindset') || mTitle.includes('base')) {
      const mod1Pool = [
        `Bonjour ${name} ! Le Module 1 pose les fondations de ton succès : ponctualité, constance et rigueur. Prends un quart d'heure ce matin et valide ton premier quiz !`,
        `Salut ${name} ! En chatting, la régularité bat le talent dès le premier jour. Termine le cours sur les bases et débloque le quiz pour avancer !`,
        `Hello ${name} ! Une nouvelle journée pour poser de solides bases. Imprègne-toi des règles professionnelles du Module 1 et fonce valider ton test !`,
        `Bonjour ${name} ! C'est ton coach vocal. Chaque minute passée sur les bases renforce ton niveau futur. Avance sur ton premier module aujourd'hui !`,
        `Salut ${name} ! Première étape cruciale : assimiler l'état d'esprit des chatteurs d'élite. Concentre-toi sur le Module 1 et valide ton score ce matin !`,
      ];
      return mod1Pool[daySeed % mod1Pool.length];
    }

    // Module 2 : Psychologie du Fan & Storytelling
    if (mId.includes('2') || mTitle.includes('psycho') || mTitle.includes('story') || mTitle.includes('fan')) {
      const mod2Pool = [
        `Hello ${name} ! En plein Module 2 ? Rappelle-toi qu'un fan recherche avant tout une connexion émotionnelle sincère. Maîtrise le storytelling et valide ton quiz !`,
        `Salut ${name} ! Ton coach Pawako à l'écoute. La personnalisation des messages est la clé secrète du Module 2. Replonge dans tes fiches et réussis ton quiz aujourd'hui !`,
        `Bonjour ${name} ! Apprends à écouter et cerner les attentes de ton interlocuteur. Le Module 2 t'ouvre les secrets de la fidélisation. Bonne session !`,
        `Hello ${name} ! Crée du lien, captive ton fan avec des histoires immersives. Travaille ton Module 2 ce matin et passe ton quiz avec brio !`,
        `Salut ${name} ! L'immersion émotionnelle transforme un simple échange en relation durable. Concentre-toi sur le Module 2 et fais la différence !`,
      ];
      return mod2Pool[daySeed % mod2Pool.length];
    }

    // Module 3 : Techniques de Vente & Pricing PPV
    if (mId.includes('3') || mTitle.includes('vente') || mTitle.includes('pricing') || mTitle.includes('ppv')) {
      const mod3Pool = [
        `Flash coaching ${name} ! Le Module 3 est le moteur de tes revenus : le pricing des médias et l'art du teasing. Ne brade jamais la valeur et valide ton quiz !`,
        `Bonjour ${name} ! Un bon chatteur n'attend pas que le fan réclame : il crée le désir. Revois les étapes de vente du Module 3 et passe à l'action !`,
        `Salut ${name} ! Valorise chaque média, dose ton teasing et applique les paliers de prix. Le Module 3 demande de l'audace, valide-le aujourd'hui !`,
        `Hello ${name} ! La vente en chatting est un art subtil. Concentre-toi sur les mécanismes de monétisation du Module 3 et valide ton quiz ce matin !`,
        `Bonjour ${name} ! Prépare-toi à devenir un closer d'élite. Termine tes révisions sur le Module 3 et montre ta maîtrise au quiz !`,
      ];
      return mod3Pool[daySeed % mod3Pool.length];
    }

    // Module 4 : Objections & Rétention
    if (mId.includes('4') || mTitle.includes('objection') || mTitle.includes('rétention') || mTitle.includes('retention')) {
      const mod4Pool = [
        `Bonjour ${name} ! Une objection n'est pas un refus définitif, mais une demande d'attention. Maîtrise les techniques du Module 4 et valide ton test !`,
        `Salut ${name} ! Savoir désamorcer les doutes avec empathie transforme les hésitants en fans fidèles. Concentre-toi sur le Module 4 aujourd'hui !`,
        `Hello ${name} ! Garde toujours ton calme face aux objections. La patience et les bonnes relances paient toujours. Valide ton quiz du Module 4 !`,
        `Flash coaching ${name} ! Rebondis avec élégance sur chaque frein du fan. Le Module 4 est ton bouclier de closing, valide-le sans attendre !`,
        `Salut ${name} ! Ne prends jamais une objection personnellement. Applique la formule Pawako et sécurise ta progression sur le Module 4 !`,
      ];
      return mod4Pool[daySeed % mod4Pool.length];
    }

    // Module 5 : Routine & Outils
    if (mId.includes('5') || mTitle.includes('routine') || mTitle.includes('pro')) {
      const mod5Pool = [
        `Bonjour ${name} ! Le Module 5 t'apprend l'organisation des pros : rapidité de frappe, réactivité et hygiène de travail. Valide-le pour viser la simulation !`,
        `Salut ${name} ! La vitesse et l'attention aux détails font exploser les conversions. Maîtrise ta routine de travail avec le Module 5 et décroche ton quiz !`,
        `Hello ${name} ! Dernier module théorique avant la simulation. Sois méthodique, organise ton espace et valide ton score parfait au Module 5 !`,
        `Bonjour ${name} ! L'excellence est une habitude quotidienne. Assimile les bonnes routines du Module 5 et franchis la porte de la simulation !`,
        `Salut ${name} ! Rigueur, raccourcis et organisation : voilà les armes du Module 5. Termine tes cours ce matin et lance ton quiz !`,
      ];
      return mod5Pool[daySeed % mod5Pool.length];
    }

    // General / Onboarding Fallback Pool
    const generalPool = [
      `Bonjour ${name} ! C'est ton coach vocal Pawako. Une nouvelle journée commence : consacre du temps à ta formation et fais un pas de plus vers ton objectif !`,
      `Salut ${name} ! La constance et la rigueur battent tous les talents. Connecte-toi sur ton espace et avance sur ton parcours de formation aujourd'hui !`,
      `Hello ${name} ! Chaque module complété te rapproche du statut de chatteur professionnel. Garde le rythme et donne le maximum aujourd'hui !`,
      `Bonjour ${name} ! Réveille ton potentiel, lis attentivement tes cours et viens valider tes acquis sur Discord. Excellente journée à toi !`,
      `Salut ${name} ! C'est ton coach Pawako. L'apprentissage régulier est la seule garantie de réussite. Avance sur ton planning ce matin !`,
    ];
    return generalPool[daySeed % generalPool.length];
  }

  /**
   * Uses OpenRouter API with resilient free-tier models (Llama 3.3, Mistral 7B, Gemini Flash)
   * to dynamically create crisp, punchy, human French coaching speech scripts tailored to candidate context.
   */
  public async generateOpenRouterSpeechScript(
    type: VoiceCapsuleType,
    targetName?: string,
    candidateContext?: CandidateVoiceContext
  ): Promise<string> {
    const name = targetName && targetName.trim() ? targetName.trim() : (candidateContext?.username || 'candidat');
    const cfgKey = aiKnowledgeService.getConfig()?.openRouterApiKey;
    const apiKey = cfgKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

    let contextPrompt = '';
    if (type === 'morning_relance') {
      let stageDetail = '';
      if (candidateContext?.isBlockedByQuizFailures) {
        stageDetail = `Le candidat est temporairement bloqué suite à des échecs au quiz du ${candidateContext.currentModuleTitle || 'module'}. Encourage-le chaleureusement à relire ses fiches de révision et à contacter le Staff pour débloquer sa progression.`;
      } else if (candidateContext?.candidateState === 'simulation' || ((candidateContext?.validatedModulesCount || 0) >= (candidateContext?.totalModulesCount || 5) && (candidateContext?.totalModulesCount || 0) > 0)) {
        if (candidateContext?.simulationScheduledAt) {
          stageDetail = `Le candidat a validé tous ses modules théoriques et a son RDV de simulation programmé (${candidateContext.simulationScheduledAt}). Rappelle-lui d'être ponctuel, concentré et prêt à prouver ses compétences en direct.`;
        } else {
          stageDetail = `Le candidat a terminé tous ses modules de cours ! Il doit maintenant se préparer à la simulation pratique de chatting (relances dynamiques, gestion des fans, closing).`;
        }
      } else if (candidateContext?.candidateState === 'formation_outils' || candidateContext?.candidateState === 'outils') {
        stageDetail = `Le candidat a réussi la simulation et apprend désormais la prise en main des outils professionnels et de la plateforme.`;
      } else if (candidateContext?.currentModuleTitle) {
        stageDetail = `Le candidat étudie actuellement le ${candidateContext.currentModuleTitle}. Donne-lui un conseil clé en 1 phrase percutante sur ce thème et motive-le à valider son quiz du jour pour franchir l'étape suivante.`;
      } else {
        stageDetail = `Le candidat avance dans sa formation de chatting chez Pawako. Encourage-le à garder le rythme, à relancer régulièrement et à valider ses étapes.`;
      }

      contextPrompt = `Tu es le Coach Vocal d'élite de PAWAKO Formation (agence de chatting premium). Rédige une relance vocale matinale percutante, positive et très courte (1 à 2 phrases parlées naturelles, maximum 28 mots) pour le candidat "${name}".
Contexte actuel : ${stageDetail}
Style : Dynamique, professionnel, bienveillant mais axé discipline et passage à l'action.
RÈGLES STRICTES :
- Pas de guillemets, pas de préambule, pas d'émojis, pas de balises markdown.
- Uniquement le texte brut en français direct prêt à être lu par la synthèse vocale.`;
    } else if (type === 'spam_warning') {
      contextPrompt = `Tu es la voix de modération de PAWAKO. Rédige un avertissement audio très court (1 phrase ferme et courtoise, maximum 18 mots) rappelant de ne pas inonder le salon de messages répétés. Pas d'émojis, pas de guillemets.`;
    } else if (type === 'motivation_shift') {
      contextPrompt = `Tu es le coach d'énergie de PAWAKO. Rédige un flash motivationnel audio percutant (2 phrases maximum, 25 mots) pour galvaniser les chatteurs. Pas d'émojis, pas de guillemets.`;
    } else if (type === 'level_congrats') {
      contextPrompt = `Tu es le coach vocal de PAWAKO. Rédige de brèves félicitations chaleureuses (1 à 2 phrases, maximum 20 mots) pour féliciter "${name}" pour avoir franchi un palier. Pas d'émojis, pas de guillemets.`;
    } else {
      contextPrompt = `Tu es le coach vocal officiel de PAWAKO Formation. Rédige une annonce courte et dynamique (2 phrases maximum, 25 mots). Pas d'émojis, pas de guillemets.`;
    }

    const freeModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
    ];

    if (apiKey && apiKey.length > 5) {
      for (const model of freeModels) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://pawako-formation.app',
              'X-Title': 'PAWAKO Formation Voice Coach',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content:
                    'Tu es un générateur de texte pour synthèse vocale française. Tu réponds UNIQUEMENT avec le texte à prononcer à l\'oral, sans aucun préambule, sans astérisques, sans guillemets, et sans émojis.',
                },
                { role: 'user', content: contextPrompt },
              ],
              temperature: 0.88,
              max_tokens: 85,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content?.trim();
            if (content && content.length > 15) {
              return content
                .replace(/^["'«\s]+|["'»\s]+$/g, '')
                .replace(/[*_#`~]/g, '')
                .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
                .trim();
            }
          }
        } catch (err: any) {
          console.warn(`[OpenRouter Voice Script Error for ${model}]`, err?.message || err);
        }
      }
    }

    // Seamless fallback on deterministic rotating contextual bank
    return this.getContextualFallbackScript(type, name, candidateContext);
  }

  /**
   * Generates a voice capsule using OpenRouter AI or the rotating contextual fallback bank,
   * synthesized through the reliable French voice engine with Gemini TTS support & quota fallback.
   */
  public async generateVoiceCapsule(config: VoiceCapsuleConfig): Promise<GeneratedVoiceCapsule> {
    const preset = this.getPresetScript(config.type, config.targetName, config.candidateContext);
    
    // 1. If explicit customText provided, use it directly
    let script = config.customText && config.customText.trim().length > 0
      ? config.customText.trim()
      : null;

    // 2. Otherwise generate dynamically with OpenRouter AI using full candidate context
    if (!script) {
      try {
        script = await this.generateOpenRouterSpeechScript(config.type, config.targetName, config.candidateContext);
      } catch (err) {
        console.warn('[AiVoice] OpenRouter failed, using contextual fallback pool:', err);
      }
    }

    // 3. If OpenRouter returned empty, use contextual fallback pool
    if (!script || script.length < 10) {
      script = this.getContextualFallbackScript(config.type, config.targetName, config.candidateContext);
    }
    const requestedVoice = config.voiceName || preset.defaultVoice || this.preferredVoice;
    const engine = config.engine || this.engine;

    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/mpeg';

    // 1. Try Gemini TTS if specifically selected and API key is present
    if (engine === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        const geminiVoice = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(requestedVoice)
          ? requestedVoice
          : 'Puck';
        console.log(`[AiVoice] Synthèse vocale Gemini TTS via model 'gemini-3.1-flash-tts-preview' (Voix: ${geminiVoice})...`);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: script }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: geminiVoice as any },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const rawBuf = Buffer.from(base64Audio, 'base64');
          audioBuffer = pcmToWav(rawBuf, 24000);
          mimeType = 'audio/wav';
          console.log(`[AiVoice] Gemini TTS généré avec succès (${audioBuffer.length} bytes).`);
        }
      } catch (err: any) {
        console.warn('[AiVoice Gemini TTS quota/erreur, basculement automatique sur la Voix Française Naturelle]', err?.message || err);
      }
    }

    // 2. High-Quality Natural French Neural TTS (Zero quota, speaks actual French, instant & reliable)
    if (!audioBuffer) {
      try {
        console.log(`[AiVoice] Synthèse vocale Voix Française Naturelle pour: "${script.substring(0, 45)}..."`);
        audioBuffer = await fetchGoogleSpeechMp3(script, 'fr');
        mimeType = 'audio/mpeg';
        console.log(`[AiVoice] Voix Française générée avec succès (${audioBuffer.length} bytes).`);
      } catch (err: any) {
        console.warn('[AiVoice French Voice error]', err?.message || err);
      }
    }

    // 3. Fallback tone only if everything failed (network completely disconnected)
    if (!audioBuffer) {
      console.log('[AiVoice] Utilisation du carillon de secours.');
      const frequency = config.type === 'spam_warning' ? 320 : 520;
      audioBuffer = generateSyntheticAlertWav(3.0, frequency, 24000);
      mimeType = 'audio/wav';
    }

    // Estimate duration based on French speech rate (~15 characters per second)
    const durationEstimateSeconds = Math.max(2, Math.round(script.length / 14));

    return {
      id: `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: config.type,
      title: preset.title,
      script,
      voiceName: requestedVoice,
      audioBuffer,
      mimeType,
      durationEstimateSeconds,
      timestamp: new Date().toISOString(),
      candidateContext: config.candidateContext,
    };
  }

  /**
   * Broadcasts the audio capsule to a voice channel (e.g. Radio Focus)
   */
  public async broadcastToVoiceChannel(guildId: string, audioBuffer: Buffer): Promise<boolean> {
    return await voiceRadioService.playAnnouncement(guildId, audioBuffer);
  }

  /**
   * Posts the audio capsule cleanly to Discord as an executive, sleek voice note
   * Absolutely NO cluttered tables or technical specs (no "Voix IA", no "Durée Estimée", no "Format WAV")
   */
  public async sendToTextChannel(
    channel: TextChannel,
    capsule: GeneratedVoiceCapsule,
    authorName: string = 'Coach Vocal Pawako'
  ): Promise<boolean> {
    try {
      const ext = capsule.mimeType.includes('wav') ? 'wav' : 'mp3';
      const attachment = new AttachmentBuilder(capsule.audioBuffer, {
        name: `note-vocale-pawako.${ext}`,
        description: capsule.script,
      });

      // Sleek, executive, and highly presentable Discord Embed
      let title = '🎙️ Note Vocale du Coach';
      let color = 0x6366f1; // Indigo Pawako
      if (capsule.type === 'spam_warning') {
        title = '🚨 Rappel Modération Vocale';
        color = 0xef4444; // Red
      } else if (capsule.type === 'morning_relance') {
        const modTitle = capsule.candidateContext?.currentModuleTitle ? ` — ${capsule.candidateContext.currentModuleTitle}` : '';
        title = `☀️ Relance Matinale — Coach Pawako${modTitle}`;
        color = 0xf59e0b; // Amber
      } else if (capsule.type === 'motivation_shift') {
        title = '⚡ Flash Énergie & Motivation';
        color = 0x8b5cf6; // Purple
      } else if (capsule.type === 'level_congrats') {
        title = '🏆 Félicitations Palier';
        color = 0x10b981; // Emerald
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({
          name: 'PAWAKO FORMATION • Coach Vocal',
          iconURL: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        })
        .setTitle(title)
        .setDescription(`> *« ${capsule.script} »*`)
        .setFooter({ text: '🎧 Écoutez la note vocale ci-jointe' })
        .setTimestamp();

      await channel.send({
        embeds: [embed],
        files: [attachment],
      });

      store.addLog(
        'Animateur Vocal IA',
        `Message vocal envoyé dans #${channel.name}`,
        'system',
        'info'
      );

      return true;
    } catch (err: any) {
      console.error('[AiVoice sendToTextChannel Error]', err);
      return false;
    }
  }

  /**
   * Real-time anti-spam detector hook for Discord onMessageCreate
   */
  public async checkAndHandleMessageSpam(message: Message): Promise<boolean> {
    if (!this.autoSpamVoiceEnabled) return false;
    if (message.author.bot) return false;
    if (!message.channel.isTextBased() || !('send' in message.channel)) return false;

    const userId = message.author.id;
    const now = Date.now();

    // Check cooldown per user (don't alert more than once every 45s per user)
    const lastAlert = this.spamWarningCooldowns.get(userId) || 0;
    if (now - lastAlert < 45_000) {
      return false;
    }

    const history = this.userMessageHistory.get(userId) || { timestamps: [], lastContent: '' };
    // Keep timestamps from the last 6 seconds
    const recent = history.timestamps.filter((t) => now - t < 6_000);
    recent.push(now);

    const isRepeatedText = history.lastContent === message.content.trim() && message.content.trim().length > 3;
    const isRapidBurst = recent.length >= 5;

    this.userMessageHistory.set(userId, {
      timestamps: recent,
      lastContent: message.content.trim(),
    });

    if (isRapidBurst || (isRepeatedText && recent.length >= 3)) {
      this.spamWarningCooldowns.set(userId, now);
      console.log(`[AntiSpam Voice] Spam détecté pour @${message.author.username} dans #${(message.channel as any).name || message.channelId}`);

      try {
        const capsule = await this.generateVoiceCapsule({
          type: 'spam_warning',
          voiceName: 'Fenrir',
          targetName: message.author.username,
        });

        await this.sendToTextChannel(
          message.channel as TextChannel,
          capsule,
          'Système Modération Pawako'
        );

        // Also broadcast to vocal if radio is streaming in guild
        if (message.guild?.id) {
          this.broadcastToVoiceChannel(message.guild.id, capsule.audioBuffer).catch(() => {});
        }

        store.addLog(
          'Modération Anti-Spam',
          `Message vocal anti-spam déclenché contre @${message.author.username} suite à un flood dans #${(message.channel as any).name || ''}`,
          'system',
          'warning',
          message.author.username
        );

        return true;
      } catch (err) {
        console.warn('[AntiSpam Voice Trigger Error]', err);
      }
    }

    return false;
  }
}

export const aiVoiceAnnouncerService = new AiVoiceAnnouncerService();

