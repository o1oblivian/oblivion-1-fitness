/**
 * Organic vivid status tones. In-range is lake teal, caution is raw gold, alert is crimson.
 */
export const GOOD = '#4F8F9A';
export const WATCH = '#D4A017';
export const ALERT = '#C4121A';
export const IDLE = '#7A756A';

export type Tone = 'good' | 'watch' | 'alert' | 'idle';

export const TONE_HEX: Record<Tone, string> = {
  good: GOOD,
  watch: WATCH,
  alert: ALERT,
  idle: IDLE,
};

export const TONE_TEXT: Record<Tone, string> = {
  good: 'text-o1-ok',
  watch: 'text-o1-caution',
  alert: 'text-o1-crimson',
  idle: 'text-o1-stone',
};

export const TONE_CHIP: Record<Tone, string> = {
  good: 'text-o1-ok border-o1-ok/30',
  watch: 'text-o1-caution border-o1-caution/30',
  alert: 'text-o1-crimson border-o1-crimson/30',
  idle: 'text-o1-stone border-white/[0.07]',
};

export function toneForScore(value: number | null): Tone {
  if (value === null) return 'idle';
  if (value >= 70) return 'good';
  if (value >= 45) return 'watch';
  return 'alert';
}
