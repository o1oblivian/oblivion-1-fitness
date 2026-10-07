import { ExerciseDefinition, DisciplineType } from '../../../types/workout';
import { EXERCISE_DATABASE } from '../../../data/exerciseDatabase';

export function filterEffectivePool(
  discipline: DisciplineType,
  selectedCategory: string,
  selectedEquipment: string
): ExerciseDefinition[] {
  const pool = EXERCISE_DATABASE.filter((e) => {
    const matchDiscipline = e.discipline === discipline;
    const matchEquip =
      selectedEquipment === 'All Equipment' ||
      e.equipment?.toLowerCase() === selectedEquipment.toLowerCase();
    const catLower = selectedCategory.toLowerCase().trim();
    const eCatLower = (e.category || '').toLowerCase().trim();
    const eGroupLower = (e.primaryMuscleGroup || '').toLowerCase().trim();
    const eMuscleLower = ((e.primaryMuscle as string) || '').toLowerCase().trim();

    const matchCategory =
      eCatLower === catLower ||
      eCatLower.includes(catLower) ||
      catLower.includes(eCatLower) ||
      eGroupLower.includes(catLower) ||
      eMuscleLower.includes(catLower) ||
      (catLower.includes('chest') &&
        (e.name.toLowerCase().includes('press') ||
          e.name.toLowerCase().includes('bench') ||
          e.name.toLowerCase().includes('fly') ||
          e.name.toLowerCase().includes('push-up') ||
          e.name.toLowerCase().includes('dip'))) ||
      (catLower.includes('back') &&
        (e.name.toLowerCase().includes('pull') ||
          e.name.toLowerCase().includes('row') ||
          e.name.toLowerCase().includes('lat') ||
          e.name.toLowerCase().includes('chin'))) ||
      (catLower.includes('quad') &&
        (e.name.toLowerCase().includes('squat') ||
          e.name.toLowerCase().includes('leg press') ||
          e.name.toLowerCase().includes('lunge') ||
          e.name.toLowerCase().includes('extension'))) ||
      (catLower.includes('hamstring') &&
        (e.name.toLowerCase().includes('deadlift') ||
          e.name.toLowerCase().includes('curl') ||
          e.name.toLowerCase().includes('rdl') ||
          e.name.toLowerCase().includes('good morning'))) ||
      (catLower.includes('glute') &&
        (e.name.toLowerCase().includes('thrust') ||
          e.name.toLowerCase().includes('bridge') ||
          e.name.toLowerCase().includes('kickback'))) ||
      (catLower.includes('forearm') &&
        (e.name.toLowerCase().includes('wrist') ||
          e.name.toLowerCase().includes('grip') ||
          e.name.toLowerCase().includes('hang') ||
          e.name.toLowerCase().includes('pinch'))) ||
      (catLower.includes('adductor') &&
        (e.name.toLowerCase().includes('adductor') ||
          e.name.toLowerCase().includes('copenhagen') ||
          e.name.toLowerCase().includes('sumo') ||
          e.name.toLowerCase().includes('abduct'))) ||
      (catLower.includes('trap') &&
        (e.name.toLowerCase().includes('shrug') ||
          e.name.toLowerCase().includes('face pull') ||
          e.name.toLowerCase().includes('upright'))) ||
      (catLower.includes('calv') &&
        (e.name.toLowerCase().includes('calf') || e.name.toLowerCase().includes('raise')));

    return matchDiscipline && matchEquip && matchCategory;
  });

  if (pool.length > 0) return pool;
  const fallback = EXERCISE_DATABASE.filter((e) => e.discipline === discipline);
  return fallback.length > 0 ? fallback : EXERCISE_DATABASE;
}
