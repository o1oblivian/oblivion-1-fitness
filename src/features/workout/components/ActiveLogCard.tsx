import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Flag } from 'lucide-react';
import { CommitWorkoutModal } from './modals/CommitWorkoutModal';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { settleFinishedSession } from '../../log/todaySession';
import { DialInputModal } from '../../../components/common/DialInputModal';
import { ActiveLogExerciseAccordion } from './ActiveLogExerciseAccordion';
import { saveAthleteDayRoutine } from '../services/dayRoutineService';
import { useLogStore } from '../../../stores/useLogStore';
import { useUserStore } from '../../../stores/useUserStore';
import { useTelemetryHistoryStore, getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';
import { exerciseFromSets, setsFromExercise } from '../../log/liftLedger';
import { releaseForgotten } from '../../log/services/dayLogService';
import { syncSessionToSupabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { readLinkedCoach } from '../../coach/services/coachLink';
import { publishFinishedWorkout } from '../../coach/services/coachBridge';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { displayToKg, kgToDisplay, loadUnitLabel } from '../../../utils/weightUnits';
import { priorBestKg, setIsPr } from '../services/sessionPr';

export interface ActiveLogCardProps {
  onShowToast?: (msg: string) => void;
  [key: string]: any;
}

export const ActiveLogCard: React.FC<ActiveLogCardProps> = ({ onShowToast }) => {
  const exercises = useWorkoutStore((s) => s.exercises);
  const setExercises = useWorkoutStore((s) => s.setExercises);
  const updateExerciseSet = useWorkoutStore((s) => s.updateExerciseSet);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const toggleSetCompleted = useWorkoutStore((s) => s.toggleSetCompleted);
  const clearActiveLog = useWorkoutStore((s) => s.clearActiveLog);
  const showToastFn = useWorkoutStore((s) => s.showToast);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else showToastFn(msg);
  };

  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [isCommitOpen, setIsCommitOpen] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);

  const BEGINNER_STARTERS = [
    {
      title: 'Full Body Foundation',
      subtitle: '35 mins • 4 classic movements',
      badge: 'Beginner Best',
      routineName: 'Full Body Foundation (Beginner)',
      exercises: [
        {
          id: 'bg-sq-1',
          name: 'Goblet Squat (Dumbbell)',
          exerciseName: 'Goblet Squat',
          targetMuscle: 'Quadriceps / Glutes',
          equipment: 'Dumbbell',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 10, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 10, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 12, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-bp-2',
          name: 'Dumbbell Flat Bench Press',
          exerciseName: 'Dumbbell Bench Press',
          targetMuscle: 'Chest / Triceps',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 12, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 12, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 14, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-lp-3',
          name: 'Lat Pulldown (Neutral Grip)',
          exerciseName: 'Lat Pulldown',
          targetMuscle: 'Upper Back / Lats',
          equipment: 'Cable Machine',
          sets: [
            { id: 's1', setNumber: 1, reps: 12, weightKg: 30, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 12, weightKg: 30, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 12, weightKg: 35, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-rdl-4',
          name: 'Romanian Deadlift (Dumbbell)',
          exerciseName: 'Romanian Deadlift',
          targetMuscle: 'Hamstrings / Posterior',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 14, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 14, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 16, rpe: 8, completed: false },
          ],
        },
      ],
    },
    {
      title: 'Upper Push & Pull Starter',
      subtitle: '30 mins • Arms & Upper Body',
      badge: 'Easy Start',
      routineName: 'Upper Body Starter (Beginner)',
      exercises: [
        {
          id: 'bg-row-1',
          name: 'Seated Cable Row',
          exerciseName: 'Seated Cable Row',
          targetMuscle: 'Upper Back',
          equipment: 'Cable Machine',
          sets: [
            { id: 's1', setNumber: 1, reps: 12, weightKg: 25, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 12, weightKg: 25, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 12, weightKg: 30, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-inc-2',
          name: 'Incline Dumbbell Press',
          exerciseName: 'Incline Dumbbell Press',
          targetMuscle: 'Upper Chest',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 10, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 10, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 12, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-lat-3',
          name: 'Standing Lateral Raise',
          exerciseName: 'Lateral Raise',
          targetMuscle: 'Side Delts',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 12, weightKg: 5, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 12, weightKg: 5, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 12, weightKg: 6, rpe: 8, completed: false },
          ],
        },
      ],
    },
  ];

  const handleLoadBeginnerStarter = (starter: typeof BEGINNER_STARTERS[0]) => {
    tactileEngine.playPRCelebration();
    setExercises(starter.exercises as any);
    useWorkoutStore.getState().setActiveSession(true);
    useWorkoutStore.getState().setActiveRoutine(starter.routineName);
    setExpandedExerciseId(starter.exercises[0].id);
    notify(`🎉 Loaded ${starter.title}! Tap the checkmark when you complete each set.`);
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

  // Calculate live volume, sets, and reps
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  exercises.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      const done = Boolean(s.completed) || (Number(s.reps) > 0 && Number(s.weightKg ?? s.weight) > 0);
      if (!done) return;
      totalSets += 1;
      const w = Number(s.weightKg ?? s.weight);
      const r = Number(s.reps);
      const weight = Number.isFinite(w) && w > 0 ? w : 0;
      const reps = Number.isFinite(r) && r > 0 ? r : 0;
      totalVolume += weight * reps;
      totalReps += reps;
    });
  });

  const handleToggleRow = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExpandedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  };

  const handleDeleteExercise = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null);
    }
  };

  const handleDuplicateSet = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    const targetEx = exercises.find((e) => e.id === exerciseId);
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
      completed: false,
    };
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId ? { ...e, sets: [...(e.sets || []), newSet] } : e
      )
    );
  };

  const handleOpenDial = (
    exerciseId: string,
    setNumber: number,
    type: 'weight' | 'reps' | 'rpe',
    currentVal: number,
    setId?: string,
    setIndex?: number
  ) => {
    tactileEngine.triggerSelectionBuzz();
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
          : currentVal ?? (type === 'reps' ? 10 : 8),
    });
  };

  const handleConfirmDial = (val: number) => {
    if (!dialConfig.exerciseId) return;
    tactileEngine.playPRCelebration();
    const unit = readAthleteSettingsSnapshot().weightUnit;
    const numVal =
      dialConfig.type === 'weight' ? displayToKg(Number(val), unit) : Number(val);
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
      })
    );
  };

  const handleFinishAndSave = () => {
    tactileEngine.playPRCelebration();
    setIsCommitOpen(true);
  };

  const handleRegisterLog = () => {
    // 1. Ingest session record into LogStore history
    const activeTitle = useWorkoutStore.getState().activeRoutine || 'Coach Dispatched Protocol';
    const mappedPastExercises = exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.length,
      reps: ex.sets[0]?.reps > 0 ? `${ex.sets[0].reps} reps` : '--',
      load: (ex.sets[0]?.weightKg || ex.sets[0]?.weight || 0) > 0 ? `${ex.sets[0]?.weightKg || ex.sets[0]?.weight} kg` : '--',
    }));

    useLogStore.getState().addRecentSession({
      id: `session-${Date.now()}`,
      title: activeTitle,
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '--',
      tonnageKg: totalVolume,
      totalSets,
      strain: 0,
      exercises: mappedPastExercises,
    });

    const prevStats = useLogStore.getState().microcycleStats;
    useLogStore.getState().updateMicrocycleStats({
      totalVolumeKg: (prevStats.totalVolumeKg || 0) + totalVolume,
      streakDays: Math.max(1, (prevStats.streakDays || 0) + 1),
      strikeRate: `${Math.min(7, parseInt(prevStats.strikeRate?.split('/')[0] || '0', 10) + 1)} / 7`,
    });

    // 2. Dispatch finish notification & workout history log to Coach Store for daily feedback
    const athleteUser = useUserStore.getState();
    const linkedCoach = readLinkedCoach();
    const finished = {
      id: `wlog-${Date.now()}`,
      athleteId: athleteUser.userId || 'ath-current',
      athleteName: athleteUser.name || 'Athlete',
      athleteAvatar: athleteUser.avatarUrl,
      title: activeTitle,
      tonnageKg: totalVolume,
      totalSets,
      totalReps,
      avgRpe: 0,
      durationMinutes: 0,
      completedAt: new Date().toISOString(),
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: e.sets.length,
        reps: e.sets[0]?.reps || 0,
        weightKg: e.sets[0]?.weightKg || e.sets[0]?.weight || 0,
        rpe: e.sets[0]?.rpe || 0,
      })),
    };
    useCoachStore.getState().recordFinishedWorkout(finished);
    if (linkedCoach?.id) void publishFinishedWorkout(finished, linkedCoach.id);

    // 3. Register accurately and straight into useTelemetryHistoryStore for Workout History & 7-Day Matrix
    const now = new Date();
    const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    releaseForgotten(todayDateKey, 'workout');
    useTelemetryHistoryStore.getState().updateDayRecord(todayDateKey, 'workout', {
      hasData: true,
      tonnageKg: totalVolume,
      completedSets: totalSets,
      durationMinutes: 0,
      routineName: activeTitle,
      intensityRpe: 0,
      exercises: exercises
        .map((e) => exerciseFromSets(
          e.name || e.exerciseName || 'Exercise',
          setsFromExercise(e),
          true,
        ))
        .filter((entry) => (entry.setLog?.length || 0) > 0),
    });

    // 4. Persist to live Supabase tables completed_sessions and workout_logs
    void (async () => {
      const uid = await getAuthenticatedUserId();
      if (!uid) {
        notify('Session saved on this device. Sign in to archive to the cloud.');
        return;
      }
      const ok = await syncSessionToSupabase({
        id: `session-${Date.now()}`,
        user_id: uid,
        title: activeTitle,
        duration: '',
        duration_seconds: 0,
        tonnage_kg: totalVolume,
        total_sets: totalSets,
        strain: 0,
        exercises: exercises.map((e) => {
          const name = e.name || e.exerciseName || 'Exercise';
          const prior = priorBestKg(name);
          return {
            name,
            sets: (e.sets || []).map((set) => {
              const weightKg = Number(set.weightKg ?? set.weight) || 0;
              const reps = Number(set.reps) || 0;
              return {
                ...set,
                weightKg,
                reps,
                is_pr: setIsPr(name, weightKg, reps, prior),
              };
            }),
            reps: e.sets?.[0]?.reps || 0,
            weightKg: e.sets?.[0]?.weightKg || e.sets?.[0]?.weight || 0,
            rpe: e.sets?.[0]?.rpe || 0,
          };
        }),
      });
      notify(ok ? 'Cloud Sync: Session archived.' : 'Cloud archive failed. Session is still saved on this device.');
    })();

    clearActiveLog();
    setIsCommitOpen(false);
    tactileEngine.playPRCelebration();

    const settled = settleFinishedSession();
    if (settled.nextTitle) {
      notify(`Saved. Next up: ${settled.nextTitle}.`);
    } else {
      notify('Session saved for today.');
    }
  };

  const handleSaveRoutineToDay = (selectedDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun') => {
    const success = saveAthleteDayRoutine(selectedDay, '', exercises);
    handleRegisterLog();

    if (success) {
      notify(`Workout saved as repeating ${selectedDay} routine! Tomorrow's program ready.`);
    }
  };

  return (
    <>
      <div className="w-full bg-o1-card rounded-2xl p-2.5 border border-white/[0.07] shadow-sm space-y-2.5 text-white select-none transition-colors">
        {/* Header Telemetry */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-100 tracking-wide">
              Active Log
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>
          <div className="o1-num flex items-center gap-3 text-[11px] text-neutral-400">
            <span>
              V:{' '}
              <strong className="text-white">
                {kgToDisplay(totalVolume, readAthleteSettingsSnapshot().weightUnit).toLocaleString()}{' '}
                {loadUnitLabel(readAthleteSettingsSnapshot().weightUnit)}
              </strong>
            </span>
            <span>
              S: <strong className="text-neutral-100">{totalSets}</strong>
            </span>
            <span>
              R: <strong className="text-neutral-100">{totalReps}</strong>
            </span>
          </div>
        </div>

        {/* Exercise Rows or Empty State */}
        {exercises.length === 0 ? (
          <div className="rounded-2xl bg-black border border-white/[0.07] px-3 py-3 space-y-2">
            <p className="text-xs text-[#F2EFE6]">
              Nothing logged yet. Start a session above.
            </p>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowQuickStart((v) => !v);
              }}
              className="text-[11px] font-medium text-neutral-300 hover:text-white cursor-pointer"
            >
              {showQuickStart ? 'Hide quick start' : '1-tap beginner starters'}
            </button>
            {showQuickStart && (
            <div className="rounded-2xl bg-o1-card border border-white/[0.07] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
                <h4 className="text-xs font-semibold text-white">
                  Beginner quick start
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BEGINNER_STARTERS.map((starter, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => handleLoadBeginnerStarter(starter)}
                    className="p-3 rounded-xl bg-o1-well border border-white/[0.07] hover:border-white/[0.14] transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                  >
                    <div>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
                        {starter.badge}
                      </span>
                      <h5 className="font-semibold text-xs text-white leading-tight mt-1">
                        {starter.title}
                      </h5>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        {starter.subtitle}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/[0.05] text-[9px] text-neutral-400 flex items-center justify-between">
                      <span>{starter.exercises.length} exercises</span>
                      <span>Tap to load</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {exercises.map((exercise) => {
              const isExpanded = expandedExerciseId === exercise.id;

              return (
                <ActiveLogExerciseAccordion
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={isExpanded}
                  onToggleExpand={() => handleToggleRow(exercise.id)}
                  onAddSet={(id) => addSet(id)}
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
            className="w-full py-3.5 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.99] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-o1-crimson/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>⚡ Finish &amp; Save Session</span>
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
        onSaveRoutineToDay={handleSaveRoutineToDay}
        totalKg={totalVolume}
        totalSets={totalSets}
        totalReps={totalReps}
      />
    </>
  );
};

export default ActiveLogCard;
