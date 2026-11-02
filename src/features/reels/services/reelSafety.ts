import { useMemo } from 'react';
import { create } from 'zustand';
import { safeStorage } from '../../../utils/safeStorage';
import { supabase } from '../../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { blockUser, fetchBlockedIds, reportUser } from '../../../services/safetyService';
import type { ExploreReelItem } from '../reelTypes';

const HIDDEN_KEY = 'o1fc_hidden_reels_v1';
/** Kept from when only coaches posted, so earlier blocks still apply. */
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
  /** Members whose reels are hidden on this device. */
  blockedAuthors: IdSet;
  hydrate: () => Promise<void>;
  /** Hides the reel for this member straight away, then files the report for the team. */
  reportReel: (reel: ExploreReelItem, reason: string, details: string) => Promise<ReportOutcome>;
  /** Hides every reel from the author on this device and blocks them on the account when signed in. */
  blockAuthor: (authorId: string) => Promise<void>;
}

async function fileReelReport(
  me: string,
  reel: ExploreReelItem,
  reason: string,
  details: string,
): Promise<boolean> {
  const note = [`Reel: ${reel.title} (${reel.id})`, details]
    .filter(Boolean)
    .join('\n')
    .slice(0, 2000);
  const { error } = await supabase.from('safety_reports').insert({
    reporter_id: me,
    reported_id: reel.author.id,
    context: 'reel',
    reel_id: reel.id,
    reason: reason.slice(0, 200),
    details: note,
  });
  if (!error) return true;
  console.error('[ReelSafety] Reel report failed; filing a member report instead', error);
  return reportUser({
    reportedId: reel.author.id,
    name: reel.author.name,
    reason,
    details: note,
    context: 'coach',
  });
}

export const useReelSafetyStore = create<ReelSafetyState>((set, get) => ({
  hiddenReels: readSet(HIDDEN_KEY),
  blockedAuthors: readSet(BLOCKED_KEY),

  hydrate: async () => {
    const ids = await fetchBlockedIds();
    if (ids.length === 0) return;
    const blockedAuthors = { ...get().blockedAuthors };
    for (const id of ids) blockedAuthors[id] = true;
    safeStorage.setItem(BLOCKED_KEY, blockedAuthors);
    set({ blockedAuthors });
  },

  reportReel: async (reel, reason, details) => {
    const hiddenReels = { ...get().hiddenReels, [reel.id]: true as const };
    safeStorage.setItem(HIDDEN_KEY, hiddenReels);
    set({ hiddenReels });
    const me = await getAuthenticatedUserId();
    if (!me) return 'signed-out';
    if (me === reel.author.id) return 'sent';
    return (await fileReelReport(me, reel, reason, details)) ? 'sent' : 'failed';
  },

  blockAuthor: async (authorId) => {
    if (!authorId) return;
    const blockedAuthors = { ...get().blockedAuthors, [authorId]: true as const };
    safeStorage.setItem(BLOCKED_KEY, blockedAuthors);
    set({ blockedAuthors });
    await blockUser(authorId);
  },
}));

export function isReelVisible(reel: ExploreReelItem, hidden: IdSet, blocked: IdSet): boolean {
  return !hidden[reel.id] && !(reel.author.id && blocked[reel.author.id]);
}

/** Reels this member has not reported and whose author they have not blocked. */
export function useVisibleReels(reels: ExploreReelItem[]): ExploreReelItem[] {
  const hidden = useReelSafetyStore((s) => s.hiddenReels);
  const blocked = useReelSafetyStore((s) => s.blockedAuthors);
  return useMemo(
    () => reels.filter((reel) => isReelVisible(reel, hidden, blocked)),
    [reels, hidden, blocked],
  );
}
