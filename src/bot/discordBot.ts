import {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js';
import { store, defaultModules, defaultQuizzes } from '../services/store';
import { discordService } from '../services/discordService';
import { discordSyncService } from '../services/discordSyncService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { onboardingService } from '../services/onboardingService';
import { badgeService, SYSTEM_BADGES } from '../services/badgeService';
import { QuizQuestion, Member, Quiz, MemberBadge } from '../types';
import {
  callOpenRouterAI,
  getSimulationPrompt,
  createRandomFanProfile,
  FanProfile,
  evaluateSimulationSession,
  generateSmartFallbackFanReply,
  sanitizeFanOutput,
  checkCandidateMessageForCoachIntervention,
  enforceFanNegotiationRules,
  aiKnowledgeService,
} from '../services/aiKnowledgeService';
import {
  communityService,
  CURATED_PLAYLISTS,
  FRENCH_CHATTING_TIPS,
} from '../services/communityService';

export interface ActiveQuizSession {
  attemptId: string;
  discordUserId: string;
  quizId: string;
  quizTitle: string;
  moduleId: string;
  questions: QuizQuestion[];
  currentIndex: number;
  userAnswers: number[];
  score: number;
  startedAt: number;
  questionTimer?: NodeJS.Timeout;
  messageId?: string;
  channelId?: string;
}

export interface ActiveAnthonySession {
  channelId: string;
  candidateId: string;
  candidateDiscordId: string;
  candidateUsername: string;
  startedAt: number;
  lastCandidateMsgTimestamp: number;
  lastFanMsgTimestamp: number;
  fanProfile?: FanProfile;
  extractedInfos: {
    name: boolean;
    age: boolean;
    job: boolean;
    location: boolean;
    hobbies: boolean;
    fantasy: boolean;
  };
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  coachInterventionsCount?: number;
  inactivityTimer?: NodeJS.Timeout;
}

function formatMemberRolesDisplay(roles: string[] = []): string {
  const filtered = (roles || []).filter(Boolean);
  if (filtered.length === 0) return 'Aucun rôle attribué';

  const allGuildRoles = discordSyncService.getRoles();

  const formattedList = filtered.map((roleStr) => {
    const clean = String(roleStr).trim();
    if (/^\d{17,20}$/.test(clean)) {
      const matched = allGuildRoles.find((r) => r.discord_role_id === clean || r.id === clean);
      if (matched) return `@${matched.name}`;
      return `<@&${clean}>`;
    }
    return `@${clean.replace(/^@/, '')}`;
  });

  return Array.from(new Set(formattedList)).join(', ');
}

/**
 * Calculates epoch timestamp for next 14h00 HF (Europe/Paris timezone).
 * Allowed days: Monday to Saturday (Du lundi au samedi). Sunday (0) is excluded!
 * If current time in Paris is < 14h00 on Mon-Sat, returns 14h00 today.
 * Otherwise advances to the next valid day (Mon-Sat) at 14h00.
 */
function getNext14hParisTimestamp(): number {
  const now = new Date();
  const parisString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisDate = new Date(parisString);

  const targetParis = new Date(parisDate);
  targetParis.setHours(14, 0, 0, 0);

  const currentDay = parisDate.getDay();
  // If today is Sunday or past 14:00, move to tomorrow
  if (currentDay === 0 || parisDate.getTime() >= targetParis.getTime()) {
    targetParis.setDate(targetParis.getDate() + 1);
  }

  // Keep advancing until day is Monday (1) through Saturday (6)
  while (targetParis.getDay() === 0) { // Sunday
    targetParis.setDate(targetParis.getDate() + 1);
  }

  const diffMs = targetParis.getTime() - parisDate.getTime();
  return now.getTime() + diffMs;
}

/**
 * Calculates epoch timestamp for next 10h00 HF (Europe/Paris timezone).
 * Allowed days: Monday to Friday (Du lundi au vendredi). Saturday (6) & Sunday (0) are excluded!
 * If current time in Paris is < 10h00 on Mon-Fri, returns 10h00 today.
 * Otherwise advances to the next valid weekday (Mon-Fri) at 10h00.
 */
function getNext10hParisTimestamp(): number {
  const now = new Date();
  const parisString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const parisDate = new Date(parisString);

  const targetParis = new Date(parisDate);
  targetParis.setHours(10, 0, 0, 0);

  const currentDay = parisDate.getDay();
  // If today is Saturday/Sunday or past 10:00, move to tomorrow
  if (currentDay === 0 || currentDay === 6 || parisDate.getTime() >= targetParis.getTime()) {
    targetParis.setDate(targetParis.getDate() + 1);
  }

  // Keep advancing until day is Monday (1) through Friday (5)
  while (targetParis.getDay() === 0 || targetParis.getDay() === 6) {
    targetParis.setDate(targetParis.getDate() + 1);
  }

  const diffMs = targetParis.getTime() - parisDate.getTime();
  return now.getTime() + diffMs;
}

/**
 * Parses a French date/time string into an epoch timestamp in Europe/Paris timezone.
 * Supports: "Demain 14:00", "Aujourd'hui 14:00", "30/08/2026 14:00", "30/08 14h", "14h00", etc.
 */
function parseFrenchDateTimeInput(inputStr: string, defaultHour: number = 14): number | null {
  if (!inputStr || !inputStr.trim()) return null;
  const raw = inputStr.trim().toLowerCase();

  const now = new Date();
  const parisString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
  const pDate = new Date(parisString);

  let targetYear = pDate.getFullYear();
  let targetMonth = pDate.getMonth();
  let targetDay = pDate.getDate();
  let targetHour = defaultHour;
  let targetMinute = 0;

  let matchedDate = false;

  if (raw.includes('demain')) {
    const nextDay = new Date(pDate);
    nextDay.setDate(nextDay.getDate() + 1);
    targetYear = nextDay.getFullYear();
    targetMonth = nextDay.getMonth();
    targetDay = nextDay.getDate();
    matchedDate = true;
  } else if (raw.includes("aujourd'hui") || raw.includes("aujourdhui") || raw.includes("ce jour")) {
    targetYear = pDate.getFullYear();
    targetMonth = pDate.getMonth();
    targetDay = pDate.getDate();
    matchedDate = true;
  }

  const dateMatch = raw.match(/(\d{1,2})[\/\-\.](?:(\d{1,2})[\/\-\.])?(\d{2,4})?/);
  if (dateMatch) {
    const isoMatch = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
      targetYear = parseInt(isoMatch[1], 10);
      targetMonth = parseInt(isoMatch[2], 10) - 1;
      targetDay = parseInt(isoMatch[3], 10);
      matchedDate = true;
    } else {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2];
      const yearStr = dateMatch[3];

      if (day >= 1 && day <= 31) {
        targetDay = day;
        if (monthStr) {
          targetMonth = parseInt(monthStr, 10) - 1;
        }
        if (yearStr) {
          targetYear = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
        }
        matchedDate = true;
      }
    }
  }

  const timeMatch = raw.match(/(\d{1,2})(?:[h:](\d{1,2}))?/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      targetHour = h;
      targetMinute = m;
    }
  }

  if (!matchedDate) {
    const checkToday = new Date(pDate);
    checkToday.setHours(targetHour, targetMinute, 0, 0);
    if (pDate.getTime() >= checkToday.getTime()) {
      checkToday.setDate(checkToday.getDate() + 1);
    }
    targetYear = checkToday.getFullYear();
    targetMonth = checkToday.getMonth();
    targetDay = checkToday.getDate();
  }

  const targetDateParis = new Date(targetYear, targetMonth, targetDay, targetHour, targetMinute, 0, 0);
  const diffMs = targetDateParis.getTime() - pDate.getTime();
  return now.getTime() + diffMs;
}

async function syncMemberRolesOnGuild(guild: any, discordUserId: string, roleIdentifiers: string[]) {
  try {
    if (!guild || !discordUserId || !roleIdentifiers || roleIdentifiers.length === 0) return;
    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) return;

    const guildRoles = await guild.roles.fetch().catch(() => guild.roles.cache);
    if (!guildRoles) return;

    for (const roleInput of roleIdentifiers) {
      if (!roleInput) continue;
      const cleanInput = String(roleInput).trim();
      if (!cleanInput) continue;

      const matchedRole = guildRoles.find(
        (r: any) =>
          r.id === cleanInput ||
          r.name.toLowerCase() === cleanInput.toLowerCase() ||
          r.name.toLowerCase() === cleanInput.replace(/^@/, '').toLowerCase()
      );

      if (matchedRole && !member.roles.cache.has(matchedRole.id)) {
        await member.roles.add(matchedRole.id).catch((err: any) =>
          console.warn(`[Bot Direct Role Add Warning] ${cleanInput} (${matchedRole.id}) to ${discordUserId}:`, err?.message || err)
        );
      }
    }
  } catch (err: any) {
    console.warn('[syncMemberRolesOnGuild Error]', err?.message || err);
  }
}

function getQuizMinScoreRequired(quiz: Quiz | undefined, totalQuestions: number = 20): number {
  if (!quiz) return Math.round(totalQuestions * 0.8);
  const val = quiz.minScore;
  if (val === undefined || val === null || val <= 0) return Math.round(totalQuestions * 0.8);
  if (val > totalQuestions) {
    if (val <= 100) {
      return Math.round((val / 100) * totalQuestions);
    }
    return totalQuestions;
  }
  return val;
}

function getMemberAccessStatusFormatted(member: Member): string {
  const modules = store.getModules();
  const validatedCount = Object.values(member.progress || {}).filter((p) => p.status === 'valide').length;

  if (modules.length > 0 && validatedCount >= modules.length) {
    return '🎓 **Parcours entièrement validé !** Félicitations, tu as terminé avec succès l\'ensemble des modules.';
  }

  const now = Date.now();

  // Cooldown Active
  if (member.cooldownUntilTimestamp && now < member.cooldownUntilTimestamp) {
    const remainingMs = member.cooldownUntilTimestamp - now;
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const tsSec = Math.floor(member.cooldownUntilTimestamp / 1000);
    return `⏳ **Cooldown Échec Quiz actif**\n*Prochaine tentative autorisée <t:${tsSec}:R> (dans ${mins}m ${secs}s)*`;
  }

  // Quiz Delay Active
  if (member.currentQuizAvailableAtTimestamp && now < member.currentQuizAvailableAtTimestamp) {
    const remainingMs = member.currentQuizAvailableAtTimestamp - now;
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const tsSec = Math.floor(member.currentQuizAvailableAtTimestamp / 1000);
    return `🔒 **Module en cours de lecture**\n*Quiz débloqué <t:${tsSec}:R> (dans ${mins}m ${secs}s)*`;
  }

  // Current Unvalidated Module
  let currentModTitle = 'Module';
  if (modules.length > 0) {
    const nextUnvalidated = modules.find((mod) => member.progress?.[mod.id]?.status !== 'valide');
    if (nextUnvalidated) {
      currentModTitle = nextUnvalidated.title;
    } else {
      currentModTitle = modules[0].title;
    }
  }

  if (member.candidateState === 'nouveau' || !member.candidateState) {
    return `📚 **Non démarré** — Rends-toi dans ton salon privé pour lancer ton parcours.`;
  }

  return `🟢 **Libre !** Tu peux lancer le quiz du **${currentModTitle}** dès maintenant.`;
}

function buildQuizButton(member: Member, quiz: Quiz | undefined, defaultTitle: string): ButtonBuilder {
  const quizId = quiz?.id || 'quiz-1';
  const now = Date.now();

  if (member.cooldownUntilTimestamp && now < member.cooldownUntilTimestamp) {
    const remainingMs = member.cooldownUntilTimestamp - now;
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return new ButtonBuilder()
      .setCustomId(`launch_quiz_${quizId}`)
      .setLabel(`⏳ Cooldown (${timeStr})`)
      .setStyle(ButtonStyle.Danger);
  }

  if (member.currentQuizAvailableAtTimestamp && now < member.currentQuizAvailableAtTimestamp) {
    const remainingMs = member.currentQuizAvailableAtTimestamp - now;
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return new ButtonBuilder()
      .setCustomId(`launch_quiz_${quizId}`)
      .setLabel(`🔒 Quiz bloqué (${timeStr})`)
      .setStyle(ButtonStyle.Secondary);
  }

  return new ButtonBuilder()
    .setCustomId(`launch_quiz_${quizId}`)
    .setLabel(`📝 Lancer le Quiz (${quiz?.title || defaultTitle})`)
    .setStyle(ButtonStyle.Success);
}

export class PawakoBotRunner {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private activeQuizSessions = new Map<string, ActiveQuizSession>();
  private activeAnthonySessions = new Map<string, ActiveAnthonySession>();
  private stoppedSimulationChannels = new Set<string>();
  private userClickTracker = new Map<string, { count: number; lastClickTime: number }>();
  private cooldownClickTracker = new Map<string, { count: number; cooldownUntil: number }>();

  private SARCASTIC_SPAM_MESSAGES = [
    "🤖 *Doucement sur les clics ! Le bouton n'a rien fait de mal et mes circuits imprimés commencent à fumer.*",
    "⚡ *Alerte mitraillage ! À ce rythme-là, tu vas démonter ton mulot avant d'avoir atteint le Module 2.*",
    "☕ *Oula, mollo le ninja du mulot ! Prends une grande inspiration et un café, les données restent bien au chaud.*",
    "🎯 *Quelle cadence de clics phénoménale ! Dommage que ça ne donne aucun point bonus pour valider le quiz.*",
    "🛑 *Keep calm ! Cliquer 50 fois la seconde ne va pas débloquer la suite plus vite, promis juré !*"
  ];

  constructor() {
    // Single instance initialization at startup
    const token = process.env.DISCORD_BOT_TOKEN;
    if (token) {
      this.initAndConnect();
    }
  }

  public async initAndConnect() {
    if (this.isConnecting || this.isConnected) return;

    const rawToken = process.env.DISCORD_BOT_TOKEN || '';
    let cleanToken = rawToken.trim().replace(/^Bot\s+/i, '').replace(/^Bearer\s+/i, '');

    if (!cleanToken) {
      console.warn('[PAWAKO BOT] ERREUR CRITIQUE : DISCORD_BOT_TOKEN absent des variables d\'environnement.');
      return;
    }

    this.isConnecting = true;
    console.log('[PAWAKO BOT] Connexion à la Gateway Discord...');

    try {
      if (this.client) {
        try {
          await this.client.destroy();
        } catch {
          // ignore
        }
        this.client = null;
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages,
        ],
        partials: [
          Partials.Channel,
          Partials.Message,
          Partials.User,
        ],
      });

      this.client.on('clientReady', () => {
        this.isConnected = true;
        this.isConnecting = false;
        const guildId = process.env.DISCORD_GUILD_ID;
        console.log(`[PAWAKO BOT] Connecté : ${this.client?.user?.tag} (Guild Filter: ${guildId || 'Tous'})`);
        store.addLog('System Bot', `Bot Discord Gateway connecté (${this.client?.user?.tag})`, 'system');

        // Sync Firestore data on bot ready
        firebaseSyncService.revalidate().catch((err) => {
          console.warn('[Pawako Bot Sync Error on Ready]', err?.message || err);
        });

        // Auto-sync candidates who completed modules on server start
        this.syncExistingFinishedCandidates().catch((err) => {
          console.warn('[Pawako Bot Candidates Sync Error]', err?.message || err);
        });

        // Start 18h00 HF scheduled stats cron
        this.startScheduledCron();
      });

      this.client.on('guildMemberAdd', async (member) => {
        const allowedGuildId = process.env.DISCORD_GUILD_ID;
        if (allowedGuildId && member.guild.id !== allowedGuildId) return;

        const cfg = onboardingService.getConfig();
        const initialRole = cfg.initialRoleId || cfg.initialRoleName;

        if (initialRole) {
          syncMemberRolesOnGuild(member.guild, member.id, [initialRole]).catch(() => {});
        }

        const cand = store.getOrCreateCandidate(member.id, member.displayName, member.user.displayAvatarURL());
        if (initialRole && !cand.roles.includes(initialRole)) {
          cand.roles.push(initialRole);
          store.saveMembers();
        }

        store.addNotification({
          level: 'information',
          title: 'Nouveau membre rejoint',
          message: `${member.displayName} a rejoint le serveur Discord. Rôle initial attribué.`,
          event: 'member_join',
          mentionAdmin: false,
        });
      });

      // Handle message commands (!help, !profile, !formation, !ticket)
      this.client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return;

        // Register candidate activity timestamp
        store.touchMemberActivity(message.author.id);

        const allowedGuildId = process.env.DISCORD_GUILD_ID;
        if (allowedGuildId && message.guild?.id && message.guild.id !== allowedGuildId) {
          return;
        }

        const content = message.content.trim();
        const branding = store.getBranding();

        if (content === '!help' || content === '!start' || content === '!pawako') {
          const cfg = onboardingService.getConfig();
          const embed = new EmbedBuilder()
            .setTitle(`🤖 ${branding.trainingName}`)
            .setDescription(cfg.welcomeRulesMessage || branding.description)
            .setColor(0x6366f1)
            .addFields(
              { name: '📚 Formation', value: 'Rends-toi dans ton salon privé pour accéder à tes cours et quiz.' },
              { name: '👤 Profil', value: 'Utilise `!profile` pour consulter ton statut.' },
              { name: '🎫 Support', value: 'Utilise `!ticket` pour ouvrir une demande d\'aide.' }
            )
            .setFooter({ text: 'PAWAKO FORMATION Bot • Connecté à la plateforme Web' });

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_formation').setLabel('📚 Ma formation').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('btn_ticket').setLabel('🎫 Mes tickets').setStyle(ButtonStyle.Secondary)
          );

          await message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        // --- COMMUNITY MANAGER & ASSISTANT COMMANDS (INDEPENDENT FROM SIMULATION) ---
        if (content === '!astuce' || content === '!hack' || content === '!conseil') {
          const tip = await communityService.getDailyTip();
          const embed = new EmbedBuilder()
            .setTitle(tip.title)
            .setDescription(tip.content)
            .setColor(0x8b5cf6)
            .setFooter({ text: '💡 Pawako Community & Chatting Coach' });
          await message.reply({ embeds: [embed] }).catch(() => {});
          return;
        }

        if (content === '!francais' || content === '!orthographe' || content === '!style') {
          const randomTip = FRENCH_CHATTING_TIPS[Math.floor(Math.random() * FRENCH_CHATTING_TIPS.length)];
          const embed = new EmbedBuilder()
            .setTitle(`✍️ Le Conseil Français & Style Chatting — ${randomTip.rule}`)
            .setDescription(
              `❌ **À éviter :** \`${randomTip.bad}\`\n\n` +
              `✅ **Formulation idéale :** \`${randomTip.good}\`\n\n` +
              `💡 **Explication du Coach :** ${randomTip.tip}`
            )
            .setColor(0x3b82f6)
            .setFooter({ text: '✍️ Pawako Orthographe & Style' });
          await message.reply({ embeds: [embed] }).catch(() => {});
          return;
        }

        if (content.startsWith('!corriger ') || content.startsWith('!reforme ')) {
          const userText = content.replace(/^!(corriger|reforme)\s+/, '').trim();
          if (!userText) {
            await message.reply('⚠️ Mets ton texte après la commande. Exemple : `!corriger Coucou sa va trop bien`').catch(() => {});
            return;
          }
          if ('sendTyping' in message.channel) await (message.channel as any).sendTyping().catch(() => {});
          const res = await communityService.correctAndEnhanceMessage(userText);
          const embed = new EmbedBuilder()
            .setTitle('✨ Correction & Reformulation Express Pawako')
            .setColor(0xec4899)
            .addFields(
              { name: '📝 Ton message brut', value: `\`${userText}\`` },
              { name: '✅ Correction orthographique', value: res.corrected },
              { name: '🔥 Formulation Séductrice & Vendeuse', value: `**${res.enhanced}**` },
              { name: '💡 Conseil du Coach', value: res.explanation }
            )
            .setFooter({ text: ' Pawako Assistant Chatting' });
          await message.reply({ embeds: [embed] }).catch(() => {});
          return;
        }

