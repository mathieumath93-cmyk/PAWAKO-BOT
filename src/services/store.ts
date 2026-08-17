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
  SystemHealth,
  Ticket,
  TicketMessage,
  TrainingModule,
  UsefulLink,
  UserSession,
} from '../types';

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
    minScore: 80,
    maxAttempts: 3,
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
    minScore: 80,
    maxAttempts: 3,
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
    minScore: 75,
    maxAttempts: 3,
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
    minScore: 80,
    maxAttempts: 3,
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
    minScore: 80,
    maxAttempts: 2,
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
    id: 'mem-1',
    discordId: '123456789012345678',
    username: 'Anthony (Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    roles: ['Admin', 'Module 1 Validé', 'Module 2 Validé', 'Module 3 En cours'],
    joinedAt: '10/08/2026 09:15',
    currentModuleId: 'mod-3',
    progress: {
      'mod-1': { moduleId: 'mod-1', status: 'valide', validatedAt: '10/08/2026 10:00', quizPassed: true, score: 100, attemptsCount: 1 },
      'mod-2': { moduleId: 'mod-2', status: 'valide', validatedAt: '12/08/2026 14:20', quizPassed: true, score: 100, attemptsCount: 1 },
      'mod-3': { moduleId: 'mod-3', status: 'en_cours', attemptsCount: 0 },
      'mod-4': { moduleId: 'mod-4', status: 'verrouille', attemptsCount: 0 },
      'mod-5': { moduleId: 'mod-5', status: 'verrouille', attemptsCount: 0 },
    },
    extraAttemptsGranted: {},
    isActive: true,
    lastActiveAt: '17/08/2026 14:10',
  },
  {
    id: 'mem-2',
    discordId: '987654321098765432',
    username: 'Sophie_Dev',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    roles: ['Module 1 Validé', 'Module 2 Validé', 'Module 3 Validé', 'Module 4 En cours'],
    joinedAt: '05/08/2026 11:30',
    currentModuleId: 'mod-4',
    progress: {
      'mod-1': { moduleId: 'mod-1', status: 'valide', validatedAt: '05/08/2026 12:00', quizPassed: true, score: 100, attemptsCount: 1 },
      'mod-2': { moduleId: 'mod-2', status: 'valide', validatedAt: '06/08/2026 09:45', quizPassed: true, score: 100, attemptsCount: 1 },
      'mod-3': { moduleId: 'mod-3', status: 'valide', validatedAt: '08/08/2026 16:15', quizPassed: true, score: 100, attemptsCount: 1 },
      'mod-4': { moduleId: 'mod-4', status: 'en_cours', attemptsCount: 1 },
      'mod-5': { moduleId: 'mod-5', status: 'verrouille', attemptsCount: 0 },
    },
    extraAttemptsGranted: {},
    isActive: true,
    lastActiveAt: '17/08/2026 13:50',
  },
  {
    id: 'mem-3',
    discordId: '555444333222111000',
    username: 'Lucas_Newbie',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    roles: ['Nouveau membre', 'Module 1 En cours'],
    joinedAt: '16/08/2026 18:00',
    currentModuleId: 'mod-1',
    progress: {
      'mod-1': { moduleId: 'mod-1', status: 'en_cours', attemptsCount: 1 },
      'mod-2': { moduleId: 'mod-2', status: 'verrouille', attemptsCount: 0 },
      'mod-3': { moduleId: 'mod-3', status: 'verrouille', attemptsCount: 0 },
      'mod-4': { moduleId: 'mod-4', status: 'verrouille', attemptsCount: 0 },
      'mod-5': { moduleId: 'mod-5', status: 'verrouille', attemptsCount: 0 },
    },
    extraAttemptsGranted: {},
    isActive: true,
    lastActiveAt: '17/08/2026 11:00',
  },
];

const defaultUsefulLinks: UsefulLink[] = [
  { id: 'link-1', name: 'Documentation PAWAKO', url: 'https://pawako.io/docs', icon: 'BookOpen', order: 1, isActive: true },
  { id: 'link-2', name: 'Portail des Ressources', url: 'https://pawako.io/resources', icon: 'Folder', order: 2, isActive: true },
  { id: 'link-3', name: 'Assistance & Support', url: 'https://pawako.io/support', icon: 'LifeBuoy', order: 3, isActive: true },
];

