import { toDayKey } from './reportEngine';

/**
 * Manually entered DEXA scan results. Oblivion does not measure body composition;
 * everything here is copied by the user from their clinical scan report and kept on this device.
 */
export type LeanSegment = 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | 'trunk';

export const LEAN_SEGMENTS: { id: LeanSegment; label: string }[] = [
  { id: 'leftArm', label: 'Left arm' },
  { id: 'rightArm', label: 'Right arm' },
  { id: 'leftLeg', label: 'Left leg' },
  { id: 'rightLeg', label: 'Right leg' },
  { id: 'trunk', label: 'Trunk' },
];

export interface DexaScan {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  bodyFatPct: number;
  /** Lean mass in kg per segment; only the segments the user entered. */
  lean: Partial<Record<LeanSegment, number>>;
}

export interface DexaDraft {
  date: string;
  bodyFatPct: string;
  lean: Record<LeanSegment, string>;
}

const KEY = 'o1fc_dexa_scans_v1';

export const emptyDraft = (now = Date.now()): DexaDraft => ({
  date: toDayKey(now),
  bodyFatPct: '',
  lean: { leftArm: '', rightArm: '', leftLeg: '', rightLeg: '', trunk: '' },
});

export const draftFromScan = (scan: DexaScan): DexaDraft => ({
  date: scan.date,
  bodyFatPct: String(scan.bodyFatPct),
  lean: {
    leftArm: scan.lean.leftArm?.toString() ?? '',
    rightArm: scan.lean.rightArm?.toString() ?? '',
    leftLeg: scan.lean.leftLeg?.toString() ?? '',
    rightLeg: scan.lean.rightLeg?.toString() ?? '',
    trunk: scan.lean.trunk?.toString() ?? '',
  },
});

export function readDexaScans(): DexaScan[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as DexaScan[])
      .filter((s) => s && typeof s.id === 'string' && typeof s.date === 'string' && Number.isFinite(s.bodyFatPct))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch {
    return [];
  }
}

function write(scans: DexaScan[]): DexaScan[] {
  const sorted = [...scans].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  try {
    localStorage.setItem(KEY, JSON.stringify(sorted));
  } catch {
    // storage unavailable: caller still gets the in-memory list for this session
  }
  return sorted;
}

export function upsertDexaScan(scan: DexaScan): DexaScan[] {
  const rest = readDexaScans().filter((s) => s.id !== scan.id);
  return write([...rest, scan]);
}

export function deleteDexaScan(id: string): DexaScan[] {
  return write(readDexaScans().filter((s) => s.id !== id));
}

/** Validates a form draft. Returns the scan or a single human-readable error. */
export function parseDraft(
  draft: DexaDraft,
  id: string | null,
  now = Date.now(),
): { scan: DexaScan } | { error: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return { error: 'Enter the scan date.' };
  if (draft.date > toDayKey(now)) return { error: 'The scan date cannot be in the future.' };

  const bf = Number(draft.bodyFatPct);
  if (!draft.bodyFatPct.trim() || !Number.isFinite(bf) || bf < 2 || bf > 60) {
    return { error: 'Body fat must be between 2 and 60 %.' };
  }

  const lean: DexaScan['lean'] = {};
  for (const seg of LEAN_SEGMENTS) {
    const text = draft.lean[seg.id].trim();
    if (!text) continue;
    const value = Number(text);
    if (!Number.isFinite(value) || value <= 0 || value > 60) {
      return { error: `${seg.label} lean mass must be between 0 and 60 kg.` };
    }
    lean[seg.id] = Math.round(value * 100) / 100;
  }

  return {
    scan: {
      id: id ?? `dexa-${now}`,
      date: draft.date,
      bodyFatPct: Math.round(bf * 10) / 10,
      lean,
    },
  };
}

export function scanAgeDays(scan: DexaScan, now = Date.now()): number {
  const [y, m, d] = scan.date.split('-').map(Number);
  const scanMs = new Date(y, (m || 1) - 1, d || 1).getTime();
  return Math.max(0, Math.floor((now - scanMs) / 86_400_000));
}

/** Left minus right difference in kg for a limb pair, or null if either side was not entered. */
export function limbGap(scan: DexaScan, pair: 'arm' | 'leg'): number | null {
  const left = pair === 'arm' ? scan.lean.leftArm : scan.lean.leftLeg;
  const right = pair === 'arm' ? scan.lean.rightArm : scan.lean.rightLeg;
  if (left === undefined || right === undefined) return null;
  return Math.round((left - right) * 100) / 100;
}
