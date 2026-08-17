import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Hash,
  HelpCircle,
  MessageSquare,
  Send,
  Shield,
  ShieldAlert,
  User,
  Users,
  X,
} from 'lucide-react';
import { Member, Quiz, Ticket, TrainingModule } from '../types';

interface DiscordSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  modules: TrainingModule[];
  quizzes: Quiz[];
  tickets: Ticket[];
  onQuizSubmit: (memberId: string, quizId: string, answers: number[]) => any;
  onCreateTicket: (memberId: string, subject: string, category: string, message: string) => Ticket;
}

export const DiscordSimulatorModal: React.FC<DiscordSimulatorModalProps> = ({
  isOpen,
  onClose,
  members,
  modules,
  quizzes,
  tickets,
  onQuizSubmit,
  onCreateTicket,
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('jarvis');
  const [activeUserRole, setActiveUserRole] = useState<'admin' | 'member'>('member');

  // Simulator chat messages log per channel
  const [jarvisMessages, setJarvisMessages] = useState<
    Array<{
      id: string;
      sender: string;
      avatar: string;
      bot?: boolean;
      embed?: any;
      buttons?: Array<{ id: string; label: string; action: string; style?: string }>;
      timestamp: string;
    }>
  >([
    {
      id: 'init-1',
      sender: 'PAWAKO FORMATION 🤖',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      bot: true,
      timestamp: '17/08/2026 14:00',
      embed: {
        title: '🤖 PAWAKO FORMATION — Salon Principal',
        description: 'Bienvenue dans le centre de commande Discord ! Utilisez les boutons ci-dessous pour lancer la formation, passer des quiz ou consulter votre profil.',
        fields: [
          { name: '👤 Mon profil', value: 'Voir vos rôles, votre niveau et vos statistiques de quiz.' },
          { name: '📚 Ma formation', value: 'Consulter la progression et débloquer les modules.' },
          { name: '🎯 Mes quiz', value: 'Lancer un quiz de validation de module.' },
          { name: '🎫 Mes tickets', value: 'Ouvrir une assistance avec l\'équipe administrateur.' },
        ],
      },
    },
  ]);

  // Quiz Modal state
  const [activeQuizModal, setActiveQuizModal] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<any | null>(null);

  // Ticket Form state
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Accès / Rôles');
  const [ticketMessage, setTicketMessage] = useState('');

  if (!isOpen) return null;

  const currentMember =
    activeUserRole === 'admin'
      ? members.find((m) => m.roles.includes('Admin')) || members[0]
      : members.find((m) => !m.roles.includes('Admin')) || members[2] || members[0];

  const handleButtonClick = (action: string) => {
    const time = '17/08/2026 14:35';

    if (action === 'profile') {
      const userProgress = currentMember.progress;
      const validatedCount = Object.values(userProgress).filter((p: any) => p.status === 'valide').length;

      const embed = {
        title: `👤 Profil de ${currentMember.username}`,
        description: `Discord ID : \`${currentMember.discordId}\`\nStatut : **Membre Actif**`,
        color: '#6366f1',
        fields: [
          { name: 'Rôles Discord actuels', value: currentMember.roles.join(', ') || 'Aucun' },
          { name: 'Module Actif en cours', value: modules.find((m) => m.id === currentMember.currentModuleId)?.title || 'Module 1' },
          { name: 'Modules Validés', value: `${validatedCount} / ${modules.length}` },
        ],
      };

      setJarvisMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: currentMember.username,
          avatar: currentMember.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          timestamp: time,
        },
        {
          id: `bot-${Date.now()}`,
          sender: 'PAWAKO FORMATION 🤖',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          bot: true,
          embed,
          timestamp: time,
        },
      ]);
    } else if (action === 'formation') {
      const currentMod = modules.find((m) => m.id === currentMember.currentModuleId) || modules[0];

      const embed = {
        title: '📚 Parcours de Formation PAWAKO',
        description: `Vous êtes actuellement au **${currentMod.title}**.\nCliquez ci-dessous pour y accéder.`,
        color: '#06b6d4',
        fields: [
          { name: 'Salon dédié', value: `\`${currentMod.channelName}\`` },
          { name: 'Rôle associé', value: `\`${currentMod.roleEnCoursName}\`` },
        ],
      };

      setJarvisMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: currentMember.username,
          avatar: currentMember.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          timestamp: time,
        },
        {
          id: `bot-${Date.now()}`,
          sender: 'PAWAKO FORMATION 🤖',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          bot: true,
          embed,
          timestamp: time,
        },
      ]);
    } else if (action === 'quiz') {
      const currentMod = modules.find((m) => m.id === currentMember.currentModuleId) || modules[0];
      const targetQuiz = quizzes.find((q) => q.moduleId === currentMod.id) || quizzes[0];
      setActiveQuizModal(targetQuiz);
      setQuizAnswers(new Array(targetQuiz.questions.length).fill(-1));
      setQuizResult(null);
    } else if (action === 'tickets') {
      setIsTicketFormOpen(true);
    } else if (action === 'admin') {
      if (!currentMember.roles.includes('Admin')) {
        setJarvisMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'PAWAKO FORMATION 🤖',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
            bot: true,
            embed: {
              title: '❌ Accès Refusé',
              description: 'Le bouton **🛠️ Administration** nécessite le rôle Discord `Admin`.',
              color: '#ef4444',
            },
            timestamp: time,
          },
        ]);
        return;
      }

      setJarvisMessages((prev) => [
        ...prev,
        {
          id: `bot-admin-${Date.now()}`,
          sender: 'PAWAKO FORMATION 🤖',
          avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          bot: true,
          embed: {
            title: '🛠️ Interface Admin Discord PAWAKO',
            description: 'Menu rapide d\'administration directement depuis Discord :',
            fields: [
              { name: '📊 Dashboard', value: 'Vue d\'ensemble des métriques' },
              { name: '👥 Membres', value: 'Inspection et rôles' },
              { name: '📚 Modules & 🎯 Quiz', value: 'Gestion du contenu' },
            ],
          },
          timestamp: time,
        },
      ]);
    }
  };

  const handleQuizFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizModal) return;
    try {
      const res = onQuizSubmit(currentMember.id, activeQuizModal.id, quizAnswers);
      setQuizResult(res);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTicketCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket(currentMember.id, ticketSubject, ticketCategory, ticketMessage);
    setIsTicketFormOpen(false);
    setTicketSubject('');
    setTicketMessage('');

    setJarvisMessages((prev) => [
      ...prev,
      {
        id: `bot-t-created-${Date.now()}`,
        sender: 'PAWAKO FORMATION 🤖',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
        bot: true,
        embed: {
          title: '🎫 Ticket Ouvert avec Succès !',
          description: `Votre ticket concernant "${ticketSubject}" a été transmis aux administrateurs. Un salon privé a été ouvert.`,
          color: '#f59e0b',
        },
        timestamp: '17/08/2026 14:35',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[90vh] bg-[#313338] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 relative font-sans">
        {/* Discord Top Window Bar */}
        <div className="h-12 bg-[#1e1f22] border-b border-[#2b2d31] px-4 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2 font-bold text-white">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>PAWAKO FORMATION 🤖 — Client Simulator</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
              Serveur Discord Officiel
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* User Role Switcher in Simulator */}
            <div className="flex items-center bg-[#2b2d31] p-1 rounded-lg border border-slate-700 text-[11px]">
              <span className="text-slate-400 px-2 font-medium">Tester en tant que :</span>
              <button
                onClick={() => setActiveUserRole('member')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  activeUserRole === 'member'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Membre
              </button>
              <button
                onClick={() => setActiveUserRole('admin')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  activeUserRole === 'admin'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Discord Client Main Layout: Sidebar Channels + Chat Window */}
        <div className="flex-1 flex overflow-hidden">
          {/* Discord Server Channels List */}
          <div className="w-56 bg-[#2b2d31] border-r border-[#1e1f22] flex flex-col justify-between select-none">
            <div className="p-3 space-y-4 overflow-y-auto">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  PAWAKO HQ (Serveur)
                </div>

                <div className="space-y-0.5 text-xs">
                  <button
                    onClick={() => setActiveChannel('jarvis')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-2 transition-colors ${
                      activeChannel === 'jarvis'
                        ? 'bg-[#404249] text-white'
                        : 'text-slate-400 hover:bg-[#35373c] hover:text-slate-200'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-indigo-400" />
                    <span>🤖-jarvis</span>
                  </button>

                  {modules.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveChannel(m.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center justify-between transition-colors ${
                        activeChannel === m.id
                          ? 'bg-[#404249] text-white'
                          : 'text-slate-400 hover:bg-[#35373c] hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{m.channelName.replace('#', '')}</span>
                      </div>
                    </button>
                  ))}

                  <div className="pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Administration
                  </div>

                  <button
                    onClick={() => setActiveChannel('logs')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center gap-2 transition-colors ${
                      activeChannel === 'logs'
                        ? 'bg-[#404249] text-white'
                        : 'text-slate-400 hover:bg-[#35373c] hover:text-slate-200'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-slate-500" />
                    <span>logs</span>
                  </button>

                  <button
                    onClick={() => setActiveChannel('notifs')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md font-medium flex items-center gap-2 transition-colors ${
                      activeChannel === 'notifs'
                        ? 'bg-[#404249] text-white'
                        : 'text-slate-400 hover:bg-[#35373c] hover:text-slate-200'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 font-semibold">🚨-notifications</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current Discord User Bar at bottom left */}
            <div className="p-2.5 bg-[#232428] border-t border-[#1e1f22] flex items-center gap-2">
              <img
                src={currentMember.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                alt={currentMember.username}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
              <div className="text-left overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{currentMember.username}</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {currentMember.roles.includes('Admin') ? 'Admin' : 'Membre'}
                </div>
              </div>
            </div>
          </div>

          {/* Discord Main Chat Window */}
          <div className="flex-1 bg-[#313338] flex flex-col justify-between overflow-hidden">
            {/* Channel Top Header */}
            <div className="h-12 border-b border-[#2b2d31] px-4 flex items-center gap-2 shadow-sm bg-[#313338]">
              <Hash className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-white text-sm">
                {activeChannel === 'jarvis'
                  ? '🤖-jarvis'
                  : activeChannel === 'logs'
                  ? 'logs'
                  : activeChannel === 'notifs'
                  ? '🚨-notifications-admin'
                  : modules.find((m) => m.id === activeChannel)?.channelName || 'salon'}
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
              {activeChannel === 'jarvis' && (
                <>
                  {jarvisMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <img
                        src={msg.avatar}
                        alt={msg.sender}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover mt-0.5"
                      />
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white flex items-center gap-1">
                            <span>{msg.sender}</span>
                            {msg.bot && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-600 text-white font-bold uppercase">
                                BOT
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                        </div>

                        {/* Embed Component */}
                        {msg.embed && (
                          <div className="bg-[#2b2d31] border-l-4 border-indigo-500 rounded-r-lg p-4 space-y-3 text-xs shadow-md">
                            <h4 className="font-bold text-white text-sm">{msg.embed.title}</h4>
                            <p className="text-slate-300 leading-relaxed">{msg.embed.description}</p>

                            {msg.embed.fields && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                                {msg.embed.fields.map((f: any, idx: number) => (
                                  <div key={idx} className="bg-[#1e1f22] p-2.5 rounded-md border border-slate-800">
                                    <div className="font-bold text-indigo-300 text-[11px] mb-0.5">{f.name}</div>
                                    <div className="text-[11px] text-slate-300">{f.value}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Interactive Button Bar in #🤖-jarvis */}
                  <div className="pt-4 border-t border-[#2b2d31] space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400">
                      Boutons d'action disponibles dans #🤖-jarvis :
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleButtonClick('profile')}
                        className="px-3.5 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                      >
                        <span>👤 Mon profil</span>
                      </button>

                      <button
                        onClick={() => handleButtonClick('formation')}
                        className="px-3.5 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                      >
                        <span>📚 Ma formation</span>
                      </button>

                      <button
                        onClick={() => handleButtonClick('quiz')}
                        className="px-3.5 py-2 rounded-lg bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                      >
                        <span>🎯 Mes quiz</span>
                      </button>

                      <button
                        onClick={() => handleButtonClick('tickets')}
                        className="px-3.5 py-2 rounded-lg bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                      >
                        <span>🎫 Mes tickets</span>
                      </button>

                      {currentMember.roles.includes('Admin') && (
                        <button
                          onClick={() => handleButtonClick('admin')}
                          className="px-3.5 py-2 rounded-lg bg-[#da373c] hover:bg-[#a1282b] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                        >
                          <span>🛠️ Administration</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeChannel !== 'jarvis' && (
                <div className="p-4 bg-[#2b2d31] border border-[#1e1f22] rounded-xl text-xs space-y-3">
                  <h4 className="font-bold text-white text-sm">
                    Salon de Formation : #{modules.find((m) => m.id === activeChannel)?.channelName || activeChannel}
                  </h4>
                  <p className="text-slate-300">
                    {modules.find((m) => m.id === activeChannel)?.content || 'Salon d\'historique et de notifications.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Form Modal in Simulator */}
      {activeQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setActiveQuizModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">{activeQuizModal.title}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Score requis : <span className="text-emerald-400 font-bold">{activeQuizModal.minScore}%</span>
            </p>

            {quizResult ? (
              <div className="space-y-4 text-center py-6">
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                    quizResult.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {quizResult.passed ? <CheckCircle2 className="w-10 h-10" /> : <X className="w-10 h-10" />}
                </div>

                <h4 className="text-xl font-bold text-white">
                  {quizResult.passed ? '🎉 Quiz Validé avec Succès !' : '❌ Quiz Non Validé'}
                </h4>

                <div className="text-2xl font-mono font-bold text-indigo-400">
                  Score : {quizResult.score}%
                </div>

                <p className="text-xs text-slate-300">
                  {quizResult.passed
                    ? 'Le rôle du module a été automatiquement attribué sur Discord.'
                    : 'Relisez le contenu du module et tentez un nouvel essai.'}
                </p>

                <button
                  onClick={() => setActiveQuizModal(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuizFormSubmit} className="space-y-4 text-xs">
                {activeQuizModal.questions.map((q, qIndex) => (
                  <div key={q.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="font-semibold text-white">
                      Q{qIndex + 1}. {q.text}
                    </div>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIndex) => (
                        <label
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                            quizAnswers[qIndex] === optIndex
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${qIndex}`}
                            checked={quizAnswers[qIndex] === optIndex}
                            onChange={() => {
                              const updated = [...quizAnswers];
                              updated[qIndex] = optIndex;
                              setQuizAnswers(updated);
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Soumettre le Quiz
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Ticket Create Form Modal in Simulator */}
      {isTicketFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setIsTicketFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3">🎫 Ouvrir un Ticket d'Assistance</h3>

            <form onSubmit={handleTicketCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Catégorie</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="Accès / Rôles">Accès / Rôles</option>
                  <option value="Quiz & Tentatives">Quiz & Tentatives</option>
                  <option value="Question Générale">Question Générale</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sujet de la demande</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Ex : Problème d'accès au module 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Message détaillé</label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20"
              >
                Créer le Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
