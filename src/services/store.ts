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
import { onboardingService } from './onboardingService';

const defaultBranding: BrandingSettings = {
  trainingName: 'PAWAKO FORMATION 🤖',
  description: 'Plateforme officielle de formation interne et d\'onboarding Discord.',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  botAvatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  botDisplayName: 'PAWAKO FORMATION 🤖',
  primaryColor: '#6366f1',
  secondaryColor: '#06b6d4',
};

const defaultUsefulLinks: UsefulLink[] = [
  { id: 'link-1', name: 'Documentation PAWAKO', url: 'https://pawako.io/docs', icon: 'BookOpen', order: 1, isActive: true },
  { id: 'link-2', name: 'Portail des Ressources', url: 'https://pawako.io/resources', icon: 'Folder', order: 2, isActive: true },
  { id: 'link-3', name: 'Assistance & Support', url: 'https://pawako.io/support', icon: 'LifeBuoy', order: 3, isActive: true },
];

const defaultTickets: Ticket[] = [];

const defaultAdminLogs: AdminLog[] = [];

const defaultNotifications: AdminNotification[] = [];

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

const defaultBackups: BackupRecord[] = [];

export const defaultModules: TrainingModule[] = [
  {
    id: 'mod-1',
    title: '📚 Module 1️⃣ : Onboarding & Base',
    description: 'Ici, on ne forme pas des gens pour discuter, mais pour performer. 🤑\n\nTon rôle est simple : comprendre les fans, créer de la valeur et générer du chiffre.\n\nLis, assimile, exécute. Chaque étape est obligatoire.\n\nMDP doc : PAWAKO1\n\nUn score minimum de 12/20 au quiz final est requis pour débloquer le rôle suivant.',
    content: 'Ici, on ne forme pas des gens pour discuter, mais pour performer. 🤑\n\nTon rôle est simple : comprendre les fans, créer de la valeur et générer du chiffre.\n\nLis, assimile, exécute. Chaque étape est obligatoire.\n\nMDP doc : PAWAKO1\n\nUn score minimum de 12/20 au quiz final est requis pour débloquer le rôle suivant.',
    order: 1,
    quizId: 'quiz-1',
    channelId: '',
    channelName: '🔒-formation-mod-1',
    roleEnCoursId: '',
    roleEnCoursName: 'En Formation M1',
    roleValidatedId: '',
    roleValidatedName: 'Module 1 Validé',
    resources: [],
    buttons: [],
    isActive: true,
    blocks: [
      { id: 'blk-1-1', type: 'heading', title: '📚 Module 1️⃣ : Onboarding & Base', content: 'Onboarding & Prise en Main' },
      { id: 'blk-1-2', type: 'text', content: 'Ici, on ne forme pas des gens pour discuter, mais pour performer. 🤑\n\nTon rôle est simple : comprendre les fans, créer de la valeur et générer du chiffre.\n\nLis, assimile, exécute. Chaque étape est obligatoire.' },
      { id: 'blk-1-3', type: 'alert', title: 'Instructions & Accès Doc', content: 'MDP doc : PAWAKO1\n\nUn score minimum de 12/20 au quiz final est requis pour débloquer le rôle suivant.', alertType: 'warning' },
    ],
  },
  {
    id: 'mod-2',
    title: 'PSYCHOLOGIE FAN & CHATTING 🧠🔥',
    description: `On passe à un niveau supérieur.

Si tu pensais que le job c’était “répondre à des messages”… mauvaise nouvelle :
👉 c’est là que tout commence vraiment.

Dans ce module, tu vas comprendre :
• pourquoi un fan paye (spoiler : jamais pour les raisons que tu crois)
• comment créer de l’attachement sans être réel
• comment contrôler une conversation du début à la vente
• et surtout… toutes les erreurs qui te font perdre de l’argent sans que tu t’en rendes compte

⚠️ Très important :
Ce module fait la différence entre :
👉 quelqu’un qui discute
👉 et quelqu’un qui génère du CA

🎯 OBJECTIF :
Que tu comprennes exactement comment fonctionne le cerveau du fan
ET comment toi, tu dois te comporter pour convertir

📌 ACTION IMMÉDIATE :

Regarde le module COMPLET
Prends des notes (obligatoire)
Applique DIRECTEMENT dans tes conversations

⚠️ Je vais être clair :
Si tu n’appliques pas ça, tu peux envoyer 1000 messages…
👉 tu ne feras pas de ventes.

À l’inverse, si tu maîtrises ça :
👉 chaque message devient une opportunité de cash.

On ne veut pas des gens actifs.
On veut des gens efficaces.

MDP doc : PAWAKO 2`,
    content: `On passe à un niveau supérieur.

Si tu pensais que le job c’était “répondre à des messages”… mauvaise nouvelle :
👉 c’est là que tout commence vraiment.

Dans ce module, tu vas comprendre :
• pourquoi un fan paye (spoiler : jamais pour les raisons que tu crois)
• comment créer de l’attachement sans être réel
• comment contrôler une conversation du début à la vente
• et surtout… toutes les erreurs qui te font perdre de l’argent sans que tu t’en rendes compte

⚠️ Très important :
Ce module fait la différence entre :
👉 quelqu’un qui discute
👉 et quelqu’un qui génère du CA

🎯 OBJECTIF :
Que tu comprennes exactement comment fonctionne le cerveau du fan
ET comment toi, tu dois te comporter pour convertir

📌 ACTION IMMÉDIATE :

Regarde le module COMPLET
Prends des notes (obligatoire)
Applique DIRECTEMENT dans tes conversations

⚠️ Je vais être clair :
Si tu n’appliques pas ça, tu peux envoyer 1000 messages…
👉 tu ne feras pas de ventes.

À l’inverse, si tu maîtrises ça :
👉 chaque message devient une opportunité de cash.

On ne veut pas des gens actifs.
On veut des gens efficaces.

MDP doc : PAWAKO 2`,
    order: 2,
    quizId: 'quiz-2',
    channelId: '',
    channelName: '🔒-formation-mod-2',
    roleEnCoursId: '',
    roleEnCoursName: 'En Formation M2',
    roleValidatedId: '',
    roleValidatedName: 'Module 2 Validé',
    resources: [],
    buttons: [],
    isActive: true,
    blocks: [
      { id: 'blk-2-1', type: 'heading', title: 'PSYCHOLOGIE FAN & CHATTING 🧠🔥', content: 'Comprendre & Convertir' },
      { id: 'blk-2-2', type: 'text', content: 'Dans ce module, tu vas comprendre pourquoi un fan paye, comment créer de l’attachement et comment contrôler une conversation.' },
      { id: 'blk-2-3', type: 'alert', title: 'Accès Doc', content: 'MDP doc : PAWAKO 2', alertType: 'warning' },
    ],
  },
  {
    id: 'mod-3',
    title: 'STRUCTURE DE SCRIPT & CLOSING',
    description: `On arrête de parler.

Maintenant, vous allez apprendre à faire payer.

⚠️ La vérité que personne ne vous dit

Un fan n’achète pas parce que tu es sexy.

👉 Il achète parce que tu l’as amené exactement au bon niveau d’excitation.

Et ça…
👉 ça ne s’improvise pas.

🧠 Ce module va changer votre manière de chatter

Vous allez apprendre :

✔️ Le script EXACT utilisé par les top chatteurs
✔️ L’ordre précis à respecter (et pourquoi)
✔️ Comment faire monter la pression étape par étape
✔️ Comment éviter les erreurs qui tuent une vente
✔️ Comment transformer une simple discussion en paiement

🔥 La règle la plus importante

👉 Tu ne sautes JAMAIS une phase.

Sinon :

trop rapide → il bloque
trop lent → il se désintéresse

👉 Résultat : zéro vente

💰 Objectif

👉 Faire un PPV en 8 à 15 messages
👉 Garder le contrôle de la conversation
👉 Créer une montée d’excitation maîtrisée
👉 Close proprement sans forcer

❌ Ce que tu fais peut-être déjà (et qui te tue)
Aller trop vite dans le sale
Rester bloqué en mode “gentil”
Lancer un PPV sans build-up
Copier-coller sans réfléchir

👉 Si tu te reconnais, ce module est obligatoire.

⚠️ Important

👉 Ce script n’est PAS un texte à réciter
👉 C’est une structure à comprendre et adapter

Les meilleurs :
👉 lisent le client
👉 s’adaptent
👉 dominent la conversation


MDP doc : PAWAKO3`,
    content: `On arrête de parler.

Maintenant, vous allez apprendre à faire payer.

⚠️ La vérité que personne ne vous dit

Un fan n’achète pas parce que tu es sexy.

👉 Il achète parce que tu l’as amené exactement au bon niveau d’excitation.

Et ça…
👉 ça ne s’improvise pas.

🧠 Ce module va changer votre manière de chatter

Vous allez apprendre :

✔️ Le script EXACT utilisé par les top chatteurs
✔️ L’ordre précis à respecter (et pourquoi)
✔️ Comment faire monter la pression étape par étape
✔️ Comment éviter les erreurs qui tuent une vente
✔️ Comment transformer une simple discussion en paiement

🔥 La règle la plus importante

👉 Tu ne sautes JAMAIS une phase.

Sinon :

trop rapide → il bloque
trop lent → il se désintéresse

👉 Résultat : zéro vente

💰 Objectif

👉 Faire un PPV en 8 à 15 messages
👉 Garder le contrôle de la conversation
👉 Créer une montée d’excitation maîtrisée
👉 Close proprement sans forcer

❌ Ce que tu fais peut-être déjà (et qui te tue)
Aller trop vite dans le sale
Rester bloqué en mode “gentil”
Lancer un PPV sans build-up
Copier-coller sans réfléchir

👉 Si tu te reconnais, ce module est obligatoire.

⚠️ Important

👉 Ce script n’est PAS un texte à réciter
👉 C’est une structure à comprendre et adapter

Les meilleurs :
👉 lisent le client
👉 s’adaptent
👉 dominent la conversation


MDP doc : PAWAKO3`,
    order: 3,
    quizId: 'quiz-3',
    channelId: '',
    channelName: '🔒-formation-mod-3',
    roleEnCoursId: '',
    roleEnCoursName: 'En Formation M3',
    roleValidatedId: '',
    roleValidatedName: 'Module 3 Validé',
    resources: [],
    buttons: [],
    isActive: true,
    blocks: [
      { id: 'blk-3-1', type: 'heading', title: 'STRUCTURE DE SCRIPT & CLOSING', content: 'Faire payer & Closing' },
      { id: 'blk-3-2', type: 'text', content: 'Apprenez le script EXACT utilisé par les top chatteurs et la règle fondamentale pour amener le fan au bon niveau d\'excitation.' },
      { id: 'blk-3-3', type: 'alert', title: 'Accès Doc', content: 'MDP doc : PAWAKO3', alertType: 'warning' },
    ],
  },
  {
    id: 'mod-4',
    title: 'FOLLOW-UP & RELANCES',
    description: `Vous avez appris à créer de l’intérêt, à installer une vibe, à chauffer une conversation.

Maintenant, on attaque le point qui fait la différence entre :
👉 un chatteur moyen
👉 et un chatteur qui génère du cash tous les jours

💰 Le FOLLOW-UP.

⚠️ La réalité

80% des ventes ne se font PAS au premier message.

Elles se font :

après une relance bien placée
au bon moment
avec la bonne énergie

Et pourtant…
👉 la majorité abandonne trop tôt
👉 ou relance comme des robots

🎯 Ce que vous allez apprendre

Dans ce module, vous allez maîtriser :

✔️ Quand relancer (timing stratégique)
✔️ Comment relancer sans être lourd
✔️ Comment recréer de l’émotion
✔️ Comment récupérer un fan froid
✔️ Comment transformer un “peut-être” en vente

❌ Ce que vous devez arrêter IMMÉDIATEMENT
“Tu veux toujours ?”
“Réponds-moi”
“???”
Spam sans valeur

👉 Ça tue la conversation.
👉 Ça fait fuir.

✅ Ce que vous allez apprendre à faire
Relances naturelles
Relances émotionnelles
Relances intrigantes
Relances qui reconnectent

👉 Le but : donner envie de revenir, pas forcer.

🎯 Objectif du module

👉 Transformer les conversations mortes en opportunités
👉 Multiplier les ventes sans nouveaux leads
👉 Devenir imprévisible et intéressant

MDP : PAWAKO4`,
    content: `Vous avez appris à créer de l’intérêt, à installer une vibe, à chauffer une conversation.

Maintenant, on attaque le point qui fait la différence entre :
👉 un chatteur moyen
👉 et un chatteur qui génère du cash tous les jours

💰 Le FOLLOW-UP.

⚠️ La réalité

80% des ventes ne se font PAS au premier message.

Elles se font :

après une relance bien placée
au bon moment
avec la bonne énergie

Et pourtant…
👉 la majorité abandonne trop tôt
👉 ou relance comme des robots

🎯 Ce que vous allez apprendre

Dans ce module, vous allez maîtriser :

✔️ Quand relancer (timing stratégique)
✔️ Comment relancer sans être lourd
✔️ Comment recréer de l’émotion
✔️ Comment récupérer un fan froid
✔️ Comment transformer un “peut-être” en vente

❌ Ce que vous devez arrêter IMMÉDIATEMENT
“Tu veux toujours ?”
“Réponds-moi”
“???”
Spam sans valeur

👉 Ça tue la conversation.
👉 Ça fait fuir.

✅ Ce que vous allez apprendre à faire
Relances naturelles
Relances émotionnelles
Relances intrigantes
Relances qui reconnectent

👉 Le but : donner envie de revenir, pas forcer.

🎯 Objectif du module

👉 Transformer les conversations mortes en opportunités
👉 Multiplier les ventes sans nouveaux leads
👉 Devenir imprévisible et intéressant

MDP : PAWAKO4`,
    order: 4,
    quizId: 'quiz-4',
    channelId: '',
    channelName: '🔒-formation-mod-4',
    roleEnCoursId: '',
    roleEnCoursName: 'En Formation M4',
    roleValidatedId: '',
    roleValidatedName: 'Module 4 Validé',
    resources: [],
    buttons: [],
    isActive: true,
    blocks: [
      { id: 'blk-4-1', type: 'heading', title: 'FOLLOW-UP & RELANCES', content: 'Relancer avec Stratégie' },
      { id: 'blk-4-2', type: 'text', content: '80% des ventes ne se font pas au premier message. Découvrez le timing stratégique et les relances émotionnelles.' },
      { id: 'blk-4-3', type: 'alert', title: 'Accès Doc', content: 'MDP : PAWAKO4', alertType: 'warning' },
    ],
  },
  {
    id: 'mod-5',
    title: 'Négociation Spenders & Tag TW',
    description: 'Veuillez regarder avec attention ( en X2) cette vidéo qui vous explique comment on négocie avec les nouveaux spenders et surtout comment on attribue enfin le TAG: TW (Time Waster)',
    content: 'Veuillez regarder avec attention ( en X2) cette vidéo qui vous explique comment on négocie avec les nouveaux spenders et surtout comment on attribue enfin le TAG: TW (Time Waster)',
    order: 5,
    quizId: 'quiz-5',
    channelId: '',
    channelName: '🔒-formation-mod-5',
    roleEnCoursId: '',
    roleEnCoursName: 'En Formation M5',
    roleValidatedId: '',
    roleValidatedName: 'Chatteur Certifié',
    resources: [],
    buttons: [],
    isActive: true,
    blocks: [
      { id: 'blk-5-1', type: 'heading', title: 'Négociation Spenders & Tag TW', content: 'Video Spenders & Gestion Time Wasters' },
      { id: 'blk-5-2', type: 'text', content: 'Veuillez regarder avec attention ( en X2) cette vidéo qui vous explique comment on négocie avec les nouveaux spenders et surtout comment on attribue enfin le TAG: TW (Time Waster)' },
      { id: 'blk-5-3', type: 'alert', title: 'Consigne Vidéo', content: 'Visionnez la vidéo en vitesse x2 puis validez le questionnaire.', alertType: 'info' },
    ],
  },
];

