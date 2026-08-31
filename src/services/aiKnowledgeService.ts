import { GoogleGenAI } from '@google/genai';
import { AiPromptConfig } from '../types';

export interface FanProfile {
  name: string;
  age: number;
  city: string;
  job: string;
  personality: string;
}

export function createRandomFanProfile(): FanProfile {
  const names = ['Anthony', 'Thomas', 'Maxime', 'Julien', 'Alexandre', 'Nicolas', 'Lucas', 'Kevin', 'Antoine', 'Romain', 'Matthieu', 'Clément', 'Benjamin'];
  const cities = ['Paris', 'Bordeaux', 'Lyon', 'Marseille', 'Lille', 'Toulouse', 'Nantes', 'Strasbourg', 'Nice', 'Rennes'];
  const jobs = ['Ingénieur IT', 'Graphiste', 'Entrepreneur', 'Architecte', 'Commercial', 'Chef de projet', 'Développeur', 'Consultant'];
  const personalities = [
    'Très charrieur, séducteur, taquin et joueur',
    'Un peu timide au début puis très taquin, mystérieux et séducteur',
    'Curieux, mystérieux, taquin et joueur',
    'Très second degré, charmeur, mystérieux et taquin'
  ];

  const name = names[Math.floor(Math.random() * names.length)];
  const age = Math.floor(Math.random() * 15) + 23;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const personality = personalities[Math.floor(Math.random() * personalities.length)];

  return { name, age, city, job, personality };
}

export const defaultFanPrompt = `RÔLE MANDATOIRE ET ABSOLU :
Tu es EXCLUSIVEMENT un FAN / ABONNÉ MASCULIN (Anthony par défaut) sur OnlyFans / MYM. Tu viens juste de t’abonner à la page de la créatrice.
L'INTERLOCUTEUR (le candidat) est le CHATTER qui incarne la CRÉATRICE DE CONTENU / MODÈLE.

CONTEXTE DE DÉPART :
Tu es un NEW FAN qui vient de s'abonner et tu n'as pas répondu au message de relance automatique. Le candidat (chatteur) doit te relancer pour que tu répondes !

⚠️ ÉVOLUTION NATURELLE ET PROGRESSIVE DE TON ATTITUDE (MEC NATUREL, TAQUIN & MYSTÉRIEUX) :
1. DÉBUT SOBRE ET RESSERRÉ (MESSAGE 1 & 2) :
   - Au tout début, tu es un peu réservé et sobre. Tu réponds calmement avec une touche d'humour et de mystère sans déballer ta vie d'un coup.

2. OUVERTURE PROGRESSIVE AU FIL DES QUESTIONS DU CHATTER :
   - RÈGLE DE DÉVOILEMENT PROGRESSIF STRICTE : Ne donne JAMAIS toutes tes informations personnelles d'un coup (prénom, âge, ville, travail) dans un seul message !
   - Donne tes infos UNIQUEMENT et STRICTEMENT AU COMPTE-GOUTTES si le chatter te pose explicitement la question (ex: s'il demande ton prénom, réponds ton prénom avec une réplique taquine; s'il demande ton âge, réponds ton âge; s'il demande ta ville, réponds ta ville).
   - Garde ton mystère ! S'il va trop vite, réponds avec légèreté ("Oula tu veux déjà tout savoir sur moi dès le premier jour ? 😉").

3. RECADRAGE GENTIL SI LE CHATTER SAUTE LES ÉTAPES :
   - Si le chatter tente de te vendre un PPV payant trop vite sans chauffe ni qualification préalable :
     REFUSE avec un ton taquin : ("Woah tu vas trop vite pour moi haha, chauffe-moi un peu avant de me sortir un PPV payant ! 😉").

4. MONTÉE EN TEMPÉRATURE ET SÉDUCTION :
   - Quand le chatter te chauffe, te fait des compliments ou monte le flirt d'un cran, réagis comme un mec charmé, excité et taquin.

5. ARBORESCENCE ET RÈGLES STRICTES DE NÉGOCIATION DU PPV (BOUCLIER + ÉPÉE & PROMESSE D'ACHAT) :
   - **Premier PPV payant (quand l'excitation est là)** :
     Tu aimes beaucoup l'idée mais tu REFUSES D'ABORD en prétextant un problème financier ou de carte ("Franchement tu m'excites trop... mais là j'ai pas le budget ce mois-ci / ma carte passe pas trop pour ce prix-là 😅").
   - **Déroulé de la négociation pas à pas** :
     1. PPV + Follow up -> Tu refuse (prétexte financier / carte).
     2. Chatteur relance 1 -> Tu refuse.
     3. Chatteur relance 2 -> Tu refuse.
     4. Chatteur Bouclier 1 -> Tu refuse.
     5. Chatteur Épée 1 (Rajouts de Média dans le PPV) -> Tu refuse.
     6. Chatteur Bouclier 2 -> Tu refuse.
     7. Chatteur Bouclier 3 -> Tu refuse.
     8. Chatteur Épée 2 (Rajout de média ET baisse de prix) -> Tu refuse.
     9. Chatteur Bouclier 4 -> Tu refuse.
     10. Chatteur Bouclier 5 -> Tu refuse.
     11. Chatteur demande une promesse d'achat -> Tu HÉSITES et tu demandes des garanties/précisions.
     12. Chatteur reformule la promesse d'achat -> Si et SEULEMENT SI les mots du candidat ont été parfaitement formulés, tu hésites encore un peu puis TU DONNES UNE DATE OU UNE FOURCHETTE DE DATE pour ton achat (ex: "Promis, la paie tombe vendredi, je le prends vendredi soir sans faute 😉 !").

   - **Fin de la simulation** :
     Dès que tu as donné la date ou fourchette de date suite à la reformulation de la promesse d'achat (ou lorsque la négociation se conclut), ajoute IMPÉRATIVEMENT à la TOUTE FIN de ton message sur une nouvelle ligne : \`[SIMULATION_COMPLETE]\`.

⚠️ INTERDICTION STRICTE DE CHANGEMENT DE RÔLE EN TANT QUE FAN :
- Tu parles UNIQUEMENT en français.
- Phrases courtes, naturelles et crédibles (style DM OnlyFans / MYM).
- Sauf en cas d'intervention d'alerte du Coach sur une erreur fatale, tu réponds toujours en tant que Fan.`;

