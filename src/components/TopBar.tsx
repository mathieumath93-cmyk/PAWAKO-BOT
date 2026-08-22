import React, { useState } from 'react';
import {
  Bell,
  Menu,
  LogOut,
  ChevronRight,
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Key,
} from 'lucide-react';
import { UserSession, AdminNotification, DiscordServer } from '../types';

interface TopBarProps {
  activeTab: string;
  session: UserSession;
  notifications: AdminNotification[];
  activeServer?: DiscordServer | null;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  onOpenTokenModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  session,
  notifications,
  activeServer,
  onOpenMobileMenu,
  onLogout,
  onNavigate,
  onOpenTokenModal,
}) => {
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => n.status === 'non_lue');

  const tabLabels: Record<string, string> = {
    overview: 'Candidats & Progression',
    onboarding: 'Parcours Onboarding & Rôles',
    'discord-sync': 'Synchronisation Discord',
    logs: 'Journal & Audit',
    settings: 'Paramètres',
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left Breadcrumb & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium cursor-pointer hover:text-slate-200" onClick={() => onNavigate('overview')}>
            Dashboard
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-bold tracking-wide">
            {tabLabels[activeTab] || 'Overview'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Discord Connection Status Badge */}
        {activeServer ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{activeServer.name}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Aucun serveur</span>
          </div>
        )}

        {/* Key Bot Token Button */}
        {onOpenTokenModal && (
          <button
            type="button"
            onClick={onOpenTokenModal}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Saisir ou Mettre à Jour le Token du Bot Discord"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Token Bot</span>
          </button>
        )}

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifDropdownOpen(!isNotifDropdownOpen);
              setIsUserDropdownOpen(false);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all relative group"
          >
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-slate-950">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {isNotifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-bold text-white">Notifications Système</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                  {unreadNotifs.length} nouvelles
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">Aucune notification</div>
                ) : (
                  notifications.slice(0, 4).map((notif) => (
                    <div
                      key={notif.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                    >
                      {notif.level === 'critique' ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">{notif.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{notif.message}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{notif.date}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsUserDropdownOpen(!isUserDropdownOpen);
              setIsNotifDropdownOpen(false);
            }}
            className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-xl hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800"
          >
            <img
              src={session.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={session.username}
              className="w-8 h-8 rounded-xl object-cover border border-slate-700"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-100">{session.username}</div>
              <div className="text-[10px] text-indigo-400 font-medium">{session.roleName}</div>
            </div>
          </button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <div className="p-2 border-b border-slate-800">
                <div className="text-xs font-bold text-white">{session.username}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {session.discordId}</div>
              </div>

              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  onNavigate('settings');
                }}
                className="w-full p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Paramètres Administrateur</span>
              </button>

              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  onNavigate('roles');
                }}
                className="w-full p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Permissions & Rôles</span>
              </button>

              <div className="border-t border-slate-800 my-1"></div>

              <button
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  onLogout();
                }}
                className="w-full p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
