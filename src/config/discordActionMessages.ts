import { Member } from '../types';

export type CandidateRoleProfile =
  | 'onboarding_new'
  | 'module1_validated'
  | 'intermediate_learner'
  | 'simulation_ready'
  | 'tools_training'
  | 'cooldown_assistance'
  | 'inactivity_reminder'
  | 'default';

export type DiscordActionType =
  | 'schedule_simulation_14h'
  | 'validate_simulation'
  | 'reschedule_simulation'
  | 'reschedule_tools'
  | 'reset_cooldown'
  | 'kick_inactivity'
  | 'direct_message_reminder';

export interface ActionMessageTemplate {
  action: DiscordActionType;
  roleProfile: CandidateRoleProfile;
  label: string;
  badge: string;
  title: string;
  content: string; // Mention format template
  description: string; // Rich embed text template
  footer: string;
  color: number;
  suggestedDmText: string;
}

export interface ResolvedActionMessage {
  action: DiscordActionType;
  roleProfile: CandidateRoleProfile;
  label: string;
  title: string;
  content: string;
  description: string;
  footer: string;
  color: number;
  suggestedDmText: string;
}

/**
 * Identify the exact candidate role and progress profile based on their active roles,
 * state, and completed modules count.
 */
export function determineCandidateRoleProfile(member: Member): CandidateRoleProfile {
  if (!member) return 'default';

  const roles = (member.roles || []).map((r) => String(r).toLowerCase());
  const progressVals = Object.values(member.progress || {});
  const completedCount = progressVals.filter((p) => p.status === 'valide').length;
  const isCooldown = Boolean(
    member.cooldownUntilTimestamp && member.cooldownUntilTimestamp > Date.now()
  );

  // Check specific state flags
  if (member.candidateState === 'expulse_inactivite') {
    return 'inactivity_reminder';
  }

  if (member.candidateState === 'formation_outils' || roles.some((r) => r.includes('outil') || r.includes('m5 validé'))) {
    return 'tools_training';
  }

  if (
    member.candidateState === 'simulation' ||
    completedCount >= 4 ||
    roles.some((r) => r.includes('m4 validé') || r.includes('simulation'))
  ) {
    return 'simulation_ready';
  }

  if (isCooldown) {
    return 'cooldown_assistance';
  }

  if (member.autoReminderFlag) {
    return 'inactivity_reminder';
  }

  if (completedCount >= 2 || roles.some((r) => r.includes('m2 validé') || r.includes('m3 validé'))) {
    return 'intermediate_learner';
  }

  if (completedCount >= 1 || roles.some((r) => r.includes('m1 validé'))) {
    return 'module1_validated';
  }

  if (roles.some((r) => r.includes('new') || r.includes('candidat') || r.includes('nouveau')) || completedCount === 0) {
    return 'onboarding_new';
  }

  return 'default';
}

/**
 * Comprehensive mapping of unique, role-specific message templates for Discord actions
 */
export const DISCORD_ACTION_MESSAGES_CONFIG: Record<
  DiscordActionType,
  Partial<Record<CandidateRoleProfile, ActionMessageTemplate>> & { default: ActionMessageTemplate }
