import { EXERCISE_DATABASE } from '@/data/exerciseDatabase';

export interface SmartExerciseItem {
  name: string;
  category: string;
  targetGroup: string;
  equipment?: string;
  isCompound?: boolean;
}

/**
 * Maps any Workout Focus or Routine Name (e.g. "Push", "Pull", "Mobility", "Zone 2", "Striking", "HYROX")
 * to the exact corresponding categories in EXERCISE_DATABASE
 */
export const FOCUS_CATEGORY_MAPPING: Record<string, string[]> = {
  // Push / Pull / Legs
  Push: ['Chest & Triceps', 'Shoulders & Abs', 'Bodybuilding', 'Calisthenics & Bodyweight', 'FST-7 & Hypertrophy'],
  Pull: ['Back & Biceps', 'Bodybuilding', 'Calisthenics & Bodyweight', 'FST-7 & Hypertrophy'],
  Legs: ['Legs & Calves', 'Glutes & Posterior Chain', 'Powerlifting', 'Olympic Weightlifting'],
  'Legs & Calves': ['Legs & Calves', 'Glutes & Posterior Chain', 'Powerlifting'],
  'Glutes & Chain': ['Glutes & Posterior Chain', 'Legs & Calves', 'Powerlifting'],
  'Chest & Triceps': ['Chest & Triceps', 'Bodybuilding', 'FST-7 & Hypertrophy'],
  'Back & Biceps': ['Back & Biceps', 'Bodybuilding', 'FST-7 & Hypertrophy'],
  'Shoulders & Abs': ['Shoulders & Abs', 'Bodybuilding', 'Calisthenics & Bodyweight'],
  Upper: ['Chest & Triceps', 'Back & Biceps', 'Shoulders & Abs', 'Bodybuilding', 'FST-7 & Hypertrophy'],
  'Upper Body': ['Chest & Triceps', 'Back & Biceps', 'Shoulders & Abs', 'Bodybuilding', 'FST-7 & Hypertrophy'],
  Lower: ['Legs & Calves', 'Glutes & Posterior Chain', 'Powerlifting'],
  'Lower Body': ['Legs & Calves', 'Glutes & Posterior Chain', 'Powerlifting'],
  'Full Body': ['Chest & Triceps', 'Back & Biceps', 'Legs & Calves', 'Shoulders & Abs', 'Powerlifting', 'Olympic Weightlifting'],
  
  // Powerlifting & Heavy Strength
  'Squat Priority': ['Powerlifting', 'Legs & Calves', 'Olympic Weightlifting'],
  'Bench Priority': ['Powerlifting', 'Chest & Triceps', 'Powerbuilding'],
  'Deadlift Priority': ['Powerlifting', 'Back & Biceps', 'Glutes & Posterior Chain'],
  'Overhead & Triceps': ['Shoulders & Abs', 'Chest & Triceps', 'Powerlifting'],
  'Accessory & GPP': ['Powerlifting', 'Kettlebell & Functional', 'CrossFit & Functional'],

  // HYROX & Functional
  Hyrox: ['Hyrox & Functional', 'CrossFit & Functional', 'Running & Track', 'Kettlebell & Functional', 'Rowing & Erg'],
  'HYROX Simulation': ['Hyrox & Functional', 'Running & Track', 'Rowing & Erg', 'CrossFit & Functional'],
  'Erg & Sled Power': ['Hyrox & Functional', 'Rowing & Erg', 'CrossFit & Functional'],
  'Compromised Running': ['Running & Track', 'Hyrox & Functional', 'Obstacle Course Racing'],
  'Strength Stamina': ['Hyrox & Functional', 'Kettlebell & Functional', 'CrossFit & Functional'],
  'Carry & Wall Balls': ['Hyrox & Functional', 'Kettlebell & Functional', 'CrossFit & Functional'],
  'Engine Capacity': ['Hyrox & Functional', 'Running & Track', 'Rowing & Erg', 'Cycling & Bike'],

  // Endurance & Track
  Cardio: ['Running & Track', 'Marathon & Ultra', 'Cycling & Bike', 'Swimming & Water', 'Rowing & Erg', 'Hyrox & Functional'],
  Endurance: ['Running & Track', 'Marathon & Ultra', 'Cycling & Bike', 'Swimming & Water', 'Triathlon & Multi-Sport', 'Rowing & Erg'],
  'Zone 2 Aerobic Base': ['Running & Track', 'Marathon & Ultra', 'Cycling & Bike', 'Rowing & Erg'],
  'Threshold Intervals': ['Running & Track', 'Marathon & Ultra', 'Triathlon & Multi-Sport'],
  'VO2 Max Repeats': ['Running & Track', 'CrossFit & Functional', 'Rowing & Erg'],
  'Long Tempo': ['Running & Track', 'Marathon & Ultra', 'Cycling & Bike'],
  'Long Tempo Run': ['Running & Track', 'Marathon & Ultra'],
  'Aerobic Engine Stamina': ['Running & Track', 'Rowing & Erg', 'Cycling & Bike', 'Triathlon & Multi-Sport'],

  // Mobility & Movement Flow
  Mobility: ['Mobility & Joints', 'Stretching & Flexibility', 'Pilates & Core Control', 'Fascia & Myofascial Release', 'Yoga & Vinyasa', 'Decompression & Traction'],
  'Hip & Pelvic Flow': ['Mobility & Joints', 'Stretching & Flexibility', 'Yoga & Vinyasa', 'Pilates & Core Control'],
  'Thoracic & Shoulder': ['Mobility & Joints', 'Stretching & Flexibility', 'Gymnastics & Rings'],
  'Spine & Core': ['Pilates & Core Control', 'Mobility & Joints', 'Stretching & Flexibility', 'Decompression & Traction'],
  'Ankle & Foot': ['Mobility & Joints', 'Stretching & Flexibility', 'Running & Track'],
  'Full Body Restore': ['Mobility & Joints', 'Stretching & Flexibility', 'Yoga & Vinyasa', 'Active Recovery & Massage'],
  'Full Body Recovery Flow': ['Mobility & Joints', 'Stretching & Flexibility', 'Yoga & Vinyasa', 'Breathwork & Mind'],
  'Active Decompression': ['Decompression & Traction', 'Mobility & Joints', 'Yoga & Vinyasa'],

  // Combat / Boxing / MMA
  Combat: ['Boxing & Combat', 'MMA & Grappling', 'BJJ & Submission Grappling', 'Judo & Throwing', 'Wrestling', 'Muay Thai & Kickboxing', 'Krav Maga & Self-Defense', 'Sambo & Combat Sambo'],
  'Striking & Speed': ['Boxing & Combat', 'Muay Thai & Kickboxing'],
  'Rotational Power': ['Boxing & Combat', 'Kettlebell & Functional', 'Shoulders & Abs'],
  'Roadwork & Intervals': ['Running & Track', 'Boxing & Combat', 'CrossFit & Functional'],
  'Trunk & Neck Armor': ['Boxing & Combat', 'MMA & Grappling', 'Wrestling', 'Shoulders & Abs'],
  'Anaerobic Sparring Capacity': ['Boxing & Combat', 'MMA & Grappling', 'CrossFit & Functional'],

  // Sport-Specific & Agility
  Sports: ['Soccer / Football', 'Basketball', 'Tennis & Racquet', 'Boxing & Combat', 'MMA & Grappling', 'Swimming & Water', 'Running & Track', 'Cycling & Bike', 'Rugby & Football', 'Golf', 'Volleyball', 'Hockey (Field & Ice)', 'Baseball & Softball', 'American Football', 'Climbing & Bouldering'],
  'Sport-Specific': ['Soccer / Football', 'Basketball', 'Tennis & Racquet', 'Running & Track', 'CrossFit & Functional', 'Kettlebell & Functional'],
  'Acceleration & Speed': ['Running & Track', 'CrossFit & Functional', 'Legs & Calves'],
  'Agility & COD': ['Soccer / Football', 'Basketball', 'Tennis & Racquet', 'Running & Track'],
  'Plyometric Power': ['CrossFit & Functional', 'Legs & Calves', 'Gymnastics & Rings'],
  'Deceleration & Braking': ['Legs & Calves', 'Soccer / Football', 'Running & Track'],
  'Strength Transfer': ['Olympic Weightlifting', 'Powerlifting', 'Kettlebell & Functional'],

  // Calisthenics & Gymnastics
  Calisthenics: ['Calisthenics & Bodyweight', 'Street Workout & Bar Calisthenics', 'Gymnastics & Rings', 'Parkour & Movement'],
  'Straight Arm & Lever': ['Gymnastics & Rings', 'Street Workout & Bar Calisthenics', 'Calisthenics & Bodyweight'],
  'Bent Arm Pull': ['Calisthenics & Bodyweight', 'Street Workout & Bar Calisthenics', 'Back & Biceps'],
  'Bent Arm Push': ['Calisthenics & Bodyweight', 'Street Workout & Bar Calisthenics', 'Chest & Triceps'],
  'Handstand & Balance': ['Gymnastics & Rings', 'Calisthenics & Bodyweight', 'Parkour & Movement'],
  'Legs & Core Control': ['Calisthenics & Bodyweight', 'Pilates & Core Control', 'Legs & Calves'],

  // General & Recovery
  Core: ['Shoulders & Abs', 'Gymnastics & Rings', 'Calisthenics & Bodyweight', 'Pilates & Core Control'],
  Arms: ['Chest & Triceps', 'Back & Biceps', 'Bodybuilding', 'Classic Physique'],
  Strength: ['Powerlifting', 'Olympic Weightlifting', 'Strongman', 'Powerbuilding', 'Highland Games'],
  Functional: ['CrossFit & Functional', 'Kettlebell & Functional', 'Calisthenics & Bodyweight', 'Hyrox & Functional', 'Parkour & Movement'],
  Conditioning: ['CrossFit & Functional', 'Hyrox & Functional', 'Running & Track', 'Kettlebell & Functional', 'Rowing & Erg'],
  'Metabolic Resistance': ['CrossFit & Functional', 'Bodybuilding', 'Kettlebell & Functional'],
  'Active Recovery': ['Breathwork & Mind', 'Yoga & Vinyasa', 'Mobility & Joints', 'Stretching & Flexibility', 'Cold & Heat Therapy', 'Active Recovery & Massage', 'Decompression & Traction'],
  'Rest Day': ['Breathwork & Mind', 'Sleep & CNS Recovery', 'Active Recovery & Massage'],
};