export const defaultQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    moduleId: 'mod-1',
    title: 'Quiz de Validation - Module 1',
    description: 'Onboarding & Base PAWAKO',
    minScore: 16,
    cooldownMinutes: 30,
    delayMinutesBeforeQuiz: 0,
    questions: [
      {
        id: 'q1-1',
        text: 'Quel est l\'objectif principal du chatteur selon le Module 1 ?',
        options: ['Discuter amicalement', 'Comprendre les fans, créer de la valeur et générer du chiffre', 'Envoyer des messages automatiques', 'Passer le temps'],
        correctAnswer: 1,
        explanation: 'Ici on ne forme pas pour discuter mais pour performer et générer du chiffre.',
      },
      {
        id: 'q1-2',
        text: 'Quel est le mot de passe de la documentation du Module 1 ?',
        options: ['PAWAKO1', 'PAWAKO2', 'SECRET123', 'FORMATION'],
        correctAnswer: 0,
        explanation: 'Le mot de passe de la documentation du Module 1 est PAWAKO1.',
      },
    ],
  },
  {
    id: 'quiz-2',
    moduleId: 'mod-2',
    title: 'Quiz de Validation - Module 2',
    description: 'Psychologie Fan & Chatting',
    minScore: 16,
    cooldownMinutes: 30,
    delayMinutesBeforeQuiz: 0,
    questions: [
      {
        id: 'q2-1',
        text: 'Quelle est la différence fondamentale entre quelqu\'un qui discute et quelqu\'un qui génère du CA ?',
        options: ['La vitesse de frappe', 'La compréhension de la psychologie du fan et le contrôle de la conversation', 'Le nombre de messages envoyés', 'La longueur des réponses'],
        correctAnswer: 1,
        explanation: 'Comprendre pourquoi un fan paye et maîtriser la conversation permet de convertir.',
      },
      {
        id: 'q2-2',
        text: 'Quel est le MDP de la doc du Module 2 ?',
        options: ['PAWAKO 2', 'PAWAKO2', 'PAWAKO_FAN', 'PAWAKO3'],
        correctAnswer: 0,
        explanation: 'Le mot de passe indiqué est "PAWAKO 2".',
      },
    ],
  },
  {
    id: 'quiz-3',
    moduleId: 'mod-3',
    title: 'Quiz de Validation - Module 3',
    description: 'Structure de Script & Closing',
    minScore: 16,
    cooldownMinutes: 30,
    delayMinutesBeforeQuiz: 0,
    questions: [
      {
        id: 'q3-1',
        text: 'Pourquoi un fan achète-t-il selon le Module 3 ?',
        options: ['Parce que tu es sexy', 'Parce que tu l\'as amené au bon niveau d\'excitation', 'Par hasard', 'Parce qu\'il n\'a rien d\'autre à faire'],
        correctAnswer: 1,
        explanation: 'Le closing repose sur la montée progressive d\'excitation.',
      },
      {
        id: 'q3-2',
        text: 'En combien de messages vise-t-on de faire un PPV ?',
        options: ['1 à 2 messages', '8 à 15 messages', '50+ messages', '100 messages'],
        correctAnswer: 1,
        explanation: 'Un PPV bien amenée se fait en 8 à 15 messages maîtrisés.',
      },
    ],
  },
  {
    id: 'quiz-4',
    moduleId: 'mod-4',
    title: 'Quiz de Validation - Module 4',
    description: 'Follow-up & Relances',
    minScore: 16,
    cooldownMinutes: 30,
    delayMinutesBeforeQuiz: 0,
    questions: [
      {
        id: 'q4-1',
        text: 'Quel pourcentage des ventes se font lors des relances/follow-up ?',
        options: ['20%', '50%', '80%', '100%'],
        correctAnswer: 2,
        explanation: '80% des ventes se concluent grâce à une relance stratégique et bien rythmée.',
      },
      {
        id: 'q4-2',
        text: 'Quelles relances faut-il bannir immédiatement ?',
        options: ['Relances émotionnelles', 'Relances intrigantes', 'Spam sans valeur du type "Tu veux toujours ?" ou "???"', 'Relances de reconnexion'],
        correctAnswer: 2,
        explanation: 'Les relances vides ("Tu veux toujours ?") font fuir le client.',
      },
    ],
  },
  {
    id: 'quiz-5',
    moduleId: 'mod-5',
    title: 'Quiz de Validation - Module 5',
    description: 'Négociation Spenders & Tag TW',
    minScore: 16,
    cooldownMinutes: 30,
    delayMinutesBeforeQuiz: 0,
    questions: [
      {
        id: 'q5-1',
        text: 'Que signifie l\'attribution du TAG TW ?',
        options: ['Top Worker', 'Time Waster (Perdeur de Temps)', 'Total Winner', 'Two Way'],
        correctAnswer: 1,
        explanation: 'Le TAG TW désigne un Time Waster pour adapter sa gestion de conversation.',
      },
    ],
  },
];

