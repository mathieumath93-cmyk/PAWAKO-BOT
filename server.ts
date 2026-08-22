import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './src/services/store';
import { firebaseSyncService } from './src/services/firebaseSyncService';
import { pawakoBot } from './src/bot/discordBot';
import { discordService } from './src/services/discordService';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Sync data from Firestore into Node store
  firebaseSyncService.initSync().catch((err) => {
    console.warn('[Server Firestore Init Warning]', err?.message || err);
  });

  // Initialize Discord Bot if token is present in ENV or discordService
  let botTokenEnv = sanitizeBotToken(process.env.DISCORD_BOT_TOKEN || '');
  if (!botTokenEnv) {
    const config = discordService.getConfig();
    if (config && config.botToken) {
      botTokenEnv = sanitizeBotToken(config.botToken);
    }
  }
  if (botTokenEnv) {
    console.log('[PAWAKO BOT] Initialisation automatique de la Gateway Discord...');
    process.env.DISCORD_BOT_TOKEN = botTokenEnv;
    pawakoBot.initAndConnect();
  }

  app.use(express.json());

  // Helper function to handle Discord REST API rate limits (HTTP 429) automatically
  async function fetchDiscordWithRetry(url: string, options: any = {}, maxRetries = 3, timeoutMs = 8000): Promise<any> {
    let attempt = 0;
    const method = options.method || 'GET';
    console.log(`[SERVER Discord API Request 🚀] ${method} ${url}`);

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const mergedOptions = {
          ...options,
          signal: controller.signal,
        };

        const res = await fetch(url, mergedOptions);
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || 'none';
        console.log(`[SERVER Discord API Response ${res.ok ? '✅' : '❌'}] ${method} ${url} - Status: ${res.status} - Content-Type: ${contentType}`);

        if (res.status === 429) {
          attempt++;
          try {
            const body = await res.clone().json();
            const retryAfterMs = Math.ceil(((body && body.retry_after) || 0.6) * 1000) + 150;
            console.warn(`[Discord 429 Rate Limit] Pausing ${retryAfterMs}ms before retry ${attempt}/${maxRetries} for ${url}`);
            await new Promise((r) => setTimeout(r, retryAfterMs));
            continue;
          } catch (jsonErr) {
            console.warn(`[Discord 429 JSON Info] Non-JSON payload in rate limit 429:`, jsonErr);
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
        }

        if (res.status >= 500 && attempt < maxRetries) {
          attempt++;
          console.warn(`[Discord 5xx Server Error] HTTP ${res.status}. Retrying ${attempt}/${maxRetries} in 1000ms...`);
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        return res;
      } catch (err: any) {
        clearTimeout(timeoutId);
        attempt++;
        const isTimeout = err?.name === 'AbortError';
        console.warn(`[Discord API Request Failed ${attempt}/${maxRetries}] ${isTimeout ? 'Timeout' : err?.message}. Retrying in 1000ms...`);

        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 1000));
        } else {
          throw err;
        }
      }
    }
  }

  // Global active guild state
  let activeGuildId: string | null = null;

  function sanitizeBotToken(rawToken: string): string {
    let clean = (rawToken || '').trim();
    if (clean.startsWith('Bot ')) clean = clean.substring(4).trim();
    if (clean.startsWith('Bearer ')) clean = clean.substring(7).trim();
    return clean;
  }

  function getBotTokenOrError(req: Request, res: Response): string | null {
    let token = sanitizeBotToken(process.env.DISCORD_BOT_TOKEN || '');

    if (!token) {
      res.status(401).json({
        success: false,
        discordStatus: 401,
        error: 'Token Bot Discord non configuré. Veuillez vérifier la variable d\'environnement DISCORD_BOT_TOKEN.',
      });
      return null;
    }

    return token;
  }

  function formatDiscordApiError(status: number, rawText: string): string {
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Raw text not JSON
    }

    const code = parsed?.code;
    const msg = parsed?.message || rawText;

    if (status === 401 || msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      return 'Token Bot Discord non configuré ou à renouveler. Cliquez sur le bouton \'Token Bot\' en haut à droite pour saisir votre clé.';
    }

    if (status === 403 || msg.toLowerCase().includes('missing access') || msg.toLowerCase().includes('missing permissions') || code === 50001 || code === 50013) {
      return 'Permissions Discord insuffisantes (Erreur 403: Forbidden). Assurez-vous que le Bot est présent sur votre serveur Discord avec les permissions suffisantes.';
    }

    if (status === 404 || code === 10004 || code === 10003) {
      return 'Serveur ou salon Discord non trouvé (Erreur 404: Not Found). Vérifiez l\'ID du serveur ou réinvitez le Bot.';
    }

    return `Impossible de contacter Discord (HTTP ${status}): ${msg}`;
  }

  // --- DISCORD REST API REAL-TIME SYNC ---
  app.get('/api/discord/guilds', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    try {
      const response = await fetchDiscordWithRetry('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          success: false,
          discordStatus: response.status,
          error: formatDiscordApiError(response.status, errorText)
        });
      }
      const guilds = await response.json();
      res.json(guilds);
    } catch (err: any) {
      res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
  });

  app.post('/api/discord/select-guild', (req: Request, res: Response) => {
    const { guildId } = req.body;
    if (!guildId) {
      return res.status(400).json({ success: false, error: 'guildId requis' });
    }
    activeGuildId = guildId;
    res.json({ success: true, activeGuildId });
  });

  app.get('/api/discord/active-guild', (req: Request, res: Response) => {
    res.json({ activeGuildId });
  });

  // --- DISCORD INTERACTIONS WEBHOOK ENDPOINT (PING ONLY for Gateway-only architecture) ---
  app.post('/api/discord/interactions', (req: Request, res: Response) => {
    const { type } = req.body || {};

    // PING verification for Discord Developer Portal
    if (type === 1) {
      return res.status(200).json({ type: 1 });
    }

    // All button interactions are handled directly via discord.js Gateway event client.on('interactionCreate')
    return res.status(200).json({ type: 1 });
  });

  app.all(['/api/discord/guild/:guildId/sync', '/api/discord/sync-real-data'], async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const requestedGuildId = req.params.guildId || (req.query.guildId as string) || activeGuildId;

    try {
      // 1. Get Guilds for this bot
      const guildsRes = await fetchDiscordWithRetry('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bot ${token}` },
      });

      if (!guildsRes.ok) {
        const errText = await guildsRes.text();
        return res.status(guildsRes.status).json({
          success: false,
          discordStatus: guildsRes.status,
          error: formatDiscordApiError(guildsRes.status, errText)
        });
      }

      const guilds: any[] = await guildsRes.json();
      if (!guilds || guilds.length === 0) {
        return res.json({
          success: false,
          message: 'Le bot n\'a rejoint aucun serveur Discord pour le moment. Veuillez utiliser le lien d\'invitation OAuth2 dans les Paramètres.',
          guilds: [],
        });
      }

      let targetGuild = null;
      if (requestedGuildId) {
        targetGuild = guilds.find((g: any) => g.id === requestedGuildId);
        if (!targetGuild) {
          return res.status(404).json({
            success: false,
            discordStatus: 404,
            error: `Le Bot n'appartient pas au serveur Discord ID ${requestedGuildId}`
          });
        }
      } else {
        targetGuild = guilds[0];
      }

      const guildId = targetGuild.id;
      activeGuildId = guildId;

      // Fetch bot user info to get bot user id
      const botUserRes = await fetchDiscordWithRetry('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${token}` },
      });
      const botUser = botUserRes.ok ? await botUserRes.json() : null;

      // 2. Fetch Guild details, Channels, Roles, Members, and Bot Guild Member info
      const guildDetailRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
        headers: { Authorization: `Bot ${token}` },
      });
      const channelsRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${token}` },
      });
      const rolesRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${token}` },
      });
      const membersRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
        headers: { Authorization: `Bot ${token}` },
      });
      const botMemberRes = botUser ? await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/members/${botUser.id}`, {
        headers: { Authorization: `Bot ${token}` },
      }) : null;

      const guildDetail = guildDetailRes.ok ? await guildDetailRes.json() : targetGuild;
      const rawChannels = channelsRes.ok ? await channelsRes.json() : [];
      const rawRoles = rolesRes.ok ? await rolesRes.json() : [];
      const rawMembers = membersRes.ok ? await membersRes.json() : [];
      const botMember = botMemberRes && botMemberRes.ok ? await botMemberRes.json() : null;

      // Calculate bot highest role position
      let botHighestRolePosition = 0;
      if (botMember && botMember.roles && rawRoles.length > 0) {
        for (const roleId of botMember.roles) {
          const r = rawRoles.find((role: any) => role.id === roleId);
          if (r && r.position > botHighestRolePosition) {
            botHighestRolePosition = r.position;
          }
        }
      }

      // Format Channels
      const formattedChannels = rawChannels
        .filter((c: any) => c.type === 0 || c.type === 2 || c.type === 4 || c.type === 5)
        .map((c: any) => ({
          id: c.id,
          guild_id: guildId,
          discord_channel_id: c.id,
          name: c.name,
          type: c.type === 2 ? 'voice' : c.type === 4 ? 'category' : c.type === 5 ? 'announcements' : 'text',
          categoryName: c.parent_id ? (rawChannels.find((p: any) => p.id === c.parent_id)?.name || 'DISCORD') : 'GÉNÉRAL',
          parent_id: c.parent_id,
          position: c.position,
          topic: c.topic,
        }));

      // Extract Categories
      const categories = rawChannels
        .filter((c: any) => c.type === 4)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          position: c.position,
        }));

      // Format Roles
      const formattedRoles = rawRoles
        .filter((r: any) => r.name !== '@everyone')
        .map((r: any) => ({
          id: r.id,
          guild_id: guildId,
          discord_role_id: r.id,
          name: r.name,
          color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : '#6366f1',
          position: r.position,
          managed: r.managed || false,
          mentionable: r.mentionable || false,
          permissions: r.permissions,
          canAssignByBot: r.position < botHighestRolePosition && !r.managed,
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
          },
          isActive: true,
          lastActiveAt: new Date().toLocaleString('fr-FR'),
        };
      });

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

      const botPermissions = {
        viewChannel: true,
        sendMessages: true,
        embedLinks: true,
        readMessageHistory: true,
        manageChannels: true,
        manageRoles: true,
        createPrivateThreads: true,
        sendMessagesInThreads: true,
        botHighestRolePosition,
      };

      res.json({
        success: true,
        server: serverSummary,
        guild: {
          id: guildDetail.id,
          name: guildDetail.name,
          icon: guildIcon,
          owner_id: guildDetail.owner_id,
          member_count: guildDetail.approximate_member_count || rawMembers.length || 1,
          bot_present: true,
        },
        roles: formattedRoles,
        channels: formattedChannels,
        categories,
        members: formattedMembers,
        botPermissions,
        rawGuildsCount: guilds.length,
      });
    } catch (err: any) {
      console.warn('[Discord Sync Info]', err?.message || err);
      res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
  });

  // --- SEND EMBED/MESSAGE STRICT DISCORD PUBLICATION ---
  app.post('/api/discord/send-channel-embed', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const { guildId, channelId, embed, content, components } = req.body;

    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      return res.status(400).json({
        success: false,
        discordStatus: 400,
        error: 'guildId Discord obligatoire et doit être un identifiant snowflake réel.'
      });
    }

    if (!channelId || !/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({
        success: false,
        discordStatus: 400,
        error: 'Invalid Discord channel ID. Veuillez sélectionner un salon Discord réel dans le dashboard.'
      });
    }

    try {
      // 1. Pre-flight check channel
      const chanRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${channelId}`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (!chanRes.ok) {
        const chanErrText = await chanRes.text();
        let chanErr: any = {};
        try { chanErr = JSON.parse(chanErrText); } catch {}
        return res.status(chanRes.status).json({
          success: false,
          discordStatus: chanRes.status,
          error: `Impossible de trouver le salon Discord (${channelId}) : ${chanErr.message || chanErrText || 'Salon introuvable'}`,
          discordResponse: chanErr
        });
      }

      const chanData = await chanRes.json();

      if (chanData.guild_id && chanData.guild_id !== guildId) {
        return res.status(400).json({
          success: false,
          discordStatus: 400,
          error: 'Le salon sélectionné n\'appartient pas au serveur Discord sélectionné.'
        });
      }

      const allowedTypes = [0, 5, 11, 12, 15];
      if (!allowedTypes.includes(chanData.type)) {
        return res.status(400).json({
          success: false,
          discordStatus: 400,
          error: `Le salon "${chanData.name}" n'est pas un salon textuel compatible pour envoyer un message.`
        });
      }

      // 2. Send message via Discord REST API
      const msgRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content || null,
          embeds: embed ? [embed] : [],
          components: components || undefined,
        }),
      });

      if (msgRes.ok || msgRes.status === 201 || msgRes.status === 200) {
        const msgData = await msgRes.json();
        store.addLog(
          'Discord API',
          `[ACTION_SUCCESS] Message/Embed publié dans #${chanData.name} (${channelId}) - Message ID: ${msgData.id} - HTTP 201`,
          'module'
        );

        return res.status(201).json({
          success: true,
          messageId: msgData.id,
          channelId: msgData.channel_id,
          guildId,
          discordStatus: 201,
          message: `Message/Embed publié avec succès dans le salon #${chanData.name} !`
        });
      } else {
        const errText = await msgRes.text();
        let errJson: any = {};
        try { errJson = JSON.parse(errText); } catch {}

        store.addLog(
          'Discord API',
          `[ACTION_FAILED] Échec envoi message dans channel ${channelId} - HTTP ${msgRes.status}: ${errJson.message || errText}`,
          'system'
        );

        return res.status(msgRes.status).json({
          success: false,
          discordStatus: msgRes.status,
          error: errJson.message || `Échec d'envoi Discord (HTTP ${msgRes.status})`,
          discordResponse: errJson
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        discordStatus: 500,
        error: `Erreur serveur: ${err.message}`
      });
    }
  });

  // --- SEND TEST MESSAGE / EMBED (Dedicated UI Testing Endpoint) ---
  app.post('/api/discord/send-test-message', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const { guildId, channelId, content, embed } = req.body;

    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      return res.status(400).json({ success: false, error: 'guildId Discord valide requis' });
    }
    if (!channelId || !/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({ success: false, error: 'channelId Discord valide (snowflake) requis' });
    }

    try {
      const msgRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content || '🤖 PAWAKO Discord API Test',
          embeds: embed ? [embed] : [],
        }),
      });

      if (msgRes.ok || msgRes.status === 201) {
        const msgData = await msgRes.json();
        return res.status(201).json({
          success: true,
          messageId: msgData.id,
          channelId: msgData.channel_id,
          guildId,
          discordStatus: 201,
          message: `Test réussi ! Message ID: ${msgData.id}`
        });
      } else {
        const errText = await msgRes.text();
        let errJson: any = {};
        try { errJson = JSON.parse(errText); } catch {}
        return res.status(msgRes.status).json({
          success: false,
          discordStatus: msgRes.status,
          error: errJson.message || `Échec API Discord (HTTP ${msgRes.status})`,
          discordResponse: errJson
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
  });

  // --- DIAGNOSTIC ENDPOINT (GET /api/discord/diagnostic/:guildId) ---
  app.get('/api/discord/diagnostic/:guildId', async (req: Request, res: Response) => {
    const token = (process.env.DISCORD_BOT_TOKEN || '').trim();
    const guildId = req.params.guildId;

    const results: any = {
      timestamp: new Date().toISOString(),
      guildId,
      botTokenSet: Boolean(token),
      botGateway: { pass: false, details: '' },
      guild: { pass: false, details: '' },
      botMember: { pass: false, details: '' },
      channels: { pass: false, details: '' },
      roles: { pass: false, details: '' },
      hierarchy: { pass: false, details: '' },
    };

    if (!token) {
      return res.status(401).json({ success: false, error: 'DISCORD_BOT_TOKEN non configuré', results });
    }

    try {
      // 1. Bot User
      const botRes = await fetchDiscordWithRetry('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${token}` },
      });
      if (botRes.ok) {
        const botUser = await botRes.json();
        results.botGateway = { pass: true, details: `Connecté sous l'identité ${botUser.username}#${botUser.discriminator || '0'} (ID: ${botUser.id})` };

        // 2. Guild
        const guildRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
          headers: { Authorization: `Bot ${token}` },
        });
        if (guildRes.ok) {
          const guildData = await guildRes.json();
          results.guild = { pass: true, details: `Serveur "${guildData.name}" trouvé (${guildData.approximate_member_count || 0} membres)` };

          // 3. Bot Member in Guild
          const botMemberRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/members/${botUser.id}`, {
            headers: { Authorization: `Bot ${token}` },
          });
          if (botMemberRes.ok) {
            const botMember = await botMemberRes.json();
            results.botMember = { pass: true, details: `Bot présent sur le serveur avec ${botMember.roles ? botMember.roles.length : 0} rôles assignés` };

            // 4. Channels check
            const chanRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
              headers: { Authorization: `Bot ${token}` },
            });
            if (chanRes.ok) {
              const channels = await chanRes.json();
              const textChans = channels.filter((c: any) => c.type === 0);
              results.channels = { pass: true, details: `${channels.length} salons détectés (${textChans.length} salons textuels)` };
            } else {
              results.channels = { pass: false, details: `Erreur récupération salons: HTTP ${chanRes.status}` };
            }

            // 5. Roles & Hierarchy check
            const rolesRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
              headers: { Authorization: `Bot ${token}` },
            });
            if (rolesRes.ok) {
              const roles = await rolesRes.json();
              let highestPos = 0;
              if (botMember.roles) {
                for (const rId of botMember.roles) {
                  const r = roles.find((role: any) => role.id === rId);
                  if (r && r.position > highestPos) highestPos = r.position;
                }
              }
              results.roles = { pass: true, details: `${roles.length} rôles détectés sur le serveur` };
              results.hierarchy = { pass: highestPos > 0, details: `Position maximale du rôle du Bot: ${highestPos}` };
            } else {
              results.roles = { pass: false, details: `Erreur récupération rôles: HTTP ${rolesRes.status}` };
            }
          } else {
            results.botMember = { pass: false, details: `Bot absent ou introuvable sur le serveur ${guildId} (HTTP ${botMemberRes.status})` };
          }
        } else {
          results.guild = { pass: false, details: `Serveur introuvable ou Bot non autorisé (HTTP ${guildRes.status})` };
        }
      } else {
        results.botGateway = { pass: false, details: `Échec d'authentification Bot Token (HTTP ${botRes.status})` };
      }
    } catch (err: any) {
      results.error = err.message;
    }

    const overallSuccess = results.botGateway.pass && results.guild.pass && results.botMember.pass;
    res.json({ success: overallSuccess, results });
  });

  // --- CREATE PRIVATE THREAD FOR QUIZ RESULTS ON SPECIFIED CHANNEL ---
  app.post('/api/discord/create-private-thread', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const { guildId, channelId, memberName, memberDiscordId, quizTitle, embed, content } = req.body;

    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      return res.status(400).json({ success: false, error: 'guildId valide requis' });
    }
    if (!channelId || !/^\d{17,20}$/.test(channelId)) {
      return res.status(400).json({ success: false, error: 'channelId valide (snowflake) requis' });
    }

    const cleanUsername = (memberName || 'membre').replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 25);
    const cleanQuizTitle = (quizTitle || 'quiz').toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 20);
    const threadName = `🔒 quiz-${cleanQuizTitle}-${cleanUsername || 'resultats'}`;

    let createdThreadId = '';

    try {
      // 1. Create Private Thread (Type 12)
      let threadRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${channelId}/threads`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: threadName,
          auto_archive_duration: 1440,
          type: 12, // GUILD_PRIVATE_THREAD
          invitable: true,
        }),
      });

      if (!threadRes.ok) {
        // Fallback to Public Thread (Type 11)
        threadRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${channelId}/threads`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: threadName,
            auto_archive_duration: 1440,
            type: 11, // GUILD_PUBLIC_THREAD
          }),
        });
      }

      if (!threadRes.ok) {
        const errText = await threadRes.text();
        let errJson: any = {};
        try { errJson = JSON.parse(errText); } catch {}
        return res.status(threadRes.status).json({
          success: false,
          discordStatus: threadRes.status,
          error: `Échec de création du fil de discussion: ${errJson.message || errText}`
        });
      }

      const threadData = await threadRes.json();
      createdThreadId = threadData.id;

      // 2. Post embed/message in created thread
      const pingMention = memberDiscordId ? `<@${memberDiscordId}>` : `@${memberName || 'Membre'}`;
      const defaultContent = content || `🔒 **Fil Privé de Résultats Quiz** — Notification pour ${pingMention}`;

      const msgRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${createdThreadId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: defaultContent,
          embeds: embed ? [embed] : [],
        }),
      });

      const msgData = msgRes.ok ? await msgRes.json() : null;

      // Add member to thread
      if (memberDiscordId && /^\d{17,20}$/.test(memberDiscordId)) {
        await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${createdThreadId}/thread-members/${memberDiscordId}`, {
          method: 'PUT',
          headers: { Authorization: `Bot ${token}` },
        }).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        threadId: createdThreadId,
        messageId: msgData?.id,
        threadName,
        guildId,
        discordStatus: 201,
        message: `Fil privé "${threadName}" créé avec succès !`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
  });

  // --- CREATE PERSONAL CHANNEL FOR NEW MEMBER ONBOARDING ---
  app.post('/api/discord/create-personal-channel', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const { guildId, categoryId, memberName, prefix, rulesMessage } = req.body;

    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      return res.status(400).json({ success: false, error: 'guildId Discord valide requis' });
    }

    const cleanUsername = (memberName || 'membre').toLowerCase().replace(/[^a-z0-9_\-]/g, '').slice(0, 20);
    const cleanPrefix = (prefix || 'formation-').replace(/^#/, '').toLowerCase();
    const channelName = `🔒-${cleanPrefix}${cleanUsername}`;

    try {
      const createBody: any = {
        name: channelName,
        type: 0, // GUILD_TEXT
        topic: `Salon personnel de formation pour ${memberName}`,
      };
      if (categoryId && /^\d{17,20}$/.test(categoryId)) {
        createBody.parent_id = categoryId;
      }

      const createChanRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createBody),
      });

      if (!createChanRes.ok) {
        const errText = await createChanRes.text();
        let errJson: any = {};
        try { errJson = JSON.parse(errText); } catch {}
        return res.status(createChanRes.status).json({
          success: false,
          discordStatus: createChanRes.status,
          error: `Échec création du salon: ${errJson.message || errText}`
        });
      }

      const chanData = await createChanRes.json();
      const createdChannelId = chanData.id;

      // Send rules message in created channel
      const rulesRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/channels/${createdChannelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
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

      const rulesData = rulesRes.ok ? await rulesRes.json() : null;

      return res.status(201).json({
        success: true,
        channelId: createdChannelId,
        messageId: rulesData?.id,
        channelName,
        guildId,
        discordStatus: 201,
        message: `Salon personnel "${channelName}" créé avec succès pour ${memberName} !`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
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

  // --- SYNC MEMBER ROLES ON DISCORD REST API ---
  app.post('/api/discord/members/:discordId/roles', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const rawDiscordId = req.params.discordId || '';
    const cleanDiscordId = rawDiscordId.replace(/^mem-/, '');
    const { roles, guildId: customGuildId } = req.body;
    const guildId = customGuildId || activeGuildId;

    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      return res.status(400).json({ success: false, error: 'guildId Discord requis. Synchronisez un serveur dans Discord Sync.' });
    }
    if (!cleanDiscordId || !/^\d{17,20}$/.test(cleanDiscordId)) {
      return res.status(400).json({ success: false, error: 'ID Discord du membre invalide (snowflake).' });
    }
    if (!Array.isArray(roles)) {
      return res.status(400).json({ success: false, error: 'roles doit être un tableau de rôles.' });
    }

    try {
      // 1. Fetch current guild roles to resolve role names -> snowflake IDs
      const rolesRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (!rolesRes.ok) {
        const errText = await rolesRes.text();
        return res.status(rolesRes.status).json({
          success: false,
          discordStatus: rolesRes.status,
          error: `Impossible de récupérer les rôles du serveur (${guildId}) : ${errText}`,
        });
      }

      const guildRoles: any[] = await rolesRes.json();
      const targetRoleIds: string[] = [];
      const assignedRoleNames: string[] = [];

      for (const roleInput of roles) {
        const cleanInput = String(roleInput).trim();
        if (!cleanInput) continue;

        if (/^\d{17,20}$/.test(cleanInput)) {
          // It's already a snowflake role ID
          targetRoleIds.push(cleanInput);
          const matched = guildRoles.find((r) => r.id === cleanInput);
          if (matched) assignedRoleNames.push(matched.name);
        } else {
          // Find by role name in existing guild roles
          const matchedRole = guildRoles.find(
            (r) => r.name.toLowerCase().trim() === cleanInput.toLowerCase().trim()
          );

          if (matchedRole) {
            targetRoleIds.push(matchedRole.id);
            assignedRoleNames.push(matchedRole.name);
          } else {
            console.warn(`[Role Assignment ⚠️] Le rôle "${cleanInput}" configuré n'existe pas sur le serveur Discord (${guildId}). Aucune création automatique.`);
          }
        }
      }

      // 2. Assign resolved role IDs to member on Discord
      const patchMemberRes = await fetchDiscordWithRetry(
        `https://discord.com/api/v10/guilds/${guildId}/members/${cleanDiscordId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roles: targetRoleIds,
          }),
        }
      );

      if (patchMemberRes.ok || patchMemberRes.status === 200 || patchMemberRes.status === 204) {
        store.addLog(
          'Discord API',
          `[ROLES_UPDATED] Rôles de <@${cleanDiscordId}> mis à jour sur Discord : [${assignedRoleNames.join(', ')}]`,
          'role'
        );

        return res.json({
          success: true,
          discordStatus: 200,
          roles: assignedRoleNames,
          roleIds: targetRoleIds,
          message: `Rôles [${assignedRoleNames.join(', ')}] attribués au membre sur Discord avec succès !`,
        });
      } else {
        const errText = await patchMemberRes.text();
        let errJson: any = {};
        try { errJson = JSON.parse(errText); } catch {}

        const formattedErr = formatDiscordApiError(patchMemberRes.status, errText);

        return res.status(patchMemberRes.status).json({
          success: false,
          discordStatus: patchMemberRes.status,
          error: formattedErr,
          discordResponse: errJson,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
  });

  // --- BATCH SYNC MEMBER ROLES ON DISCORD REST API ---
  app.post('/api/discord/members/batch-roles', async (req: Request, res: Response) => {
    const token = getBotTokenOrError(req, res);
    if (!token) return;

    const { updates, guildId: customGuildId } = req.body;
    const guildId = customGuildId || activeGuildId;

    if (!guildId || !/^\d{17,20}$/.test(guildId)) {
      return res.status(400).json({ success: false, error: 'guildId Discord requis. Synchronisez un serveur dans Discord Sync.' });
    }
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, error: 'updates doit être un tableau de révisions non vide.' });
    }

    try {
      // Fetch guild roles ONCE for all batch updates
      const rolesRes = await fetchDiscordWithRetry(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${token}` },
      });

      if (!rolesRes.ok) {
        const errText = await rolesRes.text();
        return res.status(rolesRes.status).json({
          success: false,
          discordStatus: rolesRes.status,
          error: `Impossible de récupérer les rôles du serveur (${guildId}) : ${errText}`,
        });
      }

      const guildRoles: any[] = await rolesRes.json();
      const results: any[] = [];

      for (const update of updates) {
        const rawDiscordId = update.discordId || '';
        const cleanDiscordId = rawDiscordId.replace(/^mem-/, '');
        const rolesList = update.roles || [];

        if (!cleanDiscordId || !/^\d{17,20}$/.test(cleanDiscordId)) {
          results.push({ discordId: rawDiscordId, success: false, error: 'ID Discord invalide' });
          continue;
        }

        const targetRoleIds: string[] = [];
        const assignedRoleNames: string[] = [];

        for (const roleInput of rolesList) {
          const cleanInput = String(roleInput).trim();
          if (!cleanInput) continue;

          if (/^\d{17,20}$/.test(cleanInput)) {
            targetRoleIds.push(cleanInput);
            const matched = guildRoles.find((r) => r.id === cleanInput);
            if (matched) assignedRoleNames.push(matched.name);
          } else {
            const matchedRole = guildRoles.find(
              (r) => r.name.toLowerCase().trim() === cleanInput.toLowerCase().trim()
            );

            if (matchedRole) {
              targetRoleIds.push(matchedRole.id);
              assignedRoleNames.push(matchedRole.name);
            } else {
              console.warn(`[Batch Role Assignment ⚠️] Le rôle "${cleanInput}" n'existe pas sur Discord (${guildId}).`);
            }
          }
        }

        const patchMemberRes = await fetchDiscordWithRetry(
          `https://discord.com/api/v10/guilds/${guildId}/members/${cleanDiscordId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bot ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roles: targetRoleIds }),
          }
        );

        if (patchMemberRes.ok || patchMemberRes.status === 200 || patchMemberRes.status === 204) {
          results.push({
            discordId: cleanDiscordId,
            success: true,
            roles: assignedRoleNames,
            roleIds: targetRoleIds,
          });
        } else {
          results.push({
            discordId: cleanDiscordId,
            success: false,
            error: `HTTP ${patchMemberRes.status}`,
          });
        }

        // Small delay between member patches to keep Discord happy
        await new Promise((r) => setTimeout(r, 100));
      }

      const successCount = results.filter((r) => r.success).length;
      store.addLog(
        'Discord API',
        `[BATCH_ROLES] Synchronisation des rôles par lots pour ${successCount}/${updates.length} membres effectuée`,
        'role'
      );

      return res.json({
        success: true,
        processedCount: results.length,
        successCount,
        results,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, discordStatus: 500, error: err.message });
    }
  });

  // --- BATCH SYNC MEMBER STATES ---
  app.post('/api/discord/members/batch-sync', async (req: Request, res: Response) => {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, error: 'updates doit être un tableau non vide.' });
    }

    const members = store.getMembers();
    let updatedCount = 0;

    for (const update of updates) {
      const target = members.find((m) => m.id === update.discordId || m.discordId === update.discordId);
      if (target) {
        if (update.status && target.progress[target.currentModuleId]) {
          target.progress[target.currentModuleId].status = update.status;
        }
        if (update.roles && Array.isArray(update.roles)) {
          target.roles = update.roles;
        }
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      store.saveMembers();
    }

    return res.json({
      success: true,
      updatedCount,
      totalMembers: members.length,
    });
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

  app.post('/api/members/:id/roles', async (req: Request, res: Response) => {
    try {
      const { roles } = req.body;
      const updated = store.updateMemberRoles(req.params.id, roles);

      // Trigger asynchronous sync to Discord REST API
      const discordId = updated.discordId || req.params.id;
      if (discordId && /^\d{17,20}$/.test(discordId.replace(/^mem-/, ''))) {
        fetchDiscordWithRetry(
          `http://127.0.0.1:${PORT}/api/discord/members/${discordId}/roles`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roles }),
          }
        ).catch((e) => console.warn('[Async Role Sync Warning]', e?.message || e));
      }

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

  // Bot Status & API Credentials Management
  app.get('/api/bot/status', (req: Request, res: Response) => {
    const rawToken = (process.env.DISCORD_BOT_TOKEN || '').trim();
    let maskedToken = '';
    if (rawToken) {
      maskedToken = rawToken.length > 8
        ? `${rawToken.substring(0, 4)}••••••••${rawToken.substring(rawToken.length - 4)}`
        : '••••••••';
    }

    res.json({
      connected: pawakoBot.getIsConnected(),
      tag: pawakoBot.getUserTag(),
      tokenSet: Boolean(rawToken),
      maskedToken,
      clientId: process.env.DISCORD_CLIENT_ID || '',
      hasClientSecret: Boolean(process.env.DISCORD_CLIENT_SECRET),
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    });
  });

  app.post('/api/bot/credentials', (req: Request, res: Response) => {
    const { token, clientId, clientSecret, webhookUrl } = req.body;

    if (token !== undefined && token !== '') {
      const cleanToken = sanitizeBotToken(token);
      process.env.DISCORD_BOT_TOKEN = cleanToken;
      try {
        pawakoBot.initAndConnect();
      } catch (err) {
        console.warn('[Bot Connect Warning]', err);
      }
    }

    if (clientId !== undefined) {
      process.env.DISCORD_CLIENT_ID = clientId.trim();
    }

    if (clientSecret !== undefined && clientSecret !== '') {
      process.env.DISCORD_CLIENT_SECRET = clientSecret.trim();
    }

    if (webhookUrl !== undefined) {
      process.env.DISCORD_WEBHOOK_URL = webhookUrl.trim();
    }

    const currentToken = (process.env.DISCORD_BOT_TOKEN || '').trim();
    let maskedToken = '';
    if (currentToken) {
      maskedToken = currentToken.length > 8
        ? `${currentToken.substring(0, 4)}••••••••${currentToken.substring(currentToken.length - 4)}`
        : '••••••••';
    }

    res.json({
      success: true,
      message: 'Identifiants API Discord mis à jour et sécurisés sur le serveur.',
      tokenSet: Boolean(currentToken),
      maskedToken,
      clientId: process.env.DISCORD_CLIENT_ID || '',
      hasClientSecret: Boolean(process.env.DISCORD_CLIENT_SECRET),
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
      connected: pawakoBot.getIsConnected(),
      tag: pawakoBot.getUserTag(),
    });
  });

  app.post('/api/bot/connect', (req: Request, res: Response) => {
    const { token } = req.body;
    if (token) {
      const cleanToken = sanitizeBotToken(token);
      process.env.DISCORD_BOT_TOKEN = cleanToken;
    }
    pawakoBot.initAndConnect();
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

  // Data Reset & Cleanup
  app.post('/api/store/reset-all', (req: Request, res: Response) => {
    store.resetAllData();
    res.json({ success: true, message: 'Toutes les données ont été réinitialisées avec succès.' });
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
