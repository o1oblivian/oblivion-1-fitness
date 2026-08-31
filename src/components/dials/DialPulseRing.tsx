import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialPulseRingProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  onOpenStepDial: () => void;
}

export const DialPulseRing: React.FC<DialPulseRingProps> = ({
  dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist, onOpenStepDial,
}) => {
  const [loaded, setLoaded] = useState(false);
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);

  const stepsPct = stepTarget > 0 ? Math.min(dailySteps / stepTarget, 1) : 0;
  const movePct = goalMove > 0 ? Math.min(dailyMove / goalMove, 1) : 0;
  const distPct = goalDist > 0 ? Math.min(dailyDist / goalDist, 1) : 0;
  const aSteps = loaded ? stepsPct : 0;
  const aMove = loaded ? movePct : 0;
  const aDist = loaded ? distPct : 0;

  const CX = 170, CY = 170;
  const rings = [
    { r: 148, pct: aSteps, color: '#ffffff', trailColor: 'rgba(255,255,255,0.08)', width: 10, label: 'STEPS', value: dailySteps.toLocaleString() },
    { r: 124, pct: aMove, color: '#FF4757', trailColor: 'rgba(255,71,87,0.08)', width: 8, label: 'KCAL', value: Math.round(dailyMove).toString() },
    { r: 104, pct: aDist, color: '#54A0FF', trailColor: 'rgba(84,160,255,0.08)', width: 8, label: 'KM', value: dailyDist.toFixed(2) },
  ];

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto select-none">
      <svg className="w-full h-full" viewBox="0 0 340 350">
        <defs>
          {rings.map((ring, i) => (
            <linearGradient key={`grad-${i}`} id={`pulse-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={ring.color} stopOpacity="1" />
              <stop offset="100%" stopColor={ring.color} stopOpacity="0.4" />
            </linearGradient>
          ))}
        </defs>

        {/* Ring trails and fills */}
        {rings.map((ring, i) => {
          const circ = 2 * Math.PI * ring.r;
          const filled = circ * ring.pct;
          return (
            <g key={i}>
              {/* Trail */}
              <circle cx={CX} cy={CY} r={ring.r}
                fill="none" stroke={ring.trailColor} strokeWidth={ring.width}
              />
              {/* Progress */}
              <circle cx={CX} cy={CY} r={ring.r}
                fill="none" stroke={`url(#pulse-grad-${i})`} strokeWidth={ring.width}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${circ}`}
                transform={`rotate(-90 ${CX} ${CY})`}
                className="transition-all duration-1000 ease-out"
              />
            </g>
          );
        })}

        {/* Center content with visual cue when pressing */}
        <text x={CX} y={CY - 12} textAnchor="middle" fill="white" fontSize="42" fontWeight="900" fontFamily="monospace"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            opacity: isPressing ? 0.7 : 1,
            transformOrigin: `${CX}px ${CY - 12}px`,
            transform: isPressing ? 'scale(0.94)' : 'scale(1)',
            transition: 'transform 0.2s, opacity 0.2s',
          }}>
          {dailySteps.toLocaleString()}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="700" fontFamily="monospace" letterSpacing="3">
          STEPS
        </text>

        {/* Ring labels at bottom */}
        <text x={CX - 60} y={CY + 48} textAnchor="middle" fill="#FF4757" fontSize="14" fontWeight="900" fontFamily="monospace">
          {Math.round(dailyMove)}
        </text>
        <text x={CX - 60} y={CY + 62} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          KCAL
        </text>

        <text x={CX + 60} y={CY + 48} textAnchor="middle" fill="#54A0FF" fontSize="14" fontWeight="900" fontFamily="monospace">
          {dailyDist.toFixed(2)}
        </text>
        <text x={CX + 60} y={CY + 62} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          KM
        </text>

        {/* Percentage */}
        <text x={CX} y={CY + 60} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="800" fontFamily="monospace">
          {Math.round(stepsPct * 100)}%
        </text>
      </svg>

      {/* Transparent center touch hitbox for 1-second long press */}
      <div
        {...stepLongPressHandlers}
        title="Press and hold 1s to set step target"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-28 cursor-pointer rounded-full z-10"
      />
    </div>
  );
};
