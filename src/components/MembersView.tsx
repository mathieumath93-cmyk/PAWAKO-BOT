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
  RefreshCw,
  Bell,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Member } from '../types';
import { memberService } from '../services/memberService';
import { discordService } from '../services/discordService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { store } from '../services/store';

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
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const filteredMembers = memberService.filterMembers(filterStatus, searchQuery);

  const handleSyncMembers = async () => {
    setIsSyncing(true);
    const res = await discordService.fetchAndSyncRealDiscordData();
    setIsSyncing(false);
    onRefresh();
    if (res.success) {
      onShowToast('Membres Discord Synchronisés', `${memberService.getMembers().length} membres synchronisés avec succès`, 'success');
    } else {
      onShowToast('Info Synchronisation', res.message || 'Mise à jour effectuée', 'info');
    }
  };

  const handleRunInactivityWorker = async () => {
    setIsEvaluating(true);
    const res = await firebaseSyncService.checkAndApplyAutoReminders();
    setIsEvaluating(false);
    onRefresh();
    onShowToast(
      'Worker Inactivité Exécuté',
      `${res.checked} membres vérifiés • ${res.flagged} avec Auto-Reminder (6h/12h/24h)`,
      'success'
    );
  };

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
            Consultez le statut et la progression des candidats sur le serveur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunInactivityWorker}
            disabled={isEvaluating}
            className="px-3.5 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
            title="Analyser l'inactivité et ajouter le drapeau Auto-Reminder (6h, 12h, 24h)"
          >
            <Zap className={`w-4 h-4 ${isEvaluating ? 'animate-spin text-amber-200' : 'text-amber-300'}`} />
            <span>Worker Inactivité</span>
          </button>

          <button
            onClick={handleSyncMembers}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Synchroniser les Membres</span>
          </button>
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
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Actifs' },
            { id: 'in_progress', label: 'En cours' },
            { id: 'completed', label: 'Terminés' },
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
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Aucun membre trouvé. Synchronisez un serveur dans <strong className="text-indigo-400">Discord Sync</strong> pour charger les membres réels.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const completedCount = member.modulesCompletedCount || 0;
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
                      <div className="flex flex-wrap gap-1">
                        {member.roles && member.roles.filter(Boolean).length > 0 ? (
                          member.roles.filter(Boolean).map((role, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-[11px]">
                              {role.startsWith('@') ? role : `@${role}`}
                            </span>
                          ))
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-normal text-[11px]">
                            Aucun rôle
                          </span>
                        )}
                      </div>
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
                    <td className="p-4 font-mono text-slate-300">{completedCount} / {store.getModules().length || 1}</td>

                    {/* Average Score */}
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {member.averageScore !== undefined ? `${member.averageScore} / 20` : '-'}
                    </td>

                    {/* Candidate State & Status */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold">
                          {member.candidateState === 'formation_terminee'
                            ? '🎉 Terminé'
                            : member.candidateState === 'cooldown_actif'
                            ? '⏳ Cooldown'
                            : member.candidateState === 'quiz_disponible'
                            ? '📝 Quiz Prêt'
                            : member.candidateState === 'module_en_cours'
                            ? '📚 Module en cours'
                            : member.candidateState === 'bienvenue_validee'
                            ? '👋 Bienvenue'
                            : '🆕 Nouveau'}
                        </span>

                        {member.cooldownUntilTimestamp && member.cooldownUntilTimestamp > Date.now() && (
                          <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.ceil((member.cooldownUntilTimestamp - Date.now()) / 60000)}m
                          </span>
                        )}

                        {member.autoReminderFlag && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit border shadow-sm ${
                              member.autoReminderLevel === '24h'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                                : member.autoReminderLevel === '12h'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                            }`}
                            title={member.autoReminderReason || 'Relance automatique liée au retard d\'onboarding'}
                          >
                            {member.autoReminderLevel === '24h' ? (
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                            ) : (
                              <Bell className="w-3 h-3 text-amber-400" />
                            )}
                            <span>Auto-Rappel {member.autoReminderLevel || '6h'}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Activity */}
                    <td className="p-4 text-slate-400 text-[11px] font-mono">{member.lastActiveAt || 'Actif'}</td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {member.cooldownUntilTimestamp && member.cooldownUntilTimestamp > Date.now() && (
                          <button
                            onClick={() => {
                              memberService.resetCooldown(member.id);
                              onRefresh();
                              onShowToast('Cooldown Réinitialisé', `Pour ${member.username}`, 'success');
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-medium text-[10px] border border-amber-500/30 transition-colors"
                            title="Levée immédiate du cooldown"
                          >
                            🔓 Lever Cooldown
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const target = prompt(`Forcer le passage au module pour ${member.username} (saisir l'ID du module) :`, member.currentModuleId);
                            if (target) {
                              memberService.forceModule(member.id, target);
                              onRefresh();
                              onShowToast('Module forcé', `${member.username} assigné au module ${target}`, 'info');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-medium text-[10px] border border-indigo-500/30 transition-colors"
                          title="Forcer un module"
                        >
                          ⏩ Forcer Module
                        </button>

                        <button
                          onClick={() => handleResetProgress(member.id, member.username)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Réinitialiser la progression"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
