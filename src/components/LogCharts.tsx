import React from 'react';
import type { CompletedSession } from '@/utils/sessionVaultStore';
import type { DailyStepEntry } from '@/utils/stepsStore';
import type { SleepLogEntry } from '@/utils/sleepStore';
import type { MeditationEntry } from '@/utils/meditationStore';
import type { DailyMacroLog } from '@/types';
import { BarChart3, TrendingUp, Calendar, Dumbbell, Footprints, Utensils, Moon, Sparkles } from 'lucide-react';

export type ChartStyle = 'bar' | 'trend' | 'year';

// ─── Chart Style Switcher ──────────────────────────────
export function ChartStyleSwitcher({
  value, onChange,
}: { value: ChartStyle; onChange: (s: ChartStyle) => void }) {
  const styles: { key: ChartStyle; icon: React.ReactNode; label: string }[] = [
    { key: 'bar', icon: <BarChart3 className="w-3 h-3" />, label: 'Bar' },
    { key: 'trend', icon: <TrendingUp className="w-3 h-3" />, label: 'Trend' },
    { key: 'year', icon: <Calendar className="w-3 h-3" />, label: '1-Year History' },
  ];
  return (
    <div className="flex items-center rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] p-0.5 gap-0.5">
      {styles.map(s => (
        <button
          key={s.key}
          title={s.label}
          onClick={(e) => { e.stopPropagation(); onChange(s.key); }}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
            value === s.key
              ? 'bg-white dark:bg-white/[0.14] text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'
          }`}
        >
          {s.icon}
        </button>
      ))}
    </div>
  );
}

// ─── SVG Helpers ───────────────────────────────────────
function miniBar(
  data: { value: number; label: string; hit?: boolean }[],
  height: number,
  accentColor: string,
  goalLine?: number,
) {
  const max = Math.max(...data.map(d => d.value), goalLine || 0, 1);
  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full relative flex-1 flex items-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 ${d.hit === false ? 'log-bar-empty' : ''}`}
                  style={{
                    height: `${Math.max(pct, 3)}%`,
                    background: d.hit !== false
                      ? `linear-gradient(to top, ${accentColor}90, ${accentColor}50)`
                      : undefined,
                    boxShadow: d.hit !== false ? `0 0 8px ${accentColor}30` : 'none',
                  }}
                />
              </div>
              <span className="text-[7px] font-mono log-sub">{d.label}</span>
            </div>
          );
        })}
      </div>
      {goalLine !== undefined && (
        <div className="relative h-0">
          <div
            className="absolute left-0 right-0 border-t border-dashed"
            style={{
              borderColor: `${accentColor}40`,
              bottom: `${(goalLine / max) * height}px`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function trendLine(
  data: number[],
  labels: string[],
  height: number,
  color: string,
  avgLine?: number,
) {
  if (data.length < 2) {
    return (
      <EmptyChart
        label="Record 2+ entries to unlock trajectory"
        icon={<TrendingUp className="w-4 h-4 text-slate-400 dark:text-white/30" />}
      />
    );
  }
  const min = Math.min(...data) * 0.9;
  const max = Math.max(...data) * 1.1 || 1;
  const range = max - min || 1;
  const w = 280;
  const h = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const areaPoints = `0,${h} ${points.join(' ')} ${w},${h}`;
  const avgY = avgLine !== undefined ? h - ((avgLine - min) / range) * h : null;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full" style={{ height: height + 16 }}>
        <defs>
          <linearGradient id={`tg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id={`tgl-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polygon points={areaPoints} fill={`url(#tg-${color.replace('#', '')})`} />
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" filter={`url(#tgl-${color.replace('#', '')})`} />
        {avgY !== null && (
          <line x1="0" y1={avgY} x2={w} y2={avgY} stroke={color} strokeOpacity="0.3"
            strokeWidth="1" strokeDasharray="4 4" />
        )}
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - ((v - min) / range) * h;
          return <circle key={i} cx={x} cy={y} r="3" fill={color} fillOpacity="0.8" />;
        })}
        {labels.map((l, i) => {
          const x = (i / (data.length - 1)) * w;
          return (
            <text key={i} x={x} y={h + 12} textAnchor="middle" className="log-svg-label"
              fontSize="7" fontFamily="monospace">{l}</text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 12-Month Timeline Helper ──────────────────────────
export interface MonthSummarySlot {
  key: string; // YYYY-MM
  label: string; // Jan, Feb...
  shortLabel: string; // J, F, M...
  isCurrent: boolean;
}

export function getLast12Months(): MonthSummarySlot[] {
  const slots: MonthSummarySlot[] = [];
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    slots.push({
      key,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      shortLabel: d.toLocaleDateString('en-US', { month: 'narrow' }),
      isCurrent: key === currentKey,
    });
  }
  return slots;
}

// ─── 1-Year Master Matrix Component ────────────────────
interface YearMatrixProps {
  title: string;
  badge: string;
  months: {
    key: string;
    label: string;
    value: number;
    formattedValue: string;
    isCurrent: boolean;
    hit?: boolean;
  }[];
  stat1: { label: string; value: string };
  stat2: { label: string; value: string };
  stat3: { label: string; value: string };
  accentColor?: string;
}

function YearlyHistoryMatrix({
  title,
  badge,
  months,
  stat1,
  stat2,
  stat3,
  accentColor = '#DC2626',
}: YearMatrixProps) {
  const maxVal = Math.max(...months.map(m => m.value), 1);

  return (
    <div className="py-2 space-y-3">
      {/* Header & Annual Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-white/40" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-white/80">
            {title}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[8px] font-mono font-bold uppercase text-slate-600 dark:text-white/60 tracking-wider">
          {badge}
        </span>
      </div>

      {/* 12-Month Bar Distribution */}
      <div className="pt-2 pb-1">
        <div className="flex items-end gap-1 sm:gap-1.5 h-18 px-0.5">
          {months.map((m) => {
            const pct = maxVal > 0 ? (m.value / maxVal) * 100 : 0;
            const hasData = m.value > 0;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                {/* Value tooltip on hover */}
                {hasData && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 z-20 pointer-events-none whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[7px] font-mono shadow-sm">
                    {m.label}: {m.formattedValue}
                  </div>
                )}
                <div className="w-full relative flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${
                      m.isCurrent
                        ? 'border-t-2 border-white/80'
                        : ''
                    }`}
                    style={{
                      height: hasData ? `${Math.max(pct, 6)}%` : '4%',
                      background: hasData
                        ? m.isCurrent
                          ? `linear-gradient(to top, ${accentColor}, ${accentColor}90)`
                          : 'linear-gradient(to top, #71717A90, #71717A40)'
                        : 'rgba(113, 113, 122, 0.12)',
                      boxShadow: m.isCurrent && hasData ? `0 0 10px ${accentColor}40` : 'none',
                    }}
                  />
                </div>
                <span
                  className={`text-[7px] font-mono tracking-tight ${
                    m.isCurrent
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-400 dark:text-white/30'
                  }`}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual Key Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-center">
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">{stat1.value}</div>
          <div className="text-[7px] font-mono text-slate-400 dark:text-white/35 uppercase tracking-wider">{stat1.label}</div>
        </div>
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">{stat2.value}</div>
          <div className="text-[7px] font-mono text-slate-400 dark:text-white/35 uppercase tracking-wider">{stat2.label}</div>
        </div>
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">{stat3.value}</div>
          <div className="text-[7px] font-mono text-slate-400 dark:text-white/35 uppercase tracking-wider">{stat3.label}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Workout Charts ────────────────────────────────────
function getDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'narrow' });
}

export function WorkoutBarChart({ sessions }: { sessions: CompletedSession[] }) {
  const last7 = sessions.slice(0, 7).reverse();
  if (last7.length === 0) return <EmptyChart label="No workout data" />;
  const data = last7.map(s => ({
    value: s.total_volume_kg,
    label: getDayLabel(s.completed_at),
    hit: true,
  }));
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Tonnage by Session</div>
      {miniBar(data, 56, '#71717A')}
    </div>
  );
}

export function WorkoutTrendChart({ sessions }: { sessions: CompletedSession[] }) {
  const last7 = sessions.slice(0, 7).reverse();
  if (last7.length < 2) return <EmptyChart label="Record 2+ sessions to unlock trajectory" icon={<TrendingUp className="w-4 h-4 text-slate-400 dark:text-white/30" />} />;
  const maxWeights = last7.map(s => {
    const allWeights = s.exercises.flatMap(e => e.sets.map(st => st.weight));
    return allWeights.length > 0 ? Math.max(...allWeights) : 0;
  });
  const labels = last7.map(s => getDayLabel(s.completed_at));
  const avg = maxWeights.reduce((a, b) => a + b, 0) / maxWeights.length;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Peak Load Trend (kg)</div>
      {trendLine(maxWeights, labels, 60, '#71717A', avg)}
    </div>
  );
}

export function WorkoutYearChart({ sessions }: { sessions: CompletedSession[] }) {
  const slots = getLast12Months();
  const totalAnnualVolume = sessions.reduce((acc, s) => acc + (s.total_volume_kg || 0), 0);
  const totalAnnualSets = sessions.reduce((acc, s) => acc + (s.total_sets || 0), 0);
  const totalSessions = sessions.length;

  const monthMap = new Map<string, { volume: number; count: number }>();
  for (const s of sessions) {
    if (!s.completed_at) continue;
    const monthKey = s.completed_at.slice(0, 7);
    const curr = monthMap.get(monthKey) || { volume: 0, count: 0 };
    curr.volume += s.total_volume_kg || 0;
    curr.count += 1;
    monthMap.set(monthKey, curr);
  }

  const monthsData = slots.map(s => {
    const data = monthMap.get(s.key) || { volume: 0, count: 0 };
    return {
      key: s.key,
      label: s.label,
      value: data.volume,
      formattedValue: data.volume >= 1000 ? `${(data.volume / 1000).toFixed(1)} MT` : `${Math.round(data.volume)} kg`,
      isCurrent: s.isCurrent,
    };
  });

  const activeMonths = monthsData.filter(m => m.value > 0).length;
  const avgMonthlySessions = activeMonths > 0 ? (totalSessions / activeMonths).toFixed(1) : '0';

  return (
    <YearlyHistoryMatrix
      title="1-Year Workout Load"
      badge="Past 12 Months"
      months={monthsData}
      stat1={{
        label: 'Annual Volume',
        value: totalAnnualVolume >= 1000 ? `${(totalAnnualVolume / 1000).toFixed(1)} MT` : `${Math.round(totalAnnualVolume)} kg`,
      }}
      stat2={{
        label: 'Total Sessions',
        value: `${totalSessions}`,
      }}
      stat3={{
        label: 'Monthly Cadence',
        value: `${avgMonthlySessions} / mo`,
      }}
      accentColor="#DC2626"
    />
  );
}

// Backward-compatibility alias
export const WorkoutRingChart = WorkoutYearChart;

// ─── Steps Charts ──────────────────────────────────────
export function StepsBarChart({ entries }: { entries: DailyStepEntry[] }) {
  const last7 = entries.slice(0, 7).reverse();
  if (last7.length === 0) return <EmptyChart label="No step data" />;
  const data = last7.map(e => ({
    value: e.steps,
    label: new Date(e.log_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
    hit: e.steps >= e.goal,
  }));
  const avgGoal = last7.length > 0 ? Math.round(last7.reduce((s, e) => s + e.goal, 0) / last7.length) : 10000;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">7-Day Steps (goal: {avgGoal.toLocaleString()})</div>
      {miniBar(data, 56, '#71717A')}
    </div>
  );
}

export function StepsTrendChart({ entries }: { entries: DailyStepEntry[] }) {
  const last7 = entries.slice(0, 7).reverse();
  if (last7.length < 2) return <EmptyChart label="Need 2+ days for trend" />;
  const cumDist = last7.map(e => e.steps * 0.000762);
  const labels = last7.map(e => new Date(e.log_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }));
  let running = 0;
  const cumulative = cumDist.map(d => { running += d; return parseFloat(running.toFixed(2)); });
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Cumulative Distance (km)</div>
      {trendLine(cumulative, labels, 60, '#71717A')}
    </div>
  );
}

export function StepsYearChart({ entries }: { entries: DailyStepEntry[] }) {
  const slots = getLast12Months();
  const totalAnnualSteps = entries.reduce((acc, e) => acc + (e.steps || 0), 0);
  const totalDistanceKm = totalAnnualSteps * 0.000762;
  const daysLogged = entries.length;
  const avgDaily = daysLogged > 0 ? Math.round(totalAnnualSteps / daysLogged) : 0;

  const monthMap = new Map<string, { totalSteps: number; days: number }>();
  for (const e of entries) {
    if (!e.log_date) continue;
    const monthKey = e.log_date.slice(0, 7);
    const curr = monthMap.get(monthKey) || { totalSteps: 0, days: 0 };
    curr.totalSteps += e.steps || 0;
    curr.days += 1;
    monthMap.set(monthKey, curr);
  }

  const monthsData = slots.map(s => {
    const data = monthMap.get(s.key) || { totalSteps: 0, days: 0 };
    const avgForMonth = data.days > 0 ? Math.round(data.totalSteps / data.days) : 0;
    return {
      key: s.key,
      label: s.label,
      value: avgForMonth,
      formattedValue: `${avgForMonth.toLocaleString()} /d`,
      isCurrent: s.isCurrent,
    };
  });

  return (
    <YearlyHistoryMatrix
      title="1-Year Daily Step Averages"
      badge="12-Month History"
      months={monthsData}
      stat1={{
        label: 'Annual Steps',
        value: totalAnnualSteps >= 1000000 ? `${(totalAnnualSteps / 1000000).toFixed(2)}M` : `${Math.round(totalAnnualSteps / 1000)}k`,
      }}
      stat2={{
        label: 'Daily Average',
        value: `${avgDaily.toLocaleString()}`,
      }}
      stat3={{
        label: 'Total Distance',
        value: `${totalDistanceKm.toFixed(1)} km`,
      }}
      accentColor="#0D9488"
    />
  );
}

// Backward-compatibility alias
export const StepsRadialChart = StepsYearChart;

// ─── Nutrition Charts ──────────────────────────────────
export function NutritionBarChart({ macros }: { macros: DailyMacroLog[] }) {
  const last7 = macros.slice(0, 7).reverse();
  if (last7.length === 0) return <EmptyChart label="No nutrition data" />;
  const data = last7.map(m => ({
    value: m.calories,
    label: (m.dateLabel || m.date || '').slice(0, 2),
    hit: m.calorieTarget > 0 ? m.calories >= m.calorieTarget * 0.85 && m.calories <= m.calorieTarget * 1.15 : true,
  }));
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Calorie Intake</div>
      {miniBar(data, 56, '#71717A')}
    </div>
  );
}

export function NutritionTrendChart({ macros }: { macros: DailyMacroLog[] }) {
  const last7 = macros.slice(0, 7).reverse();
  if (last7.length < 2) return <EmptyChart label="Need 2+ days for trend" />;
  const cals = last7.map(m => m.calories);
  const labels = last7.map(m => (m.dateLabel || m.date || '').slice(0, 2));
  const avg = cals.reduce((a, b) => a + b, 0) / cals.length;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">7-Day Caloric Curve</div>
      {trendLine(cals, labels, 60, '#71717A', avg)}
    </div>
  );
}

export function NutritionYearChart({ macros }: { macros: DailyMacroLog[] }) {
  const slots = getLast12Months();
  const daysLogged = macros.length;
  const totalCals = macros.reduce((acc, m) => acc + (m.calories || 0), 0);
  const avgCals = daysLogged > 0 ? Math.round(totalCals / daysLogged) : 0;
  const totalProtein = macros.reduce((acc, m) => acc + (m.protein || 0), 0);
  const avgProtein = daysLogged > 0 ? Math.round(totalProtein / daysLogged) : 0;

  const hitDays = macros.filter(m => {
    const calHit = m.calorieTarget > 0 && m.calories >= m.calorieTarget * 0.85 && m.calories <= m.calorieTarget * 1.15;
    const protHit = m.proteinTarget > 0 && m.protein >= m.proteinTarget * 0.8;
    return calHit || protHit;
  }).length;
  const consistencyPct = daysLogged > 0 ? Math.round((hitDays / daysLogged) * 100) : 0;

  const monthMap = new Map<string, { totalCals: number; days: number }>();
  for (const m of macros) {
    if (!m.date) continue;
    const monthKey = m.date.slice(0, 7);
    const curr = monthMap.get(monthKey) || { totalCals: 0, days: 0 };
    curr.totalCals += m.calories || 0;
    curr.days += 1;
    monthMap.set(monthKey, curr);
  }

  const monthsData = slots.map(s => {
    const data = monthMap.get(s.key) || { totalCals: 0, days: 0 };
    const avgForMonth = data.days > 0 ? Math.round(data.totalCals / data.days) : 0;
    return {
      key: s.key,
      label: s.label,
      value: avgForMonth,
      formattedValue: `${avgForMonth} kcal`,
      isCurrent: s.isCurrent,
    };
  });

  return (
    <YearlyHistoryMatrix
      title="1-Year Calorie Intake History"
      badge="12-Month Averages"
      months={monthsData}
      stat1={{
        label: 'Avg Daily Cals',
        value: `${avgCals} kcal`,
      }}
      stat2={{
        label: 'Avg Protein',
        value: `${avgProtein}g / day`,
      }}
      stat3={{
        label: 'Consistency',
        value: `${consistencyPct}%`,
      }}
      accentColor="#F59E0B"
    />
  );
}

// Backward-compatibility alias
export const NutritionDonutChart = NutritionYearChart;

// ─── Sleep Charts ──────────────────────────────────────
export function SleepBarChart({ entries }: { entries: SleepLogEntry[] }) {
  const last7 = entries.slice(0, 7).reverse();
  if (last7.length === 0) return <EmptyChart label="No sleep data" />;
  const data = last7.map(e => ({
    value: e.duration_minutes,
    label: new Date(e.log_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
    hit: e.duration_minutes >= 420,
  }));
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Hours Slept (7h goal)</div>
      {miniBar(data, 56, '#71717A')}
    </div>
  );
}

export function SleepTrendChart({ entries }: { entries: SleepLogEntry[] }) {
  const last7 = entries.slice(0, 7).reverse();
  if (last7.length < 2) return <EmptyChart label="Need 2+ nights for trend" />;
  const scores = last7.map(e => {
    const durScore = Math.min(e.duration_minutes / 480, 1) * 50;
    const qualScore = (e.quality / 5) * 50;
    return Math.round(durScore + qualScore);
  });
  const labels = last7.map(e => new Date(e.log_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }));
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Sleep Score / Recovery</div>
      {trendLine(scores, labels, 60, '#71717A')}
    </div>
  );
}

export function SleepYearChart({ entries }: { entries: SleepLogEntry[] }) {
  const slots = getLast12Months();
  const nightsLogged = entries.length;
  const totalMins = entries.reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
  const avgMins = nightsLogged > 0 ? Math.round(totalMins / nightsLogged) : 0;
  const totalQual = entries.reduce((acc, e) => acc + (e.quality || 0), 0);
  const avgQual = nightsLogged > 0 ? (totalQual / nightsLogged).toFixed(1) : '0';
  const goalNights = entries.filter(e => e.duration_minutes >= 420).length;
  const optimalPct = nightsLogged > 0 ? Math.round((goalNights / nightsLogged) * 100) : 0;

  const monthMap = new Map<string, { totalMins: number; days: number }>();
  for (const e of entries) {
    if (!e.log_date) continue;
    const monthKey = e.log_date.slice(0, 7);
    const curr = monthMap.get(monthKey) || { totalMins: 0, days: 0 };
    curr.totalMins += e.duration_minutes || 0;
    curr.days += 1;
    monthMap.set(monthKey, curr);
  }

  const monthsData = slots.map(s => {
    const data = monthMap.get(s.key) || { totalMins: 0, days: 0 };
    const avgForMonth = data.days > 0 ? Math.round(data.totalMins / data.days) : 0;
    return {
      key: s.key,
      label: s.label,
      value: avgForMonth,
      formattedValue: `${Math.floor(avgForMonth / 60)}h ${avgForMonth % 60}m`,
      isCurrent: s.isCurrent,
    };
  });

  return (
    <YearlyHistoryMatrix
      title="1-Year Sleep & Recovery"
      badge="12-Month History"
      months={monthsData}
      stat1={{
        label: 'Avg Nightly Sleep',
        value: `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`,
      }}
      stat2={{
        label: 'Quality Score',
        value: `${avgQual} / 5.0`,
      }}
      stat3={{
        label: 'Optimal (7h+)',
        value: `${optimalPct}%`,
      }}
      accentColor="#6366F1"
    />
  );
}

// Backward-compatibility alias
export const SleepDialChart = SleepYearChart;

// ─── Meditation Charts ─────────────────────────────────
export function MeditationBarChart({ entries }: { entries: MeditationEntry[] }) {
  const last7Days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = entries
      .filter(e => e.completed_at.slice(0, 10) === ds)
      .reduce((s, e) => s + e.duration_secs / 60, 0);
    last7Days.push({ label: dayLabel, value: Math.round(mins) });
  }
  if (last7Days.every(d => d.value === 0)) return <EmptyChart label="No meditation data" />;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Daily Minutes</div>
      {miniBar(last7Days.map(d => ({ ...d, hit: d.value > 0 })), 56, '#71717A')}
    </div>
  );
}

export function MeditationTrendChart({ entries }: { entries: MeditationEntry[] }) {
  const last7Days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = entries
      .filter(e => e.completed_at.slice(0, 10) === ds)
      .reduce((s, e) => s + e.duration_secs / 60, 0);
    last7Days.push({ label: dayLabel, value: Math.round(mins) });
  }
  if (last7Days.filter(d => d.value > 0).length < 2) return <EmptyChart label="Need 2+ days for trend" />;
  let cumulative = 0;
  const cumData = last7Days.map(d => { cumulative += d.value; return cumulative; });
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2">Cumulative Mindfulness (min)</div>
      {trendLine(cumData, last7Days.map(d => d.label), 60, '#71717A')}
    </div>
  );
}

export function MeditationYearChart({ entries }: { entries: MeditationEntry[] }) {
  const slots = getLast12Months();
  const totalMins = Math.round(entries.reduce((acc, e) => acc + (e.duration_secs || 0), 0) / 60);
  const totalSessions = entries.length;

  const monthMap = new Map<string, { totalMins: number; sessions: number }>();
  for (const e of entries) {
    if (!e.completed_at) continue;
    const monthKey = e.completed_at.slice(0, 7);
    const curr = monthMap.get(monthKey) || { totalMins: 0, sessions: 0 };
    curr.totalMins += (e.duration_secs || 0) / 60;
    curr.sessions += 1;
    monthMap.set(monthKey, curr);
  }

  const monthsData = slots.map(s => {
    const data = monthMap.get(s.key) || { totalMins: 0, sessions: 0 };
    const roundedMins = Math.round(data.totalMins);
    return {
      key: s.key,
      label: s.label,
      value: roundedMins,
      formattedValue: `${roundedMins} min`,
      isCurrent: s.isCurrent,
    };
  });

  const activeMonths = monthsData.filter(m => m.value > 0).length;

  return (
    <YearlyHistoryMatrix
      title="1-Year Mindfulness History"
      badge="12-Month Total"
      months={monthsData}
      stat1={{
        label: 'Annual Practice',
        value: totalMins >= 60 ? `${(totalMins / 60).toFixed(1)} hrs` : `${totalMins} min`,
      }}
      stat2={{
        label: 'Total Sessions',
        value: `${totalSessions}`,
      }}
      stat3={{
        label: 'Active Months',
        value: `${activeMonths} / 12`,
      }}
      accentColor="#10B981"
    />
  );
}

// Backward-compatibility alias
export const MeditationRingChart = MeditationYearChart;

// ─── Empty State ───────────────────────────────────────
function EmptyChart({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.06] text-center">
      {icon && <div className="mb-1.5">{icon}</div>}
      <p className="text-[10px] font-mono text-slate-500 dark:text-white/40">{label}</p>
    </div>
  );
}
