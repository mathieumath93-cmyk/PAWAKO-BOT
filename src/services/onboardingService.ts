import { OnboardingFlowConfig, ModuleStepConfig, Quiz, QuizQuestion } from '../types';
import { roleService } from './roleService';
import { discordService } from './discordService';
import { store } from './store';

const STORAGE_KEY = 'pawako_onboarding_flow_config';
const COOLDOWN_STORAGE_KEY = 'pawako_member_quiz_cooldowns';

const defaultStepConfigs: ModuleStepConfig[] = [
  {
    moduleId: 'mod-1',
    moduleTitle: 'Module 1 : Onboarding & Culture',
    roleOnStartId: 'role-trainee',
    roleOnStartName: 'Trainee',
    roleOnPassId: 'role-junior',
    roleOnPassName: 'Junior',
    nextModuleId: 'mod-2',
    nextModuleTitle: 'Module 2 : Outils & Processus Internes',
    directivesText: 'Bienvenue dans le Module 1 ! Veuillez lire attentivement le guide complet ci-dessous et consulter la documentation externe.',
    externalLinkUrl: 'https://docs.pawako.com/onboarding-guide',
    successMessage: '🎉 Félicitations, tu as réussi le Quiz 1 avec un score de {score}/{maxScore} ! Tu as désormais accès au Module 2.',
    failureMessage: '❌ Score insuffisant ({score}/{maxScore}). Tu pourras faire une nouvelle tentative après un délai de {cooldown} minutes.',
  },
  {
    moduleId: 'mod-2',
    moduleTitle: 'Module 2 : Outils & Processus Internes',
    roleOnStartId: 'role-junior',
    roleOnStartName: 'Junior',
    roleOnPassId: 'role-senior',
    roleOnPassName: 'Senior',
    nextModuleId: 'mod-3',
    nextModuleTitle: 'Module 3 : Communication & Reporting',
    directivesText: 'Module 2 — Analyse des workflows internes et de la gestion des tickets. Consultez les règles de sécurité.',
    externalLinkUrl: 'https://docs.pawako.com/sec-guide',
    successMessage: '🎉 Félicitations, tu as validé le Module 2 avec le score de {score}/{maxScore} ! Clique ci-dessous pour lancer le Module 3.',
    failureMessage: '❌ Tu as obtenu {score}/{maxScore}. Révise les fiches sécurité puis réessaye dans {cooldown} minutes.',
  },
  {
    moduleId: 'mod-3',
    moduleTitle: 'Module 3 : Communication & Reporting',
    roleOnStartId: 'role-senior',
    roleOnStartName: 'Senior',
    roleOnPassId: 'role-certified',
    roleOnPassName: 'Certified',
    nextModuleId: 'mod-4',
    nextModuleTitle: 'Module 4 : Certification',
    directivesText: 'Module 3 — Bonnes pratiques de communication et reporting.',
    externalLinkUrl: 'https://docs.pawako.com/reporting',
    successMessage: '🎉 Excellent travail ! Score : {score}/{maxScore}. Passage au Module 4 débloqué.',
    failureMessage: '❌ Échec au quiz ({score}/{maxScore}). Cooldown de {cooldown} minutes activé.',
  },
];

const defaultConfig: OnboardingFlowConfig = {
  welcomeChannelName: '#bienvenue',
  welcomeButtonLabel: 'Commencer la formation',
  personalChannelPrefix: 'formation-',
  welcomeRulesMessage: `👋 **Bienvenue sur le serveur officiel PAWAKO FORMATION !**

Veuillez prendre connaissance des règles fondamentales avant de commencer :
1. 🤝 **Bienveillance & Entraide** : Respectez chaque membre de la communauté.
2. 🔒 **Confidentialité** : Ne divulguez pas d'informations sensibles.
3. ⚡ **Assiduité** : Complétez les modules à votre rythme.

Cliquez sur le bouton ci-dessous pour lancer le **Module 1** de votre formation !`,
  startTrainingButtonLabel: 'Lancer la formation',
  initialRoleId: 'role-trainee',
  initialRoleName: 'Trainee',
  cooldownMinutes: 15,
  randomizeQuestions: true,
  hideQuizSolutions: true,
  stepConfigs: defaultStepConfigs,
};

class OnboardingService {
  private config: OnboardingFlowConfig = this.loadConfig();

