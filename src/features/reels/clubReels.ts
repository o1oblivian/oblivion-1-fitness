import type { ExploreCoach, ExploreReelItem } from './reelTypes';
import type { BodyPartTag, ReelCategoryId } from './reelCategories';

/** Official club reels that ship inside the app. Footage: Mixkit Stock Video Free License (no audio, no attribution required). */
const CLUB_COACH_ID = 'o1fc-club';

const CLUB_COACH: ExploreCoach = {
  id: CLUB_COACH_ID,
  name: 'Oblivion 1',
  handle: '@o1fc',
  avatar: '/brand/o1fc-mark.png',
  verified: true,
  specialtyTitle: 'Official club reels',
  rating: 0,
  reviewCount: 0,
  certificationPill: 'OBLIVION 1 FITNESS CLUB',
  rate: '',
  slotsRemaining: 0,
  bio: 'Short, practical clips from the Oblivion 1 team.',
  disciplines: [],
};

interface ClubReelSpec {
  slug: string;
  category: ReelCategoryId;
  filterTag: BodyPartTag | null;
  title: string;
  duration: string;
  cues: string;
}

const SPECS: ClubReelSpec[] = [
  {
    slug: 'hypertrophy',
    category: 'HYPERTROPHY',
    filterTag: 'SHOULDERS & ARMS',
    title: 'Barbell curl: keep the elbows still',
    duration: '0:12',
    cues: 'Elbows pinned to your sides. Curl without leaning back, squeeze at the top, then take two to three seconds to lower. Stop the set when the elbows start drifting forward.',
  },
  {
    slug: 'single-arm',
    category: 'HYPERTROPHY',
    filterTag: 'SHOULDERS & ARMS',
    title: 'One-arm dumbbell, slow reps',
    duration: '0:11',
    cues: 'Stand tall and lift with one arm. Keep the working shoulder down and the torso still. Lower for two to three seconds, then switch arms before the shoulder starts shrugging.',
  },
  {
    slug: 'db-squat',
    category: 'HYPERTROPHY',
    filterTag: 'QUADS & GLUTES',
    title: 'Dumbbell squat, full depth',
    duration: '0:16',
    cues: 'Dumbbell in each hand, feet about shoulder width. Sit to full depth with the whole foot down, then stand by driving the floor away. Keep the chest up so the bells stay beside the legs.',
  },
  {
    slug: 'biomechanics',
    category: 'BIOMECHANICS',
    filterTag: 'QUADS & GLUTES',
    title: 'Goblet squat: knees track the toes',
    duration: '0:12',
    cues: 'Bell tight to the chest, feet about shoulder width. Sit between your heels, let the knees travel over the toes, and keep the whole foot on the floor. Stand up by pushing the floor away.',
  },
  {
    slug: 'lunge',
    category: 'BIOMECHANICS',
    filterTag: 'QUADS & GLUTES',
    title: 'Lunge: knee tracks the toe',
    duration: '0:08',
    cues: 'Step long enough that the front knee stays over the mid-foot, not past a collapsed ankle. Drop the back knee under the hip and push back up through the front heel.',
  },
  {
    slug: 'combo-squat',
    category: 'BIOMECHANICS',
    filterTag: 'QUADS & GLUTES',
    title: 'Squat, then press the dumbbells',
    duration: '0:21',
    cues: 'Squat first with the bells at the shoulders. Stand all the way up, then press. Finish the squat before the press starts so the two parts stay separate.',
  },
  {
    slug: 'strength',
    category: 'STRENGTH',
    filterTag: null,
    title: 'Clean and press: keep the bar close',
    duration: '0:15',
    cues: 'Bar over mid-foot, back flat. Push the floor away so the bar stays close past the knees, drive the hips through and catch it on the shoulders with the elbows high. Brace, then press straight up with the head moving through at the top.',
  },
  {
    slug: 'barbell-set',
    category: 'STRENGTH',
    filterTag: null,
    title: 'Barbell set: brace before you lift',
    duration: '0:11',
    cues: 'Set the feet, take a breath, and brace the trunk before the bar moves. Keep the bar close and the back flat through the rep. Rack it when the brace gives out.',
  },
  {
    slug: 'bench',
    category: 'STRENGTH',
    filterTag: 'CHEST & TRICEPS',
    title: 'Bench press: bar to the chest',
    duration: '0:13',
    cues: 'Shoulder blades set, feet flat. Lower the bar to the chest with the elbows under the bar, then press straight up. Keep the hips on the bench.',
  },
  {
    slug: 'mobility',
    category: 'MOBILITY',
    filterTag: null,
    title: 'Seated hamstring and hip opener',
    duration: '0:25',
    cues: 'Sit tall with one leg long. Hinge forward from the hips, not the upper back, until you feel a stretch. Breathe slowly and hold 30 to 45 seconds each side. Ease off if it pinches.',
  },
  {
    slug: 'floor-stretch',
    category: 'MOBILITY',
    filterTag: null,
    title: 'Floor stretch between sets',
    duration: '0:25',
    cues: 'Sit on the floor and ease into the stretch. Breathe slowly and stay where it feels like a stretch, not a pinch. Use it between sets, not as a warm-up for a heavy lift.',
  },
  {
    slug: 'leg-stretch',
    category: 'MOBILITY',
    filterTag: 'QUADS & GLUTES',
    title: 'Leg stretch on the rack',
    duration: '0:18',
    cues: 'Support the leg on the rack and hinge from the hip until the hamstring takes the stretch. Keep the back long. Hold, breathe, then switch sides.',
  },
  {
    slug: 'conditioning',
    category: 'CONDITIONING',
    filterTag: null,
    title: 'Battle ropes: 20 seconds on, 40 off',
    duration: '0:13',
    cues: 'Half squat, chest up, and drive the waves from the shoulders with fast, even arms. Work 20 seconds, rest 40, and repeat for 6 to 8 rounds.',
  },
  {
    slug: 'burpee',
    category: 'CONDITIONING',
    filterTag: null,
    title: 'Dumbbell burpee, stay long',
    duration: '0:21',
    cues: 'Hands on the dumbbells, jump or step back to a long body, then jump the feet back in and stand. Keep the hips from sagging on the way down.',
  },
  {
    slug: 'jump-lunge',
    category: 'CONDITIONING',
    filterTag: 'QUADS & GLUTES',
    title: 'Jump lunges, soft landing',
    duration: '0:13',
    cues: 'Switch legs in the air and land softly with the front knee over the mid-foot. Stay tall. Stop when the landing gets loud.',
  },
  {
    slug: 'rehab',
    category: 'REHAB',
    filterTag: 'SHOULDERS & ARMS',
    title: 'Shoulder circles before you press',
    duration: '0:07',
    cues: 'Slow, controlled circles, small at first and then bigger, 10 each direction. Use them to warm the shoulder before pressing. Stay in a range that feels comfortable.',
  },
  {
    slug: 'band-stretch',
    category: 'REHAB',
    filterTag: null,
    title: 'Easy stretch on the gear',
    duration: '0:19',
    cues: 'Use the stretch gear for a light pull, not a max stretch. Move slowly and stay in a range that feels comfortable. Stop if a joint pinches.',
  },
  {
    slug: 'overhead-reach',
    category: 'REHAB',
    filterTag: 'SHOULDERS & ARMS',
    title: 'Arms overhead, easy breath',
    duration: '0:21',
    cues: 'Reach both arms overhead and breathe out as the ribs drop. Keep the shoulders away from the ears. Use this before pressing if the shoulders feel tight.',
  },
];

export const CLUB_REELS: ExploreReelItem[] = SPECS.map((spec) => {
  const videoUrl = `/reels/club/${spec.slug}.mp4`;
  const thumbnail = `/reels/club/${spec.slug}.jpg`;
  return {
    id: `o1fc-club-${spec.slug}`,
    title: spec.title,
    category: spec.category,
    filterTag: spec.filterTag,
    videoUrl,
    thumbnail,
    views: '',
    duration: spec.duration,
    cues: spec.cues,
    coach: CLUB_COACH,
    filmstripClips: [
      {
        id: `o1fc-club-${spec.slug}-clip`,
        title: spec.title,
        duration: spec.duration,
        thumbnail,
        videoUrl,
        tag: spec.category,
      },
    ],
  };
});

export const isClubCoach = (coachId: string | undefined): boolean => coachId === CLUB_COACH_ID;
