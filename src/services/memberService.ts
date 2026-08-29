import { Member, MemberBadge } from '../types';
import { store } from './store';
import { firebaseSyncService } from './firebaseSyncService';
import { badgeService, SYSTEM_BADGES } from './badgeService';

class MemberService {
  public getMembers(): Member[] {
    const modules = store.getModules();
    const formattedNow = store.getFormattedNow();

    return store.getMembers().map((m) => {
      const { member: evaluated, newlyUnlocked } = badgeService.evaluateBadges(m, modules, formattedNow);

      if (newlyUnlocked.length > 0) {
        store.saveMembers();
        firebaseSyncService.saveMember(evaluated).catch(() => {});
        for (const badge of newlyUnlocked) {
          store.addLog(
            'Système Pawako',
            `🏅 [BADGE_DÉBLOQUÉ] ${evaluated.username} a débloqué le badge : ${badge.title} (${badge.emoji})`,
            'member',
            evaluated.username
          );
          try {
            const { discordBot } = require('../bot/discordBot');
            if (discordBot && typeof discordBot.notifyBadgeUnlocked === 'function') {
              discordBot.notifyBadgeUnlocked(evaluated, badge);
            }
          } catch (e) {}
        }
      }

      const progressVals = Object.values(evaluated.progress || {});
      const completed = progressVals.filter((p) => p.status === 'valide').length;
      const scores = progressVals.map((p) => p.score).filter((s): s is number => typeof s === 'number');
      const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 17.4;

      return {
        ...evaluated,
        modulesCompletedCount: completed,
        averageScore: avgScore,
      };
    });
  }

  public filterMembers(
    filterStatus: string,
    searchQuery: string
  ): Member[] {
    let members = this.getMembers();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      members = members.filter(
        (m) =>
          m.username.toLowerCase().includes(q) ||
          m.discordId.toLowerCase().includes(q)
      );
    }

    if (filterStatus && filterStatus !== 'all') {
      if (filterStatus === 'active') {
        members = members.filter((m) => m.isActive);
      } else if (filterStatus === 'inactive') {
        members = members.filter((m) => !m.isActive);
      } else if (filterStatus === 'completed') {
        members = members.filter((m) => (m.modulesCompletedCount || 0) >= 4);
      } else if (filterStatus === 'failed') {
        members = members.filter((m) =>
          Object.values(m.progress || {}).some((p) => p.status === 'en_cours' && p.attemptsCount > 2)
        );
      } else if (filterStatus === 'in_progress') {
        members = members.filter((m) => (m.modulesCompletedCount || 0) < 4);
      } else if (filterStatus === 'auto_reminder') {
        members = members.filter((m) => m.autoReminderFlag === true);
      } else if (filterStatus === 'auto_reminder_6h') {
        members = members.filter((m) => m.autoReminderFlag === true && m.autoReminderLevel === '6h');
      } else if (filterStatus === 'auto_reminder_12h') {
        members = members.filter((m) => m.autoReminderFlag === true && m.autoReminderLevel === '12h');
      } else if (filterStatus === 'auto_reminder_24h') {
        members = members.filter((m) => m.autoReminderFlag === true && m.autoReminderLevel === '24h');
      } else if (filterStatus === 'kicked_inactivity') {
        members = members.filter((m) => m.candidateState === 'expulse_inactivite');
      } else if (filterStatus === 'inactive_3d') {
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        members = members.filter((m) => {
          if (!m.isActive || m.candidateState === 'expulse_inactivite') return false;
          const ts = m.lastActiveAtTimestamp || 0;
          return (now - ts) >= THREE_DAYS_MS;
        });
      }
    }

