import React, { useState } from 'react';
import { Hash, RefreshCw, CheckCircle2, Shield, Settings2, Trash2, Plus, X, AlertTriangle } from 'lucide-react';
import { DiscordChannelConfig } from '../types';
import { discordService } from '../services/discordService';

interface ChannelsViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({ onShowToast }) => {
  const [channels, setChannels] = useState<DiscordChannelConfig[]>(discordService.getChannels());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('GÉNÉRAL');
  const [newConfigRole, setNewConfigRole] = useState<DiscordChannelConfig['isConfiguredFor']>('general');

  const handleSyncDiscord = async () => {
    setIsSyncing(true);
    const res = await discordService.syncDiscord();
    setIsSyncing(false);
    setChannels([...discordService.getChannels()]);
    if (res.success) {
      onShowToast('Salons Discord Synchronisés', `${res.channelsCount} salons répertoriés depuis votre serveur`, 'success');
    } else {
      onShowToast('Info Synchronisation', res.message || 'Salons mis à jour', 'info');
    }
  };

  const handleConfigChange = (channelId: string, configuredFor: DiscordChannelConfig['isConfiguredFor']) => {
    discordService.updateChannelConfig(channelId, configuredFor);
    setChannels([...discordService.getChannels()]);
    onShowToast('Affectation mise à jour', 'Enregistré', 'success');
  };

  const handleDeleteChannel = (channelId: string, channelName: string) => {
    if (confirm(`Supprimer le salon #${channelName} de la liste ?`)) {
      discordService.deleteChannel(channelId);
      setChannels([...discordService.getChannels()]);
      onShowToast('Salon Supprimé', `#${channelName} retiré de la liste.`, 'info');
    }
  };

  const handlePurgeAll = () => {
    if (confirm('Voulez-vous vider la liste des salons par défaut ? Vous pourrez cliquer sur Sync Discord pour importer uniquement les vrais salons de votre serveur.')) {
      discordService.clearDefaultChannels();
      setChannels([]);
      onShowToast('Liste Réinitialisée', 'Tous les salons par défaut ont été supprimés.', 'info');
    }
  };

  const handleAddChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const added = discordService.addCustomChannel(newChannelName, newCategoryName, newConfigRole);
    setChannels([...discordService.getChannels()]);
    setShowAddModal(false);
    setNewChannelName('');
    onShowToast('Salon Ajouté', `#${added.name} a été créé dans la liste.`, 'success');
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
            Gérez la liste de vos salons et associez-les aux fonctionnalités du bot.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Ajouter un Salon</span>
          </button>

          <button
            onClick={handlePurgeAll}
            className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold text-xs border border-rose-900/50 flex items-center gap-1.5 transition-all shrink-0"
            title="Supprimer les salons par défaut"
          >
            <Trash2 className="w-4 h-4" />
            <span>Purger Tout</span>
          </button>

          <button
            onClick={handleSyncDiscord}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all w-fit shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Discord</span>
          </button>
        </div>
      </div>

      {/* Channels List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white">Salons Discord Détectés ({channels.length})</h2>
          <span className="text-[11px] text-slate-400">
            Cliquez sur <Trash2 className="w-3 h-3 inline text-rose-400 mx-0.5" /> pour supprimer un salon
          </span>
        </div>

        {channels.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <Hash className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">Aucun salon dans la liste</div>
            <p className="text-xs text-slate-400">
              Cliquez sur <strong className="text-indigo-400">Sync Discord</strong> pour importer directement les vrais salons de votre serveur connecté.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map((chan) => (
              <div
                key={chan.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white font-mono">{chan.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{chan.categoryName || 'GENERAL'}</span>
                    <button
                      onClick={() => handleDeleteChannel(chan.id, chan.name)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/80 transition-colors"
                      title="Supprimer ce salon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Rôle fonctionnel du salon</label>
                  <select
                    value={chan.isConfiguredFor || 'none'}
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
        )}
      </div>

      {/* ADD CHANNEL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>Ajouter un Salon Manuel</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddChannelSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom du Salon</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="ex: annonce-formation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Catégorie Discord</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ex: ACADÉMIE"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Rôle fonctionnel</label>
                <select
                  value={newConfigRole}
                  onChange={(e) => setNewConfigRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Ajouter Salon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

