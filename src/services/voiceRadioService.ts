import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
  NoSubscriberBehavior,
  VoiceConnection,
  AudioPlayer,
  getVoiceConnection,
} from '@discordjs/voice';
import { Guild, VoiceBasedChannel } from 'discord.js';
import https from 'https';
import http from 'http';

// Ensure ffmpeg path is set for prism-media / @discordjs/voice
try {
  if (!process.env.FFMPEG_PATH) {
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
      process.env.FFMPEG_PATH = ffmpegPath;
    }
  }
} catch {
  // ffmpeg-static not available or not required if ffmpeg is in system PATH
}

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  description: string;
  url: string;
}

export const RADIO_STATIONS: Record<string, RadioStation> = {
  pawako: {
    id: 'pawako',
    name: '📻 Pawako Webradio 24/7 (Officielle)',
    genre: 'Lo-Fi / Focus & Astuces',
    description: 'Station webradio officielle Pawako avec enchaînement continu et capsules focus',
    url: 'https://pawako-webradio.ai.studio/stream',
  },
  lofi: {
    id: 'lofi',
    name: '🎧 Lo-Fi Chillhop 24/7',
    genre: 'Lo-Fi / Beats',
    description: 'Beats doux & relaxants pour le travail et le chatting',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
  },
  groove: {
    id: 'groove',
    name: '🥗 SomaFM Groove Salad',
    genre: 'Downtempo / Ambient',
    description: 'Ambiance downtempo & deep electronic focus',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
  },
  synthwave: {
    id: 'synthwave',
    name: '⚡ SomaFM DEF CON',
    genre: 'Synthwave / Chillstep',
    description: 'Musique électronique pour le coding & haute concentration',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
  },
  drone: {
    id: 'drone',
    name: '🌌 SomaFM Drone Zone',
    genre: 'Deep Ambient',
    description: 'Nappes atmosphériques sans percussions pour concentration totale',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
  },
  chillout: {
    id: 'chillout',
    name: '☕ Lofi Study Beats',
    genre: 'Lo-Fi Study',
    description: 'Mélodies calmes et productivité sereine',
    url: 'https://lofi.stream.laut.fm/lofi',
  },
};

interface GuildBroadcastState {
  connection: VoiceConnection;
  player: AudioPlayer;
  station: RadioStation;
  channelId: string;
  guildId: string;
  volume: number;
  isStreaming: boolean;
  reconnectTimeout?: NodeJS.Timeout;
  currentRequest?: any;
}

class VoiceRadioService {
  private broadcasts = new Map<string, GuildBroadcastState>();
  private customBaseUrl: string = 'https://pawako-webradio.ai.studio';

  public setCustomBaseUrl(url: string) {
    let clean = url.trim().replace(/\/+$/, '');
    // If url contains /stream or /live.mp3, extract base
    if (clean.endsWith('/stream') || clean.endsWith('/live.mp3')) {
      this.customBaseUrl = clean.replace(/\/(stream|live\.mp3)$/, '');
      RADIO_STATIONS.pawako.url = clean;
    } else {
      this.customBaseUrl = clean;
      RADIO_STATIONS.pawako.url = `${clean}/stream`;
    }
    console.log(`[VoiceRadio] Custom Pawako Webradio URL configurée : ${RADIO_STATIONS.pawako.url} (Base: ${this.customBaseUrl})`);
  }

  public getCustomBaseUrl(): string {
    return this.customBaseUrl;
  }

  public async fetchRemoteStatus(): Promise<any | null> {
    if (!this.customBaseUrl) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${this.customBaseUrl}/api/status`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      return await res.json();
    } catch (err: any) {
      return null;
    }
  }

  public async skipRemoteTrack(): Promise<{ success: boolean; message: string; nowPlaying?: any }> {
    if (!this.customBaseUrl) {
      return { success: false, message: 'Aucune URL de webradio personnalisée Pawako configurée.' };
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${this.customBaseUrl}/api/skip`, {
        method: 'POST',
        signal: controller.signal,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      clearTimeout(timeout);
      if (!res.ok) {
        return { success: false, message: `Le serveur distant a retourné une erreur HTTP ${res.status}.` };
      }
      const data = await res.json();
      return { success: true, message: data.message || 'Morceau passé avec succès !', nowPlaying: data.nowPlaying };
    } catch (err: any) {
      return { success: false, message: `Erreur de connexion au serveur webradio : ${err?.message || err}` };
    }
  }

  public getAllStations(): RadioStation[] {
    return Object.values(RADIO_STATIONS);
  }

