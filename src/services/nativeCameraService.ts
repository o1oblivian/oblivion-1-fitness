import { Capacitor } from '@capacitor/core';

export type PhotoSource = 'camera' | 'photos';

const MAX_PHOTO_PX = 1600;

/** Opens the phone camera or the photo picker and returns a data URL. Throws with the reason it failed. */
export async function capturePhotoDataUrl(source: PhotoSource): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Open the installed app to use the camera.');
  }
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const permissions = await Camera.requestPermissions(source === 'camera' ? { permissions: ['camera'] } : { permissions: ['photos', 'camera'] });
  const state = source === 'camera' ? permissions.camera : permissions.photos;
  if (state === 'denied') {
    throw new Error(source === 'camera' ? 'Camera permission was denied. Allow the camera in phone settings.' : 'Photo access was denied. Allow photos in phone settings.');
  }
  const photo = await Camera.getPhoto({
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
  if (!photo.base64String) throw new Error('The camera returned an empty photo.');
  const mime = photo.format === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${photo.base64String}`;
}
