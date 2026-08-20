import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Edit2, Link, Zap, Variable, Check, Sparkles } from 'lucide-react';
import { BotMessageTemplate, CustomButtonConfig, ButtonActionType } from '../types';
import { messageService } from '../services/messageService';
import { DiscordPreview } from './ui/DiscordPreview';

interface MessagesViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onShowToast }) => {
  const [templates, setTemplates] = useState<BotMessageTemplate[]>(messageService.getTemplates());
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id || 'msg-welcome');

  // New Button Form State
  const [showAddButton, setShowAddButton] = useState(false);
  const [newBtnLabel, setNewBtnLabel] = useState('🚀 Action Personnalisée');
  const [newBtnStyle, setNewBtnStyle] = useState<'Primary' | 'Secondary' | 'Success' | 'Danger' | 'Link'>('Primary');
  const [newBtnAction, setNewBtnAction] = useState<ButtonActionType>('start_module');
  const [newBtnValue, setNewBtnValue] = useState('');

  const activeTemplate = templates.find((t) => t.id === selectedId) || templates[0];

  if (!activeTemplate) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
        Aucun modèle de message disponible.
      </div>
    );
  }

  const handleUpdate = (updates: Partial<BotMessageTemplate>) => {
    try {
      messageService.updateTemplate(activeTemplate.id, updates);
      setTemplates([...messageService.getTemplates()]);
      onShowToast('Modèle mis à jour', activeTemplate.name, 'success');
    } catch (e) {
      // Error
    }
  };

  const handleCreateTemplate = () => {
    const name = prompt('Nom du nouveau modèle de message :', 'Annonce Personnalisée');
    if (!name) return;

    const newTpl = messageService.createTemplate({
      key: `custom_${Date.now()}`,
      name,
      channelId: 'chan-general',
      channelName: '#annonces',
      embedTitle: '📌 ' + name,
      embedDescription: 'Message personnalisé rédigé pour votre serveur Discord.',
      embedColor: '#6366f1',
      buttons: [
        {
          id: `btn-${Date.now()}`,
          label: '🔗 Lien de Redirection',
          style: 'Link',
          customId: 'link_redirect',
          actionType: 'redirect_url',
          actionValue: 'https://discord.gg',
        },
      ],
      enabled: true,
    });

    setTemplates([...messageService.getTemplates()]);
    setSelectedId(newTpl.id);
    onShowToast('Modèle Créé', name, 'success');
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`Supprimer le modèle "${name}" ?`)) {
      messageService.deleteTemplate(id);
      const remaining = messageService.getTemplates();
      setTemplates([...remaining]);
      if (remaining[0]) setSelectedId(remaining[0].id);
      onShowToast('Modèle supprimé', name, 'info');
    }
  };

  const handleAddButton = () => {
    if (!newBtnLabel) return;
    const customId = newBtnAction === 'redirect_url'
      ? 'redirect_url'
      : `${newBtnAction}_${Date.now()}`;

    messageService.addButtonToTemplate(activeTemplate.id, {
      label: newBtnLabel,
      style: newBtnStyle,
      customId,
      actionType: newBtnAction,
      actionValue: newBtnValue,
    });

    setTemplates([...messageService.getTemplates()]);
    setShowAddButton(false);
    setNewBtnLabel('🚀 Action Personnalisée');
    onShowToast('Bouton Ajouté', newBtnLabel, 'success');
  };

  const handleDeleteButton = (btnId: string) => {
    messageService.deleteButtonFromTemplate(activeTemplate.id, btnId);
    setTemplates([...messageService.getTemplates()]);
    onShowToast('Bouton Supprimé', '', 'info');
  };

  const formattedPreviewTitle = messageService.formatMessage(activeTemplate.embedTitle, {});
  const formattedPreviewDescription = messageService.formatMessage(activeTemplate.embedDescription, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span>Éditeur de Messages & Boutons Personnalisés</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configurez les textes, les boutons interactifs, leurs styles et leurs actions de redirection sur Discord.
          </p>
        </div>

        <button
          onClick={handleCreateTemplate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Message</span>
        </button>
      </div>

      {/* Main Grid Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Templates (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-1">Messages Automatiques & Boutons</span>
          {templates.map((tpl) => {
            const isSelected = tpl.id === selectedId;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`w-full p-3 rounded-xl border transition-all text-xs cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/80 text-white font-bold shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex flex-col gap-0.5 truncate">
                  <span className="truncate">{tpl.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                    <span className="text-indigo-400">{tpl.channelName}</span>
                    <span>• {tpl.buttons?.length || 0} bouton(s)</span>
                  </span>
                </div>

                {templates.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(tpl.id, tpl.name);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Supprimer ce message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Center Editor (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-400" />
              <span>{activeTemplate.name}</span>
            </h2>
            <input
              type="text"
              value={activeTemplate.channelName}
              onChange={(e) => handleUpdate({ channelName: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-mono text-right w-28"
              placeholder="#salon"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">Titre Embed</label>
            <input
              type="text"
              value={activeTemplate.embedTitle}
              onChange={(e) => handleUpdate({ embedTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">Description Embed</label>
            <textarea
              rows={4}
              value={activeTemplate.embedDescription}
              onChange={(e) => handleUpdate({ embedDescription: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">Couleur d'Accrochage Embed</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeTemplate.embedColor}
                onChange={(e) => handleUpdate({ embedColor: e.target.value })}
                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={activeTemplate.embedColor}
                onChange={(e) => handleUpdate({ embedColor: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Custom Buttons Management */}
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Boutons Interactifs ({activeTemplate.buttons?.length || 0})</span>
              </span>
              <button
                onClick={() => setShowAddButton(!showAddButton)}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-colors"
              >
                + Ajouter un Bouton
              </button>
            </div>

            {/* Existing Buttons List */}
            <div className="space-y-2">
              {(activeTemplate.buttons || []).map((btn) => (
                <div
                  key={btn.id}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        btn.style === 'Success' ? 'bg-emerald-500' :
                        btn.style === 'Secondary' ? 'bg-slate-400' :
                        btn.style === 'Danger' ? 'bg-rose-500' : 'bg-indigo-500'
                      }`} />
                      <span>{btn.label}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteButton(btn.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Supprimer ce bouton"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Style :</span>
                      <span className="text-slate-200 font-semibold">{btn.style}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Action :</span>
                      <span className="text-indigo-300 font-semibold">{btn.actionType}</span>
                    </div>
                  </div>

                  {btn.actionValue && (
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-800 truncate">
                      Lien / Valeur : {btn.actionValue}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Button Form Drawer */}
            {showAddButton && (
              <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl space-y-2.5">
                <span className="text-xs font-bold text-white block">Nouveau Bouton Discord</span>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Texte du Bouton</label>
                  <input
                    type="text"
                    value={newBtnLabel}
                    onChange={(e) => setNewBtnLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Style Visuel</label>
                    <select
                      value={newBtnStyle}
                      onChange={(e) => setNewBtnStyle(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="Primary">Bleu (Primary)</option>
                      <option value="Success">Vert (Success)</option>
                      <option value="Secondary">Gris (Secondary)</option>
                      <option value="Danger">Rouge (Danger)</option>
                      <option value="Link">Lien Web (Link)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Action du Bouton</label>
                    <select
                      value={newBtnAction}
                      onChange={(e) => setNewBtnAction(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="join_training">Rejoindre la Formation</option>
                      <option value="start_module">Démarrer le Module</option>
                      <option value="launch_quiz">Lancer le Quiz</option>
                      <option value="show_profile">Afficher mon Profil</option>
                      <option value="redirect_url">Redirection URL Web</option>
                      <option value="assign_role">Attribuer un Rôle</option>
                    </select>
                  </div>
                </div>

                {(newBtnAction === 'redirect_url' || newBtnAction === 'assign_role') && (
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {newBtnAction === 'redirect_url' ? 'URL de Redirection Web' : 'ID / Nom du Rôle'}
                    </label>
                    <input
                      type="text"
                      value={newBtnValue}
                      onChange={(e) => setNewBtnValue(e.target.value)}
                      placeholder={newBtnAction === 'redirect_url' ? 'https://mon-site.com' : 'VIP Member'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowAddButton(false)}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddButton}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                  >
                    Enregistrer Bouton
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Variables Reference Box */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Variable className="w-3.5 h-3.5" />
              <span>Variables Dynamiques Remplacées Automatiquement</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
              <span>{'{user}'} : mention user</span>
              <span>{'{username}'} : nom d'utilisateur</span>
              <span>{'{server}'} : nom serveur</span>
              <span>{'{module}'} : nom du module</span>
              <span>{'{score}'} : score obtenu</span>
              <span>{'{max_score}'} : score max</span>
            </div>
          </div>
        </div>

        {/* Right Preview (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Aperçu Discord en Direct</span>
          <DiscordPreview
            title={formattedPreviewTitle}
            description={formattedPreviewDescription}
            color={activeTemplate.embedColor}
            buttons={activeTemplate.buttons}
            channelName={activeTemplate.channelName}
          />
        </div>
      </div>
    </div>
  );
};
