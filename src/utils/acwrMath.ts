export interface AcwrSnapshot {
  acuteKg: number;
  chronicKg: number;
  ratio: number | null;
  label: string;
  completionPct: number | null;
  calibrating: boolean;
  historyDays: number;
}

/** Acute 7-day mean daily load vs chronic 28-day mean daily load. */
export function computeAcwr(dailyLoadsKg: number[]): AcwrSnapshot {
  const days = dailyLoadsKg.slice(-28);
  const last7 = days.slice(-7);
  const acuteKg = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : 0;
  const chronicKg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
  const historyDays = days.filter((v) => v > 0).length;
  const calibrating = historyDays < 7;

  if (calibrating) {
    return {
      acuteKg,
      chronicKg,
      ratio: null,
      label: 'Calibrating',
      completionPct: null,
      calibrating: true,
      historyDays,
    };
  }

  const ratio = chronicKg > 0 ? Math.round((acuteKg / chronicKg) * 100) / 100 : null;

  let label = '--';
  if (ratio !== null) {
    if (ratio < 0.8) label = 'Underload';
    else if (ratio <= 1.3) label = 'Optimal';
    else if (ratio <= 1.5) label = 'Caution';
    else label = 'High risk';
  }

  return { acuteKg, chronicKg, ratio, label, completionPct: null, calibrating: false, historyDays };
}

export function weekCompletionPct(weekLoadsKg: number[], elapsedDays: number): number | null {
  const window = Math.max(1, Math.min(7, elapsedDays));
  const logged = weekLoadsKg.slice(0, window).filter((v) => v > 0).length;
  if (logged === 0) return null;
  return Math.round((logged / window) * 1000) / 10;
}
