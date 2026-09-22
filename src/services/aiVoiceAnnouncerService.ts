import { GoogleGenAI, Modality } from '@google/genai';
import { TextChannel, AttachmentBuilder, Message } from 'discord.js';
import https from 'https';
import { voiceRadioService } from './voiceRadioService';
import { store } from './store';

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
   * Generates a voice capsule using the reliable French voice engine with Gemini TTS support & automatic quota fallback
   */
  public async generateVoiceCapsule(config: VoiceCapsuleConfig): Promise<GeneratedVoiceCapsule> {
    const preset = this.getPresetScript(config.type, config.targetName);
    const script = config.customText && config.customText.trim().length > 0
      ? config.customText.trim()
      : preset.script;
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
   * Posts the audio capsule cleanly to Discord without bulky technical embeds or clutter
   */
  public async sendToTextChannel(
    channel: TextChannel,
    capsule: GeneratedVoiceCapsule,
    authorName: string = 'Pawako Formation'
  ): Promise<boolean> {
    try {
      const ext = capsule.mimeType.includes('wav') ? 'wav' : 'mp3';
      const attachment = new AttachmentBuilder(capsule.audioBuffer, {
        name: `message-vocal-pawako.${ext}`,
        description: capsule.script,
      });

      // Sleek, minimal and authentic Discord message (no cluttered tables or redundant specs)
      let prefix = '🎙️ **Message vocal de la formation**';
      if (capsule.type === 'spam_warning') {
        prefix = '🚨 **Avertissement Modération Vocale**';
      } else if (capsule.type === 'morning_relance') {
        prefix = '☀️ **Relance Matinale Coach**';
      } else if (capsule.type === 'motivation_shift') {
        prefix = '⚡ **Capsule Motivation & Énergie**';
      } else if (capsule.type === 'level_congrats') {
        prefix = '🏆 **Félicitations Palier**';
      }

      await channel.send({
        content: `${prefix} :\n> *« ${capsule.script} »*`,
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

