import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ChevronDown, Loader2 } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { revenueCatService } from '../../services/revenueCatService';
import { getAuthenticatedUserId } from '../../services/authUser';
import { openLegalUrl } from '../../services/apiBase';
import { useSubscription } from '../../context/SubscriptionContext';
import { TIER_PLANS, useStorePrices } from '../membership/planCatalog';
import { bumpDayRoutines, estimateSessionMinutes, planFirstWeek } from '../workout/services/dayRoutineService';
import { patchAthleteSettingsSnapshot, readAthleteSettingsSnapshot } from '../../utils/athleteSettingsSnapshot';
import { useConsultationStore } from './useConsultationStore';
import { profileOnboardingComplete } from '../../services/oauthDeepLink';
import { supabase } from '../../services/supabaseClient';
import { safeStorage } from '../../utils/safeStorage';
import {
  ConsultationProfile,
  Facility,
  GOAL_DISCIPLINE,
  Injury,
  MembershipTier,
  TrainingDay,
  WEEK,
  suggestedDays,
} from './consultationTypes';
import { INTAKE_GROUPS, INTAKE_PROMPTS, INTAKE_TITLES, IntakeGroup, TaxonomyOption, optionsIn, useClubTaxonomy } from './useClubTaxonomyStore';
import starfield from '../../assets/images/signin_starfield.jpg';

type Phase = 'checking' | 'questions' | 'preview' | 'plans';

const PLAN_ORDER: MembershipTier[] = ['pro', 'founders_pass', 'core', 'coach_pro', 'coach'];
const PERIOD_LABEL: Record<string, string> = { '/mo': 'per month', '/once': 'one time', '/forever': 'free forever' };
const DAY_NAMES: Record<TrainingDay, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
const PROTECTED_NAMES: Record<Exclude<Injury, 'none'>, string> = {
  knees: 'knees',
  lower_back: 'lower back',
  shoulders: 'shoulders',
  wrists: 'wrists',
};
const MIN_DAYS = 2;
const MAX_DAYS = 6;

const glass = 'bg-white/[0.05] backdrop-blur-md';
const glassActive = 'bg-white/[0.09] ring-1 ring-o1-crimson/70 backdrop-blur-md';
const primaryButton =
  'flex h-10 w-full shrink-0 items-center justify-center rounded-full bg-o1-crimson text-[13px] font-medium text-white transition hover:bg-o1-crimson-hover active:scale-[0.98] active:bg-o1-crimson-press disabled:opacity-40';

/** Steps that only make sense for some athletes. */
function stepApplies(group: IntakeGroup, profile: ConsultationProfile): boolean {
  if (group === 'discipline') return profile.goal === 'sport';
  if (group === 'competition') return profile.goal === 'sport' || profile.trainingAge === 'competitor';
  return true;
}

