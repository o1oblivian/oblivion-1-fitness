import React, { useState, useMemo } from 'react';
import {
  X, Calendar, Dumbbell, Footprints, Utensils, Moon, Sparkles,
  Plus, Trash2, Search, Filter, CheckCircle2, AlertCircle, Clock,
  Flame, MapPin, Weight, Target, ChevronRight, Activity
} from 'lucide-react';
import type { CompletedSession } from '@/utils/sessionVaultStore';
import type { DailyStepEntry } from '@/utils/stepsStore';
import type { SleepLogEntry } from '@/utils/sleepStore';
import type { MeditationEntry } from '@/utils/meditationStore';
import type { DailyMacroLog } from '@/types';
import { useModalBackHandler } from '@/utils/modalHistory';

export type HistoryCategory = 'workout' | 'steps' | 'food' | 'sleep' | 'meditation';
export type TimeframeFilter = '7d' | '30d' | '90d' | '180d' | '365d' | 'all';

interface YearHistoryExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: HistoryCategory;
  sessions: CompletedSession[];
  steps: DailyStepEntry[];
  macros: DailyMacroLog[];
  sleepLogs: SleepLogEntry[];
  meditations: MeditationEntry[];
  onAddSteps: (date: string, steps: number, goal: number) => void;
  onDeleteSteps: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onDeleteSleep: (id: string) => void;
  onDeleteMeditation: (id: string) => void;
  onAddSleep?: (date: string, bedtime: string, wakeTime: string, quality: number) => void;
  onSaveMacro?: (date: string, calories: number, protein: number, carbs: number, fat: number) => void;
  onNavigateToFuel?: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  try {
    const today = todayStr();
    const yesterday = yesterdayStr();
    if (dateStr.startsWith(today)) return 'Today';
    if (dateStr.startsWith(yesterday)) return 'Yesterday';

    const d = new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

export function YearHistoryExplorerModal({
  isOpen,
  onClose,
  initialCategory = 'steps',
  sessions,
  steps,
  macros,
  sleepLogs,
  meditations,
  onAddSteps,
  onDeleteSteps,
  onDeleteSession,
  onDeleteSleep,
  onDeleteMeditation,
  onAddSleep,
  onSaveMacro,
  onNavigateToFuel,
}: YearHistoryExplorerModalProps) {
  const [activeCategory, setActiveCategory] = useState<HistoryCategory>(initialCategory);
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('365d');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick manual log form states for backfilling
  const [showAddForm, setShowAddForm] = useState(false);
  const [formDate, setFormDate] = useState(yesterdayStr());
  const [stepInput, setStepInput] = useState('10000');
  const [stepGoalInput, setStepGoalInput] = useState('10000');
  const [sleepBedtime, setSleepBedtime] = useState('22:30');
  const [sleepWakeTime, setSleepWakeTime] = useState('06:30');
  const [sleepQuality, setSleepQuality] = useState(4);
  const [macroCals, setMacroCals] = useState('2400');
  const [macroProtein, setMacroProtein] = useState('160');
  const [macroCarbs, setMacroCarbs] = useState('250');
  const [macroFat, setMacroFat] = useState('65');

  // Keep category synchronized when opened
  React.useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  useModalBackHandler(isOpen, onClose, 'year_history_explorer_modal');

  if (!isOpen) return null;

  // Cutoff date based on timeframe
  const cutoffDate = (() => {
    if (timeframe === 'all') return null;
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : timeframe === '180d' ? 180 : 365;
    now.setDate(now.getDate() - days);
    return now.toISOString().slice(0, 10);
  })();

  // Filtered Steps
  const filteredSteps = steps.filter(s => {
    if (!s.log_date) return false;
    if (cutoffDate && s.log_date < cutoffDate) return false;
    if (searchQuery && !s.log_date.includes(searchQuery)) return false;
    return true;
  });

  // Filtered Workouts
  const filteredSessions = sessions.filter(w => {
    if (!w.completed_at) return false;
    const dateStr = w.completed_at.slice(0, 10);
    if (cutoffDate && dateStr < cutoffDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = w.title.toLowerCase().includes(q);
      const matchEx = w.exercises?.some(e => e.name.toLowerCase().includes(q));
      if (!matchTitle && !matchEx) return false;
    }
    return true;
  });

  // Filtered Macros
  const filteredMacros = macros.filter(m => {
    if (!m.date) return false;
    if (cutoffDate && m.date < cutoffDate) return false;
    if (searchQuery && !m.date.includes(searchQuery)) return false;
    return true;
  });

  // Filtered Sleep
  const filteredSleep = sleepLogs.filter(sl => {
    if (!sl.log_date) return false;
    if (cutoffDate && sl.log_date < cutoffDate) return false;
    if (searchQuery && !sl.log_date.includes(searchQuery)) return false;
    return true;
  });

  // Filtered Meditation
  const filteredMeditation = meditations.filter(m => {
    if (!m.completed_at) return false;
    const dateStr = m.completed_at.slice(0, 10);
    if (cutoffDate && dateStr < cutoffDate) return false;
    if (searchQuery && !m.soundscape.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Check Yesterday Steps Status
  const yDate = yesterdayStr();
  const yesterdayStepEntry = steps.find(s => s.log_date === yDate);

  const handleQuickAddYesterdaySteps = () => {
    setFormDate(yDate);
    setStepInput('10000');
    setStepGoalInput('10000');
    setShowAddForm(true);
  };

  const handleSubmitStepForm = (e: React.FormEvent) => {
    e.preventDefault();
    const st = parseInt(stepInput) || 0;
    const g = parseInt(stepGoalInput) || 10000;
    if (st > 0 && formDate) {
      onAddSteps(formDate, st, g);
      setShowAddForm(false);
    }
  };

  const handleSubmitSleepForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddSleep && formDate) {
      onAddSleep(formDate, sleepBedtime, sleepWakeTime, sleepQuality);
      setShowAddForm(false);
    }
  };

  const handleSubmitMacroForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveMacro && formDate) {
      const c = parseInt(macroCals) || 0;
      const p = parseInt(macroProtein) || 0;
      const cb = parseInt(macroCarbs) || 0;
      const f = parseInt(macroFat) || 0;
      onSaveMacro(formDate, c, p, cb, f);
      setShowAddForm(false);
    }
  };

  const categories: { id: HistoryCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'steps', label: 'Cardio / Steps', icon: <Footprints className="w-3.5 h-3.5" />, count: steps.length },
    { id: 'workout', label: 'Workout Vault', icon: <Dumbbell className="w-3.5 h-3.5" />, count: sessions.length },
    { id: 'food', label: 'Food & Nutrition', icon: <Utensils className="w-3.5 h-3.5" />, count: macros.length },
    { id: 'sleep', label: 'Sleep & Recovery', icon: <Moon className="w-3.5 h-3.5" />, count: sleepLogs.length },
    { id: 'meditation', label: 'Mindfulness', icon: <Sparkles className="w-3.5 h-3.5" />, count: meditations.length },
  ];

  const timeframes: { id: TimeframeFilter; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '3M' },
    { id: '180d', label: '6M' },
    { id: '365d', label: '1 Year' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.15s_ease]">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Activity History Vault
              </h2>
              <p className="text-[10px] font-mono text-slate-500 dark:text-white/40">
                1-Year Longitudinal Health & Training Records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-500 dark:text-white/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills Strip */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveCategory(c.id);
                  setShowAddForm(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold tracking-tight whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeCategory === c.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
                <span className="text-[9px] opacity-70">({c.count})</span>
              </button>
            ))}
          </div>

          {/* Timeframe Selector & Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-0.5 rounded-lg border border-slate-200/50 dark:border-white/[0.06]">
              {timeframes.map(tf => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition cursor-pointer ${
                    timeframe === tf.id
                      ? 'bg-white dark:bg-white/[0.15] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 dark:text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by date / name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] text-[10px] font-mono text-slate-800 dark:text-white outline-none w-36 sm:w-44 focus:border-red-500/40"
                />
              </div>

              {(activeCategory === 'steps' || activeCategory === 'sleep' || activeCategory === 'food') && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddForm ? 'Cancel' : 'Log Past Day'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Quick Backfill Form */}
          {showAddForm && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-3 animate-[fadeIn_0.15s_ease]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Add Entry for Past Date
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormDate(todayStr())}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                      formDate === todayStr() ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-white/60'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDate(yesterdayStr())}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                      formDate === yesterdayStr() ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-white/60'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                  />
                </div>

                {activeCategory === 'steps' && (
                  <>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Step Count</label>
                      <input
                        type="number"
                        value={stepInput}
                        onChange={(e) => setStepInput(e.target.value)}
                        placeholder="e.g. 10000"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Daily Goal</label>
                      <input
                        type="number"
                        value={stepGoalInput}
                        onChange={(e) => setStepGoalInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {activeCategory === 'sleep' && (
                  <>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Bedtime</label>
                      <input
                        type="time"
                        value={sleepBedtime}
                        onChange={(e) => setSleepBedtime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Wake Up</label>
                      <input
                        type="time"
                        value={sleepWakeTime}
                        onChange={(e) => setSleepWakeTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {activeCategory === 'food' && (
                  <>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Calories</label>
                      <input
                        type="number"
                        value={macroCals}
                        onChange={(e) => setMacroCals(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-slate-500 dark:text-white/40 uppercase mb-1 block">Protein (g)</label>
                      <input
                        type="number"
                        value={macroProtein}
                        onChange={(e) => setMacroProtein(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] text-[11px] font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={activeCategory === 'steps' ? handleSubmitStepForm : activeCategory === 'sleep' ? handleSubmitSleepForm : handleSubmitMacroForm}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </div>
          )}

          {/* ─── STEPS VIEW ─── */}
          {activeCategory === 'steps' && (
            <div className="space-y-3">
              {/* Yesterday Check Banner */}
              {!yesterdayStepEntry && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        Yesterday's steps ({yDate}) are not recorded yet
                      </p>
                      <p className="text-[9px] font-mono text-amber-600/80 dark:text-amber-400/70">
                        Keep your longitudinal step streak unbroken by logging yesterday's count.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddYesterdaySteps}
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-mono font-bold tracking-wider transition cursor-pointer shadow-xs"
                  >
                    + Log Yesterday
                  </button>
                </div>
              )}

              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center">
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredSteps.reduce((a, b) => a + b.steps, 0).toLocaleString()}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Total Steps</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400">
                    {filteredSteps.length > 0 ? Math.round(filteredSteps.reduce((a, b) => a + b.steps, 0) / filteredSteps.length).toLocaleString() : '0'}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Daily Average</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredSteps.length}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Days Recorded</div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-1.5">
                {filteredSteps.map(entry => {
                  const isHit = entry.steps >= entry.goal;
                  const isYesterday = entry.log_date === yDate;
                  const isToday = entry.log_date === todayStr();
                  const distKm = (entry.steps * 0.000762).toFixed(2);
                  const cal = Math.round(entry.steps * 0.04);

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${
                        isYesterday
                          ? 'bg-amber-500/5 dark:bg-amber-500/[0.03] border-amber-500/30'
                          : isToday
                            ? 'bg-teal-500/5 dark:bg-teal-500/[0.03] border-teal-500/30'
                            : 'bg-white dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold ${
                          isHit ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500'
                        }`}>
                          <Footprints className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                              {formatDisplayDate(entry.log_date)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 dark:text-white/30">
                              {entry.log_date}
                            </span>
                            {isYesterday && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-mono font-bold uppercase">
                                Yesterday
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[9px] font-mono text-slate-500 dark:text-white/40">
                            <span>{distKm} km</span>
                            <span>•</span>
                            <span>{cal} kcal</span>
                            <span>•</span>
                            <span>Goal: {entry.goal.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold font-mono ${isHit ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-white/70'}`}>
                          {entry.steps.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteSteps(entry.id)}
                          className="text-slate-300 dark:text-white/15 hover:text-red-500 transition cursor-pointer p-1 rounded-md"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredSteps.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-white/30 font-mono text-xs">
                    No step logs found for this timeframe.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── WORKOUT VIEW ─── */}
          {activeCategory === 'workout' && (
            <div className="space-y-3">
              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center">
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredSessions.length}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Sessions</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-red-500">
                    {(() => {
                      const totalKg = filteredSessions.reduce((a, b) => a + (b.total_volume_kg || 0), 0);
                      return totalKg >= 1000 ? `${(totalKg / 1000).toFixed(1)} MT` : `${Math.round(totalKg)} kg`;
                    })()}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Total Volume</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredSessions.reduce((a, b) => a + (b.total_sets || 0), 0)}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Total Sets</div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2">
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {session.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.06] text-[9px] font-mono text-slate-500 dark:text-white/40">
                            {formatDisplayDate(session.completed_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-slate-500 dark:text-white/40">
                          <span className="flex items-center gap-1">
                            <Weight className="w-2.5 h-2.5" />
                            {session.total_volume_kg >= 1000 ? `${(session.total_volume_kg / 1000).toFixed(1)} MT` : `${Math.round(session.total_volume_kg)} kg`}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Target className="w-2.5 h-2.5" />
                            {session.total_sets} sets
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.floor(session.duration_secs / 60)}m
                          </span>
                          {session.avg_rpe > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-red-400 font-bold">RPE {session.avg_rpe.toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        className="text-slate-300 dark:text-white/15 hover:text-red-500 transition cursor-pointer p-1 rounded-md"
                        title="Delete workout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Exercises brief */}
                    {session.exercises && session.exercises.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] flex flex-wrap gap-1.5">
                        {session.exercises.map((ex, ei) => (
                          <span key={ei} className="px-2 py-0.5 rounded-md bg-slate-100/70 dark:bg-white/[0.04] text-[8px] font-mono text-slate-600 dark:text-white/60">
                            {ex.name} ({ex.sets?.length || 0}s)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {filteredSessions.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-white/30 font-mono text-xs">
                    No workout sessions found in this period.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── FOOD & MACROS VIEW ─── */}
          {activeCategory === 'food' && (
            <div className="space-y-3">
              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center">
                <div>
                  <div className="text-sm font-mono font-bold text-amber-500">
                    {filteredMacros.length > 0 ? Math.round(filteredMacros.reduce((a, b) => a + b.calories, 0) / filteredMacros.length) : 0} kcal
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Avg Daily Cals</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredMacros.length > 0 ? Math.round(filteredMacros.reduce((a, b) => a + (b.protein || 0), 0) / filteredMacros.length) : 0}g
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Avg Protein</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredMacros.length}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Days Tracked</div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-1.5">
                {filteredMacros.map(macro => (
                  <div
                    key={macro.date}
                    className="p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {formatDisplayDate(macro.date)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-white/30">
                          {macro.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1 text-[9px] font-mono text-slate-500 dark:text-white/40">
                        <span className="text-amber-500 font-bold">{macro.calories} kcal</span>
                        <span>•</span>
                        <span>P: {macro.protein}g</span>
                        <span>•</span>
                        <span>C: {macro.carbs}g</span>
                        <span>•</span>
                        <span>F: {macro.fat}g</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {macro.calorieTarget > 0 ? `${Math.round((macro.calories / macro.calorieTarget) * 100)}%` : '--'}
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 dark:text-white/30 uppercase">
                        Target Adherence
                      </div>
                    </div>
                  </div>
                ))}

                {filteredMacros.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-white/30 font-mono text-xs">
                    No macro records found for this period.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── SLEEP VIEW ─── */}
          {activeCategory === 'sleep' && (
            <div className="space-y-3">
              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center">
                <div>
                  <div className="text-sm font-mono font-bold text-indigo-500">
                    {(() => {
                      const avg = filteredSleep.length > 0 ? Math.round(filteredSleep.reduce((a, b) => a + b.duration_minutes, 0) / filteredSleep.length) : 0;
                      return `${Math.floor(avg / 60)}h ${avg % 60}m`;
                    })()}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Avg Sleep</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredSleep.length > 0 ? (filteredSleep.reduce((a, b) => a + b.quality, 0) / filteredSleep.length).toFixed(1) : '0'} / 5
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Avg Quality</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredSleep.length}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Nights Logged</div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-1.5">
                {filteredSleep.map(entry => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {formatDisplayDate(entry.log_date)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-white/30">
                          {entry.log_date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-500 dark:text-white/40">
                        <span>{entry.bedtime} - {entry.wake_time}</span>
                        <span>•</span>
                        <span>Quality: {entry.quality}/5</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-indigo-500">
                        {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteSleep(entry.id)}
                        className="text-slate-300 dark:text-white/15 hover:text-red-500 transition cursor-pointer p-1 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredSleep.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-white/30 font-mono text-xs">
                    No sleep entries found in this period.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── MEDITATION VIEW ─── */}
          {activeCategory === 'meditation' && (
            <div className="space-y-3">
              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center">
                <div>
                  <div className="text-sm font-mono font-bold text-emerald-500">
                    {Math.round(filteredMeditation.reduce((a, b) => a + (b.duration_secs || 0), 0) / 60)} min
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Total Mindfulness</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredMeditation.length}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Sessions</div>
                </div>
                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {filteredMeditation.length > 0 ? Math.round(filteredMeditation.reduce((a, b) => a + (b.duration_secs || 0), 0) / (filteredMeditation.length * 60)) : 0} min
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">Avg Session</div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-1.5">
                {filteredMeditation.map(entry => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {formatDisplayDate(entry.completed_at)}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-mono font-bold">
                          {entry.soundscape}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 dark:text-white/30 mt-0.5">
                        {entry.completed_at.slice(0, 10)} at {new Date(entry.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-emerald-500">
                        {Math.round(entry.duration_secs / 60)} min
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteMeditation(entry.id)}
                        className="text-slate-300 dark:text-white/15 hover:text-red-500 transition cursor-pointer p-1 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredMeditation.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-white/30 font-mono text-xs">
                    No mindfulness entries recorded in this period.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-slate-400 dark:text-white/30">
            Records stored securely with offline synchronization
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer hover:opacity-90"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
