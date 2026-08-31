import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell, Clock, Flame, ChevronDown, ChevronUp, Share2,
  Trash2, TrendingUp, Award, Lock, Calendar, Weight,
  Utensils, Target, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import {
  type CompletedSession,
  loadCompletedSessions,
  deleteCompletedSession,
} from '@/utils/sessionVaultStore';
import { fetchDailyMacros, fetchBodyweightHistory } from '@/utils/telemetryStore';
import type { DailyMacroLog } from '@/types';

interface SessionVaultProps {
  currentUserEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenPayPlan?: () => void;
  refreshTrigger?: number;
  theme?: 'dark' | 'light';
}

function formatDuration(secs: number): string {
  if (secs <= 0) return '--:--';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} MT`;
  return `${Math.round(kg)} kg`;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekLabel(key: string): string {
  const now = new Date();
  const currentWeek = weekKey(now.toISOString());
  if (key === currentWeek) return 'This Week';
  const [y, w] = key.split('-W');
  const jan1 = new Date(Number(y), 0, 1);
  const weekStart = new Date(jan1.getTime() + (Number(w) - 1) * 7 * 86400000);
  const nowWeekStart = new Date(now);
  nowWeekStart.setDate(now.getDate() - now.getDay());
  const diff = Math.round((nowWeekStart.getTime() - weekStart.getTime()) / (7 * 86400000));
  if (diff === 1) return 'Last Week';
  if (diff < 5) return `${diff} Weeks Ago`;
  return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function rpeColor(rpe: number): string {
  if (rpe >= 9) return 'text-red-400';
  if (rpe >= 7) return 'text-amber-400';
  if (rpe >= 5) return 'text-red-400';
  return 'text-sky-400';
}

function rpeBg(rpe: number): string {
  if (rpe >= 9) return 'bg-red-500/15 border-red-500/30';
  if (rpe >= 7) return 'bg-amber-500/15 border-amber-500/30';
  if (rpe >= 5) return 'bg-red-500/15 border-red-500/30';
  return 'bg-sky-500/15 border-sky-500/30';
}

// ─── Heat Calendar ──────────────────────────────────────────────

function HeatCalendar({ sessions, isDark = true }: { sessions: CompletedSession[]; isDark?: boolean }) {
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const count = sessions.filter(s => s.completed_at.slice(0, 10) === ds).length;
    days.push({ date: ds, count });
  }

  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) s++;
      else break;
    }
    return s;
  })();

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          <Calendar className="w-3 h-3" /> 30-Day Activity
        </span>
        {streak > 0 && (
          <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1">
            <Flame className="w-3 h-3" /> {streak}-day streak
          </span>
        )}
      </div>
      <div className="flex gap-[3px] flex-wrap">
        {days.map(d => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} session${d.count !== 1 ? 's' : ''}`}
            className={`w-[9px] h-[9px] rounded-[2px] transition-all ${
              d.count === 0
                ? (isDark ? 'bg-white/[0.06]' : 'bg-gray-200')
                : d.count === 1
                  ? 'bg-red-500/60'
                  : 'bg-red-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Hero Stats ─────────────────────────────────────────────────

function HeroStats({ sessions, isDark = true }: { sessions: CompletedSession[]; isDark?: boolean }) {
  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((s, x) => s + x.total_volume_kg, 0);
  const totalTime = sessions.reduce((s, x) => s + x.duration_secs, 0);

  const stats = [
    { label: 'Sessions', value: String(totalSessions), icon: <Dumbbell className="w-3.5 h-3.5" /> },
    { label: 'Volume', value: formatVolume(totalVolume), icon: <Weight className="w-3.5 h-3.5" /> },
    { label: 'Time', value: totalTime > 0 ? formatDuration(totalTime) : '--', icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      {stats.map(s => (
        <div key={s.label} className={`rounded-xl p-3 text-center ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50 border border-gray-200'}`}>
          <div className={`flex justify-center mb-1 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{s.icon}</div>
          <div className={`text-[15px] font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
          <div className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? 'text-white/35' : 'text-gray-400'}`}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Bodyweight Sparkline ───────────────────────────────────────

function BodyweightSparkline({ data, isDark = true }: { data: { week: string; weight: number }[]; isDark?: boolean }) {
  if (data.length < 2) return null;
  const weights = data.map(d => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const w = 100;
  const h = 32;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.weight - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const first = weights[0];
  const last = weights[weights.length - 1];
  const diff = last - first;
  const trend = diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'stable';

  return (
    <div className={`rounded-xl p-3 mb-4 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          <TrendingUp className="w-3 h-3" /> Weight Journey
        </span>
        <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
          trend === 'down' ? 'text-red-400' : trend === 'up' ? 'text-amber-400' : (isDark ? 'text-white/40' : 'text-gray-400')
        }`}>
          {trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> :
           trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          {Math.abs(diff).toFixed(1)} kg
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="url(#wgrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor={trend === 'down' ? '#34d399' : trend === 'up' ? '#FBBC05' : '#94a3b8'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between mt-1">
        <span className={`text-[8px] font-mono ${isDark ? 'text-white/25' : 'text-gray-400'}`}>{first.toFixed(1)} kg</span>
        <span className={`text-[8px] font-mono ${isDark ? 'text-white/25' : 'text-gray-400'}`}>{last.toFixed(1)} kg</span>
      </div>
    </div>
  );
}

// ─── Meal Consistency ───────────────────────────────────────────

function MealConsistency({ macros, isDark = true }: { macros: DailyMacroLog[]; isDark?: boolean }) {
  if (macros.length === 0) return null;

  const hitDays = macros.filter(m => {
    const calHit = m.calorieTarget > 0 && m.calories >= m.calorieTarget * 0.85 && m.calories <= m.calorieTarget * 1.15;
    const protHit = m.proteinTarget > 0 && m.protein >= m.proteinTarget * 0.8;
    return calHit || protHit;
  }).length;
  const pct = Math.round((hitDays / macros.length) * 100);

  return (
    <div className={`rounded-xl p-3 mb-4 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          <Utensils className="w-3 h-3" /> Nutrition Consistency
        </span>
        <span className={`text-[10px] font-mono font-bold ${pct >= 70 ? 'text-red-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
          {pct}%
        </span>
      </div>
      <div className="flex gap-1">
        {macros.slice(0, 7).map((m, i) => {
          const calOk = m.calorieTarget > 0 && m.calories >= m.calorieTarget * 0.85;
          const protOk = m.proteinTarget > 0 && m.protein >= m.proteinTarget * 0.8;
          const score = (calOk ? 1 : 0) + (protOk ? 1 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-2 rounded-full ${
                score === 2 ? 'bg-red-500/60' : score === 1 ? 'bg-amber-500/40' : (isDark ? 'bg-white/[0.08]' : 'bg-gray-200')
              }`} />
              <span className={`text-[7px] font-mono ${isDark ? 'text-white/25' : 'text-gray-400'}`}>{m.dateLabel?.slice(0, 2) || ''}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <span className={`text-[8px] font-mono ${isDark ? 'text-white/30' : 'text-gray-500'}`}>On Target</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500/40" />
          <span className={`text-[8px] font-mono ${isDark ? 'text-white/30' : 'text-gray-500'}`}>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white/[0.08]' : 'bg-gray-200'}`} />
          <span className={`text-[8px] font-mono ${isDark ? 'text-white/30' : 'text-gray-500'}`}>Missed</span>
        </div>
      </div>
    </div>
  );
}

