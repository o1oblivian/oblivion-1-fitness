import type { DayTelemetryRecord } from '../log/store/useTelemetryHistoryStore';
import { classifyExercise } from './muscleModel';
import { acwrScore, dayIndex, toDayKey } from './reportEngine';
import type { Tone } from './palette';
import type { LoggedSet, OblivionReport } from './types';

export interface WeekStats {
  sessions: number;
  sets: number;
  tonnageKg: number;
  avgSleepHours: number | null;
  sleepNights: number;
  avgKcal: number | null;
  avgProteinG: number | null;
  fuelDays: number;
}

export interface DayBucket {
  day: string;
  label: string;
  trained: boolean;
  tonnageKg: number;
  sleepHours: number | null;
  kcal: number | null;
  kcalTarget: number | null;
  proteinG: number | null;
  proteinTarget: number | null;
}

export interface Finding {
  id: string;
  tone: Tone;
  title: string;
  detail: string;
}

export interface GradePart {
  id: 'training' | 'load' | 'recovery' | 'fuel';
  label: string;
  value: number | null;
  weight: number;
  detail: string;
}

export interface WeeklyIntel {
  days: DayBucket[];
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  parts: GradePart[];
  score: number | null;
  letter: string | null;
  findings: Finding[];
}

type History = Record<string, Partial<DayTelemetryRecord>>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKeyAgo(nowMs: number, ago: number): string {
  return toDayKey(nowMs - ago * 86_400_000);
}

function weekStats(sets: LoggedSet[], history: History, todayIdx: number, from: number, to: number, nowMs: number): WeekStats {
  const inRange = (key: string) => {
    const ago = todayIdx - dayIndex(key);
    return ago >= from && ago <= to;
  };
  const sessionDays = new Set<string>();
  let setCount = 0;
  let tonnage = 0;
  for (const s of sets) {
    if (!(s.reps >= 1) || !inRange(s.day)) continue;
    if (!classifyExercise(s.exercise)) continue;
    sessionDays.add(s.day);
    setCount += 1;
    tonnage += Math.max(0, s.weightKg) * s.reps;
  }

  const sleep: number[] = [];
  const kcal: number[] = [];
  const protein: number[] = [];
  for (let ago = from; ago <= to; ago += 1) {
    const rec = history[dayKeyAgo(nowMs, ago)];
    if (rec?.sleep?.hasData && rec.sleep.durationHours > 0) sleep.push(rec.sleep.durationHours);
    if (rec?.nutrition?.hasData && rec.nutrition.calories > 0) {
      kcal.push(rec.nutrition.calories);
      protein.push(rec.nutrition.proteinG);
    }
  }

  const a = avg(sleep);
  const k = avg(kcal);
  const p = avg(protein);
  return {
    sessions: sessionDays.size,
    sets: setCount,
    tonnageKg: Math.round(tonnage),
    avgSleepHours: a === null ? null : Math.round(a * 10) / 10,
    sleepNights: sleep.length,
    avgKcal: k === null ? null : Math.round(k),
    avgProteinG: p === null ? null : Math.round(p),
    fuelDays: kcal.length,
  };
}

