import React from 'react';
import { Star } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { NearbyCoach, coachDistanceLabel, coachPriceLabel } from '../services/coachesNearby';

export function CoachPill() {
  return <span className="rounded-full bg-o1-crimson px-1.5 py-0.5 text-[10px] font-semibold text-white">Coach</span>;
}

/** Coaches near you, kept out of the swipe deck. */
export const CoachesNearbyStrip: React.FC<{ coaches: NearbyCoach[]; onOpen: (coach: NearbyCoach) => void }> = ({ coaches, onOpen }) => {
  if (coaches.length === 0) return null;
  return (
    <section className="pt-3" aria-label="Coaches nearby">
      <div className="flex items-baseline justify-between px-4 pb-2">
        <h3 className="text-[13px] font-semibold text-o1-text">Coaches nearby</h3>
        <span className="text-[11px] text-o1-muted">{coaches.length}</span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-1">
        {coaches.map((coach) => {
          const meta = [coach.discipline, coachDistanceLabel(coach.distanceKm)].filter(Boolean).join(' · ');
          const price = coachPriceLabel(coach.monthlyPriceCents);
          return (
            <button
              key={coach.id}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onOpen(coach);
              }}
              className="w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-o1-surface text-left active:scale-[0.98]"
            >
              <span className="relative block aspect-square w-full bg-o1-sheet">
                {coach.photo ? (
                  <img src={coach.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-o1-text">{coach.name.slice(0, 1).toUpperCase()}</span>
                )}
                <span className="absolute left-1.5 top-1.5">
                  <CoachPill />
                </span>
              </span>
              <span className="block space-y-0.5 p-2">
                <span className="block truncate text-[13px] font-semibold text-o1-text">{coach.name}</span>
                {meta ? <span className="block truncate text-[11px] text-o1-muted">{meta}</span> : null}
                <span className="flex items-center gap-1 truncate text-[11px] text-o1-text">
                  {coach.rating != null ? (
                    <>
                      <Star size={11} className="shrink-0 fill-amber-500 text-amber-500" />
                      {coach.rating.toFixed(1)}
                      {price ? <span className="text-o1-muted">· {price}</span> : null}
                    </>
                  ) : (
                    price || <span className="text-o1-muted">{coach.accepting ? 'Taking clients' : 'Full'}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
