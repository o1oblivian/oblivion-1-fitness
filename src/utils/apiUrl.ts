import { Capacitor } from '@capacitor/core';

// Cloud Run Production & Development Endpoints for Oblivion 1 Fitness Club
export const CLOUD_ENDPOINTS = [
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
 * Get full API endpoint URL for both Web and Android / iOS APK native environments
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. If custom environment variable is set
  const customEnvUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_URL || '').trim();
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
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Candidate URLs to try in priority order
  const urlsToTry: string[] = [];

  const customEnvUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_URL || '').trim();
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
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';

      // If it returned JSON (or appropriate status with JSON), accept it
      if (contentType.includes('application/json') && (response.ok || response.status === 400 || response.status === 422)) {
        return response;
      }

      // If it's OK and not HTML (or binary like images), accept
      if (response.ok && !contentType.includes('text/html')) {
        return response;
      }

      lastResponse = response;
    } catch (err) {
      // Endpoint failed, continue to next
    }
  }

  if (lastResponse) return lastResponse;

  // Ultimate fallback
  return fetch(cleanPath, options);
}
