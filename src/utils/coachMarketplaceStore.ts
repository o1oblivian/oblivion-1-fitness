import { supabase, isSupabaseConfigured, storageAdapter } from './supabase';
import { deltaSyncQueue } from './scaleEngine';

export interface TrialExercise {
  name: string;
  sets: number;
  reps: string;
  targetLoad: string;
  notes?: string;
  coachEmail?: string;
  programId?: string;
}

export interface AthleteReview {
  id: string;
  athleteName: string;
  athleteAvatar?: string;
  rating: number;
  date: string;
  programName: string;
  prGain?: string;
  comment: string;
  verified: boolean;
  coachResponse?: string;
  coachId?: string;
}

export interface CoachMarketplaceProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialty: string;
  badge: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  athletesCount: number;
  monthlyRate: string;
  monthlyRateNum?: number;
  tags?: string[];
  certifications?: string[];
  responseTime?: string;
  successRate?: string;
  slotsRemaining?: number;
  liveStatus?: 'online' | 'in_session' | 'available';
  reviews?: AthleteReview[];
  sampleRoutine?: {
    title: string;
    category: string;
    exercisesCount: number;
    estimatedMinutes: number;
    description: string;
    exercises: { name: string; sets: number; reps: string; targetLoad: string; notes?: string }[];
  };
}

