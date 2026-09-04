import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialOrbitalProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  dailyIntake?: number;
  onOpenStepDial: () => void;
}

export const DialOrbital: React.FC<DialOrbitalProps> = ({
  dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist, dailyIntake = 0, onOpenStepDial,
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

  const orbits = [
    { r: 145, pct: aSteps, color: '#E5DFD5', width: 3, dotR: 6, label: 'STEPS', value: dailySteps.toLocaleString(), delay: 0 },
    { r: 118, pct: aMove, color: '#EA4335', width: 2.5, dotR: 5, label: 'KCAL', value: Math.round(dailyMove).toString(), delay: 100 },
    { r: 91, pct: aDist, color: '#4285F4', width: 2.5, dotR: 5, label: 'KM', value: dailyDist.toFixed(2), delay: 200 },
  ];

  const polarToXY = (cx: number, cy: number, r: number, pct: number) => {
    const angle = (pct * 360 - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto select-none">
      <svg className="w-full h-full" viewBox="0 0 340 350">
        <defs>
          {orbits.map((o, i) => (
            <filter key={`glow-${i}`} id={`orbital-glow-${i}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {orbits.map((orbit, i) => {
          const circ = 2 * Math.PI * orbit.r;
          const filled = circ * orbit.pct;
          const dot = polarToXY(CX, CY, orbit.r, orbit.pct);
          return (
            <g key={i}>
              <circle cx={CX} cy={CY} r={orbit.r}
                fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={orbit.width}
                strokeDasharray="2 6" strokeLinecap="round"
              />
              <circle cx={CX} cy={CY} r={orbit.r}
                fill="none" stroke={orbit.color} strokeWidth={orbit.width}
                strokeLinecap="round" strokeDasharray={`${filled} ${circ}`}
                transform={`rotate(-90 ${CX} ${CY})`}
                opacity={loaded ? 0.85 : 0}
                className="transition-all duration-1000 ease-out"
                style={{ transitionDelay: `${orbit.delay}ms` }}
              />
              {loaded && (
                <circle cx={dot.x} cy={dot.y} r={orbit.dotR}
                  fill={orbit.color} opacity="0.95"
                  filter={`url(#orbital-glow-${i})`}
                  className="transition-all duration-1000 ease-out"
                  style={{ transitionDelay: `${orbit.delay}ms` }}
                />
              )}
            </g>
          );
        })}

        {/* Center hub */}
        <circle cx={CX} cy={CY} r="52" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <text x={CX} y={CY - 8} textAnchor="middle" fill="white" fontSize="32" fontWeight="900" fontFamily="monospace"
          style={{
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            opacity: isPressing ? 0.7 : 1,
            transformOrigin: `${CX}px ${CY - 8}px`,
            transform: isPressing ? 'scale(0.94)' : 'scale(1)',
            transition: 'transform 0.2s, opacity 0.2s',
          }}>
          {dailySteps.toLocaleString()}
        </text>
        <text x={CX} y={CY + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700" fontFamily="monospace" letterSpacing="3">
          STEPS
        </text>

        {/* Orbit labels at bottom */}
        <text x={CX - 56} y={CY + 78} textAnchor="middle" fill="#EA4335" fontSize="12" fontWeight="900" fontFamily="monospace">
          {Math.round(dailyMove)}
        </text>
        <text x={CX - 56} y={CY + 92} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          BURN
        </text>

        <text x={CX} y={CY + 78} textAnchor="middle" fill="#FBBC05" fontSize="12" fontWeight="900" fontFamily="monospace">
          {Math.round(dailyIntake)}
        </text>
        <text x={CX} y={CY + 92} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          INTAKE
        </text>

        <text x={CX + 56} y={CY + 78} textAnchor="middle" fill="#34A853" fontSize="12" fontWeight="900" fontFamily="monospace">
          {dailyDist.toFixed(1)}
        </text>
        <text x={CX + 56} y={CY + 92} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontWeight="700" fontFamily="monospace" letterSpacing="1.5">
          KM
        </text>
      </svg>

      {/* Center touch hitbox for 1-second long press */}
      <div
        {...stepLongPressHandlers}
        title="Press and hold 1s to set step target"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 cursor-pointer rounded-full z-10"
      />
    </div>
  );
};
