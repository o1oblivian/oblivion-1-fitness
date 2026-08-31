/**
 * Centralized social profile handles for athletes and coaches.
 * Persisted to localStorage under `athlete_social_profiles`.
 */

export interface SocialProfiles {
  instagram: string;
  strava: string;
  youtube: string;
  tiktok: string;
  spotify: string;
  x: string;
}

export const EMPTY_SOCIAL_PROFILES: SocialProfiles = {
  instagram: '',
  strava: '',
  youtube: '',
  tiktok: '',
  spotify: '',
  x: '',
};

const STORAGE_KEY = 'athlete_social_profiles';

export function loadSocialProfiles(): SocialProfiles {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...EMPTY_SOCIAL_PROFILES, ...parsed };
    }
  } catch (e) {
    // ignore
  }
  return { ...EMPTY_SOCIAL_PROFILES };
}

export function saveSocialProfiles(profiles: SocialProfiles): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    // ignore
  }
}

export function getSocialHandle(platform: keyof SocialProfiles, profiles: SocialProfiles): string {
  const val = profiles[platform] || '';
  return val.startsWith('@') ? val : val ? `@${val}` : '';
}

export function getSocialUrl(platform: keyof SocialProfiles, handle: string): string {
  const clean = handle.replace(/^@/, '').trim();
  if (!clean) return '';
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${clean}`;
    case 'strava':
      return `https://strava.com/athletes/${clean}`;
    case 'youtube':
      return `https://youtube.com/@${clean}`;
    case 'tiktok':
      return `https://tiktok.com/@${clean}`;
    case 'spotify':
      return `https://open.spotify.com/user/${clean}`;
    case 'x':
      return `https://x.com/${clean}`;
    default:
      return '';
  }
}
