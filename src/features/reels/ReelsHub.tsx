import React, { useState, useEffect, useRef } from 'react';
import { ReelPlayerView } from './components/ReelPlayerView';
import { ReelExploreGrid } from './components/ReelExploreGrid';
import { CoachBookingDrawer, ProfileTab } from './components/CoachBookingDrawer';
import { CoachDirectMessageModal } from './components/CoachDirectMessageModal';
import { ShareLinkSheet } from './components/ShareLinkSheet';
import { useReelsLogic, CATEGORIES } from './hooks/useReelsLogic';
import { useReelsStore } from '../../stores/useReelsStore';
import { ExploreCoach, ExploreReelItem } from './reelTypes';
import { openCoachConsole } from '../coach/services/coachConsoleBus';
import { isReelVisible, useReelSafetyStore, useVisibleReels } from './services/reelSafety';

export interface ReelsHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'grid' | 'player';
  initialCategory?: (typeof CATEGORIES)[number];
  initialFilter?: string;
  initialReelId?: string;
  initialCoachId?: string;
  initialProfileTab?: ProfileTab;
}

export const ReelsHub: React.FC<ReelsHubProps> = ({
  isOpen,
  onClose,
  initialMode = 'player',
  initialCategory = 'ALL',
  initialFilter = 'ALL',
  initialReelId,
  initialCoachId,
  initialProfileTab,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'player'>(initialMode);
  const [returnCoach, setReturnCoach] = useState<ExploreCoach | null>(null);
  const library = useVisibleReels(useReelsStore((s) => s.reels));
  const hiddenReels = useReelSafetyStore((s) => s.hiddenReels);
  const blockedCoaches = useReelSafetyStore((s) => s.blockedCoaches);
  const feedStatus = useReelsStore((s) => s.status);
  const loadFeed = useReelsStore((s) => s.loadFeed);
  const feedSettled = feedStatus === 'ready' || feedStatus === 'error';

  useEffect(() => {
    if (isOpen) void loadFeed(true);
  }, [isOpen, loadFeed]);

  const {
    setSelectedFilter,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    activeReel,
    setActiveReel,
    activeClip,
    setActiveClip,
    isPlaying,
    setIsPlaying,
    videoRef,
    likedReels,
    likeCounts,
    savedReels,
    addedExercises,
    bookingCoach,
    setBookingCoach,
    messageCoach,
    setMessageCoach,
    setPlaylist,
    handleNextReel,
    handlePrevReel,
    handleToggleLike,
    handleToggleSave,
    handleTogglePlay,
    handleShare,
    handleAddExerciseToWorkout,
    filteredReels,
    categoryCounts,
    coachesList,
    toast,
    flash,
    linkSheet,
    setLinkSheet,
  } = useReelsLogic(initialCategory, initialFilter);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCategory(initialCategory);
    setSelectedFilter(initialFilter);
    setSearchQuery('');
  }, [
    isOpen,
    initialCategory,
    initialFilter,
    setSelectedCategory,
    setSelectedFilter,
    setSearchQuery,
  ]);

  const openerDeps = useRef({
    coachesList,
    flash,
    setBookingCoach,
    setActiveReel,
    setActiveClip,
    setPlaylist,
  });
  useEffect(() => {
    openerDeps.current = {
      coachesList,
      flash,
      setBookingCoach,
      setActiveReel,
      setActiveClip,
      setPlaylist,
    };
  });

  useEffect(() => {
    if (!isOpen || ((initialCoachId || initialReelId) && !feedSettled)) return;
    const opener = openerDeps.current;
    opener.setPlaylist(null);
    setReturnCoach(null);
    if (initialCoachId) {
      const coach =
        library.find((reel) => reel.coach?.id === initialCoachId)?.coach ||
        opener.coachesList.find((c) => c.id === initialCoachId);
      setViewMode('grid');
      if (coach) opener.setBookingCoach(coach);
      else opener.flash('That coach profile is not available');
      return;
    }
    if (initialReelId) {
      const match = library.find((reel) => reel.id === initialReelId);
      if (!match) {
        setViewMode('grid');
        opener.flash('That reel is no longer available');
        return;
      }
      opener.setActiveReel(match);
      opener.setActiveClip(match.filmstripClips?.[0] || null);
      setViewMode('player');
      return;
    }
    setViewMode(initialMode);
    if (initialMode !== 'player' || !library[0]) return;
    opener.setActiveReel(library[0]);
    opener.setActiveClip(library[0].filmstripClips?.[0] || null);
    // Re-running when coachesList refreshes would reset whatever the member is watching.
  }, [isOpen, initialMode, initialReelId, initialCoachId, library, feedSettled]);

  const activeHidden = Boolean(
    activeReel && !isReelVisible(activeReel, hiddenReels, blockedCoaches),
  );
  useEffect(() => {
    if (!activeHidden) return;
    const next = filteredReels[0];
    setActiveReel(next ?? null);
    setActiveClip(next?.filmstripClips?.[0] || null);
    if (!next) setViewMode('grid');
  }, [activeHidden, filteredReels, setActiveReel, setActiveClip]);

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
    <div
      id="elite-reels-hub-modal"
      className="fixed inset-0 z-50 bg-black text-o1-bone flex flex-col font-sans select-none overflow-hidden"
    >
      {viewMode === 'player' && activeReel ? (
        <ReelPlayerView
          activeReel={activeReel}
          activeClip={activeClip}
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
          onTogglePlay={handleTogglePlay}
          onPlayingChange={setIsPlaying}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onShare={handleShare}
          onAddExercise={handleAddExerciseToWorkout}
          onSelectClip={setActiveClip}
          onBookCoach={(coach) =>
            setBookingCoach(coachesList.find((c) => c.id === coach.id) || coach)
          }
          onMessageCoach={setMessageCoach}
          onNotice={flash}
        />
      ) : (
        <ReelExploreGrid
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
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
        initialTab={
          initialCoachId && bookingCoach?.id === initialCoachId ? initialProfileTab : undefined
        }
        onClose={() => {
          setBookingCoach(null);
          if (initialCoachId && bookingCoach?.id === initialCoachId && viewMode === 'grid')
            onClose();
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
        <div role="status" aria-live="polite" className="o1-toast">
          {toast}
        </div>
      )}
    </div>
  );
};
