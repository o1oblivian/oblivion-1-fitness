import { useEffect, useState } from 'react';
import { safeStorage } from '../utils/sanitizers';
import { useTelemetryStore } from '../features/telemetry/store/useTelemetryStore';
import { tactileEngine } from '../services/tactileEngine';
import { supabase } from '../services/supabaseClient';
import { apiFetch } from '../services/apiBase';
import { clearLocalCrash } from '../utils/crashLog';
import { clearAccountData, releaseDevice } from '../services/accountScope';
import { useUserStore } from '../stores/useUserStore';
import { clearReminders, notifyRemindersChanged } from '../services/athleteReminderScheduler';
import { bluetoothSensorService } from '../services/bluetoothSensorService';
import { exportJsonFile } from '../services/dataExport';

export const O1_SETTINGS_KEY = 'o1fc_production_settings_v3';

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

  // 2. Training (discipline and days live in the consultation profile)
  autoDispatch: boolean;
  restRecoveryMode: boolean;

  // 3. Units & Defaults
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  distanceUnit: DistanceUnit;
  defaultRestSeconds: number;
  defaultBarbellKg: number;

  // 4. Daily Step Target (Dial Controlled)
  stepTarget: number;

  // 5. Appearance
  inputStyle: InputStyleType;

  // 6. Audio & Tactile
  hapticVibration: boolean;
  soundEffects: boolean;

  // 7. Notifications
  osPushEnabled: boolean;
  preWorkoutReminder: boolean;
  coachUpdates: boolean;

  // 8. Privacy
  crashReports: boolean;
}

const persistSettingsPatch = (partial: Record<string, unknown>) => {
  const existing = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
  safeStorage.setItem(O1_SETTINGS_KEY, { ...existing, ...partial });
};

/** Writes the account row now. Waiting for the next app load was dropping the edit on sign-out. */
function pushProfile(patch: Record<string, unknown>) {
  void (async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { error } = await supabase.from('profiles').upsert(
        { id: uid, ...patch, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );
      if (error) console.warn('[Settings] profile save:', error.message);
    } catch (err) {
      console.warn('[Settings] profile save:', err);
    }
  })();
}

/** Saved the moment it changes, so closing the app mid-edit never loses a setting. */
function usePersistedSetting<T>(key: keyof SettingsStoreState, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);
  const save = (next: T) => {
    setValue(next);
    persistSettingsPatch({ [key]: next });
  };
  return [value, save];
}

