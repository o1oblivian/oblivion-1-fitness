import React, { useEffect, useMemo, useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useReelsStore } from '../../../stores/useReelsStore';
import { useReelViewsStore } from '../../reels/services/reelViews';
import { filterReelsCatalog } from '../../reels/hooks/reelsFilterHelper';
import type { ExploreReelItem } from '../../reels/reelTypes';
import {
  getAthleteDayRoutine,
  getSystemTodayCode,
  useDayRoutineRevision,
} from '../services/dayRoutineService';
import reelsImg from '../../../assets/images/reels/reels.jpg';
import tutorialImg from '../../../assets/images/reels/tutorial.jpg';
import hypertrophyImg from '../../../assets/images/reels/hypertrophy.jpg';
import biomechanicsImg from '../../../assets/images/reels/biomechanics.jpg';
import strengthImg from '../../../assets/images/reels/strength.jpg';
import mobilityImg from '../../../assets/images/reels/mobility.jpg';
import conditioningImg from '../../../assets/images/reels/conditioning.jpg';
import rehabImg from '../../../assets/images/reels/rehab.jpg';
import { REEL_CATEGORIES, type ReelCategoryId } from '../../reels/reelCategories';
import { useVisibleReels } from '../../reels/services/reelSafety';

export type ReelCategory = ExploreReelItem['category'];

interface StoryProgram {
  id: string;
  name: string;
  category: ReelCategory;
  photoUrl: string;
}

const FALLBACK_COVERS: Record<ReelCategoryId, string> = {
  TUTORIAL: tutorialImg,
  HYPERTROPHY: hypertrophyImg,
  BIOMECHANICS: biomechanicsImg,
  STRENGTH: strengthImg,
  MOBILITY: mobilityImg,
  CONDITIONING: conditioningImg,
  REHAB: rehabImg,
};

const STORY_IDS: Record<ReelCategoryId, string> = {
  TUTORIAL: 'o1fc-tutorial',
  HYPERTROPHY: 'hypertrophy',
  BIOMECHANICS: 'biomechanics',
  STRENGTH: 'strength',
  MOBILITY: 'mobility',
  CONDITIONING: 'conditioning',
  REHAB: 'rehab',
};

const PROGRAM_STORIES: StoryProgram[] = [
  { id: 'elite-reels', name: 'Reels', category: 'ALL', photoUrl: reelsImg },
  ...REEL_CATEGORIES.map((c) => ({
    id: STORY_IDS[c.id],
    name: c.label,
    category: c.id,
    photoUrl: FALLBACK_COVERS[c.id],
  })),
];

/** The club's own circles stay put even before any reels are posted to them, and keep the club artwork. */
const ALWAYS_SHOWN = new Set<ReelCategory>(['ALL', 'TUTORIAL']);

const StoryCover: React.FC<{ src: string; fallback: string; dim: boolean }> = ({
  src,
  fallback,
  dim,
}) => {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <img
      src={failed === src ? fallback : src}
      alt=""
      onError={() => setFailed(src)}
      className={`w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105 ${dim ? 'opacity-70' : ''}`}
      loading="lazy"
      decoding="async"
    />
  );
};

export function reelStoryId(category: ReelCategory): string {
  return PROGRAM_STORIES.find((s) => s.category === category)?.id ?? 'elite-reels';
}

/** Categories that suit today's planned session, most relevant first. */
function todaysCategories(): ReelCategory[] {
  const { splitName, exercises } = getAthleteDayRoutine(getSystemTodayCode());
  const text =
    `${splitName} ${exercises.map((e) => `${e.targetMuscle || ''} ${e.tier || ''}`).join(' ')}`.toUpperCase();
  if (/REST|RECOVERY|RESTORATION/.test(splitName.toUpperCase())) return ['MOBILITY', 'REHAB'];
  if (/HYROX|HYPER\b|CONDITIONING|CARDIO|SLED|ERG/.test(text)) return ['CONDITIONING', 'MOBILITY'];
  if (/LEGS|LOWER|QUAD|HAMSTRING|GLUTE|SQUAT/.test(text))
    return ['STRENGTH', 'BIOMECHANICS', 'MOBILITY'];
  if (/PUSH|PULL|UPPER|CHEST|BACK|LAT|DELT|BICEP|TRICEP/.test(text))
    return ['HYPERTROPHY', 'BIOMECHANICS'];
  return [];
}

