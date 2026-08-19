import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { store } from './store';
import { TrainingModule, Quiz, Member, UsefulLink } from '../types';

class FirebaseSyncService {
  private isSyncing = false;

  /**
   * Sync initial data to Firestore if collection is empty, or load from Firestore
   */
  public async initSync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Sync Modules
      const modulesSnap = await getDocs(collection(db, 'modules'));
      if (modulesSnap.empty) {
        for (const mod of store.getModules()) {
          await setDoc(doc(db, 'modules', mod.id), mod);
        }
      } else {
        const loadedModules: TrainingModule[] = [];
        modulesSnap.forEach((doc) => loadedModules.push(doc.data() as TrainingModule));
        if (loadedModules.length > 0) {
          loadedModules.sort((a, b) => a.order - b.order);
          (store as any).modules = loadedModules;
          (store as any).saveModules();
        }
      }

      // 2. Sync Quizzes
      const quizSnap = await getDocs(collection(db, 'quizzes'));
      if (quizSnap.empty) {
        for (const q of store.getQuizzes()) {
          await setDoc(doc(db, 'quizzes', q.id), q);
        }
      } else {
        const loadedQuizzes: Quiz[] = [];
        quizSnap.forEach((doc) => loadedQuizzes.push(doc.data() as Quiz));
        if (loadedQuizzes.length > 0) {
          (store as any).quizzes = loadedQuizzes;
          (store as any).saveQuizzes();
        }
      }

      // 3. Sync Members
      const membersSnap = await getDocs(collection(db, 'members'));
      if (membersSnap.empty) {
        for (const m of store.getMembers()) {
          await setDoc(doc(db, 'members', m.id), m);
        }
      } else {
        const loadedMembers: Member[] = [];
        membersSnap.forEach((doc) => loadedMembers.push(doc.data() as Member));
        if (loadedMembers.length > 0) {
          (store as any).members = loadedMembers;
          (store as any).saveMembers();
        }
      }

      // 4. Sync UsefulLinks
      const linksSnap = await getDocs(collection(db, 'usefulLinks'));
      if (linksSnap.empty) {
        for (const l of store.getUsefulLinks()) {
          await setDoc(doc(db, 'usefulLinks', l.id), l);
        }
      } else {
        const loadedLinks: UsefulLink[] = [];
        linksSnap.forEach((doc) => loadedLinks.push(doc.data() as UsefulLink));
        if (loadedLinks.length > 0) {
          (store as any).usefulLinks = loadedLinks;
          (store as any).saveUsefulLinks();
        }
      }

      console.log('✅ Synchronisation Firebase Firestore initialisée avec succès !');
    } catch (err) {
      console.warn('⚠️ Erreur de synchronisation initiale Firestore:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  public async saveModule(moduleData: TrainingModule): Promise<void> {
    try {
      await setDoc(doc(db, 'modules', moduleData.id), moduleData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `modules/${moduleData.id}`);
    }
  }

  public async saveQuiz(quizData: Quiz): Promise<void> {
    try {
      await setDoc(doc(db, 'quizzes', quizData.id), quizData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `quizzes/${quizData.id}`);
    }
  }

  public async saveMember(memberData: Member): Promise<void> {
    try {
      await setDoc(doc(db, 'members', memberData.id), memberData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${memberData.id}`);
    }
  }

  public async saveUsefulLink(linkData: UsefulLink): Promise<void> {
    try {
      await setDoc(doc(db, 'usefulLinks', linkData.id), linkData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `usefulLinks/${linkData.id}`);
    }
  }

  public async deleteUsefulLink(linkId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'usefulLinks', linkId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `usefulLinks/${linkId}`);
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
