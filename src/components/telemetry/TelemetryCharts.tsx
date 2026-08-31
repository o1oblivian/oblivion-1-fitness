import React, { useState } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ExerciseProgressPoint, TrainingSession, DailyMacroLog } from '../../types';

const COLORS = {
  primary: '#4285F4',
  primaryDark: '#3367D6',
  accent: '#EA4335',
  gold: '#FBBC05',
  emerald: '#34A853',
  amber: '#FBBC05',
  rose: '#EA4335',
  blue: '#4285F4',
  textMuted: '#848785',
  textDark: '#1C1C1E',
  gridLine: 'rgba(0,0,0,0.08)',
};

interface ProgressionChartProps {
  data: ExerciseProgressPoint[];
  exerciseName: string;
}

export const ProgressionChart: React.FC<ProgressionChartProps> = ({ data, exerciseName }) => {
  const [range, setRange] = useState<4 | 8>(8);
  const [metric, setMetric] = useState<'1RM' | 'volume'>('1RM');

  const chartData = data.slice(-range).map((p) => ({
    week: p.week,
    '1RM': Math.round(p.estimated1RM * 10) / 10,
    volume: p.totalVolume,
    rpe: p.avgRPE,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight">{exerciseName}</h4>
          <p className="text-[10px] text-[#848785] font-mono uppercase tracking-wider">
            {metric === '1RM' ? 'Estimated 1RM Progression' : 'Total Volume per Session'}
          </p>
        </div>
        <div className="flex gap-1">
          <div className="flex bg-[#F2F2F7] rounded-lg p-0.5 border border-[rgba(0,0,0,0.08)]">
            {(['1RM', 'volume'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  metric === m ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-[#848785]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex bg-[#F2F2F7] rounded-lg p-0.5 border border-[rgba(0,0,0,0.08)]">
            {([4, 8] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                  range === r ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-[#848785]'
                }`}
              >
                {r}W
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        {metric === '1RM' ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="grad1rm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={COLORS.gridLine} vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: COLORS.textMuted, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: COLORS.textMuted, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 3', 'dataMax + 3']}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: `1px solid ${COLORS.gridLine}`,
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              labelStyle={{ fontWeight: 'bold', color: COLORS.textDark }}
              formatter={(v: number) => [`${v} kg`, 'Est. 1RM']}
            />
            <Area
              type="monotone"
              dataKey="1RM"
              stroke={COLORS.primary}
              strokeWidth={2.5}
              fill="url(#grad1rm)"
              dot={{ r: 3, fill: COLORS.primary }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={COLORS.gridLine} vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: COLORS.textMuted, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: COLORS.textMuted, fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: `1px solid ${COLORS.gridLine}`,
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volume']}
            />
            <Bar dataKey="volume" fill={COLORS.accent} radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

interface ComplianceHeatmapProps {
  sessions: TrainingSession[];
  macroHistory: DailyMacroLog[];
}

export const ComplianceHeatmap: React.FC<ComplianceHeatmapProps> = ({ sessions, macroHistory }) => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const sessionMap = new Map<string, TrainingSession>();
  sessions.forEach((s) => {
    const label = s.dateLabel.toUpperCase();
    sessionMap.set(label, s);
  });

  const macroMap = new Map<string, DailyMacroLog>();
  macroHistory.forEach((m) => {
    const label = m.dateLabel.toUpperCase();
    macroMap.set(label, m);
  });

  const getTrainingColor = (day: string) => {
    const s = sessionMap.get(day);
    if (!s) {
      const dayLog = macroMap.get(day);
      if (dayLog) return dayLog.calories > 0 ? '#F7F5F0' : '#F0EDE8';
      return '#F7F5F0';
    }
    if (!s.completed) return 'rgba(0,0,0,0.08)';
    if (s.avgRPE >= 8.5) return '#EA4335';
    if (s.avgRPE >= 7) return '#C9A227';
    if (s.avgRPE >= 4) return '#34A853';
    return '#A8BFB0';
  };

  const getMacroAdherence = (day: string) => {
    const m = macroMap.get(day);
    if (!m) return 0;
    const calPct = (m.calories / m.calorieTarget) * 100;
    const proteinPct = (m.protein / m.proteinTarget) * 100;
    return Math.round((calPct + proteinPct) / 2);
  };

  const getMacroColor = (adherence: number) => {
    if (adherence >= 90) return '#3B7A57';
    if (adherence >= 80) return '#34A853';
    if (adherence >= 70) return '#B8860B';
    return '#C05050';
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
      <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight mb-1">Weekly Compliance Matrix</h4>
      <p className="text-[10px] text-[#848785] font-mono uppercase tracking-wider mb-3">
        Training Intensity & Nutrition Adherence
      </p>

      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1.5">
        <div />
        <div className="text-[8px] font-mono font-bold text-[#848785] uppercase tracking-wider text-center">Train</div>
        <div className="text-[8px] font-mono font-bold text-[#848785] uppercase tracking-wider text-center">Fuel</div>

        {days.map((day) => {
          const adherence = getMacroAdherence(day);
          return (
            <React.Fragment key={day}>
              <div className="text-[9px] font-mono font-bold text-[#848785] flex items-center w-8">{day}</div>
              <div className="flex items-center justify-center">
                <div
                  className="w-full h-7 rounded-lg flex items-center justify-center text-[8px] font-mono font-bold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: getTrainingColor(day) }}
                >
                  {sessionMap.get(day)?.completed ? `${sessionMap.get(day)!.avgRPE.toFixed(1)}` : '—'}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div
                  className="w-full h-7 rounded-lg flex items-center justify-center text-[8px] font-mono font-bold text-white transition-all hover:scale-105"
                  style={{
                    backgroundColor: adherence > 0 ? getMacroColor(adherence) : 'rgba(0,0,0,0.08)',
                  }}
                >
                  {adherence > 0 ? `${adherence}%` : '—'}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#EA4335]" />
          <span className="text-[8px] font-mono text-[#848785]">RPE 8.5+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#C9A227]" />
          <span className="text-[8px] font-mono text-[#848785]">RPE 7-8</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#34A853]" />
          <span className="text-[8px] font-mono text-[#848785]">RPE 4-7</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <div className="w-3 h-3 rounded bg-red-700" />
          <span className="text-[8px] font-mono text-[#848785]">90%+</span>
        </div>
      </div>
    </div>
  );
};

interface MacroAdherenceChartProps {
  macroHistory: DailyMacroLog[];
}

export const MacroAdherenceChart: React.FC<MacroAdherenceChartProps> = ({ macroHistory }) => {
  const data = [...macroHistory].reverse().map((m) => ({
    day: m.dateLabel,
    Calories: m.calories,
    Target: m.calorieTarget,
    Protein: m.protein,
    ProteinTarget: m.proteinTarget,
    Carbs: m.carbs,
    CarbsTarget: m.carbsTarget,
    Fat: m.fat,
    FatTarget: m.fatTarget,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight">Macro Adherence</h4>
          <p className="text-[10px] text-[#848785] font-mono uppercase tracking-wider">Daily Intake vs Target</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#34A853]" />
            <span className="text-[8px] font-mono text-[#848785]">P</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#EA4335]" />
            <span className="text-[8px] font-mono text-[#848785]">C</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#C9A227]" />
            <span className="text-[8px] font-mono text-[#848785]">F</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="2 4" stroke={COLORS.gridLine} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: `1px solid ${COLORS.gridLine}`,
              fontSize: '10px',
              fontFamily: 'monospace',
            }}
            formatter={(v: number, name: string) => [`${v}g`, name]}
          />
          <Bar dataKey="Protein" fill={COLORS.primary} radius={[3, 3, 0, 0]} barSize={8} />
          <Bar dataKey="Carbs" fill={COLORS.accent} radius={[3, 3, 0, 0]} barSize={8} />
          <Bar dataKey="Fat" fill={COLORS.gold} radius={[3, 3, 0, 0]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface RecoveryTrendProps {
  recoveryTrend: number[];
  recoveryScore: number;
}

export const RecoveryTrendChart: React.FC<RecoveryTrendProps> = ({ recoveryTrend, recoveryScore }) => {
  const data = recoveryTrend.map((v, i) => ({
    day: ['THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED'][i] || `D${i + 1}`,
    recovery: v,
  }));

  const trendColor = recoveryScore >= 85 ? COLORS.emerald : recoveryScore >= 70 ? COLORS.amber : COLORS.rose;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight">Recovery Trend</h4>
          <p className="text-[10px] text-[#848785] font-mono uppercase tracking-wider">7-Day Readiness Score</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black tabular-nums" style={{ color: trendColor }}>
            {recoveryScore}%
          </div>
          <div className="text-[8px] font-mono text-[#848785] uppercase">Current</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRecovery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke={COLORS.gridLine} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[50, 100]}
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: `1px solid ${COLORS.gridLine}`,
              fontSize: '10px',
              fontFamily: 'monospace',
            }}
            formatter={(v: number) => [`${v}%`, 'Recovery']}
          />
          <ReferenceLine y={85} stroke={COLORS.emerald} strokeDasharray="3 3" strokeOpacity={0.4} />
          <Area
            type="monotone"
            dataKey="recovery"
            stroke={trendColor}
            strokeWidth={2.5}
            fill="url(#gradRecovery)"
            dot={{ r: 2.5, fill: trendColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface VolumeTrendChartProps {
  sessions: TrainingSession[];
}

export const VolumeTrendChart: React.FC<VolumeTrendChartProps> = ({ sessions }) => {
  const data = [...sessions].reverse().map((s) => ({
    day: s.dateLabel,
    volume: s.totalVolume,
    rpe: s.avgRPE,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
      <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight mb-1">Session Volume Trend</h4>
      <p className="text-[10px] text-[#848785] font-mono uppercase tracking-wider mb-3">Total Tonnage per Session</p>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={COLORS.gridLine} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: `1px solid ${COLORS.gridLine}`,
              fontSize: '10px',
              fontFamily: 'monospace',
            }}
            formatter={(v: number) => [`${v.toFixed(1)} MT`, 'Volume']}
          />
          <Bar dataKey="volume" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface BodyweightChartProps {
  history: { week: string; weight: number }[];
}

export const BodyweightChart: React.FC<BodyweightChartProps> = ({ history }) => {
  const data = history.map((p) => ({ week: p.week, weight: p.weight }));
  const minW = Math.min(...history.map((p) => p.weight));
  const maxW = Math.max(...history.map((p) => p.weight));
  const delta = (history[history.length - 1].weight - history[0].weight).toFixed(1);
  const isGain = parseFloat(delta) >= 0;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight">Bodyweight Trend</h4>
          <p className="text-[10px] text-[#848785] font-mono uppercase tracking-wider">8-Week Progression</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-black tabular-nums text-[#1C1C1E]">
            {history[history.length - 1].weight.toFixed(1)} <span className="text-[9px] text-[#848785] font-mono">KG</span>
          </div>
          <div className={`text-[9px] font-mono font-bold ${isGain ? 'text-zinc-600' : 'text-red-600'}`}>
            {isGain ? '+' : ''}{delta} KG / 8WK
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke={COLORS.gridLine} vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minW - 0.3, maxW + 0.3]}
            tick={{ fontSize: 8, fill: COLORS.textMuted, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: `1px solid ${COLORS.gridLine}`,
              fontSize: '10px',
              fontFamily: 'monospace',
            }}
            formatter={(v: number) => [`${v.toFixed(1)} kg`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={COLORS.blue}
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: COLORS.blue }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
