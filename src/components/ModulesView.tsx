import React, { useState } from 'react';
import {
  BookOpen,
  Edit2,
  ExternalLink,
  FileText,
  Hash,
  Link,
  Plus,
  Shield,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { Quiz, TrainingModule } from '../types';

interface ModulesViewProps {
  modules: TrainingModule[];
  quizzes: Quiz[];
  onCreateModule: (mod: Omit<TrainingModule, 'id'>) => void;
  onUpdateModule: (id: string, mod: Partial<TrainingModule>) => void;
  onDeleteModule: (id: string) => void;
  onOpenSensitiveModal: (
    title: string,
    description: string,
    actionLabel: string,
    onConfirm: () => void
  ) => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({
  modules,
  quizzes,
  onCreateModule,
  onUpdateModule,
  onDeleteModule,
  onOpenSensitiveModal,
}) => {
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Omit<TrainingModule, 'id'>>({
    order: modules.length + 1,
    title: '',
    description: '',
    content: '',
    channelId: `chan-mod-${Date.now()}`,
    channelName: `#module-${modules.length + 1}`,
    roleValidatedId: `role-mod-${Date.now()}-valide`,
    roleValidatedName: `Module ${modules.length + 1} Validé`,
    roleEnCoursId: `role-mod-${Date.now()}-encours`,
    roleEnCoursName: `Module ${modules.length + 1} En cours`,
    quizId: quizzes[0]?.id || '',
    isActive: true,
    resources: [],
    buttons: [{ id: 'btn-1', label: "✅ J'ai terminé le module", action: 'complete' }],
  });

  const handleOpenCreate = () => {
    setFormData({
      order: modules.length + 1,
      title: `Module ${modules.length + 1} : Titre du module`,
      description: 'Description du contenu et des objectifs pédagogiques.',
      content: '## Contenu du module\n\nRédigez votre guide de formation ici...',
      channelId: `chan-mod-${Date.now()}`,
      channelName: `#module-${modules.length + 1}`,
      roleValidatedId: `role-mod-${Date.now()}-valide`,
      roleValidatedName: `Module ${modules.length + 1} Validé`,
      roleEnCoursId: `role-mod-${Date.now()}-encours`,
      roleEnCoursName: `Module ${modules.length + 1} En cours`,
      quizId: quizzes[0]?.id || '',
      isActive: true,
      resources: [],
      buttons: [{ id: 'btn-1', label: "✅ J'ai terminé le module", action: 'complete' }],
    });
    setIsCreating(true);
  };

  const handleOpenEdit = (mod: TrainingModule) => {
    setEditingModule(mod);
    setFormData({
      order: mod.order,
      title: mod.title,
      description: mod.description,
      content: mod.content,
      channelId: mod.channelId,
      channelName: mod.channelName,
      roleValidatedId: mod.roleValidatedId,
      roleValidatedName: mod.roleValidatedName,
      roleEnCoursId: mod.roleEnCoursId,
      roleEnCoursName: mod.roleEnCoursName,
      quizId: mod.quizId,
      isActive: mod.isActive,
      resources: mod.resources,
      buttons: mod.buttons,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      onCreateModule(formData);
      setIsCreating(false);
    } else if (editingModule) {
      onUpdateModule(editingModule.id, formData);
      setEditingModule(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Gestion des Modules de Formation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurez le contenu, les salons Discord (#module-X), les rôles associés et les quiz de validation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Module</span>
        </button>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl relative"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold font-mono">
                  # {mod.order}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-indigo-400 font-mono border border-slate-800 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-500" />
                  <span>{mod.channelName}</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">{mod.title}</h3>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {mod.description}
              </p>

              {/* Roles Badge Info */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-500">Rôle Validé :</span>
                  <span className="font-semibold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {mod.roleValidatedName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-slate-500">Rôle En cours :</span>
                  <span className="font-semibold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {mod.roleEnCoursName}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Quiz : {quizzes.find((q) => q.id === mod.quizId)?.title || 'Non défini'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(mod)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onOpenSensitiveModal(
                      'Suppression du module de formation',
                      `Êtes-vous sûr de vouloir supprimer "${mod.title}" ?`,
                      'Supprimer le module',
                      () => onDeleteModule(mod.id)
                    )
                  }
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {(isCreating || editingModule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingModule(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {isCreating ? 'Créer un nouveau module' : `Modifier : ${editingModule?.title}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 font-medium">Titre du Module</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Description courte</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Salon Discord</label>
                  <input
                    type="text"
                    value={formData.channelName}
                    onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="#module-1"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Rôle "Validé"</label>
                  <input
                    type="text"
                    value={formData.roleValidatedName}
                    onChange={(e) => setFormData({ ...formData, roleValidatedName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="Module 1 Validé"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Rôle "En cours"</label>
                  <input
                    type="text"
                    value={formData.roleEnCoursName}
                    onChange={(e) => setFormData({ ...formData, roleEnCoursName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="Module 1 En cours"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Quiz de validation associé</label>
                <select
                  value={formData.quizId}
                  onChange={(e) => setFormData({ ...formData, quizId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Aucun quiz</option>
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} (Score min : {q.minScore}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Contenu pédagogique (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingModule(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {isCreating ? 'Enregistrer le Module' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
