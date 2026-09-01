import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff, ShieldCheck, Database, Server, ExternalLink, Copy, Check, Sparkles, HelpCircle, AlertCircle, Bot, Send, Trash2, RefreshCw, Zap } from 'lucide-react';
import { discordService } from '../services/discordService';
import { onboardingService } from '../services/onboardingService';
import { firebaseSyncService } from '../services/firebaseSyncService';

interface SettingsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const currentConfig = discordService.getConfig();
  const onboardingCfg = onboardingService.getConfig();

  const defaultSarcastic = [
    "🤖 *Doucement sur les clics ! Le bouton n'a rien fait de mal et mes circuits imprimés commencent à fumer.*",
    "⚡ *Alerte mitraillage ! À ce rythme-là, tu vas démonter ton mulot avant d'avoir atteint le Module 2.*",
    "☕ *Oula, mollo le ninja du mulot ! Prends une grande inspiration et un café, les données restent bien au chaud.*",
    "🎯 *Quelle cadence de clics phénoménale ! Dommage que ça ne donne aucun point bonus pour valider le quiz.*",
    "🛑 *Keep calm ! Cliquer 50 fois la seconde ne va pas débloquer la suite plus vite, promis juré !*"
  ];

  const [sarcasticMessagesText, setSarcasticMessagesText] = useState<string>(
    (onboardingCfg.sarcasticSpamMessages && onboardingCfg.sarcasticSpamMessages.length > 0
      ? onboardingCfg.sarcasticSpamMessages
      : defaultSarcastic).join('\n')
  );

  const [botName, setBotName] = useState(currentConfig.botName);
  const [botAvatarUrl, setBotAvatarUrl] = useState(currentConfig.botAvatarUrl);
  const [commandPrefix, setCommandPrefix] = useState(currentConfig.commandPrefix);
  const [botToken, setBotToken] = useState(currentConfig.botToken);
  const [showToken, setShowToken] = useState(false);
  const [clientId, setClientId] = useState(currentConfig.clientId);
  const [clientSecret, setClientSecret] = useState(currentConfig.clientSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(currentConfig.webhookUrl);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [permissionsValue, setPermissionsValue] = useState('8'); // 8 = Administrator

  // Compute OAuth2 Invite URL dynamically
  const inviteUrl = clientId.trim() 
    ? `https://discord.com/api/oauth2/authorize?client_id=${clientId.trim()}&permissions=${permissionsValue}&scope=bot%20applications.commands`
    : '#';

  const handleCopyInviteLink = () => {
    if (!clientId.trim()) {
      onShowToast('Client ID requis', 'Veuillez saisir le Client ID de votre Bot Discord', 'info');
      return;
    }
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    onShowToast('Lien copié !', 'Lien d\'invitation OAuth2 copié dans le presse-papier.', 'success');
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim() || !webhookUrl.startsWith('http')) {
      onShowToast('Webhook Invalide', 'Veuillez saisir une URL de webhook Discord valide', 'info');
      return;
    }

    setTestingWebhook(true);
    const result = await discordService.sendWebhookTestMessage(webhookUrl);
    setTestingWebhook(false);

    if (result.success) {
      onShowToast('Test Webhook Réussi !', 'Un message de confirmation a été posté sur votre salon Discord.', 'success');
    } else {
      onShowToast('Erreur Webhook', result.message, 'info');
    }
  };

  const [isResetting, setIsResetting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeReminders = async () => {
    setIsPurging(true);
    try {
      const count = await firebaseSyncService.purgeAllReminderFlags();
      onShowToast('Purger les Relances Réussi !', `${count} membre(s) réinitialisé(s) et nettoyé(s) dans Firestore et localement.`, 'success');
    } catch {
      onShowToast('Erreur Purge', 'Impossible de purger les relances.', 'info');
    } finally {
      setIsPurging(false);
    }
  };

  const handleResetAllData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir effectuer un nettoyage complet des données ? Cette action réinitialise les logs, tentatives de quiz et le cache.')) {
      return;
    }

    setIsResetting(true);
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.clear();
      }

      await fetch('/api/store/reset-all', { method: 'POST' });

      onShowToast('Nettoyage Effectué !', 'Toutes les données ont été réinitialisées avec succès.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      onShowToast('Erreur Nettoyage', 'Impossible de réinitialiser le serveur.', 'info');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    discordService.updateConfig({
      botName,
      botAvatarUrl,
      commandPrefix,
      botToken,
      clientId,
      clientSecret,
      webhookUrl,
    });

    const lines = sarcasticMessagesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    onboardingService.updateConfig({
      sarcasticSpamMessages: lines,
    });

    onShowToast('Paramètres Enregistrés', 'La configuration du bot et les répliques anti-spam ont été synchronisées.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Paramètres Système & Bot Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configurez les jetons d'accès, liez votre serveur réel et générez vos liens d'invitation Discord.
          </p>
        </div>
      </div>

      {/* Information Banner pointing to Discord Sync */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Identifiants API & Configuration Bot Discord</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              La gestion des jetons (Bot Token, Client ID, Secrets OAuth2) et la synchronisation s'effectuent directement dans l'onglet <strong className="text-indigo-300">Discord Sync</strong> pour une sécurité maximale.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bot Identity Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Identité & Préfixe du Bot</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Nom d'affichage du Bot</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Préfixe de Commande</label>
              <select
                value={commandPrefix}
                onChange={(e) => setCommandPrefix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="!">! (Point d'exclamation)</option>
                <option value="/">/ (Slash Command Default)</option>
                <option value="$">$ (Dollar)</option>
                <option value="?">? (Point d'interrogation)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 mb-1 block">URL Avatar Bot</label>
              <input
                type="text"
                value={botAvatarUrl}
                onChange={(e) => setBotAvatarUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* System Status & Database Connection */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Infrastructure & Base de Données</span>
          </h2>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <div className="text-xs font-bold text-white">Supabase Cloud Database</div>
                <div className="text-[10px] text-slate-400 font-mono">https://qozrmsyhfxhvnudxfuhu.supabase.co</div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              ✓ Connected
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-white">Mode Maintenance Bot</div>
              <div className="text-[11px] text-slate-400">Désactive temporairement les réponses du bot aux membres.</div>
            </div>

            <button
              type="button"
              onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
              className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                isMaintenanceMode ? 'bg-amber-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
            </button>
          </div>
        </div>

        {/* Database Purge & Sync Card */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Purge des Relances & Synchro Base de Données</h3>
                <p className="text-xs text-slate-400">
                  Efface les anciens drapeaux et compteurs d'inactivité obsolètes sur tous les membres dans Firestore et localement.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePurgeReminders}
              disabled={isPurging}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              {isPurging ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Purge en cours...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Purger & Nettoyer BDD</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Data Reset & Danger Zone Card */}
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Nettoyage Complet des Données</h3>
                <p className="text-xs text-slate-400">
                  Réinitialise le cache local, les tentatives de quiz, les logs et l'historique des membres.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAllData}
              disabled={isResetting}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Nettoyage...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Effacer Toutes les Données</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sarcastic Anti-Spam Bot Messages */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Messages Sarcastiques Bot Anti-Spam (1 ligne par réplique)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
              Déclenché à +3 clics en 3s
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Saisissez ou modifiez les répliques sarcastiques (1 message par ligne) que le bot enverra aléatoirement en réponse privée lorsqu'un membre mitraille les boutons :
          </p>

          <textarea
            rows={5}
            value={sarcasticMessagesText}
            onChange={(e) => setSarcasticMessagesText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-300 font-mono leading-relaxed focus:outline-none focus:border-amber-500"
            placeholder="Une réplique par ligne..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Sauvegarder les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};

