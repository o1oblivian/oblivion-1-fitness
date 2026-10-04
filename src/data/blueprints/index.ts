import { WorkoutBlueprint } from '../workoutBlueprints';
import { HYPERTROPHY_BLUEPRINTS } from './hypertrophyBlueprints';
import { STRENGTH_BLUEPRINTS } from './strengthBlueprints';
import { HYBRID_BLUEPRINTS } from './hybridBlueprints';
import { MOBILITY_BLUEPRINTS } from './mobilityBlueprints';
import { PLYOMETRICS_BLUEPRINTS } from './plyometricsBlueprints';
import { GLUTE_LAB_BLUEPRINTS } from './gluteLabBlueprints';

export * from './hypertrophyBlueprints';
export * from './strengthBlueprints';
export * from './hybridBlueprints';
export * from './mobilityBlueprints';
export * from './plyometricsBlueprints';
export * from './gluteLabBlueprints';

export const ALL_MASTER_BLUEPRINTS: WorkoutBlueprint[] = [
  ...HYPERTROPHY_BLUEPRINTS,
  ...STRENGTH_BLUEPRINTS,
  ...HYBRID_BLUEPRINTS,
  ...MOBILITY_BLUEPRINTS,
  ...PLYOMETRICS_BLUEPRINTS,
  ...GLUTE_LAB_BLUEPRINTS,
];
