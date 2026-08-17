import React, { useState } from 'react';
import { MessageSquare, Save, Sparkles, Variable } from 'lucide-react';
import { BotMessageTemplate } from '../types';
import { messageService } from '../services/messageService';
import { DiscordPreview } from './ui/DiscordPreview';

interface MessagesViewProps {
  onShowToast: (title: string, message?: string, type?: 'success' | 'info') => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onShowToast }) => {
  const [templates, setTemplates] = useState<BotMessageTemplate[]>(messageService.getTemplates());
  const [selectedKey, setSelectedKey] = useState<string>(templates[0]?.key || 'welcome');

  const activeTemplate = templates.find((t) => t.key === selectedKey) || templates[0];

  const handleUpdate = (updates: Partial<BotMessageTemplate>) => {
    try {
      const updated = messageService.updateTemplate(activeTemplate.id, updates);
      setTemplates([...messageService.getTemplates()]);
      onShowToast('Message Discord mis à jour', updated.name, 'success');
    } catch (e) {
      // Error
    }
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
            <span>Éditeur de Messages Discord</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personnalisez les messages automatiques et leurs variables dynamiques avec aperçu en temps réel.
          </p>
        </div>
      </div>

      {/* Main Grid Editor + Live Discord Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Templates (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2">Templates Disponibles</span>
          {templates.map((tpl) => {
            const isSelected = tpl.key === selectedKey;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedKey(tpl.key)}
                className={`w-full p-3 rounded-xl text-left border transition-all text-xs flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/80 text-white font-bold shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{tpl.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{tpl.channelName}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono line-clamp-1">{tpl.embedTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Center Editor (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white">Éditer : {activeTemplate.name}</h2>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">Titre de l'Embed</label>
            <input
              type="text"
              value={activeTemplate.embedTitle}
              onChange={(e) => handleUpdate({ embedTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 mb-1 block">Description de l'Embed</label>
            <textarea
              rows={4}
              value={activeTemplate.embedDescription}
              onChange={(e) => handleUpdate({ embedDescription: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Couleur Hex</label>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Texte du Bouton</label>
              <input
                type="text"
                value={activeTemplate.buttonLabel || ''}
                onChange={(e) => handleUpdate({ buttonLabel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Variables Reference Box */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Variable className="w-3.5 h-3.5" />
              <span>Variables Dynamiques Disponibles</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
              <span>{'{user}'} : mention user</span>
              <span>{'{username}'} : nom d'utilisateur</span>
              <span>{'{server}'} : nom serveur</span>
              <span>{'{module}'} : nom du module</span>
              <span>{'{score}'} : score obtenu</span>
              <span>{'{max_score}'} : score max</span>
              <span>{'{next_module}'} : module suivant</span>
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
            buttonLabel={activeTemplate.buttonLabel}
            channelName={activeTemplate.channelName}
          />
        </div>
      </div>
    </div>
  );
};
