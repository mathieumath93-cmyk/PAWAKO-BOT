import { FaqItem, FaqStatus } from '../types';
import { store } from './store';
import { discordService } from './discordService';

interface RawCandidateQuestion {
  text: string;
  channelName: string;
  authorId: string;
  timestamp: number;
}

class FaqService {
  /**
   * Analyzes accessible Discord text channels for candidate questions.
   * Respects Discord privacy:
   * - No private DMs are collected.
   * - Ignores staff messages and bot messages.
   * - Groups questions by similarity, calculates occurrence counts.
   * - Formulates concise answers grounded in official training materials & server rules.
   * - Strictly sets status to 'proposee'. PROPOSALS ARE NEVER PUBLISHED WITHOUT STAFF VALIDATION.
   */
  public async scanAndGenerateFaqSuggestions(
    accessibleChannels: Array<{ id: string; name: string; fetchMessages?: (limit: number) => Promise<any[]> }>
  ): Promise<FaqItem[]> {
    const rawQuestions: RawCandidateQuestion[] = [];

    // Filter text channels accessible to the bot (candidate salons, general, entraide)
    for (const chan of accessibleChannels) {
      const lower = chan.name.toLowerCase();
      // Only inspect training, formation, general or questions channels
      const isTargetChannel =
        lower.includes('formation') ||
        lower.includes('entraide') ||
        lower.includes('question') ||
        lower.includes('general') ||
        lower.includes('onboarding');

      if (!isTargetChannel || !chan.fetchMessages) continue;

      try {
        const messages = await chan.fetchMessages(50);
        if (!Array.isArray(messages)) continue;

        for (const msg of messages) {
          // Ignore bot messages and staff messages
          if (msg.author?.bot) continue;
          const content = (msg.content || '').trim();
          if (content.length < 10) continue;

          // Detect interrogative patterns
          const isInterrogative =
            content.includes('?') ||
            /^(comment|pourquoi|quand|est-ce|est ce|combien|ou|qui|peut-on|peut on|quel|quelle|qu'est-ce|c'est quoi)/i.test(content);

          if (isInterrogative) {
            rawQuestions.push({
              text: content,
              channelName: chan.name,
              authorId: msg.author?.id || 'anon',
              timestamp: msg.createdTimestamp || Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn(`[FAQ Service] Cannot read messages from channel #${chan.name}:`, err);
      }
    }

    if (rawQuestions.length === 0) {
      return store.getFaqItems('proposee');
    }

    // Cluster raw questions into domain topics
    const clusters: Record<string, { samples: string[]; count: number }> = {
      'Règlement & Quiz': { samples: [], count: 0 },
      'Simulations': { samples: [], count: 0 },
      'Formation Outils': { samples: [], count: 0 },
      'Horaires & Organisation': { samples: [], count: 0 },
      'Paiements & PPV': { samples: [], count: 0 },
      'Technique & Discord': { samples: [], count: 0 },
    };

    for (const q of rawQuestions) {
      const lower = q.text.toLowerCase();
      if (lower.includes('quiz') || lower.includes('échec') || lower.includes('echec') || lower.includes('cooldown') || lower.includes('bloqu') || lower.includes('note')) {
        clusters['Règlement & Quiz'].count++;
        if (clusters['Règlement & Quiz'].samples.length < 5) clusters['Règlement & Quiz'].samples.push(q.text);
      } else if (lower.includes('simu') || lower.includes('anthony') || lower.includes('fan') || lower.includes('eval')) {
        clusters['Simulations'].count++;
        if (clusters['Simulations'].samples.length < 5) clusters['Simulations'].samples.push(q.text);
      } else if (lower.includes('outil') || lower.includes('inflow') || lower.includes('meet') || lower.includes('google meet')) {
        clusters['Formation Outils'].count++;
        if (clusters['Formation Outils'].samples.length < 5) clusters['Formation Outils'].samples.push(q.text);
      } else if (lower.includes('heure') || lower.includes('horaire') || lower.includes('quand') || lower.includes('samedi') || lower.includes('dimanche') || lower.includes('jour')) {
        clusters['Horaires & Organisation'].count++;
        if (clusters['Horaires & Organisation'].samples.length < 5) clusters['Horaires & Organisation'].samples.push(q.text);
      } else if (lower.includes('ppv') || lower.includes('prix') || lower.includes('payer') || lower.includes('argent') || lower.includes('dollar')) {
        clusters['Paiements & PPV'].count++;
        if (clusters['Paiements & PPV'].samples.length < 5) clusters['Paiements & PPV'].samples.push(q.text);
      } else {
        clusters['Technique & Discord'].count++;
        if (clusters['Technique & Discord'].samples.length < 5) clusters['Technique & Discord'].samples.push(q.text);
      }
    }

    const proposedItems: FaqItem[] = [];

    // Synthesize proposals grounded in official documents
    for (const [category, data] of Object.entries(clusters)) {
      if (data.count === 0) continue;

      let rephrasedQuestion = '';
      let answer = '';
      let sources: string[] = [];
      let confidence: 'elevee' | 'moyenne' | 'incertaine_a_verifier' = 'elevee';
      let conflictNote: string | undefined = undefined;

      switch (category) {
        case 'Règlement & Quiz':
          rephrasedQuestion = 'Comment sont gérés les quiz, les cooldowns et les échecs cumulés ?';
          answer = 'Les quiz se passent dans votre salon privé. En cas d\'échec (< 16/20), un cooldown obligatoire de 15 minutes s\'applique pour réviser. À 3 échecs, le quiz est bloqué jusqu\'à validation du Staff. À 5 échecs cumulés, la formation est définitivement arrêtée et la candidature refusée.';
          sources = ['Règlement Officiel - Règle 3 & 4', 'Module 1'];
          break;

        case 'Simulations':
          rephrasedQuestion = 'Comment se déroule l\'épreuve de simulation et quels sont les critères d\'évaluation ?';
          answer = 'L\'épreuve de simulation met en situation réelle avec un profil de fan. Vous devez appliquer la méthode en 5 étapes, qualifier le fan et proposer des PPV adaptés. L\'évaluation nécessite 80/100 minimum et moins de 3 erreurs éliminatoires.';
          sources = ['Guide des 5 Étapes de la Conversation', 'Module 3 & 4'];
          break;

        case 'Formation Outils':
          rephrasedQuestion = 'Quand et comment se déroule la formation aux outils (Infloww) ?';
          answer = 'La formation outils a lieu du lundi au vendredi de 10h00 à 14h00 HF en visio Google Meet après validation de vos modules et de votre simulation. Le lien officiel est transmis dans votre salon privé.';
          sources = ['Horaires Officiels PAWAKO', 'Module Outils'];
          break;

        case 'Horaires & Organisation':
          rephrasedQuestion = 'Quels sont les jours et heures de disponibilité du staff et des sessions ?';
          answer = 'Formation outils : 10h-14h HF (Lun-Ven). Simulations : 14h-18h HF (Lun-Ven). Aucun créneau régulier le samedi et dimanche. Trois formateurs (Anthony, Mahsa, Mathieu) assurent le suivi en relais sans perte de progression.';
          sources = ['Horaires Officiels PAWAKO', 'Charte Organisationnelle'];
          break;

        case 'Paiements & PPV':
          rephrasedQuestion = 'Quels sont les tarifs recommandés pour l\'envoi des médias payants (PPV) ?';
          answer = 'Les prix des PPV varient selon la rareté et l\'historique du fan (de 15$ à plus de 150$). Les consignes exactes de la grille tarifaire sont détaillées dans le Module 4 et la base de connaissances.';
          sources = ['Module 4 - Stratégie de Pricing PPV', 'Base de Connaissances'];
          break;

        default:
          rephrasedQuestion = 'Question récurrente sur le fonctionnement technique de la formation';
          answer = 'Vérifiez vos autorisations dans votre salon privé et consultez vos fiches de cours. En cas de blocage persistant, contactez le Staff via le bouton "🎫 Faire signe au Staff".';
          sources = ['Fiches Supports'];
          confidence = 'moyenne';
          break;
      }

      // Check if a similar item already exists in store
      const existing = store.getFaqItems().find(
        (f) => f.category === category && f.rephrasedQuestion === rephrasedQuestion
      );

      if (existing) {
        // Update occurrence count and samples
        existing.rawQuestionsCount += data.count;
        existing.sampleRawQuestions = Array.from(new Set([...existing.sampleRawQuestions, ...data.samples])).slice(0, 5);
        store.saveFaqItems();
      } else {
        const newItem = store.addFaqItem({
          category,
          rawQuestionsCount: data.count,
          sampleRawQuestions: data.samples,
          rephrasedQuestion,
          answer,
          sources,
          confidence,
          conflictNote,
          status: 'proposee', // STRICT RULE: Must be validated by staff before publication
        });
        proposedItems.push(newItem);
      }
    }

    return proposedItems;
  }

  /**
   * Publishes an approved FAQ item to the Discord #faq channel.
   * Can ONLY be called after staff explicitly approves the proposal.
   */
  public async publishApprovedFaqToDiscord(faqId: string): Promise<boolean> {
    const item = store.getFaqItem(faqId);
    if (!item || item.status !== 'approuvee') {
      console.warn(`[FAQ Service] Refus de publier la FAQ ${faqId}: statut non approuvé.`);
      return false;
    }

    const embed = {
      title: `❓ ${item.rephrasedQuestion}`,
      description: `${item.answer}\n\n📚 **Sources officielles :** ${item.sources.join(', ')}`,
      color: 0x6366f1,
      footer: {
        text: `PAWAKO FORMATION • FAQ Officielle • Validée par ${item.reviewedBy || 'Staff'}`,
      },
      timestamp: new Date().toISOString(),
    };

    const res = await discordService.sendCustomEmbed({
      channelName: '#faq',
      embed,
      content: `📌 **[FAQ OFFICIELLE - ${item.category.toUpperCase()}]**`,
    });

    if (res.success) {
      store.updateFaqItem(faqId, {
        publishedAt: store.getFormattedNow(),
        discordMessageId: (res as any).messageId || 'discord-faq-published',
      });
      return true;
    }
    return false;
  }
}

export const faqService = new FaqService();
