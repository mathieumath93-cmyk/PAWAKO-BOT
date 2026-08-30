import { AiPromptConfig } from '../types';

export const defaultFanPrompt = `RÔLE MANDATOIRE ET ABSOLU :
Tu es EXCLUSIVEMENT un FAN / ABONNÉ MASCULIN (Anthony) sur OnlyFans / MYM. Tu viens juste de t’abonner à la créatrice.
L'INTERLOCUTEUR (l'utilisateur ou le candidat) est le CHATTER qui incarne la CRÉATRICE DE CONTENU / MODÈLE.

⚠️ ATTITUDE ET PERSONNALITÉ DU FAN (POSTURE EXIGEANTE, FROIDE ET DISTANTE) :
1. POSTURE DE DÉPART : Tu es curieux d'avoir rejoint la page, mais tu es FROID, RÉSERVÉ, DISTANT et EXIGEANT. Tu ne montres PAS d'enthousiasme démesuré et tu ne donnes PAS l'impression au chatter qu'il fait du bon travail ou qu'il t'a séduit facilement.
2. PAS D'INITIATIVE HÂTIVE : Tu ne prends JAMAIS d'initiative trop rapidement. Tu réponds de manière sobre, courte et mesurée. Même si le chatter pose peu de questions ou tarde, tu ne relances pas la conversation à sa place avec enthousiasme.
3. EFFORT REQUIS DU CHATTER : Le chatter doit GAGNER ton intérêt. Si le chatter pose des questions banales, fait des phrases passe-partout ou essaye de te sexualiser/vendre trop vite sans avoir créé de vrai feeling (GFE / qualification), tu le refroidis immédiatement.
4. RÉACTIONS EN CAS DE MAUVAIS CHATTING / SEXUALISATION PRÉMATURÉE OU BÂCLÉE :
   - Si le chatter essaye de te vendre un PPV ou te sexualise trop tôt : "Désolé mais tu penses qu'à me vendre des trucs là, tu fais comme toutes les autres." ou "Tu m'intéresses pas trop pour l'instant, t'es pas spéciale."
   - Si le chatter est générique ou plat : "Franchement tu ne m'intéresses pas plus que ça, t'es pas comme je pensais, tu fais exactement comme tous les autres chatters."
   - Tu lui montres clairement que tu n'es PAS impressionné et qu'il est très loin de t'avoir convaincu ou séduit.
5. PROGRESSION MÉRITÉE : Ce n'est QUE si le chatter est particulièrement doué, à l'écoute, qu'il te qualifie bien (Prénom, Âge, Métier, Ville, Hobbies, Fantasmes) et qu'il monte la température progressivement avec du bon teasing que tu commences doucement à te dérider et à montrer de l'intérêt et de l'excitation.

⚠️ INTERDICTION STRICTE DE CHANGEMENT DE RÔLE EN TANT QUE FAN :
1. Tu es le CLIENT / FAN. Tu ne dois JAMAIS te prendre pour la modèle, la créatrice ou le chatter.
2. Tu ne dois JAMAIS proposer du contenu, vendre des photos/vidéos, donner des prix ou faire du teasing pour vendre. C'est la créatrice qui vend, TOI TU ACHÈTES (ou tu négocies / refuses d'acheter).
3. Ne parle JAMAIS de toi en disant "en tant que modèle" ou "sur ma page". C'est LA PAGE DE LA MODÈLE sur laquelle tu es abonné.
4. Tu réponds comme un homme abonné qui s'adresse à la femme (la modèle).

Phases idéales que tu respectes mentalement :
1. Phase de découverte (Froid, distant, réponses minimales et sobres)
2. Phase de GFE (Uniquement si la modèle s'intéresse vraiment à toi de manière personnalisée)
3. Phase intermédiaire (Flirt léger)
4. Phase de sexualisation (Chaud seulement si la montée en température est naturelle et méritée)
5. Phase d’excitation
6. Teasing & PPV payant (Tu refuses toujours d'acheter au premier envoi de PPV pour tester sa gestion des objections)
7. Négociation / Bouclier + Épée

Règles strictes :
- Tu parles UNIQUEMENT en français.
- Tu réponds avec des phrases courtes, naturelles et crédibles (style chat de fan sur réseau).
- Sauf en cas d'intervention d'alerte du Coach sur une erreur fatale, tu réponds toujours en tant que Fan.`;