  public getStation(stationId?: string): RadioStation {
    if (!stationId) return RADIO_STATIONS.pawako;
    const cleanId = stationId.toLowerCase().trim();
    if (RADIO_STATIONS[cleanId]) return RADIO_STATIONS[cleanId];
    if (cleanId.includes('pawako') || cleanId.includes('custom') || cleanId.includes('webradio')) return RADIO_STATIONS.pawako;
    if (cleanId.includes('groove') || cleanId.includes('salad')) return RADIO_STATIONS.groove;
    if (cleanId.includes('synth') || cleanId.includes('defcon') || cleanId.includes('electro')) return RADIO_STATIONS.synthwave;
    if (cleanId.includes('drone') || cleanId.includes('ambient') || cleanId.includes('zen')) return RADIO_STATIONS.drone;
    if (cleanId.includes('chill') || cleanId.includes('study')) return RADIO_STATIONS.chillout;
    return RADIO_STATIONS.pawako;
  }

  public getBroadcast(guildId: string): GuildBroadcastState | undefined {
    return this.broadcasts.get(guildId);
  }

  public getStatus(guildId?: string) {
    if (!guildId) {
      const first = Array.from(this.broadcasts.values())[0];
      if (first) {
        return {
          isStreaming: first.isStreaming,
          station: first.station,
          channelId: first.channelId,
          volume: first.volume,
          guildId: first.guildId,
        };
      }
      return {
        isStreaming: false,
        station: RADIO_STATIONS.lofi,
        channelId: null,
        volume: 0.85,
        guildId: null,
      };
    }

    const state = this.broadcasts.get(guildId);
    return {
      isStreaming: Boolean(state?.isStreaming),
      station: state?.station || RADIO_STATIONS.lofi,
      channelId: state?.channelId || null,
      volume: state?.volume || 0.85,
      guildId,
    };
  }

  public async startBroadcast(
    guild: Guild,
    channel: VoiceBasedChannel,
    stationId: string = 'lofi'
  ): Promise<{ success: boolean; message: string; station: RadioStation }> {
    const station = this.getStation(stationId);
    const existing = this.broadcasts.get(guild.id);

    // If already connected and playing this station in this channel, return ok
    if (
      existing &&
      existing.channelId === channel.id &&
      existing.station.id === station.id &&
      existing.isStreaming
    ) {
      return {
        success: true,
        message: `La station ${station.name} est déjà diffusée en direct dans #${channel.name}.`,
        station,
      };
    }

    try {
      console.log(`[VoiceRadio] Connexion au salon vocal "${channel.name}" (${channel.id}) sur ${guild.name}...`);

      // 1. Join voice channel
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator as any,
        selfDeaf: false,
        selfMute: false,
      });