    return members;
  }

  public resetProgress(memberId: string): Member {
    const updated = store.resetMemberProgress(memberId);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    return updated;
  }

  public grantExtraAttempt(memberId: string, quizId: string): Member {
    const updated = store.grantExtraAttempt(memberId, quizId);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    return updated;
  }

  public updateRoles(memberId: string, roles: string[]): Member {
    const updated = store.updateMemberRoles(memberId, roles);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    return updated;
  }

  public resetCooldown(memberId: string): Member {
    const updated = store.resetCandidateCooldown(memberId);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    return updated;
  }

  public resetCurrentModule(memberId: string): Member {
    const updated = store.resetCandidateCurrentModule(memberId);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    return updated;
  }

  public forceModule(memberId: string, moduleId: string): Member {
    const updated = store.forceCandidateModule(memberId, moduleId);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    return updated;
  }

  public validateSimulation(memberId: string, adminName: string = 'Staff'): Member {
    const updated = store.validateCandidateSimulation(memberId, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const { discordBot } = require('../bot/discordBot');
      if (discordBot && typeof discordBot.validateSimulationAndTriggerToolsFormation === 'function') {
        discordBot.validateSimulationAndTriggerToolsFormation(updated, adminName);
      }
    } catch (e) {}
    return updated;
  }

  public rescheduleSimulation(memberId: string, timestamp: number, adminName: string = 'Staff'): Member {
    const updated = store.rescheduleCandidateSimulation(memberId, timestamp, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const { discordBot } = require('../bot/discordBot');
      if (discordBot && typeof discordBot.notifySimulationRescheduled === 'function') {
        discordBot.notifySimulationRescheduled(updated, timestamp, adminName);
      }
    } catch (e) {}
    return updated;
  }

  public rescheduleToolsFormation(memberId: string, timestamp: number, adminName: string = 'Staff'): Member {
    const updated = store.rescheduleCandidateToolsFormation(memberId, timestamp, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const { discordBot } = require('../bot/discordBot');
      if (discordBot && typeof discordBot.notifyToolsFormationRescheduled === 'function') {
        discordBot.notifyToolsFormationRescheduled(updated, timestamp, adminName);
      }
    } catch (e) {}
    return updated;
  }

  public evaluateMemberBadges(memberId: string): Member {
    const member = store.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');
    const modules = store.getModules();
    const formattedNow = store.getFormattedNow();
    const { member: updated, newlyUnlocked } = badgeService.evaluateBadges(member, modules, formattedNow);

    store.saveMembers();
    firebaseSyncService.saveMember(updated).catch(() => {});

    for (const badge of newlyUnlocked) {
      store.addLog(
        'Système Pawako',
        `🏅 [BADGE_DÉBLOQUÉ] ${updated.username} a débloqué le badge : ${badge.title} (${badge.emoji})`,
        'member',
        updated.username
      );
      try {
        const { discordBot } = require('../bot/discordBot');
        if (discordBot && typeof discordBot.notifyBadgeUnlocked === 'function') {
          discordBot.notifyBadgeUnlocked(updated, badge);
        }
      } catch (e) {}
    }

    return updated;
  }

  public grantManualBadge(memberId: string, badgeId: string, adminName: string = 'Staff'): Member {
    const member = store.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');
    const badgeDef = SYSTEM_BADGES.find((b) => b.id === badgeId);
    if (!badgeDef) throw new Error('Badge introuvable dans le catalogue');

    const updated = badgeService.grantBadge(member, badgeDef, store.getFormattedNow());
    store.saveMembers();
    firebaseSyncService.saveMember(updated).catch(() => {});

    store.addLog(
      adminName,
      `🏅 [BADGE_ATTRIBUÉ] ${adminName} a attribué manuellement le badge "${badgeDef.title}" (${badgeDef.emoji}) à ${member.username}`,
      'member',
      member.username
    );

    const addedBadge = updated.badges?.find((b) => b.id === badgeId);
    if (addedBadge) {
      try {
        const { discordBot } = require('../bot/discordBot');
        if (discordBot && typeof discordBot.notifyBadgeUnlocked === 'function') {
          discordBot.notifyBadgeUnlocked(updated, addedBadge);
        }
      } catch (e) {}
    }

    return updated;
  }

  public revokeManualBadge(memberId: string, badgeId: string, adminName: string = 'Staff'): Member {
    const member = store.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');

    const updated = badgeService.revokeBadge(member, badgeId);
    store.saveMembers();
    firebaseSyncService.saveMember(updated).catch(() => {});

    store.addLog(
      adminName,
      `🗑️ [BADGE_RETIRÉ] ${adminName} a retiré le badge (ID: ${badgeId}) de ${member.username}`,
      'member',
      member.username
    );

    return updated;
  }

  public kickMemberForInactivity(memberId: string, reason: string = 'Inactivité 3 jours sans action'): Member | null {
    const updated = store.kickMemberForInactivity(memberId, reason);
    if (updated) {
      firebaseSyncService.saveMember(updated).catch(() => {});
      try {
        const { pawakoBot } = require('../bot/discordBot');
        if (pawakoBot && typeof pawakoBot.kickMemberAndNotify === 'function') {
          pawakoBot.kickMemberAndNotify(updated, reason);
        }
      } catch (e) {}
    }
    return updated;
  }
}

export const memberService = new MemberService();
