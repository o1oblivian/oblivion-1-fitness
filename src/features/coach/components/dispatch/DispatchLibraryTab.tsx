import React, { useMemo, useState } from 'react';
import { Check, Plus, Search } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { UNIFIED_DISPATCH_CATALOG } from '../../data/unifiedDispatchCatalog';
import type { DispatchCatalogExercise } from '../../data/dispatchExerciseCatalog';
import {
  EXERCISE_TYPES,
  MUSCLE_FILTER_CHIPS,
  type ExerciseType,
  type StackExercise,
} from './dispatchTypes';

interface DispatchLibraryTabProps {
  stack: StackExercise[];
  onAdd: (item: DispatchCatalogExercise) => void;
}

export const DispatchLibraryTab: React.FC<DispatchLibraryTabProps> = ({ stack, onAdd }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ExerciseType>('All');
  const [category, setCategory] = useState<string>('All');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = category.toLowerCase();
    return UNIFIED_DISPATCH_CATALOG.filter((ex) => {
      const hay = `${ex.name} ${ex.muscleTarget} ${ex.equipment} ${ex.category}`.toLowerCase();
      return (
        (!q || hay.includes(q)) &&
        (type === 'All' || ex.type === type) &&
        (category === 'All' || hay.includes(cat))
      );
    });
  }, [query, type, category]);

  const inStack = useMemo(() => new Set(stack.map((s) => s.name)), [stack]);

  return (
    <div className="space-y-3.5">
      <div className="relative">
        <Search size={15} className="text-o1-muted absolute left-3 top-3.5 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercise, muscle or equipment"
          aria-label="Search exercises"
          className="w-full h-11 pl-9 pr-3 rounded-2xl bg-o1-sheet border border-white/[0.07] text-xs text-o1-text placeholder:text-o1-muted outline-none focus:border-o1-crimson"
        />
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {MUSCLE_FILTER_CHIPS.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={category === cat}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setCategory(cat);
            }}
            className={`h-9 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
              category === cat ? 'bg-o1-crimson text-white' : 'bg-white/[0.08] text-o1-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {EXERCISE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setType(t);
            }}
            className={`h-8 px-2.5 rounded-xl text-[11px] font-semibold ${type === t ? 'bg-o1-crimson text-white' : 'bg-white/[0.08] text-o1-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {results.length === 0 ? (
          <p className="p-6 text-center text-xs text-o1-muted">No exercises match.</p>
        ) : (
          results.map((item) => {
            const added = inStack.has(item.name);
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-white/[0.07] bg-o1-surface flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-o1-text truncate">{item.name}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/[0.08] text-o1-muted shrink-0">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-o1-muted truncate">
                    {item.muscleTarget} · {item.equipment}
                  </p>
                  <p className="text-[10px] text-o1-muted font-mono">
                    {item.defaultSets} sets · {item.defaultReps} reps ·{' '}
                    {item.defaultWeightKg > 0 ? `${item.defaultWeightKg}kg` : 'BW'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  aria-label={added ? `Add ${item.name} again` : `Add ${item.name}`}
                  className={`flex h-9 items-center gap-1 px-3 rounded-xl text-xs font-bold shrink-0 ${
                    added
                      ? 'bg-white/[0.08] text-o1-muted border border-white/[0.07]'
                      : 'bg-o1-crimson text-white active:bg-o1-crimson-hover'
                  }`}
                >
                  {added ? <Check size={13} /> : <Plus size={13} />}
                  {added ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
