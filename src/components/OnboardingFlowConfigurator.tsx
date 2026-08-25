import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Lock,
  MessageSquare,
  Shield,
  Hash,
  Clock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  FileText,
  Plus,
  Trash2,
  HelpCircle,
  Edit3,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  Bell,
  Zap,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { OnboardingFlowConfig, ModuleStepConfig, TrainingModule, Quiz, QuizQuestion } from '../types';
import { onboardingService } from '../services/onboardingService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { discordSyncService, PreFlightValidationResult } from '../services/discordSyncService';
import { discordService } from '../services/discordService';
import { moduleService } from '../services/moduleService';
import { quizService } from '../services/quizService';
import { store } from '../services/store';
import { QuizImportModal } from './QuizImportModal';
import { DiscordResourceSelect } from './DiscordResourceSelect';

interface OnboardingFlowConfiguratorProps {
  modules: TrainingModule[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'error') => void;
  onOpenSimulator?: () => void;
}

export const OnboardingFlowConfigurator: React.FC<OnboardingFlowConfiguratorProps> = ({
  modules: initialModules,
  onShowToast,
  onOpenSimulator,
}) => {
  const [config, setConfig] = useState<OnboardingFlowConfig>(onboardingService.getConfig());
  const [localModules, setLocalModules] = useState<TrainingModule[]>(
    initialModules.length > 0 ? initialModules : store.getModules()
  );

  const [selectedModuleTab, setSelectedModuleTab] = useState<string>(
    localModules[0]?.id || ''
  );

  const [validationResult, setValidationResult] = useState<PreFlightValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isLaunchingOnboarding, setIsLaunchingOnboarding] = useState(false);

  // Expanded questions accordion state
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [isRunningWorker, setIsRunningWorker] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportQuestions = (imported: QuizQuestion[], replaceExisting: boolean) => {
    if (!activeQuizObj) return;
    const current = activeQuizObj.questions || [];
    const finalQuestions = replaceExisting ? imported : [...current, ...imported];
    quizService.updateQuiz(activeQuizObj.id, { questions: finalQuestions });
    onShowToast(
      'Quiz Mis à Jour',
      `${imported.length} question(s) importée(s) avec succès dans le quiz.`,
      'success'
    );
  };

  const handleRunWorkerNow = async () => {
    setIsRunningWorker(true);
    const res = await firebaseSyncService.checkAndApplyAutoReminders();
    setIsRunningWorker(false);
    onShowToast(
      'Worker Inactivité Exécuté',
      `${res.checked} membres vérifiés • ${res.flagged} relances envoyées/marquées`,
      'success'
    );
  };

  const refreshModulesState = () => {
    const updated = store.getModules();
    setLocalModules([...updated]);
    return updated;
  };

  const activeModuleObj = localModules.find((m) => m.id === selectedModuleTab) || localModules[0];
  const activeQuizObj = activeModuleObj ? store.getQuiz(activeModuleObj.quizId || '') || quizService.getQuizzes().find(q => q.moduleId === activeModuleObj.id) : undefined;

  const foundStep = config.stepConfigs.find((s) => s.moduleId === selectedModuleTab);

  const currentStep: ModuleStepConfig = foundStep
    ? {
        ...foundStep,
        moduleTitle: activeModuleObj?.title || foundStep.moduleTitle,
        directivesText: activeModuleObj?.content || foundStep.directivesText,
        externalLinkUrl: foundStep.externalLinkUrl || activeModuleObj?.url || '',
        delayMinutesBeforeQuiz: foundStep.delayMinutesBeforeQuiz ?? activeQuizObj?.delayMinutesBeforeQuiz ?? 0,
        roleOnStartName: foundStep.roleOnStartName || activeModuleObj?.roleEnCoursName || 'En cours',
        roleOnPassName: foundStep.roleOnPassName || activeModuleObj?.roleValidatedName || 'Validé',
      }
    : {
        moduleId: selectedModuleTab,
        moduleTitle: activeModuleObj?.title || 'Module de formation',
        directivesText: activeModuleObj?.content || 'Lisez les consignes avant de lancer le quiz.',
        externalLinkUrl: activeModuleObj?.url || '',
        delayMinutesBeforeQuiz: activeQuizObj?.delayMinutesBeforeQuiz ?? 0,
        roleOnStartId: activeModuleObj?.roleEnCoursId || '',
        roleOnStartName: activeModuleObj?.roleEnCoursName || 'En cours',
        roleOnPassId: activeModuleObj?.roleValidatedId || '',
        roleOnPassName: activeModuleObj?.roleValidatedName || 'Validé',
        successMessage: activeQuizObj?.successMessage || '🎉 Félicitations tu as réussi ! Accède au module suivant.',
        failureMessage: activeQuizObj?.failureMessage || '❌ Score insuffisant. Tu peux réessayer après le cooldown.',
      };

  const handleResetToBlankSlate = () => {
    if (
      confirm(
        "⚠️ SUPPRESSION TOTALE DE TOUTES LES PRÉ-PROGRAMMATIONS\n\nVoulez-vous vraiment effacer tous les modules exemples, quiz exemples et textes pré-définis ?\n\nVotre environnement deviendra 100% vierge pour un paramétrage de A à Z sans aide ni modèles pré-remplis."
      )
    ) {
      store.resetToBlankSlate();
      const blankCfg = onboardingService.resetToBlankSlate();

      setConfig(blankCfg);
      setLocalModules([]);
      setSelectedModuleTab('');

      onShowToast(
        'Environnement Vierge (A à Z) 🗑️',
        'Toutes les pré-programmations ont été effacées. Vous pouvez maintenant créer vos propres modules et quiz de zéro !',
        'success'
      );
    }
  };

  const handleAddNewModule = () => {
    const nextOrder = localModules.length + 1;
    const newMod = moduleService.addModule({
      title: `Module ${nextOrder}`,
      description: `Description du Module ${nextOrder}`,
      content: `## 📘 Consignes du Module ${nextOrder}\n\nSaisissez ici les consignes destinées au candidat.`,
      channelId: `chan-mod-${nextOrder}`,
      channelName: `#module-${nextOrder}`,
      roleEnCoursName: `Module ${nextOrder} En cours`,
      roleValidatedName: `Module ${nextOrder} Validé`,
      roleEnCoursId: '',
      roleValidatedId: '',
      resources: [],
      buttons: [],
      isActive: true,
    });

    const newQuiz = quizService.addQuiz({
      moduleId: newMod.id,
      title: `Quiz du Module ${nextOrder}`,
      description: `Évaluation de validation du Module ${nextOrder}`,
      minScore: 1,
      maxScore: 1,
      timeLimitMinutes: 15,
      maxAttempts: 3,
      cooldownMinutes: 15,
      delayMinutesBeforeQuiz: 0,
      sampleSize: 1,
      questions: [
        {
          id: `q-${Date.now()}-1`,
          text: `Question 1 du Module ${nextOrder} ?`,
          options: ['Réponse A (Correcte)', 'Réponse B'],
          correctAnswer: 0,
          points: 1,
          explanation: '',
        },
      ],
      successMessage: `🎉 Félicitations ! Tu as validé le Module ${nextOrder}.`,
      failureMessage: `❌ Score insuffisant. Tu peux réessayer après le délai.`,
    });

    moduleService.updateModule(newMod.id, { quizId: newQuiz.id });
    const updatedMods = refreshModulesState();
    setSelectedModuleTab(newMod.id);

    onShowToast('Nouveau Module Créé 🚀', `Le Module ${nextOrder} a été ajouté.`, 'success');
  };

  const handleDeleteCurrentModule = () => {
    if (confirm(`Voulez-vous vraiment supprimer "${activeModuleObj?.title}" et son quiz associé ?`)) {
      if (activeModuleObj) {
        moduleService.deleteModule(activeModuleObj.id);
        if (activeModuleObj.quizId) {
          quizService.deleteQuiz(activeModuleObj.quizId);
        }
      }
      const updatedMods = refreshModulesState();
      const nextActive = updatedMods[0]?.id || '';
      setSelectedModuleTab(nextActive);

      // Remove from stepConfigs
      const newSteps = config.stepConfigs.filter((s) => s.moduleId !== activeModuleObj?.id);
      const newConfig = { ...config, stepConfigs: newSteps };
      setConfig(newConfig);
      onboardingService.updateConfig(newConfig);

      onShowToast('Module Supprimé 🗑️', 'Le module et son quiz ont été supprimés.', 'info');
    }
  };

  const handleUpdateModuleDetails = (updates: Partial<TrainingModule>) => {
    if (!activeModuleObj) return;
    moduleService.updateModule(activeModuleObj.id, updates);
    refreshModulesState();
  };

  const handleUpdateQuizDetails = (updates: Partial<Quiz>) => {
    if (!activeQuizObj) return;
    quizService.updateQuiz(activeQuizObj.id, updates);
    refreshModulesState();
  };

  const handleAddQuestionToQuiz = () => {
    if (!activeQuizObj) return;
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      text: 'Nouvelle question de quiz ?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
      points: 1,
      explanation: 'Explication de la réponse.',
    };

    const updatedQuestions = [...(activeQuizObj.questions || []), newQuestion];
    quizService.updateQuiz(activeQuizObj.id, { questions: updatedQuestions });
    setExpandedQuestions({ ...expandedQuestions, [newQuestion.id]: true });
    refreshModulesState();
    onShowToast('Question Ajoutée', 'Une nouvelle question a été ajoutée au quiz.', 'info');
  };

  const handleUpdateQuestion = (qIndex: number, updatedQ: QuizQuestion) => {
    if (!activeQuizObj) return;
    const questions = [...(activeQuizObj.questions || [])];
    questions[qIndex] = updatedQ;
    quizService.updateQuiz(activeQuizObj.id, { questions });
    refreshModulesState();
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!activeQuizObj) return;
    const questions = [...(activeQuizObj.questions || [])];
    questions.splice(qIndex, 1);
    quizService.updateQuiz(activeQuizObj.id, { questions });
    refreshModulesState();
    onShowToast('Question Supprimée', 'La question a été retirée du quiz.', 'info');
  };

  const handleLaunchOnboardingOnDiscord = async () => {
    setIsLaunchingOnboarding(true);
    onShowToast('Lancement Onboarding...', `Publication du message d'accueil dans #${config.welcomeChannelName}`, 'info');

    try {
      const embed = {
        title: `👋 Bienvenue dans la Formation Pawako !`,
        description: config.welcomeRulesMessage || `Bienvenue ! Suivez les consignes ci-dessous pour démarrer votre formation.`,
        color: 0x6366f1,
        footer: {
          text: 'Pawako Formation • Espace de Formation Officiel',
          icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        },
        timestamp: new Date().toISOString(),
      };

      const components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: 'start_onboarding_process',
              label: `🚀 ${config.welcomeButtonLabel || 'Commencer la formation'}`,
            },
          ],
        },
      ];

      const res = await discordService.sendCustomEmbed({
        channelName: config.welcomeChannelName || '#bienvenue',
        channelId: config.welcomeChannelId,
        embed,
        components,
        content: `📢 **Lancement de l'Onboarding Pawako Formation !**`,
      });

      if (res.success) {
        onShowToast(
          'Onboarding Publié sur Discord 🚀',
          `Message d'accueil et bouton d'inscription envoyés dans #${config.welcomeChannelName} !`,
          'success'
        );
      } else {
        onShowToast('Erreur Publication', res.message, 'error');
      }
    } catch (err: any) {
      onShowToast('Erreur Discord', err.message || 'Impossible de publier sur Discord', 'error');
    } finally {
      setIsLaunchingOnboarding(false);
    }
  };

  const handleRunPreFlightCheck = async () => {
    setIsValidating(true);
    try {
      const res = await discordSyncService.validatePreFlightConfig(config);
      setValidationResult(res);
      if (res.isValid) {
        onShowToast('Validation réussie !', 'Toutes les ressources Discord configurées sont valides et accessibles.', 'success');
      } else {
        onShowToast('Incohérences détectées', 'Certaines ressources Discord sélectionnées sont manquantes ou inaccessibles.', 'error');
      }
    } catch (err: any) {
      console.warn('[PreFlight Info]', err?.message || err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveMainConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onboardingService.updateConfig(config);
    onShowToast('Configuration Enregistrée 🚀', 'Toutes les modifications du parcours, des modules et des quiz ont été enregistrées.', 'success');
  };

  const handleUpdateStepConfig = (updatedStep: ModuleStepConfig) => {
    const steps = [...config.stepConfigs];
    const index = steps.findIndex((s) => s.moduleId === updatedStep.moduleId);
    if (index >= 0) {
      steps[index] = updatedStep;
    } else {
      steps.push(updatedStep);
    }
    const newConfig = { ...config, stepConfigs: steps };
    setConfig(newConfig);
    onboardingService.updateConfig(newConfig);

    // Sync roles, title & external link directly with Module object
    moduleService.updateModule(updatedStep.moduleId, {
      title: updatedStep.moduleTitle,
      content: updatedStep.directivesText,
      url: updatedStep.externalLinkUrl,
      roleEnCoursName: updatedStep.roleOnStartName,
      roleValidatedName: updatedStep.roleOnPassName,
      roleEnCoursId: updatedStep.roleOnStartId,
      roleValidatedId: updatedStep.roleOnPassId,
    });
    refreshModulesState();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Simulator Link */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Configuration Centralisée : Parcours Onboarding, Modules & Quiz Discord
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Gérez l'intégralité du parcours au même endroit : contenu des modules, consignes, rôles attribués, délais d'accès et questions des quiz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={isLaunchingOnboarding}
            onClick={handleLaunchOnboardingOnDiscord}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className={`w-4 h-4 fill-slate-950 ${isLaunchingOnboarding ? 'animate-spin' : ''}`} />
            <span>{isLaunchingOnboarding ? 'Publication...' : '🚀 Lancer l\'Onboarding sur Discord'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunPreFlightCheck}
            disabled={isValidating}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700 shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isValidating ? 'Vérification...' : '✓ Tester la Config'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToBlankSlate}
            className="px-3.5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Effacer toutes les pré-programmations et textes modèles (A à Z)"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Réinitialiser Vierge (A à Z)</span>
          </button>

          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simulateur Membre</span>
            </button>
          )}
        </div>
      </div>

      {/* Pre-Flight Validation Modal / Banner */}
      {validationResult && (
        <div
          className={`p-5 rounded-2xl border ${
            validationResult.isValid
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          } space-y-3 shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              {validationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span>
                {validationResult.isValid
                  ? 'Vérification Pré-publication Réussie'
                  : 'Incohérences de Ressources Discord Détectées'}
              </span>
            </div>
            <button
              onClick={() => setValidationResult(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕ Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg">
              {validationResult.checks.welcomeChannel.status === 'pass' ? '🟢' : '🔴'} Salon de Bienvenue : {validationResult.checks.welcomeChannel.message}
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg">
              {validationResult.checks.initialRole.status === 'pass' ? '🟢' : '🔴'} Rôle Initial : {validationResult.checks.initialRole.message}
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg">
              {validationResult.checks.categoryExists.status === 'pass' ? '🟢' : '🟡'} Catégorie Personnelle : {validationResult.checks.categoryExists.message}
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg">
              {validationResult.checks.logChannel.status === 'pass' ? '🟢' : '🟡'} Salon des Logs : {validationResult.checks.logChannel.message}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveMainConfig} className="space-y-6">
        {/* Section 1: Accueil & Salon Personnel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Salon de Bienvenue, Catégorie & Rôle Initial
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DiscordResourceSelect
              type="channel"
              value={config.welcomeChannelId}
              onChange={(id, name) => setConfig({ ...config, welcomeChannelId: id, welcomeChannelName: name })}
              label="Salon de Bienvenue Général"
              required
              helperText="Salon Discord dans lequel le bot poste le message d'accueil initial"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Libellé du Bouton sur Bienvenue <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={config.welcomeButtonLabel}
                onChange={(e) => setConfig({ ...config, welcomeButtonLabel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-xs text-slate-400">
                Ex: "Commencer la formation" — Déclenche la création du salon privé du membre.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Libellé du Bouton Démarrage (Salon Privé) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={config.startTrainingButtonLabel || '🚀 Lancer la formation'}
                onChange={(e) => setConfig({ ...config, startTrainingButtonLabel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-xs text-slate-400">
                Ex: "Lancer la formation" — Affiché dans le salon privé du membre.
              </p>
            </div>

            <DiscordResourceSelect
              type="category"
              value={config.personalCategoryId}
              onChange={(id, name) => setConfig({ ...config, personalCategoryId: id, personalCategoryName: name })}
              label="Catégorie des Salons Personnels"
              helperText="Catégorie Discord où seront créés les salons 🔒-formation-[pseudo]"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Préfixe du Salon Personnel Membre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={config.personalChannelPrefix}
                onChange={(e) => setConfig({ ...config, personalChannelPrefix: e.target.value })}
                placeholder="formation-"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-xs text-slate-400">
                Format généré : <code className="text-indigo-400">🔒-formation-[pseudo]</code>
              </p>
            </div>

            <DiscordResourceSelect
              type="role"
              value={config.initialRoleId}
              onChange={(id, name) => setConfig({ ...config, initialRoleId: id, initialRoleName: name })}
              label="Rôle Initial Attribué à l'Arrivée"
              required
              helperText="Rôle Discord attribué au membre lorsqu'il lance son parcours"
            />

            <DiscordResourceSelect
              type="channel"
              value={config.logChannelId}
              onChange={(id, name) => setConfig({ ...config, logChannelId: id, logChannelName: name })}
              label="Salon des Logs de Formation"
              helperText="Salon Discord où le Bot enregistrera l'historique et les alertes d'onboarding"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Message de Bienvenue & Consignes (Posté dans le salon personnel)</span>
            </label>
            <textarea
              rows={3}
              value={config.welcomeRulesMessage}
              onChange={(e) => setConfig({ ...config, welcomeRulesMessage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Éditeur Centralisé des Modules & Quiz (TOUT EN UN) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Gestion Centralisée des Étape & Quiz de Formation ({localModules.length} Modules)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Gérez le titre, les consignes, les rôles attribués et les questions du quiz de chaque module depuis ce panneau unique.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddNewModule}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter un Module</span>
            </button>
          </div>

          {/* Module Tabs */}
          {localModules.length > 0 && (
            <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-1">
              {localModules.map((mod, idx) => {
                const isActive = selectedModuleTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleTab(mod.id)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-t border-x border-indigo-500 shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-b border-slate-800'
                    }`}
                  >
                    <span className="opacity-80 font-mono text-[11px]">Étape {idx + 1}</span>
                    <span className="font-semibold">{mod.title}</span>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {localModules.length === 0 && (
            <div className="bg-slate-950 p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-4">
              <div className="p-3 bg-slate-900 text-slate-400 rounded-full w-fit mx-auto border border-slate-800">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Aucun module configuré (Environnement Vierge)</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Votre parcours est actuellement vide de toute pré-programmation. Vous pouvez créer votre tout premier module de A à Z !
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddNewModule}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Créer le Premier Module</span>
              </button>
            </div>
          )}

          {/* Selected Module & Quiz Unified Editor Panel */}
          {activeModuleObj && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
              {/* Module Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                    Étape {localModules.findIndex((m) => m.id === selectedModuleTab) + 1} / {localModules.length}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{activeModuleObj.title}</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">ID Module : {activeModuleObj.id}</span>
                  </div>
                </div>

                {localModules.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentModule}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer w-fit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer cette Étape</span>
                  </button>
                )}
              </div>

              {/* Subsection A: Informations & Contenu Pédagogique du Module */}
              <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>A. Informations & Directives du Module</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Titre du Module</label>
                    <input
                      type="text"
                      value={activeModuleObj.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        handleUpdateModuleDetails({ title: newTitle });
                        handleUpdateStepConfig({ ...currentStep, moduleTitle: newTitle });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Description courte</label>
                    <input
                      type="text"
                      value={activeModuleObj.description || ''}
                      onChange={(e) => handleUpdateModuleDetails({ description: e.target.value })}
                      placeholder="Objectif du module..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Consignes & Contenu Pédagogique (Message posté dans le salon privé Discord)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={activeModuleObj.content || ''}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      handleUpdateModuleDetails({ content: newContent });
                      handleUpdateStepConfig({ ...currentStep, directivesText: newContent });
                    }}
                    placeholder="Saisissez les consignes de formation (Support Markdown accepté)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>URL du Support Externe de Formation (Optionnel)</span>
                  </label>
                  <input
                    type="url"
                    value={currentStep.externalLinkUrl || activeModuleObj.url || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      handleUpdateStepConfig({ ...currentStep, externalLinkUrl: url });
                      handleUpdateModuleDetails({ url });
                    }}
                    placeholder="https://votre-domaine.com/votre-guide-ou-support"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Subsection B: Attributions des Rôles Discord pour ce Module */}
              <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>B. Attribution des Rôles Discord</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DiscordResourceSelect
                    type="role"
                    value={currentStep.roleOnStartId}
                    onChange={(id, name) =>
                      handleUpdateStepConfig({
                        ...currentStep,
                        roleOnStartId: id,
                        roleOnStartName: name,
                      })
                    }
                    label="Rôle Attribué au Démarrage de l'Étape"
                    helperText="Rôle Discord attribué lorsque l'utilisateur entame ce module"
                  />

                  <DiscordResourceSelect
                    type="role"
                    value={currentStep.roleOnPassId}
                    onChange={(id, name) =>
                      handleUpdateStepConfig({
                        ...currentStep,
                        roleOnPassId: id,
                        roleOnPassName: name,
                      })
                    }
                    label="Rôle Attribué en Cas de Succès (Validation Quiz)"
                    helperText="Rôle Discord attribué lorsque l'utilisateur réussit le quiz"
                  />
                </div>
              </div>

              {/* Subsection C: Configuration & Questions du Quiz Associé */}
              {activeQuizObj && (
                <div className="space-y-5 bg-slate-900/50 p-5 rounded-xl border border-indigo-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>C. Quiz & Évaluation des Connaissances ({activeQuizObj.questions?.length || 0} Questions)</span>
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      ID Quiz : {activeQuizObj.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Titre du Quiz</label>
                      <input
                        type="text"
                        value={activeQuizObj.title}
                        onChange={(e) => handleUpdateQuizDetails({ title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Score de Passage Requis (sur 20)</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={activeQuizObj.minScore}
                        onChange={(e) => handleUpdateQuizDetails({ minScore: Number(e.target.value) || 16 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Délai avant Déblocage Quiz (Min)</label>
                      <input
                        type="number"
                        min={0}
                        value={activeQuizObj.delayMinutesBeforeQuiz ?? currentStep.delayMinutesBeforeQuiz ?? 0}
                        onChange={(e) => {
                          const mins = Number(e.target.value) || 0;
                          handleUpdateQuizDetails({ delayMinutesBeforeQuiz: mins });
                          handleUpdateStepConfig({ ...currentStep, delayMinutesBeforeQuiz: mins });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Temps Limite (Minutes)</label>
                      <input
                        type="number"
                        min={1}
                        value={activeQuizObj.timeLimitMinutes ?? 15}
                        onChange={(e) => handleUpdateQuizDetails({ timeLimitMinutes: Number(e.target.value) || 15 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Cooldown entre Tentatives (Minutes)</label>
                      <input
                        type="number"
                        min={1}
                        value={activeQuizObj.cooldownMinutes ?? 30}
                        onChange={(e) => handleUpdateQuizDetails({ cooldownMinutes: Number(e.target.value) || 30 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-400">Message en cas de Succès</label>
                      <textarea
                        rows={2}
                        value={currentStep.successMessage || activeQuizObj.successMessage || ''}
                        onChange={(e) => {
                          const msg = e.target.value;
                          handleUpdateQuizDetails({ successMessage: msg });
                          handleUpdateStepConfig({ ...currentStep, successMessage: msg });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-red-400">Message en cas d'Échec</label>
                      <textarea
                        rows={2}
                        value={currentStep.failureMessage || activeQuizObj.failureMessage || ''}
                        onChange={(e) => {
                          const msg = e.target.value;
                          handleUpdateQuizDetails({ failureMessage: msg });
                          handleUpdateStepConfig({ ...currentStep, failureMessage: msg });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Question Bank Manager */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Banque de Questions ({activeQuizObj.questions?.length || 0})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>📥 Importer (TXT / Excel)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddQuestionToQuiz}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Question</span>
                        </button>
                      </div>
                    </div>

                    {activeQuizObj.questions?.map((q, qIndex) => {
                      const isExpanded = expandedQuestions[q.id] ?? true;

                      return (
                        <div
                          key={q.id || qIndex}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setExpandedQuestions({ ...expandedQuestions, [q.id]: !isExpanded })}
                              className="text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2"
                            >
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                                Q{qIndex + 1}
                              </span>
                              <span className="truncate max-w-md">{q.text || 'Question sans titre'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 text-xs transition-colors"
                              title="Supprimer la question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 pt-2 border-t border-slate-900">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-400">Intitulé de la question</label>
                                <input
                                  type="text"
                                  value={q.text}
                                  onChange={(e) => handleUpdateQuestion(qIndex, { ...q, text: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-semibold"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct_${q.id}`}
                                      checked={q.correctAnswer === optIdx}
                                      onChange={() => handleUpdateQuestion(qIndex, { ...q, correctAnswer: optIdx })}
                                      className="accent-emerald-500 cursor-pointer"
                                      title="Cocher pour définir comme réponse correcte"
                                    />
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...q.options];
                                        newOpts[optIdx] = e.target.value;
                                        handleUpdateQuestion(qIndex, { ...q, options: newOpts });
                                      }}
                                      className={`w-full bg-slate-900 border rounded-lg p-1.5 text-xs text-white ${
                                        q.correctAnswer === optIdx
                                          ? 'border-emerald-500/60 bg-emerald-950/20 font-bold text-emerald-200'
                                          : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-400">Explication pédagogique (Affichée après réponse)</label>
                                <input
                                  type="text"
                                  value={q.explanation || ''}
                                  onChange={(e) => handleUpdateQuestion(qIndex, { ...q, explanation: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Relances Automatiques (Inactivité) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Messages de Relances Automatiques en cas d'Inactivité
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Relancez automatiquement les membres stagnants (module non démarré ou quiz non terminé) selon les délais de votre choix.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunWorkerNow}
              disabled={isRunningWorker}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Zap className={`w-4 h-4 ${isRunningWorker ? 'animate-spin' : ''}`} />
              <span>{isRunningWorker ? 'Analyse...' : '⚡ Tester le Worker'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                id="auto_reminders_enabled"
                checked={config.autoReminders?.enabled ?? true}
                onChange={(e) => setConfig({
                  ...config,
                  autoReminders: {
                    ...(config.autoReminders || {
                      enabled: true,
                      thresholdHours: [2, 6, 8, 24],
                      unstartedMessage: '👋 Coucou <@{discordId}> ! Ton salon privé de formation est prêt. N\'oublie pas de cliquer sur **"{buttonLabel}"** pour débuter ton parcours !',
                      unfinishedQuizMessage: '⏰ Coucou <@{discordId}> ! Tu as démarré le module **{moduleTitle}** mais ton quiz n\'est pas encore terminé. N\'hésite pas à y répondre pour débloquer la suite !',
                    }),
                    enabled: e.target.checked
                  }
                })}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="auto_reminders_enabled" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                Activer les Relances Automatiques en Arrière-Plan (Worker Inactivité)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Délais d'inactivité déclencheurs (en heures)
                </label>
                <input
                  type="text"
                  value={(config.autoReminders?.thresholdHours || [2, 6, 8, 24]).join(', ')}
                  onChange={(e) => {
                    const parsed = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
                    setConfig({
                      ...config,
                      autoReminders: {
                        ...(config.autoReminders || {
                          enabled: true,
                          thresholdHours: [2, 6, 8, 24],
                          unstartedMessage: '👋 Coucou <@{discordId}> ! Ton salon privé de formation est prêt. N\'oublie pas de cliquer sur **"{buttonLabel}"** pour débuter ton parcours !',
                          unfinishedQuizMessage: '⏰ Coucou <@{discordId}> ! Tu as démarré le module **{moduleTitle}** mais ton quiz n\'est pas encore terminé. N\'hésite pas à y répondre pour débloquer la suite !',
                        }),
                        thresholdHours: parsed.length > 0 ? parsed : [2, 6, 8, 24]
                      }
                    });
                  }}
                  placeholder="2, 6, 8, 24"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400">
                  Séparez les heures par des virgules (ex: <code className="text-amber-400">2, 6, 8, 24, 48</code>). Le bot relancera à chaque palier.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Variables Disponibles
                </label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono space-y-1">
                  <div><code className="text-indigo-400 font-bold">{'{discordId}'}</code> : Mentionne le membre Discord</div>
                  <div><code className="text-amber-400 font-bold">{'{username}'}</code> : Pseudo du membre</div>
                  <div><code className="text-emerald-400 font-bold">{'{moduleTitle}'}</code> : Nom du module en cours</div>
                  <div><code className="text-sky-400 font-bold">{'{buttonLabel}'}</code> : Libellé du bouton lancer</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/80 space-y-2">
                <label className="text-xs font-bold text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Pool de Relances : Membres N'ayant encore rien lancé (0 module démarré)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">1 message par ligne • Le bot pioche au hasard</span>
                </label>
                <textarea
                  rows={4}
                  value={(config.autoReminders?.unstartedPool || []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').filter(l => l.trim().length > 0);
                    setConfig({
                      ...config,
                      autoReminders: {
                        ...(config.autoReminders || {
                          enabled: true,
                          thresholdHours: [2, 6, 8, 24],
                          unstartedMessage: '',
                          unfinishedQuizMessage: '',
                        }),
                        unstartedPool: lines,
                      }
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-amber-200 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
                  placeholder="Une variante par ligne..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/80 space-y-2">
                  <label className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                    <span>Pool Relance Palier 2h (Inactivité 2h)</span>
                    <span className="text-[11px] text-slate-400 font-normal">1 par ligne</span>
                  </label>
                  <textarea
                    rows={4}
                    value={(config.autoReminders?.inProgress2hPool || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(l => l.trim().length > 0);
                      setConfig({
                        ...config,
                        autoReminders: {
                          ...(config.autoReminders || { enabled: true, thresholdHours: [2, 6, 8, 24], unstartedMessage: '', unfinishedQuizMessage: '' }),
                          inProgress2hPool: lines,
                        }
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-indigo-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                    placeholder="Variantes 2h..."
                  />
                </div>

                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/80 space-y-2">
                  <label className="text-xs font-bold text-sky-400 flex items-center justify-between">
                    <span>Pool Relance Palier 6h (Inactivité 6h)</span>
                    <span className="text-[11px] text-slate-400 font-normal">1 par ligne</span>
                  </label>
                  <textarea
                    rows={4}
                    value={(config.autoReminders?.inProgress6hPool || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(l => l.trim().length > 0);
                      setConfig({
                        ...config,
                        autoReminders: {
                          ...(config.autoReminders || { enabled: true, thresholdHours: [2, 6, 8, 24], unstartedMessage: '', unfinishedQuizMessage: '' }),
                          inProgress6hPool: lines,
                        }
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-sky-200 font-mono leading-relaxed focus:outline-none focus:border-sky-500"
                    placeholder="Variantes 6h..."
                  />
                </div>

                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/80 space-y-2">
                  <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                    <span>Pool Relance Palier 12h (Inactivité 12h)</span>
                    <span className="text-[11px] text-slate-400 font-normal">1 par ligne</span>
                  </label>
                  <textarea
                    rows={4}
                    value={(config.autoReminders?.inProgress12hPool || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(l => l.trim().length > 0);
                      setConfig({
                        ...config,
                        autoReminders: {
                          ...(config.autoReminders || { enabled: true, thresholdHours: [2, 6, 8, 24], unstartedMessage: '', unfinishedQuizMessage: '' }),
                          inProgress12hPool: lines,
                        }
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-emerald-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                    placeholder="Variantes 12h..."
                  />
                </div>

                <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/80 space-y-2">
                  <label className="text-xs font-bold text-amber-400 flex items-center justify-between">
                    <span>Pool Relance Palier 24h+ (Inactivité 24h+)</span>
                    <span className="text-[11px] text-slate-400 font-normal">1 par ligne</span>
                  </label>
                  <textarea
                    rows={4}
                    value={(config.autoReminders?.inProgress24hPool || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(l => l.trim().length > 0);
                      setConfig({
                        ...config,
                        autoReminders: {
                          ...(config.autoReminders || { enabled: true, thresholdHours: [2, 6, 8, 24], unstartedMessage: '', unfinishedQuizMessage: '' }),
                          inProgress24hPool: lines,
                        }
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-amber-200 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
                    placeholder="Variantes 24h+..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advice Messages Pool for 3+ Quiz Failures */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Messages Automatiques d'Aide / Révision (3+ Échecs au Quiz)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Envoyé dans le salon privé du candidat dès le 3ème échec
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Saisissez les variantes de conseils incitant à bien relire le module avant de retenter (séparées par une ligne vide entre chaque message) :
            </p>

            <textarea
              rows={6}
              value={(config.repeatedFailurePool || []).join('\n\n')}
              onChange={(e) => {
                const blocks = e.target.value.split('\n\n').map(b => b.trim()).filter(b => b.length > 0);
                setConfig({
                  ...config,
                  repeatedFailurePool: blocks
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
              placeholder="Saisissez un message par bloc (séparés par une ligne vide)..."
            />
          </div>

          {/* Sarcastic Anti-Spam / Cooldown Bot Messages */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Répliques Sarcastiques Cooldown / Spam Clics
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Déclenché si un membre clique sur le quiz pendant son cooldown actif
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Saisissez ou modifiez les répliques sarcastiques (1 message par ligne) que le bot affichera aléatoirement :
            </p>

            <textarea
              rows={5}
              value={(config.cooldownSpamPool || config.sarcasticSpamMessages || []).join('\n')}
              onChange={(e) => {
                const lines = e.target.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                setConfig({
                  ...config,
                  cooldownSpamPool: lines,
                  sarcasticSpamMessages: lines
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-rose-300 font-mono leading-relaxed focus:outline-none focus:border-rose-500"
              placeholder="Une réplique par ligne..."
            />
          </div>
        </div>

        {/* Submit Main Config */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la Configuration globale</span>
          </button>
        </div>
      </form>

      <QuizImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        quizTitle={activeQuizObj?.title}
        onImportQuestions={handleImportQuestions}
      />
    </div>
  );
};