export const VERIFIED_MARKETPLACE_COACHES: CoachMarketplaceProfile[] = [
  {
    id: 'coach-marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@o1fc.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    specialty: 'Hypertrophy & Contest Prep',
    badge: 'ELITE HEAD COACH',
    bio: 'CSCS, NSCA certified. Specializes in advanced mechanical tension periodization, contest conditioning, and biomechanical optimization.',
    rating: 4.98,
    reviewsCount: 142,
    athletesCount: 68,
    monthlyRate: '$149/mo',
    monthlyRateNum: 149,
    tags: ['Hypertrophy', 'Periodization', 'Contest Prep', 'Upper Body'],
    certifications: ['CSCS (NSCA)', 'Precision Nutrition L2', 'EXOS Performance Specialist'],
    responseTime: '< 1 hr',
    successRate: '99.4%',
    slotsRemaining: 3,
    liveStatus: 'online',
    sampleRoutine: {
      title: 'High-Tension Upper Body Hypertrophy',
      category: 'Hypertrophy',
      exercisesCount: 5,
      estimatedMinutes: 52,
      description: 'Focus on 3-second eccentric tempo and lengthened partials for maximal muscle activation.',
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: '8-10', targetLoad: 'RPE 8.5', notes: '3-second eccentric, 30° bench incline' },
        { name: 'Chest Supported T-Bar Row', sets: 4, reps: '10-12', targetLoad: 'RPE 8', notes: 'Full lat stretch at bottom' },
        { name: 'Cable Lateral Raise', sets: 3, reps: '12-15', targetLoad: 'RPE 9', notes: 'Behind back setup for constant deltoid tension' },
        { name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', targetLoad: 'RPE 8.5', notes: 'Full elbow extension at bottom' },
        { name: 'Overhead Cable Triceps Extension', sets: 3, reps: '12-15', targetLoad: 'RPE 9', notes: 'Flared elbows for long head focus' },
      ],
    },
    reviews: [
      {
        id: 'rev-m-1',
        athleteName: 'Jordan K.',
        rating: 5.0,
        date: '3 days ago',
        programName: '12-Week Hypertrophy OS',
        prGain: '+22 lbs Bench Press • +1.2 in Arm Girth',
        comment: 'Marcus’s programming is unmatched. His video form check turnarounds are under 2 hours, and his adjustments to my shoulder positioning eliminated 2 years of impingement pain.',
        verified: true,
        coachResponse: 'Phenomenal work Jordan. Your elbow flare reduction directly unlocked that 22lb bench PR without joint pain.',
      },
      {
        id: 'rev-m-2',
        athleteName: 'Devon Miller',
        rating: 5.0,
        date: '1 week ago',
        programName: '1:1 Elite Coaching',
        prGain: 'Stage Prep Bodyfat: 14.8% -> 7.4%',
        comment: 'Dispatched workouts loaded straight into Training OS every Sunday night. Zero guesswork. Stepped on stage at 182 lbs shredded.',
        verified: true,
      },
      {
        id: 'rev-m-3',
        athleteName: 'Tyler Vance',
        rating: 4.9,
        date: '2 weeks ago',
        programName: 'High Volume Push/Pull/Legs',
        prGain: '+40 lbs Incline DB Press',
        comment: 'The mechanical tension cues and tempo prescriptions transformed my chest development in 8 weeks.',
        verified: true,
      },
    ],
  },
  {
    id: 'coach-sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@o1fc.app',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    specialty: 'HYROX & Engine Building',
    badge: 'HYBRID PRO',
    bio: 'USAW Level 2, Precision Nutrition. Specializes in compromised running stamina, sled pacing, and sub-60 HYROX blueprint mastery.',
    rating: 4.95,
    reviewsCount: 98,
    athletesCount: 42,
    monthlyRate: '$129/mo',
    monthlyRateNum: 129,
    tags: ['HYROX', 'VO2 Max', 'Erg Pacing', 'Compromised Running'],
    certifications: ['USAW Level 2', 'HYROX Master Coach', 'CrossFit L2 Trainer'],
    responseTime: '< 2 hrs',
    successRate: '98.8%',
    slotsRemaining: 4,
    liveStatus: 'online',
    sampleRoutine: {
      title: 'HYROX Lactate Threshold & Sled Engine',
      category: 'HYROX & Engine',
      exercisesCount: 5,
      estimatedMinutes: 48,
      description: 'Compromised running simulation paired with sled push volume and SkiErg pacing intervals.',
      exercises: [
        { name: 'SkiErg Interval Sprints', sets: 5, reps: '500m', targetLoad: 'Pace: 1:52/500m', notes: 'Rest 60s between rounds' },
        { name: 'Sled Push (Heavy)', sets: 4, reps: '50m', targetLoad: '152 kg', notes: 'Low handle drive, relentless leg drive' },
        { name: 'Burpee Broad Jumps', sets: 4, reps: '20 reps', targetLoad: 'Continuous', notes: 'Chest to deck, explosive horizontal jump' },
        { name: 'RowErg Threshold Pace', sets: 3, reps: '1000m', targetLoad: 'Pace: 1:58/500m', notes: 'Hold consistent SPM 26-28' },
        { name: 'Wall Balls', sets: 4, reps: '25 reps', targetLoad: '9 kg (20 lb)', notes: 'Full hip depth below parallel' },
      ],
    },
    reviews: [
      {
        id: 'rev-s-1',
        athleteName: 'Alex Rivera',
        rating: 5.0,
        date: '5 days ago',
        programName: 'HYROX Race Ready Blueprint',
        prGain: 'HYROX Men Open: 1:12:40 -> 1:02:15 (-10m 25s)',
        comment: 'Sarah revolutionized my compromised running pacing. I didn’t redline on the sleds for the first time in 3 races. Sub-60 is definitely coming next!',
        verified: true,
        coachResponse: 'Your wall ball breathing pacing was textbook on race day. Proud of you Alex!',
      },
      {
        id: 'rev-s-2',
        athleteName: 'Chloe Henderson',
        rating: 4.9,
        date: '2 weeks ago',
        programName: '1:1 Hybrid Coaching',
        prGain: '5K Compromised Split: 24:10 -> 21:30',
        comment: 'Her weekly dispatched check-ins keep me locked in. The programmed SkiErg drills cut 15 seconds off my 1k split.',
        verified: true,
      },
    ],
  },
  {
    id: 'coach-david',
    name: 'David Chen',
    email: 'david.chen@o1fc.app',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    specialty: 'Strength & Powerlifting',
    badge: 'POWER PEAK',
    bio: 'Doctor of Physical Therapy (DPT), CSCS. RPE autoregulation, barbell squat/bench/deadlift peaking, and joint longevity.',
    rating: 4.99,
    reviewsCount: 210,
    athletesCount: 85,
    monthlyRate: '$169/mo',
    monthlyRateNum: 169,
    tags: ['Powerlifting', 'DPT Physical Therapy', 'RPE Peaking', 'Deadlift'],
    certifications: ['Doctor of Physical Therapy (DPT)', 'CSCS (NSCA)', 'USAPL Senior Coach'],
    responseTime: '< 30 min',
    successRate: '99.8%',
    slotsRemaining: 2,
    liveStatus: 'online',
    sampleRoutine: {
      title: 'Barbell Deadlift & Squat Peaking Block',
      category: 'Strength & Power',
      exercisesCount: 4,
      estimatedMinutes: 60,
      description: 'Sub-maximal RPE volume with pause mechanics to bulletproof sticking points.',
      exercises: [
        { name: 'Competition Barbell Deadlift', sets: 4, reps: '3 reps', targetLoad: 'RPE 8 (82.5% 1RM)', notes: 'Slack pull + lat engagement before drive' },
        { name: 'Pause Low Bar Squat (2s Pause)', sets: 4, reps: '4 reps', targetLoad: 'RPE 7.5', notes: 'Maintain torso brace at bottom' },
        { name: 'Romanian Deadlift', sets: 3, reps: '8 reps', targetLoad: 'RPE 8', notes: 'Control 3-second eccentric stretch' },
        { name: 'Cable Pallof Press & Core Brace', sets: 3, reps: '15 reps/side', targetLoad: 'Moderate', notes: 'Anti-rotation stability focus' },
      ],
    },
    reviews: [
      {
        id: 'rev-d-1',
        athleteName: 'Marcus Thorne',
        rating: 5.0,
        date: 'Yesterday',
        programName: 'Powerlifting Meet Prep Peak',
        prGain: 'Total: 1385 lbs -> 1510 lbs (+125 lbs Meet Total)',
        comment: 'Dr. David is a wizard. He spotted a subtle hip shift in my squat video check-in, gave me 2 corrective activation drills, and I hit a 525 lb squat 4 weeks later pain-free.',
        verified: true,
        coachResponse: 'The hip shift was just glute medius timing. You put in the discipline on those tempo squats!',
      },
      {
        id: 'rev-d-2',
        athleteName: 'Samantha Wu',
        rating: 5.0,
        date: '4 days ago',
        programName: '1:1 Power Coaching',
        prGain: 'Conventional Deadlift: 275 lbs -> 345 lbs',
        comment: 'Best coaching investment I’ve ever made. His RPE spreadsheets and video feedback are unmatched.',
        verified: true,
      },
    ],
  },
  {
    id: 'coach-elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@o1fc.app',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    specialty: 'Biomechanics & Glute Hypertrophy',
    badge: 'PRO ATHLETE',
    bio: 'IFBB Pro Coach. High-density posterior chain development, hip thrust mechanics, and individualized muscular symmetry.',
    rating: 4.96,
    reviewsCount: 115,
    athletesCount: 54,
    monthlyRate: '$139/mo',
    monthlyRateNum: 139,
    tags: ['Biomechanics', 'Posterior Chain', 'Glute Hypertrophy', 'IFBB Pro'],
    certifications: ['IFBB Professional Athlete', 'ISSA Master Trainer', 'Biomechanics Specialist'],
    responseTime: '< 1 hr',
    successRate: '99.1%',
    slotsRemaining: 1,
    liveStatus: 'online',
    sampleRoutine: {
      title: 'Posterior Chain & Glute Hypertrophy Protocol',
      category: 'Biomechanics',
      exercisesCount: 5,
      estimatedMinutes: 50,
      description: 'Maximizes muscular recruitment across lengthened and shortened muscle positions.',
      exercises: [
        { name: 'Barbell Hip Thrust', sets: 4, reps: '10-12', targetLoad: 'RPE 9', notes: '2-second isometric contraction at peak extension' },
        { name: 'Kas Glute Bridge', sets: 3, reps: '12-15', targetLoad: 'RPE 8.5', notes: 'Upper-range movement with constant tension' },
        { name: 'Deficit Reverse Lunge', sets: 3, reps: '10 reps/leg', targetLoad: 'RPE 8', notes: 'Slight forward torso lean for maximum glute load' },
        { name: 'Seated Cable Hip Abduction', sets: 3, reps: '15-20', targetLoad: 'RPE 9.5', notes: 'Lean forward slightly, full controlled eccentric' },
        { name: 'Back Extension (45° Glute Bias)', sets: 3, reps: '12 reps', targetLoad: 'Weighted (25 lb)', notes: 'Rounded upper back, pure hip drive' },
      ],
    },
    reviews: [
      {
        id: 'rev-e-1',
        athleteName: 'Danielle Brooks',
        rating: 5.0,
        date: '2 days ago',
        programName: 'Biomechanics & Posterior Specialization',
        prGain: '+60 lbs Hip Thrust (365 lbs x 10) • +1.8 in Glute Gain',
        comment: 'Elena completely fixed my hip thrust setup. Within 6 weeks my lower back stopped aching and my glute activation doubled. Dispatches arrive like clockwork.',
        verified: true,
        coachResponse: 'Your foot position adjustment was the turning point. Keep owning those top isometrics!',
      },
      {
        id: 'rev-e-2',
        athleteName: 'Megan Alvarez',
        rating: 5.0,
        date: '1 week ago',
        programName: '1:1 Pro Athlete Prep',
        prGain: 'IFBB Pro Qualifier 1st Place',
        comment: 'Elena’s attention to symmetry and weekly video adjustments got me my pro card. Cannot recommend enough!',
        verified: true,
      },
    ],
  },
];

