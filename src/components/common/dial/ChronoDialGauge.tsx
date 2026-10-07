/**
 * Oblivion 1 Fitness Club - Swiss Chrono Dial SVG View
 * Fully responsive touch-action none with pointer locking & smooth radial sweep
 * Strict File Ceiling: < 140 lines
 */

import React from 'react';
import { DialConfig, generateScaleMarkers } from './dialTypes';

interface ChronoDialGaugeProps {
  value: number;
  config: DialConfig;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onCenterClick?: () => void;
}

export const ChronoDialGauge: React.FC<ChronoDialGaugeProps> = ({
  value,
  config,
  svgRef,
  onPointerDown,
  onCenterClick,
}) => {
  const { min, max, unit, accentColor } = config;
  const cx = 140;
  const cy = 140;
  const radius = 104;

  const currentPercent = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const currentAngle = 135 + currentPercent * 270;
  const rad = (currentAngle * Math.PI) / 180;
  const needleX = cx + radius * Math.cos(rad);
  const needleY = cy + radius * Math.sin(rad);

  const startRad = (135 * Math.PI) / 180;
  const startX = cx + radius * Math.cos(startRad);
  const startY = cy + radius * Math.sin(startRad);
  const isLarge = currentAngle - 135 > 180 ? 1 : 0;
  const filledPath = `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLarge} 1 ${needleX} ${needleY}`;

  const endRad = (405 * Math.PI) / 180;
  const endX = cx + radius * Math.cos(endRad);
  const endY = cy + radius * Math.sin(endRad);
  const bgPath = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;

  return (
    <div className="relative w-full aspect-square max-w-[260px] mx-auto flex items-center justify-center select-none touch-none">
      <svg
        ref={svgRef}
        viewBox="0 0 280 280"
        onPointerDown={onPointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      >
        <circle cx={cx} cy={cy} r="126" className="fill-o1-card" />
        <circle cx={cx} cy={cy} r="122" className="fill-o1-well" />
        <circle
          cx={cx}
          cy={cy}
          r="118"
          className="fill-[#000000] stroke-neutral-800"
          strokeWidth="1.5"
        />

        {Array.from({ length: 49 }).map((_, idx) => {
          const frac = idx / 48;
          const a = (135 + frac * 270) * (Math.PI / 180);
          const isMajor = idx % 6 === 0;
          const r1 = 114;
          const r2 = isMajor ? 104 : 108;
          const isPassed = frac <= currentPercent;
          return (
            <line
              key={idx}
              x1={cx + r1 * Math.cos(a)}
              y1={cy + r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy + r2 * Math.sin(a)}
              stroke={isPassed ? accentColor : 'currentColor'}
              className={isPassed ? '' : 'text-neutral-700/80'}
              strokeWidth={isMajor ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        <path
          d={bgPath}
          fill="none"
          stroke="currentColor"
          className="text-neutral-800"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {currentPercent > 0.005 && (
          <path d={filledPath} fill="none" stroke={accentColor} strokeWidth="8" strokeLinecap="round" />
        )}

        {generateScaleMarkers(config).map((m, i) => {
          const a = (135 + m.fraction * 270) * (Math.PI / 180);
          return (
            <text
              key={i}
              x={cx + 88 * Math.cos(a)}
              y={cy + 88 * Math.sin(a)}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[9px] font-mono font-semibold fill-neutral-500 pointer-events-none"
            >
              {m.label}
            </text>
          );
        })}

        <circle cx={needleX} cy={needleY} r="10" fill={accentColor} stroke="#FFFFFF" strokeWidth="2.5" className="filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
        <circle cx={needleX} cy={needleY} r="3.5" fill="#FFFFFF" />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <button
          type="button"
          onClick={onCenterClick}
          className="w-28 h-28 rounded-full flex flex-col items-center justify-center text-center cursor-pointer pointer-events-auto hover:bg-white/5 active:scale-95 transition-all"
        >
          <span className="text-[10px] font-tactical font-bold tracking-[0.16em] text-neutral-500 uppercase">{unit}</span>
          <span className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight leading-none my-1">{value}</span>
          <span className="text-[9px] font-sans font-medium text-neutral-500 hover:text-neutral-300">tap for numpad</span>
        </button>
      </div>
    </div>
  );
};
