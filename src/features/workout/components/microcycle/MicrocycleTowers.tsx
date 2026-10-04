import React from 'react';
import { DayStrainDetail } from './microcycleTypes';
import { tactileEngine } from '../../../../services/tactileEngine';

interface MicrocycleTowersProps {
  activeDays: DayStrainDetail[];
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
  maxVolume?: number;
  avgTargetVolume?: number;
}

const DAY_SLAB_PALETTES: Record<string, string[]> = {
  Mon: ['#dc2626', '#ea580c', '#f97316', '#fbbf24', '#f59e0b', '#d97706', '#b91c1c'],
  Tue: ['#b45309', '#d97706', '#f59e0b', '#fbbf24', '#f59e0b', '#ea580c', '#78350f'],
  Wed: ['#881337', '#991b1b', '#b91c1c', '#C4121A', '#b91c1c', '#991b1b', '#7f1d1d'],
  Thu: ['#0284c7', '#0ea5e9', '#38bdf8', '#0284c7', '#0369a1', '#0369a1', '#075985'],
  Fri: ['#c2410c', '#ea580c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'],
  Sat: ['#047857', '#059669', '#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  Sun: ['#0284c7', '#0ea5e9', '#38bdf8', '#0284c7', '#0369a1', '#0369a1', '#075985'],
};

const calculateSlabCount = (volume: number): number => {
  if (volume <= 0) return 0;
  if (volume < 1500) return 1;
  if (volume < 3000) return 2;
  if (volume < 4500) return 3;
  if (volume < 6000) return 4;
  if (volume < 7500) return 5;
  if (volume < 9000) return 6;
  return 7;
};

export const MicrocycleTowers: React.FC<MicrocycleTowersProps> = ({ activeDays, selectedDayIdx, onSelectDay }) => {
  return (
    <div className="relative pt-2 pb-1 select-none">
      {/* Dashed Baseline Target Line across towers at 5.5k kg mark */}
      <div className="absolute left-0 right-0 border-b border-dashed border-neutral-400/70 dark:border-neutral-600/70 pointer-events-none z-10 flex items-center justify-end pr-1" style={{ bottom: '120px' }}>
        <span className="text-[8px] font-mono uppercase tracking-widest font-semibold text-neutral-500 dark:text-neutral-400 select-none pb-0.5">BASELINE TARGET</span>
      </div>

      {/* 7-Day Genuine Tower Row */}
      <div className="flex items-end justify-between px-1.5 pt-4 pb-2 relative h-[196px]">
        {activeDays.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          const tonnageLabel = d.volume > 0 ? `${(d.volume / 1000).toFixed(1)}k` : '--';
          const slabCount = calculateSlabCount(d.volume);
          const palette = DAY_SLAB_PALETTES[d.day] || DAY_SLAB_PALETTES.Mon;

          return (
            <button
              key={d.day}
              type="button"
              onClick={() => { tactileEngine.triggerSelectionBuzz(); onSelectDay(idx); }}
              className="flex flex-col items-center justify-end h-full group cursor-pointer relative bg-transparent border-0 p-0 m-0 focus:outline-hidden"
            >
              {/* Genuine Top Metric Label */}
              <span className={`text-[12px] font-mono mb-1.5 transition-all ${isSelected ? 'text-neutral-900 dark:text-white font-bold' : 'text-neutral-500 dark:text-neutral-400 font-medium'}`}>
                {tonnageLabel}
              </span>

              {/* Capsule Pill Track: exactly 7 slabs with tight 1px hairline gaps */}
              <div className={`w-9 sm:w-10 h-[142px] rounded-2xl relative overflow-hidden flex flex-col-reverse justify-start p-[3px] gap-[1px] transition-all duration-200 ${
                isSelected ? 'border-2 border-[#C4121A] shadow-none bg-neutral-100 dark:bg-[#18181b]' : 'bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800'
              }`}>
                {[0, 1, 2, 3, 4, 5, 6].map((slabIdx) => {
                  const isFilled = slabIdx < slabCount;
                  if (isFilled) {
                    const slabColor = palette[slabIdx] || '#ea580c';
                    const rounded = slabIdx === 0 && slabIdx === slabCount - 1 ? 'rounded-xl' : slabIdx === 0 ? 'rounded-b-xl' : slabIdx === slabCount - 1 ? 'rounded-t-xl' : '';
                    return (
                      <div key={slabIdx} style={{ backgroundColor: slabColor }} className={`w-full h-[18px] shrink-0 border-b border-black/25 last:border-b-0 transition-all ${rounded}`} />
                    );
                  }
                  return (
                    <div key={slabIdx} className="w-full h-[18px] shrink-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3.5 h-[1.5px] bg-neutral-300 dark:bg-neutral-700/60 rounded-full" />
                    </div>
                  );
                })}
              </div>

              {/* Day Label with Underline for Active Selection */}
              <div className="mt-1.5 flex flex-col items-center min-h-[22px]">
                <span className={`text-xs uppercase tracking-wider transition-colors ${isSelected ? 'text-[#C4121A] font-bold' : 'text-neutral-500 dark:text-neutral-400 font-medium'}`}>
                  {d.day}
                </span>
                {isSelected && <div className="w-5 h-[2px] bg-[#C4121A] rounded-full mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MicrocycleTowers;
