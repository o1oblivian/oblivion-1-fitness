import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DayStrainDetail } from './microcycleTypes';

interface MicrocycleDayDetailProps {
  selectedDay: DayStrainDetail;
  isGenuineEmpty: boolean;
  totalVolume: number;
  totalSets: number;
  peakDayLabel?: string;
  adaptationLabel?: string;
  completionPct?: number | null;
}

export const MicrocycleDayDetail: React.FC<MicrocycleDayDetailProps> = ({
  selectedDay,
  totalVolume,
  totalSets,
  peakDayLabel,
  adaptationLabel = '--',
  completionPct = null,
}) => {
  const displayTonnage = totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k kg` : '0.0k kg';
  const displaySets = `${totalSets} Sets`;
  const displayPeak =
    peakDayLabel && !peakDayLabel.includes('--')
      ? peakDayLabel
      : selectedDay.volume > 0
        ? `${selectedDay.day} (${(selectedDay.volume / 1000).toFixed(1)}k kg)`
        : '--';

  return (
    <div className="space-y-2.5">
      {/* 2x2 METRIC DECK BELOW TOWERS */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. TOTAL TONNAGE */}
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[10px] text-neutral-400 block font-tactical uppercase tracking-wider font-bold">
            TOTAL TONNAGE
          </span>
          <span className="font-tactical font-black text-sm text-white block tracking-tight">
            {displayTonnage}
          </span>
          <span className="text-[11px] font-sans font-medium text-emerald-400 block">
            Volume target tracked
          </span>
        </div>

        {/* 2. MICROCYCLE SETS */}
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[10px] text-neutral-400 block font-tactical uppercase tracking-wider font-bold">
            MICROCYCLE SETS
          </span>
          <span className="font-tactical font-black text-sm text-white block tracking-tight">
            {displaySets}
          </span>
          <span className="text-[11px] font-sans font-medium text-neutral-400 block">
            {completionPct !== null ? `${completionPct}% logged this week` : 'No sessions logged'}
          </span>
        </div>

        {/* 3. PEAK STRAIN DAY */}
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[10px] text-neutral-400 block font-tactical uppercase tracking-wider font-bold">
            PEAK STRAIN DAY
          </span>
          <span className="font-tactical font-black text-sm text-o1-crimson block tracking-tight">
            {displayPeak}
          </span>
          <span className="text-[11px] font-sans font-medium text-neutral-400 block truncate">
            {selectedDay.title || 'Rest & Prep'}
          </span>
        </div>

        {/* 4. ADAPTATION STATUS */}
        <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3 space-y-1">
          <span className="text-[10px] text-neutral-400 block font-tactical uppercase tracking-wider font-bold">
            ADAPTATION STATUS
          </span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className={`w-4 h-4 ${adaptationLabel === 'Calibrating' ? 'text-zinc-400' : 'text-emerald-400'}`} />
            <span className={`font-tactical font-semibold text-sm tracking-wide uppercase ${adaptationLabel === 'Calibrating' ? 'text-zinc-400' : 'text-emerald-400'}`}>
              {adaptationLabel}
            </span>
          </div>
          <span className="text-[11px] font-sans font-medium text-neutral-400 block">
            {adaptationLabel === 'Calibrating' ? 'Establishing 7-day chronic baseline' : 'Acute 7d vs chronic 28d load'}
          </span>
        </div>
      </div>

      {/* Target Anatomy Breakdown Row */}
      <div className="bg-o1-well border border-white/[0.07] rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedDay.accentHex }} />
            <div>
              <span className="text-xs font-tactical font-black text-white uppercase tracking-wider block">
                {selectedDay.full} • {selectedDay.title}
              </span>
              <span className="text-[10px] font-sans font-medium text-neutral-400">
                Stimulus: <strong className="text-neutral-200 font-bold">{selectedDay.stimulus}</strong> (RPE ~{selectedDay.rpeAverage})
              </span>
            </div>
          </div>
          <span className="text-xs font-tactical font-black text-white block tracking-tight">
            {selectedDay.volume.toLocaleString()} kg
          </span>
        </div>

        <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/[0.08]">
          {selectedDay.anatomy.map((part, pIdx) => (
            <div key={pIdx} style={{ width: `${part.pct}%`, backgroundColor: part.color }} className="h-full border-r border-black/20 last:border-r-0 transition-all" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MicrocycleDayDetail;
