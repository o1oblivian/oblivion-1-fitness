import React, { useState, useEffect } from 'react';
import { ReelPlayerView } from './components/ReelPlayerView';
import { ReelExploreGrid } from './components/ReelExploreGrid';
import { CoachBookingDrawer, ProfileTab } from './components/CoachBookingDrawer';
import { CoachDirectMessageModal } from './components/CoachDirectMessageModal';
import { ShareLinkSheet } from './components/ShareLinkSheet';
import { useEliteReelsLogic, CATEGORIES } from './hooks/useEliteReelsLogic';
import { optionsIn, useClubTaxonomy } from '../induction/useClubTaxonomyStore';
import { useReelsStore } from '../../stores/useReelsStore';
import { ExploreCoach, ExploreReelItem } from './reelTypes';
import { openCoachConsole } from '../coach/services/coachConsoleBus';

export interface EliteReelsHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'grid' | 'player';
  initialCategory?: (typeof CATEGORIES)[number];
  initialFilter?: string;
  initialReelId?: string;
  initialCoachId?: string;
  initialProfileTab?: ProfileTab;
}

export const EliteReelsHub: React.FC<EliteReelsHubProps> = ({
  isOpen,
  onClose,
  initialMode = 'player',
  initialCategory = 'ALL',
  initialFilter = 'ALL',
  initialReelId,
  initialCoachId,
  initialProfileTab,
}) => {
  const taxonomy = useClubTaxonomy();
  const discoveryChips = optionsIn(taxonomy, 'discovery').map((option) => option.label);
  const [viewMode, setViewMode] = useState<'grid' | 'player'>(initialMode);
  const [returnCoach, setReturnCoach] = useState<ExploreCoach | null>(null);
  const library = useReelsStore((s) => s.reels);

  const {
    selectedFilter, setSelectedFilter, searchQuery, setSearchQuery, activeReel, setActiveReel, activeClip, setActiveClip,
    isPlaying, setIsPlaying, isMuted, videoRef, likedReels, likeCounts, savedReels, addedExercises,
    bookingCoach, setBookingCoach, messageCoach, setMessageCoach, setPlaylist, handleNextReel, handlePrevReel,
    handleToggleLike, handleToggleSave, handleToggleMute, handleTogglePlay,
    handleShare, handleAddExerciseToWorkout, filteredReels, coachesList, toast, flash, linkSheet, setLinkSheet,
  } = useEliteReelsLogic(initialCategory, initialFilter);

  useEffect(() => {
    if (!isOpen) return;
    setPlaylist(null);
    setReturnCoach(null);
    if (initialCoachId) {
      const coach = library.find((reel) => reel.coach?.id === initialCoachId)?.coach
        || coachesList.find((c) => c.id === initialCoachId);
      setViewMode('grid');
      if (coach) setBookingCoach(coach);
      else flash('That coach profile is not available');
      return;
    }
    if (initialReelId) {
      const match = library.find((reel) => reel.id === initialReelId);
      if (!match) {
        setViewMode('grid');
        flash('That reel is no longer available');
        return;
      }
      setActiveReel(match);
      setActiveClip(match.filmstripClips?.[0] || null);
      setViewMode('player');
      return;
    }
    setViewMode(initialMode);
    if (initialMode !== 'player' || !library[0]) return;
    setActiveReel(library[0]);
    setActiveClip(library[0].filmstripClips?.[0] || null);
    // Re-running when coachesList refreshes would reset whatever the member is watching.
  }, [isOpen, initialMode, initialReelId, initialCoachId, library]);

  const covered = Boolean(bookingCoach || messageCoach || linkSheet);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || viewMode !== 'player') return;
    if (covered) video.pause();
    else void video.play().catch(() => setIsPlaying(false));
  }, [covered, viewMode, videoRef, setIsPlaying]);

  if (!isOpen) return null;

  const playFrom = (reel: ExploreReelItem, queue: ExploreReelItem[] | null) => {
    setPlaylist(queue);
    setActiveReel(reel);
    setActiveClip(reel.filmstripClips?.[0] || null);
    setViewMode('player');
  };

  const closePlayer = () => {
    if (returnCoach) {
      setBookingCoach(returnCoach);
      setReturnCoach(null);
      setPlaylist(null);
      setViewMode('grid');
      return;
    }
    setPlaylist(null);
    if (initialMode === 'grid' || initialCoachId) setViewMode('grid');
    else onClose();
  };

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
          likeCount={likeCounts[activeReel.id] ?? null}
          savedReels={savedReels}
          addedExercises={addedExercises}
          covered={covered}
          onClose={closePlayer}
          onNextReel={handleNextReel}
          onPrevReel={handlePrevReel}
          onToggleMute={handleToggleMute}
          onTogglePlay={handleTogglePlay}
          onPlayingChange={setIsPlaying}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onShare={handleShare}
          onAddExercise={handleAddExerciseToWorkout}
          onSelectClip={setActiveClip}
          onBookCoach={(coach) => setBookingCoach(coachesList.find((c) => c.id === coach.id) || coach)}
          onMessageCoach={setMessageCoach}
          onNotice={flash}
        />
      ) : (
        <ReelExploreGrid
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          filterTags={discoveryChips}
          filteredReels={filteredReels}
          onClose={onClose}
          onSelectReel={(reel, clip) => {
            setReturnCoach(null);
            playFrom(reel, null);
            if (clip) setActiveClip(clip);
          }}
        />
      )}

      <CoachBookingDrawer
        coach={bookingCoach}
        initialTab={initialCoachId && bookingCoach?.id === initialCoachId ? initialProfileTab : undefined}
        onClose={() => {
          setBookingCoach(null);
          if (initialCoachId && bookingCoach?.id === initialCoachId && viewMode === 'grid') onClose();
        }}
        onSelectReel={(reel, coachReels) => {
          setReturnCoach(bookingCoach);
          setBookingCoach(null);
          playFrom(reel, coachReels);
        }}
        onMessageCoach={(coach) => setMessageCoach(coach)}
        onOpenConsole={(action) => {
          setBookingCoach(null);
          onClose();
          openCoachConsole(action);
        }}
      />
      <CoachDirectMessageModal coach={messageCoach} onClose={() => setMessageCoach(null)} />
      <ShareLinkSheet link={linkSheet} onClose={() => setLinkSheet(null)} />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+4rem)] inset-x-0 mx-auto w-fit z-[70] px-4 py-2 rounded-full bg-white text-[12px] font-semibold text-neutral-950 shadow-xl animate-in fade-in duration-200"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default EliteReelsHub;
