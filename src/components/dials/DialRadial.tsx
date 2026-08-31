import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialRadialProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  onOpenStepDial: () => void;
}

export const DialRadial: React.FC<DialRadialProps> = ({
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

  const createSemiArc = (r: number, startDeg: number, sweepDeg: number, pct: number) => {
    const startRad = (startDeg - 90) * Math.PI / 180;
    const endRad = (startDeg + sweepDeg * pct - 90) * Math.PI / 180;
    const sx = CX + r * Math.cos(startRad);
    const sy = CY + r * Math.sin(startRad);
    const ex = CX + r * Math.cos(endRad);
    const ey = CY + r * Math.sin(endRad);
    const large = (sweepDeg * pct) > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };

  const segments = [
    { r: 148, startDeg: 200, sweep: 320, pct: aSteps, color: '#ffffff', width: 12 },
    { r: 120, startDeg: 220, sweep: 280, pct: aMove, color: '#FF4757', width: 10 },
    { r: 95, startDeg: 240, sweep: 260, pct: aDist, color: '#54A0FF', width: 8 },
  ];

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto select-none">
      <svg className="w-full h-full" viewBox="0 0 340 350">
        <defs>
          <linearGradient id="radial-grad-0" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="radial-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4757" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF4757" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="radial-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#54A0FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#54A0FF" stopOpacity="1" />
          </linearGradient>
        </defs>

        {segments.map((seg, i) => (
          <g key={i}>
            {/* Track */}
            <path
              d={createSemiArc(seg.r, seg.startDeg, seg.sweep, 1)}
              fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={seg.width} strokeLinecap="round"
            />
            {/* Progress */}
            <path
              d={createSemiArc(seg.r, seg.startDeg, seg.sweep, seg.pct)}
              fill="none" stroke={`url(#radial-grad-${i})`} strokeWidth={seg.width} strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </g>
        ))}

        {/* Center text */}
        <text x={CX} y={CY - 10} textAnchor="middle" fill="white" fontSize="38" fontWeight="900" fontFamily="monospace"
          style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
            opacity: isPressing ? 0.7 : 1,
            transformOrigin: `${CX}px ${CY - 10}px`,
            transform: isPressing ? 'scale(0.94)' : 'scale(1)',
            transition: 'transform 0.2s, opacity 0.2s',
          }}>
          {dailySteps.toLocaleString()}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700" fontFamily="monospace" letterSpacing="3">
          STEPS
        </text>

        {/* Legend chips */}
        <g transform={`translate(${CX - 70}, ${CY + 50})`}>
          <circle cx="0" cy="0" r="4" fill="#FF4757" />
          <text x="10" y="4" fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="700" fontFamily="monospace">
            {Math.round(dailyMove)} kcal
          </text>
        </g>
        <g transform={`translate(${CX - 70}, ${CY + 72})`}>
          <circle cx="0" cy="0" r="4" fill="#54A0FF" />
          <text x="10" y="4" fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="700" fontFamily="monospace">
            {dailyDist.toFixed(2)} km
          </text>
        </g>
        <g transform={`translate(${CX - 70}, ${CY + 94})`}>
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
          <text x="10" y="4" fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="700" fontFamily="monospace">
            {Math.round(stepsPct * 100)}% goal
          </text>
        </g>
      </svg>

      {/* Center touch hitbox for 1-second long press */}
      <div
        {...stepLongPressHandlers}
        title="Press and hold 1s to set step target"
        className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 cursor-pointer rounded-full z-10"
      />
    </div>
  );
};
