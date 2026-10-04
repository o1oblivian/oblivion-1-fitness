export type MobilityCategory =
  | 'Full Mobility'
  | 'Spine & Decompress'
  | 'Hips & Pelvic'
  | 'Hamstring'
  | 'Parasympathetic'
  | 'Upper Body & Scapular';

export interface MobilityExercise {
  id: string;
  title: string;
  category: MobilityCategory;
  secondaryCategories: MobilityCategory[];
  tierDescription: string;
  targetSets: number;
  targetRepsOrHold: string;
  targetSetsCount: number;
  targetRepsCount: number;
  targetHoldSecs?: number;
  restSecs: number;
  equipment: string;
  anatomicalFocus: string[];
  rpe?: number;
}
