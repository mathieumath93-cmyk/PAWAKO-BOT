import { DiscordServer } from '../types';

export const mockServers: DiscordServer[] = [
  {
    id: '1491375804154904578',
    name: 'Pawako Formation 🛡️',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    memberCount: 1248,
    isBotPresent: true,
    channelsCount: 14,
    rolesCount: 8,
    activeModulesCount: 5,
  },
  {
    id: 'server-formation-test',
    name: 'Formation Test 🧪',
    iconUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80',
    memberCount: 42,
    isBotPresent: true,
    channelsCount: 6,
    rolesCount: 4,
    activeModulesCount: 2,
  },
  {
    id: 'server-demo',
    name: 'Serveur Démo 🚀',
    iconUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80',
    memberCount: 215,
    isBotPresent: true,
    channelsCount: 8,
    rolesCount: 5,
    activeModulesCount: 3,
  },
];

class ServerService {
  private servers: DiscordServer[] = [...mockServers];
  private activeServerId: string = '1491375804154904578';

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
