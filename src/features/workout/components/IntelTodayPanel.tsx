import React, { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { buildTodayIntel, type Decision } from '../../report/todayIntel';
import { TONE_HEX, type Tone } from '../../report/palette';
import { titleCase } from '../../../utils/displayCase';
import { SectionCard, ToneChip, ZoneGauge } from '../../report/components/IntelParts';
import type { OblivionReport, LoggedSet, SleepSample } from '../../report/types';
import { useSimpleMode } from '../../../stores/useDisplayPrefs';
import { BodyStatusCard } from '../../bodyStatus/BodyStatusCard';
import { useBodyStatus } from '../../bodyStatus/bodyStatus';
import { useCountUp } from '../../../hooks/useCountUp';
import { PLAIN_LOAD } from '../../../utils/acwrMath';
import { COLOR } from '../../../theme/colors';

const DECISION_TONE: Record<Decision, Tone> = {
  PUSH: 'good',
  MAINTAIN: 'watch',
  'EASE OFF': 'watch',
  DELOAD: 'alert',
  'NO SIGNAL': 'idle',
  REST: 'good',
  PROTECT: 'watch',
};

const shortDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const kg = (v: number) => `${Math.round(v * 100) / 100}`;

interface IntelTodayPanelProps {
  report: OblivionReport;
  sets: LoggedSet[];
  sleep: SleepSample[];
  onApplied: () => void;
}

/** Today's call: readiness, load targets for open sets, ACWR and per-muscle recovery. */
export const IntelTodayPanel: React.FC<IntelTodayPanelProps> = ({
  report,
  sets,
  sleep,
  onApplied,
}) => {
  const exercises = useWorkoutStore((s) => s.exercises);
  const setExercises = useWorkoutStore((s) => s.setExercises);
  const [noMatch, setNoMatch] = useState(false);
  const simple = useSimpleMode();
  const body = useBodyStatus();
  const intel = useMemo(
    () => buildTodayIntel(report, sets, sleep, Date.now(), body),
    [report, sets, sleep, body],
  );
  const readinessShown = useCountUp(intel.readiness);
  const tone = DECISION_TONE[intel.decision];
  const ratio = report.stats.acwr;

  const handleApply = () => {
    const wanted = new Map(intel.prescriptions.map((p) => [p.name.toLowerCase(), p]));
    let touched = 0;
    const next = (exercises ?? []).map((ex) => {
      const rx = wanted.get(String(ex.name ?? '').toLowerCase());
      if (!rx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.completed) return s;
          touched += 1;
          return { ...s, weightKg: rx.targetWeightKg };
        }),
      };
    });
    if (touched === 0) {
      tactileEngine.triggerSelectionBuzz();
      setNoMatch(true);
      return;
    }
    setNoMatch(false);
    tactileEngine.playPRCelebration();
    setExercises(() => next);
    onApplied();
  };

  return (
    <>
      <BodyStatusCard />
      <section className="w-full rounded-2xl bg-o1-surface border border-white/[0.07] p-4 space-y-3">
        <div className="flex items-center gap-4">
          <div className="relative w-[84px] h-[84px] shrink-0">
            <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="42" cy="42" r="35" fill="none" stroke={COLOR.track} strokeWidth="7" />
              {intel.readiness !== null && (
                <circle
                  cx="42"
                  cy="42"
                  r="35"
                  fill="none"
                  stroke={TONE_HEX[tone]}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 35}
                  strokeDashoffset={2 * Math.PI * 35 * (1 - intel.readiness / 100)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-light font-num tabular-nums leading-none">
                {readinessShown === null ? '--' : readinessShown}
              </span>
              <span className="text-o1-label text-o1-muted mt-1">Readiness</span>
            </div>
          </div>
          <div className="space-y-1.5 min-w-0">
            <ToneChip tone={tone}>{titleCase(intel.decision)}</ToneChip>
            <div className="text-sm font-medium text-o1-text leading-snug">{intel.headline}</div>
            <p className="text-o1-label text-o1-muted leading-snug">{intel.detail}</p>
          </div>
        </div>
        <ul className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
          {intel.signals.map((sig) => (
            <li key={sig.id} className="min-h-[44px] py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-o1-text">{sig.label}</div>
                <div className="text-o1-label text-o1-muted truncate">{sig.note}</div>
              </div>
              <span
                className="text-sm font-light font-num shrink-0"
                style={{ color: sig.value === null ? COLOR.muted : TONE_HEX[sig.tone] }}
              >
                {sig.display}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <SectionCard title="Today's load targets" subtitle="From your last top set of each lift">
        {intel.prescriptions.length === 0 ? (
          <p className="text-xs text-o1-muted leading-relaxed">
            {intel.decision === 'REST'
              ? 'Load targets are paused while you recover. They return when you set yourself back to Good.'
              : 'Log two sessions of a lift (1–12 reps with load) and a load target for it appears here.'}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-white/[0.05]">
              {intel.prescriptions.map((rx) => (
                <li key={rx.name} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-o1-text truncate">{rx.name}</span>
                    <span className="text-sm font-light font-num text-o1-text shrink-0">
                      {kg(rx.targetWeightKg)} kg × {rx.targetReps}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-o1-label font-num text-o1-muted">
                    <span>
                      Last {kg(rx.lastWeightKg)} × {rx.lastReps} · {shortDay(rx.lastDay)}
                      {simple ? '' : ` · e1RM ${kg(rx.e1rm)}`}
                    </span>
                    {simple ? null : <span className="shrink-0">RPE ≤ {rx.rpeCap}</span>}
                  </div>
                  <p className="text-o1-label text-o1-muted">{rx.rationale}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleApply}
              className="w-full min-h-[44px] rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-medium text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Apply to today's session
            </button>
            {noMatch && (
              <p role="status" className="text-o1-label text-o1-amber leading-relaxed">
                None of these lifts have open sets in your Active log. Add one of them first, then
                apply.
              </p>
            )}
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Training load"
        subtitle={
          simple ? 'This week compared with your usual' : 'Last 7 days against your 28-day baseline'
        }
      >
        {simple ? (
          <p className="text-sm font-medium text-o1-text">
            {ratio === null
              ? 'Still learning your usual week'
              : PLAIN_LOAD[report.stats.acwrLabel] || report.stats.acwrLabel}
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light font-num tabular-nums text-o1-text">
                  {ratio === null ? '--' : ratio.toFixed(2)}
                </span>
                <span className="text-o1-label text-o1-muted">Acute : chronic</span>
              </div>
              <span className="text-o1-label text-o1-muted text-right">
                {ratio === null ? 'Calibrating' : report.stats.acwrLabel}
              </span>
            </div>
            <ZoneGauge
              value={ratio}
              min={0}
              max={2}
              bandFrom={0.8}
              bandTo={1.3}
              ticks={['0', '0.8', '1.3', '1.5', '2.0']}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="Muscle recovery" subtitle="Large groups need 48h, small groups 24h">
        <div className="grid grid-cols-2 gap-2">
          {intel.muscles.map((m) => {
            const t: Tone =
              m.state === 'recovering' ? 'watch' : m.state === 'ready' ? 'good' : 'idle';
            return (
              <div
                key={m.id}
                className="rounded-xl bg-o1-sheet border border-white/[0.07] px-3 py-1.5 min-h-[44px] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-o1-text truncate">{m.label}</div>
                  <div className="text-o1-label text-o1-muted">
                    {m.daysAgo === null
                      ? 'Not trained'
                      : m.daysAgo === 0
                        ? 'Today'
                        : `${m.daysAgo}d ago`}
                  </div>
                </div>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: TONE_HEX[t] }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-o1-label text-o1-muted">
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full" style={{ background: TONE_HEX.watch }} />
            Recovering
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full" style={{ background: TONE_HEX.good }} />
            Ready
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full" style={{ background: TONE_HEX.idle }} />
            Cold
          </span>
        </div>
      </SectionCard>
    </>
  );
};
