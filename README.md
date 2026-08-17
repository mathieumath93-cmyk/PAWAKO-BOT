# PAWAKO FORMATION 🤖 — Plateforme de Formation Discord & Dashboard Admin

**PAWAKO FORMATION 🤖** est une plateforme SaaS complète de gestion de formation interne et d'onboarding connectée à **un seul serveur Discord**.

---

## 🚀 Fonctionnalités Principales

* **Dashboard Web Admin (Next.js / Express / TypeScript)**
  * Vue d'ensemble KPI (taux d'achèvement, membres actifs, taux de réussite aux quiz).
  * Gestion des membres, réinitialisation sensible des progressions & tentatives (double confirmation).
  * Gestion des modules de formation, salons Discord (`#module-1`, `#module-2`...) et rôles associés.
  * Création et édition de quiz avec score minimum et tentatives configurables par quiz.
  * Gestion des tickets et transcripts JSON/texte enregistrés dans Supabase PostgreSQL.
  * Journalisation d'activités (Logs Admin) et notifications d'alertes 🔴 Critique, 🟠 Important, 🔵 Info.
  * Santé du système (Gateway Heartbeat, retries automatiques, vérification des permissions Discord).
  * Assistant d'installation guidé en 10 étapes.
  * Sauvegardes quotidiennes (rotation 7 jours).

* **Bot & Simulator Discord Interactive (`#🤖-jarvis`)**
  * `👤 Mon profil` : Consultation du profil, rôles et statistiques.
  * `📚 Ma formation` : Consultation du parcours, confirmation et déblocage de salon.
  * `🎯 Mes quiz` : Lancement et évaluation interactive de quiz.
  * `🎫 Mes tickets` : Ouverture et clôture de tickets avec transcript.
  * `🛠️ Administration` : Interface réservée aux administrateurs sur Discord.

---

## ⚙️ Variables d'Environnement (`.env.example`)

Créez un fichier `.env` à la racine :

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_GUILD_ID=your_discord_guild_id

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=pawako-formation-secret-key-2026
```

---

## 🛠️ Installation et Lancement Local

```bash
# 1. Installation des dépendances
npm install

# 2. Lancement en mode développement (Serveur Express + Vite sur le port 3000)
npm run dev
```

Accédez à `http://localhost:3000`.

---

## 📦 Build et Production

```bash
# Compile le frontend Vite et le serveur backend Express dans dist/server.cjs
npm run build

# Démarre le serveur CommonJS compilé
npm run start
```

---

## 🤖 Configuration du Bot Discord

1. Rendez-vous sur le portal des développeurs Discord : [https://discord.com/developers/applications](https://discord.com/developers/applications).
2. Créez une application nommée `PAWAKO FORMATION 🤖`.
3. Sous la section **Bot**, activez les **Privileged Gateway Intents** :
   - `PRESENCE INTENT`
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
4. Récupérez le **Bot Token** et copiez-le dans `DISCORD_BOT_TOKEN`.
5. Dans **OAuth2**, configurez l'URL de redirection :
   - `http://localhost:3000/api/auth/discord/callback` (ou l'URL de votre déploiement).
6. Invitez le bot sur votre serveur avec les permissions :
   - Voir les salons, Envoyer des messages, Intégrer des liens, Gérer les messages, Gérer les salons, Gérer les rôles.

---

## 🗄️ Configuration Supabase & PostgreSQL

1. Créez un projet sur [Supabase](https://supabase.com).
2. Récupérez `SUPABASE_URL` et `SUPABASE_ANON_KEY`.
3. Les tables générées incluent : `members`, `modules`, `quizzes`, `tickets`, `ticket_transcripts`, `admin_logs`, `notifications`, `system_settings`, `backups`.

---

## ☁️ Déploiement

* **Dashboard Web** : Déployable sur Vercel avec `NODE_ENV=production`.
* **Bot Discord** : Exécutez le processus permanent Node.js sur un service fiable (Cloud Run, Railway, Render, VPS).

---

## 📄 Licence
Licence interne PAWAKO. Tous droits réservés.
