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
  Lock,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import { Quiz, TrainingModule } from '../types';
import { quizService } from '../services/quizService';
import { discordService } from '../services/discordService';
import { store } from '../services/store';

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
  const [selectedQuizForThread, setSelectedQuizForThread] = useState<Quiz | null>(null);
  const [testMemberName, setTestMemberName] = useState('Mathieu');
  const [testScore, setTestScore] = useState(18);
  const [isSendingThread, setIsSendingThread] = useState(false);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Voulez-vous supprimer le quiz "${title}" ?`)) {
      quizService.deleteQuiz(id);
      onRefresh();
      onShowToast('Quiz supprimé', title, 'info');
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizForThread) return;

    setIsSendingThread(true);
    const passed = testScore >= selectedQuizForThread.minScore;
    const targetChannel = selectedQuizForThread.resultsChannelName || '#results';

    const res = await discordService.createPrivateQuizThread({
      channelName: targetChannel,
      quizTitle: selectedQuizForThread.title,
      memberName: testMemberName,
      score: testScore,
      maxScore: selectedQuizForThread.maxScore || 20,
      passed,
      attemptNumber: 1,
      details: passed
        ? 'Validation réussie via le système de formation.'
        : 'Score en-dessous du seuil minimum. Nouvelle tentative conseillée.',
    });

    setIsSendingThread(false);
    setSelectedQuizForThread(null);

    if (res.success) {
      onShowToast('Fil Privé Créé 🔒', res.message, 'success');
    } else {
      onShowToast('Information Fil Privé', res.message, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Gestion des Quizzes & Fils Privés Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Créez des évaluations et gérez la génération automatique de <strong>fils privés individuels</strong> sur vos salons Discord.
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
          const channelName = quiz.resultsChannelName || '#results';

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
                    <span className="text-slate-500 block">Salon Fil Privé :</span>
                    <span className="font-bold text-indigo-400 truncate block">{channelName}</span>
                  </div>
                </div>

                {/* Private Thread Badge Preview */}
                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Fil privé pseudo-identifiable</span>
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                    Activé
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenBuilder(quiz)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Éditer</span>
                  </button>

                  <button
                    onClick={() => setSelectedQuizForThread(quiz)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                    title="Tester la génération d'un fil privé Discord pour un membre"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Créer Fil Privé</span>
                  </button>
                </div>

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

      {/* Test Private Thread Modal */}
      {selectedQuizForThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Générer un Fil Privé pour ce Quiz</span>
              </h3>
              <button
                onClick={() => setSelectedQuizForThread(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThreadSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quiz Sélectionné
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-300">
                  {selectedQuizForThread.title}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Salon Discord
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                  {selectedQuizForThread.resultsChannelName || '#results'}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Pseudo ou Nom du Membre
                </label>
                <input
                  type="text"
                  required
                  value={testMemberName}
                  onChange={(e) => setTestMemberName(e.target.value)}
                  placeholder="Ex: Mathieu, Alex, Paul..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Score Obtenu (/20)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={testScore}
                  onChange={(e) => setTestScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
                <span className="font-bold block text-white">Nom du fil privé qui sera généré :</span>
                <span className="font-mono text-indigo-300 block">
                  🔒 quiz-{selectedQuizForThread.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-{testMemberName.replace(/[^a-zA-Z0-9]/g, '') || 'membre'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuizForThread(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSendingThread}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingThread ? 'animate-bounce' : ''}`} />
                  <span>{isSendingThread ? 'Création...' : 'Créer le Fil Privé sur Discord'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
