export interface ShowcaseSlotMedia {
  id: string;
  slotNumber: 1 | 2 | 3 | 4 | 5;
  slotLabel: string;
  type: 'video' | 'photo';
  title: string;
  badge: string;
  url: string;
  poster: string;
  subtitle?: string;
  isMainHero?: boolean;
}

export interface CoachShowcaseConfig {
  coachId: string;
  coachName: string;
  // Slot 1: Main Fullscreen Reel
  mainHero: {
    type: 'video' | 'photo';
    title: string;
    url: string;
    thumbnail: string;
    caption?: string;
  };
  // Slot 2: Mini Window 1
  slot2: {
    type: 'video' | 'photo';
    title: string;
    badge: string;
    url: string;
    poster: string;
  };
  // Slot 3: Mini Window 2
  slot3: {
    type: 'video' | 'photo';
    title: string;
    badge: string;
    url: string;
    poster: string;
  };
  // Slot 4: Mini Window 3
  slot4: {
    type: 'video' | 'photo';
    title: string;
    badge: string;
    url: string;
    poster: string;
  };
  // Slot 5: Mini Window 4 (Programs & Consult or Custom Media)
  slot5: {
    type: 'programs' | 'photo' | 'video';
    title: string;
    badge: string;
    url?: string;
    poster?: string;
    subLabel?: string;
    highlightPrice?: string;
  };
  vaultGallery: ShowcaseSlotMedia[];
}

const STORAGE_KEY_PREFIX = 'o1fc_coach_showcase_';

export const DEFAULT_SHOWCASE_CONFIGS: Record<string, CoachShowcaseConfig> = {
  'coach-elena-mobility': {
    coachId: 'coach-elena-mobility',
    coachName: 'Mobility Coach Elena Vasquez',
    mainHero: {
      type: 'video',
      title: 'Deep Hip 90/90 Kinetic Rotation & Thoracic Decompression',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-stretching-her-body-on-a-mat-41483-large.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
      caption: 'Clinical mobility protocols designed to unlock tight hip capsules and optimize ankle dorsiflexion.',
    },
    slot2: {
      type: 'video',
      title: 'Hip 90/90 Flow',
      badge: 'DRILL',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-fitness-exercise-with-dumbbells-41485-large.mp4',
      poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
    },
    slot3: {
      type: 'video',
      title: 'Scapular Pitch',
      badge: 'CUE',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-out-with-elastic-resistance-bands-41484-large.mp4',
      poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
    },
    slot4: {
      type: 'photo',
      title: 'Clinical Lab',
      badge: 'PHOTO',
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
      poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    },
    slot5: {
      type: 'programs',
      title: 'PROGRAMS',
      badge: 'OFFER',
      subLabel: '& Consult',
      highlightPrice: '2 Plans',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      poster: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    },
    vaultGallery: [
      {
        id: 'vault-elena-1',
        slotNumber: 1,
        slotLabel: 'Slot 1 (Main Hero Reel)',
        type: 'video',
        title: 'Deep Hip 90/90 Kinetic Rotation',
        badge: 'HERO',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-stretching-her-body-on-a-mat-41483-large.mp4',
        poster: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
        isMainHero: true,
      },
      {
        id: 'vault-elena-2',
        slotNumber: 2,
        slotLabel: 'Slot 2 (Mini Window 1)',
        type: 'video',
        title: 'Hip 90/90 Flow',
        badge: 'DRILL',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-doing-a-fitness-exercise-with-dumbbells-41485-large.mp4',
        poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'vault-elena-3',
        slotNumber: 3,
        slotLabel: 'Slot 3 (Mini Window 2)',
        type: 'video',
        title: 'Scapular Pitch',
        badge: 'CUE',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-out-with-elastic-resistance-bands-41484-large.mp4',
        poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'vault-elena-4',
        slotNumber: 4,
        slotLabel: 'Slot 4 (Mini Window 3)',
        type: 'photo',
        title: 'Clinical Lab Proof',
        badge: 'PHOTO',
        url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
        poster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'vault-elena-5',
        slotNumber: 5,
        slotLabel: 'Slot 5 (Mini Window 4)',
        type: 'photo',
        title: 'Programs & Consult Showcase',
        badge: 'PROGRAMS',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
        poster: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
        subtitle: '2 Plans & Telemetry Consult',
      },
    ],
  },
};

