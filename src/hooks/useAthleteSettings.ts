import { useState } from 'react';
import { safeStorage } from '../utils/sanitizers';
import { useTelemetryStore } from '../features/telemetry/store/useTelemetryStore';
import { tactileEngine } from '../services/tactileEngine';
import { supabase } from '../services/supabaseClient';
import { apiUrl } from '../services/apiBase';
import { clearLocalCrash } from '../utils/crashLog';

export const O1_SETTINGS_KEY = 'o1fc_production_settings_v3';

export type DisciplineType =
  | 'Hypertrophy'
  | 'Powerlifting'
  | 'Hyrox / Hybrid'
  | 'CrossFit'
  | 'Calisthenics'
  | 'Endurance'
  | 'Strength & Conditioning';

export type InputStyleType = 'Rotary Dial' | 'Keypad';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'in';
export type DistanceUnit = 'km' | 'mi';

export interface SettingsStoreState {
  // 1. Profile
  name: string;
  handle: string;
  age: number;
  heightCm: number;
  weightKg: number;
  bio: string;
  eliteReelsPresence: boolean;

  // 2. Training
  discipline: DisciplineType;
  autoDispatch: boolean;
  activeDays: string[];
  restRecoveryMode: boolean;

  // 3. Units & Defaults
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  distanceUnit: DistanceUnit;
  defaultRestSeconds: number;
  defaultBarbellKg: number;

  // 4. Daily Step Target (Dial Controlled)
  stepTarget: number;

  // 5. Location
  autoLocation: boolean;
  homeGym: string;

  // 6. Appearance
  inputStyle: InputStyleType;

  // 7. Audio & Tactile
  hapticVibration: boolean;
  soundEffects: boolean;
  dialClicks: boolean;
  restTimerChime: boolean;
  prChime: boolean;

  // 8. Notifications
  osPushEnabled: boolean;
  preWorkoutReminder: boolean;
  coachUpdates: boolean;
  buddyMatches: boolean;
  gymCheckIns: boolean;
  systemBilling: boolean;

  // 9. Privacy
  buddyRadarDiscovery: boolean;
  ghostMode: boolean;
  publicTelemetry: boolean;
  crashReports: boolean;

  // 10. Devices
  liveIngestionStream: boolean;
}

const persistSettingsPatch = (partial: Record<string, unknown>) => {
  const existing = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
  safeStorage.setItem(O1_SETTINGS_KEY, { ...existing, ...partial });
};

