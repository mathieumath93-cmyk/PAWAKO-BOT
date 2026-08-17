import { TrainingModule } from '../types';
import { store } from './store';

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
      blocks: data.blocks || [
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
    };
    return store.addModule(newModule);
  }

  public updateModule(id: string, updates: Partial<TrainingModule>): TrainingModule {
    return store.updateModule(id, updates);
  }

  public deleteModule(id: string): void {
    store.deleteModule(id);
  }

  public duplicateModule(id: string): TrainingModule {
    const original = store.getModule(id);
    if (!original) throw new Error('Module introuvable');

    const copyData: Omit<TrainingModule, 'id' | 'order'> = {
      ...original,
      title: `${original.title} (Copie)`,
      isActive: false,
    };
    return this.addModule(copyData);
  }
}

export const moduleService = new ModuleService();