const COACHES_STORAGE_KEY = 'coach_marketplace_profiles_v1';
const REVIEWS_STORAGE_KEY = 'coach_marketplace_reviews_v1';

export function getCachedMarketplaceCoaches(): CoachMarketplaceProfile[] {
  try {
    const raw = localStorage.getItem(COACHES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached coaches:', e);
  }
  return VERIFIED_MARKETPLACE_COACHES;
}

export function getMarketplaceCoaches(): CoachMarketplaceProfile[] {
  return getCachedMarketplaceCoaches();
}

export async function fetchMarketplaceCoaches(): Promise<CoachMarketplaceProfile[]> {
  // 1. Fetch from Supabase coaches table
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .order('rating', { ascending: false });

      if (!error && data && data.length > 0) {
        const liveCoaches: CoachMarketplaceProfile[] = data.map((row: any) => ({
          id: row.id || `coach-${row.email}`,
          name: row.name || 'Coach',
          email: row.email,
          avatar: row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          specialty: row.specialty || 'Strength & Conditioning',
          badge: row.badge || 'PRO COACH',
          bio: row.bio || '',
          rating: Number(row.rating) || 5.0,
          reviewsCount: Number(row.reviews_count ?? row.reviewscount) || (row.reviews?.length || 0),
          athletesCount: Number(row.athletes_count ?? row.athletescount) || 0,
          monthlyRate: row.monthly_rate || (row.monthly_rate_num ? `$${row.monthly_rate_num}/mo` : '$149/mo'),
          monthlyRateNum: row.monthly_rate_num || 149,
          tags: row.tags || ['Hypertrophy', 'Periodization'],
          certifications: row.certifications || ['CSCS (NSCA)'],
          responseTime: row.response_time || '< 1 hr',
          successRate: row.success_rate || '99%',
          slotsRemaining: row.slots_remaining ?? 3,
          liveStatus: row.live_status || 'online',
          reviews: row.reviews || [],
          sampleRoutine: row.sample_routine || undefined,
        }));

        // Merge with seed coaches to ensure master catalog is complete
        const combined = [...liveCoaches];
        for (const seed of VERIFIED_MARKETPLACE_COACHES) {
          if (!combined.some((c) => c.email.toLowerCase() === seed.email.toLowerCase() || c.id === seed.id)) {
            combined.push(seed);
          }
        }

        try {
          localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(combined));
        } catch {}
        return combined;
      }
    } catch (e) {
      console.warn('Supabase fetchMarketplaceCoaches note:', e);
    }
  }

  return getCachedMarketplaceCoaches();
}

