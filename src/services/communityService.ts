import { Member, TrainingModule } from '../types';
import { store } from './store';
import { aiKnowledgeService, getDefaultOpenRouterApiKey } from './aiKnowledgeService';
import { GoogleGenAI } from '@google/genai';

// Shared Gemini instance server-side as backup
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Executes AI calls primarily via OpenRouter API with preset/configured model or openrouter/auto.
 * Falls back to Gemini if OpenRouter is unreachable.
 */
async function callOpenRouterOrGemini(
  systemPrompt: string,
  userPrompt: string,
  isJson: boolean = false
): Promise<string | null> {
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

  // 1. Primary: OpenRouter API
  if (apiKey && apiKey.length > 5) {
    const primaryModel = cfg.modelName || 'openrouter/auto';
    const modelsToTry = [primaryModel];
    if (primaryModel !== 'openrouter/auto') {
      modelsToTry.push('openrouter/auto');
    }

    for (const modelId of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pawako-formation.app',
            'X-Title': 'PAWAKO Super CM',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1500,
            ...(isJson ? { response_format: { type: 'json_object' } } : {}),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim().length > 0) {
            return content.trim();
          }
        } else {
          const errText = await response.text();
          console.warn(`[OpenRouter CM Warning] (${response.status}) pour ${modelId}:`, errText);
        }
      } catch (err: any) {
        console.warn(`[OpenRouter CM Fetch Error] pour ${modelId}:`, err?.message || err);
      }
    }
  }

  // 2. Secondary Fallback: Gemini API
  const ai = getAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`,
        ...(isJson ? { config: { responseMimeType: 'application/json' } } : {}),
      });
      if (response.text) return response.text.trim();
    } catch (err) {
      console.warn('[Gemini CM Fallback Error]:', err);
    }
  }

  return null;
}

export interface MiniGameChallenge {
  id: string;
  title: string;
  scenario: string;
  options: { label: string; isCorrect: boolean; explanation: string }[];
}

export const CURATED_PLAYLISTS = [
  {
    title: '🎵 Lo-Fi Beats pour Charbonner',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXdLENR312A3i',
    description: 'Concentration maximale et chill pour passer tes modules et chatter au calme.',
    quote: '⚡ "La régularité bat le talent quand le talent ne charbonne pas." - Coach Pawako',
  },
  {
    title: '🔥 Hip-Hop & Deep Focus Energy',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX10zPhA1A2S6',
    description: 'Grosse énergie pour cartonner tes ventes PPV et garder le rythme !',
    quote: '🚀 "Chaque message envoyé avec intention est un pas de plus vers ton objectif." - Pawako CM',
  },
  {
    title: '🎧 Chillout & Deep Work Synthwave',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXdLENR312A3i',
    description: 'Mode sous-marin activé pour enchaîner tes formations sans distraction.',
    quote: '💡 "Un bon chatter écoute, qualifie et clôture avec élégance." - Pawako CM',
  },
];

export const FRENCH_CHATTING_TIPS = [
  {
    rule: '⚠️ "Ça" vs "Sa"',
    bad: 'Sa va ? sa me fait plaisir !',
    good: 'Ça va ? Ça me fait plaisir !',
    tip: 'Remplace par "cela" : si "cela va" fonctionne, on écrit **Ça** (avec une cédille). "Sa" est un possessif (sa voiture).',
  },
  {
    rule: '⚠️ "Je serai" (Futur) vs "Je serais" (Conditionnel)',
    bad: 'Demain je serais disponible pour toi bb',
    good: 'Demain je serai disponible pour toi bb',
    tip: 'Pour une certitude future ("demain"), utilise le futur **-ai**. Le **-ais** exprime un doute ou un souhait ("si j\'avais le temps, je serais...").',
  },
  {
    rule: '⚠️ Majuscules & Punctuation en Chatting',
    bad: 'Cc sava oui trop bien nikel',
    good: 'Coucou ! Ça va super et toi ? Trop hâte de te montrer ça 😏',
    tip: 'Les abréviations SMS ("cc", "sava", "nikel") dévalorisent le média. Sois chaleureux, fluide et utilise des emojis avec goût !',
  },
];

export const CHATTING_HACKS = [
  {
    title: '💡 Le Teasing par la Qualification (Méthode Pawako)',
    content:
      'Ne vends jamais un PPV directement en balançant "J\'ai une vidéo à 30$". Demande d\'abord ce qu\'il aime, ses fantasmes ou sa tenue préférée. Une fois qu\'il a décrit son désir, montre-lui que ton contenu correspond EXACTEMENT à sa demande !',
  },
  {
    title: '💡 La Règle des 3 Questions d\'Or',
    content:
      'Avant de parler de prix, connais toujours : 1) Son Prénom, 2) Sa Ville/Pays, 3) Ce qu\'il fait dans la vie. Plus tu connais le fan, plus il a l\'impression de discuter avec une vraie personne unique.',
  },
  {
    title: '💡 Le Pouvoir des Audio-Notes',
    content:
      'Un message vocal personnalisé de 5 secondes vaut 100 messages textes. Quand un fan hésite, envoie un petit audio chuchoté ou rieur pour briser la glace !',
  },
];

function getCmSystemPromptContext(): string {
  const cfg = aiKnowledgeService.getPromptConfig();
  const cm = cfg.cmConfig;

  let toneDesc = 'dynamique, motivant et bienveillant';
  if (cm?.tone === 'bienveillant') toneDesc = 'très chaleureux, encourageant, pédagoge et à l\'écoute';
  if (cm?.tone === 'strict_performance') toneDesc = 'exigeant, axé sur les métriques de vente, la discipline et la performance';
  if (cm?.tone === 'cool') toneDesc = 'décontracté, fun, amical, style membre de la communauté';
  if (cm?.tone === 'grand_frere') toneDesc = 'grand frère bienveillant, inspirant, protecteur et motivant';

  let customInst = cm?.customCmInstructions || '';
  let linksDesc = '';
  if (cm?.resourceLinks && cm.resourceLinks.length > 0) {
    linksDesc = `Ressources utiles de la communauté :\n` + cm.resourceLinks.map((l) => `- ${l.label} : ${l.url}`).join('\n');
  }

  return `Tu es Alex, le Super CM & Coach Pawako sur Discord (animé via OpenRouter AI).
