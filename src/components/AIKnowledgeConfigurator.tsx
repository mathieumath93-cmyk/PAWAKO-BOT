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
} from 'lucide-react';
import {
  aiKnowledgeService,
  defaultFanPrompt,
  generateAIResponse,
} from '../services/aiKnowledgeService';
import { AiPromptConfig } from '../types';

interface AIKnowledgeConfiguratorProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const AIKnowledgeConfigurator: React.FC<AIKnowledgeConfiguratorProps> = ({ onShowToast }) => {
  const [promptCfg, setPromptCfg] = useState<AiPromptConfig>(aiKnowledgeService.getPromptConfig());
  const [activeTab, setActiveTab] = useState<'prompt' | 'sandbox'>('prompt');

  // Sandbox testing state
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'grok'; text: string }>>([
    {
      sender: 'grok',
      text: "📌 **CONTEXTE DE DÉPART DE LA SIMULATION** :\nTu passes maintenant à la partie simulation !\n\nOn passe à la simu, tu es le chatteur je suis le fan. Je suis un new fan qui viens de s'abonner et je n'ai pas répondu au message de relance automatique. À toi de le relancer pour qu'il réponde !",
    },
  ]);
  const [testInput, setTestInput] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      'Le prompt de simulation et les clés OpenRouter (Grok) sont enregistrés.',
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

  const handleResetSandbox = () => {
    setChatHistory([
      {
        sender: 'grok',
        text: "📌 **CONTEXTE DE DÉPART DE LA SIMULATION** :\nTu passes maintenant à la partie simulation !\n\nOn passe à la simu, tu es le chatteur je suis le fan. Je suis un new fan qui viens de s'abonner et je n'ai pas répondu au message de relance automatique. À toi de le relancer pour qu'il réponde !",
      },
    ]);
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
              <span>Configuration IA Simulation & OpenRouter (Grok)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                x-ai / Grok
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuration directe vers l'API OpenRouter avec le modèle Grok pour la simulation des candidats.
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
          <span>Prompt de Simulation & OpenRouter API</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'sandbox'
              ? 'bg-indigo-600/20 text-indigo-300 border-t border-x border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400" />
          <span>Bac à Sable Live (Test Direct Grok)</span>
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
                <label className="text-xs font-bold text-slate-300 block">Modèle / Routing OpenRouter</label>
                <select
                  value={promptCfg.modelName || 'openrouter/auto'}
                  onChange={(e) => setPromptCfg({ ...promptCfg, modelName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="openrouter/auto">openrouter/auto (Auto-Routing Intelligent & Repli)</option>
                  <option value="x-ai/grok-2">x-ai/grok-2 (Grok 2 - Recommandé)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (Non-Censuré / Uncensored)</option>
                  <option value="mistralai/mistral-large-2411">mistralai/mistral-large-2411 (Mistral Large)</option>
                  <option value="gryphe/mythomax-l2-13b">gryphe/mythomax-l2-13b (Roleplay Uncensored)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  OpenRouter choisit ou bascule automatiquement vers les modèles tolérant le contenu adulte & explicite sans erreur.
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

      {/* TAB 2: PLAYGROUND / SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Bac à Sable — Test Direct en Temps Réel</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulez une discussion avec Grok via OpenRouter en utilisant votre prompt.
              </p>
            </div>
            <button
              onClick={handleResetSandbox}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              Effacer la discussion
            </button>
          </div>

          {/* Chat Messages */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-[420px] overflow-y-auto space-y-3 font-sans">
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
                <span>Grok (OpenRouter) est en train de répondre...</span>
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
      )}
    </div>
  );
};
