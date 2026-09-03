import React, { useState } from 'react';
import { X, Calendar, Sparkles, Award } from 'lucide-react';

interface CommitSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToDay: (day: string) => void;
  onSaveStandalone: () => void;
  exerciseCount?: number;
  totalVolume?: number;
  totalSets?: number;
}

const DAYS_OF_WEEK = [
  { key: 'Monday', short: 'Mon' },
  { key: 'Tuesday', short: 'Tue' },
  { key: 'Wednesday', short: 'Wed' },
  { key: 'Thursday', short: 'Thu' },
  { key: 'Friday', short: 'Fri' },
  { key: 'Saturday', short: 'Sat' },
  { key: 'Sunday', short: 'Sun' },
];

export const CommitSaveModal: React.FC<CommitSaveModalProps> = ({
  isOpen,
  onClose,
  onSaveToDay,
  onSaveStandalone,
  exerciseCount = 4,
  totalVolume = 0,
  totalSets = 12,
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-2xl text-gray-900 dark:text-white space-y-4 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Commit Workout</h3>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono">
                {exerciseCount} Exercises &bull; {totalSets} Sets {totalVolume > 0 && `\u2022 ${totalVolume.toLocaleString()}kg`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary 1-Tap Log Action */}
        <button
          onClick={() => {
            onSaveStandalone();
            onClose();
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-[#C4121A] hover:bg-[#D91F28] active:scale-[0.98] text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-current text-white" />
          <span>Finish &amp; Register Session Log</span>
        </button>

        {/* Quick Assign to Routine Day */}
        <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-red-500" />
              <span>Or Save Routine to Day:</span>
            </span>
            {selectedDay && (
              <span className="text-red-500 font-bold">{selectedDay} Selected</span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.key}
                onClick={() => {
                  setSelectedDay(d.key);
                  onSaveToDay(d.key);
                  onClose();
                }}
                className={`py-2 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
                  selectedDay === d.key
                    ? 'bg-[#C4121A] text-white shadow-md'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 border border-black/5 dark:border-white/5'
                }`}
              >
                <span>{d.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
