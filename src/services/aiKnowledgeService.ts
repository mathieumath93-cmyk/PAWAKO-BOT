import {
  AiKnowledgeBase,
  AiPromptConfig,
  FanPersona,
  ObjectionHandler,
  PpvItem,
  StepGuide,
} from '../types';

export const defaultFiveStepsGuide: StepGuide[] = [
  {
    stepNumber: 1,
    title: 'Étape 1 : Accroche & Qualification Chaleureuse',
    objective: 'Établir un premier contact complice, tutoyer et extraire obligatoirement les 6 infos clés du fan (Prénom, Âge, Profession, Localisation, Hobbies, Fantasme).',
    keyPhrases: [
      'Coucou toi ! Comment tu t\'appelles ? Tu viens d\'où ? 😊',
      'Ravie de te croiser par ici ! Tu fais quoi dans la vie mon grand ? ✨',
      'Tu as l\'air super mystérieux... C\'est quoi ton plus grand fantasme avec moi ? 🔥',
    ],
    forbiddenErrors: [
      'Proposer un PPV sans avoir qualifié le fan et son pouvoir d\'achat (métier)',
      'Employer un ton formel ou institutionnel',
      'Ne pas poser de question ouverte en fin de message',
    ],
  },
  {
    stepNumber: 2,
    title: 'Étape 2 : Séduction & Création du Besoin',
    objective: 'Faire monter la température, flatter le fan selon ses hobbies/fantasmes tout en gardant le mystère sans rien donner gratuitement.',
    keyPhrases: [
      'J\'adore les hommes ambitieux comme toi... Tu es plutôt du genre timide ou joueur ? 😏',
      'Si tu savais ce que j\'aime faire quand je suis seule dans mon lit... 😈',
    ],
    forbiddenErrors: [
      'Envoyer des visuels ou vidéos intimes gratuitement',
      'Laisser le fan imposer son rythme sans recadrage complice',
    ],
  },
  {
    stepNumber: 3,
    title: 'Étape 3 : Teasing, Description PPV Ultra-Chaude & Follow-Up Immédiat',
    objective: 'Créer une image mentale hyper visuelle et explicite du média, fixer le prix ET envoyer immédiatement le message de Follow-Up.',
    keyPhrases: [
      'J\'ai enregistré une vidéo intime ultra-chaude sous la douche : je me déshabille lentement, l\'eau coule sur ma poitrine et je jouis en murmurant ton prénom... 🔥 Te la débloque pour 25$ ?\n\nFollow-Up immédiat : N\'oublie pas de me noter /10 bb 💋',
      'Regarde ce pack lingerie transparente où je touche mes courbes pour toi... 18$ seulement !\n\nFollow-Up immédiat : Tu aimes la couleur de ma lingerie ? 😉',
    ],
    forbiddenErrors: [
      'Envoyer une description de PPV tiède, générique ou sans détails visuels excitants',
      'Oublier d\'envoyer le message de Follow-Up immédiatement après le PPV',
    ],
  },
  {
    stepNumber: 4,
    title: 'Étape 4 : Traitement des Objections en 4 Boucliers',
    objective: 'Gérer les refus en appliquant la stratégie progressive : Bouclier 1 (Soft), Bouclier 2 + Épée (Ajout médias), Réduction -20/-25%, et Promesse d\'Achat (Date).',
    keyPhrases: [
      'Bouclier 1 : Je comprends chéri, mais c\'est une vidéo 100% faite maison très chaude pour toi... Tu n\'as pas envie de me voir vibrer ? 💋',
      'Bouclier 2 + Épée : Parce que c\'est toi, j\'ajoute 2 photos lingerie inédites sans augmenter le prix ! 🔥',
      'Réduction : D\'accord mon ange, je te fais une baisse exceptionnelle de -25% à 18$ avec le pack complet !',
      'Promesse d\'Achat : Je comprends ! Tu penses pouvoir te faire ce plaisir quel jour cette semaine (paie/weekend) ? 😉',
    ],
    forbiddenErrors: [
      'Bradar le prix dès le premier refus',
      'Faire une réduction sans avoir augmenté l\'offre média au préalable (Bouclier 2)',
      'Abandonner sans obtenir une date de promesse d\'achat',
    ],
  },
  {
    stepNumber: 5,
    title: 'Étape 5 : Closing & Upsell',
    objective: 'Remercier avec passion, réclamer un retour et enchaîner sur du contenu encore plus chaud.',
    keyPhrases: [
      'Merci mon ange ! Regarde vite et dis-moi quelle partie tu as préférée... 😈',
      'J\'ai tellement donné que je tremble, regarde bien comment je jouis, c\'est pour toi bb ! On enchaîne sur la partie 2 encore plus extrême ? 🔥',
    ],
    forbiddenErrors: [
      'Couper la discussion après le paiement',
      'Ne pas proposer de contenu complémentaire',
    ],
  },
];

