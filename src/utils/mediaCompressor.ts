/**
 * Media compression for uploads.
 * Photos are resized and re-encoded to WebP on a canvas. Videos are re-encoded on the phone to
 * H.264/AAC at up to 1080p by the native VideoEditor plugin. Every size reported is the size of
 * the bytes that are returned.
 */
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { VideoEditor } from '@whiteguru/capacitor-plugin-video-editor';

export interface CompressedMediaResult {
  file: Blob | File;
  url: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercent: number;
  formattedOriginal: string;
  formattedCompressed: string;
  width: number;
  height: number;
  type: 'photo' | 'video';
  thumbnailUrl?: string;
  durationSecs?: number;
  /** True only when `file` holds re-encoded bytes. False means the original is returned as picked. */
  compressed: boolean;
  /** Why the original was kept, when `compressed` is false for a video. */
  compressionNote?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(val >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export interface PhotoCompressOptions {
  maxDimension?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp';
}

/**
 * Compresses an image file (JPEG, PNG, HEIC, WebP) using HTML5 Canvas.
 * Drops high-res 12-48MP smartphone photos (8-25 MB) down to crisp 150-350 KB WebP/JPEG.
 */
export async function compressPhoto(
  fileOrBlob: File | Blob,
  options: PhotoCompressOptions = {},
): Promise<CompressedMediaResult> {
  const { maxDimension = 1280, quality = 0.82, format = 'image/webp' } = options;

  const originalSizeBytes = fileOrBlob.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // Smooth resizing algorithm
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Try preferred format, fallback to image/jpeg if needed
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to jpeg
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                finish(fallbackBlob);
              },
              'image/jpeg',
              quality,
            );
            return;
          }
          finish(blob);
        },
        format,
        quality,
      );

      function finish(blob: Blob) {
        const compressedSizeBytes = blob.size;
        const savingsPercent =
          originalSizeBytes > 0
            ? Math.max(
                0,
                Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100),
              )
            : 0;

        const compressedUrl = URL.createObjectURL(blob);

        resolve({
          file: blob,
          url: compressedUrl,
          originalSizeBytes,
          compressedSizeBytes,
          savingsPercent,
          formattedOriginal: formatFileSize(originalSizeBytes),
          formattedCompressed: formatFileSize(compressedSizeBytes),
          width,
          height,
          type: 'photo',
          compressed: true,
        });
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image for compression: ${err}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Reads the poster frame, size and length straight from the clip. A field the phone cannot
 * report stays 0 or empty; nothing is filled in with a guess.
 */
async function extractVideoPoster(
  videoFileOrUrl: File | string,
  timeSecs: number = 0.5,
): Promise<{ thumbnailUrl: string; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url =
      typeof videoFileOrUrl === 'string' ? videoFileOrUrl : URL.createObjectURL(videoFileOrUrl);
    const release = () => {
      if (typeof videoFileOrUrl !== 'string') URL.revokeObjectURL(url);
    };

    let isResolved = false;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSecs, Math.max(0, (video.duration || 1) - 0.1));
    };

    video.onseeked = () => {
      if (isResolved) return;
      isResolved = true;

      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;

      try {
        // Poster scale (max 800px width/height for fast loading)
        const maxD = 800;
        let pWidth = width;
        let pHeight = height;
        if (pWidth > maxD || pHeight > maxD) {
          if (pWidth > pHeight) {
            pHeight = Math.round((pHeight * maxD) / pWidth);
            pWidth = maxD;
          } else {
            pWidth = Math.round((pWidth * maxD) / pHeight);
            pHeight = maxD;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = pWidth;
        canvas.height = pHeight;
        const ctx = pWidth > 0 && pHeight > 0 ? canvas.getContext('2d') : null;
        if (ctx) {
          ctx.drawImage(video, 0, 0, pWidth, pHeight);
          const thumbUrl =
            canvas.toDataURL('image/webp', 0.8) || canvas.toDataURL('image/jpeg', 0.8);
          release();
          resolve({ thumbnailUrl: thumbUrl, width, height, duration });
          return;
        }
      } catch (err) {
        console.warn('Canvas poster capture failed:', err);
      }

      release();
      resolve({ thumbnailUrl: '', width, height, duration });
    };

    video.onerror = () => {
      release();
      reject(new VideoCompressionError('unreadable', 'This video could not be read.'));
    };

    video.src = url;
  });
}

/** The media bucket rejects anything larger (`file_size_limit` in 20261011_media_storage.sql). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** 1080p keeps its short side at 1080 in either orientation, so the long side is 1920. */
const FULL_HD_LONG_EDGE = 1920;
/** Second attempt when a 1080p encode still exceeds the upload limit. */
const HD_LONG_EDGE = 1280;
/** A multiple of 3 bytes, so each base64 chunk joins the next without padding. */
const COPY_CHUNK_BYTES = 3 * 1024 * 1024;

export type VideoCompressionErrorCode = 'unreadable' | 'too-large' | 'transcode-failed';

export class VideoCompressionError extends Error {
  readonly code: VideoCompressionErrorCode;
  constructor(code: VideoCompressionErrorCode, message: string) {
    super(message);
    this.name = 'VideoCompressionError';
    this.code = code;
  }
}

export interface VideoCompressOptions {
  /** Longest side of the output in pixels. Defaults to 1920 (1080p). */
  maxLongEdge?: number;
  /** 0-100. */
  onProgress?: (pct: number) => void;
}

function percentSaved(originalBytes: number, finalBytes: number): number {
  if (originalBytes <= 0 || finalBytes >= originalBytes) return 0;
  return Math.round(((originalBytes - finalBytes) / originalBytes) * 100);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the video.'));
    reader.readAsDataURL(blob);
  });
}

