/**
 * Natural status tones from the O1FC palette: emerald in range, amber caution, crimson alert.
 */
export const GOOD = '#10b981';
const WATCH = '#f7c600';
const ALERT = '#C4121A';
const IDLE = '#7A756A';

export type Tone = 'good' | 'watch' | 'alert' | 'idle';

export const TONE_HEX: Record<Tone, string> = {
  good: GOOD,
  watch: WATCH,
  alert: ALERT,
  idle: IDLE,
};

export const TONE_TEXT: Record<Tone, string> = {
  good: 'text-[#10b981]',
  watch: 'text-[#f7c600]',
  alert: 'text-o1-crimson',
  idle: 'text-o1-muted',
};

export const TONE_CHIP: Record<Tone, string> = {
  good: 'text-[#10b981] border-[#10b981]/30',
  watch: 'text-[#f7c600] border-[#f7c600]/30',
  alert: 'text-o1-crimson border-o1-crimson/30',
  idle: 'text-o1-muted border-white/[0.07]',
};

export function toneForScore(value: number | null): Tone {
  if (value === null) return 'idle';
  if (value >= 70) return 'good';
  if (value >= 45) return 'watch';
  return 'alert';
}
