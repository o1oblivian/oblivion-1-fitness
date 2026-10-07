import React, { useState, useEffect } from 'react';
import { ReelPlayerView } from './components/ReelPlayerView';
import { ReelExploreGrid } from './components/ReelExploreGrid';
import { CoachBookingDrawer } from './components/CoachBookingDrawer';
import { CoachDirectMessageModal } from './components/CoachDirectMessageModal';
import { useEliteReelsLogic, FILTER_TAGS, CATEGORIES } from './hooks/useEliteReelsLogic';
import { EXPLORE_REELS_CATALOG } from '../../data/reelsExploreCatalog';

export interface EliteReelsHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'grid' | 'player';
  initialCategory?: (typeof CATEGORIES)[number];
  initialFilter?: string;
  initialReelId?: string;
}

export const EliteReelsHub: React.FC<EliteReelsHubProps> = ({
  isOpen,
  onClose,
  initialMode = 'player',
  initialCategory = 'ALL',
  initialFilter = 'ALL',
  initialReelId,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'player'>(initialMode);

  const {
    tabMode, setTabMode, selectedFilter, setSelectedFilter, selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery, activeReel, setActiveReel, activeClip, setActiveClip,
    isPlaying, isMuted, videoRef, likedReels, savedReels, followedCoaches, addedExercises,
    bookingCoach, setBookingCoach, messageCoach, setMessageCoach, handleNextReel, handlePrevReel,
    handleToggleLike, handleToggleSave, handleToggleFollow, handleToggleMute, handleTogglePlay,
    handleShare, handleAddExerciseToWorkout, filteredReels, coachesList, shareToast,
  } = useEliteReelsLogic(initialCategory, initialFilter);

  useEffect(() => {
    if (isOpen) {
      setViewMode(initialMode);
      if (initialMode === 'player') {
        const match = (initialReelId ? EXPLORE_REELS_CATALOG.find((r) => r.id === initialReelId) : null) ||
          EXPLORE_REELS_CATALOG.find((r) => {
            if (initialCategory && initialCategory !== 'ALL' && r.category === initialCategory) return true;
            if (initialFilter && initialFilter !== 'ALL' && (r.filterTag === initialFilter || r.category === initialFilter)) return true;
            return false;
          }) || EXPLORE_REELS_CATALOG[0];

        setActiveReel(match);
        setActiveClip(match.filmstripClips?.[0] || null);
      }
    }
  }, [isOpen, initialMode, initialCategory, initialFilter, initialReelId, setActiveReel, setActiveClip]);

  if (!isOpen) return null;

  return (
    <div id="elite-reels-hub-modal" className="fixed inset-0 z-50 bg-black text-neutral-100 flex flex-col font-sans select-none overflow-hidden">
      {viewMode === 'player' && activeReel ? (
        <ReelPlayerView
          activeReel={activeReel}
          activeClip={activeClip}
          isMuted={isMuted}
          isPlaying={isPlaying}
          videoRef={videoRef}
          likedReels={likedReels}
          savedReels={savedReels}
          addedExercises={addedExercises}
          onClose={() => {
            if (initialMode === 'grid') setViewMode('grid');
            else onClose();
          }}
          onNextReel={handleNextReel}
          onPrevReel={handlePrevReel}
          onToggleMute={handleToggleMute}
          onTogglePlay={handleTogglePlay}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onShare={handleShare}
          onAddExercise={handleAddExerciseToWorkout}
          onSelectClip={setActiveClip}
          onBookCoach={(coach) => {
            const live = coachesList.find((c) => c.id === coach.id || c.name === coach.name) || coach;
            setBookingCoach(live);
          }}
          onMessageCoach={(coach) => setMessageCoach(coach)}
        />
      ) : (
        <ReelExploreGrid
          tabMode={tabMode}
          setTabMode={setTabMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          filterTags={FILTER_TAGS}
          filteredReels={filteredReels}
          coachesList={coachesList}
          followedCoaches={followedCoaches}
          onClose={onClose}
          onSelectReel={(reel, clip) => {
            setActiveReel(reel);
            setActiveClip(clip || reel.filmstripClips?.[0] || null);
            setViewMode('player');
          }}
          onToggleFollow={handleToggleFollow}
          onBookCoach={(coach) => {
            const live = coachesList.find((c) => c.id === coach.id || c.name === coach.name) || coach;
            setBookingCoach(live);
          }}
          onMessageCoach={(coach) => setMessageCoach(coach)}
        />
      )}

      <CoachBookingDrawer
        coach={bookingCoach}
        onClose={() => setBookingCoach(null)}
        isFollowing={Boolean(bookingCoach && followedCoaches[bookingCoach.id])}
        onToggleFollow={handleToggleFollow}
        onSelectReel={(reel) => {
          setActiveReel(reel);
          setActiveClip(reel.filmstripClips?.[0] || null);
          setViewMode('player');
          setBookingCoach(null);
        }}
        onMessageCoach={(coach) => setMessageCoach(coach)}
      />
      <CoachDirectMessageModal coach={messageCoach} onClose={() => setMessageCoach(null)} />

      {shareToast && (
        <div className="absolute top-14 inset-x-0 mx-auto w-fit z-50 px-4 py-2 rounded-full bg-o1-well border border-white/[0.07] backdrop-blur-md text-xs font-mono text-white shadow-xl animate-in fade-in duration-200">
          {shareToast}
        </div>
      )}
    </div>
  );
};

export default EliteReelsHub;
