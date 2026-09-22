import { GoogleGenAI, Modality } from '@google/genai';
import { TextChannel, AttachmentBuilder, EmbedBuilder, Message } from 'discord.js';
import { voiceRadioService } from './voiceRadioService';
import { store } from './store';

export type VoiceCapsuleType = 'spam_warning' | 'morning_relance' | 'motivation_shift' | 'level_congrats' | 'custom';

export interface VoiceCapsuleConfig {
  type: VoiceCapsuleType;
  customText?: string;
  targetName?: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
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
 * Wraps raw 16-bit Mono PCM buffer (24000Hz) into a valid RIFF/WAVE file container.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // Check if buffer is already a valid WAV file (starts with 'RIFF')
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
  header.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
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
 * Generates a clean synthetic WAV beep/melodic chime tone if no API key is set
 */
function generateSyntheticAlertWav(durationSeconds = 2.5, frequency = 440, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const pcm = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Harmonic pleasant chime envelope
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
  private preferredVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore';

  // Anti-spam tracker (userId -> Array of timestamps)
  private userMessageHistory = new Map<string, { timestamps: number[]; lastContent: string }>();

  // Cooldown tracker to prevent spamming audio warnings
  private spamWarningCooldowns = new Map<string, number>();

  public getSettings() {
    return {
      autoSpamVoiceEnabled: this.autoSpamVoiceEnabled,
      morningRelanceVoiceEnabled: this.morningRelanceVoiceEnabled,
      preferredVoice: this.preferredVoice,
    };
  }

  public updateSettings(settings: {
    autoSpamVoiceEnabled?: boolean;
    morningRelanceVoiceEnabled?: boolean;
    preferredVoice?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  }) {
    if (settings.autoSpamVoiceEnabled !== undefined) this.autoSpamVoiceEnabled = settings.autoSpamVoiceEnabled;
    if (settings.morningRelanceVoiceEnabled !== undefined) this.morningRelanceVoiceEnabled = settings.morningRelanceVoiceEnabled;
    if (settings.preferredVoice) this.preferredVoice = settings.preferredVoice;
  }

  /**
   * Generates natural French speech scripts based on action type
   */
  public getPresetScript(type: VoiceCapsuleType, targetName?: string): { title: string; script: string; defaultVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' } {
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
          defaultVoice: 'Kore',
        };
      case 'motivation_shift':
        return {
          title: '⚡ Capsule Énergie & Motivation Chatting',
          script: `Flash motivation Pawako ! Les équipes au top gardent une cadence constante et des messages soignés. Appliquez les bonnes méthodes, soyez réactifs et dépassez vos objectifs aujourd'hui !`,
          defaultVoice: 'Puck',
        };
      case 'level_congrats':
        return {
          title: '🏆 Félicitations Palier & Badge Obtenu',
          script: `Bravo ${name} pour ton nouveau palier franchi ! Tes efforts et ton sérieux portent leurs fruits. Continue sur cette excellente lancée !`,
          defaultVoice: 'Zephyr',
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
   * Generates a voice capsule using Gemini TTS (model: gemini-3.1-flash-tts-preview)
   */
  public async generateVoiceCapsule(config: VoiceCapsuleConfig): Promise<GeneratedVoiceCapsule> {
    const preset = this.getPresetScript(config.type, config.targetName);
    const script = config.customText && config.customText.trim().length > 0
      ? config.customText.trim()
      : preset.script;
    const voiceName = config.voiceName || preset.defaultVoice || this.preferredVoice;

    let audioBuffer: Buffer | null = null;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        console.log(`[AiVoice] Synthèse vocale Gemini TTS via model 'gemini-3.1-flash-tts-preview' (Voix: ${voiceName})...`);
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: script }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const rawBuf = Buffer.from(base64Audio, 'base64');
          audioBuffer = pcmToWav(rawBuf, 24000);
          console.log(`[AiVoice] Capsule audio générée avec succès (${audioBuffer.length} bytes).`);
        }
      } catch (err: any) {
        console.warn('[AiVoice TTS Error, using synthetic audio fallback]', err?.message || err);
      }
    }

    if (!audioBuffer) {
      // Fallback synthetic wave tone with speech marker
      console.log('[AiVoice] Utilisation du synthétiseur audio alternatif Pawako.');
      const frequency = config.type === 'spam_warning' ? 320 : 520;
      audioBuffer = generateSyntheticAlertWav(3.0, frequency, 24000);
    }

    // Estimate duration based on French speech rate (~15 characters per second)
    const durationEstimateSeconds = Math.max(3, Math.round(script.length / 15));

    return {
      id: `voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: config.type,
      title: preset.title,
      script,
      voiceName,
      audioBuffer,
      mimeType: 'audio/wav',
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
   * Posts the audio capsule as an interactive voice message with player embed into a Discord text channel.
   */
  public async sendToTextChannel(
    channel: TextChannel,
    capsule: GeneratedVoiceCapsule,
    authorName: string = 'Pawako AI Voice Coach'
  ): Promise<boolean> {
    try {
      const attachment = new AttachmentBuilder(capsule.audioBuffer, {
        name: `capsule-vocale-pawako-${capsule.type}.wav`,
        description: capsule.script,
      });

      const colorMap: Record<VoiceCapsuleType, number> = {
        spam_warning: 0xef4444,
        morning_relance: 0x8b5cf6,
        motivation_shift: 0xf59e0b,
        level_congrats: 0x10b981,
        custom: 0x3b82f6,
      };

      const embed = new EmbedBuilder()
        .setTitle(capsule.title)
        .setDescription(`🎙️ **Transcription Vocale :**\n> *"${capsule.script}"*`)
        .setColor(colorMap[capsule.type] || 0x6366f1)
        .addFields(
          { name: '🗣️ Voix IA', value: `\`${capsule.voiceName}\``, inline: true },
          { name: '⏱️ Durée Estimée', value: `\`~${capsule.durationEstimateSeconds}s\``, inline: true },
          { name: '📻 Format', value: '`WAV HD (24kHz)`', inline: true }
        )
        .setFooter({ text: `${authorName} • Animateur Vocal IA Intégré` })
        .setTimestamp();

      await channel.send({
        embeds: [embed],
        files: [attachment],
      });

      store.addLog(
        'Animateur Vocal IA',
        `Capsule vocale diffusée [${capsule.type}] dans #${channel.name} (${capsule.voiceName}, ~${capsule.durationEstimateSeconds}s)`,
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
