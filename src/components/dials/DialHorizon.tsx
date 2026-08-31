import React, { useEffect, useState } from 'react';
import { useLongPress } from '@/hooks/useLongPress';

interface DialHorizonProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  goalMove: number;
  dailyDist: number;
  goalDist: number;
  onOpenStepDial: () => void;
}

export const DialHorizon: React.FC<DialHorizonProps> = ({
  dailySteps, stepTarget, dailyMove, goalMove, dailyDist, goalDist, onOpenStepDial,
}) => {
  const [loaded, setLoaded] = useState(false);
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  const stepsPct = stepTarget > 0 ? Math.min(dailySteps / stepTarget, 1) : 0;
  const movePct = goalMove > 0 ? Math.min(dailyMove / goalMove, 1) : 0;
  const distPct = goalDist > 0 ? Math.min(dailyDist / goalDist, 1) : 0;

  return (
    <div className="relative w-full aspect-[1/1.05] max-w-[340px] mx-auto flex flex-col items-center justify-center px-4 select-none">
      {/* Main step count with 1-second long press */}
      <div
        {...stepLongPressHandlers}
        title="Press and hold 1s to set step target"
        className={`text-center mb-6 cursor-pointer transition-all duration-200 ${
          isPressing ? 'scale-95 opacity-80' : ''
        }`}
      >
        <span
          className="font-mono font-black text-white leading-none block transition-all duration-700"
          style={{
            fontSize: '58px',
            textShadow: '0 4px 20px rgba(0,0,0,0.7)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {dailySteps.toLocaleString()}
        </span>
        <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-white/40 mt-2 block uppercase">
          Steps Today
        </span>
      </div>

      {/* Horizon bars */}
      <div className="w-full space-y-4">
        {[
          { label: 'STEPS', pct: stepsPct, color: '#ffffff', value: `${Math.round(stepsPct * 100)}%`, delay: 0 },
          { label: 'BURN', pct: movePct, color: '#FF4757', value: `${Math.round(dailyMove)} kcal`, delay: 80 },
          { label: 'DIST', pct: distPct, color: '#54A0FF', value: `${dailyDist.toFixed(2)} km`, delay: 160 },
        ].map((bar, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-white/35 w-10 text-right uppercase">
              {bar.label}
            </span>
            <div className="flex-1 h-[6px] rounded-full bg-white/[0.06] overflow-hidden relative">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${loaded ? bar.pct * 100 : 0}%`,
                  background: `linear-gradient(90deg, ${bar.color}CC, ${bar.color})`,
                  boxShadow: `0 0 12px ${bar.color}40`,
                  transitionDelay: `${bar.delay}ms`,
                }}
              />
            </div>
            <span
              className="text-[11px] font-mono font-bold text-white/70 w-16 text-left tabular-nums transition-all duration-700"
              style={{ opacity: loaded ? 1 : 0, transitionDelay: `${bar.delay + 200}ms` }}
            >
              {bar.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
