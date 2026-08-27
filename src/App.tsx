import React, { useState, useEffect } from 'react';
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
import { BotTokenModal } from './components/BotTokenModal';

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
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <OverviewView
              logs={logs}
              onNavigate={setActiveTab}
              onCreateModuleClick={() => setActiveTab('onboarding')}
            />
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
