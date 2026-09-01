import { DailyMeals, ExerciseLog, FoodItem } from '../types';
import { supabase, supabaseSignUp, supabaseSignIn, supabaseSignOut, supabaseGetSession, supabaseUrl } from './supabase';

export interface UserAccount {
  email: string;
  name: string;
  createdAt: string;
}

export interface UserAppState {
  athleteName: string;
  athleteHandle: string;
  weeklySchedule: Record<string, string>;
  activeLogs: ExerciseLog[];
  dailyMeals: DailyMeals;
  stepTarget: number;
  bmr: number;
  goalCals: number;
  goalP: number;
  goalC: number;
  goalF: number;
  theme: 'dark' | 'light' | 'system';
  profileImage?: string;
  themeAccent?: string;
  customFoods?: Record<string, FoodItem[]>;
}

const STATE_PREFIX = 'lumina_user_state_';
const USERS_KEY = 'lumina_users_accounts_meta';

export const SESSION_EMAIL_KEY = 'o1fc_session_email';

export function getUsers(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveUsers(users: Record<string, UserAccount>): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save user metadata', e);
  }
}

function getInitialAppState(name: string): UserAppState {
  return {
    athleteName: name,
    athleteHandle: name.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_pro',
    weeklySchedule: {
      Mon: 'push_a',
      Tue: 'pull_a',
      Wed: 'legs_a',
      Thu: 'push_b',
      Fri: 'pull_b',
      Sat: 'legs_b',
      Sun: 'Rest',
    },
    activeLogs: [],
    dailyMeals: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      drinks: [],
    },
    stepTarget: 10000,
    bmr: 2000,
    goalCals: 3000,
    goalP: 225,
    goalC: 337,
    goalF: 83,
    theme: 'dark',
  };
}

export async function registerUser(email: string, password: string, name: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Please provide both email and password.' };
  }

  if (cleanPass.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  try {
    await supabaseSignUp(cleanEmail, cleanPass, cleanName);
  } catch {
    // Cloud sync fallback
  }

  const newUser: UserAccount = {
    email: cleanEmail,
    name: cleanName,
    createdAt: new Date().toISOString(),
  };

  const users = getUsers();
  users[cleanEmail] = newUser;
  saveUsers(users);

  if (!getUserState(cleanEmail)) {
    saveUserState(cleanEmail, getInitialAppState(cleanName));
  }
  setSessionUserEmail(cleanEmail);

  return { success: true, message: 'Account created successfully!', user: newUser };
}

export async function loginUser(email: string, password: string): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, message: 'Please enter your email and password.' };
  }

  try {
    await supabaseSignIn(cleanEmail, cleanPass);
  } catch {
    // Local session fallback
  }

  const users = getUsers();
  let user = users[cleanEmail];
  if (!user) {
    user = {
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    users[cleanEmail] = user;
    saveUsers(users);
    if (!getUserState(cleanEmail)) {
      saveUserState(cleanEmail, getInitialAppState(user.name));
    }
  }

  setSessionUserEmail(cleanEmail);
  return { success: true, message: 'Signed in successfully!', user };
}

export async function logoutUser(): Promise<void> {
  try {
    await supabaseSignOut();
  } catch {}
  setSessionUserEmail(null);
  clearAllUserData();
}

function clearAllUserData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      key.startsWith('lumina_') ||
      key.startsWith('o1fc_') ||
      key.startsWith('sb-') ||
      key.startsWith('workout_') ||
      key.startsWith('meal_') ||
      key.startsWith('steps_') ||
      key.startsWith('sleep_') ||
      key.startsWith('meditation_') ||
      key.startsWith('tandem_') ||
      key.startsWith('buddy_') ||
      key.startsWith('coach_') ||
      key.startsWith('dispatch_') ||
      key.startsWith('program_') ||
      key.startsWith('supplement_') ||
      key.startsWith('wallpaper_') ||
      key.startsWith('telemetry_') ||
      key.startsWith('profile_') ||
      key.startsWith('session_vault_') ||
      key.startsWith('reminder_') ||
      key.startsWith('hydration_') ||
      key.startsWith('social_')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export async function getCurrentSessionEmail(): Promise<string | null> {
  try {
    const { data } = await supabaseGetSession();
    if (data?.session?.user?.email) return data.session.user.email;
  } catch {}
  return getSessionUserEmail();
}

export function getSessionUserEmail(): string | null {
  try {
    const direct = localStorage.getItem(SESSION_EMAIL_KEY);
    if (direct && direct.trim()) return direct.trim();

    const projectRef = (supabaseUrl || '').split('//')[1]?.split('.')[0] || 'qkfvepjeyreicqomatyt';
    const raw = localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user?.email) return parsed.user.email;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.user?.email) return parsed.user.email;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function setSessionUserEmail(email: string | null): void {
  try {
    if (email && email.trim()) {
      localStorage.setItem(SESSION_EMAIL_KEY, email.trim().toLowerCase());
      localStorage.setItem('lumina_current_user', email.trim().toLowerCase());
    } else {
      localStorage.removeItem(SESSION_EMAIL_KEY);
      localStorage.removeItem('lumina_current_user');
    }
  } catch (e) {
    // ignore
  }
}

export function getUserState(email: string): UserAppState | null {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + email.toLowerCase());
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveUserState(email: string, state: UserAppState): void {
  try {
    localStorage.setItem(STATE_PREFIX + email.toLowerCase(), JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save user state', e);
  }
}
