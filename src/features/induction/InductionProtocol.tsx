import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { getAuthenticatedUserId } from '../../services/authUser';
import { useSubscription } from '../../context/SubscriptionContext';
import { TIER_PLANS } from '../membership/planCatalog';
import { useStorePlans } from '../membership/useStorePlans';
import { useStorePurchase } from '../membership/useStorePurchase';
import { bumpDayRoutines } from '../workout/services/dayRoutineService';
import {
  patchAthleteSettingsSnapshot,
  readAthleteSettingsSnapshot,
} from '../../utils/athleteSettingsSnapshot';
import { useConsultationStore } from './useConsultationStore';
import { profileOnboardingStatus } from '../../services/oauthDeepLink';
import { restoreConsultation } from './restoreConsultation';
import { supabase } from '../../services/supabaseClient';
import { safeStorage } from '../../utils/safeStorage';
import { Facility, MembershipTier, TrainingDay, WEEK, suggestedDays } from './consultationTypes';
import { INTAKE_GROUPS, TaxonomyOption, optionsIn, useClubTaxonomy } from './useClubTaxonomyStore';
import { PLAN_ORDER, Phase, answerPatch, selectedKey, stepApplies } from './inductionHelpers';
import { InductionBackdrop } from './components/InductionBackdrop';
import { InductionHeader } from './components/InductionHeader';
import { Audience, PlanChoices } from './components/PlanChoices';
import { PlanCheckout } from './components/PlanCheckout';
import { QuestionStep } from './components/QuestionStep';
import { WeekPreview } from './components/WeekPreview';