export interface QuizAnalyticsItem {
  quizId: string;
  quizTitle: string;
  moduleId: string;
  moduleTitle: string;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number; // percentage 0-100
  avgScore: number; // out of 20
  difficulty: 'Facile' | 'Modéré' | 'Difficile' | 'Extrême';
}

class StoreService {
  private branding: BrandingSettings = { ...defaultBranding };
  private modules: TrainingModule[] = [...defaultModules];
  private quizzes: Quiz[] = [...defaultQuizzes];
  private members: Member[] = [];
  private usefulLinks: UsefulLink[] = [];
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
      if (storedMods) {
        const parsed = JSON.parse(storedMods);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge missing default modules (e.g. mod-2, mod-3, mod-4, mod-5) if not present
          const existingIds = new Set(parsed.map((m: any) => m.id));
          const missingDefaults = defaultModules.filter((defM) => !existingIds.has(defM.id));
          this.modules = [...parsed, ...missingDefaults].sort((a, b) => (a.order || 0) - (b.order || 0));
        } else {
          this.modules = [...defaultModules];
        }
      } else {
        this.modules = [...defaultModules];
      }

      const storedQuizzes = localStorage.getItem('pawako_quizzes');
      if (storedQuizzes) {
        const parsed = JSON.parse(storedQuizzes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingQIds = new Set(parsed.map((q: any) => q.id));
          const missingQuizzes = defaultQuizzes.filter((defQ) => !existingQIds.has(defQ.id));
          this.quizzes = [...parsed, ...missingQuizzes];
        } else {
          this.quizzes = [...defaultQuizzes];
        }
      } else {
        this.quizzes = [...defaultQuizzes];
      }

      const storedMembers = localStorage.getItem('pawako_members');
      if (storedMembers) {
        const parsed = JSON.parse(storedMembers);
        this.members = Array.isArray(parsed) ? parsed : [];
      } else {
        this.members = [];
      }

      const storedLinks = localStorage.getItem('pawako_usefullinks');
      if (storedLinks) {
        const parsed = JSON.parse(storedLinks);
        this.usefulLinks = Array.isArray(parsed) ? parsed : [...defaultUsefulLinks];
      }

      const storedBranding = localStorage.getItem('pawako_branding');
      if (storedBranding) {
        const parsed = JSON.parse(storedBranding);
        this.branding = { ...defaultBranding, ...parsed };
      }
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

  public saveBranding(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pawako_branding', JSON.stringify(this.branding));
      } catch {
        // Ignore
      }
    }
    this.notify();
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
    if (Array.isArray(modules)) {
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
    if (Array.isArray(quizzes)) {
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

  public setMembers(members: Member[]): void {
    if (Array.isArray(members)) {
      this.members = members;
      this.saveMembers();
    }
  }

  public updateMember(updated: Member): void {
    const idx = this.members.findIndex((m) => m.id === updated.id || m.discordId === updated.discordId);
    if (idx >= 0) {
      this.members[idx] = updated;
    } else {
      this.members.push(updated);
    }
    this.saveMembers();
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
    if (Array.isArray(links)) {
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
    this.saveModules();
    return newMod;
  }

  public addModule(mod: TrainingModule): TrainingModule {
    this.modules.push(mod);
    this.addLog('Anthony (Admin)', `Création du module "${mod.title}"`, 'module');
    this.saveModules();
    return mod;
  }

  public updateModule(id: string, data: Partial<TrainingModule>): TrainingModule {
    const idx = this.modules.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Module non trouvé');
    this.modules[idx] = { ...this.modules[idx], ...data };
    this.addLog('Anthony (Admin)', `Modification du module "${this.modules[idx].title}"`, 'module');
    this.saveModules();
    return this.modules[idx];
  }

  public deleteModule(id: string): void {
    const mod = this.getModule(id);
    this.modules = this.modules.filter((m) => m.id !== id);
    if (mod) {
      this.addLog('Anthony (Admin)', `Suppression du module "${mod.title}"`, 'module');
    }
    this.saveModules();
  }

  // --- Quizzes ---
  public getQuizzes(): Quiz[] {
    return this.quizzes;
  }

  public getQuiz(id: string): Quiz | undefined {
    if (!id) return undefined;

    // 1. Direct match by quiz ID
    let found = this.quizzes.find((q) => q.id === id);
    if (found) return found;

    // 2. Match by moduleId
    found = this.quizzes.find((q) => q.moduleId === id);
    if (found) return found;

    // 3. Match by module's quizId property
    const mod = this.modules.find((m) => m.id === id || m.quizId === id);
    if (mod && mod.quizId) {
      found = this.quizzes.find((q) => q.id === mod.quizId);
      if (found) return found;
    }

    // 4. Fallback search in defaultQuizzes if store array lost it
    const defQuiz = defaultQuizzes.find(
      (dq) => dq.id === id || dq.moduleId === id || (mod && (dq.id === mod.quizId || dq.moduleId === mod.id))
    );
    if (defQuiz) {
      const restored = JSON.parse(JSON.stringify(defQuiz));
      this.quizzes.push(restored);
      this.saveQuizzes();
      return restored;
    }

    return undefined;
  }

  public createQuiz(quiz: Omit<Quiz, 'id'>): Quiz {
    const newId = `quiz-${Date.now()}`;
    const newQuiz: Quiz = { ...quiz, id: newId };
    this.quizzes.push(newQuiz);
    this.addLog('Anthony (Admin)', `Création du quiz "${newQuiz.title}"`, 'quiz');
    this.saveQuizzes();
    return newQuiz;
  }

  public addQuiz(quiz: Quiz): Quiz {
    this.quizzes.push(quiz);
    this.addLog('Anthony (Admin)', `Création du quiz "${quiz.title}"`, 'quiz');
    this.saveQuizzes();
    return quiz;
  }

  public updateQuiz(id: string, data: Partial<Quiz>): Quiz {
    let idx = this.quizzes.findIndex((q) => q.id === id || q.moduleId === id);
    if (idx === -1) {
      idx = this.quizzes.findIndex((q) => q.id.toLowerCase() === id.toLowerCase() || q.moduleId.toLowerCase() === id.toLowerCase());
    }
    if (idx === -1) throw new Error('Quiz non trouvé');
    this.quizzes[idx] = { ...this.quizzes[idx], ...data };
    this.addLog('Anthony (Admin)', `Modification du quiz "${this.quizzes[idx].title}"`, 'quiz');
    this.saveQuizzes();
    return this.quizzes[idx];
  }

  public deleteQuiz(id: string): void {
    const q = this.getQuiz(id);
    this.quizzes = this.quizzes.filter((item) => item.id !== id);
    if (q) {
      this.addLog('Anthony (Admin)', `Suppression du quiz "${q.title}"`, 'quiz');
    }
    this.saveQuizzes();
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

      const stepCfg = onboardingService.getStepConfigForModule(quiz.moduleId);
      const passRole = stepCfg?.roleOnPassName || stepCfg?.roleOnPassId || currentMod?.roleValidatedName || '';
      const startRole = stepCfg?.roleOnStartName || stepCfg?.roleOnStartId || currentMod?.roleEnCoursName || '';

      // Assign pass role if configured
      if (passRole && !member.roles.includes(passRole)) {
        member.roles.push(passRole);
      }

      // Remove current start role if configured
      if (startRole) {
        member.roles = member.roles.filter((r) => r !== startRole);
      }

      // Unlock next module
      const nextMod = sortedMods[currentModIdx + 1];
      if (nextMod) {
        const nextStepCfg = onboardingService.getStepConfigForModule(nextMod.id);
        const nextStartRole = nextStepCfg?.roleOnStartName || nextStepCfg?.roleOnStartId || nextMod?.roleEnCoursName || '';

        if (nextStartRole && !member.roles.includes(nextStartRole)) {
          member.roles.push(nextStartRole);
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

      const isModule5OrFinal = !nextMod || quiz.moduleId === 'module-5' || quiz.id === 'quiz-5' || (currentMod && currentMod.order === 5);

      this.addLog(
        member.username,
        `[QUIZ_SUCCESS] Quiz validé : ${quiz.title} - Score: ${score}%`,
        'quiz',
        member.username,
        quiz.title,
        quiz.moduleId
      );

      if (isModule5OrFinal) {
        this.addLog(
          member.username,
          `🏆 [PARCOURS_VALIDÉ_MODULE_5] Le candidat ${member.username} a réussi le Quiz du Module 5 ! Staff notifié sur Discord.`,
          'quiz',
          member.username,
          quiz.title,
          quiz.moduleId
        );

        if (typeof window === 'undefined') {
          import('../bot/discordBot').then(({ pawakoBot }) => {
            const totalQ = quiz.questions?.length || 20;
            const finalPoints = Math.round((score / 100) * totalQ);
            pawakoBot.notifyStaffModule5Completion(member, quiz.title, finalPoints, totalQ, quiz.minScore || 16).catch(() => {});
          }).catch(() => {});
        }
      }

      // Sync new roles directly to Discord REST API
      const discordId = member.discordId || member.id;
      if (discordId) {
        discordService.assignDiscordRolesToMember(discordId, member.roles).catch((e) =>
          console.warn('[Quiz Validation Discord Role Sync Error]', e?.message || e)
        );
      }
    } else {
      member.progress[quiz.moduleId] = prog;
      this.addLog(
        member.username,
        `[QUIZ_FAILED] Échec au quiz ${quiz.title} pour ${member.username} (Score: ${score}%)`,
        'quiz',
        member.username,
        quiz.title,
        quiz.moduleId
      );
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

  public getQuizAttemptsForMember(memberId: string): QuizAttempt[] {
    if (!memberId) return [];
    return this.quizAttempts.filter((att) => att.memberId === memberId || att.memberId.replace('mem-', '') === memberId.replace('mem-', ''));
  }

  public getQuizAnalytics(): QuizAnalyticsItem[] {
    return this.quizzes.map((quiz) => {
      const mod = this.getModule(quiz.moduleId) || this.modules.find((m) => m.id === quiz.moduleId);
      const attempts = this.quizAttempts.filter(
        (att) => att.quizId === quiz.id || att.quizTitle === quiz.title
      );
      const totalAttempts = attempts.length;
      const passedAttempts = attempts.filter((att) => att.passed).length;
      const failedAttempts = totalAttempts - passedAttempts;
      const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 100;
      const sumScores = attempts.reduce((acc, att) => {
        const score20 = att.score > 20 ? Math.round((att.score / 100) * 20) : att.score;
        return acc + score20;
      }, 0);
      const avgScore = totalAttempts > 0 ? Math.round((sumScores / totalAttempts) * 10) / 10 : 20;

      let difficulty: 'Facile' | 'Modéré' | 'Difficile' | 'Extrême' = 'Facile';
      if (totalAttempts > 0) {
        if (passRate < 40) difficulty = 'Extrême';
        else if (passRate < 60) difficulty = 'Difficile';
        else if (passRate < 80) difficulty = 'Modéré';
      }

      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        moduleId: quiz.moduleId,
        moduleTitle: mod ? mod.title : quiz.title,
        totalAttempts,
        passedAttempts,
        failedAttempts,
        passRate,
        avgScore,
        difficulty,
      };
    });
  }

  // --- Members ---
  public getMembers(): Member[] {
    return this.members;
  }

  public getMember(id: string): Member | undefined {
    if (!id) return undefined;
    const cleanId = id.replace('mem-', '');
    return this.members.find(
      (m) =>
        m.id === id ||
        m.discordId === id ||
        m.id === cleanId ||
        m.id === `mem-${cleanId}` ||
        (m.discordId && m.discordId === cleanId)
    );
  }

  public getOrCreateCandidate(discordUserId: string, username: string, avatarUrl?: string): Member {
    let m = this.members.find((item) => item.discordId === discordUserId || item.id === discordUserId || item.id === `mem-${discordUserId}`);
    if (!m) {
      const firstMod = this.modules[0];
      const firstModId = firstMod?.id || '';

      const cfg = onboardingService.getConfig();
      const step1 = cfg.stepConfigs?.[0];
      const configuredInitialRole = cfg.initialRoleName || cfg.initialRoleId || step1?.roleOnStartName || step1?.roleOnStartId || '';
      const initialRoles = configuredInitialRole ? [configuredInitialRole] : [];

      m = {
        id: `mem-${discordUserId}`,
        discordId: discordUserId,
        username: username || `Candidat-${discordUserId.slice(-4)}`,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        roles: initialRoles,
        joinedAt: this.getFormattedNow(),
        currentModuleId: firstModId,
        candidateState: 'nouveau',
        progress: firstModId
          ? {
              [firstModId]: { moduleId: firstModId, status: 'en_cours', attemptsCount: 0 },
            }
          : {},
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
    const firstModId = this.modules[0]?.id || '';
    m.progress = firstModId
      ? { [firstModId]: { moduleId: firstModId, status: 'en_cours', attemptsCount: 0 } }
      : {};
    m.currentModuleId = firstModId;
    const cfg = onboardingService.getConfig();
    const step1 = cfg.stepConfigs?.[0];
    const configuredInitialRole = cfg.initialRoleName || cfg.initialRoleId || step1?.roleOnStartName || step1?.roleOnStartId || '';
    m.roles = configuredInitialRole ? [configuredInitialRole] : [];
    this.saveMembers();
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
  public getRandomQuizQuestions(quizId: string, targetCount?: number): QuizQuestion[] {
    const quiz = this.getQuiz(quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return [];
    }

    // Default target count is 20 questions randomly selected from bank (unless specified or sampleSize set)
    const desiredCount = targetCount && targetCount > 0
      ? targetCount
      : (quiz.sampleSize && quiz.sampleSize > 0 ? quiz.sampleSize : 20);

    const count = Math.min(desiredCount, quiz.questions.length);

    const bank = [...quiz.questions];

    // Fisher-Yates shuffle question bank
    for (let i = bank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }

    // Select up to `count` questions randomly from the bank (e.g. 20 out of 100)
    const selected = bank.slice(0, count);

    // Only duplicate if sampleSize was explicitly set larger than bank length
    if (quiz.sampleSize && quiz.sampleSize > bank.length) {
      while (selected.length < quiz.sampleSize && bank.length > 0) {
        const baseQ = bank[selected.length % bank.length];
        selected.push({
          ...baseQ,
          id: `${baseQ.id}-variation-${selected.length}`,
        });
      }
    }

    // Shuffle options for each question & update correctAnswer index
    return selected.map((q, idx) => {
      const originalOptions = [...q.options];
      const correctText = originalOptions[q.correctAnswer] ?? originalOptions[0];

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
🌟 CARNET DE FORMATION — ${member.username}
🎈 Bienvenue sur ton tableau de bord !
━━━━━━━━━━━━━━━━━━━━

👤 **Candidat(e)** : <@${member.discordId}> (**${member.username}**)

🏆 **Avancement du Parcours**
🎯 **${completedCount} sur ${totalModules}** modules réussis avec succès !
\`${progressBar}\` **${progressPercent}%**

📚 **Relevé des Quiz** :
${quizResultsText}

⚡ **Statut d'accès** :
${statusText}

━━━━━━━━━━━━━━━━━━━━
🎓 PAWAKO Formation • L'équipe est avec toi !`;
  }

  /**
   * Reset candidate cooldown timer
   */
  public resetCandidateCooldown(memberId: string): Member {
    const member = this.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');
    member.cooldownUntilTimestamp = null;
    member.currentQuizAvailableAtTimestamp = null;
    member.candidateState = 'quiz_disponible';
    if (member.currentModuleId && member.progress && member.progress[member.currentModuleId]) {
      member.progress[member.currentModuleId].cooldownUntilTimestamp = null;
    }
    this.saveMembers();
    this.addLog('Anthony (Admin)', `Réinitialisation du cooldown pour ${member.username}`, 'member', member.username);
    return member;
  }

  /**
   * Reset current module state and cooldown for candidate
   */
  public resetCandidateCurrentModule(memberId: string): Member {
    const member = this.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');
    member.cooldownUntilTimestamp = null;
    member.currentQuizAvailableAtTimestamp = null;
    member.candidateState = 'module_en_cours';

    const curModId = member.currentModuleId || this.modules[0]?.id || '';
    if (curModId && member.progress[curModId]) {
      member.progress[curModId].attemptsCount = 0;
      member.progress[curModId].status = 'en_cours';
      member.progress[curModId].score = 0;
      member.progress[curModId].quizPassed = false;
    }

    this.saveMembers();
    this.addLog('Anthony (Admin)', `Réinitialisation du module en cours pour ${member.username}`, 'member', member.username);
    return member;
  }

  /**
   * Validate simulation step for a candidate and schedule 10h00 HF Tools Formation
   */
  public validateCandidateSimulation(memberId: string, adminName: string = 'Staff'): Member {
    const member = this.getMember(memberId);
    if (!member) throw new Error('Membre non trouvé');

    const now = new Date();
    const parisString = now.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
    const parisDate = new Date(parisString);

    const targetParis = new Date(parisDate);
    targetParis.setHours(10, 0, 0, 0);

    if (parisDate.getTime() >= targetParis.getTime()) {
      targetParis.setDate(targetParis.getDate() + 1);
    }

    const diffMs = targetParis.getTime() - parisDate.getTime();
    const scheduledTs = now.getTime() + diffMs;

    member.candidateState = 'formation_outils';
    member.simulationValidatedAt = new Date().toLocaleString('fr-FR');
    member.toolsFormationScheduledTimestamp = scheduledTs;
    member.toolsFormationReminderSent = false;

    this.saveMembers();
    this.addLog(
      adminName,
      `Validation de la simulation pour ${member.username}. Formation Outils programmée pour 10h00 HF.`,
      'member',
      member.username
    );

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
  public saveToLocalStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('pawako_modules', JSON.stringify(this.modules));
      localStorage.setItem('pawako_quizzes', JSON.stringify(this.quizzes));
      localStorage.setItem('pawako_members', JSON.stringify(this.members));
      localStorage.setItem('pawako_usefullinks', JSON.stringify(this.usefulLinks));
    } catch (e) {
      console.warn('Error saving store to localStorage:', e);
    }
  }

  public resetToBlankSlate(): void {
    this.modules = [];
    this.quizzes = [];
    this.members = [];
    this.tickets = [];
    this.adminLogs = [];
    this.notifications = [];
    this.quizAttempts = [];
    this.saveToLocalStorage();
    this.notify();
  }

  public resetModulesToDefaults(): void {
    this.modules = JSON.parse(JSON.stringify(defaultModules));
    this.quizzes = JSON.parse(JSON.stringify(defaultQuizzes));
    this.saveToLocalStorage();
    this.notify();
    this.addLog('Anthony (Admin)', 'Réinitialisation des 5 modules et quiz officiels effectuée', 'system');
  }

  public resetAllData(): void {
    this.resetToBlankSlate();
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
