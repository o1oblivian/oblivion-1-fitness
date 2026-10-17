import { create } from 'zustand';
import { supabase } from '../../../services/supabaseClient';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { DayStrainDetail, EMPTY_MICROCYCLE_DAYS } from '../components/microcycle/microcycleTypes';
import { computeAcwr, weekCompletionPct, AcwrSnapshot } from '../../../utils/acwrMath';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { useConsultationStore } from '../../induction/useConsultationStore';
import { localDayKey } from '../../log/services/dayLogService';

export interface MicrocycleStoreState {
  activeDays: DayStrainDetail[];
  isLoading: boolean;
  activeIsoWeekDates: { dayLabel: string; dateKey: string; dayIndex: number }[];
  acwr: AcwrSnapshot;
  refreshFromSupabase: () => Promise<void>;
  /** Rebuilds the week from the device record and the last cloud fetch, with no network call. */
  recompute: () => void;
}

function computeIsoWeekDates(): { dayLabel: string; dateKey: string; dayIndex: number }[] {
  const now = new Date();
  const jsDay = now.getDay();
  const isoDay = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - isoDay);
  monday.setHours(0, 0, 0, 0);

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { dayLabel: label, dateKey, dayIndex: idx };
  });
}

const EMPTY_ACWR: AcwrSnapshot = {
  acuteKg: 0,
  chronicKg: 0,
  ratio: null,
  label: '--',
  completionPct: null,
  calibrating: true,
  historyDays: 0,
};
const ROW_CAP = 400;

function dateKeyOffset(daysBack: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localMidnightIso(dateKey: string, endOfDay = false): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
  return date.toISOString();
}

interface CloudDay {
  logVol: number;
  logSets: number;
  sessVol: number;
  sessSets: number;
  title: string | null;
}

let cloudByDay = new Map<string, CloudDay>();

function bucket(map: Map<string, CloudDay>, key: string): CloudDay {
  let day = map.get(key);
  if (!day) {
    day = { logVol: 0, logSets: 0, sessVol: 0, sessSets: 0, title: null };
    map.set(key, day);
  }
  return day;
}

export const useMicrocycleStore = create<MicrocycleStoreState>((set, get) => ({
  activeDays: EMPTY_MICROCYCLE_DAYS.map((d) => ({ ...d })),
  isLoading: false,
  activeIsoWeekDates: computeIsoWeekDates(),
  acwr: EMPTY_ACWR,

  recompute: () => {
    const dates = computeIsoWeekDates();
    const historyByDate = useTelemetryHistoryStore.getState().historyByDate;

    const dayLoad = (key: string) => {
      const hist = historyByDate[key]?.workout;
      const cloud = cloudByDay.get(key);
      return {
        vol: Math.max(
          hist?.hasData ? Number(hist.tonnageKg) || 0 : 0,
          cloud?.logVol ?? 0,
          cloud?.sessVol ?? 0,
        ),
        sets: Math.max(
          hist?.hasData ? Number(hist.completedSets) || 0 : 0,
          cloud?.logSets ?? 0,
          cloud?.sessSets ?? 0,
        ),
        title: (hist?.hasData && hist.routineName) || cloud?.title || null,
      };
    };

    const computed = EMPTY_MICROCYCLE_DAYS.map((baseDay, idx) => {
      const load = dayLoad(dates[idx].dateKey);
      return { ...baseDay, volume: load.vol, sets: load.sets, title: load.title };
    });

    const daily28 = Array.from({ length: 28 }, (_, i) => dayLoad(dateKeyOffset(27 - i)).vol);
    const isoDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const acwr = {
      ...computeAcwr(daily28),
      completionPct: weekCompletionPct(
        computed.map((d) => d.volume),
        isoDay,
        useConsultationStore.getState().frequencyDays || 4,
      ),
    };

    const prev = get().activeDays;
    const unchanged =
      prev.length === computed.length &&
      prev.every(
        (d, i) =>
          d.volume === computed[i].volume &&
          d.sets === computed[i].sets &&
          d.title === computed[i].title,
      );
    if (unchanged && get().acwr.ratio === acwr.ratio && get().acwr.historyDays === acwr.historyDays)
      return;
    set({ activeDays: computed, activeIsoWeekDates: dates, acwr });
  },

  refreshFromSupabase: async () => {
    set({ isLoading: true });
    try {
      const uid = await getAuthenticatedUserId();
      const dates = computeIsoWeekDates();
      // Built locally and swapped in at the end, so overlapping refreshes cannot add the same rows twice.
      const next = new Map<string, CloudDay>();
      if (uid) {
        const weekStart = localMidnightIso(dates[0].dateKey);
        const weekEnd = localMidnightIso(dates[6].dateKey, true);
        const chronicStart = localMidnightIso(dateKeyOffset(27));
        const [logsRes, sessRes] = await Promise.all([
          supabase
            .from('workout_logs')
            .select('weight_kg, reps, created_at')
            .eq('user_id', uid)
            .gte('created_at', weekStart)
            .lte('created_at', weekEnd)
            .order('created_at', { ascending: false })
            .limit(ROW_CAP),
          supabase
            .from('completed_sessions')
            .select('tonnage_kg, total_sets, title, completed_at, created_at')
            .eq('user_id', uid)
            .gte('created_at', chronicStart)
            .lte('created_at', weekEnd)
            .order('created_at', { ascending: false })
            .limit(ROW_CAP),
        ]);
        for (const r of Array.isArray(logsRes.data) ? logsRes.data : []) {
          const day = bucket(next, localDayKey(r.created_at));
          day.logVol += (Number(r.weight_kg) || 0) * (Number(r.reps) || 0);
          day.logSets += 1;
        }
        for (const s of Array.isArray(sessRes.data) ? sessRes.data : []) {
          if (
            String(s.title || '')
              .toLowerCase()
              .startsWith('cardio')
          )
            continue;
          const day = bucket(next, localDayKey(s.completed_at || s.created_at));
          day.sessVol += Number(s.tonnage_kg) || 0;
          day.sessSets += Number(s.total_sets) || 0;
          day.title = day.title || s.title || null;
        }
      }
      cloudByDay = next;
      set({ isLoading: false });
      get().recompute();
    } catch (err) {
      console.warn('[MicrocycleStore] Sync notice:', err);
      set({ isLoading: false });
      get().recompute();
    }
  },
}));

let lastHistory = useTelemetryHistoryStore.getState().historyByDate;
useTelemetryHistoryStore.subscribe((state) => {
  if (state.historyByDate === lastHistory) return;
  lastHistory = state.historyByDate;
  useMicrocycleStore.getState().recompute();
});
