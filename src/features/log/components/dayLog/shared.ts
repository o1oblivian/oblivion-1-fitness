import type { DayMeta, TelemetryCategory } from '../../store/useTelemetryHistoryStore';

/** What the modal shell tells each category form. */
export interface DayLogContext {
  isOpen: boolean;
  dayMeta: DayMeta | null;
  category: TelemetryCategory;
  mode: 'create' | 'edit';
  onSaved?: (msg: string) => void;
}

/**
 * What a form's save() decided:
 * 'stay' keeps the sheet open (a number was missing), 'closed' closes it quietly, 'done' celebrates and closes.
 */
export type SaveOutcome = 'stay' | 'closed' | 'done';

export function readNum(raw: string): number | null {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