> = {
  // --- 1. PROGRAMMER CONVOCATION SIMULATION 14H ---
  schedule_simulation_14h: {
    simulation_ready: {
      action: 'schedule_simulation_14h',
      roleProfile: 'simulation_ready',
      label: 'Convocation Simulation (Tous Modules Validés)',
      badge: '🏆 Élite / Prêt',
      title: '🏆 TOUS LES MODULES VALIDÉS — CONVOCATION TEST DE SIMULATION (14h00 HF)',
      content: '🏆 **[CONVOCATION OFFICIELLE SIMULATION 14H00 HF]** <@{discordUserId}>',
      description:
        '📢 Félicitations <@{discordUserId}> ! Tu as complété avec succès l\'ensemble des modules théoriques de la formation Pawako. 🎓\n\n' +
        'Ton profil est désormais qualifié pour l\'épreuve pratique finale : le **Test de Simulation en direct**.\n\n' +
        '📅 **Date & Heure :** <t:{timestampSec}:F> (<t:{timestampSec}:R>) — **14h00 (Heure Française - HF)**\n' +
        '📍 **Lieu :** Ce salon privé avec l\'équipe d\'encadrement Staff.\n\n' +
        '🔔 *Consignes : Assure-toi d\'avoir un micro fonctionnel et d\'être connecté(e) 5 minutes à l\'avance.* 🚀',
      footer: 'PAWAKO FORMATION • Épreuve Finale de Simulation 14h00 HF',
      color: 0x3b82f6,
      suggestedDmText:
        'Félicitations pour la validation de tes modules ! Ton test de simulation est programmé pour le {dateFormatted} à 14h00 HF. Sois prêt(e) avec ton micro.',
    },
    intermediate_learner: {
      action: 'schedule_simulation_14h',
      roleProfile: 'intermediate_learner',
      label: 'Convocation Simulation Anticipée (Candidat Avancé)',
      badge: '⚡ Accéléré',
      title: '⚡ CONVOCATION SIMULATION ANTICIPÉE (14h00 HF)',
      content: '⚡ **[CONVOCATION ANTICIPÉE SIMULATION 14H00 HF]** <@{discordUserId}>',
      description:
        '📢 Bravo <@{discordUserId}> pour ta progression rapide sur les modules intermédiaires !\n\n' +
        'L\'équipe Staff a validé ton passage accéléré vers le **Test de Simulation** :\n\n' +
        '📅 **Date & Heure :** <t:{timestampSec}:F> (<t:{timestampSec}:R>) — **14h00 (Heure Française - HF)**\n' +
        '📍 **Lieu :** Ce salon privé d\'évaluation.\n\n' +
        '💡 *Révise bien les cas pratiques avant l\'heure du rendez-vous.* Bon courage ! 🚀',
      footer: 'PAWAKO FORMATION • Parcours Accéléré Staff',
      color: 0x6366f1,
      suggestedDmText:
        'Bravo pour ta progression rapide ! L\'équipe a planifié ta simulation anticipée pour le {dateFormatted} à 14h00 HF.',
    },
    onboarding_new: {
      action: 'schedule_simulation_14h',
      roleProfile: 'onboarding_new',
      label: 'Convocation Simulation (Nouveau Candidat)',
      badge: '🌱 Onboarding',
      title: '🎯 PLANIFICATION INITIALE — RDV DE SIMULATION PRÉVU (14h00 HF)',
      content: '🎯 **[PLANIFICATION OBJECTIF SIMULATION]** <@{discordUserId}>',
      description:
        '📢 Bienvenue <@{discordUserId}> !\n\n' +
        'Ton parcours de formation intègre un jalon clé : le **Test de Simulation à 14h00 HF**.\n\n' +
        '📅 **Date prévisionnelle :** <t:{timestampSec}:F> (<t:{timestampSec}:R>)\n\n' +
        '🎯 *Objectif : Termine tes modules et quiz avant cette date pour valider ta convocation finale.* L\'équipe reste disponible pour toute question !',
      footer: 'PAWAKO FORMATION • Accueil & Objectif Parcours',
      color: 0x0ea5e9,
      suggestedDmText:
        'Bienvenue chez Pawako ! Ta session de simulation cible a été fixée au {dateFormatted} à 14h00 HF. Pense à avancer sur tes cours.',
    },
    default: {
      action: 'schedule_simulation_14h',
      roleProfile: 'default',
      label: 'Convocation Simulation Standard (14h00 HF)',
      badge: '📅 Standard',
      title: '🏆 CONVOCATION OFFICIELLE — TEST DE SIMULATION (14h00 HF)',
      content: '🏆 **[CONVOCATION RDV SIMULATION 14H00 HF]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **ton rendez-vous pour le Test de Simulation en direct est confirmé !** 🏆\n\n' +
        '📅 **Date & Heure :** <t:{timestampSec}:F> (<t:{timestampSec}:R>) — **14h00 (Heure Française - HF)**\n' +
        '📍 **Lieu :** Ce salon privé avec l\'équipe Staff.\n\n' +
        '🔔 *Un rappel automatique te sera envoyé à l\'heure du rendez-vous. Sois bien connecté(e) et prêt(e) avec ton micro !* 🚀',
      footer: 'PAWAKO FORMATION • Convocation Test Simulation 14h00 HF',
      color: 0x3b82f6,
      suggestedDmText:
        'Ton rendez-vous pour le Test de Simulation est programmé pour le {dateFormatted} à 14h00 HF.',
    },
  },

  // --- 2. VALIDER SIMULATION ➡️ FORMATION OUTILS 10H ---
  validate_simulation: {
    simulation_ready: {
      action: 'validate_simulation',
      roleProfile: 'simulation_ready',
      label: 'Validation Simulation (Accès Formation Outils 10h)',
      badge: '🎓 Certifié',
      title: '🏆 TEST DE SIMULATION VALIDÉ AVEC SUCCÈS ! ➡️ FORMATION OUTILS (10h00 HF)',
      content: '🏆 **[TEST DE SIMULATION VALIDÉ AVEC SUCCÈS]** <@{discordUserId}>',
      description:
        'Félicitations <@{discordUserId}> ! Tu as validé ton test de simulation en direct avec brio. 👏✨\n\n' +
        'Tu passes à l\'étape ultime avant la prise de poste : la **Formation aux Outils de travail**.\n\n' +
        '📅 **Prochain RDV :** <t:{timestampSec}:F> (<t:{timestampSec}:R>) — **10h00 (Heure Française - HF)**\n' +
        '🔊 **Salon Vocal Discord :** {voiceLink}\n' +
        '🔗 **Lien Visio Google Meet (secours) :** [Rejoindre la visio]({meetUrl})\n\n' +
        '💡 *L\'équipe Staff t\'accueillera à 10h00 HF. Prépare ton micro et ton espace de travail !* 🚀',
      footer: 'PAWAKO FORMATION • Validation Simulation & Session Outils 10h00 HF',
      color: 0x10b981,
      suggestedDmText:
        'Félicitations ! Tu as validé ton test de simulation avec succès. Prochain RDV : Formation Outils demain à 10h00 HF.',
    },
    tools_training: {
      action: 'validate_simulation',
      roleProfile: 'tools_training',
      label: 'Confirmation Formation Outils (En Cours)',
      badge: '🛠️ Outils',
      title: '🛠️ CONFIRMATION DE VALIDATION SIMULATION & RAPPEL SESSION OUTILS',
      content: '🛠️ **[CONFIRMATION SIMULATION & SESSION OUTILS]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, ton statut pour la **Formation aux Outils** est validé et actif !\n\n' +
        '📅 **Session fixée à :** <t:{timestampSec}:F> (<t:{timestampSec}:R>) — **10h00 HF**\n' +
        '🔊 **Salon vocal :** {voiceLink}\n\n' +
        '💡 *Sois ponctuel(le) pour l\'attribution de tes identifiants et accès logiciels.*',
      footer: 'PAWAKO FORMATION • Finalisation Outils & Prise de Poste',
      color: 0x8b5cf6,
      suggestedDmText:
        'Ta validation de simulation est enregistrée et ta session Formation Outils est confirmée pour le {dateFormatted} à 10h00 HF.',
    },
    default: {
      action: 'validate_simulation',
      roleProfile: 'default',
      label: 'Validation Simulation Standard (10h00 HF)',
      badge: '🏆 Validé',
      title: '🏆 SIMULATION VALIDÉE AVEC SUCCÈS ! ➡️ PROCHAINE ÉTAPE : FORMATION OUTILS (10h00 HF)',
      content: '🏆 **[SIMULATION VALIDÉE — CONVOCATION FORMATION OUTILS 10H00 HF]** <@{discordUserId}>',
      description:
        'Félicitations <@{discordUserId}> ! Tu as validé avec succès ton test de simulation en direct avec l\'équipe Staff ! 👏\n\n' +
        '📅 **Prochaine étape finale : La Formation aux Outils de travail**\n' +
        '⏰ **Date & Heure :** <t:{timestampSec}:F> (<t:{timestampSec}:R>) — **10h00 (Heure Française - HF)**\n' +
        '🔊 **Salon Vocal Discord :** {voiceLink}\n' +
        '🔗 **Lien Google Meet (secours) :** [Rejoindre la visio]({meetUrl})\n\n' +
        '💡 *L\'équipe Staff t\'accueillera à 10h00 HF. Prépare ton micro et sois bien ponctuel(le) !* 🚀',
      footer: 'PAWAKO FORMATION • Validation Simulation & Session Outils 10h00 HF',
      color: 0x10b981,
      suggestedDmText:
        'Félicitations pour la validation de ta simulation ! Ta Formation aux Outils est fixée à 10h00 HF.',
    },
  },

  // --- 3. REPROGRAMMER SIMULATION ---
  reschedule_simulation: {
    simulation_ready: {
      action: 'reschedule_simulation',
      roleProfile: 'simulation_ready',
      label: 'Reprogrammation Simulation (Prêt)',
      badge: '📅 Reprog Simu',
      title: '📅 CONVOCATION REPROGRAMMÉE — TEST DE SIMULATION (14h00 HF)',
      content: '📅 **[CONVOCATION SIMULATION REPROGRAMMÉE]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **ton rendez-vous pour le Test de Simulation a été reprogrammé !** 🏆\n\n' +
        'L\'équipe d\'encadrement Staff (**{adminName}**) a fixé ton nouveau créneau d\'évaluation pour :\n\n' +
        '🗓️ **<t:{timestampSec}:F>** (<t:{timestampSec}:R>) — **14h00 (Heure Française - HF)**\n' +
        '*(Date : {dateFormatted})*\n\n' +
        '📍 **Lieu :** Ce salon privé avec l\'équipe Staff.\n\n' +
        '🔔 *Un rappel automatique te sera envoyé à l\'heure du rendez-vous. Sois bien connecté(e) et prêt(e) avec ton micro !* 🚀',
      footer: 'PAWAKO FORMATION • Reprogrammation Convocation Simulation 14h00 HF',
      color: 0x3b82f6,
      suggestedDmText:
        'Ton rendez-vous pour le test de simulation a été reprogrammé par le staff pour le {dateFormatted} à 14h00 HF.',
    },
    intermediate_learner: {
      action: 'reschedule_simulation',
      roleProfile: 'intermediate_learner',
      label: 'Report Simulation (Délai d\'Étude Accordé)',
      badge: '📚 Révisions',
      title: '📅 REPORT ACCORDÉ — TEST DE SIMULATION DÉCALÉ (14h00 HF)',
      content: '📅 **[DÉLAI ACCORDÉ — REPROGRAMMATION SIMULATION]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, afin de te permettre de consolider tes fiches de cours, l\'équipe Staff (**{adminName}**) a décalé ton épreuve de simulation :\n\n' +
        '🗓️ **Nouveau rendez-vous : <t:{timestampSec}:F>** (<t:{timestampSec}:R>)\n\n' +
        '💡 *Mets à profit ce temps supplémentaire pour revoir les scénarios clients !* Bon courage ! 🚀',
      footer: 'PAWAKO FORMATION • Aménagement & Révisions',
      color: 0x8b5cf6,
      suggestedDmText:
        'Ton rendez-vous de simulation a été décalé au {dateFormatted} à 14h00 HF pour te donner le temps de bien réviser.',
    },
    default: {
      action: 'reschedule_simulation',
      roleProfile: 'default',
      label: 'Reprogrammation Simulation Standard',
      badge: '📅 Reprog',
      title: '📅 CONVOCATION REPROGRAMMÉE — TEST DE SIMULATION (14h00 HF)',
      content: '📅 **[CONVOCATION SIMULATION REPROGRAMMÉE]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **ton rendez-vous pour le Test de Simulation a été reprogrammé par le Staff ({adminName}) !**\n\n' +
        '🗓️ **<t:{timestampSec}:F>** (<t:{timestampSec}:R>) — **14h00 (Heure Française - HF)**\n\n' +
        '📍 **Lieu :** Ce salon privé avec l\'équipe Staff.\n' +
        '🔔 *Sois bien connecté(e) et prêt(e) avec ton micro !* 🚀',
      footer: 'PAWAKO FORMATION • Reprogrammation Convocation Simulation',
      color: 0x3b82f6,
      suggestedDmText:
        'Ton rendez-vous pour le test de simulation a été reprogrammé au {dateFormatted} à 14h00 HF.',
    },
  },

  // --- 4. REPROGRAMMER FORMATION OUTILS ---
  reschedule_tools: {
    tools_training: {
      action: 'reschedule_tools',
      roleProfile: 'tools_training',
      label: 'Reprogrammation Session Outils (10h00 HF)',
      badge: '🛠️ Outils 10h',
      title: '📅 REPROGRAMMATION — SESSION FORMATION AUX OUTILS (10h00 HF)',
      content: '📅 **[SESSION FORMATION OUTILS REPROGRAMMÉE]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **ta session de Formation aux Outils a été reprogrammée !** 🛠️\n\n' +
        'L\'équipe d\'encadrement Staff (**{adminName}**) a fixé ton nouveau créneau pour :\n\n' +
        '🗓️ **<t:{timestampSec}:F>** (<t:{timestampSec}:R>) — **10h00 (Heure Française - HF)**\n' +
        '*(Date : {dateFormatted})*\n\n' +
        '📍 **Lieu :** Salon vocal Discord / lien Google Meet.\n\n' +
        '🔔 *Un rappel avec les liens vocaux te sera transmis à l\'heure pile du rendez-vous. Sois ponctuel(le) !* 🚀',
      footer: 'PAWAKO FORMATION • Reprogrammation Formation Outils 10h00 HF',
      color: 0x8b5cf6,
      suggestedDmText:
        'Ta session Formation Outils a été reprogrammée par le staff pour le {dateFormatted} à 10h00 HF.',
    },
    default: {
      action: 'reschedule_tools',
      roleProfile: 'default',
      label: 'Reprogrammation Formation Outils Standard',
      badge: '📅 Reprog Outils',
      title: '📅 REPROGRAMMATION — SESSION FORMATION AUX OUTILS (10h00 HF)',
      content: '📅 **[SESSION FORMATION OUTILS REPROGRAMMÉE]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, ta session de Formation aux Outils a été reprogrammée par l\'équipe Staff ({adminName}) :\n\n' +
        '🗓️ **<t:{timestampSec}:F>** (<t:{timestampSec}:R>) — **10h00 (Heure Française - HF)**\n\n' +
        '📍 **Lieu :** Salon vocal Discord / Google Meet.\n' +
        '🔔 *Sois ponctuel(le) avec ton micro actif !* 🚀',
      footer: 'PAWAKO FORMATION • Reprogrammation Formation Outils',
      color: 0x8b5cf6,
      suggestedDmText:
        'Ta session Formation Outils a été déplacée au {dateFormatted} à 10h00 HF.',
    },
  },

  // --- 5. ANNULER COOLDOWN ---
  reset_cooldown: {
    onboarding_new: {
      action: 'reset_cooldown',
      roleProfile: 'onboarding_new',
      label: 'Déblocage Cooldown Onboarding (Module 1)',
      badge: '🌱 Déblocage M1',
      title: '⚡ DÉBLOCAGE SPÉCIAL : COOLDOWN ONBOARDING ANNULÉ',
      content: '⚡ **[COOLDOWN LEVÉ — MODULE INITIAL DÉBLOQUÉ]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **l\'équipe Staff a levé ton délai d\'attente pour ton quiz d\'onboarding !** ⚡\n\n' +
        'Tu as le droit à une nouvelle tentative immédiate pour valider les bases de formation.\n\n' +
        '💡 *Conseil : Prends le temps de relire tranquillement les consignes avant de cliquer.* Bon courage ! 🚀',
      footer: 'PAWAKO FORMATION • Accompagnement Onboarding Débutant',
      color: 0xf59e0b,
      suggestedDmText:
        'Ton cooldown a été annulé par le staff. Tu peux relancer ton quiz d\'onboarding dès maintenant sur ton espace membre !',
    },
    intermediate_learner: {
      action: 'reset_cooldown',
      roleProfile: 'intermediate_learner',
      label: 'Déblocage Cooldown Technique (Modules 2 à 4)',
      badge: '⚡ Déblocage Quiz',
      title: '⚡ DÉBLOCAGE SPÉCIAL : COOLDOWN ANNULÉ PAR LE STAFF',
      content: '⚡ **[COOLDOWN ANNULÉ — NOUVELLE TENTATIVE AUTORISÉE]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **l\'équipe d\'encadrement Staff a réinitialisé ton délai d\'attente (cooldown) !** ⚡\n\n' +
        'Tu peux dès maintenant repasser ton évaluation / quiz sans attendre le temps restant réglementaire.\n\n' +
        '🎯 **Statut :** Nouvelle tentative autorisée immédiatement !\n\n' +
        '👉 *Rends-toi dans ton espace membre Pawako pour démarrer ta tentative.* 🚀\n\n' +
        '💡 *Conseil : Prends le temps de relire attentivement tes fiches de cours pour maximiser tes chances de réussite.*',
      footer: 'PAWAKO FORMATION • Déblocage Exceptionnel Staff',
      color: 0xf59e0b,
      suggestedDmText:
        'Ton délai de cooldown est réinitialisé ! Tu peux repasser ton quiz immédiatement sans attendre.',
    },
    simulation_ready: {
      action: 'reset_cooldown',
      roleProfile: 'simulation_ready',
      label: 'Déblocage Examen Final / Quiz Ultime',
      badge: '🏆 Déblocage Final',
      title: '⚡ DÉBLOCAGE ULTIME : NOUVELLE TENTATIVE EXAMEN THÉORIQUE',
      content: '⚡ **[DÉBLOCAGE EXAMEN THÉORIQUE FINAL]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, le staff a levé ton délai d\'attente pour l\'évaluation finale !\n\n' +
        'Tu es à deux doigts de la simulation. Relance ta tentative avec concentration et valide tes derniers points ! 🚀',
      footer: 'PAWAKO FORMATION • Jalon Final Avant Simulation',
      color: 0xf59e0b,
      suggestedDmText:
        'Cooldown levé pour ton quiz final ! Concentre-toi et valide ta dernière étape avant la simulation.',
    },
    default: {
      action: 'reset_cooldown',
      roleProfile: 'default',
      label: 'Déblocage Cooldown Standard',
      badge: '⚡ Cooldown Annulé',
      title: '⚡ DÉBLOCAGE SPÉCIAL : COOLDOWN ANNULÉ PAR LE STAFF',
      content: '⚡ **[COOLDOWN ANNULÉ — NOUVELLE TENTATIVE AUTORISÉE]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>, **l\'équipe d\'encadrement Staff a réinitialisé ton délai d\'attente (cooldown) !** ⚡\n\n' +
        'Tu peux dès maintenant repasser ton évaluation / quiz sans attendre le temps restant réglementaire.\n\n' +
        '👉 *Rends-toi dans ton espace membre Pawako pour démarrer ta tentative dès maintenant.* 🚀',
      footer: 'PAWAKO FORMATION • Déblocage Exceptionnel Staff',
      color: 0xf59e0b,
      suggestedDmText:
        'Ton cooldown a été annulé par l\'équipe. Tu peux retenter ton évaluation dès maintenant.',
    },
  },

  // --- 6. KICK INACTIVITÉ 3 JOURS ---
  kick_inactivity: {
    onboarding_new: {
      action: 'kick_inactivity',
      roleProfile: 'onboarding_new',
      label: 'Clôture Onboarding Inactif (3 jours sans début)',
      badge: '🚨 Départ Onboarding',
      title: '🚨 CLÔTURE DU PARCOURS — INACTIVITÉ EN PHASE D\'ACCUEIL (3 JOURS)',
      content: '🚨 **[AVIS DE CLÔTURE DU PARCOURS — INACTIVITÉ ONBOARDING]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>,\n\n' +
        'Malgré nos relances, aucune progression n\'a été enregistrée sur tes modules initiaux depuis plus de 3 jours.\n\n' +
        '❌ **Clôture du dossier & retrait des accès Discord.**\n\n' +
        '_Motif : {reason}_\n\n' +
        'Si tu souhaites réintégrer une future session lorsque tu seras disponible, contacte l\'administration.',
      footer: 'PAWAKO FORMATION • Clôture Parcours Onboarding',
      color: 0xdc2626,
      suggestedDmText:
        'Ton parcours a été clôturé en raison d\'une inactivité prolongée lors de l\'onboarding (plus de 3 jours sans action).',
    },
    intermediate_learner: {
      action: 'kick_inactivity',
      roleProfile: 'intermediate_learner',
      label: 'Clôture Progression Interrompue (3 jours)',
      badge: '🚨 Arrêt Formation',
      title: '🚨 CLÔTURE DU PARCOURS — INTERRUPTION DE FORMATION (3 JOURS SANS ACTION)',
      content: '🚨 **[AVIS DE CLÔTURE DU PARCOURS]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>,\n\n' +
        'Ton parcours avait bien débuté mais est resté sans activité depuis plus de 72 heures consécutives.\n\n' +
        '❌ **Conformément au règlement, ta place en session a été libérée et tes accès clôturés.**\n\n' +
        '_Motif : {reason}_\n\n' +
        'Nous te souhaitons une bonne continuation dans tes projets professionnels.',
      footer: 'PAWAKO FORMATION • Modération & Libération de Place',
      color: 0xdc2626,
      suggestedDmText:
        'Ton parcours a été clôturé pour inactivité de plus de 3 jours sans avancement. Ta place en session a été libérée.',
    },
    simulation_ready: {
      action: 'kick_inactivity',
      roleProfile: 'simulation_ready',
      label: 'Clôture Absence Simulation (Rendez-vous non honoré)',
      badge: '🚨 Absence Simu',
      title: '🚨 CLÔTURE DU PARCOURS — ABSENCE AU RENDEZ-VOUS DE SIMULATION',
      content: '🚨 **[AVIS D\'EXCLUSION — RENDEZ-VOUS NON HONORÉ]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>,\n\n' +
        'Tu étais convoqué(e) pour le test de simulation mais aucune réponse ou présence n\'a été constatée après 3 jours.\n\n' +
        '❌ **Clôture définitive du cycle de formation.**\n\n' +
        '_Motif : {reason}_',
      footer: 'PAWAKO FORMATION • Absence Évaluation',
      color: 0xdc2626,
      suggestedDmText:
        'Ton dossier a été clôturé suite à ton absence non justifiée au test de simulation et 3 jours sans contact.',
    },
    default: {
      action: 'kick_inactivity',
      roleProfile: 'default',
      label: 'Clôture Inactivité Standard (3 jours)',
      badge: '🚨 Kick Inactivité',
      title: '🚨 NOTIFICATION DE DÉPART — EXPULSION POUR INACTIVITÉ (3 JOURS)',
      content: '🚨 **[AVIS DE CLÔTURE DU PARCOURS — INACTIVITÉ]** <@{discordUserId}>',
      description:
        '📢 <@{discordUserId}>,\n\n' +
        'Conformément au règlement officiel de formation Pawako, ton parcours a été clôturé suite à une inactivité de plus de 3 jours sans avancement.\n\n' +
        '❌ **Clôture du parcours & retrait des accès Discord.**\n\n' +
        '_Motif : {reason}_\n\n' +
        'Si tu souhaites réintégrer une future session ultérieurement, contacte un administrateur Pawako.',
      footer: 'PAWAKO FORMATION • Modération & Clôture Parcours',
      color: 0xdc2626,
      suggestedDmText:
        'Ton parcours a été clôturé suite à une inactivité de plus de 3 jours sans action.',
    },
  },

  // --- 7. RELANCE DIRECT MESSAGE / MESSAGE DU STAFF ---
  direct_message_reminder: {
    onboarding_new: {
      action: 'direct_message_reminder',
      roleProfile: 'onboarding_new',
      label: 'Relance Bienvenue & Démarrage (Module 1)',
      badge: '🌱 Relance Accueil',
      title: '💬 BIENVENUE & ACCOMPAGNEMENT — DES QUESTIONS SUR LE MODULE 1 ?',
      content: '💬 **[MESSAGE DE BIENVENUE & SUIVI STAFF]** <@{discordUserId}>',
      description:
        '📢 Bonjour <@{discordUserId}> ! Nous avons vu que tu avais rejoint la formation Pawako.\n\n' +
        'Rencontres-tu des difficultés pour démarrer le Module 1 ou te connecter à la plateforme ?\n\n' +
        'L\'équipe Staff est à ton écoute si tu as la moindre question. N\'hésite pas à nous répondre directement ici ! 🚀',
      footer: 'PAWAKO FORMATION • Accompagnement Pédagogique',
      color: 0x6366f1,
      suggestedDmText:
        'Bonjour ! Rencontres-tu des difficultés pour démarrer le Module 1 ? L\'équipe Staff est là si tu as besoin d\'aide.',
    },
    intermediate_learner: {
      action: 'direct_message_reminder',
      roleProfile: 'intermediate_learner',
      label: 'Relance Rythme & Encouragement (Modules 2 à 4)',
      badge: '💪 Motivation',
      title: '💬 POINT D\'ÉTAPES — CONTINUE SUR TA LANCÉE !',
      content: '💬 **[POINT D\'ÉTAPES & SUIVI FORMATION]** <@{discordUserId}>',
      description:
        '📢 Bonjour <@{discordUserId}> ! Tu as déjà validé tes premiers modules avec succès.\n\n' +
        'Il ne te reste plus que quelques chapitres avant d\'atteindre le test de simulation à 14h00 HF.\n\n' +
        'Pense à te bloquer un créneau d\'étude aujourd\'hui pour maintenir ton rythme ! Bon travail à toi. 🚀',
      footer: 'PAWAKO FORMATION • Suivi de Progression',
      color: 0x6366f1,
      suggestedDmText:
        'Bravo pour tes premiers modules ! Pense à avancer sur la suite aujourd\'hui pour te qualifier pour la simulation.',
    },
    simulation_ready: {
      action: 'direct_message_reminder',
      roleProfile: 'simulation_ready',
      label: 'Relance Préparation Simulation (Micro & Fiches)',
      badge: '🏆 Rappel Simu',
      title: '💬 DERNIÈRE LIGNE DROITE — PRÉPARATION AU TEST DE SIMULATION',
      content: '💬 **[RAPPEL CONSEILS — SIMULATION STAFF]** <@{discordUserId}>',
      description:
        '📢 Bonjour <@{discordUserId}> ! Tous tes modules théoriques sont au vert.\n\n' +
        'Pense à tester ton micro sur Discord et à relire la fiche réflexe avant ton rendez-vous avec le formateur.\n\n' +
        'Tout le staff est derrière toi ! 🚀',
      footer: 'PAWAKO FORMATION • Coaching Simulation',
      color: 0x3b82f6,
      suggestedDmText:
        'Tous tes modules sont validés ! Pense à bien tester ton micro avant ton test de simulation en direct.',
    },
    tools_training: {
      action: 'direct_message_reminder',
      roleProfile: 'tools_training',
      label: 'Relance Formation Outils (10h00 HF)',
      badge: '🛠️ Rappel Outils',
      title: '💬 PRÉPARATION SESSION OUTILS (10h00 HF)',
      content: '💬 **[RAPPEL CRÉNEAU OUTILS 10H00 HF]** <@{discordUserId}>',
      description:
        '📢 Bonjour <@{discordUserId}> ! Ta simulation est validée et ta session Outils approche.\n\n' +
        'Vérifie que tu as bien accès au salon vocal Discord pour 10h00 HF pile. À très vite ! 🛠️',
      footer: 'PAWAKO FORMATION • Préparation Prise de Poste',
      color: 0x8b5cf6,
      suggestedDmText:
        'Rappel : Ta session de Formation aux Outils est prévue à 10h00 HF. Sois prêt(e) dans le salon vocal !',
    },
    default: {
      action: 'direct_message_reminder',
      roleProfile: 'default',
      label: 'Relance Staff Standard',
      badge: '💬 Message Staff',
      title: '💬 RELANCE & MESSAGE DE L\'ÉQUIPE STAFF PAWAKO',
      content: '💬 **[MESSAGE DE L\'ÉQUIPE STAFF PAWAKO]** <@{discordUserId}>',
      description:
        '📢 Bonjour <@{discordUserId}>,\n\n' +
        'L\'équipe pédagogique Pawako souhaitait faire le point avec toi sur ta formation.\n\n' +
        '{dynamicNote}\n\n' +
        'Reste motivé(e) et n\'hésite pas à nous solliciter si tu as la moindre question ! 🚀',
      footer: 'PAWAKO FORMATION • Suivi Candidat',
      color: 0x6366f1,
      suggestedDmText:
        'Bonjour ! Nous faisons le point sur ta formation. N\'hésite pas à nous solliciter si tu as la moindre question.',
    },
  },
};

