import { OnboardingFlowConfig, ModuleStepConfig, Quiz, QuizQuestion } from '../types';
import { roleService } from './roleService';
import { discordService } from './discordService';
import { store } from './store';
import { firebaseSyncService } from './firebaseSyncService';

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
  initialRoleName: '',
  cooldownMinutes: 15,
  randomizeQuestions: true,
  hideQuizSolutions: true,
  toolsFormationMeetUrl: 'https://meet.google.com/pawako-tools-formation',
  mahsaDiscordId: '',
  mathieuDiscordId: '',
  stepConfigs: defaultStepConfigs,
  autoReminders: {
    enabled: false,
    thresholdHours: [2, 6, 8, 24],
    unstartedMessage: '👋 Coucou <@{discordId}> ! Ton salon privé de formation est prêt. N\'oublie pas de cliquer sur **"{buttonLabel}"** pour débuter ton parcours !',
    unfinishedQuizMessage: '⏰ Coucou <@{discordId}> ! Tu as démarré le module **{moduleTitle}** mais ton quiz n\'est pas encore terminé. N\'hésite pas à y répondre pour débloquer la suite !',
    unstartedPool: [
      "👋 Salut <@{discordId}> ! Ton salon privé est prêt. C'est le moment idéal pour cliquer sur **\"{buttonLabel}\"** et débloquer ton Module 1 pour lancer tes premiers revenus ! 💸",
      "⚡ <@{discordId}>, ne repousse pas tes opportunités à demain ! Lance ton **Module 1** dès maintenant et débute ta formation ! 🚀",
      "💼 <@{discordId}>, chaque jour compte pour faire fructifier tes compétences. Ton Module 1 t'attend dans ton salon privé ! 🏆",
      "☀️ Coucou <@{discordId}> ! Prêt(e) à passer à l'action ? Un simple clic sur **\"{buttonLabel}\"** et ta formation commence immédiatement ! 🎯",
      "🔥 <@{discordId}>, l'équipe PAWAKO est prête à t'accompagner. Débloque ton premier cours et rejoins ceux qui avancent déjà ! 💸"
    ],
    inProgress2hPool: [
      "🎯 Rappel rapide <@{discordId}> : Ton module **{moduleTitle}** t'attend ! Relis tes fiches et valide ton quiz pour débloquer la suite ! 🚀",
      "⚡ <@{discordId}>, tu es sur la bonne voie ! Prends 5 minutes pour achever le quiz du **{moduleTitle}** et valider tes acquis. 💸",
      "📚 Coucou <@{discordId}>, tes révisions sur **{moduleTitle}** sont prêtes. Passe ton quiz et franchis cette nouvelle étape ! 🏆",
      "🔥 <@{discordId}>, ne laisse pas tiédir ta motivation ! Ton quiz **{moduleTitle}** est disponible, tente ta chance ! 🎯",
      "💡 <@{discordId}>, un petit effort supplémentaire sur **{moduleTitle}** et tu débloques le niveau supérieur ! 💼"
    ],
    inProgress6hPool: [
      "💸 <@{discordId}>, ne laisse pas l'argent sur la table ! Reconnecte-toi et valide le quiz du **{moduleTitle}** dès aujourd'hui ! 🚀",
      "⚡ <@{discordId}>, 6h sans avancer ? C'est le moment de relire ton cours **{moduleTitle}** et de réussir ton quiz ! 🎯",
      "🏆 <@{discordId}>, la régularité est le secret de la réussite. Reprends le **{moduleTitle}** et débloque le rôle suivant ! 💼",
      "🔥 Coucou <@{discordId}> ! Ton quiz sur **{moduleTitle}** n'attend que toi. Un dernier coup de collier pour réussir ! 💸",
      "📚 <@{discordId}>, garde ton cap ! Une relecture attentive de **{moduleTitle}** et tu valides le quiz sans problème. 🚀"
    ],
    inProgress12hPool: [
      "🚀 <@{discordId}>, pendant que d'autres hésitent, toi tu te formes ! Relance ton quiz **{moduleTitle}** et valide ta progression. 💸",
      "💼 <@{discordId}>, il est temps d'investir dans tes connaissances. Reprends **{moduleTitle}** et décroche ton score minimum ! 🎯",
      "⚡ <@{discordId}>, ne reste pas bloqué(e) ! Relis le cours du **{moduleTitle}** et retente ta chance pour débloquer la suite ! 🏆",
      "🔥 <@{discordId}>, la réussite t'attend au bout du quiz **{moduleTitle}**. Tu as toutes les clés pour y arriver ! 💸",
      "📚 Coucou <@{discordId}> ! Un petit rappel pour ton **{moduleTitle}**. Reconnecte-toi et montre ce que tu sais faire ! 🚀"
    ],
    inProgress24hPool: [
      "🏆 <@{discordId}>, rappel important : ton accès au quiz **{moduleTitle}** est toujours actif. Valide-le pour poursuivre ta formation ! 💸",
      "⚡ <@{discordId}>, 24h d'inactivité ! Relance tes révisions sur **{moduleTitle}** et valide ton quiz pour intégrer l'équipe ! 🚀",
      "💼 <@{discordId}>, tes objectifs financiers n'attendent pas ! Prends 10 minutes pour réussir le **{moduleTitle}** aujourd'hui ! 🎯",
      "🔥 <@{discordId}>, ne baisse pas les bras sur **{moduleTitle}** ! Relis les points clés du module et décroche ta validation ! 🏆",
      "📚 Coucou <@{discordId}> ! L'équipe PAWAKO compte sur toi. Valide le quiz **{moduleTitle}** et passe au niveau supérieur ! 💸"
    ],
  },
  repeatedFailurePool: [
    "⚠️ **Conseil Formation PAWAKO**\n\n<@{discordId}>, nous avons remarqué que tu as 2 échecs ou plus au quiz **{quizTitle}**.\n💡 *Notre conseil :* Ne te précipite pas ! Prends le temps de relire attentivement et de maîtriser l'intégralité du module avant de relancer un essai. La clé du succès réside dans la compréhension des concepts, pas dans la vitesse. Bon courage ! 📚",
    "🧠 **Prends un temps de pause et révise !**\n\n<@{discordId}>, 2 tentatives sans validation sur **{quizTitle}**. Pas de panique ! C'est le signe qu'il faut revoir en profondeur les fiches de cours.\n💡 Note les points importants sur un cahier, assimile bien les notions et retente ta chance avec sérénité. Tu vas y arriver ! 💪",
    "📖 **Maîtrise du Module Avant Prochaine Tentative**\n\n<@{discordId}>, tu viens d'enchaîner 2 essais non validés sur **{quizTitle}**.\n💡 Prends 15 à 20 minutes pour relire calmement chaque paragraphe du support de cours. S'assurer de bien comprendre chaque règle est le moyen le plus rapide de réussir le quiz du premier coup à la prochaine tentative ! 🎯",
    "🎓 **Message de soutien du Staff PAWAKO**\n\n<@{discordId}>, le quiz **{quizTitle}** te résiste après 2 essais ? C'est tout à fait normal de rencontrer des difficultés, mais ne répète pas les mêmes erreurs.\n💡 Relis attentivement le module ligne par ligne, prends des notes et assure-toi d'être à 100% sûr(e) de tes connaissances avant de relancer. L'équipe est avec toi ! 🏆",
    "💡 **Méthode conseillée pour valider ton Quiz**\n\n<@{discordId}>, à partir de 2 échecs sur **{quizTitle}**, nous t'invitons à modifier ta stratégie :\n1️⃣ Relis l'ensemble du module sans sauter de chapitre.\n2️⃣ Assure-toi de comprendre la logique de chaque consigne.\n3️⃣ Lance le quiz uniquement lorsque tu te sens prêt(e) à 100% !\nCourage, la validation est à portée de main ! 🚀"
  ],
  cooldownSpamPool: [
    "🤖 *Woah, doucement sur le bouton <@{discordId}> ! Même en cliquant 100 fois par seconde, le chrono ne va pas s'accélérer... Respire, relis ton cours et repasse dans <t:{tsSec}:R> !*",
    "⚡ *Bip bip ! Tentative de piratage du chrono détectée par le serveur... Spoiler : ça ne marche pas ! Profites-en plutôt pour réviser ton module jusqu'à <t:{tsSec}:R> !*",
    "☕ *Oula, mollo le ninja du mulot ! Cliquer 50 fois n'effacera pas le cooldown. Prends un café, relis les fiches de formation et reviens <t:{tsSec}:R>.*",
    "🎯 *Quelle cadence de clics phénoménale ! Dommage que ça ne donne aucun point bonus pour passer le cooldown. Déblocage automatique <t:{tsSec}:R> !*",
    "🛑 *Erreur 404 : Le bouton 'Passer le cooldown' n'existe toujours pas ! Tes révisions t'attendent en attendant <t:{tsSec}:R>.*"
  ],
  sarcasticSpamMessages: [
    "🤖 *Doucement sur les clics ! Le bouton n'a rien fait de mal et mes circuits imprimés commencent à fumer.*",
    "⚡ *Alerte mitraillage ! À ce rythme-là, tu vas démonter ton mulot avant d'avoir atteint le Module 2.*",
    "☕ *Oula, mollo le ninja du mulot ! Prends une grande inspiration et un café, les données restent bien au chaud.*",
    "🎯 *Quelle cadence de clics phénoménale ! Dommage que ça ne donne aucun point bonus pour valider le quiz.*",
    "🛑 *Keep calm ! Cliquer 50 fois la seconde ne va pas débloquer la suite plus vite, promis juré !*"
  ],
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
      initialRoleName: '',
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

    // Direct synchronization: module URL takes priority if present
    const effectiveLinkUrl = mod?.url || (mod?.resources && mod.resources[0]?.url) || existing?.externalLinkUrl || '';

    if (existing) {
      return {
        ...existing,
        moduleTitle: mod?.title || existing.moduleTitle,
        directivesText: mod?.content || existing.directivesText || 'Lisez les consignes attentivement avant de passer le quiz.',
        externalLinkUrl: effectiveLinkUrl,
        delayMinutesBeforeQuiz: existing.delayMinutesBeforeQuiz ?? quiz?.delayMinutesBeforeQuiz ?? 0,
        roleOnStartName: existing.roleOnStartName || mod?.roleEnCoursName || '',
        roleOnPassName: existing.roleOnPassName || mod?.roleValidatedName || '',
        successMessage: quiz?.successMessage || existing.successMessage || '🎉 Félicitations, tu as réussi !',
        failureMessage: quiz?.failureMessage || existing.failureMessage || '❌ Score insuffisant. Réessaie après le cooldown.',
      };
    }

    return {
      moduleId,
      moduleTitle: mod?.title || 'Module de Formation',
      directivesText: mod?.content || 'Lisez les consignes attentivement avant de passer le quiz.',
      externalLinkUrl: effectiveLinkUrl,
      delayMinutesBeforeQuiz: quiz?.delayMinutesBeforeQuiz ?? 0,
      roleOnStartName: mod?.roleEnCoursName || '',
      roleOnPassName: mod?.roleValidatedName || '',
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
      const updatedMod = store.updateModule(step.moduleId, {
        title: step.moduleTitle,
        content: step.directivesText || mod.content,
        url: step.externalLinkUrl || mod.url,
        roleEnCoursName: step.roleOnStartName || mod.roleEnCoursName,
        roleValidatedName: step.roleOnPassName || mod.roleValidatedName,
      });
      firebaseSyncService.saveModule(updatedMod).catch(() => {});

      const quiz = mod.quizId ? store.getQuiz(mod.quizId) : store.getQuizzes().find((q) => q.moduleId === step.moduleId);
      if (quiz) {
        const updatedQuiz = store.updateQuiz(quiz.id, {
          delayMinutesBeforeQuiz: step.delayMinutesBeforeQuiz ?? quiz.delayMinutesBeforeQuiz,
          successMessage: step.successMessage || quiz.successMessage,
          failureMessage: step.failureMessage || quiz.failureMessage,
        });
        firebaseSyncService.saveQuiz(updatedQuiz).catch(() => {});
      }
    }

    firebaseSyncService.saveOnboardingConfig(this.config).catch(() => {});
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