const defaultTickets: Ticket[] = [
  {
    id: 't-1',
    ticketNumber: 101,
    memberId: 'mem-3',
    memberName: 'Lucas_Newbie',
    memberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    subject: 'Question sur l\'accès au salon #module-1',
    category: 'Accès / Rôles',
    status: 'ferme',
    createdAt: '16/08/2026 18:15',
    closedAt: '16/08/2026 18:30',
    closedBy: 'Anthony (Admin)',
    messages: [
      { id: 'm-1', senderId: '555444333222111000', senderName: 'Lucas_Newbie', content: 'Bonjour, je ne vois pas les ressources du module 1.', timestamp: '16/08/2026 18:15', isAdmin: false },
      { id: 'm-2', senderId: '123456789012345678', senderName: 'Anthony (Admin)', content: 'Bonjour Lucas ! As-tu cliqué sur "Commencer la formation" dans #🤖-jarvis ?', timestamp: '16/08/2026 18:22', isAdmin: true },
      { id: 'm-3', senderId: '555444333222111000', senderName: 'Lucas_Newbie', content: 'C\'est fait ! Merci beaucoup, je vois le salon maintenant.', timestamp: '16/08/2026 18:28', isAdmin: false },
    ],
    transcriptJson: JSON.stringify([
      { sender: 'Lucas_Newbie', content: 'Bonjour, je ne vois pas les ressources du module 1.', time: '16/08/2026 18:15' },
      { sender: 'Anthony (Admin)', content: 'Bonjour Lucas ! As-tu cliqué sur "Commencer la formation" dans #🤖-jarvis ?', time: '16/08/2026 18:22' },
      { sender: 'Lucas_Newbie', content: 'C\'est fait ! Merci beaucoup, je vois le salon maintenant.', time: '16/08/2026 18:28' }
    ]),
  },
  {
    id: 't-2',
    ticketNumber: 102,
    memberId: 'mem-2',
    memberName: 'Sophie_Dev',
    memberAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    subject: 'Demande de tentative supplémentaire pour le Quiz 4',
    category: 'Quiz & Tentatives',
    status: 'ouvert',
    createdAt: '17/08/2026 12:40',
    messages: [
      { id: 'm-4', senderId: '987654321098765432', senderName: 'Sophie_Dev', content: 'Bonjour, j\'ai eu un souci réseau lors de mon premier essai du Quiz 4. Est-il possible d\'obtenir une tentative extra ?', timestamp: '17/08/2026 12:40', isAdmin: false },
    ],
  },
];

const defaultAdminLogs: AdminLog[] = [
  {
    id: 'log-1',
    adminName: 'Anthony (Admin)',
    action: 'Validation manuelle du Module 2',
    category: 'module',
    targetMemberName: 'Sophie_Dev',
    moduleTitle: 'Module 2 : Outils & Processus Internes',
    date: '12/08/2026 14:20',
    result: 'effectué',
  },
  {
    id: 'log-2',
    adminName: 'Anthony (Admin)',
    action: 'Fermeture de ticket #101 avec transcript',
    category: 'ticket',
    targetMemberName: 'Lucas_Newbie',
    date: '16/08/2026 18:30',
    result: 'effectué',
  },
  {
    id: 'log-3',
    adminName: 'System Bot',
    action: 'Attribution automatique rôle Module 1 Validé',
    category: 'role',
    targetMemberName: 'Sophie_Dev',
    date: '05/08/2026 12:00',
    result: 'effectué',
  },
];

const defaultNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    level: 'information',
    title: 'Nouveau membre rejoint',
    message: 'Lucas_Newbie a rejoint le serveur Discord et s\'est vu attribuer le rôle Nouveau membre.',
    event: 'member_join',
    status: 'lue',
    date: '16/08/2026 18:00',
    mentionAdmin: false,
  },
  {
    id: 'notif-2',
    level: 'important',
    title: 'Nouveau ticket ouvert',
    message: 'Ticket #102 créé par Sophie_Dev (Sujet : Demande de tentative supplémentaire).',
    event: 'ticket_created',
    status: 'non_lue',
    date: '17/08/2026 12:40',
    mentionAdmin: false,
  },
  {
    id: 'notif-3',
    level: 'critique',
    title: 'Rétablissement de connexion Gateway Discord',
    message: 'Le bot Discord s\'est reconnecté au serveur avec un délai d\'attente de 1.2s.',
    event: 'bot_reconnect',
    status: 'non_lue',
    date: '17/08/2026 13:00',
    mentionAdmin: true,
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

  private maintenance: Record<MaintenanceType, MaintenanceSetting> = {
    quiz: { enabled: false, mode: 'standard' },
    attempts: { enabled: false, mode: 'standard' },
    progress: { enabled: false, mode: 'standard' },
    tickets: { enabled: false, mode: 'standard' },
    onboarding: { enabled: false, mode: 'standard' },
  };

  private currentSession: UserSession = {
    discordId: '123456789012345678',
    username: 'Anthony (Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isAdmin: true,
    roleName: 'Admin',
    loginAt: '17/08/2026 14:00',
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
      prog.status = 'valide';
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
    } else {
      member.progress[quiz.moduleId] = prog;
      this.addLog('System Bot', `Échec au quiz ${quiz.title} pour ${member.username} (Score: ${score}%)`, 'quiz', member.username, quiz.title);
    }

    member.lastActiveAt = this.getFormattedNow();
    return { passed, score, attempt };
  }

  // --- Members ---
  public getMembers(): Member[] {
    return this.members;
  }

  public getMember(id: string): Member | undefined {
    return this.members.find((m) => m.id === id || m.discordId === id);
  }

  public updateMemberRoles(memberId: string, roles: string[]): Member {
    const m = this.getMember(memberId);
    if (!m) throw new Error('Membre non trouvé');
    m.roles = roles;
    this.addLog('Anthony (Admin)', `Mise à jour des rôles Discord de ${m.username}`, 'role', m.username);
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
    this.addLog('Anthony (Admin)', `Réinitialisation de la progression de ${m.username}`, 'member', m.username, undefined, undefined, 'effectué');
    return m;
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

  // --- Backups ---
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
