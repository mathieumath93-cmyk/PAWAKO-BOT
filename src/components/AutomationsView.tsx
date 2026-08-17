import React, { useState } from 'react';
import { Zap, Plus, CheckCircle2, Play, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { AutomationRule } from '../types';
import { automationService } from '../services/automationService';

interface AutomationsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({ onShowToast }) => {
  const [rules, setRules] = useState<AutomationRule[]>(automationService.getRules());

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Système d'Automatisation Visuel</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Déclenchez des actions automatiques selon les événements du serveur Discord.
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
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

              <button
                onClick={() => handleDelete(rule.id, rule.name)}
                className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Flow Nodes: WHEN -> IF -> THEN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* WHEN Node */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">WHEN (Déclencheur)</span>
                <div className="text-xs font-bold text-slate-200 capitalize">{rule.trigger.replace('_', ' ')}</div>
              </div>

              {/* IF Node */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">IF (Condition)</span>
                <div className="text-xs font-bold text-slate-200 font-mono">
                  {rule.condition === 'score_gte' ? `Score >= ${rule.conditionValue}` : rule.condition}
                </div>
              </div>

              {/* THEN Node */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">THEN ({rule.actions.length} Actions)</span>
                <div className="space-y-1">
                  {rule.actions.map((act, i) => (
                    <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="capitalize font-mono">{act.type.replace('_', ' ')} : {act.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
