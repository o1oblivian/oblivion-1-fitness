import { syncSessionToSupabase, type WorkoutSessionPayload } from './supabaseClient';
import { getAuthenticatedUserId, getCachedUserId } from './authUser';
import { toUuid } from './archiveRows';
import { safeStorage } from '../utils/safeStorage';
import {
  enqueueSync,
  flushSync,
  hasPendingSync,
  registerSyncHandler,
  rewriteSyncOps,
} from './syncOutbox';

const LEGACY_PENDING_KEY = 'o1fc_pending_session_archives';

export type ArchiveOutcome = 'saved' | 'queued' | 'signed-out';

function localDay(iso: unknown): string {
  const date = new Date(typeof iso === 'string' ? iso : '');
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const sessionKey = (id: string) => `session:${id}`;

registerSyncHandler('session', async (payload, userId) => {
  if (payload.user_id && payload.user_id !== userId) return false;
  return syncSessionToSupabase(payload as WorkoutSessionPayload);
});

function queueSession(payload: WorkoutSessionPayload): void {
  enqueueSync('session', sessionKey(String(payload.id)), localDay(payload.completed_at), payload);
}

/** Sessions queued by the earlier retry list move into the shared queue once. */
(function adoptLegacyQueue() {
  const legacy = safeStorage.getItem<WorkoutSessionPayload[]>(LEGACY_PENDING_KEY, []);
  if (!Array.isArray(legacy) || legacy.length === 0) return;
  legacy.forEach((payload) => {
    if (payload?.id)
      queueSession({
        ...payload,
        completed_at: payload.completed_at || payload.created_at || new Date().toISOString(),
      });
  });
  safeStorage.removeItem(LEGACY_PENDING_KEY);
})();

/**
 * Backs a finished session up to the athlete's account. It is queued before the upload starts,
 * so no signal, a weak signal, or closing the app mid-upload still leaves it to retry later.
 */
export async function archiveSession(payload: WorkoutSessionPayload): Promise<ArchiveOutcome> {
  const uid = payload.user_id || (await getAuthenticatedUserId()) || (await getCachedUserId());
  if (!uid) return 'signed-out';
  const stable = {
    ...payload,
    id: toUuid(payload.id),
    user_id: uid,
    completed_at: payload.completed_at || new Date().toISOString(),
  };
  queueSession(stable);
  await flushSync();
  return hasPendingSync((op) => op.key === sessionKey(stable.id)) ? 'queued' : 'saved';
}

/** Drop a deleted day, or one lift from it, out of the queue so a later upload cannot restore it. */
export function forgetPendingArchives(
  dateKey: string,
  kind: 'workout' | 'cardio',
  exerciseName?: string,
): void {
  rewriteSyncOps((op) => {
    if (op.kind !== 'session') return op;
    const payload = op.payload as WorkoutSessionPayload;
    if (localDay(payload.completed_at || payload.created_at) !== dateKey) return op;
    const cardio =
      String(payload.title || '')
        .toLowerCase()
        .startsWith('cardio') || payload.activity_type != null;
    if (cardio !== (kind === 'cardio')) return op;
    if (!exerciseName) return null;
    if (!Array.isArray(payload.exercises)) return op;
    const exercises = payload.exercises.filter(
      (exercise: { name?: string; exerciseName?: string }) =>
        (exercise?.name || exercise?.exerciseName) !== exerciseName,
    );
    return exercises.length > 0 ? { ...op, payload: { ...payload, exercises } } : null;
  });
}