export const defaultPpvPricing: PpvItem[] = [
  { id: 'ppv-1', mediaName: 'Photo Lingerie Transparente (Ultra-Visuel)', minPrice: 5, maxPrice: 12, description: 'Photo faite maison avec détails explicites sur les courbes' },
  { id: 'ppv-2', mediaName: 'Vidéo Teasing Douche / Déshabillage 1 Min', minPrice: 15, maxPrice: 25, description: 'Vidéo sous la douche avec murmure du prénom et toucher sensuel' },
  { id: 'ppv-3', mediaName: 'Vidéo Ultra-Chaude Solo Explicite 3-5 Min', minPrice: 35, maxPrice: 60, description: 'Jouissance intense en gros plan + détails visuels poussés' },
  { id: 'ppv-4', mediaName: 'Pack Sexting 15 Min + 3 Photos Inédites', minPrice: 50, maxPrice: 100, description: 'Session interactive en direct avec réaction aux fantasmes du fan' },
];

export const defaultObjectionHandlers: ObjectionHandler[] = [
  {
    id: 'obj-1',
    objection: 'Refus 1 : C\'est trop cher / Pas le budget',
    strategy: 'Bouclier 1 (Soft) : Rebondir gentiment sur l\'excitation et l\'exclusivité sans baisser le prix.',
    exampleResponse: 'Je comprends chéri, mais ce contenu est 100% fait maison et très chaud... Tu es sûr de vouloir rater ça ? 😉',
  },
  {
    id: 'obj-2',
    objection: 'Refus 2 : Le fan réitère son hésitation',
    strategy: 'Bouclier 2 + Épée : Ajouter des médias cadeaux (ex: 2 photos offertes) en gardant le même prix.',
    exampleResponse: 'Écoute bb, parce que tu me plais vraiment, je te rajoute 2 photos lingerie inédites gratuites dans le pack si tu débloques maintenant ! 🔥',
  },
  {
    id: 'obj-3',
    objection: 'Refus 3 : Le fan bloque toujours sur le prix',
    strategy: 'Réduction de Prix (-20% à -25%) tout en conservant le pack augmenté de médias.',
    exampleResponse: 'Bon, tu m\'as fait craquer... Je te fais une réduction exceptionnelle de -25% (18$ au lieu de 25$) avec tous les bonus inclus ! 💋',
  },
  {
    id: 'obj-4',
    objection: 'Refus 4 : Le fan refuse toujours après la réduction',
    strategy: 'Promesse d\'Achat : Obtenir une date ou fourchette de date pour le déblocage.',
    exampleResponse: 'Je comprends mon ange ! Tu penses pouvoir te faire ce cadeau quel jour exactement (ce weekend ou le jour de ta paie) ? 😉',
  },
];

export const defaultFanPersonas: FanPersona[] = [
  {
    id: 'persona-anthony',
    name: 'Fan Prospect Inactif',
    description: 'Nouveau fan abonné qui n\'a pas répondu au message de bienvenue. Attend la relance du candidat pour démarrer l\'échange. Révèle ses 6 infos clés uniquement si on lui demande.',
    budget: 'Variable (Adaptatif)',
    difficulty: 'moyen',
    initialMessage: '📌 CONTEXTE : Un nouveau fan s\'est abonné mais n\'a pas répondu au message automatique de bienvenue. À toi de le relancer !',
  },
];

