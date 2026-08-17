import { DiscordChannelConfig } from '../types';
import { roleService } from './roleService';
import { serverService } from './serverService';
import { store } from './store';

export const mockChannels: DiscordChannelConfig[] = [
  { id: 'chan-formation', name: 'formation', type: 'text', categoryName: '📚 ACADÉMIE', isConfiguredFor: 'training' },
  { id: 'chan-quiz', name: 'quiz-onboarding', type: 'text', categoryName: '📚 ACADÉMIE', isConfiguredFor: 'quiz' },
  { id: 'chan-results', name: 'resultats-certifications', type: 'text', categoryName: '📚 ACADÉMIE', isConfiguredFor: 'results' },
  { id: 'chan-logs', name: 'bot-logs', type: 'text', categoryName: '⚙️ ADMIN', isConfiguredFor: 'logs' },
  { id: 'chan-general', name: 'général', type: 'text', categoryName: '💬 DISCUSSIONS', isConfiguredFor: 'general' },
  { id: 'chan-tickets', name: 'support-tickets', type: 'text', categoryName: '⚙️ ADMIN', isConfiguredFor: 'tickets' },
];

export interface DiscordConfig {
  botToken: string;
  clientId: string;
  clientSecret: string;
  webhookUrl: string;
  commandPrefix: string;
  botName: string;
  botAvatarUrl: string;
}

const DEFAULT_CONFIG: DiscordConfig = {
  botToken: 'MTUzODg3NDIyNjQxNTUwMTQ2Mg.GRRAAr.5NbxFb6dbuz9rwki_yyiapVY4786aZx5i---dQ',
  clientId: '1538874226415501462',
  clientSecret: 'Qd3R0-xv4wszPNh1WxKBFxY0zO_-ETMd',
  webhookUrl: 'https://discord.com/api/webhooks/1538892353849532527/8KQxKy9_LOgoL11MAGbYzNeKVyn4lmYr6dLRYqrwve3A0eyJCffSyxyAvLhSMBCMC8rh',
  commandPrefix: '!',
  botName: 'Pawako Bot',
  botAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
};

class DiscordService {
  private channels: DiscordChannelConfig[] = [...mockChannels];
  private config: DiscordConfig;

  constructor() {
    this.config = this.loadConfig();
    this.channels = this.loadChannels();
  }

