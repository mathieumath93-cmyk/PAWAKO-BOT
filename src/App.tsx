import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/ui/ToastContainer';
import { OverviewView } from './components/OverviewView';
import { ModulesView } from './components/ModulesView';
import { ModuleBuilderModal } from './components/ModuleBuilderModal';
import { QuizzesView } from './components/QuizzesView';
import { QuizBuilderModal } from './components/QuizBuilderModal';
import { MembersView } from './components/MembersView';
import { RolesView } from './components/RolesView';
import { ChannelsView } from './components/ChannelsView';
import { MessagesView } from './components/MessagesView';
import { AutomationsView } from './components/AutomationsView';
import { DiscordSyncView } from './components/DiscordSyncView';
import { LogsView } from './components/LogsView';
import { SettingsView } from './components/SettingsView';
import { BotTokenModal } from './components/BotTokenModal';

import { serverService } from './services/serverService';
import { moduleService } from './services/moduleService';
import { quizService } from './services/quizService';
import { memberService } from './services/memberService';
import { discordService } from './services/discordService';
import { firebaseSyncService } from './services/firebaseSyncService';
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
  const [session, setSession] = useState<UserSession>({
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
  const [isModuleBuilderOpen, setIsModuleBuilderOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);

  const [isQuizBuilderOpen, setIsQuizBuilderOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isBotTokenModalOpen, setIsBotTokenModalOpen] = useState(false);

  // System Notifications
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: 'notif-1',
      title: 'Bot Discord Gateway Synchronisé',
      message: '1,248 membres et 12 salons textuels ont été mis à jour.',
      date: 'Il y a 5 min',
      level: 'info',
      status: 'non_lue',
    },
    {
      id: 'notif-2',
      title: 'Nouveau quiz complété par John',
      message: 'John a obtenu un score de 18/20 au Quiz 1.',
      date: 'Il y a 12 min',
      level: 'info',
      status: 'non_lue',
    },
  ]);

  // System Logs
  const [logs, setLogs] = useState<AdminLog[]>([
    {
      id: 'log-1',
      action: 'Module Complété',
      level: 'succes',
      userName: 'John',
      details: 'John a validé le Module 1 avec 18/20',
      date: '14:32:10',
    },
    {
      id: 'log-2',
      action: 'Quiz Réussi',
      level: 'succes',
      userName: 'Sarah',
      details: 'Sarah a obtenu le rôle Senior après réussite du Quiz 2',
      date: '14:18:02',
    },
    {
      id: 'log-3',
      action: 'Nouveau Membre',
      level: 'info',
      userName: 'Mike',
      details: 'Rôle Trainee attribué automatiquement à Mike',
      date: '14:05:44',
    },
    {
      id: 'log-4',
      action: 'Échec Quiz',
      level: 'avertissement',
      userName: 'Emma',
      details: 'Score 12/20 au Quiz 4 (requis 16/20)',
      date: '13:50:11',
    },
  ]);

  const refreshData = () => {
    setModules([...moduleService.getModules()]);
    setQuizzes([...quizService.getQuizzes()]);
    setMembers([...memberService.getMembers()]);
    setActiveServer({ ...serverService.getActiveServer() });
  };

  useEffect(() => {
    firebaseSyncService.initSync().then(() => {
      refreshData();
    });
    discordService.fetchAndSyncRealDiscordData().then((res) => {
      if (res && res.success) {
        refreshData();
      }
    });
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

  // Module actions
  const handleOpenModuleBuilder = (mod?: TrainingModule | null) => {
    setEditingModule(mod || null);
    setIsModuleBuilderOpen(true);
  };

  const handleSaveModule = async (data: Partial<TrainingModule>) => {
    let savedModule: TrainingModule;
    if (editingModule) {
      savedModule = moduleService.updateModule(editingModule.id, data);
      showToast('Module mis à jour', data.title, 'success');
    } else {
      savedModule = moduleService.addModule(data as any);
      showToast('Nouveau module créé', data.title, 'success');
    }
    refreshData();

    // Send Embed message directly to selected Discord channel!
    const res = await discordService.sendModuleEmbed(savedModule);
    if (res.success) {
      showToast('Embed Discord Publié 🚀', res.message, 'success');
    } else {
      showToast('Info Publication Embed', res.message, 'info');
    }
  };

  // Quiz actions
  const handleOpenQuizBuilder = (q?: Quiz | null) => {
    setEditingQuiz(q || null);
    setIsQuizBuilderOpen(true);
  };

  const handleSaveQuiz = (data: Partial<Quiz>) => {
    if (editingQuiz) {
      quizService.updateQuiz(editingQuiz.id, data);
      showToast('Quiz mis à jour', data.title, 'success');
    } else {
      quizService.addQuiz(data as any);
      showToast('Nouveau quiz créé', data.title, 'success');
    }
    refreshData();
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
              onCreateModuleClick={() => handleOpenModuleBuilder(null)}
            />
          )}

          {activeTab === 'discord-sync' && <DiscordSyncView />}

          {activeTab === 'modules' && (
            <ModulesView
              modules={modules}
              onOpenBuilder={handleOpenModuleBuilder}
              onRefresh={refreshData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'quizzes' && (
            <QuizzesView
              quizzes={quizzes}
              modules={modules}
              onOpenBuilder={handleOpenQuizBuilder}
              onRefresh={refreshData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'members' && (
            <MembersView
              members={members}
              onRefresh={refreshData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'roles' && <RolesView onShowToast={showToast} />}

          {activeTab === 'channels' && <ChannelsView onShowToast={showToast} />}

          {activeTab === 'messages' && <MessagesView onShowToast={showToast} />}

          {activeTab === 'automations' && (
            <AutomationsView
              modules={modules}
              quizzes={quizzes}
              onShowToast={showToast}
            />
          )}

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

      {/* Module Builder Modal */}
      <ModuleBuilderModal
        isOpen={isModuleBuilderOpen}
        moduleToEdit={editingModule}
        onClose={() => setIsModuleBuilderOpen(false)}
        onSave={handleSaveModule}
      />

      {/* Quiz Builder Modal */}
      <QuizBuilderModal
        isOpen={isQuizBuilderOpen}
        quizToEdit={editingQuiz}
        modules={modules}
        onClose={() => setIsQuizBuilderOpen(false)}
        onSave={handleSaveQuiz}
      />

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
