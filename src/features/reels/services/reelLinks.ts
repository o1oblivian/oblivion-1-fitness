import { PUBLIC_SITE } from '../../log/publicShare';

const PENDING_KEY = 'o1_pending_reel_link';
export const REEL_LINK_EVENT = 'o1-reel-link';

export function reelUrl(reelId: string): string {
  return `${PUBLIC_SITE}/join?reel=${encodeURIComponent(reelId)}`;
}

function reelIdFrom(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  return url.searchParams.get('reel')?.trim().slice(0, 120) || null;
}

/** Keep ?reel= from a web URL or app link until the main layout can open the player. */
export function captureReelLink(raw: string): boolean {
  const reelId = reelIdFrom(raw);
  if (!reelId) return false;
  try {
    sessionStorage.setItem(PENDING_KEY, reelId);
  } catch (error) {
    // Storage is blocked (private mode); the event below still opens the reel while the app is running.
    console.warn('[ReelLinks] Could not keep the reel link for later', error);
  }
  window.dispatchEvent(new CustomEvent(REEL_LINK_EVENT, { detail: reelId }));
  return true;
}

/** The reel id from a link that arrived before the layout mounted, read once. */
export function consumeReelLink(): string | null {
  try {
    const reelId = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return reelId || null;
  } catch (error) {
    console.warn('[ReelLinks] Could not read the pending reel link', error);
    return null;
  }
}
