import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronDown, ChevronUp, Dumbbell, Footprints, Utensils, Moon,
  Sparkles, Clock, Flame, Calendar, Weight, Target, Award,
  Share2, Trash2, TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
  Plus, Star, Brain, Play, Square, RotateCcw, Zap, MapPin,
  Smartphone, Activity, Camera, HeartPulse, CheckCircle2,
  Sunrise, Package, Coffee,
} from 'lucide-react';
import {
  ChartStyleSwitcher,
  type ChartStyle,
  WorkoutBarChart, WorkoutTrendChart, WorkoutRingChart,
  StepsBarChart, StepsTrendChart, StepsRadialChart,
  NutritionBarChart, NutritionTrendChart, NutritionDonutChart,
  SleepBarChart, SleepTrendChart, SleepDialChart,
  MeditationBarChart, MeditationTrendChart, MeditationRingChart,
} from './LogCharts';
import { pedometer, type PedometerState } from '@/utils/pedometer';
import {
  type CompletedSession,
  loadCompletedSessions,
  deleteCompletedSession,
} from '@/utils/sessionVaultStore';
import { fetchDailyMacros, fetchBodyweightHistory } from '@/utils/telemetryStore';
import { loadDailySteps, upsertDailySteps, deleteDailySteps, type DailyStepEntry } from '@/utils/stepsStore';
import { loadSleepLogs, upsertSleepLog, deleteSleepLog, type SleepLogEntry } from '@/utils/sleepStore';
import { loadMeditationSessions, saveMeditationSession, deleteMeditationSession, type MeditationEntry } from '@/utils/meditationStore';
import { CardioMachineType, CardioMachineEntry } from '@/types/cardio';
import { getCardioLogs, saveCardioLog, deleteCardioLog } from '@/utils/cardioStorage';
import { CardioConsoleScanModal } from './CardioConsoleScanModal';
import { loadCachedDailyMeals } from '@/utils/mealLogsStore';
import { getUserState, getSessionUserEmail } from '@/utils/authStorage';
import type { DailyMacroLog, DailyMeals, LoggedMealItem } from '@/types';

interface HistoryLogViewProps {
  currentUserEmail: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenPayPlan?: () => void;
  refreshTrigger?: number;
  dailyMeals?: DailyMeals;
  goalCals?: number;
  goalP?: number;
  goalC?: number;
  goalF?: number;
  onNavigateToFuel?: () => void;
}

// ─── Helpers ────────────────────────────────────────────

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

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Accordion Header ───────────────────────────────────

