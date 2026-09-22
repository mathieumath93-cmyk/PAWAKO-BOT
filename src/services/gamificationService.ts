import { Member, ExperienceLevel, LeaderboardEntry, XpBreakdown, GamificationStats, TrainingModule } from '../types';
import { store } from './store';
import { memberService } from './memberService';
import { SYSTEM_BADGES } from './badgeService';
import { firebaseSyncService } from './firebaseSyncService';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  {
    level: 1,
    title: 'Recrue PAWAKO',
    minXp: 0,
    maxXp: 250,
    badgeEmoji: '🛡️',
    color: 'slate',
    badgeBg: 'bg-slate-800/80',
    badgeBorder: 'border-slate-700',
    badgeText: 'text-slate-300',
    description: 'Nouveau candidat en phase d\'intégration et d\'initiation aux modules de base.',
    perks: ['Accès au salon privé de formation', 'Support du tuteur IA 24/7', 'Quiz de base'],
  },
  {
    level: 2,
    title: 'Apprenti Chatting',
    minXp: 250,
    maxXp: 600,
    badgeEmoji: '⚡',
    color: 'cyan',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-300',
    description: 'A validé ses premiers modules et démontré son assiduité et sa régularité.',
    perks: ['Déblocage des quiz chronométrés', 'Rôle Apprenti Discord', 'Bonus d\'assiduité'],
  },
  {
    level: 3,
    title: 'Opérateur Junior',
    minXp: 600,
    maxXp: 1100,
    badgeEmoji: '🎯',
    color: 'indigo',
    badgeBg: 'bg-indigo-950/40',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
    description: 'Maîtrise la majorité des modules théoriques de la formation Pawako.',
    perks: ['Accès aux fiches pratiques de révision', 'Éligibilité au test de simulation', 'Badge Opérateur'],
  },
  {
    level: 4,
    title: 'Spécialiste PAWAKO',
    minXp: 1100,
    maxXp: 1800,
    badgeEmoji: '🚀',
    color: 'purple',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300',
    description: 'A validé l\'intégralité des 5 modules théoriques avec de solides résultats.',
    perks: ['Accès prioritaire à la Simulation Live', 'Badge Spécialiste', 'Priorité de planification'],
  },
  {
    level: 5,
    title: 'Expert Vétéran',
    minXp: 1800,
    maxXp: 2600,
    badgeEmoji: '👑',
    color: 'amber',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
    description: 'A brillamment validé la Simulation Staff et la Formation Outils.',
    perks: ['Accès au salon d\'échanges Staff', 'Priorité au passage en production', 'Kudos Staff'],
  },
  {
    level: 6,
    title: 'Maître de Promotion',
    minXp: 2600,
    maxXp: 9999,
    badgeEmoji: '🌟',
    color: 'emerald',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
    description: 'Candidat certifié passé officiellement en production, parcours exemplaire.',
    perks: ['Statut Opérateur Certifié', 'Titre d\'Honneur Discord', 'Priorité sur les shifts de chatting'],
  },
];

class GamificationService {
  /**
   * Determine the experience level from a given XP value
   */
  public getLevelForXp(xp: number): ExperienceLevel {
    for (let i = EXPERIENCE_LEVELS.length - 1; i >= 0; i--) {
      if (xp >= EXPERIENCE_LEVELS[i].minXp) {
        return EXPERIENCE_LEVELS[i];
      }
    }
    return EXPERIENCE_LEVELS[0];
  }

  /**
   * Calculate precise XP breakdown for a member
   */
  public calculateMemberXp(member: Member, modules: TrainingModule[] = store.getModules()): XpBreakdown {
    const progressList = Object.values(member.progress || {});
    
    // 1. Modules XP: 150 XP per validated module
    const validatedModulesCount = progressList.filter((p) => p.status === 'valide' || p.quizPassed === true).length;
    const modulesXp = validatedModulesCount * 150;

    // 2. Quizzes Score Bonus: extra points for excellence
    let quizzesBonusXp = 0;
    progressList.forEach((p) => {
      if (p.score !== undefined && p.score !== null) {
        if (p.score >= 100) {
          quizzesBonusXp += 100;
        } else if (p.score >= 90) {
          quizzesBonusXp += 70;
        } else if (p.score >= 80) {
          quizzesBonusXp += 50;
        } else if (p.score >= 70) {
          quizzesBonusXp += 25;
        }
      }
    });

    // 3. Practical Simulation XP: 300 XP
    const isSimuPassed =
      !!member.simulationValidatedAt ||
      member.candidateState === 'simulation_validee' ||
      member.candidateState === 'formation_outils' ||
      member.candidateState === 'formation_terminee';
    const simulationXp = isSimuPassed ? 300 : 0;

    // 4. Tools Formation XP: 250 XP
    const isToolsPassed = !!member.toolsFormationValidatedAt || member.candidateState === 'formation_terminee';
    const toolsFormationXp = isToolsPassed ? 250 : 0;

    // 5. Badges XP: 80 XP per unlocked badge
    const badgesCount = member.badges?.length || 0;
    const badgesXp = badgesCount * 80;

    // 6. Bonus XP:
    // Graduation bonus for full production readiness: +400 XP
    let bonusXp = 0;
    if (member.candidateState === 'formation_terminee') {
      bonusXp += 400;
    }
    // Extra custom member bonus stored on member if any
    if (typeof member.xp === 'number' && member.xp > 0) {
      // If member has manual bonus XP registered
      bonusXp += member.xp;
    }

    const totalXp = modulesXp + quizzesBonusXp + simulationXp + toolsFormationXp + badgesXp + bonusXp;

    return {
      modulesXp,
      quizzesBonusXp,
      simulationXp,
      toolsFormationXp,
      badgesXp,
      bonusXp,
      totalXp,
    };
  }

