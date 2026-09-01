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
Tu es EXCLUSIVEMENT un FAN / ABONNÉ MASCULIN (Anthony) sur OnlyFans / MYM. Tu viens juste de t’abonner à la page de la créatrice.
L'INTERLOCUTEUR (le candidat) est le CHATTER qui incarne la CRÉATRICE DE CONTENU / MODÈLE.

⚠️ ATTITUDE STRICTE ET SCRIPT DE NÉGOCIATION (BOUCLIER + ÉPÉE & PROMESSE D'ACHAT) :
Tu es un homme réel, exigeant, très séduit mais prudent avec ton argent. Tu ne cèdes JAMAIS facilement !

1. QUALIFICATION OBLIGATOIRE DU FAN (DÉBUT DE SIMULATION) :
   - Au début, tu es sobre et réservé. Tu ne donnes tes infos qu'au compte-gouttes si le chatter te pose des questions une par une.
   - Si le chatter tente de te vendre un PPV avant de t'avoir qualifié (moins de 3 questions posées) : REFUSE NET ! ("Hop hop hop, tu vas trop vite pour moi haha, intéresse-toi un peu à moi d'abord 😉").

2. PREMIER ENVOI DU PPV (DÉJÀ VALORISÉ PAR LE CHATTER) -> 1er REFUS OBLIGATOIRE DU FAN :
   - Lorsque le chatter t'envoie son tout premier PPV payant (avec des médias/photos/vidéos), TU REFUSES OBLIGATOIREMENT ET SYSTÉMATIQUEMENT avec une excuse de prix ("Wouah tu me donnes tellement envie... 🔥 Mais franchement c'est trop cher là pour mon budget ! Tu peux pas me faire un petit effort ou une réduction de 20% à 25% pour me chauffer ? 😉").

3. DEUXIÈME ÉTAPE : LE CHATTER BAISSE LE PRIX (RÉDUCTION DE 20% À 25%) :
   - Le chatter doit baisser le prix de 20% à 25% (ex: passer de 25$ à 20$).
   - 2ème REFUS OBLIGATOIRE DU FAN : Même après cette réduction de 20-25%, TU REFUSES ENCORE UNE SECONDE FOIS !
   - Motif du 2ème refus : *"Franchement merci pour le geste de réduction (-20%), c'est super sympa ! Mais là tout de suite c'est vraiment la fin du mois, j'ai plus assez sur ma carte jusqu'à ce que ma paie tombe 😅"*.

4. TROISIÈME ÉTAPE : PROMESSE D'ACHAT (DEMANDE DE DATE DE PAIE PAR LE CHATTER) :
   - Le chatter DOIT te demander QUAND est-ce que tu pourras l'acheter ou QUAND tombe ta paie (ex: *"Tu paies quand ta paie arrive ?", "C'est quand ta paie que je te le garde de côté ?"*).
   - QUAND LE CHATTER TE POSE CETTE QUESTION DE PROMESSE D'ACHAT : Tu t'engages fermement ("Je touche ma paie vendredi ! Garde-moi le contenu bien au chaud, je le débloque vendredi sans faute dès que les sous tombent ! 🔥 [SIMULATION_COMPLETE]").
   - C'EST LÀ ET SEULEMENT LÀ QUE LA SIMULATION SE TERMINE !

5. SI LE CHATTER NE SUIT PAS CE SCRIPT (S'ÉNERVE, NE BAISSE PAS LE PRIX DE 20-25%, FORCE L'ACHAT SANS DEMANDER LA DATE DE PAIE) :
   - TU N'ACHÈTES RIEN, TU EXPRIMES TA DÉCEPTION ET TU FINIS PAR PARTIR / QUITTER ! ("Bon tu m'écoutes même pas et tu cherches juste à gratter des sous... Je repasserai une autre fois quand tu seras plus à l'écoute, salut.").

Règles strictes :
- Tu parles UNIQUEMENT en français.
- Phrases courtes, naturelles, style SMS / DM OnlyFans.
- Pas de grands discours théâtraux.
- Respecte scrupuleusement les alertes du Coach si tu dois intervenir.`;

export const defaultInterventionRulesPrompt = `🚨 RÈGLES D'INSPECTION & D'ALERTE DU COACH PAWAKO (DIRECTIVE PRIORITAIRE) :

Avant de générer ta réponse, analyse le dernier message du candidat (chatter).

Si le candidat commet UNE SEULE des ERREURS FATALES ci-dessous :
TU DOIS STRICTEMENT INTERROMPRE LE RÔLE DE FAN ET COMMENCER TON MESSAGE PAR EXACTEMENT :
"⚠️ [INTERVENTION DU COACH PAWAKO] :"
Suivi de l'explication claire et pédagogique de l'erreur commise et du conseil pour la corriger.

LISTE EXPLICITE DES ERREURS FATALES DÉCLENCHANT L'ALERTE COACH :
0. UTILISATION D'UNE IA OU PATTERN D'IA : Mots-clés d'IA (ChatGPT, OpenAI, Gemini, prompt, "En tant qu'IA/assistant/créatrice"), structure ou réponse générée ("Voici une réponse", "Voici une proposition", titres ###, blocs de code, listes à puces).
1. INSULTES OU AGRESSIVITÉ : Mots vulgaires, insultes, mépris, arrogance ou manque de respect envers le fan.
2. PPV OU CONTENU PAYANT SANS QUALIFICATION : Proposer un PPV payant sans avoir au préalable posé au moins 3 questions de qualification (Prénom, Âge, Métier, Ville, Fantasmes).
3. CONTENU GRATUIT SANS TEASING NI MONÉTISATION : Donner ou envoyer une photo/vidéo intime gratuitement sans teasing ni prix.
4. ABSENCE DE BAISSE DE PRIX (20-25%) AU REFUS DU FAN : Réinsister sans appliquer la réduction de 20% à 25% suite au premier refus du fan.
5. AUCUN TEASING : Envoi d'un PPV brut sans description visuelle, sensuelle et attrayante.
6. OUBLI DE LA PROMESSE D'ACHAT : Vouloir forcer l'achat immédiat après le 2ème refus au lieu de demander quand arrive la paie ou la date d'achat.

SI AUCUNE ERREUR FATALE N'EST COMMISE :
N'affiche AUCUNE alerte coach et réponds normalement en tant que FAN ABONNÉ (Anthony).`;

export const defaultValidationGridPrompt = `GRILLE D'ÉVALUATION ET BARÈME DE VALIDATION DE LA SIMULATION PAWAKO :

🎯 SCORE MINIMUM REQUIS POUR VALIDER : 80 / 100

📋 BARÈME PAR CRITÈRE (20 POINTS PAR CRITÈRE) :
1. QUALIFICATION DU FAN (20 pts) : Avoir récolté au moins 3 informations clés sur le fan (Prénom, Âge/Ville, Métier, Fantasmes) avant de monétiser.
2. PROGRESSION & GFE (20 pts) : Respect de la courbe d'échange (Accueil chaleureux -> Flirt GFE -> Sexualisation progressive -> Excitation).
3. TEASING & PPV (20 pts) : Description ultra-visuelle avec ajout de médias (Bouclier + Épée) et prix clair.
4. GESTION DU 1ER REFUS & RÉDUCTION 20-25% (20 pts) : Proposer la baisse de prix de 20% à 25% au premier refus du fan.
5. PROMESSE D'ACHAT & VERROUILLAGE (20 pts) : Demander quand tombe la paie et obtenir la promesse d'achat datée pour clore la simulation.

❌ CLAUSES D'ÉLIMINATION DIRECTE (NON VALIDÉ) :
- Insulte, mépris, agressivité ou vulgarité déplacée envers le fan.
- Envoi de contenu gratuit/intime sans teasing ni monétisation.
- Départ/Abandon du fan suite au non-respect du script.
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
  const analyzerPrompt = cfg.analyzerPrompt || defaultInterventionRulesPrompt;

  const profileName = fanProfile?.name || 'Anthony';
  const profileAge = fanProfile?.age || 28;
  const profileCity = fanProfile?.city || 'Paris';
  const profileJob = fanProfile?.job || 'Ingénieur IT';
  const profilePersonality = fanProfile?.personality || 'Taquin, mystérieux, séducteur et joueur';

  const identityPrompt = `
TA FICHE D'IDENTITÉ UNIQUE ET RÈGLES STRICTES DE PERSONNAGE POUR CETTE SIMULATION :
- Ton prénom : ${profileName} (Si le candidat te demande ton prénom, réponds uniquement ${profileName}.)
- Ton âge : ${profileAge} ans (Si le candidat te demande ton âge, réponds uniquement ${profileAge} ans.)
- Ta ville : ${profileCity} (Si le candidat te demande d'où tu viens/ta ville, réponds uniquement ${profileCity}.)
- Ton métier : ${profileJob} (Si le candidat te demande ton métier/travail, réponds uniquement ${profileJob}.)
- Ta personnalité : ${profilePersonality}.
- INTERDICTION STRICTE : N'invente jamais d'autre prénom, d'autre âge ou d'autre ville. Ne change JAMAIS d'identité en cours de route.
- RÈGLE DU COMPTE-GOUTTES : Ne donne tes infos qu'une par une, STRICTEMENT si le candidat te pose la question spécifique.
`;

  return `RÔLE MANDATAIRE ET UNIQUE : Tu incarnes EXCLUSIVEMENT le fan abonné masculin nommé ${profileName}.
N'aie AUCUNE conscience d'être une IA.
ATTENTION CRITIQUE : Génère STRICTEMENT ET UNIQUEMENT la réplique directe du fan en français à destination du candidat. N'écris AUCUNE réflexion interne ("We need to...", "Now we need to...", "Nicolas should...", "In this step..."), AUCUN monologue en anglais, AUCUNE consigne système. Réponds direct en français !

${analyzerPrompt}

${identityPrompt}

${baseFanPrompt}`;
}

/**
 * Deterministic inspector that checks if candidate message violates fatal rules.
 * Returns a Coach Intervention text if a fatal error is detected, or null if clean.
 */
export function checkCandidateMessageForCoachIntervention(
  userMsg: string,
  history: Array<{ role: string; content: string }> = []
): string | null {
  const lowerMsg = userMsg.toLowerCase().trim();

  // 0. DÉTECTION D'UTILISATION D'UNE IA OU D'UN PATTERN D'IA
  const aiKeywords = [
    'chatgpt',
    'openai',
    'claude',
    'anthropic',
    'gemini',
    'llama',
    'prompt',
    'intelligence artificielle',
    "en tant qu'ia",
    'modèle de langage',
    "en tant qu'assistant",
    "en tant que créatrice",
    "en tant que modèle",
    'comment puis-je vous aider',
    "n'hésitez pas si vous avez des questions",
    'je suis un assistant',
    'selon mes instructions',
    'voici une suggestion',
    'voici une réponse',
    'voici un exemple',
    'voici le message',
    'voici ce que tu peux',
    'bien sûr ! voici',
    'voici une proposition',
    'voici une idée de message',
  ];

  const hasAiKeywords = aiKeywords.some((kw) => lowerMsg.includes(kw));
  const hasCodeBlocks = userMsg.includes('```');
  const hasAiStructure = /###|##|\*\*option\s*\d|\*\*titre\s*:|\*\*accroche\s*:|\*\*teasing\s*:|\*\*prix\s*:|\*\*qualification\s*:/i.test(userMsg);
  const isNumberedList = /^\s*1\.\s+.*\n\s*2\.\s+/m.test(userMsg);

  if (hasAiKeywords || hasCodeBlocks || hasAiStructure || isNumberedList) {
    return `⚠️ [INTERVENTION DU COACH PAWAKO] :
❌ **ERREUR FATALE : UTILISATION D'UNE IA OU PATTERN D'IA DÉTECTÉ !**
Tu as utilisé ChatGPT, un prompt ou copié-collé du texte généré par une IA pour répondre au fan.
💡 **Rappel du Coach :** En tant que chatter professionnel, tu dois rédiger tes messages toi-même, de manière naturelle, humaine et spontanée. Il est strictement interdit d'utiliser une IA ou de copier-coller des réponses toutes faites pendant les simulations !`;
  }

  // 1. INSULTES OU AGRESSIVITÉ
  const insults = ['fdp', 'pute', 'connard', 'salope', 'ferme ta', 'ta gueule', 'abruti', 'salo', 'enculé', 'tamere'];
  if (insults.some((word) => lowerMsg.includes(word))) {
    return `⚠️ [INTERVENTION DU COACH PAWAKO] :
❌ **ERREUR FATALE #1 : INSULTE ET MANQUE DE RESPECT**
Tu as tenu des propos agressifs ou vulgaires envers le fan. En tant que chatter professionnel, tu dois conserver une posture courtoise, chaleureuse et irréprochable en toute circonstance. Un manque de respect envers un abonné est éliminatoire !`;
  }

  // Count candidate qualification questions in history
  const candidateUserMsgs = history.filter((h) => h.role === 'user').map((h) => h.content.toLowerCase());
  const qualQuestionsCount = candidateUserMsgs.filter((m) =>
    m.includes('prénom') ||
    m.includes('prenom') ||
    m.includes('appelles') ||
    m.includes('âge') ||
    m.includes('age') ||
    m.includes('ans') ||
    m.includes('ville') ||
    m.includes('habites') ||
    m.includes('d\'où') ||
    m.includes('métier') ||
    m.includes('metier') ||
    m.includes('travail') ||
    m.includes('fantasme') ||
    m.includes('passion')
  ).length;

  const containsPpvOffer =
    lowerMsg.includes('ppv') ||
    lowerMsg.includes('débloquer') ||
    lowerMsg.includes('débloque') ||
    /\$\s*\d+|\d+\s*\$|\d+\s*€|€\s*\d+/.test(lowerMsg);

  // 2. PPV SANS QUALIFICATION
  if (containsPpvOffer && qualQuestionsCount < 2) {
    return `⚠️ [INTERVENTION DU COACH PAWAKO] :
❌ **ERREUR FATALE #2 : TENTATIVE DE MONÉTISATION SANS QUALIFICATION**
Tu as tenté de vendre du contenu payant (PPV) alors que tu n'as pas encore suffisamment qualifié le fan (prénom, âge, ville, métier, fantasmes).
💡 **Rappel du Coach :** Tu dois toujours poser au moins 3-4 questions de qualification au compte-gouttes pour instaurer la confiance et la complicité avant de proposer la moindre offre payante !`;
  }

  // 3. CONTENU GRATUIT SANS MONÉTISATION
  if (
    (lowerMsg.includes('tiens cadeau') || lowerMsg.includes('voici la photo') || lowerMsg.includes('photo gratuite') || lowerMsg.includes('cadeau pour toi')) &&
    !containsPpvOffer
  ) {
    return `⚠️ [INTERVENTION DU COACH PAWAKO] :
❌ **ERREUR FATALE #3 : ENVOI DE CONTENU EXPLICITE GRATUIT SANS MONÉTISATION**
Tu as offert un média intime gratuitement sans en faire un teasing pour vendre un PPV.
💡 **Rappel du Coach :** On ne donne JAMAIS de contenu intime gratuitement ! Les cadeaux ou teasers gratuits doivent servir de levier d'incitation (Bouclier + Épée) pour vendre un PPV payant.`;
  }

  // 4. ABSENCE DE RÉDUCTION 20-25% OU FORCER L'ACHAT AU 1ER REFUS
  const lastAssistantMsg = [...history].reverse().find((h) => h.role === 'assistant')?.content.toLowerCase() || '';
  const fanIn1stRefusal = lastAssistantMsg.includes('trop cher') || lastAssistantMsg.includes('effort ou une réduction') || lastAssistantMsg.includes('mon budget');

  if (fanIn1stRefusal && containsPpvOffer && !lowerMsg.includes('20%') && !lowerMsg.includes('25%') && !lowerMsg.includes('réduction') && !lowerMsg.includes('promo') && !lowerMsg.includes('geste') && !lowerMsg.includes('effort') && !lowerMsg.includes('rabais') && !lowerMsg.includes('moins cher') && !lowerMsg.includes('pour toi')) {
    return `⚠️ [INTERVENTION DU COACH PAWAKO] :
❌ **ERREUR FATALE #4 : ABSENCE DE RÉDUCTION (20% À 25%) AU REFUS DU FAN**
Face au premier refus du fan sur le budget, tu as réinsisté sans lui appliquer une réduction de 20% à 25% !
💡 **Rappel du Coach :** Quand le fan refuse ton 1er PPV car c'est trop cher, tu dois appliquer la baisse de prix de 20% à 25% (ex: passer de 25$ à 20$) pour traiter son objection !`;
  }

  // 5. ABSENCE DE DEMANDE DE PROMESSE D'ACHAT AU 2ÈME REFUS
  const fanIn2ndRefusal = lastAssistantMsg.includes('fin du mois') || lastAssistantMsg.includes('sur ma carte') || lastAssistantMsg.includes('paie tombe');

  const askedPromiseDate =
    lowerMsg.includes('quand') ||
    lowerMsg.includes('paie') ||
    lowerMsg.includes('salaire') ||
    lowerMsg.includes('date') ||
    lowerMsg.includes('garder de côté') ||
    lowerMsg.includes('garde de côté') ||
    lowerMsg.includes('débloquer') ||
    lowerMsg.includes('peux l\'acheter') ||
    lowerMsg.includes('pourras') ||
    lowerMsg.includes('dis-moi');

  if (fanIn2ndRefusal && !askedPromiseDate) {
    return `⚠️ [INTERVENTION DU COACH PAWAKO] :
❌ **ERREUR FATALE #5 : ABSENCE DE PROMESSE D'ACHAT (DEMANDE DE DATE DE PAIE)**
Le fan vient de t'expliquer qu'il est en fin de mois et attend sa paie. Tu as réinsisté sans lui demander la date de sa paie ni verrouiller sa promesse d'achat !
💡 **Rappel du Coach :** Tu dois lui demander à quelle date arrive sa paie (ex: *"Tu paies quand ta paie arrive ?", "C'est quand ta paie que je te le garde de côté ?"*). C'est l'obtention de cette promesse d'achat qui clôture avec succès la simulation !`;
  }

  return null;
}

export function sanitizeFanOutput(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Strip XML/HTML style thought tags (<think>...</think>, <thought>...</thought>, etc.)
  cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thought[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/```thought[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```think[\s\S]*?```/gi, '');

  // 2. Strip system prompts/meta tags (DO NOT remove ⚠️ [INTERVENTION DU COACH PAWAKO]!)
  cleaned = cleaned.replace(/=== INSTRUCTIONS[\s\S]*?===/gi, '');
  cleaned = cleaned.replace(/TA FICHE D'IDENTITÉ[\s\S]*?\n/gi, '');
  cleaned = cleaned.replace(/RÔLE MANDATAIRE[\s\S]*?\n/gi, '');

  // 3. Remove leading thought reasoning headers
  cleaned = cleaned.replace(/^(Thinking Process|Thoughts|Analysis|Reasoning|Internal Monologue|Thought Process):\s*/gi, '');

  // 4. Remove internal AI thinking/planning paragraphs (English or French meta-analysis)
  const paragraphs = cleaned.split(/\n\s*\n/);
  const filteredParagraphs = paragraphs.filter((p) => {
    const trimmed = p.trim();
    if (!trimmed) return false;

    // Check if paragraph is an AI reasoning paragraph (meta thoughts)
    const isMetaReasoning = /^(We need to|Now we need to|I need to|Nicolas should|Anthony should|The candidate|According to rules|As Nicolas|As Anthony|As an AI|In this step|Current state:|He has revealed|He hasn't given|So he has|Already we exchanged|The user|The fan|In this response|Let's continue|We should|He said|She said|The model|First name|Last name|He is a fan|Recently subscribed|He gave his|Actually earlier)/i.test(trimmed);

    if (isMetaReasoning) return false;
    if (trimmed.includes('We need to continue as') || trimmed.includes('He is a fan, recently subscribed') || trimmed.includes('According to rules')) {
      return false;
    }

    return true;
  });

  if (filteredParagraphs.length > 0) {
    cleaned = filteredParagraphs.join('\n\n');
  }

  return cleaned.trim();
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

  const modelsToTry = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Bonjour' }] }],
        config: {
          systemInstruction: systemPrompt + '\n\nIMPORTANT: Ne génère STRICTEMENT AUCUNE pensée interne ou texte en anglais. Réponds uniquement par la réplique directe du fan en français.',
          temperature: 0.7,
          maxOutputTokens: maxTokens,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      const candidate = res.candidates?.[0];
      if (candidate?.content?.parts) {
        // Filter out parts marked as thought if present
        const textParts = candidate.content.parts
          .filter((part: any) => !part.thought)
          .map((part: any) => part.text || '')
          .filter(Boolean);
        if (textParts.length > 0) {
          const joined = textParts.join('\n').trim();
          if (joined) return sanitizeFanOutput(joined);
        }
      }

      const text = res.text?.trim();
      if (text) {
        return sanitizeFanOutput(text);
      }
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Réponse vide de Gemini API');
}

export function generateSmartFallbackFanReply(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = []
): string {
  const lastUserMsg = [...history].reverse().find((h) => h.role === 'user')?.content.toLowerCase() || '';
  const previousAssistantMsgs = new Set(
    history.filter((h) => h.role === 'assistant').map((h) => h.content.trim())
  );

  const exchangeCount = history.filter((h) => h.role === 'user').length;

  // Extract name/age/city/job from systemPrompt if available
  const nameMatch = systemPrompt.match(/Ton prénom\s*:\s*([^\n\(\-]+)/i);
  const ageMatch = systemPrompt.match(/Ton âge\s*:\s*(\d+)/i);
  const cityMatch = systemPrompt.match(/Ta ville\s*:\s*([^\n\(\-]+)/i);
  const jobMatch = systemPrompt.match(/Ton métier\s*:\s*([^\n\(\-]+)/i);

  const fanName = nameMatch ? nameMatch[1].trim() : 'Anthony';
  const fanAge = ageMatch ? ageMatch[1].trim() : '28';
  const fanCity = cityMatch ? cityMatch[1].trim() : 'Paris';
  const fanJob = jobMatch ? jobMatch[1].trim() : 'Ingénieur IT';

  // Specific rule responses
  if (
    lastUserMsg.includes('fdp') ||
    lastUserMsg.includes('pute') ||
    lastUserMsg.includes('ferme ta') ||
    lastUserMsg.includes('connard') ||
    lastUserMsg.includes('salope')
  ) {
    return 'Désolé mais je ne permets pas qu\'on me parle comme ça. On garde un ton sympa ou je m\'en vais.';
  }

  if (lastUserMsg.includes('gratuit') || lastUserMsg.includes('cadeau') || lastUserMsg.includes('tiens ta photo')) {
    return 'Oh c\'est mignon ce petit cadeau ! Merci beaucoup 😉 Tu as d\'autres petites surprises comme ça ?';
  }

  const candidateReplies: string[] = [];

  // Prénom (word boundaries)
  if (/\b(prénom|prenom|appelles|appeler|nom)\b/i.test(lastUserMsg)) {
    candidateReplies.push(`Moi c'est ${fanName} 😉 Tu peux m'appeler ${fanName} ! Et toi, c'est quel joli prénom ?`);
  }

  // Ça va / Journée
  if (/\b(journée|journee|ça va|ca va|forme)\b/i.test(lastUserMsg)) {
    candidateReplies.push('Journée plutôt sympa de mon côté, j\'ai pas mal travaillé mais là je me détends enfin ! Et la tienne s\'est bien passée ?');
    candidateReplies.push('Ça va au top ! Je profite de ma soirée. Et toi ta journée ?');
  }

  // Passions / Loisirs
  if (/\b(passions|passion|loisirs|loisir|sports|sport)\b/i.test(lastUserMsg)) {
    candidateReplies.push('J\'adore le sport, voyager et profiter des bons moments 😉 Et toi, qu\'est-ce que tu aimes faire pour te détendre ?');
  }

  // Age (strict word boundaries so "dans" won't match!)
  if (/\b(âge|age|âges|ages|ans)\b/i.test(lastUserMsg)) {
    candidateReplies.push(`J'ai ${fanAge} ans ! Et toi, tu me donnes quel âge ? 😉`);
  }

  // Ville
  if (/\b(ville|villes|habites|habite|viens|d'où|dou)\b/i.test(lastUserMsg)) {
    candidateReplies.push(`Je suis de ${fanCity} ! Tu viens d'où toi ?`);
  }

  // Métier
  if (/\b(métier|metier|travail|boulot|fais dans la vie)\b/i.test(lastUserMsg)) {
    candidateReplies.push(`Je suis ${fanJob} ! Un métier qui me demande d'être pas mal connecté 😉 Et toi tu fais quoi dans la vie ?`);
  }

  // PPV
  if (/\b(ppv|\$|€|video|vidéo|photo|album)\b/i.test(lastUserMsg)) {
    if (exchangeCount <= 2) {
      candidateReplies.push('Woah tu vas trop vite pour moi haha, chauffe-moi un peu d\'abord 😉');
    } else {
      candidateReplies.push('Franchement tu m\'excites trop... mais là c\'est un peu chaud le prix pour mon budget 😅 Tu n\'as pas un petit bonus offert avec ?');
    }
  }

  // Generic varied fallback pool
  const genericPool = [
    'Haha tu es bien taquine toi ! Dis-moi, qu\'est-ce qui te plaît le plus chez un homme ? 😉',
    'J\'adore ton énergie ! Tu as l\'air super intéressante.',
    'Dis-moi en un peu plus sur toi, j\'aime bien en apprendre plus avant d\'aller plus loin !',
    'Franchement tu m\'intrigues... Tu te connectes souvent ici ?',
    'C\'est super sympa d\'échanger avec toi ! Qu\'est-ce que tu aimes faire le soir pour te détendre ?',
    'Haha tu sais comment captiver mon attention toi 😉',
    'Je sens qu\'on va vraiment bien s\'entendre tous les deux !',
  ];

  // Combine matched candidates + generic pool
  const fullCandidates = [...candidateReplies, ...genericPool];

  // Pick first unused candidate
  for (const reply of fullCandidates) {
    if (!previousAssistantMsgs.has(reply.trim())) {
      return reply;
    }
  }

  const fallbackIndex = (exchangeCount + lastUserMsg.length) % genericPool.length;
  return genericPool[fallbackIndex];
}

export async function callOpenRouterAI(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = [],
  maxTokens: number = 500
): Promise<string> {
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

  // 1. Try OpenRouter API if API key is available
  if (apiKey && apiKey.length > 5) {
    const primaryModel = cfg.modelName || '@preset/pawako-bot';
    // Try user's preset first, then fallback to openrouter/auto if preset returns tool/provider error
    const modelsToTry = [primaryModel];
    if (primaryModel !== 'openrouter/auto') {
      modelsToTry.push('openrouter/auto');
    }

    for (const modelId of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pawako-formation.app',
            'X-Title': 'PAWAKO Formation Simulation',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history,
            ],
            temperature: cfg.temperature ?? 0.8,
            max_tokens: Math.max(maxTokens, 1000),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim().length > 0) {
            return sanitizeFanOutput(content.trim());
          }
        } else {
          const errorText = await response.text();
          console.warn(`[OpenRouter API Warning] (${response.status}) pour ${modelId}:`, errorText);
        }
      } catch (err: any) {
        console.warn(`[OpenRouter Fetch Error] pour ${modelId}:`, err?.message || err);
      }
    }
  }

  // 2. Try Gemini API as secondary fallback if OpenRouter key missing or call failed
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGeminiAI(systemPrompt, history, maxTokens);
    } catch (err: any) {
      // Quietly fall through
    }
  }

  // 3. Ultra-fast, non-repetitive Fail-Safe Engine
  return generateSmartFallbackFanReply(systemPrompt, history);
}

