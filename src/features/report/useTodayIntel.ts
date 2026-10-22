import { useMemo } from 'react';
import { useBodyStatus } from '../bodyStatus/bodyStatus';
import { buildTodayIntel, type TodayIntel } from './todayIntel';
import { useOblivionReport } from './useOblivionReport';

/**
 * Today's call from the phone's own data. Every screen that shows readiness reads it from here,
 * so the hero, the Readiness sheet and the Intel panel can never disagree.
 */
export function useTodayIntel(): TodayIntel {
  const { report, sets, sleep } = useOblivionReport(false);
  const body = useBodyStatus();
  return useMemo(
    () => buildTodayIntel(report, sets, sleep, Date.now(), body),
    [report, sets, sleep, body],
  );
}
