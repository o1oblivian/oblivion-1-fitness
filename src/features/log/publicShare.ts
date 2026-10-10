/** Public site the store build will serve. Preview addresses are never shared. */
export const PUBLIC_SITE = 'https://oblivion1.club';

const INVITE_KEY = 'o1_invite_code';
const PENDING_KEY = 'o1_pending_invite';

export function getOrCreateInviteCode(handle: string): string {
  try {
    const existing = localStorage.getItem(INVITE_KEY);
    if (existing && existing.length >= 4) return existing;
  } catch {
    /* private mode */
  }
  const stem = (handle || 'athlete').replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase() || 'ATHLETE';
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
  return `${PUBLIC_SITE}/?invite=${encodeURIComponent(code)}`;
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
}): Promise<'shared' | 'copied' | 'failed'> {
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
    if ((error as { name?: string })?.name === 'AbortError') return 'failed';
  }
  const ok = await copyText(`${options.text}\n${options.url}`);
  return ok ? 'copied' : 'failed';
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
