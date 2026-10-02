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
  const target = hydrationTargetL > 0 ? hydrationTargetL : 3.0;
  const progressPercent = Math.min(100, Math.max(0, (hydrationCurrentL / target) * 100));
  const remainingL = Math.max(0, target - hydrationCurrentL);

  return (
    <div
      id="fuel-hydration-card"
      className="bg-white dark:bg-[#121214] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-2xs transition-colors select-none"
    >
      {/* Top Header: Title & Remaining Target */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Droplet className="w-4 h-4 fill-sky-500/20 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white tracking-tight">
                Hydration Engine
              </h3>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              {remainingL > 0 ? `${remainingL.toFixed(1)}L remaining to optimal balance` : 'Daily hydration target achieved!'}
            </p>
          </div>
        </div>

        {/* Quick Increment Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              logHydration(-0.25);
              showToast?.('Removed -250ml Water');
            }}
            className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Remove 250ml"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerImpactPulse();
              logHydration(0.25);
              showToast?.('Logged +250ml Water (Glass)');
            }}
            className="px-2.5 h-7 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-[11px] font-mono font-bold tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Add Glass (+250ml)"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>250ML</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerImpactPulse();
              logHydration(0.5);
              showToast?.('Logged +500ml Water (Bottle)');
            }}
            className="px-2.5 h-7 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-[11px] font-mono font-bold tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Add Bottle (+500ml)"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>500ML</span>
          </button>
        </div>
      </div>

      {/* Fluid Liquid Level Meter Bar */}
      <div className="relative h-6 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 overflow-hidden flex items-center justify-between px-3">
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-500 via-sky-400 to-teal-400 rounded-xl transition-all duration-500 shadow-sm"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="relative z-10 text-[11px] font-mono font-bold text-neutral-800 dark:text-white drop-shadow-xs">
          {hydrationCurrentL.toFixed(2)}L Logged
        </span>
        <span className="relative z-10 text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 drop-shadow-xs">
          Target: {target.toFixed(1)}L
        </span>
      </div>
    </div>
  );
};

export default FuelHydrationCard;