/** Writes the picked clip into the app cache in chunks, so a long clip never sits in memory twice. */
async function copyToCache(file: File, name: string): Promise<string> {
  for (let offset = 0; offset < file.size; offset += COPY_CHUNK_BYTES) {
    const data = await blobToBase64(file.slice(offset, offset + COPY_CHUNK_BYTES));
    if (offset === 0) await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
    else await Filesystem.appendFile({ path: name, data, directory: Directory.Cache });
  }
  return (await Filesystem.getUri({ path: name, directory: Directory.Cache })).uri;
}

async function discard(uri: string | null): Promise<void> {
  if (!uri) return;
  try {
    await Filesystem.deleteFile({ path: uri });
  } catch {
    /* A cache file the system already removed needs no further action. */
  }
}

/**
 * Re-encodes the clip on the phone (MediaCodec on Android, AVFoundation on iOS) to H.264/AAC in an
 * MP4 no larger than `longEdge` pixels, and returns the encoded bytes.
 */
async function transcodeOnDevice(
  file: File,
  longEdge: number,
  onFraction: (fraction: number) => void,
): Promise<Blob> {
  const extension = /\.([a-z0-9]{2,4})$/i.exec(file.name)?.[1]?.toLowerCase() ?? 'mp4';
  const inputUri = await copyToCache(file, `o1-source-${Date.now()}.${extension}`);
  let outputUri: string | null = null;
  const progress = await VideoEditor.addListener('transcodeProgress', (info) => {
    const value = Number(info.progress);
    if (Number.isFinite(value))
      onFraction(Math.min(1, Math.max(0, value > 1 ? value / 100 : value)));
  });
  try {
    const { file: encoded } = await VideoEditor.edit({
      path: inputUri,
      transcode: { width: longEdge, height: longEdge, keepAspectRatio: true, fps: 30 },
    });
    outputUri = encoded.path.startsWith('/') ? `file://${encoded.path}` : encoded.path;
    const response = await fetch(Capacitor.convertFileSrc(outputUri));
    if (!response.ok) throw new Error(`The encoded file could not be read (${response.status}).`);
    const bytes = await response.blob();
    if (bytes.size === 0) throw new Error('The encoder produced an empty file.');
    return new Blob([bytes], { type: 'video/mp4' });
  } finally {
    await progress.remove();
    await discard(inputUri);
    await discard(outputUri);
  }
}

/**
 * Video compression for uploads. In the installed app the clip is physically re-encoded on the
 * phone to H.264/AAC at up to 1080p, and every size reported is the size of the bytes returned.
 * In a desktop browser there is no encoder, so the original is returned untouched and
 * `compressed` is false; `savingsPercent` is then 0. A clip that cannot fit the upload limit is
 * refused with a `VideoCompressionError`.
 */
export async function compressVideo(
  videoFile: File,
  options: VideoCompressOptions = {},
): Promise<CompressedMediaResult> {
  const originalSizeBytes = videoFile.size;
  const report = options.onProgress ?? (() => undefined);
  report(5);

  const { thumbnailUrl, width, height, duration } = await extractVideoPoster(videoFile, 0.5);
  report(15);

  let output: Blob = videoFile;
  let compressed = false;
  let compressionNote: string | undefined;
  let outWidth = width;
  let outHeight = height;

  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('VideoEditor')) {
    const longEdges = [...new Set([options.maxLongEdge ?? FULL_HD_LONG_EDGE, HD_LONG_EDGE])].sort(
      (a, b) => b - a,
    );
    try {
      let encoded: Blob | null = null;
      let usedEdge = longEdges[0];
      for (const edge of longEdges) {
        usedEdge = edge;
        encoded = await transcodeOnDevice(videoFile, edge, (fraction) =>
          report(15 + Math.round(fraction * 80)),
        );
        if (encoded.size <= MAX_UPLOAD_BYTES) break;
      }
      if (encoded && encoded.size < originalSizeBytes) {
        output = encoded;
        compressed = true;
        const longest = Math.max(width, height);
        if (longest > usedEdge) {
          const scale = usedEdge / longest;
          outWidth = Math.round((width * scale) / 2) * 2;
          outHeight = Math.round((height * scale) / 2) * 2;
        }
      } else {
        compressionNote = 'The clip was already smaller than a fresh encode, so it is kept as is.';
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn('[mediaCompressor] on-device encode failed:', reason);
      if (originalSizeBytes > MAX_UPLOAD_BYTES) {
        throw new VideoCompressionError(
          'transcode-failed',
          `This video could not be compressed on your phone (${reason}).`,
        );
      }
      compressionNote = `On-device compression failed (${reason}); the original is used.`;
    }
  } else {
    compressionNote =
      'Video compression runs in the installed app; this browser uploads the original.';
  }

  if (output.size > MAX_UPLOAD_BYTES) {
    const mb = (output.size / 1024 / 1024).toFixed(0);
    throw new VideoCompressionError(
      'too-large',
      `This video is ${mb} MB, over the ${MAX_UPLOAD_BYTES / 1024 / 1024} MB upload limit. Trim it and try again.`,
    );
  }

  report(100);
  const compressedSizeBytes = output.size;
  return {
    file: output,
    url: URL.createObjectURL(output),
    originalSizeBytes,
    compressedSizeBytes,
    savingsPercent: percentSaved(originalSizeBytes, compressedSizeBytes),
    formattedOriginal: formatFileSize(originalSizeBytes),
    formattedCompressed: formatFileSize(compressedSizeBytes),
    width: outWidth,
    height: outHeight,
    type: 'video',
    thumbnailUrl,
    durationSecs: Math.round(duration),
    compressed,
    compressionNote,
  };
}
