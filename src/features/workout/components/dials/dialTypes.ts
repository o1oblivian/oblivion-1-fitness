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

type DialKey = 'split_hud' | 'chrono' | 'f1_rack' | 'radar' | 'horizon' | 'quadrant' | 'restoration';

export const DAY_DIAL_MAP: Record<string, DialKey> = {
  Mon: 'split_hud',
  Tue: 'chrono',
  Wed: 'f1_rack',
  Thu: 'radar',
  Fri: 'horizon',
  Sat: 'quadrant',
  Sun: 'restoration',
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
