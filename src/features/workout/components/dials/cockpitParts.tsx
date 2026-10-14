import React, { useId } from 'react';
import { polarToCartesian } from './dialTypes';
import { CRIMSON, HAIR, HAIR_SOFT } from './luxuryDialShared';

export const INK = '#EAE8DF';
export const MUTED = 'rgba(234,232,223,0.82)';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** SVG ids must not contain the colons React's useId produces. */
export function useSvgId(prefix: string): string {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

interface TextProps {
  x: number;
  y: number;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  mono?: boolean;
  spacing?: string;
  children: React.ReactNode;
}

export function T({ x, y, size = 11, weight, anchor = 'middle', color = INK, mono, spacing, children }: TextProps) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight ?? (size >= 16 ? 300 : 400)}
      textAnchor={anchor}
      dominantBaseline="central"
      fill={color}
      stroke="rgba(0,0,0,0.7)"
      strokeWidth={size >= 16 ? 3 : 2.4}
      strokeLinejoin="round"
      paintOrder="stroke"
      fontFamily={mono ? MONO : 'inherit'}
      style={{ letterSpacing: spacing }}
    >
      {children}
    </text>
  );
}

export function Bezel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={HAIR_SOFT} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={HAIR} strokeWidth="0.8" />
    </>
  );
}

interface TickProps {
  cx: number;
  cy: number;
  r: number;
  count: number;
  start?: number;
  sweep?: number;
  majorEvery?: number;
  majorLen?: number;
  minorLen?: number;
}

export function Ticks({ cx, cy, r, count, start = 0, sweep = 360, majorEvery = 5, majorLen = 8, minorLen = 4 }: TickProps) {
  const closed = sweep >= 360;
  const n = closed ? count : count + 1;
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const angle = start + (sweep * i) / count;
        const major = i % majorEvery === 0;
        const a = polarToCartesian(cx, cy, r, angle);
        const b = polarToCartesian(cx, cy, r - (major ? majorLen : minorLen), angle);
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={major ? INK : HAIR}
            strokeOpacity={major ? 0.85 : 1}
            strokeWidth={major ? 1.4 : 0.8}
          />
        );
      })}
    </>
  );
}

interface NeedleProps {
  cx: number;
  cy: number;
  angle: number;
  length: number;
  width?: number;
  tail?: number;
  color?: string;
}

export function Needle({ cx, cy, angle, length, width = 3, tail = 12, color = CRIMSON }: NeedleProps) {
  return (
    <path
      d={`M ${cx - width / 2} ${cy + tail} L ${cx} ${cy - length} L ${cx + width / 2} ${cy + tail} Z`}
      fill={color}
      stroke="rgba(0,0,0,0.5)"
      strokeWidth="0.6"
      transform={`rotate(${angle} ${cx} ${cy})`}
    />
  );
}

export function Hub({ cx, cy, r = 4.5, color = CRIMSON }: { cx: number; cy: number; r?: number; color?: string }) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1.5" />;
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const a = polarToCartesian(cx, cy, r, start);
  const b = polarToCartesian(cx, cy, r, end);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
}

/** Coloured progress arc; draws nothing until the metric has data. */
export function ProgressRing({ cx, cy, r, ratio, color, start = 0, sweep = 360, width = 4 }: {
  cx: number; cy: number; r: number; ratio: number; color: string; start?: number; sweep?: number; width?: number;
}) {
  const f = clamp01(ratio);
  if (f <= 0) return null;
  if (sweep >= 360 && f >= 1) return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={width} />;
  return <path d={arcPath(cx, cy, r, start, start + sweep * f)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
}

interface WindowProps {
  x: number;
  y: number;
  w: number;
  h: number;
  size?: number;
  color?: string;
  children: React.ReactNode;
}

export function Readout({ x, y, w, h, size = 13, color = INK, children }: WindowProps) {
  return (
    <T x={x + w / 2} y={y + h / 2 + 0.5} size={size} mono color={color}>
      {children}
    </T>
  );
}

/** Fixed aircraft reference symbol used on attitude displays. */
export function AircraftSymbol({ cx, cy, span = 46, color = CRIMSON }: { cx: number; cy: number; span?: number; color?: string }) {
  const inner = span * 0.34;
  return (
    <g stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M ${cx - span} ${cy} H ${cx - inner} L ${cx - inner + 6} ${cy + 7}`} />
      <path d={`M ${cx + span} ${cy} H ${cx + inner} L ${cx + inner - 6} ${cy + 7}`} />
      <circle cx={cx} cy={cy} r={2.4} fill={color} stroke="none" />
    </g>
  );
}
