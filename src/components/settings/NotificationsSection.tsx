import React, { useState, useEffect } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { Bell, Check, Send, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestBrowserNotificationPermission,
  sendChannelTestNotification,
  type NotificationPreferences,
} from '@/utils/notificationPreferences';
import { triggerHaptic } from '@/utils/haptics';

interface NotificationsSectionProps {
  onOpenReminders?: () => void;
}

export function NotificationsSection({ onOpenReminders }: NotificationsSectionProps) {
  const [push, setPush] = useState<NotificationPreferences>(() => getNotificationPreferences());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

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

  const handleTestNotification = async (key: keyof NotificationPreferences) => {
    setTestingChannel(key);
    const perm = await requestBrowserNotificationPermission();
    setPermissionStatus(perm);

    // If channel is currently off, temporarily enable it to deliver the test
    if (!push[key]) {
      const updated = saveNotificationPreferences({ [key]: true });
      setPush(updated);
    }

    sendChannelTestNotification(key);
    setTimeout(() => setTestingChannel(null), 1000);
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
      <div className="flex items-center justify-between mb-2">
        <SectionHeader title="Notifications" />
        <button
          type="button"
          onClick={() => handleTestNotification('coachUpdates')}
          className="text-[11px] font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 active:scale-95 transition-all cursor-pointer"
          title="Send immediate test push notification"
        >
          <Send className="w-3 h-3" />
          Test Alert
        </button>
      </div>

      {/* Browser Permission Callout (if not granted) */}
      {permissionStatus !== 'granted' && (
        <div className="mb-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">Enable OS Push Alerts</p>
              <p className="text-[10.5px] text-zinc-500">Allow instant banner & sound delivery on lock screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableBrowserPush}
            className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all cursor-pointer shrink-0"
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
          label="Coach Updates"
          sublabel="Real-time feedback, program assignments & adjustments"
          rightElement={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestNotification('coachUpdates')}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                title="Send test alert for Coach Updates"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <ToggleSwitch checked={push.coachUpdates} onChange={() => handleToggle('coachUpdates')} />
            </div>
          }
        />

        <SettingsRow
          label="Buddy Matches"
          sublabel="Alerts when nearby athletes match your training schedule"
          rightElement={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestNotification('buddyMatches')}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                title="Send test alert for Buddy Matches"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <ToggleSwitch checked={push.buddyMatches} onChange={() => handleToggle('buddyMatches')} />
            </div>
          }
        />

        <SettingsRow
          label="Gym Check-ins"
          sublabel="Notifications when entering a partner gym facility"
          rightElement={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestNotification('gymCheckins')}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                title="Send test alert for Gym Check-ins"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <ToggleSwitch checked={push.gymCheckins} onChange={() => handleToggle('gymCheckins')} />
            </div>
          }
        />

        <SettingsRow
          label="System & Billing"
          sublabel="Account alerts, membership renewal & security updates"
          rightElement={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestNotification('systemBilling')}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                title="Send test alert for System & Billing"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <ToggleSwitch checked={push.systemBilling} onChange={() => handleToggle('systemBilling')} />
            </div>
          }
        />
      </SettingsGroup>
    </div>
  );
}
