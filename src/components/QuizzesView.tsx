import React from 'react';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Quiz, TrainingModule } from '../types';
import { quizService } from '../services/quizService';

interface QuizzesViewProps {
  quizzes: Quiz[];
  modules: TrainingModule[];
  onOpenBuilder: (quiz?: Quiz | null) => void;
  onNavigate?: (tab: string) => void;
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  quizzes,
  modules,
  onOpenBuilder,
  onNavigate,
  onRefresh,
  onShowToast,
}) => {
  const handleDelete = (id: string, title: string) => {
    if (confirm(`Voulez-vous supprimer le quiz "${title}" ?`)) {
      quizService.deleteQuiz(id);
      onRefresh();
      onShowToast('Quiz supprimé', title, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Centralized Config Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">💡 Gestion Centralisée des Quiz !</span>
            <span className="text-amber-200">
              Tous les quiz et leurs questions de test peuvent être configurés et modifiés directement au même endroit dans <strong>Parcours Onboarding & Rôles Serveur</strong>.
            </span>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('automations')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            <span>Gérer dans Parcours Onboarding →</span>
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Gestion des Quizzes & Évaluations Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Créez et gérez les questionnaires à choix multiples pour évaluer l'avancement des candidats directement dans leur salon privé.
          </p>
        </div>

        <button
          onClick={() => onOpenBuilder(null)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Créer un Quiz</span>
        </button>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quizzes.map((quiz) => {
          const moduleObj = modules.find((m) => m.id === quiz.moduleId);

          return (
            <div
              key={quiz.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono truncate max-w-[170px]">
                    {moduleObj?.title || 'Quiz Général'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Actif</span>
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-500 block">Questions :</span>
                    <span className="font-bold text-white">{quiz.questions.length} total ({quiz.sampleSize || 20} tirées)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Score Min :</span>
                    <span className="font-bold text-emerald-400">{quiz.minScore || 16} / 20</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cooldown Échec :</span>
                    <span className="font-bold text-amber-400">⏳ {quiz.cooldownMinutes || 30} min</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attente Pré-Quiz :</span>
                    <span className="font-bold text-indigo-300">⏱️ {quiz.delayMinutesBeforeQuiz || 10} min</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenBuilder(quiz)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Éditer le Quiz</span>
                </button>

                <button
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
                  title="Supprimer ce quiz"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