export const defaultAnalyzerPrompt = `Tu es l'IA Audit & Entraîneur pour PAWAKO FORMATION (Chatting OnlyFans/MYM).
Ta mission est d'analyser l'historique d'un salon privé où un superviseur (Mahsa ou Mathieu) a fait travailler ou corriger un candidat en simulation.

À partir des échanges et corrections du superviseur :
1. **Synthèse de la simulation** : Résumé des points abordés et des cas pratiques traités.
2. **Extraits de répliques modèles du superviseur** : Identifie les meilleures tournures et réponses données par le superviseur.
3. **Mise à jour proposée des Prompts IA** : Propose des enrichissements concrets pour ajuster le comportement d'Anthony (l'IA Fan) et de l'IA Coach afin de coller parfaitement aux attentes de l'équipe encadrante.
4. **Bilan qualitatif du candidat** (Respect des 6 infos clés du fan, qualité de la description PPV, follow-up et application des 4 boucliers de négociation sans note chiffrée).

Formate la réponse de manière très professionnelle avec des émojis clairs.`;

export const defaultFanPrompt = `Tu es l'IA qui incarne ANTHONY, un FAN/PROSPECT sur un réseau social privé (Style OnlyFans/MYM/Instagram).
Ton prénom est ANTHONY. Ne te présente JAMAIS comme une IA ou un bot.

Consignes de comportement STRICTES pour Anthony :
0. **CONTEXTE & DÉBUT DE DISCUSSION (RELANCE CANDIDAT)** : Tu es un NOUVEAU FAN qui vient de s'abonner et qui N'A PAS répondu au message automatique de bienvenue. C'est le CANDIDAT (chatteur) qui doit te relancer et commencer la conversation. Tu ne parles PAS en premier.
1. **RÉTENTION D'INFORMATION** : Tu ne donnes JAMAIS d'informations personnelles (prénom "Anthony", âge, profession, localisation, hobbies, fantasme) tant que le candidat NE DEMANDE PAS explicitement. Tu réponds UNIQUEMENT aux questions posées.
2. **SEXUALISATION & OUVERTURE PROGRESSIVE** : Tu joues le mec intéressé, MAIS PAS TROP au début (un peu réservé, curieux mais pas lourd). Tu ne t'ouvres et ne deviens chaud que très progressivement au fur et à mesure que le candidat crée une vraie complicité.
3. **RÉACTION AUX PROPOSITIONS DE PHOTOS/VIDÉOS (GRATUIT OU PAYANT ?)** :
   - Dès que le candidat te propose de te montrer une photo/vidéo ou te demande si tu veux un visuel, tu demandes TOUJOURS : « C'est gratuit ou c'est payant ? ».
   - Si le candidat répond que c'est **PAYANT** -> OBJECTION DIRECTE ("Ah c'est payant ? Mmh non merci je pensais que c'était gratuit..." ou "25$ c'est un peu cher...").
   - Si le candidat répond que c'est **GRATUIT** -> Tu acceptes chaleureusement et la conversation continue.
4. **PROCESSUS DE NÉGOCIATION EN 4 REFUS** :
   - 1er Refus (Objection) : Tu hésites sur le prix.
   - Si Bouclier 1 (Soft) : Tu réitères ton doute.
   - Si Bouclier 2 + Épée (Médias ajoutés) : Tu hésites encore un peu.
   - Si Réduction (-20% à -25%) : Tu acceptes ou demandes un délai si besoin.
   - Si Promesse d'Achat (Demande de date) : Tu donnes une date fixe (ex: vendredi jour de paie).
5. **RELANCE POUR INACTIVITÉ (> 5 MIN)** : Si le candidat met plus de 5 minutes à répondre, envoie un message de relance complice (ex: « Tu m'as oublié ? 😏 » ou « Tu es toujours là ? »).`;

export const defaultCoachPrompt = `Tu es le Coach-Superviseur IA discret chez PAWAKO.
TA RÈGLE ABSOLUE : N'interviens PAS pendant la conversation. Laisse la discussion s'enchaîner naturellement entre le candidat et le fan.

INTERVENTION EXCEPTIONNELLE SEULEMENT EN CAS D'ERREUR FATALE :
N'envoie une alerte de correction que si le candidat commet une ERREUR FATALE parmi les suivantes :
1. Propose un PPV sans avoir cherché à qualifier le fan (Prénom, Âge, Métier, Ville, Hobbies, Fantasme).
2. Donne du contenu intime ou visuel gratuitement sans teasing.
3. Envoie une description de PPV tiède ou vague (sans image mentale ultra-chaude et visuelle).
4. Oublie d'envoyer le message de Follow-Up immédiat après la proposition de PPV.
5. Fait une réduction de prix directe dès le premier refus sans être passé par le Bouclier 2 + Épée (ajout de média gratuit).
6. Fait preuve de mépris, d'insultes ou d'un langage froid/institutionnel.

Si aucune erreur fatale n'est commise, NE FAIS AUCUNE REMARQUE et laisse passer.`;

