import React, { useEffect, useState } from 'react';
import { Play, Activity, Heart, Flame, Footprints, Zap, Pencil } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';

interface PulseRingProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  dailyKm: number;
  onOpenStepDial: () => void;
  onOpenReels: () => void;
  isRestTimerRunning?: boolean;
}

export const PulseRing: React.FC<PulseRingProps> = ({
  dailySteps,
  stepTarget,
  dailyMove,
  dailyKm,
  onOpenStepDial,
  onOpenReels,
}) => {
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  const stepsPct = Math.min(dailySteps / (stepTarget || 10000), 1);
  const movePct = Math.min(dailyMove / 900, 1);
  const kmPct = Math.min(dailyKm / 10, 1);

  // Concentric circle radii
  const rSteps = 132;
  const rMove = 104;
  const rKm = 76;

  const circSteps = 2 * Math.PI * rSteps; // ~829.38
  const circMove = 2 * Math.PI * rMove;   // ~653.45
  const circKm = 2 * Math.PI * rKm;       // ~477.52

  return (
    <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center my-1 select-none">
      
      {/* Background Volumetric Radar Chamber */}
      <div className="absolute inset-1.5 rounded-full bg-[#07090F] border border-cyan-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Radar concentric faint gridlines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Radar Crosshairs */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/10 pointer-events-none" />
        <div className="absolute inset-0 rounded-full border border-cyan-500/10 scale-50 pointer-events-none" />
      </div>

      {/* SVG Vector Rings with Continuous Animated Pulse Radar */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 340">
        <defs>
          {/* Neon Filters */}
          <filter id="cyanPulseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="amberPulseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="fuchsiaPulseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Linear Gradients for Active Rings */}
          <linearGradient id="stepsPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="50%" stopColor="#34A853" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="movePulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBC05" />
            <stop offset="70%" stopColor="#EA4335" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
          <linearGradient id="kmPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285F4" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
        </defs>

        <g transform="translate(170, 170)">
          {/* ========================================================
              RING 1: STEPS (OUTER - CYAN/EMERALD)
             ======================================================== */}
          {/* Dim Base Outline Track (Visible at 0 steps) */}
          <circle
            cx="0"
            cy="0"
            r={rSteps}
            fill="none"
            stroke="#0E2333"
            strokeWidth="7"
          />
          {/* Precision Micro Ticks on Ring 1 */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 360) / 36;
            const rad = (angle * Math.PI) / 180;
            const x1 = Math.cos(rad) * (rSteps - 5);
            const y1 = Math.sin(rad) * (rSteps - 5);
            const x2 = Math.cos(rad) * (rSteps + 5);
            const y2 = Math.sin(rad) * (rSteps + 5);
            return (
              <line
                key={`r1-tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#16384C"
                strokeWidth="1"
              />
            );
          })}

          {/* Active Filled Progress Ring */}
          <circle
            cx="0"
            cy="0"
            r={rSteps}
            fill="none"
            stroke="url(#stepsPulseGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circSteps}
            strokeDashoffset={circSteps - (stepsPct * circSteps)}
            transform="rotate(-90)"
            filter="url(#cyanPulseGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Continuous Glowing Radar Comet (Always active) */}
          <g className="animate-spin" style={{ animationDuration: '3.5s', animationTimingFunction: 'linear' }}>
            <circle
              cx="0"
              cy={-rSteps}
              r="4.5"
              fill="#22D3EE"
              filter="url(#cyanPulseGlow)"
            />
            <line
              x1="0"
              y1={-rSteps}
              x2="-25"
              y2={-rSteps + 3}
              stroke="#4285F4"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          {/* ========================================================
              RING 2: CALORIES / KCAL (MIDDLE - AMBER/ROSE)
             ======================================================== */}
          {/* Dim Base Outline Track */}
          <circle
            cx="0"
            cy="0"
            r={rMove}
            fill="none"
            stroke="#261710"
            strokeWidth="6"
          />
          {/* Active Filled Progress Ring */}
          <circle
            cx="0"
            cy="0"
            r={rMove}
            fill="none"
            stroke="url(#movePulseGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circMove}
            strokeDashoffset={circMove - (movePct * circMove)}
            transform="rotate(-90)"
            filter="url(#amberPulseGlow)"
            className="transition-all duration-700 ease-out"
          />
          {/* Continuous Heartbeat Comet 2 */}
          <g className="animate-spin" style={{ animationDuration: '4.8s', animationTimingFunction: 'linear', animationDirection: 'reverse' }}>
            <circle
              cx="0"
              cy={-rMove}
              r="3.5"
              fill="#FBBC05"
              filter="url(#amberPulseGlow)"
            />
          </g>

          {/* ========================================================
              RING 3: DISTANCE / KM (INNER - VIOLET/FUCHSIA)
             ======================================================== */}
          {/* Dim Base Outline Track */}
          <circle
            cx="0"
            cy="0"
            r={rKm}
            fill="none"
            stroke="#21102A"
            strokeWidth="5"
          />
          {/* Active Filled Progress Ring */}
          <circle
            cx="0"
            cy="0"
            r={rKm}
            fill="none"
            stroke="url(#kmPulseGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circKm}
            strokeDashoffset={circKm - (kmPct * circKm)}
            transform="rotate(-90)"
            filter="url(#fuchsiaPulseGlow)"
            className="transition-all duration-700 ease-out"
          />
          {/* Continuous Heartbeat Comet 3 */}
          <g className="animate-spin" style={{ animationDuration: '6s', animationTimingFunction: 'linear' }}>
            <circle
              cx="0"
              cy={-rKm}
              r="3"
              fill="#EA4335"
              filter="url(#fuchsiaPulseGlow)"
            />
          </g>

          {/* Micro Heartbeat ECG Vector Wave in center bottom */}
          <path
            d="M -30 42 L -18 42 L -12 36 L -6 48 L 0 32 L 6 52 L 12 42 L 30 42"
            fill="none"
            stroke="#4285F4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </g>
      </svg>

      {/* Central Heartbeat High-Contrast Digital Readout */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-48 pointer-events-auto">
        {/* Cue Pill */}
        <button
          onClick={onOpenReels}
          className="mb-1 px-2.5 py-0.5 rounded-full bg-[#0A1424] border border-cyan-400/40 text-[9px] font-mono font-black tracking-widest text-cyan-300 uppercase transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1"
        >
          <Activity className="w-2.5 h-2.5 text-cyan-400" />
          <span>PULSE 3-RING</span>
        </button>

        {/* Primary Metric: Press & hold 1s to configure target */}
        <div
          {...stepLongPressHandlers}
          title="Press and hold 1s to set step target"
          className={`cursor-pointer group flex flex-col items-center transition-all my-0.5 select-none ${
            isPressing ? 'scale-95 opacity-80' : ''
          }`}
        >
          <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
            {dailySteps.toLocaleString()}
          </span>

          <div className="flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest uppercase mt-0.5 text-cyan-400">
            <span>STEPS</span>
            <span className="text-white/40">/ {(stepTarget / 1000).toFixed(0)}K</span>
            <Pencil className="w-2 h-2 text-cyan-400/80 group-hover:text-cyan-200 transition-colors" />
          </div>
        </div>

        {/* Triple Ring Mini Telemetry Readouts */}
        <div className="mt-1 flex items-center justify-center gap-2.5 font-mono text-[9.5px] text-white/80">
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-amber-300 font-bold">{dailyMove}</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 inline-block" />
            <span className="text-fuchsia-300 font-bold">{dailyKm.toFixed(1)}k</span>
          </span>
        </div>
      </div>
    </div>
  );
};
