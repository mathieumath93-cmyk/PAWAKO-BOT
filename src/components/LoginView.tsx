import React from 'react';
import { Bot, LogIn, ShieldCheck, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username?: string, roleName?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6 relative z-10 backdrop-blur-md">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-0.5 shadow-xl shadow-indigo-500/25 mx-auto flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Bot className="w-9 h-9 text-indigo-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PAWAKO FORMATION 🤖
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Plateforme d'onboarding, de formation continue et d'administration intégrée à Discord.
          </p>
        </div>

        {/* Discord OAuth Login Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => onLogin('Anthony (Admin)', 'Admin')}
            className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#5865F2]/25 group"
          >
            <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Se connecter avec Discord</span>
          </button>

          <p className="text-[11px] text-slate-500 font-mono">
            Vérification automatique du serveur et du rôle <span className="text-indigo-400">Admin</span>
          </p>
        </div>

        {/* Features footnote */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>OAuth 2.0 Sécurisé</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bot Jarvis Connecté</span>
          </div>
        </div>
      </div>
    </div>
  );
};