export function InductionProtocol() {
  const options = useClubTaxonomy();
  const profile = useConsultationStore((state) => state);
  const patch = useConsultationStore((state) => state.patch);
  const lockIn = useConsultationStore((state) => state.lockIn);
  const { activatePlan, restorePurchases } = useSubscription();
  const priceOf = useStorePrices();
  const groups = INTAKE_GROUPS.filter(
    (group) => stepApplies(group, profile) && (group === 'training_days' || group === 'competition' || optionsIn(options, group).length > 0),
  );
  const tiers = optionsIn(options, 'membership_tier').filter((tier) => tier.optionKey in TIER_PLANS);
  const [phase, setPhase] = useState<Phase>('checking');
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<'athlete' | 'coach'>('athlete');
  const [picked, setPicked] = useState<MembershipTier>('pro');
  const [busy, setBusy] = useState<'buy' | 'restore' | 'finish' | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [planStyle, setPlanStyle] = useState<'auto' | 'own'>(() => (readAthleteSettingsSnapshot().autoDispatch ? 'auto' : 'own'));

  useEffect(() => {
    let cancelled = false;
    void profileOnboardingComplete()
      .then((done) => (done ? useConsultationStore.getState().hydrate().catch(() => false) : false))
      .then((found) => {
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

  const multi = group === 'facility';
  const shownDays = profile.trainingDays.length > 0 ? profile.trainingDays : suggestedDays(profile.trainingAge, profile.ageBand);

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
      patch({ facilities: current.includes(key) ? current.filter((value) => value !== key) : [...current, key] });
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
    const next = shownDays.includes(day) ? shownDays.filter((value) => value !== day) : [...shownDays, day];
    const ordered = WEEK.filter((value) => next.includes(value));
    patch({ trainingDays: ordered, frequencyDays: ordered.length });
  };

  const continueStep = () => {
    tactileEngine.triggerSelectionBuzz();
    if (group === 'training_days') patch({ trainingDays: shownDays, frequencyDays: shownDays.length });
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
      if (error) console.warn('[Consultation] Could not save onboarding completion:', error.message);
    }
    safeStorage.setItem('o1fc_onboarding_completed', 'true');
    safeStorage.setItem('olfc_onboarding_completed', 'true');
  };

  const plan = TIER_PLANS[picked];
  const price = priceOf(plan.product);

  const buy = async () => {
    tactileEngine.triggerSelectionBuzz();
    setStoreError(null);
    if (plan.product.isFree) {
      await finish(picked);
      return;
    }
    setBusy('buy');
    const uid = await getAuthenticatedUserId();
    const res = uid ? await revenueCatService.purchasePackage(plan.product.productId, uid) : { success: false, error: 'Sign in to subscribe.' };
    if (!res.success) {
      setBusy(null);
      setStoreError(res.error || 'The store is unavailable right now.');
      return;
    }
    await activatePlan(plan.product.productId);
    await finish(picked);
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

  const backdrop = (
    <>
      <img src={starfield} alt="" className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-70" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/40" />
    </>
  );

  if (phase === 'checking') {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
        {backdrop}
        <Loader2 className="h-6 w-6 animate-spin text-o1-muted" />
      </div>
    );
  }

  const total = groups.length + (planStyle === 'auto' ? 2 : 1);
  const position = phase === 'questions' ? step + 1 : phase === 'preview' ? groups.length + 1 : total;
  const skip = () => {
    tactileEngine.triggerSelectionBuzz();
    if (phase === 'questions') advance();
    else if (phase === 'preview') setPhase('plans');
    else if (busy === null) void finish(audience === 'athlete' ? 'core' : 'coach');
  };
  const audienceTiers = tiers
    .filter((tier) => TIER_PLANS[tier.optionKey as MembershipTier].audience === audience)
    .sort((a, b) => PLAN_ORDER.indexOf(a.optionKey as MembershipTier) - PLAN_ORDER.indexOf(b.optionKey as MembershipTier));
  const dayCount = shownDays.length;
  const daysValid = dayCount >= MIN_DAYS && dayCount <= MAX_DAYS;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black text-o1-text">
      {backdrop}
      <header className="mx-auto w-full max-w-[480px] shrink-0 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex h-11 items-center justify-between">
          {(phase === 'questions' && step > 0) || phase !== 'questions' ? (
            <button type="button" onClick={back} aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-o1-text">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : (
            <span className="h-11 w-11" />
          )}
          <span className="text-[11px] font-normal tabular-nums text-o1-muted">
            {position} of {total}
          </span>
          <button type="button" onClick={skip} className="-mr-2 h-11 px-2 text-[13px] font-normal text-o1-muted">
            Skip
          </button>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span key={index} className={`h-[2px] flex-1 rounded-full transition-colors duration-300 ${index < position ? 'bg-o1-crimson' : 'bg-white/[0.1]'}`} />
          ))}
        </div>
      </header>

      {phase === 'questions' && group ? (
        <main key={group} className="mx-auto flex w-full max-w-[480px] min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-[10.5px] font-normal text-o1-muted">{INTAKE_TITLES[group]}</p>
          <h1 className="mt-1.5 text-[19px] font-light leading-tight tracking-[-0.01em]">{INTAKE_PROMPTS[group].title}</h1>
          <p className="mt-1.5 text-[12px] font-normal leading-snug text-o1-muted">{INTAKE_PROMPTS[group].subtitle}</p>

          {group === 'training_days' ? (
            <>
              <div className="mt-5 grid grid-cols-7 gap-1.5" role="group" aria-label={INTAKE_PROMPTS[group].title}>
                {WEEK.map((day) => {
                  const active = shownDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      role="checkbox"
                      aria-checked={active}
                      aria-label={DAY_NAMES[day]}
                      onClick={() => toggleDay(day)}
                      className={`flex h-8 w-full items-center justify-center rounded-full border text-[11px] font-normal transition-colors ${active ? 'border-o1-crimson bg-o1-crimson text-white' : 'border-white/[0.07] bg-o1-surface text-o1-muted'}`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
              <p className={`mt-3 text-[11px] font-normal ${daysValid ? 'text-o1-muted' : 'text-o1-gold'}`}>
                {daysValid
                  ? `${dayCount} training days, ${7 - dayCount} rest days`
                  : `Pick ${MIN_DAYS} to ${MAX_DAYS} days so you train and still recover.`}
              </p>
              <button type="button" disabled={!daysValid} onClick={continueStep} className={`mt-5 ${primaryButton}`}>
                Continue
              </button>
            </>
          ) : group === 'competition' ? (
            <>
              <label className={`mt-5 flex min-h-[46px] items-center gap-3 rounded-2xl px-4 ${glass}`}>
                <span className="flex-1 text-[13px] font-normal">Event date</span>
                <input
                  type="date"
                  min={todayIso()}
                  value={profile.competitionDate}
                  onChange={(event) => patch({ competitionDate: event.target.value })}
                  className="bg-transparent text-right text-[13px] font-normal text-o1-text outline-none [color-scheme:dark]"
                />
              </label>
              {profile.competitionDate ? (
                <p className="mt-3 text-[11px] font-normal text-o1-muted">{weeksUntilLabel(profile.competitionDate)}</p>
              ) : null}
              <button type="button" disabled={!profile.competitionDate} onClick={continueStep} className={`mt-5 ${primaryButton}`}>
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  patch({ competitionDate: '' });
                  continueStep();
                }}
                className="h-10 w-full text-[12px] font-normal text-o1-muted"
              >
                No date yet
              </button>
            </>
          ) : (
            <>
              <div className="mt-5 space-y-1.5" role={multi ? 'group' : 'radiogroup'} aria-label={INTAKE_PROMPTS[group].title}>
                {optionsIn(options, group).map((item) => {
                  const active = isActive(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role={multi ? 'checkbox' : 'radio'}
                      aria-checked={active}
                      onClick={() => choose(item)}
                      className={`flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-left transition active:scale-[0.99] ${active ? glassActive : glass}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-normal leading-tight">{item.label}</span>
                        {item.detail ? <span className="mt-0.5 block text-[10.5px] font-normal leading-snug text-o1-muted">{item.detail}</span> : null}
                      </span>
                      <Radio active={active} square={multi} />
                    </button>
                  );
                })}
              </div>
              {multi ? (
                <button
                  type="button"
                  disabled={profile.facilities.length === 0}
                  onClick={continueStep}
                  className={`mt-5 ${primaryButton}`}
                >
                  Continue
                </button>
              ) : null}
            </>
          )}
        </main>
      ) : null}

      {phase === 'preview' ? <WeekPreview profile={profile} onContinue={() => setPhase('plans')} /> : null}

      {phase === 'plans' ? (
        <>
          <main className="mx-auto w-full max-w-[480px] min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-6 animate-in fade-in duration-300">
            <h1 className="text-[19px] font-light leading-tight tracking-[-0.01em]">Choose your membership</h1>
            <p className="mt-1.5 text-[12px] font-normal leading-snug text-o1-muted">Your plan is ready. Pick how you want to train.</p>

            <div role="tablist" className="mt-4 grid grid-cols-2 rounded-full bg-white/[0.06] p-0.5 backdrop-blur-md">
              {(['athlete', 'coach'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={audience === key}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setAudience(key);
                    setPicked(key === 'athlete' ? 'pro' : 'coach_pro');
                    setStoreError(null);
                  }}
                  className={`h-8 rounded-full text-[12px] font-normal transition-colors ${audience === key ? 'bg-white/[0.1] text-o1-text' : 'text-o1-muted'}`}
                >
                  {key === 'athlete' ? 'Athlete' : 'Coach'}
                </button>
              ))}
            </div>

            <div className="mt-3 space-y-2" role="radiogroup" aria-label="Membership">
              {audienceTiers.map((tier) => {
                const key = tier.optionKey as MembershipTier;
                const copy = TIER_PLANS[key];
                const active = picked === key;
                const badge = key === 'pro' || key === 'coach_pro' ? 'Most popular' : key === 'founders_pass' ? 'Lifetime' : '';
                return (
                  <button
                    key={tier.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setPicked(key);
                      setStoreError(null);
                    }}
                    className={`w-full rounded-2xl px-4 py-3.5 text-left transition ${active ? glassActive : glass}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-normal">{tier.label}</span>
                          {badge ? <span className="rounded-full bg-o1-gold/10 px-1.5 py-px text-[10px] font-normal text-o1-gold">{badge}</span> : null}
                        </div>
                        <p className="mt-0.5 text-[10.5px] font-normal leading-snug text-o1-muted">{copy.headline}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-right">
                          <span className="block text-[16px] font-light leading-none tabular-nums">{copy.product.isFree ? 'Free' : priceOf(copy.product)}</span>
                          {!copy.product.isFree ? <span className="mt-1 block text-[10px] font-normal text-o1-muted">{PERIOD_LABEL[copy.product.periodText || ''] || ''}</span> : null}
                        </span>
                        <Radio active={active} />
                      </div>
                    </div>
                    {active ? (
                      <ul className="mt-3 space-y-1.5 animate-in fade-in duration-200">
                        {copy.highlights.map((line) => (
                          <li key={line} className="flex items-start gap-2 text-[11px] font-normal leading-snug">
                            <Check className="mt-0.5 h-3 w-3 shrink-0 text-o1-crimson" strokeWidth={2.25} />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </main>

          <footer className="mx-auto w-full max-w-[480px] shrink-0 bg-gradient-to-t from-black via-black/90 to-black/0 px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
            {storeError ? (
              <div role="alert" className="mb-2 flex items-start gap-2.5 rounded-xl bg-o1-bad-wash/60 px-3.5 py-2.5 text-[11px] font-normal leading-snug text-o1-bad-ink backdrop-blur-md">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{storeError}</span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void buy()}
              disabled={busy !== null}
              className="flex h-10 w-full items-center justify-center rounded-full bg-o1-crimson text-[13px] font-medium text-white transition hover:bg-o1-crimson-hover active:scale-[0.98] active:bg-o1-crimson-press disabled:opacity-60"
            >
              {busy === 'buy' || busy === 'finish' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : plan.product.isFree ? (
                `Start with ${picked === 'coach' ? 'Coach Starter' : 'Core'}`
              ) : plan.renews ? (
                `Subscribe · ${price} per month`
              ) : (
                `Buy once · ${price}`
              )}
            </button>
            {!plan.product.isFree ? (
              <button
                type="button"
                onClick={() => void finish(audience === 'athlete' ? 'core' : 'coach')}
                disabled={busy !== null}
                className="h-9 w-full text-[12px] font-normal text-o1-muted"
              >
                Not now, start free
              </button>
            ) : null}
            <p className="mt-1 text-center text-[10px] font-normal leading-snug text-o1-muted/70">
              {plan.renews
                ? `Renews monthly at ${price} until cancelled. Cancel at least 24 hours before renewal in your App Store or Google Play settings.`
                : plan.product.isFree
                  ? 'No payment needed. Upgrade any time from Settings.'
                  : 'One payment through the App Store or Google Play. It never renews.'}
            </p>
            <div className="flex items-center justify-center gap-5 text-[10.5px] font-normal text-o1-muted">
              <button type="button" onClick={() => void restore()} disabled={busy !== null} className="h-8">
                {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
              </button>
              <button type="button" onClick={() => void openLegalUrl('terms')} className="h-9">
                Terms
              </button>
              <button type="button" onClick={() => void openLegalUrl('privacy')} className="h-9">
                Privacy
              </button>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}

/** The real first week the answers produce, so the athlete sees what they are signing up for. */
function WeekPreview({ profile, onContinue }: { profile: ConsultationProfile; onContinue: () => void }) {
  const week = planFirstWeek();
  const trainingDays = week.filter((day) => day.exercises.length > 0);
  const [open, setOpen] = useState<TrainingDay | null>(trainingDays[0]?.day ?? null);
  const minutes = trainingDays.map((day) => estimateSessionMinutes(day.exercises));
  const average = minutes.length > 0 ? Math.round(minutes.reduce((sum, value) => sum + value, 0) / minutes.length) : 0;
  const notes = previewNotes(profile);

  return (
    <>
      <main className="mx-auto w-full max-w-[480px] min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <p className="text-[10.5px] font-normal text-o1-muted">Your plan</p>
        <h1 className="mt-1.5 text-[19px] font-light leading-tight tracking-[-0.01em]">Here is your first week</h1>
        <p className="mt-1.5 text-[12px] font-normal leading-snug text-o1-muted">
          {trainingDays.length} {trainingDays.length === 1 ? 'workout' : 'workouts'}
          {average > 0 ? `, about ${average} minutes each` : ''}. Weights adjust as you log.
        </p>

        {notes.length > 0 ? (
          <ul className="mt-4 space-y-1.5">
            {notes.map((note) => (
              <li key={note} className="flex items-start gap-2 text-[11px] font-normal leading-snug">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-o1-crimson" strokeWidth={2.25} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 space-y-1.5">
          {week.map(({ day, splitName, exercises }) => {
            if (exercises.length === 0) {
              return (
                <div key={day} className="flex h-10 items-center justify-between rounded-2xl px-4 text-[12px] font-normal text-o1-muted">
                  <span>{DAY_NAMES[day]}</span>
                  <span>Rest</span>
                </div>
              );
            }
            const expanded = open === day;
            const muscles = [...new Set(exercises.map((ex) => ex.targetMuscle).filter(Boolean))].slice(0, 3).join(', ');
            return (
              <div key={day} className={`rounded-2xl ${expanded ? glassActive : glass}`}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setOpen(expanded ? null : day);
                  }}
                  className="flex min-h-[46px] w-full items-center gap-3 px-4 py-2.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-normal leading-tight">
                      {DAY_NAMES[day]} <span className="text-o1-muted">· {splitName}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] font-normal text-o1-muted">
                      {exercises.length} exercises · about {estimateSessionMinutes(exercises)} min{muscles ? ` · ${muscles}` : ''}
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-o1-muted transition-transform ${expanded ? 'rotate-180' : ''}`} strokeWidth={1.75} />
                </button>
                {expanded ? (
                  <ol className="space-y-1 px-4 pb-3 animate-in fade-in duration-200">
                    {exercises.map((ex) => (
                      <li key={ex.id} className="flex items-baseline justify-between gap-3 text-[11.5px] font-normal">
                        <span className="min-w-0 truncate">{ex.name}</span>
                        <span className="shrink-0 tabular-nums text-o1-muted">
                          {(ex.sets[0]?.reps ?? 0) > 1 ? `${ex.sets.length} × ${ex.sets[0].reps}` : `${ex.sets.length} rounds`}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            );
          })}
        </div>
      </main>
      <footer className="mx-auto w-full max-w-[480px] shrink-0 bg-gradient-to-t from-black via-black/90 to-black/0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onContinue();
          }}
          className={primaryButton}
        >
          Looks good
        </button>
      </footer>
    </>
  );
}

function previewNotes(profile: ConsultationProfile): string[] {
  const notes: string[] = [];
  const places = profile.facilities.length;
  if (places > 0) notes.push(`Only equipment you have where you train${places > 1 ? ` across ${places} places` : ''}.`);
  const protectedAreas = profile.injuries.filter((injury): injury is Exclude<Injury, 'none'> => injury !== 'none').map((injury) => PROTECTED_NAMES[injury]);
  if (protectedAreas.length > 0) notes.push(`Moves that load your ${joinWords(protectedAreas)} are swapped out.`);
  if (profile.ageBand === '60+') notes.push('No jumping or high-impact moves, and every set stops short of your limit.');
  if (profile.ageBand === 'under18') notes.push('Every set stops short of your limit while you build good technique.');
  if (profile.trainingAge === 'new' || profile.trainingAge === '<1yr') notes.push('Fewer sets and lighter weights while you learn the moves.');
  if (profile.competitionDate) notes.push(`${weeksUntilLabel(profile.competitionDate)} Training builds toward it.`);
  return notes;
}

function joinWords(words: string[]): string {
  return words.length <= 1 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function weeksUntilLabel(isoDate: string): string {
  const days = Math.round((new Date(`${isoDate}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / 86400000);
  if (!Number.isFinite(days) || days < 0) return 'That date has passed.';
  if (days < 7) return days === 0 ? 'Your event is today.' : `${days} ${days === 1 ? 'day' : 'days'} to your event.`;
  const weeks = Math.floor(days / 7);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} to your event.`;
}

function Radio({ active, square = false }: { active: boolean; square?: boolean }) {
  return (
    <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center transition-colors ${square ? 'rounded-[5px]' : 'rounded-full'} ${active ? 'bg-o1-crimson' : 'ring-1 ring-inset ring-white/25'}`}>
      {active ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}
    </span>
  );
}

function answerPatch(group: IntakeGroup, optionKey: string, profile: ConsultationProfile): Partial<ConsultationProfile> {
  if (group === 'age_band') return { ageBand: optionKey as ConsultationProfile['ageBand'] };
  if (group === 'goal') {
    const goal = optionKey as ConsultationProfile['goal'];
    if (goal === 'sport' || !goal) return { goal };
    return { goal, primaryDiscipline: GOAL_DISCIPLINE[goal], competitionDate: profile.trainingAge === 'competitor' ? profile.competitionDate : '' };
  }
  if (group === 'discipline') return { primaryDiscipline: optionKey as ConsultationProfile['primaryDiscipline'] };
  if (group === 'training_age') return { trainingAge: optionKey as ConsultationProfile['trainingAge'] };
  if (group === 'session_length') {
    const minutes = Number(optionKey);
    return Number.isFinite(minutes) ? { sessionMinutes: minutes } : {};
  }
  return {};
}

function selectedKey(group: IntakeGroup, profile: ConsultationProfile): string {
  if (group === 'age_band') return profile.ageBand;
  if (group === 'goal') return profile.goal;
  if (group === 'discipline') return profile.primaryDiscipline;
  if (group === 'training_age') return profile.trainingAge;
  if (group === 'session_length') return profile.sessionMinutes ? String(profile.sessionMinutes) : '';
  return '';
}
