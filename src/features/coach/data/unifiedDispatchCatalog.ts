import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';
import { ExerciseDefinition } from '../../../types/workout';
import { DISPATCH_EXERCISE_CATALOG, DispatchCatalogExercise } from './dispatchExerciseCatalog';

function mapDispatchCategory(def: ExerciseDefinition): DispatchCatalogExercise['category'] {
  const c = (def.category || '').toLowerCase();
  const muscle = `${def.primaryMuscleGroup || ''} ${def.primaryMuscle || ''}`.toLowerCase();
  if (def.discipline === 'recovery') return 'Recovery & Breath';
  if (def.discipline === 'sports') {
    if (c.includes('hyrox')) return 'Hyrox & Motion';
    return 'Sports & Athletics';
  }
  if (c.includes('chest') || c.includes('tricep') || muscle.includes('chest')) return 'Push (Chest & Tri)';
  if (c.includes('back') || c.includes('lat') || c.includes('bicep') || muscle.includes('back')) return 'Pull (Back & Bi)';
  if (c.includes('shoulder') || c.includes('delt') || c.includes('trap')) return 'Shoulders & Delts';
  if (c.includes('arm') || c.includes('forearm') || c.includes('grip')) return 'Arms & Forearms';
  if (c.includes('core') || c.includes('abs')) return 'Core & Stability';
  if (
    c.includes('quad') ||
    c.includes('hamstring') ||
    c.includes('glute') ||
    c.includes('calf') ||
    c.includes('hip') ||
    c.includes('olympic') ||
    c.includes('powerlift') ||
    c.includes('strongman')
  ) {
    return 'Legs & Glutes';
  }
  return 'Sports & Athletics';
}

function mapDispatchType(def: ExerciseDefinition): DispatchCatalogExercise['type'] {
  if (def.mechanic === 'isolation') return 'Isolation';
  if (def.discipline === 'sports' || def.discipline === 'recovery' || def.mechanic === 'aerobic') return 'Functional';
  return 'Compound';
}

function mapDispatchEquipment(eq: string): DispatchCatalogExercise['equipment'] {
  const e = (eq || '').toLowerCase();
  if (e.includes('dumb')) return 'Dumbbell';
  if (e.includes('cable')) return 'Cable';
  if (e.includes('machine')) return 'Machine';
  if (e.includes('kettle')) return 'Kettlebell';
  if (e.includes('body') || e.includes('mat') || e.includes('turf') || e.includes('erg')) return 'Bodyweight';
  return 'Barbell';
}

function toDispatch(def: ExerciseDefinition): DispatchCatalogExercise {
  return {
    id: `db-${def.id}`,
    name: def.name,
    category: mapDispatchCategory(def),
    type: mapDispatchType(def),
    muscleTarget: def.primaryMuscleGroup || def.primaryMuscle || def.category,
    cue: def.subLabel || def.category,
    defaultSets: def.defaultSets || 3,
    defaultReps: def.defaultReps || 10,
    defaultRpe: 8.0,
    defaultWeightKg: def.defaultWeightKg || 0,
    equipment: mapDispatchEquipment(String(def.equipment)),
  };
}

export const UNIFIED_DISPATCH_CATALOG: DispatchCatalogExercise[] = (() => {
  const seen = new Set(DISPATCH_EXERCISE_CATALOG.map((ex) => ex.name.toLowerCase()));
  const extra = EXERCISE_DATABASE.filter((ex) => !seen.has(ex.name.toLowerCase())).map(toDispatch);
  return [...DISPATCH_EXERCISE_CATALOG, ...extra];
})();
