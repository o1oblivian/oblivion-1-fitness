import { useEffect, useState } from 'react';
import { supabase } from '../../../../services/supabaseClient';
import { liveChannel } from '../../../../services/realtimeChannel';
import {
  EMPTY_STATS,
  StorefrontProgram,
  StorefrontStats,
  fetchStorefrontPrograms,
  fetchStorefrontStats,
} from '../../services/coachStorefront';
import { fetchLatestCoachFeedback } from '../../services/coachService';
import type { CoachFloorTab } from '../../store/useCoachViewStore';

interface FloorDataInput {
  coachId: string;
  tab: CoachFloorTab;
  /** Bumped after a program is published so the Programs tab reloads. */
  programsRevision: number;
}

/** Loads what the coach console shows: storefront numbers, programs, and the latest notes sent. */
export function useFloorData({ coachId, tab, programsRevision }: FloorDataInput) {
  const [storefront, setStorefront] = useState<StorefrontStats>(EMPTY_STATS);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!coachId) return;
    let live = true;
    void fetchStorefrontStats(coachId)
      .then((next) => live && setStorefront(next))
      .catch((error: unknown) => console.warn('[CoachFloor] Storefront stats failed', error));
    return () => {
      live = false;
    };
  }, [coachId]);

  useEffect(() => {
    if (!coachId || tab !== 'programs') return;
    let live = true;
    void fetchStorefrontPrograms(coachId)
      .then((next) => live && setPrograms(next))
      .catch((error: unknown) => {
        console.warn('[CoachFloor] Programs failed', error);
        if (live) setPrograms([]);
      });
    return () => {
      live = false;
    };
  }, [coachId, tab, programsRevision]);

  useEffect(() => {
    if (!coachId) return;
    const refresh = () =>
      void fetchLatestCoachFeedback(coachId)
        .then(setLatestFeedback)
        .catch((error: unknown) => console.warn('[CoachFloor] Latest feedback failed', error));
    refresh();
    const channel = liveChannel(`coach-feedback-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_messages',
          filter: `coach_id=eq.${coachId}`,
        },
        refresh,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coachId]);

  return {
    storefront,
    setStorefront,
    programs,
    latestFeedback,
    setLatestFeedback,
  };
}
