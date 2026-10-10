import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const API_ORIGIN = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
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
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
  } catch {
    /* fall through to window.open */
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
