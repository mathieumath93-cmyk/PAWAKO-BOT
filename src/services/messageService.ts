import { BotMessageTemplate } from '../types';

export const initialBotTemplates: BotMessageTemplate[] = [
  {
    id: 'msg-welcome',
    key: 'welcome',
    name: "Message d'Accueil (Welcome)",
    channelId: 'chan-formation',
    channelName: '#formation',
    embedTitle: '👋 Bienvenue sur {server}, {username} !',
    embedDescription: 'Bienvenue dans notre espace de formation officiel. Clique sur le bouton ci-dessous pour démarrer le **{module}**.',
    embedColor: '#6366f1',
    buttonLabel: '🚀 Commencer le module',
    enabled: true,
  },
  {
    id: 'msg-module',
    key: 'module',
    name: 'Annonce de Nouveau Module',
    channelId: 'chan-formation',
    channelName: '#formation',
    embedTitle: '📚 Nouveau Module Débloqué : {module}',
    embedDescription: 'Félicitations {user} ! Tu as débloqué l\'accès au **{module}**. Consulte les leçons et passe le quiz pour obtenir ton badge.',
    embedColor: '#38bdf8',
    buttonLabel: '📖 Accéder au module',
    enabled: true,
  },
  {
    id: 'msg-quiz',
    key: 'quiz',
    name: 'Invitation au Quiz',
    channelId: 'chan-quiz',
    channelName: '#quiz-onboarding',
    embedTitle: '✏️ Quiz Prêt : {module}',
    embedDescription: 'Es-tu prêt à valider tes connaissances {username} ? Réponds aux questions pour obtenir ton score.',
    embedColor: '#fbbf24',
    buttonLabel: '📝 Lancer le Quiz',
    enabled: true,
  },
  {
    id: 'msg-success',
    key: 'success',
    name: 'Félicitations Réussite Quiz',
    channelId: 'chan-results',
    channelName: '#resultats-certifications',
    embedTitle: '🎉 Félicitations {user} !',
    embedDescription: 'Tu as réussi le **{module}** avec un score remarquable de **{score}/{max_score}** ! Ton prochain module est : **{next_module}**.',
    embedColor: '#34d399',
    buttonLabel: '📊 Voir le classement',
    enabled: true,
  },
  {
    id: 'msg-failure',
    key: 'failure',
    name: 'Notification Échec Quiz',
    channelId: 'chan-results',
    channelName: '#resultats-certifications',
    embedTitle: '⚠️ Échec du Quiz pour {username}',
    embedDescription: 'Désolé {user}, ton score est de **{score}/{max_score}**. Relis attentivement le cours avant de retenter ta chance !',
    embedColor: '#f43f5e',
    buttonLabel: '🔄 Réessayer le Quiz',
    enabled: true,
  },
  {
    id: 'msg-completion',
    key: 'completion',
    name: 'Certification Finale de Formation',
    channelId: 'chan-results',
    channelName: '#resultats-certifications',
    embedTitle: '🏆 Parfait Onboarding Terminé !',
    embedDescription: 'Bravo {user} ! Tu as complété l\'intégralité des modules sur **{server}**. Ton nouveau rôle a été attribué.',
    embedColor: '#a855f7',
    buttonLabel: '🎓 Voir mon certificat',
    enabled: true,
  },
];

class MessageService {
  private templates: BotMessageTemplate[] = [...initialBotTemplates];

  public getTemplates(): BotMessageTemplate[] {
    return this.templates;
  }

  public updateTemplate(id: string, updates: Partial<BotMessageTemplate>): BotMessageTemplate {
    const idx = this.templates.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.templates[idx] = { ...this.templates[idx], ...updates };
      return this.templates[idx];
    }
    throw new Error('Template non trouvé');
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
