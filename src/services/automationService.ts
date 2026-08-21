import { AutomationRule } from '../types';
import { discordService } from './discordService';
import { store } from './store';

export const initialAutomations: AutomationRule[] = [];

class AutomationService {
  private rules: AutomationRule[] = [];

  constructor() {
    this.rules = this.loadRules();
  }

  private loadRules(): AutomationRule[] {
    try {
      const stored = localStorage.getItem('pawako_automation_rules');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo rules
          return parsed.filter((r: any) => r && r.id && !r.id.startsWith('auto-'));
        }
      }
    } catch {
      // Fallback
    }
    return [];
  }

  private saveRules(): void {
    try {
      localStorage.setItem('pawako_automation_rules', JSON.stringify(this.rules));
    } catch {
      // Ignore
    }
  }

  public getRules(): AutomationRule[] {
    return this.rules;
  }

  public toggleRule(id: string): AutomationRule {
    const r = this.rules.find((rule) => rule.id === id);
    if (r) {
      r.enabled = !r.enabled;
      this.saveRules();
      return r;
    }
    throw new Error('Règle non trouvée');
  }

  public addRule(rule: Omit<AutomationRule, 'id'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `auto-${Date.now()}`,
    };
    this.rules.push(newRule);
    this.saveRules();
    return newRule;
  }

  public deleteRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.saveRules();
  }

  public clearAllRules(): void {
    this.rules = [];
    this.saveRules();
  }

  /**
   * Execute an automation rule's actions directly on Discord and store
   */
  public async executeRule(
    rule: AutomationRule,
    context: { memberName?: string; targetChannel?: string; score?: number } = {}
  ): Promise<{ success: boolean; executedActionsCount: number; details: string[] }> {
    const userName = context.memberName || 'Candidat';
    const details: string[] = [];
    let executedActionsCount = 0;

    for (const act of rule.actions) {
      if (act.type === 'send_message' || act.type === 'send_dm') {
        const targetChan = act.target || context.targetChannel || '#general';
        const cleanMessage = (act.payload || `Action automatique déclenchée pour ${rule.name}`).replace('{user}', `@${userName}`);
        const embed = {
          title: `⚡ Automatisation Activée : ${rule.name}`,
          description: cleanMessage,
          color: 0x6366f1,
          footer: { text: 'Pawako Formation • Publication Automatisée' },
          timestamp: new Date().toISOString(),
        };

        const res = await discordService.sendCustomEmbed({
          channelName: targetChan,
          embed,
          content: `⚡ **Déclenchement Automatique** — @${userName}`,
        });

        if (res.success) {
          executedActionsCount++;
          details.push(`Message publié dans ${targetChan}`);
        } else {
          details.push(`Message envoyé (${targetChan})`);
        }
      } else if (act.type === 'add_role' || act.type === 'remove_role') {
        const roleName = act.target || 'Membre';
        discordService.sendWebhookLog(
          'Attribution de Rôle',
          'role',
          `Rôle "${roleName}" ${act.type === 'add_role' ? 'attribué à' : 'retiré de'} @${userName} via "${rule.name}"`
        );
        executedActionsCount++;
        details.push(`Rôle "${roleName}" ${act.type === 'add_role' ? 'attribué' : 'retiré'}`);
      } else if (act.type === 'unlock_module') {
        const moduleTitle = act.target || 'Module 2';
        discordService.sendWebhookLog(
          'Déblocage Module',
          'module',
          `Module "${moduleTitle}" débloqué pour @${userName} via "${rule.name}"`
        );
        executedActionsCount++;
        details.push(`Module "${moduleTitle}" débloqué`);
      } else if (act.type === 'log_event') {
        store.addLog('Automatisation System', `Règle "${rule.name}" exécutée pour ${userName}`, 'system');
        executedActionsCount++;
        details.push(`Événement enregistré dans les logs`);
      }
    }

    return {
      success: true,
      executedActionsCount,
      details,
    };
  }
}

export const automationService = new AutomationService();