/**
 * Category-specific Day Focus Options for Step 2 Builder Pills
 */
export const CATEGORY_FOCUS_OPTIONS: Record<string, string[]> = {
  Hypertrophy: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Chest & Triceps', 'Back & Biceps', 'Shoulders & Abs', 'Arms', 'Rest Day'],
  'Push Pull Legs': ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Arms', 'Active Recovery', 'Rest Day'],
  Strength: ['Squat Priority', 'Bench Priority', 'Deadlift Priority', 'Overhead & Triceps', 'Accessory & GPP', 'Active Recovery', 'Rest Day'],
  Powerlifting: ['Squat Priority', 'Bench Priority', 'Deadlift Priority', 'Overhead & Triceps', 'Accessory & GPP', 'Active Recovery', 'Rest Day'],
  HYROX: ['HYROX Simulation', 'Erg & Sled Power', 'Compromised Running', 'Strength Stamina', 'Carry & Wall Balls', 'Engine Capacity', 'Active Recovery'],
  Endurance: ['Zone 2 Aerobic Base', 'Threshold Intervals', 'VO2 Max Repeats', 'Long Tempo Run', 'Aerobic Engine Stamina', 'Active Recovery', 'Rest Day'],
  Mobility: ['Hip & Pelvic Flow', 'Thoracic & Shoulder', 'Spine & Core', 'Ankle & Foot', 'Full Body Restore', 'Active Decompression', 'Rest Day'],
  'Sport-Specific': ['Acceleration & Speed', 'Agility & COD', 'Rotational Power', 'Plyometric Power', 'Deceleration & Braking', 'Strength Transfer', 'Rest Day'],
  'Body Recomp': ['Metabolic Resistance', 'Upper Body', 'Lower Body', 'Conditioning', 'Core', 'Active Recovery', 'Rest Day'],
  'Weight Loss': ['Metabolic Resistance', 'Conditioning', 'Full Body', 'Zone 2 Aerobic Base', 'Core', 'Active Recovery', 'Rest Day'],
  'Full Body': ['Full Body', 'Metabolic Resistance', 'Core', 'Conditioning', 'Active Recovery', 'Rest Day'],
  'Upper / Lower': ['Upper Body', 'Lower Body', 'Conditioning', 'Core', 'Active Recovery', 'Rest Day'],
  'Beginner Friendly': ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Mobility', 'Active Recovery', 'Rest Day'],
  Calisthenics: ['Straight Arm & Lever', 'Bent Arm Pull', 'Bent Arm Push', 'Handstand & Balance', 'Legs & Core Control', 'Active Recovery', 'Rest Day'],
};

