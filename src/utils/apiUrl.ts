import { Capacitor } from '@capacitor/core';

// Cloud Run Production & Development Endpoints for Oblivion 1 Fitness Club
export const CLOUD_ENDPOINTS = [
  'https://ais-pre-ywak62jnfmfdpkjhp64wap-822845783036.asia-east1.run.app',
  'https://ais-dev-ywak62jnfmfdpkjhp64wap-822845783036.asia-east1.run.app',
];

/**
 * Determine if running in an Android APK, Capacitor native shell, or local file/localhost environment
 */
export function isNativeOrLocal(): boolean {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;

  const origin = window.location.origin || '';
  const protocol = window.location.protocol || '';

  return (
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
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

  // 2. If running inside Android APK / Capacitor native shell / localhost debug environment
  if (isNativeOrLocal()) {
    const primaryCloud = CLOUD_ENDPOINTS[0];
    return `${primaryCloud}${cleanPath}`;
  }

  // 3. Running in standard Web Browser on Cloud Run or Custom Domain
  return cleanPath;
}

/**
 * Robust fetch with automatic failover across Cloud Run endpoints for Android APK & Web
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const primaryUrl = getApiUrl(path);

  try {
    const response = await fetch(primaryUrl, options);
    if (response.ok || response.status === 400 || response.status === 422) {
      return response;
    }
  } catch (primaryErr) {
    console.warn(`Primary API call failed to ${primaryUrl}:`, primaryErr);
  }

  // If on Native APK or primary failed, try secondary cloud endpoint
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  for (const cloudBase of CLOUD_ENDPOINTS) {
    const candidateUrl = `${cloudBase}${cleanPath}`;
    if (candidateUrl === primaryUrl) continue;

    try {
      const fallbackResponse = await fetch(candidateUrl, options);
      if (fallbackResponse.ok || fallbackResponse.status === 400 || fallbackResponse.status === 422) {
        return fallbackResponse;
      }
    } catch (fallbackErr) {
      console.warn(`Fallback API call failed to ${candidateUrl}:`, fallbackErr);
    }
  }

  // Final attempt: standard fetch
  return fetch(primaryUrl, options);
}
