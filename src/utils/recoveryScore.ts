export interface RecoveryReadiness {
  score: number; // 0 - 100
  status: 'optimal' | 'moderate' | 'fatigued';
  statusLabel: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  cnsState: string;
  recommendation: string;
  targetRpeMax: number;
  hasSensorHrv: boolean;
  details: {
    hrvScore: number;
    sleepScore: number;
    rhrScore: number;
    strainFactor: number;
    hrvMs: number | null;
    sleepHours: number;
    restingBpm: number;
  };
}

export interface RecoveryInputs {
  hrvMs?: number;
  sleepHours?: number;
  restingBpm?: number;
  recentWorkouts?: number;
}

/**
 * Calculates a composite 0-100 CNS & Systemic Recovery Score
 * Genuine sensor telemetry: Does not invent or fabricate HRV values.
 */
export function calculateRecoveryScore(inputs: RecoveryInputs = {}): RecoveryReadiness {
  const hasSensorHrv = typeof inputs.hrvMs === 'number' && inputs.hrvMs > 0;
  const hrv = hasSensorHrv ? inputs.hrvMs! : 0;
  const sleep = inputs.sleepHours && inputs.sleepHours > 0 ? inputs.sleepHours : 7.6;
  const rhr = inputs.restingBpm && inputs.restingBpm > 0 ? inputs.restingBpm : 56;
  const workouts = inputs.recentWorkouts ?? 1;

  // 1. HRV Score (35% weight if sensor connected): Baseline 65ms
  let hrvScore = 0;
  if (hasSensorHrv) {
    if (hrv >= 80) hrvScore = 100;
    else if (hrv >= 65) hrvScore = 85 + ((hrv - 65) / 15) * 15;
    else if (hrv >= 50) hrvScore = 65 + ((hrv - 50) / 15) * 20;
    else if (hrv >= 35) hrvScore = 45 + ((hrv - 35) / 15) * 20;
    else hrvScore = Math.max(20, (hrv / 35) * 45);
  }

  // 2. Sleep Score: Optimal 7.5 - 9.0h
  let sleepScore = 80;
  if (sleep >= 7.5 && sleep <= 9.0) sleepScore = 100;
  else if (sleep > 9.0) sleepScore = 90; // Over-sleep / sluggishness
  else if (sleep >= 6.5) sleepScore = 80 + ((sleep - 6.5) / 1.0) * 15;
  else if (sleep >= 5.5) sleepScore = 60 + ((sleep - 5.5) / 1.0) * 20;
  else sleepScore = Math.max(25, (sleep / 5.5) * 60);

  // 3. Resting HR Score: Baseline 50-60 bpm
  let rhrScore = 85;
  if (rhr <= 52) rhrScore = 100;
  else if (rhr <= 60) rhrScore = 90 + ((60 - rhr) / 8) * 10;
  else if (rhr <= 70) rhrScore = 70 + ((70 - rhr) / 10) * 20;
  else if (rhr <= 80) rhrScore = 50 + ((80 - rhr) / 10) * 20;
  else rhrScore = Math.max(20, 50 - (rhr - 80) * 1.5);

  // 4. Strain fatigue penalty
  const strainPenalty = workouts > 3 ? 6 : workouts > 2 ? 3 : 0;

  // Weighted composite based on available genuine telemetry
  const rawScore = hasSensorHrv
    ? Math.round(hrvScore * 0.35 + sleepScore * 0.40 + rhrScore * 0.25 - strainPenalty)
    : Math.round(sleepScore * 0.60 + rhrScore * 0.40 - strainPenalty);
  const score = Math.max(15, Math.min(99, rawScore));

  let status: 'optimal' | 'moderate' | 'fatigued' = 'moderate';
  let statusLabel = 'Moderate Energy';
  let color = '#F59E0B'; // amber-500
  let badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  let badgeBorder = 'border-amber-500/20';
  let cnsState = 'Normal & Steady';
  let recommendation = 'Good day to train. Keep workouts at a steady, comfortable pace.';
  let targetRpeMax = 8.5;

  if (score >= 84) {
    status = 'optimal';
    statusLabel = 'High Energy • Ready';
    color = '#DC2626'; // OFC Crimson (#DC2626)
    badgeBg = 'bg-red-500/10 text-red-600 dark:text-red-400';
    badgeBorder = 'border-red-500/25';
    cnsState = 'Fully Recharged';
    recommendation = 'Great energy today! Ready for heavy lifts and tough workouts.';
    targetRpeMax = 10;
  } else if (score < 65) {
    status = 'fatigued';
    statusLabel = 'Tired / Low Battery';
    color = '#71717A'; // zinc-500
    badgeBg = 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
    badgeBorder = 'border-zinc-500/20';
    cnsState = 'Needs More Rest';
    recommendation = 'Take it lighter today or do some light stretching and walking.';
    targetRpeMax = 7.5;
  }

  return {
    score,
    status,
    statusLabel,
    color,
    badgeBg,
    badgeBorder,
    cnsState,
    recommendation,
    targetRpeMax,
    hasSensorHrv,
    details: {
      hrvScore: Math.round(hrvScore),
      sleepScore: Math.round(sleepScore),
      rhrScore: Math.round(rhrScore),
      strainFactor: strainPenalty,
      hrvMs: hasSensorHrv ? Math.round(hrv) : null,
      sleepHours: Math.round(sleep * 10) / 10,
      restingBpm: Math.round(rhr),
    },
  };
}

const RECOVERY_STORAGE_KEY = 'o1fc_athlete_recovery_v1';

export function getCachedRecoveryScore(): RecoveryReadiness {
  try {
    const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const initial = calculateRecoveryScore();
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function saveCachedRecoveryScore(score: RecoveryReadiness): void {
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(score));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('o1fc_recovery_updated', { detail: score }));
    }
  } catch {}
}
