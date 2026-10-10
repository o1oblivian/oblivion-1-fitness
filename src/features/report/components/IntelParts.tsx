import React from 'react';
import { GOOD, TONE_CHIP, TONE_HEX, type Tone } from '../palette';

export const SectionCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <section className="w-full rounded-2xl bg-o1-card border border-white/[0.07] p-4 space-y-3">
    <div>
      <h3 className="text-[10px] font-mono font-bold tracking-[0.18em] text-neutral-400">{title}</h3>
      {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export const ToneChip: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold tracking-wider ${TONE_CHIP[tone]}`}
  >
    {children}
  </span>
);

export const StatCell: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-xl bg-[#111113] border border-white/[0.07] p-3 min-h-[68px]">
    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500">{label}</div>
    <div className="text-lg font-black font-mono text-white leading-tight mt-1">{value}</div>
    {sub && <div className="text-[10px] font-mono text-neutral-500 mt-0.5">{sub}</div>}
  </div>
);

interface DayBarsProps {
  labels: string[];
  values: (number | null)[];
  /** Per-day target line (same length as values), or a single flat target. */
  target?: number | (number | null)[];
  format: (v: number) => string;
  tone?: Tone;
  highlight?: boolean[];
}

/** 7-day bar strip. Missing days render as an empty track with `--`. */
export const DayBars: React.FC<DayBarsProps> = ({ labels, values, target, format, tone = 'good', highlight }) => {
  const targets = values.map((_, i) => (Array.isArray(target) ? target[i] ?? null : target ?? null));
  const peak = Math.max(1, ...values.map((v) => v ?? 0), ...targets.map((t) => t ?? 0));
  return (
    <div className="flex items-end gap-1.5 h-[116px]">
      {values.map((v, i) => {
        const h = v === null ? 0 : Math.max(4, (v / peak) * 100);
        const t = targets[i];
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0">
            <span className="text-[9px] font-mono text-neutral-400 leading-none truncate max-w-full">
              {v === null ? '--' : format(v)}
            </span>
            <div className="relative w-full flex-1 flex items-end rounded-sm bg-white/[0.04]">
              {t !== null && (
                <div
                  className="absolute inset-x-0 border-t border-dashed border-white/30"
                  style={{ bottom: `${(t / peak) * 100}%` }}
                />
              )}
              <div
                className="w-full rounded-sm transition-[height] duration-500"
                style={{ height: `${h}%`, background: highlight?.[i] === false ? '#3f3f46' : TONE_HEX[tone] }}
              />
            </div>
            <span className="text-[9px] font-mono text-neutral-500 leading-none">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Horizontal zone gauge, e.g. load ratio 0–2.0 with a highlighted sweet-spot band. */
export const ZoneGauge: React.FC<{
  value: number | null;
  min: number;
  max: number;
  bandFrom: number;
  bandTo: number;
  ticks: string[];
}> = ({ value, min, max, bandFrom, bandTo, ticks }) => {
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="space-y-1.5">
      <div className="relative h-2.5 rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 rounded-full"
          style={{ left: pos(bandFrom), width: `calc(${pos(bandTo)} - ${pos(bandFrom)})`, background: `${GOOD}40` }}
        />
        {value !== null && (
          <div
            className="absolute -top-1 w-1 h-[18px] rounded-full bg-white"
            style={{ left: pos(value), transform: 'translateX(-50%)' }}
          />
        )}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-neutral-600">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
};