        if (
          content === '!musique' ||
          content === '!son' ||
          content === '!playlist' ||
          content.startsWith('!playlist ') ||
          content.startsWith('!musique ') ||
          content.startsWith('!son ')
        ) {
          const cfg = aiKnowledgeService.getPromptConfig();
          const availablePlaylists = (cfg.cmConfig?.playlists && cfg.cmConfig.playlists.length > 0)
            ? cfg.cmConfig.playlists
            : CURATED_PLAYLISTS;

          const query = content.replace(/^!(playlist|musique|son)\s*/i, '').toLowerCase().trim();

          if (query === 'list' || query === 'liste' || query === 'genres' || query === 'aide') {
            const listEmbed = new EmbedBuilder()
              .setTitle('🎧 SÉLECTION MUSICALE & PLAYLISTS PAWAKO')
              .setDescription(
                `Voici les ambiances de travail disponibles pour rester focus pendant tes sessions de formation et de chatting :\n\n` +
                availablePlaylists.map((p) => `• **${p.title}** ${p.genre ? `(\`${p.genre}\`)` : ''}\n  _${p.description || ''}_\n  [Écouter sur Spotify](${p.url})`).join('\n\n') +
                `\n\n💡 *Exemple d'utilisation rapide :* \`!playlist rap\`, \`!playlist lofi\`, \`!playlist house\`, \`!playlist piano\`, \`!playlist focus\`...`
              )
              .setColor(0x10b981)
              .setFooter({ text: '🎧 Pawako Focus Radio • Sélection certifiée Spotify' });

            await message.reply({ embeds: [listEmbed] }).catch(() => {});
            return;
          }

          let picked = availablePlaylists[Math.floor(Math.random() * availablePlaylists.length)];
          if (query) {
            const matches = availablePlaylists.filter(
              (p) =>
                (p.genre && p.genre.toLowerCase().includes(query)) ||
                p.title.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
            if (matches.length > 0) {
              picked = matches[Math.floor(Math.random() * matches.length)];
            }
          }

          const embed = new EmbedBuilder()
            .setTitle(picked.title)
            .setDescription(
              `${picked.description || 'Ambiance de travail sélectionnée par le Coach Pawako.'}\n\n` +
              `🎧 **Lien direct :** [Écouter la playlist sur Spotify](${picked.url})\n\n` +
              (picked.quote ? `_${picked.quote}_\n\n` : '') +
              `💡 *Astuce : Tape \`!playlist liste\` pour voir tous les styles ou \`!playlist rap\`, \`!playlist lofi\`, \`!playlist house\` pour cibler ton mood.*`
            )
            .setColor(0x10b981)
            .setFooter({ text: '🎧 Pawako Radio & Motivation • Clique sur le bouton ci-dessous' });

          const musicRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('🎧 Lancer sur Spotify')
              .setStyle(ButtonStyle.Link)
              .setURL(picked.url)
          );

          await message.reply({ embeds: [embed], components: [musicRow] }).catch(() => {});
          return;
        }

        if (content === '!jeu' || content === '!challenge' || content === '!quiz-flash') {
          if ('sendTyping' in message.channel) await (message.channel as any).sendTyping().catch(() => {});
          const game = await communityService.generateMiniGameWithAI();
          const embed = new EmbedBuilder()
            .setTitle(game.title)
            .setDescription(`**Mise en situation :**\n${game.scenario}\n\n**Propositions :**\n` + game.options.map((o) => `• ${o.label}`).join('\n'))
            .setColor(0xf59e0b)
            .setFooter({ text: '🎮 Pawako Community Game • Généré par IA • Clique sur une option !' });

          const row = new ActionRowBuilder<ButtonBuilder>();
          game.options.forEach((opt, idx) => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`cm_game_opt_${game.id}_${idx}`)
                .setLabel(opt.label.substring(0, 80))
                .setStyle(ButtonStyle.Primary)
            );
          });

          await message.reply({ embeds: [embed], components: [row] }).catch(() => {});
          return;
        }

        if (content === '!relancer' || content === '!relance-candidats') {
          if (!this.isStaffChannel(message.channel) && !message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.reply('⛔ Commande réservée au staff Pawako.').catch(() => {});
            return;
          }

          await message.reply('⏳ **Lancement des relances personnalisées pour les candidats...**').catch(() => {});
          const count = await this.triggerPersonalizedCandidateFollowups();
          await message.reply(`✅ **Relances effectuées !** ${count} candidat(s) ont reçu leur message de suivi personnalisé.`).catch(() => {});
          return;
        }

        if (content === '!cm-daily' || content === '!animation') {
          await message.reply('⏳ **Publication de la dose d\'énergie communautaire...**').catch(() => {});
          await this.publishDailyCommunityPost(message.channel as TextChannel);
          return;
        }

        // --- AUTONOMOUS AI CM LISTENING & QA (OUTSIDE ACTIVE SIMULATION) ---
        if (!this.activeAnthonySessions.has(message.channel.id) && !message.author.bot) {
          const isMentioned = this.client?.user && message.mentions.has(this.client.user.id);
          const channelName = (message.channel as any).name?.toLowerCase() || '';
          const isCommunityChannel =
            channelName.includes('general') ||
            channelName.includes('général') ||
            channelName.includes('discussion') ||
            channelName.includes('entraide') ||
            channelName.includes('questions') ||
            channelName.includes('formation');

          const cleanQuery = content.replace(/<@!?\d+>/g, '').trim();
          const isQuestion = cleanQuery.includes('?') || cleanQuery.length >= 10;
          const isHelpKeyword = /aide|question|bloqu|module|quiz|conseil|astuce|salut|bonjour|coucou|formation|comment|quand|inflow/i.test(cleanQuery);

          if (isMentioned || (isCommunityChannel && isQuestion && isHelpKeyword)) {
            if (cleanQuery) {
              if ('sendTyping' in message.channel) await (message.channel as any).sendTyping().catch(() => {});
              const reply = await communityService.answerCommunityQA(cleanQuery, message.author.username);
              await message.reply(reply).catch(() => {});
              return;
            }
          }
        }

        if (content === '!profile' || content === '!profil' || content === '!badges' || content === '!succes') {
          const m = store.getOrCreateCandidate(message.author.id, message.author.username, message.author.displayAvatarURL());
          const modules = store.getModules();
          const { member: evaluated } = badgeService.evaluateBadges(m, modules, store.getFormattedNow());
          const validatedCount = Object.values(evaluated.progress || {}).filter((p: any) => p.status === 'valide').length;

          const cooldownNoticeFriendly = getMemberAccessStatusFormatted(evaluated);

          const memberAttempts = store.getQuizAttemptsForMember(evaluated.id);
          let quizResultsFormatted = 'Aucun quiz effectué pour le moment.';
          if (memberAttempts.length > 0) {
            quizResultsFormatted = memberAttempts
              .map((att) => `• **${att.quizTitle}** : **${att.score}/20** ${att.passed ? '✅ (Validé !)' : '❌ (Échec)'}`)
              .join('\n');
          } else if (evaluated.progress && Object.keys(evaluated.progress).length > 0) {
            const entries = Object.entries(evaluated.progress);
            quizResultsFormatted = entries
              .map(([modId, prog]: [string, any]) => {
                const mod = store.getModule(modId);
                const title = mod ? mod.title : modId;
                const score20 = Math.round(((prog.score || 0) / 100) * 20);
                return `• **${title}** : **${score20}/20** ${prog.status === 'valide' ? '✅ (Validé !)' : '❌ (Échec)'}`;
              })
              .join('\n');
          }

          let badgesFormatted = 'Aucun badge débloqué pour l\'instant.\n*Progresse dans tes modules pour décrocher tes premiers succès !* 🚀';
          if (evaluated.badges && evaluated.badges.length > 0) {
            badgesFormatted = evaluated.badges
              .map((b) => `${b.emoji} **${b.title}** — _${b.description}_ (Débloqué le ${b.unlockedAt})`)
              .join('\n');
          }

          const embed = new EmbedBuilder()
            .setTitle(`🌟 Carnet de Formation & Badges — ${message.author.username}`)
            .setDescription('🎈 Bienvenue sur ton tableau de bord ! Décroche tous les badges en complétant ton parcours.')
            .setColor(0xF59E0B)
            .setThumbnail(evaluated.avatarUrl || message.author.displayAvatarURL())
            .addFields(
              { name: '👤 Candidat(e)', value: `<@${evaluated.discordId}> (**${evaluated.username}**)`, inline: true },
              { name: '🏆 Avancement du Parcours', value: `🎯 **${validatedCount} sur ${modules.length}** modules réussis avec succès !`, inline: true },
              { name: '🏅 Badges & Succès Débloqués', value: badgesFormatted, inline: false },
              { name: '📚 Relevé des Quiz', value: quizResultsFormatted, inline: false },
              { name: '⚡ Statut d\'accès', value: cooldownNoticeFriendly, inline: false }
            )
            .setFooter({ text: '🎓 PAWAKO Formation • L\'équipe est avec toi !' })
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('show_my_profile').setLabel('🔄 Actualiser').setStyle(ButtonStyle.Secondary)
          );

          if (evaluated.candidateState === 'formation_outils' || evaluated.candidateState === 'formation_terminee') {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`fill_integration_form_${evaluated.id}`)
                .setLabel("📝 Formulaire d'Intégration (Infos)")
                .setStyle(ButtonStyle.Success)
            );
          }

          await message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        if (content === '!formation') {
          const modules = store.getModules();
          const embed = new EmbedBuilder()
            .setTitle('📚 Programme de Formation PAWAKO')
            .setColor(0x6366f1)
            .setDescription(modules.map((m) => `**${m.title}**\n${m.description}`).join('\n\n'));

          await message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (content.startsWith('!valider-simu') || content.startsWith('!valider-simulation') || content.startsWith('!simu-ok') || content === '!valider') {
          const mentionedUser = message.mentions.users.first();
          const args = content.split(' ').slice(1);
          const rawId = mentionedUser ? mentionedUser.id : args[0];

          if (!rawId) {
            await message.reply('⚠️ Veuillez mentionner le candidat ou fournir son ID Discord (ex: `!valider-simu @candidat`).').catch(() => {});
            return;
          }

          let targetMember: Member | undefined = undefined;

          if (mentionedUser) {
            targetMember = store.getOrCreateCandidate(mentionedUser.id, mentionedUser.username, mentionedUser.displayAvatarURL());
          } else {
            targetMember =
              store.getMember(rawId) ||
              store.getMembers().find(
                (m) =>
                  m.id === rawId ||
                  m.discordId === rawId ||
                  m.id.replace('mem-', '') === rawId.replace('mem-', '') ||
                  m.username.toLowerCase() === rawId.toLowerCase()
              );

            if (!targetMember) {
              const fetched = await this.client?.users.fetch(rawId.replace('<@!', '').replace('<@', '').replace('>', '')).catch(() => null);
              if (fetched) {
                targetMember = store.getOrCreateCandidate(fetched.id, fetched.username, fetched.displayAvatarURL());
              }
            }
          }

          if (!targetMember) {
            await message.reply(`⚠️ Candidat non trouvé dans la base de données pour ID/mention \`${rawId}\`.`).catch(() => {});
            return;
          }

          // Force-validate all modules for candidate
          const allMods = store.getModules();
          if (!targetMember.progress) targetMember.progress = {};
          for (const mod of allMods) {
            targetMember.progress[mod.id] = {
              moduleId: mod.id,
              status: 'valide',
              score: 20,
              attemptsCount: targetMember.progress[mod.id]?.attemptsCount || 1,
              validatedAt: new Date().toLocaleString('fr-FR'),
            };
          }
          targetMember.cooldownUntilTimestamp = null;
          targetMember.currentQuizAvailableAtTimestamp = null;

          await this.validateSimulationAndTriggerToolsFormation(targetMember, message.author.id);

          const simuLogEmbed = new EmbedBuilder()
            .setTitle('🏆 LOG STAFF — VALIDATION SIMULATION')
            .setColor(0x3b82f6)
            .setDescription(
              `🏆 **Simulation validée par <@${message.author.id}> pour <@${targetMember.discordId || targetMember.id.replace('mem-', '')}> !**\n\n` +
              `Le candidat a été validé et convoqué pour la Formation Outils à 10h00 HF.`
            )
            .setFooter({ text: 'PAWAKO FORMATION • Validation Staff' })
            .setTimestamp();

          if (this.isStaffChannel(message.channel)) {
            await message.reply({ embeds: [simuLogEmbed] }).catch(() => {});
          } else {
            await message.delete().catch(() => {});
            await this.sendStaffLogNotification(simuLogEmbed);
            await message.author.send({
              content: `🏆 **[CONFIRMATION STAFF]** Simulation validée pour <@${targetMember.discordId || targetMember.id.replace('mem-', '')}>. Le log a été transmis dans le salon **#alertes-staff**.`
            }).catch(() => {});
          }
          return;
        }

        if (content === '!sync-finished' || content === '!sync-candidats' || content === '!synchro') {
          const count = await this.syncExistingFinishedCandidates();
          await message.reply(
            `🔄 **Synchronisation des candidats effectuée !**\n${count} candidat(s) ayant terminé les modules ont été pris en compte pour la simulation et la formation outils.`
          ).catch(() => {});
          return;
        }

        if (content === '!fermer-formation' || content === '!close-formation' || content === '!fin-formation') {
          const closed = await this.closeToolsVoiceChannel();
          await message.reply(
            closed
              ? `🏁 **Session de Formation Outils terminée par <@${message.author.id}> !**\nLe salon vocal temporaire a été fermé.`
              : `🏁 **Le salon vocal de formation était déjà fermé ou inexistant.**`
          ).catch(() => {});
          return;
        }

        if (
          content.startsWith('!valider-outils') ||
          content.startsWith('!valider-formation') ||
          content.startsWith('!valider-integration') ||
          content.startsWith('!valider-tout') ||
          content.startsWith('!force-valider') ||
          content.startsWith('!valider-modules') ||
          content.startsWith('!formation-ok') ||
          content.startsWith('!outils-ok')
        ) {
          const mentions = message.mentions.users;
          let targets: Member[] = [];

          if (mentions && mentions.size > 0) {
            mentions.forEach((u) => {
              const m = store.getOrCreateCandidate(u.id, u.username, u.displayAvatarURL());
              targets.push(m);
            });
          } else {
            const args = content.split(' ').slice(1).filter(Boolean);
            if (args.length > 0) {
              for (const rawId of args) {
                const cleanId = rawId.replace('<@!', '').replace('<@', '').replace('>', '');
                let m = store.getMembers().find(
                  (mb) =>
                    mb.id === cleanId ||
                    mb.discordId === cleanId ||
                    mb.id.replace('mem-', '') === cleanId.replace('mem-', '') ||
                    mb.username.toLowerCase() === cleanId.toLowerCase()
                );

                if (!m && this.client) {
                  const fetched = await this.client.users.fetch(cleanId).catch(() => null);
                  if (fetched) {
                    m = store.getOrCreateCandidate(fetched.id, fetched.username, fetched.displayAvatarURL());
                  }
                }

                if (m) targets.push(m);
              }
            }
          }

          // If no specific candidates mentioned, pick all candidates currently in state 'formation_outils' or 'simulation'
          if (targets.length === 0) {
            targets = store.getMembers().filter((m) => m.candidateState === 'formation_outils' || m.candidateState === 'simulation');
          }

          if (targets.length === 0) {
            await message.reply(
              '⚠️ **Aucun candidat spécifié.** Mentionnez un ou plusieurs candidats (ex: `!valider-formation @candidat`) pour valider immédiatement leur formation.'
            ).catch(() => {});
            return;
          }

          // Force-validate all modules for targets
          const allMods = store.getModules();
          for (const m of targets) {
            if (!m.progress) m.progress = {};
            for (const mod of allMods) {
              m.progress[mod.id] = {
                moduleId: mod.id,
                status: 'valide',
                score: 20,
                attemptsCount: m.progress[mod.id]?.attemptsCount || 1,
                validatedAt: new Date().toLocaleString('fr-FR'),
              };
            }
            m.cooldownUntilTimestamp = null;
            m.currentQuizAvailableAtTimestamp = null;
          }

          const result = await this.validateToolsFormationAndSendIntegrationForm(targets, message.author.id);

          const validatedMentions = result.validated.map((m) => `<@${m.discordId || m.id.replace('mem-', '')}>`).join(', ');

          const reportEmbed = new EmbedBuilder()
            .setTitle('🏆 VALIDATION PARCOURS COMPLET & DEMANDE D\'INTÉGRATION')
            .setColor(0x10b981)
            .setDescription(
              ` Formation validée par <@${message.author.id}> pour n'importe quel candidat (même sans modules faits) !\n\n` +
              `✅ **Candidat(s) Validé(s) (${result.validated.length}) :**\n` +
              `${validatedMentions || 'Aucun'}\n\n` +
              `*👉 Tous les modules ont été marqués 100% validés (20/20) et le formulaire d'intégration (Email, WhatsApp, Shift) a été envoyé dans leur salon privé et en MP !*`
            )
            .setFooter({ text: 'PAWAKO FORMATION • Validation Force Staff' })
            .setTimestamp();

          if (this.isStaffChannel(message.channel)) {
            await message.reply({ embeds: [reportEmbed] }).catch(() => {});
          } else {
            await message.delete().catch(() => {});
            await this.sendStaffLogNotification(reportEmbed);
            await message.author.send({
              content: `🏆 **[CONFIRMATION STAFF]** Validation Formation Outils enregistrée pour ${validatedMentions || 'candidats'}. Le log détaillé a été transmis dans le salon **#alertes-staff**.`
            }).catch(() => {});
          }
          return;
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

          await message.reply({ embeds: [embed] }).catch(() => {});
          return;
        }

        if (content.startsWith('!infos') || content.startsWith('!dossier') || content.startsWith('!candidat')) {
          const mentionedUser = message.mentions.users.first();
          const args = content.split(' ').slice(1).filter(Boolean);
          const rawId = mentionedUser ? mentionedUser.id : args[0];

          let targetMember: Member | undefined = undefined;
          if (mentionedUser) {
            targetMember = store.getMember(mentionedUser.id) || store.getMembers().find((m) => m.discordId === mentionedUser.id);
          } else if (rawId) {
            const cleanId = rawId.replace('<@!', '').replace('<@', '').replace('>', '');
            targetMember =
              store.getMember(cleanId) ||
              store.getMembers().find(
                (m) =>
                  m.id === cleanId ||
                  m.discordId === cleanId ||
                  m.id.replace('mem-', '') === cleanId.replace('mem-', '') ||
                  m.username.toLowerCase() === cleanId.toLowerCase()
              );
          } else {
            targetMember = store.getMember(message.author.id) || store.getMembers().find((m) => m.discordId === message.author.id);
          }

          if (!targetMember) {
            await message.reply('⚠️ Candidat non trouvé. Usage : `!infos @candidat` ou `!dossier <id_discord>`').catch(() => {});
            return;
          }

          const modules = store.getModules();
          const validatedCount = Object.values(targetMember.progress || {}).filter((p) => p.status === 'valide').length;

          const stateLabels: Record<string, string> = {
            nouveau: '🆕 Étape 1 : Inscription / Modules',
            bienvenue_validee: '🆕 Étape 1 : Bienvenue Validée',
            formation_commencee: '📚 Étape 1 : Modules en cours',
            module_en_cours: '📚 Étape 1 : Module en cours',
            quiz_disponible: '✏️ Étape 1 : Quiz à passer',
            cooldown_actif: '⏱️ Étape 1 : Cooldown d\'attente',
            simulation: '🎭 Étape 2 : Simulation IA',
            simulation_validee: '🎭 Étape 2 : Simulation Validée',
            formation_outils: '🛠️ Étape 3 : Formation Outils',
            formation_terminee: '🏆 Parcours Terminé / Intégré',
          };

          const dossierEmbed = new EmbedBuilder()
            .setTitle(`📋 Dossier Candidat — ${targetMember.username}`)
            .setColor(0x3b82f6)
            .setThumbnail(targetMember.avatarUrl || message.author.displayAvatarURL())
            .addFields(
              { name: '👤 Identité Discord', value: `<@${targetMember.discordId || targetMember.id.replace('mem-', '')}> (\`${targetMember.username}\`)`, inline: true },
              { name: '📍 Statut Parcours', value: `**${stateLabels[targetMember.candidateState || 'nouveau'] || targetMember.candidateState}**`, inline: true },
              { name: '🎯 Progression Modules', value: `**${validatedCount} / ${modules.length}** modules validés`, inline: true },
              { name: '📧 E-mail d\'intégration', value: targetMember.email ? `\`${targetMember.email}\`` : '❌ *Non renseigné*', inline: true },
              { name: '📱 WhatsApp', value: targetMember.whatsapp ? `\`${targetMember.whatsapp}\`` : '❌ *Non renseigné*', inline: true },
              { name: '⏰ Shift / Horaires', value: targetMember.shift ? `\`${targetMember.shift}\`` : '❌ *Non renseigné*', inline: true },
              { name: '📅 Date d\'Inscription', value: targetMember.joinedAt || 'N/A', inline: true },
              { name: '🏆 Validation Simulation', value: targetMember.simulationValidatedAt || 'Non validée', inline: true },
              { name: '✅ Validation Outils', value: targetMember.toolsFormationValidatedAt || 'Non validée', inline: true }
            )
            .setFooter({ text: 'PAWAKO FORMATION • Dossier Administrateur' })
            .setTimestamp();

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`fill_integration_form_${targetMember.id}`)
              .setLabel('📝 Formulaire d\'Intégration')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`staff_relaunch_form_${targetMember.id}`)
              .setLabel('📩 Relancer Formulaire')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`staff_reset_candidate_${targetMember.id}`)
              .setLabel('🔄 Réinitialiser Parcours')
              .setStyle(ButtonStyle.Danger)
          );

          await message.reply({ embeds: [dossierEmbed], components: [row] }).catch(() => {});
          return;
        }

        if (content.startsWith('!relancer') || content.startsWith('!rappel') || content.startsWith('!relancer-formulaire')) {
          const mentionedUser = message.mentions.users.first();
          const args = content.split(' ').slice(1).filter(Boolean);
          const rawId = mentionedUser ? mentionedUser.id : args[0];

          if (!rawId) {
            await message.reply('⚠️ Veuillez spécifier un candidat (ex: `!relancer @candidat`).').catch(() => {});
            return;
          }

          const cleanId = rawId.replace('<@!', '').replace('<@', '').replace('>', '');
          const targetMember =
            store.getMember(cleanId) ||
            store.getMembers().find(
              (m) =>
                m.id === cleanId ||
                m.discordId === cleanId ||
                m.id.replace('mem-', '') === cleanId.replace('mem-', '') ||
                m.username.toLowerCase() === cleanId.toLowerCase()
            );

          if (!targetMember) {
            await message.reply('⚠️ Candidat non trouvé dans la base de données.').catch(() => {});
            return;
          }

          await this.validateToolsFormationAndSendIntegrationForm([targetMember], message.author.id);

          const relanceEmbed = new EmbedBuilder()
            .setTitle('📩 LOG STAFF — RELANCE FORMULAIRE INTÉGRATION')
            .setColor(0x3b82f6)
            .setDescription(
              `📩 **Formulaire d'intégration relancé pour <@${targetMember.discordId || targetMember.id.replace('mem-', '')}> par <@${message.author.id}> !**\n\n` +
              `Le message avec le bouton vert a été posté dans son salon privé et envoyé en MP.`
            )
            .setFooter({ text: 'PAWAKO FORMATION • Audit Staff' })
            .setTimestamp();

          if (this.isStaffChannel(message.channel)) {
            await message.reply({ embeds: [relanceEmbed] }).catch(() => {});
          } else {
            await message.delete().catch(() => {});
            await this.sendStaffLogNotification(relanceEmbed);
            await message.author.send({
              content: `📩 **[CONFIRMATION STAFF]** Formulaire relancé avec succès pour <@${targetMember.discordId || targetMember.id.replace('mem-', '')}>.`
            }).catch(() => {});
          }
          return;
        }

        if (content.startsWith('!reset-candidat') || content.startsWith('!reinit') || content.startsWith('!reset-profil')) {
          const mentionedUser = message.mentions.users.first();
          const args = content.split(' ').slice(1).filter(Boolean);
          const rawId = mentionedUser ? mentionedUser.id : args[0];

          if (!rawId) {
            await message.reply('⚠️ Veuillez spécifier un candidat (ex: `!reset-candidat @candidat`).').catch(() => {});
            return;
          }

          const cleanId = rawId.replace('<@!', '').replace('<@', '').replace('>', '');
          const targetMember =
            store.getMember(cleanId) ||
            store.getMembers().find(
              (m) =>
                m.id === cleanId ||
                m.discordId === cleanId ||
                m.id.replace('mem-', '') === cleanId.replace('mem-', '') ||
                m.username.toLowerCase() === cleanId.toLowerCase()
            );

          if (!targetMember) {
            await message.reply('⚠️ Candidat non trouvé dans la base de données.').catch(() => {});
            return;
          }

          targetMember.candidateState = 'nouveau';
          targetMember.progress = {};
          targetMember.simulationValidatedAt = undefined;
          targetMember.toolsFormationValidatedAt = undefined;
          targetMember.cooldownUntilTimestamp = null;
          targetMember.currentQuizAvailableAtTimestamp = null;

          store.saveMembers();
          firebaseSyncService.saveMember(targetMember).catch(() => {});

          const resetEmbed = new EmbedBuilder()
            .setTitle('🔄 LOG STAFF — RÉINITIALISATION PARCOURS')
            .setColor(0xef4444)
            .setDescription(
              `🔄 **Le parcours de <@${targetMember.discordId || targetMember.id.replace('mem-', '')}> a été réinitialisé par <@${message.author.id}> !**\n\n` +
              `Tous les modules et cooldowns ont été remis à zéro. Le candidat repart de l'Étape 1.`
            )
            .setFooter({ text: 'PAWAKO FORMATION • Audit Staff' })
            .setTimestamp();

          if (this.isStaffChannel(message.channel)) {
            await message.reply({ embeds: [resetEmbed] }).catch(() => {});
          } else {
            await message.delete().catch(() => {});
            await this.sendStaffLogNotification(resetEmbed);
            await message.author.send({
              content: `🔄 **[CONFIRMATION STAFF]** Parcours réinitialisé pour <@${targetMember.discordId || targetMember.id.replace('mem-', '')}>.`
            }).catch(() => {});
          }
          return;
        }

        // --- COMMANDS TO LAUNCH ANTHONY SIMULATION DIRECTLY IN DISCORD ---
        if (
          content.startsWith('!lancer-anthony') ||
          content.startsWith('!anthony') ||
          content.startsWith('!lancer-simu') ||
          (content.startsWith('!simu') && !content.startsWith('!simu-ok')) ||
          content.startsWith('!start-anthony') ||
          content.startsWith('!start-simu')
        ) {
          const mentionedUser = message.mentions.users.first();
          const args = content.split(' ').filter(Boolean).slice(1);
          const rawId = mentionedUser ? mentionedUser.id : args[0];

          let targetMember: Member | undefined = undefined;

          if (rawId) {
            targetMember =
              store.getMember(rawId) ||
              store.getMembers().find(
                (m) =>
                  m.id === rawId ||
                  m.discordId === rawId ||
                  m.id.replace('mem-', '') === rawId.replace('mem-', '') ||
                  m.username.toLowerCase() === rawId.toLowerCase()
              );
          }

          if (!targetMember) {
            targetMember = store.getMembers().find((m) => m.personalChannelId === message.channel.id);
          }

          if (!targetMember && message.channel.isTextBased() && 'name' in message.channel) {
            const chanName = (message.channel as any).name || '';
            targetMember = store.getMembers().find((m) =>
              m.username && chanName.includes(m.username.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 15))
            );
          }

          if (!targetMember) {
            await message.reply(
              '⚠️ **Candidat non trouvé.** Mentionnez le candidat (ex: `!start-simu @candidat`) ou exécutez la commande dans son salon privé.'
            ).catch(() => {});
            return;
          }

          let targetChan: any = message.channel;
          if (targetMember.personalChannelId && this.client) {
            const pChan = await this.client.channels.fetch(targetMember.personalChannelId).catch(() => null);
            if (pChan) targetChan = pChan;
          }

          await this.startAnthonySimulationSession(targetMember, targetChan, message.author.id);

          if (targetChan.id !== message.channel.id) {
            await message.reply(
              `🚀 **Simulation lancée pour <@${targetMember.discordId || targetMember.id.replace('mem-', '')}> dans <#${targetChan.id}> !**`
            ).catch(() => {});
          }
          return;
        }

        const isEvalOrStopCmd =
          content.startsWith('!stop') ||
          content.startsWith('!fin-anthony') ||
          content.startsWith('!fin-simu') ||
          content.startsWith('!fin-simulation') ||
          content.startsWith('!eval') ||
          content.startsWith('!eval-simu') ||
          content.startsWith('!score') ||
          content.startsWith('!notes') ||
          content.startsWith('!mes-notes') ||
          content.startsWith('!arreter-simu');

        if (isEvalOrStopCmd) {
          const session = this.activeAnthonySessions.get(message.channel.id);
          if (session) {
            await message.reply('⏳ **Analyse et évaluation de la simulation par le Coach PAWAKO...**').catch(() => {});
            await this.completeAnthonySimulationSession(session, message.channel);
            return;
          } else {
            // Check if user has past simulation attempts to show their notes
            const candMember = store.getMembers().find((m) => m.discordId === message.author.id || m.personalChannelId === message.channel.id);
            if (candMember) {
              const attempts = store.getSimulationAttemptsForMember(candMember.id);
              if (attempts.length > 0) {
                const latest = attempts[attempts.length - 1];
                const criteriaText = (latest.criteria || [])
                  .map((c) => `• **${c.name}** : **${c.score}/${c.maxPoints} pts** ${c.passed ? '✅' : '❌'}\n  └ *${c.comment}*`)
                  .join('\n');

                const notesEmbed = new EmbedBuilder()
                  .setTitle(`📋 RELEVÉ DE NOTES & ÉVALUATION SIMULATION — ${candMember.username}`)
                  .setDescription(
                    `Voici le relevé de notes de ta dernière simulation IA PAWAKO :\n\n` +
                      `🎯 **NOTE GLOBALE :** **${latest.totalScore} / 100** (${latest.passed ? '✅ VALIDÉ' : '❌ NON VALIDÉ'})\n` +
                      `📅 **Date :** ${latest.timestamp}\n` +
                      `💬 **Verdict du Coach :** ${latest.globalVerdict}\n\n` +
                      `📋 **DÉTAIL DU BARÈME PAR CRITÈRE :**\n${criteriaText}`
                  )
                  .setColor(latest.passed ? 0x10b981 : 0xef4444)
                  .setFooter({ text: 'PAWAKO FORMATION • Relevé de Notes' })
                  .setTimestamp();

                await message.reply({ embeds: [notesEmbed] }).catch(() => {});
                return;
              }
            }

            await message.reply(
              'ℹ️ **Aucune simulation active dans ce salon.** Lance une simulation avec `!start-simu` pour passer ton épreuve !'
            ).catch(() => {});
            return;
          }
        }

        // --- CANDIDATE MESSAGES IN ACTIVE ANTHONY SIMULATION CHANNEL ---
        if (!content.startsWith('!')) {
          // If simulation was explicitly stopped for this channel, ignore completely
          if (this.stoppedSimulationChannels.has(message.channel.id)) {
            return;
          }

          let session = this.activeAnthonySessions.get(message.channel.id);

          // Auto-resume session if channel belongs to candidate in 'simulation' state AND channel was not explicitly stopped
          if (!session) {
            const cand = store.getMembers().find((m) => m.personalChannelId === message.channel.id && m.candidateState === 'simulation');
            if (cand) {
              session = {
                channelId: message.channel.id,
                candidateId: cand.id,
                candidateDiscordId: cand.discordId || cand.id.replace('mem-', ''),
                candidateUsername: cand.username,
                startedAt: Date.now(),
                lastCandidateMsgTimestamp: Date.now(),
                lastFanMsgTimestamp: Date.now(),
                fanProfile: createRandomFanProfile(),
                extractedInfos: { name: false, age: false, job: false, location: false, hobbies: false, fantasy: false },
                conversationHistory: [],
              };
              this.activeAnthonySessions.set(message.channel.id, session);
            }
          }

          if (session) {
            // Cancel pending inactivity relance timer
            if (session.inactivityTimer) {
              clearTimeout(session.inactivityTimer);
              session.inactivityTimer = undefined;
            }

            session.lastCandidateMsgTimestamp = Date.now();
            session.conversationHistory.push({ role: 'user', content: message.content });

            if ('sendTyping' in message.channel) {
              (message.channel as any).sendTyping().catch(() => {});
            }

            const anthonyReply = await this.generateAnthonyResponse(message.content, session);

            // Verify session wasn't stopped during AI generation
            if (
              this.stoppedSimulationChannels.has(session.channelId) ||
              !this.activeAnthonySessions.has(session.channelId)
            ) {
              console.log(`[PawakoBot] Simulation for ${session.channelId} was stopped during AI generation. Skipping reply.`);
              return;
            }

            setTimeout(async () => {
              // Re-check in timeout
              if (
                this.stoppedSimulationChannels.has(session!.channelId) ||
                !this.activeAnthonySessions.has(session!.channelId)
              ) {
                return;
              }

              session!.lastFanMsgTimestamp = Date.now();
              session!.conversationHistory.push({ role: 'assistant', content: anthonyReply });

              // --- COACH INTERVENTION DETECTION & EMBED FORMATTING ---
              const isCoachIntervention =
                anthonyReply.includes('INTERVENTION DU COACH') ||
                anthonyReply.includes('INTERVENTION COACH') ||
                anthonyReply.includes('ALERTE COACH') ||
                anthonyReply.includes('COACH PAWAKO') ||
                /\[?INTERVENTION\s*(DU)?\s*COACH/i.test(anthonyReply) ||
                /⚠️\s*\[?INTERVENTION/i.test(anthonyReply);

              if (isCoachIntervention) {
                session!.coachInterventionsCount = (session!.coachInterventionsCount || 0) + 1;
                const currentCoachCount = session!.coachInterventionsCount;

                console.log(`[PawakoBot] Alerte Coach #${currentCoachCount} pour ${session!.candidateUsername} dans ${session!.channelId}`);

                // Clean up raw text for embed description
                const cleanCoachText = anthonyReply
                  .replace(/^⚠️?\s*\[?INTERVENTION\s*(DU)?\s*COACH\s*(PAWAKO)?\]?\s*:?\s*/i, '')
                  .trim();

                const coachEmbed = new EmbedBuilder()
                  .setTitle(`⚠️ ALERTE COACH PAWAKO (Intervention n°${currentCoachCount}/5)`)
                  .setDescription(
                    `💡 **Conseil & Rappel à l'Ordre du Coach :**\n\n` +
                    `${cleanCoachText}\n\n` +
                    `⚠️ *[Attention : Au-delà de 5 interventions du Coach, la tentative de simulation sera automatiquement annulée et considérée comme un échec.]*`
                  )
                  .setColor(0xf59e0b) // Amber / Warning color
                  .setFooter({ text: `PAWAKO FORMATION • Coaching Simulation (Alerte ${currentCoachCount}/5)` })
                  .setTimestamp();

                if ('send' in message.channel) {
                  await (message.channel as any).send({
                    embeds: [coachEmbed]
                  }).catch(() => {});
                }

                // Check if candidate reached 5 or more coach interventions -> Direct Failure & Stop
                if (currentCoachCount >= 5) {
                  if (session!.inactivityTimer) {
                    clearTimeout(session!.inactivityTimer);
                    session!.inactivityTimer = undefined;
                  }
                  this.activeAnthonySessions.delete(session!.channelId);

                  const candMember =
                    store.getMember(session!.candidateId) ||
                    store.getMembers().find(
                      (m) => m.id === session!.candidateId || m.discordId === session!.candidateDiscordId
                    );

                  if (candMember) {
                    candMember.simulationAttemptsCount = (candMember.simulationAttemptsCount || 0) + 1;
                    store.saveMembers();
                    firebaseSyncService.saveMember(candMember).catch(() => {});

                    const remainingAttempts = Math.max(0, 5 - candMember.simulationAttemptsCount);

                    const failEmbed = new EmbedBuilder()
                      .setTitle('🛑 TENTATIVE DE SIMULATION ÉCHOUÉE (PLUS DE 5 ALERTES COACH)')
                      .setDescription(
                        `Désolé <@${session!.candidateDiscordId}>, ta tentative de simulation est **interrompue et non validée**.\n\n` +
                          `❌ **Raison :** Tu as accumulé **${currentCoachCount} interventions d'alerte du Coach** durant cette session (limite autorisée : 5).\n` +
                          `📊 **Tentatives de simulation :** **${candMember.simulationAttemptsCount} / 5** (${remainingAttempts} tentative(s) restante(s)).\n\n` +
                          `🔄 **QUE FAIRE MAINTENANT ?**\n` +
                          `• Tu dois **reprendre la simulation depuis le début**.\n` +
                          `• Revois bien tes leçons et la grille de validation (Qualification du fan, GFE, Teasing PPV, Bouclier+Épée).\n` +
                          `• Quand tu es prêt(e), tape **\`!start-simu\`** ou clique sur le bouton ci-dessous pour relancer ta simulation de zéro !`
                      )
                      .setColor(0xef4444)
                      .setFooter({ text: 'PAWAKO FORMATION • Échec Simulation (Limite d\'alertes coach atteinte)' })
                      .setTimestamp();

                    const retryRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                      new ButtonBuilder()
                        .setCustomId(`restart_simu_${candMember.id}`)
                        .setLabel('🔄 Recommencer la Simulation de zéro')
                        .setStyle(ButtonStyle.Danger)
                    );

                    if ('send' in message.channel) {
                      await (message.channel as any)
                        .send({
                          content: `🚨 <@${session!.candidateDiscordId}>`,
                          embeds: [failEmbed],
                          components: [retryRow],
                        })
                        .catch(() => {});
                    }

                    // Notify Staff (Mahsa & Mathieu) directly in #staff-alerts
                    await this.sendSimulationStaffAlert(candMember, session!, currentCoachCount).catch(() => {});
                  }
                  return;
                }
              } else {
                // Regular Fan message (plain text)
                const isSimulationComplete = anthonyReply.includes('[SIMULATION_COMPLETE]');
                const isSimulationFailed = anthonyReply.includes('[SIMULATION_FAILED]');
                const cleanFanReply = anthonyReply
                  .replace(/\[SIMULATION_COMPLETE\]/gi, '')
                  .replace(/\[SIMULATION_FAILED\]/gi, '')
                  .trim();

                if ('send' in message.channel && cleanFanReply) {
                  await (message.channel as any).send(cleanFanReply).catch(() => {});
                }

                if (isSimulationComplete || isSimulationFailed) {
                  await this.completeAnthonySimulationSession(session!, message.channel);
                  return;
                }
              }

              // Set 5-minute inactivity relance timer
              session!.inactivityTimer = setTimeout(async () => {
                const curSession = this.activeAnthonySessions.get(session!.channelId);
                if (!curSession) return;

                const timeSinceLastMsg = Date.now() - curSession.lastCandidateMsgTimestamp;
                if (timeSinceLastMsg >= 5 * 60 * 1000) {
                  const relancePool = [
                    'Tu m\'as oublié ? 😏',
                    'Tu es toujours là mon ange ? 😉',
                    'Dis-moi, tu es occupée ou tu réfléchis à ce qu\'on se disait ? ✨',
                    'Tu as disparu... Tu me boudes ? 😈',
                  ];
                  const relanceText = relancePool[Math.floor(Math.random() * relancePool.length)];

                  curSession.lastFanMsgTimestamp = Date.now();
                  curSession.conversationHistory.push({ role: 'assistant', content: relanceText });

                  const chan = await this.client?.channels.fetch(curSession.channelId).catch(() => null);
                  if (chan && 'send' in chan) {
                    await (chan as any).send(relanceText).catch(() => {});
                  }
                }
              }, 5 * 60 * 1000);
            }, 2000);

            return;
          }
        }

        // Auto-responder for candidate questions about bot operation
        await this.handleCandidateQuestion(message).catch(() => {});
      });

      // Handle button & modal interactions via Gateway
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        const customId = interaction.customId;
        const user = interaction.user;
        const guild = interaction.guild;

        // Register candidate activity timestamp on button/modal interaction
        store.touchMemberActivity(user.id);

        // --- HANDLER FOR CANDIDATE CLICKING "🚀 Démarrer la Simulation" OR "🔄 Recommencer la Simulation" ---
        if (interaction.isButton() && (customId.startsWith('launch_simu_') || customId.startsWith('restart_simu_'))) {
          const isRestart = customId.startsWith('restart_simu_');
          const targetId = customId.replace(isRestart ? 'restart_simu_' : 'launch_simu_', '');
          const member =
            store.getMember(targetId) ||
            store.getMembers().find((m) => m.discordId === user.id || m.id === user.id || m.id === `mem-${user.id}`);

          if (!member) {
            await interaction.reply({ content: '⚠️ Candidat introuvable dans la base de données.', flags: MessageFlags.Ephemeral }).catch(() => {});
            return;
          }

          await interaction.deferReply().catch(() => {});
          const success = await this.startAnthonySimulationSession(member, interaction.channel, user.id);
          if (success) {
            await interaction.editReply({
              content: isRestart
                ? '🚀 **Simulation réinitialisée avec succès ! C\'est parti pour cette nouvelle tentative de zéro !**'
                : '🚀 **Test de Simulation démarré avec succès ! L\'IA Fan (Anthony) vient d\'entrer dans le salon.**'
            }).catch(() => {});
          } else {
            await interaction.editReply({ content: '⚠️ Impossible de démarrer la simulation.' }).catch(() => {});
          }
          return;
        }

        // --- HANDLER FOR CANDIDATE OR STAFF CLICKING "🛑 Arrêter la Simulation" ---
        if (interaction.isButton() && customId.startsWith('stop_simu_')) {
          const chanId = interaction.channel?.id;
          if (chanId) {
            this.stoppedSimulationChannels.add(chanId);
            const session = this.activeAnthonySessions.get(chanId);
            if (session?.inactivityTimer) {
              clearTimeout(session.inactivityTimer);
              session.inactivityTimer = undefined;
            }
            this.activeAnthonySessions.delete(chanId);
          }
          await interaction.reply({
            content: '🛑 **Session de simulation arrêtée avec succès dans ce salon.**\n💡 *Le bot ne répondra plus tant qu\'une nouvelle simulation n\'est pas relancée.*',
            ephemeral: false,
          }).catch(() => {});
          return;
        }

        // --- HANDLER FOR CANDIDATE CLICKING "📝 Remplir mes Infos d'Intégration" ---
        if (interaction.isButton() && customId.startsWith('fill_integration_form')) {
          const targetId = customId.replace('fill_integration_form_', '');
          const member =
            store.getMember(targetId) ||
            store.getMembers().find((m) => m.discordId === user.id || m.id === user.id || m.id === `mem-${user.id}`);

          const modal = new ModalBuilder()
            .setCustomId(`modal_integration_form_${member ? member.id : user.id}`)
            .setTitle("Formulaire d'Intégration PAWAKO");

          const emailInput = new TextInputBuilder()
            .setCustomId('integration_email')
            .setLabel('📧 Adresse E-mail')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('exemple@gmail.com')
            .setRequired(true);

          if (member?.email) emailInput.setValue(member.email);

          const whatsappInput = new TextInputBuilder()
            .setCustomId('integration_whatsapp')
            .setLabel('📱 Numéro WhatsApp')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('+33 6 12 34 56 78')
            .setRequired(true);

          if (member?.whatsapp) whatsappInput.setValue(member.whatsapp);

          const shiftInput = new TextInputBuilder()
            .setCustomId('integration_shift')
            .setLabel('⏰ Shift / Horaires souhaités')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: Shift du soir (18h-00h), 5 jours / 7')
            .setRequired(true);

          if (member?.shift) shiftInput.setValue(member.shift);

          modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(whatsappInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(shiftInput)
          );

          await interaction.showModal(modal).catch((e) => console.warn('[ShowModal Error]', e));
          return;
        }

        // --- HANDLER FOR CANDIDATE SUBMITTING THE INTEGRATION MODAL FORM ---
        if (interaction.isModalSubmit() && customId.startsWith('modal_integration_form')) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

          const targetId = customId.replace('modal_integration_form_', '');
          const member =
            store.getMember(targetId) ||
            store.getMembers().find((m) => m.discordId === user.id || m.id === user.id || m.id === `mem-${user.id}`);

          if (!member) {
            await interaction.editReply({ content: '⚠️ Candidat introuvable dans la base de données.' }).catch(() => {});
            return;
          }

          const email = interaction.fields.getTextInputValue('integration_email').trim();
          const whatsapp = interaction.fields.getTextInputValue('integration_whatsapp').trim();
          const shift = interaction.fields.getTextInputValue('integration_shift').trim();

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            await interaction.editReply({
              content: '⚠️ **Format d\'e-mail invalide.** Veuillez renseigner une adresse e-mail valide (ex: `nom@example.com`).'
            }).catch(() => {});
            return;
          }

          const cleanPhone = whatsapp.replace(/[\s\-\+\(\)]/g, '');
          if (cleanPhone.length < 6 || !/^\d+$/.test(cleanPhone)) {
            await interaction.editReply({
              content: '⚠️ **Numéro WhatsApp invalide.** Veuillez renseigner un numéro de téléphone valide (ex: `+33 6 12 34 56 78` ou `0612345678`).'
            }).catch(() => {});
            return;
          }

          member.email = email;
          member.whatsapp = whatsapp;
          member.shift = shift;
          member.candidateState = 'formation_terminee';
          if (!member.toolsFormationValidatedAt) {
            member.toolsFormationValidatedAt = new Date().toLocaleString('fr-FR');
          }

          store.saveMembers();
          firebaseSyncService.saveMember(member).catch(() => {});

          const confirmEmbed = new EmbedBuilder()
            .setTitle("🏆 Formulaire d'Intégration Transmis avec Succès !")
            .setDescription(
              `Merci <@${user.id}> ! Tes informations d'intégration ont été enregistrées et transmises à l'équipe de Direction (@Mahsa).\n\n` +
              `• 📧 **E-mail :** \`${email}\`\n` +
              `• 📱 **WhatsApp :** \`${whatsapp}\`\n` +
              `• ⏰ **Shift :** \`${shift}\`\n\n` +
              `Félicitations pour ton parcours et bienvenue officiellement dans l'équipe PAWAKO ! 🎉`
            )
            .setColor(0x10b981)
            .setFooter({ text: 'PAWAKO FORMATION • Dossier d\'Intégration Complété' });

          await interaction.editReply({ embeds: [confirmEmbed] }).catch(() => {});

          // Send confirmation note to candidate personal channel
          if (member.personalChannelId && this.client) {
            this.client.channels.fetch(member.personalChannelId).then((chan) => {
              if (chan && 'send' in chan) {
                const publicEmbed = new EmbedBuilder()
                  .setTitle('✅ FORMULAIRE D\'INTÉGRATION COMPLÉTÉ')
                  .setDescription(
                    ` Bravo <@${user.id}> ! Tu as rempli tes coordonnées d'intégration. Le dossier a été transmis à @Mahsa.`
                  )
                  .setColor(0x10b981);
                (chan as any).send({ embeds: [publicEmbed] }).catch(() => {});
              }
            }).catch(() => {});
          }

          // Trigger automatic Staff MP & Salon Intégration notification
          await this.sendIntegrationSubmittedNotificationToStaff(member);
          return;
        }

        // Block all module/quiz execution in Direct Messages (DM) and redirect user to the Discord server
        if (!guild || interaction.channel?.isDMBased()) {
          const member = store.getMembers().find((m) => m.discordId === user.id || m.id === user.id);
          const targetGuildId = process.env.DISCORD_GUILD_ID || this.client?.guilds.cache.first()?.id || '';
          const channelUrl = (member && member.personalChannelId)
            ? `https://discord.com/channels/${targetGuildId}/${member.personalChannelId}`
            : (targetGuildId ? `https://discord.com/channels/${targetGuildId}` : 'https://discord.com');

          const redirectEmbed = new EmbedBuilder()
            .setTitle('📌 Action réservée au Serveur Discord PAWAKO')
            .setDescription(
              `Salut <@${user.id}> ! 👋\n\n` +
              `Les modules de formation, quiz et boutons interactifs ne s'exécutent pas en message privé (DM).\n` +
              `Ils doivent être lancés directement dans ton **salon privé sur le serveur PAWAKO FORMATION**.\n\n` +
              `👉 **Clique sur le bouton ci-dessous pour ouvrir ton salon sur le serveur :**`
            )
            .setColor(0x3b82f6)
            .setFooter({ text: 'PAWAKO FORMATION • Redirection vers le Serveur' });

          const redirectRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('👉 Accéder à mon salon sur le serveur')
              .setStyle(ButtonStyle.Link)
              .setURL(channelUrl)
          );

          if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({
              embeds: [redirectEmbed],
              components: [redirectRow],
            }).catch(() => {});
          } else {
            await interaction.followUp({
              embeds: [redirectEmbed],
              components: [redirectRow],
            }).catch(() => {});
          }
          return;
        }

        // Anti-spam rate limiting: detect >1 click in 3 seconds (rapid click spam)
        const now = Date.now();
        const userClickData = this.userClickTracker.get(user.id) || { count: 0, lastClickTime: 0 };
        if (now - userClickData.lastClickTime < 3000) {
          userClickData.count += 1;
        } else {
          userClickData.count = 1;
        }
        userClickData.lastClickTime = now;
        this.userClickTracker.set(user.id, userClickData);

        if (userClickData.count >= 2) {
          const cfgMsgs = onboardingService.getConfig().sarcasticSpamMessages;
          const pool = cfgMsgs && cfgMsgs.length > 0 ? cfgMsgs : this.SARCASTIC_SPAM_MESSAGES;
          const rawMsg = pool[Math.floor(Math.random() * pool.length)];

          const member = store.getMembers().find((m) => m.discordId === user.id || m.id === user.id);
          let timeRemainingText = '';
          if (member && member.cooldownUntilTimestamp && Date.now() < member.cooldownUntilTimestamp) {
            const remainingMs = member.cooldownUntilTimestamp - Date.now();
            const mins = Math.floor(remainingMs / 60000);
            const secs = Math.floor((remainingMs % 60000) / 1000);
            const tsSec = Math.floor(member.cooldownUntilTimestamp / 1000);
            timeRemainingText = `\n\n👉 **IL TE RESTE ${mins}MIN ${secs}SEC** (<t:${tsSec}:R>)`;
          }

          const sarcasticMsg = `### ${rawMsg}${timeRemainingText}`;
          if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({ content: sarcasticMsg, flags: MessageFlags.Ephemeral }).catch(() => {});
          } else {
            await interaction.followUp({ content: sarcasticMsg, flags: MessageFlags.Ephemeral }).catch(() => {});
          }
          return;
        }

        // --- COMMUNITY MANAGER MINI-GAME BUTTON INTERACTION ---
        if (interaction.isButton() && customId.startsWith('cm_game_opt_')) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          const parts = customId.split('_');
          const optIdx = parseInt(parts[parts.length - 1], 10);
          const feedback = optIdx === 1 
            ? '✅ **EXCELLENT !** C\'est exactement la bonne stratégie Pawako. Tu qualifies le fan et valorises ton offre ! 🏆'
            : '💡 **CONSEIL DU COACH :** Privilégie toujours la qualification et l\'ajout de valeur (méthode du Bouclier) au lieu d\'une baisse de prix directe ou d\'un refus sec ! 💪';

          await interaction.editReply({ content: feedback }).catch(() => {});
          return;
        }

        // --- HANDLER FOR STAFF CLICKING "📅 Reprogrammer Simu / Outils" ---
        if (interaction.isButton() && customId.startsWith('staff_reprogram_simu_')) {
          const targetId = customId.replace('staff_reprogram_simu_', '');
          const member = store.getMember(targetId) || store.getMembers().find((m) => m.discordId === targetId || m.id === targetId || m.id.replace('mem-', '') === targetId.replace('mem-', ''));

          const modal = new ModalBuilder()
            .setCustomId(`modal_reprogram_simu_${member ? member.id : targetId}`)
            .setTitle("📅 Reprogrammer la Simulation (14h00)");

          const dateInput = new TextInputBuilder()
            .setCustomId('new_date_str')
            .setLabel('Date & Heure (ex: Demain 14:00 ou 30/08 14:00)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Demain 14:00 ou 30/08/2026 14:00')
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput));
          await interaction.showModal(modal).catch((e) => console.warn('[ShowModal Resim Error]', e));
          return;
        }

        if (interaction.isButton() && customId.startsWith('staff_reprogram_tools_')) {
          const targetId = customId.replace('staff_reprogram_tools_', '');
          const member = store.getMember(targetId) || store.getMembers().find((m) => m.discordId === targetId || m.id === targetId || m.id.replace('mem-', '') === targetId.replace('mem-', ''));

          const modal = new ModalBuilder()
            .setCustomId(`modal_reprogram_tools_${member ? member.id : targetId}`)
            .setTitle("📅 Reprogrammer la Formation Outils");

          const dateInput = new TextInputBuilder()
            .setCustomId('new_date_str')
            .setLabel('Date & Heure (ex: Demain 10:00 ou 30/08 10:00)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Demain 10:00 ou 30/08/2026 10:00')
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput));
          await interaction.showModal(modal).catch((e) => console.warn('[ShowModal Reoutils Error]', e));
          return;
        }

        if (interaction.isModalSubmit() && customId.startsWith('modal_reprogram_simu_')) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          const targetId = customId.replace('modal_reprogram_simu_', '');
          const member = store.getMember(targetId) || store.getMembers().find((m) => m.id === targetId || m.discordId === targetId || m.id.replace('mem-', '') === targetId.replace('mem-', ''));
          if (!member) {
            await interaction.editReply({ content: '⚠️ Candidat introuvable dans la base de données.' }).catch(() => {});
            return;
          }

          const rawDate = interaction.fields.getTextInputValue('new_date_str');
          const ts = parseFrenchDateTimeInput(rawDate, 14);
          if (!ts) {
            await interaction.editReply({ content: '⚠️ Format de date/heure non reconnu. Exemples valides : `Demain 14:00`, `30/08/2026 14:00`, `14h00`.' }).catch(() => {});
            return;
          }

          store.rescheduleCandidateSimulation(member.id, ts, `@${user.username}`);
          firebaseSyncService.saveMember(member).catch(() => {});
          this.notifySimulationRescheduled(member, ts, `@${user.username}`).catch(() => {});

          const tsSec = Math.floor(ts / 1000);
          await interaction.editReply({
            content: `📅 **Session de Simulation reprogrammée avec succès !**\n\n• **Candidat :** <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**)\n• **Nouveau rendez-vous :** <t:${tsSec}:F> (<t:${tsSec}:R>)\n\nLe candidat a été notifié dans son salon privé Discord.`
          }).catch(() => {});
          return;
        }

        if (interaction.isModalSubmit() && customId.startsWith('modal_reprogram_tools_')) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});
          const targetId = customId.replace('modal_reprogram_tools_', '');
          const member = store.getMember(targetId) || store.getMembers().find((m) => m.id === targetId || m.discordId === targetId || m.id.replace('mem-', '') === targetId.replace('mem-', ''));
          if (!member) {
            await interaction.editReply({ content: '⚠️ Candidat introuvable dans la base de données.' }).catch(() => {});
            return;
          }

          const rawDate = interaction.fields.getTextInputValue('new_date_str');
          const ts = parseFrenchDateTimeInput(rawDate, 10);
          if (!ts) {
            await interaction.editReply({ content: '⚠️ Format de date/heure non reconnu. Exemples valides : `Demain 10:00`, `30/08/2026 10:00`, `10h00`.' }).catch(() => {});
            return;
          }

          store.rescheduleCandidateToolsFormation(member.id, ts, `@${user.username}`);
          firebaseSyncService.saveMember(member).catch(() => {});
          this.notifyToolsFormationRescheduled(member, ts, `@${user.username}`).catch(() => {});
          const tsSec = Math.floor(ts / 1000);
          await interaction.editReply({
            content: `📅 **Session Formation Outils reprogrammée avec succès !**\n\n• **Candidat :** <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**)\n• **Nouveau rendez-vous :** <t:${tsSec}:F> (<t:${tsSec}:R>)\n\nLe candidat a été notifié dans son salon privé Discord.`
          }).catch(() => {});
          return;
        }

        try {
          // Defer reply or update IMMEDIATELY (<10ms) to prevent Discord timeout errors
          const isStartOnboarding =
            customId === 'start_onboarding_process' ||
            customId.startsWith('start_onboarding') ||
            customId.startsWith('join_training');

          const isStaffAction = customId.startsWith('staff_') || customId.startsWith('show_my_profile') || customId.startsWith('btn_profile');

          if (customId.startsWith('qa:')) {
            if (!interaction.deferred && !interaction.replied) {
              await interaction.deferUpdate().catch((e) => console.warn('[DeferUpdate Warning]', e?.message || e));
            }
          } else {
            if (!interaction.deferred && !interaction.replied) {
              // Ephemeral MUST be true for start_onboarding AND staff actions so public/candidate channels aren't flooded with staff logs!
              await interaction.deferReply({ flags: (isStartOnboarding || isStaffAction) ? MessageFlags.Ephemeral : undefined }).catch((e) => console.warn('[DeferReply Warning]', e?.message || e));
            }
          }

          console.log(`[PAWAKO BOT Interaction 🔘] Button clicked: "${customId}" by @${user.username} (ID: ${user.id})`);

          // --- 1. START ONBOARDING & PERSONAL CHANNEL CREATION ---
          if (isStartOnboarding) {
            const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            member.candidateState = 'formation_commencee';
            member.lastActiveAt = store.getFormattedNow();

            const cfg = onboardingService.getConfig();

            // Assign roles configured by the admin in Onboarding settings
            const step1Cfg = cfg.stepConfigs?.[0];
            const initialRoleName = cfg.initialRoleName;
            const step1RoleOnStart = step1Cfg?.roleOnStartName;

            const configuredInitialRoles = Array.from(
              new Set([initialRoleName, step1RoleOnStart].filter(Boolean) as string[])
            );
            if (configuredInitialRoles.length > 0) {
              member.roles = Array.from(new Set([...(member.roles || []), ...configuredInitialRoles]));
            }

            const cleanName = user.username.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 20) || 'membre';
            const expectedChanName = `🔒-formation-${cleanName}`;

            let createdChannel: TextChannel | null = null;
            const guild = interaction.guild || this.client?.guilds.cache.get(process.env.DISCORD_GUILD_ID || '') || this.client?.guilds.cache.first();

            if (guild) {
              // Look for existing personal channel
              const existing = guild.channels.cache.find((c) => c.name === expectedChanName || c.id === member.personalChannelId) as TextChannel | undefined;

              if (existing) {
                createdChannel = existing;
              } else {
                try {
                  const categoryId = cfg.personalCategoryId;

                  const overwrites: any[] = [
                    {
                      id: guild.roles.everyone.id,
                      deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                      id: user.id,
                      allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                      ],
                    },
                  ];

                  if (this.client?.user?.id) {
                    overwrites.push({
                      id: this.client.user.id,
                      allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.EmbedLinks,
                      ],
                    });
                  }

                  createdChannel = await guild.channels.create({
                    name: expectedChanName,
                    type: ChannelType.GuildText,
                    parent: categoryId || undefined,
                    topic: `Salon privé de formation pour @${user.username} (${user.id})`,
                    permissionOverwrites: overwrites,
                  });
                } catch (chanErr: any) {
                  console.warn('[Create Channel Discord.js Error]', chanErr?.message || chanErr);
                }
              }
            }

            if (createdChannel) {
              member.personalChannelId = createdChannel.id;
              member.personalChannelName = createdChannel.name;
            }

            // Setup Module 1 & Quiz availability
            const mod1 = store.getModules()[0];
            const quiz1 = mod1 ? store.getQuiz(mod1.quizId || '') || store.getQuizzes()[0] : store.getQuizzes()[0];
            const delayMins = quiz1?.delayMinutesBeforeQuiz ?? cfg.stepConfigs?.[0]?.delayMinutesBeforeQuiz ?? 0;
            member.currentQuizAvailableAtTimestamp = delayMins > 0 ? Date.now() + delayMins * 60 * 1000 : 0;

            store.saveMembers();
            firebaseSyncService.saveMember(member).catch(() => {});

            // Assign Discord roles directly on Guild and via API
            if (guild) {
              syncMemberRolesOnGuild(guild, user.id, member.roles).catch(() => {});
            }
            discordService.assignDiscordRolesToMember(user.id, member.roles).catch((roleErr) => {
              console.warn('[Onboarding Role Assignment Warning]', roleErr?.message || roleErr);
            });

            // Send Welcome message with "Lancer la formation" button in personal channel
            if (createdChannel) {
              const startBtnLabel = cfg.startTrainingButtonLabel || '🚀 Lancer la formation';
              const welcomeEmbed = new EmbedBuilder()
                .setTitle(`👋 Content de te voir, ${user.username} !`)
                .setDescription(
                  `Bienvenue dans ton espace de formation privé.\n\nPour accéder aux consignes et démarrer ta formation, clique sur le bouton ci-dessous :`
                )
                .setColor(0x6366f1)
                .setFooter({ text: 'PAWAKO FORMATION • Accès Privé' });

              const welcomeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId('start_training_module_1')
                  .setLabel(startBtnLabel)
                  .setStyle(ButtonStyle.Success)
              );

              await createdChannel
                .send({
                  content: `👋 Bienvenue <@${user.id}> dans ton salon privé de formation !`,
                  embeds: [welcomeEmbed],
                  components: [welcomeRow],
                })
                .catch((msgErr) => console.warn('[Post Welcome Msg Error]', msgErr));
            }

            const confirmMsg = createdChannel
              ? `🎓 **Onboarding Démarré !** Bienvenue <@${user.id}>. Ton salon de formation privé **<#${createdChannel.id}>** a été créé ! Rends-toi dedans et clique sur **"${cfg.startTrainingButtonLabel || '🚀 Lancer la formation'}"** pour débuter.`
              : `🎓 **Onboarding Démarré !** Bienvenue <@${user.id}> dans votre parcours de formation. Ton salon privé **#${expectedChanName}** est en cours d'attribution.`;

            await interaction.editReply({ content: confirmMsg });
            return;
          }

          // --- 1b. LAUNCH TRAINING (INSIDE PERSONAL CHANNEL) ---
          if (customId === 'start_training_module_1' || customId.startsWith('start_training')) {
            if (store.getModules().length === 0) {
              await firebaseSyncService.revalidate().catch(() => {});
            }

            const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            member.candidateState = 'formation_commencee';
            member.lastActiveAt = store.getFormattedNow();

            const cfg = onboardingService.getConfig();

            // Setup Module 1 & Step Config
            const mod1 = store.getModules()[0] || defaultModules[0];
            if (!mod1) {
              await interaction.editReply({
                content: '⚠️ Aucun module n\'est encore configuré par l\'administrateur sur cette plateforme.',
              });
              return;
            }

            const step1Cfg = onboardingService.getStepConfigForModule(mod1.id);
            const initialRoleName = cfg.initialRoleName;
            const initialRoleId = cfg.initialRoleId;
            const step1RoleOnStartName = step1Cfg?.roleOnStartName;
            const step1RoleOnStartId = step1Cfg?.roleOnStartId;

            const configuredInitialRoles = Array.from(
              new Set([initialRoleName, initialRoleId, step1RoleOnStartName, step1RoleOnStartId].filter(Boolean) as string[])
            );
            if (configuredInitialRoles.length > 0) {
              member.roles = Array.from(new Set([...(member.roles || []), ...configuredInitialRoles]));
            }

            const quiz1 = store.getQuiz(mod1.quizId || '') || store.getQuizzes().find((q) => q.moduleId === mod1.id) || store.getQuizzes()[0] || defaultQuizzes[0];
            const delayMins = quiz1?.delayMinutesBeforeQuiz ?? step1Cfg?.delayMinutesBeforeQuiz ?? 0;
            member.currentQuizAvailableAtTimestamp = delayMins > 0 ? Date.now() + delayMins * 60 * 1000 : 0;

            store.saveMembers();
            firebaseSyncService.saveMember(member).catch(() => {});

            // Trigger Discord API role assignment and live Guild member role update
            if (guild) {
              syncMemberRolesOnGuild(guild, user.id, member.roles).catch(() => {});
            }
            discordService.assignDiscordRolesToMember(user.id, member.roles).catch((roleErr) => {
              console.warn('[Onboarding Role Assignment Warning]', roleErr?.message || roleErr);
            });

            const externalLink = step1Cfg?.externalLinkUrl || mod1.url || (mod1.resources && mod1.resources[0]?.url);
            const brandingName = store.getBranding().trainingName || 'Espace de Formation';

            const delayNotice = delayMins > 0
              ? `\n\n⏱️ **Information Quiz** : Le quiz de ce module sera débloqué dans **${delayMins} minute(s)** dans ce salon !`
              : `\n\n⏱️ **Information Quiz** : Le quiz est débloqué et disponible immédiatement ci-dessous !`;

            const linkNotice = externalLink
              ? `\n\n🔗 **Support / Document de cours** :\n👉 [Clique ici pour accéder au support de formation](${externalLink})`
              : '';

            const modEmbed = new EmbedBuilder()
              .setTitle(`📚 ${mod1.title}`)
              .setDescription(`${mod1.content}${linkNotice}${delayNotice}`)
              .setColor(0x6366f1)
              .setFooter({ text: `${brandingName} • Parcours Individuel` })
              .setTimestamp();

            const actionButtons: ButtonBuilder[] = [];
            if (externalLink) {
              actionButtons.push(
                new ButtonBuilder()
                  .setLabel('🔗 Support / Lien de Cours')
                  .setStyle(ButtonStyle.Link)
                  .setURL(externalLink)
              );
            }
            actionButtons.push(
              buildQuizButton(member, quiz1, mod1.title),
              new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
            );

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(actionButtons);

            await interaction.editReply({
              content: `🚀 **Formation Lancée !** Ton espace de formation est prêt. Voici ton premier module :`,
              embeds: [modEmbed],
              components: [row],
            });
            return;
          }

          // --- 2. CANDIDATE PROFILE ---
          if (customId === 'btn_profile' || customId === 'show_my_profile' || customId === 'refresh_profile') {
            // Find target candidate for this channel if viewed in a personal channel
            let targetMember: Member | undefined = store.getMembers().find(
              (m) => m.personalChannelId === interaction.channelId
            );

            if (!targetMember && interaction.channel && 'name' in interaction.channel) {
              const chanName = (interaction.channel as TextChannel).name;
              targetMember = store.getMembers().find(
                (m) =>
                  m.personalChannelName === chanName ||
                  (chanName.startsWith('🔒-formation-') &&
                    m.username &&
                    chanName.includes(m.username.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 15)))
              );
            }

            const member = targetMember || store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            const modules = store.getModules();
            const validatedCount = Object.values(member.progress || {}).filter((p) => p.status === 'valide').length;

            const cooldownNoticeFriendly = getMemberAccessStatusFormatted(member);

            const isStaffViewer = user.id !== member.discordId && user.id !== member.id.replace('mem-', '');

            const memberAttempts = store.getQuizAttemptsForMember(member.id);
            let quizResultsFormatted = 'Aucun quiz effectué pour le moment.';
            if (memberAttempts.length > 0) {
              quizResultsFormatted = memberAttempts
                .map((att) => `• **${att.quizTitle}** : **${att.score}/20** ${att.passed ? '✅ (Validé !)' : '❌ (Échec)'}`)
                .join('\n');
            } else if (member.progress && Object.keys(member.progress).length > 0) {
              const entries = Object.entries(member.progress);
              quizResultsFormatted = entries
                .map(([modId, prog]: [string, any]) => {
                  const mod = store.getModule(modId);
                  const title = mod ? mod.title : modId;
                  const score20 = Math.round(((prog.score || 0) / 100) * 20);
                  return `• **${title}** : **${score20}/20** ${prog.status === 'valide' ? '✅ (Validé !)' : '❌ (Échec)'}`;
                })
                .join('\n');
            }

            const { member: evaluated } = badgeService.evaluateBadges(member, modules, store.getFormattedNow());

            let badgesFormatted = 'Aucun badge débloqué pour l\'instant.\n*Progresse dans tes modules pour décrocher tes premiers succès !* 🚀';
            if (evaluated.badges && evaluated.badges.length > 0) {
              badgesFormatted = evaluated.badges
                .map((b) => `${b.emoji} **${b.title}** — _${b.description}_ (Débloqué le ${b.unlockedAt})`)
                .join('\n');
            }

            const embed = new EmbedBuilder()
              .setTitle(`🌟 Carnet de Formation & Badges — ${evaluated.username}`)
              .setDescription('🎈 Bienvenue sur ton tableau de bord ! Décroche tous les badges en complétant ton parcours.')
              .setColor(0xF59E0B)
              .setThumbnail(evaluated.avatarUrl || user.displayAvatarURL())
              .addFields(
                { name: '👤 Candidat(e)', value: `<@${evaluated.discordId || evaluated.id.replace('mem-', '')}> (**${evaluated.username}**)`, inline: true },
                { name: '🏆 Avancement du Parcours', value: `🎯 **${validatedCount} sur ${modules.length}** modules réussis avec succès !`, inline: true },
                { name: '🏅 Badges & Succès Débloqués', value: badgesFormatted, inline: false },
                { name: '📚 Relevé des Quiz', value: quizResultsFormatted, inline: false },
                { name: '⚡ Statut d\'accès', value: cooldownNoticeFriendly, inline: false }
              )
              .setFooter({
                text: isStaffViewer
                  ? `PAWAKO FORMATION • Consulté par le staff @${user.username}`
                  : '🎓 PAWAKO Formation • L\'équipe est avec toi !',
              })
              .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId('show_my_profile').setLabel('🔄 Actualiser le profil').setStyle(ButtonStyle.Secondary)
            );

            if (member.candidateState === 'formation_outils' || member.candidateState === 'formation_terminee') {
              row.addComponents(
                new ButtonBuilder()
                  .setCustomId(`fill_integration_form_${member.id}`)
                  .setLabel("📝 Formulaire d'Intégration (Infos)")
                  .setStyle(ButtonStyle.Success)
              );
            }

            if (isStaffViewer) {
              if (member.candidateState === 'simulation') {
                row.addComponents(
                  new ButtonBuilder()
                    .setCustomId(`staff_validate_simu_${member.id}`)
                    .setLabel('🏆 Valider Simulation')
                    .setStyle(ButtonStyle.Success)
                );
              } else if (member.candidateState === 'formation_outils') {
                row.addComponents(
                  new ButtonBuilder()
                    .setCustomId(`staff_validate_tools_${member.id}`)
                    .setLabel('✅ Valider Formation Outils')
                    .setStyle(ButtonStyle.Primary)
                );
              }
            }

            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
          }

          // --- 2b. STAFF ALERT INTERACTIONS ---
          if (customId.startsWith('staff_reset_cooldown_')) {
            const targetId = customId.replace('staff_reset_cooldown_', '');
            const member =
              store.getMember(targetId) ||
              store.getMembers().find(
                (m) =>
                  m.id === targetId ||
                  m.discordId === targetId ||
                  m.id.replace('mem-', '') === targetId.replace('mem-', '') ||
                  (m.discordId && m.discordId.replace('mem-', '') === targetId.replace('mem-', ''))
              );

            if (!member) {
              await interaction.editReply({ content: '⚠️ Candidat non trouvé dans la base de données.' });
              return;
            }

            store.resetCandidateCooldown(member.id);
            firebaseSyncService.saveMember(member).catch(() => {});

            let chan: any = null;
            if (member.personalChannelId) {
              chan = await this.client.channels.fetch(member.personalChannelId).catch(() => null);
            }
            if (!chan && guild) {
              chan = guild.channels.cache.find(
                (c: any) =>
                  c.isTextBased() &&
                  (c.name === member.personalChannelName ||
                    (member.username && c.name.includes(member.username.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 15))))
              );
            }

            if (chan && 'send' in chan) {
              try {
                const mod = store.getModule(member.currentModuleId || '') || store.getModules()[0];
                const quiz = store.getQuiz(mod?.quizId || mod?.id || '') || store.getQuiz('quiz-1') || defaultQuizzes[0];
                const notifyEmbed = new EmbedBuilder()
                  .setTitle('🔓 COOLDOWN ANNULÉ PAR LE STAFF')
                  .setDescription(`Un formateur de l'équipe (<@${user.id}>) vient d'annuler ton délai d'attente !\nTu peux repasser ton quiz **immédiatement**.`)
                  .setColor(0x10b981)
                  .setFooter({ text: 'PAWAKO FORMATION • Déblocage Rapide Staff' });

                const retryRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                  buildQuizButton(member, quiz, mod?.title || 'Quiz'),
                  new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
                );

                await (chan as any).send({
                  content: `🔓 <@${member.discordId || member.id.replace('mem-', '')}>`,
                  embeds: [notifyEmbed],
                  components: [retryRow],
                }).catch((e: any) => console.warn('[Send Reset Cooldown Error]', e));
              } catch (e) {}
            }

            await interaction.editReply({
              content: `✅ **Cooldown immédiatement levé pour <@${member.discordId || member.id.replace('mem-', '')}> !**\nLe candidat a été notifié dans son salon privé.`
            });
            return;
          }

          if (customId.startsWith('staff_encourage_member_')) {
            const targetId = customId.replace('staff_encourage_member_', '');
            const member =
              store.getMember(targetId) ||
              store.getMembers().find(
                (m) =>
                  m.id === targetId ||
                  m.discordId === targetId ||
                  m.id.replace('mem-', '') === targetId.replace('mem-', '') ||
                  (m.discordId && m.discordId.replace('mem-', '') === targetId.replace('mem-', ''))
              );

            if (!member) {
              await interaction.editReply({ content: '⚠️ Candidat non trouvé dans la base de données.' });
              return;
            }

            let chan: any = null;
            if (member.personalChannelId) {
              chan = await this.client.channels.fetch(member.personalChannelId).catch(() => null);
            }
            if (!chan && guild) {
              chan = guild.channels.cache.find(
                (c: any) =>
                  c.isTextBased() &&
                  (c.name === member.personalChannelName ||
                    (member.username && c.name.includes(member.username.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 15))))
              );
            }

            if (chan && 'send' in chan) {
              try {
                const encourageEmbed = new EmbedBuilder()
                  .setTitle('💬 MESSAGE D\'AIDE DE L\'ÉQUIPE STAFF')
                  .setDescription(
                    `Bonjour <@${member.discordId || member.id.replace('mem-', '')}> !\n\n` +
                    `Un formateur du Staff (<@${user.id}>) a remarqué que tu rencontrais des difficultés sur ton module actuel.\n\n` +
                    `💪 **Pas de panique !** L'équipe est là pour t'accompagner. N'hésite pas à poser tes questions directement ici pour débloquer la situation.`
                  )
                  .setColor(0x3b82f6)
                  .setFooter({ text: 'PAWAKO FORMATION • Support Candidat' })
                  .setTimestamp();

                await (chan as any).send({
                  content: `💬 <@${member.discordId || member.id.replace('mem-', '')}>`,
                  embeds: [encourageEmbed],
                }).catch((e: any) => console.warn('[Send Encourage Error]', e));
              } catch (e) {}
            }

            await interaction.editReply({
              content: `💬 **Message d'aide et d'encouragement envoyé avec succès dans le salon privé de <@${member.discordId || member.id.replace('mem-', '')}> !**`
            });
            return;
          }

          if (customId.startsWith('staff_validate_simu_')) {
            const targetId = customId.replace('staff_validate_simu_', '');
            const member =
              store.getMember(targetId) ||
              store.getMembers().find(
                (m) =>
                  m.id === targetId ||
                  m.discordId === targetId ||
                  m.id.replace('mem-', '') === targetId.replace('mem-', '') ||
                  (m.discordId && m.discordId.replace('mem-', '') === targetId.replace('mem-', ''))
              );

            if (!member) {
              await interaction.editReply({ content: '⚠️ Candidat non trouvé dans la base de données.' });
              return;
            }

            await this.validateSimulationAndTriggerToolsFormation(member, user.id);

            await interaction.editReply({
              content: `🏆 **Simulation validée avec succès pour <@${member.discordId || member.id.replace('mem-', '')}> par <@${user.id}> !**\nLe candidat a été convoqué pour la Formation Outils à 10h00 HF, et la notification a été transmise au Staff.`
            });
            return;
          }

          if (customId.startsWith('staff_validate_tools_')) {
            const targetId = customId.replace('staff_validate_tools_', '');
            const member =
              store.getMember(targetId) ||
              store.getMembers().find(
                (m) =>
                  m.id === targetId ||
                  m.discordId === targetId ||
                  m.id.replace('mem-', '') === targetId.replace('mem-', '') ||
                  (m.discordId && m.discordId.replace('mem-', '') === targetId.replace('mem-', ''))
              );

            if (!member) {
              await interaction.editReply({ content: '⚠️ Candidat non trouvé dans la base de données.' });
              return;
            }

            const result = await this.validateToolsFormationAndSendIntegrationForm([member], user.id);

            await interaction.editReply({
              content: `🏆 **Formation Outils validée avec succès pour <@${member.discordId || member.id.replace('mem-', '')}> par <@${user.id}> !**\nLe formulaire d'intégration (E-mail, WhatsApp, Shift) lui a été envoyé dans son salon privé et en MP.`
            });
            return;
          }

          if (customId.startsWith('staff_relaunch_form_')) {
            const targetId = customId.replace('staff_relaunch_form_', '');
            const member =
              store.getMember(targetId) ||
              store.getMembers().find(
                (m) =>
                  m.id === targetId ||
                  m.discordId === targetId ||
                  m.id.replace('mem-', '') === targetId.replace('mem-', '') ||
                  (m.discordId && m.discordId.replace('mem-', '') === targetId.replace('mem-', ''))
              );

            if (!member) {
              await interaction.editReply({ content: '⚠️ Candidat non trouvé dans la base de données.' });
              return;
            }

            await this.validateToolsFormationAndSendIntegrationForm([member], user.id);
            await interaction.editReply({
              content: `📩 **Formulaire d'intégration relancé avec succès pour <@${member.discordId || member.id.replace('mem-', '')}> !**`
            });
            return;
          }

          if (customId.startsWith('staff_reset_candidate_')) {
            const targetId = customId.replace('staff_reset_candidate_', '');
            const member =
              store.getMember(targetId) ||
              store.getMembers().find(
                (m) =>
                  m.id === targetId ||
                  m.discordId === targetId ||
                  m.id.replace('mem-', '') === targetId.replace('mem-', '') ||
                  (m.discordId && m.discordId.replace('mem-', '') === targetId.replace('mem-', ''))
              );

            if (!member) {
              await interaction.editReply({ content: '⚠️ Candidat non trouvé dans la base de données.' });
              return;
            }

            member.candidateState = 'nouveau';
            member.progress = {};
            member.simulationValidatedAt = undefined;
            member.toolsFormationValidatedAt = undefined;
            member.cooldownUntilTimestamp = null;
            member.currentQuizAvailableAtTimestamp = null;

            store.saveMembers();
            firebaseSyncService.saveMember(member).catch(() => {});

            await interaction.editReply({
              content: `🔄 **Le parcours de <@${member.discordId || member.id.replace('mem-', '')}> a été réinitialisé !**`
            });
            return;
          }

          if (customId === 'staff_close_voice_session' || customId.startsWith('staff_close_voice_session')) {
            const closed = await this.closeToolsVoiceChannel();
            await interaction.editReply({
              content: closed
                ? `🏁 **Session de Formation Outils terminée par <@${user.id}> !**\nLe salon vocal d'accès temporaire a été fermé et les accès des candidats révoqués.`
                : `🏁 **Session terminée.** Le salon vocal n'était plus actif.`,
            });
            return;
          }

          // --- 3. LAUNCH OR RETRY QUIZ ---
          if (customId.startsWith('launch_quiz') || customId.startsWith('retry_quiz')) {
            const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            member.lastActiveAt = store.getFormattedNow();

            const rawQuizId = customId.replace('launch_quiz_', '').replace('retry_quiz_', '');
            let quiz = store.getQuiz(rawQuizId);
            if (!quiz && member.currentModuleId) {
              quiz = store.getQuiz(member.currentModuleId);
            }
            if (!quiz) {
              quiz = store.getQuiz('quiz-1') || defaultQuizzes[0];
            }

            // 3a. Cooldown Check
            if (member.cooldownUntilTimestamp && Date.now() < member.cooldownUntilTimestamp) {
              const remainingMs = member.cooldownUntilTimestamp - Date.now();
              const mins = Math.floor(remainingMs / 60000);
              const secs = Math.floor((remainingMs % 60000) / 1000);
              const tsSec = Math.floor(member.cooldownUntilTimestamp / 1000);

              // Track clicks specifically during this active cooldown
              const existingTrack = this.cooldownClickTracker.get(user.id);
              let cooldownClicks = 1;
              if (existingTrack && existingTrack.cooldownUntil === member.cooldownUntilTimestamp) {
                cooldownClicks = existingTrack.count + 1;
              }
              this.cooldownClickTracker.set(user.id, {
                count: cooldownClicks,
                cooldownUntil: member.cooldownUntilTimestamp
              });

              const requiredMin = getQuizMinScoreRequired(quiz, 20);

              // 1st click during active cooldown: Standard official informative notice
              if (cooldownClicks === 1) {
                const cooldownEmbed = new EmbedBuilder()
                  .setTitle('❌ Quiz Indisponible - Cooldown Actif')
                  .setDescription(
                    `Tu n'as pas obtenu le score nécessaire (minimum **${requiredMin}/20**) lors de ton dernier essai.\n\n` +
                    `⏳ **IL TE RESTE ${mins}MIN ${secs}SEC** (<t:${tsSec}:R>)\n\n` +
                    `💡 *Prends ce temps d'attente obligatoire pour relire ton support de cours et consolider tes connaissances !*`
                  )
                  .addFields({ name: '⏱️ Déblocage Automatique', value: `**Il te reste ${mins}min ${secs}sec** (<t:${tsSec}:R>)` })
                  .setColor(0xef4444)
                  .setFooter({ text: 'PAWAKO FORMATION • Cooldown Actif & Révisions Recommandées' });

                const cooldownRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                  buildQuizButton(member, quiz, quiz?.title || 'Quiz'),
                  new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ embeds: [cooldownEmbed], components: [cooldownRow] });
                return;
              }

              // 2nd click and beyond (insisting / clicking repeatedly during cooldown): Sarcastic message in BIG/BOLD text followed by "IL TE RESTE XMIN YSEC"!
              const cfg = onboardingService.getConfig();
              const spamPool = cfg.cooldownSpamPool && cfg.cooldownSpamPool.length > 0
                ? cfg.cooldownSpamPool
                : (cfg.sarcasticSpamMessages && cfg.sarcasticSpamMessages.length > 0
                    ? cfg.sarcasticSpamMessages
                    : this.SARCASTIC_SPAM_MESSAGES);

              const rawSarcastic = spamPool.length > 0
                ? spamPool[Math.floor(Math.random() * spamPool.length)]
                : "🤖 *Woah, doucement sur le bouton <@{discordId}> ! Le cooldown est actif, repasse <t:{tsSec}:R> !*";

              const formattedSarcastic = rawSarcastic
                .replace(/\{discordId\}/g, member.discordId || user.id)
                .replace(/\{tsSec\}/g, String(tsSec))
                .replace(/\{mins\}/g, String(mins))
                .replace(/\{secs\}/g, String(secs))
                .replace(/\{username\}/g, member.username);

              const sarcasticEmbed = new EmbedBuilder()
                .setTitle('🤖 ALERTE SARCASME — TENTATIVES RÉPÉTÉES EN COOLDOWN')
                .setDescription(
                  `### ${formattedSarcastic}\n\n` +
                  `👉 **IL TE RESTE ${mins}MIN ${secs}SEC** (<t:${tsSec}:R>)\n\n` +
                  `📊 **Statut du quiz :**\n` +
                  `• Score minimum requis : **${requiredMin}/20**`
                )
                .addFields({ name: '⏳ Temps d\'attente obligatoire', value: `**Il te reste ${mins}min ${secs}sec** (<t:${tsSec}:R>)` })
                .setColor(0xf59e0b)
                .setFooter({ text: 'PAWAKO FORMATION • Système Anti-Spam Cooldown' });

              const cooldownRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                buildQuizButton(member, quiz, quiz?.title || 'Quiz'),
                new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
              );

              await interaction.editReply({ embeds: [sarcasticEmbed], components: [cooldownRow] });
              return;
            }

            // 3b. Quiz Delay Check
            if (member.currentQuizAvailableAtTimestamp && Date.now() < member.currentQuizAvailableAtTimestamp) {
              const remainingMs = member.currentQuizAvailableAtTimestamp - Date.now();
              const mins = Math.floor(remainingMs / 60000);
              const secs = Math.floor((remainingMs % 60000) / 1000);
              const tsSec = Math.floor(member.currentQuizAvailableAtTimestamp / 1000);

              const delayEmbed = new EmbedBuilder()
                .setTitle('⏳ Quiz en Préparation')
                .setDescription(`Le quiz **${quiz?.title}** n'est pas encore débloqué.\n\nIl sera disponible <t:${tsSec}:R> (dans **${mins} minute(s) ${secs} seconde(s)**). N'hésite pas à relire les supports de cours.`)
                .addFields({ name: '⏱️ Déblocage Automatique', value: `<t:${tsSec}:R> (**${mins}m ${secs}s** restantes)` })
                .setColor(0xf59e0b)
                .setFooter({ text: 'PAWAKO FORMATION • Temps de lecture recommandé' });

              const delayRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                buildQuizButton(member, quiz, quiz?.title || 'Quiz'),
                new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
              );

              await interaction.editReply({ embeds: [delayEmbed], components: [delayRow] });
              return;
            }

            // 3c. Pull and shuffle questions from question bank
            const sampleCount = (quiz?.sampleSize && quiz.sampleSize > 0) ? quiz.sampleSize : 20;
            const shuffledQuestions = store.getRandomQuizQuestions(quiz?.id || 'quiz-1', sampleCount);

            // Log activity: candidate launches quiz
            store.addLog(
              user.username,
              `[QUIZ_START] A démarré le ${quiz.title} (${shuffledQuestions.length} questions tirées au sort)`,
              'quiz',
              user.username,
              quiz.title,
              quiz.moduleId
            );

            // Create Quiz Attempt Session
            const attemptId = `att_${user.id}_${quiz.id}_${Date.now()}`;
            const session: ActiveQuizSession = {
              attemptId,
              discordUserId: user.id,
              quizId: quiz.id,
              quizTitle: quiz.title,
              moduleId: quiz.moduleId,
              questions: shuffledQuestions,
              currentIndex: 0,
              userAnswers: [],
              score: 0,
              startedAt: Date.now(),
            };

            this.activeQuizSessions.set(attemptId, session);

            // Display Question 1 with 15-second per-question timer
            await this.renderQuizQuestion(session, interaction);
            return;
          }

          // --- 4. ANSWER QUIZ QUESTION (ONE AT A TIME WITH 15S TIMER) ---
          if (customId.startsWith('qa:')) {
            const parts = customId.split(':');
            const attemptId = parts[1];
            const qIndexStr = parts[2];
            const optIndexStr = parts[3];

            const session = this.activeQuizSessions.get(attemptId);

            if (!session) {
              await interaction.followUp({
                content: '⚠️ Cette session de quiz n\'existe plus ou a expiré. Veuillez relancer le quiz.',
              }).catch(() => {});
              return;
            }

            // Clear active 15s question timer since candidate answered
            if (session.questionTimer) {
              clearTimeout(session.questionTimer);
              session.questionTimer = undefined;
            }

            // Security check: candidate user ID match
            if (interaction.user.id !== session.discordUserId) {
              await interaction.followUp({
                content: '❌ Seul le candidat ayant démarré ce quiz peut répondre à ces questions !',
              }).catch(() => {});
              return;
            }

            const targetIndex = parseInt(qIndexStr, 10);
            const chosenOptionIndex = parseInt(optIndexStr, 10);

            // Prevent double click on already answered question
            if (targetIndex !== session.currentIndex) {
              return;
            }

            // Record answer
            session.userAnswers.push(chosenOptionIndex);
            const currentQ = session.questions[targetIndex];

            if (chosenOptionIndex === currentQ.correctAnswer) {
              session.score += 1;
            }

            session.currentIndex += 1;

            // Render next question (or finish if last question) with 15s timer
            await this.renderQuizQuestion(session, interaction);
            return;
          }

          // --- 5. START / CONTINUE MODULE ---
          if (customId.startsWith('start_module') || customId.startsWith('launch_module')) {
            const modId = customId.replace('start_module_', '').replace('launch_module_', '');
            const mod = store.getModule(modId) || store.getModules().find((m) => m.id === modId) || store.getModules()[0];

            if (!mod) {
              await interaction.editReply({ content: '⚠️ Ce module n\'existe pas ou a été retiré.' });
              return;
            }

            const quiz = store.getQuiz(mod.quizId || mod.id) || store.getQuiz(mod.id);
            const stepCfg = onboardingService.getStepConfigForModule(mod.id);
            const delayMins = quiz?.delayMinutesBeforeQuiz ?? stepCfg?.delayMinutesBeforeQuiz ?? 0;

            const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            member.currentQuizAvailableAtTimestamp = delayMins > 0 ? Date.now() + delayMins * 60 * 1000 : 0;

            const roleName = stepCfg?.roleOnStartName || mod.roleEnCoursName;
            const roleId = stepCfg?.roleOnStartId || mod.roleEnCoursId;
            const rolesToAdd = [roleName, roleId].filter(Boolean) as string[];

            if (rolesToAdd.length > 0) {
              member.roles = Array.from(new Set([...(member.roles || []), ...rolesToAdd]));
              if (guild) {
                syncMemberRolesOnGuild(guild, user.id, member.roles).catch(() => {});
              }
              discordService.assignDiscordRolesToMember(user.id, member.roles).catch(() => {});
            }
            store.saveMembers();
            firebaseSyncService.saveMember(member).catch(() => {});

            const externalLink = stepCfg?.externalLinkUrl || mod.url || (mod.resources && mod.resources[0]?.url);
            const brandingName = store.getBranding().trainingName || 'Espace de Formation';

            const delayNotice = delayMins > 0
              ? `\n\n⏱️ **Information Quiz** : Le quiz de ce module sera débloqué dans **${delayMins} minute(s)** !`
              : `\n\n⏱️ **Information Quiz** : Le quiz est disponible immédiatement ci-dessous !`;

            const linkNotice = externalLink
              ? `\n\n🔗 **Support / Document de cours** :\n👉 [Accéder au support de formation](${externalLink})`
              : '';

            const embed = new EmbedBuilder()
              .setTitle(`📚 ${mod.title}`)
              .setDescription(`${mod.content}${linkNotice}${delayNotice}`)
              .setColor(0x6366f1)
              .setFooter({ text: `${brandingName} • Parcours de Formation` })
              .setTimestamp();

            const actionButtons: ButtonBuilder[] = [];
            if (externalLink) {
              actionButtons.push(
                new ButtonBuilder()
                  .setLabel('🔗 Support / Lien de Cours')
                  .setStyle(ButtonStyle.Link)
                  .setURL(externalLink)
              );
            }
            actionButtons.push(
              buildQuizButton(member, quiz, mod.title),
              new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
            );

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(actionButtons);

            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
          }

          // Default fallback response
          await interaction.editReply({
            content: `✅ Action enregistrée pour <@${user.id}>. (Bouton: \`${customId}\`)`,
          });
        } catch (err: any) {
          console.warn('[PAWAKO BOT Interaction Error]', err?.message || err);
          try {
            if (interaction.deferred || interaction.replied) {
              await interaction.editReply({ content: `⚠️ Action enregistrée pour <@${interaction.user.id}>.` });
            } else {
              await interaction.reply({ content: `⚠️ Action enregistrée.` });
            }
          } catch (replyErr) {
            console.warn('[Interaction Fallback Reply Failed]', replyErr);
          }
        }
      });

      this.client.login(cleanToken).catch((err) => {
        this.isConnecting = false;
        this.isConnected = false;
        console.warn('[PAWAKO BOT] ERREUR CRITIQUE : DISCORD_BOT_TOKEN invalide.', err.message);
      });
    } catch (err: any) {
      this.isConnecting = false;
      this.isConnected = false;
      console.warn('[PAWAKO BOT] Could not init discord.js client:', err.message);
    }
  }

  public async sendReminderToChannel(
    channelId: string,
    memberDiscordId: string,
    messageText: string,
    title?: string
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const channel = (await this.client.channels.fetch(channelId).catch(() => null)) as TextChannel | null;
      if (!channel) return false;

      const embed = new EmbedBuilder()
        .setTitle(title || "⏰ Rappel d'Inactivité - PAWAKO FORMATION")
        .setDescription(messageText)
        .setColor(0xf59e0b)
        .setFooter({ text: 'PAWAKO FORMATION • Relance Automatique' })
        .setTimestamp();

      await channel.send({
        content: `<@${memberDiscordId}>`,
        embeds: [embed],
      });
      return true;
    } catch (err: any) {
      console.warn(`[PawakoBot Reminder Send Warning] Channel ${channelId}:`, err?.message || err);
      return false;
    }
  }

  /**
   * Helper to send a direct message (MP) to Mahsa and Mathieu on Discord
   */
  public async sendDirectMessageToStaff(
    embed: EmbedBuilder,
    components?: ActionRowBuilder<ButtonBuilder>[]
  ): Promise<void> {
    if (!this.client) return;
    const cfg = onboardingService.getConfig();
    const staffIds = [cfg.mahsaDiscordId, cfg.mathieuDiscordId].filter(Boolean);

    for (const rawId of staffIds) {
      const cleanId = String(rawId).replace(/[<@!>]/g, '').trim();
      if (!/^\d{17,20}$/.test(cleanId)) continue;
      try {
        const user = await this.client.users.fetch(cleanId).catch(() => null);
        if (user) {
          await user.send({
            embeds: [embed],
            components: components || [],
          }).catch((e) => console.warn(`[MP Staff Error ${cleanId}]`, e));
        }
      } catch (err) {
        console.warn(`[MP Staff Fetch Exception ${cleanId}]`, err);
      }
    }
  }

  /**
   * Helper to fetch or create the private temporary Voice Channel for 10h00 HF Tools Formation
   * Grants view/connect permissions ONLY to staff and enrolled candidates.
   */
  public async getOrCreateToolsVoiceChannel(
    guild: any,
    scheduledMembers: Member[]
  ): Promise<any> {
    try {
      const channels = await guild.channels.fetch().catch(() => null);
      let existingVoice = channels
        ? channels.find((c: any) => c && c.type === ChannelType.GuildVoice && (
            c.name.toLowerCase().includes('formation-outils') ||
            c.name.toLowerCase().includes('formation outils') ||
            (c.name.toLowerCase().includes('formation') && c.name.toLowerCase().includes('outils'))
          ))
        : null;

      const staffRole = guild.roles.cache.find(
        (r: any) =>
          r && r.name &&
          (r.name.toLowerCase().includes('staff') ||
            r.name.toLowerCase().includes('admin') ||
            r.name.toLowerCase().includes('formateur'))
      );

      const overwrites: any[] = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        },
      ];

      if (staffRole) {
        overwrites.push({
          id: staffRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        });
      }

      const cfg = onboardingService.getConfig();
      [cfg.mahsaDiscordId, cfg.mathieuDiscordId].forEach((rawId) => {
        if (!rawId) return;
        const cleanId = String(rawId).replace(/[<@!>]/g, '').trim();
        if (/^\d{17,20}$/.test(cleanId)) {
          overwrites.push({
            id: cleanId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          });
        }
      });

      for (const m of scheduledMembers) {
        const cId = m.discordId || (m.id.startsWith('mem-') ? m.id.replace('mem-', '') : m.id);
        if (cId && /^\d{17,20}$/.test(cId)) {
          overwrites.push({
            id: cId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          });
        }
      }

      if (!existingVoice) {
        existingVoice = await guild.channels.create({
          name: '🔊 Formation Outils (10h00 HF)',
          type: ChannelType.GuildVoice,
          permissionOverwrites: overwrites,
        });
        console.log('[PawakoBot] Salon Vocal #Formation Outils créé avec succès.');
      } else {
        for (const ow of overwrites) {
          await existingVoice.permissionOverwrites.edit(ow.id, ow).catch(() => {});
        }
      }

      return existingVoice;
    } catch (err) {
      console.warn('[GetOrCreateToolsVoiceChannel Error]', err);
      return null;
    }
  }

  /**
   * Helper to close/end the Tools Formation voice channel session.
   * Revokes candidate access or deletes the voice channel.
   */
  public async closeToolsVoiceChannel(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const cfg = onboardingService.getConfig();
      const guildId = cfg.guildId || this.client.guilds.cache.first()?.id;
      if (!guildId) return false;

      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return false;

      const channels = await guild.channels.fetch().catch(() => null);
      const existingVoice = channels
        ? channels.find((c: any) => c && c.type === ChannelType.GuildVoice && (
            c.name.toLowerCase().includes('formation-outils') ||
            c.name.toLowerCase().includes('formation outils') ||
            (c.name.toLowerCase().includes('formation') && c.name.toLowerCase().includes('outils'))
          ))
        : null;

      if (existingVoice) {
        await existingVoice.delete('Fin de la session de Formation Outils').catch(async () => {
          await existingVoice.permissionOverwrites.set([
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            },
          ]);
        });
        return true;
      }
    } catch (err) {
      console.warn('[CloseToolsVoiceChannel Error]', err);
    }
    return false;
  }

  /**
   * Sync and audit existing candidates on the server who have already completed modules.
   * Ensures candidates who completed Module 5 are enrolled in Simulation & Tools Formation
   * and that 1-click validation MP is sent to Mahsa & Mathieu.
   */
  public async syncExistingFinishedCandidates(): Promise<number> {
    if (!this.client || !this.isConnected) return 0;
    try {
      const cfg = onboardingService.getConfig();
      const guildId = cfg.guildId || process.env.DISCORD_GUILD_ID || this.client.guilds.cache.first()?.id;
      if (!guildId) return 0;

      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return 0;

      // Fetch all guild members from Discord
      const guildMembers = await guild.members.fetch().catch(() => null);
      if (guildMembers) {
        for (const gMember of guildMembers.values()) {
          if (gMember.user.bot) continue;
          store.getOrCreateCandidate(gMember.id, gMember.displayName || gMember.user.username, gMember.user.displayAvatarURL());
        }
      }

      const allModules = store.getModules();
      const lastModId = allModules.length > 0 ? allModules[allModules.length - 1].id : 'mod-5';
      const allMembers = store.getMembers();
      let syncedCount = 0;

      for (const member of allMembers) {
        const discordUserId = member.discordId || member.id.replace('mem-', '');
        const gMember = guildMembers?.get(discordUserId);

        const mod5Passed = member.progress?.[lastModId]?.quizPassed || member.progress?.[lastModId]?.status === 'valide';
        
        let hasCompletionRole = false;
        if (gMember) {
          hasCompletionRole = gMember.roles.cache.some((r) => {
            const name = r.name.toLowerCase();
            return name.includes('pass module 5') || name.includes('pass 5') || name.includes('simulation') || name.includes('formation outils') || name.includes('formé') || name.includes('equipe');
          });
        }

        const isFinishedModules = mod5Passed || hasCompletionRole || member.candidateState === 'simulation' || member.candidateState === 'formation_outils' || member.candidateState === 'formation_terminee';

        if (isFinishedModules) {
          syncedCount++;

          if (!member.progress[lastModId]) {
            member.progress[lastModId] = { moduleId: lastModId, status: 'valide', attemptsCount: 1, quizPassed: true, score: 20 };
          } else {
            member.progress[lastModId].quizPassed = true;
            member.progress[lastModId].status = 'valide';
          }

          if (!member.candidateState || member.candidateState === 'nouveau' || member.candidateState === 'module_en_cours' || member.candidateState === 'cooldown_actif' || member.candidateState === 'quiz_disponible') {
            member.candidateState = 'simulation';
            if (!member.simulationScheduledTimestamp) {
              member.simulationScheduledTimestamp = getNext14hParisTimestamp();
              member.simulationReminderSent = false;
            }
          }

          if (member.candidateState === 'simulation' && !member.simuMpSentToStaff) {
            member.simuMpSentToStaff = true;

            const simValidateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`staff_validate_simu_${member.id}`)
                .setLabel(`🏆 Valider la Simulation de ${member.username}`)
                .setStyle(ButtonStyle.Success)
            );

            const mpSimuEmbed = new EmbedBuilder()
              .setTitle('🎭 CANDIDAT EXISTANT EN SIMULATION IA DIRECTE')
              .setDescription(
                `📢 **Notification Privée Staff (Import / Reprise)**\n\n` +
                `Le candidat <@${discordUserId}> (**${member.username}**) a terminé l'intégralité des modules théoriques ! 🏆\n\n` +
                `🚀 **Simulation IA :** Démarrée immédiatement en direct dans son salon.\n` +
                `📍 **Salon privé candidat :** ${member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon privé'}\n\n` +
                `👉 **Pour valider sa simulation en 1-clic**, appuyez simplement sur le bouton vert ci-dessous :`
              )
              .setColor(0x3b82f6)
              .setFooter({ text: 'PAWAKO FORMATION • Synchronisation Serveur & Validation 1-Clic' })
              .setTimestamp();

            this.sendDirectMessageToStaff(mpSimuEmbed, [simValidateRow]).catch(() => {});
          }

          if (member.candidateState === 'formation_outils' && (!member.toolsFormationScheduledTimestamp || member.toolsFormationScheduledTimestamp < Date.now())) {
            member.toolsFormationScheduledTimestamp = getNext10hParisTimestamp();
            member.toolsFormationReminderSent = false;
          }

          store.saveMembers();
          firebaseSyncService.saveMember(member).catch(() => {});
        }
      }

      if (syncedCount > 0) {
        store.addLog(
          'System Bot',
          `🔄 [SYNCHRO ALIBABA] ${syncedCount} candidat(s) ayant terminé les modules synchronisés et prêts pour la simulation/formation outils.`,
          'system'
        );
      }
      return syncedCount;
    } catch (err: any) {
      console.warn('[syncExistingFinishedCandidates Error]', err?.message || err);
      return 0;
    }
  }

  public isStaffChannel(channel: any): boolean {
    if (!channel || !('name' in channel)) return false;
    const name = channel.name.toLowerCase();
    return (
      name.includes('staff') ||
      name.includes('alert') ||
      name.includes('logs') ||
      name.includes('admin') ||
      name.includes('integration') ||
      name.includes('bureau') ||
      name.includes('gestion')
    );
  }

  public async sendStaffLogNotification(embed: EmbedBuilder, textContent?: string): Promise<void> {
    if (!this.client) return;
    try {
      const config = onboardingService.getConfig();
      const guildId = config.guildId || process.env.DISCORD_GUILD_ID || this.client.guilds.cache.first()?.id;
      if (!guildId) return;

      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const staffChan = await this.getOrCreateStaffOnlyChannel(guild, 'alertes-staff', 'Alertes & Logs Staff');
      if (staffChan) {
        await staffChan.send({
          content: textContent || undefined,
          embeds: [embed],
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[SendStaffLogNotification Error]', e);
    }
  }

  /**
   * Helper to fetch or auto-create the candidate's private personal text channel
   */
  public async getCandidateChannel(
    member: Member,
    createIfMissing: boolean = true
  ): Promise<TextChannel | null> {
    if (!this.client) return null;

    // 1. Try fetching by saved personalChannelId
    if (member.personalChannelId) {
      const chan = await this.client.channels.fetch(member.personalChannelId).catch(() => null);
      if (chan && chan.isTextBased() && !chan.isThread()) {
        return chan as TextChannel;
      }
    }

    if (member.isActive === false) return null;

    const config = onboardingService.getConfig();
    const guildId = config.guildId || process.env.DISCORD_GUILD_ID || this.client.guilds.cache.first()?.id;
    if (!guildId) return null;

    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return null;

    const candDiscordId = (member.discordId || member.id.replace('mem-', '')).replace(/[<@!>]/g, '').trim();

    // Verify if candidate is still present in the Discord guild (not kicked/left)
    if (candDiscordId && /^\d{17,20}$/.test(candDiscordId)) {
      const gMember = await guild.members.fetch(candDiscordId).catch(() => null);
      if (!gMember) {
        console.log(`[getCandidateChannel] Candidate ${member.username} (${candDiscordId}) is no longer in guild.`);
        member.isActive = false;
        store.saveMembers();
        firebaseSyncService.saveMember(member).catch(() => {});
        return null;
      }
    }
    const cleanName = member.username.toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 20) || 'membre';
    const expectedChanName = `🔒-formation-${cleanName}`;

    // 2. Search existing channels in guild
    const channels = await guild.channels.fetch().catch(() => null);
    if (channels) {
      for (const [, chan] of channels) {
        if (!chan || !chan.isTextBased() || chan.isThread()) continue;
        const tc = chan as TextChannel;
        const nameMatch = tc.name === expectedChanName || (cleanName.length > 3 && tc.name.includes(cleanName));
        const topicMatch = Boolean(candDiscordId && tc.topic && tc.topic.includes(candDiscordId));
        const overwriteMatch = Boolean(candDiscordId && tc.permissionOverwrites?.cache?.has(candDiscordId));

        if (topicMatch || overwriteMatch || nameMatch) {
          member.personalChannelId = tc.id;
          member.personalChannelName = tc.name;
          store.saveMembers();
          firebaseSyncService.saveMember(member).catch(() => {});
          return tc;
        }
      }
    }

    // 3. Create channel if missing and allowed
    if (createIfMissing && guild) {
      try {
        const overwrites: any[] = [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ];

        if (candDiscordId && /^\d{17,20}$/.test(candDiscordId)) {
          overwrites.push({
            id: candDiscordId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          });
        }

        if (this.client?.user?.id) {
          overwrites.push({
            id: this.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.EmbedLinks,
            ],
          });
        }

        const categoryId = config.personalCategoryId;
        const createdChannel = await guild.channels.create({
          name: expectedChanName,
          type: ChannelType.GuildText,
          parent: categoryId || undefined,
          topic: `Salon privé de formation pour @${member.username} (${candDiscordId})`,
          permissionOverwrites: overwrites,
        });

        if (createdChannel) {
          member.personalChannelId = createdChannel.id;
          member.personalChannelName = createdChannel.name;
          store.saveMembers();
          firebaseSyncService.saveMember(member).catch(() => {});
          return createdChannel;
        }
      } catch (err: any) {
        console.warn('[getCandidateChannel create error]', err?.message || err);
      }
    }

    return null;
  }

  /**
   * Helper to fetch or auto-create a staff-only channel on Discord with permission overwrites
   */
  public async getOrCreateStaffOnlyChannel(
    guild: any,
    channelName: string,
    topic: string
  ): Promise<TextChannel | null> {
    try {
      const channels = await guild.channels.fetch().catch(() => null);
      if (channels) {
        const existing = channels.find(
          (c: any) => c && c.isTextBased() && c.name.toLowerCase() === channelName.toLowerCase()
        ) as TextChannel | null;
        if (existing) return existing;
      }

      const staffRole = guild.roles.cache.find(
        (r: any) =>
          r.name.toLowerCase().includes('staff') ||
          r.name.toLowerCase().includes('admin') ||
          r.name.toLowerCase().includes('formateur')
      );

      const overwrites: any[] = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ];

      if (staffRole) {
        overwrites.push({
          id: staffRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        });
      }

      const created = (await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        topic,
        permissionOverwrites: overwrites,
      })) as TextChannel;
      console.log(`[PawakoBot] Salon #${channelName} (Staff Only) créé avec succès sur Discord.`);
      return created;
    } catch (err) {
      console.warn(`[PawakoBot] Erreur création auto salon #${channelName}:`, err);
      return null;
    }
  }

  public async notifyStaffModule5Completion(
    member: Member,
    quizTitle: string,
    score: number,
    totalQuestions: number,
    minScore: number
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const config = onboardingService.getConfig();
      const guildId = config.guildId || this.client.guilds.cache.first()?.id;
      let guild: any = null;
      if (guildId) {
        guild = await this.client.guilds.fetch(guildId).catch(() => null);
      }
      if (!guild && this.client.guilds.cache.size > 0) {
        guild = this.client.guilds.cache.first();
      }
      if (!guild) return false;

      // Auto-create or fetch #module-ok channel (Staff only)
      const moduleOkChannel = await this.getOrCreateStaffOnlyChannel(
        guild,
        'module-ok',
        '🎓 Notifications exclusives — Membres ayant validé l\'intégralité des modules PAWAKO (Staff Only)'
      );

      if (!moduleOkChannel) return false;

      const validatedCount = Object.values(member.progress || {}).filter((p) => p.status === 'valide').length;
      const totalModules = store.getModules().length || 5;

      const staffEmbed = new EmbedBuilder()
        .setTitle('🏆 PARCOURS INTÉGRALEMENT VALIDÉ — MODULE OK')
        .setDescription(
          `🎉 **Excellente nouvelle !** Le candidat <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**) a validé avec succès l'intégralité du parcours (**${quizTitle}**) !\n\n` +
          `📊 **Résultats du Quiz Final :**\n` +
          `• **Score au Quiz Final :** **${score}/${totalQuestions}** (Minimum requis : ${minScore}/${totalQuestions})\n` +
          `• **Modules validés :** **${validatedCount}/${totalModules}** (100% du parcours terminé)\n` +
          `• **Statut :** **FORMATION INTÉGRALEMENT VALIDÉE** 🏆\n` +
          `• **Salon du candidat :** ${member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon Privé'}\n\n` +
          `✅ **Le candidat a terminé avec succès tous ses modules. L'équipe staff est notifiée pour l'accueil final.**`
        )
        .setColor(0x10b981)
        .setThumbnail(member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
        .setFooter({ text: 'PAWAKO FORMATION • Notification Module OK Staff' })
        .setTimestamp();

      await moduleOkChannel.send({
        content: `📢 **[MODULE OK]** <@${member.discordId || member.id.replace('mem-', '')}> a terminé avec succès TOUS les modules de formation !`,
        embeds: [staffEmbed],
      }).catch((e: any) => console.warn('[Module OK Send Warning]', e));

      if (member.personalChannelId) {
        const candChan = await this.client.channels.fetch(member.personalChannelId).catch(() => null);
        if (candChan && 'send' in candChan && candChan.id !== moduleOkChannel.id) {
          await (candChan as any).send({
            content: '📢 **[NOTIFICATION STAFF & CANDIDAT]** Validation finale transmise à l\'équipe de formation !',
            embeds: [staffEmbed],
          }).catch((e: any) => console.warn('[Cand Chan Staff Embed Warning]', e));
        }
      }

      return true;
    } catch (err: any) {
      console.warn('[Notify Staff Module OK Error]', err?.message || err);
      return false;
    }
  }

  /**
   * Send notification to candidate when their simulation is rescheduled by staff
   */
  public async notifySimulationRescheduled(
    member: Member,
    newTimestamp: number,
    adminName: string = 'Staff'
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const candChan = await this.getCandidateChannel(member, true);
      if (!candChan) return false;

      const discordUserId = member.discordId || member.id.replace('mem-', '');
      const simTsSec = Math.floor(newTimestamp / 1000);

      const embed = new EmbedBuilder()
        .setTitle('📅 CONVOCATION REPROGRAMMÉE — TEST DE SIMULATION (14h00 HF)')
        .setDescription(
          `📢 <@${discordUserId}>, **ta session de Test de Simulation a été reprogrammée !** 🏆\n\n` +
          `L'équipe Staff (${adminName}) a fixé ton nouveau rendez-vous pour :\n\n` +
          `🗓️ **<t:${simTsSec}:F>** (<t:${simTsSec}:R>)\n\n` +
          `📍 **Lieu :** Ce salon privé avec l'équipe Staff.\n` +
          `🔔 *Un rappel automatique te sera envoyé à l'heure pile du rendez-vous. Sois prêt !* 🚀`
        )
        .setColor(0x3b82f6)
        .setFooter({ text: 'PAWAKO FORMATION • Reprogrammation Convocation Simulation' })
        .setTimestamp();

      const simValidateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`staff_validate_simu_${member.id}`)
          .setLabel(`🏆 Valider la Simulation de ${member.username}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`staff_reprogram_simu_${member.id}`)
          .setLabel(`📅 Reprogrammer Simu`)
          .setStyle(ButtonStyle.Secondary)
      );

      await candChan.send({
        content: `<@${discordUserId}>`,
        embeds: [embed],
        components: [simValidateRow],
      }).catch((e: any) => console.warn('[Reschedule Sim Send Error]', e));

      return true;
    } catch (err) {
      console.warn('[notifySimulationRescheduled Error]', err);
      return false;
    }
  }

  /**
   * Send notification to candidate when their tools formation is rescheduled by staff
   */
  public async notifyToolsFormationRescheduled(
    member: Member,
    newTimestamp: number,
    adminName: string = 'Staff'
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const candChan = await this.getCandidateChannel(member, true);
      if (!candChan) return false;

      const discordUserId = member.discordId || member.id.replace('mem-', '');
      const toolsTsSec = Math.floor(newTimestamp / 1000);

      const embed = new EmbedBuilder()
        .setTitle('📅 CONVOCATION REPROGRAMMÉE — FORMATION OUTILS (10h00 HF)')
        .setDescription(
          `📢 <@${discordUserId}>, **ta session de Formation Outils a été reprogrammée !** 🛠️\n\n` +
          `L'équipe Staff (${adminName}) a fixé ton nouveau rendez-vous pour :\n\n` +
          `🗓️ **<t:${toolsTsSec}:F>** (<t:${toolsTsSec}:R>)\n\n` +
          `📍 **Lieu :** Ce salon privé / Salon Vocal Formation.\n` +
          `🔔 *Un rappel avec les liens vocaux et Google Meet te sera transmis à l'heure pile du rendez-vous.* 🚀`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'PAWAKO FORMATION • Reprogrammation Formation Outils' })
        .setTimestamp();

      const toolsValidateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`staff_validate_tools_${member.id}`)
          .setLabel(`✅ Valider Formation Outils de ${member.username}`)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`staff_reprogram_tools_${member.id}`)
          .setLabel(`📅 Reprogrammer Outils`)
          .setStyle(ButtonStyle.Secondary)
      );

      await candChan.send({
        content: `<@${discordUserId}>`,
        embeds: [embed],
        components: [toolsValidateRow],
      }).catch((e: any) => console.warn('[Reschedule Tools Send Error]', e));

      return true;
    } catch (err) {
      console.warn('[notifyToolsFormationRescheduled Error]', err);
      return false;
    }
  }

  /**
   * Send celebratory notification to candidate when a new badge is unlocked
   */
  public async notifyBadgeUnlocked(
    member: Member,
    badge: MemberBadge
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const candChan = await this.getCandidateChannel(member, true);
      if (!candChan) return false;

      const discordUserId = member.discordId || member.id.replace('mem-', '');

      const colorHex =
        badge.color === 'amber' ? 0xf59e0b :
        badge.color === 'emerald' ? 0x10b981 :
        badge.color === 'indigo' ? 0x6366f1 :
        badge.color === 'blue' ? 0x3b82f6 :
        badge.color === 'purple' ? 0x8b5cf6 :
        0xf43f5e;

      const embed = new EmbedBuilder()
        .setTitle(`🎉 NOUVEAU BADGE DÉBLOQUÉ : ${badge.emoji} ${badge.title}`)
        .setDescription(
          `📢 <@${discordUserId}>, **Félicitations ! Tu as débloqué un nouveau succès de formation !** 🏅\n\n` +
          `**${badge.emoji} ${badge.title}**\n` +
          `_${badge.description}_\n\n` +
          `🗓️ **Obtenu le :** ${badge.unlockedAt}\n\n` +
          `*Tape \`!profil\` ou \`!badges\` pour consulter tous tes succès !* 🚀`
        )
        .setColor(colorHex)
        .setFooter({ text: 'PAWAKO FORMATION • Système de Badges & Succès' })
        .setTimestamp();

      const profileRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_profile')
          .setLabel('🏅 Voir mon Profil & Badges')
          .setStyle(ButtonStyle.Primary)
      );

      await candChan.send({
        content: `🎉 <@${discordUserId}>`,
        embeds: [embed],
        components: [profileRow],
      }).catch((e: any) => console.warn('[Badge Notify Send Error]', e));

      return true;
    } catch (err) {
      console.warn('[notifyBadgeUnlocked Error]', err);
      return false;
    }
  }

  /**
   * Auto-create / update #classement-formation channel on Discord server
   */
  public async updateLeaderboardChannel(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const config = onboardingService.getConfig();
      const guildId = config.guildId || this.client.guilds.cache.first()?.id;
      if (!guildId) return false;

      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return false;

      let classChannel = guild.channels.cache.find(
        (c: any) => c.isTextBased() && (c.name.includes('classement') || c.name.includes('leaderboard'))
      ) as TextChannel | null;

      if (!classChannel) {
        classChannel = (await guild.channels.create({
          name: '🏆-classement-formation',
          type: ChannelType.GuildText,
          topic: '🏆 Classement Officiel PAWAKO FORMATION — Top Candidats & Avancement',
        })) as TextChannel;
      }

      if (!classChannel) return false;

      const members = store.getMembers().filter((m) => m.isActive !== false);
      const totalModules = store.getModules().length || 5;

      const sorted = [...members].sort((a, b) => {
        const valA = Object.values(a.progress || {}).filter((p) => p.status === 'valide').length;
        const valB = Object.values(b.progress || {}).filter((p) => p.status === 'valide').length;
        if (valB !== valA) return valB - valA;

        const attsA = store.getQuizAttemptsForMember(a.id);
        const attsB = store.getQuizAttemptsForMember(b.id);
        const avgA = attsA.length > 0 ? attsA.reduce((s, x) => s + x.score, 0) / attsA.length : 0;
        const avgB = attsB.length > 0 ? attsB.reduce((s, x) => s + x.score, 0) / attsB.length : 0;
        return avgB - avgA;
      });

      const top10 = sorted.slice(0, 10);
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      const rankingLines = top10.map((m, idx) => {
        const medal = medals[idx] || `${idx + 1}.`;
        const valCount = Object.values(m.progress || {}).filter((p) => p.status === 'valide').length;
        const attempts = store.getQuizAttemptsForMember(m.id);
        const sumScores = attempts.reduce((acc, att) => acc + (att.score > 20 ? Math.round((att.score / 100) * 20) : att.score), 0);
        const avg20 = attempts.length > 0 ? Math.round((sumScores / attempts.length) * 10) / 10 : '--';
        const progressPill = '█'.repeat(valCount) + '░'.repeat(Math.max(0, totalModules - valCount));

        return `${medal} <@${m.discordId || m.id.replace('mem-', '')}> (**${m.username}**)\n` +
               `    └ \`[${progressPill}]\` **${valCount}/${totalModules} Modules** • Moyenne : **${avg20}/20**`;
      });

      const leaderEmbed = new EmbedBuilder()
        .setTitle('🏆 CLASSEMENT OFFICIEL DES CANDIDATS PAWAKO')
        .setDescription(
          `🔥 **Top Candidats du Parcours de Formation**\n` +
          `*(Mise à jour en temps réel à chaque validation de module)*\n\n` +
          (rankingLines.length > 0 ? rankingLines.join('\n\n') : 'Aucun candidat enregistré pour le moment.') +
          `\n\n💡 *Continue de réviser et de valider tes quiz pour grimper dans le classement !* 🚀`
        )
        .setColor(0xf59e0b)
        .setFooter({ text: 'PAWAKO FORMATION • Gamification & Classement' })
        .setTimestamp();

      const messages = await classChannel.messages.fetch({ limit: 5 }).catch(() => null);
      const botMsg = messages?.find((m: any) => m.author.id === this.client?.user?.id);

      if (botMsg) {
        await botMsg.edit({ embeds: [leaderEmbed] }).catch(() => {});
      } else {
        await classChannel.send({ embeds: [leaderEmbed] }).catch(() => {});
      }

      return true;
    } catch (err) {
      console.warn('[updateLeaderboardChannel Error]', err);
      return false;
    }
  }

  /**
   * Auto-responder for candidate questions about bot operation (no confidential data)
   */
  public async handleCandidateQuestion(message: Message): Promise<boolean> {
    if (message.author.bot) return false;
    const content = message.content.toLowerCase().trim();
    if (content.startsWith('!')) return false;

    const isQuestion =
      content.includes('?') ||
      content.includes('comment') ||
      content.includes('pourquoi') ||
      content.includes('quand') ||
      content.includes('cooldown') ||
      content.includes('quiz') ||
      content.includes('module') ||
      content.includes('bot') ||
      content.includes('aide') ||
      content.includes('staff') ||
      content.includes('note') ||
      content.includes('score') ||
      content.includes('réponse') ||
      content.includes('reponse');

    if (!isQuestion) return false;

    // Confidentiality guard
    if (
      content.includes('réponse') ||
      content.includes('reponse') ||
      content.includes('corrigé') ||
      content.includes('solution') ||
      content.includes('triche')
    ) {
      const embed = new EmbedBuilder()
        .setTitle('🔒 INFORMATION CONFIDENTIELLE PAWAKO')
        .setDescription(
          `Salut <@${message.author.id}> ! 👋\n\n` +
          `Les réponses et corrigés des quiz sont **strictement confidentiels**.\n` +
          `📚 Tu trouveras l'intégralité des notions nécessaires dans le **support de cours** accessible avant chaque quiz.`
        )
        .setColor(0xf59e0b)
        .setFooter({ text: 'PAWAKO FORMATION • Système Pédagogique' });

      await message.reply({ embeds: [embed] }).catch(() => {});
      return true;
    }

    // Cooldown & Wait time
    if (
      content.includes('cooldown') ||
      content.includes('attendre') ||
      content.includes('bloqué') ||
      content.includes('bloque') ||
      content.includes('temps d\'attente') ||
      content.includes('déblocage') ||
      content.includes('deblocage')
    ) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 RÈGLE DU COOLDOWN — PAWAKO FORMATION')
        .setDescription(
          `Salut <@${message.author.id}> ! 👋 Voici comment fonctionne le cooldown :\n\n` +
          `⏳ **Pourquoi un cooldown ?** Si tu n'obtiens pas le score minimum (16/20), un cooldown obligatoire de 30 minutes s'active.\n` +
          `💡 **Que faire pendant ce temps ?** Relis attentivement ton support de cours et tes notes !\n` +
          `⏱️ **Déblocage :** Dès la fin du compte à rebours, le bouton **"🚀 Lancer le Quiz"** se réactive automatiquement.`
        )
        .setColor(0x6366f1)
        .setFooter({ text: 'PAWAKO FORMATION • Assistance Bot' });

      await message.reply({ embeds: [embed] }).catch(() => {});
      return true;
    }

    // How to launch quiz / next module
    if (
      content.includes('lancer') ||
      content.includes('démarrer') ||
      content.includes('demarrer') ||
      content.includes('suite') ||
      content.includes('module suivant') ||
      content.includes('continuer') ||
      content.includes('accéder') ||
      content.includes('acceder')
    ) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 DÉROULEMENT DES MODULES & QUIZ')
        .setDescription(
          `Salut <@${message.author.id}> ! 👋\n\n` +
          `📚 **1. Consulter le cours :** Clique sur le bouton de support dans ce salon.\n` +
          `📝 **2. Passer le quiz :** Clique sur **"🚀 Lancer le Quiz"** (15s max par question).\n` +
          `🎉 **3. Valider le module :** Un score d'au moins 16/20 débloque immédiatement le module suivant !`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'PAWAKO FORMATION • Assistance Bot' });

      await message.reply({ embeds: [embed] }).catch(() => {});
      return true;
    }

    // Profile & Notes
    if (
      content.includes('note') ||
      content.includes('score') ||
      content.includes('profil') ||
      content.includes('progression') ||
      content.includes('résultat') ||
      content.includes('resultat')
    ) {
      const embed = new EmbedBuilder()
        .setTitle('📊 CONSULTATION DU PROFIL & DES NOTES')
        .setDescription(
          `Salut <@${message.author.id}> ! 👋\n\n` +
          `Tu peux voir l'historique complet de tes scores et ton avancement :\n` +
          `👉 Tape simplement **\`!profil\`** dans ce salon privé ou clique sur le bouton **"👤 Mon profil"**.`
        )
        .setColor(0x3b82f6)
        .setFooter({ text: 'PAWAKO FORMATION • Assistance Bot' });

      await message.reply({ embeds: [embed] }).catch(() => {});
      return true;
    }

    // Staff Contact
    if (
      content.includes('staff') ||
      content.includes('formateur') ||
      content.includes('humain') ||
      content.includes('contact') ||
      content.includes('ticket')
    ) {
      const embed = new EmbedBuilder()
        .setTitle('💬 CONTACT DU STAFF PAWAKO')
        .setDescription(
          `Salut <@${message.author.id}> ! 👋\n\n` +
          `L'équipe Staff PAWAKO a un œil sur ce salon privé et reçoit des alertes automatiques à chaque étape clé.\n` +
          `🎫 Si tu as une demande spécifique, tu peux créer un ticket direct en tapant **\`!ticket\`** dans ce salon.`
        )
        .setColor(0x8b5cf6)
        .setFooter({ text: 'PAWAKO FORMATION • Assistance Bot' });

      await message.reply({ embeds: [embed] }).catch(() => {});
      return true;
    }

    // General bot question
    if (
      content.includes('bot') ||
      content.includes('fonctionne') ||
      content.includes('marche') ||
      content.includes('aide')
    ) {
      const embed = new EmbedBuilder()
        .setTitle('🤖 RÔLE DU BOT PAWAKO FORMATION')
        .setDescription(
          `Salut <@${message.author.id}> ! 👋 Je suis l'assistant automatisé de PAWAKO FORMATION.\n\n` +
          `🔹 **Mes missions :**\n` +
          `• Te délivrer les supports de cours et questionnaires de validation\n` +
          `• Chronométrer les quiz (15 secondes par question)\n` +
          `• Gérer les cooldowns de révision (30 min si score < 16/20)\n` +
          `• Te lancer immédiatement en **Test de Simulation avec l'IA** dès la fin de tes cours\n\n` +
          `💡 *Commande utile : tape \`!profil\` pour voir tes notes à tout moment.*`
        )
        .setColor(0x6366f1)
        .setFooter({ text: 'PAWAKO FORMATION • Assistant Pédagogique' });

      await message.reply({ embeds: [embed] }).catch(() => {});
      return true;
    }

    return false;
  }

  /**
   * Check and send 14h00 HF Simulation reminders for scheduled candidates
   */
  private async checkSimulationReminders() {
    if (!this.client || !this.isConnected) return;
    const allMembers = store.getMembers();
    const nowMs = Date.now();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

    for (const m of allMembers) {
      if (
        m.isActive !== false &&
        m.candidateState === 'simulation' &&
        m.simulationScheduledTimestamp &&
        nowMs >= m.simulationScheduledTimestamp &&
        !m.simulationReminderSent
      ) {
        m.simulationReminderSent = true;
        store.saveMembers();
        firebaseSyncService.saveMember(m).catch(() => {});

        // Skip sending notification if the scheduled date was over 12 hours ago (outdated)
        if (nowMs - m.simulationScheduledTimestamp > TWELVE_HOURS_MS) {
          continue;
        }

        const candChan = await this.getCandidateChannel(m, true);
        if (candChan) {
          const candMention = `<@${m.discordId || m.id.replace('mem-', '')}>`;
          const reminderEmbed = new EmbedBuilder()
            .setTitle('🔔 C\'EST L\'HEURE — TEST DE SIMULATION (14h00 HF)')
            .setDescription(
              `📢 ${candMention}, **il est 14h00 HF !**\n\n` +
              `C'est le moment de passer ton **Test de Simulation** en direct avec l'équipe Staff PAWAKO. L'équipe t'attend dans ce salon. Fais un signe dans le chat pour commencer ! 🚀`
            )
            .setColor(0x10b981)
            .setFooter({ text: 'PAWAKO FORMATION • Rappel Automatique Simulation 14h00 HF' })
            .setTimestamp();

          await candChan.send({
            content: `🔔 **[RAPPEL SIMULATION 14H00 HF]** ${candMention}`,
            embeds: [reminderEmbed],
          }).catch((e: any) => console.warn('[Simu Reminder Send Error]', e));
        }

        const guildId = onboardingService.getConfig().guildId || this.client.guilds.cache.first()?.id;
        if (guildId) {
          const guild = await this.client.guilds.fetch(guildId).catch(() => null);
          if (guild) {
            const staffChan = await this.getOrCreateStaffOnlyChannel(guild, 'staff-alerts', 'Alertes Staff');
            if (staffChan) {
              const chanLink = m.personalChannelId ? `<#${m.personalChannelId}>` : 'son salon privé';
              await staffChan.send({
                content: `🔔 **[SIMULATION 14H00 HF]** Le candidat <@${m.discordId || m.id.replace('mem-', '')}> (**${m.username}**) attend son test de simulation dans ${chanLink} !`,
              }).catch(() => {});
            }
          }
        }
      }
    }
  }

  /**
   * Validate simulation step for a candidate and schedule 10h00 HF Tools Formation
   */
  public async validateSimulationAndTriggerToolsFormation(
    memberInput: Member,
    staffUserId?: string
  ): Promise<boolean> {
    const member = store.getMember(memberInput.id) || memberInput;
    if (!member) return false;

    // Ensure all modules are marked validated
    const allMods = store.getModules();
    if (!member.progress) member.progress = {};
    for (const mod of allMods) {
      if (!member.progress[mod.id] || member.progress[mod.id].status !== 'valide') {
        member.progress[mod.id] = {
          moduleId: mod.id,
          status: 'valide',
          score: 20,
          attemptsCount: member.progress[mod.id]?.attemptsCount || 1,
          validatedAt: new Date().toLocaleString('fr-FR'),
        };
      }
    }
    member.cooldownUntilTimestamp = null;
    member.currentQuizAvailableAtTimestamp = null;

    const toolsScheduledTs = getNext10hParisTimestamp();
    const tsSec = Math.floor(toolsScheduledTs / 1000);

    member.candidateState = 'formation_outils';
    member.simulationValidatedAt = new Date().toLocaleString('fr-FR');
    member.toolsFormationScheduledTimestamp = toolsScheduledTs;
    member.toolsFormationReminderSent = false;

    store.saveMembers();
    firebaseSyncService.saveMember(member).catch(() => {});

    const cfg = onboardingService.getConfig();
    const meetUrl = cfg.toolsFormationMeetUrl || 'https://meet.google.com/pawako-tools-formation';

    // List all candidates scheduled for this same 10h00 HF timestamp
    const scheduledMembers = store.getMembers().filter(
      (m) => m.toolsFormationScheduledTimestamp === toolsScheduledTs && m.isActive !== false
    );

    // Get or Create Private Voice Channel for 10h00 HF Formation Outils
    let voiceChan: any = null;
    if (this.client) {
      const guildId = cfg.guildId || this.client.guilds.cache.first()?.id;
      if (guildId) {
        const guild = await this.client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          voiceChan = await this.getOrCreateToolsVoiceChannel(guild, scheduledMembers);
        }
      }
    }

    const voiceLinkStr = voiceChan ? `<#${voiceChan.id}>` : `[Google Meet](${meetUrl})`;

    // 1. Message to Candidate in their private channel
    const candChan = await this.getCandidateChannel(member, true);

    if (candChan && 'send' in candChan) {
      const candEmbed = new EmbedBuilder()
        .setTitle('🏆 SIMULATION VALIDÉE ! PROCHAINE ÉTAPE : FORMATION OUTILS')
        .setDescription(
          `Félicitations <@${member.discordId || member.id.replace('mem-', '')}> ! Tu as réussi avec succès ton test de simulation en direct. 👏\n\n` +
          `📅 **Prochain RDV : Formation Outils**\n` +
          `⏰ **Date & Heure :** <t:${tsSec}:F> (<t:${tsSec}:R>) - **10h00 (Heure Française - HF)**\n` +
          `🔊 **Salon Vocal Discord :** ${voiceLinkStr}\n` +
          `🔗 **Lien Google Meet (secours) :** [Rejoindre la visio](${meetUrl})\n\n` +
          `💡 *Un rappel te sera envoyé dans ce salon à 10h00 HF. Clique sur le salon vocal à l'heure du RDV !* 🚀`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'PAWAKO FORMATION • Validation Simulation & Session Outils 10h00 HF' })
        .setTimestamp();

      await candChan.send({
        content: `🏆 <@${member.discordId || member.id.replace('mem-', '')}>`,
        embeds: [candEmbed],
      }).catch((e: any) => console.warn('[Send Simu Validated Error]', e));
    }

    const scheduledListStr = scheduledMembers.length > 0
      ? scheduledMembers.map((m, idx) => `${idx + 1}. <@${m.discordId || m.id.replace('mem-', '')}> (**${m.username}**)`).join('\n')
      : `1. <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**)`;

    const closeVoiceRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_close_voice_session')
        .setLabel('🏁 Terminer / Fermer le Salon Vocal')
        .setStyle(ButtonStyle.Danger)
    );

    // 2. Alert to Staff / #staff-alerts
    if (this.client) {
      const guildId = cfg.guildId || this.client.guilds.cache.first()?.id;
      if (guildId) {
        const guild = await this.client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          const staffChan = await this.getOrCreateStaffOnlyChannel(guild, 'staff-alerts', 'Alertes Staff');
          if (staffChan) {
            const mahsaMention = cfg.mahsaDiscordId ? `<@${cfg.mahsaDiscordId}>` : '@Mahsa';
            const mathieuMention = cfg.mathieuDiscordId ? `<@${cfg.mathieuDiscordId}>` : '@Mathieu';

            const staffAlertEmbed = new EmbedBuilder()
              .setTitle('🔔 SIMULATION VALIDÉE ➡️ FORMATION OUTILS (10h00 HF)')
              .setDescription(
                `📢 **Notification pour ${mahsaMention} et ${mathieuMention}**\n\n` +
                `Le candidat <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**) a été validé${staffUserId ? ` par <@${staffUserId}>` : ''} pour la **Formation Outils** !\n\n` +
                `📅 **Session 10h00 HF :** <t:${tsSec}:F> (<t:${tsSec}:R>)\n` +
                `🔊 **Salon Vocal Discord :** ${voiceLinkStr}\n` +
                `🔗 **Salon privé candidat :** ${member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon privé'}\n\n` +
                `📋 **Liste des candidats inscrits à cette session 10h00 HF :**\n${scheduledListStr}`
              )
              .setColor(0x3b82f6)
              .setFooter({ text: 'PAWAKO FORMATION • Programme Formation Outils 10h00 HF' })
              .setTimestamp();

            await staffChan.send({
              content: `🔔 **[FORMATION OUTILS 10H00 HF]** ${mahsaMention} ${mathieuMention}`,
              embeds: [staffAlertEmbed],
              components: [closeVoiceRow],
            }).catch((e) => console.warn('[Staff Alert Simu Validated Error]', e));
          }
        }
      }
    }

    // 3. Direct Message (MP) to Mahsa & Mathieu
    const mpEmbed = new EmbedBuilder()
      .setTitle('🔔 SIMULATION VALIDÉE — FORMATION OUTILS (10h00 HF)')
      .setDescription(
        `🏆 **Notification Privée Staff**\n\n` +
        `Le candidat <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**) a été validé${staffUserId ? ` par <@${staffUserId}>` : ''} pour la **Formation Outils** !\n\n` +
        `📅 **Session 10h00 HF :** <t:${tsSec}:F> (<t:${tsSec}:R>)\n` +
        `🔊 **Salon Vocal Discord :** ${voiceLinkStr}\n` +
        `📍 **Salon privé candidat :** ${member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon privé'}\n\n` +
        `📋 **Candidats inscrits pour cette session :**\n${scheduledListStr}\n\n` +
        `*(Cliquez sur le bouton ci-dessous une fois la réunion terminée pour fermer l'accès au vocal)*`
      )
      .setColor(0x10b981)
      .setFooter({ text: 'PAWAKO FORMATION • Notification MP Staff' })
      .setTimestamp();

    await this.sendDirectMessageToStaff(mpEmbed, [closeVoiceRow]);

    // 4. Log event
    store.addLog(
      staffUserId ? `Staff (<@${staffUserId}>)` : 'System',
      `Validation de la simulation pour ${member.username}. Convocation Formation Outils 10h00 HF envoyée.`,
      'member',
      member.username
    );

    return true;
  }

  /**
   * Check and send 10h00 HF Tools Formation reminders for scheduled candidates
   */
  private async checkToolsFormationReminders() {
    if (!this.client || !this.isConnected) return;
    const allMembers = store.getMembers();
    const nowMs = Date.now();
    const cfg = onboardingService.getConfig();
    const meetUrl = cfg.toolsFormationMeetUrl || 'https://meet.google.com/pawako-tools-formation';

    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

    const dueMembers = allMembers.filter(
      (m) =>
        m.isActive !== false &&
        m.candidateState === 'formation_outils' &&
        m.toolsFormationScheduledTimestamp &&
        nowMs >= m.toolsFormationScheduledTimestamp &&
        !m.toolsFormationReminderSent
    );

    if (dueMembers.length === 0) return;

    // Filter out candidates whose scheduled date was over 12 hours ago
    const freshMembers = dueMembers.filter(
      (m) => nowMs - (m.toolsFormationScheduledTimestamp || 0) <= TWELVE_HOURS_MS
    );

    // Mark all due as sent so they won't re-trigger
    for (const m of dueMembers) {
      m.toolsFormationReminderSent = true;
      store.saveMembers();
      firebaseSyncService.saveMember(m).catch(() => {});
    }

    if (freshMembers.length === 0) return;

    // Get or Create Private Voice Channel
    let voiceChan: any = null;
    const guildId = cfg.guildId || this.client.guilds.cache.first()?.id;
    if (guildId) {
      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (guild) {
        voiceChan = await this.getOrCreateToolsVoiceChannel(guild, freshMembers);
      }
    }

    const voiceLinkStr = voiceChan ? `<#${voiceChan.id}>` : `[Google Meet](${meetUrl})`;

    for (const m of freshMembers) {
      const candChan = await this.getCandidateChannel(m, true);
      if (candChan) {
        const candMention = `<@${m.discordId || m.id.replace('mem-', '')}>`;
        const reminderEmbed = new EmbedBuilder()
          .setTitle('🔔 C\'EST L\'HEURE — FORMATION OUTILS (10h00 HF)')
          .setDescription(
            `📢 ${candMention}, **il est 10h00 HF !**\n\n` +
            `C'est le moment de rejoindre la session de **Formation Outils** en direct avec l'équipe !\n\n` +
            `🔊 **Rejoindre le Vocal :** ${voiceLinkStr}\n` +
            `🔗 **Lien Google Meet (secours) :** [Rejoindre le Meet](${meetUrl}) 🚀`
          )
          .setColor(0x10b981)
          .setFooter({ text: 'PAWAKO FORMATION • Rappel Automatique Formation Outils 10h00 HF' })
          .setTimestamp();

        await candChan.send({
          content: `🔔 **[RAPPEL FORMATION OUTILS 10H00 HF]** ${candMention}`,
          embeds: [reminderEmbed],
        }).catch((e: any) => console.warn('[Tools Reminder Send Error]', e));
      }
    }

    const closeVoiceRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('staff_close_voice_session')
        .setLabel('🏁 Terminer / Fermer le Salon Vocal')
        .setStyle(ButtonStyle.Danger)
    );

    const mahsaMention = cfg.mahsaDiscordId ? `<@${cfg.mahsaDiscordId}>` : '@Mahsa';
    const mathieuMention = cfg.mathieuDiscordId ? `<@${cfg.mathieuDiscordId}>` : '@Mathieu';

    const candListStr = dueMembers
      .map((m, idx) => `${idx + 1}. <@${m.discordId || m.id.replace('mem-', '')}> (**${m.username}**)`)
      .join('\n');

    const staffReminderEmbed = new EmbedBuilder()
      .setTitle('🔔 RAPPEL 10H00 HF — SESSION FORMATION OUTILS COMMENCÉE')
      .setDescription(
        `📢 **Rappel en direct pour ${mahsaMention} et ${mathieuMention}**\n\n` +
        `Il est **10h00 HF** ! La session de **Formation Outils** commence maintenant.\n\n` +
        `🔊 **Salon Vocal Discord :** ${voiceLinkStr}\n\n` +
        `📋 **Candidats attendus pour cette session :**\n${candListStr}`
      )
      .setColor(0x10b981)
      .setFooter({ text: 'PAWAKO FORMATION • Rappel Session 10h00 HF' })
      .setTimestamp();

    if (guildId) {
      this.client.guilds.fetch(guildId).then((guild) => {
        this.getOrCreateStaffOnlyChannel(guild, 'staff-alerts', 'Alertes Staff').then((staffChan) => {
          if (staffChan) {
            staffChan.send({
              content: `🔔 **[SESSION 10H00 HF COMMENCÉE]** ${mahsaMention} ${mathieuMention}`,
              embeds: [staffReminderEmbed],
              components: [closeVoiceRow],
            }).catch(() => {});
          }
        }).catch(() => {});
      }).catch(() => {});
    }

    // Direct MP to Mahsa & Mathieu
    await this.sendDirectMessageToStaff(staffReminderEmbed, [closeVoiceRow]);
  }

  /**
   * Generate net, non-redundant stats report and post to #stats channel.
   * Sends DM to members who haven't started yet ("se faire de l'argent").
   */
  public async sendStatsReport(
    type: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<{ success: boolean; details?: string }> {
    if (!this.client || !this.isConnected) return { success: false, details: 'Bot Discord non connecté' };

    try {
      const config = onboardingService.getConfig();
      const guildId = config.guildId || this.client.guilds.cache.first()?.id;
      if (!guildId) return { success: false, details: 'Guild Discord non trouvée' };

      const guild = await this.client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return { success: false, details: 'Guild Discord inaccessible' };

      const statsChannel = await this.getOrCreateStaffOnlyChannel(
        guild,
        'stats',
        '📊 Statistiques automatiques du parcours de formation PAWAKO (Staff Only)'
      );

      if (!statsChannel) return { success: false, details: 'Salon #stats introuvable et création impossible' };

      // Get all active members
      const members = store.getMembers().filter((m) => m.isActive !== false);
      const totalJoined = members.length;

      const modules = store.getModules();
      const totalModules = modules.length || 5;

      // Categorize members strictly by their current / highest progression point
      let unstartedCount = 0;
      const moduleMembersMap: Record<string, Member[]> = {};
      modules.forEach((mod) => {
        moduleMembersMap[mod.id] = [];
      });
      let simulationMembers: Member[] = [];
      let toolsFormationMembers: Member[] = [];
      let completedAllMembers: Member[] = [];
      const unstartedMembers: Member[] = [];

      let autoReminder6hCount = 0;
      let autoReminder12hCount = 0;
      let autoReminder24hCount = 0;
      let inactive3dCount = 0;

      members.forEach((m) => {
        if (m.isActive === false) return;

        // Skip Staff members from candidate stats and 18h relances
        const isStaff = (m.roles || []).some((r) =>
          ['staff', 'admin', 'formateur', 'modérateur', 'moderateur', 'fondateur', 'direction', 'support'].some((kw) =>
            String(r).toLowerCase().includes(kw)
          )
        );
        if (isStaff) return;

        // Check auto-reminder and inactivity levels
        if (m.autoReminderFlag) {
          if (m.autoReminderLevel === '24h') autoReminder24hCount++;
          else if (m.autoReminderLevel === '12h') autoReminder12hCount++;
          else autoReminder6hCount++;
        }
        if (m.candidateState === 'expulse_inactivite') {
          inactive3dCount++;
        }

        const validatedModulesCount = Object.values(m.progress || {}).filter((p) => p.status === 'valide').length;
        const hasStarted =
          Boolean(m.candidateState && m.candidateState !== 'nouveau') ||
          Object.values(m.progress || {}).some(
            (p) => (p.attemptsCount && p.attemptsCount > 0) || p.status === 'en_cours' || p.status === 'valide' || p.score !== undefined
          );

        if (m.candidateState === 'formation_terminee' || validatedModulesCount >= totalModules) {
          completedAllMembers.push(m);
        } else if (m.candidateState === 'formation_outils') {
          toolsFormationMembers.push(m);
        } else if (m.candidateState === 'simulation') {
          simulationMembers.push(m);
        } else if (validatedModulesCount === 0 && !hasStarted) {
          unstartedCount++;
          unstartedMembers.push(m);
        } else {
          // En cours sur son module actuel
          const curModId = m.currentModuleId || (modules[validatedModulesCount]?.id) || modules[0]?.id;
          if (curModId && moduleMembersMap[curModId]) {
            moduleMembersMap[curModId].push(m);
          } else if (modules[0]) {
            moduleMembersMap[modules[0].id].push(m);
          }
        }
      });

      const completedAllCount = completedAllMembers.length;
      const activeOrCompleted = totalJoined - unstartedCount;
      const engagementPct = totalJoined > 0 ? Math.round((activeOrCompleted / totalJoined) * 100) : 0;
      const completionPct = totalJoined > 0 ? Math.round((completedAllCount / totalJoined) * 100) : 0;

      // Calculate today's simulation stats
      const simAttempts = store.getSimulationAttempts() || [];
      const todayStr = store.getFormattedNow().split(' ')[0] || '';
      const todaySims = simAttempts.filter((a) => a.timestamp && a.timestamp.startsWith(todayStr));
      const todaySimPassed = todaySims.filter((a) => a.passed).length;
      const todaySimFailed = todaySims.length - todaySimPassed;
      const todayAvgSimScore = todaySims.length > 0
        ? Math.round(todaySims.reduce((sum, a) => sum + (a.totalScore || 0), 0) / todaySims.length)
        : 0;

      const periodTitles = {
        daily: '📊 STATISTIQUES JOURNALIÈRES (18h00 HF)',
        weekly: '📅 STATISTIQUES HEBDOMADAIRES (Vendredi 18h00 HF)',
        monthly: '🗓️ STATISTIQUES MENSUELLES (Bilan Fin de Mois 18h00 HF)',
      };

      const modulesBreakdownLines = modules.map((mod, idx) => {
        const modMems = moduleMembersMap[mod.id] || [];
        const count = modMems.length;
        const namesList = count > 0
          ? ` (${modMems.map((m) => `**${m.username}**`).slice(0, 5).join(', ')}${count > 5 ? '...' : ''})`
          : '';
        return `• **${mod.title}** (Niveau ${idx + 1}) : **${count} candidat(s)**${namesList}`;
      });

      const statsEmbed = new EmbedBuilder()
        .setTitle(periodTitles[type] || periodTitles.daily)
        .setDescription(
          `📈 **Bilan Global de la Formation PAWAKO**\n` +
          `*(Calcul basé exclusivement sur l'avancement réel par module)*\n\n` +
          `👥 **Total Inscrits :** **${totalJoined}**  |  📊 **Engagement :** **${engagementPct}%**\n\n` +
          `😴 **0 module démarré (Inactifs initial) :** **${unstartedCount} membre(s)**\n` +
          `*(Message "Boost Revenus" transmis par DM)*\n\n` +
          `📚 **Répartition Candidats par Module :**\n` +
          `${modulesBreakdownLines.join('\n')}\n\n` +
          `🎯 **Simulations IA Anthony (En cours : ${simulationMembers.length}) :**\n` +
          `• Simulations aujourd'hui : **${todaySims.length}** (${todaySimPassed} validées, ${todaySimFailed} échecs)\n` +
          `• Score moyen aujourd'hui : **${todayAvgSimScore}/100**\n` +
          (simulationMembers.length > 0 ? `• Candidats en simu : ${simulationMembers.map((m) => `**${m.username}**`).join(', ')}\n` : '') +
          `\n🛠️ **Formation Outils (En cours : ${toolsFormationMembers.length}) :**\n` +
          (toolsFormationMembers.length > 0 ? `• Candidats : ${toolsFormationMembers.map((m) => `**${m.username}**`).join(', ')}\n` : '• Aucun candidat actuellement\n') +
          `\n🚨 **Suivi Relances & Inactivité :**\n` +
          `• 🔔 Relances 6h : **${autoReminder6hCount}**  |  12h : **${autoReminder12hCount}**  |  24h : **${autoReminder24hCount}**\n` +
          `• 🔴 Expulsés 3j Inactivité : **${inactive3dCount}**\n\n` +
          `🎓 **Diplômés / Formés Intégrés :** **${completedAllCount} membre(s)** (${completionPct}%)\n` +
          (completedAllMembers.length > 0 ? `• Membres : ${completedAllMembers.map((m) => `**${m.username}**`).slice(0, 10).join(', ')}` : '')
        )
        .setColor(0x6366f1)
        .setFooter({ text: 'PAWAKO FORMATION • Rapport Automatique Staff (18h00 HF)' })
        .setTimestamp();

      await statsChannel.send({ embeds: [statsEmbed] });

      // Send reminder "se faire de l'argent" to unstarted members in their private channel ONLY
      let dmSentCount = 0;
      for (const m of unstartedMembers) {
        try {
          const pChan = await this.getCandidateChannel(m, true);
          if (pChan) {
            const dmEmbed = new EmbedBuilder()
              .setTitle('💼 C\'est le moment de se faire de l\'argent !')
              .setDescription(
                `Salut **${m.username}** ! 👋\n\n` +
                `Tu as rejoint PAWAKO FORMATION mais tu n'as pas encore lancé ton Module 1.\n` +
                `C'est le moment idéal pour concrétiser tes ambitions et générer tes premiers revenus ! 💰\n\n` +
                `👉 Clique sur le bouton ci-dessous **"🚀 Lancer la formation"** pour débloquer ton premier cours et ton quiz !`
              )
              .setColor(0x10b981)
              .setFooter({ text: 'PAWAKO FORMATION • Boost Revenus & Motivation' });

            const channelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('start_training_module_1')
                .setLabel('🚀 Lancer le Module 1')
                .setStyle(ButtonStyle.Success)
            );

            await pChan.send({
              content: `<@${m.discordId || m.id.replace('mem-', '')}>`,
              embeds: [dmEmbed],
              components: [channelRow],
            }).catch(() => {});
            dmSentCount++;
          }
        } catch (dmErr) {
          console.warn(`[Stats Reminder Warning] Relance non envoyée à ${m.username}:`, dmErr);
        }
      }

      return {
        success: true,
        details: `Rapport ${type} publié sur #stats (${totalJoined} inscrits, ${unstartedCount} relancés par DM).`,
      };
    } catch (err: any) {
      console.error('[sendStatsReport Error]', err);
      return { success: false, details: err?.message || 'Erreur lors du rapport de statistiques' };
    }
  }

  /**
   * Triggers personalized follow-up messages for candidates depending on their module progress.
   * Completely isolated from simulation channels.
   */
  public async triggerPersonalizedCandidateFollowups(): Promise<number> {
    if (!this.client || !this.isConnected) return 0;
    let count = 0;
    const modules = store.getModules();
    const members = store.getMembers().filter((m) => m.isActive !== false && m.candidateState !== 'formation_terminee');

    for (const m of members) {
      if (!m.personalChannelId) continue;

      // Do NOT send follow-up inside an active simulation session!
      if (this.activeAnthonySessions.has(m.personalChannelId)) continue;

      try {
        const channel = await this.client.channels.fetch(m.personalChannelId).catch(() => null);
        if (!channel || !('send' in channel)) continue;

        const followupMsg = await communityService.generatePersonalizedFollowup(m, modules);
        if (followupMsg) {
          const validatedCount = Object.values(m.progress || {}).filter((p) => p.status === 'valide').length;
          const isSimu = m.candidateState === 'simulation' || validatedCount >= (modules.length || 5);
          const isOnboarding = m.candidateState === 'nouveau' || m.candidateState === 'bienvenue_validee' || (!m.candidateState && validatedCount === 0);

          const components: any[] = [];
          if (isSimu) {
            components.push(
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`launch_simu_${m.id}`)
                  .setLabel('🚀 Lancer la Simulation IA')
                  .setStyle(ButtonStyle.Primary)
              )
            );
          } else if (isOnboarding) {
            components.push(
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId('start_training_module_1')
                  .setLabel('🚀 Commencer la formation')
                  .setStyle(ButtonStyle.Success)
              )
            );
          }

          const followupEmbed = new EmbedBuilder()
            .setTitle('🎯 SUIVI DE PARCOURS & FORMATION PAWAKO')
            .setDescription(followupMsg)
            .setColor(isSimu ? 0x3b82f6 : 0x8b5cf6)
            .setFooter({ text: '💬 Alex, Pawako Community Coach • On avance ensemble !' })
            .setTimestamp();

          await (channel as any).send({ embeds: [followupEmbed], components }).catch(() => {});
          count++;
        }
      } catch (err) {
        console.warn(`[Followup Error for ${m.username}]`, err);
      }
    }

    return count;
  }

  /**
   * Posts the daily Community Manager boost (Tip + French rule + Music + Mini-Game) to general/discussion channel.
   */
  public async publishDailyCommunityPost(targetChan?: TextChannel): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    let channel = targetChan;
    if (!channel) {
      const guild = this.client.guilds.cache.first();
      if (guild) {
        const found = guild.channels.cache.find(
          (c) =>
            c.isTextBased() &&
            (c.name.includes('général') ||
              c.name.includes('general') ||
              c.name.includes('annonces') ||
              c.name.includes('discussion') ||
              c.name.includes('formation'))
        );
        if (found && 'send' in found) channel = found as TextChannel;
      }
    }

    if (!channel) return false;

    try {
      const daily = await communityService.generateDailyCommunityContent();

      const dailyEmbed = new EmbedBuilder()
        .setTitle('⚡ PAWAKO COMMUNITY CM — LA DOSE D\'ÉNERGIE DU JOUR 🚀')
        .setDescription(
          `Salut l'équipe ! Voici votre condensé d'inspiration et d'entraînement pour cartonner aujourd'hui ! 🔥\n\n` +
          `💡 **${daily.tipTitle}**\n${daily.tipContent}\n\n` +
          `✍️ **L'Astuce Français & Style : ${daily.frenchRule}**\n` +
          `❌ *À éviter :* \`${daily.frenchBad}\`\n` +
          `✅ *À privilégier :* \`${daily.frenchGood}\`\n` +
          `💡 *Conseil :* ${daily.frenchTip}\n\n` +
          `🎧 **La Playlist Boost : ${daily.musicTitle}**\n${daily.musicDesc}\n` +
          `[👉 Écouter sur Spotify](${daily.musicUrl})\n` +
          `_${daily.musicQuote}_\n\n` +
          `🎮 **${daily.miniGame.title} :**\n${daily.miniGame.scenario}`
        )
        .setColor(0xec4899)
        .setFooter({ text: ' Alex, Pawako CM & Animation Discord' })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>();
      daily.miniGame.options.forEach((opt, idx) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`cm_game_opt_${daily.miniGame.id}_${idx}`)
            .setLabel(opt.label.substring(0, 80))
            .setStyle(ButtonStyle.Primary)
        );
      });

      const components: any[] = [];
      if (daily.miniGame.options.length > 0) {
        components.push(row);
      }
      if (daily.musicUrl) {
        components.push(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('🎧 Écouter la Playlist du Jour')
              .setStyle(ButtonStyle.Link)
              .setURL(daily.musicUrl)
          )
        );
      }

      await channel.send({ embeds: [dailyEmbed], components }).catch(() => {});
      return true;
    } catch (err) {
      console.warn('[publishDailyCommunityPost Error]', err);
      return false;
    }
  }

  private lastCronRunDate: string = '';
  private lastInactivityCheckTimestamp: number = 0;

  /**
   * Periodic runner checking 18h00 HF schedule for stats dispatch
   */
  private startScheduledCron() {
    setInterval(() => {
      if (!this.isConnected || !this.client) return;

      try {
        const now = new Date();
        const parisStr = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        const pDate = new Date(parisStr);
        const hours = pDate.getHours();
        const minutes = pDate.getMinutes();

        // Check 14h00 HF simulation reminders
        this.checkSimulationReminders();

        // Check 10h00 HF tools formation reminders
        this.checkToolsFormationReminders();

        // Check 11h00 HF daily community post and personalized candidate followups
        if (hours === 11 && minutes === 0) {
          this.triggerPersonalizedCandidateFollowups().catch(() => {});
          this.publishDailyCommunityPost().catch(() => {});
        }

        // Update leaderboard in #classement-formation
        this.updateLeaderboardChannel().catch(() => {});

        // Check if 18h00 HF
        if (hours === 18 && minutes === 0) {
          const year = pDate.getFullYear();
          const month = String(pDate.getMonth() + 1).padStart(2, '0');
          const day = String(pDate.getDate()).padStart(2, '0');
          const todayKey = `${year}-${month}-${day}`;

          if (this.lastCronRunDate !== todayKey) {
            this.lastCronRunDate = todayKey;
            const dayOfWeek = pDate.getDay(); // 5 = Friday
            const dayOfMonth = pDate.getDate();
            const totalDaysInMonth = new Date(pDate.getFullYear(), pDate.getMonth() + 1, 0).getDate();

            console.log(`[PAWAKO BOT] Lancement automatique du rapport #stats à 18h00 HF (${todayKey})...`);

            this.sendStatsReport('daily').catch((err) => console.warn('[Daily Stats Error]', err));

            if (dayOfWeek === 5) {
              this.sendStatsReport('weekly').catch((err) => console.warn('[Weekly Stats Error]', err));
            }

            if (dayOfMonth === totalDaysInMonth) {
              this.sendStatsReport('monthly').catch((err) => console.warn('[Monthly Stats Error]', err));
            }
          }
        }
      } catch (err) {
        console.warn('[Scheduled Cron Warning]', err);
      }
    }, 35 * 1000); // Check every 35 seconds
  }

  /**
   * Send Staff Alert for candidate in difficulty (e.g. 2-3 consecutive fails or stuck > 48h)
   * Auto-creates #staff-alerts channel on Discord if it doesn't exist yet!
   */
  public async sendStaffAlert(
    member: Member,
    quizTitle: string,
    score: number,
    totalQuestions: number,
    attemptsCount: number,
    reasonType: 'consecutive_failures' | 'stuck_48h'
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const config = onboardingService.getConfig();
      let staffChannel: TextChannel | null = null;

      if (config.logChannelId && /^\d{17,20}$/.test(config.logChannelId)) {
        staffChannel = (await this.client.channels.fetch(config.logChannelId).catch(() => null)) as TextChannel | null;
      }

      const guildId = config.guildId || this.client.guilds.cache.first()?.id;
      let guild: any = null;
      if (guildId) {
        guild = await this.client.guilds.fetch(guildId).catch(() => null);
      }
      if (!guild && this.client.guilds.cache.size > 0) {
        guild = this.client.guilds.cache.first();
      }

      if (guild) {
        if (!staffChannel) {
          const channels = await guild.channels.fetch().catch(() => null);
          if (channels) {
            staffChannel = channels.find(
              (c: any) =>
                c &&
                c.isTextBased() &&
                (c.name.includes('staff-alert') ||
                  c.name.includes('alertes-staff') ||
                  c.name.includes('alerts-staff') ||
                  c.name.includes('staff-alerts') ||
                  c.name.includes('alert') ||
                  c.name.includes('staff'))
            ) as TextChannel | null;
          }
        }

        // Auto-create #staff-alerts channel if it does not exist on Discord!
        if (!staffChannel && guild) {
          try {
            staffChannel = (await guild.channels.create({
              name: 'staff-alerts',
              type: ChannelType.GuildText,
              topic: '🚨 Alertes Automatiques — Candidats en difficulté sur l\'onboarding PAWAKO',
            })) as TextChannel;
            console.log('[PawakoBot] Salon #staff-alerts créé avec succès sur Discord.');
          } catch (createErr) {
            console.warn('[PawakoBot] Erreur création auto salon #staff-alerts:', createErr);
          }
        }
      }

      if (!staffChannel) return false;

      const minScore = Math.round(totalQuestions * 0.8);
      const isFailures = reasonType === 'consecutive_failures';

      const alertEmbed = new EmbedBuilder()
        .setTitle('🚨 ALERTE STAFF — CANDIDAT EN DIFFICULTÉ')
        .setDescription(
          `👤 **Candidat :** <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**)\n` +
          `📚 **Module / Quiz :** **${quizTitle}**\n` +
          `📍 **Salon privé du candidat :** ${member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon Privé'}\n\n` +
          (isFailures
            ? `⚠️ **Raison :** **${attemptsCount} échecs consécutifs** au quiz !\n` +
              `📊 **Dernier score :** **${score}/${totalQuestions}** (Minimum requis : ${minScore}/${totalQuestions})`
            : `⏱️ **Raison :** Inactif ou bloqué depuis **plus de 48 heures** sans valider le module.`)
        )
        .setColor(0xef4444)
        .setFooter({ text: 'PAWAKO FORMATION • Notification Automatique Staff' })
        .setTimestamp();

      const alertRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`staff_reset_cooldown_${member.id}`)
          .setLabel('🔓 Accorder une tentative (Reset Cooldown)')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`staff_encourage_member_${member.id}`)
          .setLabel('💬 Message de Soutien')
          .setStyle(ButtonStyle.Primary)
      );

      await staffChannel.send({
        content: `🚨 **[ALERTE STAFF]** <@${member.discordId || member.id.replace('mem-', '')}> nécessite une assistance sur **${quizTitle}** !`,
        embeds: [alertEmbed],
        components: [alertRow],
      }).catch((e) => console.warn('[Send Staff Alert Error]', e));

      return true;
    } catch (err) {
      console.error('[PawakoBot] sendStaffAlert Exception:', err);
      return false;
    }
  }

  /**
   * Send Staff Alert for candidate who failed simulation due to 5+ coach interventions
   */
  public async sendSimulationStaffAlert(
    member: Member,
    session: ActiveAnthonySession,
    interventionsCount: number
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const config = onboardingService.getConfig();
      let staffChannel: TextChannel | null = null;

      if (config.logChannelId && /^\d{17,20}$/.test(config.logChannelId)) {
        staffChannel = (await this.client.channels.fetch(config.logChannelId).catch(() => null)) as TextChannel | null;
      }

      const guildId = config.guildId || this.client.guilds.cache.first()?.id;
      let guild: any = null;
      if (guildId) {
        guild = await this.client.guilds.fetch(guildId).catch(() => null);
      }
      if (!guild && this.client.guilds.cache.size > 0) {
        guild = this.client.guilds.cache.first();
      }

      if (guild && !staffChannel) {
        const channels = await guild.channels.fetch().catch(() => null);
        if (channels) {
          staffChannel = channels.find(
            (c: any) =>
              c &&
              c.isTextBased() &&
              (c.name.includes('staff-alert') ||
                c.name.includes('alertes-staff') ||
                c.name.includes('alerts-staff') ||
                c.name.includes('staff-alerts') ||
                c.name.includes('alert') ||
                c.name.includes('staff'))
          ) as TextChannel | null;
        }
      }

      if (!staffChannel && guild) {
        staffChannel = (await guild.channels.create({
          name: 'staff-alerts',
          type: ChannelType.GuildText,
          topic: '🚨 Alertes Automatiques — Simulation & Candidats PAWAKO',
        })) as TextChannel;
      }

      if (!staffChannel) return false;

      const remainingAttempts = Math.max(0, 5 - (member.simulationAttemptsCount || 1));

      const staffEmbed = new EmbedBuilder()
        .setTitle('🚨 ALERTE SIMULATION : ÉCHEC PAR ALERTES COACH')
        .setDescription(
          `👤 **Candidat :** <@${member.discordId || member.id.replace('mem-', '')}> (**${member.username}**)\n` +
          `❌ **Motif :** **Plus de 5 interventions/alertes du Coach** déclenchées en simulation (${interventionsCount} alertes coach).\n` +
          `📊 **Tentatives de simulation :** **${member.simulationAttemptsCount || 1} / 5** (${remainingAttempts} restante(s))\n` +
          `📍 **Salon privé :** <#${session.channelId}>\n\n` +
          ` Le candidat a été notifié de l'échec et a été invité à recommencer la simulation depuis le début.`
        )
        .setColor(0xef4444)
        .setFooter({ text: 'PAWAKO FORMATION • Alerte Simulation Staff' })
        .setTimestamp();

      await staffChannel.send({
        content: `🚨 **[ALERTE SIMULATION STAFF]** <@1179090626027151390> <@1178783478982348821> <@${member.discordId || member.id.replace('mem-', '')}> a échoué sa tentative de simulation (${interventionsCount} alertes coach) !`,
        embeds: [staffEmbed],
      }).catch((e) => console.warn('[Send Simu Staff Alert Error]', e));

      return true;
    } catch (err) {
      console.error('[Send Simu Staff Alert Exception]', err);
      return false;
    }
  }

  /**
   * Render and manage quiz questions with 15-second per question timer
   */
  private async renderQuizQuestion(
    session: ActiveQuizSession,
    interaction?: any,
    isTimeoutTransition: boolean = false
  ) {
    // Clear any existing timer for this session
    if (session.questionTimer) {
      clearTimeout(session.questionTimer);
      session.questionTimer = undefined;
    }

    const currentIndex = session.currentIndex;
    const questions = session.questions;

    // Check if session completed
    if (currentIndex >= questions.length) {
      await this.completeQuizSession(session, interaction);
      return;
    }

    const q = questions[currentIndex];
    const quiz = store.getQuiz(session.quizId) || store.getQuizzes()[0];
    const requiredMinScore = getQuizMinScoreRequired(quiz, questions.length);

    const expiresAt = Date.now() + 15000;
    const tsSec = Math.floor(expiresAt / 1000);

    const qEmbed = new EmbedBuilder()
      .setTitle(`📝 ${session.quizTitle} — Question ${currentIndex + 1} / ${questions.length}`)
      .setDescription(
        `<@${session.discordUserId}>\n\n` +
        `⏱️ **Temps restant : 15 secondes** (<t:${tsSec}:R>)\n\n` +
        `**${q.text}**`
      )
      .setColor(0x6366f1)
      .setFooter({
        text: `PAWAKO FORMATION • 15s max par question • Minimum requis : ${requiredMinScore}/${questions.length}`,
      });

    const optionRow = new ActionRowBuilder<ButtonBuilder>();
    const optionLabels = ['A', 'B', 'C', 'D', 'E'];

    q.options.forEach((optText, optIdx) => {
      const labelPrefix = optionLabels[optIdx] || `${optIdx + 1}`;
      optionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`qa:${session.attemptId}:${currentIndex}:${optIdx}`)
          .setLabel(`${labelPrefix}. ${optText.slice(0, 70)}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    if (interaction) {
      try {
        const msg = await interaction.editReply({ embeds: [qEmbed], components: [optionRow] });
        if (msg) {
          session.messageId = msg.id;
          session.channelId = msg.channelId;
        }
      } catch (err) {
        console.warn('[renderQuizQuestion interaction reply error]', err);
      }
    } else if (session.channelId && session.messageId && this.client) {
      try {
        const chan = await this.client.channels.fetch(session.channelId).catch(() => null);
        if (chan && 'messages' in chan) {
          const msg = await (chan as any).messages.fetch(session.messageId).catch(() => null);
          if (msg) {
            await msg.edit({ embeds: [qEmbed], components: [optionRow] });
          } else {
            const newMsg = await (chan as any).send({ embeds: [qEmbed], components: [optionRow] });
            session.messageId = newMsg.id;
          }
        }
      } catch (err) {
        console.warn('[renderQuizQuestion timer edit error]', err);
      }
    }

    // Set 15-second timer for this question
    session.questionTimer = setTimeout(() => {
      const activeSession = this.activeQuizSessions.get(session.attemptId);
      if (!activeSession || activeSession.currentIndex !== currentIndex) return;

      // Unanswered question -> mark as false (-1)
      activeSession.userAnswers.push(-1);
      activeSession.currentIndex += 1;

      // Automatically advance to next question
      this.renderQuizQuestion(activeSession, undefined, true).catch((e) =>
        console.warn('[renderQuizQuestion timeout advance error]', e)
      );
    }, 15000);
  }

  /**
   * Finalize quiz attempt session and assign pass/fail roles and cooldowns
   */
  private async completeQuizSession(session: ActiveQuizSession, interaction?: any) {
    if (session.questionTimer) {
      clearTimeout(session.questionTimer);
      session.questionTimer = undefined;
    }

    this.activeQuizSessions.delete(session.attemptId);

    const discordUserId = session.discordUserId;
    const member =
      store.getMember(discordUserId) ||
      store.getMembers().find((m) => m.discordId === discordUserId || m.id === discordUserId) ||
      store.getOrCreateCandidate(discordUserId, discordUserId);

    const finalScore = session.score;
    const totalQuestions = session.questions.length;
    const quiz = store.getQuiz(session.quizId) || store.getQuizzes()[0];
    const minScore = getQuizMinScoreRequired(quiz, totalQuestions);
    const passed = finalScore >= minScore;

    member.lastActiveAt = store.getFormattedNow();

    // Record attempt in store
    store.addQuizAttempt({
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      memberId: member.id,
      memberName: member.username,
      score: finalScore,
      passed,
      answers: session.userAnswers,
      date: store.getFormattedNow(),
      attemptNumber: (member.progress[quiz.moduleId]?.attemptsCount || 0) + 1,
    });

    const config = onboardingService.getConfig();
    const guildId = config.guildId || this.client?.guilds.cache.first()?.id;
    let guild: any = null;
    if (guildId && this.client) {
      guild = await this.client.guilds.fetch(guildId).catch(() => null);
    }

    let resultEmbed: EmbedBuilder;
    let resultRow: ActionRowBuilder<ButtonBuilder>;

    if (passed) {
      // Log activity: Quiz success
      store.addLog(
        member.username,
        `[QUIZ_SUCCESS] Quiz validé : ${quiz.title} - Score: ${finalScore}/${totalQuestions} (Minimum requis: ${minScore})`,
        'quiz',
        member.username,
        quiz.title,
        quiz.moduleId
      );

      // Mark module validated
      const prevAttempts = member.progress[quiz.moduleId]?.attemptsCount || 0;
      member.progress[quiz.moduleId] = {
        moduleId: quiz.moduleId,
        status: 'valide',
        validatedAt: store.getFormattedNow(),
        quizPassed: true,
        score: finalScore,
        attemptsCount: prevAttempts + 1,
      };

      // Find next module in order
      const currentMod = store.getModule(quiz.moduleId) || store.getModules()[0];
      const nextMod = store.getModules().find((m) => m.order === (currentMod?.order || 1) + 1);
      const isModule5OrFinal = !nextMod || quiz.moduleId === 'module-5' || quiz.id === 'quiz-5' || (currentMod && currentMod.order === 5);

      if (nextMod) {
        member.progress[nextMod.id] = {
          moduleId: nextMod.id,
          status: 'en_cours',
          attemptsCount: 0,
        };
        member.currentModuleId = nextMod.id;
        member.candidateState = 'module_en_cours';

        const stepCfg = onboardingService.getStepConfigForModule(quiz.moduleId);
        const nextStepCfg = nextMod ? onboardingService.getStepConfigForModule(nextMod.id) : null;
        const nextQuiz = store.getQuiz(nextMod.quizId || '') || store.getQuizzes().find((q) => q.moduleId === nextMod.id);
        const delayMins = nextQuiz?.delayMinutesBeforeQuiz ?? nextStepCfg?.delayMinutesBeforeQuiz ?? 0;
        member.currentQuizAvailableAtTimestamp = delayMins > 0 ? Date.now() + delayMins * 60 * 1000 : 0;

        const passRoleName = stepCfg?.roleOnPassName || stepCfg?.roleOnPassId;
        const currentStartRole = stepCfg?.roleOnStartName || stepCfg?.roleOnStartId;
        const nextStartRoleName = nextStepCfg?.roleOnStartName || nextStepCfg?.roleOnStartId;

        let updatedRoles = [...(member.roles || [])];
        if (currentStartRole) {
          updatedRoles = updatedRoles.filter((r) => r !== currentStartRole);
        }
        if (passRoleName) updatedRoles.push(passRoleName);
        if (nextMod && nextStartRoleName) updatedRoles.push(nextStartRoleName);

        member.roles = Array.from(new Set(updatedRoles.filter(Boolean)));
        if (guild) {
          syncMemberRolesOnGuild(guild, discordUserId, member.roles).catch(() => {});
        }
        discordService.assignDiscordRolesToMember(discordUserId, member.roles).catch(() => {});
      } else {
        member.candidateState = 'simulation';
        const stepCfg = onboardingService.getStepConfigForModule(quiz.moduleId);
        const passRoleName = stepCfg?.roleOnPassName || stepCfg?.roleOnPassId;
        const currentStartRole = stepCfg?.roleOnStartName || stepCfg?.roleOnStartId;

        let updatedRoles = [...(member.roles || [])];
        if (currentStartRole) {
          updatedRoles = updatedRoles.filter((r) => r !== currentStartRole);
        }
        if (passRoleName) {
          updatedRoles.push(passRoleName);
        }
        member.roles = Array.from(new Set(updatedRoles.filter(Boolean)));
        if (guild) {
          syncMemberRolesOnGuild(guild, discordUserId, member.roles).catch(() => {});
        }
        discordService.assignDiscordRolesToMember(discordUserId, member.roles).catch(() => {});
      }

      if (isModule5OrFinal) {
        member.candidateState = 'simulation';
        store.addLog(
          member.username,
          `🏆 [PARCOURS_VALIDÉ_MODULE_5] Le candidat ${member.username} a réussi le Quiz du Module 5 ! Staff notifié sur Discord.`,
          'quiz',
          member.username,
          quiz.title,
          quiz.moduleId
        );
        this.notifyStaffModule5Completion(member, quiz.title, finalScore, totalQuestions, minScore).catch(() => {});

        const simValidateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`staff_validate_simu_${member.id}`)
            .setLabel(`🏆 Valider la Simulation de ${member.username}`)
            .setStyle(ButtonStyle.Success)
        );

        // Guarantee candidate private channel creation / retrieval
        const candChan = await this.getCandidateChannel(member, true);
        if (candChan) {
          member.candidateState = 'simulation';
          member.simulationScheduledTimestamp = getNext14hParisTimestamp();
          member.simulationReminderSent = false;
          store.saveMembers();
          firebaseSyncService.saveMember(member).catch(() => {});

          const next14hDateStr = new Date(member.simulationScheduledTimestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

          const simEmbed = new EmbedBuilder()
            .setTitle('🚀 MODULE 5 VALIDÉ — INVITATION AU TEST DE SIMULATION')
            .setDescription(
              `Félicitations encore <@${discordUserId}> pour la validation complète de ta formation théorique ! 🏆\n\n` +
              `🎯 **Étape Finale : Le Test de Simulation Pratique**\n` +
              `Ton test de simulation est au programme pour **14h00 HF** (${next14hDateStr}).\n\n` +
              `💡 **Prêt(e) à passer ton test dès maintenant ?** Tu peux le lancer en direct à tout moment en cliquant sur le bouton ci-dessous ou en tapant **\`!start-simu\`** dans ce salon ! 🚀`
            )
            .setColor(0x3b82f6)
            .setFooter({ text: 'PAWAKO FORMATION • Test de Simulation IA' })
            .setTimestamp();

          const simRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`launch_simu_${member.id}`)
              .setLabel('🚀 Démarrer la Simulation')
              .setStyle(ButtonStyle.Primary)
          );

          await candChan.send({
            content: `<@${discordUserId}>`,
            embeds: [simEmbed],
            components: [simRow],
          }).catch((e: any) => console.warn('[Sim Launch Send Error]', e));
        }

        // Direct MP / Staff Alert Notification
        const mpSimuEmbed = new EmbedBuilder()
          .setTitle('🎭 CANDIDAT EN SIMULATION IA EN DIRECT')
          .setDescription(
            `📢 **Notification Privée Staff**\n\n` +
            `Le candidat <@${discordUserId}> (**${member.username}**) a validé l'intégralité du parcours théorique ! 🏆\n\n` +
            `🚀 **Simulation IA :** Démarrée immédiatement dans son salon privé.\n` +
            `📍 **Salon privé candidat :** ${member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon privé'}\n\n` +
            `👉 **Pour valider sa simulation en 1-clic**, appuyez simplement sur le bouton vert ci-dessous :`
          )
          .setColor(0x3b82f6)
          .setFooter({ text: 'PAWAKO FORMATION • Validation Simulation 1-Clic' })
          .setTimestamp();

        this.sendDirectMessageToStaff(mpSimuEmbed, [simValidateRow]).catch(() => {});
      }

      this.updateLeaderboardChannel().catch(() => {});

      store.saveMembers();
      firebaseSyncService.saveMember(member).catch(() => {});

      resultEmbed = new EmbedBuilder()
        .setTitle(`🎉 QUIZ RÉUSSI ! (${finalScore}/${totalQuestions})`)
        .setDescription(
          `Félicitations <@${discordUserId}> ! Tu as validé **${quiz.title}** avec un score de **${finalScore}/${totalQuestions}** (Seuil minimum : ${minScore}/${totalQuestions}).\n\n` +
          (nextMod
            ? `Le **${nextMod.title}** est maintenant débloqué dans ton espace !`
            : '🏆 Félicitations ! Tu as terminé l\'ensemble du parcours de formation PAWAKO !')
        )
        .setColor(0x10b981)
        .setFooter({ text: 'PAWAKO FORMATION • Validation Réussie' })
        .setTimestamp();

      resultRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(nextMod ? `start_module_${nextMod.id}` : 'btn_profile')
          .setLabel(nextMod ? '📚 Module Suivant' : '🎓 Parcours Terminé')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
      );
    } else {
      // Quiz Failed - Activate Cooldown
      const cooldownMins = quiz?.cooldownMinutes ?? onboardingService.getConfig().cooldownMinutes ?? 15;
      member.cooldownUntilTimestamp = Date.now() + cooldownMins * 60 * 1000;
      member.candidateState = 'cooldown_actif';

      // store.addQuizAttempt already incremented attemptsCount in member.progress
      const currentAttempts = member.progress[quiz.moduleId]?.attemptsCount || 1;
      member.progress[quiz.moduleId] = {
        ...(member.progress[quiz.moduleId] || { moduleId: quiz.moduleId, status: 'en_cours' }),
        attemptsCount: currentAttempts,
        score: finalScore,
        quizPassed: false,
      };

      store.saveMembers();
      firebaseSyncService.saveMember(member).catch(() => {});

      // Trigger Staff Alert if candidate fails 2 or more times in a row
      if (currentAttempts >= 2) {
        this.sendStaffAlert(
          member,
          quiz.title,
          finalScore,
          totalQuestions,
          currentAttempts,
          'consecutive_failures'
        ).catch((err) => console.warn('[Staff Alert Fail Trigger Error]', err));
      }

      // Send automatic pedagogical advice message if candidate fails 2+ times
      let adviceMessageFormatted = '';
      if (currentAttempts >= 2) {
        try {
          const cfg = onboardingService.getConfig();
          const advicePool = cfg.repeatedFailurePool && cfg.repeatedFailurePool.length > 0
            ? cfg.repeatedFailurePool
            : [
                "⚠️ **Conseil Formation PAWAKO**\n\n<@{discordId}>, nous avons remarqué que tu as 2 échecs ou plus au quiz **{quizTitle}**.\n💡 Prends le temps de bien relire et maîtriser l'intégralité du module avant de retenter ta chance ! 📚"
              ];

          const rawAdvice = advicePool[Math.floor(Math.random() * advicePool.length)];
          adviceMessageFormatted = rawAdvice
            .replace(/\{discordId\}/g, member.discordId || member.id.replace('mem-', ''))
            .replace(/\{quizTitle\}/g, quiz.title)
            .replace(/\{username\}/g, member.username);

          // Find candidate channel in priority order
          let targetChan: any = null;
          if (member.personalChannelId && this.client) {
            targetChan = await this.client.channels.fetch(member.personalChannelId).catch(() => null);
          }
          if (!targetChan && session.channelId && this.client) {
            targetChan = await this.client.channels.fetch(session.channelId).catch(() => null);
          }
          if (!targetChan && interaction?.channel) {
            targetChan = interaction.channel;
          }

          if (targetChan && 'send' in targetChan) {
            const adviceEmbed = new EmbedBuilder()
              .setTitle(`📖 CONSEIL PÉDAGOGIQUE — TENTATIVE N°${currentAttempts}`)
              .setDescription(adviceMessageFormatted)
              .setColor(0xf59e0b)
              .setFooter({ text: 'PAWAKO FORMATION • Conseil & Pédagogie (2+ Échecs)' })
              .setTimestamp();

            await targetChan.send({
              content: `📖 <@${member.discordId || member.id.replace('mem-', '')}>`,
              embeds: [adviceEmbed],
            }).catch((err: any) => console.warn('[Send Advice Error]', err));
          }
        } catch (err) {
          console.warn('[2+ Fails Advice Error]', err);
        }
      }

      const cooldownTsSec = Math.floor(member.cooldownUntilTimestamp / 1000);
      resultEmbed = new EmbedBuilder()
        .setTitle(`❌ QUIZ NON VALIDÉ (${finalScore}/${totalQuestions})`)
        .setDescription(
          `Score obtenu : **${finalScore}/${totalQuestions}**\nScore minimum requis : **${minScore}/${totalQuestions}**.\n\n` +
          `⏳ Un cooldown de **${cooldownMins} minutes** est activé.\nTu pourras retenter ce quiz <t:${cooldownTsSec}:R> (dans **${cooldownMins} minutes**).\n` +
          `Prends le temps de relire les fiches de formation avant ta prochaine tentative.`
        )
        .addFields({ name: '⏱️ Déblocage du Quiz', value: `<t:${cooldownTsSec}:R>` })
        .setColor(0xef4444)
        .setFooter({ text: 'PAWAKO FORMATION • Révision Requise' })
        .setTimestamp();

      if (adviceMessageFormatted) {
        resultEmbed.addFields({
          name: '📖 Conseil de Révision Automatique',
          value: adviceMessageFormatted.length > 1024 ? adviceMessageFormatted.slice(0, 1021) + '...' : adviceMessageFormatted,
        });
      }

      resultRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        buildQuizButton(member, quiz, quiz.title),
        new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
      );
    }

    // Send or Edit message cleanly with fallback to direct message edit
    let updatedViaInteraction = false;
    if (interaction) {
      try {
        await interaction.editReply({ embeds: [resultEmbed], components: [resultRow] });
        updatedViaInteraction = true;
      } catch (err) {
        console.warn('[completeQuizSession editReply warning]', err);
      }
    }

    if (session.channelId && session.messageId && this.client) {
      try {
        const chan = await this.client.channels.fetch(session.channelId).catch(() => null);
        if (chan && 'messages' in chan) {
          const msg = await (chan as any).messages.fetch(session.messageId).catch(() => null);
          if (msg) {
            await msg.edit({ embeds: [resultEmbed], components: [resultRow] });
          } else if (!updatedViaInteraction) {
            await (chan as any).send({ embeds: [resultEmbed], components: [resultRow] });
          }
        }
      } catch (err) {
        console.warn('[completeQuizSession send error]', err);
      }
    }
  }

  /**
   * Launch Anthony simulation session for a candidate on Discord
   */
  public async startAnthonySimulationSession(
    targetMemberInput: Member,
    channel: any,
    startedByStaffUserId?: string
  ): Promise<boolean> {
    const member = store.getMember(targetMemberInput.id) || targetMemberInput;
    if (!member || !channel) return false;

    // Unmark stopped flag if previously stopped
    this.stoppedSimulationChannels.delete(channel.id);

    // Clear existing session for this channel if any
    const existingSession = this.activeAnthonySessions.get(channel.id);
    if (existingSession?.inactivityTimer) {
      clearTimeout(existingSession.inactivityTimer);
    }

    member.candidateState = 'simulation';
    member.lastActiveAt = store.getFormattedNow();
    store.saveMembers();
    firebaseSyncService.saveMember(member).catch(() => {});

    const candDiscordId = member.discordId || member.id.replace('mem-', '');
    const candMention = `<@${candDiscordId}>`;

    const newSession: ActiveAnthonySession = {
      channelId: channel.id,
      candidateId: member.id,
      candidateDiscordId: candDiscordId,
      candidateUsername: member.username,
      startedAt: Date.now(),
      lastCandidateMsgTimestamp: 0,
      lastFanMsgTimestamp: Date.now(),
      fanProfile: createRandomFanProfile(),
      extractedInfos: {
        name: false,
        age: false,
        job: false,
        location: false,
        hobbies: false,
        fantasy: false,
      },
      conversationHistory: [],
    };

    this.activeAnthonySessions.set(channel.id, newSession);

    // Initial context message sent to candidate channel
    const contextEmbed = new EmbedBuilder()
      .setTitle('🎭 DÉMARRAGE DE LA SIMULATION')
      .setDescription(
        `Tu passes maintenant à la partie simulation !\n\n` +
        `On passe à la simu, tu es le chatteur je suis le fan. Je suis un new fan qui viens de s'abonner et je n'ai pas répondu au message de relance automatique. À toi de le relancer pour qu'il réponde !\n\n` +
        `💡 **CE QUI EST EXIGÉ DE VOUS POUR RÉUSSIR :**\n` +
        `• **La maîtrise totale de la partie script**, surtout pour les **NEW FAN**.\n` +
        `• **La maîtrise des règles du PPV et des FOLLOW UP**.\n` +
        `• **La maîtrise de la partie NÉGOCIATION**.\n\n` +
        `⚠️ *Si vous ne les maîtrisez pas encore, révisionnez les cours car vous n'allez pas réussir à cette simulation !*\n\n` +
        `👉 À toi ${candMention} !`
      )
      .setColor(0x3b82f6)
      .setFooter({ text: 'PAWAKO FORMATION • Test de Simulation en Direct' })
      .setTimestamp();

    if ('send' in channel) {
      await channel.send({
        content: `📌 ${candMention}`,
        embeds: [contextEmbed],
      }).catch((e: any) => console.warn('[Start Anthony Context Error]', e));
    }

    store.addLog(
      startedByStaffUserId ? `Staff (<@${startedByStaffUserId}>)` : 'System',
      `Lancement de la simulation avec profil fan (${newSession.fanProfile?.name}) pour ${member.username} dans salon ${channel.name || channel.id}`,
      'member',
      member.username
    );

    return true;
  }

  /**
   * Complete simulation session, analyze with Coach AI, and display out-of-100 score & feedback
   */
  private async completeAnthonySimulationSession(
    session: ActiveAnthonySession,
    channel: any
  ) {
    if (session.inactivityTimer) {
      clearTimeout(session.inactivityTimer);
      session.inactivityTimer = undefined;
    }
    this.activeAnthonySessions.delete(session.channelId);

    const candMember =
      store.getMember(session.candidateId) ||
      store.getMembers().find((m) => m.id === session.candidateId || m.discordId === session.candidateDiscordId);

    if (!candMember) return;

    candMember.simulationAttemptsCount = (candMember.simulationAttemptsCount || 0) + 1;
    store.saveMembers();
    firebaseSyncService.saveMember(candMember).catch(() => {});

    if (channel && 'send' in channel) {
      await channel.send('⏳ **Simulation terminée ! Analyse complète en cours par le Coach IA Pawako...**').catch(() => {});
    }

    const evalRes = await evaluateSimulationSession(session.conversationHistory);
    const passed = evalRes.passed && evalRes.totalScore >= evalRes.passingScore;

    store.addSimulationAttempt({
      id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      memberId: candMember.id,
      memberName: candMember.username || 'Candidat',
      timestamp: store.getFormattedNow(),
      totalScore: evalRes.totalScore,
      passed,
      criteria: evalRes.criteria || [],
      globalVerdict: evalRes.globalVerdict,
      messagesCount: session.conversationHistory.filter((m) => m.role === 'user').length,
    });

    const criteriaText = (evalRes.criteria || [])
      .map(
        (c) =>
          `• **${c.name}** : **${c.score}/${c.maxPoints} pts** ${c.passed ? '✅' : '❌'}\n  └ *${c.comment}*`
      )
      .join('\n');

    const recsText = (evalRes.recommendations || []).map((r) => `• ${r}`).join('\n');

    if (passed) {
      candMember.candidateState = 'formation_terminee';
      candMember.toolsFormationValidatedAt = store.getFormattedNow();
      store.saveMembers();
      firebaseSyncService.saveMember(candMember).catch(() => {});

      const successEmbed = new EmbedBuilder()
        .setTitle('🏆 ÉVALUATION FINALE — SIMULATION VALIDÉE !')
        .setDescription(
          `Félicitations <@${session.candidateDiscordId}> ! Tu as **brillamment réussi ta simulation** ! 🎉\n\n` +
            `📊 **NOTE FINALE :** **${evalRes.totalScore} / 100** (Seuil minimum requis : ${evalRes.passingScore}/100)\n` +
            `💬 **Bilan du Coach :** ${evalRes.globalVerdict}\n\n` +
            `📋 **DÉTAIL DU BARÈME PAR CRITÈRE :**\n${criteriaText}\n\n` +
            `💡 **AXES DE PROGRÈS & POINTS FORTS :**\n${recsText || 'Excellent travail sur l\'ensemble du scénario !'}\n\n` +
            `🚀 Tu es désormais prêt(e) pour l'étape suivante de ton parcours PAWAKO !`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'PAWAKO FORMATION • Validation de Simulation' })
        .setTimestamp();

      if (channel && 'send' in channel) {
        await channel
          .send({
            content: `🎉 <@${session.candidateDiscordId}>`,
            embeds: [successEmbed],
          })
          .catch(() => {});
      }

      store.addLog(
        'System',
        `Simulation validée pour ${candMember.username} avec la note de ${evalRes.totalScore}/100`,
        'member',
        candMember.username
      );
    } else {
      const remainingAttempts = Math.max(0, 5 - candMember.simulationAttemptsCount);

      const failEmbed = new EmbedBuilder()
        .setTitle('❌ ÉVALUATION FINALE — SIMULATION NON VALIDÉE')
        .setDescription(
          `Désolé <@${session.candidateDiscordId}>, ta simulation est **non validée** car ta note est inférieure au seuil de réussite.\n\n` +
            `📊 **NOTE OBTENUE :** **${evalRes.totalScore} / 100** (Seuil requis : **${evalRes.passingScore} / 100**)\n` +
            `📊 **Tentatives effectuées :** **${candMember.simulationAttemptsCount} / 5** (${remainingAttempts} restante(s))\n\n` +
            `💬 **Verdict du Coach :** ${evalRes.globalVerdict}\n\n` +
            `📋 **DÉTAIL DU BARÈME PAR CRITÈRE :**\n${criteriaText}\n\n` +
            `🚀 **AXES D'AMÉLIORATION À TRAVAILLER :**\n${recsText || 'Revisiter les leçons sur la qualification et la négociation Bouclier + Épée.'}\n\n` +
            `🔄 **QUE FAIRE MAINTENANT ?**\n` +
            `• Tu dois **reprendre la simulation** et travailler tes axes d'amélioration.\n` +
            `• Revois bien tes leçons (Script NEW FAN, PPV, Follow up, Négociation Bouclier + Épée, Promesse d'achat).\n` +
            `• Quand tu es prêt(e), tape **\`!start-simu\`** ou clique sur le bouton ci-dessous pour relancer ta simulation !`
        )
        .setColor(0xef4444)
        .setFooter({ text: 'PAWAKO FORMATION • Échec Simulation (Note < 80/100)' })
        .setTimestamp();

      const retryRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`restart_simu_${candMember.id}`)
          .setLabel('🔄 Recommencer la Simulation')
          .setStyle(ButtonStyle.Danger)
      );

      if (channel && 'send' in channel) {
        await channel
          .send({
            content: `📢 <@${session.candidateDiscordId}>`,
            embeds: [failEmbed],
            components: [retryRow],
          })
          .catch(() => {});
      }

      store.addLog(
        'System',
        `Simulation non validée pour ${candMember.username} avec la note de ${evalRes.totalScore}/100`,
        'member',
        candMember.username
      );
    }
  }

  /**
   * Generate simulation response using OpenRouter AI (Grok)
   */
  private async generateAnthonyResponse(
    candidateMsg: string,
    session: ActiveAnthonySession
  ): Promise<string> {
    try {
      if (!session.fanProfile) {
        session.fanProfile = createRandomFanProfile();
      }

      const history = session.conversationHistory.slice(0, -1).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.role === 'assistant' ? sanitizeFanOutput(h.content) : h.content,
      }));

      // Deterministic Inspector Check for Coach Interventions
      const intervention = checkCandidateMessageForCoachIntervention(candidateMsg, history);
      if (intervention) {
        return intervention;
      }

      const prompt = getSimulationPrompt(session.fanProfile);
      const rawReply = await callOpenRouterAI(prompt, [...history, { role: 'user', content: candidateMsg }]);
      const reply = enforceFanNegotiationRules(rawReply, candidateMsg, history);
      return reply;
    } catch (err: any) {
      console.error('[SIMULATION AI FALLBACK ACTIVE]', err?.message || err);
      const cleanHistory = session.conversationHistory.slice(0, -1).map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.role === 'assistant' ? sanitizeFanOutput(h.content) : h.content,
      }));
      const fallbackReply = generateSmartFallbackFanReply(
        getSimulationPrompt(session.fanProfile),
        [...cleanHistory, { role: 'user', content: candidateMsg }]
      );
      const cleanedFallback = enforceFanNegotiationRules(fallbackReply, candidateMsg, cleanHistory);
      return cleanedFallback;
    }
  }

  /**
   * Validate Tools Formation for candidates and send Étape 3 Integration Form (Email, WhatsApp, Shift)
   */
  public async validateToolsFormationAndSendIntegrationForm(
    targetMembersInput: Member[],
    staffUserId?: string
  ): Promise<{ validated: Member[]; absent: Member[] }> {
    const validated: Member[] = [];
    const absent: Member[] = [];

    const nowStr = new Date().toLocaleString('fr-FR');

    const allMods = store.getModules();
    for (const rawMember of targetMembersInput) {
      const member = store.getMember(rawMember.id) || rawMember;
      member.candidateState = 'formation_terminee';
      member.toolsFormationValidatedAt = nowStr;
      member.lastActiveAt = store.getFormattedNow();

      if (!member.progress) member.progress = {};
      for (const mod of allMods) {
        if (!member.progress[mod.id] || member.progress[mod.id].status !== 'valide') {
          member.progress[mod.id] = {
            moduleId: mod.id,
            status: 'valide',
            score: 20,
            attemptsCount: member.progress[mod.id]?.attemptsCount || 1,
            validatedAt: nowStr,
          };
        }
      }
      member.cooldownUntilTimestamp = null;
      member.currentQuizAvailableAtTimestamp = null;

      store.saveMembers();
      firebaseSyncService.saveMember(member).catch(() => {});
      validated.push(member);

      const candDiscordId = member.discordId || member.id.replace('mem-', '');
      const candMention = `<@${candDiscordId}>`;

      const formEmbed = new EmbedBuilder()
        .setTitle("🏆 3️⃣ ÉTAPE 3 : SAISIE DES INFOS CANDIDAT (INTÉGRATION PAWAKO)")
        .setDescription(
          `Félicitations ${candMention} ! Tu as validé la **Formation Outils** en visio ! 👏\n\n` +
          `Pour finaliser ton dossier d'intégration et recevoir tes accès de travail, merci de remplir tes informations ci-dessous en cliquant sur le bouton vert :\n\n` +
          `📧 **E-mail**\n` +
          `📱 **Numéro WhatsApp**\n` +
          `⏰ **Shift / Horaires souhaités**\n\n` +
          `👉 *Clique sur le bouton ci-dessous pour ouvrir le formulaire d'intégration.*`
        )
        .setColor(0x10b981)
        .setFooter({ text: 'PAWAKO FORMATION • Étape 3 Intégration' })
        .setTimestamp();

      const formRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`fill_integration_form_${member.id}`)
          .setLabel("📝 Remplir mes Infos d'Intégration")
          .setStyle(ButtonStyle.Success)
      );

      // Send in candidate personal channel ONLY (via getCandidateChannel)
      const candChan = await this.getCandidateChannel(member, true);
      if (candChan) {
        await candChan.send({
          content: `📌 ${candMention}`,
          embeds: [formEmbed],
          components: [formRow],
        }).catch((e: any) => console.warn('[Send Integration Form Error]', e));
      } else {
        console.warn(`[Integration Form Warning] Salon privé introuvable ou non créable pour ${member.username} (${candDiscordId})`);
      }

      store.addLog(
        staffUserId ? `Staff (<@${staffUserId}>)` : 'System',
        `Validation Formation Outils & envoi formulaire d'intégration pour ${member.username}`,
        'member',
        member.username
      );
    }

    // Identify absent candidates currently enrolled in formation_outils who were not validated
    const allToolsCandidates = store.getMembers().filter((m) => m.candidateState === 'formation_outils');
    for (const c of allToolsCandidates) {
      if (!validated.some((v) => v.id === c.id)) {
        absent.push(c);
      }
    }

    return { validated, absent };
  }

  /**
   * Send automatic staff notification MP & post in salon #integration when candidate submits integration form
   */
  public async sendIntegrationSubmittedNotificationToStaff(member: Member): Promise<void> {
    const candDiscordId = member.discordId || member.id.replace('mem-', '');
    const candMention = `<@${candDiscordId}>`;
    const channelLinkStr = member.personalChannelId ? `<#${member.personalChannelId}>` : 'Salon privé';

    const simuDate = member.simulationValidatedAt || 'Validée';
    const toolsDate = member.toolsFormationValidatedAt || new Date().toLocaleString('fr-FR');

    const staffEmbed = new EmbedBuilder()
      .setTitle("📋 DOSSIER D'INTÉGRATION CANDIDAT SOUMIS")
      .setColor(0x10b981)
      .setDescription(
        `👤 **Candidat :** ${candMention} (**${member.username}**)\n\n` +
        `📧 **E-mail :** \`${member.email || 'Non renseigné'}\`\n` +
        `📱 **WhatsApp :** \`${member.whatsapp || 'Non renseigné'}\`\n` +
        `⏰ **Shift / Horaires :** \`${member.shift || 'Non renseigné'}\`\n\n` +
        `📅 **Date Validation Simulation :** ${simuDate}\n` +
        `📅 **Date Validation Formation Outils :** ${toolsDate}\n\n` +
        `🔗 **Salon privé candidat :** ${channelLinkStr}`
      )
      .setFooter({ text: 'PAWAKO FORMATION • Notification Intégration' })
      .setTimestamp();

    // 1. Direct Message MP to Staff / @Mahsa
    await this.sendDirectMessageToStaff(staffEmbed);

    // 2. Post in #integration or #staff-alerts channel
    if (this.client) {
      const cfg = onboardingService.getConfig();
      const guildId = cfg.guildId || process.env.DISCORD_GUILD_ID || this.client.guilds.cache.first()?.id;
      if (guildId) {
        const guild = await this.client.guilds.fetch(guildId).catch(() => null);
        if (guild) {
          const integrationChan = await this.getOrCreateStaffOnlyChannel(guild, 'integration', 'Dossiers Intégration');
          if (integrationChan) {
            await integrationChan.send({
              content: `🔔 **[NOUVEAU DOSSIER INTÉGRATION]** Notification pour Staff — ${candMention} a soumis ses infos !`,
              embeds: [staffEmbed],
            }).catch(() => {});
          }
        }
      }
    }

    store.addLog(
      'Bot System',
      `Formulaire d'intégration reçu de ${member.username} (Email: ${member.email}, WhatsApp: ${member.whatsapp}, Shift: ${member.shift})`,
      'member',
      member.username
    );
  }

  /**
   * Auto Kick-off & Inactivity Reminders Runner
   * Disabled - inactivity reminders and kicks are now handled manually by Staff.
   */
  public async checkInactiveCandidatesAndAutoKick(_force: boolean = false): Promise<void> {
    // Disabled: Handled manually by Staff
    return;
  }

  /**
   * Kick member from Discord guild + notify private channel & staff log channel + update DB state
   */
  public async kickMemberAndNotify(member: Member, reason: string = 'Inactivité sans action'): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      store.kickMemberForInactivity(member.id, reason);
      return false;
    }

    try {
      const discordUserId = member.discordId || member.id.replace('mem-', '');
      const guildId = process.env.DISCORD_GUILD_ID || this.client?.guilds.cache.first()?.id;
      const guild = guildId ? await this.client?.guilds.fetch(guildId).catch(() => null) : null;

      // 1. Send final notification message to candidate's private channel
      try {
        const candChan = await this.getCandidateChannel(member, false);
        if (candChan) {
          const embed = new EmbedBuilder()
            .setTitle('🚨 ALERTE EXPULSION')
            .setDescription(
              `📢 <@${discordUserId}>,\n\n` +
              `Conformément au règlement de formation, tu as été exclu(e) du serveur Discord.\n\n` +
              `❌ **Exclusion effectuée par la modération.**\n\n` +
              `_Raison : ${reason}_`
            )
            .setColor(0xDC2626)
            .setFooter({ text: 'PAWAKO FORMATION • Modération' })
            .setTimestamp();

          await candChan.send({ content: `🚨 <@${discordUserId}>`, embeds: [embed] }).catch(() => {});
        }
      } catch (e) {
        console.warn('[Kick Notification Channel Error]', e);
      }

      // 2. Notify Staff Log Channel (#log-formation or #salon-staff)
      try {
        const logChan = guild ? await this.getOrCreateStaffOnlyChannel(guild, 'log-formation', 'Logs & Modération Formation') : null;
        if (logChan) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🚨 MODÉRATION — EXPULSION KICK-OFF')
            .setDescription(
              `⚡ **Expulsion exécutée par le staff**\n\n` +
              `• **Candidat :** <@${discordUserId}> (**${member.username}**)\n` +
              `• **ID Discord :** \`${discordUserId}\`\n` +
              `• **Dernière activité :** ${member.lastActiveAt || 'Inconnue'}\n` +
              `• **Motif :** ${reason}\n\n` +
              ` Le profil du candidat a été désactivé dans la base de données.`
            )
            .setColor(0xDC2626)
            .setTimestamp();

          await logChan.send({ embeds: [logEmbed] }).catch(() => {});
        }
      } catch (e) {
        console.warn('[Kick Staff Log Send Error]', e);
      }

      // 3. Kick candidate from Discord Guild
      if (guild) {
        try {
          const guildMember = await guild.members.fetch(discordUserId).catch(() => null);
          if (guildMember && guildMember.kickable) {
            await guildMember.kick(`[Auto Kick-off 3j] ${reason}`);
            console.log(`[PAWAKO BOT] ✅ Membre ${member.username} (${discordUserId}) expulsé du serveur Discord.`);
          } else {
            console.warn(`[PAWAKO BOT] Impossible d'expulser ${member.username} de la guilde (permissions bot insuffisantes ou membre parti).`);
          }
        } catch (kickErr) {
          console.warn('[Guild Member Kick Error]', kickErr);
        }
      }

      // 4. Update store and Firebase
      store.kickMemberForInactivity(member.id, reason);
      return true;
    } catch (err) {
      console.warn('[kickMemberAndNotify Global Error]', err);
      store.kickMemberForInactivity(member.id, reason);
      return false;
    }
  }

  /**
   * Publish Announcement message/embed to specified Discord channel
   */
  public async publishAnnouncement(
    channelId: string,
    title: string,
    content: string,
    mentionType: 'none' | '@everyone' | '@here' | '@candidat' = 'none',
    colorHex: string = '#6366f1',
    imageUrl?: string,
    authorName: string = 'PAWAKO Staff'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client || !this.isConnected) {
      return { success: false, error: 'Le Bot Discord n\'est pas connecté.' };
    }

    try {
      const channel = await this.client.channels.fetch(channelId).catch(() => null);
      if (!channel || !('send' in channel)) {
        return { success: false, error: `Salon Discord introuvable (ID: ${channelId}).` };
      }

      const embedColor = parseInt(colorHex.replace('#', ''), 16) || 0x6366f1;

      const embed = new EmbedBuilder()
        .setTitle(title || '📢 ANNONCE FORMATION')
        .setDescription(content)
        .setColor(embedColor)
        .setAuthor({ name: authorName, iconURL: this.client.user?.displayAvatarURL() })
        .setFooter({ text: 'PAWAKO FORMATION • Communication Officielle' })
        .setTimestamp();

      if (imageUrl && imageUrl.trim().startsWith('http')) {
        embed.setImage(imageUrl.trim());
      }

      let textContent = '';
      if (mentionType === '@everyone') textContent = '@everyone';
      else if (mentionType === '@here') textContent = '@here';
      else if (mentionType === '@candidat') {
        const guildId = process.env.DISCORD_GUILD_ID || this.client?.guilds.cache.first()?.id;
        const guild = guildId ? await this.client?.guilds.fetch(guildId).catch(() => null) : null;
        const role = guild?.roles.cache.find((r) => r.name.toLowerCase().includes('candidat'));
        textContent = role ? `<@&${role.id}>` : '@everyone';
      }

      const sentMsg = await (channel as any).send({
        content: textContent || undefined,
        embeds: [embed],
      });

      store.addLog(
        authorName,
        `[ANNONCE_PUBLIEE] Annonce "${title}" publiée dans le salon ID ${channelId}`,
        'system'
      );

      return { success: true, messageId: sentMsg.id };
    } catch (err: any) {
      console.warn('[publishAnnouncement Error]', err);
      return { success: false, error: err?.message || 'Erreur lors de la publication sur Discord.' };
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected && Boolean(this.client && this.client.user);
  }

  public getClient(): Client | null {
    return this.client;
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
