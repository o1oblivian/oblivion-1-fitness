export interface DialProps {
  dailySteps: number;
  stepTarget?: number;
  dailyMove: number;
  goalMove?: number;
  dailyDist: number;
  goalDist?: number;
  dailyIntake?: number;
  onOpenStepDial?: () => void;
}

export interface DialComponentProps {
  steps: number;
  stepTarget: number;
  burnKcal: number;
  goalMove: number;
  distKm: number;
  goalDist: number;
  intakeKcal: number;
  activeDay: string;
  splitLabel: string;
}

export const DIAL_PRESETS = [
  { key: 'split_hud', label: 'Mon: Aerospace Split HUD' },
  { key: 'chrono', label: 'Tue: Horology Chronograph' },
  { key: 'f1_rack', label: 'Wed: F1 Telemetry Rack' },
  { key: 'radar', label: 'Thu: Constellation Radar' },
  { key: 'horizon', label: 'Fri: Dual-Arc Horizon' },
  { key: 'quadrant', label: 'Sat: Modular Quadrant' },
  { key: 'restoration', label: 'Sun: Restoration Monolith' },
] as const;

export type DialKey = typeof DIAL_PRESETS[number]['key'];

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
