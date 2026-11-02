import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/fuel/services/fuelCloud', async (orig) => {
  const real = await orig<typeof import('../features/fuel/services/fuelCloud')>();
  return {
    ...real,
    fetchFuelSnapshot: vi.fn().mockResolvedValue(null),
    fetchFuelWeek: vi.fn().mockResolvedValue(null),
  };
});
vi.mock('../services/syncOutbox', async (orig) => ({
  ...(await orig<typeof import('../services/syncOutbox')>()),
  registerExternalQueue: vi.fn(),
}));

const SATURDAY = new Date(2026, 9, 31, 12, 0, 0);
const MONDAY = new Date(2026, 10, 2, 8, 0, 0);

const LUNCH = {
  id: 'meal-1',
  name: 'Burrito Bowl',
  calories: 630,
  protein: 42,
  carbs: 75,
  fats: 18,
};

/** Just enough of a browser for the stores: saved values that survive a module reload. */
function installBrowser(saved: Map<string, string>) {
  const events = new EventTarget();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => saved.get(k) ?? null,
      setItem: (k: string, v: string) => void saved.set(k, String(v)),
      removeItem: (k: string) => void saved.delete(k),
      clear: () => saved.clear(),
    },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  });
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  });
}

describe('a new calendar day', () => {
  const saved = new Map<string, string>();
  beforeEach(() => {
    vi.resetModules();
    saved.clear();
    installBrowser(saved);
    vi.useFakeTimers();
    vi.setSystemTime(SATURDAY);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function loadStores() {
    const { useFuelStore } = await import('../features/fuel/store/useFuelStore');
    const { initMidnightRolloverListener } = await import('./midnightRollover');
    return { useFuelStore, initMidnightRolloverListener };
  }

  it('drops yesterday’s meals when the app was left open across days', async () => {
    const { useFuelStore, initMidnightRolloverListener } = await loadStores();
    const stop = initMidnightRolloverListener();
    useFuelStore.getState().addMealItem('lunch', LUNCH);
    expect(useFuelStore.getState().meals.lunch).toHaveLength(1);

    vi.setSystemTime(MONDAY);
    await vi.advanceTimersByTimeAsync(61_000);

    expect(useFuelStore.getState().dateKey).toBe('2026-11-02');
    expect(useFuelStore.getState().meals.lunch).toHaveLength(0);
    stop();
  });

  it('drops yesterday’s meals even if the archive step fails', async () => {
    const { useFuelStore, initMidnightRolloverListener } = await loadStores();
    const history = await import('../features/log/store/useTelemetryHistoryStore');
    const stop = initMidnightRolloverListener();
    useFuelStore.getState().addMealItem('lunch', LUNCH);
    vi.spyOn(history, 'getTelemetryHistoryState').mockImplementation(() => {
      throw new Error('archive failed');
    });

    vi.setSystemTime(MONDAY);
    await vi.advanceTimersByTimeAsync(61_000);

    expect(useFuelStore.getState().meals.lunch).toHaveLength(0);
    stop();
  });

  it('clears a leftover log even when the date marker already says today', async () => {
    const { useFuelStore, initMidnightRolloverListener } = await loadStores();
    useFuelStore.getState().addMealItem('lunch', LUNCH);
    // The state a phone is in after an earlier failed rollover: marker moved on, meals did not.
    saved.set('O1FC_LAST_LOG_DATE', JSON.stringify('2026-11-02'));

    vi.setSystemTime(MONDAY);
    const stop = initMidnightRolloverListener();

    expect(useFuelStore.getState().dateKey).toBe('2026-11-02');
    expect(useFuelStore.getState().meals.lunch).toHaveLength(0);
    stop();
  });

  it('shows no meals on a cold start the next day', async () => {
    const first = await loadStores();
    first.useFuelStore.getState().addMealItem('lunch', LUNCH);

    vi.resetModules();
    vi.setSystemTime(MONDAY);
    const second = await loadStores();
    expect(second.useFuelStore.getState().dateKey).toBe('2026-11-02');
    expect(second.useFuelStore.getState().meals.lunch).toHaveLength(0);
  });
});
