import { PUBLIC_SITE, copyText } from '../../log/publicShare';

const PENDING_KEY = 'o1_pending_reel_link';
export const REEL_LINK_EVENT = 'o1-reel-link';

export interface ReelLink {
  reelId?: string;
  coachId?: string;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export function reelUrl(reelId: string): string {
  return `${PUBLIC_SITE}/?reel=${encodeURIComponent(reelId)}`;
}

export function coachUrl(coachId: string): string {
  return `${PUBLIC_SITE}/?coach=${encodeURIComponent(coachId)}`;
}

export async function shareLink(data: { title: string; text: string; url: string }): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(data.url)) ? 'copied' : 'failed';
}

export function shareMessage(result: ShareResult): string | null {
  return result === 'copied' ? 'Link copied' : null;
}

function parse(raw: string): ReelLink | null {
  try {
    const url = new URL(raw);
    const reelId = url.searchParams.get('reel')?.trim().slice(0, 120) || '';
    const coachId = url.searchParams.get('coach')?.trim().slice(0, 120) || '';
    if (!reelId && !coachId) return null;
    return { ...(reelId ? { reelId } : {}), ...(coachId ? { coachId } : {}) };
  } catch {
    return null;
  }
}

/** Keep ?reel= / ?coach= from a web URL or app link until the main layout can open it. */
export function captureReelLink(raw: string): boolean {
  const link = parse(raw);
  if (!link) return false;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(link));
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(REEL_LINK_EVENT));
  return true;
}

export function consumeReelLink(): ReelLink | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const link = JSON.parse(raw) as ReelLink;
    return link.reelId || link.coachId ? link : null;
  } catch {
    return null;
  }
}
