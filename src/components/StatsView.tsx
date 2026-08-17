import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { Member, TrainingModule } from '../types';

interface StatsViewProps {
  members: Member[];
  modules: TrainingModule[];
}

export const StatsView: React.FC<StatsViewProps> = ({ members, modules }) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [activeDef, setActiveDef] = useState<string>('interaction_jarvis');

  // Module completion funnel data
  const moduleFunnelData = modules.map((m) => {
    let count = 0;
    members.forEach((mem) => {
      if (mem.progress[m.id]?.status === 'valide') {
        count++;
      }
    });
    return {
      name: m.title.split(':')[0],
      validations: count,
    };
  });

  // Pass vs Fail distribution
  const passFailData = [
    { name: 'Réussite Quiz', value: 88, color: '#10b981' },
    { name: 'Échec Quiz', value: 12, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Statistiques & Analytics de Formation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyse détaillée de l'engagement des membres, du taux de réussite aux quiz et du rythme de progression.
          </p>
        </div>

        {/* Period Selector (Aujourd'hui, 7 derniers jours, 30 derniers jours) */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(
            [
              { id: 'today', label: "Aujourd'hui" },
              { id: '7days', label: '7 derniers jours' },
              { id: '30days', label: '30 derniers jours' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Member Definition Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Définition du Membre "Actif"</div>
            <p className="text-[11px] text-slate-400">
              L'administrateur peut configurer le critère déclenchant le statut actif.
            </p>
          </div>
        </div>

        <select
          value={activeDef}
          onChange={(e) => setActiveDef(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
        >
          <option value="interaction_jarvis">Interaction avec Jarvis (#🤖-jarvis)</option>
          <option value="quiz_attempt">Soumission de Quiz</option>
          <option value="ticket_activity">Ouverture / Message de Ticket</option>
          <option value="module_progress">Progression de Module</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Module Validations */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Validations par Module</span>
          </h3>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleFunnelData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="validations" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Pass / Fail Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Taux de Réussite / Échec</span>
          </h3>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFailData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-semibold pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Réussite : 88.5%</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Échec : 11.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
