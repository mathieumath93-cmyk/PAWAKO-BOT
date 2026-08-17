import React, { useState } from 'react';
import {
  Clock,
  Download,
  Filter,
  Search,
  Shield,
  Terminal,
  User,
} from 'lucide-react';
import { AdminLog } from '../types';

interface LogsViewProps {
  logs: AdminLog[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredLogs = logs.filter((l) => {
    const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;
    const matchesSearch =
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.targetMemberName && l.targetMemberName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Admin', 'Action', 'Categorie', 'Membre Cible', 'Date', 'Resultat'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.adminName,
      `"${l.action}"`,
      l.category,
      l.targetMemberName || '',
      l.date,
      l.result,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pawako_admin_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>Journal des Actions Administrateur (Logs)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historique complet des opérations sensibles, réinitialisations et modifications de configuration.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une action, administrateur ou membre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {['all', 'member', 'quiz', 'module', 'role', 'ticket', 'system', 'auth'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Administrateur</th>
                <th className="py-3.5 px-4">Action Exécutée</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4">Membre Ciblé</th>
                <th className="py-3.5 px-4">Horodatage (24h)</th>
                <th className="py-3.5 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-950/50 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-white">
                    {l.adminName}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-sans">{l.action}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800 uppercase text-[10px]">
                      {l.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {l.targetMemberName || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{l.date}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-sans">
                      {l.result}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    Aucun log administrateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
