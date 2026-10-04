import React from 'react';
import { DayStrainDetail } from './microcycleTypes';
import { tactileEngine } from '../../../../services/tactileEngine';

interface MicrocycleAnatomyProps {
  activeDays: DayStrainDetail[];
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
}

export const MicrocycleAnatomy: React.FC<MicrocycleAnatomyProps> = ({
  activeDays,
  selectedDayIdx,
  onSelectDay,
}) => {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400 px-1">
        <span>Muscle Group Strain Allocation</span>
        <span className="text-[#C4121A] font-semibold">Target Muscle Partitions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {activeDays.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          return (
            <button
              key={d.day}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                tactileEngine.triggerSelectionBuzz();
                onSelectDay(idx);
              }}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-left w-full ${
                isSelected
                  ? 'border-[#C4121A] bg-neutral-100 dark:bg-[#1f1f23]'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                  {d.day} • {d.split}
                </span>
                <span className="font-mono font-bold text-[11px] text-neutral-500 dark:text-neutral-400">
                  {(d.volume / 1000).toFixed(1)}k kg
                </span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-200 dark:bg-[#27272a] mb-1.5">
                {d.anatomy.map((part, pIdx) => (
                  <div key={pIdx} style={{ width: `${part.pct}%`, backgroundColor: part.color }} className="h-full border-r border-black/20 last:border-r-0" />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {d.anatomy.map((part, pIdx) => (
                  <span key={pIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                    {part.name}: {part.pct}%
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
