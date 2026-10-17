import React from 'react';
import { RotateCw, Droplet, Activity, Pill, Moon } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWallpaperStore } from '../../../stores/useWallpaperStore';
type VitalsTile = 'hydration' | 'biosync' | 'supplements' | 'sleep';

export interface HeroBackFaceProps {
  isFlipped: boolean;
  activeWallpaper?: string;
  hydrationCurrentL: number;
  waterPct: number;
  /** null = nothing logged; rendered as -- */
  readinessScore: number | null;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  restingHr?: number | null;
  supplementsTaken?: number;
  supplementsTotal?: number;
  onFlipBack: () => void;
  onOpenReadiness: () => void;
  onOpenTile: (type: VitalsTile) => void;
}

interface TileProps {
  label: string;
  icon: React.ReactNode;
  tone: string;
  value: string;
  sub: string;
  onOpen: () => void;
}

const Tile: React.FC<TileProps> = ({ label, icon, tone, value, sub, onOpen }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      tactileEngine.triggerSelectionBuzz();
      onOpen();
    }}
    className="min-h-[44px] flex flex-col text-left cursor-pointer active:scale-95 transition-all p-1 bg-transparent border-0"
  >
    <span className={`text-[11px] font-sans font-semibold flex items-center gap-1.5 ${tone}`}>
      {icon}
      {label}
    </span>
    <span className="text-base font-mono font-light text-white tracking-tight mt-0.5">{value}</span>
    <span className="text-[11px] font-sans font-medium text-white/75">{sub}</span>
  </button>
);

export const HeroBackFace: React.FC<HeroBackFaceProps> = ({
  isFlipped,
  activeWallpaper,
  hydrationCurrentL,
  waterPct,
  readinessScore,
  sleepHours = null,
  sleepQuality = null,
  restingHr = null,
  supplementsTaken = 0,
  supplementsTotal = 0,
  onFlipBack,
  onOpenReadiness,
  onOpenTile,
}) => {
  const wallpaperBrightness = useWallpaperStore((s) => s.brightness);
  const supplementSub =
    supplementsTotal === 0
      ? 'Add your stack'
      : supplementsTaken >= supplementsTotal
        ? 'All taken'
        : `${supplementsTotal - supplementsTaken} pending`;
  const hasWater = hydrationCurrentL > 0;

  return (
    <div
      id="hero-back-face"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        pointerEvents: isFlipped ? 'auto' : 'none',
      }}
      className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-transparent transition-opacity duration-300 ${
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
          style={{ filter: `brightness(${wallpaperBrightness / 100})` }}
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
            useWallpaperStore.getState().reportBroken(activeWallpaper);
          }}
        />
      )}

      <div className="relative w-full h-full flex flex-col justify-between p-3 pb-3.5 select-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
        <div className="flex justify-end items-center w-full z-10">
          <button
            type="button"
            id="back-face-flip-btn"
            aria-label="Flip back to main HUD"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onFlipBack();
            }}
            className="w-11 h-11 -mr-1.5 -mt-1.5 rounded-full bg-transparent border-0 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all"
          >
            <RotateCw className="w-4 h-4 stroke-[2.6]" />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            tactileEngine.triggerSelectionBuzz();
            onOpenReadiness();
          }}
          className="flex-1 flex flex-col items-center justify-center my-auto z-10 text-center bg-transparent border-0 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <span className="text-6xl sm:text-7xl font-mono font-light text-white tracking-tight">
            {readinessScore === null ? '--' : `${readinessScore}%`}
          </span>
          <span className="text-o1-crimson font-sans font-semibold text-[13px] mt-1">Restoration readiness</span>
          {readinessScore === null && (
            <span className="text-white/75 font-sans text-[11px] font-semibold mt-1.5">Log sleep to unlock</span>
          )}
        </button>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 z-10 w-full px-1">
          <Tile
            label="Hydration"
            tone="text-sky-600"
            icon={<Droplet className="w-3.5 h-3.5 stroke-[2.6]" />}
            value={hasWater ? `${hydrationCurrentL.toFixed(1)} L` : '--'}
            sub={hasWater ? `${Math.round(waterPct)}% of goal` : 'Not logged'}
            onOpen={() => onOpenTile('hydration')}
          />
          <Tile
            label="Biosync"
            tone="text-emerald-500"
            icon={<Activity className="w-3.5 h-3.5 stroke-[2.6]" />}
            value={restingHr === null ? '--' : `${restingHr} BPM`}
            sub={restingHr === null ? 'No wearable data' : 'Resting HR'}
            onOpen={() => onOpenTile('biosync')}
          />
          <Tile
            label="Supplements"
            tone="text-amber-400"
            icon={<Pill className="w-3.5 h-3.5 stroke-[2.6]" />}
            value={supplementsTotal === 0 ? '--' : `${supplementsTaken}/${supplementsTotal}`}
            sub={supplementSub}
            onOpen={() => onOpenTile('supplements')}
          />
          <Tile
            label="Sleep"
            tone="text-sky-600"
            icon={<Moon className="w-3.5 h-3.5 stroke-[2.6]" />}
            value={sleepHours === null ? '--' : `${sleepHours} h`}
            sub={sleepQuality === null ? 'Not logged' : `${sleepQuality}% restful`}
            onOpen={() => onOpenTile('sleep')}
          />
        </div>
      </div>
    </div>
  );
};


