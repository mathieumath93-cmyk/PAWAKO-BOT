export type NotificationLevel = 'critique' | 'important' | 'information';
export type NotificationStatus = 'non_lue' | 'lue' | 'traitee';
export type TicketStatus = 'ouvert' | 'ferme';
export type AttemptResult = 'succes' | 'echec';
export type MaintenanceType = 'quiz' | 'attempts' | 'progress' | 'tickets' | 'onboarding';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

export interface DiscordServer {
  id: string;
  name: string;
  iconUrl?: string;
  memberCount: number;
  isBotPresent: boolean;
  channelsCount: number;
  rolesCount: number;
  activeModulesCount: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  position: number;
  isManaged?: boolean;
}

export interface DiscordChannelConfig {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category' | 'forum';
  categoryName?: string;
  isConfiguredFor: 'training' | 'quiz' | 'results' | 'logs' | 'general' | 'tickets' | 'none';
}

export type QuestionType = 'multiple_choice' | 'single_choice' | 'true_false' | 'text';

export type CandidateState =
  | 'nouveau'
  | 'bienvenue_validee'
  | 'formation_commencee'
  | 'module_en_cours'
  | 'quiz_disponible'
  | 'cooldown_actif'
  | 'simulation'
  | 'simulation_validee'
  | 'formation_outils'
  | 'formation_terminee';

export interface QuizQuestion {
  id: string;
  text: string;
  type?: QuestionType;
  options: string[];
  correctAnswer: number; // 0-indexed option index
  points?: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  minScore: number; // e.g. 16 out of 20 (80%)
  maxScore?: number; // default 20
  timeLimitMinutes?: number;
  maxAttempts?: number;
  cooldownMinutes: number; // e.g. 30, 60, 120 min configurable per quiz
  delayMinutesBeforeQuiz?: number; // e.g. 10 min delay before quiz unlocks
  sampleSize?: number; // e.g. 20 randomly drawn questions from bank
  questions: QuizQuestion[]; // Unlimited question bank
  successMessage?: string;
  failureMessage?: string;
  isActive?: boolean;
  resultsChannelName?: string;
  resultsChannelId?: string;
  createPrivateThread?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  memberId: string;
  memberName: string;
  score: number; // percentage or points
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

export type ModuleBlockType = 'text' | 'heading' | 'image' | 'video' | 'link' | 'button' | 'divider' | 'quiz' | 'alert' | 'embed';

export interface ModuleBlock {
  id: string;
  type: ModuleBlockType;
  title?: string;
  content: string;
  url?: string;
  alertType?: 'info' | 'warning' | 'success' | 'danger';
}

export interface TrainingModule {
  id: string;
  order: number;
  title: string;
  description: string;
  content: string; // Markdown or structured rich text
  url?: string; // External document/resource link
  blocks?: ModuleBlock[];
  channelId: string;
  channelName: string; // e.g. "#formation"
  roleValidatedId: string;
  roleValidatedName: string; // e.g. "Module 1 Validé"
  roleEnCoursId: string;
  roleEnCoursName: string; // e.g. "Module 1 En cours"
  quizId?: string;
  resources: ModuleResource[];
  buttons: ModuleActionButton[];
  isActive: boolean;
  completionRate?: number; // e.g. 82
  discordMessageId?: string;
  discordChannelId?: string;
  discordGuildId?: string;
  publishedAt?: string;
  publishStatus?: 'draft' | 'publishing' | 'published' | 'publish_failed';
}

export interface MemberBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  iconName: string;
  color: string;
  unlockedAt: string;
  category: 'completion' | 'performance' | 'validation' | 'special';
}

