import { Capacitor } from '@capacitor/core';

// Cloud Run Production & Public Endpoints for Oblivion 1 Fitness Club
export const CLOUD_ENDPOINTS = [
  'https://o1fc-official-1.ai.studio',
  'https://ais-pre-ywak62jnfmfdpkjhp64wap-822845783036.asia-east1.run.app',
  'https://ais-dev-ywak62jnfmfdpkjhp64wap-822845783036.asia-east1.run.app',
];

/**
 * Determine if running inside a native mobile APK shell (Capacitor/Cordova)
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {}

  const origin = window.location.origin || '';
  const protocol = window.location.protocol || '';

  return (
    protocol.startsWith('capacitor') ||
    protocol.startsWith('file') ||
    origin === 'null' ||
    origin === ''
  );
}

/**
 * Retrieve custom API base URL from localStorage override or Vite environment variables
 */
export function getCustomApiUrl(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('ofc_custom_api_url');
      if (stored && stored.trim().startsWith('http')) {
        return stored.trim();
      }
    }
  } catch {}
  return (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_URL || '').trim();
}

/**
 * Get full API endpoint URL for both Web and Android / iOS APK native environments
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. If custom environment variable or localStorage override is set
  const customEnvUrl = getCustomApiUrl();
  if (customEnvUrl) {
    const base = customEnvUrl.endsWith('/') ? customEnvUrl.slice(0, -1) : customEnvUrl;
    return `${base}${cleanPath}`;
  }

  // 2. If running inside Android APK / Capacitor native shell
  if (isNativePlatform()) {
    const primaryCloud = CLOUD_ENDPOINTS[0];
    return `${primaryCloud}${cleanPath}`;
  }

  // 3. Running in standard Web Browser (AI Studio Preview, Localhost, or Cloud Run)
  return cleanPath;
}

/**
 * Robust fetch with automatic failover across Cloud Run endpoints for Android APK & Web.
 * Ensures the response is genuine application/json and not an AI Studio cookie/login redirect page.
 * Includes timeout protection to prevent hanging requests on unstable network connections.
 */
export async function apiFetch(path: string, options?: RequestInit, timeoutMs = 15000): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Candidate URLs to try in priority order
  const urlsToTry: string[] = [];

  const customEnvUrl = getCustomApiUrl();
  if (customEnvUrl) {
    const base = customEnvUrl.endsWith('/') ? customEnvUrl.slice(0, -1) : customEnvUrl;
    urlsToTry.push(`${base}${cleanPath}`);
  }

  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && !window.location.protocol.startsWith('file')) {
    urlsToTry.push(cleanPath);
  }

  for (const endpoint of CLOUD_ENDPOINTS) {
    const full = `${endpoint}${cleanPath}`;
    if (!urlsToTry.includes(full)) {
      urlsToTry.push(full);
    }
  }

  let lastResponse: Response | null = null;

  for (const url of urlsToTry) {
    try {
      let fetchOptions = options || {};
      if (!fetchOptions.signal && typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
        fetchOptions = { ...fetchOptions, signal: AbortSignal.timeout(timeoutMs) };
      }

      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type') || '';

      // If it returned JSON (or appropriate status with JSON), inspect status
      if (contentType.includes('application/json')) {
        // If the response is a 500 server error containing an expired key, failover to next endpoint
        if (response.status >= 500) {
          const cloned = response.clone();
          const text = await cloned.text().catch(() => '');
          if (text.includes('Expired API Key') || text.includes('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')) {
            console.warn(`[apiFetch] Endpoint ${url} returned expired key error, failing over to next candidate...`);
            lastResponse = response;
            continue;
          }
        }

        if (response.ok || response.status === 400 || response.status === 422 || response.status === 404) {
          return response;
        }
      }

      // If it's OK and not HTML (or binary like images), accept
      if (response.ok && !contentType.includes('text/html')) {
        return response;
      }

      lastResponse = response;
    } catch {
      // Endpoint timed out or failed, continue to next candidate
    }
  }

  if (lastResponse) return lastResponse;

  // Ultimate fallback
  return fetch(cleanPath, options);
}
