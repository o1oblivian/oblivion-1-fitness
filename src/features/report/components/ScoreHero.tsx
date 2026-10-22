import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { OblivionReport, ScorePart } from '../types';
import { TONE_HEX, toneForScore } from '../palette';
import { COLOR } from '../../../theme/colors';

interface ScoreHeroProps {
  report: OblivionReport;
  /** Athlete-only control for the weekly session target used by Consistency. */
  targetSessions?: number;
  onTargetChange?: (n: number) => void;
}

const R = 58;
const C = 2 * Math.PI * R;

const tone = (value: number | null): string => TONE_HEX[toneForScore(value)];

const PartCell: React.FC<{ part: ScorePart; children?: React.ReactNode }> = ({
  part,
  children,
}) => (
  <div className="rounded-xl bg-o1-surface border border-white/[0.07] p-3 space-y-2 min-h-[88px]">
    <div className="flex items-baseline justify-between">
      <span className="text-o1-label font-num font-bold tracking-wider text-o1-muted">
        {part.label}
      </span>
      <span className="text-lg font-black font-num text-white leading-none">
        {part.value === null ? '--' : part.value}
      </span>
    </div>
    <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${part.value ?? 0}%`, background: tone(part.value) }}
      />
    </div>
    <p className="text-o1-label leading-snug text-o1-faint font-num">{part.detail}</p>
    {children}
  </div>
);

export const ScoreHero: React.FC<ScoreHeroProps> = ({ report, targetSessions, onTargetChange }) => {
  const { score, grade, parts, stats } = report;
  const progress = score === null ? 0 : score / 100;
  const stat = (label: string, value: string) => (
    <div className="flex-1 min-w-0 text-center">
      <div className="text-sm font-black font-num text-white truncate">{value}</div>
      <div className="text-o1-label font-num tracking-wider text-o1-faint">{label}</div>
    </div>
  );

  return (
    <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-4">
      <div className="flex flex-col items-center gap-3 pt-1">
        <div className="relative w-[148px] h-[148px]">
          <svg viewBox="0 0 148 148" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="74" cy="74" r={R} fill="none" stroke={COLOR.sheet} strokeWidth="9" />
            <circle
              cx="74"
              cy="74"
              r={R}
              fill="none"
              stroke={COLOR.crimson}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-o1-hero leading-none font-black font-num text-white tabular-nums">
              {score === null ? '--' : score}
            </span>
            <span className="text-o1-label font-num tracking-[0.2em] text-o1-faint mt-1">
              Athlete score
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full border border-white/[0.12] text-o1-label font-num font-bold tracking-[0.2em] text-o1-ink-soft">
          {grade}
        </span>
        {score === null && (
          <p className="text-o1-label text-o1-faint text-center max-w-[280px]">
            The score needs two of the four components. Log training, sleep or bodyweight and it
            calibrates automatically.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {parts.map((part) =>
          part.id === 'consistency' && targetSessions !== undefined && onTargetChange ? (
            <PartCell key={part.id} part={part}>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-o1-label font-num tracking-wider text-o1-dim">
                  Target / wk
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Decrease weekly session target"
                    onClick={() => onTargetChange(targetSessions - 1)}
                    disabled={targetSessions <= 1}
                    className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-o1-stone disabled:opacity-30"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-xs font-num font-bold text-white">
                    {targetSessions}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase weekly session target"
                    onClick={() => onTargetChange(targetSessions + 1)}
                    disabled={targetSessions >= 7}
                    className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-o1-stone disabled:opacity-30"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </PartCell>
          ) : (
            <PartCell key={part.id} part={part} />
          ),
        )}
      </div>

      <div className="flex gap-2 border-t border-white/[0.05] pt-3">
        {stat('Sets 7d', stats.setsLast7 > 0 ? String(stats.setsLast7) : '--')}
        {stat(
          'Lifted, 7 days',
          stats.tonnageLast7Kg > 0 ? `${(stats.tonnageLast7Kg / 1000).toFixed(1)}t` : '--',
        )}
        {stat('Load ratio', stats.acwr === null ? '--' : stats.acwr.toFixed(2))}
        {stat('Sleep', stats.avgSleepHours === null ? '--' : `${stats.avgSleepHours}h`)}
      </div>
    </section>
  );
};
