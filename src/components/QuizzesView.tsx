import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Award,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Quiz, TrainingModule } from '../types';
import { quizService } from '../services/quizService';

interface QuizzesViewProps {
  quizzes: Quiz[];
  modules: TrainingModule[];
  onOpenBuilder: (quiz?: Quiz | null) => void;
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  quizzes,
  modules,
  onOpenBuilder,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Gestion des Quizzes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Créez des évaluations interactives pour valider les acquis de vos membres Discord.
          </p>
        </div>

        <button
          onClick={() => onOpenBuilder(null)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Quiz</span>
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
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                    {moduleObj?.title || 'Quiz Général'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
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
                    <span className="font-bold text-white">{quiz.questions.length} questions</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Score Min :</span>
                    <span className="font-bold text-emerald-400">{quiz.minScore} / 20</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tentatives :</span>
                    <span className="font-bold text-indigo-300">{quiz.maxAttempts} max</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Taux Succès :</span>
                    <span className="font-bold text-amber-400">82%</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onOpenBuilder(quiz)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
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
