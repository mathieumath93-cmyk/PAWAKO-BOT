import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import { store } from '../services/store';

export class PawakoBotRunner {
  private client: Client | null = null;
  private isConnected: boolean = false;

  constructor() {
    // Check process.env
    const token = process.env.DISCORD_BOT_TOKEN;
    if (token) {
      this.connectWithToken(token);
    }
  }

  public async connectWithToken(rawToken: string) {
    if (!rawToken || !rawToken.trim()) return;

    let cleanToken = rawToken.trim();
    if (cleanToken.startsWith('Bot ')) cleanToken = cleanToken.substring(4).trim();
    if (cleanToken.startsWith('Bearer ')) cleanToken = cleanToken.substring(7).trim();

    if (!cleanToken) return;

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (e) {
        // ignore
      }
      this.client = null;
    }

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
        const guildId = process.env.DISCORD_GUILD_ID;
        console.log(`[PAWAKO BOT] Bot connecté avec succès sous l'identité : ${this.client?.user?.tag} (Serveur autorisé ID: ${guildId || 'Tous'})`);
        store.addLog('System Bot', `Bot Discord Gateway connecté (${this.client?.user?.tag}) - Serveur ID: ${guildId || 'Tous'}`, 'system');
      });

      this.client.on('guildMemberAdd', (member) => {
        const allowedGuildId = process.env.DISCORD_GUILD_ID;
        if (allowedGuildId && member.guild.id !== allowedGuildId) return;

        store.addNotification({
          level: 'information',
          title: 'Nouveau membre rejoint',
          message: `${member.displayName} a rejoint le serveur Discord.`,
          event: 'member_join',
          mentionAdmin: false,
        });
      });

      // Handle message commands (e.g. !help, !profile, !formation, !ticket)
      this.client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return;

        const allowedGuildId = process.env.DISCORD_GUILD_ID;
        if (allowedGuildId && message.guild?.id && message.guild.id !== allowedGuildId) {
          return; // Restrict execution to authorized server if configured
        }

        const content = message.content.trim();
        const branding = store.getBranding();

        if (content === '!help' || content === '!start' || content === '!pawako') {
          const embed = new EmbedBuilder()
            .setTitle(`🤖 ${branding.trainingName}`)
            .setDescription(branding.mainWelcomeMessage)
            .setColor(0x6366f1)
            .addFields(
              { name: '📚 Formation', value: 'Utilise `!formation` pour voir tes modules.' },
              { name: '👤 Profil', value: 'Utilise `!profile` pour consulter ton statut.' },
              { name: '🎫 Support', value: 'Utilise `!ticket` pour ouvrir une demande d\'aide.' }
            )
            .setFooter({ text: 'PAWAKO FORMATION Bot • Connecté à la plateforme Web' });

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_formation').setLabel('📚 Ma formation').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_ticket').setLabel('🎫 Mes tickets').setStyle(ButtonStyle.Secondary)
          );

          await message.reply({ embeds: [embed], components: [row] });
        }

        if (content === '!profile') {
          const member = store.getMembers().find(m => m.discordId === message.author.id) || {
            username: message.author.username,
            roles: ['Nouveau membre'],
            progress: {}
          };

          const validatedCount = Object.values(member.progress).filter((p: any) => p.status === 'valide').length;

          const embed = new EmbedBuilder()
            .setTitle(`👤 Profil de ${message.author.username}`)
            .setColor(0x06b6d4)
            .addFields(
              { name: 'Rôles Discord', value: member.roles.join(', ') || 'Aucun' },
              { name: 'Modules Validés', value: `${validatedCount} / ${store.getModules().length}` }
            )
            .setThumbnail(message.author.displayAvatarURL());

          await message.reply({ embeds: [embed] });
        }

        if (content === '!formation') {
          const modules = store.getModules();
          const embed = new EmbedBuilder()
            .setTitle('📚 Programme de Formation PAWAKO')
            .setColor(0x6366f1)
            .setDescription(modules.map(m => `**${m.title}**\n${m.description}`).join('\n\n'));

          await message.reply({ embeds: [embed] });
        }

        if (content === '!ticket') {
          const ticket = store.createTicket(
            message.author.id,
            `Demande de support par ${message.author.username}`,
            'Support Discord',
            'Bonjour, j\'ai besoin d\'aide sur Discord.'
          );

          const embed = new EmbedBuilder()
            .setTitle(`🎫 Ticket #${ticket.ticketNumber} Créé`)
            .setDescription('Votre ticket a été enregistré dans le dashboard admin. Un administrateur vous répondra sous peu.')
            .setColor(0x10b981);

          await message.reply({ embeds: [embed] });
        }
      });

      // Handle button interactions
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'btn_profile') {
          await interaction.reply({ content: `Consulte ton profil avec la commande \`!profile\` !`, ephemeral: true });
        } else if (interaction.customId === 'btn_formation') {
          await interaction.reply({ content: `Affiche tes modules avec la commande \`!formation\` !`, ephemeral: true });
        } else if (interaction.customId === 'btn_ticket') {
          await interaction.reply({ content: `Ouvre un ticket avec la commande \`!ticket\` !`, ephemeral: true });
        }
      });

      this.client.login(cleanToken).catch((err) => {
        console.warn('[PAWAKO BOT] Login Error:', err.message);
      });
    } catch (err: any) {
      console.warn('[PAWAKO BOT] Could not init discord.js client:', err.message);
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected && Boolean(this.client && this.client.user);
  }

  public getUserTag(): string {
    return this.client?.user?.tag || 'Discord Bot non connecté';
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      botUser: this.client?.user?.tag || 'PAWAKO FORMATION 🤖',
    };
  }
}

export const pawakoBot = new PawakoBotRunner();

