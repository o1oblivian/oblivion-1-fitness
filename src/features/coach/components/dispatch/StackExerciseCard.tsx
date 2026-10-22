import React from 'react';
import { ChevronDown, ChevronUp, Dumbbell, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { RECOMMENDED_CUE_CHIPS, type StackExercise } from './dispatchTypes';
import type { DispatchStack } from './useDispatchStack';

interface StackExerciseCardProps {
  exercise: StackExercise;
  actions: Pick<
    DispatchStack,
    | 'toggleExpand'
    | 'removeExercise'
    | 'addSet'
    | 'removeSet'
    | 'updateSet'
    | 'setCue'
    | 'appendCue'
    | 'resetCue'
  >;
}

const SET_INPUT =
  'col-span-3 h-9 text-center rounded-lg bg-o1-sheet border border-white/[0.07] font-bold outline-none focus:border-o1-crimson';

export const StackExerciseCard: React.FC<StackExerciseCardProps> = ({ exercise, actions }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-o1-surface overflow-hidden">
    <div className="p-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center text-o1-text shrink-0">
          <Dumbbell size={15} />
        </div>
        <div className="min-w-0">
          <h4 className="text-o1-body font-bold text-o1-text truncate">{exercise.name}</h4>
          <p className="text-o1-label text-o1-muted truncate">{exercise.muscle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => actions.toggleExpand(exercise.id)}
          aria-expanded={Boolean(exercise.expanded)}
          className="flex h-10 items-center gap-1 px-2.5 rounded-xl text-xs font-bold text-o1-crimson active:bg-white/[0.06]"
        >
          <span>{exercise.sets.length} sets</span>
          {exercise.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={() => actions.removeExercise(exercise.id)}
          aria-label={`Remove ${exercise.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-o1-muted active:bg-white/[0.06]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>

    {exercise.expanded ? (
      <div className="p-3 pt-0 border-t border-white/[0.07] space-y-2.5">
        <div className="space-y-1.5 pt-2">
          <div className="grid grid-cols-12 gap-1.5 text-o1-label font-semibold text-o1-muted text-center items-center">
            <span className="col-span-2">Set</span>
            <span className="col-span-3">KG</span>
            <span className="col-span-3">Reps</span>
            <span className="col-span-3">RPE</span>
            <span className="col-span-1" />
          </div>

          {exercise.sets.map((set, idx) => (
            <div key={set.id} className="grid grid-cols-12 gap-1.5 items-center text-xs font-num">
              <span className="col-span-2 text-center text-o1-muted font-bold">#{idx + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                aria-label={`Set ${idx + 1} weight in kg`}
                value={set.weightKg}
                onChange={(e) =>
                  actions.updateSet(exercise.id, set.id, 'weightKg', Number(e.target.value))
                }
                className={`${SET_INPUT} text-o1-text`}
              />
              <input
                type="number"
                inputMode="numeric"
                aria-label={`Set ${idx + 1} reps`}
                value={set.reps}
                onChange={(e) =>
                  actions.updateSet(exercise.id, set.id, 'reps', Number(e.target.value))
                }
                className={`${SET_INPUT} text-o1-text`}
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                aria-label={`Set ${idx + 1} RPE`}
                value={set.rpe}
                onChange={(e) =>
                  actions.updateSet(exercise.id, set.id, 'rpe', Number(e.target.value))
                }
                className={`${SET_INPUT} text-o1-crimson`}
              />
              <button
                type="button"
                onClick={() => actions.removeSet(exercise.id, set.id)}
                aria-label={`Delete set ${idx + 1}`}
                className="col-span-1 flex items-center justify-center h-9 text-o1-muted active:scale-90"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-o1-sheet border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-o1-label text-o1-crimson flex items-center gap-1.5">
              <Sparkles size={11} />
              Form cue
            </span>
            <button
              type="button"
              onClick={() => actions.resetCue(exercise.id)}
              className="flex h-8 items-center gap-1 text-o1-label text-o1-muted active:text-o1-text"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          </div>

          <textarea
            value={exercise.cue}
            onChange={(e) => actions.setCue(exercise.id, e.target.value)}
            placeholder="Form cues, tempo or notes for the athlete"
            rows={2}
            className="w-full p-2 text-xs text-o1-text bg-o1-surface rounded-lg border border-white/[0.07] focus:border-o1-crimson outline-none resize-none leading-relaxed"
          />

          <div className="flex flex-wrap gap-1">
            {RECOMMENDED_CUE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => actions.appendCue(exercise.id, chip)}
                className="px-2 py-1 rounded-md bg-white/[0.08] text-o1-label font-medium text-o1-text border border-white/[0.07] active:bg-o1-crimson/10"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => actions.addSet(exercise.id)}
            className="flex h-9 items-center gap-1 text-xs font-bold text-o1-crimson"
          >
            <Plus size={14} />
            Add set
          </button>
        </div>
      </div>
    ) : null}
  </div>
);