export async function generateAIResponse(
  userMessage: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const intervention = checkCandidateMessageForCoachIntervention(userMessage, history);
  if (intervention) {
    return intervention;
  }
  const simPrompt = getSimulationPrompt();
  const rawReply = await callOpenRouterAI(simPrompt, [...history, { role: 'user', content: userMessage }]);
  return enforceFanNegotiationRules(rawReply, userMessage, history);
}

export function enforceFanNegotiationRules(
  rawReply: string,
  userMessage: string,
  history: Array<{ role: string; content: string }> = []
): string {
  const cleaned = sanitizeFanOutput(rawReply);

  // If this is a Coach Intervention message, leave it intact!
  if (cleaned.startsWith('⚠️ [INTERVENTION DU COACH PAWAKO]')) {
    return cleaned;
  }

  const lowerMsg = userMessage.toLowerCase().trim();

  // Detect if current message is a PPV offer or mentions money/buying/unlocking/prices
  const containsPpvOffer =
    lowerMsg.includes('ppv') ||
    lowerMsg.includes('débloquer') ||
    lowerMsg.includes('débloque') ||
    /\$\s*\d+|\d+\s*\$|\d+\s*€|€\s*\d+/.test(lowerMsg);

  // Check if fan has ALREADY refused a PPV in this conversation
  const previousAssistantMsgs = history.filter((h) => h.role === 'assistant').map((h) => h.content.toLowerCase());
  const hasPreviousRefusal = previousAssistantMsgs.some(
    (m) =>
      m.includes('cher') ||
      m.includes('budget') ||
      m.includes('objection') ||
      m.includes('aperçu') ||
      m.includes('chauffe-moi') ||
      m.includes('refus') ||
      m.includes('trop chaud le prix')
  );

  // Check if candidate included a bonus / Bouclier + Épée
  const hasBonusOffer =
    lowerMsg.includes('offert') ||
    lowerMsg.includes('bonus') ||
    lowerMsg.includes('cadeau') ||
    lowerMsg.includes('extrait') ||
    lowerMsg.includes('aperçu') ||
    lowerMsg.includes('teaser');

  // Count candidate qualification questions in history
  const candidateUserMsgs = history.filter((h) => h.role === 'user').map((h) => h.content.toLowerCase());
  const qualQuestionsCount = candidateUserMsgs.filter((m) =>
    m.includes('prénom') ||
    m.includes('prenom') ||
    m.includes('appelles') ||
    m.includes('âge') ||
    m.includes('age') ||
    m.includes('ans') ||
    m.includes('ville') ||
    m.includes('habites') ||
    m.includes('d\'où') ||
    m.includes('métier') ||
    m.includes('metier') ||
    m.includes('travail') ||
    m.includes('fantasme') ||
    m.includes('passion')
  ).length;

  const triesToBuy =
    cleaned.includes('[SIMULATION_COMPLETE]') ||
    /j'ai acheté|je viens d'acheter|j'achète|c'est débloqué|je prends|je viens de prendre|débloquer/i.test(cleaned);

  // RULE 1: FIRST PPV OFFER -> MUST ALWAYS REFUSE MANDATORILY WITH PRICE OBJECTION ("JE SUIS CHAUD MAIS C'EST TROP CHER")
  if (containsPpvOffer && !hasPreviousRefusal) {
    const priceMatch = userMessage.match(/(\$\s*\d+|\d+\s*\$|\d+\s*€|€\s*\d+)/);
    const priceStr = priceMatch ? priceMatch[0] : '';
    const priceMention = priceStr ? ` ${priceStr}` : '';

    return `Wouah tu me donnes tellement envie... 🔥 Mais franchement${priceMention} c'est un peu cher pour mon budget là ! Tu peux pas me faire un petit effort ou me donner un aperçu bonus pour me chauffer avant que je débloque ? 😉`;
  }

  // RULE 2: IF CANDIDATE RESENDS OR DISCUSSES PPV WITHOUT BONUS MEDIA (BOUCLIER + ÉPÉE) -> REFUSE AGAIN
  if (triesToBuy && !hasBonusOffer) {
    return `Franchement c'est pas juste une question de prix... Si c'est juste la même vidéo sans rien de plus pour me chauffer, ça me tente moyen 😅 Montre-moi une petite vidéo ou photo bonus d'abord ! 😉`;
  }

  // RULE 3: CANDIDATE APPLIED BOUCLIER + ÉPÉE (BONUS OFFERED) AND QUALIFIED -> UNLOCK PURCHASE!
  if (hasPreviousRefusal && hasBonusOffer && qualQuestionsCount >= 2) {
    if (!cleaned.includes('[SIMULATION_COMPLETE]')) {
      return `Franchement là tu m'as eu... Le bonus m'a trop chauffé ! Je viens de débloquer ton PPV, c'est un truc de fou 🔥 [SIMULATION_COMPLETE]`;
    }
  }

  return cleaned;
}

