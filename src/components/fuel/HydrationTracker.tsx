import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Minus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

interface HydrationTrackerProps {
  currentUserEmail: string;
  targetLiters?: number;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const STORAGE_KEY = (email: string) => `lumina_hydration_${email}`;
const TODAY_KEY = () => new Date().toISOString().slice(0, 10);

interface HydrationRecord {
  date: string;
  liters: number;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  currentUserEmail,
  targetLiters = 3.0,
  showToast,
}) => {
  const [liters, setLiters] = useState(0);
  const [history, setHistory] = useState<HydrationRecord[]>([]);

  const loadHydration = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(currentUserEmail));
      if (raw) {
        const records: HydrationRecord[] = JSON.parse(raw);
        const today = records.find((r) => r.date === TODAY_KEY());
        if (today) return today.liters;
      }
    } catch (e) {}
    return 0;
  }, [currentUserEmail]);

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(currentUserEmail));
      if (raw) {
        const records: HydrationRecord[] = JSON.parse(raw);
        setHistory(records.slice(-14).reverse());
      }
    } catch (e) {}
  }, [currentUserEmail]);

  const syncFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const today = TODAY_KEY();
      const { data } = await supabase
        .from('daily_macros')
        .select('hydration, record_date')
        .eq('user_email', currentUserEmail)
        .order('record_date', { ascending: false })
        .limit(14);

      if (data && data.length > 0) {
        const todayRow = data.find((r) => r.record_date === today);
        if (todayRow && todayRow.hydration != null) {
          setLiters(Number(todayRow.hydration));
        }
        setHistory(
          data.map((r) => ({ date: r.record_date, liters: Number(r.hydration) || 0 }))
        );
      }
    } catch (e) {}
  }, [currentUserEmail]);

  useEffect(() => {
    setLiters(loadHydration());
    loadHistory();
    syncFromSupabase();
  }, [loadHydration, loadHistory, syncFromSupabase]);

  const saveHydration = (newLiters: number) => {
    setLiters(newLiters);
    try {
      const raw = localStorage.getItem(STORAGE_KEY(currentUserEmail));
      let records: HydrationRecord[] = raw ? JSON.parse(raw) : [];
      const todayIdx = records.findIndex((r) => r.date === TODAY_KEY());
      if (todayIdx >= 0) {
        records[todayIdx].liters = newLiters;
      } else {
        records.push({ date: TODAY_KEY(), liters: newLiters });
      }
      records = records.slice(-30);
      localStorage.setItem(STORAGE_KEY(currentUserEmail), JSON.stringify(records));
      setHistory(records.slice(-14).reverse());
    } catch (e) {}

    if (isSupabaseConfigured()) {
      supabase
        .from('daily_macros')
        .upsert(
          {
            user_email: currentUserEmail,
            record_date: TODAY_KEY(),
            hydration: newLiters,
            hydration_target: targetLiters,
          },
          { onConflict: 'user_email,record_date' }
        )
        .then(() => {});
    }
  };

  const addWater = (amount: number) => {
    const next = Math.max(0, Math.round((liters + amount) * 10) / 10);
    saveHydration(next);
    if (next >= targetLiters && liters < targetLiters) {
      showToast(`Hydration goal reached! ${next}L`, 'success');
    }
  };

  const pct = Math.min(100, (liters / targetLiters) * 100);

  const avgLiters = history.length > 0
    ? (history.reduce((s, r) => s + r.liters, 0) / history.length).toFixed(1)
    : '0.0';

  const sortedHistory = [...history].reverse();
  const last7: HydrationRecord[] = sortedHistory.slice(-7);
  const maxLiters = Math.max(targetLiters, ...last7.map((r) => r.liters), 1);

  const goalDays = history.filter((r) => r.liters >= targetLiters).length;
  const insight = pct >= 100
    ? `100% Target Met -- Optimal Hydration`
    : pct >= 60
    ? `${Math.round(pct)}% Target -- ${goalDays} Goal Days`
    : `${Math.round(pct)}% Target -- Aim for ${targetLiters}L`;

  return (
    <div className="relative bg-white dark:bg-[#0d1117] border border-[rgba(0,0,0,0.08)] dark:border-stone-500/10 rounded-2xl p-3 text-[#1C1C1E] dark:text-white flex flex-col gap-2 h-full min-h-[170px] max-h-[190px] shadow-2xs dark:shadow-none overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-zinc-500/10 dark:bg-zinc-500/8 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-[10px] font-mono font-bold text-[#1C1C1E] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-zinc-500/15 dark:bg-zinc-500/20 flex items-center justify-center">
            <Droplets className="w-3 h-3 text-zinc-500 dark:text-stone-400" />
          </div>
          Hydration
        </h3>
        <span className="text-[9px] font-mono text-[#848785] dark:text-neutral-500">
          Avg {avgLiters}L/day
        </span>
      </div>

      {/* Water fill + spark bars side by side */}
      <div className="relative z-10 flex items-stretch gap-2 flex-1 min-h-0">
        {/* Mini water fill gauge */}
        <div className="relative w-10 rounded-xl overflow-hidden border border-stone-500/15 dark:border-stone-500/10 bg-[#f0f8ff] dark:bg-[#030a14] flex-shrink-0">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
            style={{ height: `${pct}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-500/50 dark:from-stone-500/40 via-stone-400/30 dark:via-stone-400/20 to-stone-300/15 dark:to-stone-300/10" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black font-mono text-zinc-600 dark:text-stone-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {Math.round(pct)}%
            </span>
          </div>
        </div>

        {/* 7-Day bars */}
        <div className="flex items-end gap-1 flex-1">
          {last7.length > 0 ? last7.map((rec, i) => {
            const isToday = rec.date === TODAY_KEY();
            const barHeight = Math.max(4, (rec.liters / maxLiters) * 100);
            const hitGoal = rec.liters >= targetLiters;
            return (
              <div key={rec.date + i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    isToday
                      ? 'bg-gradient-to-t from-stone-500 to-stone-400 dark:from-stone-400 dark:to-stone-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                      : hitGoal
                      ? 'bg-stone-400/50 dark:bg-zinc-500/50'
                      : 'bg-zinc-500/15 dark:bg-zinc-500/20'
                  }`}
                  style={{ height: `${barHeight}%`, minHeight: '3px' }}
                />
                <span className={`text-[6px] font-mono ${isToday ? 'text-zinc-600 dark:text-stone-300 font-bold' : 'text-neutral-400 dark:text-neutral-600'}`}>
                  {DAY_LABELS[(new Date(rec.date).getDay() + 6) % 7]}
                </span>
              </div>
            );
          }) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <span className="text-[8px] font-mono text-[#848785] dark:text-neutral-600">No data yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Readout + Controls */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-baseline gap-0.5">
          <span className="font-mono text-xl font-black text-zinc-600 dark:text-stone-300 leading-none">{liters.toFixed(1)}</span>
          <span className="text-[10px] font-mono text-[#848785] dark:text-neutral-500">/ {targetLiters.toFixed(1)}L</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addWater(0.25)}
            className="px-2 py-1 rounded-lg bg-zinc-500/12 dark:bg-zinc-500/15 text-zinc-600 dark:text-stone-300 font-mono text-[10px] font-bold hover:bg-zinc-500/20 dark:hover:bg-zinc-500/25 active:scale-95 transition-all cursor-pointer"
          >
            +250
          </button>
          <button
            onClick={() => addWater(0.5)}
            className="px-2 py-1 rounded-lg bg-zinc-500/12 dark:bg-zinc-500/15 text-zinc-600 dark:text-stone-300 font-mono text-[10px] font-bold hover:bg-zinc-500/20 dark:hover:bg-zinc-500/25 active:scale-95 transition-all cursor-pointer"
          >
            +500
          </button>
          <button
            onClick={() => addWater(-0.25)}
            className="w-6 h-6 rounded-lg bg-[#E5E5EA] dark:bg-neutral-800 text-[#848785] dark:text-neutral-400 font-mono text-xs font-bold hover:text-[#1C1C1E] dark:hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Insight */}
      <div className="relative z-10 text-[8px] font-mono text-zinc-600/70 dark:text-stone-400/60 truncate">
        {insight}
      </div>
    </div>
  );
};
