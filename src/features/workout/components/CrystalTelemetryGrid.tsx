import React from 'react';
import { Droplet, Activity, Pill, Moon } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface CrystalTelemetryGridProps {
  hydrationCurrentL: number;
  waterPct: number;
  sleepHours?: number;
  sleepQuality?: number;
  onOpenTile: (type: 'hydration' | 'biosync' | 'supplements' | 'sleep') => void;
}

export const CrystalTelemetryGrid: React.FC<CrystalTelemetryGridProps> = ({
  hydrationCurrentL,
  waterPct,
  sleepHours = 7.8,
  sleepQuality = 92,
  onOpenTile,
}) => {
  const tiles = [
    {
      id: 'hydration' as const,
      label: 'HYDRATION',
      value: `${hydrationCurrentL.toFixed(1)}L`,
      sub: `${Math.round(waterPct)}% TARGET`,
      icon: Droplet,
      color: 'text-sky-400',
      border: 'hover:border-sky-500/40',
    },
    {
      id: 'biosync' as const,
      label: 'BIOSYNC',
      value: '98% OPTIMAL',
      sub: 'HRV 74MS',
      icon: Activity,
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
    },
    {
      id: 'supplements' as const,
      label: 'SUPPLEMENTS',
      value: 'AM STACK',
      sub: 'TAKEN // ON-TRACK',
      icon: Pill,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/40',
    },
    {
      id: 'sleep' as const,
      label: 'SLEEP',
      value: `${sleepHours}H`,
      sub: `${sleepQuality}% RESTFUL`,
      icon: Moon,
      color: 'text-indigo-400',
      border: 'hover:border-indigo-500/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 z-10 w-full">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tactileEngine.triggerSelectionBuzz();
              onOpenTile(t.id);
            }}
            className={`p-2.5 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/10 ${t.border} text-left transition-all active:scale-98 cursor-pointer flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase">{t.label}</span>
              <Icon className={`w-3.5 h-3.5 ${t.color}`} />
            </div>
            <div className="mt-1.5">
              <div className="text-xs sm:text-sm font-mono font-bold text-white tracking-tight">{t.value}</div>
              <div className="text-[9px] font-mono text-neutral-400 uppercase mt-0.5">{t.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CrystalTelemetryGrid;
