import React, { useEffect, useRef, useState } from 'react';
import { Award } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

export interface SegmentedTower {
  key: string;
  label: string;
  /** Null or 0 renders the dark track only: nothing logged, never a fake zero. */
  value: number | null;
  /** Bottom → top, cycled when the tower needs more slabs than listed. */
  slabs: string[];
  /** Border colour for a lit tower. */
  accent: string;
  valueLabel?: string;
  ariaValue: string;
}

interface SegmentedTowersProps {
  towers: SegmentedTower[];
  tubeHeightPx: number;
  slabCount?: number;
  /** Clamped to the 18–20px slender tower spec. */
  maxTubeWidthPx: number;
  reference?: { value: number; label: string } | null;
  activeKey?: string | null;
  peakKey?: string | null;
  showValues?: boolean;
  onSelect?: (key: string) => void;
  ariaLabel: string;
}

const FRAME = 0.5;
const GAP = 1;
const LABEL_ROW_H = 22;
const PEAK_ROW_H = 18;
const VALUE_ROW_H = 17;
const TRACK = 'rgba(255,255,255,0.035)';
const TRACK_BORDER = 'rgba(255,255,255,0.05)';
const CRIMSON = '#C4121A';

export const SegmentedTowers: React.FC<SegmentedTowersProps> = ({
  towers,
  tubeHeightPx,
  slabCount = 10,
  maxTubeWidthPx,
  reference,
  activeKey,
  peakKey,
  showValues = false,
  onSelect,
  ariaLabel,
}) => {
  const [refOpen, setRefOpen] = useState(false);
  const refTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (refTimer.current !== null) window.clearTimeout(refTimer.current);
  }, []);

  const inner = tubeHeightPx - 2 * (FRAME + GAP);
  const top = Math.max(1, reference?.value ?? 0, ...towers.map((t) => t.value ?? 0)) * 1.08;
  const radius = Math.min(14, Math.round(maxTubeWidthPx / 2.8));
  const refBottom = reference ? LABEL_ROW_H + FRAME + GAP + (Math.min(reference.value, top) / top) * inner : 0;

  const revealReference = () => {
    tactileEngine.triggerSelectionBuzz();
    setRefOpen(true);
    if (refTimer.current !== null) window.clearTimeout(refTimer.current);
    refTimer.current = window.setTimeout(() => {
      setRefOpen(false);
      refTimer.current = null;
    }, 2200);
  };

  return (
    <div className="o1-instrument relative select-none" role="group" aria-label={ariaLabel}>
      <div className="flex items-end justify-between gap-1.5">
        {towers.map((t) => {
          const lit = t.value != null && t.value > 0 ? Math.min(slabCount, Math.max(1, Math.round((t.value / top) * slabCount))) : 0;
          const isActive = activeKey === t.key;
          const isPeak = peakKey != null && peakKey === t.key;
          const border = isPeak ? `${CRIMSON}A6` : lit > 0 ? `${t.accent}59` : TRACK_BORDER;
          return (
            <button
              key={t.key}
              type="button"
              disabled={!onSelect}
              aria-pressed={isActive}
              aria-label={`${t.label}: ${t.ariaValue}`}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelect?.(t.key);
              }}
              className="flex-1 min-w-0 flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default focus:outline-hidden"
            >
              {peakKey !== undefined && (
                <span className="flex items-end justify-center" style={{ height: PEAK_ROW_H }}>
                  {isPeak && <Award className="w-3.5 h-3.5 text-o1-crimson" strokeWidth={2.25} />}
                </span>
              )}
              {showValues && (
                <span
                  className={`flex items-center text-[11px] leading-none tabular-nums ${
                    isPeak || isActive ? 'text-white font-bold' : 'text-neutral-400 font-medium'
                  }`}
                  style={{ height: VALUE_ROW_H }}
                >
                  {t.valueLabel}
                </span>
              )}
              <span
                className="block shrink-0 bg-o1-canvas"
                style={{
                  width: Math.min(20, Math.max(18, maxTubeWidthPx)),
                  height: tubeHeightPx,
                  padding: GAP,
                  borderRadius: radius,
                  border: `${FRAME}px solid ${border}`,
                }}
              >
                <span
                  className="flex h-full w-full flex-col-reverse overflow-hidden"
                  style={{ gap: GAP, borderRadius: Math.max(2, radius - FRAME - GAP) }}
                >
                  {Array.from({ length: slabCount }, (_, i) => (
                    <span
                      key={i}
                      className="block w-full flex-1 min-h-0 transition-colors duration-300"
                      style={{ backgroundColor: i < lit ? t.slabs[i % t.slabs.length] : TRACK }}
                    />
                  ))}
                </span>
              </span>
              <span className="flex flex-col items-center justify-end" style={{ height: LABEL_ROW_H }}>
                <span
                  className={`text-[10px] tracking-wide leading-none ${
                    isActive ? 'text-o1-crimson font-bold' : 'text-neutral-300 font-medium'
                  }`}
                >
                  {t.label}
                </span>
                <span className={`mt-1 h-[2px] w-4 rounded-full ${isActive ? 'bg-o1-crimson' : 'bg-transparent'}`} />
              </span>
            </button>
          );
        })}
      </div>

      {reference && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-10 h-px"
            style={{
              bottom: refBottom,
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 50%, transparent 50%)',
              backgroundSize: '6px 1px',
            }}
          />
          <button
            type="button"
            aria-label={`Show ${reference.label.toLowerCase()}`}
            onClick={revealReference}
            className="absolute inset-x-0 z-20 h-3 cursor-pointer bg-transparent border-0 p-0"
            style={{ bottom: refBottom - 6 }}
          />
          {refOpen && (
            <span
              role="status"
              className="pointer-events-none absolute right-0 z-30 rounded-md border border-white/20 bg-o1-canvas px-1.5 py-0.5 text-[9px] tracking-wide leading-none text-o1-text"
              style={{ bottom: refBottom + 4 }}
            >
              {reference.label}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default SegmentedTowers;
