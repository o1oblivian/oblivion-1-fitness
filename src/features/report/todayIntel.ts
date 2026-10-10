import { classifyExercise, MUSCLE_BY_ID } from './muscleModel';
import { acwrScore, dayIndex, toDayKey } from './reportEngine';
import type { Tone } from './palette';
import type { LiftTrend, LoggedSet, MuscleId, OblivionReport, SleepSample, VolumeStatus } from './types';

export type Decision = 'PUSH' | 'MAINTAIN' | 'EASE OFF' | 'DELOAD' | 'NO SIGNAL';

export interface ReadinessSignal {
  id: 'sleep' | 'load' | 'rest';
  label: string;
  value: number | null;
  display: string;
  note: string;
  tone: Tone;
}

export interface MuscleReadiness {
  id: MuscleId;
  label: string;
  daysAgo: number | null;
  state: 'recovering' | 'ready' | 'cold';
  sets: number;
  status: VolumeStatus;
}

export interface LiftPrescription {
  name: string;
  lastWeightKg: number;
  lastReps: number;
  lastDay: string;
  e1rm: number;
  trend: LiftTrend;
  targetWeightKg: number;
  targetReps: number;
  rpeCap: number;
  rationale: string;
}

export interface TodayIntel {
  readiness: number | null;
  decision: Decision;
  headline: string;
  detail: string;
  signals: ReadinessSignal[];
  muscles: MuscleReadiness[];
  prescriptions: LiftPrescription[];
  daysSinceSession: number | null;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const toStep = (kg: number, step = 1.25) => Math.round((Math.round(kg / step) * step) * 100) / 100;

const RPE_CAP: Record<Decision, number> = { PUSH: 9, MAINTAIN: 8.5, 'EASE OFF': 7.5, DELOAD: 7, 'NO SIGNAL': 8.5 };

function prescribe(
  lift: OblivionReport['lifts'][number],
  decision: Decision,
): LiftPrescription {
  const last = lift.lastWeightKg;
  let weight = last;
  let reps = lift.lastReps;
  let rationale = 'Repeat the last top set.';

  if (decision === 'PUSH') {
    if (lift.trend === 'plateau') {
      reps = Math.min(12, lift.lastReps + 1);
      rationale = 'Plateau: add a rep before adding load.';
    } else if (lift.trend === 'declining') {
      rationale = 'Trending down: rebuild at the same load.';
    } else {
      weight = toStep(last * 1.025);
      if (weight <= last) weight = toStep(last + 1.25);
      rationale = '+2.5% on the last top set.';
    }
  } else if (decision === 'EASE OFF') {
    weight = toStep(last * 0.9);
    rationale = '-10% while readiness is low.';
  } else if (decision === 'DELOAD') {
    weight = toStep(last * 0.85);
    rationale = '-15% deload week.';
  } else if (decision === 'MAINTAIN') {
    rationale = 'Hold load, aim for cleaner reps.';
  } else {
    rationale = 'No readiness signal logged. Repeat the last top set.';
  }

  return {
    name: lift.name,
    lastWeightKg: last,
    lastReps: lift.lastReps,
    lastDay: lift.lastDay,
    e1rm: lift.currentE1rm,
    trend: lift.trend,
    targetWeightKg: weight,
    targetReps: reps,
    rpeCap: RPE_CAP[decision],
    rationale,
  };
}

export function buildTodayIntel(
  report: OblivionReport,
  sets: LoggedSet[],
  sleep: SleepSample[],
  nowMs: number,
): TodayIntel {
  const todayIdx = dayIndex(toDayKey(nowMs));

  /* ---- signals ---- */
  const latestSleep = [...sleep]
    .filter((s) => s.hours > 0 && todayIdx - dayIndex(s.day) <= 1)
    .sort((a, b) => dayIndex(b.day) - dayIndex(a.day))[0];
  let sleepValue: number | null = null;
  if (latestSleep) {
    const hoursScore = clamp((latestSleep.hours / 8) * 100, 0, 100);
    sleepValue = Math.round(latestSleep.recoveryPct ? (hoursScore + latestSleep.recoveryPct) / 2 : hoursScore);
  }

  const ratio = report.stats.acwr;
  const loadValue = ratio === null ? null : Math.round(acwrScore(ratio));

  let daysSince: number | null = null;
  for (const s of sets) {
    if (!(s.reps >= 1) || !classifyExercise(s.exercise)) continue;
    const ago = todayIdx - dayIndex(s.day);
    if (ago >= 0 && (daysSince === null || ago < daysSince)) daysSince = ago;
  }
  const restValue = daysSince === null ? null : daysSince === 0 ? 60 : daysSince === 1 ? 75 : daysSince === 2 ? 90 : 100;

  const toneFor = (v: number | null): Tone => (v === null ? 'idle' : v >= 75 ? 'good' : v >= 55 ? 'watch' : 'alert');

  const signals: ReadinessSignal[] = [
    {
      id: 'sleep',
      label: 'Last night',
      value: sleepValue,
      display: latestSleep ? `${Math.round(latestSleep.hours * 10) / 10}h` : '--',
      note: latestSleep ? (latestSleep.recoveryPct ? `${Math.round(latestSleep.recoveryPct)}% recovery` : 'Duration only') : 'No sleep logged',
      tone: toneFor(sleepValue),
    },
    {
      id: 'load',
      label: 'Load ratio',
      value: loadValue,
      display: ratio === null ? '--' : ratio.toFixed(2),
      note: ratio === null ? 'Needs 7+ training days' : report.stats.acwrLabel,
      tone: toneFor(loadValue),
    },
    {
      id: 'rest',
      label: 'Since last session',
      value: restValue,
      display: daysSince === null ? '--' : daysSince === 0 ? 'Today' : `${daysSince}d`,
      note: daysSince === null ? 'No sessions logged' : daysSince === 0 ? 'Already trained' : daysSince <= 2 ? 'Short turnaround' : 'Fully rested',
      tone: toneFor(restValue),
    },
  ];

  const live = signals.filter((s) => s.value !== null) as (ReadinessSignal & { value: number })[];
  const readiness = live.length ? Math.round(live.reduce((a, s) => a + s.value, 0) / live.length) : null;

  let decision: Decision;
  if (ratio !== null && ratio > 1.5) decision = 'DELOAD';
  else if (readiness === null) decision = 'NO SIGNAL';
  else if (readiness >= 75) decision = 'PUSH';
  else if (readiness >= 55) decision = 'MAINTAIN';
  else decision = 'EASE OFF';

  // Averages can hide one bad signal: never green-light progression on hot load or short sleep.
  let capReason = '';
  if (decision === 'PUSH' && ratio !== null && ratio > 1.3) {
    decision = 'MAINTAIN';
    capReason = `Load ratio ${ratio.toFixed(2)} is above the 1.3 sweet spot, so no added load today.`;
  } else if (decision === 'PUSH' && latestSleep && latestSleep.hours < 6.5) {
    decision = 'MAINTAIN';
    capReason = `${Math.round(latestSleep.hours * 10) / 10}h of sleep is under 6.5h, so no added load today.`;
  }

  const copy: Record<Decision, { headline: string; detail: string }> = {
    PUSH: { headline: 'Green light to progress', detail: 'Recovery signals support adding load today.' },
    MAINTAIN: { headline: 'Hold your working loads', detail: 'Train as planned, keep reps clean, skip the heavy singles.' },
    'EASE OFF': { headline: 'Dial it back today', detail: 'Recovery signals are low. Cut load and keep it technical.' },
    DELOAD: { headline: 'Deload this week', detail: `7d:28d load ratio ${ratio?.toFixed(2) ?? ''} is above the 1.5 injury-risk line.` },
    'NO SIGNAL': { headline: 'Not enough data to call it', detail: 'Log a session or a night of sleep and this calibrates on its own.' },
  };

  /* ---- muscle freshness ---- */
  const muscles: MuscleReadiness[] = report.muscles.map((m) => {
    const need = MUSCLE_BY_ID[m.id].min >= 8 ? 2 : 1;
    let state: MuscleReadiness['state'] = 'cold';
    if (m.lastTrainedDaysAgo !== null) state = m.lastTrainedDaysAgo < need ? 'recovering' : 'ready';
    return { id: m.id, label: m.label, daysAgo: m.lastTrainedDaysAgo, state, sets: m.sets, status: m.status };
  });

  const prescriptions = report.lifts
    .filter((l) => l.lastWeightKg > 0)
    .slice(0, 4)
    .map((l) => prescribe(l, decision));

  return {
    readiness,
    decision,
    headline: copy[decision].headline,
    detail: capReason || copy[decision].detail,
    signals,
    muscles,
    prescriptions,
    daysSinceSession: daysSince,
  };
}
