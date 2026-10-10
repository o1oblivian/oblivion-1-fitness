import React, { useState, useEffect } from 'react';
import { X, Bell, Check } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface ScheduledRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const REMINDERS_KEY = 'o1fc_scheduled_reminders_v1';

export const ScheduledRemindersModal: React.FC<ScheduledRemindersModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [workoutTime, setWorkoutTime] = useState('06:30');
  const [recoveryTime, setRecoveryTime] = useState('21:00');
  const [hydrationHours, setHydrationHours] = useState('2');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(REMINDERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.workoutTime) setWorkoutTime(parsed.workoutTime);
        if (parsed.recoveryTime) setRecoveryTime(parsed.recoveryTime);
        if (parsed.hydrationHours) setHydrationHours(parsed.hydrationHours);
        if (parsed.selectedDays) setSelectedDays(parsed.selectedDays);
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    tactileEngine.triggerSelectionBuzz();
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    tactileEngine.triggerSelectionBuzz();
    const config = {
      workoutTime,
      recoveryTime,
      hydrationHours,
      selectedDays,
    };
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
    onShowToast?.(`Scheduled alerts updated: ${workoutTime} on ${selectedDays.length} days`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="o1-sheet-card bg-black border border-white/[0.07] w-full p-5 shadow-xl relative space-y-4 overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-o1-crimson">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tactical font-bold text-sm text-neutral-100 tracking-wider">
                Scheduled Reminders
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono block">
                Session Cadence &amp; Recovery Alerts
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Days selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-tactical font-bold text-neutral-400 block tracking-wider">
            Active Training Days
          </span>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-o1-crimson text-white'
                      : 'bg-o1-well text-neutral-400 hover:bg-white/[0.06] border border-white/[0.07]'
                  }`}
                >
                  {day.slice(0, 2)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time settings */}
        <div className="space-y-3 pt-1">
          <div className="bg-o1-well border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-tactical font-bold text-white block">Pre-Workout Call</span>
              <span className="text-[10px] text-neutral-400 block">30m prior to training</span>
            </div>
            <input
              type="time"
              value={workoutTime}
              onChange={(e) => setWorkoutTime(e.target.value)}
              className="bg-black border border-white/[0.07] rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-o1-crimson"
            />
          </div>

          <div className="bg-o1-well border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-tactical font-bold text-white block">Recovery Check-in</span>
              <span className="text-[10px] text-neutral-400 block">Post-workout HRV &amp; sleep cue</span>
            </div>
            <input
              type="time"
              value={recoveryTime}
              onChange={(e) => setRecoveryTime(e.target.value)}
              className="bg-black border border-white/[0.07] rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-o1-crimson"
            />
          </div>

          <div className="bg-o1-well border border-white/[0.07] rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-tactical font-bold text-white block">Hydration Interval</span>
              <span className="text-[10px] text-neutral-400 block">Drink reminder frequency</span>
            </div>
            <select
              value={hydrationHours}
              onChange={(e) => setHydrationHours(e.target.value)}
              className="bg-black border border-white/[0.07] rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-o1-crimson"
            >
              <option value="1">Every 1 hr</option>
              <option value="2">Every 2 hrs</option>
              <option value="3">Every 3 hrs</option>
              <option value="4">Every 4 hrs</option>
            </select>
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save Alert Schedule</span>
        </button>
      </div>
    </div>
  );
};