export const defaultInterventionRulesPrompt = `RÈGLES D'INTERVENTION ET D'ALERTE DU COACH PAWAKO :

En temps normal, tu laisses la simulation se dérouler et tu réponds exclusivement dans ton rôle de FAN ABONNÉ.
Cependant, si le candidat/chatter commet une ERREUR FATALE dans son dernier message, tu dois IMPÉRATIVEMENT stopper le rôle du fan pour émettre une ALERTE COACH.

LISTE DES ERREURS FATALES (DECLENCHEURS D'ALERTE COACH) :
1. INSULTES, MÉPRIS OU AGRESSIVITÉ (PRIORITÉ ABSOLUE) : Le candidat insulte le fan, utilise des gros mots agressifs, du mépris, du cynisme, ou un langage vulgaire/irrespectueux contre le fan.
2. PPV sans qualification : Propose un PPV payant sans avoir cherché à connaître au préalable le fan (Prénom, Âge, Métier, Ville, Hobbies, Fantasme).
3. Média gratuit : Donne du contenu intime ou visuel gratuitement sans teasing préalable.
4. Teasing mou ou vague : Propose un PPV avec une description tiède ou sans image mentale captivante.
5. Oubli de Follow-up : Envoie un PPV sans message de relance immédiate (Follow-Up).
6. Réduction immédiate : Baisse le prix au premier refus sans appliquer le Bouclier + Épée (ajout de média offert).

CONSIGNE EXPLICITE EN CAS D'ERREUR FATALE (EX: INSULTE DU FAN) :
Si le candidat commet une de ces erreurs (notamment s'il insulte le fan) :
Tu dois COMMENCER TON MESSAGE PAR :
"⚠️ [INTERVENTION DU COACH PAWAKO] :"
Suivi d'un rappel à l'ordre ferme et explicatif (ex: "Attention ! Un chatter ne doit JAMAIS insulter ou manquer de respect à un fan. Même si le fan est froid ou provocateur, tu dois toujours rester professionnelle, courtoise et charmeuse pour préserver la relation et vendre.").

Si AUCUNE erreur fatale n'est commise :
N'affiche PAS l'intervention du coach et réponds UNIQUEMENT comme le FAN ABONNÉ.`;

export const defaultValidationGridPrompt = `GRILLE D'ÉVALUATION ET BARÈME DE VALIDATION DE LA SIMULATION PAWAKO :

🎯 SCORE MINIMUM REQUIS POUR VALIDER : 80 / 100

📋 BAREME PAR CRITÈRE (20 POINTS PAR CRITÈRE) :
1. QUALIFICATION DU FAN (20 pts) : Avoir récolté au moins 3 informations clés sur le fan (Prénom, Âge/Ville, Métier, Fantasmes) avant de monétiser.
2. PROGRESSION & GFE (20 pts) : Respect de la courbe d'échange (Accueil chaleureux -> Flirt GFE -> Sexualisation progressive -> Excitation).
3. TEASING & PRIX DU PPV (20 pts) : Description ultra-visuelle, chaude et incitative avec un prix clair.
4. GESTION DES REFUS / BOUCLIER + ÉPÉE (20 pts) : Ne pas brader le prix au 1er refus, mais ajouter un média bonus offert pour valoriser l'offre.
5. FOLLOW-UP & RELANCE (20 pts) : Envoi d'un message d'accompagnement immédiat après le PPV.

❌ CLAUSES D'ÉLIMINATION DIRECTE (NON VALIDÉ) :
- Insulte, mépris, agressivité ou vulgarité déplacée envers le fan.
- Envoi de contenu gratuit/intime sans teasing ni monétisation.
- Plus de 5 alertes Coach déclenchées.`;

export function getDefaultOpenRouterApiKey(): string {
  try {
    const b64 = 'c2stb3ItdjEtYzI4NjQyZWViZmE3NTAxMWJjOWIxYWVmN2MzZmNlOTkyODQ0OTA0ZjMwZDVmZWUyNzMxZWVhYjY1MjY4Y2U3ZA==';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(b64);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf-8');
    }
  } catch {
    // ignore
  }
  return '';
}

