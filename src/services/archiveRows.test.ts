import { describe, expect, it } from 'vitest';
import {
  buildArchiveRows,
  COMPLETED_SESSION_COLUMNS,
  isUuid,
  toUuid,
  WORKOUT_LOG_COLUMNS,
  WORKOUT_SESSION_COLUMNS,
} from './archiveRows';

const USER = '07b7d413-3ca0-477f-9258-39f6ab851985';

const payload = {
  id: 'session-3f2a9c1e-4b7d-4e8a-9c2b-1d5e6f7a8b9c',
  title: 'Pull A',
  duration: '42m',
  tonnage_kg: 3183,
  total_sets: 3,
  strain: 0,
  exercises: [
    { name: 'BB Flat Bench', sets: [{ setNumber: 1, reps: 17, weightKg: 150, is_pr: true }] },
    { name: 'Row', sets: [{ setNumber: 1, reps: 6, weightKg: 50 }, { setNumber: 2, reps: 5, weightKg: 52.5 }] },
  ],
};

const keysWithin = (row: Record<string, unknown>, allowed: readonly string[]) =>
  Object.keys(row).filter((key) => !allowed.includes(key));

describe('session archive rows', () => {
  it('uses uuid ids everywhere the live tables key on uuid', () => {
    const { session, logs, mirror } = buildArchiveRows(payload, USER);
    expect(isUuid(session.id)).toBe(true);
    expect(mirror.id).toBe(session.id);
    expect(logs).toHaveLength(3);
    logs.forEach((row) => {
      expect(isUuid(row.id)).toBe(true);
      expect(row.session_id).toBe(session.id);
    });
  });

  it('keeps the same session id across retries so upserts never duplicate', () => {
    expect(buildArchiveRows(payload, USER).session.id).toBe(buildArchiveRows(payload, USER).session.id);
    expect(toUuid(payload.id)).toBe('3f2a9c1e-4b7d-4e8a-9c2b-1d5e6f7a8b9c');
    expect(isUuid(toUuid('session-1728000000000'))).toBe(true);
  });

  it('only writes columns that exist in each table', () => {
    const { session, logs, mirror } = buildArchiveRows(payload, USER);
    expect(keysWithin(session, COMPLETED_SESSION_COLUMNS)).toEqual([]);
    logs.forEach((row) => expect(keysWithin(row, WORKOUT_LOG_COLUMNS)).toEqual([]));
    expect(keysWithin(mirror, WORKOUT_SESSION_COLUMNS)).toEqual([]);
  });

  it('carries totals, duration and PR count', () => {
    const { session } = buildArchiveRows(payload, USER);
    expect(session.duration_seconds).toBe(42 * 60);
    expect(session.tonnage_kg).toBe(3183);
    expect(session.pr_count).toBe(1);
    expect(session.strain).toBeUndefined();
    expect(session.activity_type).toBe('strength');
  });
});
