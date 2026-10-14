import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface WeekDayItem {
  dayName: string;
  dayNum: number;
  dateStr: string;
  hasActivity: boolean;
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
              aria-label={`${item.dayName} ${item.dayNum}${item.isToday ? ', today' : ''}${item.hasActivity ? ', logged' : ''}`}
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
              <span className={`text-[10px] uppercase tracking-[0.12em] ${isSelected ? 'text-white' : 'text-o1-muted'}`}>
                {item.dayName.slice(0, 3)}
              </span>
              <span
                className={`font-mono text-[17px] leading-none font-light ${
                  item.isToday ? 'text-[#C4121A]' : isSelected ? 'text-o1-text' : 'text-o1-text/80'
                }`}
              >
                {item.dayNum}
              </span>
              <span
                className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : item.hasActivity ? 'bg-[#10b981]' : 'bg-transparent'}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LogWeekStrip;