- Ton de communication exigé : ${toneDesc}.
- Directives spécifiques de l'agence : ${customInst}
${linksDesc ? `\n- ${linksDesc}` : ''}
Tu opères de façon 100% autonome sur Discord, indépendamment des modules de simulation de formation.`;
}

class CommunityService {
  /**
   * Generates or picks a daily chatting tip/hack via OpenRouter AI.
   */
  public async getDailyTip(): Promise<{ title: string; content: string }> {
    const cfg = aiKnowledgeService.getPromptConfig();
    if (cfg.cmConfig?.enableDailyTips === false) {
      return {
        title: '💡 Astuce du Jour Pawako',
        content: 'Les astuces quotidiennes sont actuellement en pause par l\'administration.',
      };
    }

    const text = await callOpenRouterOrGemini(
      getCmSystemPromptContext(),
      'Génère 1 astuce de chatting OnlyFans / Vente par message extrêmement percutante, courte (3-4 phrases max), motivante, drôle et ultra-pro pour des chatter professionnels Pawako. Titre explicite avec emoji.'
    );

    if (text) {
      const lines = text.trim().split('\n');
      const title = lines[0].replace(/^#+\s*/, '') || '💡 Astuce du Jour Pawako';
      const content = lines.slice(1).join('\n').trim() || text;
      return { title, content };
    }

    const randomIndex = Math.floor(Math.random() * CHATTING_HACKS.length);
    return CHATTING_HACKS[randomIndex];
  }

  /**
   * Corrects orthography and reformulates a chatting message via OpenRouter AI.
   */
  public async correctAndEnhanceMessage(rawInput: string): Promise<{
    corrected: string;
    enhanced: string;
    explanation: string;
  }> {
    const systemPrompt = `Tu es le Coach Français & Expert Chatting OnlyFans chez Pawako Formation.`;
    const userPrompt = `Analyse ce message de chatter : "${rawInput}"

