import React from 'react';
import { Plus } from 'lucide-react';
import type { Usual } from '../utils/fuelUsuals';

interface FuelUsualsRowProps {
  usuals: Usual[];
  /** Name of the meal these are ranked for, shown in the heading. */
  slotLabel: string;
  onLog: (usual: Usual) => void;
}

/** One-tap logging for the foods this person eats again and again. */
export const FuelUsualsRow: React.FC<FuelUsualsRowProps> = ({ usuals, slotLabel, onLog }) => {
  if (usuals.length === 0) return null;
  return (
    <section aria-label="Your usuals" className="px-1">
      <div className="flex items-baseline justify-between pb-2">
        <h2 className="text-o1-body font-semibold text-o1-text">Your usuals</h2>
        <span className="text-o1-label text-o1-muted">{slotLabel}</span>
      </div>
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {usuals.map((usual) => (
          <button
            key={usual.name}
            type="button"
            onClick={() => onLog(usual)}
            aria-label={`Log ${usual.name}, ${usual.calories} calories`}
            className="flex min-h-[56px] w-[148px] shrink-0 items-center gap-2 rounded-2xl border border-white/[0.07] bg-o1-surface px-3 text-left active:bg-o1-sheet cursor-pointer"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-o1-body font-medium text-o1-text">
                {usual.name}
              </span>
              <span className="block truncate text-o1-label tabular-nums text-o1-muted">
                {usual.calories} kcal · {usual.protein}g protein
              </span>
            </span>
            <Plus className="h-4 w-4 shrink-0 text-o1-crimson" aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
};
