import { OnboardingFlowConfig, ModuleStepConfig, Quiz, QuizQuestion } from '../types';
import { roleService } from './roleService';
import { discordService } from './discordService';
import { store } from './store';

const STORAGE_KEY = 'pawako_onboarding_flow_config';
const COOLDOWN_STORAGE_KEY = 'pawako_member_quiz_cooldowns';

const defaultStepConfigs: ModuleStepConfig[] = [];

const defaultConfig: OnboardingFlowConfig = {
  welcomeChannelName: '#bienvenue',
  welcomeButtonLabel: 'Commencer la formation',
  personalChannelPrefix: 'formation-',
  welcomeRulesMessage: `👋 Bienvenue sur notre serveur !\n\nVeuillez prendre connaissance des informations ci-dessous avant de cliquer sur le bouton pour lancer votre parcours.`,
  startTrainingButtonLabel: 'Lancer la formation',
  initialRoleId: '',
  initialRoleName: 'Nouveau membre',
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

  public resetToBlankSlate(): OnboardingFlowConfig {
    const blankConfig: OnboardingFlowConfig = {
      welcomeChannelName: '#bienvenue',
      welcomeButtonLabel: 'Commencer la formation',
      personalChannelPrefix: 'formation-',
      welcomeRulesMessage: `👋 Bienvenue sur notre serveur !\n\nVeuillez prendre connaissance des informations ci-dessous avant de cliquer sur le bouton pour lancer votre parcours.`,
      startTrainingButtonLabel: 'Lancer la formation',
      initialRoleId: '',
      initialRoleName: 'Nouveau membre',
      cooldownMinutes: 15,
      randomizeQuestions: true,
      hideQuizSolutions: true,
      stepConfigs: [],
    };
    this.config = blankConfig;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blankConfig));
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
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
        externalLinkUrl: existing.externalLinkUrl || mod?.url || (mod?.resources && mod.resources[0]?.url) || '',
        roleOnStartName: mod?.roleEnCoursName || existing.roleOnStartName || 'En cours',
        roleOnPassName: mod?.roleValidatedName || existing.roleOnPassName || 'Validé',
        successMessage: quiz?.successMessage || existing.successMessage || '🎉 Félicitations, tu as réussi !',
        failureMessage: quiz?.failureMessage || existing.failureMessage || '❌ Score insuffisant. Réessaie après le cooldown.',
      };
    }

    return {
      moduleId,
      moduleTitle: mod?.title || 'Module de Formation',
      directivesText: mod?.content || 'Lisez les consignes attentivement avant de passer le quiz.',
      externalLinkUrl: mod?.url || (mod?.resources && mod.resources[0]?.url) || '',
      roleOnStartName: mod?.roleEnCoursName || 'En cours',
      roleOnPassName: mod?.roleValidatedName || 'Validé',
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
        url: step.externalLinkUrl || mod.url,
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
