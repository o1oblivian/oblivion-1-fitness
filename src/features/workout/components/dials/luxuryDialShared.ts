export const CRIMSON = '#C4121A';
export const AMBER = '#d97706';
export const SKY = '#0284c7';
export const EMERALD = '#059669';
export const HAIR = 'rgba(255,255,255,0.32)';
export const HAIR_SOFT = 'rgba(255,255,255,0.18)';

export function fmtInt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '--';
  return Math.round(n).toLocaleString();
}

export function fmtKm(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '--';
  return n.toFixed(1);
}

export function pct(value: number, goal: number): number {
  if (!Number.isFinite(value) || value <= 0 || !goal || goal <= 0) return 0;
  return Math.min(100, (value / goal) * 100);
}
