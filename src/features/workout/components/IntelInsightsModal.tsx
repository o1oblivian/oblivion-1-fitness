import React, { useEffect, useMemo, useState } from 'react';
import { X, FileBarChart, Lock, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useOblivionReport } from '../../report/useOblivionReport';
import { buildWeeklyIntel, type WeekStats } from '../../report/weeklyIntel';
import { TONE_HEX, TONE_TEXT, toneForScore, type Tone } from '../../report/palette';
import { OblivionReportModal } from '../../report/components/OblivionReportModal';
import { MuscleMap } from '../../report/components/MuscleMap';
import { ActionList } from '../../report/components/ActionList';
import { DayBars, SectionCard, StatCell } from '../../report/components/IntelParts';
import { IntelTodayPanel } from './IntelTodayPanel';

type IntelTab = 'today' | 'week' | 'training' | 'recovery' | 'next';

interface IntelInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: IntelTab;
}

const TABS: { id: IntelTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'training', label: 'Training' },
  { id: 'recovery', label: 'Sleep & Fuel' },
  { id: 'next', label: 'Next moves' },
];

const LOCKED_FEATURES = [
  'Your week graded A to F, with the reasons behind it',
  "Today's readiness call and load targets for every lift",
  'Acute : chronic load and per-muscle recovery',
  'Muscle map, strength trend, sleep and fuel adherence',
  'Next-week moves you can start in one tap',
];

interface DeltaRow {
  label: string;
  now: number | null;
  prev: number | null;
  format: (v: number) => string;
  /** 'up' = higher is better, 'neutral' = no judgement. */
  better: 'up' | 'neutral';
}

const isEmpty = (v: number | null) => v === null || v === 0;

function deltaCell(row: DeltaRow): { text: string; tone: Tone } {
  if (row.now === null || row.prev === null || (isEmpty(row.now) && isEmpty(row.prev)))
    return { text: '--', tone: 'idle' };
  const diff = row.now - row.prev;
  if (diff === 0) return { text: '0', tone: 'idle' };
  const pct = row.prev !== 0 ? Math.round((diff / row.prev) * 100) : null;
  const text =
    pct === null ? `${diff > 0 ? '+' : ''}${row.format(diff)}` : `${pct > 0 ? '+' : ''}${pct}%`;
  if (row.better === 'neutral') return { text, tone: 'idle' };
  return { text, tone: diff > 0 ? 'good' : 'watch' };
}

const fmtVal = (row: DeltaRow, v: number | null) => (isEmpty(v) ? '--' : row.format(v as number));

const weekRows = (a: WeekStats, b: WeekStats): DeltaRow[] => [
  { label: 'Sessions', now: a.sessions, prev: b.sessions, format: (v) => String(v), better: 'up' },
  { label: 'Hard sets', now: a.sets, prev: b.sets, format: (v) => String(v), better: 'up' },
  {
    label: 'Total lifted',
    now: a.tonnageKg,
    prev: b.tonnageKg,
    format: (v) => `${(v / 1000).toFixed(1)}t`,
    better: 'neutral',
  },
  {
    label: 'Sleep avg',
    now: a.avgSleepHours,
    prev: b.avgSleepHours,
    format: (v) => `${v}h`,
    better: 'up',
  },
  {
    label: 'Calories avg',
    now: a.avgKcal,
    prev: b.avgKcal,
    format: (v) => String(v),
    better: 'neutral',
  },
  {
    label: 'Protein avg',
    now: a.avgProteinG,
    prev: b.avgProteinG,
    format: (v) => `${v}g`,
    better: 'up',
  },
];

