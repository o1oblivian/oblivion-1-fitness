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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#0A0A0C] animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#14171F] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-3xl p-4 shadow-2xl text-gray-900 dark:text-white space-y-3.5 relative overflow-hidden"
      >
        {/* Subtle Accent Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-zinc-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-500/20 text-stone-400 flex items-center justify-center border border-stone-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">Commit Workout</h3>
              <p className="text-[10px] text-gray-400 font-mono">
                {exerciseCount} Exercises &bull; {totalSets} Sets {totalVolume > 0 && `\u2022 ${totalVolume.toLocaleString()}kg`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
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
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 hover:from-stone-300 hover:to-stone-300 text-black font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-current text-black" />
          <span>Finish &amp; Register Session Log</span>
        </button>

        {/* Quick Assign to Routine Day */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>Or Save Routine to Day:</span>
            </span>
            {selectedDay && (
              <span className="text-stone-400 font-bold">{selectedDay} Selected</span>
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
                className={`py-2 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-90 flex flex-col items-center justify-center ${
                  selectedDay === d.key
                    ? 'bg-zinc-500 text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/15 text-gray-300 border border-white/5'
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
