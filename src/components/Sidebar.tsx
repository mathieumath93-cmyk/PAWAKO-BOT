import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Users,
  Shield,
  Hash,
  MessageSquare,
  Zap,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  ShieldAlert,
  Server,
  RefreshCw,
  X,
  Brain,
} from 'lucide-react';
import { DiscordServer } from '../types';
import { serverService } from '../services/serverService';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeServer: DiscordServer | null;
  onServerChange: (server: DiscordServer) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const navItems = [
  { id: 'overview', label: 'Candidats & Progression', icon: Users },
  { id: 'onboarding', label: 'Parcours Onboarding & Rôles', icon: Shield },
  { id: 'ai-config', label: 'Configuration & Prompts IA', icon: Brain },
  { id: 'discord-sync', label: 'Synchronisation Discord', icon: RefreshCw },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeServer,
  onServerChange,
  isOpenMobile,
  onCloseMobile,
  onShowToast,
}) => {
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');

  const servers = serverService.getServers();

  const handleSelectServer = (srv: DiscordServer) => {
    onServerChange(srv);
    setIsServerDropdownOpen(false);
    onShowToast(`Serveur activé : ${srv.name}`, 'Configuration chargée avec succès', 'info');
  };

  const handleAddServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const added = serverService.addServer(newServerName.trim());
    onServerChange(added);
    setNewServerName('');
    setIsAddingServer(false);
    setIsServerDropdownOpen(false);
    onShowToast(`Nouveau serveur ajouté : ${added.name}`, 'Le bot est prêt à être configuré', 'success');
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800/80 w-64 shrink-0">
      {/* Brand Header & Server Selector */}
      <div className="p-4 border-b border-slate-800/80 relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">PAWAKO <span className="text-indigo-400">SAAS</span></span>
        </div>

        {/* Server Selector Button */}
        <div className="relative">
          <button
            onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
            className="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-left transition-all group"
          >
            {activeServer ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={activeServer.iconUrl}
                  alt={activeServer.name}
                  className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-700"
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-100 truncate">{activeServer.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{activeServer.memberCount} membres</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-amber-400 truncate">Aucun serveur</div>
                  <div className="text-[10px] text-slate-500 font-mono">Discord non synchronisé</div>
                </div>
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isServerDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Server Selector Dropdown */}
          {isServerDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Serveurs Administrés</div>
              {servers.length === 0 ? (
                <div className="px-2 py-2 text-xs text-slate-400 italic text-center">Aucun serveur trouvé</div>
              ) : (
                servers.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => handleSelectServer(srv)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      activeServer && srv.id === activeServer.id ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={srv.iconUrl} alt={srv.name} className="w-5 h-5 rounded object-cover" />
                      <span className="truncate">{srv.name}</span>
                    </div>
                    {activeServer && srv.id === activeServer.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                  </button>
                ))
              )}

              <div className="border-t border-slate-800 my-1"></div>

              {!isAddingServer ? (
                <button
                  onClick={() => setIsAddingServer(true)}
                  className="w-full p-2 rounded-lg text-xs text-indigo-400 hover:bg-indigo-950/40 font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ajouter un serveur</span>
                </button>
              ) : (
                <form onSubmit={handleAddServerSubmit} className="p-1 space-y-2">
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="Nom du serveur Discord"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      className="flex-1 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px] hover:bg-indigo-500"
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingServer(false)}
                      className="py-1 px-2 rounded bg-slate-800 text-slate-400 text-[11px] hover:bg-slate-700"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Navigation Dashboard</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full px-3 py-2.5 rounded-xl font-medium text-xs flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/20 shadow-sm shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Bot Status Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-[11px]">
              <div className="text-slate-200 font-semibold">Gateway Active</div>
              <div className="text-[10px] text-emerald-400 font-mono">Latence: 22 ms</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0">{sidebarContent}</aside>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 h-full flex">
            {sidebarContent}
            <button
              onClick={onCloseMobile}
              className="m-3 text-slate-400 hover:text-white p-2 h-fit bg-slate-900 rounded-lg border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