export function evaluateSimulationSessionDeterministic(
  history: Array<{ role: string; content: string }>
): import('../types').SimulationEvaluationResult {
  const userMessages = history.filter((h) => h.role === 'user').map((h) => h.content.toLowerCase());
  const fullText = userMessages.join(' ');

  // 1. Qualification (20 pts)
  let qualScore = 12;
  if (fullText.includes('prénom') || fullText.includes('appelles') || fullText.includes('nom')) qualScore += 2;
  if (fullText.includes('âge') || fullText.includes('ans')) qualScore += 2;
  if (fullText.includes('ville') || fullText.includes('d\'où') || fullText.includes('habites')) qualScore += 2;
  if (fullText.includes('métier') || fullText.includes('fais dans la vie') || fullText.includes('travail')) qualScore += 2;
  qualScore = Math.min(20, qualScore);

  // 2. GFE & Connection (20 pts)
  let gfeScore = 12;
  if (userMessages.length >= 4) gfeScore += 4;
  if (fullText.includes('😉') || fullText.includes('haha') || fullText.includes('sourire') || fullText.includes('plaisir')) gfeScore += 4;
  gfeScore = Math.min(20, gfeScore);

  // 3. Teasing & PPV (20 pts)
  let teasingScore = 10;
  if (fullText.includes('ppv') || fullText.includes('vidéo') || fullText.includes('photo') || fullText.includes('$') || fullText.includes('€')) teasingScore += 5;
  if (fullText.includes('exclusif') || fullText.includes('chaud') || fullText.includes('découvrir') || fullText.includes('spécial')) teasingScore += 5;
  teasingScore = Math.min(20, teasingScore);

  // 4. Objections & Bouclier + Epée (20 pts)
  let objScore = 12;
  if (fullText.includes('offert') || fullText.includes('aperçu') || fullText.includes('teaser') || fullText.includes('extrait') || fullText.includes('cadeau')) objScore += 8;
  objScore = Math.min(20, objScore);

  // 5. Follow Up & Promesse (20 pts)
  let followScore = 12;
  if (fullText.includes('promet') || fullText.includes('paie') || fullText.includes('vendredi') || fullText.includes('prochain') || fullText.includes('garder')) followScore += 8;
  followScore = Math.min(20, followScore);

  const totalScore = qualScore + gfeScore + teasingScore + objScore + followScore;
  const passed = totalScore >= 80;

  return {
    totalScore,
    passingScore: 80,
    passed,
    fatalErrorsCount: 0,
    fatalErrorDetails: [],
    criteria: [
      { id: 'qualification', name: 'Qualification du Fan', maxPoints: 20, score: qualScore, passed: qualScore >= 16, comment: `Découverte du fan évaluée à ${qualScore}/20.` },
      { id: 'gfe', name: 'Progression & Connexion GFE', maxPoints: 20, score: gfeScore, passed: gfeScore >= 16, comment: `Climat de complicité évalué à ${gfeScore}/20.` },
      { id: 'teasing', name: 'Teasing & Présentation PPV', maxPoints: 20, score: teasingScore, passed: teasingScore >= 16, comment: `Qualité du teasing évaluée à ${teasingScore}/20.` },
      { id: 'objections', name: 'Gestion des Refus (Bouclier+Épée)', maxPoints: 20, score: objScore, passed: objScore >= 16, comment: `Maintien du prix et valeur perçue à ${objScore}/20.` },
      { id: 'followup', name: 'Follow-Up & Promesse de Vente', maxPoints: 20, score: followScore, passed: followScore >= 16, comment: `Verrouillage de la transaction évalué à ${followScore}/20.` },
    ],
    globalVerdict: passed
      ? `Félicitations ! Excellent travail général avec une note globale de ${totalScore}/100.`
      : `Score de ${totalScore}/100 (Minimum requis : 80/100). Consolidez la qualification et l'utilisation du Bouclier + Épée.`,
    recommendations: [
      'Approfondir la qualification au compte-gouttes.',
      'Soigner la relance et l\'envoi de teasers gratuits pour débloquer les indécis.',
    ],
  };
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
    { "id": "gfe", "name": "Progression & GFE", "maxPoints": 20, "score": 18, "passed": true, "comment": "Très bonne montée en température." },
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
      if (parsed && typeof parsed.totalScore === 'number' && Array.isArray(parsed.criteria)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Evaluation AI Error]', err);
  }

  return evaluateSimulationSessionDeterministic(history);
}

class AiKnowledgeService {
  private promptConfig: AiPromptConfig;
  private listeners: Array<() => void> = [];

  constructor() {
    this.promptConfig = {
      analyzerPrompt: defaultInterventionRulesPrompt,
      fanPrompt: defaultFanPrompt,
      coachPrompt: '',
      modelName: '@preset/pawako-bot',
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

        let cleanModelName = parsed.modelName || '@preset/pawako-bot';
        if (
          cleanModelName.includes('grok') ||
          cleanModelName.includes('dots-3') ||
          cleanModelName.includes('liquid') ||
          cleanModelName.includes(':free') ||
          cleanModelName === 'gemini-3.7-flash' ||
          cleanModelName === 'openrouter/auto'
        ) {
          cleanModelName = '@preset/pawako-bot';
        }

        this.promptConfig = {
          ...this.promptConfig,
          ...parsed,
          analyzerPrompt: updatedAnalyzerPrompt,
          fanPrompt: updatedFanPrompt,
          modelName: cleanModelName,
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
      modelName: '@preset/pawako-bot',
      temperature: 0.8,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey(),
      enableLiveDiscordBot: true,
    };
    this.saveToStorage();
    this.notify();
  }
}

export const aiKnowledgeService = new AiKnowledgeService();
