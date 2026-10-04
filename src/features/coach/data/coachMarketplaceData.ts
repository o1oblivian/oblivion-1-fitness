import { CoachProfile, CoachMarketplaceProgram, CoachReview, AthleteCheckInSubmission } from '../types/coachPlatformTypes';

export const VERIFIED_COACH_PROFILE: CoachProfile = {
  id: 'coach-elena',
  name: 'Elena Vasquez',
  handle: '@elena_biomech',
  role: 'Head Biomechanics Director',
  avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&auto=format&fit=crop&q=80',
  bannerImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  bio: 'Former Olympic weightlifting consultant specializing in kinetic chain efficiency, force velocity curves, and joint integrity under load.',
  rating: 4.96,
  reviewsCount: 38,
  activeClientsCount: 14,
  specialties: ['Biomechanics', 'Olympic Weightlifting', 'Structural Hypertrophy'],
  certifications: ['MS Kinesiology', 'CSCS*D', 'USAW L3'],
  slotsRemaining: 2,
  pricing: { monthlyOneOnOneUsd: 189, teamSubscriptionUsd: 49 },
};

export const COACH_MARKETPLACE_PROGRAMS: CoachMarketplaceProgram[] = [
  {
    id: 'prog-hypertrophy-p1',
    coachId: 'coach-elena',
    coachName: 'Elena Vasquez',
    title: 'HYPERTROPHY PHASE 1',
    tagline: 'High-tension mechanical load targeting maximum sarcomere remodeling with zero joint impingement.',
    category: 'Hypertrophy',
    difficulty: 'Elite',
    durationWeeks: 8,
    daysPerWeek: 4,
    priceUsd: 79,
    rating: 4.98,
    enrolledCount: 142,
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    description: 'An 8-week periodized protocol maximizing tension stimulus while autoregulating systemic fatigue.',
    highlights: ['Autoregulated RPE 8.5 caps', 'Posterior chain focus', 'Joint preservation volume'],
    sampleWeek: [
      {
        dayNumber: 1,
        dayName: 'Day 1: Posterior Density',
        focus: 'Hamstrings & Lats',
        exercises: [
          { name: 'Barbell Romanian Deadlift', sets: 4, reps: '8-10', notes: '3-sec eccentric pause' },
          { name: 'Neutral Grip Lat Pulldown', sets: 4, reps: '10-12', notes: 'Full lat stretch at peak' },
          { name: 'Incline Dumbbell Row', sets: 3, reps: '12', notes: 'Chest-supported strict tension' },
        ],
      },
    ],
  },
  {
    id: 'prog-rotational-power',
    coachId: 'coach-marcus',
    coachName: 'Marcus Vance',
    title: 'ELITE ROTATIONAL POWER',
    tagline: 'Multi-planar kinetic transfer combining heavy rotary torque with ballistic rate of force development.',
    category: 'Athletic Performance',
    difficulty: 'Advanced',
    durationWeeks: 6,
    daysPerWeek: 3,
    priceUsd: 89,
    rating: 4.94,
    enrolledCount: 96,
    coverImage: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=600&auto=format&fit=crop&q=80',
    description: 'Transfers axial strength into explosive transverse plane torque for field and combat athletes.',
    highlights: ['Velocity-based velocity tracking', 'Rotational core power', 'Scapulothoracic control'],
    sampleWeek: [
      {
        dayNumber: 1,
        dayName: 'Day 1: Transverse Force',
        focus: 'Rotational Power',
        exercises: [
          { name: 'Landmine Rotational Press', sets: 4, reps: '6/side', notes: 'Explosive hip pivot' },
          { name: 'Cable Woodchopper High-to-Low', sets: 3, reps: '10/side', notes: 'Deceleration emphasis' },
          { name: 'Trap Bar Deadlift Jumps', sets: 4, reps: '5', notes: 'Max RFD output' },
        ],
      },
    ],
  },
  {
    id: 'prog-hyrox-engine',
    coachId: 'coach-sarah',
    coachName: 'Sarah Jenkins',
    title: 'HYROX CONDITIONING ENGINE',
    tagline: 'Lactate threshold buffering, sled mechanics, and compromised running capacity.',
    category: 'Conditioning',
    difficulty: 'Intermediate',
    durationWeeks: 10,
    daysPerWeek: 4,
    priceUsd: 69,
    rating: 4.91,
    enrolledCount: 210,
    coverImage: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=600&auto=format&fit=crop&q=80',
    description: 'Build an aerobic base capable of clearing high blood lactate levels under systemic load.',
    highlights: ['Lactate threshold intervals', 'Pacing drills', 'Grip endurance conditioning'],
    sampleWeek: [
      {
        dayNumber: 1,
        dayName: 'Day 1: Sled & Aerobic Engine',
        focus: 'Aerobic Power',
        exercises: [
          { name: 'Heavy Sled Push', sets: 6, reps: '25m', notes: 'Zone 4 output' },
          { name: 'SkiErg Intervals', sets: 5, reps: '500m', notes: 'Rest 90s between rounds' },
          { name: 'Kettlebell Farmer Carries', sets: 4, reps: '50m', notes: 'Strict posture' },
        ],
      },
    ],
  },
];

export const COACH_VERIFIED_REVIEWS: CoachReview[] = [
  {
    id: 'rev-1',
    coachId: 'coach-elena',
    athleteName: 'Devon Miller',
    athleteHandle: '@dmiller',
    rating: 5,
    verifiedProgram: 'HYPERTROPHY PHASE 1',
    date: '2 days ago',
    comment: 'Elena totally re-engineered my squat path. Zero hip impingement for the first time in 3 years.',
    helpfulCount: 14,
  },
];

export const RECENT_CLIENT_CHECKINS: AthleteCheckInSubmission[] = [];