1. Corrige l'orthographe, la grammaire et la ponctuation.
2. Propose une reformulation sexy, fluide, vendeuse et naturelle (style modèle/créatrice OnlyFans, chaleureuse, sans fautes, avec emojis bien placés).
3. Donne un conseil rapide de 1-2 phrases sur l'amélioration.

Réponds strict sous ce format JSON :
{
  "corrected": "version sans fautes",
  "enhanced": "version optimisée vendeuse & sexy",
  "explanation": "explication courte"
}`;

    const text = await callOpenRouterOrGemini(systemPrompt, userPrompt, true);
    if (text) {
      try {
        const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          corrected: parsed.corrected || rawInput,
          enhanced: parsed.enhanced || rawInput,
          explanation: parsed.explanation || 'Orthographe et ton optimisés !',
        };
      } catch (err) {
        console.warn('OpenRouter correction JSON parse error:', err);
      }
    }

    // Basic fallback
    return {
      corrected: rawInput,
      enhanced: rawInput,
      explanation: 'Pense à bien vérifier la ponctuation et à ajouter une touche de taquinerie !',
    };
  }

  /**
   * Answers a candidate's general question about Pawako via OpenRouter AI.
   */
  public async answerCommunityQA(question: string, memberUsername?: string): Promise<string> {
    const cfg = aiKnowledgeService.getPromptConfig();
    if (cfg.cmConfig?.enableAutoQA === false) {
      return `Salut ! 👋 Le service de réponses automatiques du CM est actuellement désactivé. Merci de contacter le Staff Pawako !`;
    }

    const systemPrompt = `${getCmSystemPromptContext()}\nTu réponds aux candidats dans les salons de communauté Discord (HORS SIMULATION).
        
