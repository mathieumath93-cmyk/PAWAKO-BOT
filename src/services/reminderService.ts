import { discordService } from './discordService';
import { store } from './store';
import { Member } from '../types';

export type RelanceStageCondition =
  | 'not_started'
  | 'in_progress_module'
  | 'quiz_failed'
  | 'pending_role'
  | 'all_inactive';

export interface CandidateReminderRule {
  id: string;
  delayHours: number; // e.g. 2, 6, 12, 24
  label: string;
  enabled: boolean;
  messageText: string;
  targetChannel: string; // e.g. '#bienvenue', 'personal_channel', or '#formation'
  stageCondition: RelanceStageCondition;
  stageLabel: string;
}

export const initialReminderRules: CandidateReminderRule[] = [
  {
    id: 'relance-not-started',
    delayHours: 2,
    label: 'Relance Démarrage (N\'a pas ouvert le Module 1)',
    stageCondition: 'not_started',
    stageLabel: 'N\'a pas encore démarré',
    enabled: true,
    messageText: '👋 Coucou {membre} ! Tu es inscrit à la formation PAWAKO mais tu n\'as pas encore ouvert le Module 1. Ton accès est disponible dans ton salon privé !',
    targetChannel: 'personal_channel',
  },
  {
    id: 'relance-in-progress',
    delayHours: 6,
    label: 'Rappel Module en Cours (Bloqué sur un Module)',
    stageCondition: 'in_progress_module',
    stageLabel: 'Module en cours de lecture',
    enabled: true,
    messageText: '📌 Rappel {membre} : Tu as entamé la lecture de ton module. Il ne te reste que quelques sections pour débloquer le Quiz de validation !',
    targetChannel: 'personal_channel',
  },
  {
    id: 'relance-quiz-failed',
    delayHours: 12,
    label: 'Relance Révision & Retente Quiz (Quiz Échoué)',
    stageCondition: 'quiz_failed',
    stageLabel: 'Quiz non validé / À repasser',
    enabled: true,
    messageText: '⚡ {membre}, ton résultat au Quiz nécessite une petite révision ! Relis les points clés du module et retente ta chance pour débloquer ton rôle Discord.',
    targetChannel: 'personal_channel',
  },
  {
    id: 'relance-pending-role',
    delayHours: 24,
    label: 'Notification Attribution de Rôle (En Attente)',
    stageCondition: 'pending_role',
    stageLabel: 'Quiz réussi / En attente de rôle',
    enabled: true,
    messageText: '🎉 Bravo {membre} ! Tu as brillamment réussi ton évaluation. Un administrateur valide l\'attribution de tes nouveaux rôles sur Discord !',
    targetChannel: 'personal_channel',
  },
];

class ReminderService {
  private rules: CandidateReminderRule[] = [];
  private autoCheckInterval: any = null;

  constructor() {
    this.rules = this.loadRules();
    this.startAutoCheckLoop();
  }

