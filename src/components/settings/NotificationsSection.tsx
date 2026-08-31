import React, { useState } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';

interface NotifChannelState {
  coachUpdates: boolean;
  buddyMatches: boolean;
  gymCheckins: boolean;
  systemBilling: boolean;
}

interface NotificationsSectionProps {
  onOpenReminders?: () => void;
}

export function NotificationsSection({ onOpenReminders }: NotificationsSectionProps) {
  const [push, setPush] = useState<NotifChannelState>({
    coachUpdates: true,
    buddyMatches: true,
    gymCheckins: true,
    systemBilling: false,
  });

  const toggle = (key: keyof NotifChannelState) => {
    setPush((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <SectionHeader title="Notifications" />
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
          rightElement={<ToggleSwitch checked={push.coachUpdates} onChange={() => toggle('coachUpdates')} />}
        />

        <SettingsRow
          label="Buddy Matches"
          sublabel="Alerts when nearby athletes match your training schedule"
          rightElement={<ToggleSwitch checked={push.buddyMatches} onChange={() => toggle('buddyMatches')} />}
        />

        <SettingsRow
          label="Gym Check-ins"
          sublabel="Notifications when entering a partner gym facility"
          rightElement={<ToggleSwitch checked={push.gymCheckins} onChange={() => toggle('gymCheckins')} />}
        />

        <SettingsRow
          label="System & Billing"
          sublabel="Account alerts, membership renewal & security updates"
          rightElement={<ToggleSwitch checked={push.systemBilling} onChange={() => toggle('systemBilling')} />}
        />
      </SettingsGroup>
    </div>
  );
}
