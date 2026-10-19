import React, { useEffect, useRef, useState } from 'react';
import { Check, Plus, Minus } from 'lucide-react';
import { ExerciseSet } from '../../../types';
import { tactileEngine } from '../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../../utils/weightUnits';
import { setIsPr } from '../services/sessionPr';
import { nextSetCue } from '../services/setCue';
import { SwipeToReveal } from './SwipeToReveal';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';

const RPE_CHOICES = [6, 7, 8, 9, 10];
/** Simple mode asks in words; each answer is stored as the RPE it stands for. */
const FEEL_CHOICES: { label: string; rpe: number }[] = [
  { label: 'Easy', rpe: 6 },
  { label: 'Good', rpe: 7 },
  { label: 'Hard', rpe: 8.5 },
  { label: 'Max', rpe: 10 },
];
const LOCK_NOTE_MS = 2500;
/** After effort is picked the set ticks itself; this is the window to undo it. */
const AUTO_TICK_MS = 1300;
/** Rest timer bar plus the tab dock. */
const BOTTOM_CHROME_PX = 190;

export interface ActiveLogSetRowProps {
  set: ExerciseSet;
  exerciseName?: string;
  priorBestKg?: number;
  isDone?: boolean;
  isActive?: boolean;
  swipeHint?: boolean;
  removeLabel?: string;
  removeAriaLabel?: string;
  onOpenDial: (type: 'weight' | 'reps' | 'rpe', currentVal: number) => void;
  onRemoveSet: () => void;
  onToggleDone?: () => void;
  onQuickUpdateSet?: (updates: Partial<ExerciseSet>) => void;
}

