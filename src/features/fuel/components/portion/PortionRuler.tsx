import React from 'react';
import { round1 } from '../../../../utils/mathUtils';
import { SCALE, Unit } from './portionMath';
import type { RulerHandlers } from './usePortionDial';
import { COLOR } from '../../../../theme/colors';

const RULER_H = 68;

interface PortionRulerProps {
  unit: Unit;
  /** Ruler position, in the unit's own values. */
  pos: number;
  /** Rendered width in px, measured from the element. */
  width: number;
  max: number;
  /** The snapped value under the needle. */
  amount: number;
  /** One serving in grams, to mark it on the grams ruler. */
  servingG: number | null;
  rulerRef: React.RefObject<HTMLDivElement | null>;
  handlers: RulerHandlers;
}

/** The sliding ruler: tick marks that scroll under a fixed needle, with a dot at one serving. */
export function PortionRuler({
  unit,
  pos,
  width,
  max,
  amount,
  servingG,
  rulerRef,
  handlers,
}: PortionRulerProps) {
  const cfg = SCALE[unit];
  const ticks: React.ReactNode[] = [];
  const halfSpan = width / 2 / cfg.ppu + cfg.major;
  const first = Math.max(0, Math.ceil((pos - halfSpan) / cfg.minor));
  const last = Math.floor(Math.min(max, pos + halfSpan) / cfg.minor + 1e-9);
  const perMajor = Math.round(cfg.major / cfg.minor);
  const perMid = Math.round(cfg.mid / cfg.minor);
  for (let i = first; i <= last; i++) {
    const v = i * cfg.minor;
    const x = width / 2 + (v - pos) * cfg.ppu;
    const major = i % perMajor === 0;
    const mid = !major && i % perMid === 0;
    const h = major ? 28 : mid ? 18 : 10;
    const passed = v <= pos + 1e-9;
    ticks.push(
      <line
        key={i}
        x1={x}
        x2={x}
        y1={14}
        y2={14 + h}
        stroke={passed ? COLOR.text : COLOR.muted}
        strokeOpacity={passed ? (major ? 0.9 : 0.55) : major ? 0.55 : 0.28}
        strokeWidth={major ? 1.6 : 1}
        strokeLinecap="round"
      />,
    );
    if (major) {
      const text = unit === 'g' ? (v >= 1000 ? `${round1(v / 1000)}kg` : String(v)) : `${v}×`;
      ticks.push(
        <text
          key={`l${i}`}
          x={x}
          y={58}
          textAnchor="middle"
          fontSize="10"
          fontWeight={600}
          fill={passed ? COLOR.text : COLOR.muted}
          fillOpacity={passed ? 0.85 : 0.6}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {text}
        </text>,
      );
    }
  }
  const serveMarkX = unit === 'g' && servingG ? width / 2 + (servingG - pos) * cfg.ppu : null;

  return (
    <div
      ref={rulerRef}
      role="slider"
      tabIndex={0}
      aria-label={unit === 'g' ? 'Portion in grams' : 'Portion in servings'}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={amount}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerUp}
      onWheel={handlers.onWheel}
      onKeyDown={handlers.onKeyDown}
      className="relative rounded-2xl bg-o1-surface border border-white/[0.07] touch-none cursor-grab active:cursor-grabbing outline-none focus-visible:border-white/20 overflow-hidden"
      style={{
        height: RULER_H,
        maskImage: 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)',
      }}
    >
      <svg width={width} height={RULER_H} className="block">
        {ticks}
        {serveMarkX != null && serveMarkX > -8 && serveMarkX < width + 8 && (
          <circle cx={serveMarkX} cy={7} r={2.5} fill={COLOR.yellow} />
        )}
        <rect x={width / 2 - 1} y={4} width={2} height={42} rx={1} fill={COLOR.crimson} />
        <path
          d={`M ${width / 2 - 5} 2 L ${width / 2 + 5} 2 L ${width / 2} 8 Z`}
          fill={COLOR.crimson}
        />
      </svg>
    </div>
  );
}
