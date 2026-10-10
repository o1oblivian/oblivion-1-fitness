import type { ProgramDetailInfo } from '../features/workout/data/programDetailsData';

export const MOCK_PROGRAM_DETAILS: Record<string, ProgramDetailInfo> = {
  'BOOTY BUILDER': {
    banner: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000&auto=format&fit=crop&q=80',
    subtitle: 'Glute-Max & Pelvic Chain Periodization',
    focus: 'Hypertrophy',
    level: 'Elite Athlete',
    duration: '6 Weeks (7 Microcycles)',
    exercises: [
      { name: 'Barbell Hip Thrust', sets: '4 Sets', reps: '8-10 Reps', load: '140 kg Target' },
      { name: 'Kas Glute Bridge', sets: '3 Sets', reps: '12 Reps (3s Pause)', load: '100 kg Target' },
      { name: 'Cable Glute Kickbacks', sets: '3 Sets', reps: '15 Reps / Leg', load: 'Stack 6' },
      { name: 'Romanian Deadlift (RDL)', sets: '4 Sets', reps: '8 Reps', load: '110 kg Target' },
      { name: 'Bulgarian Split Squat', sets: '3 Sets', reps: '10 Reps / Leg', load: '32 kg DBs' },
    ],
  },
  'V-TAPER SCULPT': {
    banner: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1000&auto=format&fit=crop&q=80',
    subtitle: 'Clavicular & Latissimus Dorsi Expansion',
    focus: 'Hypertrophy & Biomechanics',
    level: 'Advanced',
    duration: '8 Weeks',
    exercises: [
      { name: 'Incline Barbell Press (30°)', sets: '4 Sets', reps: '6-8 Reps', load: '100 kg Target' },
      { name: 'Neutral Grip Lat Pulldown', sets: '4 Sets', reps: '10-12 Reps', load: '85 kg Target' },
      { name: 'Chest-Supported T-Bar Row', sets: '3 Sets', reps: '8-10 Reps', load: '60 kg Target' },
      { name: 'Cable Lateral Raise (Behind Body)', sets: '4 Sets', reps: '15 Reps', load: 'Stack 4' },
      { name: 'Incline Dumbbell Fly-Press', sets: '3 Sets', reps: '12 Reps', load: '26 kg DBs' },
    ],
  },
  'GREEK GOD': {
    banner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80',
    subtitle: 'Classical Proportion & Maximum Power',
    focus: 'Strength & Hypertrophy',
    level: 'Elite Athlete',
    duration: '10 Weeks',
    exercises: [
      { name: 'Barbell Overhead Press (OHP)', sets: '5 Sets', reps: '5 Reps', load: '75 kg Target' },
      { name: 'Weighted Neutral Pull-Ups', sets: '4 Sets', reps: '6 Reps', load: '+25 kg Target' },
      { name: 'Incline Dumbbell Bench Press', sets: '4 Sets', reps: '8 Reps', load: '38 kg DBs' },
      { name: 'Barbell High-Bar Back Squat', sets: '4 Sets', reps: '6 Reps', load: '130 kg Target' },
      { name: 'Overhead Cable Triceps Extension', sets: '3 Sets', reps: '12 Reps', load: 'Stack 7' },
    ],
  },
  'HOURGLASS': {
    banner: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1000&auto=format&fit=crop&q=80',
    subtitle: 'Core Tightening & Posterior Kinetic Chain',
    focus: 'Hypertrophy & Conditioning',
    level: 'Intermediate - Elite',
    duration: '6 Weeks',
    exercises: [
      { name: 'Barbell Hip Thrust (Pyramid)', sets: '4 Sets', reps: '12, 10, 8, 6', load: '135 kg Target' },
      { name: 'Deficit Reverse Lunges', sets: '3 Sets', reps: '12 / Leg', load: '20 kg DBs' },
      { name: 'Seated Cable Row (Wide Grip)', sets: '3 Sets', reps: '12 Reps', load: '55 kg Target' },
      { name: 'Dumbbell Romanian Deadlift', sets: '4 Sets', reps: '10 Reps', load: '28 kg DBs' },
      { name: 'Cable Pallof Press & Hold', sets: '3 Sets', reps: '30s / Side', load: 'Stack 5' },
    ],
  },
};
