import React, { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { tactileEngine } from '../../services/tactileEngine';
import { O1FCoachCommandCenter } from './01FCoachCommandCenter';
import { O1FCoachAthletePortal } from './01FCoachAthletePortal';
import { onCoachConsoleRequested } from './services/coachConsoleBus';
import { isValidUuid } from './services/coachService';
import { CoachRootView, resolveCoachAccess, useCoachViewStore } from './store/useCoachViewStore';

const TOGGLES: { id: CoachRootView; label: string; icon: typeof Users }[] = [
  { id: 'athlete', label: 'Athletes', icon: Users },
  { id: 'coach', label: 'Coaching', icon: Shield },
];

/** Coaches are members with the coach role or a public coach card. */
export const O1FCoachRootView: React.FC = () => {
  const userId = useAuthStore((s) => s.user?.id || '');
  const role = useAuthStore((s) => s.profile?.role);
  const view = useCoachViewStore((s) => s.view);
  const setView = useCoachViewStore((s) => s.setView);
  const cachedCard = useCoachViewStore((s) => s.coachCard);
  const setCoachCard = useCoachViewStore((s) => s.setCoachCard);
  const [checkFailed, setCheckFailed] = useState(false);
  const [visited, setVisited] = useState<Record<CoachRootView, boolean>>(() => ({
    athlete: view === 'athlete',
    coach: view === 'coach',
  }));
  const { isCoach, awaitingFirstCheck } = resolveCoachAccess({
    role,
    userId,
    validUserId: isValidUuid(userId),
    cached: cachedCard,
    checkFailed,
  });

  useEffect(
    () =>
      onCoachConsoleRequested(() => {
        setView('coach');
        setVisited((prev) => ({ ...prev, coach: true }));
      }),
    [setView],
  );

  useEffect(() => {
    setCheckFailed(false);
    if (!isValidUuid(userId)) return;
    let cancelled = false;
    void supabase
      .from('coach_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // A failed lookup is not an answer: show the athlete view this time and ask again next visit.
        if (error) setCheckFailed(true);
        else setCoachCard(userId, Boolean(data));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, setCoachCard]);

  if (awaitingFirstCheck) return <div className="min-h-screen w-full bg-black" aria-busy="true" />;
  if (!isCoach) return <O1FCoachAthletePortal isCoach={false} />;

  return (
    <div className="w-full flex flex-col min-h-screen">
      <div className="sticky top-0 z-40 w-full pt-2 pb-1.5 bg-black/95 backdrop-blur-md">
        <div
          className="flex items-center justify-center gap-1.5"
          role="tablist"
          aria-label="Coach view"
        >
          {TOGGLES.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`coach-view-toggle-${id}`}
                aria-selected={active}
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setView(id);
                  setVisited((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
                }}
                className={`o1-pill text-[11px] font-semibold border ${
                  active
                    ? 'bg-o1-crimson text-white border-o1-crimson'
                    : 'bg-o1-sheet text-o1-text border-white/[0.07]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visited.coach || view === 'coach' ? (
        <div hidden={view !== 'coach'}>
          <O1FCoachCommandCenter isCoach />
        </div>
      ) : null}
      {visited.athlete || view === 'athlete' ? (
        <div hidden={view !== 'athlete'}>
          <O1FCoachAthletePortal isCoach />
        </div>
      ) : null}
    </div>
  );
};
