import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RefreshCw,
  MessageSquare,
  Bot,
  User,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { Member } from '../types';

interface CandidateMessage {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
    isBot: boolean;
  };
  content: string;
  createdAt: string;
  attachments?: Array<{ id: string; name: string; url: string; contentType?: string }>;
}

interface CandidateChannelChatModalProps {
  member: Member;
  allMembers?: Member[];
  onSelectMember?: (m: Member) => void;
  onClose: () => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CandidateChannelChatModal: React.FC<CandidateChannelChatModalProps> = ({
  member,
  allMembers = [],
  onSelectMember,
  onClose,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<CandidateMessage[]>([]);
  const [channelName, setChannelName] = useState<string | null>(member.personalChannelName || null);
  const [channelId, setChannelId] = useState<string | null>(member.personalChannelId || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isStaffMode, setIsStaffMode] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickTemplates = [
    '👋 Bonjour ! Comment avance ton apprentissage sur ce module ?',
    '⏳ N\'oublie pas de valider ton quiz pour débloquer la suite de ta formation.',
    '⚡ Tout est clair pour toi sur les règles de chatting et les techniques de relance ?',
    '🎉 Félicitations pour ton avancée, continue sur cette lancée !',
  ];

  const loadMessages = async (isManual = false) => {
    if (isManual) setIsLoading(true);
    try {
      const res = await fetch(`/api/candidates/${member.id}/channel/messages?limit=40`);
      const data = await res.json();
      if (data && data.success) {
        setMessages(data.messages || []);
        if (data.channelName) setChannelName(data.channelName);
        if (data.channelId) setChannelId(data.channelId);
        if (data.error && data.messages.length === 0) {
          setStatusNotice(data.error);
        } else {
          setStatusNotice(null);
        }
      } else {
        setStatusNotice(data?.error || 'Salon indisponible ou en cours d\'initialisation');
      }
    } catch (e: any) {
      setStatusNotice(`Erreur de connexion : ${e?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages(false), 8000);
    return () => clearInterval(interval);
  }, [member.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    let trimmed = textInput.trim();
    if (!trimmed || isSending) return;

    if (isStaffMode && !trimmed.startsWith('🛡️ [Staff]')) {
      trimmed = `🛡️ **[Intervention Staff Pawako]** :\n${trimmed}`;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/candidates/${member.id}/channel/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await res.json();

      if (data && data.success) {
        setTextInput('');
        if (data.channelName) setChannelName(data.channelName);
        if (data.channelId) setChannelId(data.channelId);
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        } else {
          loadMessages(false);
        }
        if (onShowToast) {
          onShowToast('🚀 Message Envoyé', `Posté en tant que Pawako Formation dans #${data.channelName || 'salon privé'}`, 'success');
        }
      } else {
        if (onShowToast) {
          onShowToast('⚠️ Échec de l\'envoi', data?.error || 'Erreur inconnue', 'error');
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('❌ Erreur réseau', err?.message, 'error');
      }
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden relative animate-fadeIn">
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={
                  member.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={member.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate">{member.username}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  #{channelName || `formation-${member.username.toLowerCase().slice(0, 15)}`}
                </span>
                {member.candidateState && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {member.candidateState.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Discord ID : <code className="text-slate-300">{member.discordId || member.id}</code></span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <Bot className="w-3 h-3" /> Réponse officielle « Pawako Formation »
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Candidate quick switcher */}
            {allMembers.length > 1 && onSelectMember && (
              <select
                value={member.id}
                onChange={(e) => {
                  const target = allMembers.find((m) => m.id === e.target.value);
                  if (target) onSelectMember(target);
                }}
                className="hidden md:block bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[160px]"
              >
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => loadMessages(true)}
              disabled={isLoading}
              title="Actualiser les messages"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status / Notice Banner */}
        {statusNotice && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{statusNotice}</span>
          </div>
        )}

        {/* Messages Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
          {isLoading && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Chargement des messages du salon privé Discord...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-sm font-bold text-slate-200">
                  Salon privé de {member.username}
                </h4>
                <p className="text-xs text-slate-400">
                  Aucun message récent dans ce salon. Dès que tu écris un message ci-dessous, le bot le postera instantanément dans son salon privé Discord avec l'identité de <strong className="text-indigo-300">Pawako Formation</strong>.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isStaffIntervention =
                msg.content.includes('Intervention Staff') ||
                msg.content.includes('[Staff]') ||
                msg.content.includes('🛡️') ||
                msg.content.includes('Staff Pawako');
              const isBotMsg = msg.author.isBot;
              const isCandidateMsg = !isBotMsg;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-start gap-3 text-xs p-2.5 rounded-xl border transition-all ${
                    isStaffIntervention
                      ? 'bg-amber-950/25 border-amber-500/40 text-amber-100 shadow-sm'
                      : isBotMsg
                      ? 'bg-indigo-950/20 border-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <img
                    src={
                      msg.author.avatarUrl ||
                      (isStaffIntervention
                        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                        : isBotMsg
                        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')
                    }
                    alt={msg.author.username}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-slate-700"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`font-bold ${
                          isStaffIntervention
                            ? 'text-amber-300'
                            : isBotMsg
                            ? 'text-indigo-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {msg.author.username}
                      </span>

                      {/* Distinctive Roles Badges */}
                      {isStaffIntervention ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          🛡️ STAFF HUMAIN
                        </span>
                      ) : isBotMsg ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1">
                          🤖 BOT AUTO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                          👤 CANDIDAT
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500">{formattedTime}</span>
                    </div>

                    <div className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed select-text">
                      {msg.content}
                    </div>

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

        {/* Quick Suggestion Templates */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] text-indigo-300 font-semibold whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Modèles rapides :
            </span>
            {quickTemplates.map((t, i) => (
              <button
                key={i}
                onClick={() => setTextInput(t)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-200 text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors cursor-pointer shrink-0"
              >
                {t.length > 35 ? t.slice(0, 35) + '...' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input & Send Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={isStaffMode}
                onChange={(e) => setIsStaffMode(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
              />
              <span className={`text-[11px] font-semibold flex items-center gap-1 ${isStaffMode ? 'text-amber-300' : 'text-slate-400'}`}>
                🛡️ Intervenir en tant que Staff Humain (badge prioritaire)
              </span>
            </label>
            <span className="text-[10px] text-slate-500">
              Salon : <code className="text-slate-300">#{channelName || 'salon-prive'}</code>
            </span>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={
                isStaffMode
                  ? `Répondre en tant que Staff Humain à ${member.username}...`
                  : `Écrire au nom de Pawako Formation à ${member.username}...`
              }
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
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
            <span>
              💡 <strong>Astuce :</strong> Le message apparaît sous l'identité officielle du bot dans son salon privé Discord.
            </span>
            <span>Touche <strong>Entrée</strong> pour envoyer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