/**
 * Category-specific Default Day Schedule Generator
 */
export const CATEGORY_DEFAULT_SPLITS: Record<string, string[]> = {
  Hypertrophy: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Arms', 'Rest Day'],
  'Push Pull Legs': ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest Day'],
  Strength: ['Squat Priority', 'Bench Priority', 'Deadlift Priority', 'Overhead & Triceps', 'Accessory & GPP', 'Active Recovery', 'Rest Day'],
  Powerlifting: ['Squat Priority', 'Bench Priority', 'Deadlift Priority', 'Overhead & Triceps', 'Accessory & GPP', 'Active Recovery', 'Rest Day'],
  HYROX: ['Erg & Sled Power', 'Compromised Running', 'Strength Stamina', 'HYROX Simulation', 'Carry & Wall Balls', 'Engine Capacity', 'Active Recovery'],
  Endurance: ['Zone 2 Aerobic Base', 'Threshold Intervals', 'Aerobic Engine Stamina', 'Long Tempo Run', 'VO2 Max Repeats', 'Active Recovery', 'Rest Day'],
  Mobility: ['Hip & Pelvic Flow', 'Thoracic & Shoulder', 'Spine & Core', 'Full Body Restore', 'Ankle & Foot', 'Active Decompression', 'Rest Day'],
  'Sport-Specific': ['Acceleration & Speed', 'Agility & COD', 'Rotational Power', 'Plyometric Power', 'Strength Transfer', 'Deceleration & Braking', 'Rest Day'],
  'Body Recomp': ['Metabolic Resistance', 'Upper Body', 'Lower Body', 'Conditioning', 'Full Body', 'Active Recovery', 'Rest Day'],
  'Weight Loss': ['Metabolic Resistance', 'Conditioning', 'Lower Body', 'Zone 2 Aerobic Base', 'Upper Body', 'Active Recovery', 'Rest Day'],
  'Full Body': ['Full Body', 'Conditioning', 'Full Body', 'Active Recovery', 'Full Body', 'Core', 'Rest Day'],
  'Upper / Lower': ['Upper Body', 'Lower Body', 'Upper Body', 'Lower Body', 'Conditioning', 'Active Recovery', 'Rest Day'],
  'Beginner Friendly': ['Full Body', 'Core', 'Full Body', 'Mobility', 'Full Body', 'Active Recovery', 'Rest Day'],
  Calisthenics: ['Straight Arm & Lever', 'Bent Arm Pull', 'Bent Arm Push', 'Handstand & Balance', 'Legs & Core Control', 'Active Recovery', 'Rest Day'],
};

export function getDefaultFocusForCategory(category: string, dayIndex: number): string {
  const split = CATEGORY_DEFAULT_SPLITS[category] || CATEGORY_DEFAULT_SPLITS.Hypertrophy;
  return split[dayIndex % split.length] || 'Full Body';
}

/**
 * Intelligent filter that strictly matches a target focus or routine name.
 */
