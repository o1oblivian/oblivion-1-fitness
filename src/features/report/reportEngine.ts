import { computeAcwr } from '../../utils/acwrMath';
import { classifyExercise, MUSCLES, volumeStatus } from './muscleModel';
import type {
  LiftProgress,
  LiftTrend,
  LoggedSet,
  MuscleId,
  MuscleVolume,
  OblivionReport,
  PersonalBest,
  ReportAction,
  ReportInput,
  ScorePart,
} from './types';

/* ------------------------------------------------------------------ */
/* Date helpers (local calendar days)                                  */
/* ------------------------------------------------------------------ */

export function toDayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const roundHalf = (v: number) => Math.round(v * 2) / 2;

/* ------------------------------------------------------------------ */
/* Strength maths                                                      */
/* ------------------------------------------------------------------ */

/** Epley estimate. Only trusted for 1–12 rep sets with load on the bar. */
export function estimateOneRepMax(weightKg: number, reps: number): number | null {
  if (!(weightKg > 0) || !(reps >= 1) || reps > 12) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

interface LiftSession {
  day: string;
  idx: number;
  e1rm: number;
  weightKg: number;
  reps: number;
}

function buildLiftSessions(sets: LoggedSet[]): Map<string, LiftSession[]> {
  const best = new Map<string, Map<string, LiftSession>>();
  for (const s of sets) {
    const e1rm = estimateOneRepMax(s.weightKg, s.reps);
    if (e1rm === null) continue;
    const credit = classifyExercise(s.exercise);
    if (!credit) continue;
    const name = s.exercise.trim();
    const perDay = best.get(name) ?? new Map<string, LiftSession>();
    const prev = perDay.get(s.day);
    if (!prev || e1rm > prev.e1rm) {
      perDay.set(s.day, { day: s.day, idx: dayIndex(s.day), e1rm, weightKg: s.weightKg, reps: s.reps });
    }
    best.set(name, perDay);
  }
  const out = new Map<string, LiftSession[]>();
  best.forEach((perDay, name) => {
    out.set(
      name,
      Array.from(perDay.values()).sort((a, b) => a.idx - b.idx),
    );
  });
  return out;
}

function analyseLift(name: string, sessions: LiftSession[], todayIdx: number): LiftProgress {
  const last = sessions[sessions.length - 1];
  let bestSession = sessions[0];
  // Strictly greater: the first session to reach the best value owns the PB date.
  for (const s of sessions) if (s.e1rm > bestSession.e1rm) bestSession = s;

  const recent = sessions.filter((s) => todayIdx - s.idx <= 27);
  const prior = sessions.filter((s) => todayIdx - s.idx > 27 && todayIdx - s.idx <= 55);
  const recentBest = recent.length ? Math.max(...recent.map((s) => s.e1rm)) : null;
  const priorBest = prior.length ? Math.max(...prior.map((s) => s.e1rm)) : null;
  const changePct =
    recentBest !== null && priorBest !== null && priorBest > 0
      ? round1(((recentBest - priorBest) / priorBest) * 100)
      : null;

  const bestAgeDays = todayIdx - bestSession.idx;
  const sessions42 = sessions.filter((s) => todayIdx - s.idx <= 41).length;
  const recentPb = sessions.length >= 2 && bestAgeDays <= 27 && bestSession.idx !== sessions[0].idx;

  let trend: LiftTrend = 'steady';
  if (sessions42 >= 3 && bestAgeDays > 27 && (changePct === null || changePct < 1.5)) {
    trend = 'plateau';
  } else if (changePct !== null && changePct <= -4) {
    trend = 'declining';
  } else if (recentPb || (changePct !== null && changePct >= 1.5)) {
    trend = 'rising';
  }

  return {
    name,
    sessions: sessions.length,
    currentE1rm: Math.round(last.e1rm * 10) / 10,
    bestE1rm: Math.round(bestSession.e1rm * 10) / 10,
    bestDay: bestSession.day,
    changePct,
    trend,
    recentPb,
    lastWeightKg: last.weightKg,
    lastReps: last.reps,
    lastDay: last.day,
    series: sessions.slice(-16).map((s) => ({ day: s.day, e1rm: Math.round(s.e1rm * 10) / 10 })),
  };
}

function collectPersonalBests(sessionsByLift: Map<string, LiftSession[]>, todayIdx: number): PersonalBest[] {
  const events: PersonalBest[] = [];
  sessionsByLift.forEach((sessions, name) => {
    let running = 0;
    sessions.forEach((s, i) => {
      if (i > 0 && s.e1rm > running * 1.0 && todayIdx - s.idx <= 60) {
        events.push({
          exercise: name,
          e1rm: Math.round(s.e1rm * 10) / 10,
          weightKg: s.weightKg,
          reps: s.reps,
          day: s.day,
        });
      }
      running = Math.max(running, s.e1rm);
    });
  });
  return events.sort((a, b) => dayIndex(b.day) - dayIndex(a.day)).slice(0, 6);
}

/* ------------------------------------------------------------------ */
/* Muscle volume                                                       */
/* ------------------------------------------------------------------ */

function buildMuscleVolumes(sets: LoggedSet[], todayIdx: number): MuscleVolume[] {
  const weekly = new Map<MuscleId, number[]>();
  const lastTrained = new Map<MuscleId, number>();
  const exerciseSets = new Map<MuscleId, Map<string, number>>();
  MUSCLES.forEach((m) => weekly.set(m.id, [0, 0, 0, 0]));

  for (const s of sets) {
    if (!(s.reps >= 1)) continue;
    if (s.rpe !== null && s.rpe < 5) continue; // warm-ups don't count as hard sets
    const credit = classifyExercise(s.exercise);
    if (!credit) continue;
    const ago = todayIdx - dayIndex(s.day);
    if (ago < 0 || ago > 27) continue;
    const week = Math.floor(ago / 7);

    const apply = (id: MuscleId, amount: number, primary: boolean) => {
      const arr = weekly.get(id);
      if (!arr) return;
      arr[week] += amount;
      if (primary) {
        const prev = lastTrained.get(id);
        if (prev === undefined || ago < prev) lastTrained.set(id, ago);
      }
      if (week === 0) {
        const map = exerciseSets.get(id) ?? new Map<string, number>();
        map.set(s.exercise.trim(), (map.get(s.exercise.trim()) ?? 0) + amount);
        exerciseSets.set(id, map);
      }
    };
    credit.primary.forEach((id) => apply(id, 1, true));
    credit.secondary.forEach((id) => apply(id, 0.5, false));
  }

  return MUSCLES.map((spec) => {
    const arr = weekly.get(spec.id) ?? [0, 0, 0, 0];
    const current = roundHalf(arr[0]);
    const top = Array.from(exerciseSets.get(spec.id)?.entries() ?? [])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, n]) => ({ name, sets: roundHalf(n) }));
    return {
      id: spec.id,
      label: spec.label,
      sets: current,
      status: volumeStatus(current, spec),
      min: spec.min,
      max: spec.max,
      lastTrainedDaysAgo: lastTrained.get(spec.id) ?? null,
      weekly: [arr[3], arr[2], arr[1], arr[0]].map(roundHalf),
      topExercises: top,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Score components                                                    */
/* ------------------------------------------------------------------ */

const WEIGHTS = { strength: 0.35, consistency: 0.25, recovery: 0.2, bodyComp: 0.2 } as const;

function gradeFor(score: number | null): string {
  if (score === null) return 'CALIBRATING';
  if (score >= 85) return 'ELITE';
  if (score >= 70) return 'STRONG';
  if (score >= 55) return 'BUILDING';
  if (score >= 40) return 'DEVELOPING';
  return 'FOUNDATION';
}

function strengthPart(lifts: LiftProgress[]): ScorePart {
  const base: ScorePart = { id: 'strength', label: 'Strength', value: null, weight: WEIGHTS.strength, detail: 'Log 2+ sessions of a main lift' };
  if (lifts.length === 0) return base;
  const changes = lifts.map((l) => l.changePct).filter((v): v is number => v !== null);
  const avgChange = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const pbs = lifts.filter((l) => l.recentPb).length;
  const plateaus = lifts.filter((l) => l.trend === 'plateau').length;
  const declining = lifts.filter((l) => l.trend === 'declining').length;
  const value = clamp(Math.round(60 + 3.5 * avgChange + 6 * Math.min(pbs, 3) - 5 * plateaus - 4 * declining), 0, 100);
  return {
    ...base,
    value,
    detail: `${pbs} recent PB${pbs === 1 ? '' : 's'} · ${plateaus} plateau${plateaus === 1 ? '' : 's'}`,
  };
}

function consistencyPart(sets: LoggedSet[], todayIdx: number, target: number): { part: ScorePart; sessions28: number } {
  const days = new Set(sets.filter((s) => s.reps >= 1).map((s) => s.day));
  const base: ScorePart = { id: 'consistency', label: 'Consistency', value: null, weight: WEIGHTS.consistency, detail: 'No sessions logged yet' };
  const any90 = Array.from(days).some((d) => todayIdx - dayIndex(d) <= 89);
  const perWeek = [0, 0, 0, 0];
  days.forEach((d) => {
    const ago = todayIdx - dayIndex(d);
    if (ago >= 0 && ago <= 27) perWeek[Math.floor(ago / 7)] += 1;
  });
  const sessions28 = perWeek.reduce((a, b) => a + b, 0);
  if (!any90) return { part: base, sessions28 };
  const adherence = Math.min(1, sessions28 / (target * 4));
  const weeksHit = perWeek.filter((n) => n >= target).length / 4;
  const value = Math.round(100 * (0.75 * adherence + 0.25 * weeksHit));
  return {
    part: { ...base, value, detail: `${sessions28} sessions / 28d · target ${target}/wk` },
    sessions28,
  };
}

export function acwrScore(ratio: number): number {
  if (ratio >= 0.8 && ratio <= 1.3) return 100;
  if (ratio < 0.8) return clamp(100 - ((0.8 - ratio) / 0.3) * 50, 0, 100);
  return clamp(100 - ((ratio - 1.3) / 0.7) * 100, 0, 100);
}

function recoveryPart(input: ReportInput, todayIdx: number, ratio: number | null): { part: ScorePart; avgSleep: number | null } {
  const base: ScorePart = { id: 'recovery', label: 'Recovery', value: null, weight: WEIGHTS.recovery, detail: 'Log sleep or train 7+ days' };
  const recentSleep = input.sleep.filter((s) => s.hours > 0 && todayIdx - dayIndex(s.day) <= 6);
  const bits: number[] = [];
  const detail: string[] = [];
  let avgSleep: number | null = null;

  if (recentSleep.length > 0) {
    avgSleep = recentSleep.reduce((a, s) => a + s.hours, 0) / recentSleep.length;
    const hoursScore = clamp((avgSleep / 8) * 100, 0, 100);
    const rec = recentSleep.map((s) => s.recoveryPct).filter((v): v is number => v !== null && v > 0);
    const sleepScore = rec.length ? (hoursScore + rec.reduce((a, b) => a + b, 0) / rec.length) / 2 : hoursScore;
    bits.push(sleepScore);
    detail.push(`sleep ${round1(avgSleep)}h`);
  }
  if (ratio !== null) {
    bits.push(acwrScore(ratio));
    detail.push(`load ${ratio.toFixed(2)}`);
  }
  if (bits.length === 0) return { part: base, avgSleep };
  return {
    part: { ...base, value: Math.round(bits.reduce((a, b) => a + b, 0) / bits.length), detail: detail.join(' · ') },
    avgSleep,
  };
}

function bodyCompPart(input: ReportInput): ScorePart {
  const base: ScorePart = { id: 'bodyComp', label: 'Body Comp', value: null, weight: WEIGHTS.bodyComp, detail: 'Set bodyweight and goal weight' };
  const logged = [...input.weighIns].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));
  const current = logged.length ? logged[logged.length - 1].kg : input.currentWeightKg;
  const target = input.targetWeightKg;
  if (!(current > 0)) return base;
  if (!(target > 0)) return { ...base, detail: 'Set a goal weight to score' };

  let value = clamp(100 - (Math.abs(current - target) / target) * 100 * 6, 0, 100);
  let detail = `${round1(current)} kg → ${round1(target)} kg goal`;

  if (logged.length >= 2) {
    const first = logged[0];
    const last = logged[logged.length - 1];
    if (dayIndex(last.day) - dayIndex(first.day) >= 7) {
      const towardPct = ((Math.abs(first.kg - target) - Math.abs(last.kg - target)) / target) * 100;
      value += clamp(towardPct * 5, -15, 15);
      detail += towardPct >= 0 ? ' · trending to goal' : ' · drifting from goal';
    }
  }
  return { ...base, value: Math.round(clamp(value, 0, 100)), detail };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function buildActions(
  muscles: MuscleVolume[],
  lifts: LiftProgress[],
  consistency: ScorePart,
  sessions28: number,
  target: number,
  acwr: number | null,
  avgSleep: number | null,
  hasTraining: boolean,
): ReportAction[] {
  const actions: ReportAction[] = [];

  if (acwr !== null && acwr > 1.5) {
    actions.push({
      id: 'deload',
      kind: 'deload',
      severity: 'alert',
      title: 'Deload this week',
      detail: `Load ratio ${acwr.toFixed(2)} is above the 1.5 injury-risk line. Cut volume ~40%.`,
    });
  }

  muscles
    .filter((m) => m.status === 'over')
    .sort((a, b) => b.sets / b.max - a.sets / a.max)
    .slice(0, 2)
    .forEach((m) => {
      actions.push({
        id: `over-${m.id}`,
        kind: 'volume_reduce',
        severity: m.sets > m.max * 1.25 ? 'alert' : 'caution',
        title: `Trim ${m.label.toLowerCase()} volume`,
        detail: `${m.sets} sets this week vs a ${m.min}–${m.max} productive range.`,
        muscle: m.id,
      });
    });

  lifts
    .filter((l) => l.trend === 'plateau')
    .slice(0, 2)
    .forEach((l) => {
      actions.push({
        id: `plateau-${l.name}`,
        kind: 'plateau',
        severity: 'caution',
        title: `Plateau on ${l.name}`,
        detail: `No new PB in 4+ weeks (best e1RM ${l.bestE1rm} kg). Change rep range or add a deload week.`,
        exercise: l.name,
      });
    });

  if (hasTraining) {
    muscles
      .filter((m) => m.status === 'under' || m.status === 'none')
      .sort((a, b) => (b.min - b.sets) / b.min - (a.min - a.sets) / a.min)
      .slice(0, 3)
      .forEach((m) => {
        const gap = Math.ceil(m.min - m.sets);
        actions.push({
          id: `under-${m.id}`,
          kind: 'volume_add',
          severity: m.status === 'none' ? 'caution' : 'info',
          title: `Add ${m.label.toLowerCase()} work`,
          detail:
            m.status === 'none'
              ? `No ${m.label.toLowerCase()} sets logged this week. Aim for ${m.min}+.`
              : `${m.sets} of ${m.min}+ sets. Add ${gap} to reach the productive range.`,
          muscle: m.id,
        });
      });
  }

  if (consistency.value !== null && consistency.value < 60) {
    actions.push({
      id: 'consistency',
      kind: 'consistency',
      severity: 'caution',
      title: `Lock in ${target} sessions a week`,
      detail: `${sessions28} sessions in the last 28 days against a ${target * 4} target.`,
    });
  }

  if (avgSleep !== null && avgSleep < 6.5) {
    actions.push({
      id: 'sleep',
      kind: 'recovery',
      severity: 'caution',
      title: 'Sleep is limiting recovery',
      detail: `Averaging ${round1(avgSleep)}h over the last week. Target 7.5h+.`,
    });
  }

  const rank = { alert: 0, caution: 1, info: 2 } as const;
  return actions.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 6);
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function buildReport(input: ReportInput): OblivionReport {
  const todayIdx = dayIndex(toDayKey(input.now));
  const target = clamp(Math.round(input.targetSessionsPerWeek) || 4, 1, 7);
  const validSets = input.sets.filter((s) => s.reps >= 1 && todayIdx - dayIndex(s.day) >= 0);

  const sessionsByLift = buildLiftSessions(validSets);
  const lifts = Array.from(sessionsByLift.entries())
    .filter(([, sessions]) => sessions.length >= 2)
    .map(([name, sessions]) => analyseLift(name, sessions, todayIdx))
    .sort((a, b) => b.sessions - a.sessions || b.bestE1rm - a.bestE1rm)
    .slice(0, 6);
  const personalBests = collectPersonalBests(sessionsByLift, todayIdx);

  const muscles = buildMuscleVolumes(validSets, todayIdx);

  // Daily tonnage for the last 28 days → ACWR.
  const daily = new Array<number>(28).fill(0);
  let tonnage7 = 0;
  let sets7 = 0;
  for (const s of validSets) {
    const ago = todayIdx - dayIndex(s.day);
    if (ago < 0 || ago > 27) continue;
    const load = Math.max(0, s.weightKg) * s.reps;
    daily[27 - ago] += load;
    if (ago <= 6) {
      tonnage7 += load;
      if (classifyExercise(s.exercise)) sets7 += 1;
    }
  }
  const acwrSnap = computeAcwr(daily);

  const strength = strengthPart(lifts);
  const { part: consistency, sessions28 } = consistencyPart(validSets, todayIdx, target);
  const { part: recovery, avgSleep } = recoveryPart(input, todayIdx, acwrSnap.ratio);
  const bodyComp = bodyCompPart(input);
  const parts = [strength, consistency, recovery, bodyComp];

  const available = parts.filter((p) => p.value !== null);
  let score: number | null = null;
  if (available.length >= 2) {
    const totalWeight = available.reduce((a, p) => a + p.weight, 0);
    score = Math.round(available.reduce((a, p) => a + (p.value as number) * p.weight, 0) / totalWeight);
  }

  const hasTraining = validSets.some((s) => classifyExercise(s.exercise));
  const actions = buildActions(muscles, lifts, consistency, sessions28, target, acwrSnap.ratio, avgSleep, hasTraining);

  const weightKg = input.currentWeightKg > 0 ? round1(input.currentWeightKg) : null;

  return {
    version: 1,
    generatedAt: input.now,
    hasData: hasTraining || available.length > 0,
    score,
    grade: gradeFor(score),
    parts,
    muscles,
    lifts,
    personalBests,
    actions,
    stats: {
      sessions28d: sessions28,
      targetSessionsPerWeek: target,
      setsLast7: sets7,
      tonnageLast7Kg: Math.round(tonnage7),
      acwr: acwrSnap.ratio,
      acwrLabel: acwrSnap.label,
      avgSleepHours: avgSleep === null ? null : round1(avgSleep),
      weightKg,
      targetWeightKg: input.targetWeightKg > 0 ? round1(input.targetWeightKg) : null,
    },
  };
}