class AiKnowledgeService {
  private knowledgeBase: AiKnowledgeBase;
  private promptConfig: AiPromptConfig;
  private listeners: Array<() => void> = [];

  constructor() {
    this.knowledgeBase = {
      ofmRules: `RÈGLES D'OR DU CHATTING PAWAKO :
1. On ne discute pas pour parler de la pluie et du beau temps : chaque échange doit construire de la valeur ou mener vers une vente.
2. Le tutoiement chaleureux et complice est obligatoire.
3. Toujours garder le contrôle de la discussion en terminant ses messages par une question ouverte.
4. Ne jamais envoyer de contenu intime gratuitement sans teasing préalable.
5. Soigner l'orthographe, les émojis et le rythme des messages.`,
      ppvPricing: defaultPpvPricing,
      objectionHandlers: defaultObjectionHandlers,
      fiveStepsGuide: defaultFiveStepsGuide,
      fanPersonas: defaultFanPersonas,
    };

    this.promptConfig = {
      analyzerPrompt: defaultAnalyzerPrompt,
      fanPrompt: defaultFanPrompt,
      coachPrompt: defaultCoachPrompt,
      modelName: 'google/gemini-2.5-flash',
      temperature: 0.7,
      openRouterApiKey: '',
      enableLiveDiscordBot: false, // Default false until user explicitly enables it!
    };

    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const storedKb = localStorage.getItem('pawako_ai_knowledge_base');
      if (storedKb) {
        this.knowledgeBase = { ...this.knowledgeBase, ...JSON.parse(storedKb) };
      }
      const storedPrompt = localStorage.getItem('pawako_ai_prompt_config');
      if (storedPrompt) {
        this.promptConfig = { ...this.promptConfig, ...JSON.parse(storedPrompt) };
      }
    } catch (e) {
      console.warn('Error loading AI knowledge base from storage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.warn('Error in AI knowledge listener:', e);
      }
    });
  }

  public getKnowledgeBase(): AiKnowledgeBase {
    return this.knowledgeBase;
  }

  public updateKnowledgeBase(data: Partial<AiKnowledgeBase>): AiKnowledgeBase {
    this.knowledgeBase = { ...this.knowledgeBase, ...data };
    this.saveToStorage();
    this.notify();
    return this.knowledgeBase;
  }

  public getPromptConfig(): AiPromptConfig {
    return this.promptConfig;
  }

  public updatePromptConfig(data: Partial<AiPromptConfig>): AiPromptConfig {
    this.promptConfig = { ...this.promptConfig, ...data };
    this.saveToStorage();
    this.notify();
    return this.promptConfig;
  }

  private saveToStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('pawako_ai_knowledge_base', JSON.stringify(this.knowledgeBase));
      localStorage.setItem('pawako_ai_prompt_config', JSON.stringify(this.promptConfig));
    } catch {
      // Ignore
    }
  }

  public resetToDefaults() {
    this.knowledgeBase = {
      ofmRules: `RÈGLES D'OR DU CHATTING PAWAKO :
1. On ne discute pas pour parler de la pluie et du beau temps : chaque échange doit construire de la valeur ou mener vers une vente.
2. Le tutoiement chaleureux et complice est obligatoire.
3. Toujours garder le contrôle de la discussion en terminant ses messages par une question ouverte.
4. Ne jamais envoyer de contenu intime gratuitement sans teasing préalable.
5. Soigner l'orthographe, les émojis et le rythme des messages.`,
      ppvPricing: defaultPpvPricing,
      objectionHandlers: defaultObjectionHandlers,
      fiveStepsGuide: defaultFiveStepsGuide,
      fanPersonas: defaultFanPersonas,
    };

    this.promptConfig = {
      analyzerPrompt: defaultAnalyzerPrompt,
      fanPrompt: defaultFanPrompt,
      coachPrompt: defaultCoachPrompt,
      modelName: 'google/gemini-2.5-flash',
      temperature: 0.7,
      openRouterApiKey: '',
      enableLiveDiscordBot: false,
    };

    this.saveToStorage();
    this.notify();
  }
}

export const aiKnowledgeService = new AiKnowledgeService();
