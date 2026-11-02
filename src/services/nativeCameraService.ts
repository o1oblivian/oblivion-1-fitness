import { Capacitor } from '@capacitor/core';
import { NATIVE_PROMPT_TIMEOUT_MS, withNativeTimeout } from '../utils/nativeTimeout';

/** The camera or photo picker stays open while the person frames the shot, so this is generous. */
const CAMERA_SESSION_TIMEOUT_MS = 5 * 60_000;

export type PhotoSource = 'camera' | 'photos';

const MAX_PHOTO_PX = 1600;

/** Thrown when the person closes the camera or the picker without choosing a photo. */
export class PhotoCancelledError extends Error {
  constructor() {
    super('Photo cancelled.');
    this.name = 'PhotoCancelledError';
  }
}

/** True when the person backed out. That is a choice, so callers show nothing for it. */
export function isPhotoCancelled(err: unknown): boolean {
  if (err instanceof PhotoCancelledError) return true;
  const text = err instanceof Error ? err.message : String(err ?? '');
  return /cancel|dismiss|user.?closed|1001/i.test(text);
}

const CAMERA_UNAVAILABLE =
  'The camera is not available on this device. Choose a photo from your gallery instead.';

/**
 * Turns whatever the camera plugin rejected with into one plain sentence. The plugin's own
 * wording (file paths, plist keys, error codes) never reaches the screen.
 */
export function explainCameraError(err: unknown, source: PhotoSource): string {
  const text = err instanceof Error ? err.message : String(err ?? '');
  if (/did not answer|did not open|permission prompt/i.test(text)) return text;
  if (/not available|simulator|no camera|unavailable/i.test(text)) return CAMERA_UNAVAILABLE;
  if (/denied|restricted|not authori[sz]ed|permission/i.test(text)) {
    return source === 'camera'
      ? 'Camera access is off. Turn it on for Oblivion 1 in your phone Settings, or choose a photo from your gallery.'
      : 'Photo access is off. Turn it on for Oblivion 1 in your phone Settings.';
  }
  return source === 'camera'
    ? 'The camera could not take the photo. Try again, or choose a photo from your gallery.'
    : 'That photo could not be opened. Try again or pick a different one.';
}

/** Loads the camera plugin ahead of the tap, so the camera opens without waiting for it. */
export function preloadNativeCamera(): void {
  if (Capacitor.isNativePlatform()) void import('@capacitor/camera').catch(() => undefined);
}

/**
 * Opens the phone camera or the photo picker and returns a data URL.
 * Throws `PhotoCancelledError` when the person backs out, and an Error with a plain sentence
 * for every other failure.
 * `maxPx` caps the longer side; a smaller photo crosses the native bridge and uploads sooner.
 */
export async function capturePhotoDataUrl(
  source: PhotoSource,
  maxPx: number = MAX_PHOTO_PX,
): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Open the installed app to use the camera.');
  }
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    // The photo picker only needs photo access. Asking for the camera there would be a prompt
    // the person has no reason to expect.
    const permissions = await withNativeTimeout(
      Camera.requestPermissions({ permissions: [source === 'camera' ? 'camera' : 'photos'] }),
      'The camera permission prompt did not answer. Close the app, open it again and retry.',
      NATIVE_PROMPT_TIMEOUT_MS,
    );
    const state = source === 'camera' ? permissions.camera : permissions.photos;
    if (state === 'denied') throw new Error('denied');
    const photoRequest = Camera.getPhoto({
      quality: 85,
      // Resize on the phone before the photo crosses the native bridge.
      width: maxPx,
      height: maxPx,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      correctOrientation: true,
      // Full screen on every device. A popover on iPad needs an anchor view the web layer cannot give.
      presentationStyle: 'fullscreen',
      webUseInput: false,
    });
    const photo = await withNativeTimeout(
      photoRequest,
      'The camera did not answer. Close the app, open it again and retry.',
      CAMERA_SESSION_TIMEOUT_MS,
    );
    if (!photo.base64String) throw new Error('empty photo');
    const mime = photo.format === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${photo.base64String}`;
  } catch (err) {
    if (isPhotoCancelled(err)) throw new PhotoCancelledError();
    throw new Error(explainCameraError(err, source));
  }
}