  private loadConfig(): OnboardingFlowConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultConfig, ...parsed };
      }
    } catch {
      // Ignore fallback
    }
    return { ...defaultConfig };
  }

  public getConfig(): OnboardingFlowConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<OnboardingFlowConfig>): OnboardingFlowConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore
    }
    return { ...this.config };
  }

  public getStepConfigForModule(moduleId: string): ModuleStepConfig {
    const existing = this.config.stepConfigs.find((s) => s.moduleId === moduleId);
    const mod = store.getModule(moduleId);
    const quiz = mod ? store.getQuiz(mod.quizId || '') : undefined;

    if (existing) {
      return {
        ...existing,
        moduleTitle: mod?.title || existing.moduleTitle,
        directivesText: mod?.content || existing.directivesText || 'Lisez les consignes attentivement avant de passer le quiz.',
        roleOnStartName: mod?.roleEnCoursName || existing.roleOnStartName || 'Trainee',
        roleOnPassName: mod?.roleValidatedName || existing.roleOnPassName || 'Junior',
        successMessage: quiz?.successMessage || existing.successMessage || '🎉 Félicitations, tu as réussi !',
        failureMessage: quiz?.failureMessage || existing.failureMessage || '❌ Score insuffisant. Réessaie après le cooldown.',
      };
    }

    return {
      moduleId,
      moduleTitle: mod?.title || 'Module de Formation',
      directivesText: mod?.content || 'Lisez les consignes attentivement avant de passer le quiz.',
      roleOnStartName: mod?.roleEnCoursName || 'Trainee',
      roleOnPassName: mod?.roleValidatedName || 'Junior',
      successMessage: quiz?.successMessage || '🎉 Félicitations, tu as réussi !',
      failureMessage: quiz?.failureMessage || '❌ Score insuffisant. Réessaie après le cooldown.',
    };
  }

  public updateStepConfig(step: ModuleStepConfig) {
    const steps = [...this.config.stepConfigs];
    const index = steps.findIndex((s) => s.moduleId === step.moduleId);
    if (index >= 0) {
      steps[index] = step;
    } else {
      steps.push(step);
    }
    this.updateConfig({ stepConfigs: steps });

    // Bi-directional sync with store module and quiz
    const mod = store.getModule(step.moduleId);
    if (mod) {
      store.updateModule(step.moduleId, {
        title: step.moduleTitle,
        content: step.directivesText || mod.content,
        roleEnCoursName: step.roleOnStartName || mod.roleEnCoursName,
        roleValidatedName: step.roleOnPassName || mod.roleValidatedName,
      });
      if (mod.quizId) {
        store.updateQuiz(mod.quizId, {
          successMessage: step.successMessage,
          failureMessage: step.failureMessage,
        });
      }
    }
  }

  /**
   * Return a randomized clone of a Quiz (QuizBot style):
   * Questions in random order, Options inside questions in random order, correct index updated.
   */
  public generateRandomizedQuiz(quiz: Quiz): Quiz {
    if (!this.config.randomizeQuestions) {
      return JSON.parse(JSON.stringify(quiz));
    }

    const quizCopy: Quiz = JSON.parse(JSON.stringify(quiz));

    // Shuffle questions
    const shuffledQuestions = [...quizCopy.questions].sort(() => Math.random() - 0.5);

    // Shuffle options inside each question & recalculate correctAnswer index
    const randomizedQuestions: QuizQuestion[] = shuffledQuestions.map((q) => {
      const originalCorrectOption = q.options[q.correctAnswer];
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      };
    });

    return {
      ...quizCopy,
      questions: randomizedQuestions,
    };
  }

  /**
   * Check if a member is currently cooling down after a quiz failure
   */
  public checkCooldown(memberName: string, quizId: string): { isCoolingDown: boolean; remainingMinutes: number } {
    try {
      const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (stored) {
        const cooldowns: Record<string, number> = JSON.parse(stored);
        const key = `${memberName.toLowerCase()}_${quizId}`;
        const expiresAt = cooldowns[key];
        if (expiresAt && Date.now() < expiresAt) {
          const remainingMinutes = Math.ceil((expiresAt - Date.now()) / (1000 * 60));
          return { isCoolingDown: true, remainingMinutes };
        }
      }
    } catch {
      // Ignore
    }
    return { isCoolingDown: false, remainingMinutes: 0 };
  }

  /**
   * Record a quiz failure cooldown (e.g. 15 mins)
   */
  public recordCooldown(memberName: string, quizId: string, durationMinutes: number = 15) {
    try {
      const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      const cooldowns: Record<string, number> = stored ? JSON.parse(stored) : {};
      const key = `${memberName.toLowerCase()}_${quizId}`;
      const expiresAt = Date.now() + durationMinutes * 60 * 1000;
      cooldowns[key] = expiresAt;
      localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
    } catch {
      // Ignore
    }
  }

  /**
   * Reset cooldown for a member (e.g. when admin grants retry)
   */
  public resetCooldown(memberName: string, quizId: string) {
    try {
      const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (stored) {
        const cooldowns: Record<string, number> = JSON.parse(stored);
        const key = `${memberName.toLowerCase()}_${quizId}`;
        delete cooldowns[key];
        localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
      }
    } catch {
      // Ignore
    }
  }
}

export const onboardingService = new OnboardingService();
