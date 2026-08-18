import { DiscordServer } from '../types';

class ServerService {
  private servers: DiscordServer[] = [];
  private activeServerId: string | null = null;

  public setServers(list: DiscordServer[]) {
    this.servers = list || [];
    if (this.servers.length > 0) {
      if (!this.activeServerId || !this.servers.some((s) => s.id === this.activeServerId)) {
        this.activeServerId = this.servers[0].id;
      }
    } else {
      this.activeServerId = null;
    }
  }

  public updateServerDetails(serverData: Partial<DiscordServer> & { id?: string }) {
    if (!serverData) return;

    let target = this.servers.find((s) => s.id === serverData.id);
    if (!target && this.activeServerId) {
      target = this.servers.find((s) => s.id === this.activeServerId);
    }

    if (target) {
      Object.assign(target, serverData);
      if (serverData.id) target.id = serverData.id;
    } else if (serverData.id && serverData.name) {
      const newServer: DiscordServer = {
        id: serverData.id,
        name: serverData.name,
        iconUrl: serverData.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        memberCount: serverData.memberCount || 0,
        isBotPresent: serverData.isBotPresent ?? true,
        channelsCount: serverData.channelsCount || 0,
        rolesCount: serverData.rolesCount || 0,
        activeModulesCount: serverData.activeModulesCount || 0,
      };
      this.servers = [newServer];
      this.activeServerId = newServer.id;
    }
  }

  public getServers(): DiscordServer[] {
    return this.servers;
  }

  public getActiveServer(): DiscordServer | null {
    if (this.servers.length === 0) return null;
    return this.servers.find((s) => s.id === this.activeServerId) || this.servers[0] || null;
  }

  public setActiveServer(id: string): DiscordServer | null {
    const s = this.servers.find((srv) => srv.id === id);
    if (s) {
      this.activeServerId = s.id;
      return s;
    }
    return null;
  }

  public addServer(name: string): DiscordServer {
    const newServer: DiscordServer = {
      id: `server-${Date.now()}`,
      name,
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      memberCount: 0,
      isBotPresent: true,
      channelsCount: 0,
      rolesCount: 0,
      activeModulesCount: 0,
    };
    this.servers.push(newServer);
    this.activeServerId = newServer.id;
    return newServer;
  }
}

export const serverService = new ServerService();

