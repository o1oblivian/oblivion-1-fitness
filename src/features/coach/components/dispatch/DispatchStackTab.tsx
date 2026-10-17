import React, { useState } from 'react';
import { ChevronDown, Plus, SlidersHorizontal } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { StackExerciseCard } from './StackExerciseCard';
import type { DispatchStack } from './useDispatchStack';

export interface WorkoutSetup {
  title: string;
  /** Local calendar day the athlete should train, `YYYY-MM-DD`. */
  date: string;
  focus: string;
}

export function localDateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dispatchDayLabel(key: string): string {
  if (key === localDateKey()) return 'Today';
  if (key === localDateKey(1)) return 'Tomorrow';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime())
    ? key
    : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

interface DispatchStackTabProps {
  setup: WorkoutSetup;
  onSetupChange: (next: WorkoutSetup) => void;
  dispatch: DispatchStack;
  onOpenLibrary: () => void;
}

const FIELD =
  'px-3 h-10 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs text-o1-text outline-none focus:border-o1-crimson';

export const DispatchStackTab: React.FC<DispatchStackTabProps> = ({
  setup,
  onSetupChange,
  dispatch,
  onOpenLibrary,
}) => {
  const [editing, setEditing] = useState(false);
  const { stack } = dispatch;

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-o1-surface border border-white/[0.07] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-o1-text">
            <SlidersHorizontal size={14} className="text-o1-muted" />
            Workout details
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className="flex h-8 items-center gap-1 text-xs font-medium text-o1-muted active:text-o1-text"
          >
            {editing ? 'Done' : 'Edit'}
            <ChevronDown size={13} className={editing ? 'rotate-180' : ''} />
          </button>
        </div>

        {editing ? (
          <div className="space-y-2.5 pt-1">
            <input
              type="text"
              value={setup.title}
              onChange={(e) => onSetupChange({ ...setup, title: e.target.value })}
              placeholder="Workout title"
              aria-label="Workout title"
              className={`w-full font-semibold ${FIELD}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={setup.date}
                min={localDateKey()}
                onChange={(e) =>
                  onSetupChange({ ...setup, date: e.target.value || localDateKey() })
                }
                aria-label="Training day"
                className={`[color-scheme:dark] ${FIELD}`}
              />
              <select
                value={setup.focus}
                onChange={(e) => onSetupChange({ ...setup, focus: e.target.value })}
                aria-label="Focus"
                className={FIELD}
              >
                <option value="Hypertrophy (8-12)">Hypertrophy (8-12)</option>
                <option value="Max Strength (3-5)">Max Strength (3-5)</option>
                <option value="Conditioning / Engine">Conditioning / Engine</option>
                <option value="Recovery / Deload">Recovery / Deload</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-semibold text-o1-text truncate">{setup.title}</p>
            <p className="text-[11px] text-o1-muted truncate">
              {dispatchDayLabel(setup.date)} · {setup.focus}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-o1-text">Exercises ({stack.length})</span>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenLibrary();
          }}
          className="flex h-9 items-center gap-1.5 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-xs font-bold"
        >
          <Plus size={14} />
          Add exercise
        </button>
      </div>

      <div className="space-y-2.5">
        {stack.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/[0.07] text-center">
            <p className="text-xs text-o1-muted">
              No exercises yet. Tap Add exercise or load a blueprint.
            </p>
          </div>
        ) : (
          stack.map((exercise) => (
            <StackExerciseCard key={exercise.id} exercise={exercise} actions={dispatch} />
          ))
        )}
      </div>
    </div>
  );
};
