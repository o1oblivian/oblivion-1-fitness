import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface MonthDayItem {
  dayNum: number;
  dateStr: string;
  isToday: boolean;
  isFuture: boolean;
  /** A workout is logged on this day. */
  trained: boolean;
}

interface LogMonthGridProps {
  /** Blank cells before day 1 so the grid starts on Monday. */
  leading: number;
  days: MonthDayItem[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

const HEAD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const LogMonthGrid: React.FC<LogMonthGridProps> = ({
  leading,
  days,
  selectedDateStr,
  onSelectDate,
}) => {
  const trainedCount = days.filter((d) => d.trained).length;
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-1 pt-1">
        {HEAD.map((h, i) => (
          <span
            key={i}
            className="text-center text-o1-label font-bold uppercase tracking-[0.12em] text-white"
          >
            {h}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((item) => {
          const isSelected = selectedDateStr === item.dateStr;
          return (
            <button
              key={item.dateStr}
              type="button"
              disabled={item.isFuture}
              aria-pressed={isSelected}
              aria-label={`${item.dayNum}${item.isToday ? ', today' : ''}${item.trained ? ', workout logged' : ''}`}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectDate(item.dateStr);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 h-10 rounded-xl border transition-colors cursor-pointer disabled:cursor-default disabled:opacity-30 ${
                isSelected
                  ? 'bg-o1-sheet border-white/[0.14]'
                  : 'bg-transparent border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <span
                className={`font-mono text-o1-body leading-none ${
                  item.trained
                    ? 'font-semibold text-o1-emerald'
                    : item.isToday
                      ? 'text-o1-crimson'
                      : 'text-o1-text'
                }`}
              >
                {item.dayNum}
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-o1-label text-o1-muted px-0.5">
        {trainedCount} workout day{trainedCount === 1 ? '' : 's'}{' '}
        <span className="text-o1-emerald">in green</span>
      </div>
    </div>
  );
};
