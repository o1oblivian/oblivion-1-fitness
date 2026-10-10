import React, { useCallback, useEffect, useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachingApplication, decideApplication, fetchCoachApplications } from '../../reels/services/coachStorefront';
import { AthleteAvatar } from './floor/FloorAthleteCard';

const REQUESTS_EVENT = 'o1-coaching-requests-changed';

/** Pending consultation requests for a coach, kept in sync across every view that shows them. */
export function useCoachingRequests(coachId: string, onAccepted?: () => void) {
  const [requests, setRequests] = useState<CoachingApplication[]>([]);

  const load = useCallback(() => {
    if (!coachId) return;
    void fetchCoachApplications(coachId).then(setRequests).catch(() => undefined);
  }, [coachId]);

  useEffect(() => {
    load();
    window.addEventListener(REQUESTS_EVENT, load);
    return () => window.removeEventListener(REQUESTS_EVENT, load);
  }, [load]);

  const decide = async (request: CoachingApplication, accept: boolean) => {
    tactileEngine.triggerSelectionBuzz();
    const ok = await decideApplication(request, accept);
    if (!ok) return;
    setRequests((prev) => prev.filter((row) => row.id !== request.id));
    window.dispatchEvent(new CustomEvent(REQUESTS_EVENT));
    if (accept) onAccepted?.();
  };

  return { requests, decide };
}

export const CoachingRequestCard: React.FC<{
  request: CoachingApplication;
  onDecide: (request: CoachingApplication, accept: boolean) => void;
}> = ({ request, onDecide }) => {
  const name = request.athleteName || 'Athlete';
  const intake = Object.values(request.intake).filter(Boolean);
  return (
    <article className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
      <div className="flex items-start gap-3">
        <AthleteAvatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[15px] font-semibold text-o1-text">{name}</span>
            <span className="shrink-0 text-[11px] text-o1-muted">Wants coaching</span>
          </div>
          <p className="text-[13px] text-o1-text">{request.goal}</p>
          {intake.length > 0 ? <p className="mt-0.5 text-[12px] text-o1-muted">{intake.join(' · ')}</p> : null}
        </div>
      </div>
      <div className="flex gap-2">
        {([false, true] as const).map((accept) => (
          <button
            key={String(accept)}
            type="button"
            onClick={() => onDecide(request, accept)}
            className={`h-[44px] flex-1 rounded-xl text-[13px] font-semibold active:scale-[0.98] ${
              accept ? 'bg-o1-crimson text-white' : 'border border-white/[0.07] bg-o1-canvas text-o1-text'
            }`}
          >
            {accept ? 'Accept' : 'Decline'}
          </button>
        ))}
      </div>
    </article>
  );
};
