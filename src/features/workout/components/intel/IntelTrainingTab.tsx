import React from 'react';
import type { WeeklyIntel } from '../../../report/weeklyIntel';
import type { OblivionReport } from '../../../report/types';
import { TONE_TEXT } from '../../../report/palette';
import { MuscleMap } from '../../../report/components/MuscleMap';
import { DayBars, SectionCard, StatCell } from '../../../report/components/IntelParts';

interface IntelTrainingTabProps {
  weekly: WeeklyIntel;
  report: OblivionReport;
  /** Sessions per week the athlete is aiming for. */
  target: number;
}

export const IntelTrainingTab: React.FC<IntelTrainingTabProps> = ({ weekly, report, target }) => {
  const labels = weekly.days.map((d) => d.label);
  return (
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

      <SectionCard title="Strength trend" subtitle="Estimated 1RM, last 4 weeks vs the 4 before">
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
                    {l.changePct === null ? '--' : `${l.changePct > 0 ? '+' : ''}${l.changePct}%`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
};
