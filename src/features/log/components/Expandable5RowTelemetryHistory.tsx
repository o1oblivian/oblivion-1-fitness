import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Activity,
  Apple,
  Moon,
  Sparkles,
  Plus,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Flame,
  Zap,
  Camera,
} from 'lucide-react';
import {
  TelemetryCategory,
  getPast5Days,
  getPastDays,
  useTelemetryHistoryStore,
  WorkoutDayRecord,
  CardioDayRecord,
  NutritionDayRecord,
  SleepDayRecord,
  MeditationDayRecord,
  DayMeta,
} from '../store/useTelemetryHistoryStore';
import { tactileEngine } from '../../../services/tactileEngine';
import { LogDayTelemetryModal } from './LogDayTelemetryModal';
import { CardioConsoleScanModal } from './CardioConsoleScanModal';
import { useTelemetryStore } from '../../telemetry/store/useTelemetryStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';

interface Expandable5RowTelemetryHistoryProps {
  category: TelemetryCategory;
  timeframe?: '7D' | '30D' | '1Y';
  onNavigateToWorkout?: () => void;
  onNavigateToFuel?: () => void;
  showToast?: (msg: string) => void;
}

// Helper to format macro numbers cleanly without IEEE floating point artefacts (e.g., 6.1000000000000005 -> 6.1)
const formatMacro = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Math.round(val * 10) / 10;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
};

