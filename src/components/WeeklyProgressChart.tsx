import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
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
  TrendingUp,
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

  // Determine the highest value to scale the chart dynamically
  const maxMetricValue = Math.max(
    ...chartData.map((d) => (metric === 'volume' ? Math.max(d.volume, d.targetVolume) : Math.max(d.sets, d.targetSets))),
    metric === 'volume' ? 5000 : 15
  );

  // Google 4-color pattern
  const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

  return (
    <div
      id="ofc-kinetic-progress-card"
      className="rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-zinc-950/80 border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-xl relative overflow-hidden transition-all duration-300 space-y-2.5"
    >
      {/* ── TOP HUD HEADER: ATHLETIC METRICS & COMPACT SWITCHER ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-[#4285F4]/10 dark:bg-[#4285F4]/20 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4] shrink-0">
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
              <TrendingUp className="w-2.5 h-2.5 text-[#34A853]" />
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
            <Dumbbell className="w-2.5 h-2.5 text-[#4285F4]" />
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
            <Layers className="w-2.5 h-2.5 text-[#EA4335]" />
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
              {chartData.map((entry, index) => {
                const isSelected = entry.day === selectedDay;
                const baseColor = GOOGLE_COLORS[index % GOOGLE_COLORS.length];
                return (
                  <Cell
                    key={`cell-${entry.day}`}
                    fill={baseColor}
                    opacity={isSelected ? 1 : 0.8}
                    stroke={isSelected ? '#ffffff' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── UNIFIED DAY BUTTONS (Moved lower with dedicated spacing & subtle separator) ── */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-4 pt-2 border-t border-slate-100 dark:border-white/5">
        {chartData.map((d, index) => {
          const isSelected = d.day === selectedDay;
          const color = GOOGLE_COLORS[index % GOOGLE_COLORS.length];
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => onSelectDay(d.day)}
              className={`py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none ${
                isSelected
                  ? 'bg-slate-100 dark:bg-white/10 font-bold shadow-xs scale-[1.02]'
                  : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-white/20'
              }`}
              style={{
                borderColor: isSelected ? color : undefined,
                color: isSelected ? color : undefined,
              }}
            >
              <span className="text-[10px] font-mono font-bold tracking-tight">{d.day}</span>
              <span
                className={`text-[8.5px] px-1 rounded font-mono truncate max-w-full leading-tight ${
                  isSelected
                    ? 'text-white font-bold'
                    : d.isRest
                    ? 'text-slate-400 dark:text-zinc-500'
                    : 'text-slate-700 dark:text-zinc-300 font-medium'
                }`}
                style={{
                  backgroundColor: isSelected ? color : undefined,
                }}
              >
                {d.routineShort}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SELECTED DAY INSPECTOR STRIP ── */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/90 dark:border-white/10 font-mono mt-2.5">
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
          <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-zinc-400">
            <span>
              <strong className="text-slate-900 dark:text-white font-mono">
                {selectedDayData.volume > 0 ? `${selectedDayData.volume.toLocaleString()} kg` : `${selectedDayData.targetVolume.toLocaleString()} kg`}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-zinc-700">&bull;</span>
            <span>
              {selectedDayData.targetSets} sets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
