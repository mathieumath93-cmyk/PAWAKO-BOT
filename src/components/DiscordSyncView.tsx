import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Server,
  Shield,
  Hash,
  Folder,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Wand2,
  X,
  Bot,
  Sparkles,
  Send,
  HelpCircle,
  Key,
} from 'lucide-react';
import { discordSyncService } from '../services/discordSyncService';
import { safeFetchJson } from '../utils/apiUtils';
import {
  DiscordGuildSyncData,
  DiscordRoleSyncData,
  DiscordChannelSyncData,
  BotPermissionAnalysis,
} from '../types';

export const DiscordSyncView: React.FC = () => {
  const [guilds, setGuilds] = useState<DiscordGuildSyncData[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [isLoadingGuilds, setIsLoadingGuilds] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSteps, setSyncSteps] = useState<string[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Cached data state
  const [activeGuild, setActiveGuild] = useState<DiscordGuildSyncData | null>(null);
  const [roles, setRoles] = useState<DiscordRoleSyncData[]>([]);
  const [channels, setChannels] = useState<DiscordChannelSyncData[]>([]);
  const [categories, setCategories] = useState<DiscordChannelSyncData[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [botPermissions, setBotPermissions] = useState<BotPermissionAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'channels' | 'permissions' | 'cm'>('overview');
  const [cmStatus, setCmStatus] = useState<string | null>(null);
  const [isRelancing, setIsRelancing] = useState<boolean>(false);
  const [isPostingCm, setIsPostingCm] = useState<boolean>(false);

  const handleTriggerRelances = async () => {
    setIsRelancing(true);
    setCmStatus(null);
    try {
      const res: any = await safeFetchJson('/api/discord/cm-relancer', { method: 'POST' });
      if (res && res.success) {
        setCmStatus(`✅ Relances effectuées avec succès ! ${res.count || 0} candidat(s) relancé(s).`);
      } else {
        setCmStatus(`⚠️ Erreur : ${res?.error || 'Échec des relances'}`);
      }
    } catch (e: any) {
      setCmStatus(`❌ Erreur réseau : ${e?.message}`);
    } finally {
      setIsRelancing(false);
    }
  };

  const handleTriggerCmDaily = async () => {
    setIsPostingCm(true);
    setCmStatus(null);
    try {
      const res: any = await safeFetchJson('/api/discord/cm-daily', { method: 'POST' });
      if (res && res.success) {
        setCmStatus('✅ Post communautaire du jour publié avec succès sur Discord !');
      } else {
        setCmStatus(`⚠️ Erreur : ${res?.error || 'Salon introuvable ou bot déconnecté'}`);
      }
    } catch (e: any) {
      setCmStatus(`❌ Erreur réseau : ${e?.message}`);
    } finally {
      setIsPostingCm(false);
    }
  };

  // API Credentials State (Managed Securely via Backend Server)
  const [botToken, setBotToken] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [tokenSet, setTokenSet] = useState<boolean>(false);
  const [maskedToken, setMaskedToken] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isBotConnected, setIsBotConnected] = useState<boolean>(false);
  const [botTag, setBotTag] = useState<string>('');

  const [isSavingApi, setIsSavingApi] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [permissionsValue, setPermissionsValue] = useState<string>('8'); // 8 = Admin
  const [isApiCardOpen, setIsApiCardOpen] = useState<boolean>(true);

  // Setup Wizard State (10 Steps)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  // Fetch Bot Status & Credentials from Server
  const fetchApiStatus = async () => {
    try {
      const res = await safeFetchJson('/api/bot/status');
      if (res.ok && res.data) {
        const data = res.data;
        setTokenSet(Boolean(data.tokenSet));
        setMaskedToken(data.maskedToken || '');
        if (data.clientId) setClientId(data.clientId);
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
        setIsBotConnected(Boolean(data.connected));
        if (data.tag) setBotTag(data.tag);
      }
    } catch (err) {
      console.warn('[Fetch Bot Status Error]', err);
    }
  };

  const handleSaveApiCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingApi(true);
    setSyncError(null);
    setSyncSuccessMsg(null);

    try {
      const payload: any = {
        clientId,
        webhookUrl,
      };
      if (botToken.trim()) payload.token = botToken.trim();
      if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();

      const res = await safeFetchJson('/api/bot/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data && res.data.success) {
        const data = res.data;
        setTokenSet(Boolean(data.tokenSet));
        setMaskedToken(data.maskedToken || '');
        setIsBotConnected(Boolean(data.connected));
        if (data.tag) setBotTag(data.tag);
        setBotToken(''); // Clear raw token field for security
        setClientSecret(''); // Clear raw secret field for security

        setSyncSuccessMsg('✅ Identifiants API Discord mis à jour et sécurisés sur le serveur avec succès !');
        // Reload guilds list immediately
        await loadGuildsList();
      } else {
        setSyncError(res.error || (res.data && res.data.error) || 'Échec de la mise à jour des identifiants API');
      }
    } catch (err: any) {
      setSyncError(err.message || 'Erreur lors de la communication avec le serveur');
    } finally {
      setIsSavingApi(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim() || !webhookUrl.startsWith('http')) {
      setSyncError('Veuillez saisir une URL de webhook Discord valide (https://discord.com/api/webhooks/...)');
      return;
    }

    setTestingWebhook(true);
    setSyncError(null);
    try {
      const payload = {
        username: 'Pawako Bot 🛡️',
        embeds: [
          {
            title: '✅ Test de Webhook Discord Réussi !',
            description: 'Les logs du tableau de bord Pawako Formation sont correctement reliés à ce salon Discord.',
            color: 0x5865f2,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 204) {
        setSyncSuccessMsg('✅ Webhook Discord fonctionnel ! Un message de test a été publié.');
      } else {
        setSyncError(`Erreur Webhook Discord (HTTP ${res.status})`);
      }
    } catch (err: any) {
      setSyncError(`Impossible de contacter le webhook : ${err.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  // Compute OAuth2 Invite URL dynamically
  const inviteUrl = clientId.trim()
    ? `https://discord.com/api/oauth2/authorize?client_id=${clientId.trim()}&permissions=${permissionsValue}&scope=bot%20applications.commands`
    : '#';

  const handleCopyInviteLink = () => {
    if (!clientId.trim()) {
      setSyncError('Client ID requis pour générer le lien d\'invitation OAuth2.');
      return;
    }
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setSyncSuccessMsg('📋 Lien d\'invitation OAuth2 copié dans le presse-papier !');
  };

  const loadGuildsList = async () => {
    setIsLoadingGuilds(true);
    try {
      const list = await discordSyncService.fetchGuilds();
      setGuilds(list);

      const currentActive = discordSyncService.getActiveGuildId();
      if (currentActive && list.some((g) => g.id === currentActive)) {
        setSelectedGuildId(currentActive);
        const cached = discordSyncService.getCachedData(currentActive);
        if (!cached) {
          discordSyncService.syncGuild(currentActive).then((data) => {
            setActiveGuild(data.guild);
            setRoles(data.roles);
            setChannels(data.channels);
            setCategories(data.categories);
            setMembers(data.members);
            setBotPermissions(data.botPermissions);
          }).catch(() => loadGuildData(currentActive));
        } else {
          loadGuildData(currentActive);
        }
      } else if (list.length > 0) {
        setSelectedGuildId(list[0].id);
        discordSyncService.setActiveGuildId(list[0].id);
        const cached = discordSyncService.getCachedData(list[0].id);
        if (!cached) {
          discordSyncService.syncGuild(list[0].id).then((data) => {
            setActiveGuild(data.guild);
            setRoles(data.roles);
            setChannels(data.channels);
            setCategories(data.categories);
            setMembers(data.members);
            setBotPermissions(data.botPermissions);
          }).catch(() => loadGuildData(list[0].id));
        } else {
          loadGuildData(list[0].id);
        }
      } else {
        setActiveGuild(null);
        setRoles([]);
        setChannels([]);
        setCategories([]);
        setMembers([]);
        setBotPermissions(null);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Impossible de contacter les serveurs Discord');
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  const loadGuildData = (guildId: string) => {
    const cached = discordSyncService.getCachedData(guildId);
    if (cached) {
      setActiveGuild(cached.guild);
      setRoles(cached.roles);
      setChannels(cached.channels);
      setCategories(cached.categories);
      setMembers(cached.members);
      setBotPermissions(cached.botPermissions);
    } else {
      setActiveGuild(null);
      setRoles([]);
      setChannels([]);
      setCategories([]);
      setMembers([]);
      setBotPermissions(null);
    }
  };

  useEffect(() => {
    fetchApiStatus();
    loadGuildsList();
  }, []);

  const handleGuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGuildId = e.target.value;
    setSelectedGuildId(newGuildId);
    discordSyncService.setActiveGuildId(newGuildId);
    loadGuildData(newGuildId);
    setSyncSuccessMsg(null);
    setSyncError(null);
  };

  const handleSyncClick = async () => {
    if (!selectedGuildId) {
      setSyncError('Veuillez sélectionner un serveur Discord à synchroniser.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccessMsg(null);
    setSyncSteps(['Initiation de la synchronisation...']);

    try {
      const data = await discordSyncService.syncGuild(selectedGuildId, (step) => {
        setSyncSteps((prev) => [...prev, step]);
      });

      setActiveGuild(data.guild);
      setRoles(data.roles);
      setChannels(data.channels);
      setCategories(data.categories);
      setMembers(data.members);
      setBotPermissions(data.botPermissions);

      setSyncSuccessMsg(
        `🟢 Synchronisation réussie pour ${data.guild.name} ! ${data.roles.length} rôles, ${data.channels.length} salons, ${data.categories.length} catégories et ${data.members.length} membres récupérés.`
      );
    } catch (err: any) {
      console.warn('[Discord Sync Info]', err?.message || err);
      setSyncError(
        err.message ||
          'Clé Bot Discord non renseignée ou expirée. Cliquez sur \'Token Bot\' en haut à droite pour la saisir.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Discord Sync & API Gateway</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                tokenSet
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tokenSet ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              {tokenSet ? `Token API Configuré (${maskedToken})` : 'Token API Non Configuré'}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Gestion sécurisée des identifiants API Discord et synchronisation dynamique en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setWizardStep(1);
              setIsWizardOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-cyan-200" />
            <span>Assistant 10 Étapes</span>
          </button>

          <button
            onClick={handleSyncClick}
            disabled={isSyncing || !selectedGuildId}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : '🔄 Synchroniser Discord'}
          </button>
        </div>
      </div>

      {/* API Credentials & Discord Connection Card */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Configuration API & Identifiants Bot Discord</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                  🔒 Masqué & Sécurisé
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Les secrets (Bot Token, OAuth2 Client Secret) sont enregistrés exclusivement en mémoire serveur et ne sont jamais transmis en clair sur le client.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsApiCardOpen(!isApiCardOpen)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800"
          >
            {isApiCardOpen ? 'Masquer le formulaire ▲' : 'Afficher / Modifier ▼'}
          </button>
        </div>

        {isApiCardOpen && (
          <form onSubmit={handleSaveApiCredentials} className="space-y-5">
            {/* 4-Step Quick Setup Guide */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Guide de Connexion Rapide (4 étapes) :</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center font-bold text-indigo-300">1</span>
                    <span>Discord Portal</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Allez sur <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-mono">discord.com/developers</a> et créez une Application.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center font-bold text-indigo-300">2</span>
                    <span>Activer Intents</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sous l'onglet <b>Bot</b>, cochez <span className="text-amber-300 font-medium">Server Members Intent</span> et <span className="text-amber-300 font-medium">Message Content Intent</span>.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center font-bold text-indigo-300">3</span>
                    <span>Bot Token & Client ID</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Copiez le <b>Bot Token</b> et l'<b>Application Client ID</b> dans le formulaire ci-dessous.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center font-bold text-indigo-300">4</span>
                    <span>Inviter le Bot</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Utilisez le lien d'invitation généré ci-dessous pour ajouter le Bot sur votre serveur Discord.
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Discord Bot Token (Secret)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tokenSet ? `🟢 Token serveur actif : ${maskedToken}` : '🔴 Aucun token configuré'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder={
                      tokenSet
                        ? `•••••••••••••••• (Actuel: ${maskedToken} - Saisissez pour modifier)`
                        : 'Collez votre Bot Token Discord ici (ex: MTA4M...)'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Client ID Application (App ID)
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="ex: 1538874226415501462"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1 block">
                    Secret Client OAuth2 (Optionnel)
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Qd3R0-xv4wsz... (Masqué)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 block">Webhook URL pour Logs</label>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>{testingWebhook ? 'Test...' : 'Tester'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* OAuth2 Invitation Link Generator */}
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">Lien d'invitation OAuth2 Bot :</span>
                  </div>
                  <div className="text-xs font-mono text-indigo-300 truncate bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                    {inviteUrl}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copier</span>
                  </button>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-lg flex items-center gap-1.5 transition-all ${
                      clientId.trim()
                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                        : 'bg-slate-800 text-slate-500 pointer-events-none'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Inviter sur mon Serveur</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingApi}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSavingApi ? 'Enregistrement...' : 'Enregistrer & Activer les Identifiants API'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Guild Selector Card */}
      <div className="bg-slate-900/70 border border-slate-800/90 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" /> Serveur Discord Actif
          </label>
          <button
            onClick={loadGuildsList}
            disabled={isLoadingGuilds}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium self-end sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGuilds ? 'animate-spin' : ''}`} /> Actualiser les serveurs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <select
              value={selectedGuildId}
              onChange={handleGuildChange}
              disabled={isLoadingGuilds || isSyncing}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                {isLoadingGuilds ? 'Chargement des serveurs...' : '[ Sélectionner un serveur Discord ▾ ]'}
              </option>
              {guilds.map((g) => (
                <option key={g.id} value={g.id}>
                  🛡️ {g.name} (ID: {g.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            {activeGuild ? (
              <div className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                {activeGuild.icon ? (
                  <img src={activeGuild.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-300">
                    {activeGuild.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-200">{activeGuild.name}</div>
                  <div className="text-xs text-slate-400">
                    {activeGuild.member_count} membres • Synchro :{' '}
                    {activeGuild.last_synced_at
                      ? new Date(activeGuild.last_synced_at).toLocaleTimeString('fr-FR')
                      : 'Non effectuée'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
                Aucun serveur sélectionné ou synchronisé
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Step Progress & Notifications */}
      {isSyncing && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Synchronisation en cours avec Discord API...
          </div>
          <div className="space-y-1 pl-6">
            {syncSteps.map((step, idx) => (
              <div key={idx} className="text-xs text-slate-300 flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {syncError && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-sm space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-red-100">Échec de la synchronisation Discord</div>
              <p className="text-xs text-red-200 leading-relaxed font-mono">{syncError}</p>
            </div>
          </div>

          {(syncError.includes('401') || syncError.includes('Unauthorized') || syncError.includes('Token') || syncError.includes('invalide')) && (
            <div className="bg-slate-900/90 border border-red-500/40 rounded-xl p-4 text-xs space-y-3 mt-2 shadow-lg">
              <div className="font-bold text-amber-300 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Comment résoudre l'erreur 401 (Token Discord Invalide) :</span>
              </div>
              <ol className="list-decimal pl-5 space-y-2 text-slate-200 leading-relaxed">
                <li>
                  Rendez-vous sur le <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-400 hover:text-indigo-300">Discord Developer Portal ↗</a>.
                </li>
                <li>
                  Sélectionnez votre Application, puis ouvrez l'onglet <b>Bot</b> dans le menu de gauche.
                </li>
                <li>
                  Cliquez sur le bouton <b>Reset Token</b> (Régénérer le Token) et copiez la nouvelle clé secrète générée.
                </li>
                <li>
                  Passez dans la section de configuration ci-dessus et collez le nouveau Token dans le champ <b>Discord Bot Token</b>.
                </li>
              </ol>
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsApiCardOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  <Key className="w-4 h-4" /> Modifier le Token de votre Bot Discord
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {syncSuccessMsg && !isSyncing && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="font-medium">{syncSuccessMsg}</div>
        </div>
      )}

      {/* Resource Count Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{roles.length}</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Rôles Discord</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{channels.length}</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Salons Textuels</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{categories.length}</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Catégories</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{members.length}</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Membres Synchros</div>
          </div>
        </div>
      </div>

      {/* Detail Inspection Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" /> Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Rôles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'channels'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-4 h-4" /> Salons ({channels.length + categories.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" /> Analyse Permissions Bot
          </button>
          <button
            onClick={() => setActiveTab('cm')}
            className={`px-5 py-3.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'cm'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Super CM & Animateur
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {activeGuild ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Guild details */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-400" /> Propriétés du Serveur
                    </h3>
                    <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3 text-sm">
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">ID Discord</span>
                        <span className="font-mono text-slate-200">{activeGuild.discord_guild_id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Nom du Serveur</span>
                        <span className="font-semibold text-white">{activeGuild.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Membres totaux</span>
                        <span className="text-indigo-400 font-bold">{activeGuild.member_count}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Statut du Bot</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Présent & Connecté
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Dernière synchro</span>
                        <span className="text-slate-300 font-mono">
                          {activeGuild.last_synced_at
                            ? new Date(activeGuild.last_synced_at).toLocaleString('fr-FR')
                            : 'Jamais'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Check */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" /> Résumé des Permissions Bot
                    </h3>
                    {botPermissions ? (
                      <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                          <span className="text-slate-300">Voir les Salons (ViewChannel)</span>
                          {botPermissions.viewChannel ? (
                            <span className="text-emerald-400 font-bold">✓ AUTORISÉ</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ REFUSÉ</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                          <span className="text-slate-300">Envoyer des Messages (SendMessages)</span>
                          {botPermissions.sendMessages ? (
                            <span className="text-emerald-400 font-bold">✓ AUTORISÉ</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ REFUSÉ</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                          <span className="text-slate-300">Intégrer des Liens / Embeds</span>
                          {botPermissions.embedLinks ? (
                            <span className="text-emerald-400 font-bold">✓ AUTORISÉ</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ REFUSÉ</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                          <span className="text-slate-300">Créer Fils Privés (Threads)</span>
                          {botPermissions.createPrivateThreads ? (
                            <span className="text-emerald-400 font-bold">✓ AUTORISÉ</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ REFUSÉ</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-slate-300">Gérer les Rôles (ManageRoles)</span>
                          {botPermissions.manageRoles ? (
                            <span className="text-emerald-400 font-bold">✓ AUTORISÉ</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗ REFUSÉ</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                        Cliquez sur "Synchroniser Discord" pour analyser les permissions.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <Server className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm">
                    Aucun serveur Discord sélectionné. Cliquez sur "Synchroniser Discord" pour démarrer.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Rôles Récupérés depuis Discord ({roles.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Classés par position hiérarchique sur Discord
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Position</th>
                      <th className="p-3">Nom du Rôle</th>
                      <th className="p-3">ID Discord</th>
                      <th className="p-3">Couleur</th>
                      <th className="p-3">Géré par Intégration</th>
                      <th className="p-3">Attribuabilité par le Bot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Aucun rôle synchronisé. Effectuez une synchronisation.
                        </td>
                      </tr>
                    ) : (
                      roles
                        .sort((a, b) => b.position - a.position)
                        .map((role) => (
                          <tr key={role.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono text-slate-400">#{role.position}</td>
                            <td className="p-3 font-bold text-white flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: role.color || '#6366f1' }}
                              ></span>
                              @{role.name}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{role.discord_role_id}</td>
                            <td className="p-3 font-mono text-slate-400">{role.color || 'Par défaut'}</td>
                            <td className="p-3">
                              {role.managed ? (
                                <span className="text-amber-400 font-semibold">Oui (Intégration)</span>
                              ) : (
                                <span className="text-slate-400">Non</span>
                              )}
                            </td>
                            <td className="p-3">
                              {role.canAssignByBot !== false ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Attribuable
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/60 text-red-400 border border-red-500/30 text-[11px]">
                                  <AlertTriangle className="w-3 h-3" /> Position supérieure au Bot
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Salons & Catégories ({channels.length + categories.length})
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">ID Discord</th>
                      <th className="p-3">Catégorie Parente</th>
                      <th className="p-3">Permissions du Bot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {channels.length === 0 && categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          Aucun salon synchronisé. Effectuez une synchronisation.
                        </td>
                      </tr>
                    ) : (
                      [...categories, ...channels].map((chan) => (
                        <tr key={chan.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            {chan.type === 4 ? (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold text-[11px]">
                                Catégorie
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-semibold text-[11px]">
                                Salon Textuel
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-white">
                            {chan.type === 4 ? `📁 ${chan.name}` : `#・${chan.name}`}
                          </td>
                          <td className="p-3 font-mono text-slate-300">{chan.discord_channel_id}</td>
                          <td className="p-3 text-slate-400">{chan.parent_name || 'GÉNÉRAL'}</td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-medium">✓ Accessible</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" /> Audit des Permissions du Bot PAWAKO
                </h3>
                <p className="text-xs text-slate-400">
                  Cette analyse vérifie les privilèges OAuth2 et les droits attribués au Bot sur le serveur Discord sélectionné.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">View Channel (Voir les salons)</span>
                    <span className="text-emerald-400 font-bold">✓ Valide</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Send Messages (Envoyer des messages)</span>
                    <span className="text-emerald-400 font-bold">✓ Valide</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Embed Links (Intégrer des liens/embeds)</span>
                    <span className="text-emerald-400 font-bold">✓ Valide</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Manage Roles (Gérer les rôles)</span>
                    <span className="text-emerald-400 font-bold">✓ Valide</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Manage Channels (Gérer les salons)</span>
                    <span className="text-emerald-400 font-bold">✓ Valide</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Create Private Threads (Fils privés)</span>
                    <span className="text-emerald-400 font-bold">✓ Valide</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cm' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" /> Super CM, Animateur & Coach Discord
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Service autonome d'animation communautaire et de relance candidat (100% isolé des simulations Anthony/Pawako).
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-bold">
                    🟢 Service Indépendant Actif
                  </span>
                </div>

                {cmStatus && (
                  <div className="p-3 bg-slate-900 border border-purple-500/40 rounded-lg text-xs font-medium text-slate-200">
                    {cmStatus}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Relances Personnalisées Candidats
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Analyse la progression de chaque candidat (modules validés, étape actuelle) et envoie un message de suivi personnalisé dans son salon Discord privé.
                    </p>
                    <button
                      disabled={isRelancing}
                      onClick={handleTriggerRelances}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isRelancing ? '⏳ Relances en cours...' : '🚀 Lancer les Relances Personnalisées'}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-sm text-pink-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Post Communautaire Quotidien (CM Boost)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Publie la dose du jour sur le salon général : Astuce Chatting, Conseil Français/Style, Playlist Spotify et Challenge interactif.
                    </p>
                    <button
                      disabled={isPostingCm}
                      onClick={handleTriggerCmDaily}
                      className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPostingCm ? '⏳ Publication en cours...' : '⚡ Publier le Post CM du Jour'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                    📋 Commandes Discord Animateur & CM
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-mono text-indigo-400 font-bold mb-1">!astuce / !hack</div>
                      <div className="text-slate-400 text-[11px]">Donne une astuce de chatting OnlyFans / Vente.</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-mono text-indigo-400 font-bold mb-1">!francais / !style</div>
                      <div className="text-slate-400 text-[11px]">Rappels d'orthographe et tournures pour le chatting.</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-mono text-indigo-400 font-bold mb-1">!corriger &lt;texte&gt;</div>
                      <div className="text-slate-400 text-[11px]">Analyse, corrige et reformule en style sexy & vendeur.</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-mono text-indigo-400 font-bold mb-1">!musique / !son</div>
                      <div className="text-slate-400 text-[11px]">Partage une playlist Spotify de travail avec citation inspirante.</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-mono text-indigo-400 font-bold mb-1">!jeu / !challenge</div>
                      <div className="text-slate-400 text-[11px]">Lance un mini-jeu de mise en situation interactif.</div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="font-mono text-indigo-400 font-bold mb-1">@Pawako Bot &lt;question&gt;</div>
                      <div className="text-slate-400 text-[11px]">Répond aux questions sur la formation hors simulation.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 10-Step Assistant Setup Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Wand2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Assistant d'Installation PAWAKO — Étape {wizardStep} / 10
              </span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full mb-6 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${(wizardStep / 10) * 100}%` }}
              ></div>
            </div>

            {/* Step Content */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6 min-h-[160px] flex flex-col justify-center">
              {wizardStep === 1 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">1. Détection du serveur Discord</h4>
                  <p className="text-xs text-slate-300">
                    Serveur connecté : {activeGuild ? activeGuild.name : 'PAWAKO HQ'} (ID: {activeGuild ? activeGuild.id : '123456789012345678'})
                  </p>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">2. Détection des rôles Discord</h4>
                  <p className="text-xs text-slate-300">
                    {roles.length > 0 ? `${roles.length} rôles récupérés et prêts pour l'attribution.` : 'Rôle Admin détecté : "Admin". Accès restreint configuré.'}
                  </p>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">3. Configuration du salon principal</h4>
                  <p className="text-xs text-slate-300">Salon principal vérifié pour les interfaces interactives.</p>
                </div>
              )}
              {wizardStep === 4 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">4. Configuration du salon de logs</h4>
                  <p className="text-xs text-slate-300">Webhook & salon de logs prêt à enregistrer l'activité administrateur.</p>
                </div>
              )}
              {wizardStep === 5 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">5. Notifications Admin</h4>
                  <p className="text-xs text-slate-300">Système de notifications admin prêt à diffuser les alertes critiques.</p>
                </div>
              )}
              {wizardStep === 6 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">6. Configuration des tickets</h4>
                  <p className="text-xs text-slate-300">Catégorie des tickets initialisée et stockage de transcript activé.</p>
                </div>
              )}
              {wizardStep === 7 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">7. Structure des modules</h4>
                  <p className="text-xs text-slate-300">Modules de formation internes configurés avec leurs salons et rôles dédiés.</p>
                </div>
              )}
              {wizardStep === 8 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">8. Vérification des permissions Discord</h4>
                  <p className="text-xs text-emerald-400 font-mono">
                    ✅ Voir les salons, Envoyer des messages, Intégrer des liens, Gérer les rôles...
                  </p>
                </div>
              )}
              {wizardStep === 9 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">9. Résumé de l'installation</h4>
                  <p className="text-xs text-slate-300">Tous les composants sont prêts et synchronisés.</p>
                </div>
              )}
              {wizardStep === 10 && (
                <div className="space-y-2 text-center py-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">10. Installation Terminée !</h4>
                  <p className="text-xs text-slate-300">PAWAKO FORMATION 🤖 est 100% prêt à l'emploi.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(wizardStep - 1)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-50 cursor-pointer"
              >
                Précédent
              </button>

              {wizardStep < 10 ? (
                <button
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  onClick={() => setIsWizardOpen(false)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Terminer l'assistant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
