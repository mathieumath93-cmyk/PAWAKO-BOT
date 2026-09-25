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

  public async resetCooldown(memberId: string): Promise<{ success: boolean; member?: Member; message?: string }> {
    const updated = store.resetCandidateCooldown(memberId);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const res = await fetch(`/api/members/${memberId}/reset-cooldown`, { method: 'POST' });
      const data = await res.json();
      if (data && data.member) {
        store.upsertMember(data.member);
      }
      return data;
    } catch (err: any) {
      return { success: false, member: updated, message: err?.message };
    }
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

  public async validateSimulation(
    memberId: string,
    adminName: string = 'Staff'
  ): Promise<{ success: boolean; member?: Member; botSuccess?: boolean; message?: string }> {
    const updated = store.validateCandidateSimulation(memberId, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const res = await fetch(`/api/members/${memberId}/validate-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName }),
      });
      const data = await res.json();
      if (data && data.member) {
        store.upsertMember(data.member);
      }
      return data;
    } catch (err: any) {
      return { success: false, member: updated, message: err?.message || 'Erreur validation simulation' };
    }
  }

  public async validateToolsFormation(
    memberId: string,
    adminName: string = 'Staff'
  ): Promise<{ success: boolean; member?: Member; botSuccess?: boolean; message?: string }> {
    const updated = store.validateCandidateToolsFormation(memberId, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const res = await fetch(`/api/members/${memberId}/validate-tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName }),
      });
      const data = await res.json();
      if (data && data.member) {
        store.upsertMember(data.member);
      }
      return data;
    } catch (err: any) {
      return { success: false, member: updated, message: err?.message || 'Erreur validation outils' };
    }
  }

  public async rescheduleSimulation(
    memberId: string,
    timestamp: number,
    adminName: string = 'Staff'
  ): Promise<{ success: boolean; member?: Member; botSuccess?: boolean; message?: string }> {
    const updated = store.rescheduleCandidateSimulation(memberId, timestamp, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const res = await fetch(`/api/members/${memberId}/reschedule-simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, adminName }),
      });
      const data = await res.json();
      if (data && data.member) {
        store.upsertMember(data.member);
      }
      return data;
    } catch (err: any) {
      return { success: false, member: updated, message: err?.message };
    }
  }

  public async rescheduleToolsFormation(
    memberId: string,
    timestamp: number,
    adminName: string = 'Staff'
  ): Promise<{ success: boolean; member?: Member; botSuccess?: boolean; message?: string }> {
    const updated = store.rescheduleCandidateToolsFormation(memberId, timestamp, adminName);
    firebaseSyncService.saveMember(updated).catch((err) =>
      console.error('[MemberService] Firebase saveMember failed:', err)
    );
    try {
      const res = await fetch(`/api/members/${memberId}/reschedule-tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, adminName }),
      });
      const data = await res.json();
      if (data && data.member) {
        store.upsertMember(data.member);
      }
      return data;
    } catch (err: any) {
      return { success: false, member: updated, message: err?.message };
    }
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

  public async kickMemberForInactivity(
    memberId: string,
    reason: string = 'Inactivité 3 jours sans action'
  ): Promise<{ success: boolean; member?: Member | null; message?: string }> {
    const updated = store.kickMemberForInactivity(memberId, reason);
    if (updated) {
      firebaseSyncService.saveMember(updated).catch(() => {});
    }
    try {
      const res = await fetch(`/api/members/${memberId}/kick-inactivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data && data.member) {
        store.upsertMember(data.member);
      }
      return data;
    } catch (err: any) {
      return { success: false, member: updated, message: err?.message };
    }
  }

  public async sendMemberDm(
    memberId: string,
    message: string,
    title?: string
  ): Promise<{ success: boolean; dmSent?: boolean; channelSent?: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/members/${memberId}/dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, title }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erreur réseau lors de l\'envoi du DM' };
    }
  }

  public getModuleCandidateBreakdown() {
    const candidates = this.getMembers().filter(
      (m) =>
        !m.roles?.some((r) =>
          ['admin', 'staff', 'lead admin', 'formateur', 'direction', 'support'].some((kw) =>
            r.toLowerCase().includes(kw)
          )
        )
    );

    const modules = store.getModules();
    const totalModulesCount = modules.length || 5;

    const moduleCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const moduleMembers: Record<number, Member[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    let unstartedCount = 0;
    let simulationCount = 0;
    let toolsCount = 0;
    let completedCount = 0;
    let inactive3dCount = 0;

    const unstartedMembers: Member[] = [];
    const simulationMembers: Member[] = [];
    const toolsMembers: Member[] = [];
    const completedMembers: Member[] = [];

    candidates.forEach((c) => {
      if (c.candidateState === 'expulse_inactivite') {
        inactive3dCount++;
        return;
      }

      const valCount = Object.values(c.progress || {}).filter((p) => p.status === 'valide').length;
      const hasStarted =
        Boolean(c.candidateState && c.candidateState !== 'nouveau') ||
        Object.values(c.progress || {}).some(
          (p) => (p.attemptsCount && p.attemptsCount > 0) || p.status === 'en_cours' || p.status === 'valide'
        );

      if (c.candidateState === 'formation_terminee' || valCount >= totalModulesCount) {
        completedCount++;
        completedMembers.push(c);
      } else if (c.candidateState === 'formation_outils') {
        toolsCount++;
        toolsMembers.push(c);
      } else if (c.candidateState === 'simulation') {
        simulationCount++;
        simulationMembers.push(c);
      } else if (valCount === 0 && !hasStarted) {
        unstartedCount++;
        unstartedMembers.push(c);
      } else {
        let modNum = 1;
        if (c.currentModuleId) {
          const matched = modules.find((m) => m.id === c.currentModuleId);
          if (matched && matched.order) modNum = matched.order;
          else if (c.currentModuleId.includes('-')) {
            const parsed = parseInt(c.currentModuleId.split('-')[1], 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) modNum = parsed;
          }
        } else {
          modNum = Math.min(valCount + 1, 5);
        }
        modNum = Math.max(1, Math.min(5, modNum));
        moduleCounts[modNum] = (moduleCounts[modNum] || 0) + 1;
        moduleMembers[modNum].push(c);
      }
    });

    return {
      totalCandidates: candidates.length,
      unstartedCount,
      unstartedMembers,
      moduleCounts,
      moduleMembers,
      simulationCount,
      simulationMembers,
      toolsCount,
      toolsMembers,
      completedCount,
      completedMembers,
      inactive3dCount,
    };
  }

  public async purgeAbsentMembers(): Promise<{ success: boolean; purgedCount: number; remainingCount: number; purgedUsernames?: string[]; message?: string }> {
    try {
      const res = await fetch('/api/members/purge-absent', { method: 'POST' });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        purgedCount: 0,
        remainingCount: this.getMembers().length,
        message: err.message || 'Erreur lors de la purge des candidats absents',
      };
    }
  }

  public async scheduleSimulation14h(memberId: string): Promise<{ success: boolean; member?: Member; message?: string }> {
    try {
      const res = await fetch(`/api/members/${memberId}/schedule-14h`, { method: 'POST' });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erreur lors de la programmation du RDV Simulation 14h00',
      };
    }
  }
}

export const memberService = new MemberService();
