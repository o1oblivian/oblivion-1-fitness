import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Layers } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { ExerciseItem, ExerciseSet } from '../../../types';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { displayToKg, formatLoad, loadUnitLabel } from '../../../utils/weightUnits';
import type { WeightUnit } from '../../../hooks/useAthleteSettings';
import { useTelemetryHistoryStore, type LoggedSet } from '../../log/store/useTelemetryHistoryStore';
import { estimatedMaxKg, localTodayKey, priorBestSet } from '../services/sessionPr';
import { lastSessionSets, nextSetAdvice, type SetAdvice } from '../services/setCoach';
import { athleteDose } from '../utils/equipmentAccess';
import { useConsultationStore } from '../../induction/useConsultationStore';
import { StillThumb } from '../../../components/StillThumb';
import { ActiveLogSetRow } from './ActiveLogSetRow';
import { SwipeToReveal } from './SwipeToReveal';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';
import { exerciseStill } from '../utils/exerciseStill';

const BEST_BUBBLE_MS = 5000;
/** Long enough to read two sentences; a tap closes it sooner. */
const RPE_HELP_MS = 10_000;

function shortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function lastTimeText(sets: LoggedSet[], unit: WeightUnit): string {
  const unitLower = loadUnitLabel(unit).toLowerCase();
  const reps = sets.map((s) => s.reps).join(', ');
  if (sets.every((s) => s.weightKg <= 0)) return `${reps} reps`;
  if (sets.every((s) => s.weightKg === sets[0].weightKg))
    return `${formatLoad(sets[0].weightKg, unit)} ${unitLower} × ${reps}`;
  return sets.map((s) => `${formatLoad(s.weightKg, unit)}×${s.reps}`).join(' · ');
}

function adviceText(advice: SetAdvice, unit: WeightUnit): string {
  const load =
    advice.weightKg > 0
      ? `${formatLoad(advice.weightKg, unit)} ${loadUnitLabel(unit).toLowerCase()}`
      : `${advice.reps} reps`;
  switch (advice.kind) {
    case 'up':
      return `Felt easy. Try ${load} next.`;
    case 'same':
      return 'Right on target. Same again.';
    case 'hold':
      return 'Hard but fine. Keep the weight, a rep or two fewer is okay.';
    case 'down':
      return `Too hard. Go for ${load} next.`;
    case 'stop':
      return `That was all-out. Go for ${load}, and stop if you feel pain or dizziness.`;
  }
}

export interface ActiveLogExerciseAccordionProps {
  exercise: ExerciseItem;
  isExpanded: boolean;
  showSwipeHint?: boolean;
  onToggleExpand: () => void;
  onAddSet: (exerciseId: string) => void;
  onDuplicateSet?: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setNumber: number) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onOpenDial: (
    exerciseId: string,
    setNumber: number,
    type: 'weight' | 'reps' | 'rpe',
    currentVal: number,
    setId?: string,
    setIndex?: number,
    follow?: { field: 'weight' | 'reps' | 'rpe'; value: number }[],
  ) => void;
  onToggleSet?: (exerciseId: string, setNumber: number) => void;
  onQuickUpdateSet?: (exerciseId: string, setNumber: number, updates: Partial<ExerciseSet>) => void;
}

