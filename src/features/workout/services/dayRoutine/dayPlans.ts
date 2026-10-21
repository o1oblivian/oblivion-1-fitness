import { useConsultationStore } from '../../../induction/useConsultationStore';

export type DayCode = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface MovementPlan {
  name: string;
  muscle: string;
  equipment: string;
  tier: string;
  restSecs: number;
  sets: number;
  reps: number;
}

type MovementOption = Pick<MovementPlan, 'name' | 'equipment'> &
  Partial<Pick<MovementPlan, 'sets' | 'reps' | 'restSecs'>>;

/** First option is the full-gym movement; the rest are ordered substitutes for less equipment. */
export interface MovementSlot extends MovementPlan {
  alternatives: MovementOption[];
}

export interface DayPlan {
  splitName: string;
  movements: MovementSlot[];
}

export const getSystemTodayCode = (): DayCode => {
  const map: DayCode[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[new Date().getDay()] || 'Thu';
};

/** Movement plan only. Loads come from the athlete's own history, never from this table. */
export const DAY_PLANS: Record<DayCode, DayPlan> = {
  Mon: {
    splitName: 'PUSH A',
    movements: [
      {
        name: 'Barbell Flat Bench Press',
        muscle: 'Chest',
        equipment: 'Barbell',
        tier: 'Compound Prime',
        restSecs: 120,
        sets: 3,
        reps: 5,
        alternatives: [
          { name: 'Dumbbell Bench Press', equipment: 'Dumbbell', reps: 8 },
          { name: 'Push-Up', equipment: 'Bodyweight', reps: 12 },
        ],
      },
      {
        name: 'Standing Overhead Military Press',
        muscle: 'Deltoids',
        equipment: 'Barbell',
        tier: 'Compound Secondary',
        restSecs: 90,
        sets: 3,
        reps: 8,
        alternatives: [
          { name: 'Seated Dumbbell Shoulder Press', equipment: 'Dumbbell', reps: 10 },
          { name: 'Pike Push-Up', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Tue: {
    splitName: 'PULL A',
    movements: [
      {
        name: 'Conventional Barbell Deadlift',
        muscle: 'Posterior Chain',
        equipment: 'Barbell',
        tier: 'Compound Prime',
        restSecs: 180,
        sets: 3,
        reps: 5,
        alternatives: [
          { name: 'Kettlebell Deadlift', equipment: 'Kettlebell', reps: 10 },
          { name: 'Single-Leg Glute Bridge', equipment: 'Bodyweight', reps: 12 },
        ],
      },
      {
        name: 'Weighted Neutral Grip Pull-Up',
        muscle: 'Lats',
        equipment: 'Bodyweight / Belt',
        tier: 'Compound Secondary',
        restSecs: 90,
        sets: 3,
        reps: 6,
        alternatives: [
          { name: 'Neutral Grip Pull-Up', equipment: 'Pull-Up Bar', reps: 8 },
          { name: 'Prone Y-T-W Raise', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Wed: {
    splitName: 'LEGS A',
    movements: [
      {
        name: 'Olympic Barbell Back Squat',
        muscle: 'Quadriceps',
        equipment: 'Barbell',
        tier: 'Compound Prime',
        restSecs: 150,
        sets: 3,
        reps: 5,
        alternatives: [
          { name: 'Dumbbell Goblet Squat', equipment: 'Dumbbell', reps: 10 },
          { name: 'Bulgarian Split Squat', equipment: 'Bodyweight', reps: 10 },
        ],
      },
      {
        name: 'Romanian Deadlift (RDL)',
        muscle: 'Hamstrings',
        equipment: 'Barbell',
        tier: 'Accessory',
        restSecs: 90,
        sets: 3,
        reps: 10,
        alternatives: [
          { name: 'Dumbbell Romanian Deadlift', equipment: 'Dumbbell', reps: 10 },
          { name: 'Single-Leg Romanian Deadlift', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Thu: {
    splitName: 'HYPER',
    movements: [
      {
        name: 'SkiErg 500m Sprint Intervals',
        muscle: 'Cardio Engine',
        equipment: 'Concept2 SkiErg',
        tier: 'Conditioning',
        restSecs: 60,
        sets: 2,
        reps: 500,
        alternatives: [{ name: '400m Run Intervals', equipment: 'Bodyweight', sets: 4, reps: 400 }],
      },
      {
        name: 'Sled Push Heavy Drive',
        muscle: 'Lower Body Drive',
        equipment: 'Turf Sled',
        tier: 'Conditioning',
        restSecs: 90,
        sets: 2,
        reps: 50,
        alternatives: [
          { name: 'Kettlebell Swing', equipment: 'Kettlebell', sets: 3, reps: 20 },
          { name: 'Burpee Broad Jumps', equipment: 'Bodyweight', sets: 3, reps: 10 },
        ],
      },
    ],
  },
  Fri: {
    splitName: 'PUSH B',
    movements: [
      {
        name: 'Incline Dumbbell Chest Press',
        muscle: 'Upper Chest',
        equipment: 'Dumbbells',
        tier: 'Compound Prime',
        restSecs: 90,
        sets: 3,
        reps: 8,
        alternatives: [{ name: 'Decline Push-Up', equipment: 'Bodyweight', reps: 12 }],
      },
      {
        name: 'Cable Overhead Triceps Extension',
        muscle: 'Triceps Long Head',
        equipment: 'Cable Tower',
        tier: 'Accessory',
        restSecs: 60,
        sets: 3,
        reps: 12,
        alternatives: [
          { name: 'Overhead Dumbbell Triceps Extension', equipment: 'Dumbbell', reps: 12 },
          { name: 'Diamond Push-Up', equipment: 'Bodyweight', reps: 10 },
        ],
      },
    ],
  },
  Sat: {
    splitName: 'PULL B',
    movements: [
      {
        name: 'Barbell Chest Supported T-Bar Row',
        muscle: 'Upper Back & Lats',
        equipment: 'Barbell / Rig',
        tier: 'Compound Prime',
        restSecs: 90,
        sets: 3,
        reps: 8,
        alternatives: [
          { name: 'One-Arm Dumbbell Row', equipment: 'Dumbbell', reps: 10 },
          { name: 'Inverted Row', equipment: 'Pull-Up Bar', reps: 10 },
          { name: 'Superman Hold', equipment: 'Bodyweight', reps: 12 },
        ],
      },
      {
        name: 'Incline Dumbbell Biceps Curl',
        muscle: 'Biceps Long Head',
        equipment: 'Dumbbells',
        tier: 'Accessory',
        restSecs: 60,
        sets: 3,
        reps: 10,
        alternatives: [
          { name: 'Chin-Up', equipment: 'Pull-Up Bar', reps: 8 },
          { name: 'Isometric Towel Curl', equipment: 'Bodyweight', reps: 8 },
        ],
      },
    ],
  },
  Sun: {
    splitName: 'REST',
    movements: [
      {
        name: 'Thoracic Extension & Foam Roller Release',
        muscle: 'Spine & Fascia',
        equipment: 'Foam Roller',
        tier: 'Restoration',
        restSecs: 45,
        sets: 2,
        reps: 15,
        alternatives: [],
      },
    ],
  },
};

const SESSION_ORDER: DayCode[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRAINING_SLOTS: Record<number, DayCode[]> = {
  3: ['Mon', 'Wed', 'Fri'],
  4: ['Mon', 'Tue', 'Thu', 'Fri'],
  5: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  6: SESSION_ORDER,
};

/** The session planned for a weekday: the athlete's chosen days first, otherwise spread by days a week. */
export function planForDay(day: DayCode, preview = false): DayPlan {
  const consultation = useConsultationStore.getState();
  if (!consultation.locked && !preview) return DAY_PLANS[day];
  const slots =
    consultation.trainingDays.length > 0
      ? consultation.trainingDays
      : TRAINING_SLOTS[consultation.frequencyDays] || SESSION_ORDER;
  const index = slots.indexOf(day);
  return index >= 0 && index < SESSION_ORDER.length
    ? DAY_PLANS[SESSION_ORDER[index]]
    : DAY_PLANS.Sun;
}
