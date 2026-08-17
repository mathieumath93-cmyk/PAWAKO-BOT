import React, { useState } from 'react';
import { Hash, RefreshCw, CheckCircle2, Shield, Settings2 } from 'lucide-react';
import { DiscordChannelConfig } from '../types';
import { discordService } from '../services/discordService';

interface ChannelsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({ onShowToast }) => {
  const [channels, setChannels] = useState<DiscordChannelConfig[]>(discordService.getChannels());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDiscord = async () => {
    setIsSyncing(true);
    const res = await discordService.syncDiscord();
    setIsSyncing(false);
    onShowToast('Salons Discord Synchronisés', `${res.channelsCount} salons textuels répertoriés`, 'success');
  };

  const handleConfigChange = (channelId: string, configuredFor: DiscordChannelConfig['isConfiguredFor']) => {
    discordService.updateChannelConfig(channelId, configuredFor);
    setChannels([...discordService.getChannels()]);
    onShowToast('Affectation de salon mise à jour', 'Enregistré dans le bot', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-400" />
            <span>Configuration des Salons Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Associez chaque salon Discord aux fonctionnalités dédiées du bot.
          </p>
        </div>

        <button
          onClick={handleSyncDiscord}
          disabled={isSyncing}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Discord</span>
        </button>
      </div>

      {/* Channels List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white">Affectation des Salons Textuels</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((chan) => (
            <div
              key={chan.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white font-mono">{chan.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono uppercase">{chan.categoryName || 'GENERAL'}</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Rôle fonctionnel du salon</label>
                <select
                  value={chan.isConfiguredFor}
                  onChange={(e) => handleConfigChange(chan.id, e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="training">Training Channel (#formation)</option>
                  <option value="quiz">Quiz Channel (#quiz)</option>
                  <option value="results">Results Channel (#results)</option>
                  <option value="logs">Logs Channel (#bot-logs)</option>
                  <option value="tickets">Support Tickets (#tickets)</option>
                  <option value="general">Général</option>
                  <option value="none">Aucun (Inactif)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
