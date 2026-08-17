import React, { useEffect, useState } from 'react';
import { ConfigView } from './components/ConfigView';
import { DashboardView } from './components/DashboardView';
import { DiscordSimulatorModal } from './components/DiscordSimulatorModal';
import { ExternalLinkModal } from './components/ExternalLinkModal';
import { LoginView } from './components/LoginView';
import { LogsView } from './components/LogsView';
import { MembersView } from './components/MembersView';
import { ModulesView } from './components/ModulesView';
import { Navbar } from './components/Navbar';
import { QuizView } from './components/QuizView';
import { SensitiveActionModal } from './components/SensitiveActionModal';
import { StatsView } from './components/StatsView';
import { SystemHealthView } from './components/SystemHealthView';
import { TicketsView } from './components/TicketsView';
import {
  AdminLog,
  AdminNotification,
  BackupRecord,
  BrandingSettings,
  MaintenanceSetting,
  MaintenanceType,
  Member,
  Quiz,
  SystemHealth,
  Ticket,
  TrainingModule,
  UsefulLink,
  UserSession,
} from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core Data States
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [maintenance, setMaintenance] = useState<Record<MaintenanceType, MaintenanceSetting> | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [externalModalData, setExternalModalData] = useState<{ url: string; name: string } | null>(null);
  const [sensitiveModalData, setSensitiveModalData] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Fetch initial state from API
  const fetchAllData = async () => {
    try {
      const [
        sessRes,
        brandRes,
        linksRes,
        modsRes,
        quizRes,
        memsRes,
        tickRes,
        logsRes,
        notifRes,
        healthRes,
        maintRes,
        backRes,
      ] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/branding').then((r) => r.json()),
        fetch('/api/useful-links').then((r) => r.json()),
        fetch('/api/modules').then((r) => r.json()),
        fetch('/api/quiz').then((r) => r.json()),
        fetch('/api/members').then((r) => r.json()),
        fetch('/api/tickets').then((r) => r.json()),
        fetch('/api/logs').then((r) => r.json()),
        fetch('/api/notifications').then((r) => r.json()),
        fetch('/api/health').then((r) => r.json()),
        fetch('/api/maintenance').then((r) => r.json()),
        fetch('/api/backups').then((r) => r.json()),
      ]);

      setSession(sessRes);
      setBranding(brandRes);
      setUsefulLinks(linksRes);
      setModules(modsRes);
      setQuizzes(quizRes);
      setMembers(memsRes);
      setTickets(tickRes);
      setLogs(logsRes);
      setNotifications(notifRes);
      setHealth(healthRes);
      setMaintenance(maintRes);
      setBackups(backRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handlers
  const handleLogin = async (username?: string, roleName?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, roleName }),
    });
    const data = await res.json();
    setSession(data);
    setIsAuthenticated(true);
    fetchAllData();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  // Member Handlers
  const handleUpdateRoles = async (memberId: string, roles: string[]) => {
    await fetch(`/api/members/${memberId}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles }),
    });
    fetchAllData();
  };

  const handleResetProgress = async (memberId: string) => {
    await fetch(`/api/members/${memberId}/reset-progress`, { method: 'POST' });
    fetchAllData();
  };

  const handleResetAttempts = async (memberId: string, quizId: string) => {
    await fetch(`/api/members/${memberId}/reset-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    fetchAllData();
  };

  const handleGrantAttempt = async (memberId: string, quizId: string) => {
    await fetch(`/api/members/${memberId}/grant-attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    fetchAllData();
  };

  const handleMemberLeave = async (discordId: string) => {
    await fetch(`/api/members/${discordId}/leave`, { method: 'POST' });
    fetchAllData();
  };

  // Module Handlers
  const handleCreateModule = async (mod: Omit<TrainingModule, 'id'>) => {
    await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mod),
    });
    fetchAllData();
  };

  const handleUpdateModule = async (id: string, mod: Partial<TrainingModule>) => {
    await fetch(`/api/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mod),
    });
    fetchAllData();
  };

  const handleDeleteModule = async (id: string) => {
    await fetch(`/api/modules/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // Quiz Handlers
  const handleCreateQuiz = async (quiz: Omit<Quiz, 'id'>) => {
    await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
    fetchAllData();
  };

  const handleUpdateQuiz = async (id: string, quiz: Partial<Quiz>) => {
    await fetch(`/api/quiz/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
    fetchAllData();
  };

  const handleDeleteQuiz = async (id: string) => {
    await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleQuizSubmit = async (memberId: string, quizId: string, answers: number[]) => {
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, quizId, answers }),
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(data.error);
    fetchAllData();
    return data;
  };

  // Ticket Handlers
  const handleCreateTicket = async (
    memberId: string,
    subject: string,
    category: string,
    message: string
  ) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, subject, category, message }),
    });
    const data = await res.json();
    fetchAllData();
    return data;
  };

  const handleAddTicketMessage = async (ticketId: string, content: string) => {
    await fetch(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderName: session?.username || 'Anthony (Admin)', content, isAdmin: true }),
    });
    fetchAllData();
  };

  const handleCloseTicket = async (ticketId: string) => {
    await fetch(`/api/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closedBy: session?.username || 'Anthony (Admin)' }),
    });
    fetchAllData();
  };

  // Config Handlers
  const handleUpdateBranding = async (data: Partial<BrandingSettings>) => {
    await fetch('/api/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchAllData();
  };

  const handleAddUsefulLink = async (link: Omit<UsefulLink, 'id'>) => {
    await fetch('/api/useful-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(link),
    });
    fetchAllData();
  };

  const handleUpdateUsefulLink = async (id: string, link: Partial<UsefulLink>) => {
    await fetch(`/api/useful-links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(link),
    });
    fetchAllData();
  };

  const handleDeleteUsefulLink = async (id: string) => {
    await fetch(`/api/useful-links/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleMarkNotificationStatus = async (id: string, status: 'lue' | 'traitee') => {
    await fetch(`/api/notifications/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminName: session?.username }),
    });
    fetchAllData();
  };

  const handleUpdateMaintenance = async (type: MaintenanceType, setting: MaintenanceSetting) => {
    await fetch(`/api/maintenance/${type}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setting),
    });
    fetchAllData();
  };

  const handleCreateBackup = async () => {
    await fetch('/api/backups/create', { method: 'POST' });
    fetchAllData();
  };

  const handleTriggerDiagnostic = async () => {
    await fetch('/api/health/diagnose', { method: 'POST' });
    fetchAllData();
  };

  if (!isAuthenticated || !session) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (!branding || !health || !maintenance) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono text-xs">
        Chargement de PAWAKO FORMATION 🤖...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branding={branding}
        usefulLinks={usefulLinks}
        session={session}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenUsefulLink={(url, name) => setExternalModalData({ url, name })}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            members={members}
            modules={modules}
            tickets={tickets}
            logs={logs}
            onNavigate={setActiveTab}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            members={members}
            modules={modules}
            quizzes={quizzes}
            onUpdateRoles={handleUpdateRoles}
            onResetProgress={handleResetProgress}
            onResetAttempts={handleResetAttempts}
            onGrantAttempt={handleGrantAttempt}
            onMemberLeave={handleMemberLeave}
            onOpenSensitiveModal={(title, description, actionLabel, onConfirm) =>
              setSensitiveModalData({ title, description, actionLabel, onConfirm })
            }
          />
        )}

        {activeTab === 'modules' && (
          <ModulesView
            modules={modules}
            quizzes={quizzes}
            onCreateModule={handleCreateModule}
            onUpdateModule={handleUpdateModule}
            onDeleteModule={handleDeleteModule}
            onOpenSensitiveModal={(title, description, actionLabel, onConfirm) =>
              setSensitiveModalData({ title, description, actionLabel, onConfirm })
            }
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            quizzes={quizzes}
            modules={modules}
            onCreateQuiz={handleCreateQuiz}
            onUpdateQuiz={handleUpdateQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onOpenSensitiveModal={(title, description, actionLabel, onConfirm) =>
              setSensitiveModalData({ title, description, actionLabel, onConfirm })
            }
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsView
            tickets={tickets}
            onAddMessage={handleAddTicketMessage}
            onCloseTicket={handleCloseTicket}
          />
        )}

        {activeTab === 'logs' && <LogsView logs={logs} />}

        {activeTab === 'stats' && <StatsView members={members} modules={modules} />}

        {activeTab === 'health' && (
          <SystemHealthView health={health} onTriggerDiagnostic={handleTriggerDiagnostic} />
        )}

        {activeTab === 'config' && (
          <ConfigView
            branding={branding}
            usefulLinks={usefulLinks}
            notifications={notifications}
            maintenance={maintenance}
            backups={backups}
            onUpdateBranding={handleUpdateBranding}
            onAddUsefulLink={handleAddUsefulLink}
            onUpdateUsefulLink={handleUpdateUsefulLink}
            onDeleteUsefulLink={handleDeleteUsefulLink}
            onMarkNotificationStatus={handleMarkNotificationStatus}
            onUpdateMaintenance={handleUpdateMaintenance}
            onCreateBackup={handleCreateBackup}
          />
        )}
      </main>

      {/* External Link HTTPS Redirect Warning Modal */}
      <ExternalLinkModal
        isOpen={!!externalModalData}
        url={externalModalData?.url || null}
        linkName={externalModalData?.name}
        onClose={() => setExternalModalData(null)}
        onConfirm={() => setExternalModalData(null)}
      />

      {/* Double Confirmation Modal for Sensitive Admin Operations */}
      <SensitiveActionModal
        isOpen={!!sensitiveModalData}
        title={sensitiveModalData?.title || ''}
        description={sensitiveModalData?.description || ''}
        actionLabel={sensitiveModalData?.actionLabel}
        isDoubleConfirmation={true}
        onClose={() => setSensitiveModalData(null)}
        onConfirm={() => {
          if (sensitiveModalData?.onConfirm) {
            sensitiveModalData.onConfirm();
          }
        }}
      />

      {/* Discord Interactive Client Simulator */}
      <DiscordSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        members={members}
        modules={modules}
        quizzes={quizzes}
        tickets={tickets}
        onQuizSubmit={handleQuizSubmit}
        onCreateTicket={handleCreateTicket}
      />
    </div>
  );
}
