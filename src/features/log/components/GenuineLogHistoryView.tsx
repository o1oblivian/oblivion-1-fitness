import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Weight,
  HeartPulse,
  Apple,
  Moon,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import {
  DayMeta,
  NutritionDayRecord,
  TelemetryCategory,
  WorkoutDayRecord,
  useTelemetryHistoryStore,
} from '../store/useTelemetryHistoryStore';
import { LogDayTelemetryModal } from './LogDayTelemetryModal';
import { LiftHistoryCard } from './LiftHistoryCard';
import { LogWeekStrip } from './LogWeekStrip';
import { LogMonthGrid, type MonthDayItem } from './LogMonthGrid';
import { LogProgressTowers, TowerPoint } from './LogProgressTowers';
import { type LedgerRowActions } from './LogLedger';
import { ChannelDetail } from './LogChannelDetail';
import { LogChannelRow, LogStillToLog, type LogQuickAction } from './LogDayLedger';
import {
  WEEKDAYS,
  cardioHeadline,
  cleanCardio,
  cleanNutrition,
  cleanWorkout,
  dateKeyOf,
  dayHeading,
  foodHeadline,
  foodLine,
  line,
  mindfulHeadline,
  mindfulLine,
  part,
  readableSteps,
  sessionKg,
  sleepHeadline,
  sleepLine,
  workoutHeadline,
  workoutLine,
  type Headline,
} from './logHistoryFormat';
import { deleteDayLog, markForgotten, purgeArchivedDay, purgeArchivedLift } from '../services/dayLogService';
import { exerciseFromSets, knownSets, setWorkKg, setsFromExercise } from '../liftLedger';
import { forgetPendingArchives } from '../../../services/sessionArchive';

interface GenuineLogHistoryViewProps {
  showToast: (msg: string) => void;
}

/** Workouts, cardio and food come from their own tabs; only sleep and mindful minutes are typed in from the Log. */
const MANUAL_LOG_LABEL: Partial<Record<TelemetryCategory, string>> = {
  sleep: 'Log sleep',
  meditation: 'Log mindful',
};