Règles :
- Domaine : Formation Pawako, chatting OnlyFans, modules, quiz, astuces de vente, règles de l'agence, organisation, outils (InFlow, Telegram).
- Sois clair, concis (maximum 2-3 paragraphes), utilise des emojis.
- Si le candidat pose une question sur un module ou un quiz, guide-le sans lui donner directement les réponses des quiz.`;

    const userPrompt = `Question du candidat (${memberUsername || 'Candidat'}) : "${question}"`;

    const text = await callOpenRouterOrGemini(systemPrompt, userPrompt);
    if (text) {
      return text.trim();
    }

    return `Salut ! 👋 Je suis Alex, ton Coach CM Pawako. Pour toutes tes questions sur les modules, utilise la commande \`!formation\` ou demande directement au staff ! On est là pour t'aider à réussir. 🚀`;
  }

  /**
   * Generates a fully AI-crafted personalized follow-up message via OpenRouter.
   */
  public async generatePersonalizedFollowup(
    member: Member,
    modules: TrainingModule[]
  ): Promise<string> {
    const cfg = aiKnowledgeService.getPromptConfig();
    if (cfg.cmConfig?.enableCandidateFollowups === false) {
      return `Hey <@${member.discordId || member.id}> ! N'hésite pas à taper \`!formation\` pour continuer ton parcours ! 🚀`;
    }

    const totalModules = modules.length || 5;
    const validatedCount = Object.values(member.progress || {}).filter(
      (p) => p.status === 'valide'
    ).length;

    const nextUnvalidated = modules.find(
      (mod) => member.progress?.[mod.id]?.status !== 'valide'
    );
    const nextTitle = nextUnvalidated ? nextUnvalidated.title : `Module ${validatedCount + 1}`;

    const systemPrompt = getCmSystemPromptContext();
    const userPrompt = `Rédige un message de relance/motivation hyper personnalisé pour un candidat sur Discord.

Informations du candidat :
- Nom : ${member.username || 'Candidat'}
- Mention Discord : <@${member.discordId || member.id}>
- Modules validés : ${validatedCount} / ${totalModules}
- Statut actuel : ${member.candidateState || 'nouveau'}
- Prochain module à passer : ${nextTitle}
- Badges débloqués : ${member.badges?.length || 0}

Règles de rédaction :
- Format : Markdown Discord lisible avec emojis, structuré et court (max 120-150 mots).
- Objectif : Inciter gentiment le candidat à lancer son prochain module avec la commande !formation sans lui mettre de mauvaise pression.
- N'invente pas de faux liens, indique d'utiliser la commande !formation.`;

    const text = await callOpenRouterOrGemini(systemPrompt, userPrompt);
    if (text) {
      return text.trim();
    }

    // Fallback template
    if (member.candidateState === 'formation_terminee' || validatedCount >= totalModules) {
      return (
        `🎓 **Félicitations <@${member.discordId || member.id}> !**\n` +
        `Tu as validé l'intégralité de tes modules de formation théorique. 🏆\n` +
        `Prépare-toi pour ton intégration finale ou sollicite le staff en cas de question !`
      );
    }

    return (
      `🔥 **Hey <@${member.discordId || member.id}> !**\n` +
      `Tu as déjà validé **${validatedCount} sur ${totalModules}** modules ! Bravo pour ton rythme. 👏\n` +
      `🎯 **Prochaine étape :** *${nextTitle}*\n` +
      `💡 Tape \`!formation\` pour continuer ton parcours et débloquer tes prochains badges ! 🚀`
    );
  }

  /**
   * Generates a complete, 100% OpenRouter AI-generated daily community post JSON.
   */
  public async generateDailyCommunityContent(): Promise<{
    tipTitle: string;
    tipContent: string;
    frenchRule: string;
    frenchBad: string;
    frenchGood: string;
    frenchTip: string;
    musicTitle: string;
    musicUrl: string;
    musicDesc: string;
    musicQuote: string;
    miniGame: MiniGameChallenge;
  }> {
    const systemPrompt = getCmSystemPromptContext();
    const userPrompt = `Génère le contenu complet d'animation communautaire du jour pour le serveur Discord.

Inclus :
1. Une astuce de chatting OnlyFans / Vente par message inédite, percutante et concrète (méthode de qualification, teasing, relance, bouclier tarifaire, etc.).
2. Une règle d'orthographe ou de style indispensable en chatting (ex: ça/sa, c'est/s'est, majuscules, ton chaleureux).
3. Une recommandation musicale motivante (titre de playlist, ambiance, citation de coach).
4. Un mini-jeu / challenge de mise en situation avec scenario et 3 options (A, B, C) dont une seule est la réponse parfaite selon les méthodes Pawako.

Réponds strict sous ce format JSON :
{
  "tipTitle": "💡 Titre de l'astuce avec emoji",
  "tipContent": "Description claire et motivante...",
  "frenchRule": "⚠️ Nom de la règle",
  "frenchBad": "Exemple avec faute",
  "frenchGood": "Exemple corrigé idéal",
  "frenchTip": "Explication rapide",
  "musicTitle": "🎵 Titre de la playlist ou genre",
  "musicUrl": "https://open.spotify.com/playlist/37i9dQZF1DXdLENR312A3i",
  "musicDesc": "Brève description de l'ambiance de travail",
  "musicQuote": "Citation motivante de coach",
  "miniGame": {
    "id": "game_ai_1",
    "title": "🧩 Challenge Chatting du Jour",
    "scenario": "Mise en situation précise d'un fan...",
    "options": [
      { "label": "A) Option 1", "isCorrect": false, "explanation": "Pourquoi c'est faux..." },
      { "label": "B) Option 2", "isCorrect": true, "explanation": "Pourquoi c'est la bonne réaction..." },
      { "label": "C) Option 3", "isCorrect": false, "explanation": "Pourquoi c'est déconseillé..." }
    ]
  }
}`;

    const text = await callOpenRouterOrGemini(systemPrompt, userPrompt, true);
    if (text) {
      try {
        const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.tipTitle && parsed.miniGame) {
          return parsed;
        }
      } catch (err) {
        console.warn('OpenRouter daily community content parse error:', err);
      }
    }

    // Fallback static
    const tip = await this.getDailyTip();
    const french = FRENCH_CHATTING_TIPS[Math.floor(Math.random() * FRENCH_CHATTING_TIPS.length)];
    const music = CURATED_PLAYLISTS[Math.floor(Math.random() * CURATED_PLAYLISTS.length)];
    const game = this.getRandomMiniGame();

    return {
      tipTitle: tip.title,
      tipContent: tip.content,
      frenchRule: french.rule,
      frenchBad: french.bad,
      frenchGood: french.good,
      frenchTip: french.tip,
      musicTitle: music.title,
      musicUrl: music.url,
      musicDesc: music.description,
      musicQuote: music.quote,
      miniGame: game,
    };
  }

  /**
   * Generates an autonomous, dynamic mini-game via OpenRouter AI.
   */
  public async generateMiniGameWithAI(): Promise<MiniGameChallenge> {
    const cfg = aiKnowledgeService.getPromptConfig();
    if (cfg.cmConfig?.enableMiniGames === false) {
      return {
        id: 'game_disabled',
        title: '🧩 Challenge Désactivé',
        scenario: 'Les mini-jeux sont temporairement désactivés par le Staff Pawako.',
        options: [
          { label: 'A) Entendu', isCorrect: true, explanation: 'Rends-toi dans les salons de discussion pour échanger avec l\'équipe !' }
        ]
      };
    }

    const systemPrompt = getCmSystemPromptContext();
    const userPrompt = `Génère 1 mini-jeu de mise en situation pour un chatter professionnel OnlyFans chez Pawako Agency.
Le scenario doit être réaliste (ex: fan qui demande du gratuit, négociation de vidéo, fan jaloux, relance d'un abonné inactif).
Donne 3 options A, B, C avec explications et indique la bonne réponse.

Réponds au format JSON :
{
  "id": "game_${Date.now()}",
  "title": "🧩 Challenge Chatting Pawako",
  "scenario": "Situation du fan...",
  "options": [
    { "label": "A) ...", "isCorrect": false, "explanation": "..." },
    { "label": "B) ...", "isCorrect": true, "explanation": "..." },
    { "label": "C) ...", "isCorrect": false, "explanation": "..." }
  ]
}`;

    const text = await callOpenRouterOrGemini(systemPrompt, userPrompt, true);
    if (text) {
      try {
        const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.scenario && Array.isArray(parsed.options)) {
          return parsed;
        }
      } catch (err) {
        console.warn('OpenRouter minigame parse error:', err);
      }
    }
    return this.getRandomMiniGame();
  }

  /**
   * Generates a static mini-game fallback challenge.
   */
  public getRandomMiniGame(): MiniGameChallenge {
    const challenges: MiniGameChallenge[] = [
      {
        id: 'game-1',
        title: '🧩 Challenge Chatting #1 : Le Fan Hésitant',
        scenario:
          'Un fan te dit : "J\'adore tes photos mais 40$ pour une vidéo c\'est un peu cher ce mois-ci...". Quelle est la meilleure réaction selon la méthode Pawako ?',
        options: [
          {
            label: 'A) Lui baisser le prix direct à 15$',
            isCorrect: false,
            explanation:
              '❌ Mauvaise idée ! Baisser le prix immédiatement détruit la valeur perçue de ton contenu.',
          },
          {
            label: 'B) Appliquer la méthode du Bouclier (ajouter des médias bonus)',
            isCorrect: true,
            explanation:
              '✅ Excellent ! Tu augmentes la valeur du pack en rajoutant des photos/vidéos bonus avant de parler de tarif !',
          },
          {
            label: 'C) Lui dire "Dommage pour toi tant pis ciao"',
            isCorrect: false,
            explanation: '❌ Tu perds une vente potentielle et le fan se sent rejeté.',
          },
        ],
      },
      {
        id: 'game-2',
        title: '🧩 Challenge Chatting #2 : La Qualification',
        scenario:
          'Un nouveau fan s\'abonne et envoie juste "Hey sexy". Quel est ton tout premier objectif ?',
        options: [
          {
            label: 'A) Lui envoyer directement un PPV payant à 50$',
            isCorrect: false,
            explanation:
              '❌ Erreur fatale ! Il va fuir ou ignorer le message payant sans qualification.',
          },
          {
            label: 'B) Engager la conversation chaleureusement et lui poser au moins 2-3 questions de qualification',
            isCorrect: true,
            explanation:
              '✅ Parfait ! Découvre son prénom, sa ville et ses envies avant de proposer tout contenu.',
          },
          {
            label: 'C) Ne pas répondre et attendre qu\'il achète sur le feed',
            isCorrect: false,
            explanation: '❌ Un abonné non contacté en DM est un abonné perdu.',
          },
        ],
      },
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }
}

export const communityService = new CommunityService();
