import { DiscordRole } from '../types';

export const mockDiscordRoles: DiscordRole[] = [
  { id: 'role-trainee', name: 'Trainee', color: '#94a3b8', position: 1 },
  { id: 'role-junior', name: 'Junior', color: '#38bdf8', position: 2 },
  { id: 'role-senior', name: 'Senior', color: '#818cf8', position: 3 },
  { id: 'role-certified', name: 'Certified', color: '#34d399', position: 4 },
  { id: 'role-admin', name: 'Admin', color: '#f43f5e', position: 5, isManaged: true },
  { id: 'role-formateur', name: 'Formateur', color: '#fbbf24', position: 6 },
  { id: 'role-mod-1', name: 'Module 1 Validé', color: '#6366f1', position: 7 },
  { id: 'role-mod-2', name: 'Module 2 Validé', color: '#06b6d4', position: 8 },
];

export interface ModuleRoleMapping {
  moduleId: string;
  moduleTitle: string;
  roleId: string;
  roleName: string;
  nextRoleId?: string;
  nextRoleName?: string;
}

class RoleService {
  private roles: DiscordRole[] = [...mockDiscordRoles];
  private mappings: ModuleRoleMapping[] = [
    { moduleId: 'mod-1', moduleTitle: 'Module 1 — Onboarding & Culture', roleId: 'role-trainee', roleName: 'Trainee', nextRoleId: 'role-junior', nextRoleName: 'Junior' },
    { moduleId: 'mod-2', moduleTitle: 'Module 2 — Outils & Processus Internes', roleId: 'role-junior', roleName: 'Junior', nextRoleId: 'role-senior', nextRoleName: 'Senior' },
    { moduleId: 'mod-3', moduleTitle: 'Module 3 — Communication & Reporting', roleId: 'role-senior', roleName: 'Senior', nextRoleId: 'role-certified', nextRoleName: 'Certified' },
    { moduleId: 'mod-4', moduleTitle: 'Module 4 — Sécurité & Confidentialité', roleId: 'role-certified', roleName: 'Certified', nextRoleId: 'role-formateur', nextRoleName: 'Formateur' },
  ];

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
    return newRole;
  }
}

export const roleService = new RoleService();