  private loadRules(): CandidateReminderRule[] {
    try {
      const stored = localStorage.getItem('pawako_candidate_reminder_rules');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r) => ({
            ...r,
            stageCondition: r.stageCondition || 'all_inactive',
            stageLabel: r.stageLabel || 'Inactivité générale',
          }));
        }
      }
    } catch {
      // Fallback
    }
    return [...initialReminderRules];
  }

  public saveRules(rules: CandidateReminderRule[]): void {
    this.rules = rules;
    try {
      localStorage.setItem('pawako_candidate_reminder_rules', JSON.stringify(rules));
    } catch {
      // Ignore
    }
  }

  public getRules(): CandidateReminderRule[] {
    return this.rules;
  }

  /**
   * Determine a member's progress stage
   */
  public getMemberStage(member: Member): { stage: RelanceStageCondition; label: string } {
    const progressList = Object.values(member.progress || {});
    const validatedCount = progressList.filter((p) => p.status === 'valide').length;
    const inProgressCount = progressList.filter((p) => p.status === 'en_cours').length;
    const failedAttempts = progressList.filter((p) => p.attemptsCount > 0 && !p.quizPassed).length;

    if (validatedCount > 0 && validatedCount >= Object.keys(member.progress || {}).length) {
      return { stage: 'pending_role', label: '✅ Parcours Validé - Attente Rôle' };
    }

    if (failedAttempts > 0) {
      return { stage: 'quiz_failed', label: '⚠️ Quiz Échoué - Révision Requise' };
    }

    if (inProgressCount > 0) {
      return { stage: 'in_progress_module', label: '📖 Module en Cours' };
    }

    if (validatedCount === 0) {
      return { stage: 'not_started', label: '🆕 Non Démarré' };
    }

    return { stage: 'all_inactive', label: '⏳ En Progression' };
  }

  /**
   * Automatically scan members, evaluate their progress stage and send matched relance
   */
  public async evaluateAndAutoRemindMembers(): Promise<{
    evaluatedCount: number;
    remindedCount: number;
    details: Array<{ memberName: string; stage: string; ruleLabel: string; status: string }>;
  }> {
    const members = store.getMembers();
    const details: Array<{ memberName: string; stage: string; ruleLabel: string; status: string }> = [];
    let remindedCount = 0;

    for (const member of members) {
      const { stage, label: stageLabel } = this.getMemberStage(member);
      
      // Find matching rule for this stage
      const matchingRule = this.rules.find((r) => r.enabled && r.stageCondition === stage) ||
        this.rules.find((r) => r.enabled && r.stageCondition === 'all_inactive');

      if (matchingRule) {
        const res = await this.executeCandidateReminder(matchingRule.id, member.username);
        if (res.success) {
          remindedCount++;
          details.push({
            memberName: member.username,
            stage: stageLabel,
            ruleLabel: matchingRule.label,
            status: '✅ Relance envoyée sur Discord',
          });
          store.addLog(
            'Système Relance Auto',
            `Relance automatique [${matchingRule.label}] envoyée à ${member.username} (Statut: ${stageLabel})`,
            'member'
          );
        } else {
          details.push({
            memberName: member.username,
            stage: stageLabel,
            ruleLabel: matchingRule.label,
            status: `ℹ️ ${res.message}`,
          });
        }
      } else {
        details.push({
          memberName: member.username,
          stage: stageLabel,
          ruleLabel: 'Aucune règle active',
          status: 'En cours normal',
        });
      }
    }

    return {
      evaluatedCount: members.length,
      remindedCount,
      details,
    };
  }

  /**
   * Start automatic background check loop
   */
  private startAutoCheckLoop() {
    if (typeof window === 'undefined') return;
    if (this.autoCheckInterval) clearInterval(this.autoCheckInterval);

    // Auto-check every 5 minutes (or on trigger)
    this.autoCheckInterval = setInterval(() => {
      this.evaluateAndAutoRemindMembers().catch(() => {});
    }, 5 * 60 * 1000);
  }

  /**
   * Execute a candidate reminder directly on Discord
   */
  public async executeCandidateReminder(
    ruleId: string,
    candidateName: string = 'Alex',
    targetChannelName?: string
  ): Promise<{ success: boolean; message: string }> {
    const rule = this.rules.find((r) => r.id === ruleId) || this.rules[0];
    if (!rule) {
      return { success: false, message: 'Règle de relance introuvable' };
    }

    const cleanMessage = rule.messageText.replace('{membre}', `@${candidateName}`);
    const channelName = targetChannelName || (rule.targetChannel === 'personal_channel' ? `#🔒-candidat-${candidateName.toLowerCase()}` : '#formation');

    const embed = {
      title: `⏱️ Relance Automatique par Statut : ${candidateName}`,
      description: cleanMessage,
      color: rule.stageCondition === 'quiz_failed' ? 0xef4444 : rule.stageCondition === 'pending_role' ? 0x10b981 : 0xf59e0b,
      fields: [
        { name: '👤 Candidat Cible', value: `@${candidateName}`, inline: true },
        { name: '📊 Avancement / Étape', value: rule.stageLabel || rule.label, inline: true },
        { name: '📍 Salon de Réception', value: channelName, inline: true },
      ],
      footer: {
        text: 'Pawako Formation • Système de Relance Adaptatif',
        icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      },
      timestamp: new Date().toISOString(),
    };

    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1, // Primary
            custom_id: `resume_training_${candidateName}`,
            label: '📚 Reprendre ma Formation',
          },
        ],
      },
    ];

    return await discordService.sendCustomEmbed({
      channelName,
      embed,
      components,
      content: `🔔 **Rappel Automatique Candidat** — @${candidateName}`,
    });
  }
}

export const reminderService = new ReminderService();
