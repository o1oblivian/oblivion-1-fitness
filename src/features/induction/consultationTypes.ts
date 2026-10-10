export type Discipline = 'hyrox' | 'running' | 'mobility' | 'hypertrophy' | 'powerlifting' | 'crossfit' | 'hybrid';
export type TrainingAge = '<1yr' | '1-3yrs' | '3-5yrs' | '5+yrs';
export type CoachingIntent = '1-on-1' | 'telemetry-only' | 'self-guided';
export type CoachingStyle = 'biometrics' | 'biomechanics' | 'hardcore';
export type Facility = 'commercial' | 'garage_minimal';
export type MembershipTier = 'core' | 'pro' | 'founders_pass' | 'coach' | 'coach_pro';

export interface ConsultationProfile {
  primaryDiscipline: Discipline | '';
  trainingAge: TrainingAge | '';
  coachingIntent: CoachingIntent | '';
  coachingStyle: CoachingStyle | '';
  frequencyDays: number;
  facility: Facility | '';
  selectedTier: MembershipTier;
  locked: boolean;
}

export const EMPTY_CONSULTATION: ConsultationProfile = {
  primaryDiscipline: '',
  trainingAge: '',
  coachingIntent: '',
  coachingStyle: '',
  frequencyDays: 4,
  facility: '',
  selectedTier: 'core',
  locked: false,
};

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
  if (c === 'hyrox') return t.includes('hyrox') || t.includes('engine') || t.includes('conditioning');
  if (c === 'running') return t.includes('run') || t.includes('cardio') || t.includes('pace');
  if (c === 'mobility') return t.includes('mobility') || t.includes('rehab');
  if (c === 'heavy compound') return t.includes('strength') || t.includes('squat') || t.includes('compound') || t.includes('deadlift');
  if (c === 'biomechanics') return t.includes('biomechan') || t.includes('form') || t.includes('cue');
  if (c === 'nutrition') return t.includes('nutrition') || t.includes('fuel') || t.includes('macro');
  return t.includes(c);
}
