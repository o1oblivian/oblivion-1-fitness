import React, { useState } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { useAuthStorage } from '../../hooks/useAuthStorage';
import { triggerHaptic } from '@/utils/haptics';
import { isCloudSyncEnabled, setCloudSyncEnabled, enforceLocalOnlyStorage } from '../../utils/cloudSyncPreferences';

export function PrivacySection() {
  const { profile, updateProfile } = useAuthStorage();
  const [cloudSync, setCloudSync] = useState(() => isCloudSyncEnabled());

  const ghostMode = profile.is_ghost_mode === true;
  const crashReports = profile.crash_reports !== false;
  const gymZoneShare = profile.gym_zone_sharing !== false;
  const publicTelemetry = profile.public_telemetry !== false;

  const handleCloudSyncToggle = (val: boolean) => {
    triggerHaptic(val ? 'medium' : 'light');
    setCloudSync(val);
    if (!val) {
      enforceLocalOnlyStorage();
    } else {
      setCloudSyncEnabled(true);
    }
  };

  const handleGhostMode = (val: boolean) => {
    triggerHaptic(val ? 'medium' : 'light');
    updateProfile({ is_ghost_mode: val });
  };

  const handleCrashReports = (val: boolean) => {
    triggerHaptic('light');
    updateProfile({ crash_reports: val });
  };

  const handleGymZone = (val: boolean) => {
    triggerHaptic('light');
    updateProfile({ gym_zone_sharing: val });
  };

  const handleTelemetry = (val: boolean) => {
    triggerHaptic('light');
    updateProfile({ public_telemetry: val });
  };

  return (
    <div>
      <SectionHeader title="Privacy & Social Visibility" />
      <SettingsGroup>
        <SettingsRow
          label="Outbound Cloud Sync"
          sublabel={cloudSync 
            ? "Backing up workouts & nutrition to cloud database across devices" 
            : "100% Local-Only Mode active: Zero data leaves your physical device"}
          rightElement={<ToggleSwitch checked={cloudSync} onChange={handleCloudSyncToggle} />}
        />

        <SettingsRow
          label="Ghost Mode"
          sublabel="Hide from radar entirely. Browse and train in stealth."
          rightElement={<ToggleSwitch checked={ghostMode} onChange={handleGhostMode} />}
        />

        <SettingsRow
          label="Crash & Diagnostics"
          sublabel="Share anonymous performance data to improve stability"
          rightElement={<ToggleSwitch checked={crashReports} onChange={handleCrashReports} />}
        />

        <SettingsRow
          label="Gym Zone Sharing & Radar"
          sublabel="Broadcast name & distance to verified athletes on Buddy Radar"
          rightElement={<ToggleSwitch checked={gymZoneShare} onChange={handleGymZone} />}
        />

        <SettingsRow
          label="Public Telemetry"
          sublabel="Display workout streak and PR volume on your public profile"
          rightElement={<ToggleSwitch checked={publicTelemetry} onChange={handleTelemetry} />}
        />
      </SettingsGroup>
    </div>
  );
}

