import React from 'react';
import { Sparkles, Sliders, Zap } from 'lucide-react';
import { ALL_DISCIPLINES } from './blueprintEngine';
import { tactileEngine } from '../../../../services/tactileEngine';

interface Props {
  category: string;
  selectedMuscleTag: string;
  quickAdds: string[];
  onSelectTag: (tag: string) => void;
  onApplyBlueprint: () => void;
  onQuickAdd: (name: string) => void;
  onSyncSplit?: () => void;
  onAutoProgramWeek?: () => void;
}

export const MUSCLE_TAGS = ALL_DISCIPLINES;

export const ProgramBlueprintControlBar: React.FC<Props> = ({
  category,
  selectedMuscleTag,
  quickAdds,
  onSelectTag,
  onApplyBlueprint,
  onQuickAdd,
  onSyncSplit,
  onAutoProgramWeek,
}) => {
  const availableTags = React.useMemo(() => {
    const set = new Set<string>(ALL_DISCIPLINES);
    if (category && category !== 'Hypertrophy') {
      set.add(category);
    }
    return Array.from(set);
  }, [category]);

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-2xs">
      {/* Header bar: Discipline indicator & Quick actions */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C4121A]" />
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            Discipline: <span className="text-neutral-900 dark:text-white font-bold">{selectedMuscleTag || category}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAutoProgramWeek && (
            <button
              type="button"
              onClick={onAutoProgramWeek}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
              title="Auto-generate database workouts for all days of the current week"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Program Week</span>
            </button>
          )}

          {onSyncSplit && (
            <button
              type="button"
              onClick={onSyncSplit}
              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              title={`Sync schedule focus to ${selectedMuscleTag || category}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Sync Split</span>
            </button>
          )}
        </div>
      </div>

      {/* Selectable Discipline Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {availableTags.map((t) => {
          const isSelected = selectedMuscleTag.toLowerCase() === t.toLowerCase();
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectTag(t);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-bold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Action Bar: Dynamic Blueprint Trigger & Exercise Quick Adds */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
        <button
          type="button"
          onClick={onApplyBlueprint}
          className="px-3 py-1.5 rounded-xl bg-[#C4121A] hover:bg-[#a80f16] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply {selectedMuscleTag} Blueprint</span>
        </button>

        {quickAdds.map((qa) => (
          <button
            key={qa}
            type="button"
            onClick={() => onQuickAdd(qa)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium truncate max-w-[170px] active:scale-95 transition-all cursor-pointer border border-neutral-200/80 dark:border-neutral-700/60"
            title={`Quick add ${qa}`}
          >
            + {qa}
          </button>
        ))}
      </div>
    </div>
  );
};
