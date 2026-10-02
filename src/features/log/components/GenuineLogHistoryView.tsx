import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Dumbbell,
  Activity,
  Apple,
  Moon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Camera,
  Brain,
  Check,
  CheckCircle2,
  History,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import { useLogStore } from '../../../stores/useLogStore';
import {
  TelemetryCategory,
  DayMeta,
  getPast5Days,
  getPastDays,
  useTelemetryHistoryStore,
} from '../store/useTelemetryHistoryStore';
import { Expandable5RowTelemetryHistory } from './Expandable5RowTelemetryHistory';
import { LogDayTelemetryModal } from './LogDayTelemetryModal';
import { CardioConsoleScanModal } from './CardioConsoleScanModal';
import { getCachedCardioLogs } from '../services/cardioLogService';
import { LogWeekStrip } from './LogWeekStrip';

interface GenuineLogHistoryViewProps {
  onNavigateToWorkout?: () => void;
  onNavigateToFuel?: () => void;
  showToast: (msg: string) => void;
}

// Helper to format numbers cleanly without floating point artifacts
const formatMacro = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Math.round(val * 10) / 10;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
};

export const GenuineLogHistoryView: React.FC<GenuineLogHistoryViewProps> = ({
  onNavigateToWorkout,
  onNavigateToFuel,
  showToast,
}) => {
  const workoutExercises = useWorkoutStore((s) => s.exercises);
  const sessionTonnageKg = useWorkoutStore((s) => s.sessionTonnageKg);
  const completedSetsCount = useWorkoutStore((s) => s.completedSetsCount);
  const activeRoutineTitle = useWorkoutStore((s) => s.activeRoutine);
  const fuelState = useFuelStore();
  const telemetry = useTelemetryStore();
  const cardioSub = useLogStore((s) => s.subModules.cardio);

  const past5Days = getPast5Days();
  const todayKey = past5Days[0].dateKey;
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const updateDayRecord = useTelemetryHistoryStore((s) => s.updateDayRecord);

  // Dynamic 7-day matrix for week (Mon - Sun) with navigation offset
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'matrix' | '30d_feed'>('matrix');

  const today = useMemo(() => new Date(), []);
  const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    return d;
  }, [today, mondayOffset, weekOffset]);

  const past30Days = useMemo(() => getPastDays(30), []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(today.toDateString());

  // Derive selected date key (YYYY-MM-DD)
  const selectedDateObj = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
  const selectedDateKey = useMemo(() => {
    const y = selectedDateObj.getFullYear();
    const m = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDateObj]);

  const isViewingToday = selectedDateKey === todayKey;

  // Selected day record from history
  const activeDayRecord = historyByDate[selectedDateKey];
  const rawWorkoutRecord = activeDayRecord?.workout;
  const rawCardioRecord = activeDayRecord?.cardio;
  const rawNutritionRecord = activeDayRecord?.nutrition;
  const selectedSleepRecord = activeDayRecord?.sleep;
  const selectedMeditationRecord = activeDayRecord?.meditation;

  // Compute active logged exercises for today
  const hasActiveLiftingSession = isViewingToday && (workoutExercises.length > 0 || sessionTonnageKg > 0);
  const totalVolumeMoved = isViewingToday ? sessionTonnageKg : 0;

  // Compute nutrition totals from meals
  const allMeals = useMemo(() => {
    return fuelState?.meals ? Object.values(fuelState.meals).flat() : [];
  }, [fuelState?.meals]);

  const currentCalories = useMemo(
    () => Math.round(allMeals.reduce((acc, m) => acc + (m.calories || 0), 0)),
    [allMeals]
  );
  const currentProtein = useMemo(
    () => Math.round(allMeals.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10,
    [allMeals]
  );
  const currentCarbs = useMemo(
    () => Math.round(allMeals.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10,
    [allMeals]
  );
  const currentFats = useMemo(
    () => Math.round(allMeals.reduce((acc, m) => acc + (m.fats || 0), 0) * 10) / 10,
    [allMeals]
  );

  const targetCalories = Number(fuelState?.calorieTarget) || 0;
  const targetProteinG = Number(fuelState?.targetProteinG) || 0;
  const targetCarbsG = Number(fuelState?.targetCarbsG) || 0;
  const targetFatsG = Number(fuelState?.targetFatsG) || 0;

  const remainingBudget = targetCalories > 0 ? Math.max(0, targetCalories - currentCalories) : 0;
  const targetPercentage = targetCalories > 0 ? Math.round((currentCalories / targetCalories) * 100) : 0;

  const stepCount = telemetry?.stepCount || 0;

  // Real-time effective records guaranteeing live and historical data seamless display
  const selectedWorkoutRecord = useMemo(() => {
    if (rawWorkoutRecord?.hasData) return rawWorkoutRecord;
    if (isViewingToday && (sessionTonnageKg > 0 || completedSetsCount > 0 || workoutExercises.length > 0)) {
      return {
        hasData: true,
        tonnageKg: sessionTonnageKg,
        completedSets: completedSetsCount,
        durationMinutes: 45,
        routineName: activeRoutineTitle || 'Resistance Session',
        intensityRpe: 8.5,
        exercises: workoutExercises.map((e) => ({
          name: e.name || e.exerciseName || 'Exercise',
          sets: e.sets?.length || 3,
          reps: e.sets?.[0]?.reps || 8,
          weightKg: e.sets?.[0]?.weightKg || 0,
          completed: (e.sets || []).some((s: any) => s.completed),
        })),
      };
    }
    return rawWorkoutRecord;
  }, [rawWorkoutRecord, isViewingToday, sessionTonnageKg, completedSetsCount, workoutExercises, activeRoutineTitle]);

  const selectedCardioRecord = useMemo(() => {
    if (rawCardioRecord?.hasData) return rawCardioRecord;

    // Check cached cardio logs for the selected date
    const cachedCardio = getCachedCardioLogs();
    const matchingLog = cachedCardio.find((c) => c.dateKey === selectedDateKey);
    if (matchingLog) {
      return {
        hasData: true,
        distanceKm: matchingLog.distanceKm,
        durationMinutes: matchingLog.durationMinutes,
        burnedKcal: matchingLog.burnedKcal,
        avgHeartRateBpm: matchingLog.avgHeartRateBpm || 135,
        zone2Minutes: Math.round(matchingLog.durationMinutes * 0.75),
        activityType: matchingLog.activityType,
      };
    }

    if (isViewingToday && (stepCount > 0 || (cardioSub && cardioSub.durationMinutes > 0))) {
      const stepDist = Number((stepCount / 1300).toFixed(1));
      const stepCal = Math.round(stepCount * 0.04);
      return {
        hasData: true,
        distanceKm: Math.max(stepDist, cardioSub?.distanceKm || 0),
        durationMinutes: cardioSub?.durationMinutes || Math.max(1, Math.round(stepCount / 100)),
        burnedKcal: Math.max(stepCal, cardioSub?.burnedKcal || 0),
        avgHeartRateBpm: cardioSub?.avgHeartRateBpm || 135,
        zone2Minutes: Math.round((cardioSub?.durationMinutes || Math.max(1, Math.round(stepCount / 100))) * 0.75),
        activityType: cardioSub?.activityType || (stepCount > 0 ? 'Daily Steps & Walking' : 'Cardio Session'),
      };
    }
    return rawCardioRecord;
  }, [rawCardioRecord, selectedDateKey, isViewingToday, stepCount, cardioSub]);

  const selectedNutritionRecord = useMemo(() => {
    if (rawNutritionRecord?.hasData) return rawNutritionRecord;
    if (isViewingToday && (currentCalories > 0 || allMeals.length > 0)) {
      return {
        hasData: true,
        calories: currentCalories,
        calorieTarget: targetCalories || 2200,
        proteinG: currentProtein,
        proteinTargetG: targetProteinG || 165,
        carbsG: currentCarbs,
        carbsTargetG: targetCarbsG || 250,
        fatsG: currentFats,
        fatsTargetG: targetFatsG || 60,
        meals: allMeals.map((m) => ({
          name: m.name,
          category: (m.category as any) || 'Dinner',
          calories: Math.round(m.calories || 0),
          proteinG: Math.round((m.protein || 0) * 10) / 10,
          carbsG: Math.round((m.carbs || 0) * 10) / 10,
          fatsG: Math.round((m.fats || 0) * 10) / 10,
          time: m.timestamp,
        })),
      };
    }
    return rawNutritionRecord;
  }, [rawNutritionRecord, isViewingToday, currentCalories, currentProtein, currentCarbs, currentFats, allMeals, targetCalories, targetProteinG, targetCarbsG, targetFatsG]);

  // Build 7-day week row items
  const daysOfWeek = useMemo(() => ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], []);
  const weekDays = useMemo(() => {
    return daysOfWeek.map((dayName, idx) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + idx);
      const isDayToday = d.toDateString() === today.toDateString();
      const dy = d.getFullYear();
      const dm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dayDateKey = `${dy}-${dm}-${dd}`;

      const rec = historyByDate[dayDateKey];
      const hasHistoryRecord = Boolean(
        rec && (
          rec.workout?.hasData ||
          rec.cardio?.hasData ||
          rec.nutrition?.hasData ||
          rec.sleep?.hasData
        )
      );
      const hasActiveSession = isDayToday && (
        workoutExercises.length > 0 ||
        completedSetsCount > 0 ||
        sessionTonnageKg > 0 ||
        currentCalories > 0
      );

      return {
        dayName,
        dayNum: d.getDate(),
        dateStr: d.toDateString(),
        dateKey: dayDateKey,
        isToday: isDayToday,
        hasActivity: hasHistoryRecord || hasActiveSession,
      };
    });
  }, [mondayDate, daysOfWeek, today, historyByDate, workoutExercises.length, completedSetsCount, sessionTonnageKg, currentCalories]);

  // Selected DayMeta object for quick logging modal
  const selectedDayMeta: DayMeta = useMemo(() => {
    const isDayToday = selectedDateKey === todayKey;
    const yestObj = new Date();
    yestObj.setDate(yestObj.getDate() - 1);
    const yKey = `${yestObj.getFullYear()}-${String(yestObj.getMonth() + 1).padStart(2, '0')}-${String(yestObj.getDate()).padStart(2, '0')}`;
    const isYesterday = selectedDateKey === yKey;
    const dayOfWeekIdx = selectedDateObj.getDay();
    const dayNamesShort = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const dayNamesFull = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return {
      offset: Math.round((today.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24)),
      dateKey: selectedDateKey,
      dayLabel: isDayToday ? 'TODAY' : isYesterday ? 'YESTERDAY' : dayNamesFull[dayOfWeekIdx],
      dayPillLabel: isDayToday ? 'TO' : isYesterday ? 'YE' : dayNamesShort[dayOfWeekIdx],
      dateFormatted: selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: isDayToday,
      isYesterday,
    };
  }, [selectedDateKey, todayKey, selectedDateObj, today]);

  // Accordion state for the 5 channels
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    workout: false,
    cardio: false,
    nutrition: false,
    sleep: false,
    meditation: false,
  });

  // Timeframe filter state per channel
  const [workoutFilter, setWorkoutFilter] = useState<'Volume (kg)' | 'Sets' | 'Intensity'>('Volume (kg)');
  const [workoutTimeframe, setWorkoutTimeframe] = useState<'7D' | '30D' | '1Y'>('7D');
  const [cardioTimeframe, setCardioTimeframe] = useState<'7D' | '30D' | '1Y'>('30D');
  const [nutritionTimeframe, setNutritionTimeframe] = useState<'7D' | '30D' | '1Y'>('7D');
  const [sleepTimeframe, setSleepTimeframe] = useState<'7D' | '30D' | '1Y'>('7D');
  const [meditationTimeframe, setMeditationTimeframe] = useState<'7D' | '30D' | '1Y'>('7D');

  // Quick log modal state
  const [activeModalCategory, setActiveModalCategory] = useState<TelemetryCategory | null>(null);
  const [isConsoleScanOpen, setIsConsoleScanOpen] = useState(false);

  const toggle = (channel: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExpanded((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  // Sync today's active workout into history store reactively with identity guards
  useEffect(() => {
    const genuineResistanceExercises = workoutExercises.filter(
      (e) => !e.name?.toLowerCase().startsWith('cardio:') && !e.name?.toLowerCase().includes('telemetry')
    );

    if (sessionTonnageKg > 0 || completedSetsCount > 0 || genuineResistanceExercises.length > 0) {
      const existingWorkout = historyByDate[todayKey]?.workout;
      if (
        existingWorkout &&
        existingWorkout.hasData &&
        existingWorkout.tonnageKg === sessionTonnageKg &&
        existingWorkout.completedSets === completedSetsCount &&
        existingWorkout.exercises?.length === genuineResistanceExercises.length
      ) {
        return;
      }

      updateDayRecord(todayKey, 'workout', {
        hasData: true,
        tonnageKg: sessionTonnageKg,
        completedSets: completedSetsCount,
        durationMinutes: 45,
        routineName: activeRoutineTitle || 'Resistance Session',
        intensityRpe: 8.5,
        exercises: genuineResistanceExercises.map((e) => ({
          name: e.name || e.exerciseName || 'Exercise',
          sets: e.sets.length,
          reps: e.sets[0]?.reps || 8,
          weightKg: e.sets[0]?.weightKg || e.sets[0]?.weight || 0,
          completed: e.sets.some((s) => s.completed),
        })),
      });
    }
  }, [sessionTonnageKg, completedSetsCount, workoutExercises, todayKey, updateDayRecord, historyByDate, activeRoutineTitle]);

  // Sync today's cardio & step telemetry into history store reactively
  useEffect(() => {
    const hasCardio = stepCount > 0 || (cardioSub && (cardioSub.durationMinutes > 0 || (cardioSub.burnedKcal || 0) > 0));
    if (!hasCardio) return;

    const stepDist = Number((stepCount / 1300).toFixed(1));
    const stepCal = Math.round(stepCount * 0.04);
    const distanceKm = Math.max(stepDist, cardioSub?.distanceKm || 0);
    const burnedKcal = Math.max(stepCal, cardioSub?.burnedKcal || 0);
    const durationMinutes = cardioSub?.durationMinutes || Math.max(1, Math.round(stepCount / 100));
    const avgHeartRateBpm = cardioSub?.avgHeartRateBpm || 135;

    const existingCardio = historyByDate[todayKey]?.cardio;
    if (
      existingCardio &&
      existingCardio.hasData &&
      existingCardio.distanceKm === distanceKm &&
      existingCardio.burnedKcal === burnedKcal &&
      existingCardio.durationMinutes === durationMinutes
    ) {
      return;
    }

    updateDayRecord(todayKey, 'cardio', {
      hasData: true,
      distanceKm,
      burnedKcal,
      durationMinutes,
      avgHeartRateBpm,
      activityType: cardioSub?.activityType || (stepCount > 0 ? 'Daily Steps & Walking' : 'Cardio Session'),
    });
  }, [stepCount, cardioSub, todayKey, updateDayRecord, historyByDate]);

  // Sync today's fuel intake into history store reactively with identity guards
  useEffect(() => {
    if (currentCalories > 0 || currentProtein > 0 || currentCarbs > 0 || currentFats > 0) {
      const existingNutrition = historyByDate[todayKey]?.nutrition;
      if (
        existingNutrition &&
        existingNutrition.hasData &&
        existingNutrition.calories === currentCalories &&
        existingNutrition.proteinG === currentProtein &&
        existingNutrition.carbsG === currentCarbs &&
        existingNutrition.fatsG === currentFats &&
        existingNutrition.meals?.length === allMeals.length
      ) {
        return;
      }

      updateDayRecord(todayKey, 'nutrition', {
        hasData: true,
        calories: currentCalories,
        calorieTarget: targetCalories,
        proteinG: currentProtein,
        proteinTargetG: targetProteinG,
        carbsG: currentCarbs,
        carbsTargetG: targetCarbsG,
        fatsG: currentFats,
        fatsTargetG: targetFatsG,
        meals: allMeals.map((m) => ({
          name: m.name,
          category: (m.category as any) || 'Dinner',
          calories: Math.round(m.calories || 0),
          proteinG: Math.round((m.protein || 0) * 10) / 10,
          carbsG: Math.round((m.carbs || 0) * 10) / 10,
          fatsG: Math.round((m.fats || 0) * 10) / 10,
          time: m.timestamp,
        })),
      });
    }
  }, [currentCalories, currentProtein, currentCarbs, currentFats, todayKey, targetCalories, targetProteinG, targetCarbsG, targetFatsG, updateDayRecord, allMeals, historyByDate]);

  // Week range label
  const sundayDate = useMemo(() => {
    const s = new Date(mondayDate);
    s.setDate(mondayDate.getDate() + 6);
    return s;
  }, [mondayDate]);

  const weekRangeLabel = `${mondayDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${sundayDate.toLocaleDateString('en-US', {
    day: 'numeric',
  })}`.toUpperCase();

  // Helper to extract past N days
  const getTimeframeDates = (daysCount: number) => {
    const dates: { dateKey: string; dateObj: Date; dayName: string; dayShort: string }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dayIdx = d.getDay();
      dates.push({
        dateKey: `${y}-${m}-${day}`,
        dateObj: d,
        dayName: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayIdx],
        dayShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayIdx],
      });
    }
    return dates;
  };

  // =========================================================================
  // 1. WORKOUT ACCURATE TIMEFRAME AGGREGATION (7D, 30D, 1Y)
  // =========================================================================
  const workoutTimeframeDays = workoutTimeframe === '7D' ? 7 : workoutTimeframe === '30D' ? 30 : 365;
  const workoutAggregated = useMemo(() => {
    const dates = getTimeframeDates(workoutTimeframeDays);
    let totalSessions = 0;
    let totalTonnage = 0;
    let totalSets = 0;
    let totalMinutes = 0;
    let rpeSum = 0;
    let rpeCount = 0;

    const dailyPoints = dates.map(({ dateKey, dayShort, dateObj }) => {
      const rec = historyByDate[dateKey]?.workout;
      const isDayToday = dateKey === todayKey;

      let tonnage = rec?.hasData ? (rec.tonnageKg || 0) : 0;
      let sets = rec?.hasData ? (rec.completedSets || 0) : 0;
      let rpe = rec?.hasData ? (rec.intensityRpe || 8.5) : 0;
      let hasData = Boolean(rec?.hasData);

      // Merge active session if today
      if (isDayToday && (sessionTonnageKg > 0 || completedSetsCount > 0)) {
        tonnage = Math.max(tonnage, sessionTonnageKg);
        sets = Math.max(sets, completedSetsCount);
        rpe = rpe || 8.5;
        hasData = true;
      }

      if (hasData && (tonnage > 0 || sets > 0)) {
        totalSessions += 1;
        totalTonnage += tonnage;
        totalSets += sets;
        totalMinutes += rec?.durationMinutes || 45;
        if (rpe > 0) {
          rpeSum += rpe;
          rpeCount += 1;
        }
      }

      return {
        dateKey,
        dayShort,
        dateObj,
        tonnage,
        sets,
        rpe,
        hasData,
        isToday: isDayToday,
      };
    });

    const avgRpe = rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : (totalSessions > 0 ? '8.5' : '0.0');
    const avgBaseline = totalSessions > 0 ? Math.round(totalTonnage / totalSessions) : 0;

    let chartBars: { label: string; value: number; hasData: boolean; isToday?: boolean }[] = [];

    if (workoutTimeframe === '7D') {
      chartBars = dailyPoints.map((p) => {
        const val = workoutFilter === 'Sets' ? p.sets : workoutFilter === 'Intensity' ? p.rpe : p.tonnage;
        return {
          label: p.dayShort,
          value: val,
          hasData: p.hasData,
          isToday: p.isToday,
        };
      });
    } else if (workoutTimeframe === '30D') {
      const weekBuckets = [
        { label: 'W1', points: dailyPoints.slice(0, 7) },
        { label: 'W2', points: dailyPoints.slice(7, 14) },
        { label: 'W3', points: dailyPoints.slice(14, 21) },
        { label: 'W4', points: dailyPoints.slice(21) },
      ];
      chartBars = weekBuckets.map((wb) => {
        const sumVal = wb.points.reduce((acc, p) => {
          const val = workoutFilter === 'Sets' ? p.sets : workoutFilter === 'Intensity' ? (p.hasData ? p.rpe : 0) : p.tonnage;
          return acc + val;
        }, 0);
        const hasData = wb.points.some((p) => p.hasData);
        return { label: wb.label, value: sumVal, hasData };
      });
    } else {
      const qSize = Math.floor(dailyPoints.length / 4);
      const qBuckets = [
        { label: 'Q1', points: dailyPoints.slice(0, qSize) },
        { label: 'Q2', points: dailyPoints.slice(qSize, qSize * 2) },
        { label: 'Q3', points: dailyPoints.slice(qSize * 2, qSize * 3) },
        { label: 'Q4', points: dailyPoints.slice(qSize * 3) },
      ];
      chartBars = qBuckets.map((qb) => {
        const sumVal = qb.points.reduce((acc, p) => {
          const val = workoutFilter === 'Sets' ? p.sets : workoutFilter === 'Intensity' ? (p.hasData ? p.rpe : 0) : p.tonnage;
          return acc + val;
        }, 0);
        const hasData = qb.points.some((p) => p.hasData);
        return { label: qb.label, value: sumVal, hasData };
      });
    }

    const maxBarValue = Math.max(...chartBars.map((b) => b.value), 1);

    return {
      totalSessions,
      totalTonnage,
      totalSets,
      totalMinutes,
      avgRpe,
      avgBaseline,
      chartBars,
      maxBarValue,
    };
  }, [historyByDate, workoutTimeframe, workoutTimeframeDays, workoutFilter, todayKey, sessionTonnageKg, completedSetsCount]);

  // =========================================================================
  // 2. CARDIO ACCURATE TIMEFRAME AGGREGATION (7D, 30D, 1Y)
  // =========================================================================
  const cardioTimeframeDays = cardioTimeframe === '7D' ? 7 : cardioTimeframe === '30D' ? 30 : 365;
  const cardioAggregated = useMemo(() => {
    const dates = getTimeframeDates(cardioTimeframeDays);
    let totalSessions = 0;
    let totalBurned = 0;
    let totalDist = 0;
    let totalMinutes = 0;

    dates.forEach(({ dateKey }) => {
      const rec = historyByDate[dateKey]?.cardio;
      const isDayToday = dateKey === todayKey;
      let dur = rec?.hasData ? (rec.durationMinutes || 0) : 0;
      let burn = rec?.hasData ? (rec.burnedKcal || 0) : 0;
      let dist = rec?.hasData ? (rec.distanceKm || 0) : 0;
      let hasData = Boolean(rec?.hasData);

      if (isDayToday && (stepCount > 0 || (cardioSub && cardioSub.durationMinutes > 0))) {
        const stepDist = Number((stepCount / 1300).toFixed(1));
        const stepCal = Math.round(stepCount * 0.04);
        dist = Math.max(dist, stepDist, cardioSub?.distanceKm || 0);
        burn = Math.max(burn, stepCal, cardioSub?.burnedKcal || 0);
        dur = Math.max(dur, cardioSub?.durationMinutes || 0);
        hasData = true;
      }

      if (hasData && (dur > 0 || burn > 0 || dist > 0)) {
        totalSessions += 1;
        totalBurned += burn;
        totalDist += dist;
        totalMinutes += dur;
      }
    });

    return {
      totalSessions,
      totalBurned,
      totalDist: Number(totalDist.toFixed(1)),
      totalMinutes,
    };
  }, [historyByDate, cardioTimeframe, cardioTimeframeDays, todayKey, stepCount, cardioSub]);

  // =========================================================================
  // 3. NUTRITION ACCURATE TIMEFRAME AGGREGATION (7D, 30D, 1Y)
  // =========================================================================
  const nutritionTimeframeDays = nutritionTimeframe === '7D' ? 7 : nutritionTimeframe === '30D' ? 30 : 365;
  const nutritionAggregated = useMemo(() => {
    const dates = getTimeframeDates(nutritionTimeframeDays);
    let daysWithData = 0;
    let totalCals = 0;
    let totalProtein = 0;

    dates.forEach(({ dateKey }) => {
      const rec = historyByDate[dateKey]?.nutrition;
      const isDayToday = dateKey === todayKey;
      let cals = rec?.hasData ? (rec.calories || 0) : 0;
      let p = rec?.hasData ? (rec.proteinG || 0) : 0;
      let hasData = Boolean(rec?.hasData);

      if (isDayToday && currentCalories > 0) {
        cals = currentCalories;
        p = currentProtein;
        hasData = true;
      }

      if (hasData && cals > 0) {
        daysWithData += 1;
        totalCals += cals;
        totalProtein += p;
      }
    });

    const avgCals = daysWithData > 0 ? Math.round(totalCals / daysWithData) : 0;
    const avgProtein = daysWithData > 0 ? Math.round((totalProtein / daysWithData) * 10) / 10 : 0;

    return {
      daysWithData,
      avgCals,
      avgProtein,
      totalCals,
    };
  }, [historyByDate, nutritionTimeframe, nutritionTimeframeDays, todayKey, currentCalories, currentProtein]);

  // =========================================================================
  // 4. SLEEP ACCURATE TIMEFRAME AGGREGATION (7D, 30D, 1Y)
  // =========================================================================
  const sleepTimeframeDays = sleepTimeframe === '7D' ? 7 : sleepTimeframe === '30D' ? 30 : 365;
  const sleepAggregated = useMemo(() => {
    const dates = getTimeframeDates(sleepTimeframeDays);
    let daysWithData = 0;
    let totalHours = 0;
    let totalRecovery = 0;

    dates.forEach(({ dateKey }) => {
      const rec = historyByDate[dateKey]?.sleep;
      if (rec?.hasData && (rec.durationHours > 0 || rec.recoveryPercent > 0)) {
        daysWithData += 1;
        totalHours += rec.durationHours || 0;
        totalRecovery += rec.recoveryPercent || 0;
      }
    });

    const avgHours = daysWithData > 0 ? (totalHours / daysWithData).toFixed(1) : (selectedSleepRecord?.durationHours ? String(selectedSleepRecord.durationHours) : '7.5');
    const avgRecovery = daysWithData > 0 ? Math.round(totalRecovery / daysWithData) : (selectedSleepRecord?.recoveryPercent || 88);

    return {
      daysWithData,
      avgHours,
      avgRecovery,
      totalHours: totalHours.toFixed(1),
    };
  }, [historyByDate, sleepTimeframe, sleepTimeframeDays, selectedSleepRecord]);

  return (
    <div className="space-y-4 select-none font-mono">
      {/* ============================================================== */}
      {/* 1. ACTIVITY MATRIX & 30-DAY LOG FEED CARD                      */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm space-y-3.5 text-neutral-900 dark:text-neutral-100 transition-colors">
        {/* Header with Mode Toggle & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C4121A]" />
            <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-0.5 rounded-xl text-[10px]">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setViewMode('matrix');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Week Matrix
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setViewMode('30d_feed');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === '30d_feed'
                    ? 'bg-[#C4121A] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                <History className="w-3 h-3" />
                <span>30-Day Log Feed</span>
              </button>
            </div>
          </div>

          {/* Week Navigation Controls when in Matrix view */}
          {viewMode === 'matrix' ? (
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
                {weekRangeLabel}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setWeekOffset((w) => w - 1);
                  }}
                  className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer active:scale-95"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setWeekOffset(0);
                    setSelectedDateStr(today.toDateString());
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer active:scale-95 ${
                    weekOffset === 0
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setWeekOffset((w) => Math.min(0, w + 1));
                  }}
                  disabled={weekOffset >= 0}
                  className={`p-1 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                    weekOffset >= 0
                      ? 'opacity-30 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
                  }`}
                  title="Next Week"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500 dark:text-neutral-400 tracking-wider">
              Past 30 Days Activity Log
            </span>
          )}
        </div>

        {/* VIEW 1: WEEK MATRIX */}
        {viewMode === 'matrix' ? (
          <LogWeekStrip
            weekDays={weekDays}
            selectedDateStr={selectedDateStr}
            onSelectDate={(dateStr, dayName, dayNum) => {
              setSelectedDateStr(dateStr);
              showToast(`Selected ${dayName} ${dayNum} Log Record`);
            }}
            selectedDayMeta={selectedDayMeta}
          />
        ) : (
          /* VIEW 2: 30-DAY LOG FEED */
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {past30Days.map((dm) => {
              const rec = historyByDate[dm.dateKey];
              const isToday = dm.isToday;
              const isSelected = selectedDateKey === dm.dateKey;

              const hasWorkout = Boolean(
                rec?.workout?.hasData || (isToday && (workoutExercises.length > 0 || sessionTonnageKg > 0))
              );
              const wTonnage = isToday ? (sessionTonnageKg || rec?.workout?.tonnageKg || 0) : (rec?.workout?.tonnageKg || 0);
              const wSets = isToday ? (completedSetsCount || rec?.workout?.completedSets || 0) : (rec?.workout?.completedSets || 0);
              const wRoutine = isToday ? (activeRoutineTitle || rec?.workout?.routineName || 'Resistance') : (rec?.workout?.routineName || 'Resistance');

              const hasCardio = Boolean(
                rec?.cardio?.hasData || (isToday && (stepCount > 0 || (cardioSub?.distanceKm || 0) > 0))
              );
              const cDist = isToday ? Math.max(Number((stepCount / 1300).toFixed(1)), rec?.cardio?.distanceKm || 0) : (rec?.cardio?.distanceKm || 0);
              const cBurn = isToday ? Math.max(Math.round(stepCount * 0.04), rec?.cardio?.burnedKcal || 0) : (rec?.cardio?.burnedKcal || 0);

              const hasNutrition = Boolean(
                rec?.nutrition?.hasData || (isToday && (currentCalories > 0 || allMeals.length > 0))
              );
              const nCals = isToday ? (currentCalories || rec?.nutrition?.calories || 0) : (rec?.nutrition?.calories || 0);
              const nProtein = isToday ? (currentProtein || rec?.nutrition?.proteinG || 0) : (rec?.nutrition?.proteinG || 0);
              const nMealsCount = isToday ? (allMeals.length || rec?.nutrition?.meals?.length || 0) : (rec?.nutrition?.meals?.length || 0);

              const hasAnyActivity = hasWorkout || hasCardio || hasNutrition || Boolean(rec?.sleep?.hasData);

              return (
                <div
                  key={dm.dateKey}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setSelectedDateStr(new Date(dm.dateKey + 'T12:00:00').toDateString());
                    setViewMode('matrix');
                    showToast(`Loaded ${dm.dayLabel} (${dm.dateFormatted}) Logs`);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-[#1a1a20] border-[#C4121A] shadow-xs'
                      : hasAnyActivity
                      ? 'bg-neutral-50 dark:bg-[#16161a] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      : 'bg-neutral-50/50 dark:bg-[#121214]/60 border-neutral-200/60 dark:border-neutral-800/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                        {dm.dayLabel}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {dm.dateFormatted}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#C4121A] text-white text-[8px] font-bold uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>

                  </div>

                  {hasAnyActivity ? (
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {hasWorkout && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold">
                          <Dumbbell className="w-3 h-3 text-[#C4121A]" />
                          <span>{wTonnage.toLocaleString()} kg · {wSets} sets ({wRoutine})</span>
                        </span>
                      )}

                      {hasCardio && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold">
                          <Activity className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>{cDist} km · {cBurn} kcal</span>
                        </span>
                      )}

                      {hasNutrition && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold">
                          <Apple className="w-3 h-3 text-amber-500" />
                          <span>{nCals} kcal · {nProtein}g P ({nMealsCount} meals)</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>No logged activity on this day</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          tactileEngine.triggerSelectionBuzz();
                          setSelectedDateStr(new Date(dm.dateKey + 'T12:00:00').toDateString());
                          setActiveModalCategory('workout');
                        }}
                        className="text-[#C4121A] hover:underline font-bold"
                      >
                        + Log Entry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. THE 5 GENUINE LOG HISTORY CHANNELS                          */}
      {/* ============================================================== */}
      <div className="space-y-3">
        {/* ============================================================== */}
        {/* CHANNEL 1: WORKOUT HISTORY (Red Accent)                        */}
        {/* ============================================================== */}
        <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => toggle('workout')}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[#C4121A] shrink-0 shadow-xs">
                <Dumbbell className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  WORKOUT HISTORY
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {selectedWorkoutRecord?.hasData || (isViewingToday && hasActiveLiftingSession)
                    ? `${((selectedWorkoutRecord?.tonnageKg || totalVolumeMoved)).toLocaleString()} kg moved · ${(selectedWorkoutRecord?.completedSets || completedSetsCount)} sets completed`
                    : '0 kg moved · No session recorded'}
                </span>
              </div>
            </div>

            <div className="text-neutral-400">
              {expanded.workout ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expanded.workout && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-neutral-200 dark:border-neutral-800/80">
              {/* Controls Bar: [7D] [30D] [1Y] Timeframe + [Volume (kg)] [Sets] [Intensity] Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Timeframe Filter: [7D] [30D] [1Y] */}
                <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl gap-1">
                  {(['7D', '30D', '1Y'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setWorkoutTimeframe(tf);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        workoutTimeframe === tf
                          ? 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Segmented Filter: [Volume (kg)] [Sets] [Intensity] */}
                <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl gap-1">
                  {(['Volume (kg)', 'Sets', 'Intensity'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setWorkoutFilter(filter);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        workoutFilter === filter
                          ? 'bg-[#C4121A] text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Metric Cards with Real Calculated Timeframe Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* SESSIONS */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                      SESSIONS
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {workoutAggregated.totalSessions}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {workoutTimeframe === '7D' ? '7 Days Total' : workoutTimeframe === '30D' ? '30 Days Total' : '1 Year Total'}
                  </span>
                </div>

                {/* TONNAGE / SETS / INTENSITY */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    {workoutFilter === 'Sets' ? 'SETS' : workoutFilter === 'Intensity' ? 'AVG RPE' : 'TONNAGE'}
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {workoutFilter === 'Sets'
                        ? workoutAggregated.totalSets
                        : workoutFilter === 'Intensity'
                        ? workoutAggregated.avgRpe
                        : workoutAggregated.totalTonnage >= 1000
                        ? `${(workoutAggregated.totalTonnage / 1000).toFixed(1)}k`
                        : `${workoutAggregated.totalTonnage} kg`}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {workoutTimeframe === '7D' ? '7 Days Cumul.' : workoutTimeframe === '30D' ? '30 Days Cumul.' : '1 Year Cumul.'}
                  </span>
                </div>

                {/* TIME */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                      TIME
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {workoutAggregated.totalMinutes >= 180
                        ? `${Math.round(workoutAggregated.totalMinutes / 60)} hrs`
                        : `${workoutAggregated.totalMinutes} min`}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {workoutTimeframe === '7D' ? '7 Days Total' : workoutTimeframe === '30D' ? '30 Days Total' : '1 Year Total'}
                  </span>
                </div>
              </div>

              {/* Dynamic Chart Container with Proportional Volume / Sets Bars */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 space-y-4">
                {/* Proportional Volume Bars */}
                <div className="flex items-end justify-between gap-2 h-28 pt-2 pb-1 border-b border-dashed border-red-500/30">
                  {workoutAggregated.chartBars.map((b, idx) => {
                    const heightPercent = b.hasData && b.value > 0
                      ? Math.max(12, Math.min(100, Math.round((b.value / workoutAggregated.maxBarValue) * 100)))
                      : 4;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                        <span className="text-[9px] font-mono font-semibold text-neutral-400 dark:text-neutral-500 truncate h-3">
                          {b.hasData && b.value > 0
                            ? workoutFilter === 'Sets'
                              ? b.value
                              : workoutFilter === 'Intensity'
                              ? b.value
                              : b.value >= 1000
                              ? `${(b.value / 1000).toFixed(1)}k`
                              : `${b.value}`
                            : ''}
                        </span>

                        <div className="w-full max-w-[28px] h-16 bg-neutral-200 dark:bg-neutral-800/70 rounded-t-lg overflow-hidden flex items-end">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              b.hasData ? 'bg-[#C4121A] shadow-xs' : 'bg-transparent'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        <span
                          className={`text-xs font-bold ${
                            b.isToday
                              ? 'text-[#C4121A]'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer labels */}
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>
                    — Baseline Avg: {workoutAggregated.avgBaseline.toLocaleString()} kg
                  </span>
                  <span>{workoutFilter} Telemetry Curve</span>
                </div>
              </div>

              {/* Workout active/completed/empty status card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 text-left space-y-3">
                {isViewingToday && hasActiveLiftingSession ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                          Active Training Session (In Progress)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {workoutExercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="p-2 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#C4121A]" />
                            <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{ex.name || ex.exerciseName}</span>
                          </div>
                          <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">
                            {ex.sets.length} sets
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedWorkoutRecord?.hasData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[#C4121A] shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-[#C4121A]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                            {selectedWorkoutRecord.routineName || 'Resistance Session'}
                          </h4>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans">
                            Completed Session · {selectedWorkoutRecord.durationMinutes || 45} mins duration
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                        {selectedWorkoutRecord.tonnageKg.toLocaleString()} kg moved
                      </span>
                    </div>

                    {selectedWorkoutRecord.exercises && selectedWorkoutRecord.exercises.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedWorkoutRecord.exercises.map((ex, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{ex.name}</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">
                              {ex.sets} sets × {ex.reps} reps ({ex.weightKg} kg)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <div className="flex items-center justify-center">
                      <Dumbbell className="w-7 h-7 text-neutral-400 dark:text-neutral-600" />
                    </div>
                    <h4 className="text-xs font-tactical font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                      NO SESSIONS REGISTERED • SELECT A ROUTINE TO BEGIN RECORDING
                    </h4>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto">
                      No lifting volume, sets, or reps recorded for this date
                    </p>
                  </div>
                )}
              </div>

              {/* CLEAN EXPANDABLE TELEMETRY HISTORY LIST FOR WORKOUT */}
              <Expandable5RowTelemetryHistory
                category="workout"
                timeframe={workoutTimeframe}
                onNavigateToWorkout={onNavigateToWorkout}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CHANNEL 2: CARDIO (Cyan Accent)                                */}
        {/* ============================================================== */}
        <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => toggle('cardio')}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 shadow-xs">
                <Activity className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  CARDIO
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {selectedCardioRecord?.hasData
                    ? `${selectedCardioRecord.distanceKm} km · ${selectedCardioRecord.burnedKcal} kcal burned`
                    : isViewingToday && stepCount > 0
                    ? `${(stepCount / 1300).toFixed(1)} km · Daily Steps: ${stepCount.toLocaleString()}`
                    : '0.0 km · No cardio logged'}
                </span>
              </div>
            </div>

            <div className="text-neutral-400">
              {expanded.cardio ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expanded.cardio && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-neutral-200 dark:border-neutral-800/80">
              {/* Segmented Filter: [7D] [30D] [1Y] */}
              <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl gap-1">
                {(['7D', '30D', '1Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setCardioTimeframe(tf);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cardioTimeframe === tf
                        ? 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* 3 Metric Cards with Real Calculated Timeframe Metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* DURATION */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    {cardioTimeframe} DURATION
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {cardioAggregated.totalMinutes} min
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {(cardioAggregated.totalMinutes / 60).toFixed(1)} hours
                  </span>
                </div>

                {/* BURN */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    {cardioTimeframe} BURN
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">
                      {cardioAggregated.totalBurned} kcal
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {cardioAggregated.totalDist} km distance
                  </span>
                </div>

                {/* SESSIONS */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    SESSIONS
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {cardioAggregated.totalSessions}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {cardioAggregated.totalSessions} active days
                  </span>
                </div>
              </div>

              {/* Action Buttons: [📷 SCAN CONSOLE PHOTO] and [+ MANUAL] */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setIsConsoleScanOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <Camera className="w-4 h-4 text-black" />
                  <span>SCAN CONSOLE PHOTO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalCategory('cardio')}
                  className="py-2.5 px-3 rounded-2xl bg-neutral-100 dark:bg-[#18181c] border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <span>+ MANUAL</span>
                </button>
              </div>

              {/* Status Card: Synced Cardio Session or Empty */}
              {selectedCardioRecord?.hasData ? (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                          {selectedCardioRecord.activityType || 'Cardio Console Session'}
                        </h4>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-sans flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-cyan-500" /> Synced Cardio Session
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConsoleScanOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-300 dark:hover:bg-neutral-700 cursor-pointer transition-colors active:scale-95"
                    >
                      Rescan
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[9px] text-neutral-400 uppercase font-bold block">Distance</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{selectedCardioRecord.distanceKm} km</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[9px] text-neutral-400 uppercase font-bold block">Duration</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{selectedCardioRecord.durationMinutes}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[9px] text-neutral-400 uppercase font-bold block">Burn</span>
                      <span className="font-bold text-amber-500">{selectedCardioRecord.burnedKcal} kcal</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[9px] text-neutral-400 uppercase font-bold block">Avg HR</span>
                      <span className="font-bold text-rose-500">{selectedCardioRecord.avgHeartRateBpm || 142} bpm</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
                  <div className="flex items-center justify-center">
                    <Activity className="w-7 h-7 text-neutral-400 dark:text-neutral-600" />
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">No Cardio Sessions Logged</h4>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto">
                    Scan an exercise console photo with OCR or log manual duration &amp; calories
                  </p>
                </div>
              )}

              {/* CLEAN EXPANDABLE TELEMETRY HISTORY LIST FOR CARDIO */}
              <Expandable5RowTelemetryHistory
                category="cardio"
                timeframe={cardioTimeframe}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CHANNEL 3: FOOD & NUTRITION (Amber Accent)                     */}
        {/* ============================================================== */}
        <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => toggle('nutrition')}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                <Apple className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  FOOD &amp; NUTRITION
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {selectedNutritionRecord?.hasData
                    ? `${selectedNutritionRecord.calories} kcal · Logged for ${selectedDayMeta.dayLabel}`
                    : isViewingToday && currentCalories > 0
                    ? `${currentCalories} / ${targetCalories > 0 ? targetCalories : '—'} kcal · Logged Today`
                    : '0 kcal · No food logged'}
                </span>
              </div>
            </div>

            <div className="text-neutral-400">
              {expanded.nutrition ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expanded.nutrition && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-neutral-200 dark:border-neutral-800/80">
              {/* Header Row: Filter Pills + Target Indicator and Adjust Button */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl gap-1">
                  {(['7D', '30D', '1Y'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setNutritionTimeframe(tf);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        nutritionTimeframe === tf
                          ? 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {targetCalories > 0 ? (
                    <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-bold uppercase tracking-wider">
                      {targetPercentage}% TARGET
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                      No Target Set
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Metric Cards for Nutrition */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* CONSUMED */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                      CONSUMED
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {selectedNutritionRecord?.hasData
                        ? selectedNutritionRecord.calories
                        : isViewingToday
                        ? currentCalories
                        : 0}{' '}
                      kcal
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {targetCalories > 0 ? `Goal: ${targetCalories} kcal` : 'Goal: Not Set'}
                  </span>
                </div>

                {/* BUDGET / AVERAGE */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    {nutritionTimeframe} AVG
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {nutritionAggregated.avgCals > 0 ? `${nutritionAggregated.avgCals} kcal` : '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {nutritionAggregated.daysWithData} days tracked
                  </span>
                </div>

                {/* PROTEIN */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    PROTEIN
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {selectedNutritionRecord?.hasData
                        ? `${formatMacro(selectedNutritionRecord.proteinG)}g`
                        : isViewingToday
                        ? `${currentProtein}g`
                        : '0g'}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {targetProteinG > 0 ? `Target: ${targetProteinG}g` : 'Target: Not Set'}
                  </span>
                </div>
              </div>

              {/* Macro Bars Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 space-y-3.5 text-xs">
                {/* PROTEIN */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase">PROTEIN</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                      {targetProteinG > 0
                        ? `${formatMacro(selectedNutritionRecord?.hasData ? selectedNutritionRecord.proteinG : currentProtein)}g / ${targetProteinG}g`
                        : `${formatMacro(selectedNutritionRecord?.hasData ? selectedNutritionRecord.proteinG : currentProtein)}g`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          targetProteinG > 0
                            ? Math.min(
                                100,
                                ((selectedNutritionRecord?.hasData
                                  ? selectedNutritionRecord.proteinG
                                  : currentProtein) /
                                  targetProteinG) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* CARBOHYDRATES */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase">CARBOHYDRATES</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {targetCarbsG > 0
                        ? `${formatMacro(selectedNutritionRecord?.hasData ? selectedNutritionRecord.carbsG : currentCarbs)}g / ${targetCarbsG}g`
                        : `${formatMacro(selectedNutritionRecord?.hasData ? selectedNutritionRecord.carbsG : currentCarbs)}g`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          targetCarbsG > 0
                            ? Math.min(
                                100,
                                ((selectedNutritionRecord?.hasData
                                  ? selectedNutritionRecord.carbsG
                                  : currentCarbs) /
                                  targetCarbsG) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* LIPIDS & FATS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase">LIPIDS &amp; FATS</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      {targetFatsG > 0
                        ? `${formatMacro(selectedNutritionRecord?.hasData ? selectedNutritionRecord.fatsG : currentFats)}g / ${targetFatsG}g`
                        : `${formatMacro(selectedNutritionRecord?.hasData ? selectedNutritionRecord.fatsG : currentFats)}g`}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          targetFatsG > 0
                            ? Math.min(
                                100,
                                ((selectedNutritionRecord?.hasData
                                  ? selectedNutritionRecord.fatsG
                                  : currentFats) /
                                  targetFatsG) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* CLEAN EXPANDABLE TELEMETRY HISTORY LIST FOR NUTRITION */}
              <Expandable5RowTelemetryHistory
                category="nutrition"
                timeframe={nutritionTimeframe}
                onNavigateToFuel={onNavigateToFuel}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CHANNEL 4: SLEEP (Circadian Architecture)                      */}
        {/* ============================================================== */}
        <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => toggle('sleep')}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs">
                <Moon className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  CIRCADIAN ARCHITECTURE
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {selectedSleepRecord?.hasData
                    ? `${selectedSleepRecord.durationHours}h Rest · ${selectedSleepRecord.recoveryPercent}% Recovery`
                    : 'NO REST DATA RECORDED'}
                </span>
              </div>
            </div>

            <div className="text-neutral-400">
              {expanded.sleep ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expanded.sleep && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-neutral-200 dark:border-neutral-800/80">
              {/* Header Row: Filter Pills + [RECOVERY %] */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl gap-1">
                  {(['7D', '30D', '1Y'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setSleepTimeframe(tf);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        sleepTimeframe === tf
                          ? 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  {selectedSleepRecord?.hasData
                    ? `${selectedSleepRecord.recoveryPercent}% RECOVERY`
                    : `${sleepAggregated.avgRecovery}% AVG RECOVERY`}
                </div>
              </div>

              {/* 3 Metric Cards for Sleep */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* AVG SLEEP */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                      AVG SLEEP
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {sleepAggregated.avgHours}h
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">{sleepTimeframe} Baseline</span>
                </div>

                {/* RECOVERY */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    RECOVERY
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                      {selectedSleepRecord?.hasData
                        ? `${selectedSleepRecord.recoveryPercent}%`
                        : `${sleepAggregated.avgRecovery}%`}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Circadian Index</span>
                </div>

                {/* TOTAL */}
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200/90 dark:border-neutral-800/90 flex flex-col justify-between">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">
                    {sleepTimeframe} TOTAL
                  </span>
                  <div className="my-1.5">
                    <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {sleepAggregated.totalHours}h
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500">Cumulative Rest</span>
                </div>
              </div>

              {/* Action Button: Log Sleep */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                    {selectedSleepRecord?.hasData ? 'Rest Data Recorded' : 'No rest data for selected day'}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {selectedSleepRecord?.hasData
                      ? `Deep sleep: ${selectedSleepRecord.deepSleepMinutes || 90}m · REM: ${selectedSleepRecord.remSleepMinutes || 100}m`
                      : 'Record sleep duration, recovery score & resting HR'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalCategory('sleep')}
                  className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Sleep</span>
                </button>
              </div>

              {/* CLEAN EXPANDABLE TELEMETRY HISTORY LIST FOR SLEEP */}
              <Expandable5RowTelemetryHistory
                category="sleep"
                timeframe={sleepTimeframe}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* CHANNEL 5: MEDITATION (Pure Natural Green Accent)             */}
        {/* ============================================================== */}
        <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => toggle('meditation')}
            className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-800/60 flex items-center justify-center text-green-700 dark:text-green-400 shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  MINDFUL RESONANCE
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {selectedMeditationRecord?.hasData
                    ? `${selectedMeditationRecord.minutes} min · ${selectedMeditationRecord.coherence}`
                    : '0 MIN TOTAL'}
                </span>
              </div>
            </div>

            <div className="text-neutral-400">
              {expanded.meditation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {expanded.meditation && (
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-neutral-200 dark:border-neutral-800/80">
              {/* Header Row: Filter Pills + Action */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center bg-neutral-100 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 p-1 rounded-2xl gap-1">
                  {(['7D', '30D', '1Y'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setMeditationTimeframe(tf);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        meditationTimeframe === tf
                          ? 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalCategory('meditation')}
                  className="py-1 px-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Session</span>
                </button>
              </div>

              {/* Status Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#18181c] border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
                <div className="flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                  {selectedMeditationRecord?.hasData
                    ? `${selectedMeditationRecord.minutes}m — ${selectedMeditationRecord.protocol || 'Tactical Box Breathing'}`
                    : 'Tactical Box Breathing Protocol (4-4-4-4)'}
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto">
                  {selectedMeditationRecord?.hasData
                    ? `Coherence: ${selectedMeditationRecord.coherence}`
                    : 'Alpha wave parasympathetic recovery exercise'}
                </p>
              </div>

              {/* CLEAN EXPANDABLE TELEMETRY HISTORY LIST FOR MEDITATION */}
              <Expandable5RowTelemetryHistory
                category="meditation"
                timeframe={meditationTimeframe}
                showToast={showToast}
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Log Modal when user taps (+) on today or any day */}
      {activeModalCategory && (
        <LogDayTelemetryModal
          isOpen={Boolean(activeModalCategory)}
          onClose={() => setActiveModalCategory(null)}
          category={activeModalCategory}
          dayMeta={selectedDayMeta}
          onSaved={showToast}
        />
      )}

      {/* Optical OCR Cardio Console Scanner Modal */}
      <CardioConsoleScanModal
        isOpen={isConsoleScanOpen}
        onClose={() => setIsConsoleScanOpen(false)}
        dateKey={selectedDateKey}
        onSynced={showToast}
      />
    </div>
  );
};

export default GenuineLogHistoryView;
