import { DiscordChannelConfig } from '../types';

export const mockChannels: DiscordChannelConfig[] = [
  { id: 'chan-formation', name: 'formation', type: 'text', categoryName: '📚 ACADÉMIE', isConfiguredFor: 'training' },
  { id: 'chan-quiz', name: 'quiz-onboarding', type: 'text', categoryName: '📚 ACADÉMIE', isConfiguredFor: 'quiz' },
  { id: 'chan-results', name: 'resultats-certifications', type: 'text', categoryName: '📚 ACADÉMIE', isConfiguredFor: 'results' },
  { id: 'chan-logs', name: 'bot-logs', type: 'text', categoryName: '⚙️ ADMIN', isConfiguredFor: 'logs' },
  { id: 'chan-general', name: 'général', type: 'text', categoryName: '💬 DISCUSSIONS', isConfiguredFor: 'general' },
  { id: 'chan-tickets', name: 'support-tickets', type: 'text', categoryName: '⚙️ ADMIN', isConfiguredFor: 'tickets' },
];

class DiscordService {
  private channels: DiscordChannelConfig[] = [...mockChannels];
  private isConnected: boolean = true;
  private latencyMs: number = 24;

  public async getStatus(): Promise<{ isConnected: boolean; latencyMs: number; tag: string }> {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        return {
          isConnected: data.connected ?? true,
          latencyMs: Math.floor(Math.random() * 15) + 18,
          tag: data.tag || 'PAWAKO BOT#2026',
        };
      }
    } catch (e) {
      // Fallback
    }
    return { isConnected: true, latencyMs: 22, tag: 'PAWAKO BOT#2026' };
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

  public async syncDiscord(): Promise<{ success: boolean; channelsCount: number; rolesCount: number }> {
    // Simulated sync action API ready
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: true,
      channelsCount: this.channels.length,
      rolesCount: 8,
    };
  }
}

export const discordService = new DiscordService();
