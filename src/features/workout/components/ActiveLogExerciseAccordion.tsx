import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Layers, Dumbbell } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem } from '../../../types';
import { ActiveLogSetRow } from './ActiveLogSetRow';

export interface ActiveLogExerciseAccordionProps {
  exercise: ExerciseItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddSet: (exerciseId: string) => void;
  onDuplicateSet?: (exerciseId: string) => void;
  onRemoveSet?: (exerciseId: string, setNumber: number) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onSwapMovement?: (exerciseId: string) => void;
  onOpenDial: (
    exerciseId: string,
    setNumber: number,
    type: 'weight' | 'reps' | 'rpe',
    currentVal: number,
    setId?: string,
    setIndex?: number
  ) => void;
  onOpenPlateVisualizer?: (weightKg: number) => void;
  onToggleSet?: (exerciseId: string, setNumber: number, restSecs?: number) => void;
  onQuickUpdateSet?: (exerciseId: string, setNumber: number, updates: Partial<any>) => void;
}

export const ActiveLogExerciseAccordion: React.FC<ActiveLogExerciseAccordionProps> = ({
  exercise,
  isExpanded,
  onToggleExpand,
  onAddSet,
  onDuplicateSet,
  onRemoveSet,
  onRemoveExercise,
  onOpenDial,
  onOpenPlateVisualizer,
  onToggleSet,
  onQuickUpdateSet,
}) => {
  const setsList = exercise.sets || [];

  return (
    <div className="rounded-2xl bg-o1-card border border-white/[0.07] px-2 py-1 shadow-xs select-none transition-colors space-y-1.5">
      <div
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onToggleExpand();
        }}
        className="w-full flex items-center justify-between cursor-pointer select-none h-8"
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-1.5">
          <div className="text-o1-crimson -rotate-12 shrink-0">
            <Dumbbell className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <h4 className="font-tactical font-semibold text-[13px] text-white tracking-tight truncate leading-none">
            {exercise.name}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-sans text-[11px] text-neutral-400 font-medium">
            {setsList.length} {setsList.length === 1 ? 'set' : 'sets'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              tactileEngine.triggerSelectionBuzz();
              onRemoveExercise(exercise.id);
            }}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-o1-crimson rounded-md transition-colors cursor-pointer hover:bg-white/5 active:scale-95"
            title="Delete Exercise"
            aria-label="Delete Exercise"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Expanded Exercise Content: Column Headers, Set Rows, Action Controls */}
      {isExpanded && (
        <div className="space-y-2 pt-1">
          {/* Column Headers: SET | REPS | KG | RPE/RIR */}
          <div className="flex items-center gap-2 text-[11px] font-tactical font-bold text-neutral-400 tracking-wider px-1">
            <span className="w-7 text-left pl-1 shrink-0">Set</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="flex-1 text-center">KG</span>
            <span className="flex-1 text-center">RPE/RIR</span>
            <span className="w-6 shrink-0" />
          </div>

          {/* Set Rows */}
          <div className="space-y-1">
            {setsList.map((set, setIndex) => (
              <ActiveLogSetRow
                key={set.id || set.setNumber || setIndex}
                exerciseId={exercise.id}
                set={set}
                exerciseName={exercise.name}
                isDone={Boolean(set.completed)}
                onOpenDial={(type, currentVal) =>
                  onOpenDial(exercise.id, set.setNumber, type, currentVal, set.id, setIndex)
                }
                onOpenPlateVisualizer={onOpenPlateVisualizer}
                onRemoveSet={() => onRemoveSet?.(exercise.id, set.setNumber)}
                onToggleDone={() => onToggleSet?.(exercise.id, set.setNumber)}
                onQuickUpdateSet={(updates) => onQuickUpdateSet?.(exercise.id, set.setNumber, updates)}
              />
            ))}
          </div>

          {/* Bottom Action Row: [ + Add Set ]  [ ⧉ ]  [ 🗑 ] */}
          <div className="pt-1 flex items-center gap-2">
            {/* Wide + Add Set button with dashed red border */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onAddSet(exercise.id);
              }}
              className="flex-1 h-8 border border-dashed border-o1-crimson/50 hover:border-o1-crimson text-o1-crimson hover:bg-o1-crimson/10 font-tactical text-[11px] font-semibold tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Set</span>
            </button>

            {/* Duplicate set button */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (onDuplicateSet) {
                  onDuplicateSet(exercise.id);
                } else {
                  onAddSet(exercise.id);
                }
              }}
              className="h-8 w-8 rounded-xl border border-white/[0.07] bg-black text-neutral-300 hover:text-white hover:border-white/[0.14] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Duplicate Set"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Delete Exercise button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                tactileEngine.triggerSelectionBuzz();
                onRemoveExercise(exercise.id);
              }}
              className="w-7 h-7 rounded-lg border border-o1-crimson/40 bg-black text-o1-crimson hover:bg-o1-crimson/20 active:scale-95 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Delete Exercise"
              aria-label="Delete Exercise"
            >
              <Trash2 className="w-4 h-4 text-o1-crimson shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveLogExerciseAccordion;
