import { useMemo } from 'react';
import { createStore } from '../../utils/createStore';
import { safeStorage } from '../../utils/safeStorage';
import { dayIndex, toDayKey } from '../report/reportEngine';

/** How the athlete says they feel today. Everything else in the app adapts to this. */
export type BodyStatus = 'ready' | 'rest' | 'sick' | 'injured';

export const INJURY_AREAS = ['Shoulder', 'Elbow', 'Wrist', 'Back', 'Hip', 'Knee', 'Ankle'] as const;

export interface BodyStatusState {
  status: BodyStatus;
  /** Day key the status began, for "Day 3". Null when ready. */
  since: string | null;
  /** Where it hurts. Only used when injured. */
  area: string | null;
}

const KEY = 'o1fc_body_status_v1';

/** Fired on every change so the reminder scheduler can rebuild the phone's schedule. */
export const BODY_STATUS_EVENT = 'o1fc_body_status_changed';

export const READY_STATE: BodyStatusState = { status: 'ready', since: null, area: null };

const STATUSES: readonly BodyStatus[] = ['ready', 'rest', 'sick', 'injured'];

/** Bumped on every change so screens re-read storage, as the weigh-in list does. */
const revisionStore = createStore<{ revision: number }, Record<string, never>>(
  { revision: 0 },
  () => ({}),
);

/**
 * The status in force at `now`. A rest day lasts that one day, so it lapses on its own;
 * being sick or injured stays until the athlete says otherwise.
 */
export function readBodyStatus(now: number = Date.now()): BodyStatusState {
  const saved = safeStorage.getItem<Partial<BodyStatusState> | null>(KEY, null);
  if (!saved || !STATUSES.includes(saved.status as BodyStatus) || saved.status === 'ready') {
    return READY_STATE;
  }
  const since = typeof saved.since === 'string' ? saved.since : toDayKey(now);
  if (saved.status === 'rest' && since !== toDayKey(now)) return READY_STATE;
  return {
    status: saved.status as BodyStatus,
    since,
    area: saved.status === 'injured' && typeof saved.area === 'string' ? saved.area : null,
  };
}

/** Choosing the status already in force keeps its start date. */
export function setBodyStatus(
  status: BodyStatus,
  area: string | null = null,
  now: number = Date.now(),
): void {
  const current = readBodyStatus(now);
  const next: BodyStatusState =
    status === 'ready'
      ? READY_STATE
      : {
          status,
          since: current.status === status && current.since ? current.since : toDayKey(now),
          area: status === 'injured' ? area : null,
        };
  safeStorage.setItem(KEY, next);
  revisionStore.setState((prev) => ({ revision: prev.revision + 1 }));
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(BODY_STATUS_EVENT));
  }
}

/** 1 on the day it began. */
export function statusDay(state: BodyStatusState, now: number = Date.now()): number {
  if (!state.since) return 0;
  return Math.max(1, dayIndex(toDayKey(now)) - dayIndex(state.since) + 1);
}

/** True while training should be held back entirely. */
export const holdsTraining = (state: BodyStatusState): boolean =>
  state.status === 'rest' || state.status === 'sick';

export function useBodyStatus(): BodyStatusState {
  const revision = revisionStore.useStore((s) => s.revision);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- revision is the cue to re-read storage
  return useMemo(() => readBodyStatus(), [revision]);
}