export async function saveCoachProfileToSupabase(profile: CoachMarketplaceProfile): Promise<boolean> {
  // Update local cache
  const current = getCachedMarketplaceCoaches();
  const existingIdx = current.findIndex((c) => c.email.toLowerCase() === profile.email.toLowerCase() || c.id === profile.id);
  let updatedList: CoachMarketplaceProfile[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...profile };
  } else {
    updatedList = [profile, ...current];
  }

  try {
    localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(updatedList));
  } catch {}

  // Sync to Supabase
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        specialty: profile.specialty,
        badge: profile.badge,
        bio: profile.bio,
        rating: profile.rating,
        reviews_count: profile.reviewsCount,
        athletes_count: profile.athletesCount,
        monthly_rate: profile.monthlyRate,
        monthly_rate_num: profile.monthlyRateNum,
        tags: profile.tags,
        certifications: profile.certifications,
        response_time: profile.responseTime,
        success_rate: profile.successRate,
        slots_remaining: profile.slotsRemaining,
        live_status: profile.liveStatus,
        sample_routine: profile.sampleRoutine,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('coach_profiles').upsert(payload, { onConflict: 'email' });
      if (error) {
        deltaSyncQueue.enqueue('coach_profiles', 'UPSERT', payload);
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveCoachProfile error:', e);
    }
  }

  return true;
}

