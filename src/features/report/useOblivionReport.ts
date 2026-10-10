import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useTelemetryHistoryStore, type DayTelemetryRecord } from '../log/store/useTelemetryHistoryStore';
import { useUserStore } from '../../stores/useUserStore';
import { buildReport, toDayKey } from './reportEngine';
import { readWeighIns } from './weighInLog';
import type { LoggedSet, OblivionReport, SleepSample } from './types';

const HISTORY_DAYS = 120;
const TARGET_KEY = 'o1fc_report_target_sessions';

function readTarget(): number {
  try {
    const n = Number(localStorage.getItem(TARGET_KEY));
    return n >= 1 && n <= 7 ? Math.round(n) : 4;
  } catch {
    return 4;
  }
}

interface RemoteLogRow {
  exercise_name: string | null;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  created_at: string;
}

async function fetchRemoteSets(): Promise<LoggedSet[] | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return null;
    const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from('workout_logs')
      .select('exercise_name, reps, weight_kg, rpe, created_at')
      .eq('user_id', uid)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(6000);
    if (error || !data) return null;
    return (data as RemoteLogRow[])
      .filter((r) => r.exercise_name && Number(r.reps) >= 1)
      .map((r) => ({
        exercise: String(r.exercise_name),
        weightKg: Number(r.weight_kg) || 0,
        reps: Number(r.reps),
        rpe: r.rpe === null || r.rpe === undefined ? null : Number(r.rpe),
        day: toDayKey(new Date(r.created_at).getTime()),
      }));
  } catch {
    return null;
  }
}

export interface UseOblivionReportResult {
  report: OblivionReport;
  /** Merged per-set history the report was built from. */
  sets: LoggedSet[];
  sleep: SleepSample[];
  historyByDate: Record<string, Partial<DayTelemetryRecord>>;
  loading: boolean;
  source: 'cloud' | 'device';
  targetSessions: number;
  setTargetSessions: (n: number) => void;
}

/**
 * Builds the athlete's own report entirely on-device. Per-set history comes from
 * Supabase `workout_logs` when signed in (preferred), with the local telemetry
 * history filling any day the cloud has no rows for.
 */
export function useOblivionReport(enabled: boolean): UseOblivionReportResult {
  const historyByDate = useTelemetryHistoryStore((s) => s.historyByDate);
  const weightKg = useUserStore((s) => s.weightKg);
  const targetWeightKg = useUserStore((s) => s.targetWeightKg);
  const [remote, setRemote] = useState<LoggedSet[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetSessions, setTargetState] = useState<number>(readTarget);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    fetchRemoteSets().then((rows) => {
      if (!alive) return;
      setRemote(rows);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  const setTargetSessions = useCallback((n: number) => {
    const next = Math.min(7, Math.max(1, Math.round(n)));
    try {
      localStorage.setItem(TARGET_KEY, String(next));
    } catch {
      // best-effort
    }
    setTargetState(next);
  }, []);

  const { report, sets, sleep } = useMemo(() => {
    const remoteDays = new Set((remote ?? []).map((s) => s.day));
    const sets: LoggedSet[] = [...(remote ?? [])];
    const sleep: SleepSample[] = [];

    Object.entries(historyByDate).forEach(([day, rec]) => {
      const w = rec.workout;
      if (w?.hasData && !remoteDays.has(day)) {
        for (const ex of w.exercises ?? []) {
          if (!ex?.name || !(ex.reps >= 1)) continue;
          const count = Math.min(12, Math.max(1, Math.round(ex.sets || 1)));
          for (let i = 0; i < count; i += 1) {
            sets.push({ exercise: ex.name, weightKg: Number(ex.weightKg) || 0, reps: ex.reps, rpe: null, day });
          }
        }
      }
      const sl = rec.sleep;
      if (sl?.hasData && sl.durationHours > 0) {
        sleep.push({ day, hours: sl.durationHours, recoveryPct: sl.recoveryPercent > 0 ? sl.recoveryPercent : null });
      }
    });

    const built = buildReport({
      sets,
      sleep,
      weighIns: readWeighIns(),
      currentWeightKg: weightKg,
      targetWeightKg,
      targetSessionsPerWeek: targetSessions,
      now: Date.now(),
    });
    return { report: built, sets, sleep };
  }, [historyByDate, remote, weightKg, targetWeightKg, targetSessions]);

  return {
    report,
    sets,
    sleep,
    historyByDate,
    loading,
    source: remote && remote.length > 0 ? 'cloud' : 'device',
    targetSessions,
    setTargetSessions,
  };
}
