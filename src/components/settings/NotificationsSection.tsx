import React, { useState, useEffect } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { Bell } from 'lucide-react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestBrowserNotificationPermission,
  sendChannelTestNotification,
  type NotificationPreferences,
} from '@/utils/notificationPreferences';
import { useAuthStorage } from '@/hooks/useAuthStorage';
import { triggerHaptic } from '@/utils/haptics';

interface NotificationsSectionProps {
  onOpenReminders?: () => void;
}

export function NotificationsSection({ onOpenReminders }: NotificationsSectionProps) {
  const [push, setPush] = useState<NotificationPreferences>(() => getNotificationPreferences());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const { profile, updateProfile } = useAuthStorage();

  const preWorkoutNotif = profile.pre_workout_notif !== false;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationPreferences>;
      if (customEvent.detail) {
        setPush(customEvent.detail);
      }
    };
    window.addEventListener('ofc_notification_prefs_changed', handler);
    return () => window.removeEventListener('ofc_notification_prefs_changed', handler);
  }, []);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const nextVal = !push[key];
    const updated = saveNotificationPreferences({ [key]: nextVal });
    setPush(updated);

    if (nextVal) {
      // If toggled ON, check browser permission
      const perm = await requestBrowserNotificationPermission();
      setPermissionStatus(perm);

      // Fire instant verification notification
      sendChannelTestNotification(key);
    } else {
      triggerHaptic('light');
    }
  };

  const handleEnableBrowserPush = async () => {
    triggerHaptic('medium');
    const perm = await requestBrowserNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      sendChannelTestNotification('coachUpdates');
    }
  };

  return (
    <div>
      <SectionHeader title="Notifications" />

      {/* Browser Permission Callout (if not granted) */}
      {permissionStatus !== 'granted' && (
        <div className="mb-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5 text-[#C4121A] dark:text-[#D91F28]" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Enable OS Push Alerts</p>
              <p className="text-[10.5px] text-zinc-500">Allow instant banner & sound delivery on lock screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableBrowserPush}
            className="px-3 py-1.5 rounded-xl bg-[#C4121A] text-white text-xs font-semibold hover:bg-[#9B0E14] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            Allow
          </button>
        </div>
      )}

      <SettingsGroup>
        {onOpenReminders && (
          <SettingsRow
            label="Scheduled Reminders"
            sublabel="Workout alarms, meal reminders, hydration & supplements"
            onClick={onOpenReminders}
          />
        )}

        <SettingsRow
          label="Pre-Workout Reminder"
          sublabel="Alert 1 hour before your scheduled workout session"
          rightElement={
            <ToggleSwitch
              checked={preWorkoutNotif}
              onChange={(v) => {
                triggerHaptic('light');
                updateProfile({ pre_workout_notif: v });
              }}
            />
          }
        />

        <SettingsRow
          label="Coach Updates"
          sublabel="Real-time feedback, program assignments & adjustments"
          rightElement={<ToggleSwitch checked={push.coachUpdates} onChange={() => handleToggle('coachUpdates')} />}
        />

        <SettingsRow
          label="Buddy Matches"
          sublabel="Alerts when nearby athletes match your training schedule"
          rightElement={<ToggleSwitch checked={push.buddyMatches} onChange={() => handleToggle('buddyMatches')} />}
        />

        <SettingsRow
          label="Gym Check-ins"
          sublabel="Notifications when entering a partner gym facility"
          rightElement={<ToggleSwitch checked={push.gymCheckins} onChange={() => handleToggle('gymCheckins')} />}
        />

        <SettingsRow
          label="System & Billing"
          sublabel="Account alerts, membership renewal & security updates"
          rightElement={<ToggleSwitch checked={push.systemBilling} onChange={() => handleToggle('systemBilling')} />}
        />
      </SettingsGroup>
    </div>
  );
}
