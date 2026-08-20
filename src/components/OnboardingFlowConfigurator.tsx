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
} from 'lucide-react';
import { OnboardingFlowConfig, ModuleStepConfig, TrainingModule } from '../types';
import { onboardingService } from '../services/onboardingService';
import { discordSyncService, PreFlightValidationResult } from '../services/discordSyncService';
import { discordService } from '../services/discordService';
import { reminderService, CandidateReminderRule } from '../services/reminderService';
import { moduleService } from '../services/moduleService';
import { DiscordResourceSelect } from './DiscordResourceSelect';

interface OnboardingFlowConfiguratorProps {
  modules: TrainingModule[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'error') => void;
  onOpenSimulator?: () => void;
}

export const OnboardingFlowConfigurator: React.FC<OnboardingFlowConfiguratorProps> = ({
  modules,
  onShowToast,
  onOpenSimulator,
}) => {
  const [config, setConfig] = useState<OnboardingFlowConfig>(onboardingService.getConfig());
  const [selectedModuleTab, setSelectedModuleTab] = useState<string>(modules[0]?.id || 'mod-1');
  const [validationResult, setValidationResult] = useState<PreFlightValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const [isLaunchingOnboarding, setIsLaunchingOnboarding] = useState(false);
  const [reminderRules, setReminderRules] = useState<CandidateReminderRule[]>(reminderService.getRules());

  const handleLaunchOnboardingOnDiscord = async () => {
    setIsLaunchingOnboarding(true);
    onShowToast('Lancement Onboarding...', `Publication du message d'accueil dans #${config.welcomeChannelName}`, 'info');

    try {
      const embed = {
        title: `👋 Bienvenue dans la Formation Pawako !`,
        description: config.welcomeRulesMessage || `Bienvenue ! Suivez les consignes ci-dessous pour démarrer votre formation.`,
        color: 0x6366f1, // Indigo #6366f1
        footer: {
          text: 'Pawako Formation • Espace de Formation Officiel',
          icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
        },
        timestamp: new Date().toISOString(),
      };

      const components = [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 1, // Primary (Blurple)
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

  const handleTestReminderRule = async (ruleId: string) => {
    onShowToast('Exécution de la Relance...', 'Envoi du message de relance sur Discord...', 'info');
    const res = await reminderService.executeCandidateReminder(ruleId, 'Alex', config.welcomeChannelName);
    if (res.success) {
      onShowToast('Relance Candidat Envoyée 🚀', res.message, 'success');
    } else {
      onShowToast('Erreur Relance', res.message, 'error');
    }
  };

  const handleToggleReminderRule = (ruleId: string) => {
    const updated = reminderRules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    setReminderRules(updated);
    reminderService.saveRules(updated);
    onShowToast('Relance Mise à Jour', 'Modifications enregistrées', 'info');
  };

  const [isEvaluatingAutoReminders, setIsEvaluatingAutoReminders] = useState(false);

  const handleAutoEvaluateProgressReminders = async () => {
    setIsEvaluatingAutoReminders(true);
    onShowToast('Scan d\'Avancement des Membres...', 'Analyse du niveau d\'avancement de chaque candidat...', 'info');
    try {
      const res = await reminderService.evaluateAndAutoRemindMembers();
      onShowToast(
        'Scan d\'Avancement Terminé 🚀',
        `${res.evaluatedCount} membres analysés. ${res.remindedCount} relances automatiques envoyées selon leur avancement !`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Erreur Scan Relances', err?.message || 'Échec de l\'évaluation automatique', 'info');
    } finally {
      setIsEvaluatingAutoReminders(false);
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
    onShowToast('Configuration Enregistrée', 'La configuration du parcours d\'onboarding a été enregistrée dans Supabase.', 'success');
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

    // Sync roles directly with Module object
    if (updatedStep.roleOnStartName || updatedStep.roleOnPassName) {
      moduleService.updateModule(updatedStep.moduleId, {
        roleEnCoursName: updatedStep.roleOnStartName,
        roleValidatedName: updatedStep.roleOnPassName,
        roleEnCoursId: updatedStep.roleOnStartId,
        roleValidatedId: updatedStep.roleOnPassId,
      });
    }

    onShowToast('Étape de Module Enregistrée', `Paramètres pour ${updatedStep.moduleTitle} mis à jour.`, 'info');
  };

  const activeModuleObj = modules.find((m) => m.id === selectedModuleTab);
  const foundStep = config.stepConfigs.find((s) => s.moduleId === selectedModuleTab);

  const currentStep: ModuleStepConfig = foundStep
    ? {
        ...foundStep,
        roleOnStartName: foundStep.roleOnStartName || activeModuleObj?.roleEnCoursName || 'Trainee',
        roleOnPassName: foundStep.roleOnPassName || activeModuleObj?.roleValidatedName || 'Junior',
      }
    : {
        moduleId: selectedModuleTab,
        moduleTitle: activeModuleObj?.title || 'Module de formation',
        directivesText: 'Lisez les consignes avant de lancer le quiz.',
        externalLinkUrl: 'https://docs.pawako.com/guide',
        roleOnStartId: activeModuleObj?.roleEnCoursId || '',
        roleOnStartName: activeModuleObj?.roleEnCoursName || 'Trainee',
        roleOnPassId: activeModuleObj?.roleValidatedId || '',
        roleOnPassName: activeModuleObj?.roleValidatedName || 'Junior',
        successMessage: '🎉 Félicitations tu as réussi avec un score de {score}/{maxScore} ! Tu as accès au module suivant ci-dessous.',
        failureMessage: '❌ Vous n\'avez pas réussi (score : {score}/{maxScore}). Vous pouvez réessayer après {cooldown} minutes.',
      };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Simulator Link */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Configuration du Parcours d'Onboarding & Rôles Discord
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Sélectionnez dynamiquement les salons, catégories et rôles réels issus de votre serveur Discord pour l'attribution automatique et le routage des candidats.
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

          {validationResult.errors.length > 0 && (
            <div className="space-y-1 text-xs text-red-300 bg-red-950/60 p-3 rounded-lg border border-red-500/30">
              <div className="font-bold">Avertissements Bloquants :</div>
              {validationResult.errors.map((err, idx) => (
                <div key={idx}>• {err}</div>
              ))}
            </div>
          )}
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
            {/* Salon de Bienvenue */}
            <DiscordResourceSelect
              type="channel"
              value={config.welcomeChannelId}
              onChange={(id, name) => setConfig({ ...config, welcomeChannelId: id, welcomeChannelName: name })}
              label="Salon de Bienvenue Général"
              required
              helperText="Salon Discord dans lequel le bot poste le message d'accueil initial"
            />

            {/* Libellé du Bouton sur #bienvenue */}
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

            {/* Catégorie des Salons Personnels */}
            <DiscordResourceSelect
              type="category"
              value={config.personalCategoryId}
              onChange={(id, name) => setConfig({ ...config, personalCategoryId: id, personalCategoryName: name })}
              label="Catégorie des Salons Personnels"
              helperText="Catégorie Discord où seront créés les salons 🔒-formation-[pseudo]"
            />

            {/* Préfixe du Salon Personnel */}
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

            {/* Rôle Initial Attribution */}
            <DiscordResourceSelect
              type="role"
              value={config.initialRoleId}
              onChange={(id, name) => setConfig({ ...config, initialRoleId: id, initialRoleName: name })}
              label="Rôle Initial Attribué à l'Arrivée"
              required
              helperText="Rôle Discord attribué au membre lorsqu'il lance son parcours"
            />

            {/* Salon des Logs */}
            <DiscordResourceSelect
              type="channel"
              value={config.logChannelId}
              onChange={(id, name) => setConfig({ ...config, logChannelId: id, logChannelName: name })}
              label="Salon des Logs de Formation"
              helperText="Salon Discord où le Bot enregistrera l'historique et les alertes d'onboarding"
            />
          </div>

          {/* Message de Bienvenue & Règles */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Message de Bienvenue & Consignes (Posté dans le salon personnel)</span>
            </label>
            <textarea
              rows={4}
              value={config.welcomeRulesMessage}
              onChange={(e) => setConfig({ ...config, welcomeRulesMessage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Configuration par Module (Rôles & Progression) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Configuration des Rôles Discord par Module
              </h3>
            </div>

            {/* Direct Module Dropdown Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                Changer de module :
              </label>
              <select
                value={selectedModuleTab}
                onChange={(e) => setSelectedModuleTab(e.target.value)}
                className="bg-slate-950 border border-indigo-500/40 hover:border-indigo-500 text-xs text-white font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {modules.map((mod, idx) => (
                  <option key={mod.id} value={mod.id}>
                    Étape {idx + 1} : {mod.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Module Tabs with Full Titles */}
          <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-1">
            {modules.map((mod, idx) => {
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

          {/* Selected Module Config Form */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                    Étape {modules.findIndex((m) => m.id === selectedModuleTab) + 1} / {modules.length}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {currentStep.moduleTitle}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Définissez les rôles Discord attribués au démarrage et à la validation de ce module.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 shrink-0">
                ID: {currentStep.moduleId}
              </span>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rôle attribué au démarrage du module */}
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
              label="Rôle Attribué au Démarrage du Module"
              helperText="Rôle Discord attribué lorsque l'utilisateur entame ce module"
            />

            {/* Rôle attribué en cas de réussite */}
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

          {/* Lien Documentation Externe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>URL du Support Externe de Formation</span>
            </label>
            <input
              type="url"
              value={currentStep.externalLinkUrl || ''}
              onChange={(e) =>
                handleUpdateStepConfig({
                  ...currentStep,
                  externalLinkUrl: e.target.value,
                })
              }
              placeholder="https://docs.pawako.com/votre-guide"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Message Succès */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-emerald-400">
                Message en cas de Succès
              </label>
              <textarea
                rows={2}
                value={currentStep.successMessage || ''}
                onChange={(e) =>
                  handleUpdateStepConfig({
                    ...currentStep,
                    successMessage: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Message Échec */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-red-400">
                Message en cas d'Échec
              </label>
              <textarea
                rows={2}
                value={currentStep.failureMessage || ''}
                onChange={(e) =>
                  handleUpdateStepConfig({
                    ...currentStep,
                    failureMessage: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
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

        {/* Section 3: Relances Automatiques Adaptées à l'Avancement du Membre */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Relances Automatiques Adaptées à l'Avancement du Membre
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoEvaluateProgressReminders}
                disabled={isEvaluatingAutoReminders}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isEvaluatingAutoReminders ? 'Analyse...' : '⚡ Scan & Relancer selon l\'Avancement'}</span>
              </button>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                Relances Adaptatives Activées
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Les messages de relance sont automatiquement adaptés au statut exact du membre (non démarré, module en cours, quiz échoué à repasser, ou attente de validation de rôle).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminderRules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-slate-950/80 border rounded-xl p-4 space-y-3 transition-all ${
                  rule.enabled ? 'border-amber-500/40' : 'border-slate-800 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleReminderRule(rule.id)}
                      className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                        rule.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md"></span>
                    </button>
                    <div>
                      <span className="text-xs font-bold text-white block">{rule.label}</span>
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-0.5">
                        Étape : {rule.stageLabel || rule.stageCondition}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestReminderRule(rule.id)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-amber-300" />
                    <span>Tester Relance</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={rule.messageText}
                  onChange={(e) => {
                    const updated = reminderRules.map((r) =>
                      r.id === rule.id ? { ...r, messageText: e.target.value } : r
                    );
                    setReminderRules(updated);
                    reminderService.saveRules(updated);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
