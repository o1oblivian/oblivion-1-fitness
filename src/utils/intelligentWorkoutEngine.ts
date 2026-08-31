import { EXERCISE_DATABASE } from '@/data/exerciseDatabase';

export interface SmartExerciseItem {
  name: string;
  category: string;
  targetGroup: string;
  equipment?: string;
  isCompound?: boolean;
}

/**
 * Maps any Workout Focus or Routine Name (e.g. "Push", "Pull", "Legs", "Hyrox", "Upper")
 * to the exact corresponding categories in EXERCISE_DATABASE
 */
export const FOCUS_CATEGORY_MAPPING: Record<string, string[]> = {
  Push: ['Chest & Triceps', 'Shoulders & Abs', 'Bodybuilding', 'Calisthenics & Bodyweight', 'FST-7 & Hypertrophy'],
  Pull: ['Back & Biceps', 'Bodybuilding', 'Calisthenics & Bodyweight', 'FST-7 & Hypertrophy'],
  Legs: ['Legs & Calves', 'Glutes & Posterior Chain', 'Powerlifting', 'Olympic Weightlifting'],
  Upper: ['Chest & Triceps', 'Back & Biceps', 'Shoulders & Abs', 'Bodybuilding', 'FST-7 & Hypertrophy'],
  Lower: ['Legs & Calves', 'Glutes & Posterior Chain', 'Powerlifting'],
  'Full Body': ['Chest & Triceps', 'Back & Biceps', 'Legs & Calves', 'Shoulders & Abs', 'Powerlifting', 'Olympic Weightlifting'],
  Hyrox: ['Hyrox & Functional', 'CrossFit & Functional', 'Running & Track', 'Kettlebell & Functional'],
  Cardio: ['Running & Track', 'Marathon & Ultra', 'Cycling & Bike', 'Swimming & Water', 'Rowing & Erg', 'Hyrox & Functional'],
  Endurance: ['Running & Track', 'Marathon & Ultra', 'Cycling & Bike', 'Swimming & Water', 'Triathlon & Multi-Sport', 'Rowing & Erg'],
  Core: ['Shoulders & Abs', 'Gymnastics & Rings', 'Calisthenics & Bodyweight', 'Pilates & Core Control'],
  Arms: ['Chest & Triceps', 'Back & Biceps', 'Bodybuilding', 'Classic Physique'],
  Strength: ['Powerlifting', 'Olympic Weightlifting', 'Strongman', 'Powerbuilding', 'Highland Games'],
  Functional: ['CrossFit & Functional', 'Kettlebell & Functional', 'Calisthenics & Bodyweight', 'Hyrox & Functional', 'Parkour & Movement'],
  Combat: ['Boxing & Combat', 'MMA & Grappling', 'BJJ & Submission Grappling', 'Judo & Throwing', 'Wrestling', 'Muay Thai & Kickboxing', 'Krav Maga & Self-Defense', 'Sambo & Combat Sambo'],
  Sports: ['Soccer / Football', 'Basketball', 'Tennis & Racquet', 'Boxing & Combat', 'MMA & Grappling', 'Swimming & Water', 'Running & Track', 'Cycling & Bike', 'Rugby & Football', 'Golf', 'Volleyball', 'Hockey (Field & Ice)', 'Baseball & Softball', 'American Football', 'Climbing & Bouldering', 'Surfing & Board Sports'],
  Recovery: ['Breathwork & Mind', 'Yoga & Vinyasa', 'Tai Chi & Qigong', 'Pilates & Core Control', 'Mobility & Joints', 'Stretching & Flexibility', 'Fascia & Myofascial Release', 'Cold & Heat Therapy', 'Active Recovery & Massage', 'Sleep & CNS Recovery', 'Decompression & Traction'],
  'Active Recovery': ['Breathwork & Mind', 'Yoga & Vinyasa', 'Mobility & Joints', 'Stretching & Flexibility', 'Cold & Heat Therapy', 'Active Recovery & Massage', 'Decompression & Traction'],
  Mobility: ['Mobility & Joints', 'Stretching & Flexibility', 'Pilates & Core Control', 'Fascia & Myofascial Release'],
  Breathwork: ['Breathwork & Mind', 'Yoga & Vinyasa', 'Tai Chi & Qigong', 'Sleep & CNS Recovery'],
  Calisthenics: ['Calisthenics & Bodyweight', 'Street Workout & Bar Calisthenics', 'Gymnastics & Rings', 'Parkour & Movement'],
};

/**
 * Intelligent filter that strictly matches a target focus or routine name.
 * If user is on a "Push" day, it ONLY returns push-relevant movements (Chest, Triceps, Anterior Delts).
 */
