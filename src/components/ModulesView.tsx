import React from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Trash2,
  Lock,
  Layers,
} from 'lucide-react';
import { TrainingModule } from '../types';
import { moduleService } from '../services/moduleService';

interface ModulesViewProps {
  modules: TrainingModule[];
  onOpenBuilder: (module?: TrainingModule | null) => void;
  onNavigate?: (tab: string) => void;
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({
  modules,
  onOpenBuilder,
  onNavigate,
  onRefresh,
  onShowToast,
}) => {
  const handleDuplicate = (id: string) => {
    const dup = moduleService.duplicateModule(id);
    onRefresh();
    onShowToast(`Module dupliqué : ${dup.title}`, 'Une copie au statut Brouillon a été créée', 'success');
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le module "${title}" ?`)) {
      moduleService.deleteModule(id);
      onRefresh();
      onShowToast(`Module supprimé`, title, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Centralized Config Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">💡 Gestion Centralisée Disponibles !</span>
            <span className="text-indigo-200">
              Vous pouvez configurer les modules, leurs consignes, les rôles Discord et les quiz associés au même endroit dans <strong>Parcours Onboarding & Rôles Serveur</strong>.
            </span>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('automations')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <span>Éditer dans Parcours Onboarding →</span>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Modules de Formation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Créez et gérez le contenu pédagogique de vos cours (textes, vidéos, consignes). Tout le contenu est délivré automatiquement dans le <strong>salon privé du candidat</strong>.
          </p>
        </div>

        <button
          onClick={() => onOpenBuilder(null)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Créer un Module</span>
        </button>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const completion = mod.completionRate || 82;
          const blockCount = mod.blocks?.length || 3;

          return (
            <div
              key={mod.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                    Étape {mod.order}
                  </span>
                  {mod.isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Actif</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Brouillon</span>
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                {/* Meta details */}
                <div className="space-y-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Rôle Démarrage :</span>
                      <span className="font-semibold text-slate-300 truncate block">{mod.roleEnCoursName || 'En cours'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rôle Validé :</span>
                      <span className="font-semibold text-indigo-300 truncate block">{mod.roleValidatedName || 'Validé'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>Contenu Pédagogique :</span>
                    </span>
                    <span className="text-slate-200 font-semibold font-mono">{blockCount} bloc(s)</span>
                  </div>

                  <div className="pt-1.5 flex items-center gap-1 text-[10px] text-indigo-300">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    <span>Délivré dans : <strong>🔒-formation-[pseudo]</strong></span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Complétion globale</span>
                    <span className="text-indigo-400 font-bold">{completion}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${completion}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenBuilder(mod)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Éditer le Contenu</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(mod.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mod.id, mod.title)}
                    className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
