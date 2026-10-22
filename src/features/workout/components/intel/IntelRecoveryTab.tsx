import React from 'react';
import type { WeeklyIntel } from '../../../report/weeklyIntel';
import { DayBars, SectionCard, StatCell } from '../../../report/components/IntelParts';

export const IntelRecoveryTab: React.FC<{ weekly: WeeklyIntel }> = ({ weekly }) => {
  const labels = weekly.days.map((d) => d.label);
  return (
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
              weekly.thisWeek.avgSleepHours === null ? '--' : `${weekly.thisWeek.avgSleepHours}h`
            }
            sub={`${weekly.thisWeek.sleepNights} of 7 nights logged`}
          />
          <StatCell
            label="Last week"
            value={
              weekly.lastWeek.avgSleepHours === null ? '--' : `${weekly.lastWeek.avgSleepHours}h`
            }
          />
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
          <StatCell
            label="Average"
            value={weekly.thisWeek.avgKcal === null ? '--' : String(weekly.thisWeek.avgKcal)}
            sub={`${weekly.thisWeek.fuelDays} of 7 days logged`}
          />
          <StatCell
            label="Last week"
            value={weekly.lastWeek.avgKcal === null ? '--' : String(weekly.lastWeek.avgKcal)}
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
            value={weekly.thisWeek.avgProteinG === null ? '--' : `${weekly.thisWeek.avgProteinG}g`}
          />
          <StatCell
            label="Last week"
            value={weekly.lastWeek.avgProteinG === null ? '--' : `${weekly.lastWeek.avgProteinG}g`}
          />
        </div>
      </SectionCard>
    </>
  );
};
