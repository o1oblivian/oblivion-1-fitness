import {
  type AthleticVector,
  type BlueprintBuilder,
  type DurationConfig,
  type FacilityGear,
  type IntensityMode,
  type SessionDuration,
  type SynthesizedBlueprint,
} from './blueprintSynth/synthTypes';
import { bodySplitBlueprints } from './blueprintSynth/bodySplitBlueprints';
import { conditioningBlueprints } from './blueprintSynth/conditioningBlueprints';
import { legsBlueprints } from './blueprintSynth/legsBlueprints';
import { pullBlueprints } from './blueprintSynth/pullBlueprints';
import { pushBlueprints } from './blueprintSynth/pushBlueprints';
import { bioRecovery } from './blueprintSynth/recoveryBlueprint';

export type {
  AthleticVector,
  FacilityGear,
  IntensityMode,
  SessionDuration,
  SynthesizedBlueprint,
} from './blueprintSynth/synthTypes';

const DURATION_CONFIG: Record<SessionDuration, DurationConfig> = {
  '20m': { mins: 20, moves: 3, setsPerMove: 3 },
  '30m': { mins: 30, moves: 3, setsPerMove: 3 },
  '45m': { mins: 45, moves: 5, setsPerMove: 4 },
  '60m': { mins: 60, moves: 6, setsPerMove: 4 },
  '75m': { mins: 75, moves: 7, setsPerMove: 4 },
};

const BUILDERS: Record<AthleticVector, BlueprintBuilder> = {
  ...pushBlueprints,
  ...pullBlueprints,
  ...legsBlueprints,
  ...bodySplitBlueprints,
  ...conditioningBlueprints,
  'Bio-Recovery': bioRecovery,
};

/**
 * Builds one day's session for a training focus, fitted to the session length, the gear the
 * athlete has, and how hard they want to push. An unknown focus gives the recovery session and
 * an unknown length gives the 45-minute one.
 */
export function synthesizeDailyBlueprint(
  vector: AthleticVector,
  duration: SessionDuration = '45m',
  gear: FacilityGear = 'Full Gym',
  intensity: IntensityMode = 'Progressive RPE',
  _seedIndex: number = 0,
): SynthesizedBlueprint {
  const config = DURATION_CONFIG[duration] || DURATION_CONFIG['45m'];
  const build = BUILDERS[vector] ?? bioRecovery;
  return build({ duration, gear, intensity, config });
}