export interface ProgramReelsScrollerProps {
  activeId: string;
  onSelect: (category: ReelCategory, filterTag: string) => void;
}

export const ProgramReelsScroller: React.FC<ProgramReelsScrollerProps> = ({
  activeId,
  onSelect,
}) => {
  const reels = useVisibleReels(useReelsStore((s) => s.reels));
  const loadFeed = useReelsStore((s) => s.loadFeed);
  const viewed = useReelViewsStore((s) => s.viewed);
  const hydrateViews = useReelViewsStore((s) => s.hydrate);
  const routineRevision = useDayRoutineRevision();

  useEffect(() => {
    void loadFeed();
    void hydrateViews();
  }, [loadFeed, hydrateViews]);

  const stories = useMemo(() => {
    void routineRevision;
    const priority = todaysCategories();
    const rank = (s: StoryProgram) =>
      s.category === 'ALL'
        ? -1
        : priority.includes(s.category)
          ? priority.indexOf(s.category)
          : priority.length;
    return PROGRAM_STORIES.map((story, order) => ({ story, order }))
      .sort((a, b) => rank(a.story) - rank(b.story) || a.order - b.order)
      .map(({ story }) => {
        const matching = filterReelsCatalog(reels, 'ALL', story.category, '');
        const cover = ALWAYS_SHOWN.has(story.category)
          ? undefined
          : matching.find((r) => r.thumbnail)?.thumbnail;
        return {
          ...story,
          cover: cover || story.photoUrl,
          total: matching.length,
          unwatched: matching.filter((r) => !viewed[r.id]).length,
        };
      })
      .filter((story) => ALWAYS_SHOWN.has(story.category) || story.total > 0);
  }, [reels, viewed, routineRevision]);

  return (
    <div className="w-full select-none pt-1 pb-1">
      <div className="flex items-start gap-3 overflow-x-auto py-1 px-1 scrollbar-none">
        {stories.map((story) => {
          const isActive = activeId === story.id;
          const fresh = story.unwatched > 0;
          const ring = isActive
            ? 'ring-1 ring-white/60'
            : story.category === 'ALL' && fresh
              ? 'ring-[1.5px] ring-o1-text/80'
              : 'ring-1 ring-white/15 group-hover:ring-white/30';
          return (
            <button
              key={story.id}
              type="button"
              id={`reel-story-${story.id}`}
              aria-pressed={isActive}
              aria-label={fresh ? `${story.name}, ${story.unwatched} new` : story.name}
              onClick={() => {
                tactileEngine.triggerLightTick();
                onSelect(story.category, 'ALL');
              }}
              className="group flex flex-col items-center shrink-0 w-[80px] cursor-pointer active:scale-95 transition-transform duration-200 focus-visible:outline-none"
            >
              <span
                className={`relative block w-[76px] h-[76px] rounded-full p-[2px] transition-all duration-300 group-focus-visible:ring-white/60 ${ring}`}
              >
                <span className="block w-full h-full rounded-full overflow-hidden relative bg-o1-well">
                  <StoryCover
                    src={story.cover}
                    fallback={story.photoUrl}
                    dim={!fresh && !isActive && story.category !== 'ALL'}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                  {story.category === 'ALL' && (
                    <span
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      aria-hidden="true"
                    >
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-black/55 backdrop-blur-sm">
                        <svg
                          className="w-3.5 h-3.5 text-white translate-x-px"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </span>
                    </span>
                  )}
                </span>
              </span>
              <span className="mt-1.5 block w-full px-0.5 text-center font-sans text-[11px] font-medium truncate text-white">
                {story.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
