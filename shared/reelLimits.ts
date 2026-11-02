/** Reels one member can keep. Enforced by the `reels_member_limit` trigger (20261102_member_reels.sql). */
export const REEL_LIMIT = 6;

/** Longest clip a reel can be. */
export const REEL_MAX_SECS = 60;

/** Largest compressed reel accepted, so six reels stay near 150 MB per member. */
export const REEL_MAX_BYTES = 25 * 1024 * 1024;

/** Reels are re-encoded at 720p: sharp on a phone screen at a fraction of 1080p storage. */
export const REEL_LONG_EDGE = 1280;

/** "2 of 6 reels used". */
export function reelSlotsLine(used: number): string {
  const n = Math.max(0, Math.min(REEL_LIMIT, Math.floor(used)));
  return `${n} of ${REEL_LIMIT} reels used`;
}
