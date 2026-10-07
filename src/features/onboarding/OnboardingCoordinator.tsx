import React, { useState } from 'react';
import { OnboardingData, INITIAL_ONBOARDING_DATA } from './types/onboardingTypes';
import { AuthCard } from './steps/AuthCard';
import { AthleteLaunchProtocolCard } from './steps/AthleteLaunchProtocolCard';
import { LegalSheet } from './components/LegalSheet';
import { useUserStore } from '../../stores/useUserStore';
import { supabase } from '../../services/supabaseClient';
import { tactileEngine } from '../../services/tactileEngine';
import { safeStorage } from '../../utils/safeStorage';
import signupBg from '../../assets/images/signup_bg_1790312578259.jpg';

export const OnboardingCoordinator: React.FC<{ onComplete: () => void; replay?: boolean }> = ({
  onComplete,
  replay = false,
}) => {
  const hasSession =
    typeof window !== 'undefined' &&
    Boolean(localStorage.getItem('o1fc_user_id') || safeStorage.getItem('o1fc_user_id'));
  const tutorialOnly = replay || hasSession;
  const [phase, setPhase] = useState<'auth' | 'protocol'>(tutorialOnly ? 'protocol' : 'auth');
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [legalSheet, setLegalSheet] = useState<'privacy' | 'terms' | null>(null);

  const handleUpdate = (partial: Partial<OnboardingData>) => {
    setData((p) => ({ ...p, ...partial }));
  };

  const handleFinish = async () => {
    tactileEngine.playPRCelebration();
    useUserStore.getState().setWeightKg(data.weightKg || 80);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      const targetId = user?.id || localStorage.getItem('o1fc_user_id') || '';
      if (targetId && targetId !== 'athlete-c1' && targetId !== 'default-athlete') {
        const { error } = await supabase.from('profiles').upsert({
          id: targetId,
          body_mass_kg: data.weightKg || 80,
          stature_cm: data.heightCm || 180,
          primary_goal: data.primaryFocus || 'HYROX & RACING',
          daily_step_target: data.dailyStepTarget || 10000,
          permissions: data.permissions,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });
        if (error) console.error('[Onboarding] Profile upsert failed:', error.message);
      }
    } catch (e) {
      console.error('[Onboarding] Profile dossier upsert failed:', e);
    }

    safeStorage.setItem('olfc_onboarding_completed', 'true');
    safeStorage.setItem('o1fc_onboarding_completed', 'true');
    localStorage.setItem('olfc_onboarding_completed', 'true');
    localStorage.setItem('o1fc_onboarding_completed', 'true');
    localStorage.setItem('o1fc_step_goal', String(data.dailyStepTarget || 10000));
    localStorage.setItem('o1fc_primary_focus', data.primaryFocus || 'HYROX & RACING');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-y-auto no-scrollbar select-none">
      {/* Exact High-Definition Dark Celestial Background from reference image */}
      <img
        src={signupBg}
        alt="Celestial space background"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
        referrerPolicy="no-referrer"
      />

      {/* Ambient Depth & Vignette to protect legibility */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-black/30 to-black/10 z-0" />

      <div
        className="w-full max-w-[480px] mx-auto min-h-dvh flex flex-col justify-between p-4 sm:p-6 relative z-10"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
          paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="pt-2" />

        {/* Dynamic Card based on phase */}
        <div className="py-4 my-auto">
          {phase === 'auth' ? (
            <AuthCard
              data={data}
              onUpdate={handleUpdate}
              onNext={() => setPhase('protocol')}
              onOpenLegal={(type) => setLegalSheet(type)}
            />
          ) : (
            <AthleteLaunchProtocolCard
              data={data}
              onUpdate={handleUpdate}
              onLaunch={handleFinish}
              onSkip={tutorialOnly ? onComplete : undefined}
            />
          )}
        </div>
      </div>

      <LegalSheet type={legalSheet} onClose={() => setLegalSheet(null)} />
    </div>
  );
};

export default OnboardingCoordinator;
