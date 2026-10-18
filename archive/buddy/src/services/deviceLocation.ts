import { Capacitor } from '@capacitor/core';

export interface DeviceCoords {
  latitude: number;
  longitude: number;
}

export type LocationRequest =
  { status: 'granted'; coords: DeviceCoords } | { status: 'blocked' | 'unavailable' };

/** Asks for location permission (shows the system prompt when the user has not decided yet), then reads a position. */
export async function requestDeviceLocation(): Promise<LocationRequest> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const current = await Geolocation.checkPermissions();
      const state =
        current.location === 'granted'
          ? current
          : await Geolocation.requestPermissions({ permissions: ['location'] });
      if (state.location !== 'granted') return { status: 'blocked' };
    } else if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      const state = await navigator.permissions.query({ name: 'geolocation' }).catch(() => null);
      if (state?.state === 'denied') return { status: 'blocked' };
    }
  } catch {
    /* fall through to a direct read, which prompts on web */
  }
  if (typeof navigator !== 'undefined' && !navigator.geolocation && !Capacitor.isNativePlatform())
    return { status: 'unavailable' };
  const coords = await getDeviceCoordinates();
  return coords ? { status: 'granted', coords } : { status: 'blocked' };
}

export async function getDeviceCoordinates(): Promise<DeviceCoords | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 300000,
      });
      const latitude = Number(pos.coords.latitude);
      const longitude = Number(pos.coords.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { latitude, longitude };
    }
  } catch {
    /* fall through to web */
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  });
}
