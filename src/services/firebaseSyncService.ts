import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { store } from './store';
import { TrainingModule, Quiz, Member, UsefulLink } from '../types';

/**
 * FirebaseSyncService implementing a Stale-While-Revalidate (SWR) pattern.
 * - Stale: Local store / localStorage data is returned immediately without UI blocking.
 * - Revalidate: Background non-blocking fetch from Firestore updates store & notifies subscribers.
 * - Deduplication: High-frequency triggers reuse the same inflight revalidation promise.
 */
class FirebaseSyncService {
  private inFlightPromise: Promise<void> | null = null;
  private lastSyncedAt: string | null = null;
  private listeners: Array<() => void> = [];
  private workerInterval: ReturnType<typeof setInterval> | null = null;
  private lastWorkerRunAt: string | null = null;

  /**
   * Helper to parse date strings into timestamps (ms)
   */
  private parseTimestampMs(dateStr?: string): number {
    if (!dateStr) return 0;
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed) && parsed > 0) return parsed;

    // Format DD/MM/YYYY HH:mm or DD/MM/YYYY
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if (match) {
      const [, day, month, year, hour = '0', min = '0'] = match;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min)).getTime();
    }
    return 0;
  }

  /**
   * Background Worker: monitors member activity & onboarding timestamps.
   * Identifies members who have not progressed in onboarding for 6h, 12h, or 24h,
   * and adds an 'Auto-Reminder' flag to their profiles.
   */
  public async checkAndApplyAutoReminders(): Promise<{ checked: number; flagged: number; details: string[] }> {
    const members = store.getMembers();
    const modules = store.getModules();
    const totalModulesCount = modules.length || 5;
    const now = Date.now();

    let flaggedCount = 0;
    const details: string[] = [];

    for (const member of members) {
      const progressList = Object.values(member.progress || {});
      const completedModules = progressList.filter((p) => p.status === 'valide').length;

      // Skip members who completed all onboarding modules
      if (completedModules >= totalModulesCount && totalModulesCount > 0) {
        if (member.autoReminderFlag) {
          const updatedMember: Member = {
            ...member,
            autoReminderFlag: false,
            autoReminderLevel: null,
            autoReminderFlaggedAt: undefined,
            autoReminderReason: undefined,
          };
          await this.saveMember(updatedMember).catch(() => {});
        }
        continue;
      }

      // Determine most recent activity / progression timestamp
      let latestActivityMs = this.parseTimestampMs(member.lastActiveAt);

      for (const prog of progressList) {
        if (prog.validatedAt) {
          const vMs = this.parseTimestampMs(prog.validatedAt);
          if (vMs > latestActivityMs) latestActivityMs = vMs;
        }
      }

      if (latestActivityMs === 0 && member.joinedAt) {
        latestActivityMs = this.parseTimestampMs(member.joinedAt);
      }

      if (latestActivityMs === 0) {
        latestActivityMs = now - 25 * 60 * 60 * 1000;
      }

      const diffMs = Math.max(0, now - latestActivityMs);
      const hoursInactive = diffMs / (1000 * 60 * 60);

      // Identify inactivity thresholds: 24h, 12h, or 6h
      let targetLevel: '6h' | '12h' | '24h' | null = null;
      if (hoursInactive >= 24) {
        targetLevel = '24h';
      } else if (hoursInactive >= 12) {
        targetLevel = '12h';
      } else if (hoursInactive >= 6) {
        targetLevel = '6h';
      }

      if (targetLevel) {
        flaggedCount++;
        const reason = `Pas de progression sur l'onboarding depuis ${Math.floor(hoursInactive)}h (seuil ${targetLevel})`;
        details.push(`${member.username}: ${targetLevel}`);

        if (member.autoReminderLevel !== targetLevel || !member.autoReminderFlag) {
          const updatedMember: Member = {
            ...member,
            autoReminderFlag: true,
            autoReminderLevel: targetLevel,
            autoReminderFlaggedAt: new Date(now).toISOString(),
            autoReminderReason: reason,
          };
          await this.saveMember(updatedMember).catch(() => {});
        }
      } else if (member.autoReminderFlag) {
        const updatedMember: Member = {
          ...member,
          autoReminderFlag: false,
          autoReminderLevel: null,
          autoReminderFlaggedAt: undefined,
          autoReminderReason: undefined,
        };
        await this.saveMember(updatedMember).catch(() => {});
      }
    }

    this.lastWorkerRunAt = new Date().toISOString();
    this.notify();
    return { checked: members.length, flagged: flaggedCount, details };
  }

  /**
   * Start the periodic background inactivity worker (default interval: 60s)
   */
  public startInactivityWorker(intervalMs = 60000): void {
    if (this.workerInterval) return;

    this.checkAndApplyAutoReminders().catch((err) =>
      console.warn('⚠️ [AutoReminder Worker Initial Error]', err)
    );

    this.workerInterval = setInterval(() => {
      this.checkAndApplyAutoReminders().catch((err) =>
        console.warn('⚠️ [AutoReminder Worker Periodic Error]', err)
      );
    }, intervalMs);
  }

  public stopInactivityWorker(): void {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }

  public getLastWorkerRunAt(): string | null {
    return this.lastWorkerRunAt;
  }

  /**
   * Subscribe to SWR background revalidation updates
   */
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.warn('[SWR Listener Error]', err);
      }
    });
  }

  public getLastSyncedAt(): string | null {
    return this.lastSyncedAt;
  }

  /**
   * Stale-While-Revalidate initialization & sync.
   * Immediately resolves with stale data while launching revalidation in background.
   */
  public async initSync(): Promise<void> {
    // Start background inactivity monitoring worker
    this.startInactivityWorker(60000);

    // Return inflight promise if background revalidation is already running
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    // Launch background revalidation
    this.inFlightPromise = this.revalidate().finally(() => {
      this.inFlightPromise = null;
    });

    // Resolve immediately for SWR (non-blocking)
    return Promise.resolve();
  }

  /**
   * Perform background revalidation against Firestore
   */
  public async revalidate(): Promise<void> {
    try {
      // 1. Revalidate Modules
      try {
        const modulesSnap = await getDocs(collection(db, 'modules'));
        if (modulesSnap.empty) {
          const currentMods = store.getModules();
          for (const mod of currentMods) {
            await setDoc(doc(db, 'modules', mod.id), mod).catch(() => {});
          }
        } else {
          const loadedModules: TrainingModule[] = [];
          modulesSnap.forEach((doc) => loadedModules.push(doc.data() as TrainingModule));
          if (loadedModules.length > 0) {
            loadedModules.sort((a, b) => a.order - b.order);
            store.setModules(loadedModules);
          }
        }
      } catch (modErr) {
        console.warn('⚠️ [SWR Revalidate Modules Info]', modErr);
      }

      // 2. Revalidate Quizzes
      try {
        const quizSnap = await getDocs(collection(db, 'quizzes'));
        if (quizSnap.empty) {
          const currentQuizzes = store.getQuizzes();
          for (const q of currentQuizzes) {
            await setDoc(doc(db, 'quizzes', q.id), q).catch(() => {});
          }
        } else {
          const loadedQuizzes: Quiz[] = [];
          quizSnap.forEach((doc) => loadedQuizzes.push(doc.data() as Quiz));
          if (loadedQuizzes.length > 0) {
            store.setQuizzes(loadedQuizzes);
          }
        }
      } catch (quizErr) {
        console.warn('⚠️ [SWR Revalidate Quizzes Info]', quizErr);
      }

      // 3. Revalidate Members
      try {
        const membersSnap = await getDocs(collection(db, 'members'));
        if (membersSnap.empty) {
          const currentMembers = store.getMembers();
          for (const m of currentMembers) {
            await setDoc(doc(db, 'members', m.id), m).catch(() => {});
          }
        } else {
          const loadedMembers: Member[] = [];
          membersSnap.forEach((doc) => loadedMembers.push(doc.data() as Member));
          if (loadedMembers.length > 0) {
            store.setMembers(loadedMembers);
          }
        }
        // Run auto-reminder inactivity evaluation
        await this.checkAndApplyAutoReminders().catch(() => {});
      } catch (memErr) {
        console.warn('⚠️ [SWR Revalidate Members Info]', memErr);
      }

      // 4. Revalidate UsefulLinks
      try {
        const linksSnap = await getDocs(collection(db, 'usefulLinks'));
        if (linksSnap.empty) {
          const currentLinks = store.getUsefulLinks();
          for (const l of currentLinks) {
            await setDoc(doc(db, 'usefulLinks', l.id), l).catch(() => {});
          }
        } else {
          const loadedLinks: UsefulLink[] = [];
          linksSnap.forEach((doc) => loadedLinks.push(doc.data() as UsefulLink));
          if (loadedLinks.length > 0) {
            store.setUsefulLinks(loadedLinks);
          }
        }
      } catch (linkErr) {
        console.warn('⚠️ [SWR Revalidate UsefulLinks Info]', linkErr);
      }

      this.lastSyncedAt = new Date().toISOString();
      console.log('✅ [SWR Firestore Revalidate] Background sync completed seamlessly.');
      this.notify();
    } catch (err) {
      console.warn('⚠️ Erreur de revalidation Firestore SWR:', err);
    }
  }

  // --- Optimistic Writes ---

  public async saveModule(moduleData: TrainingModule): Promise<void> {
    // Optimistically save to local store first
    const existing = store.getModules().filter((m) => m.id !== moduleData.id);
    store.setModules([...existing, moduleData].sort((a, b) => a.order - b.order));

    try {
      await setDoc(doc(db, 'modules', moduleData.id), moduleData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `modules/${moduleData.id}`);
    }
  }

  public async saveQuiz(quizData: Quiz): Promise<void> {
    const existing = store.getQuizzes().filter((q) => q.id !== quizData.id);
    store.setQuizzes([...existing, quizData]);

    try {
      await setDoc(doc(db, 'quizzes', quizData.id), quizData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `quizzes/${quizData.id}`);
    }
  }

  public async saveMember(memberData: Member): Promise<void> {
    const existing = store.getMembers().filter((m) => m.id !== memberData.id && m.discordId !== memberData.discordId);
    store.setMembers([...existing, memberData]);

    try {
      await setDoc(doc(db, 'members', memberData.id), memberData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${memberData.id}`);
    }
  }

  public async saveUsefulLink(linkData: UsefulLink): Promise<void> {
    const existing = store.getUsefulLinks().filter((l) => l.id !== linkData.id);
    store.setUsefulLinks([...existing, linkData].sort((a, b) => a.order - b.order));

    try {
      await setDoc(doc(db, 'usefulLinks', linkData.id), linkData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `usefulLinks/${linkData.id}`);
    }
  }

  public async deleteUsefulLink(linkId: string): Promise<void> {
    store.deleteUsefulLink(linkId);

    try {
      await deleteDoc(doc(db, 'usefulLinks', linkId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `usefulLinks/${linkId}`);
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
