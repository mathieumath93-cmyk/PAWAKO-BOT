import { Member, MemberBadge, TrainingModule } from '../types';

export interface SystemBadgeDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  iconName: string;
  color: string; // Tailwind color name e.g. amber, emerald, blue, purple, indigo, rose
  category: 'completion' | 'performance' | 'validation' | 'special';
  checkUnlocked: (member: Member, modules: TrainingModule[]) => boolean;
}

export const SYSTEM_BADGES: SystemBadgeDefinition[] = [
  {
    id: 'all_modules_completed',
    title: 'Master Formation',
    description: 'A validé avec succès l\'intégralité des modules de formation !',
    emoji: '🎓',
    iconName: 'GraduationCap',
    color: 'amber',
    category: 'completion',
    checkUnlocked: (member, modules) => {
      if (!modules || modules.length === 0) return false;
      const activeModules = modules.filter((m) => m.isActive);
      if (activeModules.length === 0) return false;
      return activeModules.every((m) => member.progress?.[m.id]?.status === 'valide' || member.progress?.[m.id]?.quizPassed === true);
    },
  },
  {
    id: 'perfect_quiz',
    title: 'Sans Faute',
    description: 'A obtenu un score parfait de 100% à au moins un quiz !',
    emoji: '🎯',
    iconName: 'Target',
    color: 'emerald',
    category: 'performance',
    checkUnlocked: (member) => {
      if (!member.progress) return false;
      return Object.values(member.progress).some((p) => (p.score || 0) === 100);
    },
  },
  {
    id: 'major_promo',
    title: 'Major de Promo',
    description: 'Moyenne générale supérieure ou égale à 90% sur l\'ensemble des quiz.',
    emoji: '🏆',
    iconName: 'Trophy',
    color: 'indigo',
    category: 'performance',
    checkUnlocked: (member, modules) => {
      if (!member.progress) return false;
      const validated = Object.values(member.progress).filter((p) => p.status === 'valide');
      if (validated.length < 3) return false;
      const totalScore = validated.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const avg = totalScore / validated.length;
      return avg >= 90;
    },
  },
  {
    id: 'simulation_passed',
    title: 'As de la Simulation',
    description: 'A passé et validé le Test de Simulation d\'entretien avec le Staff.',
    emoji: '🎭',
    iconName: 'CheckCircle2',
    color: 'blue',
    category: 'validation',
    checkUnlocked: (member) => {
      return (
        !!member.simulationValidatedAt ||
        member.candidateState === 'formation_outils' ||
        member.candidateState === 'formation_terminee'
      );
    },
  },
  {
    id: 'tools_passed',
    title: 'Expert Outils',
    description: 'A validé la session de Formation Outils de travail.',
    emoji: '🛠️',
    iconName: 'Wrench',
    color: 'purple',
    category: 'validation',
    checkUnlocked: (member) => {
      return !!member.toolsFormationValidatedAt || member.candidateState === 'formation_terminee';
    },
  },
  {
    id: 'official_member',
    title: 'Diplômé Pawako',
    description: 'Parcours de formation et intégration entièrement accomplis avec succès !',
    emoji: '🌟',
    iconName: 'Award',
    color: 'rose',
    category: 'special',
    checkUnlocked: (member) => {
      return member.candidateState === 'formation_terminee';
    },
  },
];

class BadgeService {
  /**
   * Evaluate member badges and return newly unlocked badges
   */
  public evaluateBadges(member: Member, modules: TrainingModule[], formattedNow: string): { member: Member; newlyUnlocked: MemberBadge[] } {
    if (!member.badges) {
      member.badges = [];
    }

    const newlyUnlocked: MemberBadge[] = [];

    for (const badgeDef of SYSTEM_BADGES) {
      const alreadyHas = member.badges.some((b) => b.id === badgeDef.id);
      if (!alreadyHas && badgeDef.checkUnlocked(member, modules)) {
        const newBadge: MemberBadge = {
          id: badgeDef.id,
          title: badgeDef.title,
          description: badgeDef.description,
          emoji: badgeDef.emoji,
          iconName: badgeDef.iconName,
          color: badgeDef.color,
          unlockedAt: formattedNow,
          category: badgeDef.category,
        };
        member.badges.push(newBadge);
        newlyUnlocked.push(newBadge);
      }
    }

    return { member, newlyUnlocked };
  }

  /**
   * Manually grant a badge to a member
   */
  public grantBadge(member: Member, badgeDef: SystemBadgeDefinition, formattedNow: string): Member {
    if (!member.badges) member.badges = [];
    if (!member.badges.some((b) => b.id === badgeDef.id)) {
      member.badges.push({
        id: badgeDef.id,
        title: badgeDef.title,
        description: badgeDef.description,
        emoji: badgeDef.emoji,
        iconName: badgeDef.iconName,
        color: badgeDef.color,
        unlockedAt: formattedNow,
        category: badgeDef.category,
      });
    }
    return member;
  }

  /**
   * Revoke a badge from a member
   */
  public revokeBadge(member: Member, badgeId: string): Member {
    if (!member.badges) return member;
    member.badges = member.badges.filter((b) => b.id !== badgeId);
    return member;
  }
}

export const badgeService = new BadgeService();
