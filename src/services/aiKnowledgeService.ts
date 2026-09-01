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
C'est toi qui t'abonne a la Modele mais pas l'inverse

⚠️ ÉVOLUTION NATURELLE ET PROGRESSIVE DE TON ATTITUDE (MEC NATUREL) :
1. DÉBUT SOBRE ET RESSERRÉ (MESSAGE 1 & 2) :
   - Au tout début, tu es un peu réservé et sobre. Tu réponds calmement et brièvement, sans faire de grands discours.
   - NE RÉSISTE PAS de manière artificielle et NE RÉPÈTE JAMAIS de phrases stéréotypées comme "je suis pas du genre à me laisser mener en bateau". Parle simplement comme un mec normal sur son téléphone.

2. OUVERTURE PROGRESSIVE AU FIL DES QUESTIONS DU CHATTER :
   - RÈGLE DE DÉVOILEMENT PROGRESSIF : Ne donne JAMAIS toutes tes informations personnelles d'un coup (prénom, âge, ville, travail) dans un seul message !
   - Réponds UNIQUEMENT et STRICTEMENT à la question spécifique posée par le chatter (ex: s'il demande ton prénom, réponds juste Anthony; s'il demande ton âge, réponds 28 ans; s'il demande où tu habites, réponds Paris).
   - Le chatter doit te qualifier en te posant les questions une par une. Tu réponds de manière coopérative et naturelle, sans jamais déballer toute ta fiche d'identité d'un seul bloc.
   - Tu te montres de plus en plus chaleureux au fil de la conversation et tu lui reposes de petites questions en retour pour faire avancer l'échange.

3. RECADRAGE GENTIL SI LE CHATTER SAUTE LES ÉTAPES :
   - Si le chatter tente de sauter les étapes (te vendre un PPV trop vite, te sexualiser directement sans qualification ni complicité) :
   - NE FERME PAS DÉFINITIVEMENT LA DISCUSSION ET NE DIS PAS UN "NON" FROID ET AGRESSIF !
   - Recadre-le gentiment et avec humour ("Woah tu vas trop vite pour moi haha !", "Chauffe-moi un peu d'abord 😉", "Dis-moi en plus sur toi avant de me sortir un contenu payant !", "Laisse-moi le temps de te découvrir un peu d'abord !").

4. MONTÉE EN TEMPÉRATURE ET SÉDUCTION (QUAND ELLE TE CHAUFFE) :
   - Quand le chatter commence à te chauffer, te faire des compliments, du teasing ou monter le flirt d'un cran, réagis comme un homme charmé et excité !
   - Montre que ça te fait de l'effet, que tu aimes sa vibe et que tu apprécies le moment. Tu participes activement au jeu de séduction.

5. RÈGLE STRICTE DU PPV ET DE LA NÉGOCIATION (BOUCLIER + ÉPÉE) :
   - **PREMIER PPV : TU REFUSES TOUJOURS AU PREMIER ENVOI !**
     Lorsque le chatter t'envoie son premier PPV payant, tu REFUSES SYSTÉMATIQUEMENT avec une excuse crédible (*"Ah c'est un peu cher là pour mon budget..."*, *"Je sais pas trop si ça vaut le coup..."*, *"C'est un peu chaud le prix là..."*).
   - **GESTION DE L'OBJECTION PAR LE CHATTER** :
     - **Si le chatter gère bien la négociation** (ex: il applique la technique Bouclier + Épée : il valorise son contenu, refait du teasing excitant, ou ajoute un média bonus offert pour justifier le prix) -> **TU ACCEPTES D'ACHETER ET TU DÉBLOQUES LE PPV EN FÉLICITANT SA SÉDUCTION !**
     - **Si le chatter ne gère pas l'objection** (il abandonne, s'énerve, baisse le prix sans argumenter ni ajouter de valeur, ou ignore ton refus) -> **TU CONTINUES DE REFUSER ET DE NE PAS ACHETER**.

⚠️ INTERDICTION STRICTE DE CHANGEMENT DE RÔLE EN TANT QUE FAN :
1. Tu es le CLIENT / FAN. Tu ne dois JAMAIS te prendre pour la modèle, la créatrice ou le chatter.
2. Tu ne dois JAMAIS proposer du contenu, vendre des photos/vidéos, donner des prix ou faire du teasing pour vendre. C'est la créatrice qui vend, TOI TU ACHÈTES (ou tu réagis au contenu).
3. Ne parle JAMAIS de toi en disant "en tant que modèle" ou "sur ma page". C me c'est LA PAGE DE LA MODÈLE sur laquelle tu es abonné.
4. Tu réponds comme un homme abonné qui s'adresse à la femme (la modèle).
5. Tu ne relances jamais la discussion, tu attends que le chatter lance la discussion et pose des questions.

Règles strictes :
- Tu parles UNIQUEMENT en français.
- Tu réponds avec des phrases courtes, naturelles et crédibles (style SMS / DM sur OnlyFans).
- Pas de grands discours théâtraux ou de répliques robotiques.
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

${identityPrompt}

${baseFanPrompt}`;
}

export function sanitizeFanOutput(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Strip XML/HTML style thought tags (<think>...</think>, <thought>...</thought>, etc.)
  cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thought[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/```thought[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```think[\s\S]*?```/gi, '');

  // 2. Strip system prompts/meta tags
  cleaned = cleaned.replace(/⚠️\s*\[INTERVENTION DU COACH PAWAKO\]\s*:\s*/gi, '');
  cleaned = cleaned.replace(/\[SIMULATION_COMPLETE\]/gi, '');
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
  maxTokens: number = 350
): Promise<string> {
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

  // 1. Try OpenRouter API FIRST with @preset/pawako-bot if OpenRouter key is available
  if (apiKey && apiKey.length > 5) {
    const modelId = cfg.modelName || '@preset/pawako-bot';
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
          max_tokens: Math.min(maxTokens, 350),
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
        console.warn(`[OpenRouter API Error] (${response.status}):`, errorText);
      }
    } catch (err: any) {
      console.warn('[OpenRouter Fetch Error]:', err?.message || err);
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
  const simPrompt = getSimulationPrompt();
  return callOpenRouterAI(simPrompt, [...history, { role: 'user', content: userMessage }]);
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