export const ActiveLogExerciseAccordion: React.FC<ActiveLogExerciseAccordionProps> = ({
  exercise,
  isExpanded,
  showSwipeHint = false,
  onToggleExpand,
  onAddSet,
  onDuplicateSet,
  onRemoveSet,
  onRemoveExercise,
  onOpenDial,
  onToggleSet,
  onQuickUpdateSet,
}) => {
  const simple = useSimpleMode();
  const [showBest, setShowBest] = useState(false);
  const [showRpeHelp, setShowRpeHelp] = useState(false);
  const setsList = exercise.sets || [];
  const done = setsList.filter((s) => s.completed).length;
  const activeIndex = setsList.findIndex((s) => !s.completed);
  const weightUnit = readAthleteSettingsSnapshot().weightUnit;
  const unitLower = loadUnitLabel(weightUnit).toLowerCase();

  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const best = useMemo(
    () => priorBestSet(exercise.name, localTodayKey(), historyByDate),
    [exercise.name, historyByDate],
  );
  const todayTop = setsList.reduce<{ weightKg: number; reps: number; max: number } | null>(
    (top, s) => {
      if (!s.completed) return top;
      const weightKg = Number(s.weightKg ?? s.weight) || 0;
      const reps = Number(s.reps) || 0;
      const max = estimatedMaxKg(weightKg, reps);
      return max > 0 && (!top || max > top.max) ? { weightKg, reps, max } : top;
    },
    null,
  );
  const isPrToday = Boolean(best && todayTop && todayTop.max > best.estimatedMaxKg);
  const lastTime = useMemo(
    () => lastSessionSets(exercise.name, localTodayKey(), historyByDate),
    [exercise.name, historyByDate],
  );

  const trainingAge = useConsultationStore((s) => s.trainingAge);
  const ageBand = useConsultationStore((s) => s.ageBand);
  const prevSet = activeIndex > 0 ? setsList[activeIndex - 1] : undefined;
  const nextSet = activeIndex > 0 ? setsList[activeIndex] : undefined;
  const advice =
    prevSet?.completed && nextSet
      ? nextSetAdvice({
          rpe: Number(prevSet.rpe) || 0,
          weightKg: Number(prevSet.weightKg ?? prevSet.weight) || 0,
          reps: Number(prevSet.reps) || 0,
          stepKg: weightUnit === 'lbs' ? displayToKg(5, 'lbs') : 2.5,
          rpeCap: athleteDose(trainingAge, ageBand).rpeCap,
          careful: ageBand === 'under18' || ageBand === '60+',
        })
      : null;
  const adviceChange: Partial<ExerciseSet> | null =
    !advice || advice.kind === 'same' || advice.kind === 'hold'
      ? null
      : advice.weightKg > 0
        ? (Number(nextSet?.weightKg ?? nextSet?.weight) || 0) === advice.weightKg
          ? null
          : { weightKg: advice.weightKg, weight: advice.weightKg }
        : (Number(nextSet?.reps) || 0) === advice.reps
          ? null
          : { reps: advice.reps };

  useEffect(() => {
    if (!showRpeHelp) return;
    const id = window.setTimeout(() => setShowRpeHelp(false), RPE_HELP_MS);
    return () => window.clearTimeout(id);
  }, [showRpeHelp]);

  useEffect(() => {
    if (!showBest) return;
    const id = window.setTimeout(() => setShowBest(false), BEST_BUBBLE_MS);
    return () => window.clearTimeout(id);
  }, [showBest]);

  const setText = (weightKg: number, reps: number) =>
    `${formatLoad(weightKg, weightUnit)} ${unitLower} × ${reps}`;
  const bestMessage = !best
    ? 'First time logging this lift'
    : isPrToday && todayTop
      ? `New best ${setText(todayTop.weightKg, todayTop.reps)} · was ${setText(best.weightKg, best.reps)}`
      : `Best ${setText(best.weightKg, best.reps)} · ${shortDate(best.dateKey)}`;

  return (
    <div className="relative rounded-2xl bg-o1-card border border-white/[0.07] px-1.5 py-0.5 select-none transition-colors space-y-1">
      <SwipeToReveal
        actionLabel="Remove"
        actionAriaLabel={`Remove ${exercise.name}`}
        onAction={() => onRemoveExercise(exercise.id)}
        className="rounded-xl"
        contentClassName="bg-o1-card"
      >
        <div className="w-full flex items-center min-h-9 gap-1.5">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onToggleExpand();
            }}
            aria-expanded={isExpanded}
            className="flex-1 min-w-0 min-h-9 flex items-center gap-2 text-left cursor-pointer"
          >
            <StillThumb src={exerciseStill(exercise.name, exercise.movementPattern)} />
            <span className="min-w-0 text-sm font-medium tracking-tight text-white leading-snug truncate py-0.5">
              {exercise.name}
            </span>
            <span className="ml-auto shrink-0 font-num text-o1-label text-o1-muted">
              {done}/{setsList.length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-o1-muted shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-o1-muted shrink-0" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowBest((v) => !v);
            }}
            aria-label={
              isPrToday
                ? `New personal best on ${exercise.name}`
                : `Personal best for ${exercise.name}`
            }
            aria-expanded={showBest}
            className={`h-6 px-2 shrink-0 rounded-lg border font-num text-o1-label cursor-pointer transition-colors ${
              isPrToday
                ? 'border-o1-emerald/60 text-o1-emerald'
                : showBest
                  ? 'border-white/[0.14] text-o1-text bg-o1-sheet'
                  : 'border-white/[0.07] text-o1-muted hover:text-o1-text'
            }`}
          >
            {simple ? (isPrToday ? 'New best' : 'Best') : isPrToday ? 'PR' : 'PB'}
          </button>
        </div>
      </SwipeToReveal>

      {showBest && (
        <div
          role="status"
          className="absolute right-2 top-10 z-20 max-w-[85%] px-3 py-2 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs text-o1-text shadow-lg animate-in fade-in duration-150 pointer-events-none"
        >
          {bestMessage}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-1 pb-1 pt-1.5">
          {lastTime && (
            <p className="px-1 text-o1-label text-o1-muted leading-snug">
              Last time · {shortDate(lastTime.dateKey)}:{' '}
              <span className="font-num text-o1-text">
                {lastTimeText(lastTime.sets, weightUnit)}
              </span>
            </p>
          )}
          <div className="flex items-center gap-1.5 text-o1-label leading-none uppercase tracking-[0.12em] text-o1-muted px-1">
            <span className="w-8 shrink-0 text-center">Set</span>
            <span className="flex-1 text-center">Reps</span>
            <span className="flex-1 text-center">{unitLower}</span>
            {simple ? null : (
              <span className="flex-1 text-center">
                <button
                  type="button"
                  aria-expanded={showRpeHelp}
                  aria-label="What is RPE?"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setShowRpeHelp((open) => !open);
                  }}
                  className="uppercase tracking-[0.12em] underline decoration-dotted underline-offset-4 cursor-pointer active:text-o1-text"
                >
                  RPE
                </button>
              </span>
            )}
            <span className="w-7 shrink-0" />
          </div>

          {showRpeHelp && !simple && (
            <button
              type="button"
              onClick={() => setShowRpeHelp(false)}
              className="w-full text-left rounded-xl bg-o1-sheet border border-white/[0.07] px-3 py-2.5 normal-case tracking-normal animate-in fade-in duration-150 cursor-pointer"
            >
              <span className="block text-sm font-semibold text-o1-text">
                RPE: Rate of Perceived Exertion
              </span>
              <span className="block text-xs text-o1-muted leading-snug mt-1">
                How hard the set felt, from 1 to 10. 10 is all-out with nothing left, 8 leaves about
                2 reps in reserve, 6 leaves about 4. Tap to close.
              </span>
            </button>
          )}

          <div className="space-y-1">
            {setsList.map((set, setIndex) => {
              const isLast = setsList.length === 1;
              return (
                <ActiveLogSetRow
                  key={set.id || set.setNumber || setIndex}
                  set={set}
                  exerciseName={exercise.name}
                  priorBestKg={best?.estimatedMaxKg ?? 0}
                  isDone={Boolean(set.completed)}
                  isActive={setIndex === activeIndex}
                  swipeHint={showSwipeHint && setIndex === 0}
                  removeLabel={isLast ? `Remove ${exercise.name}` : 'Delete'}
                  removeAriaLabel={
                    isLast ? `Remove ${exercise.name}` : `Delete set ${set.setNumber}`
                  }
                  onOpenDial={(type, currentVal, follow) =>
                    onOpenDial(
                      exercise.id,
                      set.setNumber,
                      type,
                      currentVal,
                      set.id,
                      setIndex,
                      follow,
                    )
                  }
                  onRemoveSet={() =>
                    isLast ? onRemoveExercise(exercise.id) : onRemoveSet(exercise.id, set.setNumber)
                  }
                  onToggleDone={() => onToggleSet?.(exercise.id, set.setNumber)}
                  onQuickUpdateSet={(updates) =>
                    onQuickUpdateSet?.(exercise.id, set.setNumber, updates)
                  }
                />
              );
            })}
          </div>

          {advice && nextSet && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${
                advice.kind === 'stop' ? 'border-o1-amber/40' : 'border-white/[0.07]'
              } bg-o1-well`}
            >
              <p className="flex-1 min-w-0 text-o1-caption text-o1-text leading-snug">
                <span className="text-o1-muted">Set {nextSet.setNumber}: </span>
                {adviceText(advice, weightUnit)}
              </p>
              {adviceChange && onQuickUpdateSet && (
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    onQuickUpdateSet(exercise.id, nextSet.setNumber, adviceChange);
                  }}
                  className="h-7 px-2.5 shrink-0 rounded-lg border border-white/[0.14] text-o1-label text-o1-text hover:border-o1-crimson cursor-pointer active:scale-[0.97] transition"
                >
                  Use
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onAddSet(exercise.id);
              }}
              className="flex-1 h-8 border border-dashed border-white/[0.14] hover:border-o1-crimson/60 text-o1-text text-o1-caption rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add set</span>
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (onDuplicateSet) onDuplicateSet(exercise.id);
                else onAddSet(exercise.id);
              }}
              aria-label={`Duplicate last set of ${exercise.name}`}
              className="h-8 w-8 rounded-xl border border-white/[0.07] text-o1-muted hover:text-o1-text hover:border-white/[0.14] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
