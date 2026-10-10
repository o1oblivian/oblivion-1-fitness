import React, { useMemo, useState } from 'react';
import { X, Zap, FileBarChart } from 'lucide-react';
import { OblivionReportModal } from '../../report/components/OblivionReportModal';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useOblivionReport } from '../../report/useOblivionReport';
import { buildTodayIntel, type Decision } from '../../report/todayIntel';
import { TONE_HEX, type Tone } from '../../report/palette';
import { titleCase } from '../../../utils/displayCase';
import { SectionCard, ToneChip, ZoneGauge } from '../../report/components/IntelParts';

interface IntelCoachIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrescription?: () => void;
}

const DECISION_TONE: Record<Decision, Tone> = {
  PUSH: 'good',
  MAINTAIN: 'watch',
  'EASE OFF': 'watch',
  DELOAD: 'alert',
  'NO SIGNAL': 'idle',
};

const shortDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const kg = (v: number) => `${Math.round(v * 100) / 100}`;

export const IntelCoachIntelligenceModal: React.FC<IntelCoachIntelligenceModalProps> = ({
  isOpen,
  onClose,
  onApplyPrescription,
}) => {
  const { report, sets, sleep } = useOblivionReport(isOpen);
  const exercises = useWorkoutStore((s) => s.exercises);
  const setExercises = useWorkoutStore((s) => s.setExercises);
  const showToast = useWorkoutStore((s) => s.showToast);
  const [showReport, setShowReport] = useState(false);
  const intel = useMemo(() => buildTodayIntel(report, sets, sleep, Date.now()), [report, sets, sleep]);

  if (!isOpen) return null;

  const tone = DECISION_TONE[intel.decision];

  const handleApply = () => {
    const wanted = new Map(intel.prescriptions.map((p) => [p.name.toLowerCase(), p]));
    let touched = 0;
    const next = (exercises ?? []).map((ex) => {
      const key = String(ex.name ?? '').toLowerCase();
      const rx = wanted.get(key);
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
      showToast('No open sets in today\'s session match these lifts.');
      return;
    }
    tactileEngine.playPRCelebration();
    setExercises(() => next);
    showToast(`Applied ${touched} prescribed set${touched === 1 ? '' : 's'} to today's session.`);
    onApplyPrescription?.();
    onClose();
  };

  const goToWorkout = () => {
    tactileEngine.triggerSelectionBuzz();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
    onClose();
  };

  const ratio = report.stats.acwr;
  const sleepNights = sleep.filter((s) => s.hours > 0).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Intel Coach"
      className="fixed inset-0 z-[60000] bg-black select-none flex flex-col animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[420px] mx-auto h-full flex flex-col px-4 text-white">
        <div className="shrink-0 pt-[max(env(safe-area-inset-top),12px)] pb-2 flex items-start justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono font-bold tracking-[0.22em] text-neutral-500">Pro intel</div>
            <h3 className="text-base font-black tracking-wide text-white">Intel Coach</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 -mt-1 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 space-y-3">
        {/* Decision */}
        <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-[84px] h-[84px] shrink-0">
              <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="42" cy="42" r="35" fill="none" stroke="#161618" strokeWidth="7" />
                <circle
                  cx="42"
                  cy="42"
                  r="35"
                  fill="none"
                  stroke={TONE_HEX[tone]}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 35}
                  strokeDashoffset={2 * Math.PI * 35 * (1 - (intel.readiness ?? 0) / 100)}
                  className="transition-[stroke-dashoffset] duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tabular-nums leading-none">
                  {intel.readiness === null ? '--' : intel.readiness}
                </span>
                <span className="text-[8px] font-mono tracking-wider text-neutral-500 mt-1">Readiness</span>
              </div>
            </div>
            <div className="space-y-1.5 min-w-0">
              <ToneChip tone={tone}>{titleCase(intel.decision)}</ToneChip>
              <div className="text-sm font-bold text-white leading-snug">{intel.headline}</div>
              <p className="text-[11px] text-neutral-400 leading-snug">{intel.detail}</p>
            </div>
          </div>

          <ul className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
            {intel.signals.map((sig) => (
              <li key={sig.id} className="min-h-[44px] py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">{sig.label}</div>
                  <div className="text-[10px] font-mono text-neutral-500 truncate">{sig.note}</div>
                </div>
                <span
                  className="text-sm font-black font-mono shrink-0"
                  style={{ color: sig.value === null ? '#737373' : TONE_HEX[sig.tone] }}
                >
                  {sig.display}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Prescription */}
        <SectionCard title="Today's prescription" subtitle="From your last top set of each lift">
          {intel.prescriptions.length === 0 ? (
            <p className="text-xs text-neutral-500 leading-relaxed">
              Log two sessions of a lift (1–12 reps with load) and a load target for it appears here.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-white/[0.05]">
                {intel.prescriptions.map((rx) => (
                  <li key={rx.name} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-bold text-white truncate">{rx.name}</span>
                      <span className="text-sm font-black font-mono text-white shrink-0">
                        {kg(rx.targetWeightKg)} kg × {rx.targetReps}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-[10px] font-mono text-neutral-500">
                      <span>
                        Last {kg(rx.lastWeightKg)} × {rx.lastReps} · {shortDay(rx.lastDay)} · e1RM {kg(rx.e1rm)}
                      </span>
                      <span className="shrink-0">RPE ≤ {rx.rpeCap}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{rx.rationale}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        {/* Load management */}
        <SectionCard title="Load management" subtitle="Last 7 days against your 28-day baseline">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tabular-nums text-white">
                {ratio === null ? '--' : ratio.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono tracking-wider text-neutral-500">Acute : chronic</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400 text-right">
              {ratio === null ? 'Calibrating' : report.stats.acwrLabel}
            </span>
          </div>
          <ZoneGauge value={ratio} min={0} max={2} bandFrom={0.8} bandTo={1.3} ticks={['0', '0.8', '1.3', '1.5', '2.0']} />
        </SectionCard>

        {/* Muscle readiness */}
        <SectionCard title="Muscle readiness" subtitle="Large groups need 48h, small groups 24h">
          <div className="grid grid-cols-2 gap-2">
            {intel.muscles.map((m) => {
              const t: Tone = m.state === 'recovering' ? 'watch' : m.state === 'ready' ? 'good' : 'idle';
              return (
                <div
                  key={m.id}
                  className="rounded-xl bg-[#111113] border border-white/[0.07] px-3 py-1.5 min-h-[40px] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{m.label}</div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      {m.daysAgo === null ? 'Not trained' : m.daysAgo === 0 ? 'Today' : `${m.daysAgo}d ago`}
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TONE_HEX[t] }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider text-neutral-500">
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: TONE_HEX.watch }} />Recovering</span>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: TONE_HEX.good }} />Ready</span>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: TONE_HEX.idle }} />Cold</span>
          </div>
        </SectionCard>

        <p className="text-[10px] font-mono text-neutral-600 text-center leading-relaxed">
          {report.stats.sessions28d} sessions (28d) · {sleepNights} sleep logs · computed on this device, no AI.
        </p>
        </div>

        <div className="shrink-0 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] bg-black border-t border-white/[0.07] space-y-2">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowReport(true);
            }}
            className="w-full min-h-[44px] rounded-2xl bg-transparent border border-white/[0.14] text-o1-bone text-[11px] font-sans font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileBarChart className="w-4 h-4 text-o1-crimson" />
            <span>Open The Oblivion Report (Deep Biomechanical Audit)</span>
          </button>
          <button
            type="button"
            onClick={intel.prescriptions.length > 0 ? handleApply : goToWorkout}
            className="w-full min-h-[48px] rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.99] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>{intel.prescriptions.length > 0 ? "Apply Today's Load Target" : 'Back to Workout'}</span>
          </button>
        </div>
      </div>

      <OblivionReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
};

export const IntelCoachReportModal = IntelCoachIntelligenceModal;
export default IntelCoachIntelligenceModal;
