import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  MessageSquare,
  Send,
  User,
  X,
} from 'lucide-react';
import { Ticket } from '../types';

interface TicketsViewProps {
  tickets: Ticket[];
  onAddMessage: (ticketId: string, content: string) => void;
  onCloseTicket: (ticketId: string) => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  onAddMessage,
  onCloseTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [statusFilter, setStatusFilter] = useState<'tous' | 'ouvert' | 'ferme'>('tous');
  const [transcriptModalTicket, setTranscriptModalTicket] = useState<Ticket | null>(null);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'tous') return true;
    return t.status === statusFilter;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;
    onAddMessage(selectedTicket.id, replyContent);
    setReplyContent('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>Gestion des Tickets & Transcripts Discord</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consultez les demandes d'aide des membres, échangez en direct et générez des transcripts JSON archivés dans PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['tous', 'ouvert', 'ferme'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'tous' ? 'Tous' : st === 'ouvert' ? 'Ouverts' : 'Fermés'}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List & Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tickets List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Tickets ({filteredTickets.length})
          </h3>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedTicket?.id === t.id
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-300">
                    Ticket #{t.ticketNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.status === 'ouvert'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.status === 'ouvert' ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white leading-tight mb-1">
                  {t.subject}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>{t.memberName}</span>
                  <span>{t.createdAt}</span>
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                Aucun ticket correspondant.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Conversation */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-[550px] justify-between">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-400">
                      Ticket #{selectedTicket.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-400">
                    Créé par {selectedTicket.memberName} le {selectedTicket.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status === 'ferme' ? (
                    <button
                      onClick={() => setTranscriptModalTicket(selectedTicket)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Consulter Transcript JSON</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onCloseTicket(selectedTicket.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fermer Ticket & Générer Transcript</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages History Stream */}
              <div className="py-4 space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-2 scrollbar-thin">
                {selectedTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${
                      m.isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                      <span className={m.isAdmin ? 'font-bold text-indigo-400' : 'font-medium text-slate-300'}>
                        {m.senderName}
                      </span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        m.isAdmin
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedTicket.status === 'ouvert' ? (
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Répondre au ticket en tant qu'administrateur..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer</span>
                  </button>
                </form>
              ) : (
                <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-500">
                  Ce ticket est fermé. Le transcript a été sauvegardé dans PostgreSQL.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2 py-20">
              <MessageSquare className="w-10 h-10 text-slate-700" />
              <p className="text-xs font-medium">Sélectionnez un ticket pour consulter la discussion.</p>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {transcriptModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setTranscriptModalTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Transcript Officiel — Ticket #{transcriptModalTicket.ticketNumber}</span>
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Stocker sous format text/JSON dans Supabase PostgreSQL • Archivé le {transcriptModalTicket.closedAt}
            </p>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {transcriptModalTicket.transcriptJson || 'Aucun transcript généré.'}
            </pre>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setTranscriptModalTicket(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