export function getIntelligentExercises(focus: string, search = '', filterCategory = ''): SmartExerciseItem[] {
  const normFocus = focus?.trim() || 'Full Body';
  const cleanSearch = search.trim().toLowerCase();

  // Determine which database categories are valid for this focus
  let matchedCategories: string[] = [];
  
  // Direct match in map
  for (const [key, cats] of Object.entries(FOCUS_CATEGORY_MAPPING)) {
    if (normFocus.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(normFocus.toLowerCase())) {
      matchedCategories = [...matchedCategories, ...cats];
    }
  }

  // Fallback if none matched
  if (matchedCategories.length === 0) {
    matchedCategories = Object.keys(EXERCISE_DATABASE);
  }

  // De-duplicate categories
  matchedCategories = Array.from(new Set(matchedCategories));

  // If specific category is selected in UI, narrow down to that
  if (filterCategory && filterCategory !== 'All') {
    matchedCategories = matchedCategories.filter(c => c.toLowerCase() === filterCategory.toLowerCase());
  }

  const results: SmartExerciseItem[] = [];

  for (const cat of matchedCategories) {
    const list = EXERCISE_DATABASE[cat] || [];
    for (const name of list) {
      if (cleanSearch) {
        if (!name.toLowerCase().includes(cleanSearch) && !cat.toLowerCase().includes(cleanSearch)) {
          continue;
        }
      }
      
      const isCompound = /press|squat|deadlift|pull-up|dip|clean|snatch|row|lunge/i.test(name);
      
      results.push({
        name,
        category: cat,
        targetGroup: normFocus,
        isCompound,
      });
    }
  }

  return results;
}

/**
 * AI / Smart 1-Tap Blueprint Generator based on Day Focus
 */
export interface BlueprintSlot {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  notes: string;
}

export function generateSmartBlueprint(focus: string): BlueprintSlot[] {
  const f = focus.toLowerCase();

  if (f.includes('push')) {
    return [
      { name: 'Barbell Incline Press', sets: 4, reps: '6-8', restSec: 120, notes: 'Heavy primary compound • RPE 8' },
      { name: 'Dumbbell Bench Press', sets: 3, reps: '8-10', restSec: 90, notes: 'Full stretch at bottom' },
      { name: 'Dips (Chest Focus)', sets: 3, reps: '10-12', restSec: 75, notes: 'Forward lean to target lower pecs' },
      { name: 'Cable Lateral Raise', sets: 4, reps: '12-15', restSec: 60, notes: 'Constant tension • slow eccentric' },
      { name: 'Tricep Pushdown', sets: 3, reps: '12-15', restSec: 60, notes: 'Peak contraction lock at bottom' },
    ];
  }

  if (f.includes('pull')) {
    return [
      { name: 'Conventional Deadlift', sets: 4, reps: '5-6', restSec: 150, notes: 'Main posterior chain strength anchor' },
      { name: 'Barbell Row', sets: 3, reps: '8-10', restSec: 90, notes: 'Pull into lower ribcage' },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12', restSec: 75, notes: 'Wide grip • drive elbows down' },
      { name: 'Face Pull', sets: 4, reps: '15-20', restSec: 60, notes: 'Rear delt and external rotation' },
      { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', restSec: 60, notes: 'Long head bicep focus' },
    ];
  }

  if (f.includes('leg') || f.includes('lower')) {
    return [
      { name: 'Barbell Back Squat', sets: 4, reps: '6-8', restSec: 120, notes: 'Primary quad and glute driver' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', restSec: 90, notes: 'Hip hinge stretch • soft knees' },
      { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12', restSec: 75, notes: 'Elevated rear foot • vertical torso' },
      { name: 'Leg Extension', sets: 3, reps: '12-15', restSec: 60, notes: 'Controlled tempo • 1s pause at top' },
      { name: 'Standing Calf Raise', sets: 4, reps: '15-20', restSec: 45, notes: 'Full dorsiflexion deep stretch' },
    ];
  }

  if (f.includes('hyrox') || f.includes('functional')) {
    return [
      { name: 'SkiErg 1000m Race Pace', sets: 1, reps: '1000m', restSec: 90, notes: 'Target pace: sub 3:45' },
      { name: 'Sled Push 50m Heavy', sets: 4, reps: '50m', restSec: 90, notes: 'Explosive drive • stay low' },
      { name: 'Burpee Broad Jumps 80m', sets: 1, reps: '80m', restSec: 60, notes: 'Consistent rhythmic cadence' },
      { name: 'Farmers Carry 200m (24kg)', sets: 3, reps: '200m', restSec: 60, notes: 'Upright posture • strong grip' },
      { name: 'Wall Balls (100 Reps / 9kg)', sets: 4, reps: '25 reps', restSec: 60, notes: 'Full squat depth • catch fluidly' },
    ];
  }

  // Default Upper / General
  return [
    { name: 'Barbell Bench Press', sets: 4, reps: '6-8', restSec: 120, notes: 'Main press power driver' },
    { name: 'Pull-up', sets: 4, reps: '8-10', restSec: 90, notes: 'Full range of motion' },
    { name: 'Overhead Press', sets: 3, reps: '8-10', restSec: 90, notes: 'Strict lock at top' },
    { name: 'Barbell Row', sets: 3, reps: '8-10', restSec: 90, notes: 'Controlled torso angle' },
    { name: 'Bicep Curl', sets: 3, reps: '12-15', restSec: 60, notes: 'Super-set finisher' },
  ];
}
