import React, { useMemo, useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import type { BiologicalSex } from '../fuel/store/useFuelStore';
import {
  dailyBurn,
  macroGrams,
  planForPace,
  restingBurn,
  sensiblePaces,
  type MacroGrams,
} from '../fuel/utils/energyMath';
import type { WeightUnit } from '../../hooks/useAthleteSettings';

const LB_PER_KG = 2.2046226218;
const DEFAULT_PACE = 0.5;

interface EnergyPanelProps {
  weightKg: number | null;
  /** Zero when no goal weight is set. */
  goalKg: number;
  heightCm: number | null;
  ageYears: number | null;
  sex: BiologicalSex | null;
  /** The daily calorie target saved in Fuel. */
  calorieTarget: number | null;
  unit: WeightUnit;
  onApply: (kcal: number, macros: MacroGrams) => void;
  /** Opens the full Energy Engine for body details, activity and diet style. */
  onEditDetails: () => void;
}

const num = (n: number) => Math.round(n).toLocaleString();

const formatPace = (kgPerWeek: number, unit: WeightUnit) =>
  unit === 'lbs' ? (kgPerWeek * LB_PER_KG).toFixed(1) : String(kgPerWeek);

const dateIn = (weeks: number) =>
  new Date(Date.now() + weeks * 7 * 86_400_000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

/**
 * One line that says how many calories to eat, opening to the burn, the gap and a pace picker.
 * It reuses the Energy Engine's maths, so the two can never disagree.
 */
export const EnergyPanel: React.FC<EnergyPanelProps> = ({
  weightKg,
  goalKg,
  heightCm,
  ageYears,
  sex,
  calorieTarget,
  unit,
  onApply,
  onEditDetails,
}) => {
  const [open, setOpen] = useState(false);
  const [pace, setPace] = useState<number>(DEFAULT_PACE);

  const bmr = restingBurn(weightKg, heightCm, ageYears, sex);
  const burn = bmr == null ? null : dailyBurn(bmr);
  const paces = useMemo(() => (weightKg ? sensiblePaces(weightKg) : []), [weightKg]);
  const chosenPace = paces.includes(pace) ? pace : (paces[paces.length > 1 ? 1 : 0] ?? pace);
  const plan = burn != null && weightKg ? planForPace(burn, weightKg, goalKg, chosenPace) : null;
  const unitLabel = unit === 'lbs' ? 'lb' : 'kg';

  if (burn == null) {
    return (
      <button
        type="button"
        onClick={onEditDetails}
        className="mt-2 flex min-h-[44px] w-full items-center gap-2 border-t border-white/[0.06] pt-2 text-left cursor-pointer"
      >
        <Zap className="h-4 w-4 shrink-0 text-o1-yellow" aria-hidden />
        <span className="text-o1-caption text-o1-text">Set up your daily calories</span>
        <span className="ml-auto text-o1-label text-o1-muted">Height, age, sex</span>
      </button>
    );
  }

  const shown = calorieTarget && calorieTarget > 0 ? calorieTarget : (plan?.kcal ?? burn);
  const alreadyApplied = plan != null && calorieTarget === plan.kcal;

  const apply = () => {
    if (!plan || !weightKg) return;
    tactileEngine.playPRCelebration();
    onApply(plan.kcal, macroGrams(weightKg, plan.kcal));
  };

  return (
    <div className="mt-2 border-t border-white/[0.06]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setOpen((v) => !v);
        }}
        className="flex min-h-[44px] w-full items-center gap-2 text-left cursor-pointer"
      >
        <Zap className="h-4 w-4 shrink-0 text-o1-yellow" aria-hidden />
        <span className="text-o1-body font-semibold tabular-nums text-o1-text">
          {num(shown)} kcal/day
        </span>
        <span className="text-o1-caption text-o1-muted">
          {calorieTarget && calorieTarget > 0 ? 'your target' : 'to maintain'}
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-o1-muted transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-3 pb-1">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-o1-well px-2 py-2">
              <dt className="text-o1-label text-o1-muted">You burn</dt>
              <dd className="text-o1-body font-semibold tabular-nums text-o1-text">{num(burn)}</dd>
            </div>
            <div className="rounded-xl bg-o1-well px-2 py-2">
              <dt className="text-o1-label text-o1-muted">Eat</dt>
              <dd className="text-o1-body font-semibold tabular-nums text-o1-yellow">
                {num(plan?.kcal ?? shown)}
              </dd>
            </div>
            <div className="rounded-xl bg-o1-well px-2 py-2">
              <dt className="text-o1-label text-o1-muted">
                {plan && goalKg > (weightKg ?? 0) ? 'Surplus' : 'Deficit'}
              </dt>
              <dd className="text-o1-body font-semibold tabular-nums text-o1-text">
                {plan ? num(plan.gapKcal) : '--'}
              </dd>
            </div>
          </dl>

          {plan ? (
            <>
              <div role="radiogroup" aria-label="Pace" className="flex flex-wrap gap-2">
                {paces.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={p === chosenPace}
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setPace(p);
                    }}
                    className={`min-h-[44px] rounded-full border px-3.5 text-o1-caption tabular-nums cursor-pointer active:scale-95 transition ${
                      p === chosenPace
                        ? 'border-o1-yellow bg-o1-yellow/10 text-o1-yellow'
                        : 'border-white/[0.08] text-o1-text'
                    }`}
                  >
                    {formatPace(p, unit)} {unitLabel}/wk
                  </button>
                ))}
              </div>
              <p className="text-o1-caption text-o1-muted">
                About {plan.weeks} {plan.weeks === 1 ? 'week' : 'weeks'} to your goal, around{' '}
                {dateIn(plan.weeks)}.
                {plan.atFloor
                  ? ' Held at the calorie floor so this pace is not fully reached.'
                  : ''}
              </p>
              <button
                type="button"
                onClick={apply}
                disabled={alreadyApplied}
                className="h-11 w-full rounded-2xl bg-o1-yellow text-o1-body font-semibold text-black cursor-pointer disabled:cursor-default disabled:opacity-50 active:scale-[0.99]"
              >
                {alreadyApplied ? 'This is your target' : `Eat ${num(plan.kcal)} kcal a day`}
              </button>
            </>
          ) : (
            <p className="text-o1-caption text-o1-muted">
              Set a goal weight to choose a pace and see when you get there.
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-o1-label text-o1-muted">Burn assumes moderate activity.</p>
            <button
              type="button"
              onClick={onEditDetails}
              className="min-h-[44px] text-o1-caption text-o1-crimson cursor-pointer"
            >
              Edit details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
