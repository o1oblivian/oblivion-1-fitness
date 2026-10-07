import { O1_SETTINGS_KEY, InputStyleType, WeightUnit } from '../hooks/useAthleteSettings';
import { safeStorage } from './safeStorage';

export interface AthleteSettingsSnapshot {
  inputStyle: InputStyleType;
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  defaultBarbellKg: number;
  autoDispatch: boolean;
  restRecoveryMode: boolean;
  eliteReelsPresence: boolean;
  preWorkoutReminder: boolean;
  coachUpdates: boolean;
  hapticVibration: boolean;
  soundEffects: boolean;
  crashReports: boolean;
  osPushEnabled: boolean;
  ghostMode: boolean;
  buddyRadarDiscovery: boolean;
}

const DEFAULTS: AthleteSettingsSnapshot = {
  inputStyle: 'Rotary Dial',
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  defaultBarbellKg: 20,
  autoDispatch: true,
  restRecoveryMode: false,
  eliteReelsPresence: true,
  preWorkoutReminder: true,
  coachUpdates: true,
  hapticVibration: true,
  soundEffects: true,
  crashReports: true,
  osPushEnabled: false,
  ghostMode: false,
  buddyRadarDiscovery: true,
};

export function readAthleteSettingsSnapshot(): AthleteSettingsSnapshot {
  const cached = safeStorage.getItem<Partial<AthleteSettingsSnapshot> & { publicTelemetry?: boolean }>(
    O1_SETTINGS_KEY,
    {}
  );
  return {
    ...DEFAULTS,
    ...cached,
    crashReports:
      typeof cached.crashReports === 'boolean'
        ? cached.crashReports
        : typeof cached.publicTelemetry === 'boolean'
          ? cached.publicTelemetry
          : DEFAULTS.crashReports,
  };
}

export function patchAthleteSettingsSnapshot(partial: Record<string, unknown>): void {
  const cached = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
  safeStorage.setItem(O1_SETTINGS_KEY, { ...cached, ...partial });
}
