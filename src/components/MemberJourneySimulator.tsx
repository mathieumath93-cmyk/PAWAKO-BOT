import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  UserCheck,
  Shield,
  HelpCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  Play,
  X,
  Send,
  EyeOff,
  Shuffle,
} from 'lucide-react';
import { Quiz, QuizQuestion, TrainingModule } from '../types';
import { onboardingService } from '../services/onboardingService';
import { discordService } from '../services/discordService';

interface MemberJourneySimulatorProps {
  quizzes: Quiz[];
  modules: TrainingModule[];
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const MemberJourneySimulator: React.FC<MemberJourneySimulatorProps> = ({
  quizzes,
  modules,
  isOpen,
  onClose,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const config = onboardingService.getConfig();

  // Simulation State
  const [memberName, setMemberName] = useState('Alex');
  const [step, setStep] = useState<
    'welcome_channel' | 'personal_channel_created' | 'module1_active' | 'quiz_in_progress' | 'quiz_result' | 'module2_active'
  >('welcome_channel');

  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Quiz Execution State
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizPassed, setQuizPassed] = useState<boolean>(false);

  // Cooldown State
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [showProfile, setShowProfile] = useState<boolean>(false);

  // Handle Cooldown Timer Ticking
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Step 1 -> Step 2: Clic sur "Commencer la formation"
  const handleStartOnboarding = async () => {
    addLog(`Membre "${memberName}" a cliqué sur "${config.welcomeButtonLabel}" dans ${config.welcomeChannelName}.`);

    const chanName = `🔒-${config.personalChannelPrefix}${memberName.toLowerCase()}`;
    addLog(`Création du salon personnel Discord : "${chanName}".`);

    // Call real Discord backend endpoint
    discordService.createPersonalChannel({
      memberName,
      prefix: config.personalChannelPrefix,
      rulesMessage: config.welcomeRulesMessage,
    });

    addLog(`Salon privé "${chanName}" créé avec succès ! Message de bienvenue envoyé.`);
    setStep('personal_channel_created');
  };

  // Step 2 -> Step 3: Clic sur "Lancer la formation"
  const handleLaunchTraining = () => {
    const roleName = config.initialRoleName || 'Trainee';
    if (!assignedRoles.includes(roleName)) {
      setAssignedRoles((prev) => [...prev, roleName]);
    }

    addLog(`Attribution du rôle initial "@${roleName}" à ${memberName}.`);
    addLog(`Affichage des directives du Module 1 et du lien de formation.`);

    setStep('module1_active');
  };

  // Step 3 -> Step 4: Clic sur "Démarrer le Quiz"
  const handleStartQuiz = (moduleId: string) => {
    const quizObj = quizzes.find((q) => q.moduleId === moduleId) || quizzes[0];
    if (!quizObj) {
      onShowToast('Erreur Quiz', 'Aucun quiz configuré pour ce module', 'info');
      return;
    }

    // Check cooldown
    const cooldownInfo = onboardingService.checkCooldown(memberName, quizObj.id);
    if (cooldownInfo.isCoolingDown) {
      onShowToast(
        'Cooldown Actif ⏱️',
        `Vous devez attendre encore ${cooldownInfo.remainingMinutes} minutes avant de retenter ce quiz.`,
        'info'
      );
      setCooldownSeconds(cooldownInfo.remainingMinutes * 60);
      return;
    }

    // Generate Randomized Quiz
    const randomized = onboardingService.generateRandomizedQuiz(quizObj);
    setCurrentQuiz(randomized);
    setSelectedAnswers({});
    addLog(`Quiz "${quizObj.title}" démarré (Mode Aléatoire QuizBot activé).`);
    setStep('quiz_in_progress');
  };

  // Step 4 -> Step 5: Soumettre le Quiz
  const handleSubmitQuiz = () => {
    if (!currentQuiz) return;

    let correctCount = 0;
    currentQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const maxScore = currentQuiz.maxScore || 20;
    const totalQuestions = currentQuiz.questions.length || 1;
    // Scale score to maxScore (e.g. 20)
    const calculatedScore = Math.round((correctCount / totalQuestions) * maxScore);
    const passed = calculatedScore >= currentQuiz.minScore;

    setQuizScore(calculatedScore);
    setQuizPassed(passed);

    if (passed) {
      const step1Config = config.stepConfigs.find((s) => s.moduleId === 'mod-1');
      const passRole = step1Config?.roleOnPassName || 'Junior';
      if (!assignedRoles.includes(passRole)) {
        setAssignedRoles([...assignedRoles, passRole]);
      }

      addLog(`Quiz Réussi ! Score : ${calculatedScore}/${maxScore}. Rôle "@${passRole}" attribué.`);
      discordService.createPrivateQuizThread({
        channelName: '#results',
        quizTitle: currentQuiz.title,
        memberName,
        score: calculatedScore,
        maxScore,
        passed: true,
      });
    } else {
      // Record 15 min cooldown
      onboardingService.recordCooldown(memberName, currentQuiz.id, config.cooldownMinutes);
      setCooldownSeconds(config.cooldownMinutes * 60);
      addLog(`Quiz Échoué ! Score : ${calculatedScore}/${maxScore}. Cooldown de ${config.cooldownMinutes} min activé.`);

      discordService.createPrivateQuizThread({
        channelName: '#results',
        quizTitle: currentQuiz.title,
        memberName,
        score: calculatedScore,
        maxScore,
        passed: false,
      });
    }

    setStep('quiz_result');
  };

  // Step 5 -> Step 6: Accéder au Module 2
  const handleAccessModule2 = () => {
    addLog(`Membre ${memberName} a accédé au Module 2.`);
    setStep('module2_active');
  };

  const handleResetSimulator = () => {
    setStep('welcome_channel');
    setAssignedRoles([]);
    setLogs([]);
    setCooldownSeconds(0);
    setCurrentQuiz(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Simulateur Interactif de Parcours Membre</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                  DISCORD LIVE TEST
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Testez l'expérience exacte d'un membre de l'arrivée au déblocage du Module 2.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSimulator}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Réinitialiser</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simulator Grid Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Interactive Discord Channel Mockup (2 cols) */}
          <div className="lg:col-span-2 p-5 overflow-y-auto space-y-4 bg-slate-950/60">
            {/* Discord Channel Header Bar */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold font-mono text-white">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>
                  {step === 'welcome_channel'
                    ? config.welcomeChannelName
                    : `🔒-${config.personalChannelPrefix}${memberName.toLowerCase()}`}
                </span>
              </div>

              {/* Roles Badge Bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Rôles Membre :</span>
                {assignedRoles.length === 0 ? (
                  <span className="text-[10px] text-slate-600 italic">Aucun rôle</span>
                ) : (
                  assignedRoles.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold"
                    >
                      @{r}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Step 1: Welcome Channel view */}
            {step === 'welcome_channel' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    🤖
                  </div>
                  <div className="space-y-2">
                    <span className="font-bold text-xs text-indigo-300">Pawako Bot</span>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {config.welcomeRulesMessage}
                    </div>

                    <button
                      onClick={handleStartOnboarding}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>{config.welcomeButtonLabel}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Channel Created view */}
            {step === 'personal_channel_created' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    Salon privé personnel créé : <strong>🔒-{config.personalChannelPrefix}{memberName.toLowerCase()}</strong>
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    🤖
                  </div>
                  <div className="space-y-3">
                    <span className="font-bold text-xs text-indigo-300">Pawako Bot</span>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-2">
                      <p className="font-bold text-white">👋 Content de te voir, {memberName} !</p>
                      <p className="text-slate-300">
                        Bienvenue dans ton espace privé. Pour débloquer ton premier rôle et démarrer les cours, clique sur le bouton ci-dessous.
                      </p>
                    </div>

                    <button
                      onClick={handleLaunchTraining}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Shield className="w-4 h-4" />
                      <span>{config.startTrainingButtonLabel || '🚀 Lancer la formation'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Profile Overlay View */}
            {showProfile && (
              <div className="p-5 rounded-2xl bg-indigo-950/90 border border-indigo-500/40 space-y-3 animate-in fade-in text-xs font-mono">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                  <span className="font-bold text-indigo-200 text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>👤 MON PROFIL CANDIDAT (Aperçu Discord Staff & Membre)</span>
                  </span>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-1 rounded bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/80 p-4 rounded-xl border border-indigo-500/20">
                  <p>Candidat : <strong className="text-white">{memberName}</strong></p>
                  <p>📊 <strong>Progression :</strong> {step === 'module2_active' ? '████████░░ 80%' : '████░░░░░░ 40%'}</p>
                  <p>📚 <strong>Module actuel :</strong> {step === 'module2_active' ? (modules[1]?.title || 'Module 2') : (modules[0]?.title || 'Module 1')}</p>
                  <p>🏷️ <strong>Rôles Discord actuels :</strong> {assignedRoles.map(r => `@${r}`).join(', ') || '@Trainee'}</p>
                  <p>⏱️ <strong>Statut Cooldown :</strong> {cooldownSeconds > 0 ? `⏳ Actif (${Math.floor(cooldownSeconds/60)}m)` : '✅ Disponible'}</p>
                </div>
              </div>
            )}

            {/* Step 3: Module 1 Directives & Quiz Start */}
            {step === 'module1_active' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rôle <strong>@{assignedRoles[0] || config.initialRoleName || 'Trainee'}</strong> attribué avec succès !</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm">📘 {modules[0]?.title || 'Module 1 : Onboarding & Culture PAWAKO'}</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {modules[0]?.content || 'Consultez la documentation externe et lisez les consignes attentivement avant d\'ouvrir l\'évaluation.'}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Support de Formation Externe :</span>
                    <a
                      href="https://docs.pawako.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline font-mono flex items-center gap-1"
                    >
                      <span>Consulter la Doc</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleStartQuiz('mod-1')}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-300" />
                      <span>📝 Lancer le Quiz 1</span>
                    </button>

                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <span>👤 Mon profil</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Quiz in Progress */}
            {step === 'quiz_in_progress' && currentQuiz && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-white">{currentQuiz.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Shuffle className="w-3 h-3" /> Questions Aléatoires
                      </span>
                      <span className="flex items-center gap-1 text-indigo-400">
                        <EyeOff className="w-3 h-3" /> Solutions Masquées
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-950 text-indigo-400 border border-slate-800 text-[10px] font-mono font-bold">
                    Score Min : {currentQuiz.minScore}/20
                  </span>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {currentQuiz.questions.map((q, qIdx) => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="text-xs font-bold text-slate-200">
                        Q{qIdx + 1}. {q.text}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              selectedAnswers[qIdx] === oIdx
                                ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIdx}`}
                              checked={selectedAnswers[qIdx] === oIdx}
                              onChange={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: oIdx })}
                              className="text-indigo-600 focus:ring-0"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Soumettre le Quiz & Analyser les Résultats</span>
                </button>
              </div>
            )}

            {/* Step 5: Quiz Result Screen */}
            {step === 'quiz_result' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                {quizPassed ? (
                  /* SUCCESS SCREEN */
                  <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>🎉 Félicitations, tu as réussi !</span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      Tu as obtenu le score de <strong>{quizScore}/20</strong> ! Rôle <strong>@Junior</strong> attribué avec succès.
                    </p>

                    <button
                      onClick={handleAccessModule2}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                    >
                      <span>Accéder au Module 2</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* FAILURE SCREEN WITH 15 MIN COOLDOWN */
                  <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3 text-rose-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                      <XCircle className="w-5 h-5" />
                      <span>❌ Échec au Quiz</span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      Score obtenu : <strong>{quizScore}/20</strong> (Minimum requis : {currentQuiz?.minScore || 16}/20).
                      Vous n'avez pas réussi, vous pouvez réessayer après <strong>{config.cooldownMinutes} minutes</strong>.
                    </p>

                    {/* Cooldown Timer display */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Compteur de Cooldown :</span>
                      </span>
                      <span className="font-bold text-amber-400 text-sm">
                        {Math.floor(cooldownSeconds / 60)}m {cooldownSeconds % 60}s
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        disabled={cooldownSeconds > 0}
                        onClick={() => handleStartQuiz('mod-1')}
                        className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-50 text-white text-xs font-bold"
                      >
                        Réessayer le Quiz
                      </button>

                      <button
                        onClick={() => {
                          setCooldownSeconds(0);
                          onboardingService.resetCooldown(memberName, currentQuiz?.id || 'quiz-1');
                          onShowToast('Override Admin ⚡', 'Cooldown de 15 minutes réinitialisé pour le test.', 'info');
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-950 text-indigo-300 text-[11px] font-mono border border-indigo-500/30 hover:bg-indigo-900"
                      >
                        [Admin : Débloquer Cooldown]
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Module 2 Active */}
            {step === 'module2_active' && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Module 2 Débloqué ! Rôle <strong>@{assignedRoles.find(r => r === 'Junior' || r === 'Senior' || r === 'Certified') || 'Junior'}</strong> actif.</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm">🛠️ {modules[1]?.title || 'Module 2 : Outils & Processus Internes'}</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {modules[1]?.content || 'Voici les directives du Module 2. Vous pouvez désormais vous former aux workflows internes et aux tickets de support.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleStartQuiz('mod-2')}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-300" />
                      <span>📝 Lancer le Quiz 2</span>
                    </button>

                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <span>👤 Mon profil</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Member Config & Real-Time Action Logs */}
          <div className="p-5 space-y-4 bg-slate-900">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Membre de Test</span>
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400">Nom du Membre Test</label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Journaux d'Actions Discord en Direct
              </h4>
              <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1.5 leading-relaxed">
                {logs.length === 0 ? (
                  <span className="text-slate-600 italic">En attente des actions du membre...</span>
                ) : (
                  logs.map((l, i) => <div key={i}>{l}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
