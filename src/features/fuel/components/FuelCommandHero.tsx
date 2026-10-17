import React, { useLayoutEffect, useRef, useState } from 'react';
import { Droplet, Minus, Settings2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { EnergyBalance, FuelPace } from '../utils/fuelMath';

export interface MacroMeter {
  label: string;
  consumed: number;
  target: number | null;
  color: string;
}

interface FuelCommandHeroProps {
  dateLabel: string;
  balance: EnergyBalance;
  eatenKcal: number;
  burnedKcal: number;
  macros: MacroMeter[];
  weekSlide: React.ReactNode;
  waterL: number;
  waterGoalL: number | null;
  onAddWater: (liters: number) => void;
  onOpenSettings: () => void;
}

const SLIDES = ['Today', 'Week'] as const;
let lastSlide = 0;

const SEGMENTS = 12;
const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;
const BONE = '#EAE8DF';
const CRIMSON = '#C4121A';

const PACE_COPY: Record<FuelPace, { label: string; className: string }> = {
  ahead: { label: 'Ahead of pace', className: 'text-amber-500 border-amber-600/40' },
  on_pace: { label: 'On pace', className: 'text-emerald-500 border-emerald-600/40' },
  behind: { label: 'Behind pace', className: 'text-sky-500 border-sky-500/50' },
};

function fmtGrams(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

const SegmentedMeter: React.FC<MacroMeter> = ({ label, consumed, target, color }) => {
  const share = target && target > 0 ? consumed / target : 0;
  const lit = Math.min(SEGMENTS, share * SEGMENTS);
  const over = target && target > 0 && consumed > target ? consumed - target : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-1 mb-1.5">
        <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
        <span className="o1-unread text-[11px] tabular-nums text-o1-text truncate">
          {fmtGrams(consumed)}
          <span className="text-o1-muted">/{target != null ? target : '--'}g</span>
        </span>
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }} aria-hidden>
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const fill = Math.max(0, Math.min(1, lit - i));
          return (
            <span key={i} className="h-2 rounded-[2px] bg-white/[0.08] overflow-hidden">
              <span
                className="block h-full transition-[width] duration-300"
                style={{ width: `${fill * 100}%`, backgroundColor: color }}
              />
            </span>
          );
        })}
      </div>
      <span className="block mt-1 text-[10px] tabular-nums text-o1-muted h-3">
        {over > 0 ? `+${fmtGrams(Math.round(over * 10) / 10)}g over` : ''}
      </span>
    </div>
  );
};

