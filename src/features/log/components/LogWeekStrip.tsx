import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';

interface WeekDayItem {
  dayName: string;
  dayNum: number;
  dateStr: string;
  /** A workout is logged on this day. */
  trained: boolean;
  isToday: boolean;
}

interface LogWeekStripProps {
  weekDays: WeekDayItem[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string, dayName: string, dayNum: number) => void;
}

export const LogWeekStrip: React.FC<LogWeekStripProps> = ({
  weekDays,
  selectedDateStr,
  onSelectDate,
}) => {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pt-1">
        {weekDays.map((item) => {
          const isSelected = selectedDateStr === item.dateStr;

          return (
            <button
              key={item.dayName}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${item.dayName} ${item.dayNum}${item.isToday ? ', today' : ''}${item.trained ? ', workout logged' : ''}`}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectDate(item.dateStr, item.dayName, item.dayNum);
              }}
              className={`flex flex-col items-center gap-1 min-h-[60px] pt-2 pb-2.5 rounded-xl border transition-colors cursor-pointer active:scale-[0.97] ${
                isSelected
                  ? 'bg-o1-sheet border-white/[0.14]'
                  : 'bg-transparent border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-o1-label font-bold uppercase tracking-[0.12em] text-white">
                {item.dayName.slice(0, 3)}
              </span>
              <span
                className={`font-num text-o1-title leading-none ${
                  item.trained
                    ? 'font-semibold text-o1-emerald'
                    : `font-light ${item.isToday ? 'text-o1-crimson' : isSelected ? 'text-o1-text' : 'text-o1-text/80'}`
                }`}
              >
                {item.dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
