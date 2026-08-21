import React, { useState } from 'react';
import { Zap, Plus, CheckCircle2, Play, Trash2, ArrowRight, Sparkles, X, ShieldAlert, BookOpen, Lock } from 'lucide-react';
import { AutomationRule, AutomationAction, TrainingModule, Quiz } from '../types';
import { automationService } from '../services/automationService';
import { discordService } from '../services/discordService';
import { OnboardingFlowConfigurator } from './OnboardingFlowConfigurator';
import { MemberJourneySimulator } from './MemberJourneySimulator';

interface AutomationsViewProps {
  modules?: TrainingModule[];
  quizzes?: Quiz[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  modules = [],
  quizzes = [],
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'rules'>('onboarding');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const [rules, setRules] = useState<AutomationRule[]>(automationService.getRules());
  const [showModal, setShowModal] = useState(false);
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  // Form State for new Automation
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<AutomationRule['trigger']>('quiz_completed');
  const [condition, setCondition] = useState<AutomationRule['condition']>('score_gte');
  const [conditionValue, setConditionValue] = useState<string | number>(16);

  // Form State for Actions
  const [actions, setActions] = useState<AutomationAction[]>([]);

  const handleTestRule = async (rule: AutomationRule) => {
    setTestingRuleId(rule.id);
    onShowToast('Exécution Automatisation...', `Déclenchement des actions pour "${rule.name}" sur Discord`, 'info');

    try {
      const res = await automationService.executeRule(rule, { memberName: 'Alex' });

      onShowToast(
        'Automatisation Exécutée 🚀',
        `Règle "${rule.name}" déclenchée (${res.executedActionsCount} actions exécutées) : ${res.details.join(' • ')}`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Erreur Exécution', err?.message || 'Échec du déclenchement de l\'automatisation', 'info');
    } finally {
      setTestingRuleId(null);
    }
  };

  const handleToggle = (id: string) => {
    const updated = automationService.toggleRule(id);
    setRules([...automationService.getRules()]);
    onShowToast(`Règle ${updated.enabled ? 'activée' : 'désactivée'}`, updated.name, 'info');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Voulez-vous supprimer l'automatisation "${name}" ?`)) {
      automationService.deleteRule(id);
      setRules([...automationService.getRules()]);
      onShowToast('Automatisation supprimée', name, 'info');
    }
  };

  const handleAddAction = () => {
    setActions([
      ...actions,
      { type: 'send_message', target: '#general', payload: 'Message automatique' },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (index: number, key: keyof AutomationAction, val: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [key]: val };
    setActions(updated);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Champs Requis', 'Veuillez renseigner le nom de l\'automatisation', 'info');
      return;
    }

    const newRule = automationService.addRule({
      name: name.trim(),
      description: description.trim() || 'Automatisation personnalisée.',
      enabled: true,
      trigger,
      condition,
      conditionValue: Number(conditionValue) || conditionValue,
      actions,
    });

    setRules([...automationService.getRules()]);
    setShowModal(false);
    // Reset Form
    setName('');
    setDescription('');
    setActions([]);
    onShowToast('Automatisation Créée', `La règle "${newRule.name}" est active.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Automatisations & Parcours Onboarding Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configurez le flux de bienvenue, les créations de salons personnels, la progression par rôles et les règles visuelles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Simulateur Membre</span>
          </button>

          {activeTab === 'rules' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Créer Règle</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('onboarding')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'onboarding'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-indigo-300" />
          <span>Parcours Onboarding & Rôles Serveur</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Règles d'Automatisation IF/THEN ({rules.length})</span>
        </button>
      </div>

      {/* Tab 1: Onboarding Flow Configurator */}
      {activeTab === 'onboarding' && (
        <OnboardingFlowConfigurator
          modules={modules}
          onShowToast={onShowToast}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />
      )}

      {/* Tab 2: Visual IF/THEN Automation Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Zap className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aucune automatisation configurée</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cliquez sur le bouton ci-dessus pour ajouter votre première règle d'automatisation personnalisée.
              </p>
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-slate-900/80 border rounded-2xl p-6 space-y-4 shadow-xl transition-all ${
                  rule.enabled ? 'border-slate-800' : 'border-slate-800/40 opacity-75'
                }`}
              >
                {/* Rule Title Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(rule.id)}
                      className={`w-10 h-6 rounded-full transition-colors p-1 flex items-center ${
                        rule.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                    </button>

                    <div>
                      <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                      <p className="text-xs text-slate-400">{rule.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={testingRuleId === rule.id}
                      onClick={() => handleTestRule(rule)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Tester la publication de cette règle sur Discord"
                    >
                      <Zap className={`w-3.5 h-3.5 ${testingRuleId === rule.id ? 'animate-spin' : ''}`} />
                      <span>{testingRuleId === rule.id ? 'Test en cours...' : 'Tester sur Discord'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
                      title="Supprimer la règle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Flow Nodes: WHEN -> IF -> THEN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">WHEN (Déclencheur)</span>
                    <div className="text-xs font-bold text-slate-200 capitalize">{rule.trigger.replace('_', ' ')}</div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">IF (Condition)</span>
                    <div className="text-xs font-bold text-slate-200">
                      {rule.condition === 'always' ? 'Toujours Vrai' : `${rule.condition} : ${rule.conditionValue}`}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">THEN (Actions)</span>
                    <div className="space-y-1">
                      {rule.actions.map((act, i) => (
                        <div key={i} className="text-[11px] text-emerald-300 font-mono flex items-center gap-1">
                          <span>• {act.type.replace('_', ' ')} :</span>
                          <span className="font-bold text-white">{act.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal to Create New IF/THEN Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Créer une Règle d'Automatisation</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Nom de la règle
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Attribution Rôle Senior sur Quiz 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Attribution automatique lorsque le score est supérieur à 16"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Déclencheur (WHEN)
                  </label>
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="quiz_completed">Quiz Terminé</option>
                    <option value="module_completed">Module Validé</option>
                    <option value="member_joined">Nouveau Membre</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Condition (IF)
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="score_gte">Score ≥ Valeur</option>
                    <option value="score_lt">Score &lt; Valeur</option>
                    <option value="always">Toujours exécuter</option>
                  </select>
                </div>
              </div>

              {condition !== 'always' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Valeur de la condition (ex: Score)
                  </label>
                  <input
                    type="number"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {/* Actions List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>ACTIONS DISCORD (THEN)</span>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> + Action
                  </button>
                </div>

                {actions.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={act.type}
                        onChange={(e) => handleUpdateAction(idx, 'type', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                      >
                        <option value="add_role">Ajouter un Rôle</option>
                        <option value="remove_role">Retirer un Rôle</option>
                        <option value="send_message">Envoyer un Message</option>
                        <option value="unlock_module">Débloquer un Module</option>
                        <option value="send_dm">Envoyer un Message Privé (MP)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveAction(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Cible (ex: Rôle ou #general)"
                      value={act.target || ''}
                      onChange={(e) => handleUpdateAction(idx, 'target', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  Créer la Règle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Journey Interactive Simulator Modal */}
      <MemberJourneySimulator
        isOpen={isSimulatorOpen}
        modules={modules}
        quizzes={quizzes}
        onClose={() => setIsSimulatorOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
};
