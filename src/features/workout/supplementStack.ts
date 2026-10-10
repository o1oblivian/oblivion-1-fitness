import { toDayKey } from '../report/reportEngine';

export interface SupplementItem {
  id: string;
  name: string;
  dose: string;
  timing: 'Morning' | 'Evening';
  taken: boolean;
}

interface StoredStack {
  items: { id: string; name: string; dose: string; timing: 'Morning' | 'Evening' }[];
  /** Day key (YYYY-MM-DD) → ids marked taken that day. */
  takenByDay: Record<string, string[]>;
}

const KEY = 'o1fc_supplement_stack_v1';

function read(): StoredStack {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [], takenByDay: {} };
    const parsed = JSON.parse(raw) as Partial<StoredStack>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      takenByDay: parsed.takenByDay && typeof parsed.takenByDay === 'object' ? parsed.takenByDay : {},
    };
  } catch {
    return { items: [], takenByDay: {} };
  }
}

/** The user's own stack with today's taken flags. Empty until the user adds supplements. */
export function loadSupplementStack(now = Date.now()): SupplementItem[] {
  const stored = read();
  const taken = new Set(stored.takenByDay[toDayKey(now)] ?? []);
  return stored.items.map((item) => ({ ...item, taken: taken.has(item.id) }));
}

export function saveSupplementStack(items: SupplementItem[], now = Date.now()): void {
  const stored = read();
  const today = toDayKey(now);
  const takenByDay: Record<string, string[]> = {};
  // Keep two weeks of history so old days don't grow the key forever.
  Object.keys(stored.takenByDay)
    .sort()
    .slice(-14)
    .forEach((day) => {
      if (day !== today) takenByDay[day] = stored.takenByDay[day];
    });
  takenByDay[today] = items.filter((i) => i.taken).map((i) => i.id);
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        items: items.map(({ id, name, dose, timing }) => ({ id, name, dose, timing })),
        takenByDay,
      } satisfies StoredStack),
    );
  } catch {
    // storage unavailable: stack stays in memory for this session
  }
}

export function supplementStatus(now = Date.now()): { taken: number; total: number } {
  const items = loadSupplementStack(now);
  return { taken: items.filter((i) => i.taken).length, total: items.length };
}