function useChartStyles(): [Record<string, ChartStyle>, (key: string, style: ChartStyle) => void] {
  const [styles, setStyles] = useState<Record<string, ChartStyle>>(() => {
    try {
      const saved = localStorage.getItem('log-chart-styles');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const setStyle = useCallback((key: string, style: ChartStyle) => {
    setStyles(prev => {
      const next = { ...prev, [key]: style };
      try { localStorage.setItem('log-chart-styles', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  return [styles, setStyle];
}

function AccordionHeader({
  icon, label, iconBg, summary, isOpen, onToggle, chartStyle, onChartStyleChange, isFirst, isLast,
}: {
  icon: React.ReactNode;
  label: string;
  iconBg: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  chartStyle?: ChartStyle;
  onChartStyleChange?: (s: ChartStyle) => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`w-full flex items-center justify-between py-3 px-3.5 transition-colors cursor-pointer select-none group hover:bg-black/[0.02] dark:hover:bg-white/[0.04] ${
        isFirst ? 'rounded-t-[20px]' : ''
      } ${isLast && !isOpen ? 'rounded-b-[20px]' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Apple Health Squircle Icon (28x28 with 7px radius, solid high-contrast glyph) */}
        <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 shadow-xs text-white ${iconBg}`}>
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight">{label}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {summary && (
          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-white/40 tracking-tight">{summary}</span>
        )}
        {isOpen && chartStyle && onChartStyleChange && (
          <div className="shrink-0 mr-1" onClick={e => e.stopPropagation()}>
            <ChartStyleSwitcher value={chartStyle} onChange={onChartStyleChange} />
          </div>
        )}
        <div className="text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/60 transition shrink-0 ml-1">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}

// ─── Workout Section ────────────────────────────────────

function WorkoutSection({
  sessions, onDelete, onShare,
}: {
  sessions: CompletedSession[];
  onDelete: (id: string) => void;
  onShare: (s: CompletedSession) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const safeSessions = sessions || [];
  const totalSessions = safeSessions.length;
  const totalVolume = safeSessions.reduce((s, x) => s + (x.total_volume_kg || 0), 0);
  const totalTime = safeSessions.reduce((s, x) => s + (x.duration_secs || 0), 0);

  if (safeSessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Dumbbell className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-white/10" />
        <p className="text-[11px] font-mono text-slate-400 dark:text-white/30">No workouts logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Sessions', value: String(totalSessions), icon: <Dumbbell className="w-3 h-3" /> },
          { label: 'Volume', value: formatVolume(totalVolume), icon: <Weight className="w-3 h-3" /> },
          { label: 'Time', value: totalTime > 0 ? formatDuration(totalTime) : '--', icon: <Clock className="w-3 h-3" /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5 text-center log-card-inner">
            <div className="flex justify-center mb-0.5 text-slate-400 dark:text-white/30">{s.icon}</div>
            <div className="text-[13px] font-bold font-mono text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/35">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Session cards */}
      {safeSessions.slice(0, visibleCount).map(session => (
        <div key={session.id} className="rounded-2xl log-card overflow-hidden transition-all hover:border-slate-300 dark:hover:border-white/[0.12]">
          <button
            onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
            className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer"
          >
            <div className={`mt-0.5 w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${rpeBg(session.avg_rpe)}`}>
              <span className={`text-[10px] font-mono font-bold ${rpeColor(session.avg_rpe)}`}>
                {session.avg_rpe > 0 ? session.avg_rpe.toFixed(1) : '--'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{session.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono text-slate-500 dark:text-white/35">{relativeDate(session.completed_at)}</span>
                <span className="text-[9px] font-mono text-slate-400 dark:text-white/20">at</span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-white/35">{formatTime(session.completed_at)}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] font-mono text-slate-500 dark:text-white/45 flex items-center gap-1">
                  <Weight className="w-2.5 h-2.5 text-slate-400 dark:text-white/25" /> {formatVolume(session.total_volume_kg)}
                </span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-white/45 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-slate-400 dark:text-white/25" /> {session.total_sets} sets
                </span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-white/45 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-slate-400 dark:text-white/25" /> {formatDuration(session.duration_secs)}
                </span>
              </div>
            </div>
            <div className="shrink-0 mt-1 text-slate-400 dark:text-white/20">
              {expandedId === session.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {expandedId === session.id && (
            <div className="px-4 pb-3 animate-[fadeIn_0.2s_ease]">
              <div className="border-t border-slate-200 dark:border-white/[0.06] pt-3 space-y-2">
                {(session.exercises || []).map((ex, ei) => (
                  <div key={ei}>
                    <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-white/60 mb-1">{ex.name}</div>
                    <div className="grid grid-cols-4 gap-x-2 text-[8px] font-mono text-slate-400 dark:text-white/25 px-1 mb-0.5">
                      <span>SET</span><span>WEIGHT</span><span>REPS</span><span>RPE</span>
                    </div>
                    {(ex.sets || []).map((s, si) => (
                      <div key={si} className="grid grid-cols-4 gap-x-2 text-[10px] font-mono text-slate-700 dark:text-white/70 px-1 py-0.5">
                        <span className="text-slate-400 dark:text-white/30">{si + 1}</span>
                        <span>{s.weight > 0 ? `${s.weight} kg` : 'BW'}</span>
                        <span>{s.reps}</span>
                        <span className={s.rpe > 0 ? rpeColor(s.rpe) : 'text-slate-300 dark:text-white/20'}>
                          {s.rpe > 0 ? s.rpe.toFixed(1) : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                <button onClick={(e) => { e.stopPropagation(); onShare(session); }} className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05]">
                  <Share2 className="w-3 h-3" /> Share
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-red-400/50 hover:text-red-500 dark:hover:text-red-400 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/[0.08]">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {safeSessions.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((c) => c + 10)}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-[10px] font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
        >
          Load More ({safeSessions.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}

// ─── Steps Section ──────────────────────────────────────

function LivePedometerRing({ stepCount, goal }: { stepCount: number; goal: number }) {
  const pct = Math.min((stepCount / goal) * 100, 100);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 136 136" className="w-full h-full -rotate-90">
        <circle cx="68" cy="68" r={radius} fill="none" className="log-ring-track" strokeWidth="8" />
        <circle
          cx="68" cy="68" r={radius} fill="none"
          stroke="url(#stepGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="stepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34A853" />
            <stop offset="100%" stopColor="#34A853" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-black font-mono text-slate-900 dark:text-white leading-none">
          {stepCount.toLocaleString()}
        </span>
        <span className="text-[9px] font-mono text-slate-400 dark:text-white/40 uppercase tracking-widest mt-1.5 font-bold">
          / {goal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const CARDIO_MACHINES_LIST: { type: CardioMachineType; label: string; defaultMins: number; defaultCals: number; dist: number }[] = [
  { type: 'treadmill', label: 'Treadmill', defaultMins: 30, defaultCals: 320, dist: 3.5 },
  { type: 'stairmaster', label: 'StairMaster', defaultMins: 20, defaultCals: 260, dist: 0 },
  { type: 'rower', label: 'Rower', defaultMins: 20, defaultCals: 240, dist: 4.5 },
  { type: 'echo_bike', label: 'Air Bike', defaultMins: 15, defaultCals: 210, dist: 0 },
  { type: 'outdoor_run', label: 'Run', defaultMins: 30, defaultCals: 350, dist: 5.0 },
  { type: 'outdoor_walk', label: 'Walk', defaultMins: 45, defaultCals: 220, dist: 4.0 },
  { type: 'elliptical', label: 'Elliptical', defaultMins: 30, defaultCals: 280, dist: 3.8 },
  { type: 'skierg', label: 'SkiErg', defaultMins: 15, defaultCals: 200, dist: 2.5 },
];

function getMachineLabel(type: CardioMachineType): string {
  const found = CARDIO_MACHINES_LIST.find(m => m.type === type);
  return found ? found.label : type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function CardioStepsSection({
  entries,
  cardioLogs,
  email,
  onAdd,
  onDelete,
  onAddCardio,
  onDeleteCardio,
  onOpenScanModal,
}: {
  entries: DailyStepEntry[];
  cardioLogs: CardioMachineEntry[];
  email: string;
  onAdd: (date: string, steps: number, goal: number) => void;
  onDelete: (id: string) => void;
  onAddCardio: (entry: Omit<CardioMachineEntry, 'id' | 'timestamp'>) => void;
  onDeleteCardio: (id: string) => void;
  onOpenScanModal: () => void;
}) {
  const [subTab, setSubTab] = useState<'steps' | 'cardio'>('steps');

  // Steps state
  const [showManual, setShowManual] = useState(false);
  const [stepsVal, setStepsVal] = useState('');
  const [goalVal, setGoalVal] = useState('10000');
  const [pedometerState, setPedometerState] = useState<PedometerState>(pedometer.getState());

  // Cardio state
  const [showManualCardio, setShowManualCardio] = useState(false);
  const [cardioMachine, setCardioMachine] = useState<CardioMachineType>('treadmill');
  const [cardioMins, setCardioMins] = useState('30');
  const [cardioCals, setCardioCals] = useState('320');
  const [cardioDist, setCardioDist] = useState('3.5');
  const [cardioSteps, setCardioSteps] = useState('4200');
  const [cardioHr, setCardioHr] = useState('');
  const [cardioIncline, setCardioIncline] = useState('');
  const [cardioNotes, setCardioNotes] = useState('');

  useEffect(() => {
    return pedometer.subscribe(setPedometerState);
  }, []);

  const todayEntry = entries.find(e => e.log_date === todayStr());
  const last7 = entries.slice(0, 7);
  const avgSteps = last7.length > 0 ? Math.round(last7.reduce((s, e) => s + e.steps, 0) / last7.length) : 0;
  const maxSteps = last7.length > 0 ? Math.max(...last7.map(e => e.steps)) : 1;
  const goal = todayEntry?.goal || parseInt(goalVal) || 10000;

  const combinedSteps = (todayEntry?.steps || 0) + pedometerState.stepCount;

  // Cardio aggregates
  const totalCardioMins = cardioLogs.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
  const totalCardioCals = cardioLogs.reduce((acc, c) => acc + (c.caloriesBurned || 0), 0);
  const totalCardioDist = cardioLogs.reduce((acc, c) => acc + (c.distanceKm || 0), 0);

  const handleToggleTracking = useCallback(async () => {
    if (pedometerState.isTracking) {
      pedometer.stop();
      if (pedometerState.stepCount > 0) {
        const newTotal = (todayEntry?.steps || 0) + pedometerState.stepCount;
        onAdd(todayStr(), newTotal, goal);
        pedometer.resetToday();
      }
    } else {
      await pedometer.start();
    }
  }, [pedometerState.isTracking, pedometerState.stepCount, todayEntry, goal, onAdd]);

  const handleSaveProgress = useCallback(() => {
    if (pedometerState.stepCount > 0) {
      const newTotal = (todayEntry?.steps || 0) + pedometerState.stepCount;
      onAdd(todayStr(), newTotal, goal);
      pedometer.resetToday();
    }
  }, [pedometerState.stepCount, todayEntry, goal, onAdd]);

  const handleManualSubmit = () => {
    const s = parseInt(stepsVal);
    const g = parseInt(goalVal) || 10000;
    if (!s || s <= 0) return;
    onAdd(todayStr(), s, g);
    setStepsVal('');
    setShowManual(false);
  };

  const handleSelectMachine = (m: typeof CARDIO_MACHINES_LIST[0]) => {
    setCardioMachine(m.type);
    setCardioMins(String(m.defaultMins));
    setCardioCals(String(m.defaultCals));
    setCardioDist(m.dist > 0 ? String(m.dist) : '');
    setCardioSteps(String(Math.round(m.defaultMins * 140)));
  };

  const handleManualCardioSubmit = () => {
    const duration = parseInt(cardioMins) || 0;
    const calories = parseInt(cardioCals) || 0;
    const distance = parseFloat(cardioDist) || undefined;
    const steps = parseInt(cardioSteps) || undefined;
    const hr = parseInt(cardioHr) || undefined;
    const incline = parseFloat(cardioIncline) || undefined;

    if (duration <= 0 && calories <= 0) return;

    onAddCardio({
      date: 'Today',
      machineType: cardioMachine,
      durationMinutes: duration,
      caloriesBurned: calories,
      distanceKm: distance,
      stepsCount: steps,
      avgHeartRate: hr,
      inclinePercent: incline,
      notes: cardioNotes.trim() || undefined,
      source: 'manual_dial',
    });

    setShowManualCardio(false);
    setCardioNotes('');
  };

  return (
    <div className="space-y-3.5">
      {/* Sub-view Segmented Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-white/[0.06] rounded-xl border border-slate-200/50 dark:border-white/[0.04]">
        <button
          type="button"
          onClick={() => setSubTab('steps')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'steps'
              ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
          }`}
        >
          <Footprints className="w-3 h-3" />
          <span>Steps & Motion</span>
          {entries.length > 0 && (
            <span className="text-[8px] opacity-60 font-mono">({entries.length})</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cardio')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'cardio'
              ? 'bg-white dark:bg-[#2C2C2E] text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>Cardio Logs</span>
          <span className="text-[8px] opacity-60 font-mono">({cardioLogs.length})</span>
        </button>
      </div>

      {subTab === 'cardio' ? (
        /* ─── Cardio Machines Hub ─── */
        <div className="space-y-3 animate-[fadeIn_0.15s_ease]">
          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenScanModal}
              className="flex-1 py-2.5 px-3 rounded-xl bg-teal-500/15 dark:bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-teal-500/25 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Console Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setShowManualCardio(!showManualCardio)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual</span>
            </button>
          </div>

          {/* Quick Manual Entry Form */}
          {showManualCardio && (
            <div className="rounded-2xl log-card-inner p-3.5 space-y-3 border border-teal-500/20 animate-[fadeIn_0.15s_ease]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Log Cardio Session
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualCardio(false)}
                  className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white text-[10px] font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Apparatus selector pills */}
              <div>
                <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1.5 block">
                  Select Machine / Activity
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {CARDIO_MACHINES_LIST.map((m) => {
                    const isSelected = cardioMachine === m.type;
                    return (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => handleSelectMachine(m)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-medium tracking-wide transition cursor-pointer ${
                          isSelected
                            ? 'bg-teal-500 text-white shadow-xs font-bold'
                            : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={cardioMins}
                    onChange={(e) => {
                      setCardioMins(e.target.value);
                      const m = parseInt(e.target.value) || 0;
                      setCardioSteps(String(Math.round(m * 140)));
                    }}
                    placeholder="30"
                    className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={cardioCals}
                    onChange={(e) => setCardioCals(e.target.value)}
                    placeholder="320"
                    className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cardioDist}
                    onChange={(e) => setCardioDist(e.target.value)}
                    placeholder="3.5"
                    className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                    Steps Count
                  </label>
                  <input
                    type="number"
                    value={cardioSteps}
                    onChange={(e) => setCardioSteps(e.target.value)}
                    placeholder="4200"
                    className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                  />
                </div>
              </div>

              {/* Secondary details */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                    Avg HR (bpm) <span className="opacity-50">optional</span>
                  </label>
                  <input
                    type="number"
                    value={cardioHr}
                    onChange={(e) => setCardioHr(e.target.value)}
                    placeholder="138"
                    className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                    Incline / Level <span className="opacity-50">optional</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={cardioIncline}
                    onChange={(e) => setCardioIncline(e.target.value)}
                    placeholder="2.0"
                    className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">
                  Notes / Protocol
                </label>
                <input
                  type="text"
                  value={cardioNotes}
                  onChange={(e) => setCardioNotes(e.target.value)}
                  placeholder="e.g. 12-3-30 Incline Walk, Zone 2 Steady State"
                  className="w-full log-input rounded-lg px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-teal-500/40"
                />
              </div>

              <button
                type="button"
                onClick={handleManualCardioSubmit}
                className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm hover:bg-teal-600 transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Cardio Workout</span>
              </button>
            </div>
          )}

          {/* Cardio Stats Strip */}
          {cardioLogs.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/[0.04] text-center">
              <div>
                <div className="text-[12px] font-mono font-bold text-slate-800 dark:text-white">
                  {totalCardioMins}m
                </div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase">
                  Time
                </div>
              </div>
              <div>
                <div className="text-[12px] font-mono font-bold text-slate-800 dark:text-white">
                  {totalCardioCals.toLocaleString()}
                </div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase">
                  Calories
                </div>
              </div>
              <div>
                <div className="text-[12px] font-mono font-bold text-slate-800 dark:text-white">
                  {totalCardioDist.toFixed(1)}k
                </div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase">
                  Distance
                </div>
              </div>
              <div>
                <div className="text-[12px] font-mono font-bold text-teal-600 dark:text-teal-400">
                  {cardioLogs.length}
                </div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase">
                  Sessions
                </div>
              </div>
            </div>
          )}

          {/* Stored Cardio List */}
          <div className="space-y-2">
            {cardioLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl log-card-inner p-3 border border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-mono font-bold uppercase tracking-wider border border-teal-500/20">
                      {getMachineLabel(log.machineType)}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-white/30">
                      {log.date || 'Today'}
                    </span>
                    {log.source === 'ocr_scan' && (
                      <span className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400/80 uppercase">
                        • OCR Scan
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCardio(log.id)}
                    className="text-slate-300 dark:text-white/20 hover:text-red-500 transition cursor-pointer p-1 rounded-md"
                    title="Delete cardio log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stat pills in card */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
                  {log.durationMinutes > 0 && (
                    <div className="flex items-center gap-1 text-slate-700 dark:text-white/80">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-white/40" />
                      <span>{log.durationMinutes} min</span>
                    </div>
                  )}
                  {log.caloriesBurned > 0 && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>{log.caloriesBurned} kcal</span>
                    </div>
                  )}
                  {log.distanceKm !== undefined && log.distanceKm > 0 && (
                    <div className="flex items-center gap-1 text-slate-700 dark:text-white/80">
                      <MapPin className="w-3 h-3 text-slate-400 dark:text-white/40" />
                      <span>{log.distanceKm.toFixed(2)} km</span>
                    </div>
                  )}
                  {log.stepsCount !== undefined && log.stepsCount > 0 && (
                    <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold">
                      <Footprints className="w-3 h-3" />
                      <span>+{log.stepsCount.toLocaleString()} steps</span>
                    </div>
                  )}
                  {log.avgHeartRate !== undefined && log.avgHeartRate > 0 && (
                    <div className="flex items-center gap-1 text-red-500">
                      <HeartPulse className="w-3 h-3" />
                      <span>{log.avgHeartRate} bpm</span>
                    </div>
                  )}
                  {log.inclinePercent !== undefined && log.inclinePercent > 0 && (
                    <div className="text-[10px] font-mono text-slate-500 dark:text-white/40">
                      {log.inclinePercent}% inc
                    </div>
                  )}
                </div>

                {log.notes && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] text-[9px] font-mono text-slate-500 dark:text-white/40 italic">
                    "{log.notes}"
                  </div>
                )}
              </div>
            ))}

            {cardioLogs.length === 0 && !showManualCardio && (
              <div className="text-center py-6 px-4 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.08]">
                <Activity className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-white/15" />
                <p className="text-[11px] font-mono font-medium text-slate-600 dark:text-white/50 mb-1">
                  No Cardio Sessions Logged
                </p>
                <p className="text-[9px] font-mono text-slate-400 dark:text-white/30">
                  Scan an exercise console photo with OCR or log manual duration & calories
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Steps & Pedometer Hub ─── */
        <div className="space-y-3 animate-[fadeIn_0.15s_ease]">
          {/* Live pedometer card */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.05] dark:to-white/[0.02] border border-slate-200 dark:border-white/[0.08] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${pedometerState.isTracking ? 'text-teal-400' : 'text-slate-400 dark:text-white/30'}`} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">
                  {pedometerState.isTracking ? 'Live Tracking' : 'Pedometer'}
                </span>
              </div>
              {pedometerState.isTracking && (
                <span className="text-[9px] font-mono text-teal-400/60">{formatElapsed(pedometerState.elapsedSecs)}</span>
              )}
            </div>

            {/* Progress ring */}
            <LivePedometerRing stepCount={combinedSteps} goal={goal} />

            {/* Live stats strip */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <div className="text-[12px] font-bold font-mono text-slate-900 dark:text-white">{pedometerState.distanceKm.toFixed(2)}</div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider flex items-center justify-center gap-0.5">
                  <MapPin className="w-2 h-2" /> km
                </div>
              </div>
              <div className="text-center">
                <div className="text-[12px] font-bold font-mono text-slate-900 dark:text-white">{Math.round(pedometerState.caloriesBurned)}</div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider flex items-center justify-center gap-0.5">
                  <Flame className="w-2 h-2" /> cal
                </div>
              </div>
              <div className="text-center">
                <div className="text-[12px] font-bold font-mono text-slate-900 dark:text-white">{pedometerState.stepCount.toLocaleString()}</div>
                <div className="text-[7px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-wider flex items-center justify-center gap-0.5">
                  <Zap className="w-2 h-2" /> live
                </div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-2 mt-4">
              {pedometerState.isSupported ? (
                <>
                  <button
                    onClick={handleToggleTracking}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                      pedometerState.isTracking
                        ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25'
                        : 'bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25'
                    }`}
                  >
                    {pedometerState.isTracking ? (
                      <><Square className="w-3 h-3" /> Stop & Save</>
                    ) : (
                      <><Play className="w-3 h-3" /> Start Tracking</>
                    )}
                  </button>
                  {pedometerState.isTracking && pedometerState.stepCount > 0 && (
                    <button
                      onClick={handleSaveProgress}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 transition cursor-pointer active:scale-95"
                      title="Save and reset counter"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex-1 py-2.5 rounded-xl log-card-inner text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Smartphone className="w-3 h-3 text-slate-400 dark:text-white/25" />
                    <span className="text-[9px] font-mono text-slate-500 dark:text-white/35">Open on your phone to enable auto-tracking</span>
                  </div>
                </div>
              )}
            </div>

            {pedometerState.permissionState === 'denied' && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[8px] font-mono text-amber-400/70">Motion sensor access was denied. Check your browser settings to allow motion access for this site.</span>
              </div>
            )}
          </div>

          {/* Manual entry toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowManual(!showManual)}
              className="text-[9px] font-mono text-slate-500 dark:text-white/35 hover:text-slate-700 dark:hover:text-white/55 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Manual step entry
            </button>
            {todayEntry && (
              <span className="text-[9px] font-mono text-slate-400 dark:text-white/25">
                Saved: {todayEntry.steps.toLocaleString()} steps
              </span>
            )}
          </div>

          {/* Manual add form */}
          {showManual && (
            <div className="rounded-xl log-card-inner p-3 space-y-2 animate-[fadeIn_0.15s_ease]">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">Steps</label>
                  <input type="number" value={stepsVal} onChange={e => setStepsVal(e.target.value)} placeholder="e.g. 8500" className="w-full log-input rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-teal-500/40" />
                </div>
                <div className="w-24">
                  <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">Goal</label>
                  <input type="number" value={goalVal} onChange={e => setGoalVal(e.target.value)} className="w-full log-input rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-teal-500/40" />
                </div>
              </div>
              <button onClick={handleManualSubmit} className="w-full py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-teal-500/30 transition cursor-pointer">
                Log Steps
              </button>
            </div>
          )}

          {/* 7-day bar chart */}
          {last7.length > 0 && (
            <div>
              <div className="text-[9px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-2">Last 7 Days -- Avg {avgSteps.toLocaleString()}</div>
              <div className="flex items-end gap-1.5 h-14">
                {last7.slice().reverse().map(e => {
                  const pct = maxSteps > 0 ? (e.steps / maxSteps) * 100 : 0;
                  const hitGoal = e.steps >= e.goal;
                  return (
                    <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative" style={{ height: '44px' }}>
                        <div
                          className={`absolute bottom-0 w-full rounded-t-sm transition-all ${hitGoal ? 'bg-teal-400/60' : 'bg-slate-200 dark:bg-white/[0.12]'}`}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="text-[7px] font-mono text-slate-400 dark:text-white/25">
                        {new Date(e.log_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent entries */}
          {entries.slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center justify-between px-1 py-1.5">
              <div className="flex items-center gap-2">
                <Footprints className="w-3 h-3 text-teal-400/40" />
                <span className="text-[10px] font-mono text-slate-600 dark:text-white/50">{relativeDate(e.log_date + 'T12:00:00')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-bold ${e.steps >= e.goal ? 'text-teal-400' : 'text-slate-700 dark:text-white/70'}`}>
                  {e.steps.toLocaleString()}
                </span>
                <button onClick={() => onDelete(e.id)} className="text-slate-300 dark:text-white/15 hover:text-red-400/60 transition cursor-pointer p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {entries.length === 0 && !showManual && !pedometerState.isTracking && (
            <div className="text-center py-4">
              <Footprints className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-white/10" />
              <p className="text-[10px] font-mono text-slate-400 dark:text-white/30">Start tracking or add steps manually</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Food Section ───────────────────────────────────────

interface FoodSectionProps {
  macros: DailyMacroLog[];
  bodyweight: { week: string; weight: number }[];
  todayMeals?: DailyMeals;
  goalCals?: number;
  goalP?: number;
  goalC?: number;
  goalF?: number;
  onNavigateToFuel?: () => void;
}

function FoodSection({
  macros,
  bodyweight,
  todayMeals,
  goalCals = 3000,
  goalP = 180,
  goalC = 300,
  goalF = 70,
  onNavigateToFuel,
}: FoodSectionProps) {
  const mealCategories: { key: keyof DailyMeals; label: string; icon: React.ReactNode }[] = [
    { key: 'breakfast', label: 'Breakfast', icon: <Sunrise className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" strokeWidth={2} /> },
    { key: 'lunch', label: 'Lunch', icon: <Utensils className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" strokeWidth={2} /> },
    { key: 'dinner', label: 'Dinner', icon: <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" strokeWidth={2} /> },
    { key: 'snack', label: 'Snacks', icon: <Package className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" strokeWidth={2} /> },
    { key: 'drinks', label: 'Drinks', icon: <Coffee className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" strokeWidth={2} /> },
  ];

  const allItems = Object.values(todayMeals || {}).flat();
  const totalCals = allItems.reduce((s, i) => s + (Number(i.cals) || 0), 0);
  const totalP = allItems.reduce((s, i) => s + (Number(i.p) || 0), 0);
  const totalC = allItems.reduce((s, i) => s + (Number(i.c) || 0), 0);
  const totalF = allItems.reduce((s, i) => s + (Number(i.f) || 0), 0);
  const hasMealsToday = allItems.length > 0;

  if (!hasMealsToday && macros.length === 0 && bodyweight.length < 2) {
    return (
      <div className="text-center py-8 space-y-3">
        <Utensils className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-white/10" strokeWidth={1.8} />
        <p className="text-[11px] font-mono text-slate-400 dark:text-white/30">No nutrition data logged yet</p>
        {onNavigateToFuel && (
          <button
            onClick={onNavigateToFuel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-3 h-3" strokeWidth={2.2} /> Log Food in Fuel OS
          </button>
        )}
      </div>
    );
  }

  const hitDays = macros.filter(m => {
    const calHit = m.calorieTarget > 0 && m.calories >= m.calorieTarget * 0.85 && m.calories <= m.calorieTarget * 1.15;
    const protHit = m.proteinTarget > 0 && m.protein >= m.proteinTarget * 0.8;
    return calHit || protHit;
  }).length;
  const pct = macros.length > 0 ? Math.round((hitDays / macros.length) * 100) : 0;

  // Bodyweight sparkline
  const bwData = bodyweight.length >= 2 ? bodyweight : null;
  let bwDiff = 0;
  let bwTrend: 'up' | 'down' | 'stable' = 'stable';
  if (bwData) {
    bwDiff = bwData[bwData.length - 1].weight - bwData[0].weight;
    bwTrend = bwDiff > 0.2 ? 'up' : bwDiff < -0.2 ? 'down' : 'stable';
  }

  return (
    <div className="space-y-3">
      {/* Today's Intake Overview Card (if food logged today) */}
      {hasMealsToday && (
        <div className="rounded-xl p-3.5 log-card-inner space-y-3 border border-slate-200/60 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" strokeWidth={2} /> Today's Macro Intake
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">
              {Math.round(totalCals)} <span className="text-slate-400 dark:text-white/40 font-normal">/ {goalCals} kcal</span>
            </span>
          </div>

          {/* Calorie Bar */}
          <div className="w-full bg-slate-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-[#EA4335] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((totalCals / Math.max(1, goalCals)) * 100))}%` }}
            />
          </div>

          {/* Macro Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]">
              <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40">Protein</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {Math.round(totalP)}g <span className="text-[9px] font-normal text-slate-400 dark:text-white/30">/ {goalP}g</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]">
              <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40">Carbs</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {Math.round(totalC)}g <span className="text-[9px] font-normal text-slate-400 dark:text-white/30">/ {goalC}g</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]">
              <div className="text-[8px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40">Fat</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {Math.round(totalF)}g <span className="text-[9px] font-normal text-slate-400 dark:text-white/30">/ {goalF}g</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Logged Meals by Category */}
      {hasMealsToday && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
              <Utensils className="w-3 h-3 text-orange-400" strokeWidth={2} /> Logged Food ({allItems.length})
            </span>
            {onNavigateToFuel && (
              <button
                onClick={onNavigateToFuel}
                className="text-[9px] font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition cursor-pointer"
              >
                <span>Edit in Fuel OS</span>
                <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={2.2} />
              </button>
            )}
          </div>

          {mealCategories.map(({ key, label, icon }) => {
            const items = todayMeals?.[key] || [];
            if (items.length === 0) return null;
            const mealCals = items.reduce((s, i) => s + (Number(i.cals) || 0), 0);

            return (
              <div key={key} className="rounded-xl p-3 log-card-inner space-y-2 border border-slate-200/50 dark:border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-white tracking-wide">
                      {label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-white/40">
                      ({items.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    {Math.round(mealCals)} kcal
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {items.map((item) => (
                    <div key={item.id} className="py-2 first:pt-1 last:pb-0 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-slate-800 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 dark:text-white/40 mt-0.5 flex items-center gap-2">
                          <span>{item.weight}g</span>
                          <span>•</span>
                          <span>{item.p}p</span>
                          <span>{item.c}c</span>
                          <span>{item.f}f</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-white/80">
                          {Math.round(item.cals)} cal
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Consistency score */}
      {macros.length > 0 && (
        <div className="rounded-xl p-3 log-card-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
              <Target className="w-3 h-3" strokeWidth={2} /> Nutrition Consistency
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
                    score === 2 ? 'bg-red-500/60' : score === 1 ? 'bg-amber-500/40' : 'bg-slate-200 dark:bg-white/[0.08]'
                  }`} />
                  <span className="text-[7px] font-mono text-slate-400 dark:text-white/25">{m.dateLabel?.slice(0, 2) || ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bodyweight trend */}
      {bwData && (
        <div className="rounded-xl p-3 log-card-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" strokeWidth={2} /> Weight Journey
            </span>
            <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
              bwTrend === 'down' ? 'text-red-400' : bwTrend === 'up' ? 'text-amber-400' : 'text-slate-400 dark:text-white/40'
            }`}>
              {bwTrend === 'down' ? <ArrowDownRight className="w-3 h-3" strokeWidth={2} /> :
               bwTrend === 'up' ? <ArrowUpRight className="w-3 h-3" strokeWidth={2} /> :
               <Minus className="w-3 h-3" strokeWidth={2} />}
              {Math.abs(bwDiff).toFixed(1)} kg
            </span>
          </div>
          <div className="flex items-end gap-1 h-8">
            {bwData.map((d, i) => {
              const min = Math.min(...bwData.map(x => x.weight));
              const max = Math.max(...bwData.map(x => x.weight));
              const range = max - min || 1;
              const pct = ((d.weight - min) / range) * 100;
              return (
                <div key={i} className="flex-1 relative" style={{ height: '32px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-sm ${bwTrend === 'down' ? 'bg-red-400/40' : bwTrend === 'up' ? 'bg-amber-400/40' : 'bg-sky-400/30'}`}
                    style={{ height: `${Math.max(pct, 8)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] font-mono text-slate-400 dark:text-white/25">{bwData[0].weight.toFixed(1)} kg</span>
            <span className="text-[8px] font-mono text-slate-400 dark:text-white/25">{bwData[bwData.length - 1].weight.toFixed(1)} kg</span>
          </div>
        </div>
      )}

      {/* Daily macro history list */}
      {macros.slice(0, 7).map((m, i) => (
        <div key={i} className="flex items-center justify-between px-1 py-1.5">
          <div className="flex items-center gap-2">
            <Utensils className="w-3 h-3 text-orange-400/40" strokeWidth={2} />
            <span className="text-[10px] font-mono text-slate-600 dark:text-white/50">{m.dateLabel || m.date}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-700 dark:text-white/60">{Math.round(m.calories)} cal</span>
            <span className="text-[9px] font-mono text-slate-500 dark:text-white/35">{Math.round(m.protein)}g P</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sleep Section ──────────────────────────────────────

function SleepSection({
  entries, onAdd, onDelete,
}: {
  entries: SleepLogEntry[];
  onAdd: (date: string, bedtime: string, wakeTime: string, quality: number) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(3);

  const last7 = entries.slice(0, 7);
  const avgMins = last7.length > 0 ? Math.round(last7.reduce((s, e) => s + e.duration_minutes, 0) / last7.length) : 0;
  const avgH = Math.floor(avgMins / 60);
  const avgM = avgMins % 60;

  const handleSubmit = () => {
    onAdd(todayStr(), bedtime, wakeTime, quality);
    setShowForm(false);
  };

  const qualityLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="space-y-3">
      {/* Avg sleep + add */}
      <div className="flex items-center justify-between">
        <div>
          {avgMins > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-white">{avgH}h {String(avgM).padStart(2, '0')}m</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-white/30">avg / night</span>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">No sleep data yet</span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 transition cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl log-card-inner p-3 space-y-3 animate-[fadeIn_0.15s_ease]">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">Bedtime</label>
              <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} className="w-full log-input rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-indigo-500/40 dark:[color-scheme:dark]" />
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">Wake Up</label>
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="w-full log-input rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-indigo-500/40 dark:[color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1.5 block">Quality</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(q => (
                <button key={q} onClick={() => setQuality(q)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold transition cursor-pointer ${
                  quality === q ? 'bg-indigo-500/30 border border-indigo-500/40 text-indigo-500 dark:text-indigo-300' : 'log-chip hover:text-slate-600 dark:hover:text-white/60'
                }`}>
                  {q}
                </button>
              ))}
            </div>
            <div className="text-center mt-1">
              <span className="text-[8px] font-mono text-indigo-400/60">{qualityLabels[quality]}</span>
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-indigo-500/30 transition cursor-pointer">
            Log Sleep
          </button>
        </div>
      )}

      {/* 7-night bars */}
      {last7.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-2">Last 7 Nights</div>
          <div className="flex items-end gap-1.5 h-14">
            {last7.slice().reverse().map(e => {
              const pct = Math.min((e.duration_minutes / 600) * 100, 100);
              const good = e.duration_minutes >= 420;
              return (
                <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: '44px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-sm transition-all ${good ? 'bg-indigo-400/50' : 'bg-slate-200 dark:bg-white/[0.12]'}`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[7px] font-mono text-slate-400 dark:text-white/25">
                    {new Date(e.log_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.slice(0, 5).map(e => {
        const h = Math.floor(e.duration_minutes / 60);
        const m = e.duration_minutes % 60;
        return (
          <div key={e.id} className="flex items-center justify-between px-1 py-1.5">
            <div className="flex items-center gap-2">
              <Moon className="w-3 h-3 text-indigo-400/40" />
              <span className="text-[10px] font-mono text-slate-600 dark:text-white/50">{relativeDate(e.log_date + 'T12:00:00')}</span>
              {e.bedtime && <span className="text-[8px] font-mono text-slate-400 dark:text-white/25">{e.bedtime} - {e.wake_time}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-white/70">{h}h {String(m).padStart(2, '0')}m</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-2 h-2 ${s <= e.quality ? 'text-indigo-400 fill-indigo-400' : 'text-slate-200 dark:text-white/10'}`} />
                ))}
              </div>
              <button onClick={() => onDelete(e.id)} className="text-slate-300 dark:text-white/15 hover:text-red-400/60 transition cursor-pointer p-0.5">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-6">
          <Moon className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-white/10" />
          <p className="text-[10px] font-mono text-slate-400 dark:text-white/30">Tap + to log your sleep</p>
        </div>
      )}
    </div>
  );
}

// ─── Meditation Section ─────────────────────────────────

function MeditationSection({
  entries, onAdd, onDelete,
}: {
  entries: MeditationEntry[];
  onAdd: (durationSecs: number, soundscape: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [minutes, setMinutes] = useState('10');
  const [sound, setSound] = useState('Silence');

  const totalMins = entries.reduce((s, e) => s + e.duration_secs, 0) / 60;
  const streak = (() => {
    const dates = new Set(entries.map(e => e.completed_at.slice(0, 10)));
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (dates.has(ds)) s++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const handleSubmit = () => {
    const m = parseInt(minutes);
    if (!m || m <= 0) return;
    onAdd(m * 60, sound);
    setShowForm(false);
  };

  const soundOptions = ['Silence', 'Rain', 'Ocean', 'Forest', 'Wind', 'Fire', 'Singing Bowls'];

  return (
    <div className="space-y-3">
      {/* Stats + add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {entries.length > 0 ? (
            <>
              <div>
                <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-white">{Math.round(totalMins)}</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-white/30 ml-1">total min</span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-mono font-bold text-amber-400">{streak}-day</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">No sessions yet</span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl log-card-inner p-3 space-y-3 animate-[fadeIn_0.15s_ease]">
          <div>
            <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1 block">Duration (minutes)</label>
            <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="10" className="w-full log-input rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-cyan-500/40" />
          </div>
          <div>
            <label className="text-[8px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-1.5 block">Soundscape</label>
            <div className="flex flex-wrap gap-1.5">
              {soundOptions.map(s => (
                <button key={s} onClick={() => setSound(s)} className={`px-2.5 py-1 rounded-lg text-[9px] font-mono transition cursor-pointer ${
                  sound === s ? 'bg-cyan-500/25 border border-cyan-500/40 text-cyan-500 dark:text-cyan-300 font-bold' : 'log-chip hover:text-slate-600 dark:hover:text-white/60'
                }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} className="w-full py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition cursor-pointer">
            Log Session
          </button>
        </div>
      )}

      {/* Calendar heatmap (last 30 days) */}
      {entries.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-slate-500 dark:text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> 30-Day Practice
          </div>
          <div className="flex gap-[3px] flex-wrap">
            {Array.from({ length: 30 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              const ds = d.toISOString().slice(0, 10);
              const count = entries.filter(e => e.completed_at.slice(0, 10) === ds).length;
              return (
                <div
                  key={ds}
                  title={`${ds}: ${count} session${count !== 1 ? 's' : ''}`}
                  className={`w-[9px] h-[9px] rounded-[2px] ${
                    count === 0 ? 'bg-slate-200 dark:bg-white/[0.06]' : count === 1 ? 'bg-cyan-500/50' : 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.4)]'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {entries.slice(0, 5).map(e => (
        <div key={e.id} className="flex items-center justify-between px-1 py-1.5">
          <div className="flex items-center gap-2">
            <Brain className="w-3 h-3 text-cyan-400/40" />
            <span className="text-[10px] font-mono text-slate-600 dark:text-white/50">{relativeDate(e.completed_at)}</span>
            {e.soundscape && <span className="text-[8px] font-mono text-slate-400 dark:text-white/25">{e.soundscape}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-white/70">{formatDuration(e.duration_secs)}</span>
            <button onClick={() => onDelete(e.id)} className="text-slate-300 dark:text-white/15 hover:text-red-400/60 transition cursor-pointer p-0.5">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-6">
          <Brain className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-white/10" />
          <p className="text-[10px] font-mono text-slate-400 dark:text-white/30">Tap + to log a meditation session</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export const HistoryLogView: React.FC<HistoryLogViewProps> = ({
  currentUserEmail,
  showToast,
  onOpenPayPlan,
  refreshTrigger = 0,
  dailyMeals,
  goalCals = 3000,
  goalP = 180,
  goalC = 300,
  goalF = 70,
  onNavigateToFuel,
}) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [chartStyles, setChartStyle] = useChartStyles();
  const [loading, setLoading] = useState(!!currentUserEmail);

  // Data states
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [steps, setSteps] = useState<DailyStepEntry[]>([]);
  const [cardioLogs, setCardioLogs] = useState<CardioMachineEntry[]>(() => getCardioLogs());
  const [showCardioScanModal, setShowCardioScanModal] = useState<boolean>(false);
  const [macros, setMacros] = useState<DailyMacroLog[]>([]);
  const [bodyweight, setBodyweight] = useState<{ week: string; weight: number }[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLogEntry[]>([]);
  const [meditations, setMeditations] = useState<MeditationEntry[]>([]);

  // Local-first meals state
  const [todayMeals, setTodayMeals] = useState<DailyMeals>(() => {
    if (dailyMeals && Object.values(dailyMeals).flat().length > 0) return dailyMeals;
    const email = currentUserEmail || getSessionUserEmail() || '';
    const cached = loadCachedDailyMeals(email);
    if (cached && Object.values(cached).flat().length > 0) return cached;
    if (email) {
      const saved = getUserState(email);
      if (saved?.dailyMeals && Object.values(saved.dailyMeals).flat().length > 0) return saved.dailyMeals;
    }
    return { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] };
  });

  useEffect(() => {
    if (dailyMeals && Object.values(dailyMeals).flat().length > 0) {
      setTodayMeals(dailyMeals);
    }
  }, [dailyMeals]);

  useEffect(() => {
    setCardioLogs(getCardioLogs());
    if (!currentUserEmail) { setLoading(false); return; }
    setLoading(true);

    const email = currentUserEmail || getSessionUserEmail() || '';
    const cached = loadCachedDailyMeals(email);
    const localUserState = email ? getUserState(email) : null;
    const currentLocalMeals = (dailyMeals && Object.values(dailyMeals).flat().length > 0)
      ? dailyMeals
      : (cached && Object.values(cached).flat().length > 0)
        ? cached
        : (localUserState?.dailyMeals || null);

    if (currentLocalMeals) {
      setTodayMeals(currentLocalMeals);
    }

    Promise.all([
      loadCompletedSessions(currentUserEmail).catch(() => [] as CompletedSession[]),
      loadDailySteps(currentUserEmail).catch(() => [] as DailyStepEntry[]),
      fetchDailyMacros(currentUserEmail, 7).catch(() => [] as DailyMacroLog[]),
      fetchBodyweightHistory(currentUserEmail, 12).catch(() => [] as { week: string; weight: number }[]),
      loadSleepLogs(currentUserEmail).catch(() => [] as SleepLogEntry[]),
      loadMeditationSessions(currentUserEmail).catch(() => [] as MeditationEntry[]),
    ]).then(([sess, st, mac, bw, sl, med]) => {
      let updatedMacros = [...mac];
      const items = Object.values(currentLocalMeals || todayMeals || {}).flat();
      let tCals = 0, tP = 0, tC = 0, tF = 0;
      for (const item of items) {
        tCals += Number(item.cals) || 0;
        tP += Number(item.p) || 0;
        tC += Number(item.c) || 0;
        tF += Number(item.f) || 0;
      }
      if (items.length > 0 || tCals > 0) {
        const today = new Date().toISOString().split('T')[0];
        const existingIdx = updatedMacros.findIndex(m => m.date === today);
        const todayEntry: DailyMacroLog = {
          date: today,
          dateLabel: 'TODAY',
          calories: Math.round(tCals),
          calorieTarget: goalCals,
          protein: Math.round(tP),
          proteinTarget: goalP,
          carbs: Math.round(tC),
          carbsTarget: goalC,
          fat: Math.round(tF),
          fatTarget: goalF,
          hydration: 0,
          hydrationTarget: 3,
        };
        if (existingIdx >= 0) {
          updatedMacros[existingIdx] = { ...updatedMacros[existingIdx], ...todayEntry };
        } else {
          updatedMacros = [todayEntry, ...updatedMacros];
        }
      }

      setSessions(sess);
      setSteps(st);
      setMacros(updatedMacros);
      setBodyweight(bw);
      setSleepLogs(sl);
      setMeditations(med);
    }).finally(() => setLoading(false));
  }, [currentUserEmail, refreshTrigger, dailyMeals, goalCals, goalP, goalC, goalF]);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (key === 'steps') {
      if (currentUserEmail) {
        loadDailySteps(currentUserEmail).then(setSteps).catch(() => {});
      }
      setCardioLogs(getCardioLogs());
    }
  };

  // Handlers
  const handleDeleteSession = async (id: string) => {
    await deleteCompletedSession(currentUserEmail, id);
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast('Session removed');
  };

  const handleShareSession = async (session: CompletedSession) => {
    const text = `${session.title}\n${formatVolume(session.total_volume_kg)} -- ${session.total_sets} sets -- ${formatDuration(session.duration_secs)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Workout Session', text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      } catch {
        showToast('Unable to share right now');
      }
    }
  };

  const handleAddSteps = async (date: string, stepsVal: number, goal: number) => {
    const entry = await upsertDailySteps(currentUserEmail, date, stepsVal, goal);
    if (entry) {
      setSteps(prev => {
        const filtered = prev.filter(e => e.log_date !== date);
        return [entry, ...filtered].sort((a, b) => b.log_date.localeCompare(a.log_date));
      });
      showToast('Steps logged');
    }
  };

  const handleDeleteSteps = async (id: string) => {
    await deleteDailySteps(currentUserEmail, id);
    setSteps(prev => prev.filter(e => e.id !== id));
    showToast('Entry removed');
  };

  const handleAddCardio = (entryData: Omit<CardioMachineEntry, 'id' | 'timestamp'>) => {
    const newEntry = saveCardioLog(entryData);
    setCardioLogs(getCardioLogs());
    if (newEntry.stepsCount && newEntry.stepsCount > 0 && currentUserEmail) {
      const today = todayStr();
      const existingToday = steps.find(s => s.log_date === today);
      const currentSteps = existingToday?.steps || 0;
      const currentGoal = existingToday?.goal || 10000;
      handleAddSteps(today, currentSteps + newEntry.stepsCount, currentGoal);
    }
    showToast('Cardio session logged');
  };

  const handleDeleteCardio = (id: string) => {
    deleteCardioLog(id);
    setCardioLogs(getCardioLogs());
    showToast('Cardio session removed');
  };

  const handleCardioScanned = (entry: CardioMachineEntry) => {
    setCardioLogs(getCardioLogs());
    if (entry.stepsCount && entry.stepsCount > 0 && currentUserEmail) {
      const today = todayStr();
      const existingToday = steps.find(s => s.log_date === today);
      const currentSteps = existingToday?.steps || 0;
      const currentGoal = existingToday?.goal || 10000;
      handleAddSteps(today, currentSteps + entry.stepsCount, currentGoal);
    }
    showToast('Cardio session saved');
  };

  const handleAddSleep = async (date: string, bedtime: string, wakeTime: string, quality: number) => {
    const entry = await upsertSleepLog(currentUserEmail, date, bedtime, wakeTime, quality);
    if (entry) {
      setSleepLogs(prev => {
        const filtered = prev.filter(e => e.log_date !== date);
        return [entry, ...filtered].sort((a, b) => b.log_date.localeCompare(a.log_date));
      });
      showToast('Sleep logged');
    }
  };

  const handleDeleteSleep = async (id: string) => {
    await deleteSleepLog(currentUserEmail, id);
    setSleepLogs(prev => prev.filter(e => e.id !== id));
    showToast('Entry removed');
  };

  const handleAddMeditation = async (durationSecs: number, soundscape: string) => {
    const entry = await saveMeditationSession(currentUserEmail, durationSecs, soundscape);
    if (entry) {
      setMeditations(prev => [entry, ...prev]);
      showToast('Meditation logged');
    }
  };

  const handleDeleteMeditation = async (id: string) => {
    await deleteMeditationSession(currentUserEmail, id);
    setMeditations(prev => prev.filter(e => e.id !== id));
    showToast('Entry removed');
  };

  // Summary strings for collapsed headers
  const workoutSummary = sessions.length > 0 ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}` : '';
  const stepsSummary = (steps.length > 0 || cardioLogs.length > 0) ? (() => {
    const avg = steps.length > 0 ? Math.round(steps.slice(0, 7).reduce((s, e) => s + e.steps, 0) / Math.min(steps.length, 7)) : 0;
    const parts = [];
    if (avg > 0) parts.push(`${avg.toLocaleString()} steps`);
    if (cardioLogs.length > 0) parts.push(`${cardioLogs.length} cardio`);
    return parts.join(' • ') || 'Track motion';
  })() : '';
  const foodSummary = useMemo(() => {
    const allItems = Object.values(todayMeals || {}).flat();
    const todayCals = allItems.reduce((acc, i) => acc + (Number(i.cals) || 0), 0);
    if (allItems.length > 0) {
      return `${Math.round(todayCals)} cal today • ${allItems.length} item${allItems.length === 1 ? '' : 's'}`;
    }
    if (macros.length > 0 && (macros[0]?.calories || 0) > 0) {
      return `${Math.round(macros[0].calories)} cal today`;
    }
    return '';
  }, [todayMeals, macros]);
  const sleepSummary = sleepLogs.length > 0 ? (() => {
    const avg = Math.round(sleepLogs.slice(0, 7).reduce((s, e) => s + e.duration_minutes, 0) / Math.min(sleepLogs.length, 7));
    return `${Math.floor(avg / 60)}h ${avg % 60}m avg`;
  })() : '';
  const medSummary = meditations.length > 0 ? `${meditations.length} session${meditations.length !== 1 ? 's' : ''}` : '';

  if (loading) {
    return (
      <div className="mt-6 mb-4 flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
      </div>
    );
  }

  const chartFor = (key: string): ChartStyle => chartStyles[key] || 'bar';

  const workoutChart = chartFor('workout') === 'trend' ? <WorkoutTrendChart sessions={sessions} />
    : chartFor('workout') === 'ring' ? <WorkoutRingChart sessions={sessions} />
    : <WorkoutBarChart sessions={sessions} />;

  const stepsChart = chartFor('steps') === 'trend' ? <StepsTrendChart entries={steps} />
    : chartFor('steps') === 'ring' ? <StepsRadialChart entries={steps} />
    : <StepsBarChart entries={steps} />;

  const foodChart = chartFor('food') === 'trend' ? <NutritionTrendChart macros={macros} />
    : chartFor('food') === 'ring' ? <NutritionDonutChart macros={macros} />
    : <NutritionBarChart macros={macros} />;

  const sleepChart = chartFor('sleep') === 'trend' ? <SleepTrendChart entries={sleepLogs} />
    : chartFor('sleep') === 'ring' ? <SleepDialChart entries={sleepLogs} />
    : <SleepBarChart entries={sleepLogs} />;

  const medChart = chartFor('meditation') === 'trend' ? <MeditationTrendChart entries={meditations} />
    : chartFor('meditation') === 'ring' ? <MeditationRingChart entries={meditations} />
    : <MeditationBarChart entries={meditations} />;

  const sections = [
    {
      key: 'workout',
      label: 'Workout History',
      icon: <Dumbbell className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />,
      iconBg: 'bg-[#EA4335]',
      summary: workoutSummary,
      chart: workoutChart,
      content: <WorkoutSection sessions={sessions} onDelete={handleDeleteSession} onShare={handleShareSession} />,
    },
    {
      key: 'steps',
      label: 'Cardio / Steps',
      icon: <Footprints className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />,
      iconBg: 'bg-[#4285F4]',
      summary: stepsSummary,
      chart: stepsChart,
      content: (
        <CardioStepsSection
          entries={steps}
          cardioLogs={cardioLogs}
          email={currentUserEmail}
          onAdd={handleAddSteps}
          onDelete={handleDeleteSteps}
          onAddCardio={handleAddCardio}
          onDeleteCardio={handleDeleteCardio}
          onOpenScanModal={() => setShowCardioScanModal(true)}
        />
      ),
    },
    {
      key: 'food',
      label: 'Food & Nutrition',
      icon: <Utensils className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />,
      iconBg: 'bg-[#FBBC05]',
      summary: foodSummary,
      chart: foodChart,
      content: (
        <FoodSection
          macros={macros}
          bodyweight={bodyweight}
          todayMeals={todayMeals}
          goalCals={goalCals}
          goalP={goalP}
          goalC={goalC}
          goalF={goalF}
          onNavigateToFuel={onNavigateToFuel}
        />
      ),
    },
    {
      key: 'sleep',
      label: 'Sleep',
      icon: <Moon className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />,
      iconBg: 'bg-[#5D6B82]',
      summary: sleepSummary,
      chart: sleepChart,
      content: <SleepSection entries={sleepLogs} onAdd={handleAddSleep} onDelete={handleDeleteSleep} />,
    },
    {
      key: 'meditation',
      label: 'Meditation',
      icon: <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />,
      iconBg: 'bg-[#5A7E65]',
      summary: medSummary,
      chart: medChart,
      content: <MeditationSection entries={meditations} onAdd={handleAddMeditation} onDelete={handleDeleteMeditation} />,
    },
  ];

  return (
    <div className="mt-3 mb-3">
      {/* Apple Inset Grouped Table Container */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] rounded-[20px] shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
        {sections.map((s, idx) => (
          <div key={s.key} className="transition-colors">
            <AccordionHeader
              icon={s.icon}
              label={s.label}
              iconBg={s.iconBg}
              summary={s.summary}
              isOpen={openSections.has(s.key)}
              onToggle={() => toggleSection(s.key)}
              chartStyle={chartFor(s.key)}
              onChartStyleChange={(style) => setChartStyle(s.key, style)}
              isFirst={idx === 0}
              isLast={idx === sections.length - 1}
            />
            {openSections.has(s.key) && (
              <div className="px-3.5 pb-4 pt-1 animate-[fadeIn_0.2s_ease] bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/[0.04]">
                <div className="mb-3 rounded-xl log-card-inner px-3 py-2">
                  {s.chart}
                </div>
                {s.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* OCR Scan Console Modal */}
      <CardioConsoleScanModal
        isOpen={showCardioScanModal}
        onClose={() => setShowCardioScanModal(false)}
        onSaved={handleCardioScanned}
      />
    </div>
  );
};
