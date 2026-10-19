import { Capacitor } from '@capacitor/core';
import { NATIVE_PROMPT_TIMEOUT_MS, withNativeTimeout } from '../utils/nativeTimeout';

/** The camera or photo picker stays open while the person frames the shot, so this is generous. */
const CAMERA_SESSION_TIMEOUT_MS = 5 * 60_000;

export type PhotoSource = 'camera' | 'photos';

const MAX_PHOTO_PX = 1600;

/** Opens the phone camera or the photo picker and returns a data URL. Throws with the reason it failed. */
export async function capturePhotoDataUrl(source: PhotoSource): Promise<string> {
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
    // Resize on the phone before the photo crosses the native bridge. The scanners downscale to 1600px or less anyway.
    width: MAX_PHOTO_PX,
    height: MAX_PHOTO_PX,
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
