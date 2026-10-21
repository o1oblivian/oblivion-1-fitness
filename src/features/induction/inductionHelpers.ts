import {
  ConsultationProfile,
  GOAL_DISCIPLINE,
  Injury,
  MembershipTier,
  TrainingDay,
} from './consultationTypes';
import type { IntakeGroup } from './useClubTaxonomyStore';

export type Phase = 'checking' | 'questions' | 'preview' | 'plans';

export const PLAN_ORDER: MembershipTier[] = ['pro', 'founders_pass', 'core', 'coach_pro', 'coach'];

export const PERIOD_LABEL: Record<string, string> = {
  '/mo': 'per month',
  '/once': 'one time',
  '/forever': 'free forever',
};

export const DAY_NAMES: Record<TrainingDay, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const PROTECTED_NAMES: Record<Exclude<Injury, 'none'>, string> = {
  knees: 'knees',
  lower_back: 'lower back',
  shoulders: 'shoulders',
  wrists: 'wrists',
};

export const MIN_DAYS = 2;
export const MAX_DAYS = 6;

/** Steps that only make sense for some athletes. */
export function stepApplies(group: IntakeGroup, profile: ConsultationProfile): boolean {
  if (group === 'discipline') return profile.goal === 'sport';
  if (group === 'competition')
    return profile.goal === 'sport' || profile.trainingAge === 'competitor';
  return true;
}

/** What the plan preview tells the athlete was taken into account. */
export function previewNotes(profile: ConsultationProfile): string[] {
  const notes: string[] = [];
  const places = profile.facilities.length;
  if (places > 0)
    notes.push(
      `Only equipment you have where you train${places > 1 ? ` across ${places} places` : ''}.`,
    );
  const protectedAreas = profile.injuries
    .filter((injury): injury is Exclude<Injury, 'none'> => injury !== 'none')
    .map((injury) => PROTECTED_NAMES[injury]);
  if (protectedAreas.length > 0)
    notes.push(`Moves that load your ${joinWords(protectedAreas)} are swapped out.`);
  if (profile.ageBand === '60+')
    notes.push('No jumping or high-impact moves, and every set stops short of your limit.');
  if (profile.ageBand === 'under18')
    notes.push('Every set stops short of your limit while you build good technique.');
  if (profile.trainingAge === 'new' || profile.trainingAge === '<1yr')
    notes.push('Fewer sets and lighter weights while you learn the moves.');
  if (profile.competitionDate)
    notes.push(`${weeksUntilLabel(profile.competitionDate)} Training builds toward it.`);
  return notes;
}

function joinWords(words: string[]): string {
  return words.length <= 1
    ? words.join('')
    : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** Today as YYYY-MM-DD in local time, the format a date input uses. */
export function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function weeksUntilLabel(isoDate: string): string {
  const days = Math.round(
    (new Date(`${isoDate}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) /
      86400000,
  );
  if (!Number.isFinite(days) || days < 0) return 'That date has passed.';
  if (days < 7)
    return days === 0
      ? 'Your event is today.'
      : `${days} ${days === 1 ? 'day' : 'days'} to your event.`;
  const weeks = Math.floor(days / 7);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} to your event.`;
}

/** The profile fields one answered question changes. */
export function answerPatch(
  group: IntakeGroup,
  optionKey: string,
  profile: ConsultationProfile,
): Partial<ConsultationProfile> {
  if (group === 'age_band') return { ageBand: optionKey as ConsultationProfile['ageBand'] };
  if (group === 'goal') {
    const goal = optionKey as ConsultationProfile['goal'];
    if (goal === 'sport' || !goal) return { goal };
    return {
      goal,
      primaryDiscipline: GOAL_DISCIPLINE[goal],
      competitionDate: profile.trainingAge === 'competitor' ? profile.competitionDate : '',
    };
  }
  if (group === 'discipline')
    return { primaryDiscipline: optionKey as ConsultationProfile['primaryDiscipline'] };
  if (group === 'training_age')
    return { trainingAge: optionKey as ConsultationProfile['trainingAge'] };
  if (group === 'session_length') {
    const minutes = Number(optionKey);
    return Number.isFinite(minutes) ? { sessionMinutes: minutes } : {};
  }
  return {};
}

/** The option key already chosen for a question, or an empty string when unanswered. */
export function selectedKey(group: IntakeGroup, profile: ConsultationProfile): string {
  if (group === 'age_band') return profile.ageBand;
  if (group === 'goal') return profile.goal;
  if (group === 'discipline') return profile.primaryDiscipline;
  if (group === 'training_age') return profile.trainingAge;
  if (group === 'session_length')
    return profile.sessionMinutes ? String(profile.sessionMinutes) : '';
  return '';
}
