import React, { useState } from 'react';
import { FileText, Search, RefreshCw, Trash2, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { AdminLog } from '../types';

interface LogsViewProps {
  logs: AdminLog[];
  onRefresh: () => void;
  onClear: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onRefresh, onClear, onShowToast }) => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userName && log.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Journaux d'Activité & Logs Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historique complet des événements bot, passages de quiz et attributions de rôles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rafraîchir</span>
          </button>
          <button
            onClick={onClear}
            className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vider</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les logs par mot-clé..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'info', 'succes', 'avertissement', 'critique'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                levelFilter === lvl
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Niveau</th>
                <th className="p-4">Horodatage</th>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Action</th>
                <th className="p-4">Détails</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    {log.level === 'critique' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">CRITIQUE</span>
                    )}
                    {log.level === 'avertissement' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">WARNING</span>
                    )}
                    {log.level === 'succes' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">SUCCESS</span>
                    )}
                    {log.level === 'info' && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">INFO</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-[11px]">{log.date}</td>
                  <td className="p-4 font-sans font-bold text-white">{log.userName || 'Bot Gateway'}</td>
                  <td className="p-4 font-sans font-semibold text-slate-200">{log.action}</td>
                  <td className="p-4 text-slate-400 text-[11px] max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