export const GenuineLogHistoryView: React.FC<GenuineLogHistoryViewProps> = ({ showToast }) => {
  const workoutExercises = useWorkoutStore((s) => s.exercises);
  const sessionTonnageKg = useWorkoutStore((s) => s.sessionTonnageKg);
  const completedSetsCount = useWorkoutStore((s) => s.completedSetsCount);
  const activeRoutineTitle = useWorkoutStore((s) => s.activeRoutine);
  const meals = useFuelStore((s) => s.meals);
  const calorieTarget = useFuelStore((s) => s.calorieTarget);
  const stepCount = useTelemetryStore((s) => s.stepCount);
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKeyOf(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthView, setMonthView] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDateStr, setSelectedDateStr] = useState(today.toDateString());
  const [openChannel, setOpenChannel] = useState<TelemetryCategory | null>(null);
  const [towersOpen, setTowersOpen] = useState(true);
  const [towerChannel, setTowerChannel] = useState<TelemetryCategory>('workout');
  const [chartSpan, setChartSpan] = useState<'week' | 'month' | 'year'>('week');
  const [editor, setEditor] = useState<{ category: TelemetryCategory; mode: 'create' | 'edit'; lift?: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TelemetryCategory | null>(null);
  const [pendingLiftDelete, setPendingLiftDelete] = useState<string | null>(null);
  const [pendingMealDelete, setPendingMealDelete] = useState<{ index: number; name: string } | null>(null);
  const clearPending = () => {
    setPendingDelete(null);
    setPendingLiftDelete(null);
    setPendingMealDelete(null);
  };
  const mondayDate = useMemo(() => {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const date = new Date(today);
    date.setDate(today.getDate() + mondayOffset + weekOffset * 7);
    return date;
  }, [today, weekOffset]);

  const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
  const selectedDateKey = dateKeyOf(selectedDate);
  const isViewingToday = selectedDateKey === todayKey;

  const allMeals = useMemo(() => (meals ? Object.values(meals).flat() : []), [meals]);
  const currentCalories = Math.round(allMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0));

  const liveWorkout = useMemo<WorkoutDayRecord | undefined>(() => {
    if (!isViewingToday) return undefined;
    const lifts = workoutExercises.filter((exercise) => {
      const name = (exercise.name || exercise.exerciseName || '').toLowerCase();
      return !name.startsWith('cardio:') && !name.includes('telemetry');
    });
    const exercises = lifts
      .map((exercise) => exerciseFromSets(
        exercise.name || exercise.exerciseName || 'Exercise',
        setsFromExercise(exercise, true),
        true,
      ))
      .filter((entry) => (entry.setLog?.length || 0) > 0);
    if (exercises.length === 0 && sessionTonnageKg <= 0 && completedSetsCount <= 0) return undefined;
    return {
      hasData: true,
      tonnageKg: sessionTonnageKg,
      completedSets: completedSetsCount,
      durationMinutes: 0,
      routineName: activeRoutineTitle || '',
      intensityRpe: 0,
      exercises,
    };
  }, [isViewingToday, workoutExercises, sessionTonnageKg, completedSetsCount, activeRoutineTitle]);

  const liveFood = useMemo<NutritionDayRecord | undefined>(() => {
    if (!isViewingToday || (currentCalories <= 0 && allMeals.length === 0)) return undefined;
    return {
      hasData: true,
      calories: currentCalories,
      calorieTarget: calorieTarget || 0,
      proteinG: Math.round(allMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0) * 10) / 10,
      proteinTargetG: 0,
      carbsG: Math.round(allMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0) * 10) / 10,
      carbsTargetG: 0,
      fatsG: Math.round(allMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0) * 10) / 10,
      fatsTargetG: 0,
      meals: (['breakfast', 'lunch', 'dinner', 'snack', 'drinks', 'supplements'] as const).flatMap((slot) =>
        (meals?.[slot] || []).map((meal) => ({
          name: meal.name,
          category: slot === 'breakfast' ? 'Breakfast' as const : slot === 'dinner' ? 'Dinner' as const : slot === 'snack' ? 'Snacks' as const : 'Lunch' as const,
          slot,
          calories: Math.round(meal.calories || 0),
          proteinG: meal.protein || 0,
          carbsG: meal.carbs || 0,
          fatsG: meal.fats || 0,
        })),
      ),
    };
  }, [isViewingToday, currentCalories, allMeals, calorieTarget, meals]);

  const day = historyByDate[selectedDateKey];
  const workout = liveWorkout || cleanWorkout(day?.workout);
  const cardio = cleanCardio(day?.cardio);
  const food = liveFood || cleanNutrition(day?.nutrition);
  const sleep = day?.sleep?.hasData ? day.sleep : undefined;
  const mindful = day?.meditation?.hasData && (day.meditation.minutes || 0) > 0 ? day.meditation : undefined;
  const visibleSteps = readableSteps(cardio, isViewingToday ? stepCount : 0);

  const weekDays = useMemo(() => {
    return WEEKDAYS.map((dayName, index) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      const key = dateKeyOf(date);
      const record = historyByDate[key];
      const isToday = key === todayKey;
      return {
        dayName,
        dayNum: date.getDate(),
        dateStr: date.toDateString(),
        dateKey: key,
        isToday,
        trained: Boolean(record?.workout?.hasData || (isToday && liveWorkout)),
      };
    });
  }, [mondayDate, historyByDate, todayKey, liveWorkout]);

  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1), [today, monthOffset]);

  const monthDays = useMemo<MonthDayItem[]>(() => {
    const count = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1);
      const key = dateKeyOf(date);
      const record = historyByDate[key];
      const isToday = key === todayKey;
      const trained = Boolean(record?.workout?.hasData || (isToday && liveWorkout));
      return {
        dayNum: index + 1,
        dateStr: date.toDateString(),
        isToday,
        isFuture: date.getTime() > today.getTime() && !isToday,
        trained,
      };
    });
  }, [monthStart, historyByDate, todayKey, today, liveWorkout]);

  const weekOffsetFor = (target: Date): number => {
    const day = today.getDay();
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    currentMonday.setHours(0, 0, 0, 0);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const targetDay = start.getDay();
    start.setDate(start.getDate() + (targetDay === 0 ? -6 : 1 - targetDay));
    return Math.min(0, Math.round((start.getTime() - currentMonday.getTime()) / (7 * 86_400_000)));
  };

  const sunday = new Date(mondayDate);
  sunday.setDate(mondayDate.getDate() + 6);
  const weekRangeLabel = monthView
    ? monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${mondayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { day: 'numeric' })}`;
  const atPresent = monthView ? monthOffset >= 0 : weekOffset >= 0;

  const selectedDayMeta: DayMeta = useMemo(() => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = selectedDateKey === dateKeyOf(yesterday);
    return {
      offset: Math.round((today.getTime() - selectedDate.getTime()) / 86_400_000),
      dateKey: selectedDateKey,
      dayLabel: isViewingToday ? 'Today' : isYesterday ? 'Yesterday' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' }),
      dayPillLabel: isViewingToday ? 'Today' : isYesterday ? 'Yest' : WEEKDAYS[(selectedDate.getDay() + 6) % 7],
      dateFormatted: selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: isViewingToday,
      isYesterday,
    };
  }, [selectedDate, selectedDateKey, today, isViewingToday]);

  const openEditor = (category: TelemetryCategory, mode: 'create' | 'edit') => {
    tactileEngine.triggerSelectionBuzz();
    setEditor({ category, mode });
  };

  const hasEntry = (category: TelemetryCategory): boolean => {
    if (category === 'workout') return workoutLine(workout) !== '--';
    if (category === 'cardio') {
      const logged = line([part(cardio?.distanceKm, ' km', 1), part(cardio?.durationMinutes, ' min'), part(cardio?.burnedKcal, ' kcal')]);
      return logged !== '--';
    }
    if (category === 'nutrition') return foodLine(food) !== '--';
    if (category === 'sleep') return sleepLine(sleep) !== '--';
    return mindfulLine(mindful) !== '--';
  };

  const removeEntry = (category: TelemetryCategory) => {
    tactileEngine.triggerSelectionBuzz();
    if (category === 'nutrition' && isViewingToday) {
      const fuel = useFuelStore.getState();
      (Object.keys(fuel.meals) as Array<keyof typeof fuel.meals>).forEach((slot) => {
        [...fuel.meals[slot]].forEach((item) => useFuelStore.getState().removeMealItem(slot, item.id));
      });
    }
    if (category === 'workout' && isViewingToday) {
      const loggedKcal = historyByDate[selectedDateKey]?.workout?.burnedKcal ?? 0;
      if (loggedKcal > 0) useFuelStore.getState().logBurned(-loggedKcal);
      useWorkoutStore.getState().clearActiveLog();
      useWorkoutStore.getState().setActiveSession(false);
    }
    if (category === 'cardio' && isViewingToday) {
      const cardioRecord = historyByDate[selectedDateKey]?.cardio;
      const cardioKcal = (cardioRecord?.burnedKcal ?? 0) + (cardioRecord?.stepKcal ?? 0);
      if (cardioKcal > 0) useFuelStore.getState().logBurned(-cardioKcal);
      useTelemetryStore.getState().setStepCount(0);
    }
    markForgotten(selectedDateKey, category);
    useTelemetryHistoryStore.getState().clearDayRecord(selectedDateKey, category);
    void deleteDayLog(selectedDateKey, category);
    if (category === 'workout' || category === 'cardio') forgetPendingArchives(selectedDateKey, category);
    void purgeArchivedDay(selectedDateKey, category);
    setPendingDelete(null);
  };

  const removeLift = (name: string) => {
    setPendingLiftDelete(null);
    const remaining = (workout?.exercises || []).filter((exercise) => exercise.name !== name);
    if (remaining.length === 0) {
      removeEntry('workout');
      return;
    }
    tactileEngine.triggerSelectionBuzz();
    if (isViewingToday) {
      const store = useWorkoutStore.getState();
      const kept = store.exercises.filter((exercise) => (exercise.name || exercise.exerciseName || '') !== name);
      if (kept.length !== store.exercises.length) store.setExercises(kept);
    }
    const saved = historyByDate[selectedDateKey]?.workout;
    if (saved?.hasData) {
      const exercises = (saved.exercises || []).filter((exercise) => exercise.name !== name);
      useTelemetryHistoryStore.getState().updateDayRecord(selectedDateKey, 'workout', {
        ...saved,
        exercises,
        tonnageKg: exercises.reduce((sum, lift) => sum + setWorkKg(knownSets(lift)), 0),
        completedSets: exercises.reduce((sum, lift) => sum + (knownSets(lift).length || lift.sets || 0), 0),
      });
    }
    forgetPendingArchives(selectedDateKey, 'workout', name);
    void purgeArchivedLift(selectedDateKey, name);
  };

  const removeMeal = (index: number) => {
    setPendingMealDelete(null);
    const target = food?.meals?.[index];
    if (!target) return;
    tactileEngine.triggerSelectionBuzz();
    if (isViewingToday && target.slot) {
      const slot = target.slot;
      const item = useFuelStore.getState().meals[slot]?.find((meal) => meal.name === target.name);
      if (item) useFuelStore.getState().removeMealItem(slot, item.id);
    }
    const saved = historyByDate[selectedDateKey]?.nutrition;
    if (saved?.hasData && saved.meals?.length) {
      const savedIndex = saved.meals.findIndex((meal) => meal.name === target.name && meal.slot === target.slot);
      if (savedIndex >= 0) {
        const meals = saved.meals.filter((_, i) => i !== savedIndex);
        const sum = (pick: (meal: (typeof meals)[number]) => number) => Math.round(meals.reduce((total, meal) => total + (pick(meal) || 0), 0) * 10) / 10;
        useTelemetryHistoryStore.getState().updateDayRecord(selectedDateKey, 'nutrition', {
          ...saved,
          meals,
          calories: Math.round(sum((meal) => meal.calories)),
          proteinG: sum((meal) => meal.proteinG),
          carbsG: sum((meal) => meal.carbsG),
          fatsG: sum((meal) => meal.fatsG),
        });
      }
    }
  };

  const formatTower = (category: TelemetryCategory, value: number) => {
    if (value <= 0) return '';
    if (category === 'sleep') return String(Math.round(value * 10) / 10);
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return String(Math.round(value));
  };

  const towerPoints = (category: TelemetryCategory): { points: TowerPoint[]; unit: string; selectedKey: string } => {
    const readDay = (date: Date) => {
      const key = dateKeyOf(date);
      const record = historyByDate[key];
      const isToday = key === todayKey;
      if (category === 'workout') {
        const session = (isToday && liveWorkout) || cleanWorkout(record?.workout);
        return sessionKg(session);
      }
      if (category === 'cardio') {
        const session = cleanCardio(record?.cardio);
        return { minutes: session?.durationMinutes || 0, kcal: session?.burnedKcal || 0 };
      }
      if (category === 'nutrition') {
        const session = (isToday && liveFood) || cleanNutrition(record?.nutrition);
        return session?.calories || 0;
      }
      if (category === 'sleep') return record?.sleep?.hasData ? record.sleep.durationHours || 0 : 0;
      return record?.meditation?.minutes || 0;
    };

    if (chartSpan === 'year') {
      const months = Array.from({ length: 12 }, (_, index) => {
        const start = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
        const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        let value = 0;
        let minutes = 0;
        let kcal = 0;
        for (let dayIndex = 0; dayIndex < daysInMonth; dayIndex += 1) {
          const date = new Date(start);
          date.setDate(start.getDate() + dayIndex);
          const raw = readDay(date);
          if (typeof raw === 'number') value += raw;
          else {
            minutes += raw.minutes;
            kcal += raw.kcal;
          }
        }
        return {
          key: start.toDateString(),
          label: start.toLocaleDateString('en-US', { month: 'short' }),
          value,
          minutes,
          kcal,
        };
      });
      const unit = category === 'workout' ? 'kg' : category === 'nutrition' ? 'kcal' : category === 'sleep' ? 'h' : category === 'meditation' ? 'min' : (months.some((month) => month.minutes > 0) ? 'min' : 'kcal');
      return {
        selectedKey: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toDateString(),
        unit,
        points: months.map((month) => ({
          key: month.key,
          label: month.label,
          value: category === 'cardio' ? (unit === 'min' ? month.minutes : month.kcal) : month.value,
        })),
      };
    }

    if (chartSpan === 'month') {
      const weeks = [3, 2, 1, 0].map((ago) => {
        const start = new Date(mondayDate);
        start.setDate(mondayDate.getDate() - ago * 7);
        let value = 0;
        let minutes = 0;
        let kcal = 0;
        for (let index = 0; index < 7; index += 1) {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          const raw = readDay(date);
          if (typeof raw === 'number') value += raw;
          else {
            minutes += raw.minutes;
            kcal += raw.kcal;
          }
        }
        return {
          key: start.toDateString(),
          label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value,
          minutes,
          kcal,
        };
      });
      const unit = category === 'workout' ? 'kg' : category === 'nutrition' ? 'kcal' : category === 'sleep' ? 'h' : category === 'meditation' ? 'min' : (weeks.some((week) => week.minutes > 0) ? 'min' : 'kcal');
      return {
        selectedKey: mondayDate.toDateString(),
        unit,
        points: weeks.map((week) => ({
          key: week.key,
          label: week.label,
          value: category === 'cardio' ? (unit === 'min' ? week.minutes : week.kcal) : week.value,
        })),
      };
    }

    const days = WEEKDAYS.map((label, index) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      const raw = readDay(date);
      return { key: date.toDateString(), label, raw };
    });
    const unit = category === 'workout' ? 'kg' : category === 'nutrition' ? 'kcal' : category === 'sleep' ? 'h' : category === 'meditation' ? 'min' : (days.some((day) => typeof day.raw === 'object' && day.raw.minutes > 0) ? 'min' : 'kcal');
    return {
      selectedKey: selectedDateStr,
      unit,
      points: days.map((day) => ({
        key: day.key,
        label: day.label,
        value: typeof day.raw === 'number' ? day.raw : (unit === 'min' ? day.raw.minutes : day.raw.kcal),
      })),
    };
  };

  const channels: Array<{
    id: TelemetryCategory;
    title: string;
    /** Null when nothing is logged for this channel on the selected day. */
    headline: Headline | null;
    color: string;
    icon: React.ReactNode;
  }> = [
    { id: 'workout', title: 'Workout', headline: workoutHeadline(workout), color: 'text-o1-olive', icon: <Weight /> },
    { id: 'cardio', title: 'Cardio', headline: cardioHeadline(cardio, isViewingToday ? stepCount : 0), color: 'text-o1-teal', icon: <HeartPulse /> },
    { id: 'nutrition', title: 'Food', headline: foodHeadline(food), color: 'text-o1-slate', icon: <Apple /> },
    { id: 'sleep', title: 'Sleep', headline: sleepHeadline(sleep), color: 'text-o1-iris', icon: <Moon /> },
    { id: 'meditation', title: 'Mindful', headline: mindfulHeadline(mindful), color: 'text-o1-rose', icon: <Brain /> },
  ];
  const loggedChannels = channels.flatMap((channel) => (channel.headline ? [{ ...channel, headline: channel.headline }] : []));
  const tower = towerPoints(towerChannel);
  const ledgerTitle = dayHeading(selectedDate, today);

  const selectTowerKey = (key: string) => {
    if (chartSpan === 'week') {
      setSelectedDateStr(key);
      return;
    }
    const target = new Date(key);
    target.setHours(0, 0, 0, 0);
    const weekday = today.getDay();
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + (weekday === 0 ? -6 : 1 - weekday));
    currentMonday.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - currentMonday.getTime()) / (7 * 86_400_000));
    setWeekOffset(Math.min(0, diff));
    setSelectedDateStr(key);
  };

  const quickActions: LogQuickAction[] = channels.flatMap((channel) => {
    const label = MANUAL_LOG_LABEL[channel.id];
    if (channel.headline || !label) return [];
    return [{ id: channel.id, label, onSelect: () => openEditor(channel.id, 'create') }];
  });
  const rowActionsFor = (category: TelemetryCategory): LedgerRowActions | undefined => {
    if (category === 'workout') {
      return {
        hint: true,
        onEdit: (row) => {
          tactileEngine.triggerSelectionBuzz();
          clearPending();
          setEditor({ category: 'workout', mode: 'edit', lift: row.name });
        },
        onDelete: (row) => {
          clearPending();
          setPendingLiftDelete(row.name);
        },
      };
    }
    const canEdit = hasEntry(category);
    if (!canEdit && !(category === 'cardio' && visibleSteps > 0)) return undefined;
    return {
      hint: true,
      onEdit: canEdit
        ? () => {
            clearPending();
            openEditor(category, 'edit');
          }
        : undefined,
      onDelete: (row) => {
        clearPending();
        const mealIndex = category === 'nutrition' ? Number(row.id.split(':')[1]) : NaN;
        if (Number.isInteger(mealIndex) && (food?.meals?.length ?? 0) > 1) setPendingMealDelete({ index: mealIndex, name: row.name });
        else setPendingDelete(category);
      },
    };
  };

  const confirmButtons = (onCancel: () => void, onConfirm: () => void) => (
    <>
      <button type="button" onClick={onCancel} className="h-8 px-3 rounded-full text-[12px] text-o1-muted hover:text-o1-text cursor-pointer">
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="h-8 px-3 rounded-full bg-[#C4121A] hover:bg-[#A30F16] active:bg-[#800C11] text-[12px] text-white cursor-pointer"
      >
        Delete
      </button>
    </>
  );

  /** Everything inside an open channel row: its entries and delete confirmations. */
  const renderChannelEntries = (category: TelemetryCategory, title: string) => {
    const dayWord = selectedDayMeta.dayLabel.toLowerCase() === 'today' ? "today's" : `${selectedDayMeta.dayLabel}'s`;
    const confirmBox = 'flex items-center gap-2 rounded-xl bg-o1-well border border-[#C4121A]/40 pl-3 pr-1.5 py-1.5';
    return (
      <>
        {pendingDelete === category && (
          <div role="alertdialog" aria-label={`Delete ${title}`} className={confirmBox}>
            <p className="flex-1 min-w-0 text-[12px] text-o1-text leading-snug">
              Delete {dayWord} {title.toLowerCase()}? This action cannot be undone.
            </p>
            {confirmButtons(() => setPendingDelete(null), () => removeEntry(category))}
          </div>
        )}
        <ChannelDetail
          category={category}
          workout={workout}
          cardio={cardio}
          food={food}
          sleep={sleep}
          mindful={mindful}
          steps={visibleSteps}
          rowActions={rowActionsFor(category)}
        />
        {category === 'nutrition' && pendingMealDelete && (
          <div role="alertdialog" aria-label={`Delete ${pendingMealDelete.name}`} className={confirmBox}>
            <p className="flex-1 min-w-0 text-[12px] text-o1-text leading-snug">
              Delete {pendingMealDelete.name}? This action cannot be undone.
            </p>
            {confirmButtons(() => setPendingMealDelete(null), () => removeMeal(pendingMealDelete.index))}
          </div>
        )}
        {category === 'workout' && pendingLiftDelete && (
          <div role="alertdialog" aria-label={`Delete ${pendingLiftDelete}`} className={confirmBox}>
            <p className="flex-1 min-w-0 text-[12px] text-o1-text leading-snug">
              Delete {pendingLiftDelete} from {selectedDayMeta.dayLabel.toLowerCase() === 'today' ? 'today' : selectedDayMeta.dayLabel}? This action cannot be undone.
            </p>
            {confirmButtons(() => setPendingLiftDelete(null), () => removeLift(pendingLiftDelete))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="o1-log space-y-2.5 select-none font-sans">
      <div className="rounded-2xl bg-o1-card border border-white/[0.07] p-3 shadow-sm space-y-2.5 text-neutral-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="o1-mark text-o1-copper">
              <CalendarDays />
            </span>
            <div className="inline-flex bg-o1-well border border-white/[0.07] p-0.5 rounded-full">
              {([false, true] as const).map((month) => (
                <button
                  key={String(month)}
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    if (month) {
                      setMonthOffset((selectedDate.getFullYear() - today.getFullYear()) * 12 + selectedDate.getMonth() - today.getMonth());
                    }
                    setMonthView(month);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${monthView === month ? 'bg-o1-crimson text-white' : 'text-neutral-400'}`}
                >
                  {month ? 'Month' : 'Week'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-neutral-400 mr-1">{weekRangeLabel}</span>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (monthView) setMonthOffset((offset) => offset - 1);
                else setWeekOffset((offset) => offset - 1);
              }}
              className="p-1 rounded-lg bg-white/[0.08] text-neutral-300"
              aria-label={monthView ? 'Previous month' : 'Previous week'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setWeekOffset(0);
                setMonthOffset(0);
                setSelectedDateStr(today.toDateString());
              }}
              className={`px-2.5 py-0.5 rounded-full border text-[11px] ${atPresent ? 'border-[#C4121A]/60 text-o1-text' : 'border-white/[0.14] text-o1-muted hover:text-o1-text'}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (monthView) setMonthOffset((offset) => Math.min(0, offset + 1));
                else setWeekOffset((offset) => Math.min(0, offset + 1));
              }}
              disabled={atPresent}
              className="p-1 rounded-lg bg-white/[0.08] text-neutral-300 disabled:opacity-30"
              aria-label={monthView ? 'Next month' : 'Next week'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {monthView ? (
          <LogMonthGrid
            leading={(monthStart.getDay() + 6) % 7}
            days={monthDays}
            selectedDateStr={selectedDateStr}
            onSelectDate={(dateStr) => {
              setSelectedDateStr(dateStr);
              setWeekOffset(weekOffsetFor(new Date(dateStr)));
              clearPending();
            }}
          />
        ) : (
          <LogWeekStrip
            weekDays={weekDays}
            selectedDateStr={selectedDateStr}
            onSelectDate={(dateStr) => {
              setSelectedDateStr(dateStr);
              clearPending();
            }}
          />
        )}
      </div>

      <div className="rounded-2xl bg-o1-card border border-white/[0.07] overflow-hidden text-neutral-100">
        <button
          type="button"
          aria-expanded={towersOpen}
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setTowersOpen(!towersOpen);
          }}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left bg-transparent border-0 cursor-pointer"
        >
          <span className="text-[14px] font-semibold text-o1-text">Progress</span>
          <span className="flex items-center gap-2 text-[11px] text-o1-muted">
            {channels.find((channel) => channel.id === towerChannel)?.title} · {chartSpan === 'week' ? 'Week' : chartSpan === 'month' ? 'Month' : 'Year'}
            <ChevronDown className={`w-4 h-4 transition-transform ${towersOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
        {towersOpen && (
          <div className="px-3 pb-3">
            <div className="grid grid-cols-5 gap-1" role="group" aria-label="Channel shown in the chart">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  aria-pressed={towerChannel === channel.id}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setTowerChannel(channel.id);
                  }}
                  className={`px-0.5 py-1.5 rounded-full border text-[12px] font-semibold text-center truncate ${
                    towerChannel === channel.id ? 'bg-o1-text text-o1-surface border-o1-text' : 'bg-o1-well border-white/[0.07] text-neutral-200'
                  }`}
                >
                  {channel.title}
                </button>
              ))}
            </div>
            <div className="flex justify-center pt-3">
              <div className="inline-flex bg-o1-well border border-white/[0.07] p-0.5 rounded-full">
                {(['week', 'month', 'year'] as const).map((span) => (
                  <button
                    key={span}
                    type="button"
                    aria-pressed={chartSpan === span}
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setChartSpan(span);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold ${chartSpan === span ? 'bg-o1-crimson text-white' : 'text-neutral-400'}`}
                  >
                    {span === 'week' ? 'Week' : span === 'month' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
            </div>
            <LogProgressTowers
              category={towerChannel}
              points={tower.points}
              unit={tower.unit}
              selectedKey={tower.selectedKey}
              formatValue={(value) => formatTower(towerChannel, value)}
              onSelect={selectTowerKey}
            />
          </div>
        )}

        <div className="border-t border-white/[0.07] px-4 pt-3 pb-2.5 flex items-baseline justify-between gap-2">
          <h3 className="text-[14px] font-semibold text-o1-text">{ledgerTitle}</h3>
          <span className="text-[11px] text-o1-muted">{loggedChannels.length} of {channels.length} logged</span>
        </div>
        {loggedChannels.length === 0 && (
          <p className="px-4 pb-3 text-[12px] text-o1-muted">Nothing is logged for this day yet.</p>
        )}
        {loggedChannels.map((channel) => (
          <LogChannelRow
            key={channel.id}
            title={channel.title}
            icon={channel.icon}
            iconClass={channel.color}
            headline={channel.headline}
            open={openChannel === channel.id}
            onToggle={() => {
              tactileEngine.triggerSelectionBuzz();
              setOpenChannel(openChannel === channel.id ? null : channel.id);
              setPendingDelete(null);
            }}
          >
            {renderChannelEntries(channel.id, channel.title)}
          </LogChannelRow>
        ))}
        <LogStillToLog actions={quickActions} />
      </div>

      <LiftHistoryCard />

      {editor && (
        <LogDayTelemetryModal
          isOpen
          onClose={() => setEditor(null)}
          category={editor.category}
          mode={editor.mode}
          focusLift={editor.lift}
          dayMeta={selectedDayMeta}
          onSaved={showToast}
        />
      )}
    </div>
  );
};

export default GenuineLogHistoryView;
