import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialApexProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  onOpenStepDial: () => void;
}

export const DialApex: React.FC<DialApexProps> = ({
  dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist, onOpenStepDial,
}) => {
  const [loaded, setLoaded] = useState(false);
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  const stepsPct = stepTarget > 0 ? Math.min(dailySteps / stepTarget, 1) : 0;
  const movePct = goalMove > 0 ? Math.min(dailyMove / goalMove, 1) : 0;
  const distPct = goalDist > 0 ? Math.min(dailyDist / goalDist, 1) : 0;

  const CX = 170, CY = 175;
  const R = 130;
  const TOTAL_SEGMENTS = 60;
  const GAP_ANGLE = 1.5;

  const segAngle = (360 - TOTAL_SEGMENTS * GAP_ANGLE) / TOTAL_SEGMENTS;

  const filledSegments = Math.round(TOTAL_SEGMENTS * (loaded ? stepsPct : 0));

  const polarToXY = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const segmentPath = (idx: number) => {
    const startA = idx * (segAngle + GAP_ANGLE);
    const endA = startA + segAngle;
    const s = polarToXY(CX, CY, R, startA);
    const e = polarToXY(CX, CY, R, endA);
    return `M ${s.x} ${s.y} A ${R} ${R} 0 0 1 ${e.x} ${e.y}`;
  };

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto select-none">
      <svg className="w-full h-full" viewBox="0 0 340 360">
        {/* Segmented ring */}
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
          <path key={i}
            d={segmentPath(i)}
            fill="none"
            stroke={i < filledSegments ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)'}
            strokeWidth="8"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ transitionDelay: `${i * 8}ms` }}
          />
        ))}

        {/* Inner ring - Move */}
        <circle cx={CX} cy={CY} r="92" fill="none" stroke="rgba(234,67,53,0.15)" strokeWidth="5" />
        <circle cx={CX} cy={CY} r="92" fill="none" stroke="#EA4335" strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 92 * (loaded ? movePct : 0)} ${2 * Math.PI * 92}`}
          transform={`rotate(-90 ${CX} ${CY})`}
          className="transition-all duration-1000 ease-out"
          style={{ transitionDelay: '200ms' }}
        />

        {/* Innermost ring - Distance */}
        <circle cx={CX} cy={CY} r="76" fill="none" stroke="rgba(52,168,83,0.15)" strokeWidth="4" />
        <circle cx={CX} cy={CY} r="76" fill="none" stroke="#34A853" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 76 * (loaded ? distPct : 0)} ${2 * Math.PI * 76}`}
          transform={`rotate(-90 ${CX} ${CY})`}
          className="transition-all duration-1000 ease-out"
          style={{ transitionDelay: '300ms' }}
        />

        {/* Center */}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize="36" fontWeight="900" fontFamily="monospace"
          style={{
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            opacity: isPressing ? 0.7 : 1,
            transformOrigin: `${CX}px ${CY - 6}px`,
            transform: isPressing ? 'scale(0.94)' : 'scale(1)',
            transition: 'transform 0.2s, opacity 0.2s',
          }}>
          {dailySteps.toLocaleString()}
        </text>
        <text x={CX} y={CY + 16} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontWeight="700" fontFamily="monospace" letterSpacing="2.5">
          STEPS
        </text>

        {/* Bottom metrics */}
        <text x={CX - 50} y={CY + 60} textAnchor="middle" fill="#EA4335" fontSize="13" fontWeight="900" fontFamily="monospace">
          {Math.round(dailyMove)}
        </text>
        <text x={CX - 50} y={CY + 74} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          KCAL
        </text>
        <text x={CX + 50} y={CY + 60} textAnchor="middle" fill="#34A853" fontSize="13" fontWeight="900" fontFamily="monospace">
          {dailyDist.toFixed(2)}
        </text>
        <text x={CX + 50} y={CY + 74} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          KM
        </text>
      </svg>

      {/* Center touch hitbox for 1-second long press */}
      <div
        {...stepLongPressHandlers}
        title="Press and hold 1s to set step target"
        className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 cursor-pointer rounded-full z-10"
      />
    </div>
  );
};
