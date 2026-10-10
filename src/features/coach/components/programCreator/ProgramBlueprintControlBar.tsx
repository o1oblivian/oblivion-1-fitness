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
    <div className="p-3.5 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-3 shadow-2xs">
      {/* Header bar: Discipline indicator & Quick actions */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-o1-crimson" />
          <span className="text-o1-muted text-xs font-semibold">
            Discipline: <span className="text-o1-text font-bold">{selectedMuscleTag || category}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAutoProgramWeek && (
            <button
              type="button"
              onClick={onAutoProgramWeek}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
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
              className="text-[11px] text-slate-400 hover:text-o1-text flex items-center gap-1 font-semibold cursor-pointer"
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
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'bg-white/[0.08] text-o1-muted hover:text-o1-text hover:bg-neutral-700'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Action Bar: Dynamic Blueprint Trigger & Exercise Quick Adds */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.07]">
        <button
          type="button"
          onClick={onApplyBlueprint}
          className="px-3 py-1.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-o1-text text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply {selectedMuscleTag} Blueprint</span>
        </button>

        {quickAdds.map((qa) => (
          <button
            key={qa}
            type="button"
            onClick={() => onQuickAdd(qa)}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-o1-text text-[11px] font-medium truncate max-w-[170px] active:scale-95 transition-all cursor-pointer border border-white/[0.07]"
            title={`Quick add ${qa}`}
          >
            + {qa}
          </button>
        ))}
      </div>
    </div>
  );
};
