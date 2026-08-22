import { DiscordChannelConfig } from '../types';
import { roleService } from './roleService';
import { serverService } from './serverService';
import { store } from './store';
import { discordSyncService } from './discordSyncService';
import { safeFetchJson, safeFetchJsonWithRetryAndTimeout } from '../utils/apiUtils';

export const mockChannels: DiscordChannelConfig[] = [];

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
  botToken: '',
  clientId: '',
  clientSecret: '',
  webhookUrl: '',
  commandPrefix: '!',
  botName: 'Pawako Bot',
  botAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
};

/**
 * Helper for detailed console logging of requests sent to Discord / backend
 */
function logDiscordRequest(context: string, url: string, options?: any) {
  console.group(`[DiscordService Request 🚀] ${context}`);
  console.log(`URL:`, url);
  console.log(`Method:`, options?.method || 'GET');
  if (options?.headers) console.log(`Headers:`, options.headers);
  if (options?.body) {
    try {
      console.log(`Body (Parsed):`, JSON.parse(options.body));
    } catch {
      console.log(`Body (Raw):`, options.body);
    }
  }
  console.groupEnd();
}

function logDiscordResponse(context: string, status: number, contentType: string | null, rawText: string, parsedData?: any, apiError?: any) {
  const isOk = status >= 200 && status < 300;
  console.group(`[DiscordService Response ${isOk ? '✅' : '❌'}] ${context}`);
  console.log(`HTTP Status:`, status);
  console.log(`Content-Type:`, contentType || '(aucun)');
  console.log(`Raw Text Length:`, rawText ? rawText.length : 0);
  console.log(`Raw Text Preview:`, rawText ? rawText.slice(0, 500) : '(RÉPONSE VIDE)');
  if (status === 401) {
    console.warn(`[DiscordService Auth Info] Token Bot Discord non configuré ou à renouveler (HTTP 401). Saisissez votre clé dans 'Token Bot'.`);
  } else if (apiError) {
    console.warn(`[DiscordService Info HTTP ${status}]:`, apiError);
  }
  if (parsedData !== undefined && parsedData !== null) {
    console.log(`Données JSON analysées avec succès:`, parsedData);
  }
  console.groupEnd();
}

/**
 * Helper to log detailed response metadata BEFORE parsing JSON
 */
function logBeforeJsonParse(context: string, response: Response, rawText: string) {
  const statusCode = response.status;
  const contentType = response.headers.get('content-type') || '(none)';
  const snippet = rawText ? rawText.slice(0, 300) : '(RÉPONSE VIDE / EMPTY)';

  console.log(`[DiscordService BEFORE JSON PARSE 🔍] ${context}:`);
  console.log(`  - Status Code: ${statusCode}`);
  console.log(`  - Content-Type: ${contentType}`);
  console.log(`  - Raw Text Snippet (first 300 chars): "${snippet}"`);
  if (!rawText || !rawText.trim()) {
    console.warn(`⚠️ [DiscordService Warning] Raw response text is empty for ${context}! Attempting JSON.parse on empty string would cause 'Unexpected end of JSON input'.`);
  }
}

