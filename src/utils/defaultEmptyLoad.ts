import { readAthleteSettingsSnapshot } from './athleteSettingsSnapshot';

export function defaultEmptyLoadKg(equipment?: string): number {
  const eq = String(equipment || '').toLowerCase();
  if (
    !eq ||
    eq.includes('barbell') ||
    eq.includes('olympic') ||
    eq.includes('trap') ||
    eq.includes('smith')
  ) {
    return Math.max(0, readAthleteSettingsSnapshot().defaultBarbellKg || 20);
  }
  return 0;
}
