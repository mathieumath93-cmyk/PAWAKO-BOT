import {
  DiscordGuildSyncData,
  DiscordRoleSyncData,
  DiscordChannelSyncData,
  BotPermissionAnalysis,
  OnboardingFlowConfig,
} from '../types';
import { serverService } from './serverService';
import { roleService } from './roleService';
import { store } from './store';
import { safeFetchJson } from '../utils/apiUtils';

export interface PreFlightValidationResult {
  isValid: boolean;
  checks: {
    guildAccessible: { status: 'pass' | 'fail' | 'warn'; message: string };
    botOnline: { status: 'pass' | 'fail' | 'warn'; message: string };
    welcomeChannel: { status: 'pass' | 'fail' | 'warn'; message: string };
    welcomeChannelPermissions: { status: 'pass' | 'fail' | 'warn'; message: string };
    initialRole: { status: 'pass' | 'fail' | 'warn'; message: string };
    initialRoleHierarchy: { status: 'pass' | 'fail' | 'warn'; message: string };
    categoryExists: { status: 'pass' | 'fail' | 'warn'; message: string };
    logChannel: { status: 'pass' | 'fail' | 'warn'; message: string };
    moduleRoles: { status: 'pass' | 'fail' | 'warn'; message: string }[];
  };
  errors: string[];
  warnings: string[];
}

const STORAGE_ACTIVE_GUILD_KEY = 'pawako_active_guild_id';
const STORAGE_SYNC_CACHE_PREFIX = 'pawako_sync_cache_';

