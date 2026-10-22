import React from 'react';
import type { WeeklyIntel } from '../../../report/weeklyIntel';
import { TONE_HEX, TONE_TEXT, toneForScore } from '../../../report/palette';
import { SectionCard, StatCell } from '../../../report/components/IntelParts';
import { deltaCell, fmtVal, isEmpty, weekRows } from './weekDeltas';

interface IntelWeekTabProps {
  weekly: WeeklyIntel;
  /** Sessions per week the athlete is aiming for. */
  target: number;
}

export const IntelWeekTab: React.FC<IntelWeekTabProps> = ({ weekly, target }) => {
  const gradeTone = toneForScore(weekly.score);
  const rows = weekRows(weekly.thisWeek, weekly.lastWeek);
  const deltaRows = rows.filter((row) => !isEmpty(row.now) || !isEmpty(row.prev));
  const reasons = weekly.findings.slice(0, 3);
  return (
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
                    <span className="text-o1-muted w-14 text-right">{fmtVal(row, row.prev)}</span>
                    <span className={`w-12 text-right font-medium ${TONE_TEXT[d.tone]}`}>
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
        <SectionCard title="More findings" subtitle="Every finding is backed by your own data">
          <ul className="divide-y divide-white/[0.05]">
            {weekly.findings.slice(3).map((f) => (
              <li key={f.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
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
  );
};
