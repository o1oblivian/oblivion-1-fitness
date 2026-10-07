import React from 'react';
import { DayStrainDetail } from './microcycleTypes';
import { tactileEngine } from '../../../../services/tactileEngine';

interface MicrocycleTowersProps {
  activeDays: DayStrainDetail[];
  selectedDayIdx: number;
  onSelectDay: (idx: number) => void;
}

const TUBE_H = 112;
const TUBE_PAD = 2;
const INNER_H = TUBE_H - TUBE_PAD * 2;
const MAX_SLABS = 10;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Stretch reference slab stops to 10 bands without inventing a new hue family. */
function expandStops(stops: string[], count: number): string[] {
  if (stops.length === 1) return Array.from({ length: count }, () => stops[0]);
  if (stops.length >= count) return stops.slice(0, count);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const pos = (i / (count - 1)) * (stops.length - 1);
    const i0 = Math.floor(pos);
    const i1 = Math.min(stops.length - 1, i0 + 1);
    const f = pos - i0;
    const a = hexToRgb(stops[i0]);
    const b = hexToRgb(stops[i1]);
    out.push(rgbToHex(
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ));
  }
  return out;
}

/** Bottom → top. Sampled from the reference towers image. */
const DAY_SLAB_STOPS: Record<string, string[]> = {
  Mon: ['#9A2418', '#C8321C', '#E09414', '#F0C338'],
  Tue: ['#7A4A0C', '#A86A10', '#C88814', '#E0A81C', '#F0C430'],
  Wed: ['#7A1420', '#C43040', '#8B1A28', '#E07080', '#A82432', '#D84858', '#9A2030', '#E88894', '#B42838', '#F0A8B0'],
  Thu: ['#2B7AE0'],
  Fri: ['#E05610', '#F07818', '#F59A32'],
  Sat: ['#157A38', '#1F9A48', '#2DB85A', '#5ED078'],
  Sun: ['#2F86E8'],
};

const DAY_SLAB_PALETTES: Record<string, string[]> = Object.fromEntries(
  Object.entries(DAY_SLAB_STOPS).map(([day, stops]) => [day, expandStops(stops, MAX_SLABS)]),
);

function slabCountForVolume(volume: number): number {
  return volume > 0 ? MAX_SLABS : 0;
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
}) => {
  const weekPeak = activeDays.reduce((m, d) => (d.volume > m ? d.volume : m), 0);
  const cap = Math.max(weekPeak, 1);
  const peakIdx = activeDays.reduce((best, d, idx) => {
    if (d.volume <= 0) return best;
    if (best < 0) return idx;
    return d.volume > activeDays[best].volume ? idx : best;
  }, -1);

  return (
    <div className="relative pb-0 select-none">
      <div className="flex items-end justify-between px-0.5 pt-0 pb-0 relative h-[152px]">
        {activeDays.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          const isPeak = idx === peakIdx;
          const hasVolume = d.volume > 0;
          const tonnageLabel = hasVolume ? `${(d.volume / 1000).toFixed(1)}k` : '--';
          const slabCount = slabCountForVolume(d.volume);
          const palette = DAY_SLAB_PALETTES[d.day] || DAY_SLAB_PALETTES.Mon;
          const fillH = fillHeightPx(d.volume, cap);
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
                  {Array.from({ length: slabCount }, (_, slabIdx) => (
                    <div
                      key={slabIdx}
                      className="w-full flex-1 min-h-0"
                      style={{ backgroundColor: palette[slabIdx] || palette[palette.length - 1] }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-1 flex flex-col items-center min-h-[16px]">
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    isSelected
                      ? 'text-o1-crimson font-semibold'
                      : 'text-neutral-400 font-medium'
                  }`}
                >
                  {d.day}
                </span>
                {isSelected && <div className="w-4 h-[2px] bg-o1-crimson rounded-full mt-px" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MicrocycleTowers;
