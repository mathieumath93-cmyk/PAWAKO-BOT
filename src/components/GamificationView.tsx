import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Zap,
  Star,
  Crown,
  Target,
  Shield,
  Flame,
  TrendingUp,
  CheckCircle2,
  Clock,
  User,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ChevronRight,
  Info,
  Gift,
  RefreshCw,
  Sliders,
  Eye,
  BookOpen,
  GraduationCap,
  Wrench,
  Sparkles,
  HelpCircle,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { Member, LeaderboardEntry, ExperienceLevel, GamificationStats, MemberBadge } from '../types';
import { gamificationService, EXPERIENCE_LEVELS } from '../services/gamificationService';
import { memberService } from '../services/memberService';
import { SYSTEM_BADGES, SystemBadgeDefinition, badgeService } from '../services/badgeService';
import { store } from '../services/store';

interface GamificationViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const GamificationView: React.FC<GamificationViewProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'leaderboard' | 'levels' | 'badges' | 'profile'>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'production_ready'>('all');
  const [isSyncingDiscord, setIsSyncingDiscord] = useState(false);

  // Selected candidate for deep inspection
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  // Modals
  const [isBonusXpModalOpen, setIsBonusXpModalOpen] = useState(false);
  const [bonusCandidateId, setBonusCandidateId] = useState('');
  const [bonusAmount, setBonusAmount] = useState(100);
  const [bonusReason, setBonusReason] = useState('Participation active et entraide');

  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [badgeTargetCandidateId, setBadgeTargetCandidateId] = useState('');
  const [selectedBadgeToGrant, setSelectedBadgeToGrant] = useState<string>(SYSTEM_BADGES[0]?.id || '');

  const [isXpGuideOpen, setIsXpGuideOpen] = useState(false);

  // Load and refresh state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<GamificationStats>({
    totalXpDistributed: 0,
    averageCandidateLevel: 1,
    totalBadgesUnlocked: 0,
    topCandidateName: '',
    topCandidateXp: 0,
    totalCandidates: 0,
    productionReadyCount: 0,
  });

  const loadData = () => {
    const lb = gamificationService.getLeaderboard(shiftFilter, statusFilter);
    setLeaderboard(lb);
    setStats(gamificationService.getGamificationStats());
    if (!selectedCandidateId && lb.length > 0) {
      setSelectedCandidateId(lb[0].member.id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [shiftFilter, statusFilter]);

  // Filtered leaderboard by search
  const filteredLeaderboard = leaderboard.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.member.username.toLowerCase().includes(q) ||
      entry.member.discordId.toLowerCase().includes(q) ||
      entry.level.title.toLowerCase().includes(q)
    );
  });

  const top3 = filteredLeaderboard.slice(0, 3);
  const activeCandidateEntry = leaderboard.find((e) => e.member.id === selectedCandidateId) || leaderboard[0];

  const handleSyncDiscord = async () => {
    setIsSyncingDiscord(true);
    try {
      const res = await gamificationService.syncWithDiscord();
      if (res.success) {
        onShowToast('Discord Synchronisé 🏆', res.message, 'success');
      } else {
        onShowToast('Notification Discord', res.message, 'warning');
      }
    } catch (err: any) {
      onShowToast('Erreur Discord', err?.message || 'Échec de synchronisation.', 'error');
    } finally {
      setIsSyncingDiscord(false);
    }
  };

  const handleAwardBonusXp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusCandidateId) return;
    try {
      gamificationService.awardBonusXp(bonusCandidateId, Number(bonusAmount), bonusReason);
      onShowToast(
        'Bonus XP Accordé ⚡',
        `+${bonusAmount} XP ont été crédités avec succès !`,
        'success'
      );
      setIsBonusXpModalOpen(false);
      loadData();
    } catch (err: any) {
      onShowToast('Erreur', err?.message, 'error');
    }
  };

  const handleGrantBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeTargetCandidateId || !selectedBadgeToGrant) return;
    try {
      memberService.grantManualBadge(badgeTargetCandidateId, selectedBadgeToGrant, 'Staff');
      const badgeDef = SYSTEM_BADGES.find((b) => b.id === selectedBadgeToGrant);
      onShowToast(
        'Badge Attribué 🏅',
        `Le badge "${badgeDef?.title || selectedBadgeToGrant}" a été décerné avec succès !`,
        'success'
      );
      setIsBadgeModalOpen(false);
      loadData();
    } catch (err: any) {
      onShowToast('Erreur', err?.message, 'error');
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* View Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold tracking-wide">
              <Trophy className="w-3.5 h-3.5" />
              <span>Système de Progression & Reconnaissance PAWAKO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Gamification & Classements</span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                Saison Active
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Suivi en temps réel de l'expérience (XP), des paliers de rangs, des classements de promotion et des badges d'accomplissement des candidats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsXpGuideOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Comprendre le calcul des points XP et les niveaux"
            >
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Barème XP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBonusCandidateId(leaderboard[0]?.member.id || '');
                setIsBonusXpModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Bonus XP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBadgeTargetCandidateId(leaderboard[0]?.member.id || '');
                setIsBadgeModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Décerner Badge</span>
            </button>

            <button
              type="button"
              onClick={handleSyncDiscord}
              disabled={isSyncingDiscord}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Poster ou mettre à jour le classement dans le salon Discord officiel"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingDiscord ? 'animate-spin' : ''}`} />
              <span>{isSyncingDiscord ? 'Publication...' : 'Publier sur Discord 🏆'}</span>
            </button>
          </div>
        </div>

        {/* Global KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-6 mt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>XP Global</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
              {stats.totalXpDistributed.toLocaleString()} <span className="text-xs font-normal text-slate-400">XP</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats.totalCandidates} candidats évalués</div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>Major de Promo</span>
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-white truncate mt-1">
              {stats.topCandidateName}
            </div>
            <div className="text-[10px] text-amber-400 font-bold mt-0.5">{stats.topCandidateXp} XP accumulés</div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>Niveau Moyen</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 mt-1">
              Niv. {stats.averageCandidateLevel}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Progression académie</div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>Badges Gagnés</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {stats.totalBadgesUnlocked} <span className="text-xs font-normal text-slate-400">badges</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{SYSTEM_BADGES.length} types d'exploits</div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl col-span-2 md:col-span-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center justify-between">
              <span>Passage Prod</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">
              {stats.productionReadyCount} <span className="text-xs font-normal text-slate-400">candidats</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Prêts pour le chatting</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'leaderboard'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Classement Général ({leaderboard.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('levels')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'levels'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Paliers & Niveaux d'XP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('badges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'badges'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Mur des Badges ({SYSTEM_BADGES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Fiche Individuelle</span>
        </button>
      </div>

      {/* TAB 1: LEADERBOARD & PODIUM */}
      {activeSubTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Top 3 Podium (If at least 1 candidate) */}
          {top3.length > 0 && !searchQuery.trim() && shiftFilter === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              {top3[1] ? (
                <div
                  onClick={() => {
                    setSelectedCandidateId(top3[1].member.id);
                    setActiveSubTab('profile');
                  }}
                  className="bg-slate-900/80 border border-slate-700/80 hover:border-slate-500 rounded-2xl p-5 text-center flex flex-col items-center justify-between transition-all cursor-pointer relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute top-3 left-3 text-2xl font-black text-slate-400">🥈 #2</div>
                  <div className="my-2 relative">
                    <img
                      src={
                        top3[1].member.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].member.username}`
                      }
                      alt={top3[1].member.username}
                      className="w-16 h-16 rounded-2xl border-2 border-slate-400 object-cover shadow-lg"
                    />
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-200 border border-slate-600">
                      Niv. {top3[1].level.level}
                    </span>
                  </div>
                  <div className="font-black text-white text-base truncate w-full mt-2">
                    {top3[1].member.username}
                  </div>
                  <div className="text-xs text-slate-400">{top3[1].level.title}</div>
                  <div className="mt-3 py-1 px-3 rounded-full bg-slate-800 text-slate-200 font-bold text-xs">
                    {top3[1].xp.toLocaleString()} XP
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-3">
                    <span>📚 {top3[1].modulesCompleted}/5 Modules</span>
                    <span>🏅 {top3[1].badgesCount} Badges</span>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block"></div>
              )}

              {/* 1st Place - Champion */}
              {top3[0] && (
                <div
                  onClick={() => {
                    setSelectedCandidateId(top3[0].member.id);
                    setActiveSubTab('profile');
                  }}
                  className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl p-6 text-center flex flex-col items-center justify-between transition-all cursor-pointer relative overflow-hidden group shadow-2xl shadow-amber-500/10 md:-translate-y-2"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase mb-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Champion Promo</span>
                  </div>
                  <div className="my-2 relative">
                    <img
                      src={
                        top3[0].member.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].member.username}`
                      }
                      alt={top3[0].member.username}
                      className="w-20 h-20 rounded-2xl border-2 border-amber-400 object-cover shadow-xl shadow-amber-500/20"
                    />
                    <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md">
                      🥇 #1
                    </span>
                  </div>
                  <div className="font-black text-white text-lg truncate w-full mt-2">
                    {top3[0].member.username}
                  </div>
                  <div className="text-xs text-amber-300 font-semibold">{top3[0].level.title}</div>
                  <div className="mt-3 py-1.5 px-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-sm">
                    ⚡ {top3[0].xp.toLocaleString()} XP
                  </div>
                  <div className="mt-3 text-xs text-slate-300 flex items-center gap-4">
                    <span>📚 {top3[0].modulesCompleted}/5 Modules</span>
                    <span>🏅 {top3[0].badgesCount} Badges</span>
                    <span>🎯 {top3[0].avgScore}/20</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] ? (
                <div
                  onClick={() => {
                    setSelectedCandidateId(top3[2].member.id);
                    setActiveSubTab('profile');
                  }}
                  className="bg-slate-900/80 border border-amber-900/50 hover:border-amber-700 rounded-2xl p-5 text-center flex flex-col items-center justify-between transition-all cursor-pointer relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute top-3 left-3 text-2xl font-black text-amber-600">🥉 #3</div>
                  <div className="my-2 relative">
                    <img
                      src={
                        top3[2].member.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].member.username}`
                      }
                      alt={top3[2].member.username}
                      className="w-16 h-16 rounded-2xl border-2 border-amber-700 object-cover shadow-lg"
                    />
                    <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-amber-400 border border-amber-800">
                      Niv. {top3[2].level.level}
                    </span>
                  </div>
                  <div className="font-black text-white text-base truncate w-full mt-2">
                    {top3[2].member.username}
                  </div>
                  <div className="text-xs text-slate-400">{top3[2].level.title}</div>
                  <div className="mt-3 py-1 px-3 rounded-full bg-slate-800 text-amber-300 font-bold text-xs">
                    {top3[2].xp.toLocaleString()} XP
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-3">
                    <span>📚 {top3[2].modulesCompleted}/5 Modules</span>
                    <span>🏅 {top3[2].badgesCount} Badges</span>
                  </div>
                </div>
              ) : (
                <div className="hidden md:block"></div>
              )}
            </div>
          )}

          {/* Filters and Search Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un candidat, rang..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Shift :</span>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none"
                >
                  <option value="all" className="bg-slate-900">Tous</option>
                  <option value="Matin" className="bg-slate-900">Matin</option>
                  <option value="Après-midi" className="bg-slate-900">Après-midi</option>
                  <option value="Soir" className="bg-slate-900">Soir</option>
                  <option value="Nuit" className="bg-slate-900">Nuit</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Statut :</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none"
                >
                  <option value="all" className="bg-slate-900">Tous</option>
                  <option value="in_progress" className="bg-slate-900">En Formation</option>
                  <option value="production_ready" className="bg-slate-900">Validé Prod 🚀</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">Rang</th>
                    <th className="py-3.5 px-4">Candidat</th>
                    <th className="py-3.5 px-4">Niveau & Rang</th>
                    <th className="py-3.5 px-4 text-center">Progression XP</th>
                    <th className="py-3.5 px-4 text-center">Modules</th>
                    <th className="py-3.5 px-4 text-center">Score Quiz</th>
                    <th className="py-3.5 px-4 text-center">Badges</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        Aucun candidat trouvé pour ces filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((entry) => {
                      const isTop1 = entry.rank === 1;
                      const isTop2 = entry.rank === 2;
                      const isTop3 = entry.rank === 3;

                      return (
                        <tr
                          key={entry.member.id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center font-black">
                            {isTop1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                🥇
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-200 font-bold border border-slate-400/30">
                                🥈
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-400 font-bold border border-amber-700/30">
                                🥉
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">#{entry.rank}</span>
                            )}
                          </td>

                          {/* Candidate Avatar & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  entry.member.avatarUrl ||
                                  `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.member.username}`
                                }
                                alt={entry.member.username}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{entry.member.username}</span>
                                  {entry.isProductionReady && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                      PROD
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Discord: {entry.member.discordId || 'Non lié'}
                                  {entry.member.shift && ` • Shift ${entry.member.shift}`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Level & Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{entry.level.badgeEmoji}</span>
                              <div>
                                <div className="font-bold text-slate-200 text-xs">
                                  {entry.level.title}
                                </div>
                                <div className="text-[10px] text-indigo-400 font-semibold">
                                  Niveau {entry.level.level}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* XP and Progress Bar */}
                          <td className="py-3.5 px-4 text-center min-w-[140px]">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="text-amber-400">{entry.xp.toLocaleString()} XP</span>
                              <span className="text-slate-500">{entry.xpProgressPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                                style={{ width: `${entry.xpProgressPercent}%` }}
                              ></div>
                            </div>
                          </td>

                          {/* Modules Validated */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                entry.modulesCompleted >= 5
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{entry.modulesCompleted}/5</span>
                            </span>
                          </td>

                          {/* Average Score */}
                          <td className="py-3.5 px-4 text-center font-bold">
                            <span
                              className={
                                entry.avgScore >= 18
                                  ? 'text-emerald-400'
                                  : entry.avgScore >= 15
                                  ? 'text-indigo-400'
                                  : 'text-amber-400'
                              }
                            >
                              {entry.avgScore > 0 ? `${entry.avgScore}/20` : '--'}
                            </span>
                          </td>

                          {/* Badges */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {entry.member.badges && entry.member.badges.length > 0 ? (
                                entry.member.badges.slice(0, 3).map((b) => (
                                  <span key={b.id} title={b.title} className="text-sm">
                                    {b.emoji}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-600">Aucun</span>
                              )}
                              {entry.badgesCount > 3 && (
                                <span className="text-[10px] font-bold text-slate-400 ml-0.5">
                                  +{entry.badgesCount - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCandidateId(entry.member.id);
                                  setActiveSubTab('profile');
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="Voir la fiche détaillée"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setBonusCandidateId(entry.member.id);
                                  setIsBonusXpModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition-colors"
                                title="Accorder un Bonus d'XP"
                              >
                                <Zap className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setBadgeTargetCandidateId(entry.member.id);
                                  setIsBadgeModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors"
                                title="Décerner un Badge"
                              >
                                <Award className="w-4 h-4" />
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
      )}

      {/* TAB 2: LEVELS & TIERS */}
      {activeSubTab === 'levels' && (
        <div className="space-y-6">
          {/* Level Progression Description Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span>Paliers d'Expérience (XP) & Privilèges Débloqués</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              L'expérience reflète l'assiduité, les notes obtenues aux quiz, le passage des épreuves pratiques et les badges décrochés. Chaque palier débloque de nouveaux privilèges au sein du Discord et de l'organisation.
            </p>
          </div>

          {/* Level Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPERIENCE_LEVELS.map((tier) => {
              const membersAtTier = leaderboard.filter((e) => e.level.level === tier.level);

              return (
                <div
                  key={tier.level}
                  className={`border rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden ${tier.badgeBg} ${tier.badgeBorder} shadow-lg`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{tier.badgeEmoji}</span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-950/80 text-white border border-slate-700">
                        Niveau {tier.level}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white">{tier.title}</h3>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                      {tier.minXp} - {tier.maxXp === 9999 ? '∞' : tier.maxXp} XP
                    </div>

                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                      {tier.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Privilèges & Droits :
                      </div>
                      {tier.perks.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Candidats actuels :</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-950 text-white border border-slate-800">
                      {membersAtTier.length} membre{membersAtTier.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* XP Calculation Rules Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Barème Transparent d'Attribution des XP</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">+150 XP / Module</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Par module de formation validé (jusqu'à 750 XP pour les 5).</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Star className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">+50 à +100 XP / Quiz</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Bonus de score : 100% (+100 XP), ≥90% (+70 XP), ≥80% (+50 XP).</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">+300 XP Simulation</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Validation de l'entretien et de la simulation pratique Staff.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Wrench className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">+250 XP Formation Outils</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Validation de la session pratique sur les logiciels de production.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">+80 XP / Badge Débloqué</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Chaque exploit ou badge accompli crédite immédiatement 80 XP.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">+400 XP Diplôme Prod</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Bonus d'excellence lors du passage officiel en équipe de production.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACHIEVEMENT BADGES WALL */}
      {activeSubTab === 'badges' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Mur des Badges & Titres d'Accomplissement</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Consultez le catalogue de tous les badges officiels PAWAKO. Les badges sont attribués automatiquement par le bot Discord lors des réussites ou manuellement par le staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SYSTEM_BADGES.map((badgeDef) => {
              const holders = leaderboard.filter((e) =>
                e.member.badges?.some((b) => b.id === badgeDef.id)
              );
              const unlockRate =
                leaderboard.length > 0
                  ? Math.round((holders.length / leaderboard.length) * 100)
                  : 0;

              return (
                <div
                  key={badgeDef.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-indigo-500/50 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {badgeDef.emoji}
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-950 text-slate-300 border border-slate-800">
                          {badgeDef.category}
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold mt-1">
                          +80 XP
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-base">{badgeDef.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {badgeDef.description}
                    </p>

                    {/* Holders Avatars Row */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                        <span>Titulaires ({holders.length})</span>
                        <span className="font-bold text-indigo-400">{unlockRate}% des candidats</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {holders.length === 0 ? (
                          <span className="text-[10px] text-slate-600 italic">Pas encore débloqué</span>
                        ) : (
                          holders.map((h) => (
                            <img
                              key={h.member.id}
                              src={
                                h.member.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${h.member.username}`
                              }
                              alt={h.member.username}
                              title={`${h.member.username} (Débloqué)`}
                              className="w-6 h-6 rounded-lg object-cover border border-slate-700 hover:scale-110 transition-transform"
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBadgeToGrant(badgeDef.id);
                        setBadgeTargetCandidateId(leaderboard[0]?.member.id || '');
                        setIsBadgeModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Décerner à un membre</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DETAILED CANDIDATE PROFILE */}
      {activeSubTab === 'profile' && activeCandidateEntry && (
        <div className="space-y-6">
          {/* Candidate Switcher Dropdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs text-slate-400">Fiche détaillée du candidat :</div>
                <div className="font-bold text-white text-sm">{activeCandidateEntry.member.username}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Changer de candidat :</span>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
              >
                {leaderboard.map((e) => (
                  <option key={e.member.id} value={e.member.id}>
                    #{e.rank} {e.member.username} ({e.xp} XP • {e.level.title})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profile Main Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Summary & Level Progress */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      activeCandidateEntry.member.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${activeCandidateEntry.member.username}`
                    }
                    alt={activeCandidateEntry.member.username}
                    className="w-16 h-16 rounded-2xl border-2 border-indigo-500/40 object-cover shadow-lg"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{activeCandidateEntry.member.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        #{activeCandidateEntry.rank}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Discord ID: {activeCandidateEntry.member.discordId || 'N/A'}
                    </p>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <span>{activeCandidateEntry.level.badgeEmoji}</span>
                      <span>{activeCandidateEntry.level.title}</span>
                    </div>
                  </div>
                </div>

                {/* Level Gauge */}
                <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Niveau {activeCandidateEntry.level.level}</span>
                    <span className="text-amber-400 font-bold">{activeCandidateEntry.xp.toLocaleString()} XP</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${activeCandidateEntry.xpProgressPercent}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{activeCandidateEntry.xpInCurrentLevel} / {activeCandidateEntry.xpRangeCurrentLevel} XP</span>
                    {activeCandidateEntry.xpToNextLevel > 0 ? (
                      <span className="text-indigo-400 font-semibold">
                        Plus que {activeCandidateEntry.xpToNextLevel} XP pour Niveau {activeCandidateEntry.level.level + 1}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Niveau Maximum Atteint 🌟</span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBonusCandidateId(activeCandidateEntry.member.id);
                      setIsBonusXpModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Accorder un Bonus d'XP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBadgeTargetCandidateId(activeCandidateEntry.member.id);
                      setIsBadgeModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Décerner un Badge Staff</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800">
                Inscrit le {activeCandidateEntry.member.joinedAt || 'Date inconnue'}
              </div>
            </div>

            {/* Right: Detailed XP Breakdown & Badges */}
            <div className="lg:col-span-2 space-y-6">
              {/* Breakdown Grid */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Ventilation Détaillée des Points XP</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Modules Validés</div>
                    <div className="text-lg font-black text-white mt-1">
                      {activeCandidateEntry.breakdown.modulesXp} <span className="text-xs font-normal text-slate-500">XP</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      {activeCandidateEntry.modulesCompleted}/5 validés
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Bonus Quiz (&ge;80%)</div>
                    <div className="text-lg font-black text-white mt-1">
                      {activeCandidateEntry.breakdown.quizzesBonusXp} <span className="text-xs font-normal text-slate-500">XP</span>
                    </div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      Moyenne {activeCandidateEntry.avgScore}/20
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Test Simulation</div>
                    <div className="text-lg font-black text-white mt-1">
                      {activeCandidateEntry.breakdown.simulationXp} <span className="text-xs font-normal text-slate-500">XP</span>
                    </div>
                    <div className="text-[10px] text-indigo-400 mt-0.5">
                      {activeCandidateEntry.breakdown.simulationXp > 0 ? 'Validée ✅' : 'En attente'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Formation Outils</div>
                    <div className="text-lg font-black text-white mt-1">
                      {activeCandidateEntry.breakdown.toolsFormationXp} <span className="text-xs font-normal text-slate-500">XP</span>
                    </div>
                    <div className="text-[10px] text-purple-400 mt-0.5">
                      {activeCandidateEntry.breakdown.toolsFormationXp > 0 ? 'Validée ✅' : 'En attente'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Badges Débloqués</div>
                    <div className="text-lg font-black text-white mt-1">
                      {activeCandidateEntry.breakdown.badgesXp} <span className="text-xs font-normal text-slate-500">XP</span>
                    </div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      {activeCandidateEntry.badgesCount} badges (80 XP/badge)
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Bonus & Diplôme</div>
                    <div className="text-lg font-black text-white mt-1">
                      {activeCandidateEntry.breakdown.bonusXp} <span className="text-xs font-normal text-slate-500">XP</span>
                    </div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">
                      {activeCandidateEntry.isProductionReady ? 'Diplôme Prod (+400 XP)' : 'Kudos Staff'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges Earned vs Available */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Badges Débloqués & Prochains Objectifs</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {activeCandidateEntry.badgesCount} / {SYSTEM_BADGES.length} Décrochés
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SYSTEM_BADGES.map((bDef) => {
                    const isUnlocked = activeCandidateEntry.member.badges?.some((b) => b.id === bDef.id);

                    return (
                      <div
                        key={bDef.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isUnlocked
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-white'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{bDef.emoji}</span>
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>{bDef.title}</span>
                              {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                            <div className="text-[10px] line-clamp-1">{bDef.description}</div>
                          </div>
                        </div>

                        <div>
                          {isUnlocked ? (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">Obtenu</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                memberService.grantManualBadge(activeCandidateEntry.member.id, bDef.id, 'Staff');
                                onShowToast('Badge Débloqué', `${bDef.title} attribué !`, 'success');
                                loadData();
                              }}
                              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              Débloquer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: AWARD BONUS XP */}
      {isBonusXpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Zap className="w-5 h-5" />
                <span>Accorder un Bonus d'Expérience (XP)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBonusXpModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAwardBonusXp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Candidat Bénéficiaire
                </label>
                <select
                  value={bonusCandidateId}
                  onChange={(e) => setBonusCandidateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {leaderboard.map((e) => (
                    <option key={e.member.id} value={e.member.id}>
                      {e.member.username} ({e.xp} XP)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Montant en XP à Créditer
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[50, 100, 200, 350].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBonusAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        bonusAmount === amt
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      +{amt} XP
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Motif d'Attribution (Visible dans les logs et audit)
                </label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="Ex : Esprit d'entraide exemplaire dans le salon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBonusXpModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Créditer les XP 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GRANT BADGE */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Award className="w-5 h-5" />
                <span>Décerner un Badge d'Accomplissement</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantBadge} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Candidat Récipiendaire
                </label>
                <select
                  value={badgeTargetCandidateId}
                  onChange={(e) => setBadgeTargetCandidateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {leaderboard.map((e) => (
                    <option key={e.member.id} value={e.member.id}>
                      {e.member.username} ({e.badgesCount} badges actuels)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Choisir le Badge à Décerner
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {SYSTEM_BADGES.map((b) => {
                    const isSelected = selectedBadgeToGrant === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBadgeToGrant(b.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/50 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <span className="text-xl">{b.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">{b.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{b.description}</div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 shrink-0">+80 XP</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Attribuer le Badge 🏅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XP SYSTEM GUIDE */}
      {isXpGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Info className="w-5 h-5" />
                <span>Guide de la Gamification PAWAKO</span>
              </div>
              <button
                type="button"
                onClick={() => setIsXpGuideOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <p>
                Le système de gamification a été spécialement pensé pour dynamiser l'apprentissage des candidats, encourager l'assiduité et créer une saine émulation au sein de la promotion.
              </p>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-amber-400">
                  Comment les candidats gagnent-ils des XP ?
                </h4>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                  <li><strong className="text-white">Validation d'un module :</strong> +150 XP par module réussi.</li>
                  <li><strong className="text-white">Excellence aux Quiz :</strong> Score parfait (+100 XP), ≥90% (+70 XP), ≥80% (+50 XP).</li>
                  <li><strong className="text-white">Simulation Staff :</strong> +300 XP lors de la validation du test pratique.</li>
                  <li><strong className="text-white">Formation Outils :</strong> +250 XP après la session de prise en main des outils.</li>
                  <li><strong className="text-white">Badges d'exploits :</strong> +80 XP pour chaque badge décroché.</li>
                  <li><strong className="text-white">Diplôme & Production :</strong> +400 XP lors du passage officiel en chatting.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-indigo-400">
                  Synchronisation Discord Automatique
                </h4>
                <p className="text-slate-400">
                  Le bot Discord met à jour le salon <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">#🏆-classement-formation</code> à chaque validation de module ou de quiz par un candidat. Vous pouvez aussi forcer la synchronisation manuellement à tout moment.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsXpGuideOpen(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                J'ai Compris 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