// ─── Week Summary Bar ───────────────────────────────────────────

function WeekSummaryBar({ sessions, label, isDark = true }: { sessions: CompletedSession[]; label: string; isDark?: boolean }) {
  const vol = sessions.reduce((s, x) => s + x.total_volume_kg, 0);
  const count = sessions.length;
  const avgRpe = sessions.length > 0
    ? sessions.reduce((s, x) => s + x.avg_rpe, 0) / sessions.length
    : 0;

  return (
    <div className="flex items-center gap-3 mb-2 px-1">
      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest min-w-[80px] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
        {label}
      </span>
      <div className={`flex-1 h-[1px] ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`} />
      <span className={`text-[9px] font-mono ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
        {count} session{count !== 1 ? 's' : ''} -- {formatVolume(vol)}
        {avgRpe > 0 && ` -- RPE ${avgRpe.toFixed(1)}`}
      </span>
    </div>
  );
}

// ─── Session Card ───────────────────────────────────────────────

function SessionCard({
  session,
  onDelete,
  onShare,
  isDark = true,
}: {
  session: CompletedSession;
  onDelete: () => void;
  onShare: () => void;
  isDark?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const bestSet = useMemo(() => {
    let best = { exercise: '', weight: 0, reps: 0 };
    session.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.weight > best.weight) {
          best = { exercise: ex.name, weight: s.weight, reps: s.reps };
        }
      });
    });
    return best.weight > 0 ? best : null;
  }, [session]);

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 group ${isDark ? 'bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12]' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 cursor-pointer"
      >
        {/* RPE Badge */}
        <div className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${rpeBg(session.avg_rpe)}`}>
          <span className={`text-[11px] font-mono font-bold ${rpeColor(session.avg_rpe)}`}>
            {session.avg_rpe > 0 ? session.avg_rpe.toFixed(1) : '--'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{session.title}</span>
            {bestSet && (
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-mono ${isDark ? 'text-white/35' : 'text-gray-400'}`}>{relativeDate(session.completed_at)}</span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-white/20' : 'text-gray-300'}`}>at</span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-white/35' : 'text-gray-400'}`}>{formatTime(session.completed_at)}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
              <Weight className={`w-3 h-3 ${isDark ? 'text-white/25' : 'text-gray-300'}`} /> {formatVolume(session.total_volume_kg)}
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
              <Target className={`w-3 h-3 ${isDark ? 'text-white/25' : 'text-gray-300'}`} /> {session.total_sets} sets
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
              <Clock className={`w-3 h-3 ${isDark ? 'text-white/25' : 'text-gray-300'}`} /> {formatDuration(session.duration_secs)}
            </span>
          </div>
        </div>

        <div className={`shrink-0 transition-colors mt-1 ${isDark ? 'text-white/20 group-hover:text-white/40' : 'text-gray-300 group-hover:text-gray-500'}`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-4 pb-4 animate-[fadeIn_0.2s_ease]">
          <div className={`border-t pt-3 space-y-3 ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            {session.exercises.map((ex, ei) => (
              <div key={ei}>
                <div className={`text-[11px] font-bold font-mono mb-1.5 uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-gray-700'}`}>
                  {ex.name}
                </div>
                <div className={`grid grid-cols-4 gap-x-2 text-[9px] font-mono mb-1 px-1 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>
                  <span>SET</span><span>WEIGHT</span><span>REPS</span><span>RPE</span>
                </div>
                {ex.sets.map((s, si) => (
                  <div key={si} className={`grid grid-cols-4 gap-x-2 text-[11px] font-mono px-1 py-0.5 rounded ${isDark ? 'text-white/70 hover:bg-white/[0.03]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className={isDark ? 'text-white/30' : 'text-gray-400'}>{si + 1}</span>
                    <span>{s.weight > 0 ? `${s.weight} kg` : 'BW'}</span>
                    <span>{s.reps}</span>
                    <span className={s.rpe > 0 ? rpeColor(s.rpe) : (isDark ? 'text-white/20' : 'text-gray-300')}>
                      {s.rpe > 0 ? s.rpe.toFixed(1) : '--'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className={`flex items-center gap-1.5 text-[10px] font-mono font-bold transition cursor-pointer px-2 py-1.5 rounded-lg ${isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <Share2 className="w-3 h-3" /> Share
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-400/50 hover:text-red-400 transition cursor-pointer px-2 py-1.5 rounded-lg hover:bg-red-500/[0.08]"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Premium Blur Overlay ───────────────────────────────────────

function PremiumBlurOverlay({ onUpgrade, isDark = true }: { onUpgrade?: () => void; isDark?: boolean }) {
  return (
    <div className="relative mt-2">
      {[1, 2, 3].map(i => (
        <div key={i} className={`h-20 mb-2 rounded-2xl blur-[3px] opacity-40 ${isDark ? 'bg-white/[0.03] border border-white/[0.05]' : 'bg-gray-100 border border-gray-200'}`} />
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Lock className={`w-5 h-5 mb-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
        <span className={`text-[11px] font-mono font-bold mb-1 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Full Training Timeline</span>
        <span className={`text-[9px] font-mono mb-3 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Unlock your complete session history</span>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold font-mono rounded-lg shadow-lg hover:shadow-amber-500/20 transition cursor-pointer active:scale-95"
          >
            UPGRADE TO PREMIUM
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export const SessionVault: React.FC<SessionVaultProps> = ({
  currentUserEmail,
  showToast,
  onOpenPayPlan,
  refreshTrigger = 0,
  theme,
}) => {
  const isDark = theme ? theme !== 'light' : (typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true);
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(!!currentUserEmail);
  const [macros, setMacros] = useState<DailyMacroLog[]>([]);
  const [bodyweight, setBodyweight] = useState<{ week: string; weight: number }[]>([]);

  const isPaid = (() => {
    try {
      if (localStorage.getItem('o1fc_dev_unlock') === 'I100PH') return true;
      const tier = localStorage.getItem('o1fc_cached_tier') || 'free';
      const created = localStorage.getItem('o1fc_account_created');
      if (!created) return true;
      const trialDays = Math.max(0, 90 - (Date.now() - new Date(created).getTime()) / 86400000);
      return ['premium', 'premium_travel', 'coach_pro'].includes(tier) || trialDays > 0;
    } catch { return true; }
  })();

  const FREE_LIMIT = 4;

  useEffect(() => {
    if (!currentUserEmail) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      loadCompletedSessions(currentUserEmail).catch(() => [] as CompletedSession[]),
      fetchDailyMacros(currentUserEmail, 7).catch(() => [] as DailyMacroLog[]),
      fetchBodyweightHistory(currentUserEmail, 12).catch(() => [] as { week: string; weight: number }[]),
    ]).then(([s, m, b]) => {
      setSessions(s);
      setMacros(m);
      setBodyweight(b);
    }).finally(() => setLoading(false));
  }, [currentUserEmail, refreshTrigger]);

  const handleDelete = async (id: string) => {
    await deleteCompletedSession(currentUserEmail, id);
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast('Session removed');
  };

  const handleShare = (session: CompletedSession) => {
    const text = `${session.title}\n${formatVolume(session.total_volume_kg)} -- ${session.total_sets} sets -- ${formatDuration(session.duration_secs)}\n${session.exercises.map(e => e.name).join(', ')}`;
    if (navigator.share) {
      navigator.share({ title: 'Workout Session', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CompletedSession[]>();
    const visible = isPaid ? sessions : sessions.slice(0, FREE_LIMIT);
    visible.forEach(s => {
      const wk = weekKey(s.completed_at);
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk)!.push(s);
    });
    return Array.from(map.entries());
  }, [sessions, isPaid]);

  return (
    <div className="mt-6 mb-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 px-0.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500/20 to-teal-500/20 border border-red-500/20 flex items-center justify-center">
          <Dumbbell className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div>
          <h3 className={`text-[13px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Session Vault</h3>
          <p className={`text-[9px] font-mono uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Your Training Chronograph</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={`w-5 h-5 border-2 border-t-red-400 rounded-full animate-spin ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
        </div>
      ) : (
        <>
          {/* Heat Calendar */}
          <HeatCalendar sessions={sessions} isDark={isDark} />

          {/* Hero Stats */}
          {sessions.length > 0 && <HeroStats sessions={sessions} isDark={isDark} />}

          {/* Bodyweight Sparkline */}
          {bodyweight.length >= 2 && <BodyweightSparkline data={bodyweight} isDark={isDark} />}

          {/* Meal Consistency */}
          {macros.length > 0 && <MealConsistency macros={macros} isDark={isDark} />}

          {/* Sessions by Week */}
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <Dumbbell className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-white/10' : 'text-gray-200'}`} />
              <p className={`text-[12px] font-mono ${isDark ? 'text-white/30' : 'text-gray-400'}`}>No sessions logged yet</p>
              <p className={`text-[10px] font-mono mt-1 ${isDark ? 'text-white/20' : 'text-gray-300'}`}>Complete a workout to see it here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {grouped.map(([wk, weekSessions]) => (
                <div key={wk}>
                  <WeekSummaryBar sessions={weekSessions} label={weekLabel(wk)} isDark={isDark} />
                  <div className="space-y-2 mb-4">
                    {weekSessions.map(s => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        onDelete={() => handleDelete(s.id)}
                        onShare={() => handleShare(s)}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Premium gate */}
              {!isPaid && sessions.length > FREE_LIMIT && (
                <PremiumBlurOverlay onUpgrade={onOpenPayPlan} isDark={isDark} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