export function buildWeeklyIntel(
  sets: LoggedSet[],
  history: History,
  report: OblivionReport,
  nowMs: number,
): WeeklyIntel {
  const todayIdx = dayIndex(toDayKey(nowMs));
  const target = report.stats.targetSessionsPerWeek;

  const thisWeek = weekStats(sets, history, todayIdx, 0, 6, nowMs);
  const lastWeek = weekStats(sets, history, todayIdx, 7, 13, nowMs);

  const days: DayBucket[] = [];
  for (let ago = 6; ago >= 0; ago -= 1) {
    const ms = nowMs - ago * 86_400_000;
    const key = toDayKey(ms);
    const rec = history[key];
    let tonnage = 0;
    let trained = false;
    for (const s of sets) {
      if (s.day !== key || !(s.reps >= 1) || !classifyExercise(s.exercise)) continue;
      trained = true;
      tonnage += Math.max(0, s.weightKg) * s.reps;
    }
    const nut = rec?.nutrition;
    days.push({
      day: key,
      label: DAY_LABELS[new Date(ms).getDay()],
      trained,
      tonnageKg: Math.round(tonnage),
      sleepHours: rec?.sleep?.hasData && rec.sleep.durationHours > 0 ? rec.sleep.durationHours : null,
      kcal: nut?.hasData && nut.calories > 0 ? nut.calories : null,
      kcalTarget: nut?.hasData && nut.calorieTarget > 0 ? nut.calorieTarget : null,
      proteinG: nut?.hasData && nut.calories > 0 ? nut.proteinG : null,
      proteinTarget: nut?.hasData && nut.proteinTargetG > 0 ? nut.proteinTargetG : null,
    });
  }

  /* ---- grade components ---- */
  const hasAnyTraining = report.stats.sessions28d > 0 || thisWeek.sessions > 0;
  const training: GradePart = {
    id: 'training',
    label: 'Training',
    weight: 0.3,
    value: hasAnyTraining ? Math.round(Math.min(1, thisWeek.sessions / target) * 100) : null,
    detail: hasAnyTraining ? `${thisWeek.sessions} of ${target} sessions` : 'No sessions logged',
  };

  const ratio = report.stats.acwr;
  const load: GradePart = {
    id: 'load',
    label: 'Load balance',
    weight: 0.2,
    value: ratio === null ? null : Math.round(acwrScore(ratio)),
    detail: ratio === null ? 'Needs 7+ training days' : `7d:28d ratio ${ratio.toFixed(2)}`,
  };

  const recovery: GradePart = {
    id: 'recovery',
    label: 'Sleep',
    weight: 0.25,
    value:
      thisWeek.sleepNights >= 2 && thisWeek.avgSleepHours !== null
        ? Math.round(clamp((thisWeek.avgSleepHours / 8) * 100, 0, 100))
        : null,
    detail:
      thisWeek.sleepNights >= 2 && thisWeek.avgSleepHours !== null
        ? `${thisWeek.avgSleepHours}h avg · ${thisWeek.sleepNights} nights`
        : 'Log 2+ nights of sleep',
  };

  const fuelScores: number[] = [];
  for (const d of days) {
    if (d.kcal === null || d.kcalTarget === null || d.proteinG === null || d.proteinTarget === null) continue;
    const kcalScore = clamp(100 - (Math.abs(d.kcal - d.kcalTarget) / d.kcalTarget) * 150, 0, 100);
    const proteinScore = clamp((d.proteinG / d.proteinTarget) * 100, 0, 100);
    fuelScores.push((kcalScore + proteinScore) / 2);
  }
  const fuelAvg = avg(fuelScores);
  const fuel: GradePart = {
    id: 'fuel',
    label: 'Fuel',
    weight: 0.25,
    value: fuelScores.length >= 3 && fuelAvg !== null ? Math.round(fuelAvg) : null,
    detail: fuelScores.length >= 3 ? `${fuelScores.length} days vs targets` : 'Log 3+ days with targets set',
  };

  const parts = [training, load, recovery, fuel];
  const available = parts.filter((p) => p.value !== null);
  let score: number | null = null;
  if (available.length >= 2) {
    const w = available.reduce((a, p) => a + p.weight, 0);
    score = Math.round(available.reduce((a, p) => a + (p.value as number) * p.weight, 0) / w);
  }
  const letter = score === null ? null : score >= 85 ? 'A' : score >= 72 ? 'B' : score >= 58 ? 'C' : score >= 45 ? 'D' : 'F';

  /* ---- findings, each backed by a number ---- */
  const findings: Finding[] = [];
  if (hasAnyTraining) {
    if (thisWeek.sessions >= target) {
      findings.push({ id: 'sessions', tone: 'good', title: 'Session target met', detail: `${thisWeek.sessions} sessions against a target of ${target}.` });
    } else {
      findings.push({
        id: 'sessions',
        tone: thisWeek.sessions === 0 ? 'alert' : 'watch',
        title: `${target - thisWeek.sessions} session${target - thisWeek.sessions === 1 ? '' : 's'} short`,
        detail: `${thisWeek.sessions} of ${target} logged in the last 7 days.`,
      });
    }
  }
  if (lastWeek.tonnageKg > 0 && thisWeek.tonnageKg > 0) {
    const pct = Math.round(((thisWeek.tonnageKg - lastWeek.tonnageKg) / lastWeek.tonnageKg) * 100);
    if (pct >= 30) {
      findings.push({ id: 'spike', tone: 'alert', title: 'Volume spike', detail: `Tonnage is up ${pct}% on last week. Spikes over 30% raise injury risk.` });
    } else if (pct <= -30) {
      findings.push({ id: 'drop', tone: 'watch', title: 'Volume drop', detail: `Tonnage is down ${Math.abs(pct)}% on last week.` });
    } else {
      findings.push({ id: 'steady-volume', tone: 'good', title: 'Volume steady', detail: `Tonnage ${pct >= 0 ? '+' : ''}${pct}% on last week.` });
    }
  }
  if (ratio !== null && ratio > 1.3) {
    findings.push({
      id: 'acwr',
      tone: ratio > 1.5 ? 'alert' : 'watch',
      title: ratio > 1.5 ? 'Deload recommended' : 'Load running hot',
      detail: `7d:28d ratio ${ratio.toFixed(2)}. Sweet spot is 0.8–1.3.`,
    });
  } else if (ratio !== null && ratio < 0.8 && hasAnyTraining) {
    findings.push({ id: 'acwr-low', tone: 'watch', title: 'Load below baseline', detail: `7d:28d ratio ${ratio.toFixed(2)}. Room to add volume.` });
  }
  if (thisWeek.sleepNights >= 2 && thisWeek.avgSleepHours !== null) {
    const short = days.filter((d) => d.sleepHours !== null && d.sleepHours < 6.5).length;
    if (thisWeek.avgSleepHours < 7) {
      findings.push({
        id: 'sleep',
        tone: thisWeek.avgSleepHours < 6 ? 'alert' : 'watch',
        title: 'Sleep debt building',
        detail: `${thisWeek.avgSleepHours}h average${short ? `, ${short} night${short === 1 ? '' : 's'} under 6.5h` : ''}.`,
      });
    } else {
      findings.push({ id: 'sleep', tone: 'good', title: 'Sleep on target', detail: `${thisWeek.avgSleepHours}h average across ${thisWeek.sleepNights} nights.` });
    }
  }
  const proteinPairs = days.filter((d) => d.proteinG !== null && d.proteinTarget !== null);
  if (proteinPairs.length >= 3) {
    const got = avg(proteinPairs.map((d) => d.proteinG as number)) as number;
    const want = avg(proteinPairs.map((d) => d.proteinTarget as number)) as number;
    if (got < want * 0.85) {
      findings.push({ id: 'protein', tone: 'watch', title: 'Protein under target', detail: `${Math.round(got)} g a day against ${Math.round(want)} g.` });
    } else {
      findings.push({ id: 'protein', tone: 'good', title: 'Protein on target', detail: `${Math.round(got)} g a day against ${Math.round(want)} g.` });
    }
  }
  const pbs = report.lifts.filter((l) => l.recentPb);
  if (pbs.length > 0) {
    findings.push({ id: 'pb', tone: 'good', title: `${pbs.length} lift${pbs.length === 1 ? '' : 's'} at a new best`, detail: pbs.map((l) => l.name).slice(0, 3).join(', ') });
  }
  report.lifts
    .filter((l) => l.trend === 'plateau')
    .slice(0, 2)
    .forEach((l) => findings.push({ id: `plateau-${l.name}`, tone: 'watch', title: `Plateau: ${l.name}`, detail: `No new best e1RM in 4+ weeks (${l.bestE1rm} kg).` }));

  return { days, thisWeek, lastWeek, parts, score, letter, findings };
}
