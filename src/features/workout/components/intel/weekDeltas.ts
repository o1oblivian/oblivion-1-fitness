import type { WeekStats } from '../../../report/weeklyIntel';
import type { Tone } from '../../../report/palette';

export interface DeltaRow {
  label: string;
  now: number | null;
  prev: number | null;
  format: (v: number) => string;
  /** 'up' = higher is better, 'neutral' = no judgement. */
  better: 'up' | 'neutral';
}

export const isEmpty = (v: number | null) => v === null || v === 0;

export function deltaCell(row: DeltaRow): { text: string; tone: Tone } {
  if (row.now === null || row.prev === null || (isEmpty(row.now) && isEmpty(row.prev)))
    return { text: '--', tone: 'idle' };
  const diff = row.now - row.prev;
  if (diff === 0) return { text: '0', tone: 'idle' };
  const pct = row.prev !== 0 ? Math.round((diff / row.prev) * 100) : null;
  const text =
    pct === null ? `${diff > 0 ? '+' : ''}${row.format(diff)}` : `${pct > 0 ? '+' : ''}${pct}%`;
  if (row.better === 'neutral') return { text, tone: 'idle' };
  return { text, tone: diff > 0 ? 'good' : 'watch' };
}

export const fmtVal = (row: DeltaRow, v: number | null) =>
  isEmpty(v) ? '--' : row.format(v as number);

export const weekRows = (a: WeekStats, b: WeekStats): DeltaRow[] => [
  { label: 'Sessions', now: a.sessions, prev: b.sessions, format: (v) => String(v), better: 'up' },
  { label: 'Hard sets', now: a.sets, prev: b.sets, format: (v) => String(v), better: 'up' },
  {
    label: 'Total lifted',
    now: a.tonnageKg,
    prev: b.tonnageKg,
    format: (v) => `${(v / 1000).toFixed(1)}t`,
    better: 'neutral',
  },
  {
    label: 'Sleep avg',
    now: a.avgSleepHours,
    prev: b.avgSleepHours,
    format: (v) => `${v}h`,
    better: 'up',
  },
  {
    label: 'Calories avg',
    now: a.avgKcal,
    prev: b.avgKcal,
    format: (v) => String(v),
    better: 'neutral',
  },
  {
    label: 'Protein avg',
    now: a.avgProteinG,
    prev: b.avgProteinG,
    format: (v) => `${v}g`,
    better: 'up',
  },
];
