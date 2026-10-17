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
    slug: 'tutorial',
    category: 'TUTORIAL',
    filterTag: null,
    title: 'Film your set so you can check it later',
    duration: '0:10',
    cues: 'Prop your phone at hip height, side-on, about two metres away so the whole body and the bar stay in frame. On any reel, tap Log to add that movement to today’s session.',
  },
  {
    slug: 'hypertrophy',
    category: 'HYPERTROPHY',
    filterTag: 'SHOULDERS & ARMS',
    title: 'Barbell curl: keep the elbows still',
    duration: '0:12',
    cues: 'Elbows pinned to your sides. Curl without leaning back, squeeze at the top, then take two to three seconds to lower. Stop the set when the elbows start drifting forward.',
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
    slug: 'strength',
    category: 'STRENGTH',
    filterTag: null,
    title: 'Clean and press: keep the bar close',
    duration: '0:15',
    cues: 'Bar over mid-foot, back flat. Push the floor away so the bar stays close past the knees, drive the hips through and catch it on the shoulders with the elbows high. Brace, then press straight up with the head moving through at the top.',
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
    slug: 'conditioning',
    category: 'CONDITIONING',
    filterTag: null,
    title: 'Battle ropes: 20 seconds on, 40 off',
    duration: '0:13',
    cues: 'Half squat, chest up, and drive the waves from the shoulders with fast, even arms. Work 20 seconds, rest 40, and repeat for 6 to 8 rounds.',
  },
  {
    slug: 'rehab',
    category: 'REHAB',
    filterTag: 'SHOULDERS & ARMS',
    title: 'Shoulder circles before you press',
    duration: '0:07',
    cues: 'Slow, controlled circles, small at first and then bigger, 10 each direction. Use them to warm the shoulder before pressing. Stay in a range that feels comfortable.',
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
    filmstripClips: [{ id: `o1fc-club-${spec.slug}-clip`, title: spec.title, duration: spec.duration, thumbnail, videoUrl, tag: spec.category }],
  };
});

export const isClubCoach = (coachId: string | undefined): boolean => coachId === CLUB_COACH_ID;
