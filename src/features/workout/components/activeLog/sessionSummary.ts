import type { ExerciseItem } from '../../../../types';
import type { WeightUnit } from '../../../../hooks/useAthleteSettings';
import { kgToDisplay, loadUnitLabel } from '../../../../utils/weightUnits';
import { localTodayKey, priorBestKg, setIsPr } from '../../services/sessionPr';
import { feelWord, summariseLifts } from '../../services/setCoach';
import { getTelemetryHistoryState } from '../../../log/store/useTelemetryHistoryStore';
import type { LiftHighlight } from '../modals/CommitWorkoutModal';

/** Lifts where a ticked set beat every earlier day's best estimated 1RM. */
export function sessionPrCount(exercises: ExerciseItem[]): number {
  const today = localTodayKey();
  return exercises.filter((e) => {
    const name = e.name || e.exerciseName || '';
    const prior = priorBestKg(name, today);
    return (
      prior > 0 &&
      (e.sets || []).some(
        (s) =>
          s.completed &&
          setIsPr(name, Number(s.weightKg ?? s.weight) || 0, Number(s.reps) || 0, prior),
      )
    );
  }).length;
}

/** Total weight lifted on the same weekday last week, or null if none was logged. */
export function sameDayLastWeekKg(): number | null {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const record = getTelemetryHistoryState().historyByDate[key]?.workout;
  return record?.hasData && record.tonnageKg > 0 ? record.tonnageKg : null;
}

const TREND_NOTE = {
  up: 'Up on last time',
  same: 'Same as last time',
  down: 'Lighter than last time',
  first: 'First time logged',
};

/** One line per lift for the finish sheet: today's top set and how it compares with last time. */
export function liftHighlights(exercises: ExerciseItem[], unit: WeightUnit): LiftHighlight[] {
  const unitLower = loadUnitLabel(unit).toLowerCase();
  const setText = (s: { weightKg: number; reps: number }) =>
    s.weightKg > 0 ? `${kgToDisplay(s.weightKg, unit)} ${unitLower} × ${s.reps}` : `${s.reps} reps`;
  return summariseLifts(exercises).map((l) => ({
    name: l.name,
    top: setText(l.top),
    note:
      l.lastTop && l.trend !== 'same'
        ? `${TREND_NOTE[l.trend]} · was ${setText(l.lastTop)}`
        : TREND_NOTE[l.trend],
    trend: l.trend,
    best: l.best,
  }));
}

/** How the session felt, from the effort ratings on ticked sets. Null if none were rated. */
export function sessionFeel(exercises: ExerciseItem[], simple: boolean): string | null {
  const rated = exercises.flatMap((e) =>
    (e.sets || []).filter((s) => s.completed && Number(s.rpe) > 0).map((s) => Number(s.rpe)),
  );
  if (rated.length === 0) return null;
  const avg = rated.reduce((a, b) => a + b, 0) / rated.length;
  return simple
    ? `Felt ${feelWord(avg).toLowerCase()} overall`
    : `Average effort RPE ${Math.round(avg * 10) / 10}`;
}

/** Marks every set that has reps filled in as done. */
export function tickFilledSets(exercises: ExerciseItem[]): ExerciseItem[] {
  return exercises.map((e) => ({
    ...e,
    sets: (e.sets || []).map((s) =>
      !s.completed && Number(s.reps) > 0 ? { ...s, completed: true } : s,
    ),
  }));
}

/** How many sets have reps filled in but were never ticked. */
export function countUntickedFilledSets(exercises: ExerciseItem[]): number {
  return exercises.reduce(
    (n, e) => n + (e.sets || []).filter((s) => !s.completed && Number(s.reps) > 0).length,
    0,
  );
}
