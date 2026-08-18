import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Trash2,
  Sparkles,
  Shield,
  Award,
  Send,
} from 'lucide-react';
import { TrainingModule } from '../types';
import { moduleService } from '../services/moduleService';
import { discordService } from '../services/discordService';

interface ModulesViewProps {
  modules: TrainingModule[];
  onOpenBuilder: (module?: TrainingModule | null) => void;
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const ModulesView: React.FC<ModulesViewProps> = ({
  modules,
  onOpenBuilder,
  onRefresh,
  onShowToast,
}) => {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleDuplicate = (id: string) => {
    const dup = moduleService.duplicateModule(id);
    onRefresh();
    onShowToast(`Module dupliqué : ${dup.title}`, 'Une copie au statut Draft a été créée', 'success');
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Voulez-vous vraiment supprimer le module "${title}" ?`)) {
      moduleService.deleteModule(id);
      onRefresh();
      onShowToast(`Module supprimé`, title, 'info');
    }
  };

  const handleSendEmbed = async (mod: TrainingModule) => {
    setSendingId(mod.id);
    const res = await discordService.sendModuleEmbed(mod);
    setSendingId(null);
    if (res.success) {
      moduleService.updateModule(mod.id, {
        isActive: true,
        publishStatus: 'published',
        discordMessageId: res.messageId,
        discordChannelId: res.channelId,
        discordGuildId: res.guildId,
        publishedAt: new Date().toISOString(),
      });
      onRefresh();
      onShowToast('Embed Publié sur Discord 🚀', res.message, 'success');
    } else {
      moduleService.updateModule(mod.id, {
        publishStatus: 'publish_failed',
      });
      onRefresh();
      onShowToast('Échec Publication Discord ❌', res.message, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Modules de Formation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Créez et gérez les modules d'apprentissage diffusés sur votre serveur Discord.
          </p>
        </div>

        <button
          onClick={() => onOpenBuilder(null)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Module</span>
        </button>
      </div>

      {/* Modules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const completion = mod.completionRate || 82;

          return (
            <div
              key={mod.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                    Module {mod.order}
                  </span>
                  {mod.isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Published</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Draft</span>
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
                      <span className="text-slate-500 block">Salon :</span>
                      <span className="font-semibold text-slate-300 font-mono truncate block">{mod.channelName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rôle Validé :</span>
                      <span className="font-semibold text-indigo-300 truncate block">{mod.roleValidatedName}</span>
                    </div>
                  </div>

                  {mod.discordMessageId && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">ID Message Discord:</span>
                      <span className="text-emerald-400 font-semibold">{mod.discordMessageId}</span>
                    </div>
                  )}

                  {mod.publishStatus === 'publish_failed' && (
                    <div className="pt-1 text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                      ⚠️ Échec de publication récente
                    </div>
                  )}
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
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenBuilder(mod)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Éditer</span>
                  </button>

                  <button
                    onClick={() => handleSendEmbed(mod)}
                    disabled={sendingId === mod.id}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                    title="Envoyer ou publier l'embed directement sur Discord"
                  >
                    <Send className={`w-3.5 h-3.5 ${sendingId === mod.id ? 'animate-bounce' : ''}`} />
                    <span>{sendingId === mod.id ? 'Envoi...' : 'Publier Embed'}</span>
                  </button>
                </div>

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
