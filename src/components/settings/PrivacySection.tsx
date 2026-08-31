import React, { useState, useEffect } from 'react';
import { SectionHeader, SettingsGroup, SettingsRow, ToggleSwitch } from './SettingsShared';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

export function PrivacySection() {
  const [crashReports, setCrashReports] = useState(true);
  const [gymZoneShare, setGymZoneShare] = useState(true);
  const [publicTelemetry, setPublicTelemetry] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const email = sess?.session?.user?.email;
      if (!email) return;
      const { data } = await supabase
        .from('profiles')
        .select('gym_zone_sharing, public_telemetry, is_ghost_mode')
        .eq('user_email', email)
        .maybeSingle();
      if (data) {
        setGymZoneShare(data.gym_zone_sharing ?? true);
        setPublicTelemetry(data.public_telemetry ?? false);
        setGhostMode(data.is_ghost_mode ?? false);
      }
    })();
  }, []);

  const persistToggle = async (field: string, value: boolean) => {
    if (!isSupabaseConfigured()) return;
    const { data: sess } = await supabase.auth.getSession();
    const email = sess?.session?.user?.email;
    if (!email) return;
    await supabase.from('profiles').update({ [field]: value }).eq('user_email', email);
  };

  const handleGhostMode = (val: boolean) => {
    setGhostMode(val);
    if (val) { setGymZoneShare(false); persistToggle('gym_zone_sharing', false); }
    persistToggle('is_ghost_mode', val);
  };

  const handleGymZone = (val: boolean) => {
    if (ghostMode && val) { setGhostMode(false); persistToggle('is_ghost_mode', false); }
    setGymZoneShare(val);
    persistToggle('gym_zone_sharing', val);
  };

  const handleTelemetry = (val: boolean) => {
    setPublicTelemetry(val);
    persistToggle('public_telemetry', val);
  };

  return (
    <div>
      <SectionHeader title="Privacy & Social Visibility" />
      <SettingsGroup>
        <SettingsRow
          label="Ghost Mode"
          sublabel="Hide from radar entirely. Browse and train in stealth."
          rightElement={<ToggleSwitch checked={ghostMode} onChange={handleGhostMode} />}
        />

        <SettingsRow
          label="Crash & Diagnostics"
          sublabel="Share anonymous performance data to improve stability"
          rightElement={<ToggleSwitch checked={crashReports} onChange={setCrashReports} />}
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
