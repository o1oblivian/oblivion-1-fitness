import React, { useEffect, useRef, useState } from 'react';
import { DayStrainDetail } from './microcycleTypes';
import { tactileEngine } from '../../../../services/tactileEngine';

interface MicrocycleTowersProps {
  activeDays: DayStrainDetail[];
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
  baselineVolume?: number;
}

const TUBE_H = 112;
const TUBE_PAD = 2;
const INNER_H = TUBE_H - TUBE_PAD * 2;
const DAY_LABEL_H = 20;
const BAND_PX = 8;

/** Bottom → top. Distinct plates, flush, one hue family per day. */
const DAY_BANDS: Record<string, string[]> = {
  Mon: ['#9B1C1C', '#C2410C', '#E85D04', '#F4A261', '#F4D35E'],
  Tue: ['#7C4A12', '#A16207', '#CA8A04', '#EAB308', '#FDE047'],
  Wed: ['#7F1D1D', '#9F1239', '#E11D48', '#FB7185', '#BE123C', '#F43F5E', '#FDA4AF', '#9F1239', '#FB7185', '#FECDD3'],
  Thu: ['#38BDF8'],
  Fri: ['#C2410C', '#EA580C', '#FB923C'],
  Sat: ['#14532D', '#166534', '#22C55E', '#4ADE80'],
  Sun: ['#0284C7'],
};

function bandsForFill(day: string, fillH: number): string[] {
  const palette = DAY_BANDS[day] || DAY_BANDS.Mon;
  if (fillH <= 0) return [];
  const count = Math.max(1, Math.min(palette.length, Math.floor(fillH / BAND_PX)));
  return palette.slice(0, count);
}

function fillHeightPx(volume: number, cap: number): number {
  if (volume <= 0) return 0;
  const ratio = Math.min(1, volume / cap);
  return Math.max(8, Math.round(INNER_H * ratio));
}

export const MicrocycleTowers: React.FC<MicrocycleTowersProps> = ({
  activeDays,
  selectedDayIdx,
  onSelectDay,
  baselineVolume = 0,
}) => {
  const [baselineOpen, setBaselineOpen] = useState(false);
  const revertTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (revertTimer.current !== null) window.clearTimeout(revertTimer.current);
    };
  }, []);
  const weekPeak = activeDays.reduce((m, d) => (d.volume > m ? d.volume : m), 0);
  const cap = Math.max(weekPeak, 1);
  const peakIdx = activeDays.reduce((best, d, idx) => {
    if (d.volume <= 0) return best;
    if (best < 0) return idx;
    return d.volume > activeDays[best].volume ? idx : best;
  }, -1);

  const baselineRatio = baselineVolume > 0 ? Math.min(1, baselineVolume / cap) : 0;
  const lineBottom = DAY_LABEL_H + TUBE_PAD + baselineRatio * INNER_H;

  const revealBaseline = () => {
    tactileEngine.triggerSelectionBuzz();
    setBaselineOpen(true);
    if (revertTimer.current !== null) window.clearTimeout(revertTimer.current);
    revertTimer.current = window.setTimeout(() => {
      setBaselineOpen(false);
      revertTimer.current = null;
    }, 2200);
  };

  return (
    <div className="relative pb-0 select-none">
      <div className="flex items-end justify-between px-0.5 pt-0 pb-0 relative h-[152px]">
        {activeDays.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          const isPeak = idx === peakIdx;
          const hasVolume = d.volume > 0;
          const tonnageLabel = hasVolume ? `${(d.volume / 1000).toFixed(1)}k` : '--';
          const fillH = fillHeightPx(d.volume, cap);
          const bands = bandsForFill(d.day, fillH);
          const nearlyFull = fillH >= INNER_H * 0.9;
          const bottomR = Math.min(14, Math.max(3, Math.round(fillH * 0.22)));
          const topR = nearlyFull ? 14 : 2;

          return (
            <button
              key={d.day}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectDay(idx);
              }}
              className="flex flex-col items-center justify-end h-full group cursor-pointer relative bg-transparent border-0 p-0 m-0 focus:outline-hidden min-w-0 flex-1"
            >
              <span
                className={`text-[11px] font-mono mb-1 tabular-nums leading-none ${
                  isSelected || isPeak
                    ? 'text-white font-semibold'
                    : 'text-neutral-400 font-medium'
                }`}
              >
                {tonnageLabel}
              </span>

              <div
                className="relative w-9 overflow-hidden flex flex-col justify-end bg-black border border-white/[0.07]"
                style={{
                  height: TUBE_H,
                  padding: TUBE_PAD,
                  borderRadius: 999,
                }}
              >
                <div
                  className="w-full overflow-hidden flex flex-col-reverse"
                  style={{
                    height: fillH,
                    borderBottomLeftRadius: bottomR,
                    borderBottomRightRadius: bottomR,
                    borderTopLeftRadius: topR,
                    borderTopRightRadius: topR,
                  }}
                >
                  {bands.map((color, bandIdx) => (
                    <div
                      key={bandIdx}
                      className="w-full flex-1 min-h-0"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-1 flex flex-col items-center min-h-[16px]">
                <span
                  className={`text-[10px] tracking-wider ${
                    isSelected
                      ? 'text-white font-semibold'
                      : 'text-neutral-400 font-medium'
                  }`}
                >
                  {d.day}
                </span>
                {isSelected && <div className="w-4 h-[2px] bg-white/80 rounded-full mt-px" />}
              </div>
            </button>
          );
        })}

        {baselineRatio > 0 && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-8 z-10"
              style={{
                bottom: lineBottom,
                height: 1,
                backgroundImage: baselineOpen
                  ? 'linear-gradient(to right, rgba(242,239,230,0.85) 50%, transparent 50%)'
                  : 'linear-gradient(to right, rgba(163,158,146,0.45) 40%, transparent 40%)',
                backgroundSize: baselineOpen ? '7px 1px' : '5px 1px',
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                revealBaseline();
              }}
              aria-label={baselineOpen ? 'Baseline target' : 'Baseline'}
              className={`absolute right-0 z-20 max-w-[46%] truncate rounded-md border px-1 py-px text-[9px] font-sans font-semibold leading-none cursor-pointer transition-all ${
                baselineOpen
                  ? 'border-white/20 bg-black/80 text-[#F2EFE6]'
                  : 'border-transparent bg-transparent text-neutral-500'
              }`}
              style={{ bottom: lineBottom - 7 }}
            >
              {baselineOpen ? 'Baseline target' : 'BS'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MicrocycleTowers;
