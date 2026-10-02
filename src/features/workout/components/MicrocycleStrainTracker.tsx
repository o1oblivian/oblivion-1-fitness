import React, { useState, useEffect } from 'react';
import { Activity, Layers, TrendingUp, Dumbbell } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useMicrocycleStore } from '../store/useMicrocycleStore';
import { DayStrainDetail } from './microcycle/microcycleTypes';
import { MicrocycleTowers } from './microcycle/MicrocycleTowers';
import { MicrocycleTrendChart } from './microcycle/MicrocycleTrendChart';
import { MicrocycleAnatomy } from './microcycle/MicrocycleAnatomy';
import { MicrocycleDayDetail } from './microcycle/MicrocycleDayDetail';
import { supabase } from '../../../services/supabaseClient';

export const MicrocycleStrainTracker: React.FC = () => {
  const activeDays = useMicrocycleStore((s) => s.activeDays);
  const [viewMode, setViewMode] = useState<'towers' | 'trend' | 'anatomy'>('towers');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(2); // Default to Wed (9.1k overload)

  useEffect(() => {
    useMicrocycleStore.getState().refreshFromSupabase();
    const ch = supabase.channel('microcycle-realtime-sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_logs' }, () => useMicrocycleStore.getState().refreshFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completed_sessions' }, () => useMicrocycleStore.getState().refreshFromSupabase())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const totalVolume = activeDays.reduce((acc: number, d: DayStrainDetail) => acc + d.volume, 0);
  const totalSets = activeDays.reduce((acc: number, d: DayStrainDetail) => acc + d.sets, 0);
  const isGenuineEmpty = totalVolume === 0 && totalSets === 0;

  const peakDay = activeDays.reduce<DayStrainDetail | null>((max, d) => {
    if (d.volume <= 0) return max;
    return !max || d.volume > max.volume ? d : max;
  }, null);

  const selectedDay = activeDays[selectedDayIdx] || activeDays[2] || activeDays[0];
  const peakOverloadText = peakDay ? `${peakDay.day} ${(peakDay.volume / 1000).toFixed(1)}k` : 'Wed 9.1k';

  return (
    <div id="card-microcycle-strain-tracker" className="bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm text-neutral-900 dark:text-white select-none space-y-4 my-3 transition-colors">
      {/* Header with Title and ACWR Pill Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-950/15 dark:bg-red-950/40 border border-[#C4121A]/30 flex items-center justify-center text-[#C4121A]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-tactical font-black text-xs uppercase tracking-wider text-neutral-900 dark:text-white">MICROCYCLE STRAIN TRACKER</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/25">ACWR 1.12</span>
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block">Weekly Periodization &amp; Olympic Plate Tonnage</span>
          </div>
        </div>

        {/* Pill Tabs: [ TOWERS ], [ RECHARTS CURVE ], [ ANATOMY ] */}
        <div className="flex items-center bg-neutral-100 dark:bg-[#18181b] p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 shrink-0 gap-1">
          {(['towers', 'trend', 'anatomy'] as const).map((mode) => {
            const label = mode === 'towers' ? 'TOWERS' : mode === 'trend' ? 'RECHARTS CURVE' : 'ANATOMY';
            const Icon = mode === 'towers' ? Layers : mode === 'trend' ? TrendingUp : Dumbbell;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => { tactileEngine.triggerSelectionBuzz(); setViewMode(mode); }}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === mode ? 'bg-[#C4121A] text-white shadow-xs' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Row below tabs */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
          <span className="font-mono tracking-widest">---</span>
          <span>Target Baseline: 5.5k kg</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#C4121A] font-semibold">
          <span>🔥</span>
          <span>Peak Overload: {peakOverloadText}</span>
        </div>
      </div>

      {/* View Modes */}
      {viewMode === 'towers' && (
        <MicrocycleTowers activeDays={activeDays} selectedDayIdx={selectedDayIdx} onSelectDay={setSelectedDayIdx} />
      )}
      {viewMode === 'trend' && (
        <MicrocycleTrendChart activeDays={activeDays} onSelectDay={setSelectedDayIdx} />
      )}
      {viewMode === 'anatomy' && (
        <MicrocycleAnatomy activeDays={activeDays} selectedDayIdx={selectedDayIdx} onSelectDay={setSelectedDayIdx} />
      )}

      {/* 2x2 Metric Deck Below Towers */}
      <MicrocycleDayDetail
        selectedDay={selectedDay}
        isGenuineEmpty={isGenuineEmpty}
        totalVolume={totalVolume}
        totalSets={totalSets}
        peakDayLabel={peakDay ? `${peakDay.day} (${(peakDay.volume / 1000).toFixed(1)}k kg)` : 'WED (9.1k kg)'}
      />
    </div>
  );
};

export default MicrocycleStrainTracker;
