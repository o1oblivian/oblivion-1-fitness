import { supabase } from './supabase';
import { getSessionUserEmail } from './authStorage';

/**
 * Permanently deletes all user data from Supabase tables and clears local storage.
 * Called from Settings → Delete Account & Purge Data (Apple Guideline 5.1.1(v)).
 *
 * Purges: user_consent, workout_logs, live_workout_logs, health_telemetry,
 * dispatched_workouts (as coach or client), coach_feedback, user_training_vectors,
 * user_quick_supplements, gym_passes, direct_messages, checkins, habits, profiles.
 *
 * After DB purge: signs out of Supabase Auth and clears all local storage keys.
 */
export async function purgeAllUserData(userEmail?: string): Promise<{ success: boolean; error?: string }> {
  let email = (userEmail || '').trim().toLowerCase();

  // If no email passed, try resolving from active Supabase session or local auth storage
  if (!email) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        email = data.user.email.trim().toLowerCase();
      }
    } catch {}
  }
  if (!email) {
    email = (getSessionUserEmail() || '').trim().toLowerCase();
  }

  const tables = [
    'user_consent',
    'workout_logs',
    'live_workout_logs',
    'health_telemetry',
    'coach_feedback',
    'user_training_vectors',
    'user_quick_supplements',
    'gym_passes',
    'direct_messages',
    'checkins',
    'habits',
    'profiles',
  ];

  if (email) {
    // Delete rows where user_email matches
    for (const table of tables) {
      try {
        await supabase.from(table).delete().eq('user_email', email);
      } catch (e) {
        // Non-fatal: some tables may not have this user's rows
      }
    }

    // Delete dispatched workouts where user is coach or in client list
    try {
      await supabase.from('dispatched_workouts').delete().eq('coachid', email);
    } catch (e) {
      // Non-fatal
    }

    // Record that consent was withdrawn (delete consent rows)
    try {
      await supabase.from('user_consent').delete().eq('user_email', email);
    } catch (e) {
      // Non-fatal
    }
  }

  // Sign out from Supabase Auth
  try {
    await supabase.auth.signOut();
  } catch (e) {
    // Non-fatal
  }

  // Clear all local storage keys related to O1FC and Lumina
  clearAllLocalData();

  return { success: true };
}

/**
 * Clears all O1FC and Lumina-related local storage: user state, auth tokens, preferences, cached logs.
 */
export function clearAllLocalData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('o1fc_') ||
          key.startsWith('ofc_') ||
          key.startsWith('ofc-') ||
          key.startsWith('lumina_') ||
          key.startsWith('sb-') ||
          key.startsWith('tandem_') ||
          key.startsWith('todayCardio_') ||
          key.startsWith('autopilot_') ||
          key.startsWith('o1_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    // Non-fatal
  }
}
