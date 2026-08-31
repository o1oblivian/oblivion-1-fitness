export interface TrialExercise {
  name: string;
  sets: number;
  reps: string;
  targetLoad: string;
  notes?: string;
  coachEmail?: string;
  programId?: string;
}

export interface CoachProgram {
  programId: string;
  coachEmail: string;
  coachName: string;
  programTitle: string;
  durationWeeks: number;
  priceCents: number;
  exercises: TrialExercise[];
  socialLinks?: { instagram?: string; tiktok?: string; strava?: string };
}

const UNLOCK_KEY_PREFIX = 'coach_unlocked_';

export function isCoachUnlocked(coachEmail: string): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY_PREFIX + coachEmail) === 'true';
  } catch {
    return false;
  }
}

export function setCoachUnlocked(coachEmail: string): void {
  try {
    localStorage.setItem(UNLOCK_KEY_PREFIX + coachEmail, 'true');
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('coach_unlocked', { detail: { coachEmail } })
    );
  }
}

export function injectTrialExercise(exercise: TrialExercise): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('trial_exercise_inject', { detail: exercise })
    );
  }
}

export function dispatchProgramToLogger(program: CoachProgram): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('coach_program_dispatch', { detail: program })
    );
  }
}

export function openCoachVault(media: {
  coachEmail: string;
  coachName: string;
  items: { id: string; title: string; type: 'video' | 'image'; url: string; thumbnailUrl: string; tags?: string[]; specialization?: string }[];
  startIndex?: number;
}): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open_coach_vault', { detail: media })
    );
  }
}
