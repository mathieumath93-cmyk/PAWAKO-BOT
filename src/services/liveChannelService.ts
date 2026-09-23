export interface LiveMessage {
  id: string;
  channelId: string;
  channelName: string;
  guildId?: string;
  candidateId?: string;
  candidateUsername?: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    isBot: boolean;
  };
  content: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    contentType?: string;
    size?: number;
  }>;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
  }>;
}

export interface LiveChannelItem {
  id: string;
  name: string;
  category?: string;
  type: 'candidate' | 'ticket' | 'staff' | 'general';
  candidate?: {
    id: string;
    username: string;
    avatarUrl?: string;
    stage?: string;
    currentModule?: string;
    simulationScheduledTimestamp?: number;
  };
  lastMessage?: {
    id: string;
    content: string;
    author: string;
    createdAt: string;
    isBot: boolean;
  };
  unreadCount?: number;
}

class LiveChannelService {
  private eventSource: EventSource | null = null;
  private messageListeners = new Set<(msg: LiveMessage) => void>();
  private statusListeners = new Set<(connected: boolean) => void>();
  private isConnected = false;
  private reconnectTimer: any = null;

  public async getChannels(): Promise<LiveChannelItem[]> {
    try {
      const res = await fetch('/api/channels/live-list');
      const data = await res.json();
      if (data && data.success) {
        return data.channels || [];
      }
      return [];
    } catch (err) {
      console.error('[LiveChannelService] fetch channels error', err);
      return [];
    }
  }

  public async getChannelMessages(channelId: string, limit = 50): Promise<LiveMessage[]> {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages?limit=${limit}`);
      const data = await res.json();
      if (data && data.success) {
        return data.messages || [];
      }
      return [];
    } catch (err) {
      console.error('[LiveChannelService] fetch messages error', err);
      return [];
    }
  }

  public async sendMessage(
    channelId: string,
    content: string
  ): Promise<{ success: boolean; message?: LiveMessage; error?: string }> {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur réseau' };
    }
  }

  public initEventSource() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/discord/live-stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(':')) return;
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === 'message' && parsed.message) {
            this.notifyMessage(parsed.message);
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.initEventSource();
        }, 5000);
      };
    } catch (err) {
      console.warn('[LiveChannelService] SSE connection failed', err);
    }
  }

  public subscribe(
    onMessage: (msg: LiveMessage) => void,
    onStatusChange?: (connected: boolean) => void
  ): () => void {
    this.messageListeners.add(onMessage);
    if (onStatusChange) {
      this.statusListeners.add(onStatusChange);
      onStatusChange(this.isConnected);
    }

    if (!this.eventSource) {
      this.initEventSource();
    }

    return () => {
      this.messageListeners.delete(onMessage);
      if (onStatusChange) {
        this.statusListeners.delete(onStatusChange);
      }
    };
  }

  private notifyMessage(msg: LiveMessage) {
    for (const listener of this.messageListeners) {
      try {
        listener(msg);
      } catch (e) {
        console.error('[LiveChannelService] listener error', e);
      }
    }
  }

  private notifyStatus(connected: boolean) {
    for (const listener of this.statusListeners) {
      try {
        listener(connected);
      } catch (e) {
        console.error('[LiveChannelService] status listener error', e);
      }
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const liveChannelService = new LiveChannelService();