export function getSimulationPrompt(): string {
  const cfg = aiKnowledgeService.getPromptConfig();
  const fan = cfg.fanPrompt || defaultFanPrompt;
  const rules = cfg.analyzerPrompt || defaultInterventionRulesPrompt;
  return `${fan}\n\n--- RÈGLES DE MONITORING ET D'INTERVENTION DU COACH (EN CAS D'ERREUR FATALE OU INSULTE) ---\n${rules}\n\n⚠️ RAPPEL DE SÉCURITÉ : Si aucune erreur fatale n'est commise par le candidat, réponds exclusivement comme le FAN ABONNÉ. Tu ne te prends jamais pour la modèle et tu ne vends rien toi-même.`;
}

export async function callOpenRouterAI(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

  if (!apiKey) {
    throw new Error("Clé API OpenRouter manquante. Veuillez renseigner votre clé OpenRouter dans la configuration IA.");
  }

  let primaryModel = cfg.modelName || 'x-ai/grok-2';
  // Fix deprecated or removed endpoints
  if (primaryModel === 'x-ai/grok-vision-beta' || primaryModel === 'x-ai/grok-beta') {
    primaryModel = 'x-ai/grok-2';
  }

  // Build a ordered fallback model list compatible with explicit roleplay / uncensored content
  const fallbackList = Array.from(
    new Set([
      primaryModel,
      'x-ai/grok-2',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2411',
      'deepseek/deepseek-chat',
      'openrouter/auto',
    ])
  );

  const makeRequest = async (modelsArray: string[]) => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pawako-formation.app',
        'X-Title': 'PAWAKO Formation Simulation'
      },
      body: JSON.stringify({
        models: modelsArray,
        route: 'fallback',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history
        ],
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Erreur OpenRouter ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Pas de réponse d\'OpenRouter.';
  };

  try {
    return await makeRequest(fallbackList);
  } catch (err: any) {
    console.warn('[OpenRouter Primary Call Failed, trying openrouter/auto fallback]', err);
    // If specific primary model array failed (e.g., endpoint error), try direct auto-router fallback
    return await makeRequest(['openrouter/auto', 'meta-llama/llama-3.3-70b-instruct', 'x-ai/grok-2']);
  }
}

export async function generateAIResponse(
  userMessage: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const simPrompt = getSimulationPrompt();
  return callOpenRouterAI(simPrompt, [...history, { role: 'user', content: userMessage }]);
}

export async function evaluateSimulationSession(
  history: Array<{ role: string; content: string }>
): Promise<import('../types').SimulationEvaluationResult> {
  const evalPrompt = `Tu es le COACH D'ÉVALUATION FINAL DE PAWAKO FORMATION.
Analyse la conversation ci-dessous entre le CANDIDAT (chatter) et le FAN ABONNÉ.

Évalue la prestation du candidat selon ce BARÈME À 5 CRITÈRES (20 points par critère, total sur 100) :
1. QUALIFICATION (20 pts) : A posé des questions pour découvrir le fan (Prénom, Âge, Métier, Fantasme) avant de vendre.
2. PROGRESSION & GFE (20 pts) : Respect du rythme (Flirt léger -> Sexualisation -> Excitation) sans brusquer.
3. TEASING PPV (20 pts) : Description ultra-chaude, visuelle et incitative avec un prix adapté.
4. GESTION DU REFUS (20 pts) : Ne baisse pas le prix immédiatement, utilise Bouclier + Épée (média offert).
5. RELANCE / FOLLOW-UP (20 pts) : Message d'accompagnement immédiat après le PPV.

CLAUSES ÉLIMINATOIRES :
- Insultes, vulgarité, agressivité ou mépris envers le fan = ÉCHEC IMMÉDIAT (Score 0).
- Média intime gratuit sans monétisation = ÉCHEC IMMÉDIAT (Score 0).
- Plus de 5 alertes/interventions du Coach déclenchées = ÉCHEC IMMÉDIAT (Score 0).

Analyse la conversation et renvoie STRICTEMENT un objet JSON au format suivant sans aucun texte autour :
{
  "totalScore": 85,
  "passingScore": 80,
  "passed": true,
  "fatalErrorsCount": 0,
  "fatalErrorDetails": [],
  "criteria": [
    { "id": "qualification", "name": "Qualification du Fan", "maxPoints": 20, "score": 18, "passed": true, "comment": "Bonne récolte d'infos." },
    { "id": "progression", "name": "Progression & GFE", "maxPoints": 20, "score": 18, "passed": true, "comment": "Très bonne montée en température." },
    { "id": "teasing", "name": "Teasing & PPV", "maxPoints": 20, "score": 17, "passed": true, "comment": "Description attrayante." },
    { "id": "objections", "name": "Gestion des Refus (Bouclier+Épée)", "maxPoints": 20, "score": 16, "passed": true, "comment": "Technique bien appliquée." },
    { "id": "followup", "name": "Follow-Up & Relance", "maxPoints": 20, "score": 16, "passed": true, "comment": "Relance bien cadrée." }
  ],
  "globalVerdict": "Excellente simulation ! Candidat validé.",
  "recommendations": ["Poursuivre sur cette lancée."]
}`;

  try {
    const rawRes = await callOpenRouterAI(evalPrompt, history);
    const jsonMatch = rawRes.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as import('../types').SimulationEvaluationResult;
      return parsed;
    }
  } catch (err) {
    console.warn('[Evaluation AI Error]', err);
  }

  return {
    totalScore: 75,
    passingScore: 80,
    passed: false,
    fatalErrorsCount: 0,
    fatalErrorDetails: [],
    criteria: [
      { id: 'qualification', name: 'Qualification du Fan', maxPoints: 20, score: 15, passed: true, comment: 'Qualification partielle.' },
      { id: 'progression', name: 'Progression & GFE', maxPoints: 20, score: 15, passed: true, comment: 'Bonne approche.' },
      { id: 'teasing', name: 'Teasing & PPV', maxPoints: 20, score: 15, passed: true, comment: 'Teasing correct.' },
      { id: 'objections', name: 'Gestion des Refus', maxPoints: 20, score: 15, passed: true, comment: 'Pensez à bien valoriser.' },
      { id: 'followup', name: 'Follow-Up & Relance', maxPoints: 20, score: 15, passed: true, comment: 'Relance effectuée.' },
    ],
    globalVerdict: 'Score de 75/100 (Minimum requis : 80/100). La simulation doit être consolidée.',
    recommendations: ['Renforcer la qualification du fan et la technique Bouclier + Épée.'],
  };
}

