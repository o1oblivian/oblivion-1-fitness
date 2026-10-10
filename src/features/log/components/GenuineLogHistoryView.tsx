import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Weight,
  HeartPulse,
  Apple,
  Moon,
  Brain,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Camera,
  Pencil,
  Trash2,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import {
  CardioDayRecord,
  DayMeta,
  MeditationDayRecord,
  NutritionDayRecord,
  SleepDayRecord,
  TelemetryCategory,
  WorkoutDayRecord,
  useTelemetryHistoryStore,
} from '../store/useTelemetryHistoryStore';
import { LogDayTelemetryModal } from './LogDayTelemetryModal';
import { CardioConsoleScanModal } from './CardioConsoleScanModal';
import { LogWeekStrip } from './LogWeekStrip';
import { LogProgressTowers, TowerPoint } from './LogProgressTowers';
import { LogLedger } from './LogLedger';
import { deleteDayLog, markForgotten, purgeArchivedDay } from '../services/dayLogService';
import { collapsedReps, collapsedWeight, exerciseFromSets, formatLoad, knownSets, setWorkKg, setsFromExercise } from '../liftLedger';

interface GenuineLogHistoryViewProps {
  onNavigateToWorkout?: () => void;
  onNavigateToFuel?: () => void;
  showToast: (msg: string) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function part(value: number | null | undefined, suffix: string, digits = 0): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  const shown = digits > 0
    ? String(Math.round(value * 10 ** digits) / 10 ** digits)
    : Math.round(value).toLocaleString();
  return `${shown}${suffix}`;
}

function line(parts: Array<string | null>): string {
  const real = parts.filter((item): item is string => Boolean(item));
  return real.length > 0 ? real.join(' · ') : '--';
}

function cleanWorkout(rec?: WorkoutDayRecord): WorkoutDayRecord | undefined {
  if (!rec?.hasData) return undefined;
  const poisoned = rec.durationMinutes === 45 && rec.intensityRpe === 8.5;
  return {
    ...rec,
    durationMinutes: poisoned ? 0 : rec.durationMinutes || 0,
    intensityRpe: poisoned ? 0 : rec.intensityRpe || 0,
  };
}

function cleanCardio(rec?: CardioDayRecord): CardioDayRecord | undefined {
  if (!rec?.hasData) return undefined;
  const stepShadow = /step/i.test(rec.activityType || '') && (rec.avgHeartRateBpm === 135 || rec.avgHeartRateBpm === 142);
  if (stepShadow) {
    return {
      ...rec,
      distanceKm: 0,
      burnedKcal: 0,
      durationMinutes: 0,
      avgHeartRateBpm: 0,
      zone2Minutes: 0,
      activityType: 'Steps',
    };
  }
  const guessedZone = Math.round((rec.durationMinutes || 0) * 0.75);
  const fillerHr = [135, 138, 142].includes(rec.avgHeartRateBpm) && rec.zone2Minutes === guessedZone && guessedZone > 0;
  return {
    ...rec,
    avgHeartRateBpm: fillerHr ? 0 : rec.avgHeartRateBpm || 0,
    zone2Minutes: fillerHr ? 0 : rec.zone2Minutes || 0,
  };
}

function cleanNutrition(rec?: NutritionDayRecord): NutritionDayRecord | undefined {
  if (!rec?.hasData) return undefined;
  const poison = rec.calorieTarget === 2200 && rec.proteinTargetG === 165 && rec.carbsTargetG === 250 && rec.fatsTargetG === 60;
  if (!poison) return rec;
  return { ...rec, calorieTarget: 0, proteinTargetG: 0, carbsTargetG: 0, fatsTargetG: 0 };
}

function sessionKg(rec?: WorkoutDayRecord): number {
  const fromSets = (rec?.exercises || []).reduce((sum, lift) => sum + setWorkKg(knownSets(lift)), 0);
  if (fromSets > 0) return fromSets;
  return rec?.tonnageKg || 0;
}

function workoutLine(rec?: WorkoutDayRecord): string {
  if (!rec?.hasData) return '--';
  return line([
    part(sessionKg(rec), ' kg'),
    part(rec.completedSets, ' sets'),
    part(rec.durationMinutes, ' min'),
  ]);
}

