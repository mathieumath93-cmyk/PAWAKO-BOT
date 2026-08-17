import { Client, GatewayIntentBits } from 'discord.js';
import { store } from '../services/store';

export class PawakoBotRunner {
  private client: Client | null = null;
  private isConnected: boolean = false;

  constructor() {
    // Only instantiate if token exists
    const token = process.env.DISCORD_BOT_TOKEN;
    if (token) {
      this.initClient(token);
    }
  }

  private initClient(token: string) {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
        ],
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log(`[PAWAKO BOT] Bot connecté avec succès sous l'identité : ${this.client?.user?.tag}`);
        store.addLog('System Bot', 'Bot Discord Gateway connecté et prêt.', 'system');
      });

      this.client.on('guildMemberAdd', (member) => {
        store.addNotification({
          level: 'information',
          title: 'Nouveau membre rejoint',
          message: `${member.displayName} a rejoint le serveur Discord.`,
          event: 'member_join',
          mentionAdmin: false,
        });
      });

      this.client.login(token).catch((err) => {
        console.warn('[PAWAKO BOT] Login Error:', err.message);
      });
    } catch (err: any) {
      console.warn('[PAWAKO BOT] Could not init discord.js client:', err.message);
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      botUser: this.client?.user?.tag || 'PAWAKO FORMATION 🤖',
    };
  }
}

export const pawakoBot = new PawakoBotRunner();
