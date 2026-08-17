import { AutomationRule } from '../types';

export const initialAutomations: AutomationRule[] = [
  {
    id: 'auto-1',
    name: 'Validation Automatique Module 1',
    description: 'Attribue le rôle Junior, envoie un message dans #resultats-certifications et débloque le Module 2 quand le Quiz 1 est réussi.',
    enabled: true,
    trigger: 'quiz_completed',
    condition: 'score_gte',
    conditionValue: 16,
    actions: [
      { type: 'add_role', target: 'Junior', payload: 'role-junior' },
      { type: 'send_message', target: '#resultats-certifications', payload: '🎉 Félicitations {user} pour le Module 1 !' },
      { type: 'unlock_module', target: 'Module 2 — Outils & Processus', payload: 'mod-2' },
      { type: 'log_event', target: 'System Logs', payload: 'Passage réussi au Module 2' },
    ],
  },
  {
    id: 'auto-2',
    name: 'Onboarding Nouveau Membre',
    description: 'Attribue le rôle Trainee et envoie un message privé d\'accueil lors de l\'arrivée d\'un nouveau membre.',
    enabled: true,
    trigger: 'member_joined',
    condition: 'always',
    actions: [
      { type: 'add_role', target: 'Trainee', payload: 'role-trainee' },
      { type: 'send_dm', target: 'User DM', payload: 'Bienvenue sur le serveur Pawako Formation ! Rends-toi dans #formation pour débuter.' },
      { type: 'unlock_module', target: 'Module 1 — Onboarding', payload: 'mod-1' },
    ],
  },
];

class AutomationService {
  private rules: AutomationRule[] = [];

  constructor() {
    this.rules = this.loadRules();
  }

  private loadRules(): AutomationRule[] {
    try {
      const stored = localStorage.getItem('pawako_automation_rules');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [...initialAutomations];
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
}

export const automationService = new AutomationService();

