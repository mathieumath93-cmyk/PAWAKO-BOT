import { Member } from '../types';
import { store } from './store';
import { firebaseSyncService } from './firebaseSyncService';

class MemberService {
  public getMembers(): Member[] {
    return store.getMembers().map((m) => {
      const progressVals = Object.values(m.progress || {});
      const completed = progressVals.filter((p) => p.status === 'valide').length;
      const scores = progressVals.map((p) => p.score).filter((s): s is number => typeof s === 'number');
      const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 17.4;

      return {
        ...m,
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
}

export const memberService = new MemberService();
