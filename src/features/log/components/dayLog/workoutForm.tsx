import React, { useEffect, useState } from 'react';
import { WorkoutDayRecord, useTelemetryHistoryStore } from '../../store/useTelemetryHistoryStore';
import { useWorkoutStore } from '../../../workout/store/useWorkoutStore';
import { sanitizeNumericInput } from '../../../../utils/numberInputUtils';
import { archiveSession } from '../../../../services/sessionArchive';
import { localDayKey, localNoonIso, releaseForgotten } from '../../services/dayLogService';
import { exerciseFromSets, knownSets, setsFromExercise } from '../../liftLedger';
import { readNum, type DayLogContext, type SaveOutcome } from './shared';

/** Workout day: edit the lifts that were logged, or type totals by hand. */
export function useWorkoutLogForm({ isOpen, dayMeta, category, mode, onSaved }: DayLogContext) {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  const [workoutRoutine, setWorkoutRoutine] = useState('');
  const [workoutTonnage, setWorkoutTonnage] = useState('');
  const [workoutSets, setWorkoutSets] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [liftDrafts, setLiftDrafts] = useState<
    Array<{ name: string; sets: Array<{ reps: string; weight: string }> }>
  >([]);

  useEffect(() => {
    if (!isOpen || !dayMeta) return;
    setLiftDrafts([]);
    if (category !== 'workout') return;
    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];
    const rec = dayRecord as WorkoutDayRecord | undefined;
    if (rec?.hasData) {
      setWorkoutRoutine(rec.routineName || 'Resistance Training');
      setWorkoutTonnage(String(rec.tonnageKg || ''));
      setWorkoutSets(String(rec.completedSets || ''));
      setWorkoutDuration(String(rec.durationMinutes || ''));
      if (rec.exercises?.[0]) {
        setExerciseName(rec.exercises[0].name);
        setExerciseWeight(String(rec.exercises[0].weightKg || ''));
        setExerciseReps(String(rec.exercises[0].reps || ''));
      }
    } else {
      // If today has active workout data in useWorkoutStore, prepopulate with real live metrics
      const activeTonnage = useWorkoutStore.getState().sessionTonnageKg;
      const activeSets = useWorkoutStore.getState().completedSetsCount;
      const activeExs = useWorkoutStore.getState().exercises;
      if (dayMeta.isToday && (activeTonnage > 0 || activeSets > 0 || activeExs.length > 0)) {
        setWorkoutRoutine(useWorkoutStore.getState().activeRoutine || 'Active Resistance Session');
        setWorkoutTonnage(activeTonnage > 0 ? String(activeTonnage) : '');
        setWorkoutSets(activeSets > 0 ? String(activeSets) : String(activeExs.length));
        setWorkoutDuration('');
        if (activeExs[0]) {
          setExerciseName(activeExs[0].name || activeExs[0].exerciseName || '');
          const firstSet = activeExs[0].sets?.[0];
          setExerciseWeight(
            firstSet?.weightKg
              ? String(firstSet.weightKg)
              : firstSet?.weight
                ? String(firstSet.weight)
                : '',
          );
          setExerciseReps(firstSet?.reps ? String(firstSet.reps) : '');
        }
      } else {
        setWorkoutRoutine('Resistance Training');
        setWorkoutTonnage('');
        setWorkoutSets('');
        setWorkoutDuration('');
        setExerciseName('');
        setExerciseWeight('');
        setExerciseReps('');
      }
    }
    const liveLifts = dayMeta.isToday
      ? useWorkoutStore
          .getState()
          .exercises.filter(
            (exercise) => !(exercise.name || '').toLowerCase().startsWith('cardio:'),
          )
          .map((exercise) =>
            exerciseFromSets(
              exercise.name || exercise.exerciseName || 'Exercise',
              setsFromExercise(exercise),
            ),
          )
          .filter((exercise) => (exercise.setLog?.length || 0) > 0)
      : [];
    const source = liveLifts.length > 0 ? liveLifts : rec?.exercises || [];
    setLiftDrafts(
      source
        .map((exercise) => {
          const logged = knownSets(exercise);
          const rows =
            logged.length > 0
              ? logged
              : [{ reps: exercise.reps || 0, weightKg: exercise.weightKg || 0 }];
          return {
            name: exercise.name,
            sets: rows
              .filter((set) => set.reps > 0 || set.weightKg > 0)
              .map((set) => ({
                reps: set.reps > 0 ? String(set.reps) : '',
                weight: set.weightKg > 0 ? String(set.weightKg) : '',
              })),
          };
        })
        .filter((lift) => lift.name && lift.sets.length > 0),
    );
  }, [isOpen, dayMeta, category, historyByDate]);

  const save = (): SaveOutcome => {
    if (!dayMeta) return 'stay';
    if (liftDrafts.length > 0) {
      const exercises = liftDrafts
        .map((lift) =>
          exerciseFromSets(
            lift.name,
            lift.sets
              .map((set) => ({ reps: Number(set.reps) || 0, weightKg: Number(set.weight) || 0 }))
              .filter((set) => set.reps > 0 || set.weightKg > 0),
          ),
        )
        .filter((lift) => lift.sets > 0);
      if (exercises.length === 0) {
        onSaved?.('Add a number first');
        return 'stay';
      }
      const durNum = readNum(workoutDuration);
      releaseForgotten(dayMeta.dateKey, 'workout');
      if (dayMeta.isToday && useWorkoutStore.getState().exercises.length > 0) {
        const next = useWorkoutStore.getState().exercises.map((exercise) => {
          const name = exercise.name || exercise.exerciseName || '';
          const draft = liftDrafts.find((lift) => lift.name === name);
          if (!draft) return exercise;
          let cursor = 0;
          const sets = (exercise.sets || []).map((set) => {
            const logged =
              Boolean(set.completed) ||
              Number(set.reps) > 0 ||
              Number(set.weightKg || set.weight) > 0;
            if (!logged) return set;
            const edited = draft.sets[cursor];
            cursor += 1;
            if (!edited) return set;
            const reps = Number(edited.reps) || 0;
            const weightKg = Number(edited.weight) || 0;
            return { ...set, reps, weightKg, weight: weightKg };
          });
          return { ...exercise, sets };
        });
        useWorkoutStore.getState().setExercises(next);
      }
      const loadVolume = Math.round(exercises.reduce((sum, lift) => sum + (lift.volumeKg || 0), 0));
      const record = {
        hasData: true,
        tonnageKg: dayMeta.isToday
          ? useWorkoutStore.getState().sessionTonnageKg || loadVolume
          : loadVolume,
        completedSets: exercises.reduce((sum, lift) => sum + lift.sets, 0),
        durationMinutes: durNum ?? 0,
        routineName: workoutRoutine.trim(),
        intensityRpe: 0,
        exercises,
      };
      updateDayRecord(dayMeta.dateKey, 'workout', record);
      onSaved?.('Workout updated');
      return 'closed';
    }
    const tonnageNum = readNum(workoutTonnage);
    const setsNum = readNum(workoutSets);
    const durNum = readNum(workoutDuration);
    const exWeightNum = readNum(exerciseWeight);
    const exRepsNum = readNum(exerciseReps);
    // The routine name is pre-filled, so it cannot count as something the athlete logged.
    if (
      tonnageNum == null &&
      setsNum == null &&
      durNum == null &&
      exWeightNum == null &&
      exRepsNum == null &&
      !exerciseName.trim()
    ) {
      onSaved?.('Add a number first');
      return 'stay';
    }
    const rName = workoutRoutine.trim();
    const exercises =
      exerciseName.trim() || exWeightNum != null || exRepsNum != null
        ? [
            {
              name: exerciseName.trim() || 'Logged set',
              sets: setsNum ?? 0,
              reps: exRepsNum ?? 0,
              weightKg: exWeightNum ?? 0,
              completed: true,
            },
          ]
        : [];
    const record = {
      hasData: true,
      tonnageKg: tonnageNum ?? 0,
      completedSets: setsNum ?? 0,
      durationMinutes: durNum ?? 0,
      routineName: rName,
      intensityRpe: 0,
      exercises,
    };
    updateDayRecord(dayMeta.dateKey, 'workout', record);
    if (mode === 'create') {
      void archiveSession({
        id: crypto.randomUUID(),
        title: rName || 'Workout',
        duration: durNum != null ? `${durNum}m` : '',
        duration_seconds: durNum != null ? Math.round(durNum * 60) : 0,
        tonnage_kg: tonnageNum ?? 0,
        total_sets: setsNum ?? 0,
        strain: 0,
        exercises,
        completed_at:
          dayMeta.dateKey === localDayKey(new Date().toISOString())
            ? undefined
            : localNoonIso(dayMeta.dateKey),
      });
    }
    onSaved?.(mode === 'edit' ? 'Workout updated' : 'Workout logged');
    return 'done';
  };

  return {
    workoutRoutine,
    setWorkoutRoutine,
    workoutTonnage,
    setWorkoutTonnage,
    workoutSets,
    setWorkoutSets,
    workoutDuration,
    setWorkoutDuration,
    exerciseName,
    setExerciseName,
    exerciseWeight,
    setExerciseWeight,
    exerciseReps,
    setExerciseReps,
    liftDrafts,
    setLiftDrafts,
    save,
  };
}