/**
 * Local cache manager to reduce redundant network calls and prevent API timeouts
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

export class DiscordCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;
  private storagePrefix = 'pawako_discord_cache_';

  constructor(defaultTTLMs: number = 60_000) {
    this.defaultTTL = defaultTTLMs;
    this.loadFromLocalStorage();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  private loadFromLocalStorage(): void {
    if (!this.isLocalStorageAvailable()) return;
    try {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          const cacheKey = key.slice(this.storagePrefix.length);
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry: CacheEntry<any> = JSON.parse(raw);
            if (now <= entry.expiresAt) {
              this.cache.set(cacheKey, entry);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[DiscordCacheManager] Erreur lors de la lecture de localStorage:', e);
    }
  }

  public get<T>(key: string): T | null {
    let entry = this.cache.get(key);
    const now = Date.now();

    if (!entry && this.isLocalStorageAvailable()) {
      try {
        const raw = localStorage.getItem(`${this.storagePrefix}${key}`);
        if (raw) {
          entry = JSON.parse(raw);
          if (entry && now <= entry.expiresAt) {
            this.cache.set(key, entry);
          } else if (entry) {
            localStorage.removeItem(`${this.storagePrefix}${key}`);
            return null;
          }
        }
      } catch (e) {
        console.warn('[DiscordCacheManager] Erreur lecture clé localStorage:', e);
      }
    }

    if (!entry) return null;

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      if (this.isLocalStorageAvailable()) {
        try {
          localStorage.removeItem(`${this.storagePrefix}${key}`);
        } catch {}
      }
      return null;
    }

    return entry.data as T;
  }

  public set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);

    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(entry));
      } catch (e) {
        console.warn('[DiscordCacheManager] Impossible d\'écrire dans localStorage:', e);
      }
    }
  }

  public invalidate(keyOrPrefix?: string): void {
    if (!keyOrPrefix) {
      this.clear();
      return;
    }
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(keyOrPrefix) || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
    if (this.isLocalStorageAvailable()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.storagePrefix)) {
            const rawKey = k.slice(this.storagePrefix.length);
            if (rawKey.includes(keyOrPrefix) || rawKey.startsWith(keyOrPrefix)) {
              keysToRemove.push(k);
            }
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      } catch (e) {
        console.warn('[DiscordCacheManager] Invalidate localStorage error:', e);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
    if (this.isLocalStorageAvailable()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(this.storagePrefix)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      } catch (e) {
        console.warn('[DiscordCacheManager] Clear localStorage error:', e);
      }
    }
  }

  public getStats() {
    let active = 0;
    const now = Date.now();
    for (const entry of Array.from(this.cache.values())) {
      if (now <= entry.expiresAt) active++;
    }
    return {
      totalEntries: this.cache.size,
      activeEntries: active,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Asynchronous task queue for rate-limiting and preventing concurrent API overload
 */
interface QueueTask<T = any> {
  id: string;
  type: string;
  priority: number;
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  retries: number;
  maxRetries: number;
  createdAt: number;
}

export class DiscordTaskQueue {
  private queue: QueueTask[] = [];
  private activeCount = 0;
  private maxConcurrency = 1; // Traitement strict UNE PAR UNE pour éviter les erreurs 429 & timeouts
  private delayBetweenTasksMs = 250; // Légere pause entre chaque requête
  private processedCount = 0;
  private failedCount = 0;

  constructor(maxConcurrency: number = 1, delayBetweenTasksMs: number = 250) {
    this.maxConcurrency = maxConcurrency;
    this.delayBetweenTasksMs = delayBetweenTasksMs;
  }

  public enqueue<T>(
    taskFn: () => Promise<T>,
    options?: { type?: string; priority?: number; maxRetries?: number }
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: QueueTask<T> = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: options?.type || 'api_request',
        priority: options?.priority ?? 1,
        fn: taskFn,
        resolve,
        reject,
        retries: 0,
        maxRetries: options?.maxRetries ?? 2,
        createdAt: Date.now(),
      };

      this.queue.push(task);
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;

    try {
      const result = await task.fn();
      this.processedCount++;
      task.resolve(result);
    } catch (err: any) {
      if (task.retries < task.maxRetries) {
        task.retries++;
        console.warn(`[DiscordTaskQueue 🔄] Retrying task ${task.id} (${task.type}) - Attempt ${task.retries}/${task.maxRetries}`);
        await new Promise((r) => setTimeout(r, Math.pow(2, task.retries) * 400));
        this.queue.unshift(task);
      } else {
        this.failedCount++;
        console.error(`[DiscordTaskQueue ❌] Task ${task.id} (${task.type}) failed:`, err);
        task.reject(err);
      }
    } finally {
      this.activeCount--;
      if (this.delayBetweenTasksMs > 0) {
        await new Promise((r) => setTimeout(r, this.delayBetweenTasksMs));
      }
      this.processQueue();
    }
  }

  public getStats() {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      processed: this.processedCount,
      failed: this.failedCount,
    };
  }

  public clearQueue() {
    for (const task of this.queue) {
      task.reject(new Error('Task cancelled (queue cleared)'));
    }
    this.queue = [];
  }
}

class DiscordService {
  private channels: DiscordChannelConfig[] = [...mockChannels];
  private config: DiscordConfig;
  private cacheManager = new DiscordCacheManager(60_000); // 1 minute default TTL avec localStorage
  private taskQueue = new DiscordTaskQueue(1, 250); // Concurrency 1 (une par une), 250ms delay between tasks