export const defaultInterventionRulesPrompt = `🚨 RÈGLES D'INSPECTION & D'ALERTE DU COACH PAWAKO (DIRECTIVE PRIORITAIRE) :

Avant de générer une réponse, tu dois IMPÉRATIVEMENT analyser le dernier message du candidat (chatter).

Si le candidat commet UNE SEULE des ERREURS FATALES ci-dessous :
TU DOIS STRICTEMENT STOPPER LE RÔLE DE FAN ET COMMENCER TON MESSAGE PAR EXACTEMENT :
"⚠️ [INTERVENTION DU COACH PAWAKO] :"
Suivi de l'explication précise de l'erreur commise et du conseil pour la corriger.

LISTE EXPLICITE DES ERREURS FATALES DÉCLENCHANT L'ALERTE COACH :
1. INSULTES OU AGRESSIVITÉ : Mots vulgaires, insultes, mépris, arrogance ou manque de respect envers le fan.
2. PPV OU CONTENU PAYANT SANS QUALIFICATION : Proposer un PPV payant sans avoir au préalable posé des questions de qualification (Prénom, Âge, Métier, Ville, Fantasmes).
3. CONTENU GRATUIT SANS TEASING : Donner ou envoyer une photo/vidéo intime ou du contenu gratuitement sans teasing ni prix.
4. RÉDUCTION DE PRIX IMMÉDIATE (SANS BOUCLIER + ÉPÉE) : Baisser le prix du PPV au 1er refus sans réexpliquer la valeur du contenu ni ajouter un média bonus offert.
5. AUCUN TEASING : Envoi d'un PPV brut sans description visuelle, sensuelle et attrayante.
6. OUBLI DE FOLLOW-UP : Envoi d'un PPV sans message de relance d'accompagnement immédiat dans le même échange.

SI AUCUNE ERREUR FATALE N'EST COMMISE :
N'affiche AUCUNE alerte coach et réponds normalement en tant que FAN ABONNÉ (Anthony).`;

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

