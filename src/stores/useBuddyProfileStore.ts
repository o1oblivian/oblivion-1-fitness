import { createStore } from '../utils/createStore';
import { tactileEngine } from '../services/tactileEngine';

export type BuddyIntent = 'both' | 'partner' | 'dating' | 'spotter' | 'hyrox';
export type LookingFor = 'all' | 'women' | 'men';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

export interface BuddyProfileState {
  isBuddyProfileActive: boolean; // false = Solo Fitness Mode (invisible on radar); true = Visible on Radar
  ghostMode: boolean; // Stealth Mode: Browse radar while remaining invisible to others
  displayName: string;
  age: number;
  homeGym: string;
  selectedDisciplines: string[];
  intent: BuddyIntent;
  lookingFor: LookingFor;
  gender: '' | 'women' | 'men';
  trainingPlace: '' | 'gym' | 'home' | 'outdoors';
  preferredTimes: string[];
  experienceLevel: ExperienceLevel;
  partnerBio: string;
  buddyPhotos: string[];
  favoriteWorkouts: string[];
  showLiftsOnRadar: boolean;
  showVolumeOnRadar: boolean;
  maxDistanceKm: number; // 5, 10, 25, 50, 100
  ageRangeMin: number;
  ageRangeMax: number;
  isVerifiedBadge: boolean;
}

export interface BuddyProfileActions {
  toggleBuddyProfile: (active?: boolean) => void;
  toggleGhostMode: (active?: boolean) => void;
  setDisplayName: (name: string) => void;
  setAge: (age: number) => void;
  setHomeGym: (gym: string) => void;
  setSelectedDisciplines: (disciplines: string[]) => void;
  setIntent: (intent: BuddyIntent) => void;
  setLookingFor: (lookingFor: LookingFor) => void;
  setGender: (gender: '' | 'women' | 'men') => void;
  setTrainingPlace: (place: '' | 'gym' | 'home' | 'outdoors') => void;
  togglePreferredTime: (time: string) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setPartnerBio: (bio: string) => void;
  addBuddyPhoto: (photoDataUrl: string) => void;
  removeBuddyPhoto: (index: number) => void;
  reorderBuddyPhotos: (startIndex: number, endIndex: number) => void;
  setMainBuddyPhoto: (index: number) => void;
  toggleVaultPhotoOnBuddy: (url: string) => boolean;
  isPhotoOnBuddy: (url: string) => boolean;
  setBuddyPhotos: (photos: string[]) => void;
  toggleFavoriteWorkout: (workout: string) => void;
  toggleShowLifts: (val?: boolean) => void;
  toggleShowVolume: (val?: boolean) => void;
  setMaxDistanceKm: (dist: number) => void;
  setRadiusKm: (dist: number) => void;
  setAgeRange: (min: number, max: number) => void;
  toggleVerifiedBadge: () => void;
  updateBuddyProfile: (updates: Partial<BuddyProfileState>) => void;
}

const STORAGE_KEY = 'o1fc_buddy_profile_v3';

export const DEFAULT_BUDDY_PHOTOS: string[] = [];

