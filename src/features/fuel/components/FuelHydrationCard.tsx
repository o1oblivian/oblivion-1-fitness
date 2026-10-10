import React from 'react';
import { Droplet, Minus, Plus } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface FuelHydrationCardProps {
  hydrationCurrentL: number;
  hydrationTargetL: number;
  logHydration: (liters: number) => void;
  showToast?: (msg: string) => void;
}

export const FuelHydrationCard: React.FC<FuelHydrationCardProps> = ({
  hydrationCurrentL,
  hydrationTargetL,
  logHydration,
  showToast,
}) => {
  const current = Number.isFinite(hydrationCurrentL) ? Math.max(0, hydrationCurrentL) : 0;
  const target = Number.isFinite(hydrationTargetL) && hydrationTargetL > 0 ? hydrationTargetL : 0;
  const progressPercent = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

  return (
    <div
      id="fuel-hydration-card"
      className="bg-o1-card border border-sky-900/30 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shadow-xs select-none"
    >
      <div className="w-8 h-8 rounded-xl bg-sky-950/50 border border-sky-800 text-sky-400 flex items-center justify-center shrink-0">
        <Droplet className="w-4 h-4 fill-sky-500/25 stroke-[2]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-semibold text-white">Water</span>
          <span className="text-[11px] font-mono tabular-nums text-sky-400">
            {current.toFixed(2)} / {target > 0 ? target.toFixed(1) : '--'} L
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-o1-well overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-600 to-emerald-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            logHydration(-0.25);
            showToast?.('Removed 250ml');
          }}
          className="w-7 h-7 rounded-lg bg-o1-well border border-white/[0.07] text-neutral-500 flex items-center justify-center cursor-pointer active:scale-95"
        >
          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerImpactPulse();
            logHydration(0.25);
            showToast?.('+250ml');
          }}
          className="h-7 px-2 rounded-xl bg-sky-950/40 border border-sky-800 text-sky-300 text-[10px] font-semibold cursor-pointer active:scale-95"
        >
          +250
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerImpactPulse();
            logHydration(0.5);
            showToast?.('+500ml');
          }}
          className="h-7 px-2 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-[10px] font-semibold cursor-pointer active:scale-95"
        >
          +500
        </button>
      </div>
    </div>
  );
};

export default FuelHydrationCard;