export const IntelInsightsModal: React.FC<IntelInsightsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'week',
}) => {
  const { hasFullAccess, openPaywall } = useSubscription();
  const [activeTab, setActiveTab] = useState<IntelTab>(initialTab);
  const [showReport, setShowReport] = useState(false);
  const { report, sets, sleep, historyByDate } = useOblivionReport(isOpen && hasFullAccess);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const weekly = useMemo(
    () => buildWeeklyIntel(sets, historyByDate, report, Date.now()),
    [sets, historyByDate, report],
  );

  if (!isOpen) return null;

  const gradeTone = toneForScore(weekly.score);
  const labels = weekly.days.map((d) => d.label);
  const rows = weekRows(weekly.thisWeek, weekly.lastWeek);
  const deltaRows = rows.filter((row) => !isEmpty(row.now) || !isEmpty(row.prev));
  const target = report.stats.targetSessionsPerWeek;
  const reasons = weekly.findings.slice(0, 3);

  const goTrain = () => {
    tactileEngine.triggerSelectionBuzz();
    onClose();
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oblivion Intel Insights"
      className="fixed inset-0 z-50 bg-o1-canvas select-none flex flex-col animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[420px] mx-auto h-full flex flex-col px-4 text-o1-text">
        <div className="shrink-0 pt-[max(env(safe-area-inset-top),12px)] pb-2 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 w-1 h-9 rounded-full bg-o1-crimson" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-light tracking-wide text-o1-text">
                  Oblivion Intel Insights
                </h3>
                <span className="px-1.5 py-0.5 rounded-md border border-o1-crimson/60 text-o1-label font-medium tracking-wider text-o1-text">
                  PRO
                </span>
              </div>
              <div className="text-o1-label text-o1-muted">
                Computed on this device from your logs
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 -mt-1 rounded-xl hover:bg-white/[0.06] text-o1-stone flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasFullAccess ? (
          <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3">
            <section className="relative overflow-hidden rounded-2xl bg-o1-surface border border-white/[0.07] p-4">
              <div
                aria-hidden="true"
                className="blur-[6px] opacity-60 pointer-events-none space-y-3"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border border-o1-emerald/40 flex items-center justify-center text-4xl font-light font-num text-o1-emerald">
                    B
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-3/4 rounded bg-white/15" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-11 rounded-xl bg-o1-sheet border border-white/[0.07]"
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-o1-text" />
              </div>
            </section>
            <section className="rounded-2xl bg-o1-sheet border border-white/[0.07] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-o1-amber-deep" />
                <h4 className="text-sm font-medium">Part of Club Pass Pro</h4>
              </div>
              <ul className="space-y-2">
                {LOCKED_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-o1-body text-o1-text/90">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-o1-crimson shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  openPaywall('Intel Insights');
                }}
                className="w-full min-h-[48px] rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Unlock Oblivion Intel Insights
              </button>
            </section>
          </div>
        ) : (
          <>
            <div
              role="tablist"
              className="shrink-0 w-full py-2 border-b border-white/[0.07] flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => {
                    tactileEngine.triggerSelectionBuzz();
                    setActiveTab(tab.id);
                  }}
                  className={`h-10 px-3.5 rounded-full text-o1-caption font-semibold whitespace-nowrap flex items-center justify-center shrink-0 transition-all cursor-pointer border ${
                    activeTab === tab.id
                      ? 'bg-o1-sheet text-o1-text border-o1-crimson/70'
                      : 'bg-transparent text-o1-muted border-white/[0.07] hover:text-o1-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full py-3 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {activeTab === 'today' && (
                <IntelTodayPanel report={report} sets={sets} sleep={sleep} onApplied={onClose} />
              )}

              {activeTab === 'week' && (
                <>
                  <section className="w-full rounded-2xl bg-o1-surface border border-white/[0.07] p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-[72px] h-[72px] rounded-2xl border flex items-center justify-center shrink-0"
                        style={{ borderColor: `${TONE_HEX[gradeTone]}66` }}
                      >
                        <span
                          className="text-5xl font-light font-num leading-none"
                          style={{ color: TONE_HEX[gradeTone] }}
                        >
                          {weekly.score === null ? '--' : weekly.letter}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-o1-label text-o1-muted">Week grade</div>
                        <div className="text-2xl font-light font-num leading-none mt-0.5">
                          {weekly.score === null ? '--' : weekly.score}
                          <span className="text-sm text-o1-muted"> / 100</span>
                        </div>
                        <p className="text-o1-label text-o1-muted mt-1">
                          {weekly.score === null
                            ? `Needs 2 of 4 areas logged (training, load, sleep, fuel). You have ${weekly.parts.filter((p) => p.value !== null).length}.`
                            : `From ${weekly.parts.filter((p) => p.value !== null).length} of 4 areas.`}
                        </p>
                      </div>
                    </div>
                    {reasons.length > 0 && (
                      <ul className="space-y-2 border-t border-white/[0.05] pt-3">
                        {reasons.map((f) => (
                          <li key={f.id} className="flex items-start gap-2.5">
                            <span
                              className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                              style={{ background: TONE_HEX[f.tone] }}
                            />
                            <div className="min-w-0">
                              <div className="text-o1-body font-medium text-o1-text">{f.title}</div>
                              <p className="text-o1-label leading-snug text-o1-muted">{f.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <div className="grid grid-cols-2 gap-2">
                    <StatCell
                      label="Sessions"
                      value={String(weekly.thisWeek.sessions)}
                      sub={`goal ${target} a week`}
                    />
                    <StatCell
                      label="Lifted, 7 days"
                      value={
                        weekly.thisWeek.tonnageKg > 0
                          ? `${(weekly.thisWeek.tonnageKg / 1000).toFixed(1)}t`
                          : '--'
                      }
                      sub={`${deltaCell(rows[2]).text} vs last week`}
                    />
                  </div>

                  {weekly.parts.some((p) => p.value !== null) && (
                    <div className="grid grid-cols-2 gap-2">
                      {weekly.parts
                        .filter((p) => p.value !== null)
                        .map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl bg-o1-surface border border-white/[0.07] px-3 py-2 min-h-[44px] flex items-baseline justify-between"
                          >
                            <span className="text-o1-label text-o1-muted">{p.label}</span>
                            <span className="text-sm font-light font-num">{p.value}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {deltaRows.length > 0 && (
                    <SectionCard title="Versus last week">
                      <ul className="divide-y divide-white/[0.05]">
                        {deltaRows.map((row) => {
                          const d = deltaCell(row);
                          return (
                            <li
                              key={row.label}
                              className="min-h-[44px] flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="text-o1-text/85">{row.label}</span>
                              <div className="flex items-center gap-4 font-num">
                                <span className="text-o1-text font-medium w-14 text-right">
                                  {fmtVal(row, row.now)}
                                </span>
                                <span className="text-o1-muted w-14 text-right">
                                  {fmtVal(row, row.prev)}
                                </span>
                                <span
                                  className={`w-12 text-right font-medium ${TONE_TEXT[d.tone]}`}
                                >
                                  {d.text}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex justify-end gap-4 text-o1-label text-o1-muted pr-0.5">
                        <span className="w-14 text-right">This wk</span>
                        <span className="w-14 text-right">Last wk</span>
                        <span className="w-12 text-right">Change</span>
                      </div>
                    </SectionCard>
                  )}

                  {weekly.findings.length > 3 && (
                    <SectionCard
                      title="More findings"
                      subtitle="Every finding is backed by your own data"
                    >
                      <ul className="divide-y divide-white/[0.05]">
                        {weekly.findings.slice(3).map((f) => (
                          <li
                            key={f.id}
                            className="py-3 first:pt-0 last:pb-0 flex items-start gap-3"
                          >
                            <span
                              className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                              style={{ background: TONE_HEX[f.tone] }}
                            />
                            <div className="min-w-0 space-y-0.5">
                              <div className="text-sm font-medium text-o1-text">{f.title}</div>
                              <p className="text-o1-label leading-snug text-o1-muted">{f.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  )}
                </>
              )}

              {activeTab === 'training' && (
                <>
                  <SectionCard title="Lifted each day" subtitle="Total weight moved per day">
                    <DayBars
                      labels={labels}
                      values={weekly.days.map((d) => (d.trained ? d.tonnageKg : null))}
                      format={(v) => `${(v / 1000).toFixed(1)}t`}
                      tone="good"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <StatCell
                        label="Sessions"
                        value={String(weekly.thisWeek.sessions)}
                        sub={`goal ${target}`}
                      />
                      <StatCell
                        label="Hard sets"
                        value={weekly.thisWeek.sets > 0 ? String(weekly.thisWeek.sets) : '--'}
                      />
                      <StatCell
                        label="Total lifted"
                        value={
                          weekly.thisWeek.tonnageKg > 0
                            ? `${(weekly.thisWeek.tonnageKg / 1000).toFixed(1)}t`
                            : '--'
                        }
                      />
                    </div>
                  </SectionCard>

                  <MuscleMap muscles={report.muscles} />

                  <SectionCard
                    title="Strength trend"
                    subtitle="Estimated 1RM, last 4 weeks vs the 4 before"
                  >
                    {report.lifts.length === 0 ? (
                      <p className="text-xs text-o1-muted">Needs two sessions of the same lift.</p>
                    ) : (
                      <ul className="divide-y divide-white/[0.05]">
                        {report.lifts.slice(0, 5).map((l) => (
                          <li
                            key={l.name}
                            className="min-h-[44px] flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="text-o1-text font-semibold truncate">{l.name}</span>
                            <span className="font-num shrink-0 text-o1-muted">
                              {l.currentE1rm} kg{' '}
                              <span
                                className={
                                  l.changePct === null
                                    ? 'text-o1-muted'
                                    : l.changePct >= 0
                                      ? TONE_TEXT.good
                                      : TONE_TEXT.watch
                                }
                              >
                                {l.changePct === null
                                  ? '--'
                                  : `${l.changePct > 0 ? '+' : ''}${l.changePct}%`}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                </>
              )}

              {activeTab === 'recovery' && (
                <>
                  <SectionCard title="Sleep" subtitle="Hours per night, dashed line is 8h">
                    <DayBars
                      labels={labels}
                      values={weekly.days.map((d) => d.sleepHours)}
                      target={8}
                      format={(v) => `${Math.round(v * 10) / 10}`}
                      tone="good"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <StatCell
                        label="Average"
                        value={
                          weekly.thisWeek.avgSleepHours === null
                            ? '--'
                            : `${weekly.thisWeek.avgSleepHours}h`
                        }
                        sub={`${weekly.thisWeek.sleepNights} of 7 nights logged`}
                      />
                      <StatCell
                        label="Last week"
                        value={
                          weekly.lastWeek.avgSleepHours === null
                            ? '--'
                            : `${weekly.lastWeek.avgSleepHours}h`
                        }
                      />
                    </div>
                  </SectionCard>
                  <SectionCard
                    title="Calories"
                    subtitle="Intake per day, dashed line is your target"
                  >
                    <DayBars
                      labels={labels}
                      values={weekly.days.map((d) => d.kcal)}
                      target={weekly.days.map((d) => d.kcalTarget)}
                      format={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
                      }
                      tone="watch"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <StatCell
                        label="Average"
                        value={
                          weekly.thisWeek.avgKcal === null ? '--' : String(weekly.thisWeek.avgKcal)
                        }
                        sub={`${weekly.thisWeek.fuelDays} of 7 days logged`}
                      />
                      <StatCell
                        label="Last week"
                        value={
                          weekly.lastWeek.avgKcal === null ? '--' : String(weekly.lastWeek.avgKcal)
                        }
                      />
                    </div>
                  </SectionCard>
                  <SectionCard title="Protein" subtitle="Grams per day, dashed line is your target">
                    <DayBars
                      labels={labels}
                      values={weekly.days.map((d) => d.proteinG)}
                      target={weekly.days.map((d) => d.proteinTarget)}
                      format={(v) => String(Math.round(v))}
                      tone="good"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <StatCell
                        label="Average"
                        value={
                          weekly.thisWeek.avgProteinG === null
                            ? '--'
                            : `${weekly.thisWeek.avgProteinG}g`
                        }
                      />
                      <StatCell
                        label="Last week"
                        value={
                          weekly.lastWeek.avgProteinG === null
                            ? '--'
                            : `${weekly.lastWeek.avgProteinG}g`
                        }
                      />
                    </div>
                  </SectionCard>
                </>
              )}

              {activeTab === 'next' && (
                <ActionList
                  title="Next moves"
                  actions={report.actions}
                  ctaLabel="Train"
                  onAction={goTrain}
                />
              )}
            </div>

            <div className="shrink-0 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-white/[0.07] bg-o1-canvas">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setShowReport(true);
                }}
                className="w-full min-h-[48px] rounded-2xl bg-o1-sheet border border-white/[0.12] hover:border-white/[0.24] text-o1-text text-o1-body font-medium flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <FileBarChart className="w-4 h-4 text-o1-crimson" />
                Open The Oblivion Report
              </button>
            </div>
          </>
        )}
      </div>

      <OblivionReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
};