export const Expandable5RowTelemetryHistory: React.FC<Expandable5RowTelemetryHistoryProps> = ({
  category,
  timeframe = '7D',
  onNavigateToWorkout,
  onNavigateToFuel,
  showToast,
}) => {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const clearDayRecord = useTelemetryHistoryStore((s) => s.clearDayRecord);

  // Live store subscriptions for today reactive telemetry
  const liveSteps = useTelemetryStore((s) => s.stepCount);
  const liveMeals = useFuelStore((s) => s.meals);
  const liveTonnage = useWorkoutStore((s) => s.sessionTonnageKg);
  const liveCompletedSets = useWorkoutStore((s) => s.completedSetsCount);

  const liveMealItems = Object.values(liveMeals || {}).flat();
  const liveCalories = Math.round(liveMealItems.reduce((acc, m) => acc + (m.calories || 0), 0));
  const liveProtein = Math.round(liveMealItems.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10;
  const liveCarbs = Math.round(liveMealItems.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10;
  const liveFats = Math.round(liveMealItems.reduce((acc, m) => acc + (m.fats || 0), 0) * 10) / 10;

  // Compute days based on timeframe (7D or 30D)
  const is30D = timeframe === '30D' || timeframe === '1Y';
  const daysCount = is30D ? 30 : 7;
  const historyDays = useMemo(() => getPastDays(daysCount), [daysCount]);

  // For 30D view: option to filter only days with data or show all
  const [filterMode, setFilterMode] = useState<'withData' | 'all'>('withData');

  // Expanded row state (key: dateKey, value: boolean)
  const [expandedDateKeys, setExpandedDateKeys] = useState<Record<string, boolean>>({
    [historyDays[0]?.dateKey || '']: false,
  });

  // Modal state for quick logging/editing
  const [modalDay, setModalDay] = useState<DayMeta | null>(null);
  const [scanConsoleDay, setScanConsoleDay] = useState<DayMeta | null>(null);

  const toggleRow = (dateKey: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExpandedDateKeys((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  // Determine category visual styling and icons
  const getCategoryMeta = () => {
    switch (category) {
      case 'workout':
        return {
          title: 'WORKOUT ADHERENCE',
          icon: <Dumbbell className="w-3.5 h-3.5" />,
          activeColor: 'text-o1-crimson',
          activeBg: 'bg-o1-crimson',
          pillBg: 'bg-red-950/30 border-red-900/40 text-red-400',
          accentBorder: 'border-red-900/40',
        };
      case 'cardio':
        return {
          title: 'AEROBIC CONSISTENCY',
          icon: <Activity className="w-3.5 h-3.5" />,
          activeColor: 'text-sky-400',
          activeBg: 'bg-sky-600',
          pillBg: 'bg-sky-950/30 border-sky-900/40 text-sky-300',
          accentBorder: 'border-sky-900/40',
        };
      case 'nutrition':
        return {
          title: 'NUTRITION CONSISTENCY',
          icon: <Apple className="w-3.5 h-3.5" />,
          activeColor: 'text-amber-400',
          activeBg: 'bg-amber-600',
          pillBg: 'bg-amber-950/30 border-amber-900/40 text-amber-300',
          accentBorder: 'border-amber-900/40',
        };
      case 'sleep':
        return {
          title: 'CIRCADIAN RECOVERY',
          icon: <Moon className="w-3.5 h-3.5" />,
          activeColor: 'text-sky-400',
          activeBg: 'bg-sky-600',
          pillBg: 'bg-sky-950/30 border-sky-900/40 text-sky-300',
          accentBorder: 'border-sky-900/40',
        };
      case 'meditation':
        return {
          title: 'MINDFUL COHERENCE',
          icon: <Sparkles className="w-3.5 h-3.5" />,
          activeColor: 'text-emerald-400',
          activeBg: 'bg-emerald-600',
          pillBg: 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300',
          accentBorder: 'border-emerald-900/40',
        };
    }
  };

  const meta = getCategoryMeta();

  // Helper to get effective record for a day (incorporating live store fallback for today)
  const getEffectiveRecord = (dayMeta: DayMeta) => {
    const raw = historyByDate[dayMeta.dateKey]?.[category];
    if (!dayMeta.isToday) return raw;

    if (category === 'cardio') {
      const cRaw = raw as CardioDayRecord | undefined;
      if (liveSteps > 0 && (!cRaw || !cRaw.hasData || (cRaw.distanceKm === 0 && cRaw.burnedKcal === 0))) {
        const dist = Number((liveSteps / 1300).toFixed(1));
        const burn = Math.round(liveSteps * 0.04);
        const dur = Math.max(1, Math.round(liveSteps / 100));
        return {
          hasData: true,
          distanceKm: dist,
          burnedKcal: burn,
          durationMinutes: dur,
          avgHeartRateBpm: 135,
          zone2Minutes: Math.round(dur * 0.75),
          activityType: 'Daily Steps / Cardio',
        } as CardioDayRecord;
      }
    } else if (category === 'nutrition') {
      const nRaw = raw as NutritionDayRecord | undefined;
      if (liveCalories > 0 && (!nRaw || !nRaw.hasData || (nRaw.calories === 0 && nRaw.proteinG === 0))) {
        return {
          hasData: true,
          calories: liveCalories,
          calorieTarget: 2200,
          proteinG: liveProtein,
          proteinTargetG: 165,
          carbsG: liveCarbs,
          carbsTargetG: 250,
          fatsG: liveFats,
          fatsTargetG: 60,
          meals: liveMealItems.map((m) => ({
            name: m.name,
            category: 'Lunch',
            calories: m.calories,
            proteinG: m.protein,
            carbsG: m.carbs,
            fatsG: m.fats,
          })),
        } as NutritionDayRecord;
      }
    } else if (category === 'workout') {
      const wRaw = raw as WorkoutDayRecord | undefined;
      if ((liveTonnage > 0 || liveCompletedSets > 0) && (!wRaw || !wRaw.hasData)) {
        return {
          hasData: true,
          tonnageKg: liveTonnage,
          completedSets: liveCompletedSets,
          durationMinutes: Math.max(30, liveCompletedSets * 3),
          routineName: 'Active Workout',
          intensityRpe: 8.5,
          exercises: [],
        } as WorkoutDayRecord;
      }
    }

    return raw;
  };

  // Calculate consistency percentage across historyDays
  const completedDaysCount = historyDays.filter((d: DayMeta) => {
    const dayRecord = getEffectiveRecord(d);
    return dayRecord && dayRecord.hasData;
  }).length;

  const consistencyPercent = Math.round((completedDaysCount / historyDays.length) * 100);

  // For 30D view: filter days to show logged sessions + today/yesterday or all 30 days
  const displayedDays = useMemo(() => {
    if (!is30D || filterMode === 'all') return historyDays;
    return historyDays.filter((d: DayMeta) => {
      const rec = getEffectiveRecord(d);
      return Boolean((rec && rec.hasData) || d.isToday || d.isYesterday);
    });
  }, [historyDays, is30D, filterMode, historyByDate, liveSteps, liveCalories, liveTonnage]);

  // Render row summary text based on category
  const getRowSummary = (dayMeta: DayMeta) => {
    const record = getEffectiveRecord(dayMeta);

    if (!record || !record.hasData) {
      switch (category) {
        case 'workout':
          return { primary: '0 kg', secondary: '0 sets' };
        case 'cardio':
          return { primary: '0.0 km', secondary: '0 kcal' };
        case 'nutrition':
          return { primary: '0 cal', secondary: '0g P' };
        case 'sleep':
          return { primary: '--:--', secondary: '--%' };
        case 'meditation':
          return { primary: '0 min', secondary: 'Alpha Wave' };
      }
    }

    switch (category) {
      case 'workout': {
        const r = record as WorkoutDayRecord;
        return {
          primary: `${(r.tonnageKg || 0).toLocaleString()} kg`,
          secondary: `${r.completedSets || 0} sets`,
        };
      }
      case 'cardio': {
        const r = record as CardioDayRecord;
        return {
          primary: `${r.distanceKm || 0} km`,
          secondary: `${r.burnedKcal || 0} kcal`,
        };
      }
      case 'nutrition': {
        const r = record as NutritionDayRecord;
        return {
          primary: `${r.calories || 0} cal`,
          secondary: `${r.proteinG || 0}g P`,
        };
      }
      case 'sleep': {
        const r = record as SleepDayRecord;
        return {
          primary: `${r.durationHours || 0}h`,
          secondary: `${r.recoveryPercent || 0}%`,
        };
      }
      case 'meditation': {
        const r = record as MeditationDayRecord;
        return {
          primary: `${r.minutes || 0} min`,
          secondary: r.coherence || 'Alpha Wave',
        };
      }
    }
  };

  return (
    <div className="rounded-2xl bg-o1-card border border-white/[0.07] p-2.5 shadow-sm space-y-2.5 text-white font-mono select-none">
      {/* 1. CONSISTENCY HEADER & INDICATOR TRACK */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">◎</span>
            <span className="font-bold text-xs uppercase tracking-wider text-neutral-300">
              {is30D ? `${meta.title} (30-DAY LOG HISTORY)` : meta.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-500">
              {completedDaysCount}/{historyDays.length} Logged
            </span>
            <span
              className={`text-xs font-bold font-mono tracking-wider ${
                consistencyPercent > 0 ? meta.activeColor : 'text-neutral-500'
              }`}
            >
              {consistencyPercent}%
            </span>
          </div>
        </div>

        {/* 30D Filter Mode switch if in 30D */}
        {is30D && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-neutral-500 font-sans">
              Showing {displayedDays.length} dates &amp; sessions:
            </span>
            <div className="inline-flex items-center bg-o1-well border border-white/[0.07] p-0.5 rounded-xl text-[10px]">
              <button
                type="button"
                onClick={() => setFilterMode('withData')}
                className={`px-2 py-0.5 rounded-xl transition-colors cursor-pointer ${
                  filterMode === 'withData'
                    ? 'bg-white text-neutral-900 font-bold'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                Logged ({completedDaysCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded-xl transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-neutral-900 font-bold'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                All 30 Days
              </button>
            </div>
          </div>
        )}

        {/* 7-day pill indicators: [ TO ] [ YE ] [ MO ] [ SU ] [ SA ] ... */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {historyDays.slice(0, 7).map((d: DayMeta) => {
            const eff = getEffectiveRecord(d);
            const hasData = Boolean(eff && eff.hasData);

            return (
              <div key={d.dateKey} className="flex flex-col items-center gap-1">
                {/* Horizontal Bar Indicator */}
                <div
                  className={`w-full h-2 rounded-full transition-all duration-300 ${
                    hasData
                      ? `${meta.activeBg} shadow-xs`
                      : 'bg-white/[0.08]'
                  }`}
                />
                <span className="text-[9px] font-bold text-neutral-400 tracking-wider">
                  {d.dayPillLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. THE CLEAN EXPANDABLE HISTORY LIST */}
      <div className="divide-y divide-white/[0.05] border-t border-white/[0.05] pt-1">
        {displayedDays.map((dayMeta: DayMeta) => {
          const isExpanded = Boolean(expandedDateKeys[dayMeta.dateKey]);
          const record = getEffectiveRecord(dayMeta);
          const hasData = Boolean(record && record.hasData);
          const summary = getRowSummary(dayMeta);

          return (
            <div key={dayMeta.dateKey} className="py-2.5 first:pt-2 last:pb-1">
              {/* Row Header (Clickable) */}
              <button
                type="button"
                onClick={() => toggleRow(dayMeta.dateKey)}
                className="w-full flex items-center justify-between text-left group cursor-pointer hover:bg-white/[0.06] rounded-xl px-2 py-1.5 -mx-2 transition-colors active:scale-[0.99]"
              >
                {/* Left Side: Category Icon + Day Label */}
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      hasData ? meta.activeColor : 'text-neutral-500 group-hover:text-neutral-400'
                    }`}
                  >
                    {meta.icon}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200 group-hover:text-white">
                      {dayMeta.dayLabel}
                    </span>

                    <span className="text-[10px] text-neutral-500 font-normal">
                      {dayMeta.dateFormatted}
                    </span>
                  </div>
                </div>

                {/* Right Side: Key Values + Chevron */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-200">
                      {summary.primary}
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      {summary.secondary}
                    </span>
                  </div>

                  <div className="text-neutral-500 group-hover:text-neutral-300 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expandable Content for this Day */}
              {isExpanded && (
                <div className="mt-2.5 p-3 sm:p-4 rounded-xl bg-white/[0.03] space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* Category-Specific Detailed Metrics */}
                  {category === 'workout' && (
                    <div className="space-y-2.5">
                      {hasData ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white font-bold">
                              {(record as WorkoutDayRecord).routineName || 'Resistance Session'}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {(record as WorkoutDayRecord).durationMinutes || 45} min duration
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Tonnage</span>
                              <span className="font-bold text-o1-crimson">
                                {((record as WorkoutDayRecord).tonnageKg || 0).toLocaleString()} kg
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Sets Done</span>
                              <span className="font-bold text-white">
                                {(record as WorkoutDayRecord).completedSets || 0}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">RPE</span>
                              <span className="font-bold text-amber-400">
                                {(record as WorkoutDayRecord).intensityRpe || 8.5}
                              </span>
                            </div>
                          </div>

                          {/* Exercises listed */}
                          {(record as WorkoutDayRecord).exercises?.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {(record as WorkoutDayRecord).exercises.map((ex, i) => (
                                <div
                                  key={i}
                                  className="p-2 rounded-xl bg-white/[0.03] flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson" />
                                    <span className="text-neutral-200 font-semibold">{ex.name}</span>
                                  </div>
                                  <span className="text-[10px] text-neutral-400">
                                    {ex.sets} sets × {ex.reps} reps ({ex.weightKg}kg)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-3 text-center space-y-2">
                          <p className="text-xs font-tactical font-black uppercase tracking-wider text-white">
                            NO SESSIONS REGISTERED • SELECT A ROUTINE TO BEGIN RECORDING
                          </p>
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setModalDay(dayMeta)}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Log for {dayMeta.dayLabel}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {category === 'cardio' && (
                    <div className="space-y-2.5">
                      {hasData ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-sky-400 font-bold">
                              {(record as CardioDayRecord).activityType || 'Cardio Console'}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {(record as CardioDayRecord).durationMinutes || 0} min duration
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Distance</span>
                              <span className="font-bold text-sky-400">
                                {(record as CardioDayRecord).distanceKm || 0} km
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Burned</span>
                              <span className="font-bold text-amber-400">
                                {(record as CardioDayRecord).burnedKcal || 0} kcal
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Avg HR</span>
                              <span className="font-bold text-white">
                                {(record as CardioDayRecord).avgHeartRateBpm || 135} bpm
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center space-y-2">
                          <p className="text-xs text-neutral-500">
                            No cardio telemetry recorded for {dayMeta.dayLabel.toLowerCase()}.
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                tactileEngine.triggerSelectionBuzz();
                                setScanConsoleDay(dayMeta);
                              }}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs"
                            >
                              <Camera className="w-3.5 h-3.5 text-black" />
                              <span>Scan Console</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalDay(dayMeta)}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Manual Log</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {category === 'nutrition' && (
                    <div className="space-y-2.5">
                      {hasData ? (
                        <>
                          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                            <div className="p-1.5 rounded-xl bg-white/[0.03]">
                              <span className="text-[8px] text-neutral-500 uppercase block">Calories</span>
                              <span className="font-bold text-amber-400">
                                {Math.round((record as NutritionDayRecord).calories || 0)}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.03]">
                              <span className="text-[8px] text-neutral-500 uppercase block">Protein</span>
                              <span className="font-bold text-sky-400">
                                {formatMacro((record as NutritionDayRecord).proteinG)}g
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.03]">
                              <span className="text-[8px] text-neutral-500 uppercase block">Carbs</span>
                              <span className="font-bold text-white">
                                {formatMacro((record as NutritionDayRecord).carbsG)}g
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.03]">
                              <span className="text-[8px] text-neutral-500 uppercase block">Fats</span>
                              <span className="font-bold text-white">
                                {formatMacro((record as NutritionDayRecord).fatsG)}g
                              </span>
                            </div>
                          </div>

                          {(record as NutritionDayRecord).meals?.length > 0 && (
                            <div className="space-y-1 pt-1">
                              {(record as NutritionDayRecord).meals.map((m, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-xl bg-white/[0.03] flex items-center justify-between text-xs"
                                >
                                  <span className="text-neutral-200 font-semibold">{m.name}</span>
                                  <span className="text-[10px] text-amber-400">
                                    {m.calories} kcal · {formatMacro(m.proteinG)}g P
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-2 text-center space-y-2">
                          <p className="text-xs text-neutral-500">
                            No itemized meals recorded for {dayMeta.dayLabel.toLowerCase()}.
                          </p>
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setModalDay(dayMeta)}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Log for {dayMeta.dayLabel}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {category === 'sleep' && (
                    <div className="space-y-2.5">
                      {hasData ? (
                        <>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Duration</span>
                              <span className="font-bold text-sky-400">
                                {(record as SleepDayRecord).durationHours || 0}h
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Recovery</span>
                              <span className="font-bold text-emerald-400">
                                {(record as SleepDayRecord).recoveryPercent || 0}%
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Resting HR</span>
                              <span className="font-bold text-white">
                                {(record as SleepDayRecord).restingHeartRate || 52} bpm
                              </span>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-white/[0.03] flex justify-between text-[11px] text-neutral-400">
                            <span>Deep Sleep: {(record as SleepDayRecord).deepSleepMinutes || 90}m</span>
                            <span>REM Sleep: {(record as SleepDayRecord).remSleepMinutes || 105}m</span>
                            <span>Efficiency: {(record as SleepDayRecord).sleepEfficiencyPercent || 94}%</span>
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center space-y-2">
                          <p className="text-xs text-neutral-500">
                            No sleep data logged for {dayMeta.dayLabel.toLowerCase()}.
                          </p>
                          <button
                            type="button"
                            onClick={() => setModalDay(dayMeta)}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Log Sleep for {dayMeta.dayLabel}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {category === 'meditation' && (
                    <div className="space-y-2.5">
                      {hasData ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Mindful Time</span>
                              <span className="font-bold text-emerald-400">
                                {(record as MeditationDayRecord).minutes || 0} min
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/[0.03]">
                              <span className="text-[9px] text-neutral-500 uppercase block">Coherence</span>
                              <span className="font-bold text-white">
                                {(record as MeditationDayRecord).coherence || 'Alpha Wave'}
                              </span>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-white/[0.03] text-[11px] text-neutral-300">
                            Protocol: {(record as MeditationDayRecord).protocol || 'Tactical Box Breathing 4-4-4-4'}
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center space-y-2">
                          <p className="text-xs text-neutral-500">
                            No meditation session recorded for {dayMeta.dayLabel.toLowerCase()}.
                          </p>
                          <button
                            type="button"
                            onClick={() => setModalDay(dayMeta)}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5 text-white" />
                            <span>Log Meditation for {dayMeta.dayLabel}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar for Logged Rows: Edit & Clear */}
                  {hasData && (
                    <div className="pt-1 flex items-center justify-end gap-2 border-t border-white/[0.05] text-[10px]">
                      <button
                        type="button"
                        onClick={() => setModalDay(dayMeta)}
                        className="py-1 px-2.5 rounded-xl bg-white/[0.08] hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clearDayRecord(dayMeta.dateKey, category);
                          showToast?.(`Cleared ${dayMeta.dayLabel} record`);
                        }}
                        className="py-1 px-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Logging / Editing Telemetry */}
      {modalDay && (
        <LogDayTelemetryModal
          isOpen={Boolean(modalDay)}
          onClose={() => setModalDay(null)}
          category={category}
          dayMeta={modalDay}
          onSaved={showToast}
        />
      )}

      {/* Modal for Console Photo OCR Scanning */}
      {scanConsoleDay && (
        <CardioConsoleScanModal
          isOpen={Boolean(scanConsoleDay)}
          onClose={() => setScanConsoleDay(null)}
          dateKey={scanConsoleDay.dateKey}
          onSynced={showToast}
        />
      )}
    </div>
  );
};
