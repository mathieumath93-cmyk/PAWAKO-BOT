import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { store } from '../services/store';
import { discordService } from '../services/discordService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { onboardingService } from '../services/onboardingService';
import { QuizQuestion, Member } from '../types';

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
}

export class PawakoBotRunner {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private activeQuizSessions = new Map<string, ActiveQuizSession>();

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
        ],
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.isConnecting = false;
        const guildId = process.env.DISCORD_GUILD_ID;
        console.log(`[PAWAKO BOT] Connecté : ${this.client?.user?.tag} (Guild Filter: ${guildId || 'Tous'})`);
        store.addLog('System Bot', `Bot Discord Gateway connecté (${this.client?.user?.tag})`, 'system');
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

      // Handle message commands (!help, !profile, !formation, !ticket)
      this.client.on('messageCreate', async (message: Message) => {
        if (message.author.bot) return;

        const allowedGuildId = process.env.DISCORD_GUILD_ID;
        if (allowedGuildId && message.guild?.id && message.guild.id !== allowedGuildId) {
          return;
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

          await message.reply({ embeds: [embed], components: [row] }).catch(() => {});
        }

        if (content === '!profile') {
          const m = store.getOrCreateCandidate(message.author.id, message.author.username, message.author.displayAvatarURL());
          const validatedCount = Object.values(m.progress || {}).filter((p: any) => p.status === 'valide').length;

          const embed = new EmbedBuilder()
            .setTitle(`👤 Profil de ${message.author.username}`)
            .setColor(0x06b6d4)
            .addFields(
              { name: 'Rôles Discord', value: m.roles.join(', ') || 'Nouveau membre' },
              { name: 'Modules Validés', value: `${validatedCount} / ${store.getModules().length}` }
            )
            .setThumbnail(message.author.displayAvatarURL());

          await message.reply({ embeds: [embed] }).catch(() => {});
        }

        if (content === '!formation') {
          const modules = store.getModules();
          const embed = new EmbedBuilder()
            .setTitle('📚 Programme de Formation PAWAKO')
            .setColor(0x6366f1)
            .setDescription(modules.map((m) => `**${m.title}**\n${m.description}`).join('\n\n'));

          await message.reply({ embeds: [embed] }).catch(() => {});
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
        }
      });

      // Exclusively handle button interactions via Gateway
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        const customId = interaction.customId;
        const user = interaction.user;

        try {
          // Defer reply or update IMMEDIATELY (<10ms) to prevent Discord timeout errors
          const isStartOnboarding =
            customId === 'start_onboarding_process' ||
            customId.startsWith('start_onboarding') ||
            customId.startsWith('join_training');

          if (customId.startsWith('qa:')) {
            if (!interaction.deferred && !interaction.replied) {
              await interaction.deferUpdate().catch((e) => console.warn('[DeferUpdate Warning]', e?.message || e));
            }
          } else {
            if (!interaction.deferred && !interaction.replied) {
              // Ephemeral MUST be true for start_onboarding in public channels so public chat isn't flooded!
              await interaction.deferReply({ ephemeral: isStartOnboarding }).catch((e) => console.warn('[DeferReply Warning]', e?.message || e));
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
            const delayMins = quiz1?.delayMinutesBeforeQuiz || 10;
            member.currentQuizAvailableAtTimestamp = Date.now() + delayMins * 60 * 1000;

            store.saveMembers();
            firebaseSyncService.saveMember(member).catch(() => {});

            // Trigger Discord API role assignment in background
            discordService.assignDiscordRolesToMember(user.id, member.roles).catch((roleErr) => {
              console.warn('[Onboarding Role Assignment Warning]', roleErr?.message || roleErr);
            });

            // Send Welcome message with "Lancer la formation" button in personal channel
            if (createdChannel) {
              const startBtnLabel = cfg.startTrainingButtonLabel || '🚀 Lancer la formation';
              const welcomeEmbed = new EmbedBuilder()
                .setTitle(`👋 Content de te voir, ${user.username} !`)
                .setDescription(
                  `Bienvenue dans ton espace de formation privé.\n\nPour débloquer ton premier rôle et accéder aux consignes de ta formation, clique sur le bouton ci-dessous :`
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
              ? `🎓 **Onboarding Démarré !** Bienvenue <@${user.id}>. Ton salon de formation privé **<#${createdChannel.id}>** a été créé ! Rends-toi dedans et clique sur **"${cfg.startTrainingButtonLabel || '🚀 Lancer la formation'}"** pour débloquer ton premier rôle.`
              : `🎓 **Onboarding Démarré !** Bienvenue <@${user.id}> dans votre parcours de formation. Ton salon privé **#${expectedChanName}** est en cours d'attribution.`;

            await interaction.editReply({ content: confirmMsg });
            return;
          }

          // --- 1b. LAUNCH TRAINING (INSIDE PERSONAL CHANNEL) ---
          if (customId === 'start_training_module_1' || customId.startsWith('start_training')) {
            const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            member.candidateState = 'formation_commencee';
            member.lastActiveAt = store.getFormattedNow();

            const cfg = onboardingService.getConfig();

            // Assign initial roles configured by admin
            const step1Cfg = cfg.stepConfigs?.[0];
            const initialRoleName = cfg.initialRoleName;
            const step1RoleOnStart = step1Cfg?.roleOnStartName;

            const configuredInitialRoles = Array.from(
              new Set([initialRoleName, step1RoleOnStart].filter(Boolean) as string[])
            );
            if (configuredInitialRoles.length > 0) {
              member.roles = Array.from(new Set([...(member.roles || []), ...configuredInitialRoles]));
            }

            // Setup Module 1 & Quiz availability
            const mod1 = store.getModules()[0];
            if (!mod1) {
              await interaction.editReply({
                content: '⚠️ Aucun module n\'est encore configuré par l\'administrateur sur cette plateforme.',
              });
              return;
            }

            const quiz1 = store.getQuiz(mod1.quizId || '') || store.getQuizzes().find((q) => q.moduleId === mod1.id) || store.getQuizzes()[0];
            const delayMins = quiz1?.delayMinutesBeforeQuiz !== undefined ? quiz1.delayMinutesBeforeQuiz : 0;
            member.currentQuizAvailableAtTimestamp = delayMins > 0 ? Date.now() + delayMins * 60 * 1000 : 0;

            store.saveMembers();
            firebaseSyncService.saveMember(member).catch(() => {});

            // Trigger Discord API role assignment in background
            discordService.assignDiscordRolesToMember(user.id, member.roles).catch((roleErr) => {
              console.warn('[Onboarding Role Assignment Warning]', roleErr?.message || roleErr);
            });

            const brandingName = store.getBranding().trainingName || 'Espace de Formation';
            const delayNotice = delayMins > 0
              ? `\n\n⏱️ **Information Quiz** : Le quiz de ce module sera débloqué dans **${delayMins} minute(s)** dans ce salon !`
              : `\n\n⏱️ **Information Quiz** : Le quiz est débloqué et disponible immédiatement ci-dessous !`;

            const modEmbed = new EmbedBuilder()
              .setTitle(`📚 ${mod1.title}`)
              .setDescription(`${mod1.content}${delayNotice}`)
              .setColor(0x6366f1)
              .setFooter({ text: `${brandingName} • Parcours Individuel` })
              .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`launch_quiz_${quiz1?.id || ''}`)
                .setLabel(`📝 Lancer le Quiz (${quiz1?.title || mod1.title})`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
            );

            await interaction.editReply({
              content: `🚀 **Formation Lancée !** Ton rôle **@${member.roles[0] || initialRoleName || 'Nouveau membre'}** a été attribué avec succès. Voici ton premier module :`,
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

            let cooldownNotice = 'Aucun cooldown actif';
            if (member.cooldownUntilTimestamp && Date.now() < member.cooldownUntilTimestamp) {
              const remainingMs = member.cooldownUntilTimestamp - Date.now();
              const mins = Math.floor(remainingMs / 60000);
              const secs = Math.floor((remainingMs % 60000) / 1000);
              cooldownNotice = `⚠️ Cooldown actif (${mins}m ${secs}s restantes)`;
            }

            const isStaffViewer = user.id !== member.discordId && user.id !== member.id.replace('mem-', '');

            const embed = new EmbedBuilder()
              .setTitle(`👤 Profil Candidat — ${member.username}`)
              .setColor(0x06b6d4)
              .setThumbnail(member.avatarUrl || user.displayAvatarURL())
              .addFields(
                { name: '🆔 Identifiant Discord', value: `<@${member.discordId || member.id.replace('mem-', '')}>`, inline: true },
                { name: '📊 Progression', value: `**${validatedCount} / ${modules.length}** modules validés`, inline: true },
                { name: '⏳ Statut Cooldown', value: cooldownNotice, inline: false },
                { name: '📜 Rôles Discord', value: member.roles.join(', ') || 'Nouveau membre', inline: false }
              )
              .setFooter({
                text: isStaffViewer
                  ? `PAWAKO FORMATION • Consulté par le staff @${user.username}`
                  : 'PAWAKO FORMATION • Suivi Individuel Sécurisé',
              })
              .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId('show_my_profile').setLabel('🔄 Actualiser le profil').setStyle(ButtonStyle.Secondary)
            );

            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
          }

          // --- 3. LAUNCH OR RETRY QUIZ ---
          if (customId.startsWith('launch_quiz') || customId.startsWith('retry_quiz')) {
            const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
            member.lastActiveAt = store.getFormattedNow();

            const rawQuizId = customId.replace('launch_quiz_', '').replace('retry_quiz_', '').split('_')[0] || 'quiz-1';
            const quiz = store.getQuiz(rawQuizId) || store.getQuizzes()[0];

            // 3a. Cooldown Check
            if (member.cooldownUntilTimestamp && Date.now() < member.cooldownUntilTimestamp) {
              const remainingMs = member.cooldownUntilTimestamp - Date.now();
              const mins = Math.floor(remainingMs / 60000);
              const secs = Math.floor((remainingMs % 60000) / 1000);

              const cooldownEmbed = new EmbedBuilder()
                .setTitle('❌ Quiz Indisponible - Cooldown Actif')
                .setDescription(`Tu n'as pas obtenu le score nécessaire (minimum **${quiz?.minScore || 16}/20**) lors de ton dernier essai.\n\nTu pourras retenter ce quiz dans :`)
                .addFields({ name: '⏳ Temps d\'attente restant', value: `**${mins} minutes ${secs} secondes**` })
                .setColor(0xef4444)
                .setFooter({ text: 'PAWAKO FORMATION • Système de Cooldown Serveur' });

              await interaction.editReply({ embeds: [cooldownEmbed] });
              return;
            }

            // 3b. Quiz Delay Check
            if (member.currentQuizAvailableAtTimestamp && Date.now() < member.currentQuizAvailableAtTimestamp) {
              const remainingMs = member.currentQuizAvailableAtTimestamp - Date.now();
              const mins = Math.floor(remainingMs / 60000);
              const secs = Math.floor((remainingMs % 60000) / 1000);

              const delayEmbed = new EmbedBuilder()
                .setTitle('⏳ Quiz en Préparation')
                .setDescription(`Le quiz **${quiz?.title}** n'est pas encore débloqué.\n\nIl sera disponible dans :`)
                .addFields({ name: '⏱️ Temps restant', value: `**${mins} minutes ${secs} secondes**` })
                .setColor(0xf59e0b)
                .setFooter({ text: 'PAWAKO FORMATION • Veuillez lire le support de formation' });

              await interaction.editReply({ embeds: [delayEmbed] });
              return;
            }

            // 3c. Pull and shuffle questions from question bank
            const sampleCount = quiz?.sampleSize || 20;
            const bankQuestions = store.getRandomQuizQuestions(quiz?.id || 'quiz-1', sampleCount);

            // Shuffle questions & choices
            const shuffledQuestions: QuizQuestion[] = bankQuestions.map((q, idx) => {
              const choices = [...q.options];
              const originalCorrectChoice = choices[q.correctAnswer];
              
              // Fisher-Yates shuffle choices
              for (let i = choices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [choices[i], choices[j]] = [choices[j], choices[i]];
              }

              const newCorrectIndex = choices.indexOf(originalCorrectChoice);

              return {
                ...q,
                id: `q-${idx}-${Date.now()}`,
                options: choices,
                correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
              };
            });

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

            // Display Question 1 / Total
            const q1 = shuffledQuestions[0];
            const qEmbed = new EmbedBuilder()
              .setTitle(`📝 ${quiz.title} — Question 1 / ${shuffledQuestions.length}`)
              .setDescription(`<@${user.id}>\n\n**${q1.text}**`)
              .setColor(0x6366f1)
              .setFooter({ text: `PAWAKO FORMATION • Score Minimum Requis : ${quiz.minScore || 16}/20` });

            const optionRow = new ActionRowBuilder<ButtonBuilder>();
            const optionLabels = ['A', 'B', 'C', 'D', 'E'];

            q1.options.forEach((optText, optIdx) => {
              const labelPrefix = optionLabels[optIdx] || `${optIdx + 1}`;
              optionRow.addComponents(
                new ButtonBuilder()
                  .setCustomId(`qa:${attemptId}:0:${optIdx}`)
                  .setLabel(`${labelPrefix}. ${optText.slice(0, 70)}`)
                  .setStyle(ButtonStyle.Primary)
              );
            });

            await interaction.editReply({ embeds: [qEmbed], components: [optionRow] });
            return;
          }

          // --- 4. ANSWER QUIZ QUESTION (ONE AT A TIME) ---
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

            // Render next question OR complete quiz
            if (session.currentIndex < session.questions.length) {
              const nextIndex = session.currentIndex;
              const nextQ = session.questions[nextIndex];

              const qEmbed = new EmbedBuilder()
                .setTitle(`📝 ${session.quizTitle} — Question ${nextIndex + 1} / ${session.questions.length}`)
                .setDescription(`<@${user.id}>\n\n**${nextQ.text}**`)
                .setColor(0x6366f1)
                .setFooter({ text: `PAWAKO FORMATION • Question ${nextIndex + 1} sur ${session.questions.length}` });

              const optionRow = new ActionRowBuilder<ButtonBuilder>();
              const optionLabels = ['A', 'B', 'C', 'D', 'E'];

              nextQ.options.forEach((optText, optIdx) => {
                const labelPrefix = optionLabels[optIdx] || `${optIdx + 1}`;
                optionRow.addComponents(
                  new ButtonBuilder()
                    .setCustomId(`qa:${attemptId}:${nextIndex}:${optIdx}`)
                    .setLabel(`${labelPrefix}. ${optText.slice(0, 70)}`)
                    .setStyle(ButtonStyle.Primary)
                );
              });

              await interaction.editReply({ embeds: [qEmbed], components: [optionRow] });
              return;
            } else {
              // --- QUIZ COMPLETED ---
              const finalScore = session.score;
              const totalQuestions = session.questions.length;
              const quiz = store.getQuiz(session.quizId) || store.getQuizzes()[0];
              const minScore = quiz?.minScore || 16;
              const passed = finalScore >= minScore;

              this.activeQuizSessions.delete(attemptId);

              const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
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

              if (passed) {
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

                if (nextMod) {
                  member.progress[nextMod.id] = {
                    moduleId: nextMod.id,
                    status: 'en_cours',
                    attemptsCount: 0,
                  };
                  member.currentModuleId = nextMod.id;
                  member.candidateState = 'module_en_cours';

                  const nextQuiz = store.getQuiz(nextMod.quizId || '') || store.getQuizzes().find((q) => q.moduleId === nextMod.id);
                  const delayMins = nextQuiz?.delayMinutesBeforeQuiz || 10;
                  member.currentQuizAvailableAtTimestamp = Date.now() + delayMins * 60 * 1000;

                  // Assign Discord roles for validated module and new module according to step configs
                  const stepCfg = onboardingService.getStepConfigForModule(quiz.moduleId);
                  const nextStepCfg = nextMod ? onboardingService.getStepConfigForModule(nextMod.id) : null;

                  const passRoleName = stepCfg?.roleOnPassName || currentMod?.roleValidatedName;
                  const nextStartRoleName = nextStepCfg?.roleOnStartName || nextMod?.roleEnCoursName;

                  let updatedRoles = [...(member.roles || [])];
                  if (passRoleName) updatedRoles.push(passRoleName);
                  if (nextMod && nextStartRoleName) updatedRoles.push(nextStartRoleName);

                  member.roles = Array.from(new Set(updatedRoles));
                  discordService.assignDiscordRolesToMember(user.id, member.roles).catch((roleErr) => {
                    console.warn('[Quiz Pass Role Sync Warning]', roleErr?.message || roleErr);
                  });
                } else {
                  member.candidateState = 'formation_terminee';
                  const stepCfg = onboardingService.getStepConfigForModule(quiz.moduleId);
                  const passRoleName = stepCfg?.roleOnPassName || currentMod?.roleValidatedName;
                  if (passRoleName) {
                    member.roles = Array.from(new Set([...(member.roles || []), passRoleName]));
                  }
                  discordService.assignDiscordRolesToMember(user.id, member.roles).catch(() => {});
                }

                store.saveMembers();
                firebaseSyncService.saveMember(member).catch(() => {});

                const passEmbed = new EmbedBuilder()
                  .setTitle(`🎉 QUIZ RÉUSSI ! (${finalScore}/${totalQuestions})`)
                  .setDescription(
                    `Félicitations <@${user.id}> ! Tu as validé **${quiz.title}** avec un score de **${finalScore}/${totalQuestions}** (Seuil minimum : ${minScore}/${totalQuestions}).\n\n` +
                    (nextMod
                      ? `Le **${nextMod.title}** est maintenant débloqué dans ton espace !`
                      : '🏆 Félicitations ! Tu as terminé l\'ensemble du parcours de formation PAWAKO !')
                  )
                  .setColor(0x10b981)
                  .setFooter({ text: 'PAWAKO FORMATION • Validation Réussie' })
                  .setTimestamp();

                const passRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder().setCustomId(nextMod ? `start_module_${nextMod.id}` : 'btn_profile').setLabel(nextMod ? '📚 Module Suivant' : '🎓 Parcours Terminé').setStyle(ButtonStyle.Success),
                  new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ embeds: [passEmbed], components: [passRow] });
                return;
              } else {
                // Quiz Failed - Activate Cooldown
                const cooldownMins = quiz.cooldownMinutes || 30;
                member.cooldownUntilTimestamp = Date.now() + cooldownMins * 60 * 1000;
                member.candidateState = 'cooldown_actif';

                const prevAttempts = member.progress[quiz.moduleId]?.attemptsCount || 0;
                member.progress[quiz.moduleId] = {
                  ...(member.progress[quiz.moduleId] || { moduleId: quiz.moduleId, status: 'en_cours' }),
                  attemptsCount: prevAttempts + 1,
                  score: finalScore,
                  quizPassed: false,
                };

                store.saveMembers();
                firebaseSyncService.saveMember(member).catch(() => {});

                const failEmbed = new EmbedBuilder()
                  .setTitle(`❌ QUIZ NON VALIDÉ (${finalScore}/${totalQuestions})`)
                  .setDescription(
                    `Score obtenu : **${finalScore}/${totalQuestions}**\nScore minimum requis : **${minScore}/${totalQuestions}**.\n\n` +
                    `⏳ Un cooldown de **${cooldownMins} minutes** a été activé. Tu pourras retenter ce quiz à l'issue de ce délai.\n` +
                    `Prends le temps de relire les fiches de formation avant ta prochaine tentative.`
                  )
                  .setColor(0xef4444)
                  .setFooter({ text: 'PAWAKO FORMATION • Révision Requise' })
                  .setTimestamp();

                const failRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder().setCustomId(`retry_quiz_${quiz.id}`).setLabel('🔄 Retenter le Quiz').setStyle(ButtonStyle.Danger),
                  new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ embeds: [failEmbed], components: [failRow] });
                return;
              }
            }
          }

          // --- 5. START / CONTINUE MODULE ---
          if (customId.startsWith('start_module') || customId.startsWith('launch_module')) {
            const modId = customId.replace('start_module_', '').replace('launch_module_', '');
            const mod = store.getModule(modId) || store.getModules().find((m) => m.id === modId) || store.getModules()[0];

            if (!mod) {
              await interaction.editReply({ content: '⚠️ Ce module n\'existe pas ou a été retiré.' });
              return;
            }

            const quiz = store.getQuiz(mod.quizId || '') || store.getQuizzes().find((q) => q.moduleId === mod.id);
            const delayMins = quiz?.delayMinutesBeforeQuiz !== undefined ? quiz.delayMinutesBeforeQuiz : 0;

            const stepCfg = onboardingService.getStepConfigForModule(mod.id);
            if (stepCfg?.roleOnStartName) {
              const member = store.getOrCreateCandidate(user.id, user.username, user.displayAvatarURL());
              member.roles = Array.from(new Set([...(member.roles || []), stepCfg.roleOnStartName]));
              store.saveMembers();
              discordService.assignDiscordRolesToMember(user.id, member.roles).catch(() => {});
            }

            const brandingName = store.getBranding().trainingName || 'Espace de Formation';
            const delayNotice = delayMins > 0
              ? `\n\n⏱️ **Information Quiz** : Le quiz de ce module sera débloqué dans **${delayMins} minute(s)** !`
              : `\n\n⏱️ **Information Quiz** : Le quiz est disponible immédiatement ci-dessous !`;

            const embed = new EmbedBuilder()
              .setTitle(`📚 ${mod.title}`)
              .setDescription(`${mod.content}${delayNotice}`)
              .setColor(0x6366f1)
              .setFooter({ text: `${brandingName} • Parcours de Formation` })
              .setTimestamp();

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`launch_quiz_${quiz?.id || 'quiz-1'}`)
                .setLabel(`📝 Lancer le Quiz (${quiz?.title || mod.title})`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId('btn_profile').setLabel('👤 Mon profil').setStyle(ButtonStyle.Secondary)
            );

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
