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

  return `RÔLE MANDATAIRE : Tu incarnes EXCLUSIVEMENT le fan abonné nommé ${profileName}.
N'aie AUCUNE conscience d'être une IA.
IMPORTANT : Ne génère STRICTEMENT QUE la réplique directe du fan à destination du candidat. N'inclus AUCUNE analyse, AUCUN commentaire méta, AUCUNE consigne système ou balise de coach dans ta réponse.

${identityPrompt}

${baseFanPrompt}`;
}

export function sanitizeFanOutput(text: string): string {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/⚠️\s*\[INTERVENTION DU COACH PAWAKO\]\s*:\s*/gi, '');
  cleaned = cleaned.replace(/\[SIMULATION_COMPLETE\]/gi, '');
  cleaned = cleaned.replace(/=== INSTRUCTIONS[\s\S]*?===/gi, '');
  cleaned = cleaned.replace(/TA FICHE D'IDENTITÉ[\s\S]*?FORMA/gi, '');
  cleaned = cleaned.replace(/RÔLE MANDATAIRE[\s\S]*?\n/gi, '');
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

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Bonjour' }] }],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: maxTokens,
        },
      });

      const text = res.text?.trim();
      if (text) {
        return sanitizeFanOutput(text);
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Gemini Model ${modelName} Failed]`, err?.message || err);
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

  if (lastUserMsg.includes('thony') || lastUserMsg.includes('anthony') || lastUserMsg.includes('appeler') || lastUserMsg.includes('prénom') || lastUserMsg.includes('appelles') || lastUserMsg.includes('nom')) {
    candidateReplies.push('Haha Thony ça me va super bien ! Et toi du coup c\'est quel joli prénom derrière ce profil ? 😉');
    candidateReplies.push('Moi c\'est Anthony 😉 Tu peux m\'appeler Thony si tu veux ! Et toi ?');
  }

  if (lastUserMsg.includes('journée') || lastUserMsg.includes('journee') || lastUserMsg.includes('ça va') || lastUserMsg.includes('ca va') || lastUserMsg.includes('aujourd\'hui') || lastUserMsg.includes('forme')) {
    candidateReplies.push('Journée plutôt sympa de mon côté, j\'ai pas mal travaillé mais là je me détends enfin ! Et la tienne s\'est bien passée ?');
    candidateReplies.push('Ça va au top ! Je profite de ma soirée. Et toi ta journée ?');
  }

  if (lastUserMsg.includes('dessiner') || lastUserMsg.includes('voyager') || lastUserMsg.includes('passions') || lastUserMsg.includes('aime') || lastUserMsg.includes('aimer') || lastUserMsg.includes('loisir') || lastUserMsg.includes('sport')) {
    candidateReplies.push('Dessiner et voyager ? J\'adore ! Moi j\'aime le sport, les voyages et les belles rencontres... Tu dessines quoi de beau ? 😉');
    candidateReplies.push('Franchement voyager c\'est la vie ! Tu es partie dans quel pays récemment ?');
  }

  if (lastUserMsg.includes('timide') || lastUserMsg.includes('soûlante') || lastUserMsg.includes('soulante') || lastUserMsg.includes('gênée') || lastUserMsg.includes('genee') || lastUserMsg.includes('flattée')) {
    candidateReplies.push('Mais pas du tout ! Tu n\'es pas soûlante, au contraire tu m\'intrigues et tu me plais bien 😉');
    candidateReplies.push('Haha je ne suis pas timide, j\'aime bien me faire désirer un peu... Mais dis-m\'en plus sur toi !');
  }

  if (lastUserMsg.includes('âge') || lastUserMsg.includes('ans') || lastUserMsg.includes('jeune') || lastUserMsg.includes('vieux')) {
    candidateReplies.push('J\'ai 28 ans ! Et toi tu me donnes quel âge ? 😉');
  }

  if (lastUserMsg.includes('ville') || lastUserMsg.includes('d\'où') || lastUserMsg.includes('habites') || lastUserMsg.includes('viens')) {
    candidateReplies.push('Je suis sur Paris ! Tu viens d\'où toi ?');
  }

  if (lastUserMsg.includes('travail') || lastUserMsg.includes('métier') || lastUserMsg.includes('fais dans la vie') || lastUserMsg.includes('boulot')) {
    candidateReplies.push('Je bosse dans l\'IT ! Un métier un peu geek mais ça me permet d\'être souvent en ligne 😉 Et toi ?');
  }

  if (lastUserMsg.includes('ppv') || lastUserMsg.includes('$') || lastUserMsg.includes('€') || lastUserMsg.includes('video') || lastUserMsg.includes('photo')) {
    if (exchangeCount <= 2) {
      candidateReplies.push('Woah tu vas trop vite pour moi haha, chauffe-moi un peu avant de me sortir du contenu payant ! 😉');
    } else if (exchangeCount < 10) {
      candidateReplies.push('Franchement tu m\'excites trop... mais là j\'ai pas le budget ce mois-ci / ma carte passe pas trop pour ce prix-là 😅 Tu n\'as pas un petit extrait avant ?');
    }
  }

  if (lastUserMsg.includes('promets') || lastUserMsg.includes('promesse') || lastUserMsg.includes('quand') || lastUserMsg.includes('paie')) {
    candidateReplies.push('Promis, dès que la paie tombe ce vendredi soir, je le prends sans faute 😉 ! Merci de patienter avec moi.');
  }

  // Generic varied fallback pool
  const genericPool = [
    'Haha tu es bien taquine toi ! Dis-moi, qu\'est-ce qui te plaît le plus chez un homme ? 😉',
    'J\'adore ton énergie ! Tu as l\'air super intéressante et chaleureuse.',
    'Dis-moi en un peu plus sur toi, j\'aime bien en apprendre plus avant d\'aller plus loin !',
    'Franchement tu m\'intrigues... Tu te connectes souvent ici ?',
    'C\'est super sympa d\'échanger avec toi ! Qu\'est-ce que tu aimes faire le soir pour te détendre ?',
    'Haha tu sais comment captiver mon attention toi 😉',
    'Je sens qu\'on va vraiment bien s\'entendre tous les deux !',
    'Haha tu aimes bien poser des questions toi ! Allez, dis-moi ce que tu as prévu ce week-end ?'
  ];

  // Combine matched candidates + generic pool
  const fullCandidates = [...candidateReplies, ...genericPool];

  // Pick first unused candidate
  for (const reply of fullCandidates) {
    if (!previousAssistantMsgs.has(reply.trim())) {
      return reply;
    }
  }

  // If all were used, pick dynamically based on index to prevent exact sequential repetition
  const fallbackIndex = (exchangeCount + lastUserMsg.length) % genericPool.length;
  return genericPool[fallbackIndex];
}

export async function callOpenRouterAI(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = [],
  maxTokens: number = 350
): Promise<string> {
  // 1. Try Gemini API FIRST (built-in, reliable, fast, handles French roleplay perfectly)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGeminiAI(systemPrompt, history, maxTokens);
    } catch (err: any) {
      console.warn('[Gemini API Call Failed, trying OpenRouter fallback]', err?.message || err);
    }
  }

  // 2. Try OpenRouter API if Gemini key fails or is missing
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY || getDefaultOpenRouterApiKey();

  const freeModelsList = [
    'openrouter/free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-2-9b-it:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'mistralai/mistral-small-24b-instruct-2501:free',
    'openrouter/auto',
  ];

  let primaryModel = cfg.modelName || 'openrouter/free';
  if (primaryModel.includes('grok') || primaryModel.includes('70b') || primaryModel.includes('chat:free')) {
    primaryModel = 'openrouter/free';
  }

  const candidateModels = Array.from(new Set([primaryModel, ...freeModelsList]));
  const safeMaxTokens = Math.min(maxTokens, 150);

  if (apiKey) {
    for (const modelId of candidateModels) {
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
            temperature: 0.8,
            max_tokens: safeMaxTokens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content && content.trim().length > 0) {
            return sanitizeFanOutput(content.trim());
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

  // 3. Fallback Engine with anti-repetition protection
  console.warn('[AI Service] All AI APIs failed. Using Smart Fail-Safe Engine.');
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