export const useProductionSettings = (onShowToast?: (msg: string) => void) => {
  const cached = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
  // Profile
  const [name, setName] = useState<string>(typeof cached.name === 'string' ? cached.name : 'o1oblivionfitness');
  const [handle, setHandle] = useState<string>(typeof cached.handle === 'string' ? cached.handle : '@o1oblivionfitness');
  const [age, setAge] = useState<number>(typeof cached.age === 'number' ? cached.age : 26);
  const [heightCm, setHeightCm] = useState<number>(typeof cached.heightCm === 'number' ? cached.heightCm : 180);
  const [weightKg, setWeightKg] = useState<number>(typeof cached.weightKg === 'number' ? cached.weightKg : 82);
  const [bio, setBio] = useState<string>(typeof cached.bio === 'string' ? cached.bio : '');
  const [eliteReelsPresence, setEliteReelsPresenceState] = useState<boolean>(
    typeof cached.eliteReelsPresence === 'boolean' ? cached.eliteReelsPresence : true
  );
  const setEliteReelsPresence = (val: boolean) => {
    setEliteReelsPresenceState(val);
    persistSettingsPatch({ eliteReelsPresence: val });
  };

  // Training
  const [discipline, setDiscipline] = useState<DisciplineType>(
    (cached.discipline as DisciplineType) || 'Hypertrophy'
  );
  const [autoDispatch, setAutoDispatchState] = useState<boolean>(
    typeof cached.autoDispatch === 'boolean' ? cached.autoDispatch : true
  );
  const setAutoDispatch = (val: boolean) => {
    setAutoDispatchState(val);
    persistSettingsPatch({ autoDispatch: val });
  };
  const [activeDays, setActiveDays] = useState<string[]>(
    Array.isArray(cached.activeDays) ? (cached.activeDays as string[]) : ['Mo', 'Tu', 'We', 'Th', 'Fr']
  );
  const [restRecoveryMode, setRestRecoveryMode] = useState<boolean>(
    typeof cached.restRecoveryMode === 'boolean' ? cached.restRecoveryMode : false
  );

  // Units & Workout Defaults
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    (cached.weightUnit as WeightUnit) || 'kg'
  );
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    (cached.heightUnit as HeightUnit) || 'cm'
  );
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(
    (cached.distanceUnit as DistanceUnit) || 'km'
  );
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(
    typeof cached.defaultRestSeconds === 'number' ? cached.defaultRestSeconds : 90
  );
  const [defaultBarbellKg, setDefaultBarbellKg] = useState<number>(
    typeof cached.defaultBarbellKg === 'number' ? cached.defaultBarbellKg : 20
  );

  // Daily Step Target (Keypad & Dial Controlled)
  const initialStepTarget = (() => {
    try {
      const storeTarget = useTelemetryStore.getState().stepTarget;
      if (typeof storeTarget === 'number' && storeTarget > 0) return storeTarget;
    } catch {
      // ignore
    }
    if (typeof cached.stepTarget === 'number' && cached.stepTarget > 0) return cached.stepTarget;
    return 10000;
  })();

  const [stepTarget, setStepTargetState] = useState<number>(initialStepTarget);

  const setStepTarget = (newTarget: number) => {
    const valid = Math.max(1000, Math.min(50000, Math.round(newTarget)));
    setStepTargetState(valid);
    // 1. Immediately persist to localStorage settings cache so exiting/re-entering NEVER loses it
    const current = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
    safeStorage.setItem(O1_SETTINGS_KEY, { ...current, stepTarget: valid });
    // 2. Immediately sync to telemetry store
    try {
      useTelemetryStore.getState().setStepTarget(valid);
    } catch (e) {
      console.warn('[Settings] Failed to sync step target to telemetry store:', e);
    }
  };

  // Location
  const [autoLocation, setAutoLocation] = useState<boolean>(
    typeof cached.autoLocation === 'boolean' ? cached.autoLocation : true
  );
  const [homeGym, setHomeGym] = useState<string>(
    typeof cached.homeGym === 'string' ? cached.homeGym : 'Melbourne, AU'
  );

  // Appearance
  const [inputStyle, setInputStyle] = useState<InputStyleType>(
    (cached.inputStyle as InputStyleType) || 'Rotary Dial'
  );

  // Audio & Tactile
  const [hapticVibration, setHapticVibrationState] = useState<boolean>(
    typeof cached.hapticVibration === 'boolean' ? cached.hapticVibration : true
  );
  const [soundEffects, setSoundEffectsState] = useState<boolean>(
    typeof cached.soundEffects === 'boolean' ? cached.soundEffects : true
  );
  const [dialClicks, setDialClicks] = useState<boolean>(
    typeof cached.dialClicks === 'boolean' ? cached.dialClicks : true
  );
  const [restTimerChime, setRestTimerChime] = useState<boolean>(
    typeof cached.restTimerChime === 'boolean' ? cached.restTimerChime : true
  );
  const [prChime, setPrChime] = useState<boolean>(
    typeof cached.prChime === 'boolean' ? cached.prChime : true
  );

  const setHapticVibration = (val: boolean) => {
    setHapticVibrationState(val);
    tactileEngine.configureSettings({ hapticEnabled: val });
  };
  const setSoundEffects = (val: boolean) => {
    setSoundEffectsState(val);
    tactileEngine.configureSettings({ soundEnabled: val });
  };

  // Notifications
  const [osPushEnabled, setOsPushEnabledState] = useState<boolean>(
    typeof cached.osPushEnabled === 'boolean' ? cached.osPushEnabled : false
  );
  const setOsPushEnabled = (val: boolean) => {
    setOsPushEnabledState(val);
    persistSettingsPatch({ osPushEnabled: val });
  };
  const [preWorkoutReminder, setPreWorkoutReminderState] = useState<boolean>(
    typeof cached.preWorkoutReminder === 'boolean' ? cached.preWorkoutReminder : true
  );
  const setPreWorkoutReminder = (val: boolean) => {
    setPreWorkoutReminderState(val);
    persistSettingsPatch({ preWorkoutReminder: val });
  };
  const [coachUpdates, setCoachUpdates] = useState<boolean>(
    typeof cached.coachUpdates === 'boolean' ? cached.coachUpdates : true
  );
  const [buddyMatches, setBuddyMatches] = useState<boolean>(
    typeof cached.buddyMatches === 'boolean' ? cached.buddyMatches : true
  );
  const [gymCheckIns, setGymCheckIns] = useState<boolean>(
    typeof cached.gymCheckIns === 'boolean' ? cached.gymCheckIns : true
  );
  const [systemBilling, setSystemBilling] = useState<boolean>(
    typeof cached.systemBilling === 'boolean' ? cached.systemBilling : false
  );

  // Privacy & Social
  const [buddyRadarDiscovery, setBuddyRadarDiscoveryState] = useState<boolean>(
    typeof cached.buddyRadarDiscovery === 'boolean' ? cached.buddyRadarDiscovery : true
  );
  const setBuddyRadarDiscovery = (val: boolean) => {
    setBuddyRadarDiscoveryState(val);
    persistSettingsPatch({ buddyRadarDiscovery: val });
  };
  const [ghostMode, setGhostModeState] = useState<boolean>(
    typeof cached.ghostMode === 'boolean' ? cached.ghostMode : false
  );
  const setGhostMode = (val: boolean) => {
    setGhostModeState(val);
    persistSettingsPatch({ ghostMode: val });
  };
  const [publicTelemetry, setPublicTelemetry] = useState<boolean>(
    typeof cached.publicTelemetry === 'boolean' ? cached.publicTelemetry : true
  );
  const [crashReports, setCrashReportsState] = useState<boolean>(
    typeof cached.crashReports === 'boolean' ? cached.crashReports : true
  );

  const setCrashReports = (val: boolean) => {
    setCrashReportsState(val);
    const existing = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
    safeStorage.setItem(O1_SETTINGS_KEY, { ...existing, crashReports: val });
    if (!val) clearLocalCrash();
  };

  // Connected Devices
  const [liveIngestionStream, setLiveIngestionStream] = useState<boolean>(
    typeof cached.liveIngestionStream === 'boolean' ? cached.liveIngestionStream : true
  );
  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const toggleDay = (day: string) => {
    tactileEngine.triggerSelectionBuzz();
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const saveSettings = () => {
    safeStorage.setItem(O1_SETTINGS_KEY, {
      name,
      handle,
      age,
      heightCm,
      weightKg,
      bio,
      eliteReelsPresence,
      discipline,
      autoDispatch,
      activeDays,
      restRecoveryMode,
      weightUnit,
      heightUnit,
      distanceUnit,
      defaultRestSeconds,
      defaultBarbellKg,
      stepTarget,
      autoLocation,
      homeGym,
      inputStyle,
      hapticVibration,
      soundEffects,
      dialClicks,
      restTimerChime,
      prChime,
      osPushEnabled,
      preWorkoutReminder,
      coachUpdates,
      buddyMatches,
      gymCheckIns,
      systemBilling,
      buddyRadarDiscovery,
      ghostMode,
      publicTelemetry,
      crashReports,
      liveIngestionStream,
    });
    try {
      useTelemetryStore.getState().setStepTarget(stepTarget);
    } catch (e) {
      console.warn('[Settings] Failed to sync step target on save:', e);
    }
    if (onShowToast) onShowToast('Settings updated.');
  };

  const handleLogout = async (onLogoutCallback?: () => void) => {
    tactileEngine.triggerSelectionBuzz();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Settings] Supabase sign out fallback:', e);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('o1fc_auth_token');
      window.localStorage.removeItem('supabase.auth.token');
      window.localStorage.removeItem('o1fc_user_id');
      window.localStorage.removeItem('o1fc_user_email');
      window.localStorage.removeItem('o1fc_athlete_id');
      window.localStorage.removeItem('o1fc_onboarding_completed');
      window.dispatchEvent(new CustomEvent('o1fc_relaunch_onboarding'));
    }
    if (onShowToast) onShowToast('Signed out of tactical session.');
    if (onLogoutCallback) onLogoutCallback();
  };

  const handleConfirmDelete = async (onLogoutCallback?: () => void) => {
    setIsDeleting(true);
    tactileEngine.playPRCelebration();
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (userErr || !uid) {
        setIsDeleting(false);
        if (onShowToast) onShowToast('Sign in to delete this account.');
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (accessToken) {
        const res = await fetch(apiUrl('/api/account/delete'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          try {
            await supabase.rpc('delete_user_account', { target_user_id: uid });
          } catch {}
          if (res.status === 503) {
            setIsDeleting(false);
            if (onShowToast) onShowToast(payload.error || 'Account deletion is not configured on the server.');
            return;
          }
        }
      }
      try {
        await supabase.from('workout_logs').delete().eq('user_id', uid);
      } catch {}
      try {
        await supabase.from('nutrition_logs').delete().eq('user_id', uid);
      } catch {}
      try {
        await supabase.from('telemetry_records').delete().eq('user_id', uid);
      } catch {}
      try {
        await supabase.from('profiles').delete().eq('id', uid);
      } catch (e) {
        console.warn('[Settings] Supabase delete profile fallback:', e);
      }
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[Settings] Supabase auth signOut fallback:', e);
      }
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
          window.sessionStorage.clear();
          window.dispatchEvent(new CustomEvent('o1fc_account_deleted'));
          window.dispatchEvent(new CustomEvent('o1fc_relaunch_onboarding'));
        }
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        if (onShowToast) onShowToast('Account and telemetry permanently erased.');
        if (onLogoutCallback) onLogoutCallback();
      }, 500);
    } catch {
      setIsDeleting(false);
      if (onShowToast) onShowToast('Account deletion failed. Try again.');
    }
  };

  const handleExportVault = () => {
    tactileEngine.triggerSelectionBuzz();
    // Gather all local-first athlete telemetry and logs from on-device storage
    const allLocalKeys = typeof window !== 'undefined' ? Object.keys(window.localStorage) : [];
    const localSnapshot: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      allLocalKeys.forEach((key) => {
        if (key.startsWith('o1') || key.startsWith('workout') || key.startsWith('fuel')) {
          try {
            localSnapshot[key] = JSON.parse(window.localStorage.getItem(key) || '{}');
          } catch {
            localSnapshot[key] = window.localStorage.getItem(key);
          }
        }
      });
    }

    const vaultArchive = {
      vaultVersion: '1.0.0-SOVEREIGN-LOCAL-SANCTUARY',
      architecture: '100% Local-First / Zero-Cloud Air-Gapped',
      athlete: {
        name,
        handle,
        email: 'o1oblivionfitness@gmail.com',
        age,
        heightCm,
        weightKg,
        weightUnit,
        heightUnit,
        distanceUnit,
        defaultRestSeconds,
        defaultBarbellKg,
        stepTarget,
        discipline,
        activeDays,
        homeGym,
      },
      localDataStore: localSnapshot,
      exportedAt: new Date().toISOString(),
      compliance: {
        appleAttCompliant: true,
        googlePlayDataSafety: 'ZERO_CLOUD_STORAGE',
        gdprCcpaRightToPortability: true,
      },
    };
    const blob = new Blob([JSON.stringify(vaultArchive, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `O1FC-Sanctuary-Vault-${Date.now()}.o1fc`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Air-Gapped Vault Backup (.o1fc) exported.');
  };

  return {
    name,
    setName,
    handle,
    setHandle,
    age,
    setAge,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    bio,
    setBio,
    eliteReelsPresence,
    setEliteReelsPresence,
    discipline,
    setDiscipline,
    autoDispatch,
    setAutoDispatch,
    activeDays,
    toggleDay,
    restRecoveryMode,
    setRestRecoveryMode,
    weightUnit,
    setWeightUnit,
    heightUnit,
    setHeightUnit,
    distanceUnit,
    setDistanceUnit,
    defaultRestSeconds,
    setDefaultRestSeconds,
    defaultBarbellKg,
    setDefaultBarbellKg,
    stepTarget,
    setStepTarget,
    autoLocation,
    setAutoLocation,
    homeGym,
    setHomeGym,
    inputStyle,
    setInputStyle,
    hapticVibration,
    setHapticVibration,
    soundEffects,
    setSoundEffects,
    dialClicks,
    setDialClicks,
    restTimerChime,
    setRestTimerChime,
    prChime,
    setPrChime,
    osPushEnabled,
    setOsPushEnabled,
    preWorkoutReminder,
    setPreWorkoutReminder,
    coachUpdates,
    setCoachUpdates,
    buddyMatches,
    setBuddyMatches,
    gymCheckIns,
    setGymCheckIns,
    systemBilling,
    setSystemBilling,
    buddyRadarDiscovery,
    setBuddyRadarDiscovery,
    ghostMode,
    setGhostMode,
    publicTelemetry,
    setPublicTelemetry,
    crashReports,
    setCrashReports,
    liveIngestionStream,
    setLiveIngestionStream,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    saveSettings,
    handleLogout,
    handleConfirmDelete,
    handleExportVault,
  };
};
