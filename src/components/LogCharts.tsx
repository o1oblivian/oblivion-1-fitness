import React from 'react';
import type { CompletedSession } from '@/utils/sessionVaultStore';
import type { DailyStepEntry } from '@/utils/stepsStore';
import type { SleepLogEntry } from '@/utils/sleepStore';
import type { MeditationEntry } from '@/utils/meditationStore';
import type { DailyMacroLog } from '@/types';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

export type ChartStyle = 'bar' | 'trend' | 'ring';

// ─── Chart Style Switcher ──────────────────────────────
export function ChartStyleSwitcher({
  value, onChange,
}: { value: ChartStyle; onChange: (s: ChartStyle) => void }) {
  const styles: { key: ChartStyle; icon: React.ReactNode }[] = [
    { key: 'bar', icon: <BarChart3 className="w-3 h-3" /> },
    { key: 'trend', icon: <TrendingUp className="w-3 h-3" /> },
    { key: 'ring', icon: <Target className="w-3 h-3" /> },
  ];
  return (
    <div className="flex items-center rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] p-0.5 gap-0.5">
      {styles.map(s => (
        <button
          key={s.key}
          onClick={(e) => { e.stopPropagation(); onChange(s.key); }}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
            value === s.key
              ? 'bg-white dark:bg-white/[0.12] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'
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
  if (data.length < 2) return <div className="text-[10px] font-mono log-sub text-center py-4">Not enough data for trend</div>;
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

function radialGauge(
  pct: number, label: string, value: string, color: string, size = 100,
) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 1) * circ);
  const complete = pct >= 1;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          <filter id={`rg-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" className="log-ring-track" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none"
          stroke={complete ? '#22C55E' : color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          filter={`url(#rg-${color.replace('#', '')})`}
          className="transition-all duration-700"
        />
        <text x="50" y="46" textAnchor="middle" className="log-ring-text" fontSize="14" fontFamily="monospace" fontWeight="900">
          {value}
        </text>
        <text x="50" y="60" textAnchor="middle" className="log-ring-label" fontSize="7" fontFamily="monospace" fontWeight="700">
          {label}
        </text>
      </svg>
    </div>
  );
}

function MultiRingDisplay({ rings }: { rings: { pct: number; color: string; label: string; value: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      {rings.map((ring, i) => (
        <div key={i}>{radialGauge(ring.pct, ring.label, ring.value, ring.color, 88)}</div>
      ))}
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
  if (last7.length < 2) return <EmptyChart label="Need 2+ sessions for trend" />;
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

export function WorkoutRingChart({ sessions }: { sessions: CompletedSession[] }) {
  const totalVol = sessions.reduce((s, x) => s + x.total_volume_kg, 0);
  const totalSets = sessions.reduce((s, x) => s + x.total_sets, 0);
  const totalTime = sessions.reduce((s, x) => s + x.duration_secs, 0);
  const volGoal = 5000;
  const setsGoal = 50;
  const timeGoal = 3600;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2 text-center">Weekly Targets</div>
      <MultiRingDisplay rings={[
        { pct: totalVol / volGoal, color: '#A1A1AA', label: 'VOLUME', value: totalVol >= 1000 ? `${(totalVol / 1000).toFixed(1)}MT` : `${Math.round(totalVol)}` },
        { pct: totalSets / setsGoal, color: '#71717A', label: 'SETS', value: String(totalSets) },
        { pct: totalTime / timeGoal, color: '#52525B', label: 'TIME', value: `${Math.floor(totalTime / 60)}m` },
      ]} />
    </div>
  );
}

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

export function StepsRadialChart({ entries }: { entries: DailyStepEntry[] }) {
  const today = entries[0];
  const steps = today?.steps || 0;
  const goal = today?.goal || 10000;
  const dist = (steps * 0.000762).toFixed(1);
  const cal = Math.round(steps * 0.04);
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2 text-center">Today's Progress</div>
      <MultiRingDisplay rings={[
        { pct: steps / goal, color: '#A1A1AA', label: 'STEPS', value: steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps) },
        { pct: parseFloat(dist) / 8, color: '#71717A', label: 'KM', value: dist },
        { pct: cal / 400, color: '#52525B', label: 'KCAL', value: String(cal) },
      ]} />
    </div>
  );
}

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

export function NutritionDonutChart({ macros }: { macros: DailyMacroLog[] }) {
  const today = macros[0];
  if (!today) return <EmptyChart label="No macro data" />;
  const p = today.protein || 0;
  const c = today.carbs || 0;
  const f = today.fat || 0;
  const total = p + c + f || 1;
  const pTarget = today.proteinTarget || 150;
  const calTarget = today.calorieTarget || 2200;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2 text-center">Today's Macros</div>
      <MultiRingDisplay rings={[
        { pct: p / pTarget, color: '#A1A1AA', label: 'PROTEIN', value: `${Math.round(p)}g` },
        { pct: today.calories / calTarget, color: '#71717A', label: 'KCAL', value: String(Math.round(today.calories)) },
        { pct: f / (total * 0.3), color: '#52525B', label: 'FAT', value: `${Math.round(f)}g` },
      ]} />
    </div>
  );
}

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

export function SleepDialChart({ entries }: { entries: SleepLogEntry[] }) {
  const last7 = entries.slice(0, 7);
  const avgMins = last7.length > 0 ? Math.round(last7.reduce((s, e) => s + e.duration_minutes, 0) / last7.length) : 0;
  const avgQual = last7.length > 0 ? last7.reduce((s, e) => s + e.quality, 0) / last7.length : 0;
  const goalMins = 480;
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2 text-center">Sleep Targets</div>
      <MultiRingDisplay rings={[
        { pct: avgMins / goalMins, color: '#A1A1AA', label: 'DURATION', value: `${Math.floor(avgMins / 60)}h${avgMins % 60}m` },
        { pct: avgQual / 5, color: '#71717A', label: 'QUALITY', value: avgQual.toFixed(1) },
        { pct: last7.filter(e => e.duration_minutes >= 420).length / 7, color: '#52525B', label: 'STREAK', value: `${last7.filter(e => e.duration_minutes >= 420).length}/7` },
      ]} />
    </div>
  );
}

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

export function MeditationRingChart({ entries }: { entries: MeditationEntry[] }) {
  const totalMins = Math.round(entries.reduce((s, e) => s + e.duration_secs, 0) / 60);
  const weekGoal = 70;
  const dates = new Set(entries.map(e => e.completed_at.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    if (dates.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  const todayMins = Math.round(
    entries
      .filter(e => e.completed_at.slice(0, 10) === new Date().toISOString().slice(0, 10))
      .reduce((s, e) => s + e.duration_secs / 60, 0)
  );
  return (
    <div className="py-1">
      <div className="text-[8px] font-mono log-sub uppercase tracking-wider mb-2 text-center">Mindfulness Habits</div>
      <MultiRingDisplay rings={[
        { pct: todayMins / 15, color: '#A1A1AA', label: 'TODAY', value: `${todayMins}m` },
        { pct: totalMins / weekGoal, color: '#71717A', label: 'WEEKLY', value: `${totalMins}m` },
        { pct: streak / 7, color: '#52525B', label: 'STREAK', value: `${streak}d` },
      ]} />
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="text-center py-5">
      <p className="text-[10px] font-mono log-sub">{label}</p>
    </div>
  );
}
