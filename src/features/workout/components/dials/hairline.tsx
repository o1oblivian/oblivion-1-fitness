import React from 'react';
import { DialComponentProps, describeArc, polarToCartesian } from './dialTypes';
import { fmtInt, fmtKm, pct } from './dialFormat';
import { COLOR } from '../../../../theme/colors';

/** Hairline dial kit: flat ink, 1 px rules, coloured data. No plates, blur or text outlines. */
export const INK = COLOR.dialInk;
export const MUTED = 'rgba(244,242,234,0.8)';
export const TRACK = 'rgba(244,242,234,0.3)';
export const EMERALD = COLOR.emerald;
export const CRIMSON = COLOR.dialCrimson;
export const AMBER = COLOR.yellow;
export const SKY = COLOR.dialSky;

export interface DialPalette {
  steps: string;
  burn: string;
  intake: string;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

export const CX = 120;
export const CY = 112;

export const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** 0..1 progress for the three tracked metrics; 0 whenever a goal or value is missing. */
export function dialRatios(p: DialComponentProps) {
  return {
    steps: pct(p.steps, p.stepTarget) / 100,
    burn: pct(p.burnKcal, p.goalMove) / 100,
    intake: pct(p.intakeKcal, p.intakeGoal) / 100,
  };
}

interface TxtProps {
  x: number;
  y: number;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  font?: 'mono' | 'serif';
  spacing?: string;
  children: React.ReactNode;
}

export function Txt({
  x,
  y,
  size = 11,
  weight = 400,
  anchor = 'middle',
  color = INK,
  font,
  spacing,
  children,
}: TxtProps) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      dominantBaseline="central"
      fill={color}
      fontFamily={font === 'mono' ? MONO : font === 'serif' ? SERIF : 'inherit'}
      style={{ letterSpacing: spacing }}
    >
      {children}
    </text>
  );
}

export function StepsLabel({ x = CX, y, color }: { x?: number; y: number; color: string }) {
  return (
    <Txt x={x} y={y} size={11} weight={600} color={color} spacing="0.2em">
      STEPS
    </Txt>
  );
}

export function HeroSteps({
  x = CX,
  y,
  size,
  steps,
}: {
  x?: number;
  y: number;
  size: number;
  steps: number;
}) {
  return (
    <Txt x={x} y={y} size={size} weight={300}>
      {fmtInt(steps)}
    </Txt>
  );
}

const arcAt = (cx: number, cy: number, r: number, start: number, end: number) =>
  describeArc(cx, cy, r, start, Math.min(end, start + 359.9));

interface RingProps {
  cx?: number;
  cy?: number;
  r: number;
  ratio: number;
  color: string;
  width?: number;
  start?: number;
  sweep?: number;
  /** Draw a dot at the end of the progress arc. */
  tip?: boolean;
}

/** Hairline track with a coloured progress arc. Draws only the track until the metric has data. */
export function Ring({
  cx = CX,
  cy = CY,
  r,
  ratio,
  color,
  width = 2.2,
  start = 0,
  sweep = 360,
  tip,
}: RingProps) {
  const f = clamp01(ratio);
  const end = start + sweep * f;
  const tipPoint = polarToCartesian(cx, cy, r, Math.min(end, start + 359.9));
  return (
    <>
      <path d={arcAt(cx, cy, r, start, start + sweep)} fill="none" stroke={TRACK} strokeWidth="1" />
      {f > 0 && (
        <path
          d={arcAt(cx, cy, r, start, end)}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
        />
      )}
      {tip && f > 0 && <circle cx={tipPoint.x} cy={tipPoint.y} r={3.4} fill={color} />}
    </>
  );
}

export function Line({
  x1,
  y1,
  x2,
  y2,
  color = INK,
  opacity = 1,
  width = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
  width?: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

/** One radial tick at `angle`, from radius `r` inwards by `len`. */
export function RadialTick({
  cx = CX,
  cy = CY,
  r,
  len,
  angle,
  color = INK,
  opacity = 1,
  width = 1,
}: {
  cx?: number;
  cy?: number;
  r: number;
  len: number;
  angle: number;
  color?: string;
  opacity?: number;
  width?: number;
}) {
  const a = polarToCartesian(cx, cy, r, angle);
  const b = polarToCartesian(cx, cy, r - len, angle);
  return <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={color} opacity={opacity} width={width} />;
}

/** Thin hand with a short tail, ending in a hollow hub. */
export function Hand({
  cx = CX,
  cy = CY,
  angle,
  length,
  tail = 14,
  color,
  hub = 4,
}: {
  cx?: number;
  cy?: number;
  angle: number;
  length: number;
  tail?: number;
  color: string;
  hub?: number;
}) {
  const tip = polarToCartesian(cx, cy, length, angle);
  const back = polarToCartesian(cx, cy, -tail, angle);
  return (
    <>
      <Line x1={back.x} y1={back.y} x2={tip.x} y2={tip.y} color={color} width={1.4} />
      <circle cx={cx} cy={cy} r={hub} fill="none" stroke={color} strokeWidth="1.4" />
    </>
  );
}

interface FrameProps {
  palette: DialPalette;
  burnKcal: number;
  distKm: number;
  intakeKcal: number;
  children: React.ReactNode;
}

/** Same bottom strip on every day: burn, distance, intake. Unread values stay `--`. */
function Strip({ palette, burnKcal, distKm, intakeKcal }: Omit<FrameProps, 'children'>) {
  const items = [
    { x: 50, color: palette.burn, value: fmtInt(burnKcal), unit: 'KCAL' },
    { x: 120, color: palette.steps, value: fmtKm(distKm), unit: 'KM' },
    { x: 190, color: palette.intake, value: fmtInt(intakeKcal), unit: 'IN' },
  ];
  return (
    <>
      <Line x1={40} y1={228} x2={200} y2={228} color={INK} opacity={0.25} />
      {items.map((it) => (
        <React.Fragment key={it.unit}>
          <Txt x={it.x} y={240} size={15} weight={500} color={it.color}>
            {it.value}
          </Txt>
          <Txt x={it.x} y={256} size={11} color={MUTED} spacing="0.16em">
            {it.unit}
          </Txt>
        </React.Fragment>
      ))}
    </>
  );
}

export function DialFrame({ children, ...strip }: FrameProps) {
  return (
    <svg
      width={224}
      height={252}
      viewBox="0 0 240 270"
      className="block max-w-full mx-auto select-none pointer-events-none"
      aria-hidden="true"
    >
      {children}
      <Strip {...strip} />
    </svg>
  );
}
