import { loadSocialProfiles, getSocialUrl } from './socialProfilesStore';

export async function shareOrCopy(
  data: { title?: string; text?: string; url?: string },
  showToast?: (msg: string, type?: 'success' | 'error') => void
): Promise<boolean> {
  const shareText = data.url || data.text || '';

  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(shareText);
    showToast?.('Link copied to clipboard!', 'success');
    return true;
  } catch {
    showToast?.('Could not copy link', 'error');
    return false;
  }
}

export type SharePlatform = 'instagram' | 'x' | 'whatsapp' | 'strava' | 'facebook' | 'clipboard';

export interface ShareContent {
  text: string;
  title?: string;
  url?: string;
  imageFile?: File;
  hashtags?: string[];
}

function buildHashtags(tags?: string[]): string {
  if (!tags || tags.length === 0) return '';
  return ' ' + tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
}

export async function shareToInstagram(content: ShareContent, showToast?: (msg: string) => void): Promise<void> {
  const profiles = loadSocialProfiles();
  const handle = profiles.instagram ? `@${profiles.instagram.replace(/^@/, '')}` : '';
  const fullText = `${content.text}${handle ? ` ${handle}` : ''}${buildHashtags(content.hashtags)}`;

  if (content.imageFile && navigator.share && navigator.canShare?.({ files: [content.imageFile] })) {
    try {
      await navigator.share({ files: [content.imageFile], title: content.title || 'Share', text: fullText });
      return;
    } catch { /* dismissed */ }
  }

  if (content.imageFile) {
    const url = URL.createObjectURL(content.imageFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = content.imageFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    try { await navigator.clipboard.writeText(fullText); } catch {}
    showToast?.('Image saved & caption copied! Open Instagram to post.');
  } else {
    try { await navigator.clipboard.writeText(fullText); } catch {}
    showToast?.('Caption copied! Open Instagram to post.');
  }
}

export async function shareToX(content: ShareContent, showToast?: (msg: string) => void): Promise<void> {
  const profiles = loadSocialProfiles();
  const handle = profiles.x ? `@${profiles.x.replace(/^@/, '')}` : '';
  const fullText = `${content.text}${handle ? ` via ${handle}` : ''}${buildHashtags(content.hashtags)}`;

  if (content.imageFile && navigator.share && navigator.canShare?.({ files: [content.imageFile] })) {
    try {
      await navigator.share({ files: [content.imageFile], title: content.title, text: fullText });
      return;
    } catch { /* dismissed */ }
  }

  const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(fullText)}${content.url ? `&url=${encodeURIComponent(content.url)}` : ''}`;
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

export async function shareToWhatsApp(content: ShareContent, showToast?: (msg: string) => void): Promise<void> {
  const fullText = `${content.text}${buildHashtags(content.hashtags)}${content.url ? `\n${content.url}` : ''}`;

  if (content.imageFile && navigator.share && navigator.canShare?.({ files: [content.imageFile] })) {
    try {
      await navigator.share({ files: [content.imageFile], title: content.title, text: fullText });
      return;
    } catch { /* dismissed */ }
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank', 'noopener,noreferrer');
}

export async function shareToFacebook(content: ShareContent): Promise<void> {
  const shareUrl = content.url || window.location.href;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(content.text)}`, '_blank', 'noopener,noreferrer');
}

export async function shareToStrava(content: ShareContent, showToast?: (msg: string) => void): Promise<void> {
  const profiles = loadSocialProfiles();
  if (profiles.strava) {
    const url = getSocialUrl('strava', profiles.strava);
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    showToast?.('Connect your Strava account in Settings first.');
  }
}

export async function shareNative(content: ShareContent, showToast?: (msg: string) => void): Promise<boolean> {
  if (navigator.share) {
    try {
      const shareData: ShareData = { title: content.title, text: content.text, url: content.url };
      if (content.imageFile && navigator.canShare?.({ files: [content.imageFile] })) {
        shareData.files = [content.imageFile];
      }
      await navigator.share(shareData);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(content.text + (content.url ? `\n${content.url}` : ''));
    showToast?.('Copied to clipboard!');
    return true;
  } catch {
    showToast?.('Could not share');
    return false;
  }
}

export function getProfileUrl(platform: 'instagram' | 'strava' | 'youtube' | 'x' | 'tiktok' | 'spotify'): string | null {
  const profiles = loadSocialProfiles();
  const handle = profiles[platform];
  if (!handle) return null;
  return getSocialUrl(platform, handle);
}