export const useProductionSettings = (onShowToast?: (msg: string) => void) => {
  const cached = safeStorage.getItem<Record<string, unknown>>(O1_SETTINGS_KEY, {});
  const profile = useUserStore.getState();
  // Profile
  const [name, setName] = usePersistedSetting<string>('name', typeof cached.name === 'string' && cached.name ? cached.name : profile.name);
  const [handle, setHandle] = usePersistedSetting<string>('handle', typeof cached.handle === 'string' && cached.handle ? cached.handle : profile.handle);
  const accountName = useUserStore((s) => s.name);
  const accountHandle = useUserStore((s) => s.handle);
  useEffect(() => {
    if (!name && accountName) setName(accountName);
  }, [accountName, name, setName]);
  useEffect(() => {
    if (!handle && accountHandle) setHandle(accountHandle);
  }, [accountHandle, handle, setHandle]);
  const [age, setAge] = usePersistedSetting<number>('age', typeof cached.age === 'number' ? cached.age : 0);
  const [heightCm, setHeightCm] = usePersistedSetting<number>('heightCm', typeof cached.heightCm === 'number' ? cached.heightCm : 0);
  const [weightKg, setWeightKg] = usePersistedSetting<number>('weightKg', typeof cached.weightKg === 'number' ? cached.weightKg : profile.weightKg);
  const [bio, setBio] = usePersistedSetting<string>('bio', typeof cached.bio === 'string' ? cached.bio : '');
  const [eliteReelsPresence, setEliteReelsPresenceState] = useState<boolean>(
    typeof cached.eliteReelsPresence === 'boolean' ? cached.eliteReelsPresence : true
  );
  const setEliteReelsPresence = (val: boolean) => {
    setEliteReelsPresenceState(val);
    persistSettingsPatch({ eliteReelsPresence: val });
  };

  // Training
  const [autoDispatch, setAutoDispatch] = usePersistedSetting<boolean>(
    'autoDispatch',
    typeof cached.autoDispatch === 'boolean' ? cached.autoDispatch : true
  );
  const [restRecoveryMode, setRestRecoveryMode] = usePersistedSetting<boolean>(
    'restRecoveryMode',
    typeof cached.restRecoveryMode === 'boolean' ? cached.restRecoveryMode : false
  );

  // Units & Workout Defaults
  const [weightUnit, setWeightUnit] = usePersistedSetting<WeightUnit>(
    'weightUnit',
    cached.weightUnit === 'lbs' ? 'lbs' : 'kg'
  );
  const [heightUnit, setHeightUnit] = usePersistedSetting<HeightUnit>(
    'heightUnit',
    cached.heightUnit === 'in' ? 'in' : 'cm'
  );
  const [distanceUnit, setDistanceUnit] = usePersistedSetting<DistanceUnit>(
    'distanceUnit',
    cached.distanceUnit === 'mi' ? 'mi' : 'km'
  );
  const [defaultRestSeconds, setDefaultRestSeconds] = usePersistedSetting<number>(
    'defaultRestSeconds',
    typeof cached.defaultRestSeconds === 'number' ? cached.defaultRestSeconds : 90
  );
  const [defaultBarbellKg, setDefaultBarbellKg] = usePersistedSetting<number>(
    'defaultBarbellKg',
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

  // Appearance
  const [inputStyle, setInputStyle] = usePersistedSetting<InputStyleType>(
    'inputStyle',
    cached.inputStyle === 'Keypad' ? 'Keypad' : 'Rotary Dial'
  );

  // Audio & Tactile
  const [hapticVibration, setHapticVibrationState] = useState<boolean>(
    typeof cached.hapticVibration === 'boolean' ? cached.hapticVibration : true
  );
  const [soundEffects, setSoundEffectsState] = useState<boolean>(
    typeof cached.soundEffects === 'boolean' ? cached.soundEffects : true
  );
  const setHapticVibration = (val: boolean) => {
    setHapticVibrationState(val);
    persistSettingsPatch({ hapticVibration: val });
    tactileEngine.configureSettings({ hapticEnabled: val });
  };
  const setSoundEffects = (val: boolean) => {
    setSoundEffectsState(val);
    persistSettingsPatch({ soundEffects: val });
    tactileEngine.configureSettings({ soundEnabled: val });
  };

  // Notifications: every change rebuilds the reminders scheduled on this phone.
  const [osPushEnabled, setOsPushEnabledState] = useState<boolean>(
    typeof cached.osPushEnabled === 'boolean' ? cached.osPushEnabled : false
  );
  const setOsPushEnabled = (val: boolean) => {
    setOsPushEnabledState(val);
    persistSettingsPatch({ osPushEnabled: val });
    notifyRemindersChanged();
  };
  const [preWorkoutReminder, setPreWorkoutReminderState] = useState<boolean>(
    typeof cached.preWorkoutReminder === 'boolean' ? cached.preWorkoutReminder : true
  );
  const setPreWorkoutReminder = (val: boolean) => {
    setPreWorkoutReminderState(val);
    persistSettingsPatch({ preWorkoutReminder: val });
    notifyRemindersChanged();
  };
  const [coachUpdates, setCoachUpdatesState] = useState<boolean>(
    typeof cached.coachUpdates === 'boolean' ? cached.coachUpdates : true
  );
  const setCoachUpdates = (val: boolean) => {
    setCoachUpdatesState(val);
    persistSettingsPatch({ coachUpdates: val });
  };

  const [crashReports, setCrashReportsState] = useState<boolean>(
    typeof cached.crashReports === 'boolean' ? cached.crashReports : true
  );

  const setCrashReports = (val: boolean) => {
    setCrashReportsState(val);
    persistSettingsPatch({ crashReports: val });
    if (!val) clearLocalCrash();
  };

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const saveSettings = () => {
    persistSettingsPatch({
      name,
      handle,
      age,
      heightCm,
      weightKg,
      bio,
      eliteReelsPresence,
      autoDispatch,
      restRecoveryMode,
      weightUnit,
      heightUnit,
      distanceUnit,
      defaultRestSeconds,
      defaultBarbellKg,
      stepTarget,
      inputStyle,
      hapticVibration,
      soundEffects,
      osPushEnabled,
      preWorkoutReminder,
      coachUpdates,
      crashReports,
    });
    try {
      useTelemetryStore.getState().setStepTarget(stepTarget);
    } catch (e) {
      console.warn('[Settings] Failed to sync step target on save:', e);
    }
    if (onShowToast) onShowToast('Settings updated.');
  };

  /** Reminders and Bluetooth sensors belong to this account; stop both before the device is released. */
  const releasePhoneResources = async () => {
    bluetoothSensorService.disconnectAll();
    await clearReminders().catch(() => {});
  };

  const handleLogout = (onLogoutCallback?: () => void) => {
    tactileEngine.triggerSelectionBuzz();
    // Wipe the session and leave immediately. Waiting on reminders or Bluetooth
    // can hang forever on Android and leaves Sign out looking frozen.
    try {
      void supabase.auth.stopAutoRefresh();
      void supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* reload still drops the stored session */
    }
    try {
      window.localStorage.setItem('o1fc_signed_out_pending', '1');
      window.localStorage.removeItem('supabase.auth.token');
      window.localStorage.removeItem('o1fc_user_id');
      window.localStorage.removeItem('o1fc_user_email');
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('sb-') && key.includes('auth-token')) window.localStorage.removeItem(key);
      }
    } catch {
      /* releaseDevice still restarts clean */
    }
    void Promise.race([
      releasePhoneResources(),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
    if (onLogoutCallback) onLogoutCallback();
    window.dispatchEvent(new CustomEvent('o1fc_signed_out'));
    releaseDevice();
  };

  const handleConfirmDelete = async (onLogoutCallback?: () => void) => {
    setIsDeleting(true);
    tactileEngine.triggerSelectionBuzz();
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
      if (!accessToken) {
        setIsDeleting(false);
        if (onShowToast) onShowToast('Sign in again to delete this account.');
        return;
      }
      // The server removes the sign-in itself. Only report success once it confirms.
      const res = await apiFetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setIsDeleting(false);
        if (onShowToast) onShowToast(payload?.error || 'Your account was not deleted. Check your connection and try again.');
        return;
      }
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[Settings] Supabase auth signOut fallback:', e);
      }
      await releasePhoneResources();
      await import('../services/revenueCatService').then((m) => m.revenueCatService.logOut()).catch(() => undefined);
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          clearAccountData();
          try {
            window.localStorage.clear();
            window.sessionStorage.clear();
          } catch {
            // storage unavailable
          }
          window.dispatchEvent(new CustomEvent('o1fc_account_deleted'));
          window.dispatchEvent(new CustomEvent('o1fc_relaunch_onboarding'));
        }
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        if (onShowToast) onShowToast('Account and telemetry permanently erased.');
        if (onLogoutCallback) onLogoutCallback();
        // Restart clean so no screen or in-memory store keeps the deleted account's data.
        releaseDevice();
      }, 500);
    } catch {
      setIsDeleting(false);
      if (onShowToast) onShowToast('Account deletion failed. Try again.');
    }
  };

  const handleExportVault = async () => {
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
      vaultVersion: '1.0.0',
      architecture: 'Local-first',
      athlete: {
        name,
        handle,
        email: safeStorage.getItem<string>('o1fc_user_email', '') || '',
        age,
        heightCm,
        weightKg,
        weightUnit,
        heightUnit,
        distanceUnit,
        defaultRestSeconds,
        defaultBarbellKg,
        stepTarget,
      },
      localDataStore: localSnapshot,
      exportedAt: new Date().toISOString(),
    };
    const day = new Date().toISOString().slice(0, 10);
    try {
      const result = await exportJsonFile(`oblivion1-data-${day}.json`, JSON.stringify(vaultArchive, null, 2));
      if (result === 'saved') onShowToast?.('Your data file is ready');
    } catch (err) {
      console.warn('[Settings] Export failed:', err);
      onShowToast?.("Couldn't export your data. Try again.");
    }
  };

  const setNameNow = (next: string) => {
    setName(next);
    useUserStore.getState().updateProfile({ name: next });
    const trimmed = next.trim();
    if (trimmed) pushProfile({ full_name: trimmed });
  };

  const setHandleNow = (next: string) => {
    setHandle(next);
    useUserStore.getState().updateProfile({ handle: next });
    const bare = next.trim().replace(/^@+/, '');
    if (bare) pushProfile({ handle: bare });
  };

  return {
    name,
    setName: setNameNow,
    handle,
    setHandle: setHandleNow,
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
    autoDispatch,
    setAutoDispatch,
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
    inputStyle,
    setInputStyle,
    hapticVibration,
    setHapticVibration,
    soundEffects,
    setSoundEffects,
    osPushEnabled,
    setOsPushEnabled,
    preWorkoutReminder,
    setPreWorkoutReminder,
    coachUpdates,
    setCoachUpdates,
    crashReports,
    setCrashReports,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    saveSettings,
    handleLogout,
    handleConfirmDelete,
    handleExportVault,
  };
};
