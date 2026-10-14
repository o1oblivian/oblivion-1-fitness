import type { AgeBand, Facility, Injury, TrainingAge } from '../../induction/consultationTypes';

/** What a movement physically needs. Library tags are inconsistent ("Turf"), so the name is read too. */
export type Kit = 'none' | 'bar' | 'free_weights' | 'barbell' | 'gear' | 'erg' | 'sled' | 'machine';

const KIT_PATTERNS: [Exclude<Kit, 'none'>, RegExp][] = [
  ['machine', /machine|cable|smith|leg press|pulldown|pec deck|treadmill|stairmaster|stair climber|wattbike|hack squat|leg extension|leg curl|elliptical/],
  ['erg', /\berg\b|skierg|ski erg|rower|rowing|concept2|assault|echo bike|air bike|bikeerg/],
  ['sled', /sled|prowler|harness/],
  ['barbell', /barbell|trap bar|hex bar|ez[- ]bar|landmine|t-bar|\brig\b/],
  ['gear', /battle rope|heavy bag|medicine ball|med ball|wall ball|plyo box|box jump|box step|hurdle|wicket|\bcones?\b|ghd|sandbag|\brings?\b|rope climb/],
  ['free_weights', /dumbbell|kettlebell|weighted|\bplate\b|\bbelt\b/],
  ['bar', /pull-?up|chin-?up|hanging|toes[- ]to[- ]bar|muscle-?up|\bdips?\b|inverted row/],
];

export function kitNeeds(name: string, equipment = ''): Kit[] {
  const text = `${name} ${equipment}`.toLowerCase();
  const needs = KIT_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([kit]) => kit);
  return needs.length > 0 ? needs : ['none'];
}

const FACILITY_KIT: Record<Facility, Kit[] | 'all'> = {
  commercial: 'all',
  other: 'all',
  functional_box: ['none', 'bar', 'free_weights', 'barbell', 'gear', 'erg', 'sled'],
  garage_minimal: ['none', 'bar', 'free_weights', 'barbell'],
  outdoor: ['none', 'bar'],
  bodyweight: ['none'],
};

/** `null` means no restriction: nothing chosen yet, or a full gym / unknown place is in the list. */
export function availableKit(facilities: readonly Facility[]): Set<Kit> | null {
  if (facilities.length === 0) return null;
  const kit = new Set<Kit>();
  for (const facility of facilities) {
    const access = FACILITY_KIT[facility];
    if (!access || access === 'all') return null;
    access.forEach((item) => kit.add(item));
  }
  return kit;
}

export function canPerform(name: string, equipment: string | undefined, kit: Set<Kit> | null): boolean {
  if (!kit) return true;
  return kitNeeds(name, equipment).every((need) => kit.has(need));
}

/** Bodyweight, bar and erg work is logged by reps, distance or time, not by load. */
export function isUnloaded(name: string, equipment = ''): boolean {
  return kitNeeds(name, equipment).every((need) => need === 'none' || need === 'bar' || need === 'erg');
}

export interface TrainingAgeDose {
  /** Added to the planned set count, clamped to 2–5. */
  setDelta: number;
  /** Multiplies estimated starting loads. */
  loadFactor: number;
  /** Highest target RPE for a new block. */
  rpeCap: number;
}

const DOSE: Record<TrainingAge, TrainingAgeDose> = {
  new: { setDelta: -1, loadFactor: 0.7, rpeCap: 7 },
  '<1yr': { setDelta: -1, loadFactor: 0.8, rpeCap: 7.5 },
  '1-3yrs': { setDelta: 0, loadFactor: 0.92, rpeCap: 8.5 },
  '3-5yrs': { setDelta: 0, loadFactor: 1, rpeCap: 9 },
  '5+yrs': { setDelta: 1, loadFactor: 1.05, rpeCap: 9.5 },
  competitor: { setDelta: 1, loadFactor: 1.05, rpeCap: 9.5 },
};

const NEUTRAL: TrainingAgeDose = { setDelta: 0, loadFactor: 1, rpeCap: 10 };

export function trainingAgeDose(trainingAge: TrainingAge | ''): TrainingAgeDose {
  return trainingAge ? DOSE[trainingAge] : NEUTRAL;
}

/** Growing and older bodies keep reps in reserve and start lighter, whatever their experience. */
export function athleteDose(trainingAge: TrainingAge | '', ageBand: AgeBand | ''): TrainingAgeDose {
  const dose = trainingAgeDose(trainingAge);
  if (ageBand !== 'under18' && ageBand !== '60+') return dose;
  return { setDelta: Math.min(dose.setDelta, 0), loadFactor: dose.loadFactor * 0.9, rpeCap: Math.min(dose.rpeCap, 8) };
}

/** Moves that load each protected area hard. Matching is by name, so it errs on the side of skipping. */
const STRAIN: Record<Exclude<Injury, 'none'>, RegExp> = {
  knees: /jump|bound|burpee|sprint|pistol|depth|hurdle|lunge|split squat|skater|wall ball|thruster|shuttle|agility|foot speed|quickness|\bhops?\b|ladder/,
  lower_back: /deadlift|good morning|bent-over|bent over|pendlay|kettlebell swing|\bswing|clean|snatch|sled|ghd|back extension|jefferson/,
  shoulders: /overhead|military|push press|jerk|snatch|\bdips?\b|upright row|handstand|muscle-?up|behind the neck|wall ball|thruster/,
  wrists: /push-?up|plank|front squat|clean|handstand|burpee|bear crawl|mountain climber/,
};

const HIGH_IMPACT = /jump|bound|depth|plyo|hurdle|burpee|sprint|skater|tuck|muscle-?up|snatch|jerk|shuttle|agility|foot speed|quickness|\bhops?\b/;

export interface SafetyProfile {
  injuries: readonly Injury[];
  ageBand: AgeBand | '';
}

export function isSafeFor(name: string, profile: SafetyProfile): boolean {
  const text = name.toLowerCase();
  if (profile.ageBand === '60+' && HIGH_IMPACT.test(text)) return false;
  return profile.injuries.every((injury) => injury === 'none' || !STRAIN[injury].test(text));
}

export function dosedSets(planned: number, dose: TrainingAgeDose): number {
  return Math.min(5, Math.max(2, planned + dose.setDelta));
}
