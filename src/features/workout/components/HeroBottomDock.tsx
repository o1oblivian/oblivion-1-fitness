import React from 'react';
import { Gauge, RotateCw } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface HeroBottomDockProps {
  activeDay: string;
  activeSplitLabel: string;
  isPresentDay: boolean;
  onOpenCardio?: () => void;
  onCycleDayDial: () => void;
  onLoadWorkout: () => void;
  onFlipToVitals: () => void;
}

export const HeroBottomDock: React.FC<HeroBottomDockProps> = ({
  activeDay,
  activeSplitLabel,
  isPresentDay,
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
        className="h-8 px-3.5 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-neutral-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs font-sans font-semibold tracking-wide shrink-0 hover:border-white/25 hover:bg-black/50"
      >
        <Gauge className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Cardio</span>
      </button>

      {/* 2. Middle Pill: DAY | SPLIT */}
      <div className="h-8 px-3.5 rounded-full bg-black/60 border border-white/[0.07] font-mono text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-none">
        <button
          type="button"
          id="hero-cycle-day-btn"
          title={isPresentDay ? "Load today's saved workout" : "Browse day"}
          onClick={(e) => {
            e.stopPropagation();
            tactileEngine.triggerSelectionBuzz();
            if (isPresentDay) {
              onLoadWorkout();
            } else {
              onCycleDayDial();
            }
          }}
          className="text-white font-semibold tracking-normal hover:opacity-80 active:scale-90 transition cursor-pointer"
        >
          {activeDay || 'Thu'}
        </button>
        <span className="text-neutral-500/80 text-[11px] font-normal select-none">|</span>
        <button
          type="button"
          id="hero-load-workout-btn"
          title="Browse day dials"
          onClick={(e) => {
            e.stopPropagation();
            tactileEngine.triggerSelectionBuzz();
            onCycleDayDial();
          }}
          className="text-white font-extrabold tracking-normal hover:opacity-80 active:scale-95 transition cursor-pointer"
        >
          {activeSplitLabel || 'Hyper'}
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
        className="h-8 px-3.5 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-neutral-300 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-xs font-sans font-semibold tracking-wide shrink-0 hover:border-white/25 hover:bg-black/50"
      >
        <RotateCw className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Vitals</span>
      </button>
    </div>
  );
};

export default HeroBottomDock;
