import { TrainingModule } from '../types';
import { store } from './store';
import { firebaseSyncService } from './firebaseSyncService';

class ModuleService {
  public getModules(): TrainingModule[] {
    return store.getModules();
  }

  public getModuleById(id: string): TrainingModule | undefined {
    return store.getModule(id);
  }

  public addModule(data: Omit<TrainingModule, 'id' | 'order'>): TrainingModule {
    const modules = store.getModules();
    const newModule: TrainingModule = {
      ...data,
      id: `mod-${Date.now()}`,
      order: modules.length + 1,
      completionRate: 0,
      blocks: (data as any).blocks || [
        {
          id: `blk-${Date.now()}-1`,
          type: 'heading',
          title: data.title,
          content: data.title,
        },
        {
          id: `blk-${Date.now()}-2`,
          type: 'text',
          content: data.description || 'Contenu du module de formation...',
        },
      ],
    } as TrainingModule;

    firebaseSyncService.saveModule(newModule).catch((err) =>
      console.error('[ModuleService] Firebase saveModule failed:', err)
    );
    return newModule;
  }

  public updateModule(id: string, updates: Partial<TrainingModule>): TrainingModule {
    const existing = store.getModule(id);
    if (!existing) throw new Error('Module non trouvé');
    const updated: TrainingModule = { ...existing, ...updates, id };
    firebaseSyncService.saveModule(updated).catch((err) =>
      console.error('[ModuleService] Firebase saveModule failed:', err)
    );
    return updated;
  }

  public deleteModule(id: string): void {
    firebaseSyncService.deleteModule(id).catch((err) =>
      console.error('[ModuleService] Firebase deleteModule failed:', err)
    );
  }

  public duplicateModule(id: string): TrainingModule {
    const original = store.getModule(id);
    if (!original) throw new Error('Module introuvable');
    return this.addModule({
      ...original,
      title: `${original.title} (Copie)`,
      isActive: false,
    });
  }
}

export const moduleService = new ModuleService();
