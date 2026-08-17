import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff, ShieldCheck, Database, Server, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const [botName, setBotName] = useState('Pawako Bot');
  const [botAvatarUrl, setBotAvatarUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');
  const [commandPrefix, setCommandPrefix] = useState('!');
  const [botToken, setBotToken] = useState('MTE5Mjg3MzQ1OTI4MzkxODIzMA.G3xK9L.M21u0-xP9l8k2J9182319208391823');
  const [showToken, setShowToken] = useState(false);
  const [clientId, setClientId] = useState('1192873459283918230');
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/123456789/abcdef');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Paramètres Enregistrés', 'La configuration du bot a été synchronisée', 'success');
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
            Configurez les jetons d'accès, préfixes de commande et connexions à la base de données.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
              <label className="text-xs font-bold text-slate-300 mb-1 block">Discord Bot Token (Secrêt)</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">Client ID Application</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">Webhook URL pour Logs</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
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