export const ActiveLogSetRow: React.FC<ActiveLogSetRowProps> = ({
  set,
  exerciseName = '',
  priorBestKg = 0,
  isDone,
  isActive,
  swipeHint,
  removeLabel = 'Delete',
  removeAriaLabel,
  onOpenDial,
  onRemoveSet,
  onToggleDone,
  onQuickUpdateSet,
}) => {
  const simple = useSimpleMode();
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
  const [lockNote, setLockNote] = useState(false);
  const [rpeOpen, setRpeOpen] = useState(false);
  const [pendingTick, setPendingTick] = useState(false);
  const [touched, setTouched] = useState({ reps: false, weight: false });
  const awaitingRpe = useRef(false);
  const doneRef = useRef(Boolean(isDone));
  const toggleRef = useRef(onToggleDone);
  const wasDone = useRef(Boolean(isDone));
  const rowRef = useRef<HTMLDivElement>(null);
  const celebrated = useRef(false);

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
  const unitLower = unitLabel.toLowerCase();
  const displayLoad = kgToDisplay(weightKg, weightUnit);
  const isPr = Boolean(
    isDone && priorBestKg > 0 && setIsPr(exerciseName, weightKg, reps, priorBestKg),
  );
  const bumpSmall = weightUnit === 'lbs' ? 5 : 2.5;
  const bumpLarge = weightUnit === 'lbs' ? 10 : 5;
  const valueTone = isDone ? 'text-o1-text' : 'text-o1-muted';
  const canBump = Boolean(isActive && onQuickUpdateSet);
  const bumpsOpen = showQuickAdjust && canBump;

  const cue = nextSetCue({
    isActive: Boolean(isActive),
    isDone: Boolean(isDone),
    hasReps,
    hasWeight,
    hasRpe,
    touchedReps: touched.reps,
    touchedWeight: touched.weight,
  });
  const repsCue = cue === 'values' && !(hasReps && touched.reps);
  const weightCue = cue === 'values' && hasWeight && !touched.weight;
  const showRpe = Boolean(onQuickUpdateSet) && (rpeOpen || (simple && cue === 'effort'));

  useEffect(() => {
    doneRef.current = Boolean(isDone);
    toggleRef.current = onToggleDone;
  });

  useEffect(() => {
    if (!pendingTick) return;
    if (isDone) {
      setPendingTick(false);
      return;
    }
    const id = window.setTimeout(() => {
      setPendingTick(false);
      if (!doneRef.current) toggleRef.current?.();
    }, AUTO_TICK_MS);
    return () => window.clearTimeout(id);
  }, [pendingTick, isDone]);

  useEffect(() => {
    if (!awaitingRpe.current || !hasRpe) return;
    awaitingRpe.current = false;
    setTouched({ reps: true, weight: true });
    if (!isDone && hasReps) setPendingTick(true);
  }, [hasRpe, rpeVal, isDone, hasReps]);

  useEffect(() => {
    const justTicked = Boolean(isDone) && !wasDone.current;
    wasDone.current = Boolean(isDone);
    if (!justTicked) return;
    const frame = window.requestAnimationFrame(() => {
      const el = rowRef.current;
      if (el && el.getBoundingClientRect().bottom > window.innerHeight - BOTTOM_CHROME_PX) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isDone]);

  useEffect(() => {
    if (!isDone) celebrated.current = false;
    if (isPr && !celebrated.current) {
      celebrated.current = true;
      tactileEngine.playPRCelebration();
    }
  }, [isPr, isDone]);

  useEffect(() => {
    if (!lockNote) return;
    const id = window.setTimeout(() => setLockNote(false), LOCK_NOTE_MS);
    return () => window.clearTimeout(id);
  }, [lockNote]);

  useEffect(() => {
    if (!isDone) setLockNote(false);
  }, [isDone]);

  const openValue = (type: 'weight' | 'reps' | 'rpe', value: number) => {
    tactileEngine.triggerSelectionBuzz();
    if (isDone) {
      setLockNote(true);
      return;
    }
    if (type === 'rpe') awaitingRpe.current = true;
    else setTouched((t) => ({ ...t, [type]: true }));
    onOpenDial(type, value);
  };

  const toggleRpePanel = () => {
    tactileEngine.triggerSelectionBuzz();
    if (isDone) {
      setLockNote(true);
      return;
    }
    setPendingTick(false);
    setRpeOpen((open) => !open);
  };

  /** Effort picked: close the panel and let the set tick itself unless undone. */
  const pickRpe = (rpe: number) => {
    tactileEngine.triggerSelectionBuzz();
    onQuickUpdateSet?.({ rpe });
    setRpeOpen(false);
    setTouched({ reps: true, weight: true });
    if (!isDone && hasReps) setPendingTick(true);
  };

  const undoAutoTick = () => {
    tactileEngine.triggerSelectionBuzz();
    setPendingTick(false);
    setRpeOpen(true);
  };

  const handleQuickWeight = (displayDelta: number) => {
    tactileEngine.triggerSelectionBuzz();
    setTouched((t) => ({ ...t, weight: true }));
    const nextKg = displayToKg(Math.max(0, displayLoad + displayDelta), weightUnit);
    onQuickUpdateSet?.({ weightKg: nextKg, weight: nextKg });
  };

  const handleQuickReps = (delta: number) => {
    tactileEngine.triggerSelectionBuzz();
    setTouched((t) => ({ ...t, reps: true }));
    onQuickUpdateSet?.({ reps: Math.max(1, reps + delta) });
  };

  const pill =
    'flex-1 h-8 rounded-lg font-mono text-o1-body flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] border bg-o1-card border-white/[0.07] hover:border-white/[0.14]';

  return (
    <SwipeToReveal
      actionLabel={removeLabel}
      actionAriaLabel={removeAriaLabel ?? `Delete set ${set.setNumber}`}
      onAction={onRemoveSet}
      hint={swipeHint}
      className={`rounded-xl border ${isPr ? 'border-o1-emerald/50' : 'border-white/[0.07]'}`}
      contentClassName="bg-o1-well"
    >
      <div ref={rowRef} className="space-y-1 select-none p-0.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onToggleDone?.();
            }}
            aria-pressed={Boolean(isDone)}
            aria-label={
              isDone
                ? `Set ${set.setNumber} done. Tap to undo`
                : `Mark set ${set.setNumber} done and start rest`
            }
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-o1-body cursor-pointer transition-all bg-o1-card ${
              isDone ? 'text-o1-crimson' : 'text-o1-text hover:bg-o1-sheet'
            } ${cue === 'tick' ? 'o1-cue-wave' : ''}`}
          >
            {isDone ? <Check className="w-4 h-4" strokeWidth={2} /> : set.setNumber}
          </button>

          <button
            type="button"
            onClick={() => openValue('reps', reps)}
            className={`${pill} ${valueTone} ${repsCue ? 'o1-cue-shake' : ''}`}
            aria-label={`Reps ${hasReps ? reps : 'not set'}${isDone ? ', locked' : ', target'}`}
          >
            {hasReps ? reps : '--'}
          </button>

          <button
            type="button"
            onClick={() => openValue('weight', weightKg)}
            className={`${pill} ${valueTone} ${weightCue ? 'o1-cue-shake' : ''}`}
            aria-label={`Load ${hasWeight ? `${displayLoad} ${unitLabel}` : 'not set'}${isDone ? ', locked' : ', target'}`}
          >
            {hasWeight ? `${displayLoad} ${unitLower}` : '--'}
          </button>

          {simple ? null : (
            <button
              type="button"
              onClick={toggleRpePanel}
              aria-expanded={showRpe}
              className={`${pill} ${valueTone} ${cue === 'effort' && !showRpe ? 'o1-cue-shake' : ''}`}
              aria-label={`RPE ${hasRpe ? rpeVal : 'not set'}${isDone ? ', locked' : ''}`}
            >
              {hasRpe ? rpeVal : '--'}
            </button>
          )}

          {canBump ? (
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowQuickAdjust(!showQuickAdjust);
              }}
              aria-expanded={bumpsOpen}
              aria-label={`Quick bumps for set ${set.setNumber}`}
              className={`w-7 h-8 shrink-0 rounded-lg border font-mono text-o1-label cursor-pointer transition-colors ${
                bumpsOpen
                  ? 'border-o1-crimson text-o1-text bg-o1-sheet'
                  : 'border-white/[0.07] text-o1-muted hover:text-o1-text'
              }`}
            >
              {simple ? '±' : 'QB'}
            </button>
          ) : (
            <span className="w-7 shrink-0" aria-hidden />
          )}
        </div>

        {lockNote && (
          <p
            role="status"
            className="px-1 text-o1-label text-o1-muted animate-in fade-in duration-150"
          >
            Set done. Tap the tick to undo, then edit.
          </p>
        )}

        {showRpe && simple && (
          <div
            className="flex items-center gap-1.5 px-1 animate-in fade-in duration-150"
            role="group"
            aria-label="How did that set feel?"
          >
            {FEEL_CHOICES.map(({ label, rpe }) => (
              <button
                key={label}
                type="button"
                onClick={() => pickRpe(rpe)}
                aria-pressed={rpeVal === rpe}
                className={`flex-1 h-7 rounded-lg border text-o1-label cursor-pointer active:scale-[0.97] transition ${
                  rpeVal === rpe
                    ? 'border-o1-crimson text-o1-text bg-o1-sheet'
                    : 'border-white/[0.07] text-o1-muted hover:text-o1-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {showRpe && !simple && (
          <div
            className="flex items-center gap-1.5 px-1 animate-in fade-in duration-150"
            role="group"
            aria-label="How hard was that set?"
          >
            {RPE_CHOICES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => pickRpe(value)}
                aria-pressed={rpeVal === value}
                className={`flex-1 h-7 rounded-lg border font-mono text-o1-body cursor-pointer active:scale-[0.97] transition ${
                  rpeVal === value
                    ? 'border-o1-crimson text-o1-text bg-o1-sheet'
                    : 'border-white/[0.07] text-o1-muted hover:text-o1-text'
                }`}
              >
                {value}
              </button>
            ))}
            {isDone ? null : (
              <button
                type="button"
                onClick={() => {
                  setRpeOpen(false);
                  openValue('rpe', rpeVal);
                }}
                aria-label="More RPE values"
                className="w-8 h-7 shrink-0 rounded-lg border border-white/[0.07] text-o1-body text-o1-muted hover:text-o1-text cursor-pointer active:scale-[0.97] transition"
              >
                …
              </button>
            )}
          </div>
        )}

        {pendingTick && !isDone && (
          <div
            role="status"
            className="flex items-center justify-between px-1 text-o1-label text-o1-muted animate-in fade-in duration-150"
          >
            <span>Ticking set {set.setNumber}…</span>
            <button
              type="button"
              onClick={undoAutoTick}
              className="h-6 px-2.5 rounded-lg border border-white/[0.14] text-o1-text cursor-pointer active:scale-[0.97] transition"
            >
              Undo
            </button>
          </div>
        )}

        {bumpsOpen && (
          <div className="flex items-center justify-between gap-1 text-o1-label font-mono bg-o1-card p-1.5 rounded-xl border border-white/[0.07] animate-in fade-in duration-100">
            <div className="flex items-center gap-1">
              <span className="text-o1-muted">{unitLower}</span>
              {[-bumpSmall, bumpSmall, bumpLarge].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickWeight(delta)}
                  aria-label={`${delta > 0 ? 'Add' : 'Remove'} ${Math.abs(delta)} ${unitLower}`}
                  className="h-7 px-2.5 rounded-lg text-o1-text border border-white/[0.07] hover:border-white/[0.14] cursor-pointer"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-o1-muted">reps</span>
              <button
                type="button"
                onClick={() => handleQuickReps(-1)}
                aria-label="One fewer rep"
                className="w-7 h-7 rounded-lg text-o1-text border border-white/[0.07] flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickReps(1)}
                aria-label="One more rep"
                className="w-7 h-7 rounded-lg text-o1-text border border-white/[0.07] flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </SwipeToReveal>
  );
};
