import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../utils/athleteSettingsSnapshot';
import { sanitizeNumericInput } from '../../utils/numberInputUtils';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../utils/weightUnits';
import { useUserStore } from '../../stores/useUserStore';
import { toDayKey } from '../report/reportEngine';
import { useWeighIns } from './weighInStore';
import { WeightSparkline } from './WeightSparkline';
import { trendChangeKg, trendSeries } from './weightTrend';

const STEP = 0.1;
const MIN_KG = 20;
const MAX_KG = 500;

interface WeightCardProps {
  /** Saves a weigh-in everywhere the app keeps bodyweight. */
  onSaveWeight: (kg: number) => void;
  onToast: (message: string) => void;
  /** Opens the screen where a goal weight is set. */
  onSetGoal: () => void;
  /** Sits at the foot of the card, e.g. the daily calorie line. */
  footer?: React.ReactNode;
  /** Drawn inside the Fuel dashboard instead of as its own card. */
  embedded?: boolean;
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

/** Weight at a glance: the smoothed trend, the goal, and a one-tap way to log. Two rows tall. */
export const WeightCard: React.FC<WeightCardProps> = ({
  onSaveWeight,
  onToast,
  onSetGoal,
  footer,
  embedded = false,
}) => {
  const entries = useWeighIns();
  const profileKg = useUserStore((s) => s.weightKg);
  const goalKg = useUserStore((s) => s.targetWeightKg);
  const unit = readAthleteSettingsSnapshot().weightUnit;
  const unitLabel = loadUnitLabel(unit).toLowerCase();
  const show = (kg: number) => kgToDisplay(kg, unit);
  /** A change in kg as the athlete's unit, with its sign: +0.4 or -0.4. */
  const delta = (kg: number) => signed(Math.round(show(Math.abs(kg)) * Math.sign(kg) * 10) / 10);

  const series = useMemo(() => trendSeries(entries), [entries]);
  const latest = series[series.length - 1];
  const loggedToday = latest?.day === toDayKey(Date.now());
  const currentKg = latest ? latest.trendKg : profileKg;
  const weekChange = useMemo(() => trendChangeKg(series, 7), [series]);

  const startKg = latest ? latest.kg : profileKg;
  const [draft, setDraft] = useState('');
  useEffect(() => {
    setDraft(startKg > 0 ? String(show(startKg)) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show() only depends on unit
  }, [startKg, unit]);

  const nudge = (direction: 1 | -1) => {
    tactileEngine.triggerSelectionBuzz();
    const base = Number(draft) || (startKg > 0 ? show(startKg) : 0);
    const next = Math.max(0, Math.round((base + direction * STEP) * 10) / 10);
    setDraft(String(next));
  };

  const log = () => {
    const kg = displayToKg(Number(draft), unit);
    if (!(kg >= MIN_KG && kg <= MAX_KG)) {
      onToast('Enter your weight first.');
      return;
    }
    tactileEngine.triggerSelectionBuzz();
    onSaveWeight(kg);
    onToast(`Weigh-in saved · ${show(kg)} ${unitLabel}`);
  };

  const description = latest
    ? `Weight trend ${show(latest.trendKg)} ${unitLabel}${
        weekChange != null ? `, ${delta(weekChange)} over 7 days` : ''
      }`
    : 'No weigh-ins yet';

  let caption = `${delta(weekChange ?? 0)} ${unitLabel} in 7 days`;
  if (latest == null) caption = 'Log your first weigh-in';
  else if (weekChange == null) caption = 'Trend builds as you weigh in';

  return (
    <section
      aria-label="Weight"
      className={
        embedded
          ? 'mt-3 border-t border-white/[0.08] pt-3'
          : 'rounded-2xl border border-white/[0.07] bg-o1-surface px-3 pt-2.5 pb-3'
      }
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-o1-heading font-bold tabular-nums leading-none text-o1-text">
              {currentKg > 0 ? show(currentKg) : '--'}
            </span>
            <span className="text-o1-caption text-o1-muted">{unitLabel}</span>
          </div>
          <p className="pt-1 text-o1-label text-o1-muted">{caption}</p>
        </div>
        <div className="min-w-0 flex-1">
          <WeightSparkline
            series={series}
            goalKg={goalKg > 0 ? goalKg : null}
            description={description}
          />
        </div>
        {goalKg > 0 ? (
          <div className="shrink-0 text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-o1-heading font-bold tabular-nums leading-none text-o1-text">
                {show(goalKg)}
              </span>
              <span className="text-o1-caption text-o1-muted">{unitLabel}</span>
            </div>
            <p className="pt-1 text-o1-label text-o1-muted">Goal</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSetGoal}
            className="shrink-0 text-o1-label text-o1-crimson cursor-pointer"
          >
            Set goal
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1.5">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label={`Lower by ${STEP} ${unitLabel}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-o1-well text-o1-text cursor-pointer active:bg-o1-sheet"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Weight in {unitLabel}</span>
          <input
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(sanitizeNumericInput(e.target.value.replace(/[^0-9.]/g, '')))}
            placeholder="--"
            className="h-11 w-full rounded-2xl border border-white/[0.08] bg-o1-well px-3 pr-10 text-center text-o1-control font-semibold tabular-nums text-o1-text focus:border-o1-crimson focus:outline-none"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-o1-caption text-o1-muted">
            {unitLabel}
          </span>
        </label>
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label={`Raise by ${STEP} ${unitLabel}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-o1-well text-o1-text cursor-pointer active:bg-o1-sheet"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={log}
          className="h-11 shrink-0 rounded-2xl bg-o1-crimson px-4 text-o1-body font-semibold text-o1-text cursor-pointer active:bg-o1-crimson-press"
        >
          {loggedToday ? 'Update' : 'Log'}
        </button>
      </div>
      {footer}
    </section>
  );
};