export function getIntelligentExercises(focus: string, search = '', filterCategory = '', programCategory = ''): SmartExerciseItem[] {
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

  // If still empty and programCategory is given, check category mapping
  if (matchedCategories.length === 0 && programCategory) {
    for (const [key, cats] of Object.entries(FOCUS_CATEGORY_MAPPING)) {
      if (programCategory.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(programCategory.toLowerCase())) {
        matchedCategories = [...matchedCategories, ...cats];
      }
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
      
      const isCompound = /press|squat|deadlift|pull-up|dip|clean|snatch|row|lunge|interval|sled|skierg|sprint/i.test(name);
      
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
 * AI / Smart 1-Tap Blueprint Generator based on Day Focus & Coaching Discipline
 */
export interface BlueprintSlot {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  notes: string;
}

export function applyDifficultyModifier(slots: BlueprintSlot[], difficulty: string): BlueprintSlot[] {
  const diff = (difficulty || 'Intermediate').toLowerCase();
  if (diff.includes('beginner')) {
    return slots.map((s) => ({
      ...s,
      sets: Math.max(2, s.sets - 1),
      restSec: s.restSec > 0 ? Math.round(s.restSec * 1.25) : 0,
      notes: s.notes ? `${s.notes} • Form priority` : 'Controlled tempo & form priority',
    }));
  }
  if (diff.includes('advanced')) {
    return slots.map((s) => ({
      ...s,
      sets: Math.min(5, s.sets + 1),
      notes: s.notes ? `${s.notes} • RPE 8.5` : 'High tension load',
    }));
  }
  if (diff.includes('elite')) {
    return slots.map((s) => ({
      ...s,
      sets: Math.min(6, s.sets + 1),
      restSec: s.restSec > 60 ? Math.round(s.restSec * 0.9) : s.restSec,
      notes: s.notes ? `${s.notes} • Peak intensity RPE 9.0+` : 'Peak neural drive',
    }));
  }
  return slots;
}

export function generateSmartBlueprint(focus: string, programCategory = '', difficulty = 'Intermediate'): BlueprintSlot[] {
  const f = (focus || '').toLowerCase();
  const cat = (programCategory || '').toLowerCase();

  const getBaseSlots = (): BlueprintSlot[] => {
  // 1. Mobility & Movement Flow
  if (cat.includes('mobility') || f.includes('mobility') || f.includes('pelvic') || f.includes('hip') || f.includes('thoracic') || f.includes('spine') || f.includes('restore') || f.includes('decompression')) {
    if (f.includes('hip') || f.includes('pelvic')) {
      return [
        { name: '90/90 Hip Transition Flow', sets: 3, reps: '8 reps / side', restSec: 45, notes: 'Controlled internal & external rotation' },
        { name: 'Pigeon Pose Active CARs', sets: 3, reps: '60s hold', restSec: 30, notes: 'Deep glute & joint capsule opening' },
        { name: 'Couch Stretch (Hip Flexor / Quad)', sets: 3, reps: '45s / side', restSec: 30, notes: 'Squeeze glute • maintain neutral pelvis' },
        { name: 'Goblet Squat (Deep Pause & Pry)', sets: 3, reps: '60s hold', restSec: 45, notes: 'Pry knees wide with elbows • tall spine' },
        { name: 'Cossack Squat (Lateral Mobility)', sets: 3, reps: '8 reps / side', restSec: 45, notes: 'Full depth • adductor & ankle stretch' },
      ];
    }
    if (f.includes('thoracic') || f.includes('shoulder')) {
      return [
        { name: 'Cat-Cow (Segmental Spine Flow)', sets: 3, reps: '10 reps', restSec: 30, notes: 'Articulate vertebra by vertebra' },
        { name: 'Thread the Needle Thoracic Reach', sets: 3, reps: '8 reps / side', restSec: 30, notes: 'Exhale on rotational reach' },
        { name: 'Scapular Wall Slides', sets: 3, reps: '12 reps', restSec: 45, notes: 'Keep wrists, elbows & lower back on wall' },
        { name: 'Band Pull-Apart (External Rotation)', sets: 3, reps: '15 reps', restSec: 30, notes: 'Depress shoulders • squeeze rhomboids' },
        { name: 'Dead Hang (Spinal Decompression)', sets: 3, reps: '45s hold', restSec: 45, notes: 'Passive shoulder stretch & lat length' },
      ];
    }
    if (f.includes('ankle') || f.includes('foot')) {
      return [
        { name: 'Ankle Dorsiflexion (Knee to Wall)', sets: 3, reps: '12 reps / side', restSec: 30, notes: 'Drive knee 4 inches past toes' },
        { name: 'Tibialis Raise (Wall Lean)', sets: 3, reps: '20 reps', restSec: 30, notes: 'Full dorsiflexion burn • slow eccentric' },
        { name: 'Single-Leg Balance on Foam Pad', sets: 3, reps: '45s / side', restSec: 30, notes: 'Arch engagement & foot stability' },
        { name: 'Standing Calf Raise (Full Dorsiflexion Deep Stretch)', sets: 3, reps: '15 reps (3s hold)', restSec: 45, notes: 'Pause in deepest stretch' },
      ];
    }
    // General Full Body Restore / Decompression
    return [
      { name: 'World\'s Greatest Stretch Flow', sets: 3, reps: '5 reps / side', restSec: 45, notes: 'Lunge, thoracic reach & hamstring sweep' },
      { name: '90/90 Hip Transition Flow', sets: 3, reps: '8 reps / side', restSec: 30, notes: 'Smooth controlled hip rotation' },
      { name: 'Cat-Cow (Segmental Spine Flow)', sets: 3, reps: '10 slow reps', restSec: 30, notes: 'Breath-synchronized spinal motion' },
      { name: 'Dead Hang (Spinal Decompression)', sets: 3, reps: '60s hold', restSec: 45, notes: 'Decompress spinal disc pressure' },
      { name: 'Diaphragmatic Box Breathing', sets: 1, reps: '5 min flow', restSec: 0, notes: '4s inhale, 4s hold, 4s exhale, 4s hold' },
    ];
  }

  // 2. Endurance & Track Engine
  if (cat.includes('endurance') || f.includes('endurance') || f.includes('zone 2') || f.includes('threshold') || f.includes('vo2') || f.includes('tempo') || f.includes('marathon')) {
    if (f.includes('zone 2') || f.includes('base')) {
      return [
        { name: 'Zone 2 Continuous Aerobic Run', sets: 1, reps: '45-60 min', restSec: 0, notes: 'Conversational pace • Heart Rate < 140 bpm' },
        { name: 'Cadence Drill (180 SPM Metronome)', sets: 4, reps: '30s intervals', restSec: 30, notes: 'High cadence quick foot turnover' },
        { name: 'Tibialis Raise (Wall Lean)', sets: 3, reps: '25 reps', restSec: 45, notes: 'Shin splint prevention & resilience' },
        { name: 'Single-Leg Calf Raise (Standing)', sets: 3, reps: '15 reps / side', restSec: 45, notes: 'Achilles tendon stiffness' },
        { name: 'Plank Hold (Elbows Front)', sets: 3, reps: '60s hold', restSec: 45, notes: 'Postural endurance for distance running' },
      ];
    }
    if (f.includes('threshold') || f.includes('lactate')) {
      return [
        { name: 'Warmup Jog + Dynamic Mobility', sets: 1, reps: '10 min', restSec: 60, notes: 'Progressive heart rate ramp' },
        { name: 'Threshold Intervals (1000m @ Half-Marathon Pace)', sets: 5, reps: '1000m', restSec: 90, notes: 'Target pace: RPE 7.5-8.0 • 90s jog recovery' },
        { name: 'Strides (100m Acceleration)', sets: 4, reps: '100m', restSec: 60, notes: 'Crisp biomechanics • tall posture' },
        { name: 'Cool Down Jog + Static Stretch', sets: 1, reps: '10 min', restSec: 0, notes: 'Lactate clearance' },
      ];
    }
    if (f.includes('vo2') || f.includes('intervals')) {
      return [
        { name: 'Warmup + Track Drills', sets: 1, reps: '12 min', restSec: 60, notes: 'A-skips, B-skips, high knees' },
        { name: '400m Track Repeats (VO2 Max Power)', sets: 8, reps: '400m', restSec: 90, notes: '1:1 work-rest ratio • 5K pace or faster' },
        { name: 'Nordic Hamstring Curl (Assisted Band)', sets: 3, reps: '6-8 reps', restSec: 75, notes: 'High-speed eccentric knee flexor protection' },
        { name: 'Cool Down Flush', sets: 1, reps: '10 min', restSec: 0, notes: 'Zone 1 active flush' },
      ];
    }
    // General Long Tempo Run
    return [
      { name: 'Long Tempo Progression Run', sets: 1, reps: '12-16 km', restSec: 0, notes: 'First 50% Zone 2, final 50% Marathon Pace' },
      { name: 'Walking Lunge (Bodyweight Cool Down)', sets: 2, reps: '20 steps', restSec: 45, notes: 'Hip extension stretch' },
      { name: 'Diaphragmatic Box Breathing', sets: 1, reps: '5 min', restSec: 0, notes: 'Parasympathetic recovery activation' },
    ];
  }

  // 3. HYROX & Hybrid Fitness Racing
  if (cat.includes('hyrox') || f.includes('hyrox') || f.includes('sled') || f.includes('skierg') || f.includes('simulation') || f.includes('compromised')) {
    if (f.includes('simulation')) {
      return [
        { name: 'Hyrox 1km Run Interval (Race Pace)', sets: 1, reps: '1000m', restSec: 0, notes: 'Simulated station entry pace' },
        { name: 'SkiErg 1000m Race Effort', sets: 1, reps: '1000m', restSec: 60, notes: 'Sub 3:45 pace target • strong hip hinge' },
        { name: 'Sled Push 50m Heavy (152kg/102kg)', sets: 1, reps: '50m', restSec: 60, notes: 'Low angle • constant leg drive' },
        { name: 'Burpee Broad Jumps 80m', sets: 1, reps: '80m', restSec: 60, notes: 'Smooth rhythmic cadence' },
        { name: 'Concept2 Rowing 1000m Sprint', sets: 1, reps: '1000m', restSec: 60, notes: 'Sub 3:40 pace target' },
        { name: 'Wall Balls 100 Reps (6kg/9kg to Target)', sets: 1, reps: '100 reps', restSec: 0, notes: 'Unbroken sets of 20-25 reps' },
      ];
    }
    if (f.includes('erg') || f.includes('sled')) {
      return [
        { name: 'SkiErg Interval 500m x 4 (90s Rest)', sets: 4, reps: '500m', restSec: 90, notes: 'Target pace 1:45-1:50/500m' },
        { name: 'Sled Push Sprint Drills (25m x 6)', sets: 6, reps: '25m', restSec: 60, notes: 'Heavy comp load • maximum acceleration' },
        { name: 'Sled Pull 50m Heavy (103kg/78kg)', sets: 3, reps: '50m', restSec: 90, notes: 'Hand over hand or reverse walking pull' },
        { name: 'Farmers Carry 200m (2x24kg / 2x32kg)', sets: 3, reps: '200m', restSec: 60, notes: 'Upright ribcage • strong grip' },
      ];
    }
    if (f.includes('running') || f.includes('compromised')) {
      return [
        { name: '1km Run (Threshold Pace)', sets: 4, reps: '1000m', restSec: 0, notes: 'Run on fatigued legs' },
        { name: 'Sandbag Walking Lunges 100m (20kg/30kg)', sets: 2, reps: '50m', restSec: 60, notes: 'Upright torso • knee touches floor' },
        { name: 'Burpee Broad Jump Over Line', sets: 3, reps: '20 reps', restSec: 45, notes: 'Explosive jump • soft catch' },
        { name: 'Wall Balls (100 Reps / 9kg)', sets: 4, reps: '25 reps', restSec: 45, notes: 'Deep squat depth' },
      ];
    }
    // General HYROX Station Stamina
    return [
      { name: 'SkiErg 1000m Race Effort', sets: 1, reps: '1000m', restSec: 90, notes: 'Sub 3:50 target' },
      { name: 'Sled Push 50m Heavy', sets: 3, reps: '50m', restSec: 90, notes: 'Explosive leg drive' },
      { name: 'Concept2 Rowing 1000m Sprint', sets: 1, reps: '1000m', restSec: 90, notes: 'Maintain 28-30 SPM' },
      { name: 'Farmers Carry 200m (2x24kg / 2x32kg)', sets: 3, reps: '200m', restSec: 60, notes: 'Grip & core integrity' },
      { name: 'Wall Balls 100 Reps (6kg/9kg)', sets: 4, reps: '25 reps', restSec: 60, notes: 'Fast turnaround' },
    ];
  }

  // 4. Combat / Boxing / MMA
  if (cat.includes('combat') || cat.includes('box') || f.includes('strike') || f.includes('boxing') || f.includes('combat') || f.includes('sparring') || f.includes('rotational')) {
    if (f.includes('strike') || f.includes('speed')) {
      return [
        { name: 'Heavy Bag Power Combinations (3-Min Rounds)', sets: 5, reps: '3 min round', restSec: 60, notes: 'High volume punch output + slip defense' },
        { name: 'Landmine Punch Press (Single Arm Explosive)', sets: 4, reps: '8 reps / side', restSec: 60, notes: 'Triple extension from back foot' },
        { name: 'Medicine Ball Rotational Chest Pass to Wall', sets: 4, reps: '10 reps / side', restSec: 45, notes: 'Violent hip whip and torso snap' },
        { name: 'Band Pull-Apart (High Velocity)', sets: 3, reps: '25 reps', restSec: 30, notes: 'Shoulder stability & deceleration brake' },
        { name: 'Jump Rope Double Unders / Speed Skips', sets: 4, reps: '2 min', restSec: 45, notes: 'Elastic calf spring & rhythm' },
      ];
    }
    if (f.includes('rotational') || f.includes('power')) {
      return [
        { name: 'Rotational Cable Woodchopper (High to Low)', sets: 4, reps: '10 reps / side', restSec: 60, notes: 'Core power transfer for hook/cross' },
        { name: 'Kettlebell Snatch (Hardstyle)', sets: 4, reps: '10 reps / side', restSec: 60, notes: 'Explosive hip drive & lock' },
        { name: 'Russian Twist (Medicine Ball/Plate)', sets: 3, reps: '20 reps total', restSec: 45, notes: 'Oblique armor against body shots' },
        { name: 'Pallof Press (Iso Hold + Overhead Raise)', sets: 3, reps: '10 reps / side', restSec: 45, notes: 'Anti-rotation spinal stability' },
      ];
    }
    // General Combat conditioning
    return [
      { name: 'Heavy Bag Power Combinations', sets: 5, reps: '3 min', restSec: 60, notes: 'Fight pace output' },
      { name: 'Medicine Ball Rotational Throws', sets: 4, reps: '10 / side', restSec: 45, notes: 'Rotational torque' },
      { name: 'Echo Assault Bike Max Calories', sets: 6, reps: '30s sprint / 30s rest', restSec: 30, notes: 'Anaerobic lactic threshold' },
      { name: 'Neck Bridging / Isometric Holds', sets: 3, reps: '30s hold', restSec: 45, notes: 'Concussion mitigation & neck armor' },
    ];
  }

  // 5. Sport-Specific (Agility, Speed, Plyometrics)
  if (cat.includes('sport') || f.includes('acceleration') || f.includes('agility') || f.includes('plyometric') || f.includes('deceleration')) {
    if (f.includes('acceleration') || f.includes('speed')) {
      return [
        { name: '10m & 20m Acceleration Sprints (Three-Point Stance)', sets: 6, reps: '20m sprint', restSec: 90, notes: 'Low shin angles • explosive first step' },
        { name: 'Sled Sprint Acceleration (Light 15% Bodyweight)', sets: 4, reps: '15m', restSec: 90, notes: 'Maximum horizontal force production' },
        { name: 'Trap Bar Deadlift (Explosive Speed Pull)', sets: 4, reps: '4 reps @ 65% 1RM', restSec: 90, notes: 'Peak velocity • jump intent' },
        { name: 'Single-Leg Broad Jump with Stick Landing', sets: 4, reps: '4 reps / side', restSec: 60, notes: 'Unilateral horizontal power & knee control' },
      ];
    }
    if (f.includes('agility') || f.includes('cod')) {
      return [
        { name: '5-10-5 Pro Agility Shuttle Drill', sets: 5, reps: '1 rep', restSec: 90, notes: 'Sharp plant step • center of mass drop' },
        { name: 'L-Drill (3-Cone Speed Weave)', sets: 4, reps: '1 rep', restSec: 90, notes: 'Tight cornering & hip fluidity' },
        { name: 'Lateral Skater Bounds with Stick Landing', sets: 4, reps: '6 reps / side', restSec: 60, notes: 'Frontal plane power & stability' },
        { name: 'Deceleration 5-Step Braking Drill', sets: 4, reps: '4 reps', restSec: 60, notes: 'Eccentric quad & knee braking mechanics' },
      ];
    }
    if (f.includes('plyometric') || f.includes('power')) {
      return [
        { name: 'Depth Jump to Vertical Max Jump (24-inch Box)', sets: 4, reps: '4 reps', restSec: 90, notes: 'Minimal ground contact time (<0.2s)' },
        { name: 'Rotational Medicine Ball Slam', sets: 4, reps: '8 reps / side', restSec: 60, notes: 'Full body kinetic chain power' },
        { name: 'Box Jump (Seated Static Start to Box)', sets: 4, reps: '5 reps', restSec: 75, notes: 'Remove stretch reflex • pure concentric power' },
        { name: 'Kettlebell Swing (Heavy Russian)', sets: 4, reps: '10 reps', restSec: 60, notes: 'Fast hip extension whip' },
      ];
    }
    // General Sport Strength Transfer
    return [
      { name: 'Power Clean (Catch Above Parallel)', sets: 4, reps: '3 reps @ 75%', restSec: 120, notes: 'Triple extension power for sprinting & jumping' },
      { name: 'Bulgarian Split Squat (Explosive Knee Drive)', sets: 3, reps: '6 reps / side', restSec: 75, notes: 'Single leg athletic power' },
      { name: 'Rotational Cable Woodchopper', sets: 3, reps: '10 reps / side', restSec: 60, notes: 'Rotational sports power (golf, tennis, pitch)' },
      { name: 'Nordic Hamstring Curl (Assisted Band)', sets: 3, reps: '6 reps', restSec: 75, notes: 'High speed hamstring strain protection' },
    ];
  }

  // 6. Powerlifting / Strength 5x5
  if (cat.includes('powerlift') || cat.includes('strength') || f.includes('squat priority') || f.includes('bench priority') || f.includes('deadlift priority')) {
    if (f.includes('squat')) {
      return [
        { name: 'Competition Low Bar Squat', sets: 4, reps: '3 reps @ RPE 8', restSec: 180, notes: 'Primary competition lift • hit below parallel' },
        { name: 'Pause Squat (3-Second Pause in Hole)', sets: 3, reps: '4 reps @ 70%', restSec: 120, notes: 'Build absolute strength out of the hole' },
        { name: 'Bulgarian Split Squat (Dumbbells)', sets: 3, reps: '8 reps / side', restSec: 90, notes: 'Unilateral quad balance & hip stability' },
        { name: 'Standing Machine Calf Raise', sets: 4, reps: '12 reps', restSec: 60, notes: 'Full dorsiflexion stretch & power' },
        { name: 'Ab Wheel Rollout (From Knees)', sets: 3, reps: '10 reps', restSec: 60, notes: 'Anterior core bracing under heavy load' },
      ];
    }
    if (f.includes('bench')) {
      return [
        { name: 'Competition Bench Press (Pause on Chest)', sets: 4, reps: '3 reps @ RPE 8', restSec: 180, notes: 'Strict 1-second pause on sternum • leg drive' },
        { name: 'Spoto Press (1-Inch Off Chest Pause)', sets: 3, reps: '5 reps @ 75%', restSec: 120, notes: 'Eliminate bounce • build mid-range reversal power' },
        { name: 'Close Grip Bench Press (Tricep Strength)', sets: 3, reps: '8 reps', restSec: 90, notes: 'Lockout power and elbow integrity' },
        { name: 'Barbell Bent-Over Row (Overhand)', sets: 4, reps: '6-8 reps', restSec: 90, notes: 'Upper back shelf for pressing stability' },
        { name: 'Face Pull (Cable Rope to Forehead)', sets: 4, reps: '15 reps', restSec: 60, notes: 'Rotator cuff and rear delt longevity' },
      ];
    }
    if (f.includes('deadlift')) {
      return [
        { name: 'Competition Conventional Deadlift', sets: 4, reps: '2 reps @ RPE 8.5', restSec: 200, notes: 'Primary pull • lock lats & push floor away' },
        { name: 'Deficit Barbell Deadlift (2-Inch Deficit)', sets: 3, reps: '4 reps @ 70%', restSec: 150, notes: 'Overcome weak point off the floor' },
        { name: 'Romanian Deadlift (Barbell)', sets: 3, reps: '8 reps', restSec: 90, notes: 'Hamstring & glute hypertrophy' },
        { name: 'Barbell Shrug (Heavy)', sets: 4, reps: '10 reps (2s hold)', restSec: 75, notes: 'Trap thickness and heavy grip overload' },
        { name: 'Hanging Leg Raise (Toes to Bar)', sets: 3, reps: '12 reps', restSec: 60, notes: 'Pelvic tilt control & core bracing' },
      ];
    }
  }

  // 7. Calisthenics & Gymnastics
  if (cat.includes('calisthenic') || f.includes('lever') || f.includes('bent arm') || f.includes('handstand')) {
    return [
      { name: 'Pull-up (Strict Dead-Hang)', sets: 4, reps: '8-10 reps', restSec: 90, notes: 'Chest to bar • full scapular retraction' },
      { name: 'Dips (Chest Leaning Forward)', sets: 4, reps: '10-12 reps', restSec: 90, notes: 'Full depth • 90 degree elbow bend' },
      { name: 'L-Sit Hold (Floor/Parallettes)', sets: 4, reps: '20-30s hold', restSec: 60, notes: 'Straight knees • point toes' },
      { name: 'Handstand Push-up (Kipping against Wall)', sets: 3, reps: '6-8 reps', restSec: 90, notes: 'Head touches floor in tripod position' },
      { name: 'Pistol Squat (Single Leg Bodyweight)', sets: 3, reps: '6 reps / side', restSec: 75, notes: 'Full depth single-leg control' },
    ];
  }

  // 8. Bodybuilding / PPL (Standard)
  if (f.includes('push') || f.includes('chest')) {
    return [
      { name: 'Barbell Incline Bench Press', sets: 4, reps: '6-8', restSec: 120, notes: 'Heavy primary compound • RPE 8' },
      { name: 'Dumbbell Flat Bench Press', sets: 3, reps: '8-10', restSec: 90, notes: 'Full stretch at bottom' },
      { name: 'Dips (Chest Leaning Forward)', sets: 3, reps: '10-12', restSec: 75, notes: 'Forward lean to target lower pecs' },
      { name: 'Cable Lateral Raise (Behind Back)', sets: 4, reps: '12-15', restSec: 60, notes: 'Constant tension • slow eccentric' },
      { name: 'Tricep Pushdown (Rope)', sets: 3, reps: '12-15', restSec: 60, notes: 'Peak contraction lock at bottom' },
    ];
  }

  if (f.includes('pull') || f.includes('back')) {
    return [
      { name: 'Conventional Barbell Deadlift', sets: 4, reps: '5-6', restSec: 150, notes: 'Main posterior chain strength anchor' },
      { name: 'Barbell Bent-Over Row (Overhand)', sets: 3, reps: '8-10', restSec: 90, notes: 'Pull into lower ribcage' },
      { name: 'Lat Pulldown (Wide Grip Front)', sets: 3, reps: '10-12', restSec: 75, notes: 'Wide grip • drive elbows down' },
      { name: 'Face Pull (Cable Rope to Forehead)', sets: 4, reps: '15-20', restSec: 60, notes: 'Rear delt and external rotation' },
      { name: 'Incline Dumbbell Curl (Long Head Stretch)', sets: 3, reps: '10-12', restSec: 60, notes: 'Long head bicep focus' },
    ];
  }

  if (f.includes('leg') || f.includes('lower') || f.includes('glute')) {
    return [
      { name: 'Barbell Back Squat (High Bar Olympic)', sets: 4, reps: '6-8', restSec: 120, notes: 'Primary quad and glute driver' },
      { name: 'Romanian Deadlift (Barbell)', sets: 3, reps: '8-10', restSec: 90, notes: 'Hip hinge stretch • soft knees' },
      { name: 'Bulgarian Split Squat (Dumbbells)', sets: 3, reps: '10-12 / side', restSec: 75, notes: 'Elevated rear foot • vertical torso' },
      { name: 'Leg Extension (Machine Quads)', sets: 3, reps: '12-15', restSec: 60, notes: 'Controlled tempo • 1s pause at top' },
      { name: 'Standing Machine Calf Raise', sets: 4, reps: '15-20', restSec: 45, notes: 'Full dorsiflexion deep stretch' },
    ];
  }

    // 9. Upper / Lower / Full Body Default
    return [
      { name: 'Barbell Bench Press (Flat)', sets: 4, reps: '6-8', restSec: 120, notes: 'Main press power driver' },
      { name: 'Pull-up (Strict Dead-Hang)', sets: 4, reps: '8-10', restSec: 90, notes: 'Full range of motion' },
      { name: 'Barbell Overhead Press (Standing Military)', sets: 3, reps: '8-10', restSec: 90, notes: 'Strict lock at top' },
      { name: 'Barbell Bent-Over Row (Overhand)', sets: 3, reps: '8-10', restSec: 90, notes: 'Controlled torso angle' },
      { name: 'Dumbbell Alternating Bicep Curl', sets: 3, reps: '12-15', restSec: 60, notes: 'Super-set finisher' },
    ];
  };

  const baseSlots = getBaseSlots();
  return applyDifficultyModifier(baseSlots, difficulty);
}

