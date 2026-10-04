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
  if (typeof window === 'undefined') return 'c1';
  return localStorage.getItem('o1fc_user_id') || 'c1';
};

const getInitialCoachId = (): string => {
  if (typeof window === 'undefined') return 'coach_alpha';
  return localStorage.getItem('o1fc_coach_id') || 'coach_alpha';
};

export const useRoleStore = create<RoleState>((set, get) => ({
  role: getInitialRole(),
  userId: getInitialUserId(),
  coachId: getInitialCoachId(),
  setRole: (role: UserRole) => {
    try {
      localStorage.setItem('o1fc_active_role', role);
      if (role === 'athlete') {
        localStorage.setItem('o1fc_user_id', get().userId || 'c1');
      } else {
        localStorage.setItem('o1fc_coach_id', get().coachId || 'coach_alpha');
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

