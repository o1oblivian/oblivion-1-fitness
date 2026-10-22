import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BellRing, Check, Minus, Plus } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import {
  readReminderConfig,
  reminderPermission,
  saveReminderConfig,
} from '../../services/athleteReminderScheduler';
import { readAthleteSettingsSnapshot } from '../../utils/athleteSettingsSnapshot';
import { sanitizeNumericInput } from '../../utils/numberInputUtils';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../utils/weightUnits';
import { useUserStore } from '../../stores/useUserStore';
import { toDayKey } from '../report/reportEngine';
import { useWeighIns } from './weighInStore';
import { WeightSparkline } from './WeightSparkline';
import {
  goalProgress,
  trendChangeKg,
  trendSeries,
  weeklyRateKg,
  type PaceVerdict,
} from './weightTrend';

const STEP = 0.1;
const MIN_KG = 20;
const MAX_KG = 500;

interface WeightCardProps {
  /** Saves a weigh-in everywhere the app keeps bodyweight. */
  onSaveWeight: (kg: number) => void;
  onToast: (message: string) => void;
  /** Opens the screen where a goal weight is set. */
  onSetGoal: () => void;
}

const VERDICT_COPY: Record<PaceVerdict, { text: string; tone: string }> = {
  steady: { text: 'At your goal', tone: 'text-o1-olive' },
  'on-track': { text: 'On track', tone: 'text-o1-olive' },
  'too-fast': { text: 'Faster than is easy to keep up', tone: 'text-o1-caution' },
  'too-slow': { text: 'Barely moving', tone: 'text-o1-muted' },
  'wrong-way': { text: 'Moving away from your goal', tone: 'text-o1-caution' },
};

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

/** Weight at a glance: today's number, the smoothed trend, the goal, and a one-tap way to log. */
export const WeightCard: React.FC<WeightCardProps> = ({ onSaveWeight, onToast, onSetGoal }) => {
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
  const todayKey = toDayKey(Date.now());
  const loggedToday = latest?.day === todayKey;
  const currentKg = latest ? latest.trendKg : profileKg;
  const rate = useMemo(() => weeklyRateKg(series), [series]);
  const weekChange = useMemo(() => trendChangeKg(series, 7), [series]);
  const goal = goalProgress(currentKg, goalKg, rate);

  const startKg = latest ? latest.kg : profileKg;
  const [draft, setDraft] = useState('');
  useEffect(() => {
    setDraft(startKg > 0 ? String(show(startKg)) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show() only depends on unit
  }, [startKg, unit]);

  const [reminderOn, setReminderOn] = useState(() => readReminderConfig().weighInOn);

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

  const toggleReminder = async () => {
    tactileEngine.triggerSelectionBuzz();
    const config = readReminderConfig();
    if (reminderOn) {
      saveReminderConfig({ ...config, weighInOn: false });
      setReminderOn(false);
      onToast('Weigh-in reminder off.');
      return;
    }
    saveReminderConfig({ ...config, weighInOn: true });
    setReminderOn(true);
    if (!readAthleteSettingsSnapshot().osPushEnabled) {
      onToast('Saved. Turn on reminders in Settings to get it on your lock screen.');
      return;
    }
    const permission = await reminderPermission(true);
    onToast(
      permission === 'granted'
        ? `Reminder set · every morning at ${config.weighInTime}`
        : "Notifications are blocked for this app. Turn them on in your phone's settings.",
    );
  };

  const description = latest
    ? `Weight trend ${show(latest.trendKg)} ${unitLabel}${
        weekChange != null ? `, ${delta(weekChange)} over 7 days` : ''
      }`
    : 'No weigh-ins yet';

  return (
    <section
      aria-label="Weight"
      className="rounded-3xl border border-white/[0.07] bg-o1-surface p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-o1-body font-semibold text-o1-text">Weight</h2>
          <p
            className={`flex items-center gap-1 text-o1-label ${
              loggedToday ? 'text-o1-olive' : 'text-o1-muted'
            }`}
          >
            {loggedToday ? <Check className="h-3 w-3" aria-hidden /> : null}
            {loggedToday ? 'Logged today' : 'Not logged today'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggleReminder()}
          aria-pressed={reminderOn}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-o1-label cursor-pointer ${
            reminderOn
              ? 'border-o1-crimson/40 bg-o1-crimson/10 text-o1-text'
              : 'border-white/[0.08] text-o1-muted'
          }`}
        >
          {reminderOn ? (
            <BellRing className="h-3.5 w-3.5 text-o1-crimson" aria-hidden />
          ) : (
            <Bell className="h-3.5 w-3.5" aria-hidden />
          )}
          {reminderOn ? 'Reminder on' : 'Remind me'}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-o1-display font-bold tabular-nums leading-none text-o1-text">
              {currentKg > 0 ? show(currentKg) : '--'}
            </span>
            <span className="text-o1-caption text-o1-muted">{unitLabel}</span>
          </div>
          <p className="pt-1 text-o1-label text-o1-muted">
            {series.length === 0
              ? 'Log your first weigh-in'
              : weekChange == null
                ? 'Trend · needs a few days'
                : `${delta(weekChange)} ${unitLabel} in 7 days`}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <WeightSparkline
            series={series}
            goalKg={goalKg > 0 ? goalKg : null}
            description={description}
          />
        </div>
      </div>

      {goal ? (
        <p className="text-o1-caption text-o1-muted">
          {goal.reached ? (
            <span className="text-o1-olive">
              You are at your goal of {show(goalKg)} {unitLabel}.
            </span>
          ) : (
            <>
              <span className="tabular-nums text-o1-text">
                {show(Math.abs(goal.remainingKg))} {unitLabel}
              </span>{' '}
              to {goal.remainingKg < 0 ? 'lose' : 'gain'} to reach {show(goalKg)} {unitLabel}
              {rate != null ? (
                <>
                  {' · '}
                  <span className="tabular-nums">
                    {delta(rate)} {unitLabel}/wk
                  </span>
                  {goal.etaWeeks != null ? ` · about ${goal.etaWeeks} wk` : ''}
                </>
              ) : null}
              {goal.verdict ? (
                <span className={`block pt-0.5 ${VERDICT_COPY[goal.verdict].tone}`}>
                  {VERDICT_COPY[goal.verdict].text}
                </span>
              ) : null}
            </>
          )}
        </p>
      ) : (
        <button
          type="button"
          onClick={onSetGoal}
          className="min-h-[44px] text-left text-o1-caption text-o1-crimson cursor-pointer"
        >
          Set a goal weight to see your progress
        </button>
      )}

      <div className="flex items-center gap-2">
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
    </section>
  );
};
