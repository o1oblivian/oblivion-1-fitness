import React, { useState } from 'react';
import { Trash2, Check, Plus, Minus } from 'lucide-react';
import { ExerciseSet } from '../../../types';
import { tactileEngine } from '../../../services/tactileEngine';

export interface ActiveLogSetRowProps {
  exerciseId: string;
  set: ExerciseSet;
  isDone?: boolean;
  onOpenDial: (type: 'weight' | 'reps' | 'rpe', currentVal: number) => void;
  onOpenPlateVisualizer?: (weight: number) => void;
  onRemoveSet?: () => void;
  onToggleDone?: () => void;
  onQuickUpdateSet?: (updates: Partial<ExerciseSet>) => void;
}

export const ActiveLogSetRow: React.FC<ActiveLogSetRowProps> = ({
  set,
  isDone,
  onOpenDial,
  onRemoveSet,
  onToggleDone,
  onQuickUpdateSet,
}) => {
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
  const rpeVal = Number(set.rpe ?? 8);
  const reps = Number(set.reps ?? 10);
  const weightKg = Number(set.weightKg ?? set.weight ?? 0);
  const oneRepMax = weightKg > 0 ? Math.round(weightKg * (1 + reps / 30)) : 0;
  const pbText = weightKg > 0 ? `+${weightKg} kg PB` : '+0 kg PB';

  const handleQuickWeight = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    const nextWeight = Math.max(0, +(weightKg + delta).toFixed(1));
    if (onQuickUpdateSet) {
      onQuickUpdateSet({ weightKg: nextWeight, weight: nextWeight });
    } else {
      onOpenDial('weight', nextWeight);
    }
  };

  const handleQuickReps = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    const nextReps = Math.max(1, reps + delta);
    if (onQuickUpdateSet) {
      onQuickUpdateSet({ reps: nextReps });
    } else {
      onOpenDial('reps', nextReps);
    }
  };

  return (
    <div
      className={`space-y-1 select-none py-1.5 px-1.5 rounded-2xl transition-colors ${
        isDone
          ? 'bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-600/30'
          : 'bg-white dark:bg-[#18181b]/60 border border-neutral-200/80 dark:border-neutral-800'
      }`}
    >
      {/* Set Row: [SET / CHECK] [REPS] [KG] [RPE/RIR] [🗑] */}
      <div className="flex items-center gap-2">
        {/* SET Number or Done Check */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onToggleDone?.();
          }}
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs cursor-pointer transition-all ${
            isDone
              ? 'bg-green-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[#C4121A]'
          }`}
          title={isDone ? 'Mark Incomplete' : 'Mark Completed (auto-starts rest)'}
        >
          {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : set.setNumber}
        </button>

        {/* REPS Pill Button */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenDial('reps', reps);
          }}
          className={`flex-1 h-9 rounded-xl font-mono font-bold text-sm flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border ${
            isDone
              ? 'bg-green-50/60 dark:bg-green-950/40 border-green-300 dark:border-green-600/30 text-green-800 dark:text-green-200'
              : 'bg-neutral-50 dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-[#C4121A] text-neutral-900 dark:text-white'
          }`}
          title="Adjust Repetitions"
        >
          {reps}
        </button>

        {/* KG Pill Button */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenDial('weight', weightKg);
          }}
          className={`flex-1 h-9 rounded-xl font-mono font-bold text-sm flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border ${
            isDone
              ? 'bg-green-50/60 dark:bg-green-950/40 border-green-300 dark:border-green-600/30 text-green-800 dark:text-green-200'
              : 'bg-neutral-50 dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-[#C4121A] text-neutral-900 dark:text-white'
          }`}
          title="Adjust Weight Load (KG)"
        >
          {weightKg}
        </button>

        {/* RPE/RIR Pill Button */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenDial('rpe', rpeVal);
          }}
          className={`flex-1 h-9 rounded-xl font-mono font-bold text-sm flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border ${
            isDone
              ? 'bg-green-50/60 dark:bg-green-950/40 border-green-300 dark:border-green-600/30 text-green-800 dark:text-green-200'
              : 'bg-neutral-50 dark:bg-[#121214] border-neutral-200 dark:border-neutral-800 hover:border-[#C4121A] text-neutral-900 dark:text-white'
          }`}
          title="Adjust RPE (Rate of Perceived Exertion)"
        >
          {rpeVal}
        </button>

        {/* Delete Set Icon */}
        <div className="flex justify-end shrink-0">
          {onRemoveSet && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                tactileEngine.triggerSelectionBuzz();
                onRemoveSet();
              }}
              className="p-2 min-w-[32px] min-h-[32px] flex items-center justify-center text-neutral-400 hover:text-[#C4121A] active:scale-95 transition-colors cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5"
              title="Delete Set"
              aria-label="Delete Set"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Row: PB & 1RM + Beginner Quick Bumper Toggle */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#C4121A] font-bold">{pbText}</span>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowQuickAdjust(!showQuickAdjust);
            }}
            className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline cursor-pointer font-sans"
          >
            {showQuickAdjust ? 'Hide quick bumps' : 'Quick bumps'}
          </button>
        </div>

        <span className="text-neutral-400 font-medium">
          1RM: <strong className="text-[#C4121A] font-bold font-mono">{oneRepMax} kg</strong>
        </span>
      </div>

      {/* Beginner-Friendly Quick Weight & Reps Stepper Bar */}
      {showQuickAdjust && (
        <div className="pt-1 px-1 flex items-center justify-between gap-1 text-[10px] font-mono bg-neutral-100 dark:bg-[#121214] p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 animate-in fade-in duration-100">
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[9px] uppercase font-bold">KG:</span>
            <button
              type="button"
              onClick={() => handleQuickWeight(-2.5)}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:border-[#C4121A] cursor-pointer"
            >
              -2.5
            </button>
            <button
              type="button"
              onClick={() => handleQuickWeight(2.5)}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:border-[#C4121A] cursor-pointer"
            >
              +2.5
            </button>
            <button
              type="button"
              onClick={() => handleQuickWeight(5)}
              className="px-2 py-0.5 rounded-md bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/30 font-bold hover:bg-[#C4121A]/20 cursor-pointer"
            >
              +5
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[9px] uppercase font-bold">Reps:</span>
            <button
              type="button"
              onClick={() => handleQuickReps(-1)}
              className="w-5 h-5 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickReps(1)}
              className="w-5 h-5 rounded-md bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveLogSetRow;
