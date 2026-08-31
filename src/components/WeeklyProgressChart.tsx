import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Flame,
  Clock,
  Dumbbell,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface DayData {
  day: string;
  fullDay: string;
  routineKey: string;
  routine: string;
  routineShort: string;
  volume: number;
  targetVolume: number;
  sets: number;
  targetSets: number;
  calories: number;
  durationMins: number;
  status: 'Completed' | 'Active Session' | 'Scheduled' | 'Rest Day';
  isRest: boolean;
}

interface WeeklyProgressChartProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  weeklySchedule: Record<string, string>;
  currentDayVolume: number;
  currentDaySets: number;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  selectedDay,
  onSelectDay,
  weeklySchedule,
  currentDayVolume,
  currentDaySets,
}) => {
  const [metric, setMetric] = useState<'volume' | 'sets'>('volume');
  const [dayDetailModal, setDayDetailModal] = useState<DayData | null>(null);

  const daysList = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
    { short: 'Sun', full: 'Sunday' },
  ];

  const defaultRoutineVolumes: Record<
    string,
    { volume: number; sets: number; calories: number; duration: number; shortLabel: string }
  > = {
    push_a: { volume: 5400, sets: 16, calories: 420, duration: 55, shortLabel: 'Push A' },
    pull_a: { volume: 6200, sets: 18, calories: 480, duration: 60, shortLabel: 'Pull A' },
    legs_a: { volume: 8900, sets: 20, calories: 620, duration: 70, shortLabel: 'Legs A' },
    push_b: { volume: 5800, sets: 15, calories: 440, duration: 50, shortLabel: 'Push B' },
    pull_b: { volume: 6500, sets: 17, calories: 510, duration: 62, shortLabel: 'Pull B' },
    legs_b: { volume: 9200, sets: 22, calories: 680, duration: 75, shortLabel: 'Legs B' },
    Rest: { volume: 0, sets: 0, calories: 120, duration: 25, shortLabel: 'Rest' },
    rest: { volume: 0, sets: 0, calories: 120, duration: 25, shortLabel: 'Rest' },
  };

  const exerciseBreakdownMap: Record<string, { name: string; setsReps: string; weight: string }[]> = {
    push_a: [
      { name: 'Barbell Bench Press', setsReps: '4 sets × 8 reps', weight: '85 kg' },
      { name: 'Incline Dumbbell Press', setsReps: '3 sets × 10 reps', weight: '32 kg' },
      { name: 'Standing Overhead Press', setsReps: '3 sets × 8 reps', weight: '55 kg' },
      { name: 'Cable Chest Flyes', setsReps: '3 sets × 12 reps', weight: '18 kg' },
      { name: 'Tricep Rope Pushdowns', setsReps: '3 sets × 12 reps', weight: '28 kg' },
    ],
    pull_a: [
      { name: 'Conventional Deadlift', setsReps: '4 sets × 5 reps', weight: '140 kg' },
      { name: 'Wide-Grip Lat Pulldown', setsReps: '4 sets × 10 reps', weight: '70 kg' },
      { name: 'Seated Cable Row', setsReps: '3 sets × 12 reps', weight: '65 kg' },
      { name: 'Face Pulls', setsReps: '3 sets × 15 reps', weight: '22 kg' },
      { name: 'EZ-Bar Bicep Curls', setsReps: '4 sets × 10 reps', weight: '35 kg' },
    ],
    legs_a: [
      { name: 'Barbell Back Squat', setsReps: '4 sets × 6 reps', weight: '120 kg' },
      { name: 'Romanian Deadlift', setsReps: '4 sets × 8 reps', weight: '100 kg' },
      { name: 'Leg Press 45°', setsReps: '4 sets × 12 reps', weight: '220 kg' },
      { name: 'Standing Calf Raises', setsReps: '4 sets × 15 reps', weight: '80 kg' },
      { name: 'Hanging Leg Raises', setsReps: '4 sets × 15 reps', weight: 'Bodyweight' },
    ],
    push_b: [
      { name: 'Incline Barbell Bench Press', setsReps: '4 sets × 8 reps', weight: '75 kg' },
      { name: 'Flat Dumbbell Press', setsReps: '3 sets × 10 reps', weight: '34 kg' },
      { name: 'Dumbbell Lateral Raises', setsReps: '4 sets × 15 reps', weight: '14 kg' },
      { name: 'Skullcrushers (EZ Bar)', setsReps: '3 sets × 10 reps', weight: '32 kg' },
      { name: 'Cable Kickbacks', setsReps: '3 sets × 12 reps', weight: '12 kg' },
    ],
    pull_b: [
      { name: 'Weighted Pull-Ups', setsReps: '4 sets × 6 reps', weight: '+15 kg' },
      { name: 'Barbell Bent Over Row', setsReps: '4 sets × 8 reps', weight: '80 kg' },
      { name: 'Single-Arm DB Row', setsReps: '3 sets × 10 reps', weight: '38 kg' },
      { name: 'Incline Dumbbell Curls', setsReps: '3 sets × 12 reps', weight: '16 kg' },
      { name: 'Reverse Pec Deck Flyes', setsReps: '3 sets × 15 reps', weight: '45 kg' },
    ],
    legs_b: [
      { name: 'Walking Dumbbell Lunges', setsReps: '4 sets × 12 steps', weight: '24 kg' },
      { name: 'Lying Hamstring Curls', setsReps: '4 sets × 12 reps', weight: '55 kg' },
      { name: 'Leg Extensions', setsReps: '4 sets × 15 reps', weight: '65 kg' },
      { name: 'Seated Calf Raises', setsReps: '4 sets × 15 reps', weight: '60 kg' },
      { name: 'Ab Wheel Rollouts', setsReps: '3 sets × 12 reps', weight: 'Bodyweight' },
    ],
    Rest: [
      { name: 'Mobility & Foam Rolling', setsReps: '1 session', weight: '20 mins' },
      { name: 'Light Zone 2 Cardio Walk', setsReps: '8,000 steps', weight: '30 mins' },
      { name: 'Diaphragmatic Breathing', setsReps: '1 session', weight: '10 mins' },
    ],
    rest: [
      { name: 'Mobility & Foam Rolling', setsReps: '1 session', weight: '20 mins' },
      { name: 'Light Zone 2 Cardio Walk', setsReps: '8,000 steps', weight: '30 mins' },
      { name: 'Diaphragmatic Breathing', setsReps: '1 session', weight: '10 mins' },
    ],
  };

  const chartData: DayData[] = daysList.map(({ short, full }) => {
    const routineKey = weeklySchedule[short] || 'Rest';
    const base = defaultRoutineVolumes[routineKey] || {
      volume: 3000,
      sets: 12,
      calories: 350,
      duration: 45,
      shortLabel: routineKey,
    };

    const targetVolume = base.volume;
    const targetSets = base.sets;
    const isRest = routineKey.toLowerCase() === 'rest';

    let volume = 0;
    let sets = 0;
    let calories = base.calories;
    let durationMins = base.duration;

    const isCurrentSelected = short === selectedDay;
    if (isCurrentSelected) {
      volume = currentDayVolume;
      sets = currentDaySets;
    }

    const routineName =
      routineKey === 'push_a'
        ? 'Push A (Chest / Delts / Tri)'
        : routineKey === 'pull_a'
        ? 'Pull A (Back / Biceps / Rear Delts)'
        : routineKey === 'legs_a'
        ? 'Legs A (Quads / Hamstrings / Calves)'
        : routineKey === 'push_b'
        ? 'Push B (Incline & Hypertrophy)'
        : routineKey === 'pull_b'
        ? 'Pull B (Upper Back Focus)'
        : routineKey === 'legs_b'
        ? 'Legs B (Posterior Chain)'
        : isRest
        ? 'Rest & Active Recovery'
        : routineKey;

    let status: 'Completed' | 'Active Session' | 'Scheduled' | 'Rest Day' = 'Scheduled';
    if (isRest) {
      status = 'Rest Day';
    } else if (isCurrentSelected) {
      status = currentDaySets > 0 || currentDayVolume > 0 ? 'Active Session' : 'Scheduled';
    }

    return {
      day: short,
      fullDay: full,
      routineKey,
      routine: routineName,
      routineShort: base.shortLabel || short,
      volume,
      targetVolume,
      sets,
      targetSets,
      calories,
      durationMins,
      status,
      isRest,
    };
  });

  const totalWeeklyVolume = chartData.reduce((acc, curr) => acc + curr.volume, 0);
  const totalWeeklySets = chartData.reduce((acc, curr) => acc + curr.sets, 0);
  const targetWeeklyVolume = chartData.reduce((acc, curr) => acc + curr.targetVolume, 0);
  const targetWeeklySets = chartData.reduce((acc, curr) => acc + curr.targetSets, 0);

  const selectedDayData = chartData.find((d) => d.day === selectedDay) || chartData[0];

  const handleBarClick = (data: DayData) => {
    onSelectDay(data.day);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/15 p-3 rounded-2xl shadow-xl font-sans min-w-[170px] z-50 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{data.fullDay}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase font-mono ${
                data.isRest
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}
            >
              {data.routineShort}
            </span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-zinc-300 font-medium mb-2 truncate">
            {data.routine}
          </div>
          <div className="space-y-1.5 font-mono text-xs pt-1.5 border-t border-slate-100 dark:border-white/10">
            <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Logged Vol:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {data.volume > 0 ? `${data.volume.toLocaleString()} kg` : '0 kg'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Target Vol:</span>
              <span className="font-medium text-slate-500 dark:text-zinc-400">
                {data.targetVolume.toLocaleString()} kg
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Working Sets:</span>
              <span className="font-bold text-red-500 dark:text-red-400">
                {data.sets} / {data.targetSets}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Determine the highest value to scale the chart dynamically
  const maxMetricValue = Math.max(
    ...chartData.map((d) => (metric === 'volume' ? Math.max(d.volume, d.targetVolume) : Math.max(d.sets, d.targetSets))),
    metric === 'volume' ? 5000 : 15
  );

  return (
    <div
      id="ofc-kinetic-progress-card"
      className="rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-zinc-950/80 border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-xl relative overflow-hidden transition-all duration-300 space-y-2.5"
    >
      {/* ── TOP HUD HEADER: ATHLETIC METRICS & COMPACT SWITCHER ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <Activity className="w-3 h-3" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight uppercase truncate">
              Microcycle Load & Volume
            </h3>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300 text-[9px] font-mono font-semibold shrink-0">
              {selectedDay}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] mt-0.5">
            <span className="text-slate-500 dark:text-zinc-400">Total:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {metric === 'volume'
                ? `${totalWeeklyVolume.toLocaleString()} kg`
                : `${totalWeeklySets} Sets`}
            </span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
              Target: {metric === 'volume' ? `${(targetWeeklyVolume / 1000).toFixed(0)}k kg` : `${targetWeeklySets}s`}
            </span>
          </div>
        </div>

        {/* COMPACT SEGMENTED PILL SWITCHER */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setMetric('volume')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
              metric === 'volume'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dumbbell className="w-2.5 h-2.5" />
            <span>Volume</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('sets')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
              metric === 'sets'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>Sets</span>
          </button>
        </div>
      </div>

      {/* ── KINETIC PILL BAROMETER CANVAS (COMPACT 90px) ── */}
      <div className="w-full h-[95px] font-mono text-xs relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 6, right: 4, left: -24, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                handleBarClick(state.activePayload[0].payload as DayData);
              }
            }}
          >
            <defs>
              <linearGradient id="ofcActiveBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                <stop offset="100%" stopColor="#e11d48" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="ofcCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="ofcGhostTargetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#64748b" stopOpacity={0.06} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-200/60 dark:text-zinc-800/80"
              vertical={false}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              domain={[0, maxMetricValue]}
              tickFormatter={(val) =>
                metric === 'volume'
                  ? val >= 1000
                    ? `${(val / 1000).toFixed(0)}k`
                    : `${val}`
                  : `${val}`
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244, 63, 94, 0.06)' }} />

            {/* Target Blueprint Ghost Bar */}
            <Bar
              dataKey={metric === 'volume' ? 'targetVolume' : 'targetSets'}
              radius={[4, 4, 1, 1]}
              barSize={16}
              fill="url(#ofcGhostTargetGradient)"
            />

            {/* Actual Logged Volume / Sets Bar */}
            <Bar
              dataKey={metric === 'volume' ? 'volume' : 'sets'}
              radius={[4, 4, 1, 1]}
              barSize={16}
              className="cursor-pointer"
            >
              {chartData.map((entry) => {
                const isSelected = entry.day === selectedDay;
                const fill = isSelected ? 'url(#ofcActiveBarGradient)' : 'url(#ofcCompletedGradient)';
                return (
                  <Cell
                    key={`cell-${entry.day}`}
                    fill={fill}
                    stroke={isSelected ? '#e11d48' : 'transparent'}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── UNIFIED DAY BUTTONS (Acts as X-Axis + Interactive Day Selector) ── */}
      <div className="grid grid-cols-7 gap-1">
        {chartData.map((d) => {
          const isSelected = d.day === selectedDay;
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => onSelectDay(d.day)}
              className={`py-1 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none ${
                isSelected
                  ? 'bg-red-500/10 dark:bg-red-500/20 border-red-500 text-red-600 dark:text-red-400 font-bold shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <span className="text-[10px] font-mono font-bold tracking-tight">{d.day}</span>
              <span
                className={`text-[8.5px] px-1 rounded font-mono truncate max-w-full leading-tight ${
                  isSelected
                    ? 'bg-red-500 text-white font-bold'
                    : d.isRest
                    ? 'text-slate-400 dark:text-zinc-500'
                    : 'text-slate-700 dark:text-zinc-300 font-medium'
                }`}
              >
                {d.routineShort}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SELECTED DAY INSPECTOR STRIP ── */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/90 dark:border-white/10 font-mono">
        <div className="min-w-0 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">
              {selectedDayData.fullDay} Focus
            </div>
            <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
              {selectedDayData.routine}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-600 dark:text-zinc-400 pr-2 border-r border-slate-200 dark:border-white/10">
            <span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {selectedDayData.volume > 0 ? `${selectedDayData.volume.toLocaleString()} kg` : `${selectedDayData.targetVolume.toLocaleString()} kg`}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDayDetailModal(selectedDayData)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1 shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span>View Routine</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── ROUTINE PREVIEW MODAL ── */}
      {dayDetailModal && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setDayDetailModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white w-full max-w-md max-h-[85dvh] sm:max-h-[80vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/15 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
          >
            {/* Mobile Grab Handle Bar */}
            <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-zinc-700 mx-auto mt-2 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 shrink-0">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400 uppercase">
                    {dayDetailModal.day} • {dayDetailModal.routineShort}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    &middot;
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      dayDetailModal.isRest
                        ? 'text-slate-500 dark:text-zinc-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {dayDetailModal.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {dayDetailModal.routine}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDayDetailModal(null)}
                className="btn-nude-close shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-4 gap-2 px-4 py-2.5 bg-slate-100/70 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-white/10 font-mono text-center shrink-0">
              <div>
                <div className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase">Target Vol</div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {(dayDetailModal.targetVolume / 1000).toFixed(1)}k kg
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase">Sets</div>
                <div className="text-xs font-black text-red-500 dark:text-red-400">
                  {dayDetailModal.targetSets}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase">Est Burn</div>
                <div className="text-xs font-black text-amber-500">{dayDetailModal.calories} kcal</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase">Time</div>
                <div className="text-xs font-black text-slate-700 dark:text-zinc-300">
                  {dayDetailModal.durationMins}m
                </div>
              </div>
            </div>

            {/* Exercise List - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-2 overscroll-contain touch-pan-y">
              <div className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-0.5">
                Choreographed Movements ({exerciseBreakdownMap[dayDetailModal.routineKey]?.length || 0})
              </div>
              <div className="space-y-1.5 pb-2">
                {(exerciseBreakdownMap[dayDetailModal.routineKey] || exerciseBreakdownMap['Rest']).map(
                  (ex, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200/90 dark:border-white/10 flex justify-between items-center hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {ex.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                          {ex.setsReps}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-zinc-200 bg-white dark:bg-white/10 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0 ml-2 shadow-2xs">
                        {ex.weight}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Modal Actions - Pinned at bottom */}
            <div className="flex gap-2.5 px-4 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900/50 backdrop-blur-sm shrink-0">
              <button
                type="button"
                onClick={() => setDayDetailModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectDay(dayDetailModal.day);
                  setDayDetailModal(null);
                }}
                className="flex-[1.8] py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Load {dayDetailModal.day} Routine</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
