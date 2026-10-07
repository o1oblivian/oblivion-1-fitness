import React, { useState, useEffect } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { readAthleteSettingsSnapshot } from '../../../utils/athleteSettingsSnapshot';
import o1fcTutorialLensImg from '../../../assets/images/o1fc_tutorial_lens_1790743700478.jpg';

export interface StoryProgram {
  id: string;
  name: string;
  category?: 'ALL' | 'TUTORIAL' | 'MOBILITY' | 'BIOMECHANICS' | 'HYPERTROPHY' | 'STRENGTH' | 'REHAB';
  filterTag?: string;
  coachName?: string;
  duration?: string;
  photoUrl: string;
}

export const PROGRAM_STORIES: StoryProgram[] = [
  {
    id: 'elite-reels',
    name: 'ALL',
    category: 'ALL',
    filterTag: 'ALL',
    coachName: 'Oblivion 1 Directives',
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&crop=center&q=80',
  },
  {
    id: 'o1fc-tutorial',
    name: 'O1FC TUTORIAL',
    category: 'TUTORIAL',
    filterTag: 'TUTORIAL',
    coachName: 'App Guide',
    photoUrl: o1fcTutorialLensImg,
  },
  {
    id: 'hypertrophy',
    name: 'HYPERTROPHY',
    category: 'HYPERTROPHY',
    filterTag: 'HYPERTROPHY',
    coachName: 'Coach Jaxson',
    photoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&crop=center&q=80',
  },
  {
    id: 'biomechanics',
    name: 'BIOMECHANICS',
    category: 'BIOMECHANICS',
    filterTag: 'BIOMECHANICS',
    coachName: 'Coach Tariq',
    photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&crop=center&q=80',
  },
  {
    id: 'strength',
    name: 'STRENGTH',
    category: 'STRENGTH',
    filterTag: 'STRENGTH',
    coachName: 'Coach Marcus',
    photoUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&crop=center&q=80',
  },
  {
    id: 'mobility',
    name: 'MOBILITY',
    category: 'MOBILITY',
    filterTag: 'MOBILITY',
    coachName: 'Coach Elena',
    photoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&crop=center&q=80',
  },
  {
    id: 'hyrox',
    name: 'HYROX',
    category: 'ALL',
    filterTag: 'HYROX',
    coachName: 'Coach Anya',
    photoUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&auto=format&fit=crop&crop=center&q=80',
  },
  {
    id: 'rehab',
    name: 'REHAB',
    category: 'REHAB',
    filterTag: 'REHAB',
    coachName: 'Coach Elena',
    photoUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&auto=format&fit=crop&crop=center&q=80',
  },
];

export interface ProgramReelsScrollerProps {
  onOpenExploreHub?: () => void;
  onOpenPlayerWithCategory?: (
    category: 'ALL' | 'TUTORIAL' | 'MOBILITY' | 'BIOMECHANICS' | 'HYPERTROPHY' | 'STRENGTH' | 'REHAB',
    filterTag: string
  ) => void;
  onSelectCategory?: (
    category: 'ALL' | 'TUTORIAL' | 'MOBILITY' | 'BIOMECHANICS' | 'HYPERTROPHY' | 'STRENGTH' | 'REHAB',
    filterTag: string,
    storyId: string
  ) => void;
  onSelectBlueprint?: (blueprintKey: string) => void;
  activeId?: string;
}

export const ProgramReelsScroller: React.FC<ProgramReelsScrollerProps> = ({
  onOpenExploreHub,
  onOpenPlayerWithCategory,
  onSelectCategory,
  activeId = 'elite-reels',
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeId);

  useEffect(() => {
    if (activeId) {
      setSelectedId(activeId);
    }
  }, [activeId]);

  const handleClick = (story: StoryProgram) => {
    tactileEngine.triggerLightTick();
    setSelectedId(story.id);

    const cat = story.category || 'ALL';
    const tag = story.filterTag || 'ALL';

    if (onSelectCategory) {
      onSelectCategory(cat, tag, story.id);
      return;
    }

    if (story.id === 'elite-reels') {
      onOpenExploreHub?.();
      return;
    }
    onOpenPlayerWithCategory?.(cat, tag);
  };

  return (
    <div className="w-full select-none pt-1 pb-1">
      <div className="flex items-start gap-3 overflow-x-auto py-1 px-1 scrollbar-none">
        {PROGRAM_STORIES.filter((story) =>
          story.id === 'elite-reels' ? readAthleteSettingsSnapshot().eliteReelsPresence : true
        ).map((story) => {
          const isActive = selectedId === story.id;

          return (
            <button
              key={story.id}
              type="button"
              id={`reel-story-${story.id}`}
              onClick={() => handleClick(story)}
              className="group flex flex-col items-center shrink-0 focus:outline-none cursor-pointer active:scale-95 transition-transform duration-200"
              style={{ width: '80px' }}
            >
              <div className="relative w-[76px] h-[76px] flex items-center justify-center">
                <div
                  className={`w-full h-full rounded-full p-[1.5px] transition-all duration-300 ${
                    isActive
                      ? 'ring-1 ring-white/40'
                      : 'ring-1 ring-white/15 group-hover:ring-white/30'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-o1-well">
                    <img
                      src={story.photoUrl}
                      alt={story.name}
                      className="w-full h-full object-cover object-center transform transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mt-1 w-full text-center px-0.5">
                <span
                  className={`block font-mono text-[9px] font-bold tracking-wider uppercase truncate transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-neutral-400 group-hover:text-white'
                  }`}
                >
                  {story.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProgramReelsScroller;
