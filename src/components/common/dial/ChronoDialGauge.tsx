/**
 * Oblivion 1 Fitness Club - Rotary input gauge
 * Hairline instrument face, thin type, pointer-drag on the whole SVG.
 */

import React from 'react';
import { DialConfig, generateScaleMarkers } from './dialTypes';
import { COLOR } from '../../../theme/colors';

interface ChronoDialGaugeProps {
  value: number;
  config: DialConfig;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onCenterClick?: () => void;
}

const INK = COLOR.text;
const MUTED = COLOR.muted;
const CX = 140;
const CY = 140;
const ARC_R = 104;

const point = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

export const ChronoDialGauge: React.FC<ChronoDialGaugeProps> = ({
  value,
  config,
  svgRef,
  onPointerDown,
  onCenterClick,
}) => {
  const { min, max, unit, accentColor } = config;
  const currentPercent = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const currentAngle = 135 + currentPercent * 270;
  const knob = point(ARC_R, currentAngle);
  const start = point(ARC_R, 135);
  const end = point(ARC_R, 405);
  const filledPath = `M ${start.x} ${start.y} A ${ARC_R} ${ARC_R} 0 ${currentAngle - 135 > 180 ? 1 : 0} 1 ${knob.x} ${knob.y}`;
  const trackPath = `M ${start.x} ${start.y} A ${ARC_R} ${ARC_R} 0 1 1 ${end.x} ${end.y}`;

  return (
    <div className="o1-instrument relative w-full aspect-square max-w-[260px] mx-auto flex items-center justify-center select-none touch-none">
      <svg
        ref={svgRef}
        viewBox="0 0 280 280"
        onPointerDown={onPointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      >
        <circle
          cx={CX}
          cy={CY}
          r="126"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {Array.from({ length: 49 }).map((_, idx) => {
          const frac = idx / 48;
          const deg = 135 + frac * 270;
          const isMajor = idx % 6 === 0;
          const a = point(116, deg);
          const b = point(isMajor ? 108 : 112, deg);
          const passed = frac <= currentPercent && currentPercent > 0;
          return (
            <line
              key={idx}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={passed ? accentColor : INK}
              strokeOpacity={passed ? 1 : isMajor ? 0.55 : 0.25}
              strokeWidth={isMajor ? 1.4 : 0.8}
              strokeLinecap="round"
            />
          );
        })}

        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {currentPercent > 0.005 && (
          <path
            d={filledPath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {generateScaleMarkers(config).map((m, i) => {
          const p = point(88, 135 + m.fraction * 270);
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="400"
              fill={MUTED}
              className="font-num pointer-events-none"
            >
              {m.label}
            </text>
          );
        })}

        <circle cx={knob.x} cy={knob.y} r="9" fill="none" stroke={INK} strokeWidth="1.5" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <button
          type="button"
          onClick={onCenterClick}
          aria-label={`${value} ${unit}. Tap for numpad`}
          className="w-32 h-32 rounded-full flex flex-col items-center justify-center text-center cursor-pointer pointer-events-auto active:scale-95 transition-transform"
        >
          <span className="text-o1-label font-normal tracking-[0.16em] text-o1-muted">{unit}</span>
          <span className="text-5xl font-num font-light text-o1-text tracking-tight leading-none my-1.5 tabular-nums">
            {value}
          </span>
          <span className="text-o1-label font-normal text-o1-muted">tap for numpad</span>
        </button>
      </div>
    </div>
  );
};
