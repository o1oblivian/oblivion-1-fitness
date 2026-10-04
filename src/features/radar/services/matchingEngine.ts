import { BuddyProfile } from '../types';

/**
 * Haversine formula calculating distance in kilometers rounded to 1 decimal place.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Calculates weighted match compatibility score and reasons.
 * Discipline (+35), Split (+25), Time (+20), Proximity (+5 to +20).
 */
export function calculateMatchScore(
  user: Partial<BuddyProfile>,
  candidate: BuddyProfile,
  distanceKm: number
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const userDiscipline = (user.discipline || 'Hypertrophy').toLowerCase();
  const candDiscipline = (candidate.discipline || '').toLowerCase();
  if (
    userDiscipline === candDiscipline ||
    candDiscipline.includes(userDiscipline) ||
    userDiscipline.includes(candDiscipline)
  ) {
    score += 35;
    reasons.push(`Discipline Match: ${candidate.discipline}`);
  }

  const userSplit = (user.current_split || 'Push Focus').toLowerCase();
  const candSplit = (candidate.current_split || '').toLowerCase();
  const splitKeywords = ['push', 'pull', 'legs', 'sbd', 'engine', 'upper', 'lower', 'clean', 'snatch'];
  const hasSplitOverlap = splitKeywords.some(
    (kw) => userSplit.includes(kw) && candSplit.includes(kw)
  );

  if (userSplit === candSplit || hasSplitOverlap) {
    score += 25;
    reasons.push(`Split Alignment: ${candidate.current_split}`);
  }

  const userTime = (user.training_time || 'Evening').toLowerCase();
  const candTime = (candidate.training_time || '').toLowerCase();
  if (userTime === candTime) {
    score += 20;
    reasons.push(`Target Window: ${candidate.training_time}`);
  }

  if (distanceKm <= 5) {
    score += 20;
    reasons.push(`Immediate Corridor (<5km)`);
  } else if (distanceKm <= 10) {
    score += 15;
    reasons.push(`Local Radius (<10km)`);
  } else if (distanceKm <= 20) {
    score += 10;
    reasons.push(`Metro Radius (<20km)`);
  } else {
    score += 5;
    reasons.push(`Regional Range`);
  }

  const normalized = Math.min(100, Math.max(10, score));
  return { score: normalized, reasons };
}
