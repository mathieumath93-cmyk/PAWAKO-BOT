import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  HelpCircle,
  Layers,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminLog, Member, QuizAttempt, Ticket, TrainingModule } from '../types';

interface DashboardViewProps {
  members: Member[];
  modules: TrainingModule[];
  tickets: Ticket[];
  logs: AdminLog[];
  onNavigate: (tab: string) => void;
  onOpenSimulator: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  modules,
  tickets,
  logs,
  onNavigate,
  onOpenSimulator,
}) => {
  const [logFilter, setLogFilter] = useState<string>('all');

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.isActive).length;

  // Compute average progress
  let totalValidatedModules = 0;
  members.forEach((m) => {
    Object.values(m.progress).forEach((p) => {
      if ((p as any).status === 'valide') totalValidatedModules++;
    });
  });
  const maxPossibleValidations = (totalMembers * (modules.length || 1)) || 1;
  const avgCompletionPct = Math.round((totalValidatedModules / maxPossibleValidations) * 100);

  const openTickets = tickets.filter((t) => t.status === 'ouvert').length;
  const closedTickets = tickets.filter((t) => t.status === 'ferme').length;

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.category === logFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Serveur Discord Connecté • Bot En Ligne</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bienvenue sur PAWAKO FORMATION 🤖
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Supervisez en temps réel l'onboarding, la progression dans les modules, la validation des quiz et la gestion des tickets Discord.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSimulator}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Tester en direct sur Discord</span>
            </button>
            <button
              onClick={() => onNavigate('health')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Santé Système</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('members')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Membres Totaux</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalMembers}</div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeMembers} membres actifs aujourd'hui</span>
          </p>
        </div>

        <div
          onClick={() => onNavigate('modules')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Progression Moyenne</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{avgCompletionPct}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full" style={{ width: `${avgCompletionPct}%` }}></div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('quiz')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Quiz & Taux de Réussite</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">88.5%</div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>5 modules de formation actifs</span>
          </p>
        </div>

        <div
          onClick={() => onNavigate('tickets')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tickets Discord</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{openTickets} ouverts</div>
          <p className="text-xs text-slate-400 mt-1">
            {closedTickets} tickets archivés avec transcript JSON
          </p>
        </div>
      </div>

      {/* Content Grid: Modules Status & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules Overview list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Aperçu des Modules</span>
            </h3>
            <button
              onClick={() => onNavigate('modules')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Gérer →
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200">
                    {mod.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                    {mod.channelName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span className="text-indigo-400 font-medium">{mod.roleValidatedName}</span>
                  <span className="text-slate-500">Salon actif</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Journal d'Activité Récente</span>
            </h3>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {['all', 'member', 'quiz', 'ticket', 'system'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLogFilter(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                    logFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-indigo-300">{log.adminName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-200">{log.action}</span>
                  </div>
                  {log.targetMemberName && (
                    <div className="text-[11px] text-slate-400">
                      Membre ciblé : <span className="text-slate-300 font-mono">{log.targetMemberName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {log.result}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.date}</span>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                Aucune activité enregistrée dans cette catégorie.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
