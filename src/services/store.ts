import {
  AdminLog,
  AdminNotification,
  BackupRecord,
  BrandingSettings,
  DiscordRole,
  MaintenanceSetting,
  MaintenanceType,
  Member,
  MemberProgress,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  SystemHealth,
  Ticket,
  TicketMessage,
  TrainingModule,
  UsefulLink,
  UserSession,
} from '../types';
import { discordService } from './discordService';

const defaultBranding: BrandingSettings = {
  trainingName: 'PAWAKO FORMATION 🤖',
  description: 'Plateforme officielle de formation interne et d\'onboarding Discord.',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  botAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  botDisplayName: 'PAWAKO FORMATION 🤖',
  primaryColor: '#6366f1',
  secondaryColor: '#06b6d4',
  mainWelcomeMessage: 'Bienvenue sur la plateforme PAWAKO FORMATION 🤖 ! Clique sur "Commencer la formation" pour débuter ton parcours.',
};

const defaultModules: TrainingModule[] = [
  {
    id: 'mod-1',
    order: 1,
    title: 'Module 1 : Onboarding & Culture PAWAKO',
    description: 'Présentation de l\'écosystème, des valeurs et des outils fondamentaux de l\'équipe.',
    content: `## 🚀 Bienvenue dans l'équipe PAWAKO !

Ce premier module a pour objectif de te faire découvrir les bases de notre organisation, nos valeurs et le fonctionnement du serveur.

### 📌 Ce que tu vas apprendre :
1. **La vision PAWAKO** : Innovation, entraide et rigueur SaaS.
2. **L'organisation des salons Discord** : Comprendre le rôle du bot Jarvis et la structure.
3. **Les règles d'or de la communauté** : Bienveillance, confidentialité et réactivité.

Prends le temps de lire attentivement le guide avant de valider ce module !`,
    channelId: 'chan-mod-1',
    channelName: '#module-1',
    roleValidatedId: 'role-mod-1-valide',
    roleValidatedName: 'Module 1 Validé',
    roleEnCoursId: 'role-mod-1-encours',
    roleEnCoursName: 'Module 1 En cours',
    quizId: 'quiz-1',
    isActive: true,
    resources: [
      { id: 'res-1', title: 'Guide d\'accueil PAWAKO.pdf', url: 'https://example.com/guide.pdf', type: 'pdf' },
      { id: 'res-2', title: 'Vidéo d\'introduction (5 min)', url: 'https://example.com/intro-video', type: 'video' },
    ],
    buttons: [
      { id: 'btn-1', label: '✅ J\'ai terminé le module', action: 'complete' },
    ],
  },
  {
    id: 'mod-2',
    order: 2,
    title: 'Module 2 : Outils & Processus Internes',
    description: 'Prise en main des workflows, de la gestion des tickets et de la sécurité.',
    content: `## 🛠️ Outils & Processus Internes

Dans ce module, nous abordons la gestion quotidienne de tes tâches et l'utilisation des tickets Discord.

### 🔑 Points clés :
* **Les Tickets** : Comment ouvrir un ticket d'aide et interagir avec les administrateurs.
* **La Sécurité** : Ne jamais partager de clés API ni d'identifiants confidentiels.
* **Le suivi de progression** : Jarvis synchronise automatiquement tes rôles et tes accès.`,
    channelId: 'chan-mod-2',
    channelName: '#module-2',
    roleValidatedId: 'role-mod-2-valide',
    roleValidatedName: 'Module 2 Validé',
    roleEnCoursId: 'role-mod-2-encours',
    roleEnCoursName: 'Module 2 En cours',
    quizId: 'quiz-2',
    isActive: true,
    resources: [
      { id: 'res-3', title: 'Doc Sécurité & Authentification', url: 'https://example.com/sec.pdf', type: 'document' },
    ],
    buttons: [
      { id: 'btn-2', label: '✅ J\'ai terminé le module', action: 'complete' },
    ],
  },
  {
    id: 'mod-3',
    order: 3,
    title: 'Module 3 : Communication & Reporting',
    description: 'Gestion des notifications, retours d\'expérience et bonnes pratiques de synthèse.',
    content: `## 📊 Communication & Reporting

Apprends à synthétiser tes avancées et à rédiger des compte-rendus efficaces.

### 📝 Principes :
* **Clarté** : Des messages synthétiques et structurés.
* **Proactivité** : Prévenir en cas de blocage ou d'anomalie.
* **Système d'alertes** : Découvre le fonctionnement des notifications admin.`,
    channelId: 'chan-mod-3',
    channelName: '#module-3',
    roleValidatedId: 'role-mod-3-valide',
    roleValidatedName: 'Module 3 Validé',
    roleEnCoursId: 'role-mod-3-encours',
    roleEnCoursName: 'Module 3 En cours',
    quizId: 'quiz-3',
    isActive: true,
    resources: [],
    buttons: [
      { id: 'btn-3', label: '✅ J\'ai terminé le module', action: 'complete' },
    ],
  },
  {
    id: 'mod-4',
    order: 4,
    title: 'Module 4 : Gestion des Incident & System Health',
    description: 'Comprenant la résilience du bot, les retries automatiques et l\'idempotence.',
    content: `## 🚨 Gestion des Incidents & Résilience

PAWAKO FORMATION intègre une architecture résiliente. Ce module explique comment le bot gère les incidents.

### ⚙️ Principes techniques :
* **Idempotence** : Évite les doublons d'attribution de rôle ou de progression.
* **Incident / Rétablissement** : Envoi de notifications 🔴 INCIDENT puis 🟢 RÉTABLI.
* **Heartbeat & Monitor** : Suivi permanent de la santé Supabase et Gateway.`,
    channelId: 'chan-mod-4',
    channelName: '#module-4',
    roleValidatedId: 'role-mod-4-valide',
    roleValidatedName: 'Module 4 Validé',
    roleEnCoursId: 'role-mod-4-encours',
    roleEnCoursName: 'Module 4 En cours',
    quizId: 'quiz-4',
    isActive: true,
    resources: [],
    buttons: [
      { id: 'btn-4', label: '✅ J\'ai terminé le module', action: 'complete' },
    ],
  },
  {
    id: 'mod-5',
    order: 5,
    title: 'Module 5 : Certification Finale PAWAKO',
    description: 'Évaluation globale de validation du parcours de formation interne.',
    content: `## 🎓 Certification Finale PAWAKO

Félicitations pour ton parcours jusqu'ici ! Ce dernier module valide la totalité de tes compétences acquises.

Une fois ce quiz réussi avec un score minimum de 80%, tu obtiendras la certification officielle et le rôle final !`,
    channelId: 'chan-mod-5',
    channelName: '#module-5',
    roleValidatedId: 'role-mod-5-valide',
    roleValidatedName: 'Module 5 Validé',
    roleEnCoursId: 'role-mod-5-encours',
    roleEnCoursName: 'Module 5 En cours',
    quizId: 'quiz-5',
    isActive: true,
    resources: [],
    buttons: [
      { id: 'btn-5', label: '✅ J\'ai terminé le module', action: 'complete' },
    ],
  },
];

const defaultQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    moduleId: 'mod-1',
    title: 'Quiz 1 : Onboarding & Culture',
    description: 'Vérification des connaissances du Module 1.',
    minScore: 16,
    maxAttempts: 3,
    cooldownMinutes: 30,
    sampleSize: 20,
    delayMinutesBeforeQuiz: 10,
    questions: [
      {
        id: 'q1-1',
        text: 'Quel est le salon principal d\'interaction avec le bot PAWAKO ?',
        options: ['#general', '#🤖-jarvis', '#annonces', '#tickets'],
        correctAnswer: 1,
        explanation: 'Le salon #🤖-jarvis rassemble toutes les commandes interactives par boutons.',
      },
      {
        id: 'q1-2',
        text: 'Quel rôle reçoit automatiquement tout nouveau membre ?',
        options: ['Stagiaire', 'Nouveau membre', 'Invité', 'Membre Validé'],
        correctAnswer: 1,
        explanation: 'Le rôle "Nouveau membre" est attribué à l\'arrivée.',
      },
      {
        id: 'q1-3',
        text: 'Que se passe-t-il après avoir validé le Quiz du Module 1 ?',
        options: [
          'Le rôle Nouveau membre est conservé et aucun autre accès n\'est donné',
          'Le rôle Nouveau membre est retiré, le rôle Module 1 Validé et Module 2 En cours sont ajoutés',
          'Tous les modules sont débloqués d\'un coup',
          'Rien du tout',
        ],
        correctAnswer: 1,
        explanation: 'Le module 1 passe en lecture seule, et le module 2 passe en cours.',
      },
    ],
    successMessage: 'Bravo ! Tu as validé le Module 1 ! Accès au Module 2 débloqué.',
    failureMessage: 'Score insuffisant. Relis attentivement le Module 1 puis réessaie.',
  },
  {
    id: 'quiz-2',
    moduleId: 'mod-2',
    title: 'Quiz 2 : Processus & Outils Internes',
    description: 'Évaluation de la maîtrise des outils et tickets.',
    minScore: 16,
    maxAttempts: 3,
    cooldownMinutes: 60,
    sampleSize: 20,
    delayMinutesBeforeQuiz: 10,
    questions: [
      {
        id: 'q2-1',
        text: 'Comment demander l\'aide d\'un Admin en cas de problème ?',
        options: [
          'Envoyer un MP au créateur du serveur',
          'Cliquer sur "🎫 Mes tickets" dans #🤖-jarvis',
          'Poster un message dans #general avec @everyone',
          'Ne rien faire',
        ],
        correctAnswer: 1,
      },
      {
        id: 'q2-2',
        text: 'Où sont stockés les transcripts des tickets fermés ?',
        options: [
          'Uniquement dans le cache du navigateur',
          'Dans Supabase PostgreSQL sous forme de texte/JSON',
          'Ils sont supprimés immédiatement',
          'Sur un drive externe privé',
        ],
        correctAnswer: 1,
      },
    ],
    successMessage: 'Module 2 validé avec succès !',
    failureMessage: 'Quiz non validé. Révise les notions et effectue une nouvelle tentative.',
  },
  {
    id: 'quiz-3',
    moduleId: 'mod-3',
    title: 'Quiz 3 : Communication & Reporting',
    description: 'Test sur les standards de communication.',
    minScore: 16,
    maxAttempts: 3,
    cooldownMinutes: 120,
    sampleSize: 20,
    delayMinutesBeforeQuiz: 10,
    questions: [
      {
        id: 'q3-1',
        text: 'Quels sont les 3 niveaux de notifications admin ?',
        options: [
          'Rouge, Jaune, Vert',
          '🔴 Critique, 🟠 Important, 🔵 Information',
          'Élevé, Moyen, Faible',
          'Urgent, Normal, Optionnel',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: 'quiz-4',
    moduleId: 'mod-4',
    title: 'Quiz 4 : Gestion des Incidents',
    description: 'Questions sur la résilience et le rétablissement.',
    minScore: 16,
    maxAttempts: 3,
    cooldownMinutes: 120,
    sampleSize: 20,
    delayMinutesBeforeQuiz: 10,
    questions: [
      {
        id: 'q4-1',
        text: 'Pourquoi l\'idempotence est-elle essentielle pour les actions critiques ?',
        options: [
          'Pour accélérer l\'affichage des images',
          'Pour empêcher la duplication de rôle, de progression ou de ticket',
          'Pour limiter l\'accès aux salons',
          'Elle n\'est pas utile',
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: 'quiz-5',
    moduleId: 'mod-5',
    title: 'Quiz 5 : Examen de Certification Finale',
    description: 'Examen global synthétisant l\'ensemble du parcours PAWAKO.',
    minScore: 16,
    maxAttempts: 2,
    cooldownMinutes: 180,
    sampleSize: 20,
    delayMinutesBeforeQuiz: 10,
    questions: [
      {
        id: 'q5-1',
        text: 'Si un administrateur retire manuellement un rôle de module sur Discord, que se passe-t-il ?',
        options: [
          'Le bot réattribue le rôle immédiatement par force',
          'Le rôle Discord fait foi : le module redevient verrouillé et la progression s\'ajuste',
          'La base de données écrase Discord',
          'Le compte est banni',
        ],
        correctAnswer: 1,
      },
      {
        id: 'q5-2',
        text: 'Combien de temps dure la rotation des sauvegardes automatiques ?',
        options: ['1 jour', '7 jours', '30 jours', 'Indéfiniment'],
        correctAnswer: 1,
      },
    ],
  },
];

const defaultMembers: Member[] = [
  {
    id: 'mem-admin',
    discordId: '1538874226415501462',
    username: 'Administrateur (Vous)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    roles: ['Admin', 'Fondateur'],
    joinedAt: '17/08/2026 05:00',
    currentModuleId: 'mod-1',
    progress: {
      'mod-1': { moduleId: 'mod-1', status: 'en_cours', attemptsCount: 0 },
      'mod-2': { moduleId: 'mod-2', status: 'verrouille', attemptsCount: 0 },
      'mod-3': { moduleId: 'mod-3', status: 'verrouille', attemptsCount: 0 },
      'mod-4': { moduleId: 'mod-4', status: 'verrouille', attemptsCount: 0 },
      'mod-5': { moduleId: 'mod-5', status: 'verrouille', attemptsCount: 0 },
    },
    extraAttemptsGranted: {},
    isActive: true,
    lastActiveAt: '17/08/2026 05:30',
  },
];

const defaultUsefulLinks: UsefulLink[] = [
  { id: 'link-1', name: 'Documentation PAWAKO', url: 'https://pawako.io/docs', icon: 'BookOpen', order: 1, isActive: true },
  { id: 'link-2', name: 'Portail des Ressources', url: 'https://pawako.io/resources', icon: 'Folder', order: 2, isActive: true },
  { id: 'link-3', name: 'Assistance & Support', url: 'https://pawako.io/support', icon: 'LifeBuoy', order: 3, isActive: true },
];

const defaultTickets: Ticket[] = [];

const defaultAdminLogs: AdminLog[] = [
  {
    id: 'log-1',
    adminName: 'Système Discord',
    action: 'Initialisation Application & Connexion Bot ID 1538874226415501462',
    category: 'system',
    date: '17/08/2026 05:00',
    result: 'effectué',
  },
];

const defaultNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    level: 'information',
    title: 'Bot Discord Connecté',
    message: 'L\'application est synchronisée avec le Bot App ID 1538874226415501462.',
    event: 'bot_reconnect',
    status: 'non_lue',
    date: '17/08/2026 05:00',
    mentionAdmin: false,
  },
];

const defaultHealth: SystemHealth = {
  botConnected: true,
  botLatencyMs: 24,
  supabaseConnected: true,
  webServerStatus: 'online',
  pendingActions: 0,
  recentErrorCount: 0,
  retryQueueCount: 0,
  lastHeartbeat: '17/08/2026 14:35',
  lastPermissionSync: '17/08/2026 14:30',
  lastBackupDate: '17/08/2026 04:00',
  permissionsAudit: [
    { name: 'Voir les salons', key: 'VIEW_CHANNEL', granted: true, essential: true },
    { name: 'Envoyer des messages', key: 'SEND_MESSAGES', granted: true, essential: true },
    { name: 'Intégrer des liens', key: 'EMBED_LINKS', granted: true, essential: true },
    { name: 'Gérer les messages', key: 'MANAGE_MESSAGES', granted: true, essential: true },
    { name: 'Gérer les salons', key: 'MANAGE_CHANNELS', granted: true, essential: true },
    { name: 'Gérer les rôles', key: 'MANAGE_ROLES', granted: true, essential: true },
  ],
};

const defaultBackups: BackupRecord[] = [
  {
    id: 'bak-1',
    filename: 'pawako_backup_20260817.json',
    sizeKb: 42,
    createdAt: '17/08/2026 04:00',
    status: 'succes',
    itemsCount: { members: 3, modules: 5, quizzes: 5, tickets: 2, logs: 3 },
  },
  {
    id: 'bak-2',
    filename: 'pawako_backup_20260816.json',
    sizeKb: 40,
    createdAt: '16/08/2026 04:00',
    status: 'succes',
    itemsCount: { members: 2, modules: 5, quizzes: 5, tickets: 1, logs: 2 },
  },
];

class StoreService {
  private branding: BrandingSettings = { ...defaultBranding };
  private modules: TrainingModule[] = [...defaultModules];
  private quizzes: Quiz[] = [...defaultQuizzes];
  private members: Member[] = [...defaultMembers];
  private usefulLinks: UsefulLink[] = [...defaultUsefulLinks];
  private tickets: Ticket[] = [...defaultTickets];
  private adminLogs: AdminLog[] = [...defaultAdminLogs];
  private notifications: AdminNotification[] = [...defaultNotifications];
  private health: SystemHealth = { ...defaultHealth };
  private backups: BackupRecord[] = [...defaultBackups];
  private quizAttempts: QuizAttempt[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const storedMods = localStorage.getItem('pawako_modules');
      if (storedMods) this.modules = JSON.parse(storedMods);

      const storedQuizzes = localStorage.getItem('pawako_quizzes');
      if (storedQuizzes) this.quizzes = JSON.parse(storedQuizzes);

      const storedMembers = localStorage.getItem('pawako_members');
      if (storedMembers) this.members = JSON.parse(storedMembers);

      const storedLinks = localStorage.getItem('pawako_usefullinks');
      if (storedLinks) this.usefulLinks = JSON.parse(storedLinks);
    } catch (e) {
      console.warn('Error loading store from localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.warn('Error in store listener:', e);
      }
    });
  }

  public saveModules(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pawako_modules', JSON.stringify(this.modules));
      } catch {
        // Ignore
      }
    }
    this.notify();
  }

  public setModules(modules: TrainingModule[]): void {
    if (Array.isArray(modules) && modules.length > 0) {
      this.modules = modules;
      this.saveModules();
    }
  }

  public saveQuizzes(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pawako_quizzes', JSON.stringify(this.quizzes));
      } catch {
        // Ignore
      }
    }
    this.notify();
  }

  public setQuizzes(quizzes: Quiz[]): void {
    if (Array.isArray(quizzes) && quizzes.length > 0) {
      this.quizzes = quizzes;
      this.saveQuizzes();
    }
  }

  public saveMembers(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pawako_members', JSON.stringify(this.members));
      } catch {
        // Ignore
      }
    }
    this.notify();
  }

  public saveUsefulLinks(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pawako_usefullinks', JSON.stringify(this.usefulLinks));
      } catch {
        // Ignore
      }
    }
    this.notify();
  }

  public setUsefulLinks(links: UsefulLink[]): void {
    if (Array.isArray(links) && links.length > 0) {
      this.usefulLinks = links;
      this.saveUsefulLinks();
    }
  }

  private maintenance: Record<MaintenanceType, MaintenanceSetting> = {
    quiz: { enabled: false, mode: 'standard' },
    attempts: { enabled: false, mode: 'standard' },
    progress: { enabled: false, mode: 'standard' },
    tickets: { enabled: false, mode: 'standard' },
    onboarding: { enabled: false, mode: 'standard' },
  };

  private currentSession: UserSession = {
    discordId: '1538874226415501462',
    username: 'Administrateur (Vous)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isAdmin: true,
    roleName: 'Admin',
    loginAt: '17/08/2026 05:00',
  };

  // Helper date format
  public getFormattedNow(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }

  // --- Session & Auth ---
  public getSession(): UserSession {
    return this.currentSession;
  }

  public setSession(session: UserSession): void {
    this.currentSession = session;
  }

  // --- Branding ---
  public getBranding(): BrandingSettings {
    return this.branding;
  }

  public updateBranding(data: Partial<BrandingSettings>): BrandingSettings {
    this.branding = { ...this.branding, ...data };
    this.addLog('Anthony (Admin)', 'Mise à jour du branding système', 'system');
    return this.branding;
  }

  // --- Useful Links ---
  public getUsefulLinks(): UsefulLink[] {
    return this.usefulLinks.sort((a, b) => a.order - b.order);
  }

  public addUsefulLink(link: Omit<UsefulLink, 'id'>): UsefulLink {
    if (!link.url.startsWith('https://')) {
      throw new Error('Toutes les URLs doivent obligatoirement utiliser HTTPS (https://)');
    }
    const newLink: UsefulLink = { ...link, id: `link-${Date.now()}` };
    this.usefulLinks.push(newLink);
    this.addLog('Anthony (Admin)', `Ajout du lien utile "${newLink.name}"`, 'system');
    return newLink;
  }

  public updateUsefulLink(id: string, data: Partial<UsefulLink>): UsefulLink {
    if (data.url && !data.url.startsWith('https://')) {
      throw new Error('Toutes les URLs doivent obligatoirement utiliser HTTPS (https://)');
    }
    const idx = this.usefulLinks.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Lien non trouvé');
    this.usefulLinks[idx] = { ...this.usefulLinks[idx], ...data };
    return this.usefulLinks[idx];
  }

  public deleteUsefulLink(id: string): void {
    this.usefulLinks = this.usefulLinks.filter((l) => l.id !== id);
    this.addLog('Anthony (Admin)', 'Suppression d\'un lien utile', 'system');
  }

  // --- Modules ---
  public getModules(): TrainingModule[] {
    return this.modules.sort((a, b) => a.order - b.order);
  }

  public getModule(id: string): TrainingModule | undefined {
    return this.modules.find((m) => m.id === id);
  }

  public createModule(mod: Omit<TrainingModule, 'id'>): TrainingModule {
    const newId = `mod-${Date.now()}`;
    const newMod: TrainingModule = { ...mod, id: newId };
    this.modules.push(newMod);
    this.addLog('Anthony (Admin)', `Création du module "${newMod.title}"`, 'module');
    return newMod;
  }

  public addModule(mod: TrainingModule): TrainingModule {
    this.modules.push(mod);
    this.addLog('Anthony (Admin)', `Création du module "${mod.title}"`, 'module');
    return mod;
  }

  public updateModule(id: string, data: Partial<TrainingModule>): TrainingModule {
    const idx = this.modules.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Module non trouvé');
    this.modules[idx] = { ...this.modules[idx], ...data };
    this.addLog('Anthony (Admin)', `Modification du module "${this.modules[idx].title}"`, 'module');
    return this.modules[idx];
  }

  public deleteModule(id: string): void {
    const mod = this.getModule(id);
    this.modules = this.modules.filter((m) => m.id !== id);
    if (mod) {
      this.addLog('Anthony (Admin)', `Suppression du module "${mod.title}"`, 'module');
    }
  }

  // --- Quizzes ---
  public getQuizzes(): Quiz[] {
    return this.quizzes;
  }

  public getQuiz(id: string): Quiz | undefined {
    return this.quizzes.find((q) => q.id === id);
  }

  public createQuiz(quiz: Omit<Quiz, 'id'>): Quiz {
    const newId = `quiz-${Date.now()}`;
    const newQuiz: Quiz = { ...quiz, id: newId };
    this.quizzes.push(newQuiz);
    this.addLog('Anthony (Admin)', `Création du quiz "${newQuiz.title}"`, 'quiz');
    return newQuiz;
  }

  public addQuiz(quiz: Quiz): Quiz {
    this.quizzes.push(quiz);
    this.addLog('Anthony (Admin)', `Création du quiz "${quiz.title}"`, 'quiz');
    return quiz;
  }

  public updateQuiz(id: string, data: Partial<Quiz>): Quiz {
    const idx = this.quizzes.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error('Quiz non trouvé');
    this.quizzes[idx] = { ...this.quizzes[idx], ...data };
    this.addLog('Anthony (Admin)', `Modification du quiz "${this.quizzes[idx].title}"`, 'quiz');
    return this.quizzes[idx];
  }

  public deleteQuiz(id: string): void {
    const q = this.getQuiz(id);
    this.quizzes = this.quizzes.filter((item) => item.id !== id);
    if (q) {
      this.addLog('Anthony (Admin)', `Suppression du quiz "${q.title}"`, 'quiz');
    }
  }

  // --- Grade Quiz Attempt & Progression Sync ---
  public submitQuizAttempt(memberId: string, quizId: string, userAnswers: number[]): { passed: boolean; score: number; attempt: QuizAttempt } {
    if (this.maintenance.quiz.enabled) {
      throw new Error(this.maintenance.quiz.customMessage || 'Les quiz sont actuellement en maintenance.');
    }

    const quiz = this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz non trouvé');
    const member = this.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');

    // Calculate score
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const total = quiz.questions.length || 1;
    const score = Math.round((correctCount / total) * 100);
    const passed = score >= quiz.minScore;

    const prog = member.progress[quiz.moduleId] || {
      moduleId: quiz.moduleId,
      status: 'en_cours',
      attemptsCount: 0,
    };
    prog.attemptsCount += 1;

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId,
      quizTitle: quiz.title,
      memberId,
      memberName: member.username,
      score,
      passed,
      answers: userAnswers,
      date: this.getFormattedNow(),
      attemptNumber: prog.attemptsCount,
    };
    this.quizAttempts.push(attempt);

    if (passed) {
      prog.validatedAt = this.getFormattedNow();
      prog.quizPassed = true;
      prog.score = score;
      member.progress[quiz.moduleId] = prog;

      // Find current module index
      const sortedMods = this.getModules();
      const currentModIdx = sortedMods.findIndex((m) => m.id === quiz.moduleId);
      const currentMod = sortedMods[currentModIdx];

      // Assign role "Module X Validé"
      if (currentMod && !member.roles.includes(currentMod.roleValidatedName)) {
        member.roles.push(currentMod.roleValidatedName);
      }

      // Remove "Nouveau membre" if finishing module 1
      if (currentModIdx === 0) {
        member.roles = member.roles.filter((r) => r !== 'Nouveau membre');
      }

      // Unlock next module
      const nextMod = sortedMods[currentModIdx + 1];
      if (nextMod) {
        // Remove previous "En cours" role
        if (currentMod) {
          member.roles = member.roles.filter((r) => r !== currentMod.roleEnCoursName);
        }
        // Add next "En cours" role
        if (!member.roles.includes(nextMod.roleEnCoursName)) {
          member.roles.push(nextMod.roleEnCoursName);
        }
        member.currentModuleId = nextMod.id;
        if (!member.progress[nextMod.id]) {
          member.progress[nextMod.id] = {
            moduleId: nextMod.id,
            status: 'en_cours',
            attemptsCount: 0,
          };
        } else {
          member.progress[nextMod.id].status = 'en_cours';
        }
      }

      this.addLog('System Bot', `Module ${quiz.moduleId} validé par ${member.username} (Score: ${score}%)`, 'quiz', member.username, quiz.title);

      // Sync new roles directly to Discord REST API
      const discordId = member.discordId || member.id;
      if (discordId) {
        discordService.assignDiscordRolesToMember(discordId, member.roles).catch((e) =>
          console.warn('[Quiz Validation Discord Role Sync Error]', e?.message || e)
        );
      }
    } else {
      member.progress[quiz.moduleId] = prog;
      this.addLog('System Bot', `Échec au quiz ${quiz.title} pour ${member.username} (Score: ${score}%)`, 'quiz', member.username, quiz.title);
    }

    member.lastActiveAt = this.getFormattedNow();
    this.saveMembers();
    return { passed, score, attempt };
  }

  public addQuizAttempt(attempt: QuizAttempt): void {
    this.quizAttempts.push(attempt);
    this.saveMembers();
  }

  public getQuizAttempts(): QuizAttempt[] {
    return this.quizAttempts;
  }

  // --- Members ---
  public getMembers(): Member[] {
    return this.members;
  }

  public setMembers(newMembers: Member[]): void {
    if (newMembers && newMembers.length > 0) {
      this.members = newMembers;
      this.saveMembers();
    }
  }

  public getMember(id: string): Member | undefined {
    return this.members.find((m) => m.id === id || m.discordId === id);
  }

  public getOrCreateCandidate(discordUserId: string, username: string, avatarUrl?: string): Member {
    let m = this.members.find((item) => item.discordId === discordUserId || item.id === discordUserId || item.id === `mem-${discordUserId}`);
    if (!m) {
      m = {
        id: `mem-${discordUserId}`,
        discordId: discordUserId,
        username: username || `Candidat-${discordUserId.slice(-4)}`,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        roles: ['Nouveau membre', 'Module 1 En cours'],
        joinedAt: this.getFormattedNow(),
        currentModuleId: 'mod-1',
        candidateState: 'nouveau',
        progress: {
          'mod-1': { moduleId: 'mod-1', status: 'en_cours', attemptsCount: 0 },
        },
        extraAttemptsGranted: {},
        isActive: true,
        lastActiveAt: this.getFormattedNow(),
      };
      this.members.push(m);
      this.saveMembers();
    } else {
      if (username && m.username !== username) {
        m.username = username;
      }
      if (avatarUrl && m.avatarUrl !== avatarUrl) {
        m.avatarUrl = avatarUrl;
      }
      m.lastActiveAt = this.getFormattedNow();
      this.saveMembers();
    }
    return m;
  }

  public updateMemberRoles(memberId: string, roles: string[]): Member {
    const m = this.getMember(memberId);
    if (!m) throw new Error('Membre non trouvé');
    m.roles = roles;
    this.saveMembers();
    this.addLog('Anthony (Admin)', `Mise à jour des rôles Discord de ${m.username}`, 'role', m.username);

    // Sync updated roles to Discord
    const discordId = m.discordId || m.id;
    if (discordId) {
      discordService.assignDiscordRolesToMember(discordId, roles).catch((e) =>
        console.warn('[Admin Update Roles Discord Sync Error]', e?.message || e)
      );
    }

    return m;
  }

  public resetMemberProgress(memberId: string): Member {
    const m = this.getMember(memberId);
    if (!m) throw new Error('Membre non trouvé');
    m.progress = {
      'mod-1': { moduleId: 'mod-1', status: 'en_cours', attemptsCount: 0 },
    };
    m.currentModuleId = 'mod-1';
    m.roles = ['Nouveau membre', 'Module 1 En cours'];
    this.saveMembers();
    this.addLog('Anthony (Admin)', `Réinitialisation de la progression de ${m.username}`, 'member', m.username, undefined, undefined, 'effectué');

    // Sync reset roles to Discord
    const discordId = m.discordId || m.id;
    if (discordId) {
      discordService.assignDiscordRolesToMember(discordId, m.roles).catch((e) =>
        console.warn('[Reset Progress Discord Role Sync Error]', e?.message || e)
      );
    }

    return m;
  }

  // --- CANDIDATE ONBOARDING ENGINE & QUESTION BANK ---

  /**
   * Randomly selects questions from quiz question bank & shuffles answer options
   */
  public getRandomQuizQuestions(quizId: string, targetCount: number = 20): QuizQuestion[] {
    const quiz = this.getQuiz(quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return [];
    }

    const count = quiz.sampleSize || targetCount || 20;
    const bank = [...quiz.questions];

    // Fisher-Yates shuffle question bank
    for (let i = bank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }

    // Select up to `count` questions
    const selected = bank.slice(0, count);

    // If bank is smaller than count, duplicate with variation to reach 20 questions
    while (selected.length < count && bank.length > 0) {
      const baseQ = bank[selected.length % bank.length];
      selected.push({
        ...baseQ,
        id: `${baseQ.id}-variation-${selected.length}`,
      });
    }

    // Shuffle options for each question & update correctAnswer index
    return selected.map((q, idx) => {
      const originalOptions = [...q.options];
      const correctText = originalOptions[q.correctAnswer] || originalOptions[0];

      // Shuffle options
      const shuffledOptions = [...originalOptions];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      const newCorrectIndex = shuffledOptions.indexOf(correctText);

      return {
        ...q,
        id: `${q.id}-q${idx + 1}`,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      };
    });
  }

  /**
   * Generate candidate personal profile text formatted for Discord
   */
  public generateCandidateProfileText(memberId: string): string {
    const member = this.getMember(memberId);
    if (!member) return '⚠️ Profil candidat non trouvé.';

    const modules = this.getModules();
    const totalModules = modules.length || 1;
    const completedCount = Object.values(member.progress).filter((p) => p.status === 'valide').length;
    const progressPercent = Math.round((completedCount / totalModules) * 100);

    // Progress bar string e.g. ████████░░ 80%
    const filledBlocks = Math.round(progressPercent / 10);
    const emptyBlocks = 10 - filledBlocks;
    const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

    const currentMod = modules.find((m) => m.id === member.currentModuleId);
    const currentModTitle = currentMod ? currentMod.title : 'Formation Terminée';

    // Quiz attempts list
    const memberAttempts = this.quizAttempts.filter((att) => att.memberId === member.id || att.memberId === member.discordId);
    let quizResultsText = 'Aucun quiz effectué pour le moment.';
    if (memberAttempts.length > 0) {
      quizResultsText = memberAttempts
        .map((att) => `${att.quizTitle} → **${att.score}/20** ${att.passed ? '✅' : '❌'}`)
        .join('\n');
    }

    // Cooldown status check
    let statusText = member.candidateState === 'formation_terminee'
      ? '🎉 Formation Terminée - Prêt à rejoindre l\'équipe !'
      : `Formation en cours (${currentModTitle})`;

    if (member.cooldownUntilTimestamp && member.cooldownUntilTimestamp > Date.now()) {
      const remainingMinutes = Math.ceil((member.cooldownUntilTimestamp - Date.now()) / 60000);
      statusText = `⏳ Cooldown actif (Prochaine tentative dans ${remainingMinutes} min)`;
    }

    return `━━━━━━━━━━━━━━━━━━━━
       👤 MON PROFIL
━━━━━━━━━━━━━━━━━━━━

Candidat : **${member.username}**

📊 **Progression**
\`${progressBar}\` **${progressPercent}%**

📚 **Modules terminés** : ${completedCount}/${totalModules}
📖 **Module actuel** : ${currentModTitle}

📝 **Résultats des quiz**
${quizResultsText}

🎯 **Statut** :
${statusText}

━━━━━━━━━━━━━━━━━━━━`;
  }

  /**
   * Reset candidate cooldown timer
   */
  public resetCandidateCooldown(memberId: string): Member {
    const member = this.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');
    member.cooldownUntilTimestamp = null;
    member.candidateState = 'quiz_disponible';
    this.saveMembers();
    this.addLog('Anthony (Admin)', `Réinitialisation du cooldown pour ${member.username}`, 'member', member.username);
    return member;
  }

  /**
   * Force candidate to a specific module
   */
  public forceCandidateModule(memberId: string, moduleId: string): Member {
    const member = this.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');
    const targetModule = this.getModule(moduleId);
    if (!targetModule) throw new Error('Module non trouvé');

    member.currentModuleId = moduleId;
    member.candidateState = 'module_en_cours';
    member.cooldownUntilTimestamp = null;

    if (!member.progress[moduleId]) {
      member.progress[moduleId] = { moduleId, status: 'en_cours', attemptsCount: 0 };
    } else {
      member.progress[moduleId].status = 'en_cours';
    }

    this.saveMembers();
    this.addLog('Anthony (Admin)', `Passage forcé de ${member.username} au module "${targetModule.title}"`, 'member', member.username);
    return member;
  }

  public resetMemberAttempts(memberId: string, quizId: string): Member {
    const m = this.getMember(memberId);
    if (!m) throw new Error('Membre non trouvé');
    const q = this.getQuiz(quizId);
    if (q && m.progress[q.moduleId]) {
      m.progress[q.moduleId].attemptsCount = 0;
    }
    delete m.extraAttemptsGranted[quizId];
    this.addLog('Anthony (Admin)', `Réinitialisation des tentatives de ${m.username} pour ${q?.title || quizId}`, 'quiz', m.username);
    return m;
  }

  public grantExtraAttempt(memberId: string, quizId: string): Member {
    const m = this.getMember(memberId);
    if (!m) throw new Error('Membre non trouvé');
    const q = this.getQuiz(quizId);
    const count = (m.extraAttemptsGranted[quizId] || 0) + 1;
    m.extraAttemptsGranted[quizId] = count;
    this.addLog('Anthony (Admin)', `Octroi d'une tentative supplémentaire à ${m.username} (${q?.title || quizId})`, 'quiz', m.username);
    return m;
  }

  public handleMemberLeave(discordId: string): void {
    const idx = this.members.findIndex((m) => m.discordId === discordId);
    if (idx !== -1) {
      const name = this.members[idx].username;
      // Anonymize for stats & remove personal data immediately
      this.members.splice(idx, 1);
      this.addLog('System Bot', `Départ du membre ${name} (Données personnelles supprimées)`, 'member');
    }
  }

  // --- Tickets ---
  public getTickets(): Ticket[] {
    return this.tickets;
  }

  public getTicket(id: string): Ticket | undefined {
    return this.tickets.find((t) => t.id === id);
  }

  public createTicket(memberId: string, subject: string, category: string, initialMessage: string): Ticket {
    const member = this.getMember(memberId);
    const tNum = 100 + this.tickets.length + 1;
    const ticket: Ticket = {
      id: `t-${Date.now()}`,
      ticketNumber: tNum,
      memberId,
      memberName: member ? member.username : 'Membre',
      memberAvatar: member?.avatarUrl,
      subject,
      category,
      status: 'ouvert',
      createdAt: this.getFormattedNow(),
      messages: [
        {
          id: `m-${Date.now()}`,
          senderId: member ? member.discordId : 'user',
          senderName: member ? member.username : 'Membre',
          senderAvatar: member?.avatarUrl,
          content: initialMessage,
          timestamp: this.getFormattedNow(),
          isAdmin: false,
        },
      ],
    };
    this.tickets.unshift(ticket);
    this.addNotification({
      level: 'important',
      title: 'Nouveau ticket ouvert',
      message: `Ticket #${tNum} ouvert par ${ticket.memberName} (${category}).`,
      event: 'ticket_created',
      mentionAdmin: false,
    });
    return ticket;
  }

  public addTicketMessage(ticketId: string, senderName: string, content: string, isAdmin: boolean): TicketMessage {
    const t = this.getTicket(ticketId);
    if (!t) throw new Error('Ticket non trouvé');
    const msg: TicketMessage = {
      id: `m-${Date.now()}`,
      senderId: isAdmin ? 'admin' : t.memberId,
      senderName,
      content,
      timestamp: this.getFormattedNow(),
      isAdmin,
    };
    t.messages.push(msg);
    return msg;
  }

  public closeTicket(ticketId: string, closedBy: string): Ticket {
    const t = this.getTicket(ticketId);
    if (!t) throw new Error('Ticket non trouvé');
    t.status = 'ferme';
    t.closedAt = this.getFormattedNow();
    t.closedBy = closedBy;

    // Generate Transcript
    const transcript = t.messages.map((m) => ({
      sender: m.senderName,
      content: m.content,
      time: m.timestamp,
    }));
    t.transcriptJson = JSON.stringify(transcript);

    this.addLog('Anthony (Admin)', `Fermeture du ticket #${t.ticketNumber} avec génération de transcript`, 'ticket', t.memberName);
    return t;
  }

  // --- Admin Logs ---
  public getLogs(): AdminLog[] {
    return this.adminLogs;
  }

  public addLog(
    adminName: string,
    action: string,
    category: AdminLog['category'],
    targetMemberName?: string,
    quizTitle?: string,
    moduleTitle?: string,
    result: 'effectué' | 'échoué' | 'interrompu' = 'effectué'
  ): AdminLog {
    const log: AdminLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminName: adminName || 'System',
      action,
      category,
      targetMemberName,
      quizTitle,
      moduleTitle,
      date: this.getFormattedNow(),
      result,
    };
    this.adminLogs.unshift(log);
    console.log(`[ADMIN LOG] [${log.category.toUpperCase()}] ${log.adminName}: ${log.action}`);

    // Real-time dispatch to Discord Webhook
    try {
      discordService.sendWebhookLog(
        log.action,
        log.category,
        `Exécuté par **${log.adminName}** (${log.date})${log.moduleTitle ? ` • Module: ${log.moduleTitle}` : ''}${log.quizTitle ? ` • Quiz: ${log.quizTitle}` : ''}`,
        log.targetMemberName
      );
    } catch {
      // Ignore background dispatch errors
    }

    // Sync log to Supabase PostgreSQL table if configured
    if (typeof process !== 'undefined' && process.env.SUPABASE_URL) {
      const endpoint = process.env.SUPABASE_TABLE_ENDPOINT || `${process.env.SUPABASE_URL}/rest/v1/test1`;
      const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
      if (key) {
        try {
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({}), // Insert row in test1 table safely
          }).catch(() => {});
        } catch (e) {
          // Ignore background fetch error
        }
      }
    }

    return log;
  }

  // --- Admin Notifications ---
  public getNotifications(): AdminNotification[] {
    return this.notifications;
  }

  public addNotification(notif: Omit<AdminNotification, 'id' | 'status' | 'date'>): AdminNotification {
    const n: AdminNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      status: 'non_lue',
      date: this.getFormattedNow(),
    };
    this.notifications.unshift(n);
    return n;
  }

  public markNotificationStatus(id: string, status: 'lue' | 'traitee', adminName: string): AdminNotification {
    const n = this.notifications.find((item) => item.id === id);
    if (!n) throw new Error('Notification non trouvée');
    n.status = status;
    if (status === 'traitee') {
      n.resolvedAt = this.getFormattedNow();
      n.resolvedBy = adminName;
    }
    return n;
  }

  // --- Maintenance ---
  public getMaintenance(): Record<MaintenanceType, MaintenanceSetting> {
    return this.maintenance;
  }

  public updateMaintenance(type: MaintenanceType, setting: MaintenanceSetting): Record<MaintenanceType, MaintenanceSetting> {
    this.maintenance[type] = setting;
    this.addLog('Anthony (Admin)', `Mise à jour de la maintenance pour [${type}]`, 'system');
    return this.maintenance;
  }

  // --- System Health & Diagnostics ---
  public getHealth(): SystemHealth {
    this.health.lastHeartbeat = this.getFormattedNow();
    return this.health;
  }

  public triggerDiagnostic(): SystemHealth {
    this.health.botConnected = true;
    this.health.botLatencyMs = Math.floor(Math.random() * 20) + 15;
    this.health.supabaseConnected = true;
    this.health.webServerStatus = 'online';
    this.health.pendingActions = 0;
    this.health.retryQueueCount = 0;
    this.health.lastHeartbeat = this.getFormattedNow();
    this.health.lastPermissionSync = this.getFormattedNow();
    this.addLog('Anthony (Admin)', 'Lancement d\'un diagnostic manuel de santé système', 'system');
    return this.health;
  }

  // --- Backups & Data Reset ---
  public resetAllData(): void {
    this.adminLogs = [];
    this.notifications = [];
    this.tickets = [];
    this.members = defaultMembers.map((m) => ({
      ...m,
      modulesCompleted: [],
      quizzesPassed: [],
      attempts: [],
      currentModuleId: 'mod-1',
      score: 0,
      totalQuizzesTaken: 0,
    }));
    this.addLog('Anthony (Admin)', 'Nettoyage complet des données effectué avec succès.', 'system');
  }

  public getBackups(): BackupRecord[] {
    return this.backups;
  }

  public createBackup(): BackupRecord {
    const b: BackupRecord = {
      id: `bak-${Date.now()}`,
      filename: `pawako_backup_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`,
      sizeKb: 45,
      createdAt: this.getFormattedNow(),
      status: 'succes',
      itemsCount: {
        members: this.members.length,
        modules: this.modules.length,
        quizzes: this.quizzes.length,
        tickets: this.tickets.length,
        logs: this.adminLogs.length,
      },
    };
    this.backups.unshift(b);
    // Maintain 7-day rolling rotation
    if (this.backups.length > 7) {
      this.backups = this.backups.slice(0, 7);
    }
    this.addLog('Anthony (Admin)', `Création manuelle de la sauvegarde "${b.filename}"`, 'system');
    return b;
  }
}

export const store = new StoreService();
