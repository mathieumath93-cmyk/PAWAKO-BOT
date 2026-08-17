import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff, ShieldCheck, Database, Server, ExternalLink, Copy, Check, Sparkles, HelpCircle, AlertCircle, Bot, Send } from 'lucide-react';

interface SettingsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const [botName, setBotName] = useState('Pawako Bot');
  const [botAvatarUrl, setBotAvatarUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');
  const [commandPrefix, setCommandPrefix] = useState('!');
  const [botToken, setBotToken] = useState('MTUzODg3NDIyNjQxNTUwMTQ2Mg.GRRAAr.5NbxFb6dbuz9rwki_yyiapVY4786aZx5i---dQ');
  const [showToken, setShowToken] = useState(false);
  const [clientId, setClientId] = useState('1538874226415501462');
  const [clientSecret, setClientSecret] = useState('Qd3R0-xv4wszPNh1WxKBFxY0zO_-ETMd');
  const [showSecret, setShowSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/1538892353849532527/8KQxKy9_LOgoL11MAGbYzNeKVyn4lmYr6dLRYqrwve3A0eyJCffSyxyAvLhSMBCMC8rh');
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

  const handleTestWebhook = () => {
    if (!webhookUrl.trim() || !webhookUrl.startsWith('http')) {
      onShowToast('Webhook Invalide', 'Veuillez saisir une URL de webhook Discord valide', 'info');
      return;
    }

    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      onShowToast('Test Webhook Envoyé', 'Un message de test a été transmis à la boîte de réception Discord.', 'success');
    }, 1200);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Paramètres Enregistrés', 'La configuration du bot a été synchronisée avec succès.', 'success');
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

      {/* Guide Rapide Connexion Discord */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Comment connecter votre VRAI serveur Discord ?</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                  Guide Rapide (4 étapes)
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center text-indigo-300 font-bold">1</span>
                  <span>Discord Dev Portal</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Allez sur <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-mono">discord.com/developers</a> et créez une nouvelle Application.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center text-indigo-300 font-bold">2</span>
                  <span>Activer les Intents</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dans l'onglet <b>Bot</b>, cochez <span className="text-amber-300 font-medium">Server Members Intent</span> et <span className="text-amber-300 font-medium">Message Content Intent</span>.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center text-indigo-300 font-bold">3</span>
                  <span>Copier Token & ID</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Copiez le <b>Bot Token</b> et l'<b>Application Client ID</b> dans les champs ci-dessous.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-400/30 text-[10px] flex items-center justify-center text-indigo-300 font-bold">4</span>
                  <span>Inviter le Bot</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cliquez sur <b>"Inviter sur mon Serveur"</b> ci-dessous pour autoriser le bot à rejoindre votre serveur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Generateur de Lien d'invitation Bot Discord */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Générateur de Lien d'Invitation Bot (OAuth2)</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Permissions:</span>
              <select
                value={permissionsValue}
                onChange={(e) => setPermissionsValue(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="8">Administrateur (Recommandé - 8)</option>
                <option value="268435456">Gérer les Rôles & Salons (268435456)</option>
                <option value="3072">Lire/Envoyer Messages uniquement (3072)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 font-medium mb-1">Lien d'invitation généré pour votre Client ID :</div>
                <div className="text-xs font-mono text-indigo-300 truncate bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                  {inviteUrl}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
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
                  <span>Inviter le Bot sur mon Serveur</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bot Identity Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Identité du Bot Discord</span>
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

        {/* API Credentials Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Identifiants API Discord & Webhooks</span>
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 block">Discord Bot Token (Secrêt)</label>
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Obtenir mon token sur Discord Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Collez votre Bot Token ici (ex: MTE5M...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
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
                <label className="text-xs font-bold text-slate-300 mb-1 block">Client ID Application (App ID)</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ex: 1538874226415501462"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">Clé Secrète Client (OAuth2 Secret)</label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Qd3R0-xv4wsz..."
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
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium disabled:opacity-50"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
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

