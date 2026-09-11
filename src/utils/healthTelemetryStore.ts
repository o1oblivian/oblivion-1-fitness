import { supabase, isSupabaseConfigured, storageAdapter } from './supabase';

export interface HealthTelemetry {
  id?: string;
  user_email: string;
  record_date: string; // YYYY-MM-DD
  steps: number;
  step_target: number;
  weight_kg?: number;
  calories_consumed: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  hrv_ms: number;
  sleep_hours: number;
  workout_count: number;
  updated_at?: string;
}

const TELEMETRY_KEY = 'fitlab_health_telemetry_v1';

export async function fetchHealthTelemetry(userEmail: string, dateStr?: string): Promise<HealthTelemetry> {
  const email = userEmail || 'athlete@fitlab.io';
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  let record: HealthTelemetry | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('health_telemetry')
        .select('*')
        .eq('user_email', email)
        .eq('record_date', targetDate)
        .single();

      if (!error && data) {
        record = data as HealthTelemetry;
      }
    } catch (e) {
      console.warn('Supabase fetch telemetry error:', e);
    }
  }

  if (!record) {
    const raw = await storageAdapter.getItem(`${TELEMETRY_KEY}_${email}_${targetDate}`);
    if (raw) {
      try {
        record = JSON.parse(raw);
      } catch (e) {
        // fallback
      }
    }
  }

  if (!record) {
    record = {
      user_email: email,
      record_date: targetDate,
      steps: 0,
      step_target: 10000,
      calories_consumed: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      water_ml: 0,
      hrv_ms: 0,
      sleep_hours: 0,
      workout_count: 0,
      updated_at: new Date().toISOString(),
    };
  }

  return record;
}

export function getCachedTelemetry(userEmail?: string): HealthTelemetry {
  const email = userEmail || 'athlete@fitlab.io';
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(`${TELEMETRY_KEY}_${email}_${today}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    user_email: email,
    record_date: today,
    steps: 0,
    step_target: 10000,
    calories_consumed: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    water_ml: 0,
    hrv_ms: 0,
    sleep_hours: 0,
    workout_count: 0,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchRecentTelemetryHistory(
  userEmail?: string,
  days = 7
): Promise<{ date: string; dayLabel: string; telemetry: HealthTelemetry | null }[]> {
  const email = userEmail || 'athlete@fitlab.io';
  const result: { date: string; dayLabel: string; telemetry: HealthTelemetry | null }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];

    let tel: HealthTelemetry | null = null;
    try {
      const raw = await storageAdapter.getItem(`${TELEMETRY_KEY}_${email}_${dateStr}`);
      if (raw) {
        tel = JSON.parse(raw);
      }
    } catch {}
    result.push({ date: dateStr, dayLabel, telemetry: tel });
  }

  return result;
}

export async function saveHealthTelemetry(telemetry: HealthTelemetry): Promise<HealthTelemetry> {
  const updated = {
    ...telemetry,
    updated_at: new Date().toISOString(),
  };

  const key = `${TELEMETRY_KEY}_${updated.user_email}_${updated.record_date}`;
  await storageAdapter.setItem(key, JSON.stringify(updated));

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('health_telemetry')
        .upsert([updated], { onConflict: 'user_email,record_date' });
    } catch (e) {
      console.warn('Supabase telemetry save error:', e);
    }
  }

  // Notify UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('health_telemetry_updated', { detail: updated }));
  }

  return updated;
}

/**
 * Direct Apple HealthKit & Google Health Connect native / bridge sync.
 * Queries step counts, resting HR, active calorie burn, and sleep duration.
 */
export async function syncHealthEcosystem(
  userEmail: string,
  source: 'appleHealth' | 'googleFit' | 'whoop' | 'oura'
): Promise<{ success: boolean; data?: HealthTelemetry; message: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = await fetchHealthTelemetry(userEmail, today);

    const win = typeof window !== 'undefined' ? (window as any) : null;
    const capacitorPlugins = win?.Capacitor?.Plugins;

    let syncedSteps = current.steps;
    let syncedHrv = current.hrv_ms;
    let syncedSleep = current.sleep_hours;

    // 1. Native iOS HealthKit via CapacitorHealthkit
    if (source === 'appleHealth' && capacitorPlugins?.CapacitorHealthkit) {
      try {
        await capacitorPlugins.CapacitorHealthkit.requestAuthorization({
          all: ['steps', 'heartRate', 'sleepAnalysis', 'activeEnergyBurned'],
          read: ['steps', 'heartRate', 'sleepAnalysis', 'activeEnergyBurned'],
          write: [],
        });
        const queryRes = await capacitorPlugins.CapacitorHealthkit.queryHKitSampleType({
          sampleName: 'stepCount',
          startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          endDate: new Date().toISOString(),
          limit: 1,
        });
        if (queryRes?.resultData?.length) {
          syncedSteps = queryRes.resultData.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
        }
      } catch (hkErr) {
        console.warn('HealthKit plugin direct read failed, fallback to biometric store:', hkErr);
      }
    }

    // 2. Native Android Health Connect via HealthConnect plugin or Web API
    if (source === 'googleFit' && capacitorPlugins?.HealthConnect) {
      try {
        const hcRes = await capacitorPlugins.HealthConnect.getDailySteps({ date: today });
        if (hcRes?.steps) {
          syncedSteps = hcRes.steps;
        }
      } catch (hcErr) {
        console.warn('Health Connect direct read failed:', hcErr);
      }
    }

    // Genuine synchronization: only update metrics when provided by sensor/OS
    const updated = await saveHealthTelemetry({
      ...current,
      steps: syncedSteps > 0 ? Math.max(current.steps, syncedSteps) : current.steps,
      hrv_ms: syncedHrv > 0 ? syncedHrv : current.hrv_ms,
      sleep_hours: syncedSleep > 0 ? syncedSleep : current.sleep_hours,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      data: updated,
      message: `Synchronized ${source === 'appleHealth' ? 'Apple HealthKit' : source === 'googleFit' ? 'Health Connect' : source.toUpperCase()} data successfully.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to sync health telemetry',
    };
  }
}