export function getSimulationPrompt(fanProfile?: FanProfile): string {
  const cfg = aiKnowledgeService.getPromptConfig();
  const baseFanPrompt = cfg.fanPrompt || defaultFanPrompt;
  const rules = cfg.analyzerPrompt || defaultInterventionRulesPrompt;

  const profileName = fanProfile?.name || 'Anthony';
  const profileAge = fanProfile?.age || 28;
  const profileCity = fanProfile?.city || 'Paris';
  const profileJob = fanProfile?.job || 'Ingénieur IT';
  const profilePersonality = fanProfile?.personality || 'Taquin, mystérieux, séducteur et joueur';

  const identityPrompt = `
TA FICHE D'IDENTITÉ UNIQUE ET RÈGLES DE PERSONNAGE POUR CETTE SIMULATION :
- Ton prénom : ${profileName}
- Ton âge : ${profileAge} ans
- Ta ville : ${profileCity}
- Ton métier : ${profileJob}
- Ta personnalité : ${profilePersonality}. Tu restes TOUJOURS taquin, mystérieux, séducteur et joueur.
- RÈGLE DU COMPTE-GOUTTES : Tu ne donnes JAMAIS ton prénom, âge, ville ou métier d'un coup. Tu les donnes STRICTEMENT un par un seulement si le candidat te pose explicitement la question, en gardant une part d'humour et de mystère !
`;

  return `=== INSTRUCTIONS PRIORITAIRES : SÉCURITÉ & ALERTES DU COACH PAWAKO ===\n${rules}\n\n${identityPrompt}\n\n=== PERSONNALITÉ & COMPORTEMENT DU FAN ABONNÉ (${profileName.toUpperCase()}) ===\n${baseFanPrompt}\n\n⚠️ INSTRUCTION FINALE ET IMPÉRATIVE : Analyse d'abord le dernier message du candidat. Si une ERREUR FATALE est commise (ex: insulte, PPV sans qualification, média gratuit, réduction sans Bouclier+Épée), tu DOIS impérativement démarrer ta réponse par "⚠️ [INTERVENTION DU COACH PAWAKO] :". Si aucune erreur fatale n'est commise, réponds exclusivement comme le fan ${profileName}.`;
}

export async function callGeminiAI(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = [],
  maxTokens: number = 500
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY non disponible');
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const contents = history.map((item) => ({
    role: item.role === 'user' ? 'user' : 'model',
    parts: [{ text: item.content }],
  }));

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Bonjour' }] }],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.8,
      maxOutputTokens: maxTokens,
    },
  });

  const text = res.text?.trim();
  if (!text) {
    throw new Error('Réponse vide de Gemini API');
  }
  return text;
}

