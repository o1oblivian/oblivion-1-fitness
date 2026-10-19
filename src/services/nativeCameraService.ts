import { Capacitor } from '@capacitor/core';
import { NATIVE_PROMPT_TIMEOUT_MS, withNativeTimeout } from '../utils/nativeTimeout';

/** The camera or photo picker stays open while the person frames the shot, so this is generous. */
const CAMERA_SESSION_TIMEOUT_MS = 5 * 60_000;

export type PhotoSource = 'camera' | 'photos';

const MAX_PHOTO_PX = 1600;

/** Loads the camera plugin ahead of the tap, so the camera opens without waiting for it. */
export function preloadNativeCamera(): void {
  if (Capacitor.isNativePlatform()) void import('@capacitor/camera').catch(() => undefined);
}

/**
 * Opens the phone camera or the photo picker and returns a data URL. Throws with the reason it failed.
 * `maxPx` caps the longer side; a smaller photo crosses the native bridge and uploads sooner.
 */
export async function capturePhotoDataUrl(
  source: PhotoSource,
  maxPx: number = MAX_PHOTO_PX,
): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Open the installed app to use the camera.');
  }
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const permissions = await withNativeTimeout(
    Camera.requestPermissions(
      source === 'camera' ? { permissions: ['camera'] } : { permissions: ['photos', 'camera'] },
    ),
    'The camera permission prompt did not answer. Close the app, open it again and retry.',
    NATIVE_PROMPT_TIMEOUT_MS,
  );
  const state = source === 'camera' ? permissions.camera : permissions.photos;
  if (state === 'denied') {
    throw new Error(
      source === 'camera'
        ? 'Camera permission was denied. Allow the camera in phone settings.'
        : 'Photo access was denied. Allow photos in phone settings.',
    );
  }
  const photoRequest = Camera.getPhoto({
    quality: 85,
    // Resize on the phone before the photo crosses the native bridge.
    width: maxPx,
    height: maxPx,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
    correctOrientation: true,
    webUseInput: false,
  });
  const photo = await withNativeTimeout(
    photoRequest,
    'The camera did not answer. Close the app, open it again and retry.',
    CAMERA_SESSION_TIMEOUT_MS,
  );
  if (!photo.base64String) throw new Error('The camera returned an empty photo.');
  const mime = photo.format === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${photo.base64String}`;
}