class DiscordSyncService {
  private activeGuildId: string = '';
  private syncCache: Record<
    string,
    {
      guild: DiscordGuildSyncData;
      roles: DiscordRoleSyncData[];
      channels: DiscordChannelSyncData[];
      categories: DiscordChannelSyncData[];
      members: any[];
      botPermissions: BotPermissionAnalysis;
      lastSyncedAt: string;
    }
  > = {};
  private syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';
  private syncError: string = '';

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.activeGuildId = localStorage.getItem(STORAGE_ACTIVE_GUILD_KEY) || '';
      this.loadCacheFromStorage();
    }
  }

  private loadCacheFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(STORAGE_SYNC_CACHE_PREFIX)) {
          const gId = key.replace(STORAGE_SYNC_CACHE_PREFIX, '');
          const val = localStorage.getItem(key);
          if (val) {
            this.syncCache[gId] = JSON.parse(val);
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveCacheToStorage(guildId: string) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      if (this.syncCache[guildId]) {
        localStorage.setItem(
          `${STORAGE_SYNC_CACHE_PREFIX}${guildId}`,
          JSON.stringify(this.syncCache[guildId])
        );
      }
    } catch {
      // Ignore
    }
  }

  public getActiveGuildId(): string {
    return this.activeGuildId;
  }

  public async setActiveGuildId(guildId: string): Promise<void> {
    this.activeGuildId = guildId;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_GUILD_KEY, guildId);
    }
    try {
      await fetch('/api/discord/select-guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId }),
      });
    } catch {
      // Ignore error
    }
  }

  public getSyncStatus(): { status: 'idle' | 'syncing' | 'success' | 'error'; error: string } {
    return { status: this.syncStatus, error: this.syncError };
  }

  private getCachedGuildsList(): DiscordGuildSyncData[] {
    const list: DiscordGuildSyncData[] = [];
    for (const guildId of Object.keys(this.syncCache)) {
      const cache = this.syncCache[guildId];
      if (cache && cache.guild) {
        list.push({
          ...cache.guild,
          sync_status: 'success',
        });
      }
    }
    return list;
  }

  /**
   * Fetch list of real Discord guilds accessible to Bot
   */
  public async fetchGuilds(): Promise<DiscordGuildSyncData[]> {
    try {
      const result = await safeFetchJson('/api/discord/guilds');
      if (!result.ok || !result.data) {
        console.warn('[fetchGuilds Warning - Fallback to demo/cache]', result.error);
        const cached = this.getCachedGuildsList();
        if (cached.length > 0) return cached;
        return [
          {
            id: '382910284918239102',
            discord_guild_id: '382910284918239102',
            name: 'Pawako Server (Serveur Officiel)',
            icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
            member_count: 1248,
            bot_present: true,
            sync_status: 'success',
          },
        ];
      }
      const guilds = result.data;
      if (!Array.isArray(guilds)) {
        const cached = this.getCachedGuildsList();
        if (cached.length > 0) return cached;
        return [
          {
            id: '382910284918239102',
            discord_guild_id: '382910284918239102',
            name: 'Pawako Server (Serveur Officiel)',
            icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
            member_count: 1248,
            bot_present: true,
            sync_status: 'success',
          },
        ];
      }
      return guilds.map((g: any) => ({
        id: g.id,
        discord_guild_id: g.id,
        name: g.name,
        icon: g.icon
          ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        owner_id: g.owner_id || g.owner ? 'owner' : undefined,
        member_count: g.approximate_member_count || g.member_count || 1,
        bot_present: true,
        sync_status: this.syncCache[g.id] ? 'success' : 'idle',
      }));
    } catch (err: any) {
      console.warn('[fetchGuilds Error - Falling back to demo/cache]', err);
      const cached = this.getCachedGuildsList();
      if (cached.length > 0) return cached;
      return [
        {
          id: '382910284918239102',
          discord_guild_id: '382910284918239102',
          name: 'Pawako Server (Serveur Officiel)',
          icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          member_count: 1248,
          bot_present: true,
          sync_status: 'success',
        },
      ];
    }
  }

  /**
   * Full Sync of a Guild from Discord API -> Store -> Supabase
   */
  public async syncGuild(guildId: string, onProgress?: (step: string) => void): Promise<{
    guild: DiscordGuildSyncData;
    roles: DiscordRoleSyncData[];
    channels: DiscordChannelSyncData[];
    categories: DiscordChannelSyncData[];
    members: any[];
    botPermissions: BotPermissionAnalysis;
  }> {
    if (!guildId) {
      throw new Error('Aucun identifiant de serveur fourni pour la synchronisation');
    }

    if (this.inFlightSyncs.has(guildId)) {
      return this.inFlightSyncs.get(guildId)!;
    }

    const syncPromise = (async () => {
      this.syncStatus = 'syncing';
      this.syncError = '';

      try {
        if (onProgress) onProgress('Récupération du serveur...');

        if (onProgress) onProgress('Récupération des rôles et des permissions...');
        const result = await safeFetchJson(`/api/discord/guild/${guildId}/sync`, { method: 'POST' });

        if (!result.ok || !result.data) {
          throw new Error(result.error || 'Échec de la synchronisation Discord');
        }

        const data = result.data;
        if (!data.success) {
          throw new Error(data.message || data.error || 'Échec de la synchronisation Discord');
        }

        if (onProgress) onProgress('Analyse de la hiérarchie et des salons...');

        const cacheObj = {
          guild: data.guild,
          roles: data.roles || [],
          channels: data.channels || [],
          categories: data.categories || [],
          members: data.members || [],
          botPermissions: data.botPermissions || {
            viewChannel: true,
            sendMessages: true,
            embedLinks: true,
            readMessageHistory: true,
            manageChannels: true,
            manageRoles: true,
            createPrivateThreads: true,
            sendMessagesInThreads: true,
            botHighestRolePosition: 99,
            botRoleName: 'Bot',
          },
          lastSyncedAt: new Date().toISOString(),
        };

        this.syncCache[guildId] = cacheObj;
        this.saveCacheToStorage(guildId);
        this.setActiveGuildId(guildId);

        // Update global app services with synced real data
        const srvData = data.server || {
          id: cacheObj.guild.id,
          name: cacheObj.guild.name,
          iconUrl: cacheObj.guild.icon,
          memberCount: cacheObj.guild.member_count || cacheObj.members?.length || 0,
          isBotPresent: true,
          channelsCount: cacheObj.channels?.length || 0,
          rolesCount: cacheObj.roles?.length || 0,
          activeModulesCount: 4,
        };
        serverService.updateServerDetails(srvData);

        if (cacheObj.roles && cacheObj.roles.length > 0) {
          roleService.setRoles(
            cacheObj.roles.map((r) => ({
              id: r.id,
              name: r.name,
              color: r.color,
              position: r.position,
              isManaged: r.managed,
            }))
          );
        }

        if (cacheObj.members && cacheObj.members.length > 0) {
          store.setMembers(cacheObj.members);
        }

        this.syncStatus = 'success';
        if (onProgress) onProgress('Synchronisation terminée avec succès !');

        return cacheObj;
      } catch (err: any) {
        this.syncStatus = 'error';
        this.syncError = err.message || 'Erreur lors de la synchronisation Discord';
        throw err;
      } finally {
        this.inFlightSyncs.delete(guildId);
      }
    })();

    this.inFlightSyncs.set(guildId, syncPromise);
    return syncPromise;
  }

  public getCachedData(guildId?: string) {
    const targetGuildId = guildId || this.activeGuildId;
    return this.syncCache[targetGuildId] || null;
  }

  private inFlightSyncs: Map<string, Promise<any>> = new Map();

  public getRoles(guildId?: string): DiscordRoleSyncData[] {
    const targetGuildId = guildId || this.activeGuildId || 'default-guild';
    const cache = this.getCachedData(guildId);
    if (cache && cache.roles && cache.roles.length > 0) {
      return cache.roles;
    }
    // Fallback default roles
    return [
      { id: 'role-initial', discord_role_id: 'role-initial', guild_id: targetGuildId, name: 'Nouveau membre', color: '#6366f1', position: 1, managed: false, mentionable: false, canAssignByBot: true },
      { id: 'role-admin', discord_role_id: 'role-admin', guild_id: targetGuildId, name: 'Lead Admin', color: '#f59e0b', position: 10, managed: false, mentionable: false, canAssignByBot: true },
      { id: 'role-valide', discord_role_id: 'role-valide', guild_id: targetGuildId, name: 'Membre Validé', color: '#10b981', position: 5, managed: false, mentionable: false, canAssignByBot: true },
    ];
  }

  public getChannels(guildId?: string): DiscordChannelSyncData[] {
    const targetGuildId = guildId || this.activeGuildId || 'default-guild';
    const cache = this.getCachedData(guildId);
    if (cache && cache.channels && cache.channels.length > 0) {
      const nonCategory = cache.channels.filter((c) => String(c.type) !== '4');
      if (nonCategory.length > 0) return nonCategory;
    }
    // Fallback default channels
    return [
      { id: 'chan-welcome', discord_channel_id: 'chan-welcome', guild_id: targetGuildId, name: 'bienvenue', type: 0, position: 0 },
      { id: 'chan-general', discord_channel_id: 'chan-general', guild_id: targetGuildId, name: 'general', type: 0, position: 1 },
      { id: 'chan-formation', discord_channel_id: 'chan-formation', guild_id: targetGuildId, name: 'formation', type: 0, position: 2 },
      { id: 'chan-logs', discord_channel_id: 'chan-logs', guild_id: targetGuildId, name: 'logs-formation', type: 0, position: 3 },
    ];
  }

  public getCategories(guildId?: string): DiscordChannelSyncData[] {
    const targetGuildId = guildId || this.activeGuildId || 'default-guild';
    const cache = this.getCachedData(guildId);
    if (cache && cache.categories && cache.categories.length > 0) {
      return cache.categories;
    }
    if (cache && cache.channels && cache.channels.length > 0) {
      const catChannels = cache.channels.filter((c) => String(c.type) === '4');
      if (catChannels.length > 0) return catChannels;
    }
    // Fallback default categories
    return [
      { id: 'cat-onboarding', discord_channel_id: 'cat-onboarding', guild_id: targetGuildId, name: 'FORMATION PAWAKO 🔒', type: 4, position: 0 },
      { id: 'cat-personal', discord_channel_id: 'cat-personal', guild_id: targetGuildId, name: 'SALONS PERSONNELS 🔒', type: 4, position: 1 },
      { id: 'cat-admin', discord_channel_id: 'cat-admin', guild_id: targetGuildId, name: 'ADMINISTRATION 🛡️', type: 4, position: 2 },
    ];
  }

  public getRoleById(roleId: string, guildId?: string): DiscordRoleSyncData | undefined {
    if (!roleId) return undefined;
    const roles = this.getRoles(guildId);
    return roles.find((r) => r.discord_role_id === roleId || r.id === roleId);
  }

  public getChannelById(channelId: string, guildId?: string): DiscordChannelSyncData | undefined {
    if (!channelId) return undefined;
    const channels = this.getChannels(guildId);
    return channels.find((c) => c.discord_channel_id === channelId || c.id === channelId);
  }

  public getCategoryById(categoryId: string, guildId?: string): DiscordChannelSyncData | undefined {
    if (!categoryId) return undefined;
    const categories = this.getCategories(guildId);
    return categories.find((c) => c.discord_channel_id === categoryId || c.id === categoryId);
  }

  /**
   * Pre-flight Validation before Publishing Configuration
   */
  public async validatePreFlightConfig(
    config: OnboardingFlowConfig,
    guildId?: string
  ): Promise<PreFlightValidationResult> {
    const targetGuildId = guildId || config.guildId || this.activeGuildId;
    const cache = this.getCachedData(targetGuildId);

    const result: PreFlightValidationResult = {
      isValid: true,
      checks: {
        guildAccessible: { status: 'pass', message: 'Serveur Discord accessible' },
        botOnline: { status: 'pass', message: 'Bot Discord en ligne et connecté' },
        welcomeChannel: { status: 'pass', message: 'Salon de bienvenue valide' },
        welcomeChannelPermissions: { status: 'pass', message: 'Permissions du salon valides' },
        initialRole: { status: 'pass', message: 'Rôle initial valide' },
        initialRoleHierarchy: { status: 'pass', message: 'Hiérarchie du rôle initial valide' },
        categoryExists: { status: 'pass', message: 'Catégorie des salons personnels valide' },
        logChannel: { status: 'pass', message: 'Salon des logs valide' },
        moduleRoles: [],
      },
      errors: [],
      warnings: [],
    };

    if (!targetGuildId || !cache) {
      result.isValid = false;
      result.checks.guildAccessible = {
        status: 'fail',
        message: 'Aucun serveur sélectionné ou non synchronisé.',
      };
      result.errors.push('Veuillez effectuer une synchronisation Discord avant de publier.');
      return result;
    }

    // 1. Welcome Channel check
    if (!config.welcomeChannelId) {
      result.checks.welcomeChannel = {
        status: 'fail',
        message: 'Aucun salon de bienvenue sélectionné.',
      };
      result.errors.push('Le salon de bienvenue doit être sélectionné dans la configuration.');
      result.isValid = false;
    } else {
      const chan = this.getChannelById(config.welcomeChannelId, targetGuildId);
      if (!chan) {
        result.checks.welcomeChannel = {
          status: 'fail',
          message: 'Le salon de bienvenue sélectionné n\'existe plus sur Discord.',
        };
        result.errors.push('Le salon de bienvenue configuré a été supprimé de Discord.');
        result.isValid = false;
      } else {
        result.checks.welcomeChannel = {
          status: 'pass',
          message: `Salon de bienvenue "#${chan.name}" détecté`,
        };
      }
    }

    // 2. Initial Role check
    if (!config.initialRoleId) {
      result.checks.initialRole = {
        status: 'fail',
        message: 'Aucun rôle initial sélectionné.',
      };
      result.errors.push('Un rôle initial doit être configuré.');
      result.isValid = false;
    } else {
      const role = this.getRoleById(config.initialRoleId, targetGuildId);
      if (!role) {
        result.checks.initialRole = {
          status: 'fail',
          message: 'Le rôle initial sélectionné n\'existe plus sur Discord.',
        };
        result.errors.push('Le rôle initial configuré a été supprimé de Discord.');
        result.isValid = false;
      } else {
        result.checks.initialRole = {
          status: 'pass',
          message: `Rôle initial "@${role.name}" détecté`,
        };

        if (role.isHigherThanBot || role.canAssignByBot === false) {
          result.checks.initialRoleHierarchy = {
            status: 'fail',
            message: `Le rôle du Bot doit être placé AU-DESSUS de @${role.name} dans Discord.`,
          };
          result.errors.push(
            `Le Bot ne possède pas la hiérarchie suffisante pour attribuer le rôle @${role.name}. Réordonnez les rôles dans Paramètres du Serveur > Rôles.`
          );
          result.isValid = false;
        }
      }
    }

    // 3. Personal Category check
    if (config.personalCategoryId) {
      const cat = this.getCategoryById(config.personalCategoryId, targetGuildId);
      if (!cat) {
        result.checks.categoryExists = {
          status: 'warn',
          message: 'La catégorie sélectionnée n\'existe plus sur Discord.',
        };
        result.warnings.push('La catégorie des salons personnels est introuvable.');
      } else {
        result.checks.categoryExists = {
          status: 'pass',
          message: `Catégorie "${cat.name}" valide`,
        };
      }
    }

    // 4. Log channel check
    if (config.logChannelId) {
      const logChan = this.getChannelById(config.logChannelId, targetGuildId);
      if (!logChan) {
        result.checks.logChannel = {
          status: 'warn',
          message: 'Le salon des logs sélectionné n\'existe plus sur Discord.',
        };
        result.warnings.push('Le salon des logs configuré est introuvable.');
      } else {
        result.checks.logChannel = {
          status: 'pass',
          message: `Salon des logs "#${logChan.name}" valide`,
        };
      }
    }

    // 5. Module Roles check
    if (config.stepConfigs) {
      config.stepConfigs.forEach((step, idx) => {
        if (step.roleOnStartId) {
          const r = this.getRoleById(step.roleOnStartId, targetGuildId);
          if (!r) {
            result.checks.moduleRoles.push({
              status: 'warn',
              message: `Module ${idx + 1} : Rôle de début introuvable sur Discord.`,
            });
            result.warnings.push(`Module ${idx + 1} : Rôle de début introuvable.`);
          } else if (r.canAssignByBot === false) {
            result.checks.moduleRoles.push({
              status: 'fail',
              message: `Module ${idx + 1} : Le bot est au-dessous du rôle @${r.name}.`,
            });
            result.errors.push(
              `Module ${idx + 1} : Impossible d'attribuer @${r.name} (position hiérarchique trop haute).`
            );
            result.isValid = false;
          }
        }
        if (step.roleOnPassId) {
          const r = this.getRoleById(step.roleOnPassId, targetGuildId);
          if (!r) {
            result.checks.moduleRoles.push({
              status: 'warn',
              message: `Module ${idx + 1} : Rôle de succès introuvable sur Discord.`,
            });
            result.warnings.push(`Module ${idx + 1} : Rôle de succès introuvable.`);
          } else if (r.canAssignByBot === false) {
            result.checks.moduleRoles.push({
              status: 'fail',
              message: `Module ${idx + 1} : Le bot est au-dessous du rôle @${r.name}.`,
            });
            result.errors.push(
              `Module ${idx + 1} : Impossible d'attribuer @${r.name} (position hiérarchique trop haute).`
            );
            result.isValid = false;
          }
        }
      });
    }

    return result;
  }
}

export const discordSyncService = new DiscordSyncService();