export const FuelCommandHero: React.FC<FuelCommandHeroProps> = ({
  dateLabel,
  balance,
  eatenKcal,
  burnedKcal,
  macros,
  weekSlide,
  waterL,
  waterGoalL,
  onAddWater,
  onOpenSettings,
}) => {
  const isOver = balance.over > 0;
  const hasTarget = balance.budget != null;
  const ringColor = isOver ? CRIMSON : BONE;
  const dash = RING_C * (1 - (isOver ? 1 : balance.progress));
  const waterShare = waterGoalL ? Math.min(1, waterL / waterGoalL) : 0;

  const addWater = (liters: number) => {
    tactileEngine.triggerSelectionBuzz();
    onAddWater(liters);
  };

  const trackRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(lastSlide);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (el && lastSlide > 0) el.scrollLeft = el.clientWidth * lastSlide;
  }, []);

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== slide) {
      tactileEngine.triggerSelectionBuzz();
      lastSlide = next;
      setSlide(next);
    }
  };

  const goTo = (i: number) => {
    trackRef.current?.scrollTo({ left: (trackRef.current?.clientWidth ?? 0) * i, behavior: 'smooth' });
  };

  return (
    <section id="fuel-command" className="bg-o1-canvas select-none">
      <header className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-semibold text-o1-text">Fuel</h1>
          <span className="text-xs text-o1-muted">{dateLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onOpenSettings();
          }}
          aria-label="Fuel settings"
          className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </header>

      <div className="rounded-3xl border border-white/[0.08] p-4">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Fuel overview"
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4"
          style={{ scrollbarWidth: 'none' }}
        >
        <div role="group" aria-roledescription="slide" aria-label="Today" className="w-full shrink-0 snap-start snap-always px-4">
        <div className="flex items-center gap-4">
          <div className="relative w-[132px] h-[132px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128" aria-hidden>
              <circle cx="64" cy="64" r={RING_R} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              {hasTarget && (
                <circle
                  cx="64"
                  cy="64"
                  r={RING_R}
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={dash}
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-500"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
              {!hasTarget ? (
                <>
                  <span className="o1-unread text-2xl font-semibold tabular-nums text-o1-text leading-none">--</span>
                  <span className="text-[10px] text-o1-muted mt-1">kcal left</span>
                </>
              ) : isOver ? (
                <>
                  <span className="text-2xl font-semibold tabular-nums text-o1-crimson leading-none">
                    +{balance.over.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-o1-crimson mt-1">over</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-semibold tabular-nums text-o1-text leading-none">
                    {(balance.remaining ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-o1-muted mt-1">kcal left</span>
                </>
              )}
              <span className="o1-unread text-[10px] tabular-nums text-o1-muted mt-0.5">
                of {hasTarget ? (balance.budget ?? 0).toLocaleString() : '--'}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {balance.pace ? (
              <span className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-medium ${PACE_COPY[balance.pace].className}`}>
                {PACE_COPY[balance.pace].label}
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center h-7 px-3 rounded-full border border-o1-crimson/60 text-o1-crimson text-[11px] font-medium cursor-pointer"
              >
                Set your targets
              </button>
            )}
            <dl className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-[10px] text-o1-muted">Eaten</dt>
                <dd className="text-base font-semibold tabular-nums text-o1-text">{Math.round(eatenKcal).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-o1-muted">Burned</dt>
                <dd className="text-base font-semibold tabular-nums text-o1-text">
                  {burnedKcal > 0 ? `+${Math.round(burnedKcal).toLocaleString()}` : '0'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {macros.map((m) => (
            <SegmentedMeter key={m.label} {...m} />
          ))}
        </div>
        </div>
        <div role="group" aria-roledescription="slide" aria-label="Week" className="w-full shrink-0 snap-start snap-always px-4">
          {weekSlide}
        </div>
        </div>

        <div className="flex justify-center gap-1.5 pt-2.5" role="tablist" aria-label="Fuel overview slides">
          {SLIDES.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={slide === i}
              aria-label={`Show ${label}`}
              onClick={() => goTo(i)}
              className="p-1 cursor-pointer"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-200 ${slide === i ? 'w-4 bg-o1-text' : 'w-1.5 bg-white/25'}`} />
            </button>
          ))}
        </div>

        <div className="mt-1.5 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Droplet className="w-4 h-4 text-sky-500 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-o1-muted">Water</span>
                <span className="o1-unread text-[11px] tabular-nums text-o1-text">
                  {Number(waterL.toFixed(2))}
                  <span className="text-o1-muted"> / {waterGoalL != null ? waterGoalL.toFixed(1) : '--'} L</span>
                </span>
              </div>
              <div className="h-1.5 mt-1.5 rounded-full bg-white/[0.12] overflow-hidden">
                <div className="h-full rounded-full bg-sky-500 transition-[width] duration-300" style={{ width: `${waterShare * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              disabled={waterL <= 0}
              onClick={() => addWater(-0.25)}
              aria-label="Remove 250 millilitres"
              className="w-10 h-8 rounded-xl bg-o1-text text-black hover:bg-[#C9C7BC] active:bg-[#C9C7BC] flex items-center justify-center disabled:opacity-30 disabled:hover:bg-o1-text transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => addWater(0.25)}
              className="flex-1 h-8 rounded-xl bg-o1-text text-sm font-bold text-black hover:bg-[#C9C7BC] active:bg-[#C9C7BC] transition-colors cursor-pointer"
            >
              +250 ml
            </button>
            <button
              type="button"
              onClick={() => addWater(0.5)}
              className="flex-1 h-8 rounded-xl bg-o1-text text-sm font-bold text-black hover:bg-[#C9C7BC] active:bg-[#C9C7BC] transition-colors cursor-pointer"
            >
              +500 ml
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FuelCommandHero;
