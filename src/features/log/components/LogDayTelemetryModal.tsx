import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Dumbbell,
  Activity,
  Apple,
  Moon,
  Sparkles,
  Flame,
  Clock,
  Heart,
} from 'lucide-react';
import {
  TelemetryCategory,
  DayMeta,
  useTelemetryHistoryStore,
  getDefaultCategoryRecord,
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

interface LogDayTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: TelemetryCategory;
  dayMeta: DayMeta | null;
  onSaved?: (msg: string) => void;
}

export const LogDayTelemetryModal: React.FC<LogDayTelemetryModalProps> = ({
  isOpen,
  onClose,
  category,
  dayMeta,
  onSaved,
}) => {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  // Local form state
  // Workout
  const [workoutRoutine, setWorkoutRoutine] = useState('Resistance Training');
  const [workoutTonnage, setWorkoutTonnage] = useState('');
  const [workoutSets, setWorkoutSets] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');

  // Cardio
  const [cardioType, setCardioType] = useState('Incline Treadmill');
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
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sleepRecovery, setSleepRecovery] = useState('88');
  const [sleepDeep, setSleepDeep] = useState('90');
  const [sleepRem, setSleepRem] = useState('100');
  const [sleepHeartRate, setSleepHeartRate] = useState('54');

  // Meditation
  const [meditationMinutes, setMeditationMinutes] = useState('15');
  const [meditationCoherence, setMeditationCoherence] = useState('Alpha Wave');
  const [meditationProtocol, setMeditationProtocol] = useState('Tactical Box Breathing 4-4-4-4');

  // Hydrate local state when modal opens or day/category changes
  useEffect(() => {
    if (!isOpen || !dayMeta) return;

    const dayRecord = historyByDate[dayMeta.dateKey]?.[category];

    if (category === 'workout') {
      const rec = dayRecord as WorkoutDayRecord | undefined;
      if (rec?.hasData) {
        setWorkoutRoutine(rec.routineName || 'Resistance Training');
        setWorkoutTonnage(String(rec.tonnageKg || ''));
        setWorkoutSets(String(rec.completedSets || ''));
        setWorkoutDuration(String(rec.durationMinutes || '45'));
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
          setWorkoutDuration('45');
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
      } else {
        setNutritionCalories('');
        setNutritionProtein('');
        setNutritionCarbs('');
        setNutritionFats('');
        setMealName('');
        setNutritionCalorieTarget(fuelCalTarget > 0 ? String(fuelCalTarget) : '');
      }
    } else if (category === 'sleep') {
      const rec = dayRecord as SleepDayRecord | undefined;
      if (rec?.hasData) {
        setSleepHours(String(rec.durationHours || 7.5));
        setSleepRecovery(String(rec.recoveryPercent || 88));
        setSleepDeep(String(rec.deepSleepMinutes || 90));
        setSleepRem(String(rec.remSleepMinutes || 100));
        setSleepHeartRate(String(rec.restingHeartRate || 54));
      } else {
        setSleepHours('7.5');
        setSleepRecovery('88');
        setSleepDeep('90');
        setSleepRem('100');
        setSleepHeartRate('54');
      }
    } else if (category === 'meditation') {
      const rec = dayRecord as MeditationDayRecord | undefined;
      if (rec?.hasData) {
        setMeditationMinutes(String(rec.minutes || 15));
        setMeditationCoherence(rec.coherence || 'Alpha Wave');
        setMeditationProtocol(rec.protocol || 'Tactical Box Breathing 4-4-4-4');
      } else {
        setMeditationMinutes('15');
        setMeditationCoherence('Alpha Wave');
        setMeditationProtocol('Tactical Box Breathing 4-4-4-4');
      }
    }
  }, [isOpen, dayMeta, category, historyByDate]);

  if (!isOpen || !dayMeta) return null;

  const handleSave = () => {
    tactileEngine.playPRCelebration();

    if (category === 'workout') {
      const tonnageNum = parseFloat(workoutTonnage) || 0;
      const setsNum = parseInt(workoutSets, 10) || 0;
      const durNum = parseInt(workoutDuration, 10) || 45;
      const exWeightNum = parseFloat(exerciseWeight) || 0;
      const exRepsNum = parseInt(exerciseReps, 10) || 0;
      const rName = workoutRoutine || 'Resistance Training';

      updateDayRecord(dayMeta.dateKey, 'workout', {
        hasData: true,
        tonnageKg: tonnageNum,
        completedSets: setsNum,
        durationMinutes: durNum,
        routineName: rName,
        intensityRpe: 8.5,
        exercises: [
          {
            name: exerciseName || 'Compound Movement',
            sets: setsNum > 0 ? setsNum : 4,
            reps: exRepsNum > 0 ? exRepsNum : 8,
            weightKg: exWeightNum,
            completed: true,
          },
        ],
      });

      // If logging for today, immediately sync with LogStore feed and stats
      if (dayMeta.isToday) {
        try {
          useLogStore.getState().addRecentSession({
            id: `session-${Date.now()}`,
            title: rName,
            timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${durNum}m`,
            tonnageKg: tonnageNum,
            totalSets: setsNum,
            strain: Math.min(18.5, +(8.5 + (tonnageNum / 1500)).toFixed(1)),
            exercises: exerciseName
              ? [{ name: exerciseName, sets: setsNum, reps: `${exRepsNum} reps`, load: `${exWeightNum} KG` }]
              : [],
          });

          const prevStats = useLogStore.getState().microcycleStats;
          useLogStore.getState().updateMicrocycleStats({
            totalVolumeKg: (prevStats.totalVolumeKg || 0) + tonnageNum,
            streakDays: Math.max(1, (prevStats.streakDays || 0) + 1),
            strikeRate: `${Math.min(7, parseInt(prevStats.strikeRate?.split('/')[0] || '0', 10) + 1)} / 7`,
          });
        } catch {}
      }

      onSaved?.(`Workout logged for ${dayMeta.dayLabel} (${tonnageNum.toLocaleString()} kg)`);
    } else if (category === 'cardio') {
      const distNum = parseFloat(cardioDistance) || 0;
      const durNum = parseInt(cardioDuration, 10) || 0;
      const burnNum = parseInt(cardioBurn, 10) || 0;
      const hrNum = parseInt(cardioHeartRate, 10) || 135;

      updateDayRecord(dayMeta.dateKey, 'cardio', {
        hasData: true,
        distanceKm: distNum,
        durationMinutes: durNum,
        burnedKcal: burnNum,
        avgHeartRateBpm: hrNum,
        zone2Minutes: Math.round(durNum * 0.75),
        activityType: cardioType,
      });

      if (dayMeta.isToday) {
        try {
          useLogStore.getState().updateSubModule('cardio', {
            burnedKcal: burnNum,
            durationMinutes: durNum,
            avgHeartRateBpm: hrNum,
            distanceKm: distNum,
          });
          if (burnNum > 0) {
            useFuelStore.getState().logBurned(burnNum);
          }
        } catch {}
      }

      persistCardioLog({
        activityType: cardioType,
        distanceKm: distNum,
        durationMinutes: durNum,
        burnedKcal: burnNum,
        avgHeartRateBpm: hrNum,
        dateKey: dayMeta.dateKey,
      });

      onSaved?.(`Cardio logged for ${dayMeta.dayLabel} (${distNum} km · ${burnNum} kcal)`);
    } else if (category === 'nutrition') {
      const calNum = Math.round(parseFloat(nutritionCalories) || 0);
      const proNum = Math.round((parseFloat(nutritionProtein) || 0) * 10) / 10;
      const carbNum = Math.round((parseFloat(nutritionCarbs) || 0) * 10) / 10;
      const fatNum = Math.round((parseFloat(nutritionFats) || 0) * 10) / 10;
      const fuelState = useFuelStore.getState();
      const enteredTarget = Math.round(parseFloat(nutritionCalorieTarget) || 0);
      const targetCalNum = enteredTarget > 0 ? enteredTarget : (fuelState.calorieTarget || 0);

      // If client adjusted their target in this modal, persist it to the fuel store too
      if (enteredTarget > 0 && enteredTarget !== fuelState.calorieTarget) {
        fuelState.setCalorieTarget(enteredTarget);
      }

      updateDayRecord(dayMeta.dateKey, 'nutrition', {
        hasData: true,
        calories: calNum,
        calorieTarget: targetCalNum,
        proteinG: proNum,
        proteinTargetG: fuelState.targetProteinG || 0,
        carbsG: carbNum,
        carbsTargetG: fuelState.targetCarbsG || 0,
        fatsG: fatNum,
        fatsTargetG: fuelState.targetFatsG || 0,
        meals: [
          {
            name: mealName || 'Daily Intake Log',
            category: 'Dinner',
            calories: calNum,
            proteinG: proNum,
            carbsG: carbNum,
            fatsG: fatNum,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          },
        ],
      });

      if (dayMeta.isToday && calNum > 0) {
        try {
          useFuelStore.getState().addMealItem('dinner', {
            id: `manual-meal-${Date.now()}`,
            name: mealName || 'Daily Intake Log',
            calories: calNum,
            protein: proNum,
            carbs: carbNum,
            fats: fatNum,
          });
        } catch {}
      }

      onSaved?.(`Nutrition logged for ${dayMeta.dayLabel} (${calNum} kcal${targetCalNum > 0 ? ` · Target: ${targetCalNum} kcal` : ''})`);
    } else if (category === 'sleep') {
      const hoursNum = parseFloat(sleepHours) || 8;
      const recNum = parseInt(sleepRecovery, 10) || 90;
      const deepNum = parseInt(sleepDeep, 10) || 90;
      const remNum = parseInt(sleepRem, 10) || 105;
      const rhrNum = parseInt(sleepHeartRate, 10) || 52;

      updateDayRecord(dayMeta.dateKey, 'sleep', {
        hasData: true,
        durationHours: hoursNum,
        durationMinutes: Math.round(hoursNum * 60),
        recoveryPercent: recNum,
        deepSleepMinutes: deepNum,
        remSleepMinutes: remNum,
        sleepEfficiencyPercent: 94,
        restingHeartRate: rhrNum,
        bedtime: '23:15',
        wakeTime: '07:15',
      });
      onSaved?.(`Sleep logged for ${dayMeta.dayLabel} (${hoursNum}h · ${recNum}% recovery)`);
    } else if (category === 'meditation') {
      const minNum = parseInt(meditationMinutes, 10) || 15;

      updateDayRecord(dayMeta.dateKey, 'meditation', {
        hasData: true,
        minutes: minNum,
        coherence: meditationCoherence,
        protocol: meditationProtocol,
        sessions: 1,
        hrvScore: 88,
      });
      onSaved?.(`Meditation logged for ${dayMeta.dayLabel} (${minNum} min · ${meditationCoherence})`);
    }

    onClose();
  };

  const getCategoryTheme = () => {
    switch (category) {
      case 'workout':
        return {
          title: 'LOG WORKOUT RECORD',
          color: 'text-[#C4121A]',
          bg: 'bg-[#C4121A]',
          icon: <Dumbbell className="w-5 h-5 text-[#C4121A]" />,
        };
      case 'cardio':
        return {
          title: 'LOG CARDIO TELEMETRY',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500',
          icon: <Activity className="w-5 h-5 text-cyan-400" />,
        };
      case 'nutrition':
        return {
          title: 'LOG MACRO FUEL RECORD',
          color: 'text-amber-400',
          bg: 'bg-amber-500',
          icon: <Apple className="w-5 h-5 text-amber-400" />,
        };
      case 'sleep':
        return {
          title: 'LOG CIRCADIAN SLEEP',
          color: 'text-purple-400',
          bg: 'bg-purple-500',
          icon: <Moon className="w-5 h-5 text-purple-400" />,
        };
      case 'meditation':
        return {
          title: 'LOG MINDFUL COHERENCE',
          color: 'text-green-500',
          bg: 'bg-green-600',
          icon: <Sparkles className="w-5 h-5 text-green-500" />,
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
              {theme.icon}
            </div>
            <div>
              <h3 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                {theme.title}
              </h3>
              <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                DATE: <span className="text-neutral-900 dark:text-white font-bold">{dayMeta.dayLabel}</span> · {dayMeta.dateFormatted}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          {/* WORKOUT FORM */}
          {category === 'workout' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
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
                          ? 'bg-[#C4121A] text-white'
                          : 'bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {r.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Volume (KG)
                  </label>
                  <input
                    type="number"
                    value={workoutTonnage}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setWorkoutTonnage(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-[#C4121A] focus:outline-none"
                    placeholder="14200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Total Sets
                  </label>
                  <input
                    type="number"
                    value={workoutSets}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setWorkoutSets(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-[#C4121A] focus:outline-none"
                    placeholder="16"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Duration (MIN)
                  </label>
                  <input
                    type="number"
                    value={workoutDuration}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setWorkoutDuration(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-[#C4121A] focus:outline-none"
                    placeholder="55"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 space-y-2">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider block">
                  Primary Exercise Anchor
                </span>
                <input
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 text-neutral-900 dark:text-white font-medium focus:border-[#C4121A] focus:outline-none text-xs"
                  placeholder="e.g. Barbell Bench Press"
                />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase block">Weight (kg)</label>
                    <input
                      type="number"
                      value={exerciseWeight}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setExerciseWeight(sanitizeNumericInput(e.target.value))}
                      className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1 text-neutral-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-neutral-500 uppercase block">Reps</label>
                    <input
                      type="number"
                      value={exerciseReps}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setExerciseReps(sanitizeNumericInput(e.target.value))}
                      className="w-full bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-lg px-2 py-1 text-neutral-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARDIO FORM */}
          {category === 'cardio' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
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
                          ? 'bg-cyan-500 text-black'
                          : 'bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {m.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Distance (KM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardioDistance}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioDistance(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-cyan-500 focus:outline-none"
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Duration (MIN)
                  </label>
                  <input
                    type="number"
                    value={cardioDuration}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioDuration(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-cyan-500 focus:outline-none"
                    placeholder="35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Burned Energy (KCAL)
                  </label>
                  <input
                    type="number"
                    value={cardioBurn}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioBurn(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-amber-500 dark:text-amber-400 font-bold focus:border-cyan-500 focus:outline-none"
                    placeholder="380"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Avg Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={cardioHeartRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCardioHeartRate(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-cyan-500 focus:outline-none"
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
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider block">
                    Daily Calorie Target (KCAL)
                  </label>
                  <span className="text-[9px] text-neutral-500 font-mono">Client Goal</span>
                </div>
                <input
                  type="number"
                  value={nutritionCalorieTarget}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setNutritionCalorieTarget(sanitizeNumericInput(e.target.value))}
                  className="w-full bg-white dark:bg-[#121214] border border-amber-300/80 dark:border-amber-800/80 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono font-bold focus:border-[#C4121A] focus:outline-none text-sm placeholder:text-neutral-400"
                  placeholder="Set custom daily goal (e.g. 2200, 2500)..."
                />
                <p className="text-[9px] text-neutral-500 dark:text-neutral-400 font-sans">
                  Adjustable by client at any time. Saved across all nutrition and telemetry views.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Meal / Logged (KCAL)
                  </label>
                  <input
                    type="number"
                    value={nutritionCalories}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionCalories(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-amber-500 dark:text-amber-400 font-bold focus:border-amber-500 focus:outline-none text-sm"
                    placeholder="e.g. 750"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Protein (G)
                  </label>
                  <input
                    type="number"
                    value={nutritionProtein}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionProtein(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-cyan-600 dark:text-cyan-400 font-bold focus:border-amber-500 focus:outline-none text-sm"
                    placeholder="e.g. 45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Carbohydrates (G)
                  </label>
                  <input
                    type="number"
                    value={nutritionCarbs}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionCarbs(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 80"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Lipids &amp; Fats (G)
                  </label>
                  <input
                    type="number"
                    value={nutritionFats}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setNutritionFats(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                  Itemized Meal Summary
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:border-amber-500 focus:outline-none text-xs font-mono"
                  placeholder="e.g. Grilled Chicken, Jasmine Rice & Avocado"
                />
              </div>
            </div>
          )}

          {/* SLEEP FORM */}
          {category === 'sleep' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Sleep Duration (HOURS)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={sleepHours}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepHours(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-purple-600 dark:text-purple-400 font-bold focus:border-purple-500 focus:outline-none text-sm"
                    placeholder="7.8"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Recovery Score (%)
                  </label>
                  <input
                    type="number"
                    value={sleepRecovery}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepRecovery(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-900 dark:text-white font-bold focus:border-purple-500 focus:outline-none text-sm"
                    placeholder="92"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Deep (MIN)
                  </label>
                  <input
                    type="number"
                    value={sleepDeep}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepDeep(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-2 text-neutral-900 dark:text-white font-bold text-xs"
                    placeholder="95"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    REM (MIN)
                  </label>
                  <input
                    type="number"
                    value={sleepRem}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepRem(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-2 text-neutral-900 dark:text-white font-bold text-xs"
                    placeholder="110"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    RHR (BPM)
                  </label>
                  <input
                    type="number"
                    value={sleepHeartRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setSleepHeartRate(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-2 text-neutral-900 dark:text-white font-bold text-xs"
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
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Mindful Time (MIN)
                  </label>
                  <input
                    type="number"
                    value={meditationMinutes}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setMeditationMinutes(sanitizeNumericInput(e.target.value))}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-2 text-green-700 dark:text-green-400 font-bold focus:border-green-600 focus:outline-none text-sm"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
                    Brainwave Coherence
                  </label>
                  <select
                    value={meditationCoherence}
                    onChange={(e) => setMeditationCoherence(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-2 text-neutral-900 dark:text-white font-bold focus:border-green-600 focus:outline-none text-xs"
                  >
                    <option value="Alpha Wave">Alpha Wave (Coherence)</option>
                    <option value="Theta Wave">Theta Wave (Deep Calm)</option>
                    <option value="Gamma Wave">Gamma Wave (Peak Focus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold block mb-1">
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
                          ? 'bg-green-600 text-white'
                          : 'bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
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
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5 shrink-0 bg-neutral-50 dark:bg-[#101012]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-lg ${
              category === 'workout'
                ? 'bg-[#C4121A] hover:bg-[#a50f16] shadow-red-900/30'
                : category === 'cardio'
                ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/30'
                : category === 'nutrition'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                : category === 'sleep'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                : 'bg-green-600 hover:bg-green-500 shadow-green-900/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Commit Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
