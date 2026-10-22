import React, { useEffect, useState } from 'react';
import { Bell, ChevronRight, Volume2, Vibrate, ShieldCheck } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { ScheduledRemindersModal } from './ScheduledRemindersModal';
import { tactileEngine } from '../../services/tactileEngine';
import {
  reminderPermission,
  type ReminderPermission,
} from '../../services/athleteReminderScheduler';

interface AlertsFeedbackSectionProps {
  osPushEnabled: boolean;
  preWorkoutReminder: boolean;
  coachUpdates: boolean;
  hapticVibration: boolean;
  soundEffects: boolean;
  crashReports: boolean;
  onSetRemindersEnabled: (val: boolean) => void;
  onTogglePreWorkout: (val: boolean) => void;
  onToggleCoachUpdates: (val: boolean) => void;
  onToggleHaptic: (val: boolean) => void;
  onToggleSound: (val: boolean) => void;
  onToggleCrashReports: (val: boolean) => void;
  onShowToast?: (msg: string) => void;
}

const BLOCKED_COPY =
  "Notifications are blocked for this app. Turn them on in your phone's settings.";
const UNSUPPORTED_COPY = "This device can't show reminders.";

export const SettingsAlertsFeedbackSection: React.FC<AlertsFeedbackSectionProps> = ({
  osPushEnabled,
  preWorkoutReminder,
  coachUpdates,
  hapticVibration,
  soundEffects,
  crashReports,
  onSetRemindersEnabled,
  onTogglePreWorkout,
  onToggleCoachUpdates,
  onToggleHaptic,
  onToggleSound,
  onToggleCrashReports,
  onShowToast,
}) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let live = true;
    void reminderPermission(false).then((state) => {
      if (live) setPermission(state);
    });
    return () => {
      live = false;
    };
  }, []);

  const remindersOn = osPushEnabled && permission === 'granted';
  const blockedReason = remindersOn
    ? null
    : permission === 'denied'
      ? BLOCKED_COPY
      : permission === 'unsupported'
        ? UNSUPPORTED_COPY
        : 'Reminders are off. Tap Enable in Settings to get these on your lock screen.';

  const handleEnable = async () => {
    tactileEngine.triggerSelectionBuzz();
    setAsking(true);
    const state = await reminderPermission(true);
    setAsking(false);
    setPermission(state);
    if (state === 'granted') {
      onSetRemindersEnabled(true);
      onShowToast?.('Reminders on.');
    } else {
      onShowToast?.(state === 'unsupported' ? UNSUPPORTED_COPY : BLOCKED_COPY);
    }
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-o1-muted font-bold px-1">
        Alerts, Audio &amp; Haptics
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-sm p-3 space-y-2.5 text-white transition-colors">
        {!remindersOn ? (
          <div className="bg-o1-well border border-white/[0.07] rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-sans font-semibold text-white block">
                  Allow reminders
                </span>
                <span className="text-o1-label font-sans text-o1-muted block leading-tight">
                  {permission === 'denied'
                    ? BLOCKED_COPY
                    : 'Workout and recovery reminders on your lock screen'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleEnable()}
              disabled={asking || permission === 'unsupported'}
              className="o1-pill min-h-[44px] bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-sans font-semibold active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {asking ? 'Asking…' : 'Enable'}
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-o1-ok" />
              <span className="text-xs font-sans font-semibold text-white">Reminders on</span>
            </div>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSetRemindersEnabled(false);
                onShowToast?.('Reminders off.');
              }}
              className="o1-pill min-h-[44px] bg-black border border-white/[0.07] text-o1-stone hover:text-white text-xs font-sans font-semibold cursor-pointer active:scale-95"
            >
              Turn off
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsScheduleOpen(true);
          }}
          className="w-full min-h-[44px] flex items-center justify-between gap-3 cursor-pointer group text-left"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-o1-muted group-hover:text-o1-crimson" />
            <div className="min-w-0">
              <span className="text-xs font-tactical font-semibold text-o1-bone group-hover:text-white block">
                Scheduled Session Reminders
              </span>
              <span className="text-o1-label text-o1-muted font-sans block">
                Pre-workout, evening recovery &amp; water
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-o1-muted group-hover:text-white shrink-0" />
        </button>

        <div className="pt-3 border-t border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-sans font-medium text-o1-ink-soft block">
                Pre-Workout Reminder
              </span>
              <span className="text-o1-label text-o1-muted block">
                30 minutes before your training time
              </span>
            </div>
            <CrimsonSwitch
              label="Pre-workout reminder"
              checked={preWorkoutReminder}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onTogglePreWorkout(val);
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs font-sans font-medium text-o1-ink-soft block">
                Coach Routine Updates
              </span>
              <span className="text-o1-label text-o1-muted block">
                Show a note in the app when your coach sends a routine
              </span>
            </div>
            <CrimsonSwitch
              label="Coach routine updates"
              checked={coachUpdates}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleCoachUpdates(val);
              }}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-o1-muted" />
              <div>
                <span className="text-xs font-sans font-medium text-o1-ink-soft block">
                  Tactile Haptic Vibration
                </span>
                <span className="text-o1-label text-o1-muted block">
                  Physical buzz on weight dials, timers &amp; PRs
                </span>
              </div>
            </div>
            <CrimsonSwitch
              label="Haptic vibration"
              checked={hapticVibration}
              onChange={(val) => {
                onToggleHaptic(val);
                if (val) tactileEngine.triggerSelectionBuzz();
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-o1-muted" />
              <div>
                <span className="text-xs font-sans font-medium text-o1-ink-soft block">
                  Audio Effects &amp; Chimes
                </span>
                <span className="text-o1-label text-o1-muted block">
                  Dial ticks, rest countdown &amp; PR celebrations
                </span>
              </div>
            </div>
            <CrimsonSwitch
              label="Audio effects"
              checked={soundEffects}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleSound(val);
              }}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-o1-muted" />
            <div>
              <span className="text-xs font-sans font-medium text-o1-ink-soft block">
                On-device crash log
              </span>
              <span className="text-o1-label text-o1-muted block">
                Store the last render crash on this device. Nothing is sent remotely.
              </span>
            </div>
          </div>
          <CrimsonSwitch
            label="On-device crash log"
            checked={crashReports}
            onChange={(val) => {
              tactileEngine.triggerSelectionBuzz();
              onToggleCrashReports(val);
            }}
          />
        </div>
      </div>

      <ScheduledRemindersModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onShowToast={onShowToast}
        blockedReason={blockedReason}
        preWorkoutOn={preWorkoutReminder}
      />
    </div>
  );
};
