import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { withNativeTimeout } from '../../utils/nativeTimeout';

/**
 * Where shared links land. This is the app's own server, which serves the /join page with the
 * Google Play and App Store buttons. Preview and LAN addresses are never shared.
 */
export const PUBLIC_SITE =
  String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') ||
  'https://oblivion-1-fitness.onrender.com';

const INVITE_KEY = 'o1_invite_code';
const PENDING_KEY = 'o1_pending_invite';

export function getOrCreateInviteCode(handle: string): string {
  try {
    const existing = localStorage.getItem(INVITE_KEY);
    if (existing && existing.length >= 4) return existing;
  } catch {
    /* private mode */
  }
  const stem =
    (handle || 'athlete')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 10)
      .toUpperCase() || 'ATHLETE';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = `${stem}-${suffix}`;
  try {
    localStorage.setItem(INVITE_KEY, code);
  } catch {
    /* private mode */
  }
  return code;
}

export function inviteUrl(code: string): string {
  return `${PUBLIC_SITE}/join?invite=${encodeURIComponent(code)}`;
}

export function readPendingInvite(): string {
  try {
    return localStorage.getItem(PENDING_KEY) || '';
  } catch {
    return '';
  }
}

export function savePendingInvite(code: string): void {
  const clean = code.trim().slice(0, 64);
  if (!clean) return;
  try {
    localStorage.setItem(PENDING_KEY, clean);
  } catch {
    /* private mode */
  }
}

/** Pull ?invite= from a web URL or a Capacitor app link and keep it on this device. */
export function captureInviteFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const invite = url.searchParams.get('invite');
    if (!invite) return null;
    savePendingInvite(invite);
    return invite;
  } catch {
    return null;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  } catch {
    return false;
  }
}

export async function shareContent(options: {
  title: string;
  text: string;
  url: string;
  file?: File | null;
}): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (isNativeShareReady()) {
    try {
      const uri = options.file ? await cacheFileForShare(options.file) : null;
      // Apps that receive an image often drop the separate link, so it travels in the text too.
      await Share.share(
        uri
          ? { title: options.title, text: `${options.text}\n${options.url}`, files: [uri] }
          : { title: options.title, text: options.text, url: options.url },
      );
      return 'shared';
    } catch (error) {
      if (isShareCancel(error)) return 'cancelled';
      // The system sheet failed; the browser share and the clipboard below still work.
    }
  }
  const payload: ShareData = {
    title: options.title,
    text: options.text,
    url: options.url,
  };
  try {
    if (options.file && navigator.canShare?.({ files: [options.file] })) {
      payload.files = [options.file];
    }
    if (navigator.share) {
      await navigator.share(payload);
      return 'shared';
    }
  } catch (error) {
    if (isShareCancel(error)) return 'cancelled';
  }
  const ok = await copyText(`${options.text}\n${options.url}`);
  return ok ? 'copied' : 'failed';
}

/**
 * Gets an image out of the app. On a phone this opens the share sheet (Save to Photos, Files,
 * Instagram and so on); on the web it downloads the file.
 */
export async function saveImage(file: File): Promise<'saved' | 'cancelled' | 'failed'> {
  if (isNativeShareReady()) {
    try {
      const uri = await cacheFileForShare(file);
      await Share.share({ files: [uri] });
      return 'saved';
    } catch (error) {
      return isShareCancel(error) ? 'cancelled' : 'failed';
    }
  }
  try {
    downloadFile(file);
    return 'saved';
  } catch {
    return 'failed';
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function isNativeShareReady(): boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.isPluginAvailable('Share') &&
    Capacitor.isPluginAvailable('Filesystem')
  );
}

function isShareCancel(error: unknown): boolean {
  const { name, message } = (error ?? {}) as { name?: string; message?: string };
  return name === 'AbortError' || /cancel/i.test(message ?? '');
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
}

/** Writes the image into the app cache so the system share sheet can read it. Returns its file URI. */
async function cacheFileForShare(file: File): Promise<string> {
  const name = `${Date.now()}-${file.name}`.replace(/[^A-Za-z0-9._-]/g, '_');
  const data = await fileToBase64(file);
  const written = await withNativeTimeout(
    Filesystem.writeFile({ path: name, data, directory: Directory.Cache }),
    'The image could not be prepared for sharing.',
  );
  return written.uri;
}
