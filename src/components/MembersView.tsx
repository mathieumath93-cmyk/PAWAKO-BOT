import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Shield,
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
  GraduationCap,
  Wrench,
  UserX,
  LayoutGrid,
  List,
  MessageSquare,
  Send,
  ChevronRight,
  ExternalLink,
  BookOpen,
  ArrowRight,
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
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Selected candidate drawer / modal
  const [selectedCandidate, setSelectedCandidate] = useState<Member | null>(null);

  // Discord DM Modal
  const [dmTarget, setDmTarget] = useState<Member | null>(null);
  const [dmMessage, setDmMessage] = useState<string>('');
  const [isSendingDm, setIsSendingDm] = useState<boolean>(false);

  // Badges Modal
  const [badgeModalMember, setBadgeModalMember] = useState<Member | null>(null);

  // Reschedule Modal
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    member: Member;
    type: 'simulation' | 'tools';
  } | null>(null);
  const [customDatetime, setCustomDatetime] = useState<string>('');

  const filteredMembers = memberService.filterMembers(filterStatus, searchQuery);
  const breakdown = memberService.getModuleCandidateBreakdown();

  const handleSyncMembers = async () => {
    setIsSyncing(true);
    const res = await discordService.fetchAndSyncRealDiscordData();
    setIsSyncing(false);
    onRefresh();
    if (res.success) {
      onShowToast(
        'Membres Discord Synchronisés',
        `${memberService.getMembers().length} membres synchronisés depuis Discord`,
        'success'
      );
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

  const handleSendDiscordDm = async () => {
    if (!dmTarget || !dmMessage.trim()) return;
    setIsSendingDm(true);

    const res = await discordService.sendCustomEmbed(
      dmTarget.personalChannelId || dmTarget.discordId,
      '💬 MESSAGE DIRECT DE L\'ÉQUIPE STAFF PAWAKO',
      dmMessage,
      0x6366f1,
      `<@${dmTarget.discordId}>`
    );

    setIsSendingDm(false);
    if (res.success) {
      onShowToast(
        '💬 Message Envoyé',
        `Le message a été transmis à ${dmTarget.username} sur Discord.`,
        'success'
      );
      setDmTarget(null);
      setDmMessage('');
    } else {
      onShowToast(
        '⚠️ Info Envoi',
        res.message || 'Message transmis ou consigné dans le journal.',
        'info'
      );
      setDmTarget(null);
      setDmMessage('');
    }
  };

  const handleResetProgress = (memberId: string, username: string) => {
    if (confirm(`Réinitialiser la progression globale de ${username} ?`)) {
      memberService.resetProgress(memberId);
      onRefresh();
      onShowToast('Progression réinitialisée', `Pour ${username}`, 'info');
    }
  };

  // Move candidate to a specific stage/module
  const handleMoveCandidateStage = (member: Member, targetStage: string) => {
    if (targetStage.startsWith('module-')) {
      memberService.forceModule(member.id, targetStage);
      onRefresh();
      onShowToast('Candidat Déplacé', `${member.username} assigné au ${targetStage}`, 'success');
    } else if (targetStage === 'simulation') {
      memberService.forceModule(member.id, 'module-5');
      store.updateCandidateState(member.id, 'simulation');
      onRefresh();
      onShowToast('Etape Simulation', `${member.username} passe en Simulation IA`, 'success');
    } else if (targetStage === 'formation_outils') {
      memberService.validateSimulation(member.id, 'Staff Kanban');
      onRefresh();
      onShowToast('Formation Outils', `${member.username} convoqué(e) à la Formation Outils`, 'success');
    } else if (targetStage === 'formation_terminee') {
      store.updateCandidateState(member.id, 'formation_terminee');
      onRefresh();
      onShowToast('Diplômé / Intégré', `${member.username} marqué comme formateur/diplômé !`, 'success');
    } else if (targetStage === 'reset') {
      memberService.resetProgress(member.id);
      onRefresh();
      onShowToast('Réinitialisation', `Parcours réinitialisé pour ${member.username}`, 'info');
    }
  };

  // Kanban Columns Definition
  const kanbanColumns = [
    {
      id: 'unstarted',
      title: '😴 Non Démarrés',
      subtitle: '0 module lancé',
      count: breakdown.unstartedCount,
      members: breakdown.unstartedMembers,
      color: 'border-slate-700 bg-slate-900/40 text-slate-400',
      badgeBg: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'module-1',
      title: '📚 Module 1',
      subtitle: 'Fondations Pawako',
      count: breakdown.moduleCounts[1] || 0,
      members: breakdown.moduleMembers[1] || [],
      color: 'border-blue-500/30 bg-blue-950/20 text-blue-300',
      badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'module-2',
      title: '📚 Module 2',
      subtitle: 'Scripting New Fans',
      count: breakdown.moduleCounts[2] || 0,
      members: breakdown.moduleMembers[2] || [],
      color: 'border-indigo-500/30 bg-indigo-950/20 text-indigo-300',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    {
      id: 'module-3',
      title: '📚 Module 3',
      subtitle: 'Contenu & PPV',
      count: breakdown.moduleCounts[3] || 0,
      members: breakdown.moduleMembers[3] || [],
      color: 'border-purple-500/30 bg-purple-950/20 text-purple-300',
      badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'module-4',
      title: '📚 Module 4',
      subtitle: 'Négociation & Shield',
      count: breakdown.moduleCounts[4] || 0,
      members: breakdown.moduleMembers[4] || [],
      color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'module-5',
      title: '📚 Module 5',
      subtitle: 'Mastery & Quiz 5',
      count: breakdown.moduleCounts[5] || 0,
      members: breakdown.moduleMembers[5] || [],
      color: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'simulation',
      title: '🎯 Simulation IA',
      subtitle: 'Scénario Anthony',
      count: breakdown.simulationCount,
      members: breakdown.simulationMembers,
      color: 'border-blue-500/40 bg-blue-900/30 text-blue-200',
      badgeBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
    },
    {
      id: 'formation_outils',
      title: '🛠️ Formation Outils',
      subtitle: 'Convocation 10h HF',
      count: breakdown.toolsCount,
      members: breakdown.toolsMembers,
      color: 'border-purple-500/40 bg-purple-900/30 text-purple-200',
      badgeBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
    },
    {
      id: 'completed',
      title: '🎓 Diplômés / Formés',
      subtitle: 'Onboarding Validé',
      count: breakdown.completedCount,
      members: breakdown.completedMembers,
      color: 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300',
      badgeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Actions & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Gestion des Candidats ({filteredMembers.length})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Superviser et accompagner le parcours d'intégration des candidats en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table Détaillée</span>
            </button>
          </div>

          <button
            onClick={handleRunInactivityWorker}
            disabled={isEvaluating}
            className="px-3.5 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
            title="Analyser l'inactivité et ajouter les relances (6h, 12h, 24h)"
          >
            <Zap className={`w-4 h-4 ${isEvaluating ? 'animate-spin text-amber-200' : 'text-amber-300'}`} />
            <span>Worker Inactivité</span>
          </button>

          <button
            onClick={handleSyncMembers}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Synchro Discord</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
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

      {/* 📊 VIEW MODE 1: KANBAN PIPELINE BOARD */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-max">
            {kanbanColumns.map((col) => {
              // Filter column members by search query if needed
              const colMembers = col.members.filter((m) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  m.username.toLowerCase().includes(q) ||
                  m.discordId.toLowerCase().includes(q)
                );
              });

              return (
                <div
                  key={col.id}
                  className={`w-72 flex flex-col rounded-2xl border ${col.color} bg-slate-950/60 p-3.5 space-y-3 shrink-0 shadow-lg`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div>
                      <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>{col.title}</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">{col.subtitle}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badgeBg}`}>
                      {colMembers.length}
                    </span>
                  </div>

                  {/* Candidate Cards List */}
                  <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
                    {colMembers.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-slate-500 italic rounded-xl border border-dashed border-slate-800/60">
                        Aucun candidat
                      </div>
                    ) : (
                      colMembers.map((member) => {
                        const completedCount = member.modulesCompletedCount || 0;
                        const progressPct = Math.round((completedCount / 5) * 100);

                        return (
                          <div
                            key={member.id}
                            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 space-y-2.5 transition-all shadow-md group relative hover:shadow-indigo-500/5"
                          >
                            {/* Candidate Info Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div
                                onClick={() => setSelectedCandidate(member)}
                                className="flex items-center gap-2.5 cursor-pointer min-w-0"
                              >
                                <img
                                  src={
                                    member.avatarUrl ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                                  }
                                  alt={member.username}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
                                    {member.username}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono truncate">
                                    @{member.username.toLowerCase().replace(/\s+/g, '')}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedCandidate(member)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-[10px] shrink-0"
                                title="Voir la fiche complète du candidat"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Progress & Badges Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Progression</span>
                                <span className="font-bold text-indigo-400">{progressPct}% ({completedCount}/5)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPct}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Status Tags & Auto-Reminders */}
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              {member.autoReminderFlag && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                                    member.autoReminderLevel === '24h'
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                                      : member.autoReminderLevel === '12h'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                                  }`}
                                  title={member.autoReminderReason || 'Relance automatique inactivité'}
                                >
                                  <Bell className="w-2.5 h-2.5" />
                                  <span>Relance {member.autoReminderLevel || '6h'}</span>
                                </span>
                              )}

                              {member.cooldownUntilTimestamp && member.cooldownUntilTimestamp > Date.now() && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>
                                    {Math.ceil((member.cooldownUntilTimestamp - Date.now()) / 60000)}m
                                  </span>
                                </span>
                              )}

                              {member.badges && member.badges.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                                  🏅 {member.badges.length}
                                </span>
                              )}
                            </div>

                            {/* Quick Action Buttons Bar */}
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                              {/* Direct DM button */}
                              <button
                                onClick={() => {
                                  setDmTarget(member);
                                  setDmMessage('');
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30 transition-colors flex items-center gap-1"
                                title="Envoyer un message DM Discord"
                              >
                                <MessageSquare className="w-3 h-3 text-indigo-400" />
                                <span>Relance DM</span>
                              </button>

                              {/* Stage Selector Dropdown */}
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleMoveCandidateStage(member, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Déplacer...
                                </option>
                                <option value="module-1">Module 1</option>
                                <option value="module-2">Module 2</option>
                                <option value="module-3">Module 3</option>
                                <option value="module-4">Module 4</option>
                                <option value="module-5">Module 5</option>
                                <option value="simulation">🎯 Simulation</option>
                                <option value="formation_outils">🛠️ Outils (10h HF)</option>
                                <option value="formation_terminee">🎓 Diplômé</option>
                                <option value="reset">🔄 Reset</option>
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📋 VIEW MODE 2: DETAILED TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="p-4">Membre</th>
                  <th className="p-4">Discord ID</th>
                  <th className="p-4">Rôles</th>
                  <th className="p-4">Badges</th>
                  <th className="p-4">Progression</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                      Aucun candidat trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const completedCount = member.modulesCompletedCount || 0;
                    const progressPct = Math.round((completedCount / 5) * 100);

                    return (
                      <tr key={member.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="p-4">
                          <div
                            onClick={() => setSelectedCandidate(member)}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <img
                              src={
                                member.avatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={member.username}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                                {member.username}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                @{member.username.toLowerCase().replace(/\s+/g, '')}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono text-slate-400 text-[11px]">{member.discordId}</td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {member.roles && member.roles.filter(Boolean).length > 0 ? (
                              member.roles.filter(Boolean).map((role, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-[10px]"
                                >
                                  {role.startsWith('@') ? role : `@${role}`}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Aucun rôle</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => setBadgeModalMember(member)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 text-[11px]"
                          >
                            <Medal className="w-3.5 h-3.5 text-amber-400" />
                            <span>{member.badges?.length || 0} badges</span>
                          </button>
                        </td>

                        <td className="p-4 w-36">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Progression</span>
                              <span className="font-bold text-indigo-400">{progressPct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              member.candidateState === 'expulse_inactivite'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : member.candidateState === 'formation_terminee'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : member.candidateState === 'formation_outils'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : member.candidateState === 'simulation'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                            }`}
                          >
                            {member.candidateState || 'Nouveau'}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedCandidate(member)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                          >
                            Fiche Candidat
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- FICHE CANDIDAT MODAL DRAWER --- */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 shadow-2xl overflow-y-auto space-y-6 relative flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      selectedCandidate.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={selectedCandidate.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{selectedCandidate.username}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                        ID: {selectedCandidate.discordId}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Dernière activité : {selectedCandidate.lastActiveAt || 'Aujourd\'hui'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Overview Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Statut Onboarding</span>
                  <span className="text-indigo-400 font-mono capitalize">
                    {selectedCandidate.candidateState || 'Nouveau'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Progression Globale</span>
                    <span className="font-bold text-indigo-400">
                      {Math.round(((selectedCandidate.modulesCompletedCount || 0) / 5) * 100)}% ({selectedCandidate.modulesCompletedCount || 0}/5)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{
                        width: `${Math.round(((selectedCandidate.modulesCompletedCount || 0) / 5) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Discord Actions Panel */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Actions Directes Discord & Administration</span>
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setDmTarget(selectedCandidate);
                      setDmMessage('');
                    }}
                    className="p-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>💬 Relance DM Discord</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Valider la simulation pour ${selectedCandidate.username} et programmer la Formation Outils à 10h00 HF ?`)) {
                        memberService.validateSimulation(selectedCandidate.id, 'Staff Dashboard');
                        onRefresh();
                        onShowToast('🏆 Simulation Validée', `${selectedCandidate.username} convoqué(e) à 10h00 HF`, 'success');
                      }
                    }}
                    className="p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>🏆 Valider Simu (10h HF)</span>
                  </button>

                  <button
                    onClick={() => {
                      setRescheduleTarget({ member: selectedCandidate, type: 'simulation' });
                      setCustomDatetime('');
                    }}
                    className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>📅 Reprog Simu (14h)</span>
                  </button>

                  <button
                    onClick={() => {
                      setRescheduleTarget({ member: selectedCandidate, type: 'tools' });
                      setCustomDatetime('');
                    }}
                    className="p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>📅 Reprog Outils (10h)</span>
                  </button>

                  <button
                    onClick={() => {
                      memberService.resetCooldown(selectedCandidate.id);
                      onRefresh();
                      onShowToast('⚡ Cooldown Annulé', `Le candidat ${selectedCandidate.username} peut repasser son quiz`, 'success');
                    }}
                    className="p-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>⚡ Annuler Cooldown</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Expulser le candidat ${selectedCandidate.username} du serveur Discord pour inactivité de 3 jours ?`)) {
                        memberService.kickMemberForInactivity(selectedCandidate.id, 'Expulsion manuelle Staff (inactivité 3j)');
                        onRefresh();
                        onShowToast('🚨 Kick-off Exécuté', `${selectedCandidate.username} a été expulsé(e).`, 'warning');
                      }
                    }}
                    className="p-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold transition-all text-left flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4 text-red-400 shrink-0" />
                    <span>🚨 Kick Inactivité 3j</span>
                  </button>
                </div>
              </div>

              {/* Roles Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rôles Discord Actifs
                </h3>
                <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {selectedCandidate.roles && selectedCandidate.roles.filter(Boolean).length > 0 ? (
                    selectedCandidate.roles.filter(Boolean).map((role, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-xs flex items-center gap-1"
                      >
                        <span>{role.startsWith('@') ? role : `@${role}`}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Aucun rôle attribué</span>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleResetProgress(selectedCandidate.id, selectedCandidate.username)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Réel Parcours</span>
              </button>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DISCORD DM MODAL --- */}
      {dmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setDmTarget(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Envoyer un message DM Discord
                </h3>
                <p className="text-xs text-slate-400">
                  Destinataire : <span className="text-indigo-300 font-semibold">{dmTarget.username}</span> (@{dmTarget.discordId})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Message personnalisé :
              </label>
              <textarea
                rows={4}
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
                placeholder="Écrivez votre message d'encouragement ou de relance pour le candidat..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Annuler
              </button>

              <button
                disabled={!dmMessage.trim() || isSendingDm}
                onClick={handleSendDiscordDm}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingDm ? 'Envoi...' : 'Envoyer sur Discord'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RESCHEDULE SESSION MODAL --- */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setRescheduleTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-xl ${
                  rescheduleTarget.type === 'simulation'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  Reprogrammer {rescheduleTarget.type === 'simulation' ? 'la Simulation' : 'la Formation Outils'}
                </h3>
                <p className="text-xs text-slate-400">
                  Candidat : <span className="font-semibold text-slate-200">{rescheduleTarget.member.username}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    const nextDay = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
                    nextDay.setDate(nextDay.getDate() + 1);
                    nextDay.setHours(rescheduleTarget.type === 'simulation' ? 14 : 10, 0, 0, 0);

                    const ts = nextDay.getTime();
                    if (rescheduleTarget.type === 'simulation') {
                      memberService.rescheduleSimulation(rescheduleTarget.member.id, ts, 'Staff Dashboard');
                    } else {
                      memberService.rescheduleToolsFormation(rescheduleTarget.member.id, ts, 'Staff Dashboard');
                    }
                    onRefresh();
                    onShowToast(
                      '📅 Session Reprogrammée',
                      `Fixé à demain ${rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF.`,
                      'success'
                    );
                    setRescheduleTarget(null);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-left transition-colors"
                >
                  <span className="font-bold text-white block">Demain {rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF</span>
                  <span className="text-[10px] text-slate-400">Créneau standard</span>
                </button>

                <button
                  onClick={() => {
                    const now = new Date();
                    const today = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
                    today.setHours(rescheduleTarget.type === 'simulation' ? 14 : 10, 0, 0, 0);

                    const ts = today.getTime();
                    if (rescheduleTarget.type === 'simulation') {
                      memberService.rescheduleSimulation(rescheduleTarget.member.id, ts, 'Staff Dashboard');
                    } else {
                      memberService.rescheduleToolsFormation(rescheduleTarget.member.id, ts, 'Staff Dashboard');
                    }
                    onRefresh();
                    onShowToast(
                      '📅 Session Reprogrammée',
                      `Fixé à aujourd'hui ${rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF.`,
                      'success'
                    );
                    setRescheduleTarget(null);
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-left transition-colors"
                >
                  <span className="font-bold text-white block">Aujourd'hui {rescheduleTarget.type === 'simulation' ? '14h00' : '10h00'} HF</span>
                  <span className="text-[10px] text-slate-400">Rendez-vous aujourd'hui</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Ou choisir une date & heure sur-mesure :
                </label>
                <input
                  type="datetime-local"
                  value={customDatetime}
                  onChange={(e) => setCustomDatetime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
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
                    memberService.rescheduleSimulation(rescheduleTarget.member.id, selectedTs, 'Staff Dashboard');
                  } else {
                    memberService.rescheduleToolsFormation(rescheduleTarget.member.id, selectedTs, 'Staff Dashboard');
                  }
                  onRefresh();
                  onShowToast('📅 Session Reprogrammée', 'Horaires enregistrés et notifiés.', 'success');
                  setRescheduleTarget(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BADGES SHOWCASE MODAL --- */}
      {badgeModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setBadgeModalMember(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img
                src={
                  badgeModalMember.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={badgeModalMember.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/50"
              />
              <div>
                <h3 className="text-lg font-bold text-white">
                  🏅 Mur des Badges — {badgeModalMember.username}
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  {badgeModalMember.badges?.length || 0} / {SYSTEM_BADGES.length} Badges Débloqués
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SYSTEM_BADGES.map((badgeDef) => {
                const unlocked = badgeModalMember.badges?.find((b) => b.id === badgeDef.id);

                return (
                  <div
                    key={badgeDef.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                      unlocked
                        ? 'bg-slate-950 border-amber-500/40 shadow-lg'
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-2xl flex items-center justify-center shrink-0">
                        {badgeDef.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs truncate">{badgeDef.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{badgeDef.description}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      {unlocked ? (
                        <span className="text-amber-400 font-mono">Débloqué le {unlocked.unlockedAt}</span>
                      ) : (
                        <button
                          onClick={() => {
                            const updated = memberService.grantManualBadge(badgeModalMember.id, badgeDef.id, 'Staff');
                            setBadgeModalMember({ ...updated });
                            onRefresh();
                            onShowToast('🏅 Badge Attribué', `${badgeDef.title} attribué !`, 'success');
                          }}
                          className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                        >
                          Attribuer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setBadgeModalMember(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-xs"
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
