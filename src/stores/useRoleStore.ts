import { create } from 'zustand';

export type UserRole = 'athlete' | 'coach';

export interface RoleState {
  role: UserRole;
  userId: string;
  coachId: string;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  setUserId: (id: string) => void;
  setCoachId: (id: string) => void;
}

const getInitialRole = (): UserRole => {
  if (typeof window === 'undefined') return 'athlete';
  return (localStorage.getItem('o1fc_active_role') as UserRole) || 'athlete';
};

const getInitialUserId = (): string => {
  if (typeof window === 'undefined') return '';
  const id = localStorage.getItem('o1fc_user_id') || '';
  if (!id || id === 'c1' || id === 'default-athlete' || id === 'athlete-c1') return '';
  return id;
};

const getInitialCoachId = (): string => {
  if (typeof window === 'undefined') return '';
  const id = localStorage.getItem('o1fc_coach_id') || localStorage.getItem('o1fc_user_id') || '';
  if (!id || id === 'coach_alpha') return '';
  return id;
};

export const useRoleStore = create<RoleState>((set, get) => ({
  role: getInitialRole(),
  userId: getInitialUserId(),
  coachId: getInitialCoachId(),
  setRole: (role: UserRole) => {
    try {
      localStorage.setItem('o1fc_active_role', role);
      if (role === 'athlete') {
        if (get().userId) localStorage.setItem('o1fc_user_id', get().userId);
      } else if (get().coachId) {
        localStorage.setItem('o1fc_coach_id', get().coachId);
      }
    } catch (err) {
      console.warn('[useRoleStore] localStorage error:', err);
    }
    set({ role });
  },
  toggleRole: () => {
    const nextRole: UserRole = get().role === 'athlete' ? 'coach' : 'athlete';
    get().setRole(nextRole);
  },
  setUserId: (userId: string) => {
    try {
      localStorage.setItem('o1fc_user_id', userId);
    } catch (err) {
      console.warn('[useRoleStore] localStorage error:', err);
    }
    set({ userId });
  },
  setCoachId: (coachId: string) => {
    try {
      localStorage.setItem('o1fc_coach_id', coachId);
    } catch (err) {
      console.warn('[useRoleStore] localStorage error:', err);
    }
    set({ coachId });
  },
}));

