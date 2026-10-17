import React, { useEffect, useState } from 'react';
import { Orbit } from 'lucide-react';
import { useMicrocycleStore } from '../store/useMicrocycleStore';
import { getLocalSystemDayIdx } from './microcycle/microcycleTypes';
import { MicrocycleTowers } from './microcycle/MicrocycleTowers';
import { supabase } from '../../../services/supabaseClient';
import { liveChannel } from '../../../services/realtimeChannel';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import { kgToDisplay, loadUnitLabel } from '../../../utils/weightUnits';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';
import { PLAIN_LOAD } from '../../../utils/acwrMath';

const ACWR_TONE: Record<string, string> = {
  Optimal: 'text-emerald-500 border-emerald-600/40',
  Underload: 'text-sky-600 border-sky-600/40',
  Caution: 'text-amber-500 border-amber-600/40',
  'High risk': 'text-o1-crimson border-o1-crimson/50',
};

function tonnes(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
}

export const MicrocycleStrainTracker: React.FC = () => {
  const activeDays = useMicrocycleStore((s) => s.activeDays);
  const acwr = useMicrocycleStore((s) => s.acwr);
  const simple = useSimpleMode();
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
      channel = liveChannel(`microcycle-${uid}`)
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
  const trainedDays = activeDays.filter((d) => d.volume > 0 || d.sets > 0);
  const typicalLoad = trainedDays.length > 0 ? totalVolume / trainedDays.length : 0;
  const learnedDays = Math.min(7, acwr.historyDays);
  const plainLoad = PLAIN_LOAD[acwr.label];
  const pillText = simple
    ? acwr.calibrating
      ? `Learning ${learnedDays}/7`
      : plainLoad || '--'
    : acwr.calibrating
      ? `Calibrating ${learnedDays}/7`
      : acwr.ratio != null
        ? `ACWR ${acwr.ratio.toFixed(2)}`
        : 'ACWR --';
  const pillTone = acwr.calibrating ? 'text-o1-muted border-white/[0.07]' : ACWR_TONE[acwr.label] ?? 'text-o1-muted border-white/[0.07]';
  const subtitle = simple
    ? acwr.calibrating
      ? 'Learning your normal week'
      : plainLoad ? `${plainLoad} for you` : 'Compared with your usual'
    : acwr.calibrating
      ? 'Mon–Sun · building your 28-day baseline'
      : `Mon–Sun · ${acwr.label ? `${acwr.label.toLowerCase()} ` : ''}load vs your 28-day average`;
  const unit = readAthleteSettingsSnapshot().weightUnit;
  const unitLower = loadUnitLabel(unit).toLowerCase();

  return (
    <div id="card-microcycle-strain-tracker" className="bg-o1-card border border-white/[0.07] rounded-2xl p-2.5 text-o1-text select-none space-y-1.5 my-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="o1-mark text-o1-olive">
            <Orbit />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] text-o1-text truncate">This week</h3>
            <span className="text-[11px] text-o1-muted block truncate">{subtitle}</span>
          </div>
        </div>
        <span
          className={`shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-full border bg-o1-well tabular-nums ${pillTone}`}
          title="This week's training compared with your usual 4-week average"
        >
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
          <span className="text-[11px] uppercase tracking-[0.12em] text-o1-muted block">{simple ? 'Total lifted' : 'Volume'}</span>
          <span className="font-mono font-light text-[15px] text-o1-text block tabular-nums">
            {totalVolume > 0 ? `${tonnes(kgToDisplay(totalVolume, unit))} ${unitLower}` : '--'}
          </span>
          <span className="text-[11px] text-o1-muted block">
            {trainedDays.length > 0 ? `${trainedDays.length} training day${trainedDays.length === 1 ? '' : 's'}` : 'No sessions logged'}
          </span>
        </div>
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-o1-muted block">Sets</span>
          <span className="font-mono font-light text-[15px] text-o1-text block tabular-nums">
            {totalSets > 0 ? totalSets : '--'}
          </span>
          <span className="text-[11px] text-o1-muted block">
            {acwr.completionPct != null ? `${acwr.completionPct}% of plan logged` : 'No plan scheduled'}
          </span>
        </div>
      </div>

    </div>
  );
};


