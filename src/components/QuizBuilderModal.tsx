import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Sparkles,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Quiz, QuizQuestion, QuestionType, TrainingModule } from '../types';

interface QuizBuilderModalProps {
  isOpen: boolean;
  quizToEdit?: Quiz | null;
  modules: TrainingModule[];
  onClose: () => void;
  onSave: (quizData: Partial<Quiz>) => void;
}

export const QuizBuilderModal: React.FC<QuizBuilderModalProps> = ({
  isOpen,
  quizToEdit,
  modules,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(quizToEdit?.title || 'Quiz Onboarding');
  const [description, setDescription] = useState(quizToEdit?.description || 'Évaluez vos connaissances...');
  const [moduleId, setModuleId] = useState(quizToEdit?.moduleId || modules[0]?.id || 'mod-1');
  const [minScore, setMinScore] = useState(quizToEdit?.minScore || 16);
  const [maxScore, setMaxScore] = useState(quizToEdit?.maxScore || 20);
  const [maxAttempts, setMaxAttempts] = useState(quizToEdit?.maxAttempts || 3);
  const [sampleSize, setSampleSize] = useState(quizToEdit?.sampleSize || 20);
  const [cooldownMinutes, setCooldownMinutes] = useState(quizToEdit?.cooldownMinutes || 30);
  const [delayMinutesBeforeQuiz, setDelayMinutesBeforeQuiz] = useState(quizToEdit?.delayMinutesBeforeQuiz || 10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(quizToEdit?.timeLimitMinutes || 15);
  const [successMessage, setSuccessMessage] = useState(quizToEdit?.successMessage || 'Félicitations ! Vous avez validé le quiz.');
  const [failureMessage, setFailureMessage] = useState(quizToEdit?.failureMessage || 'Score insuffisant. Relisez le cours avant de recommencer.');

  const defaultQuestions: QuizQuestion[] = quizToEdit?.questions || [
    {
      id: 'q-1',
      text: 'Quelle est la première étape obligatoire pour débuter la formation ?',
      type: 'single_choice',
      options: ['Consulter le règlement', 'Lancer la première leçon', 'Envoyer un message', 'Fermer le serveur'],
      correctAnswer: 0,
      points: 1,
      explanation: 'Consulter le règlement dans #formation garantit la bonne compréhension du programme.',
    },
    {
      id: 'q-2',
      text: 'Combien de tentatives sont accordées par défaut pour chaque quiz ?',
      type: 'single_choice',
      options: ['1 seule', '3 tentatives', 'Illimité', '5 tentatives'],
      correctAnswer: 1,
      points: 1,
      explanation: '3 tentatives sont accordées par défaut.',
    },
  ];

  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuestions);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: 'Nouvelle Question ?',
      type: 'single_choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      points: 1,
      explanation: 'Explication pour la bonne réponse...',
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIdx(questions.length);
  };

  const handleDeleteQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (activeQuestionIdx >= updated.length) {
      setActiveQuestionIdx(Math.max(0, updated.length - 1));
    }
  };

  const currentQ = questions[activeQuestionIdx];

  const handleUpdateCurrentQuestion = (updates: Partial<QuizQuestion>) => {
    if (!currentQ) return;
    setQuestions(questions.map((q, i) => (i === activeQuestionIdx ? { ...q, ...updates } : q)));
  };

  const handleUpdateOption = (optionIdx: number, val: string) => {
    if (!currentQ) return;
    const newOpts = [...currentQ.options];
    newOpts[optionIdx] = val;
    handleUpdateCurrentQuestion({ options: newOpts });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      moduleId,
      minScore: Number(minScore),
      maxScore: Number(maxScore),
      maxAttempts: Number(maxAttempts),
      sampleSize: Number(sampleSize) || 20,
      cooldownMinutes: Number(cooldownMinutes) || 30,
      delayMinutesBeforeQuiz: Number(delayMinutesBeforeQuiz) || 10,
      timeLimitMinutes: Number(timeLimitMinutes),
      questions,
      successMessage,
      failureMessage,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>{quizToEdit ? 'Éditeur de Quiz' : 'Créer un Nouveau Quiz'}</span>
            </h2>
            <p className="text-xs text-slate-400">Configurez les questions, barèmes, limites et messages de validation.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Settings & Question List (4 cols) */}
          <div className="lg:col-span-4 border-r border-slate-800 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-slate-950/40">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Titre du Quiz</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Module Associé</label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Score Min (/20)</label>
                <input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Qst. Présentées</label>
                <input
                  type="number"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Number(e.target.value))}
                  placeholder="20"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cooldown (Minutes)</label>
                <input
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                  placeholder="30"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Attente Pré-Quiz (Min)</label>
                <input
                  type="number"
                  value={delayMinutesBeforeQuiz}
                  onChange={(e) => setDelayMinutesBeforeQuiz(Number(e.target.value))}
                  placeholder="10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Question Index Sidebar List */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Questions ({questions.length})</span>
                <button
                  onClick={handleAddQuestion}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      activeQuestionIdx === idx
                        ? 'bg-indigo-950/40 border-indigo-500/80 text-white font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate">
                      Q{idx + 1}. {q.text}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Active Question Editor (8 cols) */}
          <div className="lg:col-span-8 p-6 overflow-y-auto custom-scrollbar bg-slate-900/60 space-y-4">
            {currentQ ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Question #{activeQuestionIdx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Points :</span>
                    <input
                      type="number"
                      value={currentQ.points || 1}
                      onChange={(e) => handleUpdateCurrentQuestion({ points: Number(e.target.value) })}
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Intitulé de la question</label>
                  <input
                    type="text"
                    value={currentQ.text}
                    onChange={(e) => handleUpdateCurrentQuestion({ text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Answers Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Propositions de réponses</label>
                  {currentQ.options.map((opt, optIdx) => {
                    const isCorrect = currentQ.correctAnswer === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isCorrect ? 'bg-emerald-950/30 border-emerald-500/60' : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-correct-${currentQ.id}`}
                          checked={isCorrect}
                          onChange={() => handleUpdateCurrentQuestion({ correctAnswer: optIdx })}
                          className="text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                          className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                        />
                        {isCorrect && <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Bonne réponse</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">Explication (affichée après réponse)</label>
                  <textarea
                    rows={2}
                    value={currentQ.explanation || ''}
                    onChange={(e) => handleUpdateCurrentQuestion({ explanation: e.target.value })}
                    placeholder="Pourquoi cette réponse est-elle correcte ?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">Aucune question sélectionnée</div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">
            Annuler
          </button>
          <button
            onClick={handleSaveSubmit}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
