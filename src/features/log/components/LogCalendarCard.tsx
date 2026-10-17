import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { LogMonthGrid, type MonthDayItem } from './LogMonthGrid';
import { LogWeekStrip } from './LogWeekStrip';

interface LogCalendarCardProps {
  monthView: boolean;
  /** "Wed 14 – 20" for a week, "October 2026" for a month. */
  rangeLabel: string;
  /** True when the view already shows the current week or month, so "next" is disabled. */
  atPresent: boolean;
  weekDays: React.ComponentProps<typeof LogWeekStrip>['weekDays'];
  monthDays: MonthDayItem[];
  /** Blank cells before the 1st of the month (Monday-first grid). */
  monthLeading: number;
  selectedDateStr: string;
  onViewChange: (month: boolean) => void;
  /** -1 for the previous period, 1 for the next. */
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  onSelectDate: (dateStr: string) => void;
}

/** Week/month switcher with its range label, paging buttons and the day picker. */
export const LogCalendarCard: React.FC<LogCalendarCardProps> = ({
  monthView,
  rangeLabel,
  atPresent,
  weekDays,
  monthDays,
  monthLeading,
  selectedDateStr,
  onViewChange,
  onStep,
  onToday,
  onSelectDate,
}) => (
  <div className="rounded-2xl bg-o1-card border border-white/[0.07] p-3 shadow-sm space-y-2.5 text-neutral-100">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="o1-mark text-o1-copper">
          <CalendarDays />
        </span>
        <div className="inline-flex bg-o1-well border border-white/[0.07] p-0.5 rounded-full">
          {([false, true] as const).map((month) => (
            <button
              key={String(month)}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onViewChange(month);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${monthView === month ? 'bg-o1-crimson text-white' : 'text-neutral-400'}`}
            >
              {month ? 'Month' : 'Week'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-semibold text-neutral-400 mr-1">{rangeLabel}</span>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onStep(-1);
          }}
          className="p-1 rounded-lg bg-white/[0.08] text-neutral-300"
          aria-label={monthView ? 'Previous month' : 'Previous week'}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onToday();
          }}
          className={`px-2.5 py-0.5 rounded-full border text-[11px] ${atPresent ? 'border-[#C4121A]/60 text-o1-text' : 'border-white/[0.14] text-o1-muted hover:text-o1-text'}`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onStep(1);
          }}
          disabled={atPresent}
          className="p-1 rounded-lg bg-white/[0.08] text-neutral-300 disabled:opacity-30"
          aria-label={monthView ? 'Next month' : 'Next week'}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    {monthView ? (
      <LogMonthGrid
        leading={monthLeading}
        days={monthDays}
        selectedDateStr={selectedDateStr}
        onSelectDate={onSelectDate}
      />
    ) : (
      <LogWeekStrip
        weekDays={weekDays}
        selectedDateStr={selectedDateStr}
        onSelectDate={onSelectDate}
      />
    )}
  </div>
);
