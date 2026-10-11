import React, { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { tactileEngine } from '../../services/tactileEngine';
import { O1FCoachCommandCenter } from './01FCoachCommandCenter';
import { O1FCoachAthletePortal } from './01FCoachAthletePortal';
import { onCoachConsoleRequested } from './services/coachConsoleBus';

const COACH_FOUNDER_EMAIL = 'o1oblivianfitness@gmail.com';

function storedEmail(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_email') || '' : '';
}

function isFounderEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase() === COACH_FOUNDER_EMAIL);
}

type View = 'directory' | 'console';

export const O1FCoachRootView: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signedInEmail = user?.email || storedEmail();
  const isFounder = isFounderEmail(signedInEmail);

  const [isCoach, setIsCoach] = useState<boolean>(
    () => isFounder || profile?.role === 'coach' || (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_role') === 'coach'),
  );
  const [activeView, setActiveView] = useState<View>('console');
  const [visited, setVisited] = useState<Record<View, boolean>>({ directory: false, console: true });

  useEffect(() => onCoachConsoleRequested(() => setActiveView('console')), []);

  useEffect(() => {
    if (isFounder || profile?.role === 'coach') {
      setIsCoach(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id || user?.id || '';
      if (isFounderEmail(authData?.user?.email)) {
        if (!cancelled) setIsCoach(true);
        return;
      }
      if (!uid) return;
      const { data } = await supabase.from('coach_profiles').select('id').eq('id', uid).maybeSingle();
      if (data && !cancelled) setIsCoach(true);
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isFounder, user?.id, profile?.role]);

  if (!isCoach) return <O1FCoachAthletePortal isCoach={false} />;
  if (!isFounder) return <O1FCoachCommandCenter isCoach />;

  const toggles: { id: View; label: string; icon: typeof Users }[] = [
    { id: 'directory', label: 'Athletes', icon: Users },
    { id: 'console', label: 'Coaching', icon: Shield },
  ];

  return (
    <div className="w-full flex flex-col min-h-screen">
      <div className="sticky top-0 z-40 w-full pt-2 pb-1.5 bg-black/95 backdrop-blur-md">
        <div className="flex items-center justify-center gap-1.5">
          {toggles.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              id={`coach-view-toggle-${id}`}
              aria-pressed={activeView === id}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setActiveView(id);
                setVisited((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
              }}
              className={`o1-pill text-[11px] font-semibold ${
                activeView === id ? 'bg-white text-neutral-950 border-white' : 'bg-o1-sheet text-o1-text border border-white/[0.07]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {visited.console ? (
        <div hidden={activeView !== 'console'}>
          <O1FCoachCommandCenter isCoach />
        </div>
      ) : null}
      {visited.directory ? (
        <div hidden={activeView !== 'directory'}>
          <O1FCoachAthletePortal isCoach />
        </div>
      ) : null}
    </div>
  );
};

export default O1FCoachRootView;
