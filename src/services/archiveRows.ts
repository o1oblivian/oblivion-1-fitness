import type { WorkoutSessionPayload } from './supabaseClient';

/** Live column sets (verified against Supabase). Every archive row must stay inside these. */
export const COMPLETED_SESSION_COLUMNS = [
  'id',
  'user_id',
  'client_id',
  'title',
  'session_name',
  'tonnage_kg',
  'volume_kg',
  'total_sets',
  'duration_seconds',
  'strain',
  'completed_at',
  'created_at',
  'pr_count',
  'activity_type',
] as const;
export const WORKOUT_LOG_COLUMNS = [
  'id',
  'user_id',
  'session_id',
  'exercise_name',
  'set_number',
  'reps',
  'weight_kg',
  'rpe',
  'is_pr',
  'created_at',
] as const;
export const WORKOUT_SESSION_COLUMNS = [
  'id',
  'user_id',
  'client_id',
  'session_name',
  'volume_kg',
  'total_sets',
  'duration_seconds',
  'exercises',
  'completed_at',
] as const;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const isUuid = (value: unknown): boolean =>
  typeof value === 'string' && new RegExp(`^${UUID_RE.source}$`, 'i').test(value);

/** Archive tables key on uuid columns; local ids look like `session-<uuid>`. */
export function toUuid(id?: string): string {
  return id?.match(UUID_RE)?.[0] ?? crypto.randomUUID();
}

type ArchiveSet = {
  setNumber?: number;
  reps?: number;
  weightKg?: number;
  weight?: number;
  rpe?: number;
  is_pr?: boolean;
};
type ArchiveExercise = {
  name?: string;
  sets?: ArchiveSet[] | number;
  reps?: number;
  weightKg?: number;
  weight?: number;
  rpe?: number;
};

export interface ArchiveRows {
  session: Record<string, unknown>;
  logs: Array<Record<string, unknown>>;
  mirror: Record<string, unknown>;
}

export function buildArchiveRows(
  sessionData: WorkoutSessionPayload,
  userId: string,
  now = new Date(),
): ArchiveRows {
  const parsedDuration = sessionData.duration
    ? parseInt(String(sessionData.duration).replace(/[^\d]/g, ''), 10)
    : NaN;
  const durationMins = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 0;
  const durationSeconds =
    sessionData.duration_seconds && sessionData.duration_seconds > 0
      ? sessionData.duration_seconds
      : durationMins * 60;
  const tonnage = sessionData.tonnage_kg ?? sessionData.tonnageKg ?? 0;
  const totalSets = sessionData.total_sets ?? sessionData.totalSets ?? 0;
  const nowIso = now.toISOString();
  const givenAt = sessionData.completed_at ? new Date(sessionData.completed_at) : null;
  const completedAt = givenAt && !Number.isNaN(givenAt.getTime()) ? givenAt.toISOString() : nowIso;
  const title = sessionData.title || 'Workout';
  const id = toUuid(sessionData.id);
  const givenType =
    typeof sessionData.activity_type === 'string' ? sessionData.activity_type.trim() : '';
  const activityType =
    givenType ||
    (/^cardio:/i.test(title) ? title.replace(/^cardio:\s*/i, '').trim() || 'cardio' : 'strength');

  const session: Record<string, unknown> = {
    id,
    user_id: userId,
    client_id: userId,
    title,
    session_name: title,
    activity_type: activityType,
    tonnage_kg: tonnage,
    volume_kg: tonnage,
    total_sets: totalSets,
    completed_at: completedAt,
    created_at: completedAt,
  };
  if (durationSeconds > 0) session.duration_seconds = durationSeconds;
  if (sessionData.strain != null && sessionData.strain > 0) session.strain = sessionData.strain;

  const exercises: ArchiveExercise[] = Array.isArray(sessionData.exercises)
    ? sessionData.exercises
    : [];
  const logs = exercises.flatMap((ex) => {
    const setRows = Array.isArray(ex.sets) ? ex.sets : [];
    const count = setRows.length || Number(ex.sets) || 0;
    return Array.from({ length: count }, (_, sIdx) => {
      const set = setRows[sIdx] || {};
      const reps = Number(set.reps ?? ex.reps ?? 0);
      const weight = Number(set.weightKg ?? set.weight ?? ex.weightKg ?? ex.weight ?? 0);
      return {
        id: crypto.randomUUID(),
        user_id: userId,
        session_id: id,
        exercise_name: ex.name || 'Exercise',
        set_number: Number(set.setNumber || sIdx + 1),
        reps: Number.isFinite(reps) ? reps : 0,
        weight_kg: Number.isFinite(weight) ? weight : 0,
        rpe: Number(set.rpe ?? ex.rpe ?? 0) || 0,
        is_pr: Boolean(set.is_pr),
        created_at: nowIso,
      };
    });
  });
  const prCount = logs.filter((row) => row.is_pr).length;
  if (prCount > 0) session.pr_count = prCount;

  const mirror: Record<string, unknown> = {
    id,
    user_id: userId,
    client_id: userId,
    session_name: title,
    volume_kg: tonnage,
    total_sets: totalSets,
    completed_at: completedAt,
    exercises: sessionData.exercises || [],
  };
  if (durationSeconds > 0) mirror.duration_seconds = durationSeconds;

  return { session, logs, mirror };
}
