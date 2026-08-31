import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialSplitColumnProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  onOpenStepDial: () => void;
}

export const DialSplitColumn: React.FC<DialSplitColumnProps> = ({
  dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist, onOpenStepDial,
}) => {
  const [loaded, setLoaded] = useState(false);
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  const stepsPct = stepTarget > 0 ? Math.min(dailySteps / stepTarget, 1) : 0;
  const movePct = goalMove > 0 ? Math.min(dailyMove / goalMove, 1) : 0;
  const distPct = goalDist > 0 ? Math.min(dailyDist / goalDist, 1) : 0;

  const metrics = [
    { label: 'KCAL', value: Math.round(dailyMove).toString(), pct: movePct, color: '#EA4335' },
    { label: 'KM', value: dailyDist.toFixed(2), pct: distPct, color: '#34A853' },
    { label: 'GOAL', value: `${Math.round(stepsPct * 100)}%`, pct: stepsPct, color: '#4285F4' },
  ];

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto flex items-center justify-center select-none">
      <div className="flex items-stretch gap-6 w-full px-4">
        {/* Left: Big Step Number with 1-second long press */}
        <div
          {...stepLongPressHandlers}
          title="Press and hold 1s to set step target"
          className={`flex flex-col justify-center flex-1 cursor-pointer transition-all duration-200 ${
            isPressing ? 'scale-95 opacity-80' : ''
          }`}
        >
          <span
            className="font-mono font-black text-white leading-[0.85] transition-all duration-700"
            style={{
              fontSize: dailySteps >= 10000 ? '56px' : '64px',
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            {dailySteps.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-white/40 mt-2 uppercase">
            Steps
          </span>
          {/* Thin progress line */}
          <div className="mt-3 w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
              style={{ width: `${loaded ? stepsPct * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-white/10 self-stretch my-4" />

        {/* Right: Stacked metrics */}
        <div className="flex flex-col justify-center gap-5 min-w-[80px]">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono font-black text-white text-[22px] leading-none tabular-nums transition-all duration-700"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateX(0)' : 'translateX(6px)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  {m.value}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-12 h-[2px] rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${loaded ? m.pct * 100 : 0}%`, background: m.color, transitionDelay: `${i * 80}ms` }}
                  />
                </div>
                <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/35 uppercase">{m.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
