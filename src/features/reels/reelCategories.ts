/** The one list of reel categories. Upload form, feed mapper, filters and Workout circles all read it. */
export const REEL_CATEGORIES = [
  { id: 'TUTORIAL', label: 'App guide', desc: 'How to use the app', coachPick: false },
  { id: 'HYPERTROPHY', label: 'Hypertrophy', desc: 'Muscle growth and tension', coachPick: true },
  { id: 'BIOMECHANICS', label: 'Biomechanics', desc: 'Form cues and leverage', coachPick: true },
  { id: 'STRENGTH', label: 'Strength', desc: 'Heavy compound lifts', coachPick: true },
  { id: 'MOBILITY', label: 'Mobility', desc: 'Range of motion and flow', coachPick: true },
  { id: 'CONDITIONING', label: 'Conditioning', desc: 'Sleds, ergs, carries and intervals', coachPick: true },
  { id: 'REHAB', label: 'Rehab', desc: 'Injury prevention and return to training', coachPick: true },
] as const;

export type ReelCategoryId = (typeof REEL_CATEGORIES)[number]['id'];

export const COACH_REEL_CATEGORIES = REEL_CATEGORIES.filter((c) => c.coachPick);

export const BODY_PART_TAGS = ['CHEST & TRICEPS', 'BACK & BICEPS', 'QUADS & GLUTES', 'SHOULDERS & ARMS'] as const;

export type BodyPartTag = (typeof BODY_PART_TAGS)[number];

/** Categories whose clips need a "not medical advice" line. */
export const HEALTH_CATEGORIES: ReadonlySet<string> = new Set<ReelCategoryId>(['REHAB', 'MOBILITY']);

export const NOT_MEDICAL_ADVICE = 'General training guidance, not medical advice. See a health professional for pain or injury.';

const IDS = new Set<string>(REEL_CATEGORIES.map((c) => c.id));

const isReelCategory = (value: unknown): value is ReelCategoryId => typeof value === 'string' && IDS.has(value);

/** Reads a stored category, including rows saved before categories were exclusive. */
export function normalizeReelCategory(category: unknown, filterTag?: unknown): ReelCategoryId | null {
  if (isReelCategory(category)) return category;
  if (category === 'HYROX' || filterTag === 'HYROX / CONDITIONING') return 'CONDITIONING';
  if (filterTag === 'TUTORIAL') return 'TUTORIAL';
  return null;
}

export function normalizeBodyPart(tag: unknown): BodyPartTag | null {
  return typeof tag === 'string' && (BODY_PART_TAGS as readonly string[]).includes(tag) ? (tag as BodyPartTag) : null;
}

export const reelCategoryLabel = (id: string): string => REEL_CATEGORIES.find((c) => c.id === id)?.label ?? 'Reels';
