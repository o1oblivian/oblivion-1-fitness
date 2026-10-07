import React, { useState } from 'react';
import { Trash2, Check, Plus, Minus } from 'lucide-react';
import { ExerciseSet } from '../../../types';
import { tactileEngine } from '../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { displayToKg, formatLoad, kgToDisplay, loadUnitLabel } from '../../../utils/weightUnits';

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
  const rawWeight = Number(set.weightKg ?? set.weight);
  const rawReps = Number(set.reps);
  const rawRpe = Number(set.rpe);
  const hasWeight = Number.isFinite(rawWeight) && rawWeight > 0;
  const hasReps = Number.isFinite(rawReps) && rawReps > 0;
  const hasRpe = Number.isFinite(rawRpe) && rawRpe > 0;
  const rpeVal = hasRpe ? rawRpe : 0;
  const reps = hasReps ? rawReps : 0;
  const weightKg = hasWeight ? rawWeight : 0;
  const weightUnit = readAthleteSettingsSnapshot().weightUnit;
  const unitLabel = loadUnitLabel(weightUnit);
  const displayLoad = kgToDisplay(weightKg, weightUnit);
  const oneRepMaxKg = hasWeight && hasReps ? Math.round(weightKg * (1 + reps / 30)) : 0;
  const oneRepMaxShow = kgToDisplay(oneRepMaxKg, weightUnit);
  const pbText = hasWeight ? `+${formatLoad(weightKg, weightUnit)} ${unitLabel.toLowerCase()} PB` : '--';
  const bumpSmall = weightUnit === 'lbs' ? 5 : 2.5;
  const bumpLarge = weightUnit === 'lbs' ? 10 : 5;

  const handleQuickWeight = (displayDelta: number) => {
    tactileEngine.triggerSelectionBuzz();
    const nextKg = displayToKg(Math.max(0, displayLoad + displayDelta), weightUnit);
    if (onQuickUpdateSet) {
      onQuickUpdateSet({ weightKg: nextKg, weight: nextKg });
    } else {
      onOpenDial('weight', nextKg);
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
      className={`space-y-0.5 select-none py-1 px-1 rounded-xl transition-colors ${
        isDone
          ? 'bg-emerald-950/20 border border-emerald-600/30'
          : 'bg-o1-well/60 border border-white/[0.07]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {/* SET Number or Done Check */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onToggleDone?.();
          }}
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs cursor-pointer transition-all ${
            isDone
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-o1-well border border-white/[0.07] text-neutral-300 hover:border-o1-crimson'
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
          className={`flex-1 h-8 rounded-xl font-mono font-semibold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border ${
            isDone
              ? 'bg-emerald-950/40 border-emerald-600/30 text-emerald-200'
              : 'bg-o1-card border-white/[0.07] hover:border-o1-crimson text-white'
          }`}
          title="Adjust Repetitions"
        >
          {hasReps ? reps : '--'}
        </button>

        {/* KG Pill Button */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenDial('weight', weightKg);
          }}
          className={`flex-1 h-8 rounded-xl font-mono font-semibold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border ${
            isDone
              ? 'bg-emerald-950/40 border-emerald-600/30 text-emerald-200'
              : 'bg-o1-card border-white/[0.07] hover:border-o1-crimson text-white'
          }`}
          title={`Adjust Weight Load (${unitLabel})`}
        >
          {hasWeight ? `${displayLoad} ${unitLabel}` : `-- ${unitLabel}`}
        </button>

        {/* RPE/RIR Pill Button */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenDial('rpe', rpeVal);
          }}
          className={`flex-1 h-8 rounded-xl font-mono font-semibold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border ${
            isDone
              ? 'bg-emerald-950/40 border-emerald-600/30 text-emerald-200'
              : 'bg-o1-card border-white/[0.07] hover:border-o1-crimson text-white'
          }`}
          title="Adjust RPE (Rate of Perceived Exertion)"
        >
          {hasRpe ? rpeVal : '--'}
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
              className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-o1-crimson active:scale-95 transition-colors cursor-pointer rounded-md hover:bg-white/5"
              title="Delete Set"
              aria-label="Delete Set"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Row: PB & 1RM + Beginner Quick Bumper Toggle */}
      <div className="flex items-center justify-between px-0.5 text-[8px] font-sans font-normal leading-none tracking-normal">
        <div className="flex items-center gap-1.5">
          <span className="text-o1-crimson font-normal text-[8px]">{pbText}</span>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowQuickAdjust(!showQuickAdjust);
            }}
            className="text-[8px] text-neutral-400 hover:text-white underline cursor-pointer font-sans font-normal"
          >
            {showQuickAdjust ? 'Hide quick bumps' : 'Quick bumps'}
          </button>
        </div>

        <span className="text-neutral-400 font-normal text-[8px]">
          1RM: <span className="text-o1-crimson font-normal">{oneRepMaxKg > 0 ? `${oneRepMaxShow} ${unitLabel.toLowerCase()}` : '--'}</span>
        </span>
      </div>

      {/* Beginner-Friendly Quick Weight & Reps Stepper Bar */}
      {showQuickAdjust && (
        <div className="pt-1 px-1 flex items-center justify-between gap-1 text-[10px] font-mono bg-o1-card p-1.5 rounded-xl border border-white/[0.07] animate-in fade-in duration-100">
          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[9px] uppercase font-bold">{unitLabel}:</span>
            <button
              type="button"
              onClick={() => handleQuickWeight(-bumpSmall)}
              className="px-2 py-0.5 rounded-md bg-white/[0.08] text-neutral-200 border border-white/[0.07] hover:border-o1-crimson cursor-pointer"
            >
              -{bumpSmall}
            </button>
            <button
              type="button"
              onClick={() => handleQuickWeight(bumpSmall)}
              className="px-2 py-0.5 rounded-md bg-white/[0.08] text-neutral-200 border border-white/[0.07] hover:border-o1-crimson cursor-pointer"
            >
              +{bumpSmall}
            </button>
            <button
              type="button"
              onClick={() => handleQuickWeight(bumpLarge)}
              className="px-2 py-0.5 rounded-md bg-o1-crimson/10 text-o1-crimson border border-o1-crimson/30 font-bold hover:bg-o1-crimson/20 cursor-pointer"
            >
              +{bumpLarge}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-neutral-500 text-[9px] uppercase font-bold">Reps:</span>
            <button
              type="button"
              onClick={() => handleQuickReps(-1)}
              className="w-5 h-5 rounded-md bg-white/[0.08] text-neutral-200 border border-white/[0.07] flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickReps(1)}
              className="w-5 h-5 rounded-md bg-white/[0.08] text-neutral-200 border border-white/[0.07] flex items-center justify-center cursor-pointer"
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
