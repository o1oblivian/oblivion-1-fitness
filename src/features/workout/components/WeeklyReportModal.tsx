import React, { useMemo, useState } from 'react';
import { X, FileBarChart } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useOblivionReport } from '../../report/useOblivionReport';
import { buildWeeklyIntel, type WeekStats } from '../../report/weeklyIntel';
import { TONE_HEX, TONE_TEXT, toneForScore, type Tone } from '../../report/palette';
import { OblivionReportModal } from '../../report/components/OblivionReportModal';
import { DayBars, SectionCard, StatCell, ToneChip } from '../../report/components/IntelParts';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'overview' | 'training' | 'recovery' | 'verdict';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'training', label: 'Training' },
  { id: 'recovery', label: 'Sleep & Fuel' },
  { id: 'verdict', label: 'Verdict' },
];

const STATUS_TONE: Record<string, Tone> = { none: 'idle', under: 'watch', optimal: 'good', over: 'alert' };
const STATUS_LABEL: Record<string, string> = { none: 'Rest', under: 'Under', optimal: 'Optimal', over: 'Over' };

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
  if (isEmpty(row.now) && isEmpty(row.prev)) return { text: '--', tone: 'idle' };
  if (row.now === null || row.prev === null) return { text: '--', tone: 'idle' };
  const diff = row.now - row.prev;
  if (diff === 0) return { text: '0', tone: 'idle' };
  const pct = row.prev !== 0 ? Math.round((diff / row.prev) * 100) : null;
  const text = pct === null ? `${diff > 0 ? '+' : ''}${row.format(diff)}` : `${pct > 0 ? '+' : ''}${pct}%`;
  if (row.better === 'neutral') return { text, tone: 'idle' };
  return { text, tone: diff > 0 ? 'good' : 'watch' };
}

const fmtVal = (row: DeltaRow, v: number | null) => (isEmpty(v) ? '--' : row.format(v as number));

