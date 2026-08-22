import React, { useState } from 'react';
import {
  Shield,
  RefreshCw,
  Plus,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DiscordRole } from '../types';
import { roleService } from '../services/roleService';
import { discordService } from '../services/discordService';

interface RolesViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const RolesView: React.FC<RolesViewProps> = ({ onShowToast }) => {
  const [roles, setRoles] = useState<DiscordRole[]>(roleService.getRoles());
  const [mappings, setMappings] = useState(roleService.getMappings());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncDiscord = async () => {
    setIsSyncing(true);
    const res = await discordService.fetchAndSyncRealDiscordData();
    setIsSyncing(false);
    setRoles([...roleService.getRoles()]);
    if (res.success) {
      onShowToast('Rôles Discord Synchronisés', `${roleService.getRoles().length} rôles répertoriés depuis votre serveur Discord`, 'success');
    } else {
      onShowToast('Erreur Sync', res.message || 'Impossible de synchroniser', 'info');
    }
  };

  const handleUpdateRole = (moduleId: string, roleEnCoursId: string, roleValidatedId?: string) => {
    try {
      roleService.updateMapping(moduleId, roleEnCoursId, roleValidatedId);
      setMappings([...roleService.getMappings()]);
      onShowToast('Attribution de rôle mise à jour', 'Sauvegardé avec succès', 'success');
    } catch (e) {
      // Error
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Gestionnaire des Rôles Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Définissez quel rôle est automatiquement attribué après chaque module validé.
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

      {/* Module to Role Flow */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-sm font-bold text-white">Progression des Rôles par Module</h2>

        <div className="space-y-4">
          {mappings.map((map) => (
            <div
              key={map.moduleId}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">Module de Formation</span>
                <h3 className="text-xs font-bold text-white">{map.moduleTitle}</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 shrink-0">Rôle au démarrage :</span>
                  <select
                    value={map.roleId}
                    onChange={(e) => handleUpdateRole(map.moduleId, e.target.value, map.nextRoleId)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">(Aucun / Conservé)</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 shrink-0">Rôle si validé :</span>
                  <select
                    value={map.nextRoleId || ''}
                    onChange={(e) => handleUpdateRole(map.moduleId, map.roleId, e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">(Aucun / Conservé)</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discord Server Roles List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white">Rôles Détectés sur le Serveur Discord</h2>
        {roles.length === 0 ? (
          <div className="text-xs text-slate-400 italic p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center">
            Aucun rôle détecté. Cliquez sur <strong className="text-indigo-400">Sync Discord</strong> pour importer les rôles réels de votre serveur.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {roles.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color || '#818cf8' }}></span>
                <span className="text-xs font-semibold text-slate-200 truncate">{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
