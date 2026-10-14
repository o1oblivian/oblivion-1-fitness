import React from 'react';
import { DialComponentProps } from './dialTypes';
import { AMBER, CRIMSON, HAIR, fmtInt, fmtKm, pct } from './luxuryDialShared';
import { AircraftSymbol, INK, MUTED, Readout, T, useSvgId } from './cockpitParts';

const MID = 124;
const TOP = 40;
const BOTTOM = 208;
const SPACING = 22;

function Tape({ x, w, label, value, step, labelEvery, format, align }: {
  x: number; w: number; label: string; value: number; step: number; labelEvery: number;
  format: (v: number) => string; align: 'left' | 'right';
}) {
  const clipId = useSvgId('tape');
  const base = Math.floor(value / step);
  const marks = Array.from({ length: 13 }, (_, i) => base - 6 + i).filter((k) => k >= 0);
  const tickX = align === 'left' ? x + w - 8 : x;
  const textX = align === 'left' ? x + w - 12 : x + 12;
  return (
    <>
      <T x={x + w / 2} y={TOP - 14} color={MUTED} spacing="0.12em">{label}</T>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={TOP} width={w} height={BOTTOM - TOP} />
        </clipPath>
      </defs>
      <rect x={x} y={TOP} width={w} height={BOTTOM - TOP} rx={2} fill="none" stroke={HAIR} strokeWidth="0.8" />
      <g clipPath={`url(#${clipId})`}>
        {marks.map((k) => {
          const y = MID - ((k * step - value) / step) * SPACING;
          const labelled = k % labelEvery === 0 && Math.abs(y - MID) > 16;
          return (
            <g key={k}>
              <line x1={tickX} x2={tickX + 8} y1={y} y2={y} stroke={INK} strokeOpacity={labelled ? 0.85 : 0.45} strokeWidth="1" />
              {labelled && (
                <T x={textX} y={y} anchor={align === 'left' ? 'end' : 'start'} mono color={MUTED}>
                  {format(k * step)}
                </T>
              )}
            </g>
          );
        })}
      </g>
      <Readout x={x - 2} y={MID - 12} w={w + 4} h={24} size={13}>{fmtInt(value)}</Readout>
    </>
  );
}

/** Saturday: primary flight display. Steps tape, burn tape, intake on the horizon. */
export const SaturdayQuadrantDial: React.FC<DialComponentProps> = ({ steps, burnKcal, distKm, intakeKcal, intakeGoal }) => {
  const clipId = useSvgId('pfd');
  const intakePct = pct(intakeKcal, intakeGoal);
  const horizonY = MID + 40 - intakePct * 0.8;

  return (
    <svg width={300} height={250} viewBox="0 0 300 250" className="block max-w-full mx-auto select-none pointer-events-none" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x={78} y={TOP} width={144} height={BOTTOM - TOP} rx={10} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <line x1={78} x2={222} y1={horizonY} y2={horizonY} stroke={INK} strokeWidth="1.3" />
        {[-20, -10, 10, 20].map((p) => (
          <line key={p} x1={150 - (Math.abs(p) === 20 ? 22 : 12)} x2={150 + (Math.abs(p) === 20 ? 22 : 12)} y1={horizonY - p * 1.8} y2={horizonY - p * 1.8} stroke={INK} strokeOpacity="0.7" strokeWidth="1" />
        ))}
      </g>
      <rect x={78} y={TOP} width={144} height={BOTTOM - TOP} rx={10} fill="none" stroke={HAIR} strokeWidth="0.8" />
      <AircraftSymbol cx={150} cy={MID} span={40} color={CRIMSON} />
      <T x={150} y={TOP - 14} color={AMBER}>{intakeGoal > 0 ? `IN ${fmtInt(intakeKcal)} / ${intakeGoal.toLocaleString()}` : `IN ${fmtInt(intakeKcal)}`}</T>
      <Tape x={10} w={58} label="STEPS" value={steps} step={500} labelEvery={2} format={(v) => `${v / 1000}k`} align="left" />
      <Tape x={232} w={58} label="BURN" value={burnKcal} step={50} labelEvery={2} format={(v) => String(v)} align="right" />
      <Readout x={112} y={BOTTOM + 10} w={76} h={22}>{distKm > 0 ? `${fmtKm(distKm)} km` : '— km'}</Readout>
    </svg>
  );
};

export default SaturdayQuadrantDial;
