import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isNative: vi.fn(() => true),
  requestPermissions: vi.fn(),
  getPhoto: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNative, getPlatform: () => 'ios' },
}));
vi.mock('@capacitor/camera', () => ({
  Camera: { requestPermissions: mocks.requestPermissions, getPhoto: mocks.getPhoto },
  CameraResultType: { Base64: 'base64' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS' },
}));

import {
  capturePhotoDataUrl,
  explainCameraError,
  isPhotoCancelled,
  PhotoCancelledError,
} from './nativeCameraService';

describe('capturePhotoDataUrl', () => {
  beforeEach(() => {
    mocks.isNative.mockReturnValue(true);
    mocks.requestPermissions
      .mockReset()
      .mockResolvedValue({ camera: 'granted', photos: 'granted' });
    mocks.getPhoto.mockReset().mockResolvedValue({ base64String: 'AAAA', format: 'jpeg' });
  });

  it('returns a data URL for a photo', async () => {
    await expect(capturePhotoDataUrl('camera', 1024)).resolves.toBe('data:image/jpeg;base64,AAAA');
    expect(mocks.getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'CAMERA',
        width: 1024,
        height: 1024,
        presentationStyle: 'fullscreen',
      }),
    );
  });

  it('asks only for the permission the source needs', async () => {
    await capturePhotoDataUrl('photos');
    expect(mocks.requestPermissions).toHaveBeenCalledWith({ permissions: ['photos'] });
    await capturePhotoDataUrl('camera');
    expect(mocks.requestPermissions).toHaveBeenLastCalledWith({ permissions: ['camera'] });
  });

  it('reports a closed camera as a cancel, not an error', async () => {
    mocks.getPhoto.mockRejectedValue(new Error('User cancelled photos app'));
    await expect(capturePhotoDataUrl('camera')).rejects.toBeInstanceOf(PhotoCancelledError);
  });

  it('never shows the plugin plist message', async () => {
    mocks.getPhoto.mockRejectedValue(
      new Error('You are missing NSPhotoLibraryAddUsageDescription in your Info.plist file.'),
    );
    const err = await capturePhotoDataUrl('camera').catch((e: Error) => e);
    expect((err as Error).message).not.toMatch(/plist|NS[A-Z]/);
  });

  it('points to the gallery when the camera is not available', async () => {
    mocks.getPhoto.mockRejectedValue(new Error('Camera not available while running in Simulator'));
    await expect(capturePhotoDataUrl('camera')).rejects.toThrow(/gallery/i);
  });

  it('explains a denied permission without the plugin wording', async () => {
    mocks.requestPermissions.mockResolvedValue({ camera: 'denied', photos: 'granted' });
    await expect(capturePhotoDataUrl('camera')).rejects.toThrow(/Settings/);
  });

  it('rejects in a browser with a plain sentence', async () => {
    mocks.isNative.mockReturnValue(false);
    await expect(capturePhotoDataUrl('camera')).rejects.toThrow(/installed app/);
  });
});

describe('error helpers', () => {
  it('recognises a cancel', () => {
    expect(isPhotoCancelled(new Error('User cancelled photos app'))).toBe(true);
    expect(isPhotoCancelled(new Error('Camera not available'))).toBe(false);
  });
  it('gives photo-picker failures their own sentence', () => {
    expect(explainCameraError(new Error('x'), 'photos')).toMatch(/photo could not be opened/i);
  });
});

describe('iOS Info.plist', () => {
  const plist = readFileSync(resolve(__dirname, '../../ios/App/App/Info.plist'), 'utf8');

  // @capacitor/camera rejects every getPhoto call on iOS unless all three keys exist.
  it.each([
    'NSCameraUsageDescription',
    'NSPhotoLibraryUsageDescription',
    'NSPhotoLibraryAddUsageDescription',
  ])('declares %s with a purpose string', (key) => {
    const match = plist.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`));
    expect(match?.[1].trim().length ?? 0).toBeGreaterThan(10);
  });
});
