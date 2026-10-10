export const QUICK_REPLIES = [
  'Great session',
  'Form approved',
  'Add 5 kg next time',
  'Deload next session',
  'Slow down the reps',
  'Rest day tomorrow',
  'Eat more protein',
  'Get more sleep',
] as const;

export interface ReviewBadge {
  label: string;
  tone: 'ok' | 'warn';
}

const BADGES: Partial<Record<(typeof QUICK_REPLIES)[number], ReviewBadge>> = {
  'Great session': { label: '✓ Great Session', tone: 'ok' },
  'Form approved': { label: '✓ Form Approved', tone: 'ok' },
  'Add 5 kg next time': { label: '↑ +5 kg Next Session', tone: 'ok' },
  'Deload next session': { label: '⚡ Deload Assigned', tone: 'warn' },
  'Rest day tomorrow': { label: '⏸ Rest Day Set', tone: 'warn' },
};

/** Review status for a quick reply the coach sent; free-form notes have no badge. */
export function reviewBadge(feedback: string | undefined): ReviewBadge | null {
  if (!feedback) return null;
  return BADGES[feedback.trim() as (typeof QUICK_REPLIES)[number]] ?? null;
}
