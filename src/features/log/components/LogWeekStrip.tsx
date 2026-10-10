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
  selectedDayMeta: {
    dayLabel: string;
    dateFormatted: string;
  };
}

export const LogWeekStrip: React.FC<LogWeekStripProps> = ({
  weekDays,
  selectedDateStr,
  onSelectDate,
  selectedDayMeta,
}) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
        {weekDays.map((item) => {
          const isSelected = selectedDateStr === item.dateStr;

          return (
            <button
              key={item.dayName}
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectDate(item.dateStr, item.dayName, item.dayNum);
              }}
              className={`flex flex-col items-center py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-white text-neutral-950 shadow-md font-bold'
                  : 'bg-o1-well border border-white/[0.07] text-neutral-300 hover:border-white/[0.14]'
              }`}
            >
              <span
                className={`text-[9px] font-mono font-semibold tracking-wider ${
                  isSelected ? 'text-neutral-600' : 'text-neutral-500'
                }`}
              >
                {item.dayName}
              </span>

              <span className="text-xs sm:text-sm font-black my-0.5">
                {item.dayNum}
              </span>

              <div className="h-2 flex items-center justify-center">
                {isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                ) : item.hasActivity ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ) : item.isToday ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Balanced bottom label row with redundant browse link removed */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1.5 pb-0.5 border-t border-white/[0.05]">
        <span className="truncate">
          Viewing: <strong className="text-white font-bold">{selectedDayMeta.dayLabel}</strong> ({selectedDayMeta.dateFormatted})
        </span>
      </div>
    </div>
  );
};

export default LogWeekStrip;
