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
      steps: 8420,
      step_target: 10000,
      weight_kg: 78.5,
      calories_consumed: 2250,
      protein_g: 175,
      carbs_g: 220,
      fat_g: 65,
      water_ml: 2500,
      hrv_ms: 68,
      sleep_hours: 7.8,
      workout_count: 1,
      updated_at: new Date().toISOString(),
    };
  }

  return record;
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
