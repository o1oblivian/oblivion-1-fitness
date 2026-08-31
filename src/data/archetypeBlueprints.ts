export type Phase = 'warmup' | 'prime' | 'main' | 'accessory' | 'finisher';

export interface ExercisePrescription {
  name: string;
  phase: Phase;
  sets: number;
  reps: string;
  restSec: number;
  tempo?: string;
  tip: string;
}

export interface ArchetypeBlueprint {
  id: string;
  name: string;
  tagline: string;
  philosophy: string;
  icon: string;
  accentFrom: string;
  accentTo: string;
  muscleGroups: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Beast';
  defaultDuration: number;
  rpeRange: [number, number];
  totalVolumeSets: number;
  focusKey: string;
  exercises: ExercisePrescription[];
}

const PHASE_LABELS: Record<Phase, string> = {
  warmup: 'Warm-Up',
  prime: 'Activation / Prime',
  main: 'Main Lifts',
  accessory: 'Accessories',
  finisher: 'Finisher',
};

export { PHASE_LABELS };

export const ARCHETYPE_BLUEPRINTS: ArchetypeBlueprint[] = [
  {
    id: 'v-taper',
    name: 'V-Taper Sculptor',
    tagline: 'Wide lats, capped delts, narrow waist',
    philosophy: 'Prioritize horizontal pulling width and lateral delt volume to create the illusion of a broader frame. Every rep builds the silhouette.',
    icon: 'triangle',
    accentFrom: 'from-sky-500',
    accentTo: 'to-blue-600',
    muscleGroups: ['Lats', 'Shoulders', 'Upper Back'],
    difficulty: 'Intermediate',
    defaultDuration: 55,
    rpeRange: [7, 8],
    totalVolumeSets: 22,
    focusKey: 'upper',
    exercises: [
      { name: 'Band Pull-Apart', phase: 'warmup', sets: 2, reps: '15', restSec: 30, tip: 'Squeeze shoulder blades together at peak contraction' },
      { name: 'Face Pull (Light)', phase: 'warmup', sets: 2, reps: '15', restSec: 30, tip: 'External rotate at the top — thumbs pointing behind you' },
      { name: 'Lat Pulldown', phase: 'prime', sets: 2, reps: '12', restSec: 60, tempo: '3-0-1-1', tip: 'Lean back 15 degrees, drive elbows to your hips' },
      { name: 'Pull-Up', phase: 'main', sets: 4, reps: '6-8', restSec: 120, tempo: '2-1-1-0', tip: 'Full dead hang at bottom, chin over bar. Add weight when 4x8 is easy' },
      { name: 'Seated Cable Row', phase: 'main', sets: 4, reps: '10-12', restSec: 90, tempo: '3-1-1-0', tip: 'Pull to lower sternum, chest proud. Slow eccentric builds thickness' },
      { name: 'Dumbbell Lateral Raise', phase: 'accessory', sets: 4, reps: '12-15', restSec: 60, tempo: '2-1-1-0', tip: 'Lead with pinkies slightly up, stop at shoulder height' },
      { name: 'Straight Arm Pulldown', phase: 'accessory', sets: 3, reps: '12-15', restSec: 60, tempo: '3-0-1-1', tip: 'Keep arms straight, feel lats stretch at top and squeeze at bottom' },
      { name: 'Cable Lateral Raise', phase: 'finisher', sets: 2, reps: '15-20', restSec: 45, tip: 'Behind-the-back angle hits the lateral head differently. Burn it out' },
    ],
  },
  {
    id: 'booty-builder',
    name: 'Booty Builder',
    tagline: 'Glute-dominant sculpting protocol',
    philosophy: 'Target all three glute heads through hip extension, abduction, and external rotation. Progressive overload on thrusts; high reps on isolations for the mind-muscle pump.',
    icon: 'flame',
    accentFrom: 'from-red-500',
    accentTo: 'to-pink-600',
    muscleGroups: ['Glutes', 'Hamstrings', 'Core'],
    difficulty: 'Intermediate',
    defaultDuration: 50,
    rpeRange: [7, 9],
    totalVolumeSets: 21,
    focusKey: 'glutes',
    exercises: [
      { name: 'Banded Glute Bridge', phase: 'warmup', sets: 2, reps: '15', restSec: 30, tip: 'Push knees out against band. Hold top for 2 seconds each rep' },
      { name: 'Clamshell (Banded)', phase: 'warmup', sets: 2, reps: '15 each', restSec: 30, tip: 'Keep heels together, rotate from the hip — feel the glute med fire' },
      { name: 'Barbell Hip Thrust', phase: 'main', sets: 4, reps: '8-10', restSec: 120, tempo: '2-2-1-0', tip: 'Drive through heels, squeeze hard at lockout. Chin tucked, ribs down' },
      { name: 'Romanian Deadlift', phase: 'main', sets: 4, reps: '10-12', restSec: 90, tempo: '3-1-1-0', tip: 'Hinge at hips, bar hugs thighs. Feel the hamstring stretch — don\'t round' },
      { name: 'Bulgarian Split Squat', phase: 'accessory', sets: 3, reps: '10 each', restSec: 75, tip: 'Lean torso forward slightly to bias glutes over quads' },
      { name: 'Cable Pull-Through', phase: 'accessory', sets: 3, reps: '12-15', restSec: 60, tip: 'Hinge deep, arms between legs. Explosive hip snap at top' },
      { name: 'Single-Leg Glute Bridge', phase: 'finisher', sets: 3, reps: '12 each', restSec: 45, tip: 'Drive one heel into the floor. Keep hips level — no rotation' },
    ],
  },
  {
    id: 'greek-god',
    name: 'Greek God',
    tagline: 'Symmetrical aesthetics, lean proportions',
    philosophy: 'Classic bodybuilding balance — heavy compounds set the foundation, isolations chisel the details. Train for proportional development across all major groups.',
    icon: 'crown',
    accentFrom: 'from-amber-500',
    accentTo: 'to-yellow-600',
    muscleGroups: ['Chest', 'Shoulders', 'Arms', 'Back'],
    difficulty: 'Advanced',
    defaultDuration: 70,
    rpeRange: [7, 9],
    totalVolumeSets: 26,
    focusKey: 'full',
    exercises: [
      { name: 'Band Dislocates', phase: 'warmup', sets: 2, reps: '12', restSec: 30, tip: 'Slow and controlled arc — opens shoulders for pressing' },
      { name: 'Incline DB Press (Light)', phase: 'prime', sets: 2, reps: '12', restSec: 45, tip: 'Feel the chest stretch at bottom. Establish mind-muscle connection' },
      { name: 'Barbell Incline Press', phase: 'main', sets: 4, reps: '6-8', restSec: 120, tempo: '3-1-1-0', tip: 'Elbows at 45 degrees. Control the descent, explode up' },
      { name: 'Overhead Press', phase: 'main', sets: 4, reps: '6-8', restSec: 120, tempo: '2-1-1-0', tip: 'Brace core hard. Bar path travels straight up, head pushes through at top' },
      { name: 'Barbell Row', phase: 'main', sets: 4, reps: '8-10', restSec: 90, tempo: '2-1-1-0', tip: 'Pull to lower chest, squeeze lats. Slight body English is fine on last reps' },
      { name: 'Dumbbell Lateral Raise', phase: 'accessory', sets: 3, reps: '12-15', restSec: 60, tip: 'Slight forward lean, control on the way down. Builds the 3D cap' },
      { name: 'Bicep Curl', phase: 'accessory', sets: 3, reps: '10-12', restSec: 60, tip: 'Supinate hard at the top. No swinging — control the negative' },
      { name: 'Tricep Pushdown', phase: 'accessory', sets: 3, reps: '10-12', restSec: 60, tip: 'Lock elbows at sides. Full extension at bottom, slow return' },
      { name: 'Cable Crossover', phase: 'finisher', sets: 2, reps: '15-20', restSec: 45, tip: 'Squeeze hands together at the bottom. Chase the pump' },
    ],
  },
  {
    id: 'hourglass',
    name: 'Hourglass Architect',
    tagline: 'Curves, shoulders & cinched waist',
    philosophy: 'Build visual width at shoulders and hips while keeping the waist tight. Anti-rotation core work cinches the middle; lateral delts and glutes create the frame.',
    icon: 'sparkles',
    accentFrom: 'from-fuchsia-500',
    accentTo: 'to-pink-600',
    muscleGroups: ['Glutes', 'Shoulders', 'Upper Back'],
    difficulty: 'Beginner',
    defaultDuration: 45,
    rpeRange: [6, 8],
    totalVolumeSets: 19,
    focusKey: 'full',
    exercises: [
      { name: 'Cat-Cow + World\'s Greatest Stretch', phase: 'warmup', sets: 2, reps: '8 each', restSec: 30, tip: 'Flow slowly through each position — wake up the spine and hips' },
      { name: 'Banded Glute Bridge', phase: 'prime', sets: 2, reps: '15', restSec: 30, tip: 'Push knees against the band at the top. Two-second hold' },
      { name: 'Barbell Hip Thrust', phase: 'main', sets: 3, reps: '10-12', restSec: 90, tempo: '2-1-1-0', tip: 'Plant feet wide, drive through heels. This is your money exercise' },
      { name: 'Arnold Press', phase: 'main', sets: 3, reps: '10-12', restSec: 90, tempo: '2-0-1-0', tip: 'Rotate palms from facing you to facing out as you press. Full range' },
      { name: 'Lat Pulldown', phase: 'accessory', sets: 3, reps: '12', restSec: 60, tempo: '3-0-1-1', tip: 'Pull wide grip to upper chest. Creates back width that frames the waist' },
      { name: 'Dumbbell Lateral Raise', phase: 'accessory', sets: 3, reps: '15', restSec: 45, tip: 'Light weight, strict form. Volume is queen for delt caps' },
      { name: 'Pallof Press', phase: 'finisher', sets: 3, reps: '10 each', restSec: 45, tip: 'Resist rotation — this tightens the waist without crunches' },
    ],
  },
  {
    id: 'hybrid-athlete',
    name: 'Hybrid Athlete',
    tagline: 'Strength meets endurance',
    philosophy: 'Strength compound lifts followed by metabolic conditioning. You should be strong AND able to run a 5K. This session builds both engines in one hit.',
    icon: 'zap',
    accentFrom: 'from-red-500',
    accentTo: 'to-teal-600',
    muscleGroups: ['Full Body', 'Cardio', 'Core'],
    difficulty: 'Advanced',
    defaultDuration: 60,
    rpeRange: [7, 9],
    totalVolumeSets: 20,
    focusKey: 'full',
    exercises: [
      { name: 'Rowing Machine (Easy)', phase: 'warmup', sets: 1, reps: '3 min', restSec: 60, tip: 'Steady pace, 18-20 strokes/min. Warm up the posterior chain' },
      { name: 'Barbell Back Squat', phase: 'main', sets: 4, reps: '5', restSec: 150, tempo: '3-1-1-0', tip: 'Below parallel. Brace hard, drive knees out. This is your strength anchor' },
      { name: 'Conventional Deadlift', phase: 'main', sets: 4, reps: '5', restSec: 150, tempo: '2-1-1-0', tip: 'Set your lats, push the floor away. Reset each rep — no bouncing' },
      { name: 'Pull-Up', phase: 'main', sets: 3, reps: '6-8', restSec: 90, tip: 'Dead hang start. Add weight if bodyweight is too easy for this range' },
      { name: 'Kettlebell Swing', phase: 'accessory', sets: 3, reps: '15', restSec: 60, tip: 'Snap the hips. Arms are just hooks — power comes from the glutes' },
      { name: 'Assault Bike Sprint', phase: 'finisher', sets: 5, reps: '30 sec on / 30 sec off', restSec: 30, tip: 'Maximum effort on the work interval. This is where the hybrid magic happens' },
    ],
  },
  {
    id: 'hyrox-ready',
    name: 'HYROX Ready',
    tagline: 'Race-day functional power',
    philosophy: 'Simulate HYROX race stations with structured intervals. Build the specific endurance, grip, and mental toughness needed to survive all 8 stations plus 8km of running.',
    icon: 'target',
    accentFrom: 'from-orange-500',
    accentTo: 'to-red-600',
    muscleGroups: ['Legs', 'Cardio', 'Grip'],
    difficulty: 'Advanced',
    defaultDuration: 55,
    rpeRange: [8, 9],
    totalVolumeSets: 16,
    focusKey: 'cardio',
    exercises: [
      { name: '1km Treadmill Run', phase: 'warmup', sets: 1, reps: '1km at race pace', restSec: 60, tip: 'Find your sustainable 5:30-6:00/km pace. This is your transition rhythm' },
      { name: 'Sled Push (50m)', phase: 'main', sets: 3, reps: '50m', restSec: 90, tip: 'Low body angle, short choppy steps. Don\'t stand tall — stay aggressive' },
      { name: 'Wall Balls', phase: 'main', sets: 3, reps: '25', restSec: 75, tip: 'Full squat depth, catch-and-throw rhythm. Breathe on every throw' },
      { name: 'Farmers Carry', phase: 'main', sets: 3, reps: '100m (24kg each)', restSec: 90, tip: 'Shoulders packed, core braced. Short quick steps — don\'t overstride' },
      { name: 'SkiErg', phase: 'accessory', sets: 3, reps: '500m race pace', restSec: 75, tip: 'Hinge at the hips, pull with lats. Maintain rhythm even when gassed' },
      { name: 'Burpee Broad Jumps', phase: 'finisher', sets: 3, reps: '40m', restSec: 60, tip: 'Chest to deck, jump for distance. This is where HYROX is won or lost' },
    ],
  },
  {
    id: 'warrior-shred',
    name: 'Warrior Shred',
    tagline: 'Heavy compounds, aggressive fat loss',
    philosophy: 'Low rep, heavy compound lifts to preserve muscle, paired with metabolic finishers to torch fat. You stay strong while cutting. No muscle left behind.',
    icon: 'sword',
    accentFrom: 'from-red-600',
    accentTo: 'to-red-700',
    muscleGroups: ['Full Body', 'Core', 'Posterior Chain'],
    difficulty: 'Beast',
    defaultDuration: 50,
    rpeRange: [8, 10],
    totalVolumeSets: 22,
    focusKey: 'full',
    exercises: [
      { name: 'Jump Rope', phase: 'warmup', sets: 1, reps: '3 min', restSec: 60, tip: 'Light bounces on the balls of your feet. Elevate heart rate gradually' },
      { name: 'Goblet Squat', phase: 'prime', sets: 2, reps: '10', restSec: 45, tip: 'Deep squat with light KB. Opens hips and primes the pattern for barbell work' },
      { name: 'Conventional Deadlift', phase: 'main', sets: 5, reps: '3', restSec: 180, tempo: '2-1-1-0', tip: 'Heavy singles territory. Brace, pull slack out of bar, then drive. Reset each rep' },
      { name: 'Barbell Bench Press', phase: 'main', sets: 4, reps: '5', restSec: 150, tempo: '3-1-1-0', tip: 'Touch chest, pause 1 sec, explode. Arch tight, feet planted' },
      { name: 'Barbell Row', phase: 'main', sets: 4, reps: '5', restSec: 120, tempo: '2-1-1-0', tip: 'Match your bench weight if you can. Upper back needs to balance pressing' },
      { name: 'Hanging Leg Raise', phase: 'accessory', sets: 3, reps: '10-12', restSec: 60, tip: 'Toes to bar if possible. Slow negatives build steel abs' },
      { name: 'Kettlebell Swing + Burpee Complex', phase: 'finisher', sets: 3, reps: '10+5 (alternating)', restSec: 45, tip: '10 swings immediately into 5 burpees. Repeat. This is the fat-burning furnace' },
    ],
  },
  {
    id: 'lean-bulk',
    name: 'Lean Bulk Protocol',
    tagline: 'Slow gains, visible abs year-round',
    philosophy: 'Moderate volume, progressive overload focused. Every workout tracks slightly heavier than last time. Clean surplus training — build muscle without burying your abs.',
    icon: 'trending-up',
    accentFrom: 'from-cyan-500',
    accentTo: 'to-sky-600',
    muscleGroups: ['Chest', 'Back', 'Legs', 'Arms'],
    difficulty: 'Intermediate',
    defaultDuration: 60,
    rpeRange: [7, 8],
    totalVolumeSets: 24,
    focusKey: 'full',
    exercises: [
      { name: 'Light Incline Walk', phase: 'warmup', sets: 1, reps: '5 min', restSec: 30, tip: 'Incline 8-10%, speed 5-6 km/h. Wake up the legs without fatiguing them' },
      { name: 'Barbell Bench Press', phase: 'main', sets: 4, reps: '8-10', restSec: 120, tempo: '3-1-1-0', tip: 'Progressive overload king. Add 1.25kg when you hit 4x10 cleanly' },
      { name: 'Barbell Back Squat', phase: 'main', sets: 4, reps: '8-10', restSec: 120, tempo: '3-1-1-0', tip: 'Below parallel minimum. Same +1.25kg progression rule applies' },
      { name: 'Barbell Row', phase: 'main', sets: 4, reps: '8-10', restSec: 90, tempo: '2-1-1-0', tip: 'Strict form — save the cheating for your last set only' },
      { name: 'Dumbbell Incline Press', phase: 'accessory', sets: 3, reps: '10-12', restSec: 75, tempo: '3-0-1-0', tip: 'Deep stretch at bottom, squeeze at top. Upper chest focus' },
      { name: 'Lat Pulldown', phase: 'accessory', sets: 3, reps: '10-12', restSec: 60, tempo: '3-0-1-1', tip: 'Wide grip, pull to upper chest. Feel the stretch at full extension' },
      { name: 'Bicep Curl + Tricep Pushdown Superset', phase: 'finisher', sets: 3, reps: '12 each', restSec: 45, tip: 'Alternate with no rest between. Fills the arms with blood fast' },
      { name: 'Leg Press', phase: 'accessory', sets: 3, reps: '12-15', restSec: 90, tip: 'Feet high and wide for glute/ham emphasis. Full depth, no locking knees' },
    ],
  },
  {
    id: 'calisthenics-aesthetic',
    name: 'Calisthenics Aesthetic',
    tagline: 'Built by bodyweight, sculpted by gravity',
    philosophy: 'Master your own body. Progress through harder variations, not heavier weights. Straight-arm strength and hollow body control build a physique that\'s functional and striking.',
    icon: 'move',
    accentFrom: 'from-teal-500',
    accentTo: 'to-red-600',
    muscleGroups: ['Upper Body', 'Core', 'Shoulders'],
    difficulty: 'Intermediate',
    defaultDuration: 50,
    rpeRange: [7, 9],
    totalVolumeSets: 20,
    focusKey: 'upper',
    exercises: [
      { name: 'Scapular Pull-Ups + Push-Up Plus', phase: 'warmup', sets: 2, reps: '10 each', restSec: 30, tip: 'Activate the scapular stabilizers — protraction and retraction patterns' },
      { name: 'Hollow Body Hold', phase: 'prime', sets: 2, reps: '30 sec', restSec: 30, tip: 'Lower back glued to floor. This is the foundation of every calisthenics move' },
      { name: 'Pull-Up (Weighted or L-sit)', phase: 'main', sets: 4, reps: '5-8', restSec: 120, tip: 'Add weight or hold L-sit position for progression. Full dead hang each rep' },
      { name: 'Dip (Weighted or Ring)', phase: 'main', sets: 4, reps: '6-10', restSec: 120, tip: 'Full lockout at top, break 90 degrees at bottom. Lean forward for chest' },
      { name: 'Handstand Push-Up (or Pike Press)', phase: 'accessory', sets: 3, reps: '5-8', restSec: 90, tip: 'Wall-assisted is fine. Head touches floor, full press out. Build to freestanding' },
      { name: 'Front Lever Raises (or Tuck)', phase: 'accessory', sets: 3, reps: '5-8', restSec: 90, tip: 'Start from tuck position. Straight arm strength takes months — be patient' },
      { name: 'Dragon Flag Negatives', phase: 'finisher', sets: 2, reps: '5-8', restSec: 60, tip: 'Slow 5-second negatives. Keep body straight as a plank from shoulders' },
    ],
  },
  {
    id: 'core-sculpt',
    name: 'CoreSculpt 360',
    tagline: 'Anti-rotation, loaded carries, iron midsection',
    philosophy: 'A strong core resists movement, not just creates it. Train all four functions: anti-extension, anti-rotation, anti-lateral flexion, and hip flexion under load.',
    icon: 'circle-dot',
    accentFrom: 'from-slate-500',
    accentTo: 'to-zinc-700',
    muscleGroups: ['Core', 'Obliques', 'Lower Back'],
    difficulty: 'Beginner',
    defaultDuration: 30,
    rpeRange: [7, 8],
    totalVolumeSets: 16,
    focusKey: 'core',
    exercises: [
      { name: 'Dead Bug', phase: 'warmup', sets: 2, reps: '10 each', restSec: 30, tip: 'Opposite arm and leg extend simultaneously. Lower back stays flat — always' },
      { name: 'Pallof Press', phase: 'main', sets: 3, reps: '10 each side', restSec: 60, tip: 'Press cable straight out, hold 2 sec. Resist the rotation — that\'s the workout' },
      { name: 'Ab Wheel Rollout', phase: 'main', sets: 3, reps: '8-10', restSec: 75, tip: 'Go as far as you can control. The moment your back arches, that\'s your limit' },
      { name: 'Hanging Leg Raise', phase: 'main', sets: 3, reps: '10-12', restSec: 60, tip: 'Curl the pelvis up, don\'t just swing legs. Slow negative on the way down' },
      { name: 'Cable Woodchopper', phase: 'accessory', sets: 3, reps: '12 each', restSec: 45, tip: 'Rotate from the thoracic spine, not the hips. Arms stay straight' },
      { name: 'Suitcase Carry', phase: 'finisher', sets: 2, reps: '40m each hand', restSec: 45, tip: 'Heavy dumbbell in one hand. Walk tall — don\'t lean. Obliques on fire' },
    ],
  },
];
