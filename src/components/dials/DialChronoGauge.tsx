import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialChronoGaugeProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  onOpenStepDial: () => void;
}

export const DialChronoGauge: React.FC<DialChronoGaugeProps> = ({
  dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist, onOpenStepDial,
}) => {
  const [loaded, setLoaded] = useState(false);
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 120); return () => clearTimeout(t); }, []);

  const stepsPct = stepTarget > 0 ? Math.min(dailySteps / stepTarget, 1) : 0;
  const movePct = goalMove > 0 ? Math.min(dailyMove / goalMove, 1) : 0;
  const distPct = goalDist > 0 ? Math.min(dailyDist / goalDist, 1) : 0;
  const aSteps = loaded ? stepsPct : 0;
  const aMove = loaded ? movePct : 0;
  const aDist = loaded ? distPct : 0;

  const CX = 170, CY = 180;
  const R = 140;
  const START_ANGLE = 135;
  const END_ANGLE = 405;
  const SWEEP = END_ANGLE - START_ANGLE;
  const TICK_COUNT = 40;
  const MAJOR_EVERY = 5;

  const polarToXY = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (cx: number, cy: number, r: number, startA: number, endA: number) => {
    const s = polarToXY(cx, cy, r, startA);
    const e = polarToXY(cx, cy, r, endA);
    const large = (endA - startA) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const needleAngle = START_ANGLE + SWEEP * aSteps;

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto select-none">
      <svg className="w-full h-full" viewBox="0 0 340 360">
        {/* Outer brushed track */}
        <path
          d={arcPath(CX, CY, R, START_ANGLE, END_ANGLE)}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round"
        />

        {/* Progress arc */}
        <path
          d={arcPath(CX, CY, R, START_ANGLE, START_ANGLE + SWEEP * aSteps)}
          fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="14" strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />

        {/* Tick marks */}
        {Array.from({ length: TICK_COUNT + 1 }).map((_, i) => {
          const angle = START_ANGLE + (SWEEP / TICK_COUNT) * i;
          const isMajor = i % MAJOR_EVERY === 0;
          const inner = polarToXY(CX, CY, R - (isMajor ? 22 : 16), angle);
          const outer = polarToXY(CX, CY, R - 8, angle);
          return (
            <line key={i}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={isMajor ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isMajor ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle */}
        <line
          x1={CX} y1={CY}
          x2={polarToXY(CX, CY, R * 0.52, needleAngle).x}
          y2={polarToXY(CX, CY, R * 0.52, needleAngle).y}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <circle cx={CX} cy={CY} r="5" fill="white" />
        <circle cx={CX} cy={CY} r="2.5" fill="rgba(0,0,0,0.6)" />

        {/* Center number */}
        <text x={CX} y={CY - 36} textAnchor="middle" fill="white" fontSize="44" fontWeight="900" fontFamily="monospace"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            opacity: isPressing ? 0.7 : 1,
            transformOrigin: `${CX}px ${CY - 36}px`,
            transform: isPressing ? 'scale(0.94)' : 'scale(1)',
            transition: 'transform 0.2s, opacity 0.2s',
          }}>
          {dailySteps.toLocaleString()}
        </text>
        <text x={CX} y={CY - 16} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10" fontWeight="700" fontFamily="monospace" letterSpacing="3">
          STEPS
        </text>

        {/* Sub-dial: KCAL (left) */}
        <g>
          <circle cx={CX - 52} cy={CY + 54} r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <path
            d={arcPath(CX - 52, CY + 54, 28, 0, 360 * aMove)}
            fill="none" stroke="#EA4335" strokeWidth="3" strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <text x={CX - 52} y={CY + 52} textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="monospace">
            {Math.round(dailyMove)}
          </text>
          <text x={CX - 52} y={CY + 66} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
            KCAL
          </text>
        </g>

        {/* Sub-dial: KM (right) */}
        <g>
          <circle cx={CX + 52} cy={CY + 54} r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <path
            d={arcPath(CX + 52, CY + 54, 28, 0, 360 * aDist)}
            fill="none" stroke="#34A853" strokeWidth="3" strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <text x={CX + 52} y={CY + 52} textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="monospace">
            {dailyDist.toFixed(1)}
          </text>
          <text x={CX + 52} y={CY + 66} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
            KM
          </text>
        </g>

        {/* Percentage at bottom */}
        <text x={CX} y={CY + 108} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="800" fontFamily="monospace" letterSpacing="2">
          {Math.round(stepsPct * 100)}% GOAL
        </text>
      </svg>

      {/* Center touch hitbox for 1-second long press */}
      <div
        {...stepLongPressHandlers}
        title="Press and hold 1s to set step target"
        className="absolute top-[26%] left-1/2 -translate-x-1/2 w-44 h-24 cursor-pointer rounded-2xl z-10"
      />
    </div>
  );
};
