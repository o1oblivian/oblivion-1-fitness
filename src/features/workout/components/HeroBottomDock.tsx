import React from 'react';
import { Gauge, RotateCw } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface HeroBottomDockProps {
  activeDay: string;
  activeSplitLabel: string;
  isPresentDay: boolean;
  isWorkoutLoaded?: boolean;
  onOpenCardio?: () => void;
  onCycleDayDial: () => void;
  onLoadWorkout: () => void;
  onFlipToVitals: () => void;
}

export const HeroBottomDock: React.FC<HeroBottomDockProps> = ({
  activeDay,
  activeSplitLabel,
  isPresentDay,
  isWorkoutLoaded = false,
  onOpenCardio,
  onCycleDayDial,
  onLoadWorkout,
  onFlipToVitals,
}) => {
  return (
    <div
      id="hero-bottom-dock"
      className="relative z-10 flex items-center justify-between w-full select-none px-1"
    >
      {/* 1. Left Pill: CARDIO */}
      <button
        type="button"
        id="hero-cardio-btn"
        title="Open Cardio & Heart Rate Telemetry"
        onClick={(e) => {
          e.stopPropagation();
          tactileEngine.triggerSelectionBuzz();
          if (onOpenCardio) onOpenCardio();
          else onCycleDayDial();
        }}
        className="h-8 px-3.5 rounded-full bg-black/35 backdrop-blur-md border border-[#0284c7]/50 text-[#0284c7] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs font-mono font-bold tracking-wider shrink-0 shadow-xs hover:border-[#0284c7]/80 hover:bg-black/50"
      >
        <Gauge className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>CARDIO</span>
      </button>

      {/* 2. Middle Pill: DAY | SPLIT */}
      <div className="h-8 px-3.5 rounded-full bg-black/35 backdrop-blur-md border border-[#C4121A]/60 font-mono text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs">
        <button
          type="button"
          id="hero-cycle-day-btn"
          title={isPresentDay && !isWorkoutLoaded ? "Load Workout for Today" : "Cycle to Next Day"}
          onClick={(e) => {
            e.stopPropagation();
            tactileEngine.triggerSelectionBuzz();
            if (isPresentDay && !isWorkoutLoaded) {
              onLoadWorkout();
            } else {
              onCycleDayDial();
            }
          }}
          className="text-[#C4121A] font-black uppercase tracking-wider hover:opacity-80 active:scale-90 transition cursor-pointer"
        >
          {activeDay || 'THU'}
        </button>
        <span className="text-neutral-500/80 text-[11px] font-normal select-none">|</span>
        <button
          type="button"
          id="hero-load-workout-btn"
          title={isPresentDay && !isWorkoutLoaded ? "Load Active Routine" : "Cycle to Next Day"}
          onClick={(e) => {
            e.stopPropagation();
            tactileEngine.triggerSelectionBuzz();
            if (isPresentDay && !isWorkoutLoaded) {
              onLoadWorkout();
            } else {
              onCycleDayDial();
            }
          }}
          className="text-white font-extrabold uppercase tracking-wider hover:opacity-80 active:scale-95 transition cursor-pointer"
        >
          {activeSplitLabel || 'HYPER'}
        </button>
      </div>

      {/* 3. Right Pill: VITALS (No dot next vitals) */}
      <button
        type="button"
        id="hero-flip-vitals-btn"
        title="Flip to Biometrics & Restoration HUD"
        onClick={(e) => {
          e.stopPropagation();
          tactileEngine.triggerSelectionBuzz();
          onFlipToVitals();
        }}
        className="h-8 px-3.5 rounded-full bg-black/35 backdrop-blur-md border border-[#f59e0b]/50 text-[#f59e0b] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs font-mono font-bold tracking-wider shrink-0 shadow-xs hover:border-[#f59e0b]/80 hover:bg-black/50"
      >
        <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>VITALS</span>
      </button>
    </div>
  );
};

export default HeroBottomDock;
