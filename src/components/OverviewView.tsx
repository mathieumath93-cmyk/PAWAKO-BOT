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

interface OverviewViewProps {
  logs: AdminLog[];
  onNavigate: (tab: string) => void;
  onCreateModuleClick: () => void;
}

const chartData = [
  { day: 'Lun', members: 1120, modules: 320, quizzes: 280 },
  { day: 'Mar', members: 1150, modules: 380, quizzes: 340 },
  { day: 'Mer', members: 1180, modules: 450, quizzes: 410 },
  { day: 'Jeu', members: 1210, modules: 510, quizzes: 470 },
  { day: 'Ven', members: 1235, modules: 590, quizzes: 530 },
  { day: 'Sam', members: 1242, modules: 640, quizzes: 580 },
  { day: 'Dim', members: 1248, modules: 690, quizzes: 620 },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  logs,
  onNavigate,
  onCreateModuleClick,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Bienvenue, <span className="text-indigo-400">Anthony</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gérez votre serveur Discord et suivez l'apprentissage de votre communauté en un seul endroit.
          </p>
        </div>

        <button
          onClick={onCreateModuleClick}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Créer un Module</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Members</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">1,248</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              +12% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Membres synchronisés Discord</p>
        </div>

        {/* Active Members */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Members</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">863</span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">69% du serveur</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Actifs ces 7 derniers jours</p>
        </div>

        {/* Modules Completed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modules Completed</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">4,821</span>
            <span className="text-xs font-semibold text-cyan-400 flex items-center">
              +8.4% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Formations validées au total</p>
        </div>

        {/* Average Quiz Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Quiz Score</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">87%</span>
            <span className="text-xs font-semibold text-amber-400 font-mono">17.4 / 20</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Taux de réussite global</p>
        </div>
      </div>

      {/* Grid: Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Progression de la Formation</h2>
              <p className="text-xs text-slate-400">Évolution des membres actifs et des quiz complétés sur 7 jours</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>Modules</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Quiz</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorModules" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorQuiz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="modules" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorModules)" />
                <Area type="monotone" dataKey="quizzes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorQuiz)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Activité Récente</h2>
              <button onClick={() => onNavigate('logs')} className="text-xs text-indigo-400 hover:underline font-semibold">
                Voir tout
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">John a complété le Module 3</div>
                  <div className="text-[11px] text-slate-400">Score Quiz : 18/20 (PASS)</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">Il y a 12 min</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  🎯
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Sarah a réussi le Quiz 2</div>
                  <div className="text-[11px] text-slate-400">Nouveau rôle 'Senior' attribué</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">Il y a 28 min</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  👋
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Mike a rejoint la formation</div>
                  <div className="text-[11px] text-slate-400">Rôle 'Trainee' attribué</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">Il y a 45 min</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  ⚠️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Emma a échoué au Quiz 4</div>
                  <div className="text-[11px] text-slate-400">Score : 12/20 (Nécessite 16/20)</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-1">Il y a 1 heure</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Bots & Gateway Discord</span>
            <span className="text-emerald-400 font-semibold font-mono">100% Fonctionnel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
