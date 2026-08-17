import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Shield,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { Member } from '../types';
import { memberService } from '../services/memberService';

interface MembersViewProps {
  members: Member[];
  onRefresh: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onRefresh,
  onShowToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMembers = memberService.filterMembers(filterStatus, searchQuery);

  const handleResetProgress = (memberId: string, username: string) => {
    if (confirm(`Réinitialiser la progression de ${username} ?`)) {
      memberService.resetProgress(memberId);
      onRefresh();
      onShowToast('Progression réinitialisée', `Pour ${username}`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Membres du Serveur Discord ({filteredMembers.length})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consultez le statut, la progression et les résultats des apprenants en temps réel.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par pseudo ou ID Discord..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
            { id: 'completed', label: 'Completed' },
            { id: 'failed', label: 'Failed' },
            { id: 'in_progress', label: 'In progress' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === f.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Discord ID</th>
                <th className="p-4">Role</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Modules</th>
                <th className="p-4">Average Score</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredMembers.map((member) => {
                const completedCount = member.modulesCompletedCount || 2;
                const progressPct = Math.round((completedCount / 5) * 100);

                return (
                  <tr key={member.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Member Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={member.username}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {member.username}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">@{member.username.toLowerCase().replace(/\s+/g, '')}</div>
                        </div>
                      </div>
                    </td>

                    {/* Discord ID */}
                    <td className="p-4 font-mono text-slate-400 text-[11px]">{member.discordId}</td>

                    {/* Role */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-[11px]">
                        {member.roles[0] || 'Trainee'}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="p-4 w-36">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Progress</span>
                          <span className="font-bold text-indigo-400">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    </td>

                    {/* Modules Completed */}
                    <td className="p-4 font-mono text-slate-300">{completedCount} / 5</td>

                    {/* Average Score */}
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {member.averageScore || 17.4} / 20
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {member.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Last Activity */}
                    <td className="p-4 text-slate-400 text-[11px] font-mono">2 min ago</td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleResetProgress(member.id, member.username)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                        title="Réinitialiser la progression"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
