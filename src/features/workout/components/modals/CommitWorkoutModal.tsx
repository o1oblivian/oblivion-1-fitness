import React, { useState } from 'react';
import { CheckCircle2, BookmarkPlus, X, Flame, Calendar, AlertCircle } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { getSystemTodayCode } from '../../services/dayRoutineService';

interface CommitWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterLog: () => void;
  onSaveRoutineToDay: (selectedDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun') => void;
  totalKg: number;
  totalSets: number;
  totalReps: number;
  currentActiveDay?: string;
}

const DAYS: Array<{ key: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'; label: string }> = [
  { key: 'Mon', label: 'Mon' },
  { key: 'Tue', label: 'Tue' },
  { key: 'Wed', label: 'Wed' },
  { key: 'Thu', label: 'Thu' },
  { key: 'Fri', label: 'Fri' },
  { key: 'Sat', label: 'Sat' },
  { key: 'Sun', label: 'Sun' },
];

export const CommitWorkoutModal: React.FC<CommitWorkoutModalProps> = ({
  isOpen,
  onClose,
  onRegisterLog,
  onSaveRoutineToDay,
  totalKg,
  totalSets,
  totalReps,
  currentActiveDay,
}) => {
  const systemToday = getSystemTodayCode();
  const [selectedDayToAssign, setSelectedDayToAssign] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>(
    (currentActiveDay as any) || systemToday
  );
  const [showDaySelector, setShowDaySelector] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-o1-card text-neutral-100 rounded-2xl border border-white/[0.07] shadow-2xl max-w-sm w-full p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-o1-crimson/20 text-o1-crimson flex items-center justify-center border border-o1-crimson/40">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tactical font-black text-sm text-neutral-100 tracking-wide">
                Commit Workout
              </h3>
              <span className="text-[10px] font-mono text-neutral-400 block">Session Summary Audit</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black rounded-2xl p-2.5 border border-white/[0.07]">
            <span className="text-[9px] font-mono text-neutral-400 font-bold block">Volume</span>
            <span className="font-mono font-black text-sm text-neutral-100">{totalKg.toLocaleString()} kg</span>
          </div>
          <div className="bg-black rounded-2xl p-2.5 border border-white/[0.07]">
            <span className="text-[9px] font-mono text-neutral-400 font-bold block">Sets</span>
            <span className="font-mono font-black text-sm text-neutral-100">{totalSets}</span>
          </div>
          <div className="bg-black rounded-2xl p-2.5 border border-white/[0.07]">
            <span className="text-[9px] font-mono text-neutral-400 font-bold block">Reps</span>
            <span className="font-mono font-black text-sm text-neutral-100">{totalReps}</span>
          </div>
        </div>

        {/* Option 2 Expandable Day Assignment Drawer */}
        {showDaySelector ? (
          <div className="p-3 rounded-2xl bg-o1-well border border-o1-crimson/40 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-tactical font-bold text-white">
              <span className="flex items-center gap-1.5 text-o1-crimson">
                <Calendar className="w-3.5 h-3.5" />
                <span>Assign to Recurring Day:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDaySelector(false)}
                className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => {
                const isSelected = selectedDayToAssign === d.key;
                const isToday = d.key === systemToday;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setSelectedDayToAssign(d.key);
                    }}
                    className={`py-2 rounded-xl text-center font-mono text-[11px] font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-o1-crimson text-white border-red-500 shadow-sm'
                        : isToday
                        ? 'bg-white/[0.08] text-white border-white/[0.07]'
                        : 'bg-black text-neutral-400 border-white/[0.07] hover:text-white'
                    }`}
                  >
                    <span>{d.label}</span>
                    {isToday && <span className="block text-[7px] text-amber-400 leading-none mt-0.5">Today</span>}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] font-mono text-neutral-400 leading-tight">
              From next week onward, clicking <strong>{selectedDayToAssign}</strong> on your OLED will load this exact workout!
            </p>

            <button
              type="button"
              onClick={() => {
                tactileEngine.playPRCelebration();
                onSaveRoutineToDay(selectedDayToAssign);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.98] text-white font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Confirm &amp; Save for {selectedDayToAssign}</span>
            </button>
          </div>
        ) : (
          <p className="text-xs font-mono text-neutral-400 text-center">
            Choose whether to just log this session or save it as your weekly repeating routine for a specific day.
          </p>
        )}

        {/* Action CTAs */}
        {!showDaySelector && (
          <div className="space-y-2 pt-1">
            {/* Primary Action 1: Just Log Session */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.playPRCelebration();
                onRegisterLog();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:opacity-90 active:scale-[0.98] text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish &amp; Register Session Log</span>
            </button>

            {/* Action 2: Save to Particular Day */}
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setShowDaySelector(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-o1-well hover:bg-white/[0.06] active:scale-[0.98] text-white font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-xs border border-white/[0.07] transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-amber-400" />
              <span>Save &amp; Assign to Repeating Day</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
