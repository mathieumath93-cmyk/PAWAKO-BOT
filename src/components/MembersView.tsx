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
  Award,
  Calendar,
  X,
  Medal,
  Sparkles,
  Lock,
  Trophy,
  Target,
  GraduationCap,
  Wrench,
  UserX,
} from 'lucide-react';
import { Member } from '../types';
import { memberService } from '../services/memberService';
import { discordService } from '../services/discordService';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { store } from '../services/store';
import { SYSTEM_BADGES, badgeService } from '../services/badgeService';

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
  const [badgeModalMember, setBadgeModalMember] = useState<Member | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    member: Member;
    type: 'simulation' | 'tools';
  } | null>(null);
  const [customDatetime, setCustomDatetime] = useState<string>('');

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
            { id: 'inactive_3d', label: '🔴 Inactifs 3j' },
            { id: 'kicked_inactivity', label: '🚨 Expulsés 3j' },
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
                <th className="p-4">Badges & Succès</th>
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
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
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

                    {/* Badges Column */}
                    <td className="p-4">
                      <button
                        onClick={() => setBadgeModalMember(member)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:bg-slate-800 transition-colors text-amber-300 font-medium text-[11px] group/b"
                        title="Cliquer pour voir le mur des badges & attribuer des succès"
                      >
                        <Medal className="w-3.5 h-3.5 text-amber-400 group-hover/b:scale-110 transition-transform" />
                        {member.badges && member.badges.length > 0 ? (
                          <span className="flex items-center gap-1 font-mono font-bold">
                            {member.badges.map((b) => b.emoji).slice(0, 4).join(' ')}
                            <span className="text-[10px] text-amber-400 font-semibold">({member.badges.length})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">0 badge</span>
                        )}
                      </button>
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          member.candidateState === 'expulse_inactivite'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                        }`}>
                          {member.candidateState === 'expulse_inactivite'
                            ? '🚨 Expulsé 3j Inactivité'
                            : member.candidateState === 'formation_terminee'
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
                        <button
                          onClick={() => setBadgeModalMember(member)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-medium text-[10px] border border-amber-500/30 transition-colors flex items-center gap-1"
                          title="Consulter et attribuer les badges & succès du membre"
                        >
                          <Medal className="w-3 h-3 text-amber-400" />
                          <span>Badges</span>
                        </button>

                        {member.isActive &&
                          !member.roles?.some((r) => {
                            const l = (r || '').toLowerCase();
                            return l.includes('admin') || l.includes('staff') || l.includes('formateur');
                          }) && (
                            <button
                              onClick={() => {
                                if (confirm(`Expulser le candidat ${member.username} du serveur Discord pour inactivité de 3 jours ?`)) {
                                  memberService.kickMemberForInactivity(member.id, 'Expulsion manuelle Staff (inactivité 3j)');
                                  onRefresh();
                                  onShowToast('🚨 Kick-off Exécuté', `${member.username} a été expulsé(e) et notifié(e).`, 'warning');
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 font-medium text-[10px] border border-red-500/30 transition-colors flex items-center gap-1"
                              title="Expulser manuellement le candidat du serveur Discord pour 3 jours d'inactivité"
                            >
                              <UserX className="w-3 h-3 text-red-400" />
                              <span>Kick-off 3j</span>
                            </button>
                          )}

                        <button
                          onClick={() => {
                            if (confirm(`Valider la simulation pour ${member.username} et programmer la Formation Outils à 10h00 HF ?`)) {
                              memberService.validateSimulation(member.id, 'Anthony (Admin Dashboard)');
                              onRefresh();
                              onShowToast('🏆 Simulation Validée', `Le candidat ${member.username} a été validé et convoqué pour la Formation Outils à 10h00 HF. Notifications transmises à Mahsa et Mathieu.`, 'success');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 font-medium text-[10px] border border-teal-500/30 transition-colors flex items-center gap-1"
                          title="Valider la simulation du candidat et programmer sa Formation Outils à 10h00 HF"
                        >
                          <Award className="w-3 h-3 text-teal-400" />
                          <span>Valider Simu (10h HF)</span>
                        </button>

                        <button
                          onClick={() => {
                            setRescheduleTarget({ member, type: 'simulation' });
                            setCustomDatetime('');
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-medium text-[10px] border border-blue-500/30 transition-colors flex items-center gap-1"
                          title="Reprogrammer la date et l'heure de la Simulation (14h00 HF)"
                        >
                          <Calendar className="w-3 h-3 text-blue-400" />
                          <span>Reprog Simu</span>
                        </button>

                        <button
                          onClick={() => {
                            setRescheduleTarget({ member, type: 'tools' });
                            setCustomDatetime('');
                          }}
                          className="px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 font-medium text-[10px] border border-purple-500/30 transition-colors flex items-center gap-1"
                          title="Reprogrammer la date et l'heure de la Formation Outils (10h00 HF)"
                        >
                          <Calendar className="w-3 h-3 text-purple-400" />
                          <span>Reprog Outils</span>
                        </button>

                        <button
                          onClick={() => {
                            memberService.resetCooldown(member.id);
                            onRefresh();
                            onShowToast('⚡ Cooldown Annulé', `Le candidat ${member.username} peut repasser son quiz immédiatement.`, 'success');
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-medium text-[10px] border border-amber-500/30 transition-colors flex items-center gap-1"
                          title="Levée immédiate du cooldown & déblocage du quiz"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Annuler Cooldown</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Réinitialiser le module en cours pour ${member.username} ?`)) {
                              memberService.resetCurrentModule(member.id);
                              onRefresh();
                              onShowToast('🔄 Module Réinitialisé', `Les tentatives du module en cours pour ${member.username} ont été réinitialisées.`, 'success');
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-medium text-[10px] border border-emerald-500/30 transition-colors flex items-center gap-1"
                          title="Réinitialiser le module actuel et autoriser un nouvel essai"
                        >
                          <RefreshCw className="w-3 h-3 text-emerald-400" />
                          <span>Reset Module</span>
                        </button>

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
                          ⏩ Forcer
                        </button>

                        <button
                          onClick={() => handleResetProgress(member.id, member.username)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Réinitialiser TOUTE la progression"
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

      {/* --- RESCHEDULE SESSION MODAL --- */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setRescheduleTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${rescheduleTarget.type === 'simulation' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  Reprogrammer {rescheduleTarget.type === 'simulation' ? 'le Test de Simulation' : 'la Formation Outils'}
                </h3>
                <p className="text-xs text-slate-400">
                  Candidat : <span className="font-semibold text-slate-200">{rescheduleTarget.member.username}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300">
                <span className="text-slate-400 block mb-1 font-medium">Créneau actuellement programmé :</span>
                {rescheduleTarget.type === 'simulation' ? (
                  rescheduleTarget.member.simulationScheduledTimestamp ? (
                    <span className="font-mono text-blue-300 font-bold">
                      {new Date(rescheduleTarget.member.simulationScheduledTimestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} HF
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Non programmé</span>
                  )
                ) : (
                  rescheduleTarget.member.toolsFormationScheduledTimestamp ? (
                    <span className="font-mono text-purple-300 font-bold">
                      {new Date(rescheduleTarget.member.toolsFormationScheduledTimestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} HF
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Non programmé</span>
                  )
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Sélectionner un nouveau créneau :
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      const now = new Date();
                      const nextDay = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
                      nextDay.setDate(nextDay.getDate() + 1);
                      nextDay.setHours(rescheduleTarget.type === 'simulation' ? 14 : 10, 0, 0, 0);
                      
                      const ts = nextDay.getTime();
                      if (rescheduleTarget.type === 'simulation') {
                        memberService.rescheduleSimulation(rescheduleTarget.member.id, ts, 'Staff (Dashboard)');
                      } else {
                        memberService.rescheduleToolsFormation(rescheduleTarget.member.id, ts, 'Staff (Dashboard)');
                      }
                      onRefresh();
                      onShowToast('📅 Session Reprogrammée', `Rendez-vous fixé à demain ${rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF. Notification transmise au candidat sur Discord.`, 'success');
                      setRescheduleTarget(null);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors text-left flex flex-col"
                  >
                    <span className="font-bold text-white">Demain {rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF</span>
                    <span className="text-[10px] text-slate-400">Rendez-vous par défaut</span>
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      const today = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
                      today.setHours(rescheduleTarget.type === 'simulation' ? 14 : 10, 0, 0, 0);
                      
                      const ts = today.getTime();
                      if (rescheduleTarget.type === 'simulation') {
                        memberService.rescheduleSimulation(rescheduleTarget.member.id, ts, 'Staff (Dashboard)');
                      } else {
                        memberService.rescheduleToolsFormation(rescheduleTarget.member.id, ts, 'Staff (Dashboard)');
                      }
                      onRefresh();
                      onShowToast('📅 Session Reprogrammée', `Rendez-vous fixé à aujourd'hui ${rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF. Notification transmise au candidat sur Discord.`, 'success');
                      setRescheduleTarget(null);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors text-left flex flex-col"
                  >
                    <span className="font-bold text-white">Aujourd'hui {rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF</span>
                    <span className="text-[10px] text-slate-400">Rendez-vous ce jour</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Ou choisir une date & heure spécifique :
                  </label>
                  <input
                    type="datetime-local"
                    value={customDatetime}
                    onChange={(e) => setCustomDatetime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Annuler
              </button>

              <button
                disabled={!customDatetime}
                onClick={() => {
                  if (!customDatetime) return;
                  const selectedTs = new Date(customDatetime).getTime();
                  if (isNaN(selectedTs)) return;

                  if (rescheduleTarget.type === 'simulation') {
                    memberService.rescheduleSimulation(rescheduleTarget.member.id, selectedTs, 'Staff (Dashboard)');
                  } else {
                    memberService.rescheduleToolsFormation(rescheduleTarget.member.id, selectedTs, 'Staff (Dashboard)');
                  }
                  onRefresh();
                  onShowToast('📅 Session Reprogrammée', `Nouveau rendez-vous enregistré et notifié sur Discord.`, 'success');
                  setRescheduleTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors"
              >
                Valider la Reprogrammation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BADGES SHOWCASE MODAL */}
      {badgeModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setBadgeModalMember(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <img
                src={badgeModalMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={badgeModalMember.username}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500/50 shadow-lg"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🏅 Mur des Badges & Succès — {badgeModalMember.username}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>@{badgeModalMember.username.toLowerCase().replace(/\s+/g, '')}</span>
                  <span>•</span>
                  <span>ID: {badgeModalMember.discordId}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">
                    {badgeModalMember.badges?.length || 0} / {SYSTEM_BADGES.length} Badges Débloqués
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Staff */}
            <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">Évaluation automatique :</span> Met à jour les succès en fonction des quiz et des étapes validées.
              </div>
              <button
                onClick={() => {
                  const updated = memberService.evaluateMemberBadges(badgeModalMember.id);
                  setBadgeModalMember({ ...updated });
                  onRefresh();
                  onShowToast('🏅 Badges Évalués', `Les badges de ${badgeModalMember.username} ont été recalculés.`, 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Évaluer les Badges</span>
              </button>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SYSTEM_BADGES.map((badgeDef) => {
                const unlocked = badgeModalMember.badges?.find((b) => b.id === badgeDef.id);

                return (
                  <div
                    key={badgeDef.id}
                    className={`relative p-4 rounded-2xl border transition-all space-y-2.5 ${
                      unlocked
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                            unlocked
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                              : 'bg-slate-800/60 border border-slate-700 text-slate-500'
                          }`}
                        >
                          {badgeDef.emoji}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            {badgeDef.title}
                            {unlocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ✨ Débloqué
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-800 text-slate-400 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Verrouillé
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono capitalize">
                            Catégorie : {badgeDef.category}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {badgeDef.description}
                    </p>

                    {unlocked ? (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="text-amber-400/80">Obtenu le : {unlocked.unlockedAt}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Retirer le badge "${badgeDef.title}" à ${badgeModalMember.username} ?`)) {
                              const updated = memberService.revokeManualBadge(badgeModalMember.id, badgeDef.id, 'Anthony (Staff)');
                              setBadgeModalMember({ ...updated });
                              onRefresh();
                              onShowToast('Badge Retiré', `Le badge ${badgeDef.title} a été retiré.`, 'info');
                            }
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 underline font-sans"
                        >
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 italic text-[10px]">Non accompli</span>
                        <button
                          onClick={() => {
                            const updated = memberService.grantManualBadge(badgeModalMember.id, badgeDef.id, 'Anthony (Staff)');
                            setBadgeModalMember({ ...updated });
                            onRefresh();
                            onShowToast('🏅 Badge Attribué', `Le badge ${badgeDef.title} (${badgeDef.emoji}) a été attribué manuellement !`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Attribuer</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setBadgeModalMember(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
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
