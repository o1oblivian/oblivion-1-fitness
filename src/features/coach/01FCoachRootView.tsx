import React, { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuthStore } from '../../stores/useAuthStore';
import { tactileEngine } from '../../services/tactileEngine';
import { O1FCoachCommandCenter } from './01FCoachCommandCenter';
import { O1FCoachAthletePortal } from './01FCoachAthletePortal';

const COACH_FOUNDER_EMAIL = 'o1oblivianfitness@gmail.com';

export const O1FCoachRootView: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  // Synchronously compute initial coach state from store / localStorage to prevent flicker
  const [isCoach, setIsCoach] = useState<boolean>(() => {
    const email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_email') : null);
    if (email && email.toLowerCase() === COACH_FOUNDER_EMAIL.toLowerCase()) return true;
    if (profile?.role === 'coach') return true;
    if (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_role') === 'coach') return true;
    return false;
  });

  // Top Switcher Controls state: defaults to [ COACH CONSOLE ] when logged in as a coach
  const [activeView, setActiveView] = useState<'directory' | 'console'>('console');

  useEffect(() => {
    let isCancelled = false;

    const detectCoachStatus = async () => {
      // 1. Immediate email matching check
      const email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_email') : null);
      if (email && email.toLowerCase() === COACH_FOUNDER_EMAIL.toLowerCase()) {
        if (!isCancelled) setIsCoach(true);
        return;
      }

      // 2. Profile role check
      if (profile?.role === 'coach') {
        if (!isCancelled) setIsCoach(true);
        return;
      }

      // 3. Supabase Auth session & coach_profiles table lookup
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user;
        const currentUserId = authUser?.id || user?.id || (typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_id') : null);
        const currentUserEmail = authUser?.email || email;

        if (currentUserEmail && currentUserEmail.toLowerCase() === COACH_FOUNDER_EMAIL.toLowerCase()) {
          if (!isCancelled) setIsCoach(true);
          return;
        }

        // Check if the authenticated user's ID exists in coach_profiles
        if (currentUserId) {
          const { data: coachProfiles, error } = await supabase
            .from('coach_profiles')
            .select('*');

          if (!error && Array.isArray(coachProfiles)) {
            const exists = coachProfiles.some(
              (p: any) =>
                p.id === currentUserId ||
                p.user_id === currentUserId ||
                (currentUserEmail && p.email && p.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
                (currentUserEmail && p.contact_email && p.contact_email.toLowerCase() === currentUserEmail.toLowerCase())
            );
            if (exists && !isCancelled) {
              setIsCoach(true);
              return;
            }
          }
        }
      } catch (err) {
        console.debug('[CoachDetection] Error querying coach_profiles:', err);
      }
    };

    detectCoachStatus();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, user?.email, profile?.role]);

  // Non-coach users: standard athletes continue seeing only the Athlete Directory view without the toggle bar
  if (!isCoach) {
    return <O1FCoachAthletePortal isCoach={false} activePerspective="athlete" />;
  }

  // Verified coach view: top switcher header + routed view
  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Top Switcher Controls (verified coaches only) */}
      <div className="sticky top-0 z-40 w-full max-w-md mx-auto px-3.5 sm:px-4 pt-2 pb-1.5 bg-[#F4F4F7]/95 dark:bg-[#09090b]/95 backdrop-blur-md">
        <div className="bg-white dark:bg-[#121214] p-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between shadow-xs">
          <button
            type="button"
            id="coach-view-toggle-directory"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setActiveView('directory');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${
              activeView === 'directory'
                ? 'bg-[#C4121A] text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ATHLETE DIRECTORY</span>
          </button>
          <button
            type="button"
            id="coach-view-toggle-console"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setActiveView('console');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${
              activeView === 'console'
                ? 'bg-[#C4121A] text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>COACH CONSOLE</span>
          </button>
        </div>
      </div>

      {/* View Routing */}
      {activeView === 'console' ? (
        <O1FCoachCommandCenter
          activePerspective="coach"
          onChangePerspective={(p) => setActiveView(p === 'athlete' ? 'directory' : 'console')}
          isCoach={true}
        />
      ) : (
        <O1FCoachAthletePortal
          activePerspective="athlete"
          onChangePerspective={(p) => setActiveView(p === 'coach' ? 'console' : 'directory')}
          isCoach={true}
        />
      )}
    </div>
  );
};

export default O1FCoachRootView;