export function getCoachShowcase(coachIdOrName: string): CoachShowcaseConfig {
  try {
    const cleanKey = coachIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + cleanKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load showcase config:', e);
  }

  // Fallback to presets or generate standard layout
  if (DEFAULT_SHOWCASE_CONFIGS[coachIdOrName]) {
    return DEFAULT_SHOWCASE_CONFIGS[coachIdOrName];
  }

  const defaultElena = DEFAULT_SHOWCASE_CONFIGS['coach-elena-mobility'];
  return {
    ...defaultElena,
    coachId: coachIdOrName,
    coachName: coachIdOrName,
  };
}

export function saveCoachShowcase(config: CoachShowcaseConfig): void {
  try {
    const cleanKey = (config.coachId || config.coachName).toLowerCase().replace(/[^a-z0-9]/g, '-');
    localStorage.setItem(STORAGE_KEY_PREFIX + cleanKey, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('coach_showcase_updated', { detail: config })
      );
    }
  } catch (e) {
    console.error('Failed to save showcase config:', e);
  }
}

export function updateShowcaseSlot(
  coachIdOrName: string,
  slotNumber: 1 | 2 | 3 | 4 | 5,
  media: {
    type: 'video' | 'photo' | 'programs';
    title: string;
    badge?: string;
    url: string;
    poster?: string;
    subtitle?: string;
  }
): CoachShowcaseConfig {
  const current = getCoachShowcase(coachIdOrName);
  const updated: CoachShowcaseConfig = { ...current };

  if (slotNumber === 1) {
    updated.mainHero = {
      type: media.type === 'video' ? 'video' : 'photo',
      title: media.title,
      url: media.url,
      thumbnail: media.poster || media.url,
    };
  } else if (slotNumber === 2) {
    updated.slot2 = {
      type: media.type === 'video' ? 'video' : 'photo',
      title: media.title,
      badge: media.badge || 'DRILL',
      url: media.url,
      poster: media.poster || media.url,
    };
  } else if (slotNumber === 3) {
    updated.slot3 = {
      type: media.type === 'video' ? 'video' : 'photo',
      title: media.title,
      badge: media.badge || 'CUE',
      url: media.url,
      poster: media.poster || media.url,
    };
  } else if (slotNumber === 4) {
    updated.slot4 = {
      type: media.type === 'video' ? 'video' : 'photo',
      title: media.title,
      badge: media.badge || 'PHOTO',
      url: media.url,
      poster: media.poster || media.url,
    };
  } else if (slotNumber === 5) {
    updated.slot5 = {
      type: media.type === 'video' ? 'video' : media.type === 'programs' ? 'programs' : 'photo',
      title: media.title || 'PROGRAMS',
      badge: media.badge || 'OFFER',
      url: media.url,
      poster: media.poster || media.url,
      subLabel: media.subtitle || '& Consult',
    };
  }

  // Update or insert into vaultGallery
  const existingIdx = updated.vaultGallery.findIndex((item) => item.slotNumber === slotNumber);
  const vaultItem: ShowcaseSlotMedia = {
    id: `slot-${slotNumber}-${Date.now()}`,
    slotNumber,
    slotLabel: slotNumber === 1 ? 'Slot 1 (Main Hero Reel)' : `Slot ${slotNumber} (Mini Window ${slotNumber - 1})`,
    type: media.type === 'video' ? 'video' : 'photo',
    title: media.title,
    badge: media.badge || (slotNumber === 1 ? 'HERO' : slotNumber === 2 ? 'DRILL' : slotNumber === 3 ? 'CUE' : slotNumber === 4 ? 'PHOTO' : 'PROGRAMS'),
    url: media.url,
    poster: media.poster || media.url,
    subtitle: media.subtitle,
    isMainHero: slotNumber === 1,
  };

  if (existingIdx >= 0) {
    updated.vaultGallery[existingIdx] = vaultItem;
  } else {
    updated.vaultGallery.push(vaultItem);
  }

  saveCoachShowcase(updated);
  return updated;
}
