import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './src/services/store';
import { pawakoBot } from './src/bot/discordBot';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Discord Bot if token is present
  if (process.env.DISCORD_BOT_TOKEN) {
    console.log('[PAWAKO BOT] Initialisation avec le token configure...');
    pawakoBot.connectWithToken(process.env.DISCORD_BOT_TOKEN);
  }

  app.use(express.json());

  // --- API ROUTES ---

  // Auth Endpoints
  app.get('/api/auth/me', (req: Request, res: Response) => {
    res.json(store.getSession());
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, avatarUrl, roleName } = req.body;
    const session = {
      discordId: '123456789012345678',
      username: username || 'Anthony (Admin)',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isAdmin: true,
      roleName: roleName || 'Admin',
      loginAt: store.getFormattedNow(),
    };
    store.setSession(session);
    store.addLog(session.username, 'Connexion réussie via Discord OAuth', 'auth');
    res.json(session);
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const session = store.getSession();
    store.addLog(session.username, 'Déconnexion du dashboard', 'auth');
    res.json({ status: 'logged_out' });
  });

  // Branding Settings
  app.get('/api/branding', (req: Request, res: Response) => {
    res.json(store.getBranding());
  });

  app.put('/api/branding', (req: Request, res: Response) => {
    try {
      const updated = store.updateBranding(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Useful Links
  app.get('/api/useful-links', (req: Request, res: Response) => {
    res.json(store.getUsefulLinks());
  });

  app.post('/api/useful-links', (req: Request, res: Response) => {
    try {
      const link = store.addUsefulLink(req.body);
      res.json(link);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/useful-links/:id', (req: Request, res: Response) => {
    try {
      const updated = store.updateUsefulLink(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/useful-links/:id', (req: Request, res: Response) => {
    try {
      store.deleteUsefulLink(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Modules Endpoints
  app.get('/api/modules', (req: Request, res: Response) => {
    res.json(store.getModules());
  });

  app.get('/api/modules/:id', (req: Request, res: Response) => {
    const mod = store.getModule(req.params.id);
    if (!mod) return res.status(404).json({ error: 'Module introuvable' });
    res.json(mod);
  });

  app.post('/api/modules', (req: Request, res: Response) => {
    try {
      const mod = store.createModule(req.body);
      res.json(mod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/modules/:id', (req: Request, res: Response) => {
    try {
      const mod = store.updateModule(req.params.id, req.body);
      res.json(mod);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/modules/:id', (req: Request, res: Response) => {
    try {
      store.deleteModule(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Quizzes Endpoints
  app.get('/api/quiz', (req: Request, res: Response) => {
    res.json(store.getQuizzes());
  });

  app.get('/api/quiz/:id', (req: Request, res: Response) => {
    const q = store.getQuiz(req.params.id);
    if (!q) return res.status(404).json({ error: 'Quiz introuvable' });
    res.json(q);
  });

  app.post('/api/quiz', (req: Request, res: Response) => {
    try {
      const q = store.createQuiz(req.body);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/quiz/:id', (req: Request, res: Response) => {
    try {
      const q = store.updateQuiz(req.params.id, req.body);
      res.json(q);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/quiz/:id', (req: Request, res: Response) => {
    try {
      store.deleteQuiz(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/quiz/submit', (req: Request, res: Response) => {
    const { memberId, quizId, answers } = req.body;
    try {
      const result = store.submitQuizAttempt(memberId, quizId, answers);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Members Endpoints
  app.get('/api/members', (req: Request, res: Response) => {
    res.json(store.getMembers());
  });

  app.get('/api/members/:id', (req: Request, res: Response) => {
    const m = store.getMember(req.params.id);
    if (!m) return res.status(404).json({ error: 'Membre introuvable' });
    res.json(m);
  });

  app.post('/api/members/:id/roles', (req: Request, res: Response) => {
    try {
      const { roles } = req.body;
      const updated = store.updateMemberRoles(req.params.id, roles);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/reset-progress', (req: Request, res: Response) => {
    try {
      const updated = store.resetMemberProgress(req.params.id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/reset-attempts', (req: Request, res: Response) => {
    try {
      const { quizId } = req.body;
      const updated = store.resetMemberAttempts(req.params.id, quizId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/grant-attempt', (req: Request, res: Response) => {
    try {
      const { quizId } = req.body;
      const updated = store.grantExtraAttempt(req.params.id, quizId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/members/:id/leave', (req: Request, res: Response) => {
    try {
      store.handleMemberLeave(req.params.id);
      res.json({ success: true, message: 'Données personnelles anonymisées/supprimées.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Tickets Endpoints
  app.get('/api/tickets', (req: Request, res: Response) => {
    res.json(store.getTickets());
  });

  app.post('/api/tickets', (req: Request, res: Response) => {
    try {
      const { memberId, subject, category, message } = req.body;
      const ticket = store.createTicket(memberId, subject, category, message);
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/tickets/:id/messages', (req: Request, res: Response) => {
    try {
      const { senderName, content, isAdmin } = req.body;
      const msg = store.addTicketMessage(req.params.id, senderName, content, isAdmin);
      res.json(msg);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/tickets/:id/close', (req: Request, res: Response) => {
    try {
      const { closedBy } = req.body;
      const ticket = store.closeTicket(req.params.id, closedBy || 'Anthony (Admin)');
      res.json(ticket);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Admin Logs
  app.get('/api/logs', (req: Request, res: Response) => {
    res.json(store.getLogs());
  });

  // Admin Notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(store.getNotifications());
  });

  app.put('/api/notifications/:id/status', (req: Request, res: Response) => {
    try {
      const { status, adminName } = req.body;
      const notif = store.markNotificationStatus(req.params.id, status, adminName || 'Anthony (Admin)');
      res.json(notif);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Maintenance Settings
  app.get('/api/maintenance', (req: Request, res: Response) => {
    res.json(store.getMaintenance());
  });

  app.put('/api/maintenance/:type', (req: Request, res: Response) => {
    try {
      const type = req.params.type as any;
      const updated = store.updateMaintenance(type, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // System Health & Diagnostics
  app.get('/api/health', (req: Request, res: Response) => {
    res.json(store.getHealth());
  });

  app.post('/api/health/diagnose', (req: Request, res: Response) => {
    res.json(store.triggerDiagnostic());
  });

  // Bot Status & Connect
  app.get('/api/bot/status', (req: Request, res: Response) => {
    res.json({
      connected: pawakoBot.getIsConnected(),
      tag: pawakoBot.getUserTag(),
      tokenSet: Boolean(process.env.DISCORD_BOT_TOKEN)
    });
  });

  app.post('/api/bot/connect', (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token requis' });
    }
    process.env.DISCORD_BOT_TOKEN = token;
    pawakoBot.connectWithToken(token);
    res.json({ success: true, message: 'Connexion du bot Discord initiée.' });
  });

  // Supabase API Status
  app.get('/api/supabase/status', (req: Request, res: Response) => {
    res.json({
      url: process.env.SUPABASE_URL || 'https://qozrmsyhfxhvnudxfuhu.supabase.co',
      endpoint: process.env.SUPABASE_TABLE_ENDPOINT || 'https://qozrmsyhfxhvnudxfuhu.supabase.co/rest/v1/test1',
      hasPublishableKey: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY),
      hasSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      jwksUrl: process.env.SUPABASE_JWKS_URL || 'https://qozrmsyhfxhvnudxfuhu.supabase.co/auth/v1/.well-known/jwks.json',
      configured: true
    });
  });

  // Backups
  app.get('/api/backups', (req: Request, res: Response) => {
    res.json(store.getBackups());
  });

  app.post('/api/backups/create', (req: Request, res: Response) => {
    res.json(store.createBackup());
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PAWAKO FORMATION 🤖] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
