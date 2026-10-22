import React, { useEffect, useRef, useState } from 'react';
import { CommitWorkoutModal } from './modals/CommitWorkoutModal';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { resolvePlannedSession, startTodaySession } from '../../log/todaySession';
import { DialInputModal } from '../../../components/common/DialInputModal';
import { ActiveLogExerciseAccordion } from './ActiveLogExerciseAccordion';
import {
  estimateSessionMinutes,
  saveAthleteDayRoutine,
  useDayRoutineRevision,
} from '../services/dayRoutineService';
import { sessionLedger } from '../store/workoutSetOperations';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { kgToDisplay, loadUnitLabel } from '../../../utils/weightUnits';
import { localTodayKey } from '../services/sessionPr';
import { buildStarterSession, type BeginnerStarter } from '../data/beginnerStarters';
import { estimateSessionEnergy } from '../utils/sessionEnergy';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { finishSession } from './activeLog/finishSession';
import { LogStatusBanner, type LogStatus } from './activeLog/LogStatusBanner';
import { PlannedSessionPanel } from './activeLog/PlannedSessionPanel';
import {
  countUntickedFilledSets,
  liftHighlights,
  sameDayLastWeekKg,
  sessionFeel,
  sessionPrCount,
  tickFilledSets,
} from './activeLog/sessionSummary';
import { useSetDial } from './activeLog/useSetDial';

const TICK_HINT: LogStatus = {
  kind: 'info',
  text: 'Tick each set as you finish it. The rest timer starts on its own.',
};

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
  const dial = useSetDial(setExercises, completeEarlierSets);

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
    setStatus(TICK_HINT);
  };

  const handleLoadBeginnerStarter = (starter: BeginnerStarter) => {
    tactileEngine.triggerSelectionBuzz();
    const session = buildStarterSession(starter);
    setExercises(session);
    useWorkoutStore.getState().setActiveSession(true);
    useWorkoutStore.getState().setActiveRoutine(starter.routineName);
    setExpandedExerciseId(session[0]?.id ?? null);
    setStatus(TICK_HINT);
  };

  const ledger = sessionLedger(exercises);
  const totalVolume = Math.round(ledger.tonnageKg);
  const totalSets = ledger.completedSets;
  const totalReps = ledger.totalReps;
  const committingRef = useRef(false);
  const visibleStatus = status && status.kind !== 'saved' && totalSets > 0 ? null : status;
  const untickedFilledSets = countUntickedFilledSets(exercises);
  // With nothing ticked, the finish sheet previews the session as if every filled set were done.
  const previewExercises =
    totalSets === 0 && untickedFilledSets > 0 ? tickFilledSets(exercises) : exercises;
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

  const handleFinishAndSave = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsCommitOpen(true);
  };

  const handleRegisterLog = () => {
    if (committingRef.current || useWorkoutStore.getState().exercises.length === 0) return;
    committingRef.current = true;
    try {
      finishSession(exercises, {
        onNothingSaved: () => {
          setIsCommitOpen(false);
          setStatus({ kind: 'warn', text: 'Nothing saved. Tick at least one set, then finish.' });
        },
        onCommitted: () => {
          setIsCommitOpen(false);
          setExpandedExerciseId(null);
        },
        onSaved: (text) => setStatus({ kind: 'saved', text, backup: 'pending' }),
        onBackup: (outcome) =>
          setStatus((s) => (s?.kind === 'saved' ? { ...s, backup: outcome } : s)),
      });
    } finally {
      committingRef.current = false;
    }
  };

  const handleTickFilledAndFinish = () => {
    setExercises((current) => tickFilledSets(current));
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
          <span className="font-num text-o1-label text-o1-muted truncate">
            {kgToDisplay(totalVolume, unit).toLocaleString()} {unitLower} · {totalSets}{' '}
            {totalSets === 1 ? 'set' : 'sets'} · {totalReps} reps
          </span>
        </div>

        {visibleStatus && (
          <LogStatusBanner status={visibleStatus} onDismiss={() => setStatus(null)} />
        )}

        {planned ? (
          <PlannedSessionPanel
            planned={planned}
            plannedMinutes={plannedMinutes}
            restPlan={restPlan}
            loggedToday={loggedToday}
            showStarters={showQuickStart}
            onStart={handleStartToday}
            onBuildOwn={() => {
              tactileEngine.triggerSelectionBuzz();
              onBuildWorkout?.();
            }}
            onToggleStarters={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowQuickStart((v) => !v);
            }}
            onLoadStarter={handleLoadBeginnerStarter}
          />
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
                  onOpenDial={dial.open}
                  onToggleSet={(id, setNum) => toggleSetCompleted(id, setNum)}
                  onQuickUpdateSet={(id, setNum, updates) => updateExerciseSet(id, setNum, updates)}
                />
              );
            })}
          </div>
        )}

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

      <DialInputModal
        isOpen={dial.isOpen}
        onClose={dial.close}
        unit={dial.unitLabel}
        initialValue={dial.initialValue}
        onConfirm={dial.confirm}
      />

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