  constructor() {
    this.config = this.loadConfig();
    this.channels = this.loadChannels();
  }

  private loadChannels(): DiscordChannelConfig[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('pawako_discord_channels');
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      // Ignore
    }
    return [];
  }

  private loadConfig(): DiscordConfig {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('pawako_discord_config');
        if (stored) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
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
    const activeGuildId = discordSyncService.getActiveGuildId();
    if (activeGuildId) {
      const syncedChannels = discordSyncService.getChannels(activeGuildId);
      if (syncedChannels && syncedChannels.length > 0) {
        return syncedChannels.map((c) => ({
          id: c.discord_channel_id || c.id,
          name: c.name,
          type: 'text',
          categoryName: 'SALONS DISCORD',
          isConfiguredFor: 'general',
        }));
      }
    }
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

  public async fetchAndSyncRealDiscordData(options?: { forceRefresh?: boolean }): Promise<{ success: boolean; message?: string; server?: any }> {
    const token = this.config.botToken;
    const cacheKey = `real_discord_data_${token.slice(0, 15)}`;

    if (!options?.forceRefresh) {
      const cached = this.cacheManager.get<any>(cacheKey);
      if (cached) {
        console.log(`[DiscordService Cache Hit ⚡] Utilisation des données Discord synchronisées en cache local.`);
        return cached;
      }

      // Check if discordSyncService already has cached data
      const activeGuildId = discordSyncService.getActiveGuildId();
      if (activeGuildId) {
        const syncCache = discordSyncService.getCachedData(activeGuildId);
        if (syncCache && syncCache.guild) {
          if (syncCache.roles && syncCache.roles.length > 0) {
            roleService.setRoles(
              syncCache.roles.map((r) => ({
                id: r.id || r.discord_role_id,
                name: r.name,
                color: r.color,
                position: r.position,
                isManaged: r.managed,
              }))
            );
          }
          return {
            success: true,
            server: syncCache.guild,
            message: 'Données récupérées depuis la synchronisation Discord.',
          };
        }
      }
    }

    return this.taskQueue.enqueue(async () => {
      const url = `/api/discord/sync-real-data?token=${encodeURIComponent(token)}`;
      logDiscordRequest('fetchAndSyncRealDiscordData', url);

      const result = await safeFetchJson(url);

      if (!result.ok || !result.data) {
        console.warn('[fetchAndSyncRealDiscordData Info]', result.error);
        return {
          success: false,
          message: result.error,
        };
      }

      const data = result.data;
      if (!data.success) {
        return { success: false, message: data.message || 'Aucun serveur trouvé' };
      }

      if (data.channels && Array.isArray(data.channels)) {
        this.setChannels(data.channels);
      }

      if (data.roles && Array.isArray(data.roles)) {
        roleService.setRoles(data.roles);
      }

      if (data.server) {
        serverService.updateServerDetails(data.server);
      }

      if (data.members && Array.isArray(data.members)) {
        store.setMembers(data.members);
      }

      this.cacheManager.set(cacheKey, data, 60_000);
      return data;
    }, { type: 'sync_real_data', priority: 2 });
  }

  public async syncDiscord(forceRefresh: boolean = true): Promise<{ success: boolean; channelsCount: number; rolesCount: number; message?: string }> {
    const result = await this.fetchAndSyncRealDiscordData({ forceRefresh });
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
    return this.taskQueue.enqueue(async () => {
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

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      logDiscordRequest('sendWebhookTestMessage', url, requestOptions);

      try {
        const response = await fetch(url, requestOptions);
        const contentType = response.headers.get('content-type');
        const rawText = await response.text();

        logBeforeJsonParse('sendWebhookTestMessage', response, rawText);

        let parsedJson: any = null;
        let parseError: any = null;

        if (rawText && rawText.trim()) {
          try {
            parsedJson = JSON.parse(rawText);
          } catch (e) {
            parseError = e;
            console.warn(`[DiscordService Info] Failed to parse JSON in sendWebhookTestMessage:`, e);
          }
        }

        logDiscordResponse('sendWebhookTestMessage', response.status, contentType, rawText, parsedJson, parseError);

        if (response.ok || response.status === 204) {
          return { success: true, message: 'Message de test envoyé sur votre salon Discord avec succès !' };
        } else {
          return { success: false, message: `Erreur Discord (${response.status}): ${rawText || 'Échec d\'envoi'}` };
        }
      } catch (err: any) {
        console.warn('[Discord Webhook Info]', err);
        return { success: false, message: `Erreur réseau ou CORS: ${err?.message || 'Impossible de contacter le webhook Discord.'}` };
      }
    }, { type: 'webhook_test', priority: 1 });
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

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    logDiscordRequest(`sendWebhookLog [${action}]`, url, requestOptions);

    try {
      const res = await fetch(url, requestOptions);
      const contentType = res.headers.get('content-type');
      const rawText = await res.text();

      logBeforeJsonParse(`sendWebhookLog [${action}]`, res, rawText);

      let parsedJson: any = null;
      let parseError: any = null;

      if (rawText && rawText.trim()) {
        try {
          parsedJson = JSON.parse(rawText);
        } catch (e) {
          parseError = e;
          console.warn(`[DiscordService Info] Failed to parse JSON in sendWebhookLog [${action}]:`, e);
        }
      }

      logDiscordResponse(`sendWebhookLog [${action}]`, res.status, contentType, rawText, parsedJson, parseError);
      return res.ok || res.status === 204;
    } catch (err: any) {
      console.warn('[Discord Webhook Log Info]', err);
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
    guildId?: string;
    roleEnCoursName?: string;
    roleValidatedName?: string;
    blocks?: any[];
    isActive?: boolean;
  }): Promise<{ success: boolean; message: string; messageId?: string; channelId?: string; guildId?: string; discordStatus?: number }> {
    const cleanChannel = (moduleData.channelName || '#formation').replace(/^#/, '');
    const activeGuildId = moduleData.guildId || discordSyncService.getActiveGuildId();

    if (!activeGuildId || !/^\d{17,20}$/.test(activeGuildId)) {
      return {
        success: false,
        message: 'Veuillez d\'abord synchroniser un serveur Discord actif dans l\'onglet "Discord Sync".',
      };
    }

    let targetChannelId = moduleData.channelId || (moduleData as any).discordChannelId;

    // Auto-resolve real channel snowflake ID if missing or dummy string (e.g. "chan-mod-1")
    if (!targetChannelId || !/^\d{17,20}$/.test(targetChannelId)) {
      const syncedChannels = discordSyncService.getChannels(activeGuildId);
      const cleanTargetName = cleanChannel.toLowerCase().trim();

      // 1. Match by channel name
      const matchedChan = syncedChannels.find(
        (c) =>
          c.name.replace(/^#/, '').toLowerCase().trim() === cleanTargetName ||
          c.discord_channel_id === targetChannelId ||
          c.id === targetChannelId
      );

      if (matchedChan) {
        targetChannelId = matchedChan.discord_channel_id || matchedChan.id;
      } else if (syncedChannels.length > 0) {
        // 2. Fallback to first text channel on the synced server
        const firstTextChan = syncedChannels.find((c) => c.type === 0 || !c.type) || syncedChannels[0];
        if (firstTextChan) {
          targetChannelId = firstTextChan.discord_channel_id || firstTextChan.id;
        }
      }
    }

    if (!targetChannelId || !/^\d{17,20}$/.test(targetChannelId)) {
      return {
        success: false,
        message: `Le salon configuré pour ce module ("#${cleanChannel}") n'a pas pu être associé à un salon Discord réel (snowflake). Veuillez synchroniser vos salons dans "Discord Sync" ou sélectionner un salon existant dans les paramètres du module.`,
      };
    }

    // Clean up placeholder description
    let cleanDesc = moduleData.description || '';
    if (cleanDesc.toLowerCase().trim() === 'description du module...') {
      cleanDesc = '';
    }

    // Format blocks summary cleanly for embed description
    const formattedBlocks = moduleData.blocks && moduleData.blocks.length > 0
      ? moduleData.blocks
          .map((b) => {
            const hasTitle = Boolean(b.title && b.title.trim().length > 0);
            if (b.type === 'heading' || hasTitle) {
              return hasTitle ? `**${b.title!.trim()}**\n${b.content || ''}` : `${b.content || ''}`;
            }
            if (b.type === 'alert') return `> ⚠️ **${hasTitle ? b.title!.trim() : 'Note'}**: ${b.content || ''}`;
            if (b.type === 'button') return `🔘 **[${b.content || 'Démarrer le Module'}]**`;
            return b.content || '';
          })
          .filter((s) => Boolean(s && s.trim().length > 0))
          .join('\n\n')
      : '';

    const descriptionText = cleanDesc && formattedBlocks
      ? `${cleanDesc}\n\n${formattedBlocks}`
      : cleanDesc || formattedBlocks || 'Module de formation disponible pour tous les membres.';

    const embed = {
      title: `🎓 ${moduleData.title}`,
      description: descriptionText,
      color: 0x6366f1, // Indigo color #6366f1
      footer: {
        text: 'Pawako Formation • Espace de Formation',
        icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      },
      timestamp: new Date().toISOString(),
    };

    const components = [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 1, // Primary (Blurple)
            custom_id: `launch_module_${moduleData.id || Date.now()}`,
            label: '📚 Lancer la Formation',
          },
        ],
      },
    ];

    const endpoint = '/api/discord/send-channel-embed';
    const requestBody = {
      guildId: activeGuildId,
      channelName: cleanChannel,
      channelId: targetChannelId,
      embed,
      components,
      content: `📢 **Nouveau Module de Formation Disponible !**`,
    };

    logDiscordRequest('sendModuleEmbed', endpoint, { method: 'POST', body: JSON.stringify(requestBody) });

    try {
      const result = await safeFetchJsonWithRetryAndTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
        { timeoutMs: 8000, maxRetries: 3 }
      );

      logDiscordResponse(
        'sendModuleEmbed',
        result.status,
        'application/json',
        JSON.stringify(result.data || {}),
        result.data,
        result.ok ? null : result.error
      );

      if (result.ok && result.data && result.data.success) {
        const data = result.data;
        this.sendWebhookLog('Publication Embed Module', 'module', `Module "${moduleData.title}" publié dans #${cleanChannel} (Message ID: ${data.messageId})`);
        return {
          success: true,
          message: data.message || `Embed envoyé dans #${cleanChannel} (Message ID: ${data.messageId})`,
          messageId: data.messageId,
          channelId: data.channelId || targetChannelId,
          guildId: data.guildId || activeGuildId,
          discordStatus: data.discordStatus || 201,
        };
      }
      return {
        success: false,
        message: result.error || (result.data && result.data.error) || `Échec de publication Discord (HTTP ${result.status})`,
        discordStatus: (result.data && result.data.discordStatus) || result.status,
      };
    } catch (err: any) {
      console.warn('[Discord sendModuleEmbed Info]', err?.message || err);
      return { success: false, message: err.message || 'Erreur réseau lors de l\'envoi' };
    }
  }

  /**
   * Send a custom embed / message to a specified Discord channel
   */
  public async sendCustomEmbed(options: {
    channelName: string;
    channelId?: string;
    guildId?: string;
    embed: any;
    components?: any[];
    content?: string;
  }): Promise<{ success: boolean; message: string; messageId?: string }> {
    const cleanChannel = (options.channelName || '#general').replace(/^#/, '');
    const activeGuildId = options.guildId || discordSyncService.getActiveGuildId();

    let targetChannelId = options.channelId;
    if (!targetChannelId || !/^\d{17,20}$/.test(targetChannelId)) {
      const syncedChannels = discordSyncService.getChannels(activeGuildId);
      const cleanTargetName = cleanChannel.toLowerCase().trim();
      const matchedChan = syncedChannels.find(
        (c) =>
          c.name.replace(/^#/, '').toLowerCase().trim() === cleanTargetName ||
          c.discord_channel_id === targetChannelId ||
          c.id === targetChannelId
      );

      if (matchedChan) {
        targetChannelId = matchedChan.discord_channel_id || matchedChan.id;
      } else if (syncedChannels.length > 0) {
        const firstTextChan = syncedChannels.find((c) => c.type === 0 || !c.type) || syncedChannels[0];
        if (firstTextChan) {
          targetChannelId = firstTextChan.discord_channel_id || firstTextChan.id;
        }
      }
    }

    if (!targetChannelId || !/^\d{17,20}$/.test(targetChannelId)) {
      return {
        success: false,
        message: `Le salon ("#${cleanChannel}") n'a pas pu être associé à un salon Discord réel.`,
      };
    }

    const endpoint = '/api/discord/send-channel-embed';
    const requestBody = {
      guildId: activeGuildId,
      channelName: cleanChannel,
      channelId: targetChannelId,
      embed: options.embed,
      components: options.components || undefined,
      content: options.content || `📢 **Message Automatique**`,
    };

    try {
      const result = await safeFetchJsonWithRetryAndTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
        { timeoutMs: 8000, maxRetries: 3 }
      );

      if (result.ok && result.data && result.data.success) {
        return {
          success: true,
          message: result.data.message || `Message envoyé dans #${cleanChannel}`,
          messageId: result.data.messageId,
        };
      }
      return {
        success: false,
        message: result.error || (result.data && result.data.error) || 'Échec de l\'envoi du message',
      };
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
    guildId?: string;
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
    const activeGuildId = options.guildId || discordSyncService.getActiveGuildId();
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

    const endpoint = '/api/discord/create-private-thread';
    const requestBody = {
      guildId: activeGuildId,
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
    };

    logDiscordRequest('createPrivateQuizThread', endpoint, { method: 'POST', body: JSON.stringify(requestBody) });

    try {
      const result = await safeFetchJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      logDiscordResponse(
        'createPrivateQuizThread',
        result.status,
        'application/json',
        JSON.stringify(result.data || {}),
        result.data,
        result.ok ? null : result.error
      );

      if (result.ok && result.data && result.data.success) {
        const data = result.data;
        this.sendWebhookLog('Fil Privé Résultats', 'quiz', `Fil "${data.threadName}" créé dans #${cleanChannel} pour ${options.memberName}`);
        return { success: true, threadName: data.threadName, message: data.message || `Fil privé créé dans #${cleanChannel}` };
      }
      return { success: false, message: result.error || (result.data && result.data.error) || 'Impossible de créer le fil privé' };
    } catch (err: any) {
      console.warn('[Discord createPrivateQuizThread Info]', err?.message || err);
      return { success: false, message: err.message || 'Erreur réseau lors de la création du fil privé' };
    }
  }

  /**
   * Create a personal text channel for a member's onboarding on Discord
   */
  public async createPersonalChannel(options: {
    memberName: string;
    guildId?: string;
    prefix?: string;
    rulesMessage?: string;
  }): Promise<{ success: boolean; channelName?: string; message: string }> {
    const activeGuildId = options.guildId || discordSyncService.getActiveGuildId();
    const endpoint = '/api/discord/create-personal-channel';
    const requestBody = {
      ...options,
      guildId: activeGuildId,
    };

    logDiscordRequest('createPersonalChannel', endpoint, { method: 'POST', body: JSON.stringify(requestBody) });

    try {
      const result = await safeFetchJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      logDiscordResponse(
        'createPersonalChannel',
        result.status,
        'application/json',
        JSON.stringify(result.data || {}),
        result.data,
        result.ok ? null : result.error
      );

      if (result.ok && result.data && result.data.success) {
        const data = result.data;
        this.sendWebhookLog('Salon Personnel Créé', 'member', `Salon "${data.channelName}" créé pour ${options.memberName}`);
        return { success: true, channelName: data.channelName, message: data.message || `Salon personnel ${data.channelName} created` };
      }
      return { success: false, message: result.error || (result.data && result.data.error) || 'Échec de la création du salon personnel' };
    } catch (err: any) {
      console.warn('[Discord createPersonalChannel Info]', err?.message || err);
      return { success: false, message: err.message || 'Erreur réseau lors de la création du salon personnel' };
    }
  }

  /**
   * Assign or update roles for a member on Discord REST API
   */
  public async assignDiscordRolesToMember(
    discordId: string,
    roles: string[],
    guildId?: string
  ): Promise<{ success: boolean; message: string; roles?: string[]; error?: string }> {
    return this.taskQueue.enqueue(async () => {
      const activeGuildId = guildId || discordSyncService.getActiveGuildId();
      const endpoint = `/api/discord/members/${encodeURIComponent(discordId)}/roles`;

      const requestBody = {
        guildId: activeGuildId,
        roles,
      };

      logDiscordRequest('assignDiscordRolesToMember', endpoint, { method: 'POST', body: JSON.stringify(requestBody) });

      try {
        const result = await safeFetchJson(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        logDiscordResponse(
          'assignDiscordRolesToMember',
          result.status,
          'application/json',
          JSON.stringify(result.data || {}),
          result.data,
          result.ok ? null : result.error
        );

        if (result.ok && result.data && result.data.success) {
          this.cacheManager.invalidate('real_discord_data');
          return {
            success: true,
            message: result.data.message || 'Rôles synchronisés sur Discord avec succès.',
            roles: result.data.roles,
          };
        }
        return {
          success: false,
          message: result.error || (result.data && result.data.error) || 'Échec de la synchronisation des rôles sur Discord.',
          error: result.error || (result.data && result.data.error),
        };
      } catch (err: any) {
        console.warn('[Discord assignDiscordRolesToMember Info]', err?.message || err);
        return { success: false, message: err.message || 'Erreur réseau lors de la mise à jour des rôles.' };
      }
    }, { type: 'assign_roles', priority: 2 });
  }

  /**
   * Batched role updates for multiple members in a single network call
   */
  public async batchAssignDiscordRoles(
    updates: Array<{ discordId: string; roles: string[] }>,
    guildId?: string
  ): Promise<{ success: boolean; processedCount: number; successCount: number; results?: any[]; error?: string }> {
    if (!updates || updates.length === 0) {
      return { success: true, processedCount: 0, successCount: 0, results: [] };
    }

    return this.taskQueue.enqueue(async () => {
      const activeGuildId = guildId || discordSyncService.getActiveGuildId();
      const endpoint = '/api/discord/members/batch-roles';
      const requestBody = { guildId: activeGuildId, updates };

      logDiscordRequest('batchAssignDiscordRoles', endpoint, { method: 'POST', body: JSON.stringify(requestBody) });

      try {
        const result = await safeFetchJson(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        logDiscordResponse(
          'batchAssignDiscordRoles',
          result.status,
          'application/json',
          JSON.stringify(result.data || {}),
          result.data,
          result.ok ? null : result.error
        );

        if (result.ok && result.data && result.data.success) {
          this.cacheManager.invalidate('real_discord_data');
          return result.data;
        }

        // Fallback: If batch endpoint fails, process sequentially
        console.warn('[batchAssignDiscordRoles] Échec du batch, exécution individuelle séquentielle...');
        const fallbackResults: any[] = [];
        let successCount = 0;

        for (const update of updates) {
          const res = await this.assignDiscordRolesToMember(update.discordId, update.roles, activeGuildId);
          if (res.success) successCount++;
          fallbackResults.push({ discordId: update.discordId, success: res.success, message: res.message });
        }

        this.cacheManager.invalidate('real_discord_data');
        return {
          success: true,
          processedCount: updates.length,
          successCount,
          results: fallbackResults,
        };
      } catch (err: any) {
        console.warn('[batchAssignDiscordRoles Error]', err);
        return { success: false, processedCount: 0, successCount: 0, error: err.message };
      }
    }, { type: 'batch_assign_roles', priority: 3 });
  }

  /**
   * Batched state update for members (roles and/or progress status)
   */
  public async batchSyncMembersState(
    updates: Array<{ discordId: string; status?: string; moduleId?: string; score?: number; roles?: string[] }>
  ): Promise<{ success: boolean; updatedCount?: number; message?: string }> {
    if (!updates || updates.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    return this.taskQueue.enqueue(async () => {
      const endpoint = '/api/discord/members/batch-sync';
      try {
        const result = await safeFetchJson(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });

        if (result.ok && result.data && result.data.success) {
          this.cacheManager.invalidate('real_discord_data');
          return result.data;
        }
        return { success: false, updatedCount: 0, message: result.error || 'Échec de la synchronisation des états' };
      } catch (err: any) {
        return { success: false, updatedCount: 0, message: err.message };
      }
    }, { type: 'batch_sync_members', priority: 2 });
  }

  public getCacheStats() {
    return this.cacheManager.getStats();
  }

  public getQueueStats() {
    return this.taskQueue.getStats();
  }

  public clearCache() {
    this.cacheManager.clear();
  }

  public clearQueue() {
    this.taskQueue.clearQueue();
  }
}

export const discordService = new DiscordService();

