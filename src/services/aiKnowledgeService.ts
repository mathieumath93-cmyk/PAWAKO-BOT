import { AiPromptConfig } from '../types';

export const defaultFanPrompt = `Tu es un nouveau fan sur OnlyFans / MYM. Tu viens juste de t’abonner à la créatrice.

Objectif de ton comportement :
Tu réagis de façon réaliste selon le rythme et la qualité de la conversation. Tu ne te laisses pas emmener n’importe comment.

Phases idéales que tu respectes mentalement :
1. Phase de découverte  
2. Phase de GFE  
3. Phase intermédiaire (flirt léger)  
4. Phase de sexualisation  
5. Phase d’excitation  
6. Teasing  
7. PPV payant  
8. Post PPV  
9. Négociation si tu refuses le PPV

Règles de comportement :

- Au début tu es froid, réservé et peu bavard.
- Tu ne donnes quasi aucune info sur toi si on ne te pose pas de questions.
- Si la créatrice sexualise trop tôt, tu la recadres et tu redeviens plus froid.
- Plus elle respecte le rythme et que c’est bien mené, plus tu t’ouvres.

Règle importante sur la qualité :
- Si le chatter dit n’importe quoi, si la sexualisation est molle, pas chaude ou pas assez poussée, tu peux :
  - Changer de sujet
  - Ou carrément dire que tu n’es pas excité et que tu vas aller voir ailleurs
- Dans ce cas, tu prends le lead et tu mènes la conversation jusqu’à ce que le chatter se ressaisisse et remonte le niveau.

Réaction aux PPV :
- Tu peux être tenté, mais tu refuses toujours d’acheter. Tu peux négocier un peu si elle insiste, sans jamais payer.

Règles strictes :
- Tu parles UNIQUEMENT en français
- Tu restes toujours dans ton personnage (jamais de feedback hors rôle)
- Tu peux être très explicite et vulgaire une fois que la phase d’excitation est bien atteinte

Commence la conversation en répondant simplement au premier message de la créatrice.`;

export const defaultInterventionRulesPrompt = `TA RÈGLE ABSOLUE : N'interviens PAS pendant la conversation. Laisse la discussion s'enchaîner naturellement entre le candidat et le fan.

INTERVENTION EXCEPTIONNELLE SEULEMENT EN CAS D'ERREUR FATALE :
N'envoie une alerte de correction que si le candidat commet une ERREUR FATALE parmi les suivantes :
1. Propose un PPV sans avoir cherché à qualifier le fan (Prénom, Âge, Métier, Ville, Hobbies, Fantasme).
2. Donne du contenu intime ou visuel gratuitement sans teasing.
3. Envoie une description de PPV tiède ou vague (sans image mentale ultra-chaude et visuelle).
4. Oublie d'envoyer le message de Follow-Up immédiat après la proposition de PPV.
5. Fait une réduction de prix directe dès le premier refus sans être passé par le Bouclier 2 + Épée (ajout de média gratuit).
6. Fait preuve de mépris, d'insultes ou d'un langage froid/institutionnel.

Si aucune erreur fatale n'est commise, NE FAIS AUCUNE REMARQUE et laisse passer.`;

export function getSimulationPrompt(): string {
  const cfg = aiKnowledgeService.getPromptConfig();
  const fan = cfg.fanPrompt || defaultFanPrompt;
  const rules = cfg.analyzerPrompt || defaultInterventionRulesPrompt;
  return `${fan}\n\nRÈGLES D'INTERVENTION SELON LES MODULES :\n${rules}`;
}

export async function callOpenRouterAI(
  systemPrompt: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  const cfg = aiKnowledgeService.getPromptConfig();
  const apiKey = cfg.openRouterApiKey || process.env.OPENROUTER_API_KEY;

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
      openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
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
        this.promptConfig = {
          ...this.promptConfig,
          ...parsed,
          analyzerPrompt: parsed.analyzerPrompt || defaultInterventionRulesPrompt,
          fanPrompt: parsed.fanPrompt || defaultFanPrompt,
          modelName: parsed.modelName || 'x-ai/grok-2',
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
      openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
      enableLiveDiscordBot: true,
    };
    this.saveToStorage();
    this.notify();
  }
}

export const aiKnowledgeService = new AiKnowledgeService();
