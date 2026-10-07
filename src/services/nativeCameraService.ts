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

/**
 * Native still capture via Capacitor Camera. Falls back to null on web / missing plugin.
 * Gallery is not requested — Camera source only — to stay within CAMERA permission.
 */
export async function captureNativeStill(): Promise<Blob | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      webUseInput: false,
    });
    if (!photo.dataUrl) return null;
    const res = await fetch(photo.dataUrl);
    return await res.blob();
  } catch (err) {
    console.warn('[Camera] Native Capacitor Camera capture unavailable:', err);
    return null;
  }
}
