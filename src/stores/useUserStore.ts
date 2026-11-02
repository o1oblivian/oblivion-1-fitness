import { createStore } from '../utils/createStore';

interface UserState {
  userId: string;
  handle: string;
  name: string;
  avatarUrl: string;
  weightKg: number;
  targetWeightKg: number;
  calibrationProgress: number;
  readinessScore: number;
  status: string;
  assigned_coach_id?: string | null;
}

interface UserActions {
  setUserId: (userId: string) => void;
  setHandle: (handle: string) => void;
  setWeightKg: (weight: number) => void;
  setTargetWeightKg: (target: number) => void;
  setCalibrationProgress: (progress: number) => void;
  setReadinessScore: (score: number) => void;
  setAssignedCoachId: (assigned_coach_id: string | null) => void;
  updateProfile: (updates: Partial<UserState>) => void;
}

const getStoredUserId = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const id = localStorage.getItem('o1fc_user_id');
    if (!id || id === 'default-athlete' || id === 'athlete-c1') return '';
    return id;
  } catch {
    return '';
  }
};

const getStoredAvatar = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('o1_profile_avatar_url') || '';
  } catch {
    return '';
  }
};

const getStoredName = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('o1_profile_name') || '';
  } catch {
    return '';
  }
};

const getStoredHandle = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('o1_profile_handle') || '';
  } catch {
    return '';
  }
};

const getStoredWeight = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem('o1_profile_weight');
    return saved ? Number(saved) : 0;
  } catch {
    return 0;
  }
};

const getStoredTargetWeight = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const saved = localStorage.getItem('o1_profile_target_weight');
    return saved ? Number(saved) : 0;
  } catch {
    return 0;
  }
};

const getStoredCoachId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('o1fc_assigned_coach_id') || null;
  } catch {
    return null;
  }
};

const initialUserState: UserState = {
  userId: getStoredUserId(),
  handle: getStoredHandle(),
  name: getStoredName(),
  avatarUrl: getStoredAvatar(),
  weightKg: getStoredWeight(),
  targetWeightKg: getStoredTargetWeight(),
  calibrationProgress: 0,
  readinessScore: 0,
  status: 'Ready',
  assigned_coach_id: getStoredCoachId(),
};

const userStore = createStore<UserState, UserActions>(initialUserState, (set) => ({
  setUserId: (userId) => {
    try {
      localStorage.setItem('o1fc_user_id', userId);
    } catch (err) {
      console.warn('[useUserStore] Could not save the profile to device storage', err);
    }
    set({ userId });
  },
  setAssignedCoachId: (assigned_coach_id) => {
    try {
      if (assigned_coach_id) {
        localStorage.setItem('o1fc_assigned_coach_id', assigned_coach_id);
      } else {
        localStorage.removeItem('o1fc_assigned_coach_id');
      }
    } catch (err) {
      console.warn('[useUserStore] Could not save the profile to device storage', err);
    }
    set({ assigned_coach_id });
  },
  setHandle: (handle) => {
    try {
      localStorage.setItem('o1_profile_handle', handle);
    } catch (err) {
      console.warn('[useUserStore] Could not save the profile to device storage', err);
    }
    set({ handle });
  },
  setWeightKg: (weightKg) => {
    try {
      localStorage.setItem('o1_profile_weight', String(weightKg));
    } catch (err) {
      console.warn('[useUserStore] Could not save the profile to device storage', err);
    }
    set({ weightKg });
  },
  setTargetWeightKg: (targetWeightKg) => {
    try {
      localStorage.setItem('o1_profile_target_weight', String(targetWeightKg));
    } catch (err) {
      console.warn('[useUserStore] Could not save the profile to device storage', err);
    }
    set({ targetWeightKg });
  },
  setCalibrationProgress: (calibrationProgress) => set({ calibrationProgress }),
  setReadinessScore: (readinessScore) => set({ readinessScore }),
  updateProfile: (updates) => {
    if (updates.userId !== undefined) {
      try {
        localStorage.setItem('o1fc_user_id', updates.userId);
      } catch (err) {
        console.warn('[useUserStore] Could not save the profile to device storage', err);
      }
    }
    if (updates.avatarUrl !== undefined) {
      try {
        localStorage.setItem('o1_profile_avatar_url', updates.avatarUrl);
      } catch (err) {
        console.warn('[useUserStore] Could not save the profile to device storage', err);
      }
    }
    if (updates.name !== undefined) {
      try {
        localStorage.setItem('o1_profile_name', updates.name);
      } catch (err) {
        console.warn('[useUserStore] Could not save the profile to device storage', err);
      }
    }
    if (updates.handle !== undefined) {
      try {
        localStorage.setItem('o1_profile_handle', updates.handle);
      } catch (err) {
        console.warn('[useUserStore] Could not save the profile to device storage', err);
      }
    }
    if (updates.weightKg !== undefined) {
      try {
        localStorage.setItem('o1_profile_weight', String(updates.weightKg));
      } catch (err) {
        console.warn('[useUserStore] Could not save the profile to device storage', err);
      }
    }
    if (updates.targetWeightKg !== undefined) {
      try {
        localStorage.setItem('o1_profile_target_weight', String(updates.targetWeightKg));
      } catch (err) {
        console.warn('[useUserStore] Could not save the profile to device storage', err);
      }
    }
    set((prev) => ({ ...prev, ...updates }));
  },
}));

export const useUserStore = userStore.useStore;
