import React, { useState } from 'react';
import { Play, Gauge, Zap, Flame, Compass, Sparkles, Pencil } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';

interface ChronoGaugeProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  dailyKm: number;
  onOpenStepDial: () => void;
  onOpenReels: () => void;
  isRestTimerRunning?: boolean;
}

export const ChronoGauge: React.FC<ChronoGaugeProps> = ({
  dailySteps,
  stepTarget,
  dailyMove,
  dailyKm,
  onOpenStepDial,
  onOpenReels,
}) => {
  const [highlightMode, setHighlightMode] = useState<'standard' | 'redline'>('standard');
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });

  // Percentage calculations
  const stepsPct = Math.min(dailySteps / (stepTarget || 10000), 1.2); // allow slight over rev
  const movePct = Math.min(dailyMove / 900, 1);
  const kmPct = Math.min(dailyKm / 10, 1);

  // Tachometer geometry: Arc spans from 7 o'clock (135° in SVG angle where 0 is 3 o'clock) to 5 o'clock (45°),
  // effectively sweeping 270° clockwise from 135° to 405° (45°).
  const startAngle = 135;
  const sweepAngle = 270;
  const currentAngle = startAngle + Math.min(stepsPct, 1) * sweepAngle;

  // Major tick labels in thousands (0, 2, 4, 6, 8, 10, 12)
  const ticks = [
    { val: 0, label: '0' },
    { val: 2, label: '2' },
    { val: 4, label: '4' },
    { val: 6, label: '6' },
    { val: 8, label: '8' },
    { val: 10, label: '10' },
    { val: 12, label: '12' },
  ];

  // Caloric Sub-Dial (Left Rolex Complication): Radius 28, center (112, 215)
  // Distance Sub-Dial (Right Rolex Complication): Radius 28, center (228, 215)
  const moveAngle = 135 + movePct * 270;
  const kmAngle = 135 + kmPct * 270;

  return (
    <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center my-1 select-none">
      
      {/* Heavy Brushed Titanium & Carbon Bezel Housing */}
      <div className="absolute inset-1.5 rounded-full bg-[#080B10] border-2 border-[#2A3342] shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_2px_12px_rgba(255,255,255,0.08)] overflow-hidden">
        {/* Brushed Radial Sheen Highlights */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.03)_0deg,rgba(0,0,0,0.6)_90deg,rgba(255,255,255,0.05)_180deg,rgba(0,0,0,0.6)_270deg,rgba(255,255,255,0.03)_360deg)] opacity-60 pointer-events-none" />
        
        {/* Subtle Matte Carbon Texture Core */}
        <div className="absolute inset-6 rounded-full bg-[#06080D] border border-white/5 shadow-inner" />
      </div>

      {/* Precision SVG Vector Gauge Markings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 340">
        <defs>
          {/* Needle drop shadow */}
          <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#EA4335" floodOpacity="0.6" />
          </filter>
          <filter id="metallicSheen" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
          </filter>
          <linearGradient id="brushedArc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="85%" stopColor="#EA4335" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
          <linearGradient id="activeTachArc" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#FBBC05" />
            <stop offset="85%" stopColor="#EA4335" />
            <stop offset="100%" stopColor="#EA4335" />
          </linearGradient>
        </defs>

        {/* --- MAIN TACHOMETER OUTER SCALE (7 o'clock to 5 o'clock) --- */}
        <g transform="translate(170, 170)">
          {/* Base Background Track Arc */}
          <path
            d="M -99 99 A 140 140 0 1 1 99 99"
            fill="none"
            stroke="#1E293B"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Filled Progress Arc */}
          <path
            d="M -99 99 A 140 140 0 1 1 99 99"
            fill="none"
            stroke="url(#activeTachArc)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="660"
            strokeDashoffset={660 - (Math.min(stepsPct, 1) * 660)}
            className="transition-all duration-700 ease-out"
          />

          {/* Precision Etched Hash Marks (70 total ticks across 270 deg) */}
          {Array.from({ length: 55 }).map((_, i) => {
            const angle = 135 + (i * 270) / 54;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 9 === 0;
            const isMedium = i % 3 === 0;
            const isRedline = i >= 42; // Redline zone >80%
            
            const rInner = isMajor ? 118 : isMedium ? 124 : 128;
            const rOuter = 136;
            
            const x1 = Math.cos(rad) * rInner;
            const y1 = Math.sin(rad) * rInner;
            const x2 = Math.cos(rad) * rOuter;
            const y2 = Math.sin(rad) * rOuter;

            return (
              <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isRedline ? '#EA4335' : isMajor ? '#F8FAFC' : isMedium ? '#94A3B8' : '#475569'}
                strokeWidth={isMajor ? '2.5' : isMedium ? '1.5' : '1'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Major Numeric Tick Markers (0, 2, 4, 6, 8, 10, 12) */}
          {ticks.map((t, idx) => {
            const angle = 135 + (idx * 270) / (ticks.length - 1);
            const rad = (angle * Math.PI) / 180;
            const rLabel = 106;
            const x = Math.cos(rad) * rLabel;
            const y = Math.sin(rad) * rLabel;
            const isRedline = t.val >= 10;

            return (
              <text
                key={`num-${t.val}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isRedline ? '#EA4335' : '#CBD5E1'}
                className="font-mono text-[11px] font-black tracking-tight"
                filter="url(#metallicSheen)"
              >
                {t.label}
              </text>
            );
          })}

          {/* Porsche Tachometer "x1000 STEPS" Emblem */}
          <text
            x="0"
            y="-65"
            textAnchor="middle"
            fill="#94A3B8"
            className="font-mono text-[8.5px] font-bold tracking-widest uppercase"
          >
            RPM · STEPS x 1000
          </text>

          {/* GT3 Redline Indicator Zone Arc */}
          <path
            d="M 68 -122 A 140 140 0 0 1 99 99"
            fill="none"
            stroke="#EA4335"
            strokeWidth="3"
            strokeDasharray="3 3"
            opacity="0.8"
          />

          {/* Dynamic Tachometer Needle */}
          <g transform={`rotate(${currentAngle - 90})`} className="transition-transform duration-500 ease-out">
            {/* Needle Body */}
            <path
              d="M -3.5 0 L -0.5 -136 L 0.5 -136 L 3.5 0 Z"
              fill="#EA4335"
              filter="url(#needleGlow)"
            />
            <circle cx="0" cy="0" r="14" fill="#0F172A" stroke="#E2E8F0" strokeWidth="2.5" />
            <circle cx="0" cy="0" r="5" fill="#EA4335" />
          </g>
        </g>

        {/* --- LEFT SUB-DIAL COMPLICATION (KCAL ROLEX STYLE) --- */}
        <g transform="translate(108, 208)">
          <circle cx="0" cy="0" r="26" fill="#141716" stroke="#3F4643" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="24" fill="none" stroke="#252A28" strokeWidth="1" strokeDasharray="2 3" />
          
          {/* Calorie needle */}
          <g transform={`rotate(${moveAngle - 90})`}>
            <line x1="0" y1="0" x2="0" y2="-20" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="3" fill="#EA4335" />
          </g>
          <text x="0" y="10" textAnchor="middle" fill="#EA4335" className="font-mono text-[7px] font-black uppercase tracking-wider">
            KCAL
          </text>
        </g>

        {/* --- RIGHT SUB-DIAL COMPLICATION (KM ROLEX STYLE) --- */}
        <g transform="translate(232, 208)">
          <circle cx="0" cy="0" r="26" fill="#141716" stroke="#3F4643" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="24" fill="none" stroke="#252A28" strokeWidth="1" strokeDasharray="2 3" />
          
          {/* Distance needle */}
          <g transform={`rotate(${kmAngle - 90})`}>
            <line x1="0" y1="0" x2="0" y2="-20" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="3" fill="#34A853" />
          </g>
          <text x="0" y="10" textAnchor="middle" fill="#34A853" className="font-mono text-[7px] font-black uppercase tracking-wider">
            KM
          </text>
        </g>
      </svg>

      {/* Central Horizon Digital Monolith Readout */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center mt-[-10px] pointer-events-auto">
        {/* Cue Pill */}
        <button
          onClick={onOpenReels}
          className="mb-1 px-2.5 py-0.5 rounded-full bg-[#1C1F1E] border border-[#FBBC05]/30 text-[9px] font-mono font-black tracking-widest text-[#FBBC05] uppercase transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1"
        >
          <Gauge className="w-2.5 h-2.5" />
          <span>CHRONO GT · 911</span>
        </button>

        {/* Dominant Condensed Step Numeral: Press & hold 1s */}
        <div
          {...stepLongPressHandlers}
          title="Press and hold 1s to set step target"
          className={`cursor-pointer group flex flex-col items-center transition-all my-0.5 select-none ${
            isPressing ? 'scale-95 opacity-80' : ''
          }`}
        >
          <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            {dailySteps.toLocaleString()}
          </span>

          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase mt-0.5 text-neutral-400">
            <span className="text-amber-400">STEPS</span>
            <span className="text-white/40">/ {(stepTarget / 1000).toFixed(0)}K</span>
            <Pencil className="w-2.5 h-2.5 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
          </div>
        </div>

        {/* Precision Sub-Dial Digital Vector Readouts */}
        <div className="mt-6 flex items-center justify-center gap-10 font-mono text-[10px] z-20">
          <div className="flex flex-col items-center">
            <span className="text-amber-400 font-black text-xs">{dailyMove}</span>
            <span className="text-[7.5px] text-white/50 tracking-wider">CALORIES</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-cyan-400 font-black text-xs">{dailyKm.toFixed(2)}</span>
            <span className="text-[7.5px] text-white/50 tracking-wider">DISTANCE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
