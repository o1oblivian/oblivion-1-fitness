import { useMemo } from 'react';
import { create } from 'zustand';
import { safeStorage } from '../../../utils/safeStorage';
import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { blockUser, fetchBlockedIds, reportUser } from '../../../services/safetyService';
import type { ExploreReelItem } from '../reelTypes';

const HIDDEN_KEY = 'o1fc_hidden_reels_v1';
const BLOCKED_KEY = 'o1fc_blocked_coaches_v1';

export const REEL_REPORT_REASONS = [
  'Copyrighted music or footage',
  'Nudity or sexual content',
  'Hate or harassment',
  'Dangerous or unsafe advice',
  'Spam or misleading',
  'Something else',
] as const;

type IdSet = Record<string, true>;

const readSet = (key: string): IdSet => {
  const raw = safeStorage.getItem<IdSet>(key, {});
  return raw && typeof raw === 'object' ? raw : {};
};

export type ReportOutcome = 'sent' | 'signed-out' | 'failed';

interface ReelSafetyState {
  hiddenReels: IdSet;
  blockedCoaches: IdSet;
  hydrate: () => Promise<void>;
  /** Hides the reel for this member straight away, then files the report for the team. */
  reportReel: (reel: ExploreReelItem, reason: string, details: string) => Promise<ReportOutcome>;
  /** Hides every reel from the coach on this device and blocks them on the account when signed in. */
  blockCoach: (coachId: string) => Promise<void>;
}

async function fileReelReport(me: string, reel: ExploreReelItem, reason: string, details: string): Promise<boolean> {
  const note = [`Reel: ${reel.title} (${reel.id})`, details].filter(Boolean).join('\n').slice(0, 2000);
  const { error } = await supabase.from('safety_reports').insert({
    reporter_id: me,
    reported_id: reel.coach.id,
    context: 'reel',
    reel_id: reel.id,
    reason: reason.slice(0, 200),
    details: note,
  });
  if (!error) return true;
  return reportUser({ reportedId: reel.coach.id, name: reel.coach.name, reason, details: note, context: 'coach' });
}

export const useReelSafetyStore = create<ReelSafetyState>((set, get) => ({
  hiddenReels: readSet(HIDDEN_KEY),
  blockedCoaches: readSet(BLOCKED_KEY),

  hydrate: async () => {
    const ids = await fetchBlockedIds();
    if (ids.length === 0) return;
    const blockedCoaches = { ...get().blockedCoaches };
    for (const id of ids) blockedCoaches[id] = true;
    safeStorage.setItem(BLOCKED_KEY, blockedCoaches);
    set({ blockedCoaches });
  },

  reportReel: async (reel, reason, details) => {
    const hiddenReels = { ...get().hiddenReels, [reel.id]: true as const };
    safeStorage.setItem(HIDDEN_KEY, hiddenReels);
    set({ hiddenReels });
    const me = await getAuthenticatedUserId();
    if (!me) return 'signed-out';
    if (me === reel.coach.id) return 'sent';
    return (await fileReelReport(me, reel, reason, details)) ? 'sent' : 'failed';
  },

  blockCoach: async (coachId) => {
    if (!coachId) return;
    const blockedCoaches = { ...get().blockedCoaches, [coachId]: true as const };
    safeStorage.setItem(BLOCKED_KEY, blockedCoaches);
    set({ blockedCoaches });
    await blockUser(coachId);
  },
}));

export function isReelVisible(reel: ExploreReelItem, hidden: IdSet, blocked: IdSet): boolean {
  return !hidden[reel.id] && !(reel.coach?.id && blocked[reel.coach.id]);
}

/** Reels this member has not reported and whose coach they have not blocked. */
export function useVisibleReels(reels: ExploreReelItem[]): ExploreReelItem[] {
  const hidden = useReelSafetyStore((s) => s.hiddenReels);
  const blocked = useReelSafetyStore((s) => s.blockedCoaches);
  return useMemo(() => reels.filter((reel) => isReelVisible(reel, hidden, blocked)), [reels, hidden, blocked]);
}