function cardioLine(rec?: CardioDayRecord, steps = 0): string {
  const logged = line([
    part(rec?.distanceKm, ' km', 1),
    part(rec?.durationMinutes, ' min'),
    part(rec?.burnedKcal, ' kcal'),
  ]);
  if (logged !== '--') return logged;
  return part(rec?.steps || steps, ' steps') || '--';
}

function foodLine(rec?: NutritionDayRecord): string {
  return part(rec?.calories, ' kcal') || '--';
}

function sleepLine(rec?: SleepDayRecord): string {
  return line([
    part(rec?.durationHours, ' h', 1),
    part(rec?.recoveryPercent, '% recovery'),
  ]);
}

function mindfulLine(rec?: MeditationDayRecord): string {
  return part(rec?.minutes, ' min') || '--';
}

export const GenuineLogHistoryView: React.FC<GenuineLogHistoryViewProps> = ({
  onNavigateToWorkout,
  onNavigateToFuel,
  showToast,
}) => {
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
  const [selectedDateStr, setSelectedDateStr] = useState(today.toDateString());
  const [openChannel, setOpenChannel] = useState<TelemetryCategory | null>(null);
  const [chartChannel, setChartChannel] = useState<TelemetryCategory | null>(null);
  const [chartSpan, setChartSpan] = useState<'week' | 'month' | 'year'>('week');
  const [editor, setEditor] = useState<{ category: TelemetryCategory; mode: 'create' | 'edit' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TelemetryCategory | null>(null);
  const [isConsoleScanOpen, setIsConsoleScanOpen] = useState(false);

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
    if (lifts.length === 0 && sessionTonnageKg <= 0 && completedSetsCount <= 0) return undefined;
    return {
      hasData: true,
      tonnageKg: sessionTonnageKg,
      completedSets: completedSetsCount,
      durationMinutes: 0,
      routineName: activeRoutineTitle || '',
      intensityRpe: 0,
      exercises: lifts
        .map((exercise) => exerciseFromSets(
          exercise.name || exercise.exerciseName || 'Exercise',
          setsFromExercise(exercise),
          (exercise.sets || []).some((set) => set.completed),
        ))
        .filter((entry) => (entry.setLog?.length || 0) > 0),
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

  const weekDays = useMemo(() => {
    return WEEKDAYS.map((dayName, index) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      const key = dateKeyOf(date);
      const record = historyByDate[key];
      const isToday = key === todayKey;
      const hasActivity = Boolean(
        record?.workout?.hasData ||
        record?.cardio?.hasData ||
        record?.nutrition?.hasData ||
        record?.sleep?.hasData ||
        (record?.meditation?.minutes || 0) > 0 ||
        (isToday && (liveWorkout || liveFood || stepCount > 0)),
      );
      return {
        dayName,
        dayNum: date.getDate(),
        dateStr: date.toDateString(),
        dateKey: key,
        isToday,
        hasActivity,
      };
    });
  }, [mondayDate, historyByDate, todayKey, liveWorkout, liveFood, stepCount]);

  const sunday = new Date(mondayDate);
  sunday.setDate(mondayDate.getDate() + 6);
  const weekRangeLabel = `${mondayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { day: 'numeric' })}`;

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
    if (pendingDelete !== category) {
      tactileEngine.triggerSelectionBuzz();
      setPendingDelete(category);
      return;
    }
    tactileEngine.triggerSelectionBuzz();
    if (category === 'nutrition' && isViewingToday) {
      const fuel = useFuelStore.getState();
      (Object.keys(fuel.meals) as Array<keyof typeof fuel.meals>).forEach((slot) => {
        [...fuel.meals[slot]].forEach((item) => useFuelStore.getState().removeMealItem(slot, item.id));
      });
    }
    if (category === 'workout' && isViewingToday) {
      useWorkoutStore.getState().clearActiveLog();
      useWorkoutStore.getState().setActiveSession(false);
    }
    markForgotten(selectedDateKey, category);
    useTelemetryHistoryStore.getState().clearDayRecord(selectedDateKey, category);
    void deleteDayLog(selectedDateKey, category);
    void purgeArchivedDay(selectedDateKey, category);
    setPendingDelete(null);
    showToast('Removed');
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
    summary: string;
    color: string;
    icon: React.ReactNode;
  }> = [
    { id: 'workout', title: 'Workout', summary: workoutLine(workout), color: 'text-o1-olive', icon: <Weight /> },
    { id: 'cardio', title: 'Cardio', summary: cardioLine(cardio, isViewingToday ? stepCount : 0), color: 'text-o1-teal', icon: <HeartPulse /> },
    { id: 'nutrition', title: 'Food', summary: foodLine(food), color: 'text-o1-slate', icon: <Apple /> },
    { id: 'sleep', title: 'Sleep', summary: sleepLine(sleep), color: 'text-o1-iris', icon: <Moon /> },
    { id: 'meditation', title: 'Mindful', summary: mindfulLine(mindful), color: 'text-o1-rose', icon: <Brain /> },
  ];

  return (
    <div className="o1-log space-y-2.5 select-none font-sans">
      <div className="rounded-2xl bg-o1-card border border-white/[0.07] p-3 shadow-sm space-y-2.5 text-neutral-100">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="o1-mark text-o1-copper">
              <CalendarDays />
            </span>
            <span className="text-sm font-semibold text-white">Week</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-neutral-400 mr-1">{weekRangeLabel}</span>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setWeekOffset((offset) => offset - 1);
              }}
              className="p-1 rounded-lg bg-white/[0.08] text-neutral-300"
              aria-label="Previous week"
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
              className={`px-2 py-0.5 rounded-xl text-[10px] font-semibold ${weekOffset === 0 ? 'bg-white text-neutral-950' : 'bg-white/[0.08] text-neutral-400'}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setWeekOffset((offset) => Math.min(0, offset + 1));
              }}
              disabled={weekOffset >= 0}
              className="p-1 rounded-lg bg-white/[0.08] text-neutral-300 disabled:opacity-30"
              aria-label="Next week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <LogWeekStrip
          weekDays={weekDays}
          selectedDateStr={selectedDateStr}
          onSelectDate={(dateStr) => setSelectedDateStr(dateStr)}
          selectedDayMeta={selectedDayMeta}
        />
      </div>

      <div className="space-y-2">
        {channels.map((channel) => {
          const open = openChannel === channel.id;
          return (
            <div key={channel.id} className="rounded-2xl bg-o1-card border border-white/[0.07] overflow-hidden">
              <div className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between text-left gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setOpenChannel(open ? null : channel.id);
                    setPendingDelete(null);
                  }}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 p-0"
                >
                  <span className={`o1-mark ${channel.color}`}>{channel.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white">{channel.title}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{channel.summary}</div>
                  </div>
                </button>
                <span className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setChartChannel(chartChannel === channel.id ? null : channel.id);
                    }}
                    className={`o1-pill border text-[11px] font-semibold ${chartChannel === channel.id ? 'bg-white text-neutral-950 border-white' : 'bg-o1-well border-white/[0.07] text-neutral-200'}`}
                  >
                    Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setOpenChannel(open ? null : channel.id);
                      setPendingDelete(null);
                    }}
                    className="bg-transparent border-0 p-1 text-neutral-500"
                    aria-label={open ? 'Close log' : 'Open log'}
                  >
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </span>
              </div>
              {chartChannel === channel.id && (
                <div className="px-3 pb-3 border-t border-white/[0.05]">
                  <div className="flex justify-center pt-2">
                    <div className="inline-flex bg-o1-well border border-white/[0.07] p-0.5 rounded-full">
                      {(['week', 'month', 'year'] as const).map((span) => (
                        <button
                          key={span}
                          type="button"
                          onClick={() => {
                            tactileEngine.triggerSelectionBuzz();
                            setChartSpan(span);
                          }}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold ${chartSpan === span ? 'bg-white text-neutral-950' : 'text-neutral-400'}`}
                        >
                          {span === 'week' ? 'Week' : span === 'month' ? 'Month' : 'Year'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LogProgressTowers
                    category={channel.id}
                    points={towerPoints(channel.id).points}
                    unit={towerPoints(channel.id).unit}
                    selectedKey={towerPoints(channel.id).selectedKey}
                    formatValue={(value) => formatTower(channel.id, value)}
                    onSelect={(key) => {
                      if (chartSpan === 'week') {
                        setSelectedDateStr(key);
                        return;
                      }
                      const target = new Date(key);
                      const day = today.getDay();
                      const mondayOffset = day === 0 ? -6 : 1 - day;
                      const currentMonday = new Date(today);
                      currentMonday.setDate(today.getDate() + mondayOffset);
                      currentMonday.setHours(0, 0, 0, 0);
                      target.setHours(0, 0, 0, 0);
                      const diff = Math.round((target.getTime() - currentMonday.getTime()) / (7 * 86_400_000));
                      setWeekOffset(Math.min(0, diff));
                      setSelectedDateStr(key);
                    }}
                  />
                </div>
              )}
              {open && (
                <div className="px-3 pb-3 space-y-2.5 border-t border-white/[0.05]">
                  <ChannelDetail
                    category={channel.id}
                    workout={workout}
                    cardio={cardio}
                    food={food}
                    sleep={sleep}
                    mindful={mindful}
                    steps={isViewingToday ? stepCount : cardio?.steps || 0}
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    {(channel.id === 'sleep' || channel.id === 'meditation') && !hasEntry(channel.id) && (
                      <button type="button" onClick={() => openEditor(channel.id, 'create')} className="o1-pill bg-o1-well border border-white/[0.07] text-neutral-200 text-xs font-semibold">
                        <Plus className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Log</span>
                      </button>
                    )}
                    {hasEntry(channel.id) && (
                      <button type="button" onClick={() => openEditor(channel.id, 'edit')} className="o1-pill bg-o1-well border border-white/[0.07] text-neutral-200 text-xs font-semibold">
                        <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Edit</span>
                      </button>
                    )}
                    {hasEntry(channel.id) && (
                      <button type="button" onClick={() => removeEntry(channel.id)} className="o1-pill bg-o1-well border border-white/[0.07] text-neutral-200 text-xs font-semibold">
                        <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{pendingDelete === channel.id ? 'Remove' : 'Delete'}</span>
                      </button>
                    )}
                    {channel.id === 'cardio' && (
                      <button type="button" onClick={() => setIsConsoleScanOpen(true)} className="o1-pill bg-o1-well border border-white/[0.07] text-neutral-200 text-xs font-semibold">
                        <Camera className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Scan</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editor && (
        <LogDayTelemetryModal
          isOpen
          onClose={() => setEditor(null)}
          category={editor.category}
          mode={editor.mode}
          dayMeta={selectedDayMeta}
          onSaved={showToast}
        />
      )}
      <CardioConsoleScanModal
        isOpen={isConsoleScanOpen}
        onClose={() => setIsConsoleScanOpen(false)}
        dateKey={selectedDateKey}
        onSynced={showToast}
      />
    </div>
  );
};

function sheetFig(value: number | null | undefined, digits = 0): string {
  return part(value, '', digits) || '--';
}

function ChannelDetail({
  category,
  workout,
  cardio,
  food,
  sleep,
  mindful,
  steps,
}: {
  category: TelemetryCategory;
  workout?: WorkoutDayRecord;
  cardio?: CardioDayRecord;
  food?: NutritionDayRecord;
  sleep?: SleepDayRecord;
  mindful?: MeditationDayRecord;
  steps: number;
}) {
  if (category === 'workout') {
    if (!workout?.hasData) return <EmptyCopy>No workout logged for this day.</EmptyCopy>;
    const exercises = workout.exercises || [];
    const rows = exercises.length > 0
      ? exercises.map((exercise, index) => {
          const setLog = knownSets(exercise);
          return {
            id: `${exercise.name}-${index}`,
            name: exercise.name || 'Lift',
            cells: [
              setLog.length > 0 ? String(setLog.length) : sheetFig(exercise.sets),
              collapsedReps(setLog, exercise.reps),
              collapsedWeight(setLog, exercise.weightKg),
            ],
            details: setLog.length > 1
              ? setLog.map((set, setIndex) => ({
                  id: `${exercise.name}-${index}-${setIndex}`,
                  name: String(setIndex + 1),
                  cells: ['', sheetFig(set.reps), formatLoad(set.weightKg)],
                }))
              : undefined,
          };
        })
      : [{
          id: 'session',
          name: workout.routineName || 'Workout',
          cells: [sheetFig(workout.completedSets), '--', sheetFig(workout.tonnageKg)],
        }];
    return (
      <LogLedger
        nameLabel="Lift"
        columns={[{ label: 'Sets', width: '2.5rem' }, { label: 'Reps', width: '3.25rem' }, { label: 'kg', width: '4.75rem' }]}
        rows={rows}
      />
    );
  }

  if (category === 'cardio') {
    const logged = line([
      part(cardio?.distanceKm, ' km', 1),
      part(cardio?.durationMinutes, ' min'),
      part(cardio?.burnedKcal, ' kcal'),
    ]);
    if (logged === '--' && steps > 0) {
      return (
        <LogLedger
          nameLabel="Day"
          columns={[{ label: 'steps', width: '4.5rem' }]}
          rows={[{ id: 'steps', name: 'Steps', cells: [steps.toLocaleString()] }]}
        />
      );
    }
    const summary = cardioLine(cardio, steps);
    if (summary === '--') return <EmptyCopy>No cardio logged for this day.</EmptyCopy>;
    const name = cardio?.activityType && cardio.activityType !== 'Steps' ? cardio.activityType : 'Cardio';
    return (
      <LogLedger
        nameLabel="Session"
        columns={[{ label: 'km', width: '3rem' }, { label: 'min', width: '3rem' }, { label: 'kcal', width: '3.25rem' }]}
        rows={[{
          id: 'cardio',
          name,
          cells: [sheetFig(cardio?.distanceKm, 1), sheetFig(cardio?.durationMinutes), sheetFig(cardio?.burnedKcal)],
        }]}
      />
    );
  }

  if (category === 'nutrition') {
    if (!food?.hasData || (food.calories <= 0 && (food.meals || []).length === 0)) return <EmptyCopy>No food logged for this day.</EmptyCopy>;
    const meals = food.meals || [];
    const rows = meals.length > 0
      ? meals.map((meal, index) => ({
          id: `${meal.name}-${index}`,
          name: meal.name || 'Meal',
          cells: [sheetFig(meal.calories), sheetFig(meal.proteinG, 1), sheetFig(meal.carbsG, 1), sheetFig(meal.fatsG, 1)],
        }))
      : [{
          id: 'day',
          name: 'Day',
          cells: [sheetFig(food.calories), sheetFig(food.proteinG, 1), sheetFig(food.carbsG, 1), sheetFig(food.fatsG, 1)],
        }];
    return (
      <LogLedger
        nameLabel="Meal"
        columns={[
          { label: 'kcal', width: '3.25rem' },
          { label: 'P', width: '2.25rem' },
          { label: 'C', width: '2.25rem' },
          { label: 'F', width: '2.25rem' },
        ]}
        rows={rows}
      />
    );
  }

  if (category === 'sleep') {
    if (sleepLine(sleep) === '--') return <EmptyCopy>No sleep logged for this day.</EmptyCopy>;
    return (
      <LogLedger
        nameLabel="Rest"
        columns={[{ label: 'h', width: '3rem' }, { label: '%', width: '3rem' }]}
        rows={[{
          id: 'sleep',
          name: 'Sleep',
          cells: [sheetFig(sleep?.durationHours, 1), sheetFig(sleep?.recoveryPercent)],
        }]}
      />
    );
  }

  if (mindfulLine(mindful) === '--') return <EmptyCopy>No mindful session logged for this day.</EmptyCopy>;
  const mindfulName = [mindful?.protocol, mindful?.coherence].filter(Boolean).join(' · ') || 'Mindful';
  return (
    <LogLedger
      nameLabel="Session"
      columns={[{ label: 'min', width: '3rem' }]}
      rows={[{ id: 'mindful', name: mindfulName, cells: [sheetFig(mindful?.minutes)] }]}
    />
  );
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="pt-2 text-[11px] text-neutral-500">{children}</p>;
}

export default GenuineLogHistoryView;
