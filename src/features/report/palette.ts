import { COLOR } from '../../theme/colors';
/**
 * Natural status tones from the O1FC palette: emerald in range, amber caution, crimson alert.
 */
export const GOOD = COLOR.emerald;
const WATCH = COLOR.yellow;
const ALERT = COLOR.crimson;
const IDLE = COLOR.faint;

export type Tone = 'good' | 'watch' | 'alert' | 'idle';

export const TONE_HEX: Record<Tone, string> = {
  good: GOOD,
  watch: WATCH,
  alert: ALERT,
  idle: IDLE,
};

export const TONE_TEXT: Record<Tone, string> = {
  good: 'text-o1-emerald',
  watch: 'text-o1-yellow',
  alert: 'text-o1-crimson',
  idle: 'text-o1-muted',
};

export const TONE_CHIP: Record<Tone, string> = {
  good: 'text-o1-emerald border-o1-emerald/30',
  watch: 'text-o1-yellow border-o1-yellow/30',
  alert: 'text-o1-crimson border-o1-crimson/30',
  idle: 'text-o1-muted border-white/[0.07]',
};

export function toneForScore(value: number | null): Tone {
  if (value === null) return 'idle';
  if (value >= 70) return 'good';
  if (value >= 45) return 'watch';
  return 'alert';
}
