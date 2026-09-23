import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Radio,
  Search,
  MessageSquare,
  Users,
  Ticket,
  Shield,
  Send,
  RefreshCw,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Sparkles,
  Paperclip,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ArrowDown,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import { liveChannelService, LiveChannelItem, LiveMessage } from '../services/liveChannelService';
import { Member } from '../types';
import { memberService } from '../services/memberService';

interface LiveChannelsMonitorViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onSelectMember?: (member: Member) => void;
}

export const LiveChannelsMonitorView: React.FC<LiveChannelsMonitorViewProps> = ({
  onShowToast,
  onSelectMember,
}) => {
  const [channels, setChannels] = useState<LiveChannelItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>('global'); // 'global' or channelId
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [globalStream, setGlobalStream] = useState<LiveMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'candidate' | 'ticket' | 'staff' | 'unread'>('all');
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isGatewayConnected, setIsGatewayConnected] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [hasNewScrollMessages, setHasNewScrollMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickTemplates = [
    '👋 Bonjour ! As-tu besoin d\'aide sur ce module ?',
    '⏳ Pense à valider ton quiz du jour pour débloquer la suite.',
    '🎯 Tout est bon pour ton RDV de Simulation à 14h00 HF.',
    '⚡ N\'oublie pas : la relance rapide fait toute la différence en chatting.',
    '🏆 Félicitations pour ton avancée, continue comme ça !',
  ];

  // Load initial channel directory
  const loadChannels = async (silent = false) => {
    if (!silent) setIsLoadingChannels(true);
    try {
      const list = await liveChannelService.getChannels();
      setChannels(list);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoadingChannels(false);
    }
  };

  // Load messages for currently selected channel
  const loadActiveMessages = async (chanId: string) => {
    if (chanId === 'global') return;
    setIsLoadingMessages(true);
    try {
      const history = await liveChannelService.getChannelMessages(chanId, 50);
      setMessages(history);
      // Clear unread for this channel
      setUnreadMap((prev) => {
        const next = { ...prev };
        delete next[chanId];
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannelId && selectedChannelId !== 'global') {
      loadActiveMessages(selectedChannelId);
    }
  }, [selectedChannelId]);

  // Real-time Gateway stream subscription
  useEffect(() => {
    const playNotificationSound = () => {
      if (!soundEnabled) return;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch {
        // audio context blocked or unsupported
      }
    };

    const unsubscribe = liveChannelService.subscribe(
      (newMsg: LiveMessage) => {
        // 1. Add to global live stream
        setGlobalStream((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const next = [...prev, newMsg];
          return next.slice(-150); // keep last 150
        });

        // 2. If viewing this channel, append immediately
        if (selectedChannelId === newMsg.channelId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (selectedChannelId !== 'global') {
          // Increment unread counter for that channel
          setUnreadMap((prev) => ({
            ...prev,
            [newMsg.channelId]: (prev[newMsg.channelId] || 0) + 1,
          }));
        }

        // 3. Update channel lastMessage preview in channels list
        setChannels((prev) =>
          prev.map((c) => {
            if (c.id === newMsg.channelId) {
              return {
                ...c,
                lastMessage: {
                  id: newMsg.id,
                  content: newMsg.content || '[Média]',
                  author: newMsg.author.username,
                  createdAt: newMsg.createdAt,
                  isBot: newMsg.author.isBot,
                },
              };
            }
            return c;
          })
        );

        // 4. Play alert chime if message is from a candidate (human)
        if (!newMsg.author.isBot) {
          playNotificationSound();
        }
      },
      (connected) => {
        setIsGatewayConnected(connected);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedChannelId, soundEnabled]);

  // Auto-scroll on new message
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setHasNewScrollMessages(false);
      } else {
        setHasNewScrollMessages(true);
      }
    }
  }, [messages, globalStream]);

  const activeChannel = useMemo(() => {
    if (selectedChannelId === 'global') return null;
    return channels.find((c) => c.id === selectedChannelId) || null;
  }, [channels, selectedChannelId]);

  const activeCandidateMember = useMemo(() => {
    if (!activeChannel || !activeChannel.candidate) return null;
    return memberService.getMembers().find((m) => m.id === activeChannel.candidate?.id) || null;
  }, [activeChannel]);

  // Filtering channels
  const filteredChannels = useMemo(() => {
    let list = [...channels];
    if (activeFilter === 'candidate') {
      list = list.filter((c) => c.type === 'candidate');
    } else if (activeFilter === 'ticket') {
      list = list.filter((c) => c.type === 'ticket');
    } else if (activeFilter === 'staff') {
      list = list.filter((c) => c.type === 'staff');
    } else if (activeFilter === 'unread') {
      list = list.filter((c) => (unreadMap[c.id] || 0) > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.candidate?.username.toLowerCase().includes(q) ||
          c.lastMessage?.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [channels, activeFilter, searchQuery, unreadMap]);

  const handleSendMessage = async () => {
    const trimmed = textInput.trim();
    if (!trimmed || isSending || !selectedChannelId || selectedChannelId === 'global') return;

    setIsSending(true);
    try {
      const res = await liveChannelService.sendMessage(selectedChannelId, trimmed);
      if (res && res.success) {
        setTextInput('');
        if (res.message) {
          setMessages((prev) => [...prev, res.message!]);
        }
        onShowToast('🚀 Message Envoyé', `Posté en direct dans #${activeChannel?.name || 'salon'}`, 'success');
      } else {
        onShowToast('⚠️ Erreur', res?.error || 'Échec de l\'envoi', 'error');
      }
    } catch (err: any) {
      onShowToast('❌ Erreur', err?.message, 'error');
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewScrollMessages(false);
  };

  const currentDisplayMessages = selectedChannelId === 'global' ? globalStream : messages;

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadMap).reduce((acc: number, curr: number) => acc + curr, 0);
  }, [unreadMap]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar: Live Activity & Gateway Status */}
      <div className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Salons Discord en Temps Réel
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isGatewayConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isGatewayConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                  }`}
                ></span>
                {isGatewayConnected ? 'Flux Live Actif' : 'Reconnexion...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Surveillance instantanée des échanges candidats, tickets et interventions bot sans recharger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Désactiver le carillon des messages' : 'Activer le carillon sonore'}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px] font-medium">
              {soundEnabled ? 'Son ON' : 'Muet'}
            </span>
          </button>

          <button
            onClick={() => loadChannels()}
            disabled={isLoadingChannels}
            title="Rafraîchir la liste des salons"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingChannels ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Workspace: 3 Columns (Channels Sidebar / Live Chat Stream / Dossier Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Channels Directory */}
        <div className="w-80 sm:w-88 border-r border-slate-800 flex flex-col bg-slate-950/70 shrink-0">
          {/* Search & Filters */}
          <div className="p-3 border-b border-slate-800/80 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher candidat, salon, message..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tous ({channels.length})
              </button>
              <button
                onClick={() => setActiveFilter('candidate')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeFilter === 'candidate'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3" />
                Candidats
              </button>
              <button
                onClick={() => setActiveFilter('ticket')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeFilter === 'ticket'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Ticket className="w-3 h-3" />
                Tickets
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeFilter === 'unread'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Non lus {totalUnreadCount > 0 ? `(${totalUnreadCount})` : ''}
              </button>
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/80">
            {/* Global Stream Card */}
            <div
              onClick={() => setSelectedChannelId('global')}
              className={`p-3 cursor-pointer transition-all flex items-start gap-3 select-none ${
                selectedChannelId === 'global'
                  ? 'bg-indigo-600/15 border-l-4 border-indigo-500 text-white'
                  : 'hover:bg-slate-900/60 text-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    Flux Global en Direct
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Agrège tous les salons Discord en une seule timeline
                </p>
              </div>
            </div>

            {/* Individual Channels */}
            {isLoadingChannels && channels.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Chargement des salons Discord...</span>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucun salon correspondant
              </div>
            ) : (
              filteredChannels.map((chan) => {
                const isSelected = selectedChannelId === chan.id;
                const unread = unreadMap[chan.id] || 0;
                const cand = chan.candidate;

                return (
                  <div
                    key={chan.id}
                    onClick={() => setSelectedChannelId(chan.id)}
                    className={`p-3 cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                        : unread > 0
                        ? 'bg-amber-500/5 hover:bg-slate-900/80 border-l-2 border-amber-500'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Avatar / Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      {cand?.avatarUrl ? (
                        <img
                          src={cand.avatarUrl}
                          alt={cand.username}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                            chan.type === 'candidate'
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                              : chan.type === 'ticket'
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {chan.type === 'candidate' ? (
                            <Users className="w-4 h-4" />
                          ) : chan.type === 'ticket' ? (
                            <Ticket className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold text-[9px] shadow-sm animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {cand ? cand.username : `#${chan.name}`}
                        </span>
                        {chan.lastMessage && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(chan.lastMessage.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          #{chan.name}
                        </span>
                        {cand?.stage && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-indigo-300 border border-slate-700/60 shrink-0">
                            {cand.stage === 'simulation'
                              ? 'Simulation 14h'
                              : cand.stage === 'formation_terminee'
                              ? 'Terminé'
                              : 'En Cours'}
                          </span>
                        )}
                      </div>

                      {chan.lastMessage ? (
                        <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                          <span className="font-semibold text-slate-300">
                            {chan.lastMessage.isBot ? 'Bot: ' : `${chan.lastMessage.author}: `}
                          </span>
                          {chan.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Aucun message récent</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Live Messages Stream */}
        <div className="flex-1 flex flex-col bg-slate-950 relative min-w-0">
          {/* Channel Header */}
          <div className="h-14 px-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">
                  {selectedChannelId === 'global' ? '🌐 Flux Live Global Discord' : `#${activeChannel?.name || 'salon'}`}
                </span>
                {activeChannel?.candidate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Candidat : {activeChannel.candidate.username}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeChannel?.candidate && (
                <button
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                    showRightPanel
                      ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Afficher/masquer le profil du candidat"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Dossier</span>
                </button>
              )}

              {selectedChannelId !== 'global' && (
                <button
                  onClick={() => loadActiveMessages(selectedChannelId!)}
                  disabled={isLoadingMessages}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                  title="Recharger l'historique"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Messages Scroll Feed */}
          <div
            ref={chatScrollContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60"
          >
            {isLoadingMessages && currentDisplayMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs">Chargement des messages en temps réel...</p>
              </div>
            ) : currentDisplayMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="text-sm font-bold text-slate-200">
                    {selectedChannelId === 'global' ? 'Flux en direct prêt' : `Salon #${activeChannel?.name}`}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {selectedChannelId === 'global'
                      ? 'Les nouveaux messages envoyés sur le serveur Discord apparaîtront ici instantanément.'
                      : 'Aucun message récent détecté. Tu peux écrire ci-dessous pour parler directement via le bot.'}
                  </p>
                </div>
              </div>
            ) : (
              currentDisplayMessages.map((msg, idx) => {
                const isCandidateMsg = !msg.author.isBot;
                const formattedTime = new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-xs ${
                      isCandidateMsg
                        ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                        : 'bg-indigo-950/20 border-indigo-500/20 hover:border-indigo-500/40'
                    }`}
                  >
                    <img
                      src={
                        msg.author.avatarUrl ||
                        (isCandidateMsg
                          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80')
                      }
                      alt={msg.author.username}
                      className="w-8 h-8 rounded-xl object-cover shrink-0 mt-0.5 border border-slate-700"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`font-bold ${
                            isCandidateMsg ? 'text-emerald-300' : 'text-indigo-300'
                          }`}
                        >
                          {msg.author.username}
                        </span>

                        {isCandidateMsg ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                            👤 CANDIDAT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                            🤖 PAWAKO
                          </span>
                        )}

                        {selectedChannelId === 'global' && msg.channelName && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            #{msg.channelName}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 ml-auto">{formattedTime}</span>
                      </div>

                      {/* Content */}
                      <div className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed select-text">
                        {msg.content}
                      </div>

                      {/* Embeds Display */}
                      {msg.embeds && msg.embeds.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.embeds.map((emb, eIdx) => (
                            <div
                              key={eIdx}
                              className="p-2.5 rounded-xl bg-slate-900 border-l-4 border-indigo-500 text-[11px] space-y-1 text-slate-300"
                            >
                              {emb.title && <div className="font-bold text-white">{emb.title}</div>}
                              {emb.description && (
                                <div className="whitespace-pre-wrap">{emb.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attachments Display */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 text-[11px] hover:bg-slate-800 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{att.name}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* New Messages Jump Button */}
          {hasNewScrollMessages && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-6 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all animate-bounce"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Nouveaux messages ↓</span>
            </button>
          )}

          {/* Message Input Bar (when not in global view) */}
          {selectedChannelId !== 'global' ? (
            <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800 shrink-0 space-y-2 backdrop-blur-md">
              {/* Quick Template Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[10px] text-indigo-300 font-semibold whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Modèles rapides :
                </span>
                {quickTemplates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setTextInput(t)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0"
                  >
                    {t.length > 32 ? t.slice(0, 32) + '...' : t}
                  </button>
                ))}
              </div>

              {/* Text Input & Send */}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder={`Écrire en direct sous l'identité de Pawako Formation dans #${activeChannel?.name || 'salon'}... (Entrée pour envoyer)`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!textInput.trim() || isSending}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0 cursor-pointer"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Envoyer</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Envoi transparent et propre sur Discord sans balise technique
                </span>
                <span>Touche <strong>Entrée</strong> pour envoyer</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-center text-xs text-slate-400">
              💡 Sélectionnez un salon dans la colonne de gauche pour y envoyer un message en direct.
            </div>
          )}
        </div>

        {/* Right Column (Collapsible): Candidate Dossier & Quick Actions */}
        {showRightPanel && activeChannel?.candidate && activeCandidateMember && (
          <div className="w-72 border-l border-slate-800 bg-slate-950 p-4 space-y-4 shrink-0 overflow-y-auto hidden lg:block">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" /> Dossier Candidat
              </span>
              <button
                onClick={() => setShowRightPanel(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Profile Summary */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <img
                src={
                  activeCandidateMember.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={activeCandidateMember.username}
                className="w-14 h-14 rounded-2xl object-cover mx-auto border-2 border-indigo-500/40 shadow-md"
              />
              <div>
                <h4 className="font-bold text-sm text-white">{activeCandidateMember.username}</h4>
                <p className="text-[11px] text-slate-400 font-mono">ID: {activeCandidateMember.discordId}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-around text-center">
                <div>
                  <div className="text-[10px] text-slate-500">Niveau</div>
                  <div className="text-xs font-bold text-indigo-300">
                    Mod. {activeCandidateMember.currentModuleId.replace('mod-', '')}/5
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Score Moy.</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {activeCandidateMember.averageScore || 20}/20
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Badges</div>
                  <div className="text-xs font-bold text-amber-300">
                    {activeCandidateMember.badges?.length || 0} 🏅
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation 14h Status Card */}
            <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Calendar className="w-3.5 h-3.5" />
                <span>Simulation RDV 14h00</span>
              </div>
              {activeCandidateMember.simulationScheduledTimestamp ? (
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="font-medium text-emerald-400">
                    📅 {new Date(activeCandidateMember.simulationScheduledTimestamp).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })} à 14h00 HF
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Rappels auto programmés (13h00 et 14h00)
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Pas de rendez-vous programmé pour le moment.
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  if (onSelectMember) {
                    onSelectMember(activeCandidateMember);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Ouvrir Fiche Complète</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
