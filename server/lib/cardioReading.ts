export type CardioDevice = 'watch' | 'console';

/** A pulse outside this range is not a reading. Consoles show 0 when no strap or grip is sensed. */
const MIN_BPM = 25;
const MAX_BPM = 250;

export function plausibleHeartRate(bpm: number | null): number | null {
  return bpm !== null && bpm >= MIN_BPM && bpm <= MAX_BPM ? bpm : null;
}

/**
 * Speed, incline and watts only appear on gym machines. A console that advertises Apple Watch or
 * Galaxy Watch pairing is still a console, and calling it a watch would replace the day's log.
 */
export function cardioDevice(
  reported: unknown,
  machineOnly: { speedKmh: number | null; inclinePct: number | null; watts: number | null },
  fallback: CardioDevice | null,
): CardioDevice | null {
  const machine =
    machineOnly.speedKmh !== null || machineOnly.inclinePct !== null || machineOnly.watts !== null;
  if (machine || reported === 'CONSOLE') return 'console';
  if (reported === 'WATCH') return 'watch';
  return fallback;
}
