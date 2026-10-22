import type { WeighIn } from '../report/types';
import { dayIndex } from '../report/reportEngine';

/** How far each new weigh-in pulls the trend, per day. Low enough that one salty meal cannot move it. */
const SMOOTHING_PER_DAY = 0.1;
/** Within this distance of the goal, the goal counts as reached. */
const REACHED_WITHIN_KG = 0.3;
/** Weekly change under this is noise, not progress. */
const MIN_MEANINGFUL_KG_PER_WEEK = 0.1;
/** Losing or gaining faster than this share of bodyweight per week is too aggressive to keep up. */
const MAX_PERCENT_PER_WEEK = 1;
/** Further out than this the estimate is not worth showing. */
const MAX_ETA_WEEKS = 104;

export interface TrendPoint {
  day: string;
  /** What the scale said. */
  kg: number;
  /** The smoothed weight: where you are once daily water swings are taken out. */
  trendKg: number;
}

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Oldest first, one entry per day (the last one given wins). */
function onePerDay(entries: WeighIn[]): WeighIn[] {
  const byDay = new Map<string, WeighIn>();
  for (const entry of entries) {
    if (entry.kg > 0 && Number.isFinite(entry.kg)) byDay.set(entry.day, entry);
  }
  return [...byDay.values()].sort((a, b) => dayIndex(a.day) - dayIndex(b.day));
}

/** Exponentially smoothed weight. A gap in weighing makes the next entry count for more. */
export function trendSeries(entries: WeighIn[]): TrendPoint[] {
  const days = onePerDay(entries);
  const out: TrendPoint[] = [];
  let trend = 0;
  let previous = 0;
  days.forEach((entry, i) => {
    const at = dayIndex(entry.day);
    if (i === 0) {
      trend = entry.kg;
    } else {
      const pull = 1 - Math.pow(1 - SMOOTHING_PER_DAY, at - previous);
      trend += pull * (entry.kg - trend);
    }
    previous = at;
    out.push({ day: entry.day, kg: entry.kg, trendKg: round2(trend) });
  });
  return out;
}

/** Change in the trend over the last `days`, or null before there is enough history to say. */
export function trendChangeKg(series: TrendPoint[], days = 7): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const lastAt = dayIndex(last.day);
  let base: TrendPoint | undefined;
  for (const point of series) {
    if (lastAt - dayIndex(point.day) >= days) base = point;
  }
  if (!base) {
    const first = series[0];
    if (lastAt - dayIndex(first.day) < 3) return null;
    base = first;
  }
  return round1(last.trendKg - base.trendKg);
}

/**
 * Kilograms per week, from a straight-line fit through the scale readings of the last
 * `windowDays`. Null until there are three readings spread over at least five days.
 */
export function weeklyRateKg(series: TrendPoint[], windowDays = 14): number | null {
  if (series.length < 3) return null;
  const lastAt = dayIndex(series[series.length - 1].day);
  const recent = series.filter((p) => lastAt - dayIndex(p.day) < windowDays);
  if (recent.length < 3) return null;
  const firstAt = dayIndex(recent[0].day);
  if (lastAt - firstAt < 5) return null;

  const xs = recent.map((p) => dayIndex(p.day) - firstAt);
  const ys = recent.map((p) => p.kg);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let covariance = 0;
  let variance = 0;
  xs.forEach((x, i) => {
    covariance += (x - meanX) * (ys[i] - meanY);
    variance += (x - meanX) ** 2;
  });
  if (variance === 0) return null;
  return round2((covariance / variance) * 7);
}

export type PaceVerdict = 'steady' | 'on-track' | 'too-fast' | 'too-slow' | 'wrong-way';

export interface GoalProgress {
  /** Target minus current: negative when the goal is below where you are. */
  remainingKg: number;
  reached: boolean;
  etaWeeks: number | null;
  verdict: PaceVerdict | null;
}

/** Where the athlete stands against the goal weight. Null when there is no goal or no weight. */
export function goalProgress(
  currentKg: number,
  targetKg: number,
  rateKgPerWeek: number | null,
): GoalProgress | null {
  if (!(currentKg > 0) || !(targetKg > 0)) return null;
  const remainingKg = round1(targetKg - currentKg);
  if (Math.abs(remainingKg) <= REACHED_WITHIN_KG) {
    return { remainingKg, reached: true, etaWeeks: null, verdict: 'steady' };
  }
  if (rateKgPerWeek === null) {
    return { remainingKg, reached: false, etaWeeks: null, verdict: null };
  }
  if (Math.abs(rateKgPerWeek) < MIN_MEANINGFUL_KG_PER_WEEK) {
    return { remainingKg, reached: false, etaWeeks: null, verdict: 'too-slow' };
  }
  if (rateKgPerWeek * remainingKg < 0) {
    return { remainingKg, reached: false, etaWeeks: null, verdict: 'wrong-way' };
  }
  const weeks = Math.ceil(Math.abs(remainingKg / rateKgPerWeek));
  const percentPerWeek = (Math.abs(rateKgPerWeek) / currentKg) * 100;
  return {
    remainingKg,
    reached: false,
    etaWeeks: weeks <= MAX_ETA_WEEKS ? weeks : null,
    verdict: percentPerWeek > MAX_PERCENT_PER_WEEK ? 'too-fast' : 'on-track',
  };
}
