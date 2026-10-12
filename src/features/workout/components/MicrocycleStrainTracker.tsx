import React, { useEffect, useState } from 'react';
import { Orbit } from 'lucide-react';
import { useMicrocycleStore } from '../store/useMicrocycleStore';
import { getLocalSystemDayIdx } from './microcycle/microcycleTypes';
import { MicrocycleTowers } from './microcycle/MicrocycleTowers';
import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';

const ACWR_TONE: Record<string, string> = {
  Optimal: 'text-emerald-500 border-emerald-600/40',
  Underload: 'text-sky-600 border-sky-600/40',
  Caution: 'text-amber-500 border-amber-600/40',
  'High risk': 'text-o1-crimson border-o1-crimson/50',
};

function tonnes(kg: number): string {
  return `${(kg / 1000).toFixed(1)}k`;
}

export const MicrocycleStrainTracker: React.FC = () => {
  const activeDays = useMicrocycleStore((s) => s.activeDays);
  const acwr = useMicrocycleStore((s) => s.acwr);
  const todayIdx = getLocalSystemDayIdx();
  const [selectedIdx, setSelectedIdx] = useState<number>(todayIdx);

  useEffect(() => {
    const store = useMicrocycleStore.getState();
    store.recompute();
    void store.refreshFromSupabase();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const refreshSoon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void useMicrocycleStore.getState().refreshFromSupabase(), 1500);
    };
    void getAuthenticatedUserId().then((uid) => {
      if (!uid || cancelled) return;
      const filter = `user_id=eq.${uid}`;
      channel = supabase
        .channel(`microcycle-${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'completed_sessions', filter }, refreshSoon)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_logs', filter }, refreshSoon)
        .subscribe();
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const totalVolume = activeDays.reduce((acc, d) => acc + d.volume, 0);
  const totalSets = activeDays.reduce((acc, d) => acc + d.sets, 0);
  const trainedDays = activeDays.filter((d) => d.volume > 0);
  const typicalLoad = trainedDays.length > 0 ? totalVolume / trainedDays.length : 0;
  const pillText = acwr.calibrating
    ? `Calibrating ${Math.min(7, acwr.historyDays)}/7`
    : acwr.ratio != null
      ? `ACWR ${acwr.ratio.toFixed(2)}`
      : 'ACWR --';
  const pillTone = acwr.calibrating ? 'text-neutral-400 border-white/[0.07]' : ACWR_TONE[acwr.label] ?? 'text-neutral-400 border-white/[0.07]';
  const subtitle = acwr.calibrating
    ? 'Establishing 7-day chronic baseline'
    : `${acwr.label} · acute 7d vs chronic 28d load`;  return (
    <div id="card-microcycle-strain-tracker" className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 shadow-sm text-white select-none space-y-1.5 my-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="o1-mark text-o1-olive">
            <Orbit />
          </span>
          <div className="min-w-0">
            <h3 className="font-tactical font-semibold text-xs text-white truncate">Microcycle Strain Tracker</h3>
            <span className="text-[10px] text-zinc-400 font-mono block truncate">{subtitle}</span>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-o1-well tabular-nums ${pillTone}`}>
          {pillText}
        </span>
      </div>

      <MicrocycleTowers
        activeDays={activeDays}
        selectedDayIdx={selectedIdx}
        onSelectDay={setSelectedIdx}
        baselineVolume={typicalLoad}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[10px] text-neutral-400 block font-tactical tracking-wider font-bold">Total Tonnage</span>
          <span className="font-tactical font-black text-sm text-white block tracking-tight tabular-nums">
            {totalVolume > 0 ? `${tonnes(totalVolume)} kg` : '--'}
          </span>
          <span className="text-[11px] font-sans font-medium text-neutral-400 block">
            {trainedDays.length > 0 ? `${trainedDays.length} training day${trainedDays.length === 1 ? '' : 's'}` : 'No sessions logged'}
          </span>
        </div>
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[10px] text-neutral-400 block font-tactical tracking-wider font-bold">Microcycle Sets</span>
          <span className="font-tactical font-black text-sm text-white block tracking-tight tabular-nums">
            {totalSets > 0 ? `${totalSets} Sets` : '--'}
          </span>
          <span className="text-[11px] font-sans font-medium text-neutral-400 block">
            {acwr.completionPct != null ? `${acwr.completionPct}% of plan logged` : 'No plan scheduled'}
          </span>
        </div>
      </div>

    </div>
  );
};

export default MicrocycleStrainTracker;
