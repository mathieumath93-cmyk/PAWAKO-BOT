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
  private mappings: ModuleRoleMapping[] = [
    { moduleId: 'mod-1', moduleTitle: 'Module 1 — Onboarding & Culture', roleId: 'role-trainee', roleName: 'Trainee', nextRoleId: 'role-junior', nextRoleName: 'Junior' },
    { moduleId: 'mod-2', moduleTitle: 'Module 2 — Outils & Processus Internes', roleId: 'role-junior', roleName: 'Junior', nextRoleId: 'role-senior', nextRoleName: 'Senior' },
    { moduleId: 'mod-3', moduleTitle: 'Module 3 — Communication & Reporting', roleId: 'role-senior', roleName: 'Senior', nextRoleId: 'role-certified', nextRoleName: 'Certified' },
    { moduleId: 'mod-4', moduleTitle: 'Module 4 — Sécurité & Confidentialité', roleId: 'role-certified', roleName: 'Certified', nextRoleId: 'role-formateur', nextRoleName: 'Formateur' },
  ];

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