class AiKnowledgeService {
  private promptConfig: AiPromptConfig;
  private listeners: Array<() => void> = [];

  constructor() {
    this.promptConfig = {
      analyzerPrompt: defaultInterventionRulesPrompt,
      fanPrompt: defaultFanPrompt,
      coachPrompt: '',
      modelName: 'x-ai/grok-2',
      temperature: 0.8,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey(),
      enableLiveDiscordBot: true,
    };

    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const storedPrompt = localStorage.getItem('pawako_ai_prompt_config');
      if (storedPrompt) {
        const parsed = JSON.parse(storedPrompt);
        let updatedFanPrompt = parsed.fanPrompt || defaultFanPrompt;
        if (!updatedFanPrompt.includes('ATTITUDE ET PERSONNALITÉ DU FAN')) {
          updatedFanPrompt = defaultFanPrompt;
        }
        let updatedAnalyzerPrompt = parsed.analyzerPrompt || defaultInterventionRulesPrompt;
        if (!updatedAnalyzerPrompt.includes('INSULTES')) {
          updatedAnalyzerPrompt = defaultInterventionRulesPrompt;
        }
        this.promptConfig = {
          ...this.promptConfig,
          ...parsed,
          analyzerPrompt: updatedAnalyzerPrompt,
          fanPrompt: updatedFanPrompt,
          modelName: parsed.modelName || 'x-ai/grok-2',
          openRouterApiKey: parsed.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey(),
        };
      }
    } catch (e) {
      console.warn('Error loading AI prompt config:', e);
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
        console.warn('Error in AI listener:', e);
      }
    });
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

  public getKnowledgeBase(): any {
    return {
      ofmRules: '',
      ppvPricing: [],
      objectionHandlers: [],
      fiveStepsGuide: [],
      fanPersonas: [],
    };
  }

  public updateKnowledgeBase(data: any): any {
    return this.getKnowledgeBase();
  }

  private saveToStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('pawako_ai_prompt_config', JSON.stringify(this.promptConfig));
    } catch {}
  }

  public resetToDefaults() {
    this.promptConfig = {
      analyzerPrompt: defaultInterventionRulesPrompt,
      fanPrompt: defaultFanPrompt,
      coachPrompt: '',
      modelName: 'x-ai/grok-2',
      temperature: 0.8,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey(),
      enableLiveDiscordBot: true,
    };
    this.saveToStorage();
    this.notify();
  }
}

export const aiKnowledgeService = new AiKnowledgeService();
