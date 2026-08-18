import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Hash, Shield, Folder, CheckCircle, HelpCircle } from 'lucide-react';
import { discordSyncService } from '../services/discordSyncService';
import { DiscordChannelSyncData, DiscordRoleSyncData } from '../types';

interface DiscordResourceSelectProps {
  type: 'channel' | 'role' | 'category' | 'log_channel';
  guildId?: string;
  value?: string;
  onChange: (id: string, name?: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  helperText?: string;
}

export const DiscordResourceSelect: React.FC<DiscordResourceSelectProps> = ({
  type,
  guildId,
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  className = '',
  required = false,
  helperText,
}) => {
  const activeGuildId = guildId || discordSyncService.getActiveGuildId();
  const [items, setItems] = useState<Array<{ id: string; name: string; extra?: any }>>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notFoundWarning, setNotFoundWarning] = useState<string | null>(null);

  const loadResources = () => {
    if (!activeGuildId) {
      setItems([]);
      return;
    }

    if (type === 'role') {
      const roles = discordSyncService.getRoles(activeGuildId);
      setItems(
        roles.map((r) => ({
          id: r.discord_role_id || r.id,
          name: `@${r.name}`,
          extra: r,
        }))
      );
    } else if (type === 'category') {
      const categories = discordSyncService.getCategories(activeGuildId);
      setItems(
        categories.map((c) => ({
          id: c.discord_channel_id || c.id,
          name: `📁 ${c.name}`,
          extra: c,
        }))
      );
    } else {
      // channel or log_channel
      const channels = discordSyncService.getChannels(activeGuildId);
      setItems(
        channels.map((c) => ({
          id: c.discord_channel_id || c.id,
          name: `#・${c.name.replace(/^#/, '')}`,
          extra: c,
        }))
      );
    }
  };

  useEffect(() => {
    loadResources();
  }, [activeGuildId, type]);

  // Check if saved value is found in Discord resources
  useEffect(() => {
    if (value && value.trim()) {
      const exists = items.some((item) => item.id === value);
      if (items.length > 0 && !exists) {
        setNotFoundWarning(
          `⚠️ Ressource introuvable sur Discord (ID: ${value}). L'élément a probablement été supprimé. Veuillez sélectionner une nouvelle ressource.`
        );
      } else {
        setNotFoundWarning(null);
      }
    } else {
      setNotFoundWarning(null);
    }
  }, [value, items]);

  const handleRefresh = async () => {
    if (!activeGuildId) return;
    setIsSyncing(true);
    try {
      await discordSyncService.syncGuild(activeGuildId);
      loadResources();
    } catch (err) {
      console.error('[Resource Refresh Error]', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (type) {
      case 'channel':
      case 'log_channel':
        return '[ Sélectionner un salon Discord ▾ ]';
      case 'role':
        return '[ Sélectionner un rôle Discord ▾ ]';
      case 'category':
        return '[ Sélectionner une catégorie Discord ▾ ]';
      default:
        return '[ Sélectionner une ressource ▾ ]';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'channel':
      case 'log_channel':
        return <Hash className="w-4 h-4 text-indigo-400" />;
      case 'role':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'category':
        return <Folder className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
          {value && !notFoundWarning && (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> ID: {value}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {getIcon()}
          </div>
          <select
            value={value || ''}
            disabled={disabled || !activeGuildId || isSyncing}
            onChange={(e) => {
              const selectedId = e.target.value;
              const found = items.find((i) => i.id === selectedId);
              onChange(selectedId, found ? found.name.replace(/^[@#📁・\s]+/, '') : '');
            }}
            className={`w-full pl-9 pr-8 py-2.5 bg-slate-900/90 border rounded-xl text-sm font-medium transition-all shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 ${
              notFoundWarning
                ? 'border-red-500/80 text-red-300 focus:ring-red-500/50 bg-red-950/20'
                : value
                ? 'border-indigo-500/50 text-slate-100 focus:ring-indigo-500/50'
                : 'border-slate-800 text-slate-400 focus:ring-indigo-500/30'
            }`}
          >
            <option value="" disabled className="bg-slate-900 text-slate-400 font-sans">
              {getPlaceholder()}
            </option>
            {items.map((item) => {
              const roleExtra = item.extra as DiscordRoleSyncData | undefined;
              const isBlockedRole = type === 'role' && roleExtra?.canAssignByBot === false;
              return (
                <option
                  key={item.id}
                  value={item.id}
                  className="bg-slate-900 text-slate-200 py-2 font-sans"
                >
                  {item.name} {isBlockedRole ? '⚠️ (Pos. Bot inférieure)' : ''}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <span className="text-xs">▾</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isSyncing || !activeGuildId}
          title="Rafraîchir les ressources Discord en direct"
          className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-indigo-400 border border-slate-700/80 rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {notFoundWarning && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{notFoundWarning}</span>
        </div>
      )}

      {items.length === 0 && activeGuildId && !isSyncing && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pl-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>
            Aucune ressource de type "{type}" disponible. Cliquez sur ↻ pour synchroniser le serveur.
          </span>
        </div>
      )}

      {!activeGuildId && (
        <div className="text-[11px] text-slate-500 pl-1">
          Sélectionnez et synchronisez un serveur Discord dans l'onglet "Discord Sync".
        </div>
      )}

      {helperText && !notFoundWarning && (
        <p className="text-xs text-slate-400 pl-1">{helperText}</p>
      )}
    </div>
  );
};
