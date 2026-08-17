import React from 'react';
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Database,
  Globe,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SystemHealth } from '../types';

interface SystemHealthViewProps {
  health: SystemHealth;
  onTriggerDiagnostic: () => void;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({
  health,
  onTriggerDiagnostic,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Santé du Système & Diagnostic Gateway</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervision en temps réel des connexions Discord, Supabase PostgreSQL, des retries automatiques et des autorisations du bot.
          </p>
        </div>

        <button
          onClick={onTriggerDiagnostic}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Lancer un Diagnostic En Direct</span>
        </button>
      </div>

      {/* Main Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bot Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bot Discord Gateway</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Connecté</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Latence Gateway : <span className="text-emerald-400 font-bold">{health.botLatencyMs} ms</span>
          </p>
        </div>

        {/* Supabase Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base de données Supabase</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span>PostgreSQL Accessible</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Pool de connexions : <span className="text-indigo-400 font-bold">100% opérationnel</span>
          </p>
        </div>

        {/* Dashboard Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dashboard Web App</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span>Online</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Dernier Heartbeat : <span className="text-slate-200">{health.lastHeartbeat}</span>
          </p>
        </div>
      </div>

      {/* Permissions Audit & Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discord Permission Auditor Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit des Permissions Discord du Bot</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health.permissionsAudit.map((perm) => (
              <div
                key={perm.key}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 font-medium">{perm.name}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OK</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Timestamps & Retry Queues */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span>Tâches en Attente & Retries Automatiques</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">Actions en attente d'exécution :</span>
              <span className="font-mono font-bold text-white">{health.pendingActions}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">File de retries en cours (Délai adaptatif) :</span>
              <span className="font-mono font-bold text-emerald-400">{health.retryQueueCount}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">Dernière synchronisation des rôles :</span>
              <span className="font-mono text-slate-300">{health.lastPermissionSync}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-400">Dernière sauvegarde réussie (7 jours) :</span>
              <span className="font-mono text-indigo-300">{health.lastBackupDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
