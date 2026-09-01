import React, { useState, useEffect } from 'react';
import {
  Brain,
  Key,
  Sliders,
  Save,
  RotateCcw,
  Sparkles,
  Send,
  Play,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Lock,
  Unlock,
  Target,
  Award,
  CheckSquare,
  XCircle,
  FileText,
  BarChart3,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  aiKnowledgeService,
  defaultFanPrompt,
  generateAIResponse,
  evaluateSimulationSession,
  defaultValidationGridPrompt,
} from '../services/aiKnowledgeService';
import { AiPromptConfig, SimulationEvaluationResult } from '../types';

interface AIKnowledgeConfiguratorProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const AIKnowledgeConfigurator: React.FC<AIKnowledgeConfiguratorProps> = ({ onShowToast }) => {
  const [promptCfg, setPromptCfg] = useState<AiPromptConfig>(aiKnowledgeService.getPromptConfig());
  const [activeTab, setActiveTab] = useState<'prompt' | 'criteria' | 'sandbox'>('prompt');

  // Sandbox testing state
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'grok'; text: string }>>([
    {
      sender: 'grok',
      text: "📌 **CONTEXTE DE DÉPART DE LA SIMULATION** :\nTu passes maintenant à la partie simulation !\n\nOn passe à la simu, tu es le chatteur je suis le fan. Je suis un new fan qui viens de s'abonner et je n'ai pas répondu au message de relance automatique. À toi de le relancer pour qu'il réponde !",
    },
  ]);
  const [testInput, setTestInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<SimulationEvaluationResult | null>(null);

  useEffect(() => {
    const unsubscribe = aiKnowledgeService.subscribe(() => {
      setPromptCfg(aiKnowledgeService.getPromptConfig());
    });
    return () => unsubscribe();
  }, []);

  const handleSave = () => {
    aiKnowledgeService.updatePromptConfig(promptCfg);
    onShowToast(
      'Configuration IA Enregistrée !',
      'Le prompt de simulation, le barème et la clé OpenRouter sont enregistrés.',
      'success'
    );
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser le prompt de simulation et les paramètres par défaut ?')) {
      aiKnowledgeService.resetToDefaults();
      onShowToast('Réinitialisation Effectuée', 'Le prompt de simulation par défaut a été restauré.', 'info');
    }
  };

  const handleSendTestMessage = async () => {
    if (!testInput.trim() || isSending) return;

    const userMsg = testInput.trim();
    setTestInput('');

    const newHistory = [...chatHistory, { sender: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsSending(true);

    try {
      const historyForApi = newHistory
        .filter((h) => h.sender === 'user' || h.sender === 'grok')
        .map((h) => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.text,
        }));

      const reply = await generateAIResponse(userMsg, historyForApi.slice(0, -1));
      setChatHistory([...newHistory, { sender: 'grok', text: reply }]);
    } catch (err: any) {
      setChatHistory([
        ...newHistory,
        {
          sender: 'grok',
          text: `❌ **Erreur OpenRouter/Grok** : ${err?.message || 'Impossible de se connecter à OpenRouter.'}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleEvaluateChat = async () => {
    if (chatHistory.length <= 1 || isEvaluating) return;

    setIsEvaluating(true);
    setEvalResult(null);

    try {
      const historyForApi = chatHistory.map((h) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      }));

      const result = await evaluateSimulationSession(historyForApi);
      setEvalResult(result);
      onShowToast(
        result.passed ? '🎉 Simulation Validée !' : '❌ Simulation Non Validée',
        `Score : ${result.totalScore}/100 (Minimum requis : ${result.passingScore}/100)`,
        result.passed ? 'success' : 'info'
      );
    } catch (err: any) {
      onShowToast('Erreur Évaluation', err?.message || 'Échec de l\'analyse.', 'info');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetSandbox = () => {
    setChatHistory([
      {
        sender: 'grok',
        text: "📌 **CONTEXTE DE DÉPART DE LA SIMULATION** :\nTu passes maintenant à la partie simulation !\n\nOn passe à la simu, tu es le chatteur je suis le fan. Je suis un new fan qui viens de s'abonner et je n'ai pas répondu au message de relance automatique. À toi de le relancer pour qu'il réponde !",
      },
    ]);
    setEvalResult(null);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Configuration IA & Barème de Validation Simulation</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                Barème 80/100 Requis
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Définition des règles, des limites de validation/échec et test en direct de l'évaluation Grok.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'prompt'
              ? 'bg-indigo-600/20 text-indigo-300 border-t border-x border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Prompt Fan & Alertes Coach</span>
        </button>

        <button
          onClick={() => setActiveTab('criteria')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'criteria'
              ? 'bg-emerald-600/20 text-emerald-300 border-t border-x border-emerald-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Target className="w-4 h-4 text-emerald-400" />
          <span>🎯 Barème & Limites de Validation</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'sandbox'
              ? 'bg-amber-600/20 text-amber-300 border-t border-x border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Play className="w-4 h-4 text-amber-400" />
          <span>Bac à Sable & Test Évaluation Live</span>
        </button>
      </div>

      {/* TAB 1: PROMPT & OPENROUTER CONFIG */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          {/* OpenRouter API Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Paramètres OpenRouter & Choix du Modèle</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Clé d'API OpenRouter (<code className="text-amber-400">OPENROUTER_API_KEY</code>)
                </label>
                <input
                  type="password"
                  value={promptCfg.openRouterApiKey}
                  onChange={(e) => setPromptCfg({ ...promptCfg, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxx..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  Insérez votre clé OpenRouter pour faire fonctionner la simulation Grok sur Discord et le web.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Modèle / Engine d'IA</label>
                <select
                  value={promptCfg.modelName || '@preset/pawako-bot'}
                  onChange={(e) => setPromptCfg({ ...promptCfg, modelName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="@preset/pawako-bot">@preset/pawako-bot (Preset OpenRouter PAWAKO - Défaut)</option>
                  <option value="openrouter/auto">openrouter/auto (OpenRouter Auto-Routing)</option>
                  <option value="gemini-3.7-flash">gemini-3.7-flash (Gemini API Flash)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (Llama 3.3 70B)</option>
                  <option value="x-ai/grok-2">x-ai/grok-2 (Grok 2)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Le flux de la simulation est directement routé vers votre preset OpenRouter <code className="text-amber-400">@preset/pawako-bot</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Simulation Prompt */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Prompt de Simulation Fan Unique
                </h2>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800 font-mono">
                Envoyé à OpenRouter (Grok)
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Ce prompt définit le comportement du fan lors de toutes les simulations Discord et Web.
            </p>

            <textarea
              rows={18}
              value={promptCfg.fanPrompt}
              onChange={(e) => setPromptCfg({ ...promptCfg, fanPrompt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Intervention Rules Prompt */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Règles d'Intervention selon les Modules
                </h2>
              </div>
              <span className="text-[10px] font-bold text-rose-300 bg-rose-950 px-2.5 py-1 rounded-full border border-rose-800 font-mono">
                Alertes Erreurs Fatales
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Définit quand l'IA doit exceptionnellement intervenir pour envoyer une alerte de correction au candidat (uniquement en cas d'erreur fatale).
            </p>

            <textarea
              rows={14}
              value={promptCfg.analyzerPrompt}
              onChange={(e) => setPromptCfg({ ...promptCfg, analyzerPrompt: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      )}

      {/* TAB 2: CRITERIA & VALIDATION LIMITS */}
      {activeTab === 'criteria' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Threshold Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Grille Officielle de Validation de Simulation</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                      SEUIL MIN : 80 / 100
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Conditions précises nécessaires pour qu'un candidat réussisse le test d'entretien de simulation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Score minimum requis :</span>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={promptCfg.minPassingScore || 80}
                  onChange={(e) => setPromptCfg({ ...promptCfg, minPassingScore: parseInt(e.target.value) || 80 })}
                  className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">/ 100</span>
              </div>
            </div>

            {/* 5 Evaluation Criteria Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> 1. Qualification du Fan
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    20 Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Récolter au moins 3 à 4 informations clés (Prénom, Âge/Ville, Métier, Fantasme) avant de proposer un PPV payant.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> 2. Progression & GFE
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    20 Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Respecter la courbe naturelle (Accueil &rarr; Flirt léger GFE &rarr; Sexualisation progressive &rarr; Excitation).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> 3. Teasing & Prix PPV
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    20 Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Description ultra-chaude, image mentale visuelle et incitative avec une annonce claire du prix.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> 4. Gestion des Refus
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    20 Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Application de la technique <strong>Bouclier + Épée</strong> (ne pas baisser le prix au 1er refus, valoriser avec un média bonus).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> 5. Follow-Up & Relance
                  </span>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    20 Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Message d'accompagnement immédiat et chaleureux juste après l'envoi du PPV.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    🏆 Score Maximal
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">100 Points</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Un candidat obtenant 80 pts ou plus sans faute grave valide la simulation.
                </p>
              </div>
            </div>
          </div>

          {/* Eliminatory Causes / Fail Conditions */}
          <div className="bg-slate-900/90 border border-rose-900/50 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2 border-b border-rose-900/40 pb-3">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Clauses Éliminatoires (ÉCHEC DIRECT / NON VALIDÉ - SCORE 0/100)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>1. Insultes / Agressivité</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tout mot vulgaire agressif, insulte ou mépris direct vers le fan entraîne l'arrêt immédiat et l'échec de la simulation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>2. Média Gratuit Sans Teasing</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Offrir du contenu intime ou du visuel dénudé sans contrepartie financière ni stratégie de vente.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>3. Alertes Coach Répétées</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Plus de 5 interventions d'alerte du Coach déclenchées au cours de la session.
                </p>
              </div>
            </div>
          </div>

          {/* Attempts & Post-Validation Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-400" />
                <span>🔄 5 Tentatives Autorisées par Candidat</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Chaque candidat a droit à <strong>5 tentatives au total</strong> pour réussir la simulation.
                En cas d'échec (score &lt; 80/100 ou alerte éliminatoire), le candidat peut repasser une nouvelle tentative jusqu'à la 5<sup>ème</sup>.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>🚀 Workflow Post-Validation (Formation Outils)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dès que la simulation est validée (score &ge; 80/100 ou validation manuelle par le Staff) :
                <br />
                • Le candidat est convoqué pour la <strong>Formation Outils à 10h00 HF</strong>.
                <br />
                • Son salon privé reçoit l'embed de convocation avec le lien du salon vocal/Meet.
                <br />
                • L'équipe Staff (<strong>Mahsa &amp; Mathieu</strong>) est immédiatement notifiée sur Discord (salon <code className="text-emerald-300">#staff-alerts</code> et MP).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAYGROUND / SANDBOX WITH EVALUATOR */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>Bac à Sable — Test Direct & Évaluation IA</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Discutez avec Grok puis cliquez sur "Évaluer la Simulation" pour tester le barème automatique.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEvaluateChat}
                  disabled={isEvaluating || chatHistory.length <= 1}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{isEvaluating ? 'Évaluation...' : '🎯 Évaluer la Simulation'}</span>
                </button>

                <button
                  onClick={handleResetSandbox}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[380px] overflow-y-auto space-y-3 font-sans">
              {chatHistory.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'grok' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      G
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      C
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold italic p-2">
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>Grok est en train de répondre...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTestMessage()}
                placeholder="Envoyer un message de la créatrice (ex: 'Coucou toi, bienvenu !')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSendTestMessage}
                disabled={isSending || !testInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer</span>
              </button>
            </div>
          </div>

          {/* EVALUATION REPORT DISPLAY */}
          {evalResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      evalResult.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {evalResult.passed ? <Award className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Rapport d'Évaluation de la Simulation</span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold border ${
                          evalResult.passed
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-950 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {evalResult.passed ? '🏆 SIMULATION VALIDÉE' : '❌ SIMULATION ÉCHOUÉE'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{evalResult.globalVerdict}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-white">
                    <span className={evalResult.passed ? 'text-emerald-400' : 'text-rose-400'}>
                      {evalResult.totalScore}
                    </span>
                    <span className="text-slate-500 text-sm"> / 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Requis : {evalResult.passingScore} pts</span>
                </div>
              </div>

              {/* Criteria Progress Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Détail du Barème par Critère :
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evalResult.criteria.map((crit) => (
                    <div key={crit.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{crit.name}</span>
                        <span className="font-mono font-bold text-indigo-400">
                          {crit.score} / {crit.maxPoints} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            crit.score >= crit.maxPoints * 0.8 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${(crit.score / crit.maxPoints) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 italic">{crit.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {evalResult.recommendations && evalResult.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300">💡 Recommandations du Coach :</h4>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {evalResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
