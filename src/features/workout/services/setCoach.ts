import type { ExerciseItem } from '../../../types';
import {
  getTelemetryHistoryState,
  type LoggedSet,
  type WorkoutDayRecord,
} from '../../log/store/useTelemetryHistoryStore';
import { knownSets } from '../../log/liftLedger';
import { estimatedMaxKg, localTodayKey, priorBestSet } from './sessionPr';

type History = Record<string, { workout?: Partial<WorkoutDayRecord> } | undefined>;

export interface LastSession {
  dateKey: string;
  sets: LoggedSet[];
}

/** Most recent day before `beforeDateKey` that logged this lift. */
export function lastSessionSets(
  exerciseName: string,
  beforeDateKey = localTodayKey(),
  history: History = getTelemetryHistoryState().historyByDate,
): LastSession | null {
  const key = exerciseName.trim().toLowerCase();
  if (!key) return null;
  const days = Object.keys(history)
    .filter((d) => d < beforeDateKey)
    .sort()
    .reverse();
  for (const dateKey of days) {
    const entries = history[dateKey]?.workout?.exercises || [];
    const sets = entries
      .filter((e) => (e.name || '').trim().toLowerCase() === key)
      .flatMap((e) => knownSets(e))
      .filter((s) => s.reps > 0);
    if (sets.length > 0) return { dateKey, sets };
  }
  return null;
}

/** Sets with no reps yet take last session's numbers, set for set. Prescribed or ticked sets are left alone. */
export function prefillFromHistory<
  T extends Pick<ExerciseItem, 'name' | 'sets'> & { exerciseName?: string },
>(exercises: T[], history?: History, beforeDateKey?: string): T[] {
  return exercises.map((ex) => {
    const sets = ex.sets || [];
    if (!sets.some((s) => !s.completed && !(Number(s.reps) > 0))) return ex;
    const last = lastSessionSets(ex.exerciseName || ex.name || '', beforeDateKey, history);
    if (!last) return ex;
    return {
      ...ex,
      sets: sets.map((s, i) => {
        if (s.completed || Number(s.reps) > 0) return s;
        const prev = last.sets[Math.min(i, last.sets.length - 1)];
        return { ...s, reps: prev.reps, weightKg: prev.weightKg, weight: prev.weightKg };
      }),
    };
  });
}

/** Heaviest set by estimated max; reps break ties for bodyweight work. */
export function topSet(sets: LoggedSet[]): LoggedSet | null {
  let top: LoggedSet | null = null;
  for (const s of sets) {
    if (s.reps <= 0) continue;
    if (!top) {
      top = s;
      continue;
    }
    const a = estimatedMaxKg(s.weightKg, s.reps);
    const b = estimatedMaxKg(top.weightKg, top.reps);
    if (a > b || (a === b && s.reps > top.reps)) top = s;
  }
  return top;
}

export interface LiftSummary {
  name: string;
  top: LoggedSet;
  lastTop: LoggedSet | null;
  trend: 'up' | 'same' | 'down' | 'first';
  best: boolean;
}

/** Each lift's top ticked set against its last session and its all-time best. */
export function summariseLifts(
  exercises: Pick<ExerciseItem, 'name' | 'sets'>[],
  beforeDateKey = localTodayKey(),
  history: History = getTelemetryHistoryState().historyByDate,
): LiftSummary[] {
  const out: LiftSummary[] = [];
  for (const ex of exercises) {
    const name = ex.name || '';
    if (!name || out.some((o) => o.name === name)) continue;
    const top = topSet(
      (ex.sets || [])
        .filter((s) => s.completed)
        .map((s) => ({ weightKg: Number(s.weightKg ?? s.weight) || 0, reps: Number(s.reps) || 0 })),
    );
    if (!top) continue;
    const last = lastSessionSets(name, beforeDateKey, history);
    const lastTop = last ? topSet(last.sets) : null;
    const now = estimatedMaxKg(top.weightKg, top.reps);
    const then = lastTop ? estimatedMaxKg(lastTop.weightKg, lastTop.reps) : 0;
    const trend = !lastTop
      ? 'first'
      : now > then || (now === then && top.reps > lastTop.reps)
        ? 'up'
        : now === then && top.reps === lastTop.reps
          ? 'same'
          : 'down';
    const prior = priorBestSet(name, beforeDateKey, history as Parameters<typeof priorBestSet>[2]);
    out.push({ name, top, lastTop, trend, best: Boolean(prior && now > prior.estimatedMaxKg) });
  }
  return out;
}

/** Average feel of the rated sets in plain words. */
export function feelWord(avgRpe: number): 'Easy' | 'Good' | 'Hard' | 'Max' {
  if (avgRpe <= 6.5) return 'Easy';
  if (avgRpe <= 7.75) return 'Good';
  if (avgRpe < 9.5) return 'Hard';
  return 'Max';
}

type AdviceKind = 'up' | 'same' | 'hold' | 'down' | 'stop';

export interface SetAdvice {
  kind: AdviceKind;
  weightKg: number;
  reps: number;
}

export interface AdviceInput {
  /** How hard the finished set felt, 1–10. */
  rpe: number;
  weightKg: number;
  reps: number;
  /** Smallest sensible load jump in kg. */
  stepKg: number;
  /** Hardest effort this athlete should reach. */
  rpeCap: number;
  /** Under 18 or 60+: never push through a maximal set. */
  careful?: boolean;
}

const snap = (kg: number, step: number) => Math.max(0, Math.round(kg / step) * step);

/** What the next set of the same lift should be, from how the last one felt. Null until a feel is given. */
export function nextSetAdvice({
  rpe,
  weightKg,
  reps,
  stepKg,
  rpeCap,
  careful = false,
}: AdviceInput): SetAdvice | null {
  if (!(rpe > 0) || !(reps > 0)) return null;
  const loaded = weightKg > 0;
  const cap = Math.min(rpeCap, 9);
  if (rpe >= 9.5) {
    const drop = loaded ? Math.max(stepKg, snap(weightKg * (careful ? 0.1 : 0.05), stepKg)) : 0;
    return {
      kind: careful ? 'stop' : 'down',
      weightKg: loaded ? snap(weightKg - drop, stepKg) : 0,
      reps: loaded ? reps : Math.max(1, reps - 2),
    };
  }
  if (rpe > cap) {
    return loaded
      ? { kind: 'down', weightKg: snap(weightKg - stepKg, stepKg), reps }
      : { kind: 'down', weightKg: 0, reps: Math.max(1, reps - 1) };
  }
  if (rpe <= 6.5) {
    return loaded
      ? { kind: 'up', weightKg: weightKg + stepKg, reps }
      : { kind: 'up', weightKg: 0, reps: reps + 2 };
  }
  if (rpe >= 8.5) return { kind: 'hold', weightKg, reps };
  return { kind: 'same', weightKg, reps };
}
