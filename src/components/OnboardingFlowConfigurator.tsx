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
  Plus,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { OnboardingFlowConfig, ModuleStepConfig, TrainingModule } from '../types';
import { onboardingService } from '../services/onboardingService';
import { discordService } from '../services/discordService';
import { roleService } from '../services/roleService';

interface OnboardingFlowConfiguratorProps {
  modules: TrainingModule[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
  onOpenSimulator?: () => void;
}

export const OnboardingFlowConfigurator: React.FC<OnboardingFlowConfiguratorProps> = ({
  modules,
  onShowToast,
  onOpenSimulator,
}) => {
  const [config, setConfig] = useState<OnboardingFlowConfig>(onboardingService.getConfig());
  const [selectedModuleTab, setSelectedModuleTab] = useState<string>(modules[0]?.id || 'mod-1');

  const serverChannels = discordService.getChannels();
  const serverRoles = roleService.getRoles();

  const handleSaveMainConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onboardingService.updateConfig(config);
    onShowToast('Configuration Enregistrée', 'Le parcours d\'onboarding et les rôles du serveur ont été mis à jour.', 'success');
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
    roleOnStartName: 'Trainee',
    roleOnPassName: 'Junior',
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
            Personnalisez le flux complet : salon de bienvenue, création de salons personnels, messages avec règles, attribution automatique de vos rôles Discord et cooldowns de quiz.
          </p>
        </div>

        {onOpenSimulator && (
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tester en Simulateur Membre</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSaveMainConfig} className="space-y-6">
        {/* Section 1: Accueil & Salon Personnel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Salon de Bienvenue & Salon Personnel
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Salon de Bienvenue */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Salon de Bienvenue Général</span>
              </label>
              {serverChannels.length > 0 ? (
                <select
                  value={config.welcomeChannelName}
                  onChange={(e) => setConfig({ ...config, welcomeChannelName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {serverChannels.map((chan) => {
                    const nameFormatted = `#${chan.name.replace(/^#/, '')}`;
                    return (
                      <option key={chan.id} value={nameFormatted}>
                        {nameFormatted} ({chan.categoryName || 'DISCORD'})
                      </option>
                    );
                  })}
                  {!serverChannels.some((c) => `#${c.name.replace(/^#/, '')}` === config.welcomeChannelName) && (
                    <option value={config.welcomeChannelName}>{config.welcomeChannelName}</option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.welcomeChannelName}
                  onChange={(e) => setConfig({ ...config, welcomeChannelName: e.target.value })}
                  placeholder="#bienvenue"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              )}
              <p className="text-[10px] text-slate-500">
                Salon où les nouveaux arrivants voient le premier bouton de bienvenue.
              </p>
            </div>

            {/* Libellé du Bouton sur #bienvenue */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Bouton de Démarrage sur Bienvenue
              </label>
              <input
                type="text"
                value={config.welcomeButtonLabel}
                onChange={(e) => setConfig({ ...config, welcomeButtonLabel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[10px] text-slate-500">
                Ex: "Commencer la formation" — Déclenche la création du salon personnel.
              </p>
            </div>

            {/* Préfixe du Salon Personnel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Préfixe du Salon Personnel Membre</span>
              </label>
              <input
                type="text"
                value={config.personalChannelPrefix}
                onChange={(e) => setConfig({ ...config, personalChannelPrefix: e.target.value })}
                placeholder="formation-"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[10px] text-slate-500">
                Format généré : <code className="text-indigo-400">🔒-formation-[pseudo]</code>
              </p>
            </div>

            {/* Rôle Initial Attribution */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rôle Initial Attribué à l'Arrivée</span>
              </label>
              {serverRoles.length > 0 ? (
                <select
                  value={config.initialRoleName}
                  onChange={(e) => {
                    const match = serverRoles.find((r) => r.name === e.target.value);
                    setConfig({
                      ...config,
                      initialRoleName: e.target.value,
                      initialRoleId: match?.id || config.initialRoleId,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {serverRoles.map((role) => (
                    <option key={role.id} value={role.name}>
                      @{role.name}
                    </option>
                  ))}
                  {!serverRoles.some((r) => r.name === config.initialRoleName) && (
                    <option value={config.initialRoleName}>@{config.initialRoleName}</option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.initialRoleName}
                  onChange={(e) => setConfig({ ...config, initialRoleName: e.target.value })}
                  placeholder="Trainee"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              )}
              <p className="text-[10px] text-slate-500">
                Rôle attribué au clic sur "Lancer la formation" dans le salon personnel.
              </p>
            </div>
          </div>

          {/* Message de Bienvenue & Règles */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Message de Bienvenue & Consignes (Posté dans le salon personnel)</span>
            </label>
            <textarea
              rows={4}
              value={config.welcomeRulesMessage}
              onChange={(e) => setConfig({ ...config, welcomeRulesMessage: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
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
            {/* Temps de Cooldown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Délai d'Attente après Échec (Minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={config.cooldownMinutes}
                onChange={(e) => setConfig({ ...config, cooldownMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Temps à attendre avant de pouvoir retenter le quiz (ex: 15 min).
              </p>
            </div>

            {/* Randomisation */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.randomizeQuestions}
                  onChange={(e) => setConfig({ ...config, randomizeQuestions: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ordre Aléatoire (Questions & Choix)</span>
                </span>
              </label>
              <p className="text-[10px] text-slate-400 leading-tight">
                Mélange automatiquement l'ordre des questions et des options de réponse à chaque essai.
              </p>
            </div>

            {/* Solutions Masquées */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hideQuizSolutions}
                  onChange={(e) => setConfig({ ...config, hideQuizSolutions: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Masquer les Bonnes Réponses</span>
                </span>
              </label>
              <p className="text-[10px] text-slate-400 leading-tight">
                Ne montre jamais quelles questions étaient fausses ni les corrections pour éviter la triche.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Configuration Étape par Étape (Pipeline par Module) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Progression Linéaire & Rôles par Module
              </h3>
            </div>
          </div>

          {/* Module Step Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
            {modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModuleTab(mod.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedModuleTab === mod.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-900/80 text-[10px] font-mono flex items-center justify-center border border-slate-700">
                  {idx + 1}
                </span>
                <span>{mod.title.split(':')[0] || mod.title}</span>
              </button>
            ))}
          </div>

          {/* Selected Step Form */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                Étape : {currentStep.moduleTitle}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rôle Attribué au Démarrage du Module */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rôle Attribué au Démarrage de ce Module</span>
                </label>
                {serverRoles.length > 0 ? (
                  <select
                    value={currentStep.roleOnStartName || 'Trainee'}
                    onChange={(e) => {
                      const r = serverRoles.find((role) => role.name === e.target.value);
                      handleUpdateStepConfig({
                        ...currentStep,
                        roleOnStartName: e.target.value,
                        roleOnStartId: r?.id || currentStep.roleOnStartId,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {serverRoles.map((r) => (
                      <option key={r.id} value={r.name}>
                        @{r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={currentStep.roleOnStartName || ''}
                    onChange={(e) =>
                      handleUpdateStepConfig({ ...currentStep, roleOnStartName: e.target.value })
                    }
                    placeholder="Trainee"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Rôle Attribué en cas de Réussite au Quiz */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rôle Attribué à la Validation du Quiz</span>
                </label>
                {serverRoles.length > 0 ? (
                  <select
                    value={currentStep.roleOnPassName || 'Junior'}
                    onChange={(e) => {
                      const r = serverRoles.find((role) => role.name === e.target.value);
                      handleUpdateStepConfig({
                        ...currentStep,
                        roleOnPassName: e.target.value,
                        roleOnPassId: r?.id || currentStep.roleOnPassId,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {serverRoles.map((r) => (
                      <option key={r.id} value={r.name}>
                        @{r.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={currentStep.roleOnPassName || ''}
                    onChange={(e) =>
                      handleUpdateStepConfig({ ...currentStep, roleOnPassName: e.target.value })
                    }
                    placeholder="Junior"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>
            </div>

            {/* Directives & Lien Externe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Consignes & Directives Spécifiques du Module
                </label>
                <textarea
                  rows={2}
                  value={currentStep.directivesText || ''}
                  onChange={(e) =>
                    handleUpdateStepConfig({ ...currentStep, directivesText: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Lien Externe de la Formation (Support / SaaS / Doc)</span>
                </label>
                <input
                  type="text"
                  value={currentStep.externalLinkUrl || ''}
                  onChange={(e) =>
                    handleUpdateStepConfig({ ...currentStep, externalLinkUrl: e.target.value })
                  }
                  placeholder="https://docs.pawako.com/module1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Messages Sur-Mesure de Réussite & Échec */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-400">
                  Message de Réussite (Déblocage du Module Suivant)
                </label>
                <input
                  type="text"
                  value={currentStep.successMessage || ''}
                  onChange={(e) =>
                    handleUpdateStepConfig({ ...currentStep, successMessage: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Variables disponibles : <code className="text-emerald-400">{'{score}'}</code>, <code className="text-emerald-400">{'{maxScore}'}</code>.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-rose-400">
                  Message d'Échec (Activation du Cooldown 15 Min)
                </label>
                <input
                  type="text"
                  value={currentStep.failureMessage || ''}
                  onChange={(e) =>
                    handleUpdateStepConfig({ ...currentStep, failureMessage: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Variables disponibles : <code className="text-rose-400">{'{score}'}</code>, <code className="text-rose-400">{'{cooldown}'}</code>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la Configuration Onboarding & Rôles</span>
          </button>
        </div>
      </form>
    </div>
  );
};
