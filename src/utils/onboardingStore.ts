import { supabase, isSupabaseConfigured } from './supabase';

export type OnboardingIntent = 'train' | 'coach' | 'community' | 'business' | 'health';
export type SupportChoice = 'match' | 'browse' | 'independent' | 'undecided';
export type CoachingStyle = 'accountability' | 'education' | 'performance' | 'community' | 'holistic';

export interface O1LaunchProtocolData {
  intent: OnboardingIntent;
  role: 'athlete' | 'coach';
  displayName: string;
  handle: string;
  bio: string;
  height: string;
  weight: string;
  age: string;
  avatarUrl: string | null;
  disciplines: string[];
  trainingFrequency: string;
  supportChoice: SupportChoice;
  coachingStyle: CoachingStyle;
  radarEnabled: boolean;
  broadcastActive: boolean;
  stealthMode: boolean;
  completedAt?: string;
}

const STORAGE_KEY_PREFIX = 'o1fc_launch_protocol_';

export const DEFAULT_PROTOCOL_DATA: O1LaunchProtocolData = {
  intent: 'health',
  role: 'athlete',
  displayName: '',
  handle: '',
  bio: '',
  height: '178',
  weight: '75',
  age: '28',
  avatarUrl: null,
  disciplines: ['functional', 'strength'],
  trainingFrequency: '4-5 days',
  supportChoice: 'browse',
  coachingStyle: 'education',
  radarEnabled: true,
  broadcastActive: true,
  stealthMode: false,
};

export function getLocalProtocolData(email: string): O1LaunchProtocolData {
  if (!email) return DEFAULT_PROTOCOL_DATA;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${email}`);
    if (raw) return { ...DEFAULT_PROTOCOL_DATA, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PROTOCOL_DATA;
}

export function saveLocalProtocolData(email: string, data: Partial<O1LaunchProtocolData>): void {
  if (!email) return;
  try {
    const current = getLocalProtocolData(email);
    const updated = { ...current, ...data };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${email}`, JSON.stringify(updated));
  } catch {}
}

export async function persistLaunchProtocol(email: string, data: O1LaunchProtocolData): Promise<void> {
  saveLocalProtocolData(email, { ...data, completedAt: new Date().toISOString() });
  try {
    localStorage.setItem(`o1fc_quicksetup_completed_${email}`, 'true');
    localStorage.setItem(`o1fc_onboarding_completed_${email}`, 'true');
    localStorage.setItem('o1fc_onboarding_complete', 'true');
  } catch {}

  if (!isSupabaseConfigured() || !email) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        email: user.email || email,
        display_name: data.displayName || null,
        profile_image_url: data.avatarUrl || null,
        workout_focus: data.disciplines.join(', ') || null,
        role: data.role,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Could not sync launch protocol to cloud profile:', err);
  }
}
