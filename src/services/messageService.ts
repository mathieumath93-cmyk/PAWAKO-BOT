import { BotMessageTemplate, CustomButtonConfig } from '../types';

export const initialBotTemplates: BotMessageTemplate[] = [
  {
    id: 'msg-welcome',
    key: 'welcome',
    name: "Message d'Accueil (Welcome)",
    channelId: 'chan-formation',
    channelName: '#👋-bienvenue',
    embedTitle: '👋 Bienvenue sur {server}, {username} !',
    embedDescription: 'Bienvenue dans notre espace de formation officiel. Clique sur le bouton ci-dessous pour démarrer ton Onboarding.',
    embedColor: '#6366f1',
    buttonLabel: '🚀 Rejoindre la formation',
    buttons: [
      {
        id: 'btn-w1',
        label: '🚀 Rejoindre la formation',
        style: 'Success',
        customId: 'join_training',
        actionType: 'join_training',
      },
      {
        id: 'btn-w2',
        label: '👤 Mon Profil',
        style: 'Secondary',
        customId: 'show_my_profile',
        actionType: 'show_profile',
      },
    ],
    enabled: true,
  },
  {
    id: 'msg-module',
    key: 'module',
    name: 'Annonce de Module',
    channelId: 'chan-formation',
    channelName: '#formation-privee',
    embedTitle: '📚 Module Débloqué : {module}',
    embedDescription: 'Félicitations {user} ! Tu as débloqué l\'accès au **{module}**. Consulte les leçons et passe le quiz pour valider cette étape.',
    embedColor: '#38bdf8',
    buttonLabel: '📖 Accéder au module',
    buttons: [
      {
        id: 'btn-m1',
        label: '📖 Démarrer le module',
        style: 'Primary',
        customId: 'start_module',
        actionType: 'start_module',
      },
      {
        id: 'btn-m2',
        label: '📝 Passer le Quiz',
        style: 'Success',
        customId: 'launch_quiz_quiz-1',
        actionType: 'launch_quiz',
        actionValue: 'quiz-1',
      },
    ],
    enabled: true,
  },
  {
    id: 'msg-quiz',
    key: 'quiz',
    name: 'Invitation au Quiz',
    channelId: 'chan-quiz',
    channelName: '#quiz-onboarding',
    embedTitle: '✏️ Quiz Prêt : {module}',
    embedDescription: 'Es-tu prêt à valider tes connaissances {username} ? Réponds aux 20 questions sélectionnées pour obtenir ton score.',
    embedColor: '#fbbf24',
    buttonLabel: '📝 Lancer le Quiz',
    buttons: [
      {
        id: 'btn-q1',
        label: '📝 Démarrer les 20 questions',
        style: 'Success',
        customId: 'launch_quiz_quiz-1',
        actionType: 'launch_quiz',
        actionValue: 'quiz-1',
      },
      {
        id: 'btn-q2',
        label: '👤 Mon Profil',
        style: 'Secondary',
        customId: 'show_my_profile',
        actionType: 'show_profile',
      },
    ],
    enabled: true,
  },
  {
    id: 'msg-reminder',
    key: 'reminder',
    name: 'Message de Relance Automatique',
    channelId: 'chan-formation',
    channelName: '#formation-privee',
    embedTitle: '🔔 Ta formation t\'attend {username} !',
    embedDescription: 'Tu es actuellement sur le **{module}**. Termine le cours et valide ton quiz pour débloquer la suite de ton parcours.',
    embedColor: '#f59e0b',
    buttonLabel: '📚 Reprendre le Module',
    buttons: [
      {
        id: 'btn-r1',
        label: '📚 Reprendre le Module',
        style: 'Primary',
        customId: 'start_module',
        actionType: 'start_module',
      },
      {
        id: 'btn-r2',
        label: '📝 Passer le Quiz',
        style: 'Success',
        customId: 'launch_quiz_quiz-1',
        actionType: 'launch_quiz',
      },
    ],
    enabled: true,
  },
];

class MessageService {
  private templates: BotMessageTemplate[] = [...initialBotTemplates];

  public getTemplates(): BotMessageTemplate[] {
    return this.templates;
  }

  public createTemplate(template: Omit<BotMessageTemplate, 'id'>): BotMessageTemplate {
    const newTpl: BotMessageTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      buttons: template.buttons || [],
    };
    this.templates.push(newTpl);
    return newTpl;
  }

  public updateTemplate(id: string, updates: Partial<BotMessageTemplate>): BotMessageTemplate {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.templates[idx] = { ...this.templates[idx], ...updates };
      return this.templates[idx];
    }
    throw new Error('Template non trouvé');
  }

  public deleteTemplate(id: string): void {
    this.templates = this.templates.filter((t) => t.id !== id);
  }

  public addButtonToTemplate(templateId: string, button: Omit<CustomButtonConfig, 'id'>): BotMessageTemplate {
    const tpl = this.templates.find((t) => t.id === templateId);
    if (!tpl) throw new Error('Template non trouvé');

    const newBtn: CustomButtonConfig = {
      ...button,
      id: `btn-${Date.now()}`,
    };

    if (!tpl.buttons) tpl.buttons = [];
    tpl.buttons.push(newBtn);
    return tpl;
  }

  public updateButtonInTemplate(templateId: string, buttonId: string, updates: Partial<CustomButtonConfig>): BotMessageTemplate {
    const tpl = this.templates.find((t) => t.id === templateId);
    if (!tpl) throw new Error('Template non trouvé');

    if (tpl.buttons) {
      const idx = tpl.buttons.findIndex((b) => b.id === buttonId);
      if (idx !== -1) {
        tpl.buttons[idx] = { ...tpl.buttons[idx], ...updates };
      }
    }
    return tpl;
  }

  public deleteButtonFromTemplate(templateId: string, buttonId: string): BotMessageTemplate {
    const tpl = this.templates.find((t) => t.id === templateId);
    if (!tpl) throw new Error('Template non trouvé');

    if (tpl.buttons) {
      tpl.buttons = tpl.buttons.filter((b) => b.id !== buttonId);
    }
    return tpl;
  }

  public formatMessage(
    text: string,
    vars: {
      user?: string;
      username?: string;
      server?: string;
      module?: string;
      score?: string | number;
      max_score?: string | number;
      next_module?: string;
    }
  ): string {
    let result = text || '';
    result = result.replace(/\{user\}/g, vars.user || '@Anthony');
    result = result.replace(/\{username\}/g, vars.username || 'Anthony');
    result = result.replace(/\{server\}/g, vars.server || 'Pawako Formation');
    result = result.replace(/\{module\}/g, vars.module || 'Module 1 — Onboarding');
    result = result.replace(/\{score\}/g, String(vars.score ?? 17));
    result = result.replace(/\{max_score\}/g, String(vars.max_score ?? 20));
    result = result.replace(/\{next_module\}/g, vars.next_module || 'Module 2 — Outils & Processus');
    return result;
  }
}

export const messageService = new MessageService();