const loadSavedBuddyProfile = (): BuddyProfileState => {
  const defaultState: BuddyProfileState = {
    isBuddyProfileActive: true, // Default active on athlete radar
    ghostMode: false,
    displayName: '',
    age: 0,
    homeGym: '',
    selectedDisciplines: [],
    intent: 'partner',
    lookingFor: 'all',
    gender: '',
    trainingPlace: '',
    preferredTimes: [],
    experienceLevel: 'Intermediate',
    partnerBio: '',
    buddyPhotos: [],
    favoriteWorkouts: [],
    showLiftsOnRadar: false,
    showVolumeOnRadar: false,
    maxDistanceKm: 25,
    ageRangeMin: 18,
    ageRangeMax: 45,
    isVerifiedBadge: false,
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved);
    const stockName = parsed.displayName === 'Jordan Vance';
    const stockBio = typeof parsed.partnerBio === 'string' && parsed.partnerBio.startsWith('High-intensity lifting');
    if (stockName || stockBio) return defaultState;
    const loadedPhotos =
      Array.isArray(parsed.buddyPhotos)
        ? parsed.buddyPhotos.filter(
            (url: string) => typeof url === 'string' && !url.includes('images.unsplash.com') && !url.includes('photo-1534528741775')
          )
        : [];
    return {
      ...defaultState,
      ...parsed,
      gender: parsed.gender === 'women' || parsed.gender === 'men' ? parsed.gender : '',
      trainingPlace: parsed.trainingPlace === 'gym' || parsed.trainingPlace === 'home' || parsed.trainingPlace === 'outdoors' ? parsed.trainingPlace : '',
      buddyPhotos: loadedPhotos,
    };
  } catch (err) {
    console.error('Error loading buddy profile:', err);
    return defaultState;
  }
};

const persistState = (state: BuddyProfileState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving buddy profile:', e);
  }
};

