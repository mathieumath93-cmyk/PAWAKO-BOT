import { GoogleGenAI, Modality } from '@google/genai';
import { TextChannel, AttachmentBuilder, Message, EmbedBuilder } from 'discord.js';
import https from 'https';
import { voiceRadioService } from './voiceRadioService';
import { store } from './store';
import { aiKnowledgeService, getDefaultOpenRouterApiKey } from './aiKnowledgeService';

export type VoiceCapsuleType = 'spam_warning' | 'morning_relance' | 'motivation_shift' | 'level_congrats' | 'custom';
export type VoiceEngineType = 'google_fr' | 'gemini';

export interface VoiceCapsuleConfig {
  type: VoiceCapsuleType;
  customText?: string;
  targetName?: string;
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
  public getPresetScript(type: VoiceCapsuleType, targetName?: string): { title: string; script: string; defaultVoice: any } {
    const name = targetName || 'candidat';
    switch (type) {
      case 'spam_warning':
        return {
          title: '🚨 Alerte Modération Vocale — Anti-Spam',
          script: `Alerte modération Pawako ! Le flood et l'envoi de messages répétés sont strictement interdits. Merci de respecter la tranquillité du salon et d'attendre les réponses.`,
          defaultVoice: 'Fenrir',
        };
      case 'morning_relance':
        return {
          title: '☀️ Relance Matinale Coach Pawako',
          script: `Bonjour ${name} ! C'est ton coach vocal Pawako. N'oublie pas de valider ton module du jour et de te concentrer sur tes relances. La régularité bat le talent ! Bon courage pour ta journée.`,
          defaultVoice: 'French_Natural',
        };
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
   * Uses OpenRouter API with resilient free-tier models (Llama 3.3, Mistral 7B, etc.)
   * to dynamically create crisp, punchy, human French coaching speech scripts.
   */
  public async generateOpenRouterSpeechScript(
    type: VoiceCapsuleType,
    targetName?: string
  ): Promise<string> {
    const name = targetName && targetName.trim() ? targetName.trim() : 'candidat';
    const cfgKey = aiKnowledgeService.getConfig()?.openRouterApiKey;
    const apiKey = cfgKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

    let contextPrompt = '';
    if (type === 'morning_relance') {
      contextPrompt = `Tu es le Coach Vocal d'élite de PAWAKO Formation. Rédige un message audio de relance matinale percutant et très court (1 à 2 phrases percutantes, maximum 25 mots) pour le candidat "${name}". Motive-le à valider ses modules de formation et à rester régulier sur ses relances de chatting. Sois dynamique, positif et axé résultats. Pas d'émojis, pas de guillemets, juste le texte exact à prononcer.`;
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
              temperature: 0.85,
              max_tokens: 80,
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

    // Dynamic varied presets as instant backup
    const fallbacks: Record<VoiceCapsuleType, string[]> = {
      morning_relance: [
        `Bonjour ${name} ! C'est ton coach Pawako. Concentre-toi sur tes relances et valide ton module du jour, la constance bat le talent !`,
        `Salut ${name} ! Nouvelle journée, nouvelles opportunités. Donne le meilleur sur tes sessions de formation aujourd'hui !`,
        `Hello ${name} ! Rappel du jour : garde le rythme, relance avec méthode et avance vers tes objectifs !`,
      ],
      spam_warning: [
        `Alerte modération Pawako ! Merci de ne pas inonder le salon de messages répétés et de patienter tranquillement.`,
        `Attention modération. Merci d'éviter les envois successifs et de respecter le calme du salon.`,
      ],
      motivation_shift: [
        `Flash motivation Pawako ! Les meilleurs chatteurs gardent une cadence soutenue et soignée. Soyez réactifs et dépassez vos objectifs !`,
        `Énergie au maximum pour l'équipe Pawako ! Appliquez les techniques du guide et faites la différence aujourd'hui !`,
      ],
      level_congrats: [
        `Bravo ${name} pour ton nouveau palier franchi ! Tes efforts et ton sérieux portent leurs fruits, continue comme ça !`,
        `Félicitations ${name} ! Ce niveau validé confirme ta progression. Fonce vers la prochaine étape !`,
      ],
      custom: [
        `Message d'annonce officiel de la formation Pawako. Restez concentrés et attentifs aux prochaines consignes.`,
      ],
    };

    const list = fallbacks[type] || fallbacks.custom;
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Generates a voice capsule using the reliable French voice engine with Gemini TTS support & automatic quota fallback
   */
  public async generateVoiceCapsule(config: VoiceCapsuleConfig): Promise<GeneratedVoiceCapsule> {
    const preset = this.getPresetScript(config.type, config.targetName);
    
    // Use OpenRouter to generate fresh, dynamic, intelligent coaching voice scripts
    let script = config.customText && config.customText.trim().length > 0
      ? config.customText.trim()
      : null;

    if (!script) {
      try {
        script = await this.generateOpenRouterSpeechScript(config.type, config.targetName);
      } catch {
        script = preset.script;
      }
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
        title = '☀️ Relance Matinale — Coach Pawako';
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

