import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import {
  useTelemetryHistoryStore,
  type DayTelemetryRecord,
} from '../log/store/useTelemetryHistoryStore';
import { useUserStore } from '../../stores/useUserStore';
import { knownSets } from '../log/liftLedger';
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
 * Builds the athlete's own report entirely on-device. Per-set history comes from this phone first;
 * Supabase `workout_logs` only fills days the phone has no sets for (e.g. a new phone).
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

  const {
    report,
    sets: allSets,
    sleep: sleepSamples,
  } = useMemo(() => {
    const sets: LoggedSet[] = [];
    const sleep: SleepSample[] = [];

    Object.entries(historyByDate).forEach(([day, rec]) => {
      const w = rec.workout;
      if (w?.hasData) {
        for (const ex of w.exercises ?? []) {
          if (!ex?.name) continue;
          const logged = knownSets(ex);
          const rows =
            logged.length > 0
              ? logged
              : [{ reps: Number(ex.reps) || 0, weightKg: Number(ex.weightKg) || 0 }];
          for (const set of rows) {
            if (!(set.reps >= 1)) continue;
            sets.push({
              exercise: ex.name,
              weightKg: Number(set.weightKg) || 0,
              reps: set.reps,
              rpe: null,
              day,
            });
          }
        }
      }
      const sl = rec.sleep;
      if (sl?.hasData && sl.durationHours > 0) {
        sleep.push({
          day,
          hours: sl.durationHours,
          recoveryPct: sl.recoveryPercent > 0 ? sl.recoveryPercent : null,
        });
      }
    });

    const phoneDays = new Set(sets.map((s) => s.day));
    sets.push(...(remote ?? []).filter((s) => !phoneDays.has(s.day)));

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
    sets: allSets,
    sleep: sleepSamples,
    historyByDate,
    loading,
    source: remote && remote.length > 0 ? 'cloud' : 'device',
    targetSessions,
    setTargetSessions,
  };
}
