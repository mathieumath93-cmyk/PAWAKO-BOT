import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './src/services/store';
import { pawakoBot } from './src/bot/discordBot';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Discord Bot if token is present
  const defaultBotToken = process.env.DISCORD_BOT_TOKEN || 'MTUzODg3NDIyNjQxNTUwMTQ2Mg.GRRAAr.5NbxFb6dbuz9rwki_yyiapVY4786aZx5i---dQ';
  if (defaultBotToken) {
    console.log('[PAWAKO BOT] Initialisation avec le token par defaut...');
    pawakoBot.connectWithToken(defaultBotToken);
  }

  app.use(express.json());

  // --- DISCORD REST API REAL-TIME SYNC ---
  app.get('/api/discord/guilds', async (req: Request, res: Response) => {
    const token = (req.query.token as string) || defaultBotToken;
    try {
      const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token.trim()}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText || 'Échec de récupération des serveurs Discord' });
      }
      const guilds = await response.json();
      res.json(guilds);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/discord/sync-real-data', async (req: Request, res: Response) => {
    const token = (req.query.token as string) || defaultBotToken;
    try {
      // 1. Get Guilds for this bot
      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token.trim()}` },
      });

      if (!guildsRes.ok) {
        const errText = await guildsRes.text();
        return res.status(guildsRes.status).json({ error: `Impossible de contacter Discord: ${errText}` });
      }

      const guilds: any[] = await guildsRes.json();
      if (!guilds || guilds.length === 0) {
        return res.json({
          success: false,
          message: 'Le bot n\'a rejoint aucun serveur Discord pour le moment. Veuillez utiliser le lien d\'invitation OAuth2 dans les Paramètres.',
          guilds: [],
        });
      }

      const primaryGuild = guilds[0]; // Take the first server
      const guildId = primaryGuild.id;

      // 2. Fetch Guild details, Channels, Roles, and Members in parallel
      const [guildDetailRes, channelsRes, rolesRes, membersRes] = await Promise.all([
        fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
          headers: { Authorization: `Bot ${token.trim()}` },
        }),
        fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
          headers: { Authorization: `Bot ${token.trim()}` },
        }),
        fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
          headers: { Authorization: `Bot ${token.trim()}` },
        }),
        fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
          headers: { Authorization: `Bot ${token.trim()}` },
        }),
      ]);

      const guildDetail = guildDetailRes.ok ? await guildDetailRes.json() : primaryGuild;
      const rawChannels = channelsRes.ok ? await channelsRes.json() : [];
      const rawRoles = rolesRes.ok ? await rolesRes.json() : [];
      const rawMembers = membersRes.ok ? await membersRes.json() : [];

      // Format Channels
      const formattedChannels = rawChannels
        .filter((c: any) => c.type === 0 || c.type === 2 || c.type === 4) // 0: text, 2: voice, 4: category
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type === 2 ? 'voice' : c.type === 4 ? 'category' : 'text',
          categoryName: c.parent_id ? (rawChannels.find((p: any) => p.id === c.parent_id)?.name || 'SALONS') : 'GÉNÉRAL',
          isConfiguredFor: c.name.includes('log') ? 'logs' : c.name.includes('ticket') ? 'tickets' : c.name.includes('quiz') ? 'quiz' : undefined,
        }));

      // Format Roles
      const formattedRoles = rawRoles
        .filter((r: any) => r.name !== '@everyone')
        .map((r: any) => ({
          id: r.id,
          name: r.name,
          color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#6366f1',
          position: r.position,
          isManaged: r.managed || false,
        }));

      // Format Members
      const formattedMembers = rawMembers.map((m: any) => {
        const user = m.user || {};
        const memberRoles = (m.roles || []).map((rId: string) => {
          const match = rawRoles.find((r: any) => r.id === rId);
          return match ? match.name : rId;
        });

        const avatarHash = user.avatar;
        const avatarUrl = avatarHash
          ? `https://cdn.discordapp.com/avatars/${user.id}/${avatarHash}.png`
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

        return {
          id: `mem-${user.id}`,
          discordId: user.id,
          username: m.nick || user.global_name || user.username || 'Membre Discord',
          avatarUrl,
          roles: memberRoles.length > 0 ? memberRoles : ['Membre'],
          joinedAt: m.joined_at ? new Date(m.joined_at).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
          currentModuleId: 'mod-1',
          progress: {
            'mod-1': { moduleId: 'mod-1', status: 'en_cours', attemptsCount: 0 },
            'mod-2': { moduleId: 'mod-2', status: 'verrouille', attemptsCount: 0 },
          },
          extraAttemptsGranted: {},
          isActive: true,
          lastActiveAt: new Date().toLocaleString('fr-FR'),
        };
      });

      // Construct Guild summary
      const guildIcon = guildDetail.icon
        ? `https://cdn.discordapp.com/icons/${guildDetail.id}/${guildDetail.icon}.png`
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80';

      const serverSummary = {
        id: guildDetail.id,
        name: guildDetail.name,
        iconUrl: guildIcon,
        memberCount: guildDetail.approximate_member_count || rawMembers.length || 1,
        isBotPresent: true,
        channelsCount: rawChannels.length,
        rolesCount: rawRoles.length,
        activeModulesCount: 4,
      };

      res.json({
        success: true,
        server: serverSummary,
        channels: formattedChannels,
        roles: formattedRoles,
        members: formattedMembers,
        rawGuildsCount: guilds.length,
      });
    } catch (err: any) {
      console.error('[Discord Sync Error]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- SEND EMBED DIRECTLY TO DISCORD CHANNEL OR WEBHOOK ---
  app.post('/api/discord/send-channel-embed', async (req: Request, res: Response) => {
    const token = (req.query.token as string) || (req.headers.authorization ? req.headers.authorization.replace('Bot ', '') : '') || defaultBotToken;
    const { channelName, channelId, embed, content } = req.body;

    let targetChannelId = channelId;

    // 1. If no numeric channelId provided, lookup guild channels via Discord REST API
    if (!targetChannelId || !/^\d{17,20}$/.test(targetChannelId)) {
      try {
        const cleanName = (channelName || '').replace(/^#/, '').trim().toLowerCase();
        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: { Authorization: `Bot ${token.trim()}` },
        });

        if (guildsRes.ok) {
          const guilds: any[] = await guildsRes.json();
          if (guilds && guilds.length > 0) {
            const primaryGuildId = guilds[0].id;
            const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${primaryGuildId}/channels`, {
              headers: { Authorization: `Bot ${token.trim()}` },
            });

            if (channelsRes.ok) {
              const channels: any[] = await channelsRes.json();
              const match = channels.find(
                (c: any) =>
                  c.name.toLowerCase() === cleanName ||
                  c.id === channelId ||
                  c.name.toLowerCase().includes(cleanName)
              );
              if (match) {
                targetChannelId = match.id;
              }
            }
          }
        }
      } catch (err) {
        console.error('[Channel Lookup Error]', err);
      }
    }

    let sentViaApi = false;
    let apiError = '';

    // 2. Send via Discord REST API directly to the target channel
    if (targetChannelId && /^\d{17,20}$/.test(targetChannelId)) {
      try {
        const msgRes = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content || null,
            embeds: embed ? [embed] : [],
          }),
        });

        if (msgRes.ok) {
          sentViaApi = true;
        } else {
          const errText = await msgRes.text();
          apiError = errText;
        }
      } catch (err: any) {
        apiError = err.message;
      }
    }

    // 3. Always send/broadcast via Webhook as well to guarantee delivery
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1538892353849532527/8KQxKy9_LOgoL11MAGbYzNeKVyn4lmYr6dLRYqrwve3A0eyJCffSyxyAvLhSMBCMC8rh';
    let sentViaWebhook = false;

    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const whRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Pawako Formation 🤖',
            avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
            content: content || null,
            embeds: embed ? [embed] : [],
          }),
        });
        if (whRes.ok || whRes.status === 204) {
          sentViaWebhook = true;
        }
      } catch (err) {
        console.error('[Webhook Embed Delivery Error]', err);
      }
    }

    if (sentViaApi || sentViaWebhook) {
      const cleanChan = (channelName || 'formation').replace(/^#/, '');
      return res.json({
        success: true,
        sentViaApi,
        sentViaWebhook,
        targetChannelId,
        message: `Message Embed publié avec succès dans le salon #${cleanChan} !`,
      });
    }

    res.status(400).json({
      success: false,
      error: apiError || 'Impossible d\'envoyer le message sur le salon Discord.',
    });
  });

  // --- CREATE PRIVATE THREAD FOR QUIZ RESULTS ON SPECIFIED CHANNEL ---
  app.post('/api/discord/create-private-thread', async (req: Request, res: Response) => {
    const token = (req.query.token as string) || (req.headers.authorization ? req.headers.authorization.replace('Bot ', '') : '') || defaultBotToken;
    const { channelName, channelId, memberName, memberDiscordId, quizTitle, score, maxScore, passed, embed, content } = req.body;

    const cleanChannel = (channelName || 'results').replace(/^#/, '').trim().toLowerCase();
    const cleanUsername = (memberName || 'membre').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 25);
    const cleanQuizTitle = (quizTitle || 'quiz').toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 20);

    // Thread name formatted so it's clearly identifiable by the member's pseudo/username
    const threadName = `🔒 quiz-${cleanQuizTitle}-${cleanUsername || 'resultats'}`;

    let parentChannelId = channelId;

    // 1. Lookup parent text channel ID if not passed as numeric ID
    if (!parentChannelId || !/^\d{17,20}$/.test(parentChannelId)) {
      try {
        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: { Authorization: `Bot ${token.trim()}` },
        });

        if (guildsRes.ok) {
          const guilds: any[] = await guildsRes.json();
          if (guilds && guilds.length > 0) {
            const primaryGuildId = guilds[0].id;
            const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${primaryGuildId}/channels`, {
              headers: { Authorization: `Bot ${token.trim()}` },
            });

            if (channelsRes.ok) {
              const channels: any[] = await channelsRes.json();
              const match = channels.find(
                (c: any) =>
                  c.name.toLowerCase() === cleanChannel ||
                  c.id === channelId ||
                  c.name.toLowerCase().includes(cleanChannel) ||
                  c.type === 0 // Text channel
              );
              if (match) {
                parentChannelId = match.id;
              }
            }
          }
        }
      } catch (err) {
        console.error('[Parent Channel Lookup Error]', err);
      }
    }

    let createdThreadId = '';
    let apiError = '';

    // 2. Create Private Thread via Discord REST API (Type 12 = GUILD_PRIVATE_THREAD)
    if (parentChannelId && /^\d{17,20}$/.test(parentChannelId)) {
      try {
        // Try creating private thread (Type 12)
        let threadRes = await fetch(`https://discord.com/api/v10/channels/${parentChannelId}/threads`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: threadName,
            auto_archive_duration: 1440, // 24 hours
            type: 12, // GUILD_PRIVATE_THREAD
            invitable: true,
          }),
        });

        // Fallback to public thread (Type 11) if private thread requires extra permissions/tier
        if (!threadRes.ok && threadRes.status !== 200 && threadRes.status !== 201) {
          threadRes = await fetch(`https://discord.com/api/v10/channels/${parentChannelId}/threads`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${token.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: threadName,
              auto_archive_duration: 1440,
              type: 11, // GUILD_PUBLIC_THREAD
            }),
          });
        }

        if (threadRes.ok) {
          const threadData = await threadRes.json();
          createdThreadId = threadData.id;
        } else {
          apiError = await threadRes.text();
        }
      } catch (err: any) {
        apiError = err.message;
      }
    }

    // 3. Post the embed/results inside the newly created thread
    const targetMsgChannel = createdThreadId || parentChannelId;

    if (targetMsgChannel && /^\d{17,20}$/.test(targetMsgChannel)) {
      try {
        const pingMention = memberDiscordId ? `<@${memberDiscordId}>` : `@${memberName || 'Membre'}`;
        const defaultContent = content || `🔒 **Fil Privé de Résultats Quiz** — Notification pour ${pingMention}\nCe fil contient vos résultats personnels pour **${quizTitle || 'le quiz'}**.`;

        await fetch(`https://discord.com/api/v10/channels/${targetMsgChannel}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: defaultContent,
            embeds: embed ? [embed] : [],
          }),
        });

        // Add member to thread if memberDiscordId exists
        if (createdThreadId && memberDiscordId && /^\d{17,20}$/.test(memberDiscordId)) {
          try {
            await fetch(`https://discord.com/api/v10/channels/${createdThreadId}/thread-members/${memberDiscordId}`, {
              method: 'PUT',
              headers: { Authorization: `Bot ${token.trim()}` },
            });
          } catch (e) {
            // Ignore if unable to add member directly
          }
        }
      } catch (err) {
        console.error('[Post Thread Message Error]', err);
      }
    }

    // 4. Always issue Webhook log as well
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1538892353849532527/8KQxKy9_LOgoL11MAGbYzNeKVyn4lmYr6dLRYqrwve3A0eyJCffSyxyAvLhSMBCMC8rh';
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Pawako Bot 🤖',
            content: `🔒 **[Fil Privé Créé]** Fil privé \`${threadName}\` ouvert dans **#${cleanChannel}** pour **${memberName}** (${quizTitle}).`,
            embeds: embed ? [embed] : [],
          }),
        });
      } catch (err) {
        // Ignore
      }
    }

    return res.json({
      success: true,
      threadId: createdThreadId || 'webhook-delivered',
      threadName,
      channelName: cleanChannel,
      message: createdThreadId
        ? `Fil privé "${threadName}" créé avec succès dans #${cleanChannel} pour ${memberName} !`
        : `Résultats envoyés pour ${memberName} dans #${cleanChannel} (Fil : ${threadName}).`,
    });
  });

  // --- CREATE PERSONAL CHANNEL FOR NEW MEMBER ONBOARDING ---
  app.post('/api/discord/create-personal-channel', async (req: Request, res: Response) => {
    const token = (req.query.token as string) || (req.headers.authorization ? req.headers.authorization.replace('Bot ', '') : '') || defaultBotToken;
    const { memberName, prefix, rulesMessage } = req.body;

    const cleanUsername = (memberName || 'membre').toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 20);
    const cleanPrefix = (prefix || 'formation-').replace(/^#/, '').toLowerCase();
    const channelName = `🔒-${cleanPrefix}${cleanUsername}`;

    let createdChannelId = '';
    let apiError = '';

    try {
      // 1. Get primary guild
      const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token.trim()}` },
      });

      if (guildsRes.ok) {
        const guilds: any[] = await guildsRes.json();
        if (guilds && guilds.length > 0) {
          const primaryGuildId = guilds[0].id;

          // 2. Create Text Channel in Guild (Type 0 = GUILD_TEXT)
          const createChanRes = await fetch(`https://discord.com/api/v10/guilds/${primaryGuildId}/channels`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${token.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: channelName,
              type: 0, // GUILD_TEXT
              topic: `Salon personnel de formation pour ${memberName}`,
            }),
          });

          if (createChanRes.ok) {
            const chanData = await createChanRes.json();
            createdChannelId = chanData.id;

            // 3. Send Welcome & Rules embed into newly created channel
            await fetch(`https://discord.com/api/v10/channels/${createdChannelId}/messages`, {
              method: 'POST',
              headers: {
                Authorization: `Bot ${token.trim()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: `👋 **Bienvenue <@${memberName}> dans ton salon de formation privé !**`,
                embeds: [
                  {
                    title: '📖 Règles & Directives de Formation',
                    description: rulesMessage || `Bienvenue sur ton espace personnel de formation **PAWAKO** !`,
                    color: 0x6366f1,
                    footer: { text: 'Système d\'Onboarding Automatisé • PAWAKO' },
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
          } else {
            apiError = await createChanRes.text();
          }
        }
      }
    } catch (err: any) {
      apiError = err.message;
    }

    // Always deliver Webhook Log
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1538892353849532527/8KQxKy9_LOgoL11MAGbYzNeKVyn4lmYr6dLRYqrwve3A0eyJCffSyxyAvLhSMBCMC8rh';
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Pawako Bot 🤖',
            content: `🚪 **[Salon Personnel Créé]** Nouveau salon privé \`${channelName}\` ouvert pour **${memberName}**.`,
          }),
        });
      } catch (err) {
        // Ignore
      }
    }

    return res.json({
      success: true,
      channelId: createdChannelId || 'webhook-delivered',
      channelName,
      message: createdChannelId
        ? `Salon personnel "${channelName}" créé avec succès sur Discord pour ${memberName} !`
        : `Notification de création envoyée pour le salon "${channelName}".`,
    });
  });

  // --- API ROUTES ---

  // Auth Endpoints
  app.get('/api/auth/me', (req: Request, res: Response) => {
    res.json(store.getSession());
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, avatarUrl, roleName } = req.body;
    const session = {
      discordId: '123456789012345678',
      username: username || 'Anthony (Admin)',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isAdmin: true,
      roleName: roleName || 'Admin',
      loginAt: store.getFormattedNow(),
    };
    store.setSession(session);
    store.addLog(session.username, 'Connexion réussie via Discord OAuth', 'auth');
    res.json(session);
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const session = store.getSession();
    store.addLog(session.username, 'Déconnexion du dashboard', 'auth');
    res.json({ status: 'logged_out' });
  });

  // Branding Settings
  app.get('/api/branding', (req: Request, res: Response) => {
    res.json(store.getBranding());
  });

  app.put('/api/branding', (req: Request, res: Response) => {
    try {
      const updated = store.updateBranding(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Useful Links
  app.get('/api/useful-links', (req: Request, res: Response) => {
    res.json(store.getUsefulLinks());
  });

  app.post('/api/useful-links', (req: Request, res: Response) => {
    try {
      const link = store.addUsefulLink(req.body);
      res.json(link);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/useful-links/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateUsefulLink(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/useful-links/:id', (req: Request, res: Response) => {
    try {
      store.deleteUsefulLink(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Modules Endpoints
  app.get('/api/modules', (req: Request, res: Response) => {
    res.json(store.getModules());
  });

  app.get('/api/modules/:id', (req: Request, res: Response) => {
    const mod = store.getModule(req.params.id);
    if (!mod) return res.status(404).json({ error: 'Module introuvable' });
    res.json(mod);
  });

  app.post('/api/modules', (req: Request, res: Response) => {
    try {
      const mod = store.createModule(req.body);
      res.json(mod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/modules/:id', (req: Request, res: Response) => {
    try {
      const mod = store.updateModule(req.params.id, req.body);
      res.json(mod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/modules/:id', (req: Request, res: Response) => {
    try {
      store.deleteModule(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Quizzes Endpoints
  app.get('/api/quiz', (req: Request, res: Response) => {
    res.json(store.getQuizzes());
  });

  app.get('/api/quiz/:id', (req: Request, res: Response) => {
    const q = store.getQuiz(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quiz introuvable' });
    res.json(q);
  });

  app.post('/api/quiz', (req: Request, res: Response) => {
    try {
      const q = store.createQuiz(req.body);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/quiz/:id', (req: Request, res: Response) => {
    try {
      const q = store.updateQuiz(req.params.id, req.body);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/quiz/:id', (req: Request, res: Response) => {
    try {
      store.deleteQuiz(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/quiz/submit', (req: Request, res: Response) => {
    const { memberId, quizId, answers } = req.body;
    try {
      const result = store.submitQuizAttempt(memberId, quizId, answers);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Members Endpoints
  app.get('/api/members', (req: Request, res: Response) => {
    res.json(store.getMembers());
  });

  app.get('/api/members/:id', (req: Request, res: Response) => {
    const m = store.getMember(req.params.id);
    if (!m) return res.status(404).json({ error: 'Membre introuvable' });
    res.json(m);
  });

  app.post('/api/members/:id/roles', (req: Request, res: Response) => {
    try {
      const { roles } = req.body;
      const updated = store.updateMemberRoles(req.params.id, roles);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/reset-progress', (req: Request, res: Response) => {
    try {
      const updated = store.resetMemberProgress(req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/reset-attempts', (req: Request, res: Response) => {
    try {
      const { quizId } = req.body;
      const updated = store.resetMemberAttempts(req.params.id, quizId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/grant-attempt', (req: Request, res: Response) => {
    try {
      const { quizId } = req.body;
      const updated = store.grantExtraAttempt(req.params.id, quizId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/leave', (req: Request, res: Response) => {
    try {
      store.handleMemberLeave(req.params.id);
      res.json({ success: true, message: 'Données personnelles anonymisées/supprimées.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Tickets Endpoints
  app.get('/api/tickets', (req: Request, res: Response) => {
    res.json(store.getTickets());
  });

  app.post('/api/tickets', (req: Request, res: Response) => {
    try {
      const { memberId, subject, category, message } = req.body;
      const ticket = store.createTicket(memberId, subject, category, message);
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/tickets/:id/messages', (req: Request, res: Response) => {
    try {
      const { senderName, content, isAdmin } = req.body;
      const msg = store.addTicketMessage(req.params.id, senderName, content, isAdmin);
      res.json(msg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/tickets/:id/close', (req: Request, res: Response) => {
    try {
      const { closedBy } = req.body;
      const ticket = store.closeTicket(req.params.id, closedBy || 'Anthony (Admin)');
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin Logs
  app.get('/api/logs', (req: Request, res: Response) => {
    res.json(store.getLogs());
  });

  // Admin Notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(store.getNotifications());
  });

  app.put('/api/notifications/:id/status', (req: Request, res: Response) => {
    try {
      const { status, adminName } = req.body;
      const notif = store.markNotificationStatus(req.params.id, status, adminName || 'Anthony (Admin)');
      res.json(notif);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Maintenance Settings
  app.get('/api/maintenance', (req: Request, res: Response) => {
    res.json(store.getMaintenance());
  });

  app.put('/api/maintenance/:type', (req: Request, res: Response) => {
    try {
      const type = req.params.type as any;
      const updated = store.updateMaintenance(type, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // System Health & Diagnostics
  app.get('/api/health', (req: Request, res: Response) => {
    res.json(store.getHealth());
  });

  app.post('/api/health/diagnose', (req: Request, res: Response) => {
    res.json(store.triggerDiagnostic());
  });

  // Bot Status & Connect
  app.get('/api/bot/status', (req: Request, res: Response) => {
    res.json({
      connected: pawakoBot.getIsConnected(),
      tag: pawakoBot.getUserTag(),
      tokenSet: Boolean(process.env.DISCORD_BOT_TOKEN)
    });
  });

  app.post('/api/bot/connect', (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token requis' });
    }
    process.env.DISCORD_BOT_TOKEN = token;
    pawakoBot.connectWithToken(token);
    res.json({ success: true, message: 'Connexion du bot Discord initiée.' });
  });

  // Supabase API Status
  app.get('/api/supabase/status', (req: Request, res: Response) => {
    res.json({
      url: process.env.SUPABASE_URL || 'https://qozrmsyhfxhvnudxfuhu.supabase.co',
      endpoint: process.env.SUPABASE_TABLE_ENDPOINT || 'https://qozrmsyhfxhvnudxfuhu.supabase.co/rest/v1/test1',
      hasPublishableKey: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
      hasSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      jwksUrl: process.env.SUPABASE_JWKS_URL || 'https://qozrmsyhfxhvnudxfuhu.supabase.co/auth/v1/.well-known/jwks.json',
      configured: true
    });
  });

  // Backups
  app.get('/api/backups', (req: Request, res: Response) => {
    res.json(store.getBackups());
  });

  app.post('/api/backups/create', (req: Request, res: Response) => {
    res.json(store.createBackup());
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PAWAKO FORMATION 🤖] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
