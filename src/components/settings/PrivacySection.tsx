import React from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { useAuthStorage } from '../../hooks/useAuthStorage';
import { triggerHaptic } from '@/utils/haptics';

export function PrivacySection() {
  const { profile, updateProfile } = useAuthStorage();

  const ghostMode = profile.is_ghost_mode === true;
  const crashReports = profile.crash_reports !== false;
  const buddyRadarDiscovery = profile.gym_zone_sharing !== false && profile.buddy_match_enabled !== false;
  const publicTelemetry = profile.public_telemetry !== false;

  const handleGhostMode = (val: boolean) => {
    triggerHaptic(val ? 'medium' : 'light');
    updateProfile({ is_ghost_mode: val });
  };

  const handleCrashReports = (val: boolean) => {
    triggerHaptic('light');
    updateProfile({ crash_reports: val });
  };

  const handleBuddyRadar = (val: boolean) => {
    triggerHaptic('light');
    updateProfile({
      gym_zone_sharing: val,
      buddy_match_enabled: val,
    });
  };

  const handleTelemetry = (val: boolean) => {
    triggerHaptic('light');
    updateProfile({
      public_telemetry: val,
      private_training: !val,
    });
  };

  return (
    <div>
      <SectionHeader title="Privacy & Social Visibility" />
      <SettingsGroup>
        <SettingsRow
          label="Buddy Radar Discovery"
          sublabel="Allow nearby athletes to discover your profile and match training times"
          rightElement={<ToggleSwitch checked={buddyRadarDiscovery} onChange={handleBuddyRadar} />}
        />

        <SettingsRow
          label="Ghost Mode"
          sublabel="Hide from radar entirely. Browse and train in stealth."
          rightElement={<ToggleSwitch checked={ghostMode} onChange={handleGhostMode} />}
        />

        <SettingsRow
          label="Public Telemetry & Leaderboard"
          sublabel="Display workout streak and PR volume on public athlete leaderboards"
          rightElement={<ToggleSwitch checked={publicTelemetry} onChange={handleTelemetry} />}
        />

        <SettingsRow
          label="Crash Reports & Diagnostics"
          sublabel="Share anonymous performance data to improve stability"
          rightElement={<ToggleSwitch checked={crashReports} onChange={handleCrashReports} />}
        />
      </SettingsGroup>
    </div>
  );
}