export function InductionProtocol() {
  const options = useClubTaxonomy();
  const profile = useConsultationStore((state) => state);
  const patch = useConsultationStore((state) => state.patch);
  const lockIn = useConsultationStore((state) => state.lockIn);
  const { restorePurchases } = useSubscription();
  const purchase = useStorePurchase();
  const groups = INTAKE_GROUPS.filter(
    (group) =>
      stepApplies(group, profile) &&
      (group === 'training_days' ||
        group === 'competition' ||
        optionsIn(options, group).length > 0),
  );
  const tiers = optionsIn(options, 'membership_tier').filter(
    (tier) => tier.optionKey in TIER_PLANS,
  );
  const [phase, setPhase] = useState<Phase>('checking');
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<Audience>('athlete');
  const [picked, setPicked] = useState<MembershipTier>('pro');
  const [busy, setBusy] = useState<'restore' | 'finish' | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const storePlans = useStorePlans(phase === 'plans');
  const [planStyle, setPlanStyle] = useState<'auto' | 'own'>(() =>
    readAthleteSettingsSnapshot().autoDispatch ? 'auto' : 'own',
  );

  useEffect(() => {
    let cancelled = false;
    void restoreConsultation({
      status: profileOnboardingStatus,
      hydrate: () => useConsultationStore.getState().hydrate(),
      isCancelled: () => cancelled,
    }).then((found) => {
      if (!cancelled && !found) setPhase('questions');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const group = groups[Math.min(step, groups.length - 1)];

  const advance = () => {
    if (step >= groups.length - 1) {
      setPhase(readAthleteSettingsSnapshot().autoDispatch ? 'preview' : 'plans');
      return;
    }
    setStep((value) => value + 1);
  };

  const back = () => {
    tactileEngine.triggerSelectionBuzz();
    setStoreError(null);
    if (phase === 'plans' && planStyle === 'auto') {
      setPhase('preview');
      return;
    }
    if (phase === 'plans') {
      setPhase('questions');
      setStep(groups.length - 1);
      return;
    }
    if (phase === 'preview') {
      setPhase('questions');
      setStep(groups.length - 1);
      return;
    }
    setStep((value) => Math.max(0, value - 1));
  };

  const shownDays =
    profile.trainingDays.length > 0
      ? profile.trainingDays
      : suggestedDays(profile.trainingAge, profile.ageBand);

  const isActive = (item: TaxonomyOption): boolean => {
    if (group === 'facility') return profile.facilities.includes(item.optionKey as Facility);
    if (group === 'plan_style') return planStyle === item.optionKey;
    return selectedKey(group, profile) === item.optionKey;
  };

  const choose = (item: TaxonomyOption) => {
    if (!group) return;
    tactileEngine.triggerSelectionBuzz();
    if (group === 'facility') {
      const key = item.optionKey as Facility;
      const current = profile.facilities;
      patch({
        facilities: current.includes(key)
          ? current.filter((value) => value !== key)
          : [...current, key],
      });
      return;
    }
    if (group === 'plan_style') {
      const style = item.optionKey === 'own' ? 'own' : 'auto';
      setPlanStyle(style);
      patchAthleteSettingsSnapshot({ autoDispatch: style === 'auto' });
      bumpDayRoutines();
    } else {
      patch(answerPatch(group, item.optionKey, profile));
    }
    window.setTimeout(advance, 240);
  };

  const toggleDay = (day: TrainingDay) => {
    tactileEngine.triggerSelectionBuzz();
    const next = shownDays.includes(day)
      ? shownDays.filter((value) => value !== day)
      : [...shownDays, day];
    const ordered = WEEK.filter((value) => next.includes(value));
    patch({ trainingDays: ordered, frequencyDays: ordered.length });
  };

  const continueStep = () => {
    tactileEngine.triggerSelectionBuzz();
    if (group === 'training_days')
      patch({ trainingDays: shownDays, frequencyDays: shownDays.length });
    advance();
  };

  const finish = async (tier: MembershipTier) => {
    setBusy('finish');
    tactileEngine.playPRCelebration();
    await lockIn(tier);
    const uid = await getAuthenticatedUserId();
    if (uid) {
      const { error } = await supabase.from('profiles').upsert({
        id: uid,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });
      if (error)
        console.warn('[Consultation] Could not save onboarding completion:', error.message);
    }
    safeStorage.setItem('o1fc_onboarding_completed', 'true');
    safeStorage.setItem('olfc_onboarding_completed', 'true');
  };

  const plan = TIER_PLANS[picked];
  const price = storePlans.priceOf(plan.product);
  const availability = storePlans.availability(plan.product);
  const working = busy !== null || purchase.busy;
  const shownError = storeError ?? purchase.error ?? storePlans.notice(plan.product);
  /** The free plan for the chosen audience, the fallback when someone skips paying. */
  const freeTier: MembershipTier = audience === 'athlete' ? 'core' : 'coach';

  const pick = (key: MembershipTier) => {
    setPicked(key);
    setStoreError(null);
    purchase.clearError();
  };

  const chooseAudience = (key: Audience) => {
    setAudience(key);
    pick(key === 'athlete' ? 'pro' : 'coach_pro');
  };

  const buy = async () => {
    tactileEngine.triggerSelectionBuzz();
    setStoreError(null);
    purchase.clearError();
    if (plan.product.isFree) {
      await finish(picked);
      return;
    }
    if (availability === 'unavailable') {
      storePlans.retry();
      return;
    }
    if (await purchase.buy(plan.product.productId)) await finish(picked);
  };

  const restore = async () => {
    tactileEngine.triggerSelectionBuzz();
    setStoreError(null);
    setBusy('restore');
    const ok = await restorePurchases().catch(() => false);
    if (ok) {
      await finish(picked);
      return;
    }
    setBusy(null);
    setStoreError('No previous purchase was found for this account.');
  };

  if (phase === 'checking') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
        <InductionBackdrop />
        <Loader2 className="h-6 w-6 animate-spin text-o1-muted" />
      </div>
    );
  }

  const total = groups.length + (planStyle === 'auto' ? 2 : 1);
  const position =
    phase === 'questions' ? step + 1 : phase === 'preview' ? groups.length + 1 : total;
  const skip = () => {
    tactileEngine.triggerSelectionBuzz();
    if (phase === 'questions') advance();
    else if (phase === 'preview') setPhase('plans');
    else if (!working) void finish(freeTier);
  };
  const audienceTiers = tiers
    .filter((tier) => TIER_PLANS[tier.optionKey as MembershipTier].audience === audience)
    .sort(
      (a, b) =>
        PLAN_ORDER.indexOf(a.optionKey as MembershipTier) -
        PLAN_ORDER.indexOf(b.optionKey as MembershipTier),
    );

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black text-o1-text">
      <InductionBackdrop />
      <InductionHeader
        canGoBack={phase !== 'questions' || step > 0}
        position={position}
        total={total}
        onBack={back}
        onSkip={skip}
      />

      {phase === 'questions' && group ? (
        <QuestionStep
          key={group}
          group={group}
          profile={profile}
          choices={optionsIn(options, group)}
          shownDays={shownDays}
          isActive={isActive}
          onChoose={choose}
          onToggleDay={toggleDay}
          onCompetitionDate={(competitionDate) => patch({ competitionDate })}
          onContinue={continueStep}
        />
      ) : null}

      {phase === 'preview' ? (
        <WeekPreview profile={profile} onContinue={() => setPhase('plans')} />
      ) : null}

      {phase === 'plans' ? (
        <>
          <PlanChoices
            audience={audience}
            tiers={audienceTiers}
            picked={picked}
            priceOf={storePlans.priceOf}
            onAudience={chooseAudience}
            onPick={pick}
          />
          <PlanCheckout
            plan={plan}
            picked={picked}
            price={price}
            availability={availability}
            working={working}
            restoring={busy === 'restore'}
            error={shownError}
            onBuy={() => void buy()}
            onStartFree={() => void finish(freeTier)}
            onRestore={() => void restore()}
          />
        </>
      ) : null}
    </div>
  );
}
