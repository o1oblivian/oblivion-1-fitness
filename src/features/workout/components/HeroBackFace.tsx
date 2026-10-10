import React from 'react';
import { RotateCw, Droplet, Activity, Pill, Moon } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWallpaperStore } from '../../../stores/useWallpaperStore';
import { modalActions } from '../../../components/modals/useModalStore';

export interface HeroBackFaceProps {
  isFlipped: boolean;
  activeWallpaper?: string;
  hydrationCurrentL: number;
  waterPct: number;
  /** null = nothing logged; rendered as -- */
  sleepHours?: number | null;
  sleepQuality?: number | null;
  restingHr?: number | null;
  supplementsTaken?: number;
  supplementsTotal?: number;
  onCycleWallpaper: () => void;
  onFlipBack: () => void;
  onOpenTile: (type: 'hydration' | 'biosync' | 'supplements' | 'sleep') => void;
  onOpenSettings?: () => void;
}

export const HeroBackFace: React.FC<HeroBackFaceProps> = ({
  isFlipped,
  activeWallpaper,
  hydrationCurrentL,
  waterPct,
  sleepHours = null,
  sleepQuality = null,
  restingHr = null,
  supplementsTaken = 0,
  supplementsTotal = 0,
  onFlipBack,
  onOpenTile,
  onOpenSettings,
}) => {
  // Restoration needs a logged sleep quality; without it there is nothing honest to score.
  const restorationScore =
    sleepQuality === null
      ? null
      : Math.min(100, Math.round(sleepQuality * 0.6 + Math.min(hydrationCurrentL / 3.0, 1) * 40));
  const supplementSub =
    supplementsTotal === 0
      ? 'Add your stack'
      : supplementsTaken >= supplementsTotal
        ? 'All taken'
        : `${supplementsTotal - supplementsTaken} pending`;

  return (
    <div
      id="hero-back-face"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        pointerEvents: isFlipped ? 'auto' : 'none',
      }}
      className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-2xl overflow-hidden bg-transparent transition-opacity duration-300 ${
        isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {activeWallpaper && (
        <img
          key={activeWallpaper}
          src={activeWallpaper}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 select-none pointer-events-none"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            useWallpaperStore.getState().reportBroken(activeWallpaper);
          }}
        />
      )}

      {/* Pure Nude Telemetry HUD: Zero Rings, Zero Card Boxes, Zero Fog Halo */}
      <div className="relative w-full h-full flex flex-col justify-between p-3.5 pb-4 select-none">
        {/* Top Bar: Status dots & Frameless Flip Button */}
        <div className="flex justify-between items-center w-full z-10">
          <button
            type="button"
            id="back-face-settings-trigger"
            title="Settings & Athlete Profile"
            aria-label="Settings and Profile"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              if (onOpenSettings) onOpenSettings();
              else modalActions.openSettings();
            }}
            className="p-1 flex flex-col items-center justify-center gap-1 bg-transparent border-0 cursor-pointer active:scale-90 transition-transform"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson" />
            <span className="w-1.5 h-1.5 rounded-full bg-o1-caution" />
            <span className="w-1.5 h-1.5 rounded-full bg-o1-ok" />
          </button>

          <button
            type="button"
            id="back-face-flip-btn"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onFlipBack();
            }}
            title="Flip back to main HUD"
            className="p-1.5 bg-transparent border-0 text-white/90 hover:text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all"
          >
            <RotateCw className="w-4 h-4 text-white stroke-[2.8]" />
          </button>
        </div>

        {/* Center: Hero Readiness Score & HRV Telemetry (Pure Crisp Nude on Wallpaper) */}
        <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 text-center pointer-events-none">
          <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight">
            {restorationScore === null ? '--' : `${restorationScore}%`}
          </div>
          <div className="text-o1-crimson font-sans font-semibold text-[12px] sm:text-[13px] tracking-normal mt-1">
            Restoration readiness
          </div>
          {restorationScore === null && (
            <div className="text-white/70 font-sans text-[11px] font-semibold tracking-normal mt-1.5">
              Log sleep to unlock
            </div>
          )}
        </div>

        {/* Bottom: Nude 4-Column Telemetry Matrix (Zero Frames, Zero Fog, Direct on OLED) */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 z-10 w-full px-1">
          {/* 1. Hydration */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onOpenTile('hydration');
            }}
            className="flex flex-col text-left cursor-pointer active:scale-95 transition-all p-1 bg-transparent border-0"
          >
            <div className="text-[10px] font-sans font-semibold tracking-normal text-sky-400 flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-sky-400 stroke-[2.8]" />
              Hydration
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              {hydrationCurrentL.toFixed(1)}L
            </div>
            <div className="text-[10px] font-sans font-medium text-white/75">
              {Math.round(waterPct)}% target
            </div>
          </button>

          {/* 2. BioSync / HRV */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onOpenTile('biosync');
            }}
            className="flex flex-col text-left cursor-pointer active:scale-95 transition-all p-1 bg-transparent border-0"
          >
            <div className="text-[10px] font-sans font-semibold tracking-normal text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 stroke-[2.8]" />
              Biosync
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              {restingHr === null ? '--' : `${restingHr} BPM`}
            </div>
            <div className="text-[10px] font-sans font-medium text-white/75">
              {restingHr === null ? 'No wearable data' : 'Resting HR'}
            </div>
          </button>

          {/* 3. Supplements */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onOpenTile('supplements');
            }}
            className="flex flex-col text-left cursor-pointer active:scale-95 transition-all p-1 bg-transparent border-0"
          >
            <div className="text-[10px] font-sans font-semibold tracking-normal text-amber-400 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-amber-400 stroke-[2.8]" />
              Supplements
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              {supplementsTotal === 0 ? '--' : `${supplementsTaken}/${supplementsTotal}`}
            </div>
            <div className="text-[10px] font-sans font-medium text-white/75">
              {supplementSub}
            </div>
          </button>

          {/* 4. Sleep */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onOpenTile('sleep');
            }}
            className="flex flex-col text-left cursor-pointer active:scale-95 transition-all p-1 bg-transparent border-0"
          >
            <div className="text-[10px] font-sans font-semibold tracking-normal text-sky-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-sky-400 stroke-[2.8]" />
              Sleep
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              {sleepHours === null ? '--' : `${sleepHours}H`}
            </div>
            <div className="text-[10px] font-sans font-medium text-white/75">
              {sleepQuality === null ? 'Not logged' : `${sleepQuality}% restful`}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBackFace;