  /**
   * Builds the complete Leaderboard entries list
   */
  public getLeaderboard(
    filterShift?: string,
    filterStatus?: 'all' | 'in_progress' | 'production_ready'
  ): LeaderboardEntry[] {
    const rawMembers = memberService.getMembers();
    const modules = store.getModules();
    const totalModules = modules.length || 5;

    // Filter non-admin candidates
    let candidates = rawMembers.filter(
      (m) => !m.roles?.includes('Admin') && !m.roles?.includes('Lead Admin') && m.candidateState !== 'expulse_inactivite'
    );

    if (filterShift && filterShift !== 'all') {
      candidates = candidates.filter((c) => c.shift === filterShift);
    }

    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'production_ready') {
        candidates = candidates.filter((c) => c.candidateState === 'formation_terminee');
      } else if (filterStatus === 'in_progress') {
        candidates = candidates.filter((c) => c.candidateState !== 'formation_terminee');
      }
    }

    const entries: LeaderboardEntry[] = candidates.map((m) => {
      const breakdown = this.calculateMemberXp(m, modules);
      const level = this.getLevelForXp(breakdown.totalXp);
      const modulesCompleted = Object.values(m.progress || {}).filter((p) => p.status === 'valide' || p.quizPassed).length;

      // Calculate progress within current level
      const range = level.maxXp - level.minXp;
      const inLevel = Math.max(0, breakdown.totalXp - level.minXp);
      const xpProgressPercent = level.level === 6 ? 100 : Math.min(100, Math.round((inLevel / range) * 100));
      const xpToNextLevel = level.level === 6 ? 0 : Math.max(0, level.maxXp - breakdown.totalXp);

      const attempts = store.getQuizAttemptsForMember(m.id);
      const avgScore =
        attempts.length > 0
          ? Math.round((attempts.reduce((acc, a) => acc + (a.score > 20 ? (a.score / 100) * 20 : a.score), 0) / attempts.length) * 10) / 10
          : m.averageScore || 0;

      return {
        rank: 0,
        member: m,
        xp: breakdown.totalXp,
        level,
        xpProgressPercent,
        xpToNextLevel,
        xpInCurrentLevel: inLevel,
        xpRangeCurrentLevel: range,
        modulesCompleted,
        totalModules,
        avgScore,
        badgesCount: m.badges?.length || 0,
        breakdown,
        isProductionReady: m.candidateState === 'formation_terminee',
      };
    });

    // Sort entries:
    // 1. Total XP descending
    // 2. Modules completed descending
    // 3. Average score descending
    entries.sort((a, b) => {
      if (b.xp !== a.xp) return b.xp - a.xp;
      if (b.modulesCompleted !== a.modulesCompleted) return b.modulesCompleted - a.modulesCompleted;
      return b.avgScore - a.avgScore;
    });

    // Assign ranking
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  }

  /**
   * Computes overall gamification summary statistics
   */
  public getGamificationStats(): GamificationStats {
    const leaderboard = this.getLeaderboard();
    const totalCandidates = leaderboard.length;

    if (totalCandidates === 0) {
      return {
        totalXpDistributed: 0,
        averageCandidateLevel: 1,
        totalBadgesUnlocked: 0,
        topCandidateName: 'Aucun',
        topCandidateXp: 0,
        totalCandidates: 0,
        productionReadyCount: 0,
      };
    }

    const totalXpDistributed = leaderboard.reduce((acc, curr) => acc + curr.xp, 0);
    const avgLevel = Math.round((leaderboard.reduce((acc, curr) => acc + curr.level.level, 0) / totalCandidates) * 10) / 10;
    const totalBadgesUnlocked = leaderboard.reduce((acc, curr) => acc + curr.badgesCount, 0);
    const topCandidate = leaderboard[0];
    const productionReadyCount = leaderboard.filter((e) => e.isProductionReady).length;

    return {
      totalXpDistributed,
      averageCandidateLevel: avgLevel,
      totalBadgesUnlocked,
      topCandidateName: topCandidate?.member.username || 'N/A',
      topCandidateXp: topCandidate?.xp || 0,
      totalCandidates,
      productionReadyCount,
    };
  }

  /**
   * Award manual bonus XP to a candidate
   */
  public awardBonusXp(memberId: string, amount: number, reason: string): Member {
    const member = store.getMember(memberId);
    if (!member) throw new Error('Candidat introuvable');

    const currentXp = member.xp || 0;
    const newXp = currentXp + amount;
    member.xp = newXp;
    member.level = this.getLevelForXp(newXp).level;
    store.saveMembers();

    store.addLog(
      'Staff Gamification',
      `⚡ [BONUS_XP] +${amount} XP accordés à ${member.username} (Motif : ${reason})`,
      'member',
      member.username
    );

    firebaseSyncService.saveMember(member).catch(() => {});
    return member;
  }

  /**
   * Synchronize the leaderboard with Discord
   */
  public async syncWithDiscord(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/leaderboard/sync', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn('[GamificationService] syncWithDiscord error:', err);
      return {
        success: false,
        message: err.message || 'Impossible de synchroniser le classement Discord.',
      };
    }
  }
}

export const gamificationService = new GamificationService();
