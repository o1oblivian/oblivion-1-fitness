import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Dumbbell,
  Activity,
  Apple,
  Moon,
  Sparkles,
} from 'lucide-react';
import {
  TelemetryCategory,
  DayMeta,
  useTelemetryHistoryStore,
  WorkoutDayRecord,
  CardioDayRecord,
  NutritionDayRecord,
  SleepDayRecord,
  MeditationDayRecord,
} from '../store/useTelemetryHistoryStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { useLogStore } from '../../../stores/useLogStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { sanitizeNumericInput } from '../../../utils/numberInputUtils';
import { persistCardioLog } from '../services/cardioLogService';
import { persistDayLog, releaseForgotten } from '../services/dayLogService';
import { exerciseFromSets, knownSets, setsFromExercise } from '../liftLedger';
import { FuelMeals } from '../../fuel/store/useFuelStore';
import { syncSessionToSupabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';

interface LogDayTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: TelemetryCategory;
  dayMeta: DayMeta | null;
  onSaved?: (msg: string) => void;
  mode?: 'create' | 'edit';
}

export const LogDayTelemetryModal: React.FC<LogDayTelemetryModalProps> = ({
  isOpen,
  onClose,
  category,
  dayMeta,
  onSaved,
  mode = 'create',
}) => {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  // Local form state
  // Workout
  const [workoutRoutine, setWorkoutRoutine] = useState('');
  const [workoutTonnage, setWorkoutTonnage] = useState('');
  const [workoutSets, setWorkoutSets] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');

  // Cardio
  const [cardioType, setCardioType] = useState('');
  const [cardioDistance, setCardioDistance] = useState('');
  const [cardioDuration, setCardioDuration] = useState('');
  const [cardioBurn, setCardioBurn] = useState('');
  const [cardioHeartRate, setCardioHeartRate] = useState('');

  // Nutrition
  const [nutritionCalories, setNutritionCalories] = useState('');
  const [nutritionProtein, setNutritionProtein] = useState('');
  const [nutritionCarbs, setNutritionCarbs] = useState('');
  const [nutritionFats, setNutritionFats] = useState('');
  const [nutritionCalorieTarget, setNutritionCalorieTarget] = useState('');
  const [mealName, setMealName] = useState('');

  // Sleep
  const [sleepHours, setSleepHours] = useState('');
  const [sleepRecovery, setSleepRecovery] = useState('');
  const [sleepDeep, setSleepDeep] = useState('');
  const [sleepRem, setSleepRem] = useState('');
  const [sleepHeartRate, setSleepHeartRate] = useState('');

  // Meditation
  const [meditationMinutes, setMeditationMinutes] = useState('');
  const [meditationCoherence, setMeditationCoherence] = useState('');
  const [meditationProtocol, setMeditationProtocol] = useState('');
  const [liftDrafts, setLiftDrafts] = useState<Array<{ name: string; sets: Array<{ reps: string; weight: string }> }>>([]);
  const [mealDrafts, setMealDrafts] = useState<Array<{
    name: string;
    slot: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drinks' | 'supplements';
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
  }>>([]);

  // Hydrate local state when modal opens or day/category changes
  useEffect(() => {
    if (!isOpen || !dayMeta) return;

    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];
    setLiftDrafts([]);
    setMealDrafts([]);

    if (category === 'workout') {
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
            setExerciseWeight(firstSet?.weightKg ? String(firstSet.weightKg) : firstSet?.weight ? String(firstSet.weight) : '');
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
        ? useWorkoutStore.getState().exercises
          .filter((exercise) => !(exercise.name || '').toLowerCase().startsWith('cardio:'))
          .map((exercise) => exerciseFromSets(
            exercise.name || exercise.exerciseName || 'Exercise',
            setsFromExercise(exercise),
          ))
          .filter((exercise) => (exercise.setLog?.length || 0) > 0)
        : [];
      const source = liveLifts.length > 0 ? liveLifts : (rec?.exercises || []);
      setLiftDrafts(source.map((exercise) => {
        const logged = knownSets(exercise);
        const rows = logged.length > 0 ? logged : [{ reps: exercise.reps || 0, weightKg: exercise.weightKg || 0 }];
        return {
          name: exercise.name,
          sets: rows
            .filter((set) => set.reps > 0 || set.weightKg > 0)
            .map((set) => ({
              reps: set.reps > 0 ? String(set.reps) : '',
              weight: set.weightKg > 0 ? String(set.weightKg) : '',
            })),
        };
      }).filter((lift) => lift.name && lift.sets.length > 0));
    } else if (category === 'cardio') {
      const rec = dayRecord as CardioDayRecord | undefined;
      if (rec?.hasData) {
        setCardioType(rec.activityType || 'Incline Treadmill');
        setCardioDistance(rec.distanceKm > 0 ? String(rec.distanceKm) : '');
        setCardioDuration(rec.durationMinutes > 0 ? String(rec.durationMinutes) : '');
        setCardioBurn(rec.burnedKcal > 0 ? String(rec.burnedKcal) : '');
        setCardioHeartRate(rec.avgHeartRateBpm > 0 ? String(rec.avgHeartRateBpm) : '');
      } else {
        setCardioType('Incline Treadmill');
        setCardioDistance('');
        setCardioDuration('');
        setCardioBurn('');
        setCardioHeartRate('');
      }
    } else if (category === 'nutrition') {
      const rec = dayRecord as NutritionDayRecord | undefined;
      const fuelCalTarget = useFuelStore.getState().calorieTarget || 0;
      if (rec?.hasData) {
        const fmt = (n: number) => {
          const r = Math.round(n * 10) / 10;
          return r % 1 === 0 ? r.toFixed(0) : r.toFixed(1);
        };
        setNutritionCalories(String(Math.round(rec.calories || 0)));
        setNutritionProtein(fmt(rec.proteinG || 0));
        setNutritionCarbs(fmt(rec.carbsG || 0));
        setNutritionFats(fmt(rec.fatsG || 0));
        setNutritionCalorieTarget(rec.calorieTarget > 0 ? String(rec.calorieTarget) : (fuelCalTarget > 0 ? String(fuelCalTarget) : ''));
        if (rec.meals?.[0]) {
          setMealName(rec.meals[0].name);
        }
        const figure = (value: number) => value > 0 ? String(Math.round(value * 10) / 10) : '';
        if (dayMeta.isToday) {
          const fuelMeals = useFuelStore.getState().meals;
          const slots = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'] as const;
          const drafts = slots.flatMap((slot) => (fuelMeals[slot] || []).map((meal) => ({
            name: meal.name,
            slot,
            calories: meal.calories > 0 ? String(Math.round(meal.calories)) : '',
            protein: figure(meal.protein || 0),
            carbs: figure(meal.carbs || 0),
            fats: figure(meal.fats || 0),
          })));
          if (drafts.length > 0) setMealDrafts(drafts);
        } else if (rec.meals?.length) {
          setMealDrafts(rec.meals.map((meal) => ({
            name: meal.name,
            slot: meal.slot || 'dinner',
            calories: meal.calories > 0 ? String(Math.round(meal.calories)) : '',
            protein: figure(meal.proteinG || 0),
            carbs: figure(meal.carbsG || 0),
            fats: figure(meal.fatsG || 0),
          })));
        }
      } else {
        setNutritionCalories('');
        setNutritionProtein('');
        setNutritionCarbs('');
        setNutritionFats('');
        setMealName('');
        setNutritionCalorieTarget(fuelCalTarget > 0 ? String(fuelCalTarget) : '');
        if (dayMeta.isToday) {
          const fuelMeals = useFuelStore.getState().meals;
          const slots = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'] as const;
          const drafts = slots.flatMap((slot) => (fuelMeals[slot] || []).map((meal) => ({
            name: meal.name,
            slot,
            calories: meal.calories > 0 ? String(Math.round(meal.calories)) : '',
            protein: meal.protein > 0 ? String(meal.protein) : '',
            carbs: meal.carbs > 0 ? String(meal.carbs) : '',
            fats: meal.fats > 0 ? String(meal.fats) : '',
          })));
          if (drafts.length > 0) setMealDrafts(drafts);
        }
      }
    } else if (category === 'sleep') {
      const rec = dayRecord as SleepDayRecord | undefined;
      if (rec?.hasData) {
        setSleepHours(rec.durationHours > 0 ? String(rec.durationHours) : '');
        setSleepRecovery(rec.recoveryPercent > 0 ? String(rec.recoveryPercent) : '');
        setSleepDeep(rec.deepSleepMinutes > 0 ? String(rec.deepSleepMinutes) : '');
        setSleepRem(rec.remSleepMinutes > 0 ? String(rec.remSleepMinutes) : '');
        setSleepHeartRate(rec.restingHeartRate > 0 ? String(rec.restingHeartRate) : '');
      } else {
        setSleepHours('');
        setSleepRecovery('');
        setSleepDeep('');
        setSleepRem('');
        setSleepHeartRate('');
      }
    } else if (category === 'meditation') {
      const rec = dayRecord as MeditationDayRecord | undefined;
      if (rec?.hasData) {
        setMeditationMinutes(rec.minutes > 0 ? String(rec.minutes) : '');
        setMeditationCoherence(rec.coherence || '');
        setMeditationProtocol(rec.protocol || '');
      } else {
        setMeditationMinutes('');
        setMeditationCoherence('');
        setMeditationProtocol('');
      }
    }
  }, [isOpen, dayMeta, category, historyByDate]);

  if (!isOpen || !dayMeta) return null;

  const readNum = (raw: string): number | null => {
    if (!raw.trim()) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const handleSave = () => {
    if (category === 'workout' && liftDrafts.length > 0) {
      const exercises = liftDrafts.map((lift) => exerciseFromSets(
        lift.name,
        lift.sets
          .map((set) => ({ reps: Number(set.reps) || 0, weightKg: Number(set.weight) || 0 }))
          .filter((set) => set.reps > 0 || set.weightKg > 0),
      )).filter((lift) => lift.sets > 0);
      if (exercises.length === 0) {
        onSaved?.('Add a number first');
        return;
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
            const logged = Boolean(set.completed) || Number(set.reps) > 0 || Number(set.weightKg || set.weight) > 0;
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
        tonnageKg: dayMeta.isToday ? (useWorkoutStore.getState().sessionTonnageKg || loadVolume) : loadVolume,
        completedSets: exercises.reduce((sum, lift) => sum + lift.sets, 0),
        durationMinutes: durNum ?? 0,
        routineName: workoutRoutine.trim(),
        intensityRpe: 0,
        exercises,
      };
      updateDayRecord(dayMeta.dateKey, 'workout', record);
      void persistDayLog(dayMeta.dateKey, 'workout', record);
      onSaved?.('Workout updated');
      onClose();
      return;
    }
    if (category === 'workout') {
      const tonnageNum = readNum(workoutTonnage);
      const setsNum = readNum(workoutSets);
      const durNum = readNum(workoutDuration);
      const exWeightNum = readNum(exerciseWeight);
      const exRepsNum = readNum(exerciseReps);
      if (tonnageNum == null && setsNum == null && durNum == null && exWeightNum == null && exRepsNum == null && !exerciseName.trim() && !workoutRoutine.trim()) {
        onSaved?.('Add a number first');
        return;
      }
      const rName = workoutRoutine.trim();
      const exercises = (exerciseName.trim() || exWeightNum != null || exRepsNum != null)
        ? [{
            name: exerciseName.trim() || 'Logged set',
            sets: setsNum ?? 0,
            reps: exRepsNum ?? 0,
            weightKg: exWeightNum ?? 0,
            completed: true,
          }]
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
      void persistDayLog(dayMeta.dateKey, 'workout', record);
      if (mode === 'create' && dayMeta.isToday) {
        useLogStore.getState().addRecentSession({
          id: `session-${Date.now()}`,
          title: rName || 'Workout',
          timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: durNum != null ? `${durNum}m` : '--',
          tonnageKg: tonnageNum ?? 0,
          totalSets: setsNum ?? 0,
          strain: 0,
          exercises: exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps > 0 ? `${ex.reps} reps` : '--',
            load: ex.weightKg > 0 ? `${ex.weightKg} kg` : '--',
          })),
        });
      }
      if (mode === 'create') {
        void getAuthenticatedUserId().then((uid) => {
          if (!uid) return;
          return syncSessionToSupabase({
            id: `session-${Date.now()}`,
            user_id: uid,
            title: rName || 'Workout',
            duration: durNum != null ? `${durNum}m` : '',
            duration_seconds: durNum != null ? Math.round(durNum * 60) : 0,
            tonnage_kg: tonnageNum ?? 0,
            total_sets: setsNum ?? 0,
            strain: 0,
            exercises,
          });
        });
      }
      onSaved?.(mode === 'edit' ? 'Workout updated' : 'Workout logged');
    } else if (category === 'cardio') {
      const distNum = readNum(cardioDistance);
      const durNum = readNum(cardioDuration);
      const burnNum = readNum(cardioBurn);
      const hrNum = readNum(cardioHeartRate);
      if (distNum == null && durNum == null && burnNum == null && hrNum == null) {
        onSaved?.('Add a number first');
        return;
      }
      const activity = cardioType.trim() || 'Cardio';
      const cardioRecord = {
        hasData: true,
        distanceKm: distNum ?? 0,
        durationMinutes: durNum ?? 0,
        burnedKcal: burnNum ?? 0,
        avgHeartRateBpm: hrNum ?? 0,
        zone2Minutes: 0,
        activityType: activity,
      };
      updateDayRecord(dayMeta.dateKey, 'cardio', cardioRecord);
      if (mode === 'edit') {
        void persistDayLog(dayMeta.dateKey, 'cardio', cardioRecord);
      } else {
        if (dayMeta.isToday && burnNum != null && burnNum > 0) {
          useFuelStore.getState().logBurned(burnNum);
        }
        void persistCardioLog({
          activityType: activity,
          distanceKm: distNum ?? 0,
          durationMinutes: durNum ?? 0,
          burnedKcal: burnNum ?? 0,
          avgHeartRateBpm: hrNum ?? undefined,
          dateKey: dayMeta.dateKey,
        });
      }
      onSaved?.(mode === 'edit' ? 'Cardio updated' : 'Cardio logged');
    } else if (category === 'nutrition' && mode === 'edit' && mealDrafts.length > 0) {
      const meals = mealDrafts.map((draft) => ({
        name: draft.name.trim() || 'Logged meal',
        category: draft.slot === 'breakfast' ? 'Breakfast' as const : draft.slot === 'dinner' ? 'Dinner' as const : draft.slot === 'snack' ? 'Snacks' as const : 'Lunch' as const,
        slot: draft.slot,
        calories: Math.round(Number(draft.calories) || 0),
        proteinG: Number(draft.protein) || 0,
        carbsG: Number(draft.carbs) || 0,
        fatsG: Number(draft.fats) || 0,
      })).filter((meal) => meal.calories > 0 || meal.proteinG > 0 || meal.carbsG > 0 || meal.fatsG > 0);
      if (meals.length === 0) {
        onSaved?.('Add a number first');
        return;
      }
      releaseForgotten(dayMeta.dateKey, 'nutrition');
      if (dayMeta.isToday) {
        const fuel = useFuelStore.getState();
        (Object.keys(fuel.meals) as Array<keyof FuelMeals>).forEach((slot) => {
          [...fuel.meals[slot]].forEach((item) => useFuelStore.getState().removeMealItem(slot, item.id));
        });
        meals.forEach((meal, index) => {
          useFuelStore.getState().addMealItem(meal.slot || 'dinner', {
            id: `meal-edit-${Date.now()}-${index}`,
            name: meal.name,
            calories: meal.calories,
            protein: meal.proteinG,
            carbs: meal.carbsG,
            fats: meal.fatsG,
          });
        });
      } else {
        const sum = (pick: (meal: { calories: number; proteinG: number; carbsG: number; fatsG: number }) => number) => Math.round(meals.reduce((acc, meal) => acc + pick(meal), 0) * 10) / 10;
        const existing = historyByDate[dayMeta.dateKey]?.nutrition;
        const record = {
          hasData: true,
          calories: Math.round(sum((meal) => meal.calories)),
          calorieTarget: readNum(nutritionCalorieTarget) ?? existing?.calorieTarget ?? 0,
          proteinG: sum((meal) => meal.proteinG),
          proteinTargetG: existing?.proteinTargetG || 0,
          carbsG: sum((meal) => meal.carbsG),
          carbsTargetG: existing?.carbsTargetG || 0,
          fatsG: sum((meal) => meal.fatsG),
          fatsTargetG: existing?.fatsTargetG || 0,
          meals,
        };
        updateDayRecord(dayMeta.dateKey, 'nutrition', record);
        void persistDayLog(dayMeta.dateKey, 'nutrition', record);
      }
      onSaved?.('Food updated');
      onClose();
      return;
    } else if (category === 'nutrition') {
      const calNum = readNum(nutritionCalories);
      const proNum = readNum(nutritionProtein);
      const carbNum = readNum(nutritionCarbs);
      const fatNum = readNum(nutritionFats);
      const fuelState = useFuelStore.getState();
      const enteredTarget = readNum(nutritionCalorieTarget);
      if (enteredTarget != null && enteredTarget > 0 && enteredTarget !== fuelState.calorieTarget) {
        fuelState.setCalorieTarget(enteredTarget);
      }
      if (calNum == null && proNum == null && carbNum == null && fatNum == null && !mealName.trim()) {
        onSaved?.(enteredTarget != null ? 'Calorie target saved' : 'Add a number first');
        if (enteredTarget != null) onClose();
        return;
      }
      const meal = {
        name: mealName.trim() || 'Logged meal',
        category: 'Dinner' as const,
        calories: calNum ?? 0,
        proteinG: proNum ?? 0,
        carbsG: carbNum ?? 0,
        fatsG: fatNum ?? 0,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      if (dayMeta.isToday) {
        if (mode === 'edit') {
          const fuel = useFuelStore.getState();
          (Object.keys(fuel.meals) as Array<keyof typeof fuel.meals>).forEach((slot) => {
            [...fuel.meals[slot]].forEach((item) => useFuelStore.getState().removeMealItem(slot, item.id));
          });
        }
        useFuelStore.getState().addMealItem('dinner', {
          id: `manual-meal-${Date.now()}`,
          name: meal.name,
          calories: meal.calories,
          protein: meal.proteinG,
          carbs: meal.carbsG,
          fats: meal.fatsG,
        });
      } else {
        const existing = historyByDate[dayMeta.dateKey]?.nutrition;
        const meals = mode === 'edit' ? [meal] : [...(existing?.meals || []), meal];
        const sum = (pick: (item: { calories: number; proteinG: number; carbsG: number; fatsG: number }) => number) => Math.round(meals.reduce((acc, item) => acc + pick(item), 0) * 10) / 10;
        const record = {
          hasData: true,
          calories: Math.round(sum((m) => m.calories)),
          calorieTarget: enteredTarget ?? existing?.calorieTarget ?? fuelState.calorieTarget ?? 0,
          proteinG: sum((m) => m.proteinG),
          proteinTargetG: existing?.proteinTargetG || fuelState.targetProteinG || 0,
          carbsG: sum((m) => m.carbsG),
          carbsTargetG: existing?.carbsTargetG || fuelState.targetCarbsG || 0,
          fatsG: sum((m) => m.fatsG),
          fatsTargetG: existing?.fatsTargetG || fuelState.targetFatsG || 0,
          meals,
        };
        updateDayRecord(dayMeta.dateKey, 'nutrition', record);
        void persistDayLog(dayMeta.dateKey, 'nutrition', record);
      }
      onSaved?.(mode === 'edit' ? 'Food updated' : 'Food logged');
    } else if (category === 'sleep') {
      const hoursNum = readNum(sleepHours);
      const recNum = readNum(sleepRecovery);
      const deepNum = readNum(sleepDeep);
      const remNum = readNum(sleepRem);
      const rhrNum = readNum(sleepHeartRate);
      if (hoursNum == null && recNum == null && deepNum == null && remNum == null && rhrNum == null) {
        onSaved?.('Add a number first');
        return;
      }
      const record = {
        hasData: true,
        durationHours: hoursNum ?? 0,
        durationMinutes: hoursNum != null ? Math.round(hoursNum * 60) : 0,
        recoveryPercent: recNum ?? 0,
        deepSleepMinutes: deepNum ?? 0,
        remSleepMinutes: remNum ?? 0,
        sleepEfficiencyPercent: 0,
        restingHeartRate: rhrNum ?? 0,
        bedtime: '',
        wakeTime: '',
      };
      updateDayRecord(dayMeta.dateKey, 'sleep', record);
      void persistDayLog(dayMeta.dateKey, 'sleep', record);
      onSaved?.(mode === 'edit' ? 'Sleep updated' : 'Sleep logged');
    } else if (category === 'meditation') {
      const minNum = readNum(meditationMinutes);
      if (minNum == null) {
        onSaved?.('Add the minutes first');
        return;
      }
      const record = {
        hasData: true,
        minutes: minNum,
        coherence: meditationCoherence,
        protocol: meditationProtocol,
        sessions: 1,
        hrvScore: 0,
      };
      updateDayRecord(dayMeta.dateKey, 'meditation', record);
      void persistDayLog(dayMeta.dateKey, 'meditation', record);
      onSaved?.(mode === 'edit' ? 'Mindful session updated' : 'Mindful session logged');
    }

    tactileEngine.playPRCelebration();
    onClose();
  };

  const getCategoryTheme = () => {
    switch (category) {
      case 'workout':
        return {
          title: 'Log workout',
          color: 'text-o1-crimson',
          bg: 'bg-o1-crimson',
          icon: <Dumbbell className="w-5 h-5 text-o1-crimson" />,
        };
      case 'cardio':
        return {
          title: 'Log cardio',
          color: 'text-sky-400',
          bg: 'bg-sky-500',
          icon: <Activity className="w-5 h-5 text-sky-400" />,
        };
      case 'nutrition':
        return {
          title: 'Log food',
          color: 'text-amber-400',
          bg: 'bg-amber-500',
          icon: <Apple className="w-5 h-5 text-amber-400" />,
        };
      case 'sleep':
        return {
          title: 'Log sleep',
          color: 'text-sky-400',
          bg: 'bg-sky-500',
          icon: <Moon className="w-5 h-5 text-sky-400" />,
        };
      case 'meditation':
        return {
          title: 'Log mindful',
          color: 'text-emerald-500',
          bg: 'bg-emerald-600',
          icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim transition-opacity">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] shadow-xl overflow-hidden text-neutral-100 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.05] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-center">
              {theme.icon}
            </div>
            <div>
              <h3 className="font-tactical font-black text-xs tracking-wider text-white">
                {mode === 'edit' ? theme.title.replace('Log ', 'Edit ') : theme.title}
              </h3>
              <p className="text-[10px] font-mono text-neutral-400">
                Date: <span className="text-white font-bold">{dayMeta.dayLabel}</span> · {dayMeta.dateFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          {/* WORKOUT FORM */}
          {category === 'workout' && (
            <div className="space-y-3.5">
              {liftDrafts.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold block mb-1">Duration (MIN)</label>
                    <input
                      type="number"
                      value={workoutDuration}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setWorkoutDuration(sanitizeNumericInput(e.target.value))}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-o1-crimson focus:outline-none"
                      placeholder="55"
                    />
                  </div>
                  {liftDrafts.map((lift, liftIndex) => (
                    <div key={`${lift.name}-${liftIndex}`} className="space-y-1.5">
                      <div className="text-[11px] font-sans font-semibold text-white">{lift.name}</div>
                      <div className="grid grid-cols-[1.25rem_1fr_1fr] gap-2 text-[9px] text-neutral-500">
                        <span />
                        <span>Reps</span>
                        <span>kg</span>
                      </div>
                      {lift.sets.map((set, setIndex) => (
                        <div key={`${lift.name}-${setIndex}`} className="grid grid-cols-[1.25rem_1fr_1fr] gap-2 items-center">
                          <span className="text-[11px] text-neutral-500 tabular-nums">{setIndex + 1}</span>
                          <input
                            type="number"
                            value={set.reps}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = sanitizeNumericInput(e.target.value);
                              setLiftDrafts((current) => current.map((item, index) => index === liftIndex
                                ? { ...item, sets: item.sets.map((row, rowIndex) => rowIndex === setIndex ? { ...row, reps: value } : row) }
                                : item));
                            }}
                            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-white text-xs tabular-nums"
                          />
                          <input
                            type="number"
                            value={set.weight}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = sanitizeNumericInput(e.target.value);
                              setLiftDrafts((current) => current.map((item, index) => index === liftIndex
                                ? { ...item, sets: item.sets.map((row, rowIndex) => rowIndex === setIndex ? { ...row, weight: value } : row) }
                                : item));
                            }}
                            className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-white text-xs tabular-nums"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
              <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                  Routine Split
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Push Hypertrophy', 'Pull Overload', 'Legs & Core'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setWorkoutRoutine(r)}
                      className={`py-2 px-1 text-[10px] rounded-xl font-bold transition-all ${
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
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
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
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
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
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
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
                <span className="text-[10px] text-neutral-400 font-bold tracking-wider block">
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
                    <label className="text-[9px] text-neutral-500 block">Weight (kg)</label>
                    <input
                      type="number"
                      value={exerciseWeight}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setExerciseWeight(sanitizeNumericInput(e.target.value))}
                      className="w-full bg-o1-card border border-white/[0.07] rounded-xl px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 block">Reps</label>
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
          )}

          {/* CARDIO FORM */}
          {category === 'cardio' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                  Activity Modality
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Incline Treadmill', 'Rower HIIT', 'Stairmaster'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCardioType(m)}
                      className={`py-2 px-1 text-[10px] rounded-xl font-bold transition-all ${
                        cardioType === m
                          ? 'bg-sky-500 text-black'
                          : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Distance (KM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardioDistance}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioDistance(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Duration (MIN)
                  </label>
                  <input
                    type="number"
                    value={cardioDuration}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioDuration(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Burned Energy (KCAL)
                  </label>
                  <input
                    type="number"
                    value={cardioBurn}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioBurn(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-amber-400 font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="380"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Avg Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={cardioHeartRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioHeartRate(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none"
                    placeholder="142"
                  />
                </div>
              </div>
            </div>
          )}

          {/* NUTRITION FORM */}
          {category === 'nutrition' && (
            <div className="space-y-3.5">
              {/* Client Daily Calorie Target Adjustment */}
              <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-amber-400 font-bold tracking-wider block">
                    Daily Calorie Target (KCAL)
                  </label>
                  <span className="text-[9px] text-neutral-500 font-mono">Client Goal</span>
                </div>
                <input
                  type="number"
                  value={nutritionCalorieTarget}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setNutritionCalorieTarget(sanitizeNumericInput(e.target.value))}
                  className="w-full bg-o1-card border border-amber-800/80 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-o1-crimson focus:outline-none text-sm placeholder:text-neutral-400"
                  placeholder="Set custom daily goal (e.g. 2200, 2500)..."
                />
                <p className="text-[9px] text-neutral-400 font-sans">
                  Adjustable by client at any time. Saved across all nutrition and telemetry views.
                </p>
              </div>

              {mealDrafts.length > 0 ? (
                <div className="space-y-3">
                  {mealDrafts.map((meal, mealIndex) => (
                    <div key={`${meal.slot}-${meal.name}-${mealIndex}`} className="space-y-1.5">
                      <div className="text-[11px] font-sans font-semibold text-white">{meal.name}</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          ['kcal', 'calories'],
                          ['P', 'protein'],
                          ['C', 'carbs'],
                          ['F', 'fats'],
                        ] as const).map(([label, field]) => (
                          <label key={field} className="space-y-1">
                            <span className="text-[9px] text-neutral-500 block">{label}</span>
                            <input
                              type="number"
                              value={meal[field]}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const value = sanitizeNumericInput(e.target.value);
                                setMealDrafts((current) => current.map((item, index) => index === mealIndex ? { ...item, [field]: value } : item));
                              }}
                              className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-1.5 text-white text-xs tabular-nums"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Meal / Logged (KCAL)
                  </label>
                  <input
                    type="number"
                    value={nutritionCalories}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionCalories(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-amber-400 font-bold focus:border-amber-500 focus:outline-none text-sm"
                    placeholder="e.g. 750"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Protein (G)
                  </label>
                  <input
                    type="number"
                    value={nutritionProtein}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionProtein(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-sky-400 font-bold focus:border-amber-500 focus:outline-none text-sm"
                    placeholder="e.g. 45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Carbohydrates (G)
                  </label>
                  <input
                    type="number"
                    value={nutritionCarbs}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionCarbs(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 80"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Lipids &amp; Fats (G)
                  </label>
                  <input
                    type="number"
                    value={nutritionFats}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionFats(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                  Itemized Meal Summary
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                  placeholder="e.g. Grilled Chicken, Jasmine Rice & Avocado"
                />
              </div>
              </div>
              )}
            </div>
          )}

          {/* SLEEP FORM */}
          {category === 'sleep' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Sleep Duration (HOURS)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sleepHours}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepHours(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-sky-400 font-bold focus:border-sky-500 focus:outline-none text-sm"
                    placeholder="7.8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Recovery Score (%)
                  </label>
                  <input
                    type="number"
                    value={sleepRecovery}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepRecovery(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-white font-bold focus:border-sky-500 focus:outline-none text-sm"
                    placeholder="92"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Deep (MIN)
                  </label>
                  <input
                    type="number"
                    value={sleepDeep}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepDeep(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold text-xs"
                    placeholder="95"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Rem (Min)
                  </label>
                  <input
                    type="number"
                    value={sleepRem}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepRem(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold text-xs"
                    placeholder="110"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    RHR (BPM)
                  </label>
                  <input
                    type="number"
                    value={sleepHeartRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepHeartRate(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold text-xs"
                    placeholder="52"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MEDITATION FORM */}
          {category === 'meditation' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Mindful Time (MIN)
                  </label>
                  <input
                    type="number"
                    value={meditationMinutes}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setMeditationMinutes(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2.5 py-2 text-emerald-400 font-bold focus:border-emerald-600 focus:outline-none text-sm"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                    Brainwave Coherence
                  </label>
                  <select
                    value={meditationCoherence}
                    onChange={(e) => setMeditationCoherence(e.target.value)}
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-2 py-2 text-white font-bold focus:border-emerald-600 focus:outline-none text-xs"
                  >
                    <option value="">Optional</option>
                    <option value="Alpha Wave">Alpha Wave (Coherence)</option>
                    <option value="Theta Wave">Theta Wave (Deep Calm)</option>
                    <option value="Gamma Wave">Gamma Wave (Peak Focus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1">
                  Resonance Protocol
                </label>
                <div className="space-y-1.5">
                  {[
                    'Tactical Box Breathing 4-4-4-4',
                    'Zen Breath Waveform 5-5',
                    'Vagal Nerve Reset 4-7-8',
                  ].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMeditationProtocol(p)}
                      className={`w-full py-2 px-3 text-left rounded-xl text-xs font-bold transition-all ${
                        meditationProtocol === p
                          ? 'bg-emerald-600 text-white'
                          : 'bg-o1-well border border-white/[0.07] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.05] flex items-center gap-2.5 shrink-0 bg-o1-card">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-o1-well border border-white/[0.07] hover:bg-white/[0.06] text-neutral-300 font-bold text-xs tracking-wider transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-white text-neutral-950 font-semibold text-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
