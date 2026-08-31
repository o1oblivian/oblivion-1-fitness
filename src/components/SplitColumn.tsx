import React from 'react';
import { Play, Columns, ArrowRight, Zap, Target, Flame, Pencil } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';

interface SplitColumnProps {
  dailySteps: number;
  stepTarget: number;
  dailyMove: number;
  dailyKm: number;
  onOpenStepDial: () => void;
  onOpenReels: () => void;
  isRestTimerRunning?: boolean;
}

export const SplitColumn: React.FC<SplitColumnProps> = ({
  dailySteps,
  stepTarget,
  dailyMove,
  dailyKm,
  onOpenStepDial,
  onOpenReels,
}) => {
  const { isPressing, handlers: stepLongPressHandlers } = useLongPress(onOpenStepDial, { threshold: 1000 });
  const stepsPct = Math.min(dailySteps / (stepTarget || 10000), 1);
  const pctDisplay = ((dailySteps / (stepTarget || 10000)) * 100).toFixed(0);

  return (
    <div className="relative w-full aspect-square max-w-[340px] flex flex-col justify-between p-4 my-1 select-none">
      
      {/* Heavy Obsidian Slate Magazine Vessel */}
      <div className="absolute inset-1.5 rounded-3xl bg-[#090C12] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Subtle Editorial Grain & Rule Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />
        
        {/* Vertical Column Dividing Hairline */}
        <div className="absolute top-12 bottom-6 left-[56%] w-[1px] bg-white/15" />
      </div>

      {/* Top Editorial Masthead Header Bar */}
      <div className="relative z-20 w-full flex items-center justify-between border-b border-white/15 pb-2 pt-1 px-1 font-mono text-[9px]">
        <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>VOL. 06 · SPLIT COLUMN</span>
        </div>
        <button
          onClick={onOpenReels}
          className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest uppercase transition-all active:scale-95 cursor-pointer flex items-center gap-1"
        >
          <Play className="w-2 h-2 fill-current" />
          <span>REELS</span>
        </button>
      </div>

      {/* Main Split Column Editorial Layout */}
      <div className="relative z-20 grid grid-cols-12 gap-3 items-center my-auto py-2">
        
        {/* --- LEFT COLUMN: OVERSIZED CONDENSED STEP NUMBER (FULL HEIGHT - PRESS & HOLD 1S) --- */}
        <div 
          {...stepLongPressHandlers}
          title="Press and hold 1s to set step target"
          className={`col-span-7 flex flex-col justify-center cursor-pointer group transition-all pl-1 select-none ${
            isPressing ? 'scale-95 opacity-80' : ''
          }`}
        >
          <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">
            STEPS TODAY
          </span>
          
          <div className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">
            {dailySteps.toLocaleString()}
          </div>

          <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-neutral-400 tracking-wider">
            <span>TARGET</span>
            <span className="text-white font-bold">{stepTarget.toLocaleString()}</span>
            <Pencil className="w-2.5 h-2.5 text-emerald-400 ml-1" />
          </div>

          {/* Micro Vertical-Fill Progress Indicator Line */}
          <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(stepsPct * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: STACKED SMALL-CAPS EDITORIAL METRICS --- */}
        <div className="col-span-5 flex flex-col justify-center space-y-2.5 pl-2 font-mono">
          
          {/* Item 1: KCAL */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
              01 · ACTIVE BURN
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-amber-400 leading-none">
                {dailyMove}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold">KCAL</span>
            </div>
          </div>

          {/* Item 2: KM */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
              02 · DISTANCE
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-cyan-400 leading-none">
                {dailyKm.toFixed(2)}
              </span>
              <span className="text-[9px] text-neutral-400 font-bold">KM</span>
            </div>
          </div>

          {/* Item 3: % COMPLETION */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
              03 · COMPLETION
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-emerald-400 leading-none">
                {pctDisplay}%
              </span>
              <span className="text-[8px] text-neutral-500 uppercase font-bold">GOAL</span>
            </div>
          </div>

          {/* Item 4: INTENSITY */}
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">
              04 · INTENSITY
            </span>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
              RPE 8.5 · PEAK
            </span>
          </div>

        </div>
      </div>

      {/* Bottom Masthead Bar */}
      <div className="relative z-20 w-full flex items-center justify-between border-t border-white/15 pt-2 pb-1 px-1 font-mono text-[8.5px] text-neutral-400">
        <span>SWISS EDITORIAL SYSTEM</span>
        <span className="text-white font-bold">HYPERTROPHY CYCLE</span>
      </div>
    </div>
  );
};
