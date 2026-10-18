import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { CommitWorkoutModal, type LiftHighlight } from './modals/CommitWorkoutModal';
import { feelWord, summariseLifts } from '../services/setCoach';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';
import type { WeightUnit } from '../../../hooks/useAthleteSettings';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import {
  resolvePlannedSession,
  settleFinishedSession,
  startTodaySession,
} from '../../log/todaySession';
import { DialInputModal } from '../../../components/common/DialInputModal';
import { ActiveLogExerciseAccordion } from './ActiveLogExerciseAccordion';
import {
  estimateSessionMinutes,
  saveAthleteDayRoutine,
  useDayRoutineRevision,
} from '../services/dayRoutineService';
import { useUserStore } from '../../../stores/useUserStore';
import { localDayKey, releaseForgotten } from '../../log/services/dayLogService';
import { sessionLedger } from '../store/workoutSetOperations';
import { archiveSession } from '../../../services/sessionArchive';
import { readLinkedCoach } from '../../coach/services/coachLink';
import { publishFinishedWorkout } from '../../coach/services/coachBridge';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../../utils/weightUnits';
import { localTodayKey, priorBestKg, setIsPr } from '../services/sessionPr';
import {
  BEGINNER_STARTERS,
  buildStarterSession,
  type BeginnerStarter,
} from '../data/beginnerStarters';
import { estimateSessionEnergy } from '../utils/sessionEnergy';
import {
  getTelemetryHistoryState,
  useTelemetryHistoryStore,
} from '../../log/store/useTelemetryHistoryStore';
import type { ExerciseItem } from '../../../types';

type BackupState = 'pending' | 'saved' | 'signed-out' | 'queued';

interface LogStatus {
  kind: 'saved' | 'info' | 'warn';
  text: string;
  backup?: BackupState;
  routineDay?: string;
}

const BACKUP_TEXT: Record<BackupState, string> = {
  pending: 'Backing up to your account…',
  saved: 'Backed up to your account.',
  'signed-out': 'Saved on this device. Sign in to back it up.',
  queued: 'Saved on this device. Backup retries automatically.',
};

const STATUS_DOT: Record<LogStatus['kind'], string> = {
  saved: 'bg-o1-emerald',
  info: 'bg-o1-sky',
  warn: 'bg-o1-amber',
};

/** Lifts where a ticked set beat every earlier day's best estimated 1RM. */
function sessionPrCount(exercises: ExerciseItem[]): number {
  const today = localTodayKey();
  return exercises.filter((e) => {
    const name = e.name || e.exerciseName || '';
    const prior = priorBestKg(name, today);
    return (
      prior > 0 &&
      (e.sets || []).some(
        (s) =>
          s.completed &&
          setIsPr(name, Number(s.weightKg ?? s.weight) || 0, Number(s.reps) || 0, prior),
      )
    );
  }).length;
}

function sameDayLastWeekKg(): number | null {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const record = getTelemetryHistoryState().historyByDate[key]?.workout;
  return record?.hasData && record.tonnageKg > 0 ? record.tonnageKg : null;
}

const TREND_NOTE = {
  up: 'Up on last time',
  same: 'Same as last time',
  down: 'Lighter than last time',
  first: 'First time logged',
};

function liftHighlights(exercises: ExerciseItem[], unit: WeightUnit): LiftHighlight[] {
  const unitLower = loadUnitLabel(unit).toLowerCase();
  const setText = (s: { weightKg: number; reps: number }) =>
    s.weightKg > 0 ? `${kgToDisplay(s.weightKg, unit)} ${unitLower} × ${s.reps}` : `${s.reps} reps`;
  return summariseLifts(exercises).map((l) => ({
    name: l.name,
    top: setText(l.top),
    note:
      l.lastTop && l.trend !== 'same'
        ? `${TREND_NOTE[l.trend]} · was ${setText(l.lastTop)}`
        : TREND_NOTE[l.trend],
    trend: l.trend,
    best: l.best,
  }));
}

