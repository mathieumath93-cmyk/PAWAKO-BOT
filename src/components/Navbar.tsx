import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  HelpCircle as TicketIcon,
  HelpCircle as UsefulIcon,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Terminal,
  UserCheck,
  Users,
} from 'lucide-react';
import { BrandingSettings, UsefulLink, UserSession } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branding: BrandingSettings;
  usefulLinks: UsefulLink[];
  session: UserSession;
  onOpenUsefulLink: (url: string, name: string) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  branding,
  usefulLinks,
  session,
  onOpenUsefulLink,
  onLogout,
}) => {
  const [linksOpen, setLinksOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Membres', icon: Users },
    { id: 'modules', label: 'Modules', icon: BookOpen },
    { id: 'quiz', label: 'Quiz', icon: CheckCircle },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'health', label: 'Santé du système', icon: Activity },
    { id: 'config', label: 'Configuration', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{branding.trainingName}</span>
              </h1>
              <p className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Connecté à Discord</span>
              </p>
            </div>
          </div>

          {/* Actions on right */}
          <div className="flex items-center gap-3">
            {/* Useful Links dropdown */}
            <div className="relative">
              <button
                onClick={() => setLinksOpen(!linksOpen)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Liens Utiles</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {linksOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    Redirections externes
                  </div>
                  {usefulLinks.filter(l => l.isActive).map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        setLinksOpen(false);
                        onOpenUsefulLink(link.url, link.name);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-indigo-600/10 hover:text-indigo-400 flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium">{link.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
                  {usefulLinks.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500">Aucun lien disponible</div>
                  )}
                </div>
              )}
            </div>

            {/* Admin User Info */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={session.avatarUrl}
                alt={session.username}
                className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover"
              />
              <div className="text-left">
                <div className="text-xs font-medium text-slate-200 flex items-center gap-1">
                  <span>{session.username}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    Admin
                  </span>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Se déconnecter"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Menu (App Router Style) */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5 border-t border-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
