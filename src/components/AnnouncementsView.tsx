import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  Sparkles,
  Eye,
  Hash,
  Bell,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import { discordService } from '../services/discordService';
import { store } from '../services/store';

interface AnnouncementsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const TEMPLATES = [
  {
    name: '📢 Nouveau Module Disponible',
    title: '📚 NOUVEAU MODULE DISPONIBLE SUR LA PLATEFORME !',
    content: `Bonjour à tous les candidats ! 🚀\n\nUn nouveau module de formation vient d'être publié. Vous pouvez désormais y accéder dans votre salon privé ou via la commande \`!formation\`.\n\n🎯 **Objectif :** Compléter la lecture et passer le quiz de validation.\n\nBon courage à toutes et à tous ! ✨`,
    colorHex: '#6366f1',
    mentionType: '@candidat' as const,
  },
  {
    name: '⚠️ Rappel Inactivité',
    title: '⚠️ RAPPEL DE SÉCURITÉ & SUIVI — RÈGLEMENT INACTIVITÉ',
    content: `Attention à l'ensemble des candidats en cours de formation !\n\nUn rappel que l'équipe Staff effectue un suivi régulier de l'avancement de vos modules.\n\nEn cas d'inactivité prolongée sans justification auprès du Staff, votre parcours pourra être interrompu et l'accès au serveur révoqué.\n\nPensez à passer vos quiz réguliers ou à contacter le Staff si vous rencontrez une difficulté ! 🚀`,
    colorHex: '#ef4444',
    mentionType: '@everyone' as const,
  },
  {
    name: '🎉 Félicitations & Remise des Diplômes',
    title: '🏆 FÉLICITATIONS À LA NOUVELLE PROMOTION VALIDÉE !',
    content: `Un grand bravo aux candidats qui viennent de valider avec succès la **Formation Outils & Intégration Finalisée** ! 🎓\n\nVos accès officiels et votre intégration au sein de l'équipe ont été confirmés. Félicitations pour votre assiduité et votre rigueur ! 🥳`,
    colorHex: '#10b981',
    mentionType: '@here' as const,
  },
];

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ onShowToast }) => {
  const configuredChannels = discordService.getChannels();
  const annonChan = configuredChannels.find((c) => c.name.toLowerCase().includes('annonce')) || configuredChannels[0];

  const [targetChannelId, setTargetChannelId] = useState<string>(annonChan?.id || '123456789012345678');
  const [targetChannelName, setTargetChannelName] = useState<string>(annonChan?.name || '#annonces');
  const [title, setTitle] = useState<string>('📢 NOUVELLE ANNONCE FORMATION');
  const [content, setContent] = useState<string>(
    `Bonjour à toute la communauté !\n\nCeci est une annonce importante publiée directement par l'équipe **PAWAKO Formation**.\n\n• Étape 1 : Consultez vos salons dédiés\n• Étape 2 : Passez vos quiz de validation\n\nN'hésitez pas à solliciter les formateurs en cas de question ! 🚀`
  );
  const [mentionType, setMentionType] = useState<'none' | '@everyone' | '@here' | '@candidat'>('@candidat');
  const [colorHex, setColorHex] = useState<string>('#6366f1');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('PAWAKO Staff');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentHistory, setSentHistory] = useState<Array<{ id: string; title: string; channelName: string; date: string }>>([]);

  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setColorHex(tpl.colorHex);
    setMentionType(tpl.mentionType);
    onShowToast('Modèle appliqué', `Modèle "${tpl.name}" chargé dans l'éditeur.`, 'info');
  };

  const handleInsertText = (prefix: string, suffix: string = '') => {
    setContent((prev) => `${prev} ${prefix}${suffix}`);
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      onShowToast('Erreur', 'Veuillez saisir un contenu pour l\'annonce.', 'error');
      return;
    }
    if (!targetChannelId || targetChannelId.length < 15) {
      onShowToast('Erreur', 'Veuillez sélectionner ou entrer un ID de salon Discord valide.', 'error');
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch('/api/discord/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: targetChannelId,
          title,
          content,
          mentionType,
          colorHex,
          imageUrl,
          authorName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onShowToast(
          '🎉 Annonce Publiée !',
          `L'annonce "${title}" a été envoyée avec succès dans ${targetChannelName}.`,
          'success'
        );
        setSentHistory((prev) => [
          {
            id: data.messageId || `msg-${Date.now()}`,
            title,
            channelName: targetChannelName,
            date: store.getFormattedNow(),
          },
          ...prev,
        ]);
      } else {
        onShowToast(
          'Échec d\'envoi',
          data.error || 'Impossible de publier l\'annonce sur Discord.',
          'error'
        );
      }
    } catch (err: any) {
      onShowToast('Erreur', err?.message || 'Erreur réseau lors de la publication.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-6 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold tracking-wider uppercase">
              <Megaphone className="w-4 h-4" />
              <span>Communication Discord Officielle</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              📢 Publication d'Annonces via le Bot
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Rédigez et diffusez des annonces officielles riches (Embeds, bannières et mentions) directement dans le salon <span className="text-indigo-300 font-mono font-bold">#annonces</span> ou tout autre salon Discord.
            </p>
          </div>
        </div>
      </div>

      {/* Templates Selector */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase font-mono">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Modèles Rapides :</span>
        </span>
        {TEMPLATES.map((tpl, i) => (
          <button
            key={i}
            onClick={() => handleApplyTemplate(tpl)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all hover:scale-105"
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Form Editor vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Send className="w-5 h-5 text-indigo-400" />
            <span>Formulaire d'Annonce</span>
          </h2>

          {/* Destination Channel Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-indigo-400" />
              <span>Salon Discord Destination</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={targetChannelId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setTargetChannelId(selectedId);
                  const found = configuredChannels.find((c) => c.id === selectedId);
                  if (found) setTargetChannelName(found.name);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                {configuredChannels.map((chan) => (
                  <option key={chan.id} value={chan.id}>
                    #{chan.name} ({chan.type})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Ou entrer l'ID d'un salon"
                value={targetChannelId}
                onChange={(e) => {
                  setTargetChannelId(e.target.value);
                  setTargetChannelName(`salon-${e.target.value.slice(-4)}`);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Titre de l'Annonce (Embed)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 📢 ANNONCE FORMATION"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nom de l'Expéditeur / Auteur</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: PAWAKO Staff"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Mentions & Color Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-400" /> Mention Discord
              </label>
              <select
                value={mentionType}
                onChange={(e) => setMentionType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="none">Aucune mention</option>
                <option value="@candidat">Mention @candidat / Rôle formation</option>
                <option value="@here">Mention @here (Membres en ligne)</option>
                <option value="@everyone">Mention @everyone (Tout le serveur)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Couleur de l'Embed</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer p-1"
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColorHex(c)}
                      className="w-6 h-6 rounded-lg border border-slate-700 transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                      title={`Couleur ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Message Content Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Message & Contenu Markdown
              </label>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <button
                  type="button"
                  onClick={() => handleInsertText('**', '**')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('*', '*')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('• ')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                >
                  • Liste
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('🚀')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                >
                  🚀
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertText('⚠️')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                >
                  ⚠️
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez le texte de votre annonce ici..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
            />
          </div>

          {/* Image Banner URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>URL de l'Image ou Bannière (Optionnel)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              onClick={handlePublish}
              disabled={isSending || !content.trim()}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publication en cours sur Discord...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>🚀 Publier l'Annonce dans {targetChannelName}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Discord Embed Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-mono uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Aperçu En Direct (Discord UI)</span>
            </span>
            <span className="text-[10px] text-slate-500">{targetChannelName}</span>
          </div>

          {/* Realistic Discord UI Preview Box */}
          <div className="bg-[#313338] rounded-3xl p-5 border border-slate-700/60 text-slate-200 font-sans space-y-3 shadow-2xl">
            {/* Discord Channel Header */}
            <div className="flex items-center gap-2 border-b border-[#3f4147] pb-3">
              <Hash className="w-4 h-4 text-[#80848e]" />
              <span className="font-bold text-white text-xs">{targetChannelName.replace('#', '')}</span>
              <span className="text-[10px] text-[#949ba4] bg-[#2b2d31] px-2 py-0.5 rounded-full font-mono ml-auto">
                Discord Client
              </span>
            </div>

            {/* Mention text outside embed if present */}
            {mentionType !== 'none' && (
              <div className="text-xs font-semibold text-[#5865f2] bg-[#5865f2]/10 px-2 py-0.5 rounded w-max">
                {mentionType === '@candidat' ? '@Candidats Formation' : mentionType}
              </div>
            )}

            {/* Embed Box */}
            <div className="bg-[#2b2d31] rounded-lg border-l-4 p-4 space-y-2.5 shadow-md relative" style={{ borderLeftColor: colorHex }}>
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                  🤖
                </div>
                <span className="text-xs font-bold text-white">{authorName || 'PAWAKO Staff'}</span>
                <span className="text-[9px] bg-[#5865f2] text-white px-1 py-0.2 rounded font-mono font-bold uppercase">BOT</span>
              </div>

              {/* Title */}
              {title && (
                <div className="font-bold text-white text-sm leading-snug">
                  {title}
                </div>
              )}

              {/* Description Content */}
              <div className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-wrap font-sans">
                {content}
              </div>

              {/* Banner Image Preview */}
              {imageUrl && (
                <div className="pt-2">
                  <img
                    src={imageUrl}
                    alt="Banner Preview"
                    className="rounded-xl max-h-48 w-full object-cover border border-[#3f4147]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 border-t border-[#3f4147]/60 text-[10px] text-[#949ba4] flex items-center justify-between font-mono">
                <span>PAWAKO FORMATION • Communication Officielle</span>
                <span>Aujourd'hui à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* History of Published Messages */}
          {sentHistory.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Annonces Envoyées cette session ({sentHistory.length})</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sentHistory.map((h) => (
                  <div key={h.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-bold text-white truncate">{h.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">dans {h.channelName} • {h.date}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Envoyé
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
