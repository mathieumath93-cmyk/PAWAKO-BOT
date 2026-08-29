import React from 'react';
import {
  Users,
  CheckCircle2,
  BookOpen,
  Award,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  Hash,
  Shield,
  FileCode,
  Server,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AdminLog } from '../types';
import { serverService } from '../services/serverService';
import { memberService } from '../services/memberService';
import { moduleService } from '../services/moduleService';
import { quizService } from '../services/quizService';
import { discordService } from '../services/discordService';
import { roleService } from '../services/roleService';
import { store } from '../services/store';

interface OverviewViewProps {
  logs: AdminLog[];
  onNavigate: (tab: string) => void;
  onCreateModuleClick: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  logs,
  onNavigate,
  onCreateModuleClick,
}) => {
  const activeServer = serverService.getActiveServer();
  const members = memberService.getMembers();
  const modules = moduleService.getModules();
  const quizzes = quizService.getQuizzes();
  const channels = discordService.getChannels();
  const roles = roleService.getRoles();
  const session = store.getSession();

  const totalMembersCount = activeServer?.memberCount || members.length || 0;
  const realLogs = logs && logs.length > 0 ? logs.slice(0, 5) : store.getLogs().slice(0, 5);

  const candidates = members.filter((m) => !m.roles?.includes('Admin') && !m.roles?.includes('Lead Admin') && !m.roles?.includes('Staff'));
  const totalJoined = candidates.length > 0 ? candidates.length : totalMembersCount;

  const unstarted = candidates.filter((c) => (!c.progress || Object.keys(c.progress).length === 0 || c.modulesCompletedCount === 0) && (!c.candidateState || c.candidateState === 'nouveau')).length;
  const inSimulation = candidates.filter((c) => c.candidateState === 'simulation').length;
  const inTools = candidates.filter((c) => c.candidateState === 'formation_outils').length;
  const completed = candidates.filter((c) => c.candidateState === 'formation_terminee' || (c.modulesCompletedCount || 0) >= 5).length;

  const totalModulesCount = 5;
  const moduleCounts: Record<number, number> = {};
  for (let i = 1; i <= totalModulesCount; i++) moduleCounts[i] = 0;

  candidates.forEach((c) => {
    const valCount = c.modulesCompletedCount || 0;
    if (c.candidateState !== 'formation_terminee' && c.candidateState !== 'formation_outils' && c.candidateState !== 'simulation' && valCount < totalModulesCount) {
      const currentMod = Math.min(valCount + 1, totalModulesCount);
      moduleCounts[currentMod] = (moduleCounts[currentMod] || 0) + 1;
    }
  });

  const engagementRate = totalJoined > 0 ? Math.round(((totalJoined - unstarted) / totalJoined) * 100) : 0;
  const integrationRate = totalJoined > 0 ? Math.round((completed / totalJoined) * 100) : 0;

  // Dynamic Chart based on real module & quiz counts
  const dynamicChartData = [
    { name: 'Rôles', count: roles.length },
    { name: 'Salons', count: channels.length },
    { name: 'Modules', count: modules.length },
    { name: 'Quiz', count: quizzes.length },
    { name: 'Membres', count: members.length },
  ];

  return (
    <div className="space-y-6">
      {/* Banner if No Server */}
      {!activeServer && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">Aucun serveur Discord synchronisé</h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Pour afficher et gérer vos salons, rôles et membres réels, lancez la synchronisation avec votre serveur Discord.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('discord-sync')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Synchroniser un serveur</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Bienvenue, <span className="text-indigo-400">{session.username}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {activeServer ? (
              <>Connecté au serveur <strong className="text-slate-200">{activeServer.name}</strong> • Statistiques réelles synchronisées.</>
            ) : (
              <>Aucun serveur Discord connecté • Lancez la synchronisation dans l'onglet Discord Sync.</>
            )}
          </p>
        </div>

        <button
          onClick={() => onNavigate('onboarding')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Configurer Onboarding & Modules</span>
        </button>
      </div>

      {/* 📈 Bilan Global Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              📈 Bilan Global du Parcours de Formation PAWAKO
            </h2>
          </div>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-3 py-1 rounded-full border border-indigo-500/20">
            Stats Temps Réel
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono">
            <p className="text-slate-200 font-bold">👥 Total des Inscrits : <span className="text-white">{totalJoined} membres</span></p>
            <p className="text-slate-400">😴 N'ayant encore rien lancé : <span className="text-amber-400 font-bold">{unstarted} membre(s)</span></p>
            
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <p className="text-indigo-300 font-bold mb-1">📚 Répartition par Étape :</p>
              {Object.keys(moduleCounts).map((modNum) => (
                <p key={modNum} className="text-xs text-slate-400 pl-3">
                  • Module {modNum} : <span className="text-white font-semibold">{moduleCounts[Number(modNum)]} candidat(s)</span>
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-blue-400 font-bold">🎯 En Simulation : <span className="text-white">{inSimulation} candidat(s)</span></p>
              <p className="text-amber-400 font-bold">🛠️ En Formation Outils : <span className="text-white">{inTools} candidat(s)</span></p>
              <p className="text-emerald-400 font-bold">🚀 En Intégration / Intégré : <span className="text-white">{completed} candidat(s)</span></p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
              <p className="text-slate-300">📊 Taux d'engagement global : <span className="text-white font-bold">{engagementRate}%</span></p>
              <p className="text-slate-300">🎓 Taux d'intégration : <span className="text-emerald-400 font-bold">{integrationRate}%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Membres Discord</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{totalMembersCount.toLocaleString('fr-FR')}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              Discord <CheckCircle2 className="w-3 h-3 ml-1" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Membres sur {activeServer?.name || 'le serveur'}</p>
        </div>

        {/* Channels Count */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salons Connectés</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{channels.length}</span>
            <span className="text-xs font-semibold text-slate-400 font-mono">salons textuels</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Actifs sur le serveur</p>
        </div>

        {/* Active Modules */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modules de Formation</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{modules.length}</span>
            <span className="text-xs font-semibold text-cyan-400 font-mono">{quizzes.length} quiz associés</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Formations créées sur la plateforme</p>
        </div>

        {/* Discord Roles */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rôles Discord</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{roles.length}</span>
            <span className="text-xs font-semibold text-amber-400 font-mono">rôles attribuables</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Synchronisés depuis Discord</p>
        </div>
      </div>

      {/* Grid: Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Structure Overview Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Vue d'Ensemble des Éléments Connectés</h2>
              <p className="text-xs text-slate-400">Répartition des entités réelles synchronisées avec le serveur</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Recent Activity Log */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Journal d'Activité Réel</h2>
              <button onClick={() => onNavigate('logs')} className="text-xs text-indigo-400 hover:underline font-semibold">
                Journal Complet
              </button>
            </div>

            {realLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                Aucune activité enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {realLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                      ⚡
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate">{log.action}</div>
                      <div className="text-[11px] text-slate-400 truncate">{log.details || log.executorName}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{log.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Bot Discord & Gateway REST</span>
            <span className="text-emerald-400 font-semibold font-mono">En Ligne</span>
          </div>
        </div>
      </div>
    </div>
  );
};

