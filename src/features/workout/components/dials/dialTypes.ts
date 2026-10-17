export interface DialComponentProps {
  steps: number;
  stepTarget: number;
  burnKcal: number;
  goalMove: number;
  distKm: number;
  goalDist: number;
  intakeKcal: number;
  /** 0 when the athlete has not set a calorie target; the intake bar then stays empty. */
  intakeGoal: number;
  /** null when nothing is logged for that day. */
  hydrationPct: number | null;
  sleepHours: number | null;
  activeDay: string;
  splitLabel: string;
}

type DialKey = 'rings' | 'chrono' | 'speedo' | 'ticks' | 'gauges' | 'tapes' | 'orbits';

export const DAY_DIAL_MAP: Record<string, DialKey> = {
  Mon: 'rings',
  Tue: 'chrono',
  Wed: 'speedo',
  Thu: 'ticks',
  Fri: 'gauges',
  Sat: 'tapes',
  Sun: 'orbits',
};

export const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
  const rad = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

export const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};
