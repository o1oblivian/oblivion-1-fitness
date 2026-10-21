import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../services/supabaseClient';
import { liveChannel } from '../../../../services/realtimeChannel';
import {
  EMPTY_STATS,
  StorefrontProgram,
  StorefrontStats,
  fetchStorefrontPrograms,
  fetchStorefrontStats,
} from '../../../reels/services/coachStorefront';
import { fetchLatestCoachFeedback } from '../../services/coachService';
import { fetchCoachFilms, ProfileFilm } from '../../services/coachFilms';
import type { CoachFloorTab } from '../../store/useCoachViewStore';

interface FloorDataInput {
  coachId: string;
  tab: CoachFloorTab;
  /** Bumped after a program is published so the Programs tab reloads. */
  programsRevision: number;
  /** Reload the films when the coach publishes or removes a reel. */
  ownReelCount: number;
}

/** Loads what the coach console shows: films, storefront numbers, programs, and the latest notes sent. */
export function useFloorData({ coachId, tab, programsRevision, ownReelCount }: FloorDataInput) {
  const [films, setFilms] = useState<ProfileFilm[] | null>(null);
  const [filmsFailed, setFilmsFailed] = useState(false);
  const [storefront, setStorefront] = useState<StorefrontStats>(EMPTY_STATS);
  const [programs, setPrograms] = useState<StorefrontProgram[] | null>(null);
  const [latestFeedback, setLatestFeedback] = useState<Record<string, string>>({});

  const loadFilms = useCallback(async () => {
    if (!coachId) return;
    const rows = await fetchCoachFilms(coachId);
    setFilmsFailed(rows === null);
    if (rows) setFilms(rows);
    else setFilms((prev) => prev ?? []);
  }, [coachId]);

  useEffect(() => {
    void loadFilms();
  }, [loadFilms, ownReelCount]);

  useEffect(() => {
    if (!coachId) return;
    let live = true;
    void fetchStorefrontStats(coachId)
      .then((next) => live && setStorefront(next))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [coachId]);

  useEffect(() => {
    if (!coachId || tab !== 'programs') return;
    let live = true;
    void fetchStorefrontPrograms(coachId)
      .then((next) => live && setPrograms(next))
      .catch(() => live && setPrograms([]));
    return () => {
      live = false;
    };
  }, [coachId, tab, programsRevision]);

  useEffect(() => {
    if (!coachId) return;
    const refresh = () => void fetchLatestCoachFeedback(coachId).then(setLatestFeedback);
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
    films,
    filmsFailed,
    loadFilms,
    storefront,
    setStorefront,
    programs,
    latestFeedback,
    setLatestFeedback,
  };
}
