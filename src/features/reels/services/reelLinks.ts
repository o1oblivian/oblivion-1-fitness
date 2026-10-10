import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { PUBLIC_SITE } from '../../log/publicShare';

const PENDING_KEY = 'o1_pending_reel_link';
export const REEL_LINK_EVENT = 'o1-reel-link';

export interface ReelLink {
  reelId?: string;
  coachId?: string;
}

/** `options` means no system share sheet exists here; the caller shows the in-app share options sheet. */
export type ShareResult = 'shared' | 'cancelled' | 'options';

export function reelUrl(reelId: string): string {
  return `${PUBLIC_SITE}/?reel=${encodeURIComponent(reelId)}`;
}

export function coachUrl(coachId: string): string {
  return `${PUBLIC_SITE}/?coach=${encodeURIComponent(coachId)}`;
}

function isCancel(error: unknown): boolean {
  const { name, message } = (error ?? {}) as { name?: string; message?: string };
  return name === 'AbortError' || /cancel/i.test(message ?? '');
}

export async function shareLink(data: { title: string; text: string; url: string }): Promise<ShareResult> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Share')) {
    try {
      await Share.share({ title: data.title, text: data.text, url: data.url, dialogTitle: `Share ${data.title}` });
      return 'shared';
    } catch (error) {
      if (isCancel(error)) return 'cancelled';
    }
  }
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (isCancel(error)) return 'cancelled';
    }
  }
  return 'options';
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
