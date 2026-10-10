import React from 'react';
import { Star, Users } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface O1FVerifiedRosterProps {
  coaches?: any[];
  onSelectCoach?: (coach: any) => void;
  onBookCoaching?: (coach: any) => void;
}

export const O1FVerifiedRoster: React.FC<O1FVerifiedRosterProps> = ({
  coaches = [],
  onSelectCoach,
  onBookCoaching,
}) => {
  const safeCoaches = (coaches ?? []).filter((c) => Boolean(c && (c.id || c.name)));

  return (
    <div className="space-y-3 select-none">
      {safeCoaches.length === 0 ? (
        <div className="border border-white/[0.07] bg-o1-card rounded-2xl p-6 text-center space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center mx-auto text-neutral-400">
            <Users className="w-5 h-5 stroke-[1.8]" />
          </div>
          <h4 className="text-xs font-semibold text-neutral-200">No coaches yet</h4>
          <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Coaches and their programs show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {safeCoaches.map((coach: any) => {
            const specialty = coach?.specialtyTitle ?? coach?.specialty ?? coach?.bio ?? 'Club Coach';
            const specialtiesList = coach?.specialties ?? coach?.disciplines ?? [];

            return (
              <div
                key={coach?.id || coach?.name}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  if (onSelectCoach) onSelectCoach(coach);
                }}
                className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] hover:border-o1-crimson/50 transition-all cursor-pointer shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/[0.08] border border-white/[0.07] shrink-0 flex items-center justify-center text-sm font-semibold text-neutral-200">
                      {coach?.avatar ? (
                        <img
                          src={coach.avatar}
                          alt={coach?.name || 'Coach'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (coach?.name || 'C').charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-tactical font-black text-sm text-white truncate">
                        {coach?.name}
                      </h4>
                      <p className="text-[11px] font-mono text-o1-crimson font-bold truncate">
                        {specialty}
                      </p>
                    </div>
                  </div>

                  {coach?.rate && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-white block">
                        {coach.rate}
                      </span>
                      {coach?.rating && (
                        <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold justify-end mt-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{Number(coach.rating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {specialtiesList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {specialtiesList.slice(0, 3).map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[9.5px] font-mono text-neutral-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default O1FVerifiedRoster;