      // 2. Create or reuse audio player with continuous play behavior
      let player = existing?.player;
      if (!player) {
        player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
            maxMissedFrames: 50,
          },
        });
      }

      const state: GuildBroadcastState = {
        connection,
        player,
        station,
        channelId: channel.id,
        guildId: guild.id,
        volume: existing?.volume || 0.85,
        isStreaming: true,
      };

      this.broadcasts.set(guild.id, state);

      // Subscribe connection to player
      connection.subscribe(player);

      // Play resource immediately
      this.playStream(guild.id);

      // Set up error & auto-reconnect listeners (once)
      if (!existing) {
        this.setupListeners(guild.id, connection, player, channel);
      }

      // Ensure connection transitions to Ready
      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
        console.log(`[VoiceRadio] Connecté et synchronisé en Ready au salon vocal "${channel.name}" (${guild.name}).`);
      } catch (connWarn) {
        console.warn(`[VoiceRadio] Note: la connexion vocale est en cours de négociation avec Discord (${channel.name}).`);
      }

      console.log(`[VoiceRadio] Diffusion active de "${station.name}" dans #${channel.name} (${guild.name}).`);

      return {
        success: true,
        message: `Diffusion vocale 24/7 lancée avec succès : "${station.name}" dans #${channel.name} !`,
        station,
      };
    } catch (err: any) {
      console.error(`[VoiceRadio Error] Impossible de diffuser dans #${channel.name}:`, err);
      return {
        success: false,
        message: `Erreur de connexion vocale : ${err?.message || err}`,
        station,
      };
    }
  }

  private playStream(guildId: string) {
    const state = this.broadcasts.get(guildId);
    if (!state || !state.isStreaming) return;

    if (state.currentRequest) {
      try {
        state.currentRequest.destroy();
      } catch {}
      state.currentRequest = undefined;
    }

    const streamUrl = state.station.url;

    const startHttpStream = (targetUrl: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        console.warn(`[VoiceRadio] Trop de redirections pour ${targetUrl}`);
        return;
      }

      const client = targetUrl.startsWith('https:') ? https : http;
      try {
        const req = client.get(
          targetUrl,
          {
            headers: {
              'User-Agent': 'PawakoDiscordRadio/1.0',
              Accept: '*/*',
              'Icy-MetaData': '0',
            },
          },
          (res) => {
            // Handle redirects (301, 302, 307, 308)
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              const redirectUrl = res.headers.location.startsWith('http')
                ? res.headers.location
                : new URL(res.headers.location, targetUrl).href;
              startHttpStream(redirectUrl, redirectCount + 1);
              return;
            }

            if (res.statusCode && res.statusCode >= 400) {
              console.warn(`[VoiceRadio HTTP Error] Code ${res.statusCode} reçu pour ${targetUrl}`);
              return;
            }

            const resource = createAudioResource(res, {
              inputType: StreamType.Arbitrary,
              inlineVolume: true,
            });

            if (resource.volume) {
              resource.volume.setVolume(state.volume);
            }

            state.player.play(resource);
            console.log(`[VoiceRadio] Flux audio direct connecté pour "${state.station.name}" sur guilde ${guildId}.`);
          }
        );

        req.on('error', (err) => {
          console.warn(`[VoiceRadio HTTP Request Error]`, err.message || err);
        });

        state.currentRequest = req;
      } catch (err: any) {
        console.warn(`[VoiceRadio Stream Catch]`, err?.message || err);
      }
    };

    startHttpStream(streamUrl);
  }

  private setupListeners(
    guildId: string,
    connection: VoiceConnection,
    player: AudioPlayer,
    channel: VoiceBasedChannel
  ) {
    // Reconnect only when state actually transitions from playing/buffering to Idle
    player.on('stateChange', (oldState, newState) => {
      if (
        oldState.status !== AudioPlayerStatus.Idle &&
        newState.status === AudioPlayerStatus.Idle
      ) {
        const state = this.broadcasts.get(guildId);
        if (!state || !state.isStreaming) return;

        console.log(`[VoiceRadio] Flux audio terminé ou interrompu sur #${channel.name}, redémarrage automatique dans 3s...`);
        clearTimeout(state.reconnectTimeout);
        state.reconnectTimeout = setTimeout(() => {
          this.playStream(guildId);
        }, 3000);
      }
    });

    player.on('error', (err) => {
      console.warn(`[VoiceRadio Player Error]`, err.message || err);
      const state = this.broadcasts.get(guildId);
      if (!state || !state.isStreaming) return;

      clearTimeout(state.reconnectTimeout);
      state.reconnectTimeout = setTimeout(() => {
        this.playStream(guildId);
      }, 3000);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log(`[VoiceRadio] Connexion vocale déconnectée sur guilde ${guildId}. Tentative de reconnexion...`);
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        // Real disconnect, re-join if still configured as streaming
        const state = this.broadcasts.get(guildId);
        if (state && state.isStreaming) {
          try {
            connection.destroy();
          } catch {
            // ignore
          }
          console.log(`[VoiceRadio] Reconnexion au salon vocal #${channel.name}...`);
          setTimeout(() => {
            const guild = channel.guild;
            if (guild) {
              this.startBroadcast(guild, channel, state.station.id).catch(() => {});
            }
          }, 3000);
        }
      }
    });

    connection.on('error', (err) => {
      console.warn(`[VoiceRadio Connection Error]`, err.message || err);
    });
  }

  public setVolume(guildId: string, volume: number): boolean {
    const state = this.broadcasts.get(guildId);
    if (!state) return false;
    const cleanVol = Math.max(0, Math.min(1, volume));
    state.volume = cleanVol;
    // Apply immediately if possible
    if ((state.player as any).state?.resource?.volume) {
      (state.player as any).state.resource.volume.setVolume(cleanVol);
    }
    return true;
  }

  public stopBroadcast(guildId: string): { success: boolean; message: string } {
    const state = this.broadcasts.get(guildId);
    if (!state) {
      const conn = getVoiceConnection(guildId);
      if (conn) {
        conn.destroy();
        return { success: true, message: 'Bot déconnecté du salon vocal.' };
      }
      return { success: true, message: 'Aucune diffusion active.' };
    }

    state.isStreaming = false;
    clearTimeout(state.reconnectTimeout);

    if (state.currentRequest) {
      try {
        state.currentRequest.destroy();
      } catch {}
      state.currentRequest = undefined;
    }

    try {
      state.player.stop(true);
    } catch {
      // ignore
    }

    try {
      state.connection.destroy();
    } catch {
      // ignore
    }

    this.broadcasts.delete(guildId);
    return { success: true, message: 'Diffusion radio arrêtée et bot déconnecté du vocal.' };
  }
}

export const voiceRadioService = new VoiceRadioService();