/**
 * Resolve variables in a template for a given candidate and runtime context.
 */
export function resolveActionMessage(
  action: DiscordActionType,
  member: Member,
  context: {
    timestamp?: number;
    adminName?: string;
    customReason?: string;
    voiceLink?: string;
    meetUrl?: string;
    dynamicNote?: string;
  } = {}
): ResolvedActionMessage {
  const profile = determineCandidateRoleProfile(member);
  const actionConfig = DISCORD_ACTION_MESSAGES_CONFIG[action] || DISCORD_ACTION_MESSAGES_CONFIG.schedule_simulation_14h;
  const template: ActionMessageTemplate = actionConfig[profile] || actionConfig.default;

  const discordUserId = (member?.discordId || member?.id?.replace(/^mem-/, '') || 'candidat').replace(/[<@!>]/g, '').trim();
  const timestamp = context.timestamp || Date.now() + 24 * 60 * 60 * 1000;
  const timestampSec = Math.floor(timestamp / 1000);
  const dateFormatted = new Date(timestamp).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const adminName = context.adminName || 'Staff';
  const reason = context.customReason || 'Inactivité prolongée (3 jours sans action)';
  const voiceLink = context.voiceLink || 'le salon vocal `#🔊-formation-outils`';
  const meetUrl = context.meetUrl || 'https://meet.google.com/pawako-formation';
  const dynamicNote = context.dynamicNote || 'Continue tes efforts pour franchir les prochaines étapes de ta formation.';

  const replacePlaceholders = (str: string): string => {
    return str
      .replace(/\{discordUserId\}/g, discordUserId)
      .replace(/\{username\}/g, member?.username || 'Candidat')
      .replace(/\{timestampSec\}/g, String(timestampSec))
      .replace(/\{dateFormatted\}/g, dateFormatted)
      .replace(/\{adminName\}/g, adminName)
      .replace(/\{reason\}/g, reason)
      .replace(/\{voiceLink\}/g, voiceLink)
      .replace(/\{meetUrl\}/g, meetUrl)
      .replace(/\{dynamicNote\}/g, dynamicNote);
  };

  return {
    action,
    roleProfile: profile,
    label: template.label,
    title: replacePlaceholders(template.title),
    content: replacePlaceholders(template.content),
    description: replacePlaceholders(template.description),
    footer: replacePlaceholders(template.footer),
    color: template.color,
    suggestedDmText: replacePlaceholders(template.suggestedDmText || ''),
  };
}

/**
 * Return all role-relevant templates for a specific candidate across all available actions.
 */
export function getCandidateActionTemplates(
  member: Member,
  context: {
    timestamp?: number;
    adminName?: string;
  } = {}
): ResolvedActionMessage[] {
  const actions: DiscordActionType[] = [
    'schedule_simulation_14h',
    'validate_simulation',
    'reschedule_simulation',
    'reschedule_tools',
    'reset_cooldown',
    'kick_inactivity',
    'direct_message_reminder',
  ];

  return actions.map((act) => resolveActionMessage(act, member, context));
}
