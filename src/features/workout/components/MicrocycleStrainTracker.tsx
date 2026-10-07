import React, { useState, useEffect } from 'react';
import { Activity, Layers, TrendingUp, Dumbbell, Award } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useMicrocycleStore } from '../store/useMicrocycleStore';
import { DayStrainDetail, getLocalSystemDayIdx } from './microcycle/microcycleTypes';
import { MicrocycleTowers } from './microcycle/MicrocycleTowers';
import { MicrocycleTrendChart } from './microcycle/MicrocycleTrendChart';
import { MicrocycleAnatomy } from './microcycle/MicrocycleAnatomy';
import { MicrocycleDayDetail } from './microcycle/MicrocycleDayDetail';
import { supabase } from '../../../services/supabaseClient';

export const MicrocycleStrainTracker: React.FC = () => {
  const activeDays = useMicrocycleStore((s) => s.activeDays);
  const acwr = useMicrocycleStore((s) => s.acwr);
  const [viewMode, setViewMode] = useState<'towers' | 'trend' | 'anatomy'>('towers');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(getLocalSystemDayIdx());

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

  const loggedDays = activeDays.filter((d) => d.volume > 0);
  const typicalLoad =
    loggedDays.length >= 1
      ? loggedDays.reduce((acc, d) => acc + d.volume, 0) / loggedDays.length
      : 0;
  const typicalLabel = typicalLoad > 0 ? `${(typicalLoad / 1000).toFixed(1)}k kg` : '--';
  const selectedDay = activeDays[selectedDayIdx] || activeDays[0];
  const peakOverloadText = peakDay ? `${peakDay.day} ${(peakDay.volume / 1000).toFixed(1)}k` : '--';

  return (
    <div id="card-microcycle-strain-tracker" className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 shadow-sm text-white select-none space-y-1.5 my-2 transition-colors">
      {/* Header with Title and ACWR Pill Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-o1-crimson">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-tactical font-semibold text-xs uppercase tracking-wider text-white">MICROCYCLE STRAIN TRACKER</h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                acwr.calibrating
                  ? 'bg-o1-well border-white/[0.07] text-zinc-400'
                  : 'bg-o1-well text-zinc-400 border-white/[0.07]'
              }`}>
                {acwr.calibrating
                  ? 'CALIBRATING'
                  : acwr.ratio !== null
                    ? `ACWR ${acwr.ratio.toFixed(2)}`
                    : 'ACWR --'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono block">
              {acwr.calibrating
                ? `Establishing 7-day chronic baseline (Day ${Math.min(7, acwr.historyDays)}/7)`
                : 'Weekly Periodization & Olympic Plate Tonnage'}
            </span>
          </div>
        </div>

        {/* Pill Tabs: [ TOWERS ], [ RECHARTS CURVE ], [ ANATOMY ] */}
        <div className="flex items-center bg-o1-well p-1 rounded-xl border border-white/[0.07] shrink-0 gap-1">
          {(['towers', 'trend', 'anatomy'] as const).map((mode) => {
            const label = mode === 'towers' ? 'TOWERS' : mode === 'trend' ? 'RECHARTS CURVE' : 'ANATOMY';
            const Icon = mode === 'towers' ? Layers : mode === 'trend' ? TrendingUp : Dumbbell;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => { tactileEngine.triggerSelectionBuzz(); setViewMode(mode); }}
                className={`px-3 py-1 rounded-xl font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === mode ? 'bg-o1-crimson text-white shadow-xs' : 'text-neutral-400 hover:text-white'
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
      <div className="flex items-center justify-between px-0.5 text-[10px] leading-none">
        <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
          <span>Typical load: {typicalLabel}</span>
        </div>
        <div className="flex items-center gap-1 text-o1-crimson font-semibold">
          <Award className="w-3.5 h-3.5" />
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
        peakDayLabel={peakDay ? `${peakDay.day} (${(peakDay.volume / 1000).toFixed(1)}k kg)` : '--'}
        adaptationLabel={acwr.label}
        completionPct={acwr.completionPct}
      />
    </div>
  );
};

export default MicrocycleStrainTracker;
