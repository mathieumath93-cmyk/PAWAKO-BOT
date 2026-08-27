import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Bot,
  Key,
  Sliders,
  BookOpen,
  Send,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  HelpCircle,
  FileText,
  Play,
  Layers,
  ChevronRight,
  Zap,
  Lock,
  Unlock,
  ShieldCheck,
  UserCheck,
  Clock,
} from 'lucide-react';
import { aiKnowledgeService } from '../services/aiKnowledgeService';
import {
  AiKnowledgeBase,
  AiPromptConfig,
  FanPersona,
  ObjectionHandler,
  PpvItem,
  StepGuide,
} from '../types';

interface AIKnowledgeConfiguratorProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const AIKnowledgeConfigurator: React.FC<AIKnowledgeConfiguratorProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'prompts' | 'knowledge' | 'training' | 'sandbox'>('prompts');
  const [knowledge, setKnowledge] = useState<AiKnowledgeBase>(aiKnowledgeService.getKnowledgeBase());
  const [promptCfg, setPromptCfg] = useState<AiPromptConfig>(aiKnowledgeService.getPromptConfig());

  // Supervisor Simulation Analyzer state
  const [sampleTranscript, setSampleTranscript] = useState<string>(
    `[Superviseur Mathieu] : "Salut Alex, bienvenue dans ton salon de simulation ! On va tester ton accroche. Imagine qu'un fan te dit : 'Coucou tu es magnifique, tu fais quoi dans la vie ?'"\n` +
    `[Candidat Alex] : "Merci ! Je suis mannequin sur la plateforme et j'adore échanger avec mes abonnés. Et toi tu viens d'où ?"\n` +
    `[Superviseur Mahsa (Correction)] : "💡 Très bon tutoiement et question ouverte Alex ! Mais pense à être plus mystérieux et à créer une complicité intime plutôt que d'employer le mot 'mannequin'. Réessaie plutôt avec un ton complice et joueur."\n` +
    `[Candidat Alex] : "Coucou toi ! 😏 Merci c'est adorable... Je profitais de ma soirée pour me détendre. Tu me racontes ce qui t'amène ici ?"\n` +
    `[Superviseur Mathieu (Validation)] : "✅ Parfait ! Voilà exactement l'attitude attendue. Tu as gardé le contrôle et posé une question ouverte."`
  );
  const [isAnalyzingTranscript, setIsAnalyzingTranscript] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: string;
    supervisorBestReplies: string[];
    suggestedPromptAdditions: string;
    candidatePosture: string;
  } | null>(null);

  // Sandbox simulation state
  const [extractedFanInfos, setExtractedFanInfos] = useState({
    name: false,
    age: false,
    job: false,
    location: false,
    hobbies: false,
    fantasy: false,
  });

  const [selectedPersona, setSelectedPersona] = useState<FanPersona>(
    knowledge.fanPersonas[0] || aiKnowledgeService.getKnowledgeBase().fanPersonas[0]
  );
  const [messages, setMessages] = useState<
    Array<{ sender: 'fan' | 'candidate' | 'coach'; text: string; details?: any }>
  >([
    {
      sender: 'coach',
      text: `📌 **CONTEXTE DE DÉPART DE LA SIMULATION** :\n` +
        `Un nouveau fan s'est abonné et n'a **pas répondu** au message automatique de bienvenue.\n` +
        `👉 **C'est à toi (le candidat) de le relancer et de lancer la discussion !**`,
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSimulatingResponse, setIsSimulatingResponse] = useState(false);

  useEffect(() => {
    const unsubscribe = aiKnowledgeService.subscribe(() => {
      setKnowledge(aiKnowledgeService.getKnowledgeBase());
      setPromptCfg(aiKnowledgeService.getPromptConfig());
    });
    return () => unsubscribe();
  }, []);

  const handleSaveAll = () => {
    aiKnowledgeService.updateKnowledgeBase(knowledge);
    aiKnowledgeService.updatePromptConfig(promptCfg);
    onShowToast('Base de Connaissances Sauvegardée !', 'Les prompts et règles de l\'IA sont enregistrés avec succès.', 'success');
  };

  const handleReset = () => {
    if (window.confirm('Voulez-vous réinitialiser tous les prompts et la base de connaissances aux valeurs par défaut de PAWAKO ?')) {
      aiKnowledgeService.resetToDefaults();
      onShowToast('Réinitialisation Effectuée', 'Prompts et connaissances restaurés par défaut.', 'info');
    }
  };

  // Supervisor Transcript Analysis & Prompt Training
  const handleAnalyzeSupervisorTranscript = () => {
    if (!sampleTranscript.trim()) return;
    setIsAnalyzingTranscript(true);

    setTimeout(() => {
      setAnalysisResult({
        summary: "Analyse d'une simulation supervisée par Mathieu et Mahsa sur l'étape 1 (Accroche & Tone setting). Les recadrages ont porté sur l'évitement du jargon générique et l'accent sur la complicité intime.",
        supervisorBestReplies: [
          "« Coucou toi ! 😏 Merci c'est adorable... Je profitais de ma soirée pour me détendre. Tu me racontes ce qui t'amène ici ? »",
          "« Garde le contrôle du dialogue en finissant par une question ouverte sans vendre prématurément. »",
        ],
        suggestedPromptAdditions: `EXEMPLES DE CORRECTIONS ET STYLE DU SUPERVISEUR MAWAKO (EXTRAITS DES SIMUS SALON) :\n- Toujours valoriser l'attention du fan ("Merci c'est adorable") sans tomber dans le langage institutionnel.\n- Utiliser des expressions complices ("Coucou toi", "Tu me racontes...") plutôt que de décrire sa profession de manière neutre.\n- En cas d'hésitation du candidat, corriger immédiatement sur la structure : 1 compliment/accroche + 1 teaser + 1 question ouverte.`,
        candidatePosture: "Le candidat s'adapte rapidement après le 1er recadrage du superviseur. Bonne dynamique de progression.",
      });
      setIsAnalyzingTranscript(false);
      onShowToast("Analyse Superviseur Terminée", "L'IA a extrait le style et les règles de réponse des superviseurs.", "success");
    }, 1200);
  };

  const handleApplyAnalysisToPrompts = () => {
    if (!analysisResult) return;
    const updatedFanPrompt = `${promptCfg.fanPrompt}\n\n${analysisResult.suggestedPromptAdditions}`;
    const updatedCoachPrompt = `${promptCfg.coachPrompt}\n\n${analysisResult.suggestedPromptAdditions}`;

    setPromptCfg({
      ...promptCfg,
      fanPrompt: updatedFanPrompt,
      coachPrompt: updatedCoachPrompt,
    });
    aiKnowledgeService.updatePromptConfig({
      fanPrompt: updatedFanPrompt,
      coachPrompt: updatedCoachPrompt,
    });
    onShowToast("Prompts Enrichis avec Succès !", "Les consignes de l'IA intègrent maintenant les cas pratiques superviseurs.", "success");
  };

  // Step Guide Edits
  const handleStepChange = (index: number, field: keyof StepGuide, value: any) => {
    const updated = [...knowledge.fiveStepsGuide];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledge({ ...knowledge, fiveStepsGuide: updated });
  };

  const handleAddKeyPhrase = (stepIdx: number) => {
    const updated = [...knowledge.fiveStepsGuide];
    updated[stepIdx].keyPhrases.push('Exemple de bonne réplique à ajouter...');
    setKnowledge({ ...knowledge, fiveStepsGuide: updated });
  };

  const handleRemoveKeyPhrase = (stepIdx: number, phraseIdx: number) => {
    const updated = [...knowledge.fiveStepsGuide];
    updated[stepIdx].keyPhrases = updated[stepIdx].keyPhrases.filter((_, idx) => idx !== phraseIdx);
    setKnowledge({ ...knowledge, fiveStepsGuide: updated });
  };

  // PPV Pricing Edits
  const handleAddPpv = () => {
    const newPpv: PpvItem = {
      id: `ppv-${Date.now()}`,
      mediaName: 'Nouveau Média / Pack',
      minPrice: 10,
      maxPrice: 30,
      description: 'Description du contenu',
    };
    setKnowledge({ ...knowledge, ppvPricing: [...knowledge.ppvPricing, newPpv] });
  };

  const handleRemovePpv = (id: string) => {
    setKnowledge({ ...knowledge, ppvPricing: knowledge.ppvPricing.filter((p) => p.id !== id) });
  };

  // Objection Edits
  const handleAddObjection = () => {
    const newObj: ObjectionHandler = {
      id: `obj-${Date.now()}`,
      objection: 'Nouvelle objection type de fan',
      strategy: 'Stratégie de réponse conseillée',
      exampleResponse: 'Exemple de réponse formulée',
    };
    setKnowledge({ ...knowledge, objectionHandlers: [...knowledge.objectionHandlers, newObj] });
  };

  const handleRemoveObjection = (id: string) => {
    setKnowledge({ ...knowledge, objectionHandlers: knowledge.objectionHandlers.filter((o) => o.id !== id) });
  };

  // Sandbox simulation logic (Anthony Persona + Silent Coach unless fatal error)
  const handleSendCandidateMessage = () => {
    if (!userInput.trim()) return;

    const candidateMsg = userInput.trim();
    setUserInput('');

    // Detect extracted info from candidate's questions
    const lower = candidateMsg.toLowerCase();
    const updatedExtracted = { ...extractedFanInfos };
    if (lower.includes('prénom') || lower.includes('t\'appelles') || lower.includes('nom') || lower.includes('qui tu es')) updatedExtracted.name = true;
    if (lower.includes('âge') || lower.includes('ans')) updatedExtracted.age = true;
    if (lower.includes('fais quoi') || lower.includes('travail') || lower.includes('métier') || lower.includes('vie')) updatedExtracted.job = true;
    if (lower.includes('d\'où') || lower.includes('habites') || lower.includes('ville') || lower.includes('pays')) updatedExtracted.location = true;
    if (lower.includes('hobbies') || lower.includes('passion') || lower.includes('aime faire') || lower.includes('temps libre')) updatedExtracted.hobbies = true;
    if (lower.includes('fantasme') || lower.includes('désir') || lower.includes('envie')) updatedExtracted.fantasy = true;
    setExtractedFanInfos(updatedExtracted);

    const newChat = [...messages, { sender: 'candidate' as const, text: candidateMsg }];
    setMessages(newChat);
    setIsSimulatingResponse(true);

    setTimeout(() => {
      let coachFeedback: { sender: 'coach'; text: string } | null = null;

      // FATAL ERROR DETECTION
      const candidateMessageCount = newChat.filter((m) => m.sender === 'candidate').length;
      const isSendingPpv = lower.includes('ppv') || lower.includes('débloque') || lower.includes('vidéo') || lower.includes('$') || lower.includes('prix') || lower.includes('tarif');
      const hasExtractedMinInfos = updatedExtracted.name && updatedExtracted.job;

      // Fatal Error 1: PPV before minimal qualification
      if (isSendingPpv && !hasExtractedMinInfos && candidateMessageCount <= 2) {
        coachFeedback = {
          sender: 'coach',
          text: `🚨 **ERREUR FATALE DÉTECTÉE PAR LE COACH**\n` +
            `❌ Tu as proposé un contenu payant/PPV sans avoir qualifié Anthony (Prénom, Âge, Métier, Ville, Hobbies, Fantasme) !\n` +
            `💡 **Règle PAWAKO** : Tu dois IMPÉRATIVEMENT connaître sa profession pour évaluer son pouvoir d'achat avant de proposer du contenu payant.`,
        };
      }
      // Fatal Error 2: PPV without Follow-Up
      else if (isSendingPpv && !lower.includes('noter') && !lower.includes('lingerie') && !lower.includes('jouis') && !lower.includes('préféré') && !lower.includes('regarde') && !lower.includes('bb')) {
        coachFeedback = {
          sender: 'coach',
          text: `🚨 **ERREUR FATALE DÉTECTÉE PAR LE COACH**\n` +
            `❌ Proposition de PPV envoyée SANS le message de Follow-Up immédiat !\n` +
            `💡 **Règle PAWAKO** : Tout PPV doit être immédiatement suivi d'un message d'accroche/pression amoureuse (ex: « N'oublie pas de me noter /10 bb 💋 » ou « Tu aimes la couleur de ma lingerie ? »).`,
        };
      }

      // Generate Anthony's response (Strict Retention of Info + Photo Free/Paid question)
      let fanReplyText = '';

      // Check if candidate asks about photo/video offer
      const isOfferingPhotoOrVideo = lower.includes('photo') || lower.includes('vidéo') || lower.includes('aperçu') || lower.includes('voir');
      const isReplyingPaid = lower.includes('payant') || lower.includes('paye') || lower.includes('$') || lower.includes('prix') || lower.includes('tarif');

      if (isOfferingPhotoOrVideo && !isReplyingPaid && !lower.includes('gratuit')) {
        fanReplyText = `Mmmh pourquoi pas... Mais c'est gratuit ou c'est payant ? 😏`;
      } else if (isReplyingPaid) {
        fanReplyText = `Ah c'est payant ? 😕 Oula 25$ c'est un peu cher pour mon budget de la semaine... Tu peux pas me la donner ou me faire un petit geste ?`;
      } else if (lower.includes('prénom') || lower.includes('t\'appelles') || lower.includes('qui tu es')) {
        fanReplyText = `Moi c'est Anthony ! Et toi tu t'appelles comment ? 😊`;
      } else if (lower.includes('âge') || lower.includes('ans')) {
        fanReplyText = `J'ai 29 ans mon ange. Et toi tu as quel âge ? 😉`;
      } else if (lower.includes('fais quoi') || lower.includes('métier') || lower.includes('travail') || lower.includes('vie')) {
        fanReplyText = `Je suis ingénieur commercial à Lyon ! Ça prend pas mal de temps. Tu aimes ce que tu fais toi ? ✨`;
      } else if (lower.includes('d\'où') || lower.includes('ville') || lower.includes('habites')) {
        fanReplyText = `J'habite à Lyon ! Et toi tu es d'où ? 📍`;
      } else if (lower.includes('hobbies') || lower.includes('passion') || lower.includes('temps libre')) {
        fanReplyText = `J'adore les voyages et le sport pendant mon temps libre 🏋️‍♂️ Et toi ?`;
      } else if (lower.includes('fantasme') || lower.includes('désir')) {
        fanReplyText = `Je suis un peu réservé au début... Mais j'avoue qu'une petite vidéo coquine sous la douche avec déshabillage ça me ferait très chaud... 😈`;
      } else if (candidateMessageCount === 1) {
        fanReplyText = `Coucou ! Ça va super et toi ? Tu viens d'où ? 😊`;
      } else if (candidateMessageCount === 2) {
        fanReplyText = `Tu me plais bien, tu as l'air sympa ! Qu'est-ce que tu me proposes de beau par ici ? 😉`;
      } else if (lower.includes('gratuit')) {
        fanReplyText = `Oh trop cool si c'est gratuit ! Montre-moi ça alors ! 🔥`;
      } else if (lower.includes('bouclier') || lower.includes('cadeau') || lower.includes('offert') || lower.includes('photo')) {
        fanReplyText = `Mmmh d'accord tu me rajoutes 2 photos gratuites ? Mais 25$ ça reste un peu au-dessus de mon budget...`;
      } else if (lower.includes('réduction') || lower.includes('18$') || lower.includes('20%') || lower.includes('-25%')) {
        fanReplyText = `À 18$ avec tout le pack c'est parfait ! Mais ma paie n'arrive que vendredi... C'est bon si je te la débloque vendredi matin ? 😉`;
      } else {
        fanReplyText = `D'accord c'est noté ! Hâte qu'on continue à discuter ! 🔥`;
      }

      const updatedMessages = [...newChat];
      if (coachFeedback) {
        updatedMessages.push(coachFeedback);
      }
      updatedMessages.push({ sender: 'fan', text: fanReplyText });

      setMessages(updatedMessages);
      setIsSimulatingResponse(false);
    }, 1000);
  };

  const handleSimulateInactivityRelance = () => {
    setIsSimulatingResponse(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'fan', text: 'Tu m\'as oublié ? 😏 (Relance Anthony après 5 minutes de temps de réponse)' },
      ]);
      setIsSimulatingResponse(false);
    }, 600);
  };

  const handleResetSandbox = () => {
    setMessages([
      {
        sender: 'coach',
        text: `📌 **CONTEXTE DE DÉPART DE LA SIMULATION** :\n` +
          `Un nouveau fan s'est abonné et n'a **pas répondu** au message automatique de bienvenue.\n` +
          `👉 **C'est à toi (le candidat) de le relancer et de lancer la discussion !**`,
      },
    ]);
    setExtractedFanInfos({ name: false, age: false, job: false, location: false, hobbies: false, fantasy: false });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Configuration & Base de Connaissances IA</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                  Chatting OFM & Discord
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Définissez la personnalité de l'IA, les règles du chatting, puis testez le rendu dans le bac à sable avant activation sur Discord.
              </p>
            </div>
          </div>
        </div>

        {/* Live Discord Bot Switch Guard */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {promptCfg.enableLiveDiscordBot ? (
              <Unlock className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <div>
              <div className="text-xs font-bold text-white">IA Discord en Direct</div>
              <div className="text-[10px] text-slate-400">
                {promptCfg.enableLiveDiscordBot ? '🟢 Connectée aux salons' : '🔒 Désactivée (Mode Sandbox seul)'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const newValue = !promptCfg.enableLiveDiscordBot;
              setPromptCfg({ ...promptCfg, enableLiveDiscordBot: newValue });
              aiKnowledgeService.updatePromptConfig({ enableLiveDiscordBot: newValue });
              onShowToast(
                newValue ? 'IA Discord Activée en Direct' : 'IA Discord Sécurisée (Hors Ligne)',
                newValue
                  ? 'L\'IA répondra désormais sur Discord selon vos prompts.'
                  : 'L\'IA est désactivée sur Discord. Seul le Bac à Sable est actif.',
                newValue ? 'success' : 'info'
              );
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              promptCfg.enableLiveDiscordBot
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {promptCfg.enableLiveDiscordBot ? 'Désactiver' : 'Activer sur Discord'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'prompts'
              ? 'bg-indigo-600/20 text-indigo-300 border-t border-x border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>1️⃣ Prompts Système & API</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'knowledge'
              ? 'bg-indigo-600/20 text-indigo-300 border-t border-x border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>2️⃣ Base des 5 Étapes & PPV</span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-3 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all ${
            activeTab === 'training'
              ? 'bg-indigo-600/20 text-indigo-300 border-t border-x border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>3️⃣ Entraînement via Simus Superviseur</span>
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
          <span>4️⃣ Bac à Sable (Playground Local)</span>
        </button>
      </div>

      {/* TAB 1: PROMPTS & OPENROUTER CONFIG */}
      {activeTab === 'prompts' && (
        <div className="space-y-6">
          {/* API Provider Config */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Configuration OpenRouter API & Modèle LLM</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1 block">Clé d'API OpenRouter (OPENROUTER_API_KEY)</label>
                <input
                  type="password"
                  value={promptCfg.openRouterApiKey}
                  onChange={(e) => setPromptCfg({ ...promptCfg, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxx..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Permet d'utiliser n'importe quel modèle IA (Gemini, Claude, GPT-4, Llama) via OpenRouter.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">Modèle IA Préféré</label>
                <select
                  value={promptCfg.modelName}
                  onChange={(e) => setPromptCfg({ ...promptCfg, modelName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash (Ultra Rapide & Recommandé)</option>
                  <option value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet (Inégalé en Chatting)</option>
                  <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (Équilibré)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B (Open Source)</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Prompts Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analyzer Prompt */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">IA 1 : Analyseur Discord</h3>
                </div>
                <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                  Commande !analyser
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instruction donnée à l'IA pour résumer la discussion d'un salon privé et envoyer le bilan MP à Mahsa et Mathieu.
              </p>
              <textarea
                rows={10}
                value={promptCfg.analyzerPrompt}
                onChange={(e) => setPromptCfg({ ...promptCfg, analyzerPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Fan Simulator Prompt */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">IA 2 : Rôle du Fan (Simulateur)</h3>
                </div>
                <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 font-mono">
                  Réponse en direct
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Incarne le prospect/fan face au candidat pendant le test de chatting en direct.
              </p>
              <textarea
                rows={10}
                value={promptCfg.fanPrompt}
                onChange={(e) => setPromptCfg({ ...promptCfg, fanPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Coach Prompt */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">IA 3 : Coach & Superviseur</h3>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                  Conseils Qualitatifs Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Évalue chaque message du candidat, fournit un retour constructif et des suggestions (sans note chiffrée).
              </p>
              <textarea
                rows={10}
                value={promptCfg.coachPrompt}
                onChange={(e) => setPromptCfg({ ...promptCfg, coachPrompt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE (5 STEPS, PPV PRICING, OBJECTIONS) */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* OFM General Rules */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Consignes Générales & Règles d'Or PAWAKO</span>
            </h2>
            <p className="text-xs text-slate-400">
              Ces directives sont intégrées dans le contexte de toutes les requêtes IA pour garantir le respect strict du style PAWAKO.
            </p>
            <textarea
              rows={5}
              value={knowledge.ofmRules}
              onChange={(e) => setKnowledge({ ...knowledge, ofmRules: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 5 Steps Chatting Guide */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Grille des 5 Étapes du Chatting OFM</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  L'IA Coach s'appuie sur ces 5 étapes précises pour noter et corriger le candidat pendant sa simulation.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {knowledge.fiveStepsGuide.map((step, idx) => (
                <div key={step.stepNumber} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Étape {step.stepNumber} : {step.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Objectif de l'Étape</label>
                      <input
                        type="text"
                        value={step.objective}
                        onChange={(e) => handleStepChange(idx, 'objective', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Titre de l'Étape</label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Key Phrases */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-emerald-400">Phrases Clés Exemplaires</label>
                      <button
                        type="button"
                        onClick={() => handleAddKeyPhrase(idx)}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ajouter une réplique</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {step.keyPhrases.map((phrase, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={phrase}
                            onChange={(e) => {
                              const updatedPhrases = [...step.keyPhrases];
                              updatedPhrases[pIdx] = e.target.value;
                              handleStepChange(idx, 'keyPhrases', updatedPhrases);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyPhrase(idx, pIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PPV Pricing & Objections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PPV Pricing */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Grille Tarifaire PPV & Médias</span>
                </h3>
                <button
                  onClick={handleAddPpv}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter Média</span>
                </button>
              </div>

              <div className="space-y-2">
                {knowledge.ppvPricing.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.mediaName}
                        onChange={(e) => {
                          const updated = knowledge.ppvPricing.map((p) => (p.id === item.id ? { ...p, mediaName: e.target.value } : p));
                          setKnowledge({ ...knowledge, ppvPricing: updated });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-white w-full"
                      />
                      <button onClick={() => handleRemovePpv(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Prix :</span>
                      <input
                        type="number"
                        value={item.minPrice}
                        onChange={(e) => {
                          const updated = knowledge.ppvPricing.map((p) => (p.id === item.id ? { ...p, minPrice: Number(e.target.value) } : p));
                          setKnowledge({ ...knowledge, ppvPricing: updated });
                        }}
                        className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono"
                      />
                      <span className="text-slate-500">$ à</span>
                      <input
                        type="number"
                        value={item.maxPrice}
                        onChange={(e) => {
                          const updated = knowledge.ppvPricing.map((p) => (p.id === item.id ? { ...p, maxPrice: Number(e.target.value) } : p));
                          setKnowledge({ ...knowledge, ppvPricing: updated });
                        }}
                        className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono"
                      />
                      <span className="text-slate-500">$</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Objections */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Traitement des Objections</span>
                </h3>
                <button
                  onClick={handleAddObjection}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter Objection</span>
                </button>
              </div>

              <div className="space-y-2">
                {knowledge.objectionHandlers.map((obj) => (
                  <div key={obj.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={obj.objection}
                        onChange={(e) => {
                          const updated = knowledge.objectionHandlers.map((o) => (o.id === obj.id ? { ...o, objection: e.target.value } : o));
                          setKnowledge({ ...knowledge, objectionHandlers: updated });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-amber-300 w-full"
                      />
                      <button onClick={() => handleRemoveObjection(obj.id)} className="text-slate-500 hover:text-rose-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={obj.exampleResponse}
                      onChange={(e) => {
                        const updated = knowledge.objectionHandlers.map((o) => (o.id === obj.id ? { ...o, exampleResponse: e.target.value } : o));
                        setKnowledge({ ...knowledge, objectionHandlers: updated });
                      }}
                      placeholder="Exemple de réponse formulée..."
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPERVISOR SIMULATION TRAINING & ANALYSIS */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Analyse des Simus Superviseurs & Auto-Ajustement des Prompts</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Apprentissage Continu
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Collez ou chargez les échanges d'un salon Discord où Mahsa ou Mathieu ont réalisé des simulations réelles avec des candidats. L'IA va analyser les corrections et répliques modèles pour enrichir automatiquement ses prompts système.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Extrait / Transcription du Salon Discord Superviseur :
              </label>
              <textarea
                rows={7}
                value={sampleTranscript}
                onChange={(e) => setSampleTranscript(e.target.value)}
                placeholder="Collez ici les messages échangés entre le superviseur et le candidat dans un salon..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-200 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleAnalyzeSupervisorTranscript}
              disabled={isAnalyzingTranscript || !sampleTranscript.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isAnalyzingTranscript ? (
                <>
                  <Bot className="w-4 h-4 animate-spin" />
                  <span>Analyse et extraction du style superviseur en cours...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>⚡ Analyser la Simulation Superviseur & Entraîner l'IA</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 space-y-5 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Résultats de l'Analyse & Consignes Extraites</span>
                </h3>
                <button
                  onClick={handleApplyAnalysisToPrompts}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>📥 Appliquer les Ajustements aux Prompts IA (Fan & Coach)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    📌 Synthèse de l'Échange Superviseur
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.summary}</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    💬 Répliques Modèles Extraites des Superviseurs
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-200">
                    {analysisResult.supervisorBestReplies.map((rep, rIdx) => (
                      <li key={rIdx} className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px]">
                        {rep}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  ⚙️ Regles Générées pour Enrichir les Prompts Système
                </div>
                <pre className="text-xs text-amber-200 font-mono whitespace-pre-line bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {analysisResult.suggestedPromptAdditions}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SANDBOX / PLAYGROUND DE TEST LOCAL */}
      {activeTab === 'sandbox' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span>👤 Anthony (Fan Prospect)</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                    Adaptation & Rétention Infos
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 italic hidden md:inline">
                  🤫 Coach silencieux (alerte uniquement sur erreur fatale)
                </span>
                <button
                  onClick={handleSimulateInactivityRelance}
                  className="px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 text-amber-300 font-bold text-[11px] flex items-center gap-1"
                  title="Simuler 5 minutes sans réponse du candidat"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>⏱️ Relance +5min</span>
                </button>
                <button
                  onClick={handleResetSandbox}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recommencer</span>
                </button>
              </div>
            </div>

            {/* 6 Mandatory Info Checklist */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span>📋 Checklist des 6 Infos Obligatoires du Fan à Extraire :</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {Object.values(extractedFanInfos).filter(Boolean).length}/6 Extraites
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded border font-mono ${extractedFanInfos.name ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {extractedFanInfos.name ? '✅ Prénom' : '⚪ Prénom ?'}
                </span>
                <span className={`px-2 py-0.5 rounded border font-mono ${extractedFanInfos.age ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {extractedFanInfos.age ? '✅ Âge' : '⚪ Âge ?'}
                </span>
                <span className={`px-2 py-0.5 rounded border font-mono ${extractedFanInfos.job ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {extractedFanInfos.job ? '✅ Profession (Budget)' : '⚪ Profession ?'}
                </span>
                <span className={`px-2 py-0.5 rounded border font-mono ${extractedFanInfos.location ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {extractedFanInfos.location ? '✅ Localisation' : '⚪ Localisation ?'}
                </span>
                <span className={`px-2 py-0.5 rounded border font-mono ${extractedFanInfos.hobbies ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {extractedFanInfos.hobbies ? '✅ Hobbies' : '⚪ Hobbies ?'}
                </span>
                <span className={`px-2 py-0.5 rounded border font-mono ${extractedFanInfos.fantasy ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                  {extractedFanInfos.fantasy ? '✅ Fantasme' : '⚪ Fantasme ?'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Chat Window */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-[420px] flex flex-col justify-between shadow-2xl">
            <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
              {messages.map((m, idx) => (
                <div key={idx} className="space-y-1 animate-in fade-in">
                  {m.sender === 'fan' && (
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        👤
                      </div>
                      <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-none p-3 text-xs leading-relaxed">
                        <div className="text-[10px] font-bold text-indigo-400 mb-1">Anthony (Fan Prospect)</div>
                        {m.text}
                      </div>
                    </div>
                  )}

                  {m.sender === 'candidate' && (
                    <div className="flex items-start gap-2 max-w-[80%] ml-auto flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        🎓
                      </div>
                      <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-2xl rounded-tr-none p-3 text-xs leading-relaxed">
                        <div className="text-[10px] font-bold text-emerald-400 mb-1">Votre Réponse (Candidat)</div>
                        {m.text}
                      </div>
                    </div>
                  )}

                  {m.sender === 'coach' && (
                    <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 font-mono space-y-1 my-2">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Alerte Erreur Fatale Coach</span>
                      </div>
                      <div className="whitespace-pre-line text-[11px] leading-relaxed">{m.text}</div>
                    </div>
                  )}
                </div>
              ))}

              {isSimulatingResponse && (
                <div className="text-xs text-slate-500 italic animate-pulse flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>L'IA Fan & le Coach rédigent leurs réponses...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCandidateMessage()}
                placeholder="Tapez votre réponse de chatteur pour tester l'IA..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSendCandidateMessage}
                disabled={!userInput.trim() || isSimulatingResponse}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Tester</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save / Reset Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Réinitialiser aux Références</span>
        </button>

        <button
          onClick={handleSaveAll}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>✅ Sauvegarder la Connaissance & Prompts IA</span>
        </button>
      </div>
    </div>
  );
};
