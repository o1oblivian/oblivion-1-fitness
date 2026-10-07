import { describeArc } from './dialTypes';

export const CRIMSON = '#C4121A';
export const AMBER = '#d97706';
export const SKY = '#0284c7';
export const EMERALD = '#059669';
export const HAIR = 'rgba(255,255,255,0.32)';
export const HAIR_SOFT = 'rgba(255,255,255,0.14)';

export const VIEW = 240;
export const CX = 120;
export const CY = 120;

export function fmtInt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return Math.round(n).toLocaleString();
}

export function fmtKm(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return n.toFixed(1);
}

export function pct(value: number, goal: number): number {
  if (!Number.isFinite(value) || value <= 0 || !goal || goal <= 0) return 0;
  return Math.min(100, (value / goal) * 100);
}

export function progressArc(r: number, percent: number, start = -90, sweep = 360): string | null {
  if (percent <= 0.4) return null;
  const end = start + (sweep * percent) / 100;
  return describeArc(CX, CY, r, start, end);
}

export const heroShadow = {
  textShadow: '0 1px 14px rgba(0,0,0,0.55)',
} as const;
