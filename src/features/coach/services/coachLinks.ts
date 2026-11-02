import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { PUBLIC_SITE } from '../../log/publicShare';

const PENDING_KEY = 'o1_pending_coach_link';
export const COACH_LINK_EVENT = 'o1-coach-link';

/** `options` means no system share sheet exists here; the caller shows the in-app share options sheet. */
export type ShareResult = 'shared' | 'cancelled' | 'options';

export function coachUrl(coachId: string): string {
  return `${PUBLIC_SITE}/join?coach=${encodeURIComponent(coachId)}`;
}

function isCancel(error: unknown): boolean {
  const { name, message } = (error ?? {}) as { name?: string; message?: string };
  return name === 'AbortError' || /cancel/i.test(message ?? '');
}

export async function shareLink(data: {
  title: string;
  text: string;
  url: string;
}): Promise<ShareResult> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Share')) {
    try {
      await Share.share({
        title: data.title,
        text: data.text,
        url: data.url,
        dialogTitle: `Share ${data.title}`,
      });
      return 'shared';
    } catch (error) {
      if (isCancel(error)) return 'cancelled';
      console.warn('[CoachLinks] System share sheet failed', error);
    }
  }
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (isCancel(error)) return 'cancelled';
      console.warn('[CoachLinks] Web share failed', error);
    }
  }
  return 'options';
}

function coachIdFrom(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  return url.searchParams.get('coach')?.trim().slice(0, 120) || null;
}

/** Keep ?coach= from a web URL or app link until the main layout can open the profile. */
export function captureCoachLink(raw: string): boolean {
  const coachId = coachIdFrom(raw);
  if (!coachId) return false;
  try {
    sessionStorage.setItem(PENDING_KEY, coachId);
  } catch (error) {
    // Storage is blocked (private mode); the event below still opens the profile while the app is running.
    console.warn('[CoachLinks] Could not keep the coach link for later', error);
  }
  window.dispatchEvent(new CustomEvent(COACH_LINK_EVENT, { detail: coachId }));
  return true;
}

/** The coach id from a link that arrived before the layout mounted, read once. */
export function consumeCoachLink(): string | null {
  try {
    const coachId = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return coachId || null;
  } catch (error) {
    console.warn('[CoachLinks] Could not read the pending coach link', error);
    return null;
  }
}
