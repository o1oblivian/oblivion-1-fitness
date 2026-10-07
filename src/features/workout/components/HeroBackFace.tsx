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
  sleepHours?: number;
  sleepQuality?: number;
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
  sleepHours = 7.8,
  sleepQuality = 92,
  onFlipBack,
  onOpenTile,
  onOpenSettings,
}) => {
  // Compute unified restoration / readiness metric
  const restorationScore = Math.min(
    100,
    Math.round((sleepQuality * 0.6) + (Math.min(hydrationCurrentL / 3.0, 1) * 40))
  );

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
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
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
            {restorationScore}%
          </div>
          <div className="text-o1-crimson font-mono font-extrabold text-[12px] sm:text-[13px] tracking-widest uppercase mt-1">
            RESTORATION READINESS
          </div>
          <div className="text-white/85 font-mono text-[11px] font-bold tracking-wider mt-1.5">
            HRV 74MS <span className="text-white/40 mx-1">•</span> RESTING HR 52BPM
          </div>
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
            <div className="text-[10px] font-mono font-extrabold tracking-widest text-sky-400 flex items-center gap-1.5 uppercase">
              <Droplet className="w-3.5 h-3.5 text-sky-400 stroke-[2.8]" />
              HYDRATION
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              {hydrationCurrentL.toFixed(1)}L
            </div>
            <div className="text-[10px] font-mono font-bold text-white/75 uppercase">
              {Math.round(waterPct)}% TARGET
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
            <div className="text-[10px] font-mono font-extrabold tracking-widest text-emerald-400 flex items-center gap-1.5 uppercase">
              <Activity className="w-3.5 h-3.5 text-emerald-400 stroke-[2.8]" />
              BIOSYNC
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              98% OPTIMAL
            </div>
            <div className="text-[10px] font-mono font-bold text-white/75 uppercase">
              HRV 74MS
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
            <div className="text-[10px] font-mono font-extrabold tracking-widest text-amber-400 flex items-center gap-1.5 uppercase">
              <Pill className="w-3.5 h-3.5 text-amber-400 stroke-[2.8]" />
              SUPPLEMENTS
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              AM STACK
            </div>
            <div className="text-[10px] font-mono font-bold text-white/75 uppercase">
              TAKEN // ON-TRACK
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
            <div className="text-[10px] font-mono font-extrabold tracking-widest text-sky-400 flex items-center gap-1.5 uppercase">
              <Moon className="w-3.5 h-3.5 text-sky-400 stroke-[2.8]" />
              SLEEP
            </div>
            <div className="text-sm sm:text-base font-mono font-black text-white tracking-tight mt-0.5">
              {sleepHours}H
            </div>
            <div className="text-[10px] font-mono font-bold text-white/75 uppercase">
              {sleepQuality}% RESTFUL
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBackFace;
