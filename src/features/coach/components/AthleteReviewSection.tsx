import React from 'react';
import { Users, ChevronRight, Activity } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { SquadAthlete } from '../../../types';

export interface AthleteReviewSectionProps {
  athletes?: SquadAthlete[];
  onAuditAthlete?: (athlete: SquadAthlete) => void;
  onAssignAthlete?: (athlete: SquadAthlete) => void;
}

export const AthleteReviewSection: React.FC<AthleteReviewSectionProps> = ({
  athletes = [],
  onAuditAthlete,
  onAssignAthlete: _onAssignAthlete,
}) => {
  return (
    <div
      id="athlete-review-section-container"
      className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 space-y-3.5 shadow-sm select-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
            <Activity className="w-4 h-4 text-[#C4121A]" />
          </div>
          <div>
            <h3 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
              Athlete Roster Audit
            </h3>
            <p className="text-[10px] font-mono text-neutral-500">
              Assigned microcycles and check-ins
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-neutral-400 font-bold bg-neutral-100 dark:bg-[#18181b] px-2 py-0.5 rounded-full border border-neutral-200 dark:border-white/5">
          {athletes.length} Audited
        </span>
      </div>

      {athletes.length === 0 ? (
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-[#18181B] border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-2">
          <Users className="w-5 h-5 text-neutral-400 dark:text-neutral-500 mx-auto" />
          <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-tactical uppercase tracking-wider">
            NO RECORDS FOUND // SYNCHRONIZING...
          </h4>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto leading-relaxed">
            All athlete biometrics, CNS strain levels, and assigned microcycles are within optimal thresholds
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {athletes.map((athlete) => (
            <div
              key={athlete.id}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onAuditAthlete?.(athlete);
              }}
              className="py-2.5 flex items-center justify-between gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-300 shrink-0">
                  {athlete.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                    {athlete.name}
                  </h4>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {athlete.currentProtocol}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    athlete.status === 'Telemetry Warning'
                      ? 'bg-red-950/80 text-red-400 border border-red-800/80'
                      : athlete.status === 'Audit Due'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                      : 'bg-green-950/80 text-green-400 border border-green-800/80'
                  }`}
                >
                  {athlete.status === 'Telemetry Warning'
                    ? 'Warning'
                    : athlete.status === 'Audit Due'
                    ? 'Audit'
                    : 'Optimal'}
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AthleteReviewSection;
