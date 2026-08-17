import React from 'react';
import { ExternalLink, ShieldAlert, X } from 'lucide-react';

interface ExternalLinkModalProps {
  isOpen: boolean;
  url: string | null;
  linkName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExternalLinkModal: React.FC<ExternalLinkModalProps> = ({
  isOpen,
  url,
  linkName,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-indigo-400">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">🔗 Redirection externe</h3>
            <p className="text-xs text-slate-400">Confirmation de sécurité obligatoire</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          Vous allez être redirigé vers un site externe :
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-indigo-300 break-all mb-6 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-500" />
          <span>{url}</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              window.open(url, '_blank', 'noopener,noreferrer');
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <span>Continuer</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
