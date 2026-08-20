import React, { useState } from 'react';
import {
  X,
  Type,
  Heading,
  Image,
  Video,
  Link,
  MousePointerClick,
  Minus,
  HelpCircle,
  AlertOctagon,
  Code,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  Eye,
  Save,
  Lock,
} from 'lucide-react';
import { TrainingModule, ModuleBlock, ModuleBlockType } from '../types';
import { DiscordPreview } from './ui/DiscordPreview';

interface ModuleBuilderModalProps {
  isOpen: boolean;
  moduleToEdit?: TrainingModule | null;
  onClose: () => void;
  onSave: (moduleData: Partial<TrainingModule>) => void;
}

export const ModuleBuilderModal: React.FC<ModuleBuilderModalProps> = ({
  isOpen,
  moduleToEdit,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(moduleToEdit?.title || 'Module de Formation');
  const [description, setDescription] = useState(moduleToEdit?.description || 'Description du module...');
  const [isActive, setIsActive] = useState(moduleToEdit?.isActive ?? true);

  const defaultBlocks: ModuleBlock[] = moduleToEdit?.blocks || [
    { id: 'blk-1', type: 'heading', title: 'Introduction', content: title },
    { id: 'blk-2', type: 'text', content: 'Bienvenue dans cette session d\'apprentissage. Suivez attentivement les consignes ci-dessous.' },
    { id: 'blk-3', type: 'alert', title: 'Rappel Important', content: 'Un score minimum de 80% au quiz final est requis pour débloquer le rôle suivant.', alertType: 'info' },
  ];

  const [blocks, setBlocks] = useState<ModuleBlock[]>(defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id || null);

  const availableBlockTypes: { type: ModuleBlockType; label: string; icon: any }[] = [
    { type: 'heading', label: 'Titre (Heading)', icon: Heading },
    { type: 'text', label: 'Texte Libre', icon: Type },
    { type: 'image', label: 'Image URL', icon: Image },
    { type: 'video', label: 'Vidéo YouTube/MP4', icon: Video },
    { type: 'link', label: 'Lien externe', icon: Link },
    { type: 'button', label: 'Bouton Discord', icon: MousePointerClick },
    { type: 'divider', label: 'Séparateur', icon: Minus },
    { type: 'quiz', label: 'Bloc Quiz', icon: HelpCircle },
    { type: 'alert', label: 'Alerte / Encadré', icon: AlertOctagon },
    { type: 'embed', label: 'Custom Embed', icon: Code },
  ];

  const handleAddBlock = (type: ModuleBlockType) => {
    const newBlock: ModuleBlock = {
      id: `blk-${Date.now()}`,
      type,
      title: type === 'heading' ? 'Nouveau Titre' : type === 'alert' ? 'Alerte' : undefined,
      content:
        type === 'image'
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
          : type === 'button'
          ? 'Démarrer le quiz'
          : type === 'alert'
          ? 'Information importante pour les membres'
          : 'Contenu du bloc...',
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    setBlocks(newBlocks);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleUpdateBlock = (id: string, updates: Partial<ModuleBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      isActive,
      channelName: '#formation-privee',
      blocks,
      content: blocks.map((b) => b.content).join('\n\n'),
    });
    onClose();
  };

  const activeBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>{moduleToEdit ? 'Éditeur de Contenu du Module' : 'Créer un Nouveau Module'}</span>
            </h2>
            <p className="text-xs text-slate-400">Assemblez les leçons, textes, vidéos et consignes de ce module.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel 1: Components Palette & Basic Settings (3 cols) */}
          <div className="lg:col-span-3 border-r border-slate-800/80 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-slate-950/40">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Titre du Module</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description courte</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Delivery & Roles Sync Box */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-white">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Diffusion en Salon Privé</span>
              </div>
              <p className="text-[10px] text-indigo-200/80 leading-relaxed">
                Ce contenu est transmis automatiquement dans le salon privé du candidat (<code>🔒-formation-[pseudo]</code>).
              </p>
              <p className="text-[10px] text-indigo-400 font-semibold pt-1.5 border-t border-indigo-500/20">
                ⚙️ Rôles & progression configurés dans "Parcours Onboarding".
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Composants Disponibles</span>
              <div className="grid grid-cols-2 gap-1.5">
                {availableBlockTypes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddBlock(item.type)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-2 transition-all text-left cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel: Blocks Sequence Editor (5 cols) */}
          <div className="lg:col-span-5 p-4 overflow-y-auto custom-scrollbar space-y-3 bg-slate-900/50">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Séquence des Blocs du Module ({blocks.length})</span>
              <span className="text-[10px] text-slate-500 font-mono">Ordre de haut en bas</span>
            </div>

            {blocks.map((block, idx) => {
              const isSelected = selectedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected ? 'bg-indigo-950/30 border-indigo-500/80 shadow-lg' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider font-mono">
                      #{idx + 1} • {block.type}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(idx, 'up');
                        }}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(idx, 'down');
                        }}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="p-1 rounded bg-rose-950 text-rose-400 hover:bg-rose-900"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Block Content Inputs */}
                  {isSelected ? (
                    <div className="space-y-2 pt-1 border-t border-slate-800">
                      {block.title !== undefined && (
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                          placeholder="Titre du bloc"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      )}
                      <textarea
                        rows={2}
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white resize-none"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 line-clamp-2 italic">{block.content}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Panel: Live Discord Preview (4 cols) */}
          <div className="lg:col-span-4 border-l border-slate-800/80 p-4 bg-slate-950/80 overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Eye className="w-4 h-4" />
              <span>Aperçu Discord Temps Réel</span>
            </div>

            <DiscordPreview
              title={`🎓 ${title}`}
              description={`${description}\n\n${blocks.map((b) => (b.title ? `**${b.title}**\n${b.content}` : b.content)).join('\n\n')}`}
              channelName="🔒-formation-candidat"
              buttonLabel="📚 Lancer le Module"
              color="#6366f1"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
              />
              <span>Publier immédiatement (Status Published)</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveSubmit}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Sauvegarder le Module</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
