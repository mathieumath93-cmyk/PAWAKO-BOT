import React, { useState } from 'react';
import { Key, ExternalLink, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { safeFetchJson } from '../utils/apiUtils';

interface BotTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'info' | 'error') => void;
}

export const BotTokenModal: React.FC<BotTokenModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Veuillez saisir votre Token de Bot Discord.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await safeFetchJson('/api/bot/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });

      if (res.ok && res.data && res.data.success) {
        setSuccessMsg('Token Discord enregistré et vérifié avec succès !');
        if (onShowToast) {
          onShowToast('Token mis à jour 🔑', 'Votre Bot Discord est connecté et prêt à publier.', 'success');
        }
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        const err = res.error || (res.data && res.data.error) || 'Token invalide. Veuillez vérifier votre clé.';
        setErrorMsg(err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la connexion avec le serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">🔑 Clé / Token Bot Discord Requis</h3>
              <p className="text-xs text-slate-400">
                L'API Discord a refusé l'accès (HTTP 401). Mettez à jour le token de votre Bot.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-2 text-xs text-slate-300">
          <div className="font-bold text-indigo-400 flex items-center justify-between">
            <span>Comment obtenir ou réinitialiser votre Token Bot :</span>
            <a
              href="https://discord.com/developers/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 hover:text-indigo-200 underline flex items-center gap-1 font-bold"
            >
              <span>Developer Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>Ouvrez votre application sur le <strong>Discord Developer Portal</strong>.</li>
            <li>Allez dans l'onglet <strong>Bot</strong>.</li>
            <li>Cliquez sur <strong>Reset Token</strong> puis copiez le nouveau Token.</li>
            <li>Collez-le ci-dessous et validez pour reconnecter le Bot.</li>
          </ol>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Nouveau Token de Bot Discord <span className="text-amber-400">*</span>
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.Gxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Enregistrer et Connecter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
