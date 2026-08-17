import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  History,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { Member, Quiz, TrainingModule } from '../types';

interface MembersViewProps {
  members: Member[];
  modules: TrainingModule[];
  quizzes: Quiz[];
  onUpdateRoles: (memberId: string, roles: string[]) => void;
  onResetProgress: (memberId: string) => void;
  onResetAttempts: (memberId: string, quizId: string) => void;
  onGrantAttempt: (memberId: string, quizId: string) => void;
  onMemberLeave: (discordId: string) => void;
  onOpenSensitiveModal: (
    title: string,
    description: string,
    actionLabel: string,
    onConfirm: () => void
  ) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  modules,
  quizzes,
  onUpdateRoles,
  onResetProgress,
  onResetAttempts,
  onGrantAttempt,
  onMemberLeave,
  onOpenSensitiveModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Filtering
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.discordId.includes(searchTerm) ||
      m.roles.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === 'all' || m.roles.includes(selectedRoleFilter);

    return matchesSearch && matchesRole;
  });

  const handleAddRole = (member: Member) => {
    if (!newRoleInput.trim()) return;
    if (!member.roles.includes(newRoleInput.trim())) {
      const updated = [...member.roles, newRoleInput.trim()];
      onUpdateRoles(member.id, updated);
      setSelectedMember({ ...member, roles: updated });
    }
    setNewRoleInput('');
  };

  const handleRemoveRole = (member: Member, roleToRemove: string) => {
    const updated = member.roles.filter((r) => r !== roleToRemove);
    onUpdateRoles(member.id, updated);
    setSelectedMember({ ...member, roles: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search and Filters header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un membre, Discord ID ou rôle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tous les rôles Discord</option>
            <option value="Admin">Admin</option>
            <option value="Nouveau membre">Nouveau membre</option>
            <option value="Module 1 Validé">Module 1 Validé</option>
            <option value="Module 2 Validé">Module 2 Validé</option>
            <option value="Module 3 Validé">Module 3 Validé</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Membre Discord</th>
                <th className="py-3.5 px-4">Discord User ID</th>
                <th className="py-3.5 px-4">Rôles Actuels</th>
                <th className="py-3.5 px-4">Module Actif</th>
                <th className="py-3.5 px-4">Dernière Activité</th>
                <th className="py-3.5 px-4 text-right">Actions Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-950/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={m.username}
                        className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{m.username}</span>
                          {m.roles.includes('Admin') && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">Inscrit le {m.joinedAt}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-400">{m.discordId}</td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {m.roles.map((r, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-indigo-300 font-medium"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-[11px]">
                      {modules.find((mod) => mod.id === m.currentModuleId)?.title.split(':')[0] || 'Module 1'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-mono">{m.lastActiveAt}</td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedMember(m)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
                    >
                      Inspecter Fiche →
                    </button>
                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Aucun membre ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Member Drawer / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Member Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
              <img
                src={selectedMember.avatarUrl}
                alt={selectedMember.username}
                className="w-14 h-14 rounded-full border-2 border-indigo-500/40 object-cover"
              />
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedMember.username}</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    (ID: {selectedMember.discordId})
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Membre depuis le {selectedMember.joinedAt} • Dernière activité : {selectedMember.lastActiveAt}
                </p>
              </div>
            </div>

            {/* Content Tabs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roles Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Gestion des Rôles Discord</span>
                </h4>

                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                    >
                      <span>{role}</span>
                      <button
                        onClick={() => handleRemoveRole(selectedMember, role)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Retirer ce rôle"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="Ajouter un rôle..."
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAddRole(selectedMember)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Progress & Attempts */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Progression par Module</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {modules.map((mod) => {
                    const prog = selectedMember.progress[mod.id];
                    const isPassed = prog?.status === 'valide';
                    const attempts = prog?.attemptsCount || 0;

                    return (
                      <div
                        key={mod.id}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{mod.title.split(':')[0]}</div>
                          <div className="text-[10px] text-slate-400">
                            Tentatives : {attempts} / {quizzes.find((q) => q.moduleId === mod.id)?.maxAttempts || 3}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isPassed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : prog?.status === 'en_cours'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isPassed ? 'Validé' : prog?.status === 'en_cours' ? 'En cours' : 'Verrouillé'}
                          </span>

                          <button
                            onClick={() =>
                              onGrantAttempt(selectedMember.id, quizzes.find((q) => q.moduleId === mod.id)?.id || '')
                            }
                            className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                            title="+1 Tentative extra"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Critical Admin Sensitive Actions Box */}
            <div className="mt-6 pt-4 border-t border-slate-800 bg-red-950/20 border-red-500/20 border p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Zone d'Actions Sensibles (Double Confirmation Exigée)</span>
              </h4>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    onOpenSensitiveModal(
                      'Réinitialisation complète de la progression',
                      `Vous allez réinitialiser la progression de ${selectedMember.username}. Le membre sera replacé au Module 1 en cours et ses rôles validés seront supprimés.`,
                      'Réinitialiser la progression',
                      () => onResetProgress(selectedMember.id)
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                  <span>Reset Progression</span>
                </button>

                <button
                  onClick={() =>
                    onOpenSensitiveModal(
                      'Réinitialisation des tentatives de quiz',
                      `Vous allez remettre à zéro les tentatives de quiz pour ${selectedMember.username}.`,
                      'Réinitialiser les tentatives',
                      () => onResetAttempts(selectedMember.id, 'quiz-1')
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Tentatives</span>
                </button>

                <button
                  onClick={() =>
                    onOpenSensitiveModal(
                      'Suppression des données personnelles (Départ)',
                      `Conformément au règlement du système PAWAKO, les données personnelles de ${selectedMember.username} seront anonymisées/supprimées.`,
                      'Anonymiser et supprimer',
                      () => {
                        onMemberLeave(selectedMember.discordId);
                        setSelectedMember(null);
                      }
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-700/50 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Supprimer / Anonymiser Membre</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
