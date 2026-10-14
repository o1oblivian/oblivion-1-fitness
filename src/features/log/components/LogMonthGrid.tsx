import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface MonthDayItem {
  dayNum: number;
  dateStr: string;
  isToday: boolean;
  isFuture: boolean;
  trained: boolean;
  hasActivity: boolean;
}

interface LogMonthGridProps {
  /** Blank cells before day 1 so the grid starts on Monday. */
  leading: number;
  days: MonthDayItem[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

const HEAD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const LogMonthGrid: React.FC<LogMonthGridProps> = ({ leading, days, selectedDateStr, onSelectDate }) => {
  const trainedCount = days.filter((d) => d.trained).length;
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-7 gap-1 pt-1">
        {HEAD.map((h, i) => (
          <span key={i} className="text-center text-[10px] uppercase tracking-[0.12em] text-o1-muted">{h}</span>
        ))}
        {Array.from({ length: leading }, (_, i) => <span key={`pad-${i}`} />)}
        {days.map((item) => {
          const isSelected = selectedDateStr === item.dateStr;
          return (
            <button
              key={item.dateStr}
              type="button"
              disabled={item.isFuture}
              aria-pressed={isSelected}
              aria-label={`${item.dayNum}${item.isToday ? ', today' : ''}${item.trained ? ', trained' : item.hasActivity ? ', logged' : ''}`}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectDate(item.dateStr);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 h-10 rounded-xl border transition-colors cursor-pointer disabled:cursor-default disabled:opacity-30 ${
                isSelected ? 'bg-o1-sheet border-white/[0.14]' : 'bg-transparent border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <span className={`font-mono text-[13px] leading-none ${item.isToday ? 'text-[#C4121A]' : 'text-o1-text'}`}>
                {item.dayNum}
              </span>
              <span
                className={`w-1 h-1 rounded-full ${item.trained ? 'bg-[#C4121A]' : item.hasActivity ? 'bg-[#10b981]' : 'bg-transparent'}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-o1-muted px-0.5">
        <span>{trainedCount} workout day{trainedCount === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#C4121A]" />Workout</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />Other</span>
        </span>
      </div>
    </div>
  );
};

export default LogMonthGrid;
