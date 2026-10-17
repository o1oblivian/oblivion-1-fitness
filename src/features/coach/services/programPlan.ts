import type {
  ProgramDayPlan,
  ProgramExerciseItem,
  ProgramFormData,
  ProgramWeekPlan,
} from '../components/programCreator/types';

/** Shape stored in `coach_programs.program_data`. Everything an enrolled athlete needs to train the program. */
export interface ProgramPlanData {
  version: 1;
  difficulty: string;
  overview: string;
  methodology: string;
  weeks: ProgramWeekPlan[];
}

type Row = Record<string, unknown>;

const str = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

function whole(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function parseExercise(raw: unknown, index: number): ProgramExerciseItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Row;
  const name = str(row.name).trim();
  if (!name) return null;
  return {
    id: str(row.id) || `ex-${index}`,
    name,
    sets: whole(row.sets, 0),
    reps: str(row.reps),
    restSeconds: whole(row.restSeconds, 0),
    cue: str(row.cue) || undefined,
    demoUrl: str(row.demoUrl) || undefined,
  };
}

function parseDay(raw: unknown, index: number): ProgramDayPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Row;
  const exercises = (Array.isArray(row.exercises) ? row.exercises : [])
    .map(parseExercise)
    .filter((ex): ex is ProgramExerciseItem => ex !== null);
  return {
    id: str(row.id) || `day-${index}`,
    dayName: str(row.dayName) || `Day ${index + 1}`,
    splitFocus: str(row.splitFocus),
    exercises,
  };
}

/** Reads `program_data` defensively; returns no weeks when the row predates full plans. */
export function parseProgramPlan(raw: unknown): ProgramPlanData | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Row;
  const weeks = (Array.isArray(row.weeks) ? row.weeks : [])
    .map((week, index): ProgramWeekPlan | null => {
      if (!week || typeof week !== 'object') return null;
      const w = week as Row;
      const days = (Array.isArray(w.days) ? w.days : [])
        .map(parseDay)
        .filter((day): day is ProgramDayPlan => day !== null);
      return { weekNumber: whole(w.weekNumber, index + 1) || index + 1, days };
    })
    .filter((week): week is ProgramWeekPlan => week !== null && week.days.length > 0);
  return {
    version: 1,
    difficulty: str(row.difficulty),
    overview: str(row.overview),
    methodology: str(row.methodology),
    weeks,
  };
}

export function buildProgramPlan(form: ProgramFormData): ProgramPlanData {
  return {
    version: 1,
    difficulty: form.difficulty,
    overview: form.shortOverview.trim(),
    methodology: form.fullMethodology.trim(),
    weeks: form.weeks.map((week) => ({
      weekNumber: week.weekNumber,
      days: week.days.map((day) => ({
        ...day,
        exercises: day.exercises
          .filter((ex) => ex.name.trim())
          .map((ex) => ({ ...ex, name: ex.name.trim(), cue: ex.cue?.trim() || undefined })),
      })),
    })),
  };
}

export function weekOneLines(plan: ProgramPlanData): string[] {
  return (plan.weeks[0]?.days ?? [])
    .map((day) => [day.dayName, day.splitFocus].filter(Boolean).join(' · '))
    .filter(Boolean);
}

export function exerciseCount(plan: ProgramPlanData | null): number {
  return plan
    ? plan.weeks.reduce(
        (sum, week) => sum + week.days.reduce((n, day) => n + day.exercises.length, 0),
        0,
      )
    : 0;
}
