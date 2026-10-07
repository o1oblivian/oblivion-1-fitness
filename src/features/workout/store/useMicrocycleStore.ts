import { create } from 'zustand';
import { supabase } from '../../../services/supabaseClient';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { DayStrainDetail, EMPTY_MICROCYCLE_DAYS } from '../components/microcycle/microcycleTypes';
import { computeAcwr, weekCompletionPct, AcwrSnapshot } from '../../../utils/acwrMath';
import { getAuthenticatedUserId } from '../../../services/authUser';

export interface MicrocycleStoreState {
  activeDays: DayStrainDetail[];
  isLoading: boolean;
  activeIsoWeekDates: { dayLabel: string; dateKey: string; dayIndex: number }[];
  acwr: AcwrSnapshot;
  refreshFromSupabase: () => Promise<void>;
  updateDayVolumeOptimistic: (dateKey: string, tonnage: number, setsCount: number, title?: string) => void;
}

export function computeIsoWeekDates(): { dayLabel: string; dateKey: string; dayIndex: number }[] {
  const now = new Date();
  const jsDay = now.getDay();
  const isoDay = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon..6=Sun
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

const EMPTY_ACWR: AcwrSnapshot = { acuteKg: 0, chronicKg: 0, ratio: null, label: '--', completionPct: null, calibrating: true, historyDays: 0 };

function dateKeyOffset(daysBack: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useMicrocycleStore = create<MicrocycleStoreState>((set, get) => ({
  activeDays: EMPTY_MICROCYCLE_DAYS.map((d) => ({ ...d })),
  isLoading: false,
  activeIsoWeekDates: computeIsoWeekDates(),
  acwr: EMPTY_ACWR,

  updateDayVolumeOptimistic: (dateKey: string, tonnage: number, setsCount: number, title?: string) => {
    const dates = get().activeIsoWeekDates;
    const targetIdx = dates.findIndex((d) => d.dateKey === dateKey);
    if (targetIdx === -1) return;

    set((state) => {
      const nextDays = state.activeDays.map((d, i) => {
        if (i !== targetIdx) return d;
        const vol = Math.max(0, tonnage);
        const st = Math.max(0, setsCount);
        return {
          ...d,
          volume: vol,
          sets: st,
          title: title || (vol > 0 ? 'Resistance Training' : 'Rest & Prep'),
          split: vol > 0 ? (title?.toUpperCase() || 'STRENGTH') : 'REST',
          strainScore: vol > 0 ? Math.min(10, Number((4 + vol / 1000).toFixed(1))) : 0,
        };
      });
      return { activeDays: nextDays };
    });
  },

  refreshFromSupabase: async () => {
    set({ isLoading: true });
    try {
      const uid = await getAuthenticatedUserId();
      const dates = computeIsoWeekDates();
      const startIso = `${dates[0].dateKey}T00:00:00.000Z`;
      const endIso = `${dates[6].dateKey}T23:59:59.999Z`;
      const chronicStart = `${dateKeyOffset(27)}T00:00:00.000Z`;

      let logRows: any[] = [];
      let sessionRows: any[] = [];
      if (uid) {
        const [logsRes, sessRes] = await Promise.all([
          supabase.from('workout_logs').select('weight_kg, reps, created_at, user_id').eq('user_id', uid).gte('created_at', startIso).lte('created_at', endIso),
          supabase.from('completed_sessions').select('tonnage_kg, total_sets, title, completed_at, created_at, user_id').eq('user_id', uid).gte('created_at', chronicStart).lte('created_at', endIso),
        ]);
        logRows = Array.isArray(logsRes.data) ? logsRes.data : [];
        sessionRows = Array.isArray(sessRes.data) ? sessRes.data : [];
      }

      const historyByDate = useTelemetryHistoryStore.getState().historyByDate;
      const computed = EMPTY_MICROCYCLE_DAYS.map((baseDay, idx) => {
        const { dateKey } = dates[idx];
        const dayLogs = Array.isArray(logRows) ? logRows.filter((r: any) => r.created_at?.startsWith(dateKey)) : [];
        const logsVol = dayLogs.reduce((acc: number, r: any) => acc + (Number(r.weight_kg || 0) * Number(r.reps || 0)), 0);
        const logsSets = dayLogs.length;

        const hist = historyByDate[dateKey]?.workout;
        const histVol = hist?.hasData ? (hist.tonnageKg || 0) : 0;
        const histSets = hist?.hasData ? (hist.completedSets || 0) : 0;

        const daySession = Array.isArray(sessionRows) ? sessionRows.find((s: any) => (s.completed_at || s.created_at)?.startsWith(dateKey)) : null;
        const sessVol = Number(daySession?.tonnage_kg) || 0;
        const sessSets = Number(daySession?.total_sets) || 0;

        const finalVol = Math.max(logsVol, histVol, sessVol);
        const finalSets = Math.max(logsSets, histSets, sessSets);
        const sessionTitle = hist?.routineName || daySession?.title || (finalVol > 0 ? baseDay.title : 'Rest & Prep');

        return {
          ...baseDay,
          volume: finalVol,
          sets: finalSets,
          title: sessionTitle,
          split: finalVol > 0 ? (hist?.routineName ? hist.routineName.toUpperCase() : baseDay.split) : 'REST',
          strainScore: finalVol > 0 ? Math.min(10, Number((4 + finalVol / 1000).toFixed(1))) : 0,
        };
      });

      const historyByDateAll = useTelemetryHistoryStore.getState().historyByDate;
      const daily28 = Array.from({ length: 28 }, (_, i) => {
        const key = dateKeyOffset(27 - i);
        const hist = historyByDateAll[key]?.workout;
        const histVol = hist?.hasData ? Number(hist.tonnageKg || 0) : 0;
        const sessVol = Array.isArray(sessionRows)
          ? sessionRows
              .filter((s: any) => (s.completed_at || s.created_at)?.startsWith(key))
              .reduce((acc: number, s: any) => acc + (Number(s.tonnage_kg) || 0), 0)
          : 0;
        return Math.max(histVol, sessVol);
      });
      const isoDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
      const acwr = {
        ...computeAcwr(daily28),
        completionPct: weekCompletionPct(computed.map((d) => d.volume), isoDay),
      };

      set({ activeDays: computed, activeIsoWeekDates: dates, acwr, isLoading: false });
    } catch (err) {
      console.warn('[MicrocycleStore] Sync notice:', err);
      set({ isLoading: false });
    }
  },
}));
