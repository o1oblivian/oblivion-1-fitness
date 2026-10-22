import React from 'react';
import { dayIndex } from '../report/reportEngine';
import type { TrendPoint } from './weightTrend';

const WIDTH = 300;
const HEIGHT = 84;
const INSET = 8;
/** The chart always spans at least a week, so two weigh-ins do not stretch across the whole card. */
const MIN_SPAN_DAYS = 7;
const MAX_SPAN_DAYS = 29;

interface WeightSparklineProps {
  series: TrendPoint[];
  /** Goal weight in kg. Drawn only when it sits near the data, so it never flattens the line. */
  goalKg: number | null;
  /** Spoken summary for screen readers. */
  description: string;
}

/**
 * The last month of weigh-ins: dots for what the scale said, a line for the smoothed trend,
 * and a dashed line for the goal.
 */
export const WeightSparkline: React.FC<WeightSparklineProps> = ({
  series,
  goalKg,
  description,
}) => {
  if (series.length === 0) return null;

  const lastAt = dayIndex(series[series.length - 1].day);
  const firstAt = Math.max(dayIndex(series[0].day), lastAt - MAX_SPAN_DAYS);
  const span = Math.min(MAX_SPAN_DAYS, Math.max(MIN_SPAN_DAYS, lastAt - firstAt));
  const startAt = lastAt - span;
  const visible = series.filter((p) => dayIndex(p.day) >= startAt);

  const values = visible.flatMap((p) => [p.kg, p.trendKg]);
  let low = Math.min(...values);
  let high = Math.max(...values);
  const reach = Math.max(high - low, 2);
  const showGoal =
    goalKg != null && goalKg > 0 && Math.abs(goalKg - (low + high) / 2) <= reach * 1.5;
  if (showGoal && goalKg != null) {
    low = Math.min(low, goalKg);
    high = Math.max(high, goalKg);
  }
  const pad = Math.max((high - low) * 0.15, 0.3);
  low -= pad;
  high += pad;

  const x = (day: string) => INSET + ((dayIndex(day) - startAt) / span) * (WIDTH - INSET * 2);
  const y = (kg: number) => INSET + ((high - kg) / (high - low)) * (HEIGHT - INSET * 2);

  const trendPath = visible
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)} ${y(p.trendKg).toFixed(1)}`)
    .join(' ');
  const latest = visible[visible.length - 1];

  return (
    <svg
      role="img"
      aria-label={description}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full overflow-visible"
    >
      {showGoal && goalKg != null ? (
        <line
          x1={INSET}
          x2={WIDTH - INSET}
          y1={y(goalKg)}
          y2={y(goalKg)}
          strokeDasharray="4 4"
          strokeWidth={1}
          className="stroke-o1-gold/70"
        />
      ) : null}
      {visible.map((p) => (
        <circle key={p.day} cx={x(p.day)} cy={y(p.kg)} r={2} className="fill-white/35" />
      ))}
      {visible.length > 1 ? (
        <path
          d={trendPath}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-o1-crimson"
        />
      ) : null}
      <circle cx={x(latest.day)} cy={y(latest.trendKg)} r={3.5} className="fill-o1-crimson" />
    </svg>
  );
};
