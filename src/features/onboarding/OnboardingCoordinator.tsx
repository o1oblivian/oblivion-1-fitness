import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { OnboardingData, INITIAL_ONBOARDING_DATA } from './types/onboardingTypes';
import { AuthCard } from './steps/AuthCard';
import { AthleteLaunchProtocolCard } from './steps/AthleteLaunchProtocolCard';
import { openLegalUrl } from '../../services/apiBase';
import { supabase } from '../../services/supabaseClient';
import { tactileEngine } from '../../services/tactileEngine';
import { safeStorage } from '../../utils/safeStorage';
import { useConsultationStore } from '../induction/useConsultationStore';
import { profileOnboardingComplete } from '../../services/oauthDeepLink';
import signupBg from '../../assets/images/signin_starfield.jpg';

/** Events that mean a person is now signed in. USER_UPDATED covers saving a new password after a reset link. */
const SIGN_IN_EVENTS = new Set<string>(['SIGNED_IN', 'INITIAL_SESSION', 'USER_UPDATED']);

type Phase = 'auth' | 'routing' | 'protocol';

interface OnboardingCoordinatorProps {
  onComplete: () => void;
  replay?: boolean;
  /** Supabase confirmed a session when this screen opened. Only read once, so signing in here does not skip steps. */
  hasSession: boolean;
}

export const OnboardingCoordinator: React.FC<OnboardingCoordinatorProps> = ({
  onComplete,
  replay = false,
  hasSession,
}) => {
  const tutorialOnly = replay || hasSession;
  const [phase, setPhase] = useState<Phase>(tutorialOnly ? 'protocol' : 'auth');
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const handleUpdate = (partial: Partial<OnboardingData>) => {
    setData((p) => ({ ...p, ...partial }));
  };

  const handleFinish = async () => {
    tactileEngine.playPRCelebration();

    safeStorage.setItem('olfc_onboarding_completed', 'true');
    safeStorage.setItem('o1fc_onboarding_completed', 'true');
    localStorage.setItem('olfc_onboarding_completed', 'true');
    localStorage.setItem('o1fc_onboarding_completed', 'true');
    onComplete();
  };

  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;
  const finishRef = useRef(handleFinish);
  finishRef.current = handleFinish;

  const routeSignedIn = useCallback(async (signedIn: boolean) => {
    if (typeof window !== 'undefined' && localStorage.getItem('o1fc_signed_out_pending') === '1')
      return;
    if (!signedIn || phaseRef.current !== 'auth') return;
    phaseRef.current = 'routing';
    setPhase('routing');
    const returning = await profileOnboardingComplete();
    if (returning) {
      await useConsultationStore
        .getState()
        .hydrate()
        .catch(() => false);
      void finishRef.current();
      return;
    }
    phaseRef.current = 'protocol';
    setPhase('protocol');
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (SIGN_IN_EVENTS.has(event) && session?.user) {
        window.setTimeout(() => void routeSignedIn(true), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [routeSignedIn]);

  const handleAuthenticated = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    await routeSignedIn(Boolean(sessionData.session?.user));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-y-auto no-scrollbar select-none">
      <img
        src={signupBg}
        alt=""
        className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent z-0" />

      <div
        className="w-full max-w-[480px] mx-auto min-h-dvh flex flex-col justify-center px-4 relative z-10"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="py-3">
          {phase === 'routing' ? (
            <div className="flex justify-center" role="status" aria-label="Signing in">
              <Loader2 className="h-6 w-6 animate-spin text-o1-muted" />
            </div>
          ) : phase === 'auth' ? (
            <AuthCard
              data={data}
              onUpdate={handleUpdate}
              onNext={() => void handleAuthenticated()}
              onOpenLegal={(type) => void openLegalUrl(type)}
            />
          ) : (
            <AthleteLaunchProtocolCard
              onLaunch={handleFinish}
              onSkip={replay ? onComplete : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};
