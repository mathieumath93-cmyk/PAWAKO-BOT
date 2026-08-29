import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Award, 
  Calendar, 
  User, 
  ShieldCheck,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Member, TrainingModule } from '../types';
import { memberService } from '../services/memberService';
import { moduleService } from '../services/moduleService';

interface CandidatePortalProps {
  allowCandidateSwitch?: boolean;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({ allowCandidateSwitch = true }) => {
  const members = memberService.getMembers();
  const candidates = members.filter((m) => !m.roles?.includes('Admin') && !m.roles?.includes('Lead Admin'));
  const modules = moduleService.getModules();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(candidates[0]?.id || members[0]?.id || '');
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

  const activeCand = members.find((m) => m.id === selectedMemberId) || candidates[0] || members[0];

  if (!activeCand) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 max-w-xl mx-auto my-8">
        <p className="font-semibold text-slate-300">Aucun membre candidat trouvé.</p>
      </div>
    );
  }

  const completedCount = activeCand.modulesCompletedCount || Object.values(activeCand.progress || {}).filter((p) => p.status === 'valide').length || 0;
  const totalModules = modules.length || 5;
  const progressPercent = Math.round((completedCount / totalModules) * 100);
  const isCompleted = completedCount >= totalModules || activeCand.candidateState === 'formation_terminee';

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Header & Candidate Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            P
          </div>
          <div>
            <h1 className="font-bold text-white text-base sm:text-lg tracking-tight">Espace Membre PAWAKO</h1>
            <p className="text-xs text-indigo-400 font-medium">Portail Individuel de Formation Candidat</p>
          </div>
        </div>

        {allowCandidateSwitch && candidates.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto">
            <User className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Aperçu Candidat :</span>
            <select
              value={activeCand.id}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-slate-900 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.username} ({c.candidateState || 'Membre'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Candidate Status Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Membre Discord : @{activeCand.username}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {isCompleted ? '🎉 Formation théorique & parcours validés !' : `Bienvenue, ${activeCand.username} 👋`}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
              Consultez l'avancement théorique, les rendez-vous en direct (Simulation & Outils), ainsi que l'accès aux cours de formation PAWAKO.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center min-w-[180px]">
            <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Avancement Global</div>
            <div className="text-2xl font-black text-indigo-400">
              {progressPercent}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {completedCount} / {totalModules} modules validés
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Alert */}
      {(activeCand.simulationScheduledTimestamp || activeCand.toolsFormationScheduledTimestamp) && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-lg flex items-start space-x-4">
          <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-indigo-200 text-base">Rendez-vous Programmé en Direct</h3>
            {activeCand.simulationScheduledTimestamp && (
              <p className="text-sm text-indigo-300">
                🎯 <strong>Test de Simulation :</strong> <span className="text-white font-semibold">{new Date(activeCand.simulationScheduledTimestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} (14h00 - 18h00 HF)</span>
              </p>
            )}
            {activeCand.toolsFormationScheduledTimestamp && (
              <p className="text-sm text-indigo-300">
                🛠️ <strong>Formation Outils :</strong> <span className="text-white font-semibold">{new Date(activeCand.toolsFormationScheduledTimestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} (10h00 - 14h00 HF)</span>
              </p>
            )}
            <p className="text-xs text-indigo-400/80 pt-1">
              Des rappels automatiques sont envoyés dans le salon Discord privé du membre le jour du rendez-vous.
            </p>
          </div>
        </div>
      )}

      {/* Modules List */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>Modules du Parcours PAWAKO</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod, idx) => {
            const modProgress = activeCand.progress?.[mod.id];
            const isValide = modProgress?.status === 'valide' || idx < completedCount;
            const isUnlocked = idx <= completedCount;

            return (
              <div
                key={mod.id}
                onClick={() => isUnlocked && setSelectedModule(mod)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isValide
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                    : isUnlocked
                    ? 'bg-slate-950/80 border-slate-700 hover:border-indigo-500'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Module {mod.order || idx + 1}
                  </span>
                  {isValide ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Validé
                    </span>
                  ) : isUnlocked ? (
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> En Cours
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Lock className="w-4 h-4" /> Verrouillé
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-white text-sm mb-1">{mod.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{mod.description}</p>

                {isUnlocked && (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-indigo-400 pt-2 border-t border-slate-800/60">
                    <span>Consulter le cours</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
