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
      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
        <span>Muscle Group Strain Allocation</span>
        <span className="text-o1-crimson font-semibold">Target Muscle Partitions</span>
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
                  ? 'border-o1-crimson bg-o1-well'
                  : 'border-white/[0.07] bg-o1-well hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-tactical font-black uppercase tracking-wider text-white">
                  {d.day} • {d.split}
                </span>
                <span className="font-mono font-bold text-[11px] text-neutral-400">
                  {(d.volume / 1000).toFixed(1)}k kg
                </span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/[0.08] mb-1.5">
                {d.anatomy.map((part, pIdx) => (
                  <div key={pIdx} style={{ width: `${part.pct}%`, backgroundColor: part.color }} className="h-full border-r border-black/20 last:border-r-0" />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {d.anatomy.map((part, pIdx) => (
                  <span key={pIdx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-300">
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
