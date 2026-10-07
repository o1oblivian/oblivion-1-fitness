import { Capacitor } from '@capacitor/core';

export interface DeviceCoords {
  latitude: number;
  longitude: number;
}

export async function getDeviceCoordinates(): Promise<DeviceCoords | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
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
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}