const buddyStore = createStore<BuddyProfileState, BuddyProfileActions>(
  loadSavedBuddyProfile(),
  (set, get) => ({
    toggleBuddyProfile: (active) => {
      tactileEngine.triggerSelectionBuzz();
      const nextActive = active !== undefined ? active : !get().isBuddyProfileActive;
      set({ isBuddyProfileActive: nextActive });
      persistState(get());
    },

    toggleGhostMode: (active) => {
      tactileEngine.triggerSelectionBuzz();
      const nextGhost = active !== undefined ? active : !get().ghostMode;
      set({ ghostMode: nextGhost });
      persistState(get());
      void import('../services/buddyPresenceSync').then(({ syncBuddyGhostMode }) => {
        void syncBuddyGhostMode(nextGhost);
      });
    },

    setDisplayName: (displayName) => {
      set({ displayName });
      persistState(get());
    },

    setAge: (age) => {
      set({ age });
      persistState(get());
    },

    setHomeGym: (homeGym) => {
      set({ homeGym });
      persistState(get());
    },

    setSelectedDisciplines: (selectedDisciplines) => {
      set({ selectedDisciplines });
      persistState(get());
    },

    setIntent: (intent) => {
      tactileEngine.triggerSelectionBuzz();
      set({ intent });
      persistState(get());
    },

    setLookingFor: (lookingFor) => {
      tactileEngine.triggerSelectionBuzz();
      set({ lookingFor });
      persistState(get());
    },

    setGender: (gender) => {
      tactileEngine.triggerSelectionBuzz();
      set({ gender });
      persistState(get());
    },

    setTrainingPlace: (trainingPlace) => {
      tactileEngine.triggerSelectionBuzz();
      set({ trainingPlace });
      persistState(get());
    },

    togglePreferredTime: (time) => {
      tactileEngine.triggerSelectionBuzz();
      const current = get().preferredTimes;
      const next = current.includes(time) ? current.filter((t) => t !== time) : [...current, time];
      set({ preferredTimes: next });
      persistState(get());
    },

    setExperienceLevel: (experienceLevel) => {
      tactileEngine.triggerSelectionBuzz();
      set({ experienceLevel });
      persistState(get());
    },

    setPartnerBio: (partnerBio) => {
      set({ partnerBio });
      persistState(get());
    },

    addBuddyPhoto: (photoDataUrl) => {
      tactileEngine.triggerSelectionBuzz();
      const current = get().buddyPhotos;
      if (current.length >= 6) return;
      const next = [...current, photoDataUrl];
      set({ buddyPhotos: next });
      persistState(get());
    },

    removeBuddyPhoto: (index) => {
      tactileEngine.triggerSelectionBuzz();
      const current =
        get().buddyPhotos && get().buddyPhotos.length > 0
          ? get().buddyPhotos
          : [...DEFAULT_BUDDY_PHOTOS];
      const next = current.filter((_, i) => i !== index);
      set({ buddyPhotos: next });
      persistState(get());
    },

    reorderBuddyPhotos: (startIndex: number, endIndex: number) => {
      tactileEngine.triggerDialHaptic();
      const photos =
        get().buddyPhotos && get().buddyPhotos.length > 0
          ? [...get().buddyPhotos]
          : [...DEFAULT_BUDDY_PHOTOS];
      if (startIndex < 0 || startIndex >= photos.length || endIndex < 0 || endIndex >= photos.length) return;
      const [removed] = photos.splice(startIndex, 1);
      photos.splice(endIndex, 0, removed);
      set({ buddyPhotos: photos });
      persistState(get());
    },

    setMainBuddyPhoto: (index: number) => {
      tactileEngine.playPRCelebration();
      const photos =
        get().buddyPhotos && get().buddyPhotos.length > 0
          ? [...get().buddyPhotos]
          : [...DEFAULT_BUDDY_PHOTOS];
      if (index <= 0 || index >= photos.length) return;
      const [hero] = photos.splice(index, 1);
      photos.unshift(hero);
      set({ buddyPhotos: photos });
      persistState(get());
    },

    toggleVaultPhotoOnBuddy: (url: string) => {
      tactileEngine.triggerSelectionBuzz();
      const current = get().buddyPhotos;
      const exists = current.includes(url);
      if (exists) {
        const next = current.filter((u) => u !== url);
        set({ buddyPhotos: next });
        persistState(get());
        return false;
      } else {
        if (current.length >= 6) {
          // If already 6, replace the last one or prepend
          const next = [url, ...current.slice(0, 5)];
          set({ buddyPhotos: next });
          persistState(get());
          return true;
        }
        const next = [...current, url];
        set({ buddyPhotos: next });
        persistState(get());
        return true;
      }
    },

    isPhotoOnBuddy: (url: string) => {
      return get().buddyPhotos.includes(url);
    },

    setBuddyPhotos: (photos: string[]) => {
      set({ buddyPhotos: photos.slice(0, 6) });
      persistState(get());
    },

    toggleFavoriteWorkout: (workout) => {
      tactileEngine.triggerSelectionBuzz();
      const current = get().favoriteWorkouts;
      const next = current.includes(workout) ? current.filter((w) => w !== workout) : [...current, workout];
      set({ favoriteWorkouts: next });
      persistState(get());
    },

    toggleShowLifts: (val) => {
      tactileEngine.triggerSelectionBuzz();
      const next = val !== undefined ? val : !get().showLiftsOnRadar;
      set({ showLiftsOnRadar: next });
      persistState(get());
    },

    toggleShowVolume: (val) => {
      tactileEngine.triggerSelectionBuzz();
      const next = val !== undefined ? val : !get().showVolumeOnRadar;
      set({ showVolumeOnRadar: next });
      persistState(get());
    },

    setMaxDistanceKm: (dist) => {
      tactileEngine.triggerSelectionBuzz();
      set({ maxDistanceKm: dist });
      persistState(get());
    },

    setRadiusKm: (dist) => {
      tactileEngine.triggerSelectionBuzz();
      set({ maxDistanceKm: dist });
      persistState(get());
    },

    setAgeRange: (min, max) => {
      tactileEngine.triggerSelectionBuzz();
      set({ ageRangeMin: min, ageRangeMax: max });
      persistState(get());
    },

    toggleVerifiedBadge: () => {
      tactileEngine.triggerSelectionBuzz();
      const next = !get().isVerifiedBadge;
      set({ isVerifiedBadge: next });
      persistState(get());
    },

    updateBuddyProfile: (updates) => {
      set((prev) => {
        const next = { ...prev, ...updates };
        persistState(next);
        return next;
      });
    },
  })
);

export const useBuddyProfileStore = buddyStore.useStore;