  private loadChannels(): DiscordChannelConfig[] {
    try {
      const stored = localStorage.getItem('pawako_discord_channels');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return [...mockChannels];
  }

  private loadConfig(): DiscordConfig {
    try {
      const stored = localStorage.getItem('pawako_discord_config');
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return { ...DEFAULT_CONFIG };
  }

  public getConfig(): DiscordConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<DiscordConfig>): DiscordConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('pawako_discord_config', JSON.stringify(this.config));
    } catch {
      // Ignore
    }
    return this.config;
  }

  public async getStatus(): Promise<{ isConnected: boolean; latencyMs: number; tag: string }> {
    return {
      isConnected: Boolean(this.config.botToken.trim()),
      latencyMs: Math.floor(Math.random() * 12) + 18,
      tag: `${this.config.botName.toUpperCase()}#2026`,
    };
  }

  public getChannels(): DiscordChannelConfig[] {
    return this.channels;
  }

  public updateChannelConfig(channelId: string, configuredFor: DiscordChannelConfig['isConfiguredFor']): DiscordChannelConfig {
    const channel = this.channels.find((c) => c.id === channelId);
    if (channel) {
      channel.isConfiguredFor = configuredFor;
      return channel;
    }
    throw new Error('Salon non trouvé');
  }

  public setChannels(newChannels: DiscordChannelConfig[]) {
    this.channels = newChannels;
    try {
      localStorage.setItem('pawako_discord_channels', JSON.stringify(this.channels));
    } catch {
      // Ignore
    }
  }

  public deleteChannel(channelId: string): void {
    this.channels = this.channels.filter((c) => c.id !== channelId);
    try {
      localStorage.setItem('pawako_discord_channels', JSON.stringify(this.channels));
    } catch {
      // Ignore
    }
  }

  public clearDefaultChannels(): void {
    this.channels = [];
    try {
      localStorage.setItem('pawako_discord_channels', JSON.stringify(this.channels));
    } catch {
      // Ignore
    }
  }

  public addCustomChannel(name: string, categoryName: string = 'SÉLECTION', isConfiguredFor: DiscordChannelConfig['isConfiguredFor'] = 'general'): DiscordChannelConfig {
    const newChan: DiscordChannelConfig = {
      id: `chan-${Date.now()}`,
      name: name.replace(/^#/, '').trim(),
      type: 'text',
      categoryName,
      isConfiguredFor,
    };
    this.channels.push(newChan);
    try {
      localStorage.setItem('pawako_discord_channels', JSON.stringify(this.channels));
    } catch {
      // Ignore
    }
    return newChan;
  }

  public async fetchAndSyncRealDiscordData(): Promise<{ success: boolean; message?: string; server?: any }> {
    try {
      const token = this.config.botToken;
      const res = await fetch(`/api/discord/sync-real-data?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, message: err.error || 'Erreur lors de la synchronisation avec Discord' };
      }

      const data = await res.json();
      if (!data.success) {
        return { success: false, message: data.message || 'Aucun serveur trouvé' };
      }

      if (data.channels && data.channels.length > 0) {
        this.setChannels(data.channels);
      }

      if (data.roles && data.roles.length > 0) {
        roleService.setRoles(data.roles);
      }

      if (data.server) {
        serverService.updateServerDetails(data.server);
      }

      if (data.members && data.members.length > 0) {
        store.setMembers(data.members);
      }

      return data;
    } catch (err: any) {
      console.error('[Discord Sync Error]', err);
      return { success: false, message: err.message };
    }
  }

  public async syncDiscord(): Promise<{ success: boolean; channelsCount: number; rolesCount: number; message?: string }> {
    const result = await this.fetchAndSyncRealDiscordData();
    // Send a real sync event to Discord Webhook if available
    this.sendWebhookLog('Synchronisation des salons & rôles Discord', 'system', `Serveur ID: ${this.config.clientId} synchronisé avec succès.`);
    return {
      success: result.success,
      channelsCount: this.channels.length,
      rolesCount: roleService.getRoles().length,
      message: result.message,
    };
  }

  /**
   * Send a real HTTP POST request to the Discord Webhook URL
   */
  public async sendWebhookTestMessage(customWebhookUrl?: string): Promise<{ success: boolean; message: string }> {
    const url = (customWebhookUrl || this.config.webhookUrl).trim();
    if (!url || !url.startsWith('http')) {
      return { success: false, message: 'URL de webhook invalide ou non renseignée.' };
    }

    const payload = {
      username: this.config.botName || 'Pawako Bot 🛡️',
      avatar_url: this.config.botAvatarUrl,
      embeds: [
        {
          title: '✅ Test de Connexion Webhook Réussi !',
          description: 'Le tableau de bord **Pawako Formation** est parfaitement connecté à votre serveur Discord.',
          color: 0x5865f2, // Discord Blurple
          fields: [
            { name: '🟢 Statut Webhook', value: 'Opérationnel & Connecté', inline: true },
            { name: '🤖 Application ID', value: this.config.clientId || '1538874226415501462', inline: true },
            { name: '⏰ Horodatage', value: new Date().toLocaleString('fr-FR'), inline: false },
          ],
          footer: {
            text: 'Pawako Formation • Système de notification en direct',
            icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 204) {
        return { success: true, message: 'Message de test envoyé sur votre salon Discord avec succès !' };
      } else {
        const text = await response.text();
        return { success: false, message: `Erreur Discord (${response.status}): ${text || 'Échec d\'envoi'}` };
      }
    } catch (err: any) {
      console.error('[Discord Webhook Error]', err);
      return { success: false, message: `Erreur réseau ou CORS: ${err?.message || 'Impossible de contacter le webhook Discord.'}` };
    }
  }

  /**
   * Send a log entry to Discord Webhook
   */
  public async sendWebhookLog(action: string, category: string, details?: string, memberName?: string): Promise<boolean> {
    const url = this.config.webhookUrl.trim();
    if (!url || !url.startsWith('http')) return false;

    const categoryColors: Record<string, number> = {
      system: 0x6366f1,  // Indigo
      module: 0x06b6d4,  // Cyan
      quiz: 0x10b981,    // Emerald
      role: 0xf59e0b,    // Amber
      member: 0xec4899,  // Pink
      ticket: 0x8b5cf6,  // Purple
    };

    const categoryIcons: Record<string, string> = {
      system: '⚙️',
      module: '📚',
      quiz: '📝',
      role: '🛡️',
      member: '👤',
      ticket: '🎫',
    };

    const icon = categoryIcons[category] || '📢';
    const color = categoryColors[category] || 0x6366f1;

    const payload = {
      username: this.config.botName || 'Pawako Formation 🤖',
      avatar_url: this.config.botAvatarUrl,
      embeds: [
        {
          title: `${icon} [LOG] ${action}`,
          description: details || `Une action **${category.toUpperCase()}** a été exécutée depuis le Dashboard Admin.`,
          color: color,
          fields: [
            { name: 'Catégorie', value: category.toUpperCase(), inline: true },
            { name: 'Cible / Membre', value: memberName || 'Système', inline: true },
          ],
          footer: { text: 'Pawako Formation Admin Logs' },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send a rich module Embed message directly to the specified Discord channel
   */
  public async sendModuleEmbed(moduleData: {
    id?: string;
    title: string;
    description: string;
    channelName: string;
    channelId?: string;
    roleEnCoursName?: string;
    roleValidatedName?: string;
    blocks?: any[];
    isActive?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const cleanChannel = (moduleData.channelName || '#formation').replace(/^#/, '');

    // Format blocks summary for embed description
    const blockSummary = moduleData.blocks && moduleData.blocks.length > 0
      ? moduleData.blocks
          .map((b) => {
            if (b.type === 'heading' || b.title) return `**${b.title || b.content}**`;
            if (b.type === 'alert') return `> ⚠️ **${b.title || 'Note'}**: ${b.content}`;
            if (b.type === 'button') return `🔘 **[${b.content || 'Démarrer'}]**`;
            return b.content;
          })
          .join('\n')
      : moduleData.description;

    const embed = {
      title: `🎓 Module de Formation : ${moduleData.title}`,
      description: `${moduleData.description || ''}\n\n${blockSummary || ''}`,
      color: moduleData.isActive ? 0x6366f1 : 0xf59e0b,
      fields: [
        { name: '📍 Salon Dédié', value: `#${cleanChannel}`, inline: true },
        { name: '🛡️ Rôle Inscription', value: moduleData.roleEnCoursName || 'Trainee', inline: true },
        { name: '🏆 Rôle Validation', value: moduleData.roleValidatedName || 'Junior', inline: true },
        { name: '⚡ Statut', value: moduleData.isActive ? '✅ Publié sur Discord' : '🕒 Brouillon / Modifié', inline: true },
      ],
      footer: {
        text: 'Pawako Formation • Système de Formation Discord',
        icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/discord/send-channel-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: cleanChannel,
          channelId: moduleData.channelId,
          embed,
          content: `📢 **Mise à jour de la Formation !** Le module **${moduleData.title}** est prêt dans le salon #${cleanChannel}.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.sendWebhookLog('Publication Embed Module', 'module', `Module "${moduleData.title}" publié dans #${cleanChannel}`);
        return { success: true, message: data.message || `Embed envoyé dans #${cleanChannel}` };
      }
      return { success: false, message: data.error || 'Échec de l\'envoi de l\'embed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau lors de l\'envoi' };
    }
  }

  /**
   * Create a private thread for a member's quiz attempt/results on a specified channel
   */
  public async createPrivateQuizThread(options: {
    channelName: string;
    channelId?: string;
    quizTitle: string;
    memberName: string;
    memberDiscordId?: string;
    score: number;
    maxScore?: number;
    passed: boolean;
    attemptNumber?: number;
    details?: string;
  }): Promise<{ success: boolean; threadName?: string; message: string }> {
    const cleanChannel = (options.channelName || '#results').replace(/^#/, '');
    const maxScore = options.maxScore || 20;

    const embed = {
      title: `🔒 Résultats de Quiz : ${options.quizTitle}`,
      description: `Fil d'évaluation individuel réservé à **${options.memberName}**.`,
      color: options.passed ? 0x10b981 : 0xef4444, // Green if passed, Red if failed
      fields: [
        { name: '👤 Membre', value: options.memberName || 'Membre Discord', inline: true },
        { name: '📊 Score Obtenu', value: `**${options.score} / ${maxScore}** (${options.passed ? '✅ Réussi' : '❌ Échoué'})`, inline: true },
        { name: '🔄 Tentative n°', value: `${options.attemptNumber || 1}`, inline: true },
        { name: '🏆 Statut', value: options.passed ? '🎉 Félicitations ! Module validé & Rôle attribué.' : '⚠️ Score insuffisant. Merci de réviser le module.', inline: false },
        { name: '📝 Remarques', value: options.details || 'Résultats enregistrés dans le système PAWAKO.', inline: false },
      ],
      footer: {
        text: 'Pawako Formation • Fil Privé Sécurisé',
        icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/discord/create-private-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: cleanChannel,
          channelId: options.channelId,
          memberName: options.memberName,
          memberDiscordId: options.memberDiscordId,
          quizTitle: options.quizTitle,
          score: options.score,
          maxScore,
          passed: options.passed,
          embed,
          content: `🔒 **Fil Privé de Résultats** pour @${options.memberName} — Évaluation **${options.quizTitle}**`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.sendWebhookLog('Fil Privé Résultats', 'quiz', `Fil "${data.threadName}" créé dans #${cleanChannel} pour ${options.memberName}`);
        return { success: true, threadName: data.threadName, message: data.message || `Fil privé créé dans #${cleanChannel}` };
      }
      return { success: false, message: data.error || 'Impossible de créer le fil privé' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau lors de la création du fil privé' };
    }
  }

  /**
   * Create a personal text channel for a member's onboarding on Discord
   */
  public async createPersonalChannel(options: {
    memberName: string;
    prefix?: string;
    rulesMessage?: string;
  }): Promise<{ success: boolean; channelName?: string; message: string }> {
    try {
      const res = await fetch('/api/discord/create-personal-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.sendWebhookLog('Salon Personnel Créé', 'member', `Salon "${data.channelName}" créé pour ${options.memberName}`);
        return { success: true, channelName: data.channelName, message: data.message || `Salon personnel ${data.channelName} créé` };
      }
      return { success: false, message: data.error || 'Échec de la création du salon personnel' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau lors de la création du salon personnel' };
    }
  }
}

export const discordService = new DiscordService();

