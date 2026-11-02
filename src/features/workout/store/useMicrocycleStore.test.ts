import { beforeEach, describe, expect, it, vi } from 'vitest';

const rows: Array<Record<string, unknown>> = [];

vi.mock('../../../services/supabaseClient', () => {
  const chain: Record<string, unknown> = {};
  for (const step of ['select', 'eq', 'gte', 'lte', 'order', 'or', 'in', 'delete', 'insert'])
    chain[step] = () => chain;
  chain.limit = () => Promise.resolve({ data: rows, error: null });
  return { supabase: { from: () => chain } };
});
vi.mock('../../../services/authUser', () => ({
  getAuthenticatedUserId: () => Promise.resolve('athlete-1'),
}));

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function load() {
  const { useMicrocycleStore } = await import('./useMicrocycleStore');
  const { useTelemetryHistoryStore } = await import('../../log/store/useTelemetryHistoryStore');
  const { markForgotten } = await import('../../log/services/dayLogService');
  const today = () =>
    useMicrocycleStore
      .getState()
      .activeDays.find(
        (_, i) => useMicrocycleStore.getState().activeIsoWeekDates[i]?.dateKey === todayKey(),
      );
  return { useMicrocycleStore, useTelemetryHistoryStore, markForgotten, today };
}

describe('this week', () => {
  beforeEach(() => {
    vi.resetModules();
    const saved = new Map<string, string>();
    const storage = {
      getItem: (k: string) => saved.get(k) ?? null,
      setItem: (k: string, v: string) => void saved.set(k, String(v)),
      removeItem: (k: string) => void saved.delete(k),
      clear: () => saved.clear(),
    };
    const events = new EventTarget();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', {
      localStorage: storage,
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events),
    });
    rows.length = 0;
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);
    rows.push({
      tonnage_kg: 2000,
      total_sets: 12,
      title: 'Push A',
      completed_at: noon.toISOString(),
      created_at: noon.toISOString(),
    });
  });

  it('shows a backed-up workout this phone has no record of', async () => {
    const { useMicrocycleStore, today } = await load();
    await useMicrocycleStore.getState().refreshFromSupabase();
    expect(today()?.volume).toBe(2000);
  });

  it('drops a workout deleted on Log even while the backup still has it', async () => {
    const { useMicrocycleStore, useTelemetryHistoryStore, markForgotten, today } = await load();
    useTelemetryHistoryStore
      .getState()
      .updateDayRecord(
        todayKey(),
        'workout',
        { hasData: true, tonnageKg: 2000, completedSets: 12, routineName: 'Push A' },
        { skipCloud: true },
      );
    await useMicrocycleStore.getState().refreshFromSupabase();
    expect(today()?.volume).toBe(2000);

    markForgotten(todayKey(), 'workout');
    useTelemetryHistoryStore.getState().clearDayRecord(todayKey(), 'workout');

    expect(today()?.volume).toBe(0);
    expect(today()?.title).toBeNull();
  });

  it('follows an edited day on this phone over a larger backup', async () => {
    const { useMicrocycleStore, useTelemetryHistoryStore, today } = await load();
    await useMicrocycleStore.getState().refreshFromSupabase();

    useTelemetryHistoryStore
      .getState()
      .updateDayRecord(
        todayKey(),
        'workout',
        { hasData: true, tonnageKg: 500, completedSets: 4, routineName: 'Push A' },
        { skipCloud: true },
      );

    expect(today()?.volume).toBe(500);
    expect(today()?.sets).toBe(4);
  });
});
