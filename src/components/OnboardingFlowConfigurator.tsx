import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Lock,
  MessageSquare,
  Shield,
  HelpCircle,
  Hash,
  Clock,
  Shuffle,
  EyeOff,
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
      console.error('[PreFlight Error]', err);
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
    onShowToast('Étape de Module Enregistrée', `Paramètres pour ${updatedStep.moduleTitle} mis à jour.`, 'info');
  };

  const currentStep = config.stepConfigs.find((s) => s.moduleId === selectedModuleTab) || {
    moduleId: selectedModuleTab,
    moduleTitle: modules.find((m) => m.id === selectedModuleTab)?.title || 'Module de formation',
    directivesText: 'Lisez les consignes avant de lancer le quiz.',
    externalLinkUrl: 'https://docs.pawako.com/guide',
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

        <div className="flex items-center gap-3 shrink-0">
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

        {/* Section 2: Mode QuizBot & Regles de Quiz */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Paramètres du Moteur de Quiz (Mode QuizBot)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cooldown minutes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Délai de Cooldown en cas d'Échec (min)</span>
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={config.cooldownMinutes}
                onChange={(e) => setConfig({ ...config, cooldownMinutes: parseInt(e.target.value) || 15 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
              <p className="text-[10px] text-slate-500">Ex: 15 minutes avant de pouvoir repasser un quiz échoué.</p>
            </div>

            {/* Randomize Questions */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ordre Aléatoire</span>
                </label>
                <p className="text-[10px] text-slate-500">Mélanger les questions à chaque tentative</p>
              </div>
              <input
                type="checkbox"
                checked={config.randomizeQuestions}
                onChange={(e) => setConfig({ ...config, randomizeQuestions: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Hide Quiz Solutions */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Masquer la Correction</span>
                </label>
                <p className="text-[10px] text-slate-500">Ne pas afficher les bonnes réponses en cas d'échec</p>
              </div>
              <input
                type="checkbox"
                checked={config.hideQuizSolutions}
                onChange={(e) => setConfig({ ...config, hideQuizSolutions: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
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

      {/* Section 3: Configuration par Module (Rôles & Progression) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            3. Configuration des Rôles Discord par Module
          </h3>
        </div>

        {/* Module Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
          {modules.map((mod, idx) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedModuleTab(mod.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                selectedModuleTab === mod.id
                  ? 'bg-indigo-600 text-white border-t border-x border-indigo-500'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-b border-slate-800'
              }`}
            >
              <span>Module {idx + 1}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Selected Module Config Form */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-sm font-bold text-indigo-300">
              Paramètres pour : {currentStep.moduleTitle}
            </h4>
            <span className="text-[11px] font-mono text-slate-500">ID: {currentStep.moduleId}</span>
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
    </div>
  );
};
