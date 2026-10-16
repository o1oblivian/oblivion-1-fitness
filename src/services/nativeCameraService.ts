import { Capacitor } from '@capacitor/core';

const VIDEO_CONSTRAINTS: MediaStreamConstraints[] = [
  { audio: false, video: { facingMode: { exact: 'environment' } } },
  { audio: false, video: { facingMode: { ideal: 'environment' } } },
  { audio: false, video: true },
];

export async function startEnvironmentCamera(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera is unavailable in this browser context.');
  }

  let lastError: unknown;
  for (const constraints of VIDEO_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Camera permission denied or unavailable.');
}

export function waitForVideoFrames(video: HTMLVideoElement, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('Camera stream produced no frames (black screen).'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* ignore */
    }
  });
}

export type PhotoSource = 'camera' | 'photos';

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
