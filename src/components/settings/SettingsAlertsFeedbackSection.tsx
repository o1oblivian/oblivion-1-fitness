import React, { useState } from 'react';
import { Bell, ChevronRight, Volume2, Vibrate, ShieldCheck } from 'lucide-react';
import { CrimsonSwitch } from './CrimsonSwitch';
import { ScheduledRemindersModal } from './ScheduledRemindersModal';
import { tactileEngine } from '../../services/tactileEngine';

interface AlertsFeedbackSectionProps {
  osPushEnabled: boolean;
  preWorkoutReminder: boolean;
  coachUpdates: boolean;
  hapticVibration: boolean;
  soundEffects: boolean;
  publicTelemetry: boolean;
  onAllowPush: () => void;
  onOpenScheduledReminders: () => void;
  onTogglePreWorkout: (val: boolean) => void;
  onToggleCoachUpdates: (val: boolean) => void;
  onToggleHaptic: (val: boolean) => void;
  onToggleSound: (val: boolean) => void;
  onToggleTelemetry: (val: boolean) => void;
}

export const SettingsAlertsFeedbackSection: React.FC<AlertsFeedbackSectionProps> = ({
  osPushEnabled,
  preWorkoutReminder,
  coachUpdates,
  hapticVibration,
  soundEffects,
  publicTelemetry,
  onAllowPush,
  onOpenScheduledReminders,
  onTogglePreWorkout,
  onToggleCoachUpdates,
  onToggleHaptic,
  onToggleSound,
  onToggleTelemetry,
}) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const handlePushClick = () => {
    tactileEngine.triggerSelectionBuzz();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          onAllowPush();
          try {
            new Notification('Oblivion 1 Fitness Club', {
              body: 'Tactical telemetry and push alerts activated.',
            });
          } catch (e) {
            console.error(e);
          }
        } else {
          onAllowPush();
        }
      });
    } else {
      onAllowPush();
    }
  };

  return (
    <div className="space-y-2 select-none">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold uppercase px-1">
        Alerts, Audio &amp; Haptics
      </h3>

      <div className="bg-[#121214] rounded-2xl border border-neutral-800 shadow-sm p-4 space-y-4 text-white transition-colors">
        {/* OS Push Alerts Master Banner */}
        {!osPushEnabled ? (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-tactical font-bold uppercase text-red-400 block">
                Enable OS Push Alerts
              </span>
              <span className="text-[11px] font-sans text-neutral-400 block leading-tight">
                Instant workout reminders on your lock screen
              </span>
            </div>
            <button
              type="button"
              onClick={handlePushClick}
              className="shrink-0 px-3 py-1.5 rounded-full bg-[#C4121A] hover:bg-[#a50f16] text-white text-xs font-tactical font-semibold uppercase shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Allow
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-green-950/20 border border-green-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-tactical font-bold text-green-400">
                OS Push Alerts Active
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Lock Screen Enabled</span>
          </div>
        )}

        {/* Scheduled Reminders Navigation */}
        <div
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setIsScheduleOpen(true);
            onOpenScheduledReminders();
          }}
          className="flex items-center justify-between gap-3 cursor-pointer group py-1 hover:text-[#C4121A] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-neutral-400 group-hover:text-[#C4121A]" />
            <div className="min-w-0">
              <span className="text-xs font-tactical font-semibold text-neutral-100 group-hover:text-white block">
                Scheduled Session Reminders
              </span>
              <span className="text-[10px] text-neutral-400 font-sans block">
                Pre-workout alerts, evening recovery &amp; hydration
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
        </div>

        {/* Workout Alert Channels */}
        <div className="pt-3 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-sans font-medium text-neutral-200 block">
                Pre-Workout Reminder
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Alert 30 mins prior to planned session
              </span>
            </div>
            <CrimsonSwitch
              checked={preWorkoutReminder}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onTogglePreWorkout(val);
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs font-sans font-medium text-neutral-200 block">
                Coach Routine Updates
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Notifications when coach dispatches new routines
              </span>
            </div>
            <CrimsonSwitch
              checked={coachUpdates}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleCoachUpdates(val);
              }}
            />
          </div>
        </div>

        {/* Tactile & Audio Sensory Feedback */}
        <div className="pt-3 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Vibrate className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="text-xs font-sans font-medium text-neutral-200 block">
                  Tactile Haptic Vibration
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  Physical buzz on weight dials, timers &amp; PRs
                </span>
              </div>
            </div>
            <CrimsonSwitch
              checked={hapticVibration}
              onChange={(val) => {
                if (val) tactileEngine.triggerSelectionBuzz();
                onToggleHaptic(val);
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="text-xs font-sans font-medium text-neutral-200 block">
                  Audio Effects &amp; Chimes
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  Dial ticks, rest countdown &amp; PR celebrations
                </span>
              </div>
            </div>
            <CrimsonSwitch
              checked={soundEffects}
              onChange={(val) => {
                tactileEngine.triggerSelectionBuzz();
                onToggleSound(val);
              }}
            />
          </div>
        </div>

        {/* Telemetry Privacy */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
            <div>
              <span className="text-xs font-sans font-medium text-neutral-200 block">
                Anonymous Crash Diagnostics
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Help maintain 99.9% uptime and low-latency metrics
              </span>
            </div>
          </div>
          <CrimsonSwitch
            checked={publicTelemetry}
            onChange={(val) => {
              tactileEngine.triggerSelectionBuzz();
              onToggleTelemetry(val);
            }}
          />
        </div>
      </div>

      {/* Scheduled Reminders Modal */}
      <ScheduledRemindersModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
      />
    </div>
  );
};