const weekRows = (a: WeekStats, b: WeekStats): DeltaRow[] => [
  { label: 'Sessions', now: a.sessions, prev: b.sessions, format: (v) => String(v), better: 'up' },
  { label: 'Hard sets', now: a.sets, prev: b.sets, format: (v) => String(v), better: 'up' },
  { label: 'Tonnage', now: a.tonnageKg, prev: b.tonnageKg, format: (v) => `${(v / 1000).toFixed(1)}t`, better: 'neutral' },
  { label: 'Sleep avg', now: a.avgSleepHours, prev: b.avgSleepHours, format: (v) => `${v}h`, better: 'up' },
  { label: 'Calories avg', now: a.avgKcal, prev: b.avgKcal, format: (v) => String(v), better: 'neutral' },
  { label: 'Protein avg', now: a.avgProteinG, prev: b.avgProteinG, format: (v) => `${v}g`, better: 'up' },
];

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showReport, setShowReport] = useState(false);
  const { report, sets, historyByDate } = useOblivionReport(isOpen);

  const weekly = useMemo(
    () => buildWeeklyIntel(sets, historyByDate, report, Date.now()),
    [sets, historyByDate, report],
  );

  if (!isOpen) return null;

  const gradeTone = toneForScore(weekly.score);
  const labels = weekly.days.map((d) => d.label);
  const topMuscles = [...report.muscles].sort((a, b) => b.sets - a.sets).filter((m) => m.sets > 0).slice(0, 6);

  const tonnageDelta = deltaCell(weekRows(weekly.thisWeek, weekly.lastWeek)[2]);
  const deltaRows = weekRows(weekly.thisWeek, weekly.lastWeek).filter((row) => !isEmpty(row.now) || !isEmpty(row.prev));
  const weekEmpty = weekly.thisWeek.sessions === 0 && weekly.thisWeek.sleepNights === 0 && weekly.thisWeek.fuelDays === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Weekly Report Card"
      className="fixed inset-0 z-50 bg-black select-none flex flex-col animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[420px] mx-auto h-full flex flex-col px-4 text-neutral-100">
        <div className="shrink-0 pt-[max(env(safe-area-inset-top),12px)] pb-2 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-[0.22em] text-neutral-500">
              Last 7 days
            </div>
            <h3 className="text-base font-black tracking-wide text-white">Weekly Report Card</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 -mt-1 rounded-xl hover:bg-white/[0.06] text-neutral-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              className={`h-8 py-1 px-2.5 rounded-full text-[11px] font-semibold tracking-normal whitespace-nowrap flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-neutral-900'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-white/[0.07]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full py-3 space-y-3 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {activeTab === 'overview' && (
            <>
              <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500">7-day tonnage</div>
                    <div className="text-3xl font-black font-mono tabular-nums leading-none">
                      {weekly.thisWeek.tonnageKg > 0 ? (weekly.thisWeek.tonnageKg / 1000).toFixed(1) : '--'}
                      {weekly.thisWeek.tonnageKg > 0 && <span className="text-sm text-neutral-500"> t</span>}
                    </div>
                    <div className={`text-[11px] font-mono font-bold ${TONE_TEXT[tonnageDelta.tone]}`}>
                      {tonnageDelta.text} vs last wk
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500">Sessions</div>
                    <div className="text-3xl font-black font-mono tabular-nums leading-none">
                      {weekly.thisWeek.sessions}
                      <span className="text-sm text-neutral-500"> / {report.stats.targetSessionsPerWeek}</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (weekly.thisWeek.sessions / Math.max(1, report.stats.targetSessionsPerWeek)) * 100)}%`,
                          background: TONE_HEX[weekly.thisWeek.sessions >= report.stats.targetSessionsPerWeek ? 'good' : 'watch'],
                        }}
                      />
                    </div>
                  </div>
                </div>
                {weekEmpty && (
                  <p className="text-[11px] text-neutral-500 mt-3">Nothing logged this week. Train, log sleep or log meals.</p>
                )}
              </section>

              {deltaRows.length > 0 && (
                <SectionCard title="Versus last week">
                  <ul className="divide-y divide-white/[0.05]">
                    {deltaRows.map((row) => {
                      const d = deltaCell(row);
                      return (
                        <li key={row.label} className="min-h-[44px] flex items-center justify-between gap-3 text-xs">
                          <span className="text-neutral-300">{row.label}</span>
                          <div className="flex items-center gap-4 font-mono">
                            <span className="text-white font-bold w-14 text-right">{fmtVal(row, row.now)}</span>
                            <span className="text-neutral-600 w-14 text-right">{fmtVal(row, row.prev)}</span>
                            <span className={`w-12 text-right font-bold ${TONE_TEXT[d.tone]}`}>{d.text}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex justify-end gap-4 text-[9px] font-mono tracking-wider text-neutral-600 pr-0.5">
                    <span className="w-14 text-right">This wk</span>
                    <span className="w-14 text-right">Last wk</span>
                    <span className="w-12 text-right">Change</span>
                  </div>
                </SectionCard>
              )}

              {weekly.score !== null && (
                <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0"
                      style={{ borderColor: `${TONE_HEX[gradeTone]}66` }}
                    >
                      <span className="text-4xl font-black font-mono leading-none" style={{ color: TONE_HEX[gradeTone] }}>
                        {weekly.letter}
                      </span>
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono leading-none">
                        {weekly.score}
                        <span className="text-sm text-neutral-500"> / 100</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        From {weekly.parts.filter((p) => p.value !== null).length} of 4 components.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {weekly.parts.filter((p) => p.value !== null).map((p) => (
                      <div key={p.id} className="rounded-xl bg-[#111113] border border-white/[0.07] px-3 py-2 min-h-[44px]">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400">{p.label}</span>
                          <span className="text-sm font-black font-mono">{p.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === 'training' && (
            <>
              <SectionCard title="Daily tonnage" subtitle="Total kg moved per day">
                <DayBars
                  labels={labels}
                  values={weekly.days.map((d) => (d.trained ? d.tonnageKg : null))}
                  format={(v) => `${(v / 1000).toFixed(1)}t`}
                  tone="good"
                />
                <div className="grid grid-cols-3 gap-2">
                  <StatCell label="Sessions" value={String(weekly.thisWeek.sessions)} sub={`target ${report.stats.targetSessionsPerWeek}`} />
                  <StatCell label="Hard sets" value={weekly.thisWeek.sets > 0 ? String(weekly.thisWeek.sets) : '--'} />
                  <StatCell label="Tonnage" value={weekly.thisWeek.tonnageKg > 0 ? `${(weekly.thisWeek.tonnageKg / 1000).toFixed(1)}t` : '--'} />
                </div>
              </SectionCard>

              <SectionCard title="Sets by muscle" subtitle="Weighted hard sets this week">
                {topMuscles.length === 0 ? (
                  <p className="text-xs text-neutral-500">No resistance sets logged this week.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {topMuscles.map((m) => (
                      <li key={m.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{m.label}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-neutral-400">
                              {m.sets} <span className="text-neutral-600">/ {m.min}–{m.max}</span>
                            </span>
                            <ToneChip tone={STATUS_TONE[m.status]}>{STATUS_LABEL[m.status]}</ToneChip>
                          </div>
                        </div>
                        <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, (m.sets / (m.max * 1.25)) * 100)}%`, background: TONE_HEX[STATUS_TONE[m.status]] }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Lift movement" subtitle="Estimated 1RM, last 4 weeks vs the 4 before">
                {report.lifts.length === 0 ? (
                  <p className="text-xs text-neutral-500">Needs two sessions of the same lift.</p>
                ) : (
                  <ul className="divide-y divide-white/[0.05]">
                    {report.lifts.slice(0, 4).map((l) => (
                      <li key={l.name} className="min-h-[44px] flex items-center justify-between gap-3 text-xs">
                        <span className="text-neutral-200 font-semibold truncate">{l.name}</span>
                        <span className="font-mono shrink-0 text-neutral-400">
                          {l.currentE1rm} kg{' '}
                          <span className={l.changePct === null ? 'text-neutral-600' : l.changePct >= 0 ? TONE_TEXT.good : TONE_TEXT.watch}>
                            {l.changePct === null ? '--' : `${l.changePct > 0 ? '+' : ''}${l.changePct}%`}
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
                  <StatCell label="Average" value={weekly.thisWeek.avgSleepHours === null ? '--' : `${weekly.thisWeek.avgSleepHours}h`} sub={`${weekly.thisWeek.sleepNights} nights logged`} />
                  <StatCell label="Last week" value={weekly.lastWeek.avgSleepHours === null ? '--' : `${weekly.lastWeek.avgSleepHours}h`} />
                </div>
              </SectionCard>

              <SectionCard title="Calories" subtitle="Intake per day, dashed line is your target">
                <DayBars
                  labels={labels}
                  values={weekly.days.map((d) => d.kcal)}
                  target={weekly.days.map((d) => d.kcalTarget)}
                  format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)))}
                  tone="watch"
                />
                <div className="grid grid-cols-2 gap-2">
                  <StatCell label="Average" value={weekly.thisWeek.avgKcal === null ? '--' : String(weekly.thisWeek.avgKcal)} sub={`${weekly.thisWeek.fuelDays} days logged`} />
                  <StatCell label="Last week" value={weekly.lastWeek.avgKcal === null ? '--' : String(weekly.lastWeek.avgKcal)} />
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
                  <StatCell label="Average" value={weekly.thisWeek.avgProteinG === null ? '--' : `${weekly.thisWeek.avgProteinG}g`} />
                  <StatCell label="Last week" value={weekly.lastWeek.avgProteinG === null ? '--' : `${weekly.lastWeek.avgProteinG}g`} />
                </div>
              </SectionCard>
            </>
          )}

          {activeTab === 'verdict' && (
            <SectionCard title="What the numbers say" subtitle="Every finding is backed by your own data">
              {weekly.findings.length === 0 ? (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Not enough logged this week to say anything honest. Train, log sleep or log meals and findings
                  appear here.
                </p>
              ) : (
                <ul className="divide-y divide-white/[0.05]">
                  {weekly.findings.map((f) => (
                    <li key={f.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: TONE_HEX[f.tone] }} />
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-sm font-bold text-white">{f.title}</div>
                        <p className="text-[11px] leading-snug text-neutral-400">{f.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}
        </div>

        <div className="shrink-0 pt-2 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-white/[0.07] bg-black">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setShowReport(true);
            }}
            className="w-full min-h-[48px] rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <FileBarChart className="w-4 h-4" />
            <span>Open The Oblivion Report</span>
          </button>
        </div>
      </div>

      <OblivionReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
};

export default WeeklyReportModal;
