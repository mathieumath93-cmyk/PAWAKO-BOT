import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface SensitiveActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  isDoubleConfirmation?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SensitiveActionModal: React.FC<SensitiveActionModalProps> = ({
  isOpen,
  title,
  description,
  actionLabel = 'Continuer',
  isDoubleConfirmation = true,
  onClose,
  onConfirm,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const handleInitialConfirm = () => {
    if (isDoubleConfirmation) {
      setStep(2);
    } else {
      onConfirm();
      onClose();
      setStep(1);
    }
  };

  const handleFinalConfirm = () => {
    onConfirm();
    onClose();
    setStep(1);
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-amber-400">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {step === 1 ? title : '⚠️ Confirmer cette action ?'}
            </h3>
            <p className="text-xs text-amber-400/90 font-medium">
              {step === 1 ? 'Action irréversible ou sensible' : 'Cette opération est critique.'}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          {step === 1
            ? description
            : 'Êtes-vous absolument certain de vouloir exécuter cette modification ? La réinitialisation s\'appliquera immédiatement.'}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          {step === 1 ? (
            <button
              onClick={handleInitialConfirm}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors shadow-lg shadow-amber-600/20"
            >
              {actionLabel}
            </button>
          ) : (
            <button
              onClick={handleFinalConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/30 animate-pulse"
            >
              Oui, exécuter l'action
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
