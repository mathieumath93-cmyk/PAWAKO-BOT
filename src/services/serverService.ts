import { DiscordServer } from '../types';

export const mockServers: DiscordServer[] = [
  {
    id: '1538874226415501462',
    name: 'Mon Serveur Discord 🛡️',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    memberCount: 1,
    isBotPresent: true,
    channelsCount: 6,
    rolesCount: 5,
    activeModulesCount: 5,
  },
];

class ServerService {
  private servers: DiscordServer[] = [...mockServers];
  private activeServerId: string = '1538874226415501462';

  public updateServerDetails(serverData: Partial<DiscordServer>) {
    const s = this.getActiveServer();
    if (s && serverData) {
      Object.assign(s, serverData);
    }
  }

  public getServers(): DiscordServer[] {
    return this.servers;
  }

  public getActiveServer(): DiscordServer {
    return this.servers.find((s) => s.id === this.activeServerId) || this.servers[0];
  }

  public setActiveServer(id: string): DiscordServer {
    const s = this.servers.find((srv) => srv.id === id);
    if (s) {
      this.activeServerId = s.id;
      return s;
    }
    return this.servers[0];
  }

  public addServer(name: string): DiscordServer {
    const newServer: DiscordServer = {
      id: `server-${Date.now()}`,
      name,
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      memberCount: 1,
      isBotPresent: true,
      channelsCount: 5,
      rolesCount: 3,
      activeModulesCount: 0,
    };
    this.servers.push(newServer);
    this.activeServerId = newServer.id;
    return newServer;
  }
}

export const serverService = new ServerService();