export interface MemberProgress {
  moduleId: string;
  status: 'verrouille' | 'en_cours' | 'valide';
  validatedAt?: string; // "17/08/2026 14:35"
  quizPassed?: boolean;
  score?: number;
  attemptsCount: number;
  cooldownUntilTimestamp?: number | null;
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
  candidateState?: CandidateState;
  cooldownUntilTimestamp?: number | null; // ms timestamp when cooldown expires
  currentQuizAvailableAtTimestamp?: number | null; // ms timestamp when quiz unlocks (e.g. +10 min)
  personalChannelId?: string;
  personalChannelName?: string;
  progress: Record<string, MemberProgress>; // key is moduleId
  extraAttemptsGranted: Record<string, number>; // key is quizId
  isActive: boolean;
  lastActiveAt: string; // "17/08/2026 14:35"
  modulesCompletedCount?: number;
  averageScore?: number;
  autoReminderFlag?: boolean;
  autoReminderLevel?: string | null;
  autoReminderFlaggedAt?: string;
  autoReminderReason?: string;
  remindersSent?: Record<string, number>;
  lastReminderAt?: string;
  simulationScheduledTimestamp?: number | null;
  simulationReminderSent?: boolean;
  simuMpSentToStaff?: boolean;
  toolsFormationScheduledTimestamp?: number | null;
  toolsFormationReminderSent?: boolean;
  simulationValidatedAt?: string;
  toolsFormationValidatedAt?: string;
  email?: string;
  whatsapp?: string;
  shift?: string;
  badges?: MemberBadge[];
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

export type ButtonActionType =
  | 'join_training'
  | 'start_module'
  | 'launch_quiz'
  | 'show_profile'
  | 'assign_role'
  | 'create_channel'
  | 'redirect_url';

export interface CustomButtonConfig {
  id: string;
  label: string;
  style: 'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link';
  customId: string;
  actionType: ButtonActionType;
  actionValue?: string; // e.g. URL for redirect_url, role name/ID for assign_role, moduleId for start_module
}

export interface BotMessageTemplate {
  id: string;
  key: string;
  name: string;
  channelId: string;
  channelName: string;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  buttonLabel?: string;
  buttons?: CustomButtonConfig[];
  enabled: boolean;
}

export interface AutomationAction {
  type: 'add_role' | 'remove_role' | 'send_message' | 'create_thread' | 'unlock_module' | 'lock_module' | 'log_event' | 'send_dm';
  target?: string;
  payload?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: 'quiz_completed' | 'module_completed' | 'member_joined' | 'ticket_opened';
  condition: 'score_gte' | 'score_lt' | 'has_role' | 'always';
  conditionValue?: string | number;
  actions: AutomationAction[];
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

export interface DiscordGuildSyncData {
  id: string; // Internal or discord ID
  discord_guild_id: string;
  name: string;
  icon?: string;
  owner_id?: string;
  member_count?: number;
  bot_present: boolean;
  last_synced_at?: string;
  sync_status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface DiscordRoleSyncData {
  id: string;
  guild_id: string;
  discord_role_id: string;
  name: string;
  color?: string;
  position: number;
  managed: boolean;
  mentionable: boolean;
  hoist?: boolean;
  permissions?: string;
  canAssignByBot?: boolean;
  isHigherThanBot?: boolean;
  last_synced_at?: string;
}

export interface DiscordChannelSyncData {
  id: string;
  guild_id: string;
  discord_channel_id: string;
  name: string;
  type: number; // 0 = text, 2 = voice, 4 = category
  parent_id?: string;
  parent_name?: string;
  position: number;
  topic?: string;
  permissions?: {
    viewChannel: boolean;
    sendMessages: boolean;
    embedLinks: boolean;
    createPrivateThreads: boolean;
    readMessageHistory: boolean;
  };
  last_synced_at?: string;
}

export interface BotPermissionAnalysis {
  viewChannel: boolean;
  sendMessages: boolean;
  embedLinks: boolean;
  readMessageHistory: boolean;
  manageChannels: boolean;
  manageRoles: boolean;
  createPrivateThreads: boolean;
  sendMessagesInThreads: boolean;
  botHighestRolePosition: number;
  botRoleName?: string;
}

export interface ModuleStepConfig {
  moduleId: string;
  moduleTitle: string;
  roleOnStartId?: string;
  roleOnStartName?: string;
  roleOnPassId?: string;
  roleOnPassName?: string;
  nextModuleId?: string;
  nextModuleTitle?: string;
  directivesText?: string;
  externalLinkUrl?: string;
  delayMinutesBeforeQuiz?: number;
  successMessage?: string; // e.g. "Félicitations tu as réussi avec : {score}/20 ! Tu as accès au module 2 en cliquant ci-dessous."
  failureMessage?: string; // e.g. "Vous n'avez pas réussi (score : {score}/20), vous pouvez réessayer après 15 minutes."
}

export interface AutoReminderConfig {
  enabled: boolean;
  thresholdHours: number[]; // e.g. [2, 6, 8, 24]
  unstartedMessage: string;
  unfinishedQuizMessage: string;
  // Pools of 5 messages each for varied reminders
  unstartedPool?: string[];
  inProgress2hPool?: string[];
  inProgress6hPool?: string[];
  inProgress12hPool?: string[];
  inProgress24hPool?: string[];
}

export interface OnboardingFlowConfig {
  guildId?: string;
  welcomeChannelId?: string;
  welcomeChannelName?: string;
  welcomeButtonLabel: string; // "Commencer la formation"
  personalCategoryId?: string;
  personalCategoryName?: string;
  personalChannelPrefix: string; // "formation-" -> "🔒-formation-[pseudo]"
  welcomeRulesMessage: string; // Message + règles
  startTrainingButtonLabel: string; // "Lancer la formation"
  initialRoleId?: string;
  initialRoleName?: string;
  logChannelId?: string;
  logChannelName?: string;
  cooldownMinutes: number; // default 15
  randomizeQuestions: boolean; // default true
  hideQuizSolutions: boolean; // default true
  stepConfigs: ModuleStepConfig[];
  autoReminders?: AutoReminderConfig;
  repeatedFailurePool?: string[]; // Pool of advice messages sent when candidate fails 3+ times
  cooldownSpamPool?: string[]; // Sarcastic messages sent when candidate clicks during active cooldown
  sarcasticSpamMessages?: string[];
  toolsFormationMeetUrl?: string; // Google Meet link for Tools Formation
  mahsaDiscordId?: string; // Discord ID or tag for Mahsa
  mathieuDiscordId?: string; // Discord ID or tag for Mathieu
}

export interface UserSession {
  discordId: string;
  username: string;
  avatarUrl: string;
  isAdmin: boolean;
  roleName: string;
  loginAt: string;
}

export interface StepGuide {
  stepNumber: number;
  title: string;
  objective: string;
  keyPhrases: string[];
  forbiddenErrors: string[];
}

export interface PpvItem {
  id: string;
  mediaName: string;
  minPrice: number;
  maxPrice: number;
  description: string;
}

export interface ObjectionHandler {
  id: string;
  objection: string;
  strategy: string;
  exampleResponse: string;
}

export interface FanPersona {
  id: string;
  name: string;
  description: string;
  budget: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  initialMessage: string;
}

export interface AiKnowledgeBase {
  ofmRules: string;
  ppvPricing: PpvItem[];
  objectionHandlers: ObjectionHandler[];
  fiveStepsGuide: StepGuide[];
  fanPersonas: FanPersona[];
}

export interface AiPromptConfig {
  analyzerPrompt: string;
  fanPrompt: string;
  coachPrompt: string;
  modelName: string;
  temperature: number;
  openRouterApiKey: string;
  enableLiveDiscordBot: boolean;
}