function sessionFeel(exercises: ExerciseItem[], simple: boolean): string | null {
  const rated = exercises.flatMap((e) =>
    (e.sets || []).filter((s) => s.completed && Number(s.rpe) > 0).map((s) => Number(s.rpe)),
  );
  if (rated.length === 0) return null;
  const avg = rated.reduce((a, b) => a + b, 0) / rated.length;
  return simple
    ? `Felt ${feelWord(avg).toLowerCase()} overall`
    : `Average effort RPE ${Math.round(avg * 10) / 10}`;
}

interface ActiveLogCardProps {
  /** Opens the Build workout panel. */
  onBuildWorkout?: () => void;
}

export const ActiveLogCard: React.FC<ActiveLogCardProps> = ({ onBuildWorkout }) => {
  const simple = useSimpleMode();
  const exercises = useWorkoutStore((s) => s.exercises);
  const setExercises = useWorkoutStore((s) => s.setExercises);
  const updateExerciseSet = useWorkoutStore((s) => s.updateExerciseSet);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const toggleSetCompleted = useWorkoutStore((s) => s.toggleSetCompleted);
  const completeEarlierSets = useWorkoutStore((s) => s.completeEarlierSets);

  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [isCommitOpen, setIsCommitOpen] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [status, setStatus] = useState<LogStatus | null>(null);

  const knownIdsRef = useRef<Set<string>>(new Set(exercises.map((e) => e.id)));
  useEffect(() => {
    const known = knownIdsRef.current;
    const added = exercises.filter((e) => !known.has(e.id));
    if (added.length === 1 && exercises.length === known.size + 1)
      setExpandedExerciseId(added[0].id);
    if (known.size === 0 && exercises.length > 0)
      setStatus((s) => (s?.kind === 'saved' ? null : s));
    knownIdsRef.current = new Set(exercises.map((e) => e.id));
  }, [exercises]);

  useDayRoutineRevision();
  useCoachStore((s) => s.assignedWorkouts);
  const planned = exercises.length === 0 ? resolvePlannedSession() : null;
  const plannedMinutes = planned ? estimateSessionMinutes(planned.exercises) : 0;
  const restPlan = Boolean(planned && /^rest/i.test(planned.title));
  const workoutSavedToday = useTelemetryHistoryStore((s) =>
    Boolean(s.historyByDate[localTodayKey()]?.workout?.hasData),
  );
  const loggedToday = exercises.length === 0 && workoutSavedToday;

  const handleStartToday = () => {
    tactileEngine.triggerSelectionBuzz();
    if (!planned || planned.exercises.length === 0) {
      onBuildWorkout?.();
      return;
    }
    startTodaySession(planned);
    setExpandedExerciseId(planned.exercises[0]?.id ?? null);
    setStatus({
      kind: 'info',
      text: 'Tick each set as you finish it. The rest timer starts on its own.',
    });
  };

  const handleLoadBeginnerStarter = (starter: BeginnerStarter) => {
    tactileEngine.triggerSelectionBuzz();
    const session = buildStarterSession(starter);
    setExercises(session);
    useWorkoutStore.getState().setActiveSession(true);
    useWorkoutStore.getState().setActiveRoutine(starter.routineName);
    setExpandedExerciseId(session[0]?.id ?? null);
    setStatus({
      kind: 'info',
      text: 'Tick each set as you finish it. The rest timer starts on its own.',
    });
  };

  // Rotary Dial Input Modal State
  const [dialConfig, setDialConfig] = useState<{
    isOpen: boolean;
    exerciseId: string;
    setNumber: number;
    setId?: string;
    setIndex?: number;
    type: 'weight' | 'reps' | 'rpe';
    initialValue: number;
  }>({
    isOpen: false,
    exerciseId: '',
    setNumber: 1,
    type: 'weight',
    initialValue: 0,
  });

  const ledger = sessionLedger(exercises);
  const totalVolume = Math.round(ledger.tonnageKg);
  const totalSets = ledger.completedSets;
  const totalReps = ledger.totalReps;
  const committingRef = useRef(false);
  const visibleStatus = status && status.kind !== 'saved' && totalSets > 0 ? null : status;
  const untickedFilledSets = exercises.reduce(
    (n, e) => n + (e.sets || []).filter((s) => !s.completed && Number(s.reps) > 0).length,
    0,
  );
  const previewExercises =
    totalSets === 0 && untickedFilledSets > 0
      ? exercises.map((e) => ({
          ...e,
          sets: (e.sets || []).map((s) => (Number(s.reps) > 0 ? { ...s, completed: true } : s)),
        }))
      : exercises;
  const commitPreview = previewExercises === exercises ? ledger : sessionLedger(previewExercises);
  const energyPreview = isCommitOpen
    ? estimateSessionEnergy(previewExercises, commitPreview.completedSets)
    : null;
  const prPreview = isCommitOpen ? sessionPrCount(previewExercises) : 0;
  const lastWeekKg = isCommitOpen ? sameDayLastWeekKg() : null;
  const unit = readAthleteSettingsSnapshot().weightUnit;
  const unitLower = loadUnitLabel(unit).toLowerCase();
  const highlights = isCommitOpen ? liftHighlights(previewExercises, unit) : [];
  const feel = isCommitOpen ? sessionFeel(previewExercises, simple) : null;

  const handleToggleRow = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExpandedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null);
    }
  };

  const handleDuplicateSet = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    const targetEx = exercises.find((e) => e.id === exerciseId);
    completeEarlierSets(exerciseId, Number.MAX_SAFE_INTEGER);
    if (!targetEx || !targetEx.sets || targetEx.sets.length === 0) {
      addSet(exerciseId);
      return;
    }
    const lastSet = targetEx.sets[targetEx.sets.length - 1];
    const newSetNumber = lastSet.setNumber + 1;
    const newSet = {
      ...lastSet,
      id: `set-${Date.now()}-${newSetNumber}-${Math.random().toString(36).slice(2, 6)}`,
      setNumber: newSetNumber,
      rpe: 0,
      completed: false,
    };
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, sets: [...(e.sets || []), newSet] } : e)),
    );
  };

  const handleOpenDial = (
    exerciseId: string,
    setNumber: number,
    type: 'weight' | 'reps' | 'rpe',
    currentVal: number,
    setId?: string,
    setIndex?: number,
  ) => {
    tactileEngine.triggerSelectionBuzz();
    completeEarlierSets(exerciseId, setNumber);
    setDialConfig({
      isOpen: true,
      exerciseId,
      setNumber,
      setId,
      setIndex,
      type,
      initialValue:
        type === 'weight'
          ? kgToDisplay(currentVal ?? 0, readAthleteSettingsSnapshot().weightUnit)
          : (currentVal ?? (type === 'reps' ? 10 : 8)),
    });
  };

  const handleConfirmDial = (val: number) => {
    if (!dialConfig.exerciseId) return;
    tactileEngine.triggerSelectionBuzz();
    const weightUnit = readAthleteSettingsSnapshot().weightUnit;
    const numVal =
      dialConfig.type === 'weight' ? displayToKg(Number(val), weightUnit) : Number(val);
    const fieldKey = dialConfig.type === 'weight' ? 'weightKg' : dialConfig.type;

    // Direct reactive state update matching setId, setNumber, or index
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== dialConfig.exerciseId) return ex;
        const updatedSets = ex.sets.map((s, idx) => {
          const isTarget =
            (dialConfig.setId && s.id === dialConfig.setId) ||
            s.setNumber === dialConfig.setNumber ||
            Number(s.setNumber) === Number(dialConfig.setNumber) ||
            String(s.setNumber) === String(dialConfig.setNumber) ||
            (dialConfig.setIndex !== undefined && idx === dialConfig.setIndex);

          if (isTarget) {
            return {
              ...s,
              [fieldKey]: numVal,
              ...(dialConfig.type === 'weight' ? { weight: numVal, weightKg: numVal } : {}),
              ...(dialConfig.type === 'reps' ? { reps: numVal } : {}),
              ...(dialConfig.type === 'rpe' ? { rpe: numVal } : {}),
            };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }),
    );
  };

  const handleFinishAndSave = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsCommitOpen(true);
  };

  const handleRegisterLog = () => {
    if (committingRef.current || useWorkoutStore.getState().exercises.length === 0) return;
    committingRef.current = true;
    try {
      const todayKey = localDayKey(new Date().toISOString());
      releaseForgotten(todayKey, 'workout');
      const priors = new Map(
        exercises.map((e) => {
          const name = e.name || e.exerciseName || 'Exercise';
          return [name, priorBestKg(name, todayKey)] as const;
        }),
      );

      const session = useWorkoutStore.getState().commitSession();
      if (!session) {
        setIsCommitOpen(false);
        setStatus({ kind: 'warn', text: 'Nothing saved. Tick at least one set, then finish.' });
        return;
      }
      setIsCommitOpen(false);
      setExpandedExerciseId(null);
      tactileEngine.playPRCelebration();

      const athleteUser = useUserStore.getState();
      const linkedCoach = readLinkedCoach();
      const finished = {
        id: crypto.randomUUID(),
        athleteId: athleteUser.userId || '',
        athleteName: athleteUser.name || 'Athlete',
        athleteAvatar: athleteUser.avatarUrl,
        title: session.title,
        tonnageKg: session.tonnageKg,
        totalSets: session.completedSets,
        totalReps: session.totalReps,
        avgRpe: session.avgRpe ?? 0,
        durationMinutes: session.durationMinutes,
        completedAt: new Date().toISOString(),
        exercises: session.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weightKg: e.weightKg,
          rpe: 0,
        })),
      };
      useCoachStore.getState().recordFinishedWorkout(finished);
      if (linkedCoach?.id) void publishFinishedWorkout(finished, linkedCoach.id);

      const settled = settleFinishedSession();
      const burn = session.burnedKcal ? ` · ~${session.burnedKcal} kcal` : '';
      const summary = `Saved · ${session.durationMinutes} min${burn}.`;
      setStatus({
        kind: 'saved',
        text: settled.nextTitle ? `${summary} Next up: ${settled.nextTitle}.` : summary,
        backup: 'pending',
      });

      void (async () => {
        const outcome = await archiveSession({
          id: session.id,
          title: session.title,
          duration: session.durationMinutes > 0 ? `${session.durationMinutes}m` : '',
          duration_seconds: session.durationMinutes * 60,
          tonnage_kg: session.tonnageKg,
          total_sets: session.completedSets,
          strain: 0,
          exercises: session.items.map((e) => {
            const name = e.name || e.exerciseName || 'Exercise';
            const prior = priors.get(name) ?? 0;
            return {
              name,
              sets: e.sets.map((set) => {
                const weightKg = Number(set.weightKg ?? set.weight) || 0;
                const reps = Number(set.reps) || 0;
                return { ...set, weightKg, reps, is_pr: setIsPr(name, weightKg, reps, prior) };
              }),
              reps: e.sets[0]?.reps || 0,
              weightKg: e.sets[0]?.weightKg || e.sets[0]?.weight || 0,
              rpe: e.sets[0]?.rpe || 0,
            };
          }),
        });
        setStatus((s) => (s?.kind === 'saved' ? { ...s, backup: outcome } : s));
      })();
    } finally {
      committingRef.current = false;
    }
  };

  const handleTickFilledAndFinish = () => {
    setExercises((current) =>
      current.map((e) => ({
        ...e,
        sets: (e.sets || []).map((s) =>
          !s.completed && Number(s.reps) > 0 ? { ...s, completed: true } : s,
        ),
      })),
    );
    handleRegisterLog();
  };

  const handleSaveRoutineToDay = (
    selectedDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun',
  ) => {
    const success = saveAthleteDayRoutine(selectedDay, '', exercises);
    if (totalSets === 0) handleTickFilledAndFinish();
    else handleRegisterLog();

    if (success) setStatus((s) => (s?.kind === 'saved' ? { ...s, routineDay: selectedDay } : s));
  };

  return (
    <>
      <div className="w-full bg-o1-card rounded-2xl p-2 border border-white/[0.07] space-y-2 text-o1-text select-none transition-colors">
        <div className="flex items-baseline justify-between gap-2 px-0.5">
          <span className="text-o1-control text-o1-text">Active log</span>
          <span className="font-mono text-o1-label text-o1-muted truncate">
            {kgToDisplay(totalVolume, unit).toLocaleString()} {unitLower} · {totalSets}{' '}
            {totalSets === 1 ? 'set' : 'sets'} · {totalReps} reps
          </span>
        </div>

        {visibleStatus && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl bg-o1-well border border-white/[0.07] pl-3 pr-1 py-1.5"
          >
            <span
              aria-hidden
              className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[visibleStatus.kind]}`}
            />
            <div className="min-w-0 flex-1 py-0.5 space-y-0.5">
              <p className="text-o1-caption text-o1-text leading-snug">{visibleStatus.text}</p>
              {visibleStatus.routineDay && (
                <p className="text-o1-label text-o1-muted leading-snug">
                  Loads again every {visibleStatus.routineDay}.
                </p>
              )}
              {visibleStatus.backup && (
                <p
                  className={`text-o1-label leading-snug ${visibleStatus.backup === 'queued' ? 'text-o1-amber' : 'text-o1-muted'}`}
                >
                  {BACKUP_TEXT[visibleStatus.backup]}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStatus(null)}
              aria-label="Dismiss"
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-o1-muted hover:text-o1-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {planned ? (
          <div className="px-0.5 pb-0.5 space-y-2.5">
            {loggedToday ? (
              <p className="text-o1-caption text-o1-muted leading-snug">
                Today's workout is saved. Rest up, or start another below.
              </p>
            ) : planned.exercises.length > 0 ? (
              <p className="text-o1-caption text-o1-muted leading-snug truncate">
                <span className="text-o1-text">{restPlan ? 'Rest day' : planned.title}</span> ·{' '}
                {planned.exercises.length} {restPlan ? 'light ' : ''}
                {planned.exercises.length === 1 ? 'exercise' : 'exercises'}
                {plannedMinutes > 0 ? ` · about ${plannedMinutes} min` : ''}
                {restPlan ? '' : ` · ${planned.detail}`}
              </p>
            ) : (
              <p className="text-o1-caption text-o1-muted leading-snug">
                {planned.title === 'Rest day'
                  ? 'Rest day. Recover, or build a light session.'
                  : 'No workout planned for today yet.'}
              </p>
            )}

            {!loggedToday && (
              <button
                type="button"
                onClick={handleStartToday}
                className="w-full h-12 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.99] text-white font-medium text-o1-control flex items-center justify-center transition cursor-pointer"
              >
                {planned.exercises.length === 0
                  ? 'Build a workout'
                  : restPlan
                    ? 'Start recovery'
                    : "Start today's workout"}
              </button>
            )}

            <div className="flex items-center justify-center gap-2 text-o1-caption text-o1-muted">
              {(loggedToday || planned.exercises.length > 0) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      onBuildWorkout?.();
                    }}
                    className="min-h-[44px] px-2 hover:text-o1-text underline underline-offset-2 cursor-pointer"
                  >
                    Build my own
                  </button>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setShowQuickStart((v) => !v);
                }}
                aria-expanded={showQuickStart}
                className="min-h-[44px] px-2 hover:text-o1-text underline underline-offset-2 cursor-pointer"
              >
                {showQuickStart ? 'Hide beginner starters' : 'Beginner starters'}
              </button>
            </div>

            {showQuickStart && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BEGINNER_STARTERS.map((starter) => (
                  <button
                    key={starter.routineName}
                    type="button"
                    onClick={() => handleLoadBeginnerStarter(starter)}
                    className="p-3 text-left rounded-xl bg-o1-well border border-white/[0.07] hover:border-white/[0.14] transition-colors cursor-pointer flex flex-col justify-between active:scale-[0.99]"
                  >
                    <div>
                      <span className="text-o1-label px-1.5 py-0.5 rounded-full border border-white/[0.14] text-o1-muted">
                        {starter.badge}
                      </span>
                      <h5 className="text-o1-body text-o1-text leading-tight mt-1.5">
                        {starter.title}
                      </h5>
                      <p className="text-o1-label text-o1-muted mt-0.5">{starter.subtitle}</p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/[0.07] text-o1-label text-o1-muted flex items-center justify-between">
                      <span>{starter.movements.length} exercises</span>
                      <span>Tap to load</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {exercises.map((exercise, index) => {
              const isExpanded = expandedExerciseId === exercise.id;

              return (
                <ActiveLogExerciseAccordion
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={isExpanded}
                  showSwipeHint={
                    isExpanded ||
                    (index === 0 && !exercises.some((e) => e.id === expandedExerciseId))
                  }
                  onToggleExpand={() => handleToggleRow(exercise.id)}
                  onAddSet={(id) => {
                    completeEarlierSets(id, Number.MAX_SAFE_INTEGER);
                    addSet(id);
                  }}
                  onDuplicateSet={(id) => handleDuplicateSet(id)}
                  onRemoveSet={(id, setNum) => removeSet(id, setNum)}
                  onRemoveExercise={(id) => handleDeleteExercise(id)}
                  onOpenDial={(id, setNum, type, val, setId, setIndex) =>
                    handleOpenDial(id, setNum, type, val, setId, setIndex)
                  }
                  onToggleSet={(id, setNum) => toggleSetCompleted(id, setNum)}
                  onQuickUpdateSet={(id, setNum, updates) => updateExerciseSet(id, setNum, updates)}
                />
              );
            })}
          </div>
        )}

        {/* Finish & Save Session Button */}
        {exercises.length > 0 && (
          <button
            type="button"
            onClick={handleFinishAndSave}
            className="w-full h-10 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press active:scale-[0.99] text-white font-medium text-o1-body flex items-center justify-center transition cursor-pointer"
          >
            Finish workout
          </button>
        )}
      </div>

      {/* Rotary Dial Input Modal */}
      <DialInputModal
        isOpen={dialConfig.isOpen}
        onClose={() => setDialConfig((prev) => ({ ...prev, isOpen: false }))}
        unit={
          dialConfig.type === 'weight'
            ? loadUnitLabel(readAthleteSettingsSnapshot().weightUnit)
            : dialConfig.type === 'reps'
              ? 'Reps'
              : 'rpe'
        }
        initialValue={dialConfig.initialValue}
        onConfirm={handleConfirmDial}
      />

      {/* Commit Workout Modal */}
      <CommitWorkoutModal
        isOpen={isCommitOpen}
        onClose={() => setIsCommitOpen(false)}
        onRegisterLog={handleRegisterLog}
        onTickFilledAndFinish={handleTickFilledAndFinish}
        untickedFilledSets={untickedFilledSets}
        onSaveRoutineToDay={handleSaveRoutineToDay}
        tickedSets={totalSets}
        totalKg={Math.round(commitPreview.tonnageKg)}
        totalSets={commitPreview.completedSets}
        totalReps={commitPreview.totalReps}
        durationMinutes={energyPreview?.durationMinutes ?? 0}
        burnedKcal={energyPreview?.burnedKcal ?? null}
        prCount={prPreview}
        lastWeekKg={lastWeekKg}
        formatKg={(kg) => `${kgToDisplay(kg, unit).toLocaleString()} ${unitLower}`}
        highlights={highlights}
        feel={feel}
        simple={simple}
      />
    </>
  );
};
