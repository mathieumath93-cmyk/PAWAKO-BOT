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
  MessageSquare,
  Plus,
  Trash2,
  Radio,
  Gamepad2,
  Lightbulb,
  Zap,
  Settings2,
  Music,
  Power,
  PowerOff,
  HelpCircle,
  Check,
  CheckCheck,
  Search,
} from 'lucide-react';
import {
  aiKnowledgeService,
  defaultFanPrompt,
  generateAIResponse,
  evaluateSimulationSession,
  defaultValidationGridPrompt,
  defaultCmConfig,
} from '../services/aiKnowledgeService';
import { AiPromptConfig, SimulationEvaluationResult, AiCmConfig, FaqItem, FaqStatus } from '../types';
import { store } from '../services/store';
import { faqService } from '../services/faqService';
import { discordService } from '../services/discordService';

interface AIKnowledgeConfiguratorProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const AIKnowledgeConfigurator: React.FC<AIKnowledgeConfiguratorProps> = ({ onShowToast }) => {
  const [promptCfg, setPromptCfg] = useState<AiPromptConfig>(aiKnowledgeService.getPromptConfig());
  const [activeTab, setActiveTab] = useState<'prompt' | 'cm' | 'faq' | 'criteria' | 'sandbox'>('prompt');

  // FAQ state
  const [faqs, setFaqs] = useState<FaqItem[]>(store.getFaqItems());
  const [faqFilter, setFaqFilter] = useState<'all' | 'proposee' | 'approuvee' | 'rejetee'>('all');
  const [isScanningFaq, setIsScanningFaq] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isCreatingFaq, setIsCreatingFaq] = useState(false);
  const [newFaqData, setNewFaqData] = useState<Partial<FaqItem>>({
    category: 'Règlement & Quiz',
    rephrasedQuestion: '',
    answer: '',
    sources: ['Règlement Officiel'],
    confidence: 'elevee',
  });

  useEffect(() => {
    const unsubStore = store.subscribe(() => {
      setFaqs(store.getFaqItems());
    });
    return () => unsubStore();
  }, []);

  const handleScanDiscordQuestions = async () => {
    setIsScanningFaq(true);
    try {
      const channels = discordService.getChannels();
      const mockChans = channels.map((c) => ({
        id: c.id,
        name: c.name,
        fetchMessages: async () => [],
      }));
      const generated = await faqService.scanAndGenerateFaqSuggestions(mockChans);
      setFaqs(store.getFaqItems());
      onShowToast(
        'Analyse Discord Terminée 🤖',
        `${generated.length} question(s) récurrente(s) analysée(s) pour validation Staff.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Erreur Scan FAQ', err?.message || 'Impossible d\'analyser les salons', 'info');
    } finally {
      setIsScanningFaq(false);
    }
  };

  const handleApproveFaq = async (id: string) => {
    const approved = store.approveFaqItem(id, 'Staff Dashboard');
    if (approved) {
      await faqService.publishApprovedFaqToDiscord(id);
      setFaqs(store.getFaqItems());
      onShowToast('FAQ Approuvée & Publiée', 'La question a été publiée dans le salon Discord #faq !', 'success');
    }
  };

  const handleRejectFaq = (id: string) => {
    store.rejectFaqItem(id, 'Staff Dashboard');
    setFaqs(store.getFaqItems());
    onShowToast('FAQ Rejetée', 'La proposition a été rejetée et ne sera pas publiée.', 'info');
  };

  const handleDeleteFaq = (id: string) => {
    store.deleteFaqItem(id);
    setFaqs(store.getFaqItems());
    onShowToast('FAQ Supprimée', 'La question a été retirée.', 'info');
  };

  const handleSaveEditFaq = () => {
    if (!editingFaq) return;
    store.updateFaqItem(editingFaq.id, editingFaq);
    setEditingFaq(null);
    setFaqs(store.getFaqItems());
    onShowToast('FAQ Mise à Jour', 'Les modifications ont été enregistrées.', 'success');
  };

  const handleCreateFaq = () => {
    if (!newFaqData.rephrasedQuestion || !newFaqData.answer) {
      onShowToast('Champs requis', 'Veuillez saisir la question et la réponse.', 'info');
      return;
    }
    store.addFaqItem({
      category: newFaqData.category || 'Règlement & Quiz',
      rawQuestionsCount: 1,
      sampleRawQuestions: [newFaqData.rephrasedQuestion],
      rephrasedQuestion: newFaqData.rephrasedQuestion,
      answer: newFaqData.answer,
      sources: newFaqData.sources || ['Documentation Officielle'],
      confidence: newFaqData.confidence || 'elevee',
      status: 'proposee',
    });
    setIsCreatingFaq(false);
    setNewFaqData({
      category: 'Règlement & Quiz',
      rephrasedQuestion: '',
      answer: '',
      sources: ['Règlement Officiel'],
      confidence: 'elevee',
    });
    setFaqs(store.getFaqItems());
    onShowToast('Question FAQ Proposée', 'Enregistrée avec succès en attente de validation Staff.', 'success');
  };

  // Helpers for CM Config
  const updateCmConfig = (fields: Partial<AiCmConfig>) => {
    setPromptCfg((prev) => ({
      ...prev,
      cmConfig: {
        ...defaultCmConfig,
        ...(prev.cmConfig || {}),
        ...fields,
      },
    }));
  };

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

  const isSimulationActive = promptCfg.simulationEnabled === true && promptCfg.enableLiveDiscordBot !== false;

  const handleToggleSimulation = () => {
    const newActive = !isSimulationActive;
    const updated = {
      ...promptCfg,
      simulationEnabled: newActive,
      enableLiveDiscordBot: newActive,
    };
    setPromptCfg(updated);
    aiKnowledgeService.updatePromptConfig(updated);
    onShowToast(
      newActive ? 'IA de Simulation Activée' : 'IA de Simulation Coupée',
      newActive
        ? 'Les tests de simulation Discord et les réponses automatiques sont réactivés.'
        : 'L\'IA de simulation est maintenant en pause. Le bot ne répondra plus en fan/coach.',
      newActive ? 'success' : 'info'
    );
  };

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
          onClick={() => setActiveTab('cm')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'cm'
              ? 'bg-purple-600/20 text-purple-300 border-t border-x border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Bot className="w-4 h-4 text-purple-400" />
          <span>🤖 Community Manager IA (Discord)</span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'faq'
              ? 'bg-cyan-600/20 text-cyan-300 border-t border-x border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>💡 FAQ Intelligente & Questions</span>
          {faqs.filter((f) => f.status === 'proposee').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              {faqs.filter((f) => f.status === 'proposee').length}
            </span>
          )}
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
          {/* Master Simulation AI Toggle Card */}
          <div
            className={`border rounded-2xl p-5 shadow-xl transition-all ${
              isSimulationActive
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl border ${
                    isSimulationActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isSimulationActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">IA de Simulation Discord & Web</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSimulationActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isSimulationActive ? 'Active' : 'Coupée / En Pause'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isSimulationActive
                      ? "L'IA joue le rôle du fan sur Discord et évalue les réponses des candidats."
                      : "L'IA de simulation est actuellement coupée. Le bot Discord ne répond plus en fan, n'émet aucun appel OpenRouter et les commandes !start-simu sont mises en pause."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleSimulation}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0 ${
                  isSimulationActive
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSimulationActive ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    <span>Couper l'IA de simulation</span>
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    <span>Réactiver l'IA de simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>

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
                  value={promptCfg.modelName || '@preset/pawako-bot-2'}
                  onChange={(e) => setPromptCfg({ ...promptCfg, modelName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="@preset/pawako-bot-2">@preset/pawako-bot-2 (Preset OpenRouter PAWAKO 2 - Défaut)</option>
                  <option value="@preset/pawako-bot">@preset/pawako-bot (Ancien Preset)</option>
                  <option value="openrouter/auto">openrouter/auto (OpenRouter Auto-Routing)</option>
                  <option value="gemini-3.7-flash">gemini-3.7-flash (Gemini API Flash)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">meta-llama/llama-3.3-70b-instruct (Llama 3.3 70B)</option>
                  <option value="x-ai/grok-2">x-ai/grok-2 (Grok 2)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Le flux de la simulation est directement routé vers votre preset OpenRouter <code className="text-amber-400">@preset/pawako-bot-2</code>.
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

      {/* TAB 2: COMMUNITY MANAGER IA CONFIG (DISCORD) */}
      {activeTab === 'cm' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Bot className="w-32 h-32 text-purple-400" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-inner">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Comportement du Community Manager IA (Alex)</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                      Service Autonome Discord (OpenRouter)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Configure le ton, la fréquence d'animation, les fonctionnalités actives et les ressources partagées par l'IA CM. Ce service opère de manière <strong className="text-purple-300">indépendante des modules de formation</strong> sur le serveur Discord Pawako.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-300 font-semibold">Statut : Operational on Discord</span>
              </div>
            </div>
          </div>

          {/* Section 1: Tone & Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tone Selector */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-purple-400" />
                <span>Ton de Communication du CM</span>
              </label>
              <p className="text-xs text-slate-400">
                Définit le style relationnel et le langage employé par le CM dans ses posts et réponses.
              </p>
              <select
                value={promptCfg.cmConfig?.tone || 'dynamique'}
                onChange={(e) => updateCmConfig({ tone: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="dynamique">⚡ Dynamique, Motivant & Vendeur (Recommandé Pawako)</option>
                <option value="bienveillant">💛 Chaleureux, Bienveillant & Pédagoge</option>
                <option value="strict_performance">🎯 Exigeant & Axé Performance / Métriques Vente</option>
                <option value="cool">😎 Décontracté, Fun & Style Membre Communauté</option>
                <option value="grand_frere">🤝 Grand Frère Coach & Inspirant</option>
              </select>
            </div>

            {/* Post Frequency Selector */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Fréquence d'Animation Automatique</span>
              </label>
              <p className="text-xs text-slate-400">
                Rythme de publication automatique du contenu quotidien (astuces, quiz, playlists) sur Discord.
              </p>
              <select
                value={promptCfg.cmConfig?.postFrequency || 'daily'}
                onChange={(e) => updateCmConfig({ postFrequency: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="daily">📅 Quotidien (1 fois par jour à 09h00)</option>
                <option value="twice_daily">⚡ Biquotidien (Matin 09h00 & Soir 18h00)</option>
                <option value="weekly">🗓️ Hebdomadaire (Chaque Lundi matin)</option>
                <option value="manual">🛑 Sur Demande / Manuel uniquement (!post)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Feature Toggles */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Activation & Désactivation des Services CM</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mini Games Toggle */}
              <div
                onClick={() => updateCmConfig({ enableMiniGames: !(promptCfg.cmConfig?.enableMiniGames ?? true) })}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  (promptCfg.cmConfig?.enableMiniGames ?? true)
                    ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${ (promptCfg.cmConfig?.enableMiniGames ?? true) ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500' }`}>
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Jeux & Challenges Flash (!jeu)</span>
                    <input
                      type="checkbox"
                      checked={promptCfg.cmConfig?.enableMiniGames ?? true}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    L'IA génère et propose des cas pratiques de chatting avec options A, B, C et correction immédiate.
                  </p>
                </div>
              </div>

              {/* Daily Tips Toggle */}
              <div
                onClick={() => updateCmConfig({ enableDailyTips: !(promptCfg.cmConfig?.enableDailyTips ?? true) })}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  (promptCfg.cmConfig?.enableDailyTips ?? true)
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${ (promptCfg.cmConfig?.enableDailyTips ?? true) ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500' }`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Astuces & Hacks Chatting du Jour</span>
                    <input
                      type="checkbox"
                      checked={promptCfg.cmConfig?.enableDailyTips ?? true}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Publication d'astuces de vente, boucliers tarifaires et conseils d'orthographe française.
                  </p>
                </div>
              </div>

              {/* Candidate Followups Toggle */}
              <div
                onClick={() => updateCmConfig({ enableCandidateFollowups: !(promptCfg.cmConfig?.enableCandidateFollowups ?? true) })}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  (promptCfg.cmConfig?.enableCandidateFollowups ?? true)
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${ (promptCfg.cmConfig?.enableCandidateFollowups ?? true) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500' }`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Relances Candidats Personnalisées</span>
                    <input
                      type="checkbox"
                      checked={promptCfg.cmConfig?.enableCandidateFollowups ?? true}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Motivation individuelle selon l'avancement des modules et les badges débloqués du candidat.
                  </p>
                </div>
              </div>

              {/* Auto QA Toggle */}
              <div
                onClick={() => updateCmConfig({ enableAutoQA: !(promptCfg.cmConfig?.enableAutoQA ?? true) })}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  (promptCfg.cmConfig?.enableAutoQA ?? true)
                    ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${ (promptCfg.cmConfig?.enableAutoQA ?? true) ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500' }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Réponses Automatiques Q&A Discord</span>
                    <input
                      type="checkbox"
                      checked={promptCfg.cmConfig?.enableAutoQA ?? true}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Répond de façon autonome aux questions posées par les candidats dans les salons d'entraide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Custom Prompt & Persona Instructions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Consignes Spécifiques & Persona du CM IA</span>
            </label>
            <p className="text-xs text-slate-400">
              Ces instructions complètent le prompt système transmis à OpenRouter AI pour façonner la personnalité du CM.
            </p>
            <textarea
              rows={3}
              value={promptCfg.cmConfig?.customCmInstructions || ''}
              onChange={(e) => updateCmConfig({ customCmInstructions: e.target.value })}
              placeholder="Ex: Sois très énergique, utilise un vocabulaire orienté chiffre d'affaires, salue la communauté avec des emojis de fusée..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* TAB: FAQ INTELLIGENTE & QUESTIONS RÉCURRENTES DISCORD */}
      {activeTab === 'faq' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <HelpCircle className="w-32 h-32 text-cyan-400" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">FAQ Intelligente & Questions Récurrentes Discord</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                      Validation Staff Requise
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Analyse les messages accessibles des salons Discord pour détecter les interrogations fréquentes des candidats.
                    <br />
                    <strong className="text-cyan-300">Règle de gouvernance Staff :</strong> Aucune proposition générée n'est publiée sur le serveur sans votre approbation préalable.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleScanDiscordQuestions}
                  disabled={isScanningFaq}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanningFaq ? 'animate-spin' : ''}`} />
                  <span>{isScanningFaq ? 'Analyse Discord...' : 'Scanner les Salons Discord'}</span>
                </button>

                <button
                  onClick={() => setIsCreatingFaq(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Nouvelle Question</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFaqFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  faqFilter === 'all'
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Toutes ({faqs.length})
              </button>

              <button
                onClick={() => setFaqFilter('proposee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  faqFilter === 'proposee'
                    ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>En attente Staff</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  {faqs.filter((f) => f.status === 'proposee').length}
                </span>
              </button>

              <button
                onClick={() => setFaqFilter('approuvee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  faqFilter === 'approuvee'
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Approuvées & Publiées</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                  {faqs.filter((f) => f.status === 'approuvee').length}
                </span>
              </button>

              <button
                onClick={() => setFaqFilter('rejetee')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  faqFilter === 'rejetee'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Rejetées</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
                  {faqs.filter((f) => f.status === 'rejetee').length}
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Salon cible : <strong>#faq</strong></span>
            </div>
          </div>

          {/* Create Modal / Inline Form */}
          {isCreatingFaq && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Ajouter une Question Manuellement</span>
                </h3>
                <button onClick={() => setIsCreatingFaq(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Catégorie</label>
                  <select
                    value={newFaqData.category || 'Règlement & Quiz'}
                    onChange={(e) => setNewFaqData({ ...newFaqData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Règlement & Quiz">Règlement & Quiz</option>
                    <option value="Simulations">Simulations</option>
                    <option value="Formation Outils">Formation Outils</option>
                    <option value="Horaires & Organisation">Horaires & Organisation</option>
                    <option value="Confidentialité & Données">Confidentialité & Données</option>
                    <option value="Paiements & PPV">Paiements & PPV</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Niveau de Confiance</label>
                  <select
                    value={newFaqData.confidence || 'elevee'}
                    onChange={(e) => setNewFaqData({ ...newFaqData, confidence: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="elevee">🟢 Élevée (Source officielle vérifiée)</option>
                    <option value="moyenne">🟡 Moyenne (À adapter)</option>
                    <option value="incertaine_a_verifier">🔴 Incertaine (À vérifier par le Staff)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Question reformulée</label>
                <input
                  type="text"
                  value={newFaqData.rephrasedQuestion || ''}
                  onChange={(e) => setNewFaqData({ ...newFaqData, rephrasedQuestion: e.target.value })}
                  placeholder="Ex: Que se passe-t-il après 5 échecs consécutifs à un quiz ?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Réponse synthétique officielle</label>
                <textarea
                  rows={4}
                  value={newFaqData.answer || ''}
                  onChange={(e) => setNewFaqData({ ...newFaqData, answer: e.target.value })}
                  placeholder="Rédigez la réponse courte et claire fondée sur les documents..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sources officielles (séparées par des virgules)</label>
                <input
                  type="text"
                  value={(newFaqData.sources || []).join(', ')}
                  onChange={(e) =>
                    setNewFaqData({
                      ...newFaqData,
                      sources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Ex: Règlement Officiel - Règle 3, Module 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsCreatingFaq(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateFaq}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Enregistrer en proposition
                </button>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingFaq && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Modifier la Question FAQ</span>
                </h3>
                <button onClick={() => setEditingFaq(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={editingFaq.category}
                    onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Niveau de Confiance</label>
                  <select
                    value={editingFaq.confidence}
                    onChange={(e) => setEditingFaq({ ...editingFaq, confidence: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="elevee">🟢 Élevée (Source officielle vérifiée)</option>
                    <option value="moyenne">🟡 Moyenne</option>
                    <option value="incertaine_a_verifier">🔴 Incertaine / À vérifier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Question reformulée</label>
                <input
                  type="text"
                  value={editingFaq.rephrasedQuestion}
                  onChange={(e) => setEditingFaq({ ...editingFaq, rephrasedQuestion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Réponse</label>
                <textarea
                  rows={4}
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sources officielles (virgules)</label>
                <input
                  type="text"
                  value={editingFaq.sources.join(', ')}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      sources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEditFaq}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* List of FAQ Items */}
          <div className="grid grid-cols-1 gap-4">
            {faqs
              .filter((f) => (faqFilter === 'all' ? true : f.status === faqFilter))
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                        {item.category}
                      </span>

                      {item.rawQuestionsCount > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                          📊 Posée {item.rawQuestionsCount} fois sur Discord
                        </span>
                      )}

                      {item.confidence === 'elevee' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Source vérifiée
                        </span>
                      )}

                      {item.confidence === 'incertaine_a_verifier' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Incertaine / À vérifier Staff
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'proposee' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          En attente validation Staff
                        </span>
                      )}
                      {item.status === 'approuvee' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Validée & Publiée dans #faq
                        </span>
                      )}
                      {item.status === 'rejetee' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          Rejetée par le Staff
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sample Raw Questions from Discord */}
                  {item.sampleRawQuestions && item.sampleRawQuestions.length > 0 && (
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        <span>Extraits des messages reçus des candidats :</span>
                      </p>
                      <div className="space-y-1">
                        {item.sampleRawQuestions.slice(0, 3).map((sq, sIdx) => (
                          <p key={sIdx} className="text-xs text-slate-300 italic">
                            « {sq} »
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rephrased Question & Official Answer */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                      <span className="text-cyan-400">Q.</span>
                      <span>{item.rephrasedQuestion}</span>
                    </h4>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                      {item.answer}
                    </p>
                  </div>

                  {/* Sources tag list */}
                  {item.sources && item.sources.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Sources officielles :</span>
                      {item.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 font-mono"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                    <div className="text-[10px] text-slate-400">
                      {item.reviewedBy ? (
                        <span>Validé par <strong>{item.reviewedBy}</strong> ({item.reviewedAt})</span>
                      ) : (
                        <span>Proposé le {item.suggestedAt}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'proposee' && (
                        <>
                          <button
                            onClick={() => handleApproveFaq(item.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approuver & Publier</span>
                          </button>

                          <button
                            onClick={() => setEditingFaq(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            onClick={() => handleRejectFaq(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeter</span>
                          </button>
                        </>
                      )}

                      {item.status === 'approuvee' && (
                        <>
                          <button
                            onClick={() => handleApproveFaq(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                            title="Republier dans #faq Discord"
                          >
                            <Send className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Republier</span>
                          </button>

                          <button
                            onClick={() => setEditingFaq(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            onClick={() => handleDeleteFaq(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {item.status === 'rejetee' && (
                        <>
                          <button
                            onClick={() => handleApproveFaq(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Réexaminer & Valider</span>
                          </button>

                          <button
                            onClick={() => handleDeleteFaq(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {faqs.filter((f) => (faqFilter === 'all' ? true : f.status === faqFilter)).length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">Aucune question dans cette catégorie.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cliquez sur « Scanner les Salons Discord » ou « Nouvelle Question » pour en ajouter.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
                  Respecter la courbe naturelle (Accueil &rarr; Flirt léger GFE &rarr; Teasing progressif &rarr; Montée du désir).
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
