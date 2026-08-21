import { DiscordRole } from '../types';

export interface ModuleRoleMapping {
  moduleId: string;
  moduleTitle: string;
  roleId: string;
  roleName: string;
  nextRoleId?: string;
  nextRoleName?: string;
}

class RoleService {
  private roles: DiscordRole[] = this.loadRoles();
  private mappings: ModuleRoleMapping[] = [];

  private loadRoles(): DiscordRole[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('pawako_discord_roles');
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      // Ignore
    }
    return [];
  }

  public setRoles(newRoles: DiscordRole[]) {
    this.roles = newRoles || [];
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('pawako_discord_roles', JSON.stringify(this.roles));
      }
    } catch {
      // Ignore
    }
  }

  public getRoles(): DiscordRole[] {
    return this.roles;
  }

  public getMappings(): ModuleRoleMapping[] {
    return this.mappings;
  }

  public updateMapping(moduleId: string, roleId: string): ModuleRoleMapping {
    const role = this.roles.find((r) => r.id === roleId);
    const mapIndex = this.mappings.findIndex((m) => m.moduleId === moduleId);

    if (mapIndex !== -1 && role) {
      this.mappings[mapIndex].roleId = role.id;
      this.mappings[mapIndex].roleName = role.name;
      return this.mappings[mapIndex];
    }
    throw new Error('Mapping ou Rôle introuvable');
  }

  public addRole(name: string, color: string): DiscordRole {
    const newRole: DiscordRole = {
      id: `role-${Date.now()}`,
      name,
      color: color || '#6366f1',
      position: this.roles.length + 1,
    };
    this.roles.push(newRole);
    try {
      localStorage.setItem('pawako_discord_roles', JSON.stringify(this.roles));
    } catch {
      // Ignore
    }
    return newRole;
  }
}

export const roleService = new RoleService();