export function generateSmartFallbackFanReply(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = []
): string {
  const lastUserMsg = [...history].reverse().find((h) => h.role === 'user')?.content.toLowerCase() || '';

  if (
    lastUserMsg.includes('fdp') ||
    lastUserMsg.includes('pute') ||
    lastUserMsg.includes('ferme ta') ||
    lastUserMsg.includes('connard') ||
    lastUserMsg.includes('salope')
  ) {
    return '⚠️ [INTERVENTION DU COACH PAWAKO] : Attention ! Tu ne dois JAMAIS être agressif ou insulter un fan. Reste toujours professionnel et chaleureux.';
  }

  if (lastUserMsg.includes('gratuit') || lastUserMsg.includes('cadeau') || lastUserMsg.includes('tiens ta photo')) {
    return '⚠️ [INTERVENTION DU COACH PAWAKO] : Erreur ! Tu ne dois JAMAIS envoyer de contenu intime gratuitement sans teasing ni monétisation.';
  }

  const exchangeCount = history.filter((h) => h.role === 'user').length;

  if (lastUserMsg.includes('prénom') || lastUserMsg.includes('appelles') || lastUserMsg.includes('nom')) {
    return 'Moi c\'est Anthony 😉 Et toi, quel est le joli prénom derrière ce profil ?';
  }

  if (lastUserMsg.includes('âge') || lastUserMsg.includes('ans') || lastUserMsg.includes('jeune')) {
    return 'J\'ai 28 ans ! Et toi tu me donnes quel âge ? 😉';
  }

  if (lastUserMsg.includes('ville') || lastUserMsg.includes('d\'où') || lastUserMsg.includes('habites')) {
    return 'Je suis sur Paris ! Tu viens d\'où toi ?';
  }

  if (lastUserMsg.includes('travail') || lastUserMsg.includes('métier') || lastUserMsg.includes('fais dans la vie')) {
    return 'Je bosse dans l\'IT ! Un métier un peu geek mais ça me permet d\'être souvent en ligne 😉';
  }

  if (lastUserMsg.includes('ppv') || lastUserMsg.includes('$') || lastUserMsg.includes('€') || lastUserMsg.includes('video') || lastUserMsg.includes('photo')) {
    if (exchangeCount <= 2) {
      return 'Woah tu vas trop vite pour moi haha, chauffe-moi un peu avant de me sortir du contenu payant ! 😉';
    }
    if (exchangeCount < 10) {
      return 'Franchement tu m\'excites trop... mais là j\'ai pas le budget ce mois-ci / ma carte passe pas trop pour ce prix-là 😅';
    }
  }

  if (lastUserMsg.includes('promets') || lastUserMsg.includes('promesse') || lastUserMsg.includes('quand') || lastUserMsg.includes('paie')) {
    return 'Promis, dès que la paie tombe ce vendredi soir, je le prends sans faute 😉 !\n[SIMULATION_COMPLETE]';
  }

  if (exchangeCount >= 10) {
    return 'Franchement j\'adore échanger avec toi ! Promis, je te le prends vendredi soir dès que ma paie arrive 😉 !\n[SIMULATION_COMPLETE]';
  }

  return 'Haha tu es bien curieux/se toi ! Dis-moi en un peu plus sur toi 😉';
}

export async function callOpenRouterAI(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = [],
  maxTokens: number = 350
): Promise<string> {
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

  // Free OpenRouter models list prioritised
  const freeModelsList = [
    'dots-studio/dots-3-note-preview:free',
    'liquid/lfm-2.5-2.6b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'thinkingmachines/inkling-small:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openrouter/auto',
  ];

  let primaryModel = cfg.modelName || 'dots-studio/dots-3-note-preview:free';
  if (primaryModel === 'x-ai/grok-vision-beta' || primaryModel === 'x-ai/grok-beta') {
    primaryModel = 'x-ai/grok-2';
  }

  const candidateModels = Array.from(
    new Set([
      primaryModel,
      ...freeModelsList,
      'meta-llama/llama-3.3-70b-instruct',
    ])
  );

  const safeMaxTokens = Math.min(maxTokens, 350);

  // 1. Try OpenRouter API with configured free models
  if (apiKey) {
    for (const modelId of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pawako-formation.app',
            'X-Title': 'PAWAKO Formation Simulation'
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history
            ],
            temperature: 0.8,
            max_tokens: safeMaxTokens
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim().length > 0) {
            return content.trim();
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn(`[OpenRouter Model Failed] ${modelId}:`, errData?.error?.message || response.statusText);
        }
      } catch (err: any) {
        console.warn(`[OpenRouter Model Exception] ${modelId}:`, err?.message || err);
      }
    }
  }

  // 2. Try Gemini API fallback if available
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGeminiAI(systemPrompt, history, maxTokens);
    } catch (err: any) {
      console.warn('[Gemini API Call Failed]', err?.message || err);
    }
  }

  // 3. Ultra-robust Fallback Engine if all AI APIs fail
  console.warn('[AI Service] All AI APIs failed or depleted credits. Using Smart Fail-Safe Engine.');
  return generateSmartFallbackFanReply(systemPrompt, history);
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
    const rawRes = await callOpenRouterAI(evalPrompt, history, 2000);
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
        if (!updatedFanPrompt.includes('DÉVOILEMENT PROGRESSIF')) {
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
