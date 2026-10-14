export type Discipline = 'hyrox' | 'running' | 'mobility' | 'hypertrophy' | 'powerlifting' | 'crossfit' | 'hybrid';
/** Training experience. `5+yrs` is kept so older saved answers still read. */
export type TrainingAge = 'new' | '<1yr' | '1-3yrs' | '3-5yrs' | '5+yrs' | 'competitor';
export type CoachingIntent = '1-on-1' | 'telemetry-only' | 'self-guided';
export type CoachingStyle = 'biometrics' | 'biomechanics' | 'hardcore';
export type Facility = 'commercial' | 'functional_box' | 'garage_minimal' | 'outdoor' | 'bodyweight' | 'other';
export type AgeBand = 'under18' | '18-39' | '40-59' | '60+';
export type Goal = 'fitness' | 'muscle' | 'strength' | 'fat_loss' | 'mobility' | 'sport';
export type Injury = 'knees' | 'lower_back' | 'shoulders' | 'wrists' | 'none';
export type TrainingDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const FACILITY_KEYS: Facility[] = ['commercial', 'functional_box', 'garage_minimal', 'outdoor', 'bodyweight', 'other'];
export const INJURY_KEYS: Injury[] = ['knees', 'lower_back', 'shoulders', 'wrists', 'none'];
export const WEEK: TrainingDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SESSION_MINUTES = [20, 30, 45, 60] as const;

function parseList<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  const parts = Array.isArray(raw) ? raw : String(raw || '').split(',');
  const keys = parts.map((part) => String(part).trim()).filter((part): part is T => allowed.includes(part as T));
  return [...new Set(keys)];
}

/** Stored as a comma list in the single `facility` column. */
export function parseFacilities(raw: unknown): Facility[] {
  return parseList(raw, FACILITY_KEYS);
}

export function parseInjuries(raw: unknown): Injury[] {
  return parseList(raw, INJURY_KEYS);
}

/** Always returned in week order. */
export function parseTrainingDays(raw: unknown): TrainingDay[] {
  const days = parseList(raw, WEEK);
  return WEEK.filter((day) => days.includes(day));
}

/** Plain goal to the discipline that orders reels and coaches. Sport athletes pick their own. */
export const GOAL_DISCIPLINE: Record<Exclude<Goal, 'sport'>, Discipline> = {
  fitness: 'hybrid',
  muscle: 'hypertrophy',
  strength: 'powerlifting',
  fat_loss: 'hybrid',
  mobility: 'mobility',
};

export type MembershipTier = 'core' | 'pro' | 'founders_pass' | 'coach' | 'coach_pro';

export interface ConsultationProfile {
  ageBand: AgeBand | '';
  goal: Goal | '';
  primaryDiscipline: Discipline | '';
  trainingAge: TrainingAge | '';
  coachingIntent: CoachingIntent | '';
  coachingStyle: CoachingStyle | '';
  frequencyDays: number;
  trainingDays: TrainingDay[];
  sessionMinutes: number;
  facilities: Facility[];
  injuries: Injury[];
  /** ISO date (yyyy-mm-dd) of the athlete's next competition, or '' */
  competitionDate: string;
  selectedTier: MembershipTier;
  locked: boolean;
}

export const EMPTY_CONSULTATION: ConsultationProfile = {
  ageBand: '',
  goal: '',
  primaryDiscipline: '',
  trainingAge: '',
  coachingIntent: '',
  coachingStyle: '',
  frequencyDays: 4,
  trainingDays: [],
  sessionMinutes: 0,
  facilities: [],
  injuries: [],
  competitionDate: '',
  selectedTier: 'core',
  locked: false,
};

/** A sensible starting week for the athlete's experience and age, used until they pick their own days. */
export function suggestedDays(trainingAge: TrainingAge | '', ageBand: AgeBand | '' = ''): TrainingDay[] {
  if (trainingAge === 'new' || trainingAge === '<1yr') return ['Mon', 'Wed', 'Fri'];
  const veteran = trainingAge === '3-5yrs' || trainingAge === '5+yrs' || trainingAge === 'competitor';
  if (veteran && ageBand !== 'under18' && ageBand !== '60+') return ['Mon', 'Tue', 'Wed', 'Fri', 'Sat'];
  return ['Mon', 'Tue', 'Thu', 'Fri'];
}

export function textHitsDiscipline(text: string, discipline: string): boolean {
  const t = text.toLowerCase();
  const d = discipline.toLowerCase();
  if (!d) return false;
  if (d === 'hyrox') return t.includes('hyrox') || t.includes('engine');
  if (d === 'running') return t.includes('run') || t.includes('cardio') || t.includes('pace');
  if (d === 'mobility') return t.includes('mobility') || t.includes('rehab');
  if (d === 'hypertrophy') return t.includes('hypertrophy') || t.includes('volume');
  if (d === 'powerlifting') return t.includes('strength') || t.includes('conjugate') || t.includes('squat');
  if (d === 'crossfit') return t.includes('metcon') || t.includes('conditioning');
  if (d === 'hybrid') return t.includes('hybrid') || t.includes('hyrox');
  return t.includes(d);
}

export function chipHit(text: string, chip: string): boolean {
  if (!chip || chip === 'All' || chip === 'ALL') return true;
  const t = text.toLowerCase();
  const c = chip.toLowerCase();
  if (c === 'hyrox' || c === 'conditioning') return t.includes('hyrox') || t.includes('engine') || t.includes('conditioning') || t.includes('sled') || t.includes('erg');
  if (c === 'crossfit' || c === 'metcon') return t.includes('metcon') || t.includes('wod') || t.includes('conditioning');
  if (c === 'running') return t.includes('run') || t.includes('cardio') || t.includes('pace');
  if (c === 'mobility') return t.includes('mobility') || t.includes('rehab');
  if (c === 'heavy compound') return t.includes('strength') || t.includes('squat') || t.includes('compound') || t.includes('deadlift');
  if (c === 'biomechanics') return t.includes('biomechan') || t.includes('form') || t.includes('cue');
  if (c === 'nutrition') return t.includes('nutrition') || t.includes('fuel') || t.includes('macro');
  return t.includes(c);
}
