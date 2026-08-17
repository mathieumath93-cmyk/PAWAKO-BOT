import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  HelpCircle,
  Link,
  Lock,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  AdminNotification,
  BackupRecord,
  BrandingSettings,
  MaintenanceSetting,
  MaintenanceType,
  UsefulLink,
} from '../types';

interface ConfigViewProps {
  branding: BrandingSettings;
  usefulLinks: UsefulLink[];
  notifications: AdminNotification[];
  maintenance: Record<MaintenanceType, MaintenanceSetting>;
  backups: BackupRecord[];
  onUpdateBranding: (data: Partial<BrandingSettings>) => void;
  onAddUsefulLink: (link: Omit<UsefulLink, 'id'>) => void;
  onUpdateUsefulLink: (id: string, link: Partial<UsefulLink>) => void;
  onDeleteUsefulLink: (id: string) => void;
  onMarkNotificationStatus: (id: string, status: 'lue' | 'traitee') => void;
  onUpdateMaintenance: (type: MaintenanceType, setting: MaintenanceSetting) => void;
  onCreateBackup: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  branding,
  usefulLinks,
  notifications,
  maintenance,
  backups,
  onUpdateBranding,
  onAddUsefulLink,
  onUpdateUsefulLink,
  onDeleteUsefulLink,
  onMarkNotificationStatus,
  onUpdateMaintenance,
  onCreateBackup,
}) => {
  const [activeTab, setActiveTab] = useState<
    'branding' | 'links' | 'wizard' | 'notifications' | 'maintenance' | 'backups'
  >('branding');

  // Branding local state
  const [brandingForm, setBrandingForm] = useState<BrandingSettings>({ ...branding });

  // Useful Link local state
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('ExternalLink');

  // Setup Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding(brandingForm);
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkUrl.startsWith('https://')) {
      alert('Toutes les URLs doivent obligatoirement utiliser HTTPS (https://)');
      return;
    }
    onAddUsefulLink({
      name: newLinkName,
      url: newLinkUrl,
      icon: newLinkIcon,
      order: usefulLinks.length + 1,
      isActive: true,
    });
    setNewLinkName('');
    setNewLinkUrl('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Configuration du Système PAWAKO</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personnalisez le branding, les liens utiles HTTPS, les notifications admin, le mode maintenance et l'assistant d'installation.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardStep(1);
            setIsWizardOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <Wand2 className="w-4 h-4 text-cyan-300" />
          <span>Lancer l'Assistant de Configuration (10 étapes)</span>
        </button>
      </div>

      {/* Configuration Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto scrollbar-none pb-2">
        {(
          [
            { id: 'branding', label: 'Branding & Identité' },
            { id: 'links', label: 'Liens Utiles' },
            { id: 'notifications', label: 'Notifications Admin' },
            { id: 'maintenance', label: 'Mode Maintenance' },
            { id: 'backups', label: 'Sauvegardes (7J)' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Branding & Identity */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 text-xs">
          <h3 className="text-sm font-bold text-white mb-2">Champs de Branding & Affichage Bot</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Nom de la Formation</label>
              <input
                type="text"
                value={brandingForm.trainingName}
                onChange={(e) => setBrandingForm({ ...brandingForm, trainingName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Nom affiché du Bot Discord</label>
              <input
                type="text"
                value={brandingForm.botDisplayName}
                onChange={(e) => setBrandingForm({ ...brandingForm, botDisplayName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Description Officielle</label>
            <textarea
              value={brandingForm.description}
              onChange={(e) => setBrandingForm({ ...brandingForm, description: e.target.value })}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">URL du Logo / Image</label>
              <input
                type="text"
                value={brandingForm.logoUrl}
                onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">URL de l'Avatar du Bot</label>
              <input
                type="text"
                value={brandingForm.botAvatarUrl}
                onChange={(e) => setBrandingForm({ ...brandingForm, botAvatarUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder les modifications</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Useful Links Manager */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateLink} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-400" />
              <span>Ajouter un Lien Utile (Obligation HTTPS)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Intitulé du lien</label>
                <input
                  type="text"
                  placeholder="Ex : Documentation PAWAKO"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-400 font-medium">URL Externe (Doit débuter par https://)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter le lien</span>
              </button>
            </div>
          </form>

          {/* Useful Links Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ordre</th>
                  <th className="py-3 px-4">Nom</th>
                  <th className="py-3 px-4">URL (HTTPS)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usefulLinks.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-950/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">#{l.order}</td>
                    <td className="py-3 px-4 font-semibold text-white">{l.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-300">{l.url}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteUsefulLink(l.id)}
                        className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications Admin */}
      {activeTab === 'notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Centre des Notifications Administrateur (Globales)</span>
          </h3>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  n.level === 'critique'
                    ? 'bg-red-950/30 border-red-500/30 text-red-200'
                    : n.level === 'important'
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs">{n.title}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] uppercase font-mono font-bold bg-slate-900 border border-slate-700">
                      {n.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{n.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Recu le {n.date}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.status !== 'traitee' && (
                    <button
                      onClick={() => onMarkNotificationStatus(n.id, 'traitee')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                    >
                      Marquer comme Traité
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Granular Maintenance Mode */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            <span>Mode Maintenance Granulaire</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['quiz', 'attempts', 'progress', 'tickets', 'onboarding'] as MaintenanceType[]).map(
              (type) => {
                const setting = maintenance[type];
                return (
                  <div
                    key={type}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        {type}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateMaintenance(type, { ...setting, enabled: !setting.enabled })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          setting.enabled
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {setting.enabled ? 'MAINTENANCE ACTIVE' : 'Opérationnel'}
                      </button>
                    </div>

                    {setting.enabled && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="text-[11px] text-slate-400">Message Personnalisé :</label>
                        <input
                          type="text"
                          value={setting.customMessage || ''}
                          onChange={(e) =>
                            onUpdateMaintenance(type, { ...setting, customMessage: e.target.value })
                          }
                          placeholder="⚠️ Fonctionnalité temporairement indisponible..."
                          className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                        />
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Automatic 7-Day Rolling Backups */}
      {activeTab === 'backups' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Sauvegardes Automatiques Quotidiennes (Rotation 7 jours)</span>
            </h3>

            <button
              onClick={onCreateBackup}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/20"
            >
              + Créer une Sauvegarde Maintenant
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Fichier Snapshot</th>
                  <th className="py-3 px-4">Taille</th>
                  <th className="py-3 px-4">Horodatage</th>
                  <th className="py-3 px-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {backups.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 px-4 font-bold text-white">{b.filename}</td>
                    <td className="py-3 px-4 text-slate-400">{b.sizeKb} KB</td>
                    <td className="py-3 px-4 text-slate-300">{b.createdAt}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10-Step Assistant Setup Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Wand2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Assistant d'Installation PAWAKO — Étape {wizardStep} / 10
              </span>
            </div>

            <div className="w-full bg-slate-950 h-2 rounded-full mb-6 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${(wizardStep / 10) * 100}%` }}
              ></div>
            </div>

            {/* Step Content */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6 min-h-[160px] flex flex-col justify-center">
              {wizardStep === 1 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">1. Détection du serveur Discord</h4>
                  <p className="text-xs text-slate-300">Serveur connecté : PAWAKO HQ (ID: 123456789012345678)</p>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">2. Détection du rôle Admin</h4>
                  <p className="text-xs text-slate-300">Rôle Admin détecté : "Admin". Accès restreint configuré.</p>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">3. Configuration du salon principal</h4>
                  <p className="text-xs text-slate-300">Salon #🤖-jarvis vérifié pour les interfaces interactives par boutons.</p>
                </div>
              )}
              {wizardStep === 4 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">4. Configuration du salon de logs</h4>
                  <p className="text-xs text-slate-300">Salon #logs prêt à enregistrer l'activité administrateur.</p>
                </div>
              )}
              {wizardStep === 5 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">5. Salon Notifications Admin</h4>
                  <p className="text-xs text-slate-300">Salon #🚨-notifications-admin prêt à diffuser les alertes critiques.</p>
                </div>
              )}
              {wizardStep === 6 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">6. Configuration des tickets</h4>
                  <p className="text-xs text-slate-300">Catégorie des tickets initialisée et stockage PostgreSQL de transcript activé.</p>
                </div>
              )}
              {wizardStep === 7 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">7. Structure des modules</h4>
                  <p className="text-xs text-slate-300">5 modules de formation internes détectés avec leurs salons et rôles dédiés.</p>
                </div>
              )}
              {wizardStep === 8 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">8. Vérification des permissions Discord</h4>
                  <p className="text-xs text-emerald-400 font-mono">✅ Voir les salons, Envoyer des messages, Intégrer des liens, Gérer les rôles...</p>
                </div>
              )}
              {wizardStep === 9 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-sm">9. Résumé de l'installation</h4>
                  <p className="text-xs text-slate-300">Tous les composants sont prêts et synchronisés avec Supabase PostgreSQL.</p>
                </div>
              )}
              {wizardStep === 10 && (
                <div className="space-y-2 text-center py-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-white text-base">10. Installation Terminée !</h4>
                  <p className="text-xs text-slate-300">PAWAKO FORMATION 🤖 est 100% prêt à l'emploi.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(wizardStep - 1)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-50"
              >
                Précédent
              </button>

              {wizardStep < 10 ? (
                <button
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  onClick={() => setIsWizardOpen(false)}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
                >
                  Terminer l'assistant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
