import React, { useState } from 'react';
import { tactileEngine } from '../../services/tactileEngine';
import { useConsultationStore } from './useConsultationStore';
import { MembershipTier } from './consultationTypes';
import { INTAKE_GROUPS, INTAKE_TITLES, optionsIn, useClubTaxonomy } from './useClubTaxonomyStore';

export function InductionProtocol() {
  const options = useClubTaxonomy();
  const profile = useConsultationStore((state) => state);
  const patch = useConsultationStore((state) => state.patch);
  const lockIn = useConsultationStore((state) => state.lockIn);
  const groups = INTAKE_GROUPS.filter((group) => optionsIn(options, group).length > 0);
  const tiers = optionsIn(options, 'membership_tier');
  const [step, setStep] = useState(0);
  const [locking, setLocking] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [picked, setPicked] = useState<MembershipTier>('core');
  const group = groups[step];
  const choices = group ? optionsIn(options, group) : [];
  const selected = group ? selectedKey(group, profile) : '';
  const preview = group === 'discipline' ? choices.find((item) => item.optionKey === selected)?.detail || '' : '';

  const apply = (optionKey: string) => {
    if (!group) return;
    if (group === 'discipline') patch({ primaryDiscipline: optionKey as typeof profile.primaryDiscipline });
    if (group === 'training_age') patch({ trainingAge: optionKey as typeof profile.trainingAge });
    if (group === 'coaching_intent') patch({ coachingIntent: optionKey as typeof profile.coachingIntent });
    if (group === 'coaching_style') patch({ coachingStyle: optionKey as typeof profile.coachingStyle });
    if (group === 'facility') patch({ facility: optionKey as typeof profile.facility });
    if (group === 'frequency') {
      const days = Number(optionKey);
      if (Number.isFinite(days)) patch({ frequencyDays: days });
    }
  };

  const finish = async (tier: MembershipTier) => {
    setLocking(true);
    setTierOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await lockIn(tier);
  };

  const next = () => {
    tactileEngine.triggerSelectionBuzz();
    if (step >= groups.length - 1) {
      setStep(groups.length);
      setLocking(true);
      window.setTimeout(() => {
        setLocking(false);
        setTierOpen(true);
      }, 1500);
      return;
    }
    setStep((value) => value + 1);
  };

  const total = Math.max(groups.length + 1, 1);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-[#EAE8DF]">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#1F1F1F]">
          <div className="h-full bg-[#EAE8DF]" style={{ width: `${((Math.min(step, groups.length) + 1) / total) * 100}%` }} />
        </div>
        <button type="button" onClick={next} className="ml-3 h-[44px] rounded-full border border-[#1F1F1F] bg-[#0E0E0E] px-4 text-[13px] font-semibold text-[#EAE8DF] active:scale-[0.98]">
          Skip
        </button>
      </div>

      {group ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <h1 className="text-[22px] font-semibold">{INTAKE_TITLES[group]}</h1>
          {preview ? <p className="mt-1 text-[13px] text-[#8A887F]">{preview}</p> : null}
          <div className="mt-4 space-y-2">
            {choices.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  apply(item.optionKey);
                  if (group !== 'discipline') next();
                }}
                className={`h-[52px] w-full rounded-2xl border px-4 text-left text-[15px] font-semibold active:scale-[0.98] ${selected === item.optionKey ? 'border-white bg-white text-neutral-950' : 'border-[#1F1F1F] bg-[#0E0E0E] text-[#EAE8DF]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {group === 'discipline' ? (
            <button type="button" onClick={next} className="mt-4 h-[48px] w-full rounded-full bg-[#C4121A] text-[14px] font-semibold text-white active:scale-[0.98]">
              Continue
            </button>
          ) : null}
        </div>
      ) : null}

      {step >= groups.length && locking ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[13px] tracking-wide text-[#8A887F]">ATHLETE PROFILE LOCKED</p>
          <p className="mt-2 text-[13px] tracking-wide text-[#EAE8DF]">PROTOCOL CALIBRATED</p>
        </div>
      ) : null}

      {tierOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-black/80 backdrop-blur-sm" onClick={() => setTierOpen(false)}>
          <div className="w-full rounded-t-3xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 pb-8" onClick={(event) => event.stopPropagation()}>
            <p className="text-[15px] font-semibold">Membership</p>
            <div className="mt-3 space-y-2">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => { tactileEngine.triggerSelectionBuzz(); setPicked(tier.optionKey as MembershipTier); }}
                  className={`min-h-[44px] w-full rounded-2xl border p-3 text-left active:scale-[0.98] ${picked === tier.optionKey ? 'border-white bg-white text-neutral-950' : 'border-[#1F1F1F] bg-black text-[#EAE8DF]'}`}
                >
                  <span className="block text-[14px] font-semibold">{tier.label}</span>
                  {tier.detail ? <span className={`mt-1 block text-[12px] ${picked === tier.optionKey ? 'text-neutral-600' : 'text-[#8A887F]'}`}>{tier.detail}</span> : null}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => void finish(picked)} className="mt-4 h-[48px] w-full rounded-full bg-[#C4121A] text-[14px] font-semibold text-white active:scale-[0.98]">
              Enter The Floor
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function selectedKey(group: (typeof INTAKE_GROUPS)[number], profile: { primaryDiscipline: string; trainingAge: string; coachingIntent: string; coachingStyle: string; facility: string; frequencyDays: number }): string {
  if (group === 'discipline') return profile.primaryDiscipline;
  if (group === 'training_age') return profile.trainingAge;
  if (group === 'coaching_intent') return profile.coachingIntent;
  if (group === 'coaching_style') return profile.coachingStyle;
  if (group === 'facility') return profile.facility;
  return profile.frequencyDays ? String(profile.frequencyDays) : '';
}
