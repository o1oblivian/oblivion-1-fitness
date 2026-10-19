import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { withNativeTimeout } from '../utils/nativeTimeout';

const API_ORIGIN = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (API_ORIGIN && Capacitor.isNativePlatform()) return `${API_ORIGIN}${p}`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLan =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if (isLan || !API_ORIGIN) return p;
  }
  if (!API_ORIGIN) return p;
  return `${API_ORIGIN}${p}`;
}

/**
 * fetch for the app's own server. The installed app runs on https://localhost, so the WebView
 * would block cross-origin calls; on the phone the request goes through native HTTP instead.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  if (!Capacitor.isNativePlatform() || !/^https?:\/\//i.test(url)) return fetch(url, init);
  const headers: Record<string, string> = {};
  new Headers(init.headers).forEach((value, key) => {
    headers[key] = value;
  });
  let data: unknown;
  if (typeof init.body === 'string') {
    try {
      data = JSON.parse(init.body);
    } catch {
      data = init.body;
    }
  }
  const request = CapacitorHttp.request({
    url,
    method: (init.method || 'GET').toUpperCase(),
    headers,
    data,
    connectTimeout: 30_000,
    readTimeout: 90_000,
  });
  const signal = init.signal;
  const res = signal
    ? await Promise.race([
        request,
        new Promise<never>((_, reject) => {
          const abort = () => reject(new DOMException('Request aborted', 'AbortError'));
          if (signal.aborted) abort();
          else signal.addEventListener('abort', abort, { once: true });
        }),
      ])
    : await request;
  const status = res.status >= 200 && res.status <= 599 ? res.status : 500;
  const empty = status === 204 || status === 205 || status === 304;
  const body = empty
    ? null
    : typeof res.data === 'string'
      ? res.data
      : JSON.stringify(res.data ?? null);
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

const WARM_EVERY_MS = 4 * 60_000;
let lastWarmAt = 0;

/**
 * Wakes the hosted server and opens the connection before a scan or a meal search needs it.
 * An idle instance can take most of a minute to start, so the first photo would otherwise pay for it.
 * Safe to call as often as you like; it pings at most once every few minutes and never throws.
 */
export function warmApi(): void {
  const now = Date.now();
  if (now - lastWarmAt < WARM_EVERY_MS) return;
  lastWarmAt = now;
  void apiFetch('/api/health').catch(() => {
    lastWarmAt = 0;
  });
}

export const LEGAL_URLS = {
  privacy: `${API_ORIGIN}/privacy`,
  terms: `${API_ORIGIN}/terms`,
  deleteAccount: `${API_ORIGIN}/delete-account`,
} as const;

export async function openLegalUrl(kind: 'privacy' | 'terms' | 'delete-account'): Promise<void> {
  const url =
    kind === 'privacy'
      ? LEGAL_URLS.privacy
      : kind === 'terms'
        ? LEGAL_URLS.terms
        : LEGAL_URLS.deleteAccount;
  await openExternalUrl(url);
}

/** Opens a web page in the system in-app browser on a phone (Safari / Custom Tabs), or a new tab on the web. */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await withNativeTimeout(Browser.open({ url }), 'The in-app browser did not open.');
      return;
    }
  } catch {
    /* fall through to window.open */
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