export async function addCoachReview(coachId: string, review: Omit<AthleteReview, 'id' | 'date' | 'verified'>): Promise<AthleteReview> {
  const newReview: AthleteReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...review,
    date: 'Just now',
    verified: true,
    coachId,
  };

  const coaches = getCachedMarketplaceCoaches();
  const targetCoach = coaches.find((c) => c.id === coachId || c.email === coachId);
  if (targetCoach) {
    const updatedReviews = [newReview, ...(targetCoach.reviews || [])];
    const newRating = Number(
      (
        updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
        updatedReviews.length
      ).toFixed(2)
    );
    targetCoach.reviews = updatedReviews;
    targetCoach.reviewsCount = updatedReviews.length;
    targetCoach.rating = newRating;
    await saveCoachProfileToSupabase(targetCoach);
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('coach_reviews').insert({
        id: newReview.id,
        coach_id: coachId,
        athlete_name: newReview.athleteName,
        rating: newReview.rating,
        program_name: newReview.programName,
        pr_gain: newReview.prGain,
        comment: newReview.comment,
        verified: true,
        created_at: new Date().toISOString(),
      });
      if (error) {
        deltaSyncQueue.enqueue('coach_reviews', 'INSERT', {
          id: newReview.id,
          coach_id: coachId,
          athlete_name: newReview.athleteName,
          rating: newReview.rating,
          comment: newReview.comment,
        });
      }
    } catch (e) {
      console.warn('Supabase addCoachReview error:', e);
    }
  }

  return newReview;
}

export interface CoachProgram {
  programId: string;
  coachEmail: string;
  coachName: string;
  programTitle: string;
  durationWeeks: number;
  priceCents: number;
  exercises: TrialExercise[];
  socialLinks?: { instagram?: string; tiktok?: string; strava?: string };
}

const UNLOCK_KEY_PREFIX = 'coach_unlocked_';

export function isCoachUnlocked(coachEmail: string): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY_PREFIX + coachEmail) === 'true';
  } catch {
    return false;
  }
}

export function setCoachUnlocked(coachEmail: string): void {
  try {
    localStorage.setItem(UNLOCK_KEY_PREFIX + coachEmail, 'true');
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('coach_unlocked', { detail: { coachEmail } })
    );
  }
}

export function injectTrialExercise(exercise: TrialExercise): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('trial_exercise_inject', { detail: exercise })
    );
  }
}

export function dispatchProgramToLogger(program: CoachProgram): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('coach_program_dispatch', { detail: program })
    );
  }
}

export function openCoachVault(media: {
  coachEmail: string;
  coachName: string;
  items: { id: string; title: string; type: 'video' | 'image'; url: string; thumbnailUrl: string; tags?: string[]; specialization?: string }[];
  startIndex?: number;
}): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open_coach_vault', { detail: media })
    );
  }
}
