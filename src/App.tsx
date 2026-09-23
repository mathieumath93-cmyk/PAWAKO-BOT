import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Radio,
  Users,
  GraduationCap,
  Menu,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/ui/ToastContainer';
import { OverviewView } from './components/OverviewView';
import { OnboardingFlowConfigurator } from './components/OnboardingFlowConfigurator';
import { MembersView } from './components/MembersView';
import { RolesView } from './components/RolesView';
import { ChannelsView } from './components/ChannelsView';
import { DiscordSyncView } from './components/DiscordSyncView';
import { LogsView } from './components/LogsView';
import { SettingsView } from './components/SettingsView';
import { AIKnowledgeConfigurator } from './components/AIKnowledgeConfigurator';
import { AnnouncementsView } from './components/AnnouncementsView';
import { BotTokenModal } from './components/BotTokenModal';
import { CandidatePortal } from './components/CandidatePortal';
import { GamificationView } from './components/GamificationView';
import { LiveChannelsMonitorView } from './components/LiveChannelsMonitorView';

import { serverService } from './services/serverService';
import { moduleService } from './services/moduleService';
import { quizService } from './services/quizService';
import { memberService } from './services/memberService';
import { discordService } from './services/discordService';
import { firebaseSyncService } from './services/firebaseSyncService';
import { store } from './services/store';
import {
  DiscordServer,
  UserSession,
  AdminNotification,
  ToastNotification,
  TrainingModule,
  Quiz,
  AdminLog,
  Member,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeServer, setActiveServer] = useState<DiscordServer | null>(serverService.getActiveServer());
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  // User session
  const [session] = useState<UserSession>({
    id: 'user-admin',
    username: 'Anthony',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    discordId: '382910284918239102',
    roleName: 'Lead Admin',
  });

  // State data
  const [modules, setModules] = useState<TrainingModule[]>(moduleService.getModules());
  const [quizzes, setQuizzes] = useState<Quiz[]>(quizService.getQuizzes());
  const [members, setMembers] = useState<Member[]>(memberService.getMembers());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Modals state
  const [isBotTokenModalOpen, setIsBotTokenModalOpen] = useState(false);

  // System Notifications
  const [notifications] = useState<AdminNotification[]>([]);

  // System Logs
  const [logs, setLogs] = useState<AdminLog[]>([]);

  const refreshData = () => {
    setModules([...moduleService.getModules()]);
    setQuizzes([...quizService.getQuizzes()]);
    setMembers([...memberService.getMembers()]);
    setActiveServer({ ...serverService.getActiveServer() });
  };

  useEffect(() => {
    // 1. Immediate Stale Data Render (Non-blocking)
    refreshData();

    // 2. Subscribe to background SWR revalidations and store updates
    const unsubscribeFirebase = firebaseSyncService.subscribe(() => {
      refreshData();
    });
    const unsubscribeStore = store.subscribe(() => {
      refreshData();
    });

    // 3. Trigger background SWR sync
    firebaseSyncService.initSync();
    discordService.fetchAndSyncRealDiscordData().then((res) => {
      if (res && res.success) {
        refreshData();
      }
    });

    return () => {
      unsubscribeFirebase();
      unsubscribeStore();
    };
  }, []);

  const showToast = (title: string, message?: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeServer={activeServer}
        onServerChange={(srv) => {
          serverService.setActiveServer(srv.id);
          setActiveServer(srv);
        }}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        onShowToast={showToast}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          session={session}
          notifications={notifications}
          activeServer={activeServer}
          onOpenMobileMenu={() => setIsOpenMobileSidebar(true)}
          onLogout={() => showToast('Déconnexion simulée', 'Session terminée', 'info')}
          onNavigate={setActiveTab}
          onOpenTokenModal={() => setIsBotTokenModalOpen(true)}
        />

        {/* View Content */}
        <main className={`flex-1 ${activeTab === 'live-salons' ? 'p-0 w-full' : 'p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-24 lg:pb-8'}`}>
          {activeTab === 'live-salons' && (
            <LiveChannelsMonitorView
              onShowToast={showToast}
              onSelectMember={(m) => {
                setActiveTab('members');
              }}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewView
              logs={logs}
              onNavigate={setActiveTab}
              onCreateModuleClick={() => setActiveTab('onboarding')}
            />
          )}

          {activeTab === 'gamification' && (
            <GamificationView onShowToast={showToast} />
          )}

          {activeTab === 'member-portal' && (
            <CandidatePortal allowCandidateSwitch={true} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsView onShowToast={showToast} />
          )}

          {activeTab === 'discord-sync' && <DiscordSyncView />}

          {activeTab === 'onboarding' && (
            <OnboardingFlowConfigurator
              modules={modules}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'ai-config' && <AIKnowledgeConfigurator onShowToast={showToast} />}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              onRefresh={refreshData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'roles' && <RolesView onShowToast={showToast} />}

          {activeTab === 'channels' && <ChannelsView onShowToast={showToast} />}

          {activeTab === 'logs' && (
            <LogsView
              logs={logs}
              onRefresh={refreshData}
              onClear={() => setLogs([])}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'settings' && <SettingsView onShowToast={showToast} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'overview'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('live-salons')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors relative cursor-pointer min-h-[44px] ${
            activeTab === 'live-salons'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Radio className="w-5 h-5 mb-0.5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-[10px]">Salons Live</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'members'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Candidats</span>
        </button>

        <button
          onClick={() => setActiveTab('member-portal')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] ${
            activeTab === 'member-portal'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Espace Membre</span>
        </button>

        <button
          onClick={() => setIsOpenMobileSidebar(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {/* Bot Token Configuration Modal */}
      <BotTokenModal
        isOpen={isBotTokenModalOpen}
        onClose={() => setIsBotTokenModalOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
        onShowToast={showToast}
      />
    </div>
  );
}

export default App;
