import React from 'react';
import { Gauge, Play, RotateCw } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface HeroBottomDockProps {
  activeDay: string;
  activeSplitLabel: string;
  hasSavedRoutine: boolean;
  onOpenCardio?: () => void;
  onLoadWorkout: () => void;
  onFlipToVitals: () => void;
}

const SIDE_PILL =
  'h-11 px-4 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-neutral-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-[13px] font-sans font-normal shrink-0 hover:border-white/25 hover:bg-black/60 disabled:opacity-40 disabled:cursor-not-allowed';

export const HeroBottomDock: React.FC<HeroBottomDockProps> = ({
  activeDay,
  activeSplitLabel,
  hasSavedRoutine,
  onOpenCardio,
  onLoadWorkout,
  onFlipToVitals,
}) => (
  <div
    id="hero-bottom-dock"
    className="relative z-10 flex items-center justify-between gap-2 w-full select-none px-0.5"
  >
    <button
      type="button"
      id="hero-cardio-btn"
      title="Scan a cardio session"
      disabled={!onOpenCardio}
      onClick={(e) => {
        e.stopPropagation();
        tactileEngine.triggerSelectionBuzz();
        onOpenCardio?.();
      }}
      className={SIDE_PILL}
    >
      <Gauge className="w-4 h-4" strokeWidth={1.75} />
      <span>Cardio</span>
    </button>

    <button
      type="button"
      id="hero-load-workout-btn"
      title={
        hasSavedRoutine
          ? `Start your saved ${activeDay} workout`
          : `No saved ${activeDay} workout yet`
      }
      aria-label={
        hasSavedRoutine
          ? `Start ${activeDay} ${activeSplitLabel} workout`
          : `${activeDay} ${activeSplitLabel}. No saved workout for this day yet`
      }
      onClick={(e) => {
        e.stopPropagation();
        onLoadWorkout();
      }}
      className={`h-11 min-w-0 px-4 rounded-full border text-[13px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
        hasSavedRoutine
          ? 'bg-o1-crimson border-o1-crimson hover:bg-o1-crimson-hover text-white'
          : 'bg-black/65 border-white/[0.12] hover:border-white/25 text-white'
      }`}
    >
      {hasSavedRoutine ? (
        <>
          <Play className="w-3.5 h-3.5 shrink-0" fill="currentColor" strokeWidth={0} />
          <span className="truncate">Start {activeSplitLabel}</span>
        </>
      ) : (
        <>
          <span>{activeDay}</span>
          <span className="text-white/40" aria-hidden>
            ·
          </span>
          <span className="font-light truncate">{activeSplitLabel}</span>
        </>
      )}
    </button>

    <button
      type="button"
      id="hero-flip-vitals-btn"
      title="Show vitals"
      onClick={(e) => {
        e.stopPropagation();
        tactileEngine.triggerSelectionBuzz();
        onFlipToVitals();
      }}
      className={SIDE_PILL}
    >
      <RotateCw className="w-4 h-4" strokeWidth={1.75} />
      <span>Vitals</span>
    </button>
  </div>
);
