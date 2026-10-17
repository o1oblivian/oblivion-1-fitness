import React, { useEffect, useState } from 'react';
import { X, Bell, Check } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';
import { CrimsonSwitch } from './CrimsonSwitch';
import {
  HYDRATION_END_HOUR,
  HYDRATION_START_HOUR,
  PRE_WORKOUT_LEAD_MIN,
  REMINDER_DAYS,
  readReminderConfig,
  saveReminderConfig,
  type ReminderConfig,
} from '../../services/athleteReminderScheduler';

interface ScheduledRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  /** Explains why nothing will fire yet, e.g. notifications not allowed. */
  blockedReason?: string | null;
  preWorkoutOn: boolean;
}

const INPUT =
  'bg-black border border-white/[0.07] rounded-xl px-2.5 min-h-[44px] text-xs font-mono text-white focus:outline-none focus:border-o1-crimson disabled:opacity-40';

export const ScheduledRemindersModal: React.FC<ScheduledRemindersModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  blockedReason,
  preWorkoutOn,
}) => {
  const [config, setConfig] = useState<ReminderConfig>(readReminderConfig);

  useEffect(() => {
    if (isOpen) setConfig(readReminderConfig());
  }, [isOpen]);

  if (!isOpen) return null;

  const patch = (next: Partial<ReminderConfig>) => setConfig((prev) => ({ ...prev, ...next }));

  const toggleDay = (day: string) => {
    tactileEngine.triggerSelectionBuzz();
    patch({
      selectedDays: config.selectedDays.includes(day)
        ? config.selectedDays.filter((d) => d !== day)
        : REMINDER_DAYS.filter((d) => d === day || config.selectedDays.includes(d)),
    });
  };

  const handleSave = () => {
    tactileEngine.triggerSelectionBuzz();
    saveReminderConfig(config);
    onShowToast?.(blockedReason ? 'Reminder times saved.' : 'Reminders updated.');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scheduled reminders"
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="o1-sheet-card bg-black border border-white/[0.07] w-full p-5 shadow-xl relative space-y-4 overflow-y-auto text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center justify-center text-o1-crimson">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tactical font-bold text-sm text-neutral-100 tracking-wider">
                Scheduled Reminders
              </h3>
              <span className="text-[11px] text-neutral-400 block">
                Set on this phone. Nothing is sent anywhere.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-2 rounded-full text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {blockedReason ? (
          <p
            role="status"
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300"
          >
            {blockedReason}
          </p>
        ) : null}

        <div className="space-y-2 bg-o1-well border border-white/[0.07] rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-tactical font-bold text-white block">
                Training time
              </span>
              <span className="text-[11px] text-neutral-400 block">
                {preWorkoutOn
                  ? `Reminder ${PRE_WORKOUT_LEAD_MIN} min before`
                  : 'Pre-workout reminder is off in Settings'}
              </span>
            </div>
            <input
              type="time"
              aria-label="Training time"
              value={config.workoutTime}
              disabled={!preWorkoutOn}
              onChange={(e) => e.target.value && patch({ workoutTime: e.target.value })}
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Training days">
            {REMINDER_DAYS.map((day) => {
              const active = config.selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={active}
                  aria-label={day}
                  disabled={!preWorkoutOn}
                  onClick={() => toggleDay(day)}
                  className={`min-h-[44px] rounded-xl text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-40 ${
                    active
                      ? 'bg-o1-crimson text-white'
                      : 'bg-black text-neutral-400 border border-white/[0.07]'
                  }`}
                >
                  {day.slice(0, 2)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-o1-well border border-white/[0.07] rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-tactical font-bold text-white block">
              Recovery check-in
            </span>
            <span className="text-[11px] text-neutral-400 block">
              Every evening: log sleep and how you feel
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="time"
              aria-label="Recovery check-in time"
              value={config.recoveryTime}
              disabled={!config.recoveryOn}
              onChange={(e) => e.target.value && patch({ recoveryTime: e.target.value })}
              className={INPUT}
            />
            <CrimsonSwitch
              label="Recovery check-in"
              checked={config.recoveryOn}
              onChange={(recoveryOn) => patch({ recoveryOn })}
            />
          </div>
        </div>

        <div className="bg-o1-well border border-white/[0.07] rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-tactical font-bold text-white block">Drink water</span>
            <span className="text-[11px] text-neutral-400 block">
              {HYDRATION_START_HOUR}am to {HYDRATION_END_HOUR - 12}pm
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Water reminder frequency"
              value={config.hydrationHours}
              disabled={!config.hydrationOn}
              onChange={(e) => patch({ hydrationHours: Number(e.target.value) })}
              className={INPUT}
            >
              <option value={1}>Every 1 hr</option>
              <option value={2}>Every 2 hrs</option>
              <option value={3}>Every 3 hrs</option>
              <option value={4}>Every 4 hrs</option>
            </select>
            <CrimsonSwitch
              label="Water reminders"
              checked={config.hydrationOn}
              onChange={(hydrationOn) => patch({ hydrationOn })}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save Reminders</span>
        </button>
      </div>
    </div>
  );
};
