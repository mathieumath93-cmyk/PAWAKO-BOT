import { DiscordRole, TrainingModule } from '../types';
import { store } from './store';
import { firebaseSyncService } from './firebaseSyncService';

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

  /**
   * Single Source of Truth: Mappings are derived directly from TrainingModules in the store
   */
  public getMappings(): ModuleRoleMapping[] {
    const modules = store.getModules();
    return modules.map((m) => {
      const roleEnCours = this.roles.find((r) => r.id === m.roleEnCoursId || r.name === m.roleEnCoursName);
      const roleValidated = this.roles.find((r) => r.id === m.roleValidatedId || r.name === m.roleValidatedName);

      return {
        moduleId: m.id,
        moduleTitle: m.title,
        roleId: m.roleEnCoursId || roleEnCours?.id || '',
        roleName: m.roleEnCoursName || roleEnCours?.name || 'Non configuré',
        nextRoleId: m.roleValidatedId || roleValidated?.id || '',
        nextRoleName: m.roleValidatedName || roleValidated?.name || 'Non configuré',
      };
    });
  }

  /**
   * Update role mappings by modifying the TrainingModule directly in store & Firestore
   */
  public updateMapping(moduleId: string, roleEnCoursId: string, roleValidatedId?: string): ModuleRoleMapping {
    const module = store.getModule(moduleId);
    if (!module) throw new Error('Module introuvable');

    const roleEnCours = this.roles.find((r) => r.id === roleEnCoursId);
    const roleValidated = roleValidatedId ? this.roles.find((r) => r.id === roleValidatedId) : undefined;

    const updatedModule: TrainingModule = {
      ...module,
      roleEnCoursId: roleEnCoursId || module.roleEnCoursId,
      roleEnCoursName: roleEnCours ? roleEnCours.name : (roleEnCoursId === '' ? 'Non configuré' : module.roleEnCoursName),
    };

    if (roleValidatedId !== undefined) {
      updatedModule.roleValidatedId = roleValidatedId;
      updatedModule.roleValidatedName = roleValidated ? roleValidated.name : (roleValidatedId === '' ? 'Non configuré' : module.roleValidatedName);
    }

    // Save update to store and sync to Firestore
    store.updateModule(moduleId, updatedModule);
    firebaseSyncService.saveModule(updatedModule).catch((err) =>
      console.error('[RoleService] Error persisting updated module roles to Firebase:', err)
    );

    return {
      moduleId: updatedModule.id,
      moduleTitle: updatedModule.title,
      roleId: updatedModule.roleEnCoursId || '',
      roleName: updatedModule.roleEnCoursName || 'Non configuré',
      nextRoleId: updatedModule.roleValidatedId || '',
      nextRoleName: updatedModule.roleValidatedName || 'Non configuré',
    };
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

