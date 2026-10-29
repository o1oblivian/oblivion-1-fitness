import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ isNative: true }));
const editor = vi.hoisted(() => ({
  edit: vi.fn(),
  removeListener: vi.fn(async () => undefined),
}));
const fs = vi.hoisted(() => ({
  writeFile: vi.fn(async () => ({ uri: 'file:///cache/in.mp4' })),
  appendFile: vi.fn(async () => undefined),
  getUri: vi.fn(async () => ({ uri: 'file:///cache/o1-source.mp4' })),
  deleteFile: vi.fn(async () => undefined),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => native.isNative,
    isPluginAvailable: () => true,
    convertFileSrc: (uri: string) => uri.replace('file://', 'https://localhost/_capacitor_file_'),
  },
}));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: fs,
}));
vi.mock('@whiteguru/capacitor-plugin-video-editor', () => ({
  VideoEditor: {
    edit: editor.edit,
    addListener: vi.fn(async () => ({ remove: editor.removeListener })),
  },
}));

import { compressVideo, MAX_UPLOAD_BYTES, VideoCompressionError } from './mediaCompressor';

const MB = 1024 * 1024;

class FakeVideo {
  onloadedmetadata: (() => void) | null = null;
  onseeked: (() => void) | null = null;
  onerror: (() => void) | null = null;
  preload = '';
  muted = false;
  playsInline = false;
  currentTime = 0;
  duration = 12.4;
  videoWidth = 3840;
  videoHeight = 2160;
  set src(_value: string) {
    queueMicrotask(() => {
      this.onloadedmetadata?.();
      queueMicrotask(() => this.onseeked?.());
    });
  }
}

class FakeFileReader {
  result: string | null = null;
  error: Error | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = `data:;base64,${Buffer.from(buffer).toString('base64')}`;
      this.onload?.();
    });
  }
}

function clip(sizeBytes: number, name = 'training.mov'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'video/quicktime' });
}

function encodedOutput(sizeBytes: number) {
  editor.edit.mockResolvedValueOnce({
    file: { name: 'VID.mp4', path: '/cache/VID.mp4', type: 'video/mp4', size: sizeBytes },
  });
  fetchedSizes.push(sizeBytes);
}

let fetchedSizes: number[] = [];

beforeEach(() => {
  native.isNative = true;
  fetchedSizes = [];
  editor.edit.mockReset();
  for (const fn of Object.values(fs)) fn.mockClear();
  editor.removeListener.mockClear();
  vi.stubGlobal('document', {
    createElement: (tag: string) =>
      tag === 'video' ? new FakeVideo() : { width: 0, height: 0, getContext: () => null },
  });
  vi.stubGlobal('FileReader', FakeFileReader);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      const size = fetchedSizes.shift() ?? 0;
      return { ok: true, status: 200, blob: async () => new Blob([new Uint8Array(size)]) };
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('compressVideo in the installed app', () => {
  it('re-encodes the clip and reports the size of the bytes it returns', async () => {
    encodedOutput(2 * MB);
    const progress: number[] = [];
    const result = await compressVideo(clip(10 * MB), { onProgress: (p) => progress.push(p) });

    expect(result.compressed).toBe(true);
    expect(result.file).not.toBeInstanceOf(File);
    expect(result.file.size).toBe(2 * MB);
    expect(result.compressedSizeBytes).toBe(result.file.size);
    expect(result.originalSizeBytes).toBe(10 * MB);
    expect(result.savingsPercent).toBe(80);
    expect(result.file.type).toBe('video/mp4');
    expect(progress[progress.length - 1]).toBe(100);
  });

  it('asks the encoder for 1080p H.264 output and reports the encoded dimensions', async () => {
    encodedOutput(2 * MB);
    const result = await compressVideo(clip(10 * MB));

    expect(editor.edit).toHaveBeenCalledTimes(1);
    expect(editor.edit.mock.calls[0][0].transcode).toMatchObject({
      width: 1920,
      height: 1920,
      keepAspectRatio: true,
    });
    expect([result.width, result.height]).toEqual([1920, 1080]);
    expect(result.durationSecs).toBe(12);
  });

  it('copies the picked clip into the cache in chunks and removes both temporary files', async () => {
    encodedOutput(2 * MB);
    await compressVideo(clip(7 * MB));

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.appendFile).toHaveBeenCalledTimes(2); // 7 MB in 3 MB chunks
    expect(fs.deleteFile).toHaveBeenCalledTimes(2);
    expect(editor.removeListener).toHaveBeenCalledTimes(1);
  });

  it('tries 720p when the 1080p encode is still over the upload limit', async () => {
    encodedOutput(MAX_UPLOAD_BYTES + MB);
    encodedOutput(30 * MB);
    const result = await compressVideo(clip(MAX_UPLOAD_BYTES + 20 * MB));

    expect(editor.edit.mock.calls.map((call) => call[0].transcode.width)).toEqual([1920, 1280]);
    expect(result.compressedSizeBytes).toBe(30 * MB);
    expect(result.compressed).toBe(true);
  });

  it('refuses a clip that stays over the limit after both attempts', async () => {
    encodedOutput(MAX_UPLOAD_BYTES + 2 * MB);
    encodedOutput(MAX_UPLOAD_BYTES + MB);
    await expect(compressVideo(clip(MAX_UPLOAD_BYTES + 30 * MB))).rejects.toMatchObject({
      code: 'too-large',
    });
  });

  it('keeps the original, with no savings, when the encode is not smaller', async () => {
    encodedOutput(6 * MB);
    const original = clip(4 * MB);
    const result = await compressVideo(original);

    expect(result.compressed).toBe(false);
    expect(result.file).toBe(original);
    expect(result.savingsPercent).toBe(0);
    expect(result.compressedSizeBytes).toBe(result.originalSizeBytes);
  });

  it('uses the original and says why when the encoder fails on a clip that fits', async () => {
    editor.edit.mockRejectedValueOnce(new Error('codec unavailable'));
    const original = clip(5 * MB);
    const result = await compressVideo(original);

    expect(result.compressed).toBe(false);
    expect(result.file).toBe(original);
    expect(result.savingsPercent).toBe(0);
    expect(result.compressionNote).toContain('codec unavailable');
  });

  it('raises an error when the encoder fails on a clip that cannot be uploaded as is', async () => {
    editor.edit.mockRejectedValue(new Error('codec unavailable'));
    const failure = compressVideo(clip(MAX_UPLOAD_BYTES + MB));
    await expect(failure).rejects.toBeInstanceOf(VideoCompressionError);
    await expect(failure).rejects.toMatchObject({ code: 'transcode-failed' });
  });
});

describe('compressVideo in a desktop browser', () => {
  beforeEach(() => {
    native.isNative = false;
  });

  it('returns the original untouched and reports no savings', async () => {
    const original = clip(8 * MB);
    const result = await compressVideo(original);

    expect(editor.edit).not.toHaveBeenCalled();
    expect(result.compressed).toBe(false);
    expect(result.file).toBe(original);
    expect(result.compressedSizeBytes).toBe(8 * MB);
    expect(result.savingsPercent).toBe(0);
    expect(result.compressionNote).toBeTruthy();
  });

  it('refuses a clip over the upload limit', async () => {
    await expect(compressVideo(clip(MAX_UPLOAD_BYTES + MB))).rejects.toMatchObject({
      code: 'too-large',
    });
  });
});
