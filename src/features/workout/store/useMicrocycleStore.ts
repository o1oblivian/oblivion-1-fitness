import { create } from 'zustand';
import { supabase } from '../../../services/supabaseClient';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { DayStrainDetail, EMPTY_MICROCYCLE_DAYS } from '../components/microcycle/microcycleTypes';

export interface MicrocycleStoreState {
  activeDays: DayStrainDetail[];
  isLoading: boolean;
  activeIsoWeekDates: { dayLabel: string; dateKey: string; dayIndex: number }[];
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

export const useMicrocycleStore = create<MicrocycleStoreState>((set, get) => ({
  activeDays: EMPTY_MICROCYCLE_DAYS.map((d) => ({ ...d })),
  isLoading: false,
  activeIsoWeekDates: computeIsoWeekDates(),

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
      const dates = computeIsoWeekDates();
      const startIso = `${dates[0].dateKey}T00:00:00.000Z`;
      const endIso = `${dates[6].dateKey}T23:59:59.999Z`;

      const [{ data: logRows }, { data: sessionRows }] = await Promise.all([
        supabase.from('workout_logs').select('weight_kg, reps, created_at').gte('created_at', startIso).lte('created_at', endIso),
        supabase.from('completed_sessions').select('tonnage_kg, total_sets, title, completed_at, created_at').gte('created_at', startIso).lte('created_at', endIso),
      ]);

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

      set({ activeDays: computed, activeIsoWeekDates: dates, isLoading: false });
    } catch (err) {
      console.warn('[MicrocycleStore] Sync notice:', err);
      set({ isLoading: false });
    }
  },
}));
