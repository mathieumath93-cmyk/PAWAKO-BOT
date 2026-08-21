import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Edit2,
  HelpCircle,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { Quiz, QuizQuestion, TrainingModule } from '../types';

interface QuizViewProps {
  quizzes: Quiz[];
  modules: TrainingModule[];
  onCreateQuiz: (quiz: Omit<Quiz, 'id'>) => void;
  onUpdateQuiz: (id: string, quiz: Partial<Quiz>) => void;
  onDeleteQuiz: (id: string) => void;
  onOpenSensitiveModal: (
    title: string,
    description: string,
    actionLabel: string,
    onConfirm: () => void
  ) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizzes,
  modules,
  onCreateQuiz,
  onUpdateQuiz,
  onDeleteQuiz,
  onOpenSensitiveModal,
}) => {
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Omit<Quiz, 'id'>>({
    moduleId: modules[0]?.id || '',
    title: '',
    description: '',
    minScore: 80,
    maxAttempts: 3,
    questions: [
      {
        id: 'q-1',
        text: 'Question de démonstration ?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Explication de la réponse...',
      },
    ],
    successMessage: 'Bravo ! Tu as validé ce module avec succès !',
    failureMessage: 'Score insuffisant. Relis le module avant de retenter.',
  });

  const handleOpenCreate = () => {
    setFormData({
      moduleId: modules[0]?.id || '',
      title: 'Quiz : Titre du Quiz',
      description: 'Évaluation des connaissances acquises.',
      minScore: 80,
      maxAttempts: 3,
      questions: [
        {
          id: `q-${Date.now()}`,
          text: 'Quelle est la bonne réponse ?',
          options: ['Choix A', 'Choix B', 'Choix C', 'Choix D'],
          correctAnswer: 0,
          explanation: '',
        },
      ],
      successMessage: 'Bravo ! Tu as réussi ce quiz.',
      failureMessage: 'Quiz non validé. Révise les cours.',
    });
    setIsCreating(true);
  };

  const handleOpenEdit = (q: Quiz) => {
    setEditingQuiz(q);
    setFormData({
      moduleId: q.moduleId,
      title: q.title,
      description: q.description,
      minScore: q.minScore,
      maxAttempts: q.maxAttempts,
      questions: q.questions,
      successMessage: q.successMessage,
      failureMessage: q.failureMessage,
    });
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: 'Nouvelle question ?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
    };
    setFormData({ ...formData, questions: [...formData.questions, newQ] });
  };

  const handleRemoveQuestion = (qId: string) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((q) => q.id !== qId),
    });
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...formData.questions];
    const opts = [...updated[qIndex].options];
    opts[optIndex] = text;
    updated[qIndex].options = opts;
    setFormData({ ...formData, questions: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      onCreateQuiz(formData);
      setIsCreating(false);
    } else if (editingQuiz) {
      onUpdateQuiz(editingQuiz.id, formData);
      setEditingQuiz(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Gestion des Quiz & Tentatives</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Définissez le score minimum (%), le nombre maximal de tentatives et le contenu des questions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Quiz</span>
        </button>
      </div>

      {/* Quiz Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => {
          const linkedMod = modules.find((m) => m.id === quiz.moduleId);

          return (
            <div
              key={quiz.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                    Score min : {quiz.minScore}%
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                    Max : {quiz.maxAttempts} essais
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{quiz.title}</h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div>
                    Module : <span className="text-indigo-400 font-semibold">{linkedMod?.title || 'Non attribué'}</span>
                  </div>
                  <div>Questions totales : <span className="text-white font-mono">{quiz.questions.length}</span></div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(quiz)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Éditer Questions ({quiz.questions.length})</span>
                </button>

                <button
                  onClick={() =>
                    onOpenSensitiveModal(
                      'Suppression de quiz',
                      `Êtes-vous certain de vouloir supprimer "${quiz.title}" ?`,
                      'Supprimer le quiz',
                      () => onDeleteQuiz(quiz.id)
                    )
                  }
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {(isCreating || editingQuiz) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingQuiz(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {isCreating ? 'Créer un nouveau quiz' : `Modifier : ${editingQuiz?.title}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-400 font-medium">Titre du Quiz</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Module de rattachement</label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title.split(':')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Score minimum de réussite (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={formData.minScore}
                    onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) || 80 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Nombre de tentatives autorisées</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 3 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Questions ({formData.questions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter Question</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.questions.map((q, qIndex) => (
                    <div
                      key={q.id || qIndex}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-indigo-400">Q{qIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Intitulé de la question..."
                        value={q.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-medium"
                        required
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                              q.correctAnswer === optIndex
                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctAnswer === optIndex}
                              onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)}
                              className="accent-emerald-500"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className="w-full bg-transparent text-xs text-white focus:outline-none"
                              placeholder={`Choix ${optIndex + 1}`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingQuiz(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {isCreating ? 'Enregistrer le Quiz' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
