export type NotificationLevel = 'critique' | 'important' | 'information';
export type NotificationStatus = 'non_lue' | 'lue' | 'traitee';
export type TicketStatus = 'ouvert' | 'ferme';
export type AttemptResult = 'succes' | 'echec';
export type MaintenanceType = 'quiz' | 'attempts' | 'progress' | 'tickets' | 'onboarding';

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  position: number;
  isManaged?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // 0-indexed option index
  explanation?: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  minScore: number; // percentage, e.g. 80
  maxAttempts: number; // e.g. 3
  questions: QuizQuestion[];
  successMessage?: string;
  failureMessage?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  memberId: string;
  memberName: string;
  score: number; // percentage
  passed: boolean;
  answers: number[]; // user choices index array
  date: string; // "17/08/2026 14:35"
  attemptNumber: number;
}

export interface ModuleResource {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'document';
}

export interface ModuleActionButton {
  id: string;
  label: string;
  action: 'complete' | 'open_link' | 'quiz' | 'custom';
  url?: string;
}

export interface TrainingModule {
  id: string;
  order: number;
  title: string;
  description: string;
  content: string; // Markdown or structured rich text
  channelId: string;
  channelName: string; // e.g. "#module-1"
  roleValidatedId: string;
  roleValidatedName: string; // e.g. "Module 1 Validé"
  roleEnCoursId: string;
  roleEnCoursName: string; // e.g. "Module 1 En cours"
  quizId?: string;
  resources: ModuleResource[];
  buttons: ModuleActionButton[];
  isActive: boolean;
}

export interface MemberProgress {
  moduleId: string;
  status: 'verrouille' | 'en_cours' | 'valide';
  validatedAt?: string; // "17/08/2026 14:35"
  quizPassed?: boolean;
  score?: number;
  attemptsCount: number;
}

export interface Member {
  id: string;
  discordId: string;
  username: string;
  discriminator?: string;
  avatarUrl?: string;
  roles: string[]; // Role names or IDs
  joinedAt: string; // "17/08/2026 14:35"
  currentModuleId: string;
  progress: Record<string, MemberProgress>; // key is moduleId
  extraAttemptsGranted: Record<string, number>; // key is quizId
  isActive: boolean;
  lastActiveAt: string; // "17/08/2026 14:35"
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string; // "17/08/2026 14:35"
  isAdmin: boolean;
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  subject: string;
  category: string;
  status: TicketStatus;
  createdAt: string; // "17/08/2026 14:35"
  closedAt?: string;
  closedBy?: string;
  messages: TicketMessage[];
  transcriptJson?: string;
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string;
  category: 'member' | 'quiz' | 'module' | 'role' | 'ticket' | 'system' | 'auth';
  targetMemberName?: string;
  quizTitle?: string;
  moduleTitle?: string;
  date: string; // "17/08/2026 14:35"
  result: 'effectué' | 'échoué' | 'interrompu';
  details?: string;
}

export interface AdminNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message: string;
  event: string;
  status: NotificationStatus;
  date: string; // "17/08/2026 14:35"
  mentionAdmin: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface UsefulLink {
  id: string;
  name: string;
  url: string; // Must be https://
  icon: string; // Lucide icon name or image URL
  order: number;
  isActive: boolean;
}

export interface MaintenanceSetting {
  enabled: boolean;
  mode: 'standard' | 'custom' | 'scheduled';
  customMessage?: string;
  scheduledStart?: string; // "17/08/2026 15:00"
  scheduledEnd?: string;
}

export interface BrandingSettings {
  trainingName: string; // "PAWAKO FORMATION 🤖"
  description: string;
  logoUrl: string;
  botAvatarUrl: string;
  botDisplayName: string;
  primaryColor: string; // e.g. "#6366f1"
  secondaryColor: string; // e.g. "#06b6d4"
  mainWelcomeMessage: string;
}

export interface DiscordPermissionAudit {
  name: string;
  key: string;
  granted: boolean;
  essential: boolean;
}

export interface SystemHealth {
  botConnected: boolean;
  botLatencyMs: number;
  supabaseConnected: boolean;
  webServerStatus: 'online' | 'degraded' | 'offline';
  pendingActions: number;
  recentErrorCount: number;
  retryQueueCount: number;
  lastHeartbeat: string;
  lastPermissionSync: string;
  lastBackupDate: string;
  permissionsAudit: DiscordPermissionAudit[];
}

export interface BackupRecord {
  id: string;
  filename: string;
  sizeKb: number;
  createdAt: string;
  status: 'succes' | 'echec';
  itemsCount: {
    members: number;
    modules: number;
    quizzes: number;
    tickets: number;
    logs: number;
  };
}

export interface UserSession {
  discordId: string;
  username: string;
  avatarUrl: string;
  isAdmin: boolean;
  roleName: string;
  loginAt: string;
}
