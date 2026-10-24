import React, { useLayoutEffect, useRef, useState } from 'react';
import { Droplet, Minus, Settings2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { EnergyBalance, FuelPace } from '../utils/fuelMath';
import { COLOR } from '../../../theme/colors';

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
  /** Weight trend, inside the dashboard card under today's numbers. */
  trend?: React.ReactNode;
  /** Sits below the dashboard card, with water. */
  insight?: React.ReactNode;
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
const BONE = COLOR.text;
const CRIMSON = COLOR.crimson;
const EMERALD = COLOR.emerald;

const PACE_COPY: Record<FuelPace, { label: string; className: string }> = {
  ahead: { label: 'Ahead of pace', className: 'text-o1-yellow border-o1-yellow/40' },
  on_pace: { label: 'On pace', className: 'text-o1-olive border-o1-olive/40' },
  behind: { label: 'Behind pace', className: 'text-o1-teal border-o1-teal/50' },
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
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-o1-caption font-semibold text-o1-text">{label}</span>
      </div>
      <div className="o1-unread text-o1-body tabular-nums text-o1-text mb-1.5 truncate">
        {fmtGrams(consumed)}
        <span className="text-o1-muted">/{target != null ? target : '--'}g</span>
      </div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const fill = Math.max(0, Math.min(1, lit - i));
          return (
            <span key={i} className="h-2 rounded-[2px] bg-white/[0.15] overflow-hidden">
              <span
                className="block h-full transition-[width] duration-300"
                style={{ width: `${fill * 100}%`, backgroundColor: color }}
              />
            </span>
          );
        })}
      </div>
      <span className="block mt-1 text-o1-label tabular-nums text-o1-muted h-3">
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
  trend,
  insight,
  waterL,
  waterGoalL,
  onAddWater,
  onOpenSettings,
}) => {
  const isOver = balance.over > 0;
  const hasTarget = balance.budget != null;
  const ringColor = isOver ? CRIMSON : balance.pace === 'on_pace' ? EMERALD : BONE;
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
    trackRef.current?.scrollTo({
      left: (trackRef.current?.clientWidth ?? 0) * i,
      behavior: 'smooth',
    });
  };

  return (
    <section id="fuel-command" className="bg-o1-canvas select-none">
      <header className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-o1-display font-semibold tracking-tight leading-none text-o1-text">
            Fuel
          </h1>
          <span className="text-o1-caption text-o1-muted">{dateLabel}</span>
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

      <div className="rounded-3xl border border-white/[0.1] bg-gradient-to-b from-o1-sheet to-o1-surface p-4">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label="Fuel overview"
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4"
          style={{ scrollbarWidth: 'none' }}
        >
          <div
            role="group"
            aria-roledescription="slide"
            aria-label="Today"
            className="w-full shrink-0 snap-start snap-always px-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-[144px] h-[144px] shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128" aria-hidden>
                  <circle
                    cx="64"
                    cy="64"
                    r={RING_R}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="9"
                    fill="none"
                  />
                  {hasTarget && (
                    <circle
                      cx="64"
                      cy="64"
                      r={RING_R}
                      stroke={ringColor}
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={dash}
                      fill="none"
                      className="transition-[stroke-dashoffset] duration-500"
                    />
                  )}
                </svg>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  aria-live="polite"
                >
                  {!hasTarget ? (
                    <>
                      <span className="o1-unread text-o1-display font-semibold tracking-tight tabular-nums text-o1-text leading-none">
                        --
                      </span>
                      <span className="text-o1-label text-o1-muted mt-1">kcal left</span>
                    </>
                  ) : isOver ? (
                    <>
                      <span className="text-o1-display font-semibold tracking-tight tabular-nums text-o1-crimson leading-none">
                        +{balance.over.toLocaleString()}
                      </span>
                      <span className="text-o1-label text-o1-crimson mt-1">over</span>
                    </>
                  ) : (
                    <>
                      <span className="text-o1-display font-semibold tracking-tight tabular-nums text-o1-text leading-none">
                        {(balance.remaining ?? 0).toLocaleString()}
                      </span>
                      <span className="text-o1-label text-o1-muted mt-1">kcal left</span>
                    </>
                  )}
                  <span className="o1-unread text-o1-label tabular-nums text-o1-muted mt-0.5">
                    of {hasTarget ? (balance.budget ?? 0).toLocaleString() : '--'}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                {balance.pace ? (
                  <span
                    className={`inline-flex items-center h-6 px-2.5 rounded-full border text-o1-label font-medium ${PACE_COPY[balance.pace].className}`}
                  >
                    {PACE_COPY[balance.pace].label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="inline-flex items-center h-7 px-3 rounded-full border border-o1-crimson/60 text-o1-crimson text-o1-label font-medium cursor-pointer"
                  >
                    Set your targets
                  </button>
                )}
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-o1-label text-o1-muted">Eaten</dt>
                    <dd className="text-base font-semibold tabular-nums text-o1-text">
                      {Math.round(eatenKcal).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-o1-label text-o1-muted">Burned</dt>
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
          <div
            role="group"
            aria-roledescription="slide"
            aria-label="Week"
            className="w-full shrink-0 snap-start snap-always px-4"
          >
            {weekSlide}
          </div>
        </div>

        <div
          className="flex justify-center gap-1.5 pt-2.5"
          role="tablist"
          aria-label="Fuel overview slides"
        >
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
              <span
                className={`block h-1.5 rounded-full transition-all duration-200 ${slide === i ? 'w-4 bg-o1-text' : 'w-1.5 bg-white/25'}`}
              />
            </button>
          ))}
        </div>

        {trend}

      </div>

      <div className="mt-3 rounded-3xl border border-white/[0.1] bg-gradient-to-b from-o1-sheet to-o1-surface p-4">
        <div>
          <div className="flex items-center gap-3">
            <Droplet className="w-4 h-4 text-o1-teal shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <span className="text-o1-label text-o1-muted">Water</span>
                <span className="o1-unread text-o1-label tabular-nums text-o1-text">
                  {Number(waterL.toFixed(2))}
                  <span className="text-o1-muted">
                    {' '}
                    / {waterGoalL != null ? waterGoalL.toFixed(1) : '--'} L
                  </span>
                </span>
              </div>
              <div className="h-1.5 mt-1.5 rounded-full bg-white/[0.15] overflow-hidden">
                <div
                  className="h-full rounded-full bg-o1-teal transition-[width] duration-300"
                  style={{ width: `${waterShare * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              disabled={waterL <= 0}
              onClick={() => addWater(-0.25)}
              aria-label="Remove 250 millilitres"
              className="w-10 h-8 rounded-xl bg-o1-well border border-white/[0.1] text-o1-text hover:bg-o1-sheet active:bg-o1-sheet flex items-center justify-center disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => addWater(0.25)}
              className="flex-1 h-8 rounded-xl bg-o1-well border border-white/[0.1] text-sm font-semibold text-o1-text hover:bg-o1-sheet active:bg-o1-sheet transition-colors cursor-pointer"
            >
              +250 ml
            </button>
            <button
              type="button"
              onClick={() => addWater(0.5)}
              className="flex-1 h-8 rounded-xl bg-o1-well border border-white/[0.1] text-sm font-semibold text-o1-text hover:bg-o1-sheet active:bg-o1-sheet transition-colors cursor-pointer"
            >
              +500 ml
            </button>
          </div>
        </div>
      </div>
      {insight ? (
        <div className="mt-3 rounded-3xl border border-white/[0.1] bg-gradient-to-b from-o1-sheet to-o1-surface px-4 py-3">
          {insight}
        </div>
      ) : null}
    </section>
  );
};
