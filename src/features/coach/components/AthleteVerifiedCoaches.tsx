import React from 'react';
import { Star, ShieldCheck, Dumbbell, ArrowRight } from 'lucide-react';
import { EXPLORE_COACHES } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

export interface AthleteVerifiedCoachesProps {
  coaches?: any[];
  onSelectCoach?: (coach: any) => void;
  onBookCoaching?: (coach: any) => void;
}

export const AthleteVerifiedCoaches: React.FC<AthleteVerifiedCoachesProps> = ({
  coaches = Object.values(EXPLORE_COACHES),
  onSelectCoach,
  onBookCoaching,
}) => {
  const coachList = coaches && coaches.length > 0 ? coaches : Object.values(EXPLORE_COACHES);

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#C4121A]" />
          <h3 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
            VERIFIED O1 CLUB COACHES
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">
          {(coachList ?? []).length} Available
        </span>
      </div>

      <div className="space-y-2.5">
        {(coachList ?? []).map((coach: any) => {
          const specialty = coach?.specialtyTitle ?? coach?.specialty ?? 'Club Coach';
          const specialtiesList = coach?.specialties ?? coach?.disciplines ?? [];

          return (
            <div
              key={coach?.id || coach?.name || Math.random()}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (coach && onSelectCoach) onSelectCoach(coach);
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 hover:border-[#C4121A]/50 transition-all cursor-pointer shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
                    <img
                      src={coach?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt={coach?.name || 'Coach'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-tactical font-black text-sm text-neutral-900 dark:text-white truncate">
                      {coach?.name ?? 'Club Coach'}
                    </h4>
                    <p className="text-[11px] font-mono text-[#C4121A] font-bold truncate">
                      {specialty}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white block">
                    {coach?.rate ?? '$150/mo'}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold justify-end mt-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{(coach?.rating ?? 5.0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {specialtiesList.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(specialtiesList ?? []).slice(0, 3).map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[9.5px] font-mono text-neutral-600 dark:text-neutral-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500">
                  {coach?.slotsRemaining ?? 2} roster spots left
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    tactileEngine.triggerImpactPulse();
                    if (coach && onBookCoaching) onBookCoaching(coach);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#C4121A] text-white text-[10px] font-tactical font-black uppercase tracking-wider flex items-center gap-1 hover:bg-[#a50e15] transition"
                >
                  <span>Hire Coach</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AthleteVerifiedCoaches;