export type WorkoutLogForm = ReturnType<typeof useWorkoutLogForm>;

export function WorkoutLogFields({
  form,
  focusLift,
}: {
  form: WorkoutLogForm;
  focusLift?: string;
}) {
  const {
    workoutRoutine,
    setWorkoutRoutine,
    workoutTonnage,
    setWorkoutTonnage,
    workoutSets,
    setWorkoutSets,
    workoutDuration,
    setWorkoutDuration,
    exerciseName,
    setExerciseName,
    exerciseWeight,
    setExerciseWeight,
    exerciseReps,
    setExerciseReps,
    liftDrafts,
    setLiftDrafts,
  } = form;
  return (
    <div className="space-y-3.5">
      {liftDrafts.length > 0 ? (
        <div className="space-y-3">
          {!focusLift && (
            <div>
              <label className="text-o1-label text-neutral-400 font-bold block mb-1">
                Duration (MIN)
              </label>
              <input
                type="number"
                value={workoutDuration}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWorkoutDuration(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-crimson focus:outline-none"
                placeholder="55"
              />
            </div>
          )}
          {liftDrafts.map((lift, liftIndex) =>
            focusLift && lift.name !== focusLift ? null : (
              <div key={`${lift.name}-${liftIndex}`} className="space-y-1.5">
                <div className="text-o1-label font-sans font-semibold text-white">{lift.name}</div>
                <div className="grid grid-cols-[1.25rem_1fr_1fr] gap-2 text-o1-label text-neutral-500">
                  <span />
                  <span>Reps</span>
                  <span>kg</span>
                </div>
                {lift.sets.map((set, setIndex) => (
                  <div
                    key={`${lift.name}-${setIndex}`}
                    className="grid grid-cols-[1.25rem_1fr_1fr] gap-2 items-center"
                  >
                    <span className="text-o1-label text-neutral-500 tabular-nums">
                      {setIndex + 1}
                    </span>
                    <input
                      type="number"
                      value={set.reps}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const value = sanitizeNumericInput(e.target.value);
                        setLiftDrafts((current) =>
                          current.map((item, index) =>
                            index === liftIndex
                              ? {
                                  ...item,
                                  sets: item.sets.map((row, rowIndex) =>
                                    rowIndex === setIndex ? { ...row, reps: value } : row,
                                  ),
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-white text-xs tabular-nums"
                    />
                    <input
                      type="number"
                      value={set.weight}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const value = sanitizeNumericInput(e.target.value);
                        setLiftDrafts((current) =>
                          current.map((item, index) =>
                            index === liftIndex
                              ? {
                                  ...item,
                                  sets: item.sets.map((row, rowIndex) =>
                                    rowIndex === setIndex ? { ...row, weight: value } : row,
                                  ),
                                }
                              : item,
                          ),
                        );
                      }}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-white text-xs tabular-nums"
                    />
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div>
            <label className="text-o1-label text-neutral-400 font-bold block mb-1">
              Routine Split
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Push Hypertrophy', 'Pull Overload', 'Legs & Core'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setWorkoutRoutine(r)}
                  className={`py-2 px-1 text-o1-label rounded-xl font-bold transition-all ${
                    workoutRoutine === r
                      ? 'bg-o1-crimson text-white'
                      : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
                  }`}
                >
                  {r.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-o1-label text-neutral-400 font-bold block mb-1">
                Volume (KG)
              </label>
              <input
                type="number"
                value={workoutTonnage}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWorkoutTonnage(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-crimson focus:outline-none"
                placeholder="14200"
              />
            </div>
            <div>
              <label className="text-o1-label text-neutral-400 font-bold block mb-1">
                Total Sets
              </label>
              <input
                type="number"
                value={workoutSets}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWorkoutSets(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-crimson focus:outline-none"
                placeholder="16"
              />
            </div>
            <div>
              <label className="text-o1-label text-neutral-400 font-bold block mb-1">
                Duration (MIN)
              </label>
              <input
                type="number"
                value={workoutDuration}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setWorkoutDuration(sanitizeNumericInput(e.target.value))}
                className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-crimson focus:outline-none"
                placeholder="55"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] space-y-2">
            <span className="text-o1-label text-neutral-400 font-bold tracking-wider block">
              Primary Exercise Anchor
            </span>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="w-full bg-o1-card border border-white/[0.07] rounded-xl px-2.5 py-1.5 text-white font-medium focus:border-o1-crimson focus:outline-none text-xs"
              placeholder="e.g. Barbell Bench Press"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-o1-label text-neutral-500 block">Weight (kg)</label>
                <input
                  type="number"
                  value={exerciseWeight}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setExerciseWeight(sanitizeNumericInput(e.target.value))}
                  className="w-full bg-o1-card border border-white/[0.07] rounded-xl px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-o1-label text-neutral-500 block">Reps</label>
                <input
                  type="number"
                  value={exerciseReps}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setExerciseReps(sanitizeNumericInput(e.target.value))}
                  className="w-full bg-o1-card border border-white/[0.07] rounded-xl px-2 py-1 text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
