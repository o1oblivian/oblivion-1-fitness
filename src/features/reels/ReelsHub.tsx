import React, { useState, useEffect, useRef } from 'react';
import { ReelPlayerView } from './components/ReelPlayerView';
import { ReelExploreGrid } from './components/ReelExploreGrid';
import { ReelUploadModal } from './components/ReelUploadModal';
import { CoachProfileDrawer } from '../coach/components/profile/CoachProfileDrawer';
import { CoachDirectMessageModal } from '../coach/components/CoachDirectMessageModal';
import { ShareLinkSheet } from '../coach/components/ShareLinkSheet';
import { useReelsLogic } from './hooks/useReelsLogic';
import { useReelsStore } from '../../stores/useReelsStore';
import type { ExploreReelItem } from './reelTypes';
import { openCoachConsole } from '../coach/services/coachConsoleBus';
import { isReelVisible, useReelSafetyStore, useVisibleReels } from './services/reelSafety';

export interface ReelsHubProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'grid' | 'player';
  initialReelId?: string;
  initialCategory?: ExploreReelItem['category'];
  /** Opens the upload sheet over the feed. */
  openUpload?: boolean;
}

export const ReelsHub: React.FC<ReelsHubProps> = ({
  isOpen,
  onClose,
  initialMode = 'grid',
  initialReelId,
  initialCategory = 'ALL',
  openUpload = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'player'>(initialMode);
  const [uploadOpen, setUploadOpen] = useState(openUpload);
  const library = useVisibleReels(useReelsStore((s) => s.reels));
  const hiddenReels = useReelSafetyStore((s) => s.hiddenReels);
  const blockedAuthors = useReelSafetyStore((s) => s.blockedAuthors);
  const feedStatus = useReelsStore((s) => s.status);
  const feedError = useReelsStore((s) => s.error);
  const loadFeed = useReelsStore((s) => s.loadFeed);
  const feedSettled = feedStatus === 'ready' || feedStatus === 'error';

  useEffect(() => {
    if (isOpen) void loadFeed(true);
  }, [isOpen, loadFeed]);

  const {
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
    toast,
    flash,
    linkSheet,
    setLinkSheet,
  } = useReelsLogic(initialCategory);

  const opener = useRef({ flash, setActiveReel, setActiveClip, setPlaylist });
  useEffect(() => {
    opener.current = { flash, setActiveReel, setActiveClip, setPlaylist };
  });

  useEffect(() => {
    if (!isOpen || (initialReelId && !feedSettled)) return;
    const open = opener.current;
    open.setPlaylist(null);
    if (initialReelId) {
      const match = library.find((reel) => reel.id === initialReelId);
      if (!match) {
        setViewMode('grid');
        open.flash('That reel is no longer available');
        return;
      }
      open.setActiveReel(match);
      open.setActiveClip(match.filmstripClips?.[0] || null);
      setViewMode('player');
      return;
    }
    setViewMode(initialMode);
    if (initialMode !== 'player' || !library[0]) return;
    open.setActiveReel(library[0]);
    open.setActiveClip(library[0].filmstripClips?.[0] || null);
  }, [isOpen, initialMode, initialReelId, library, feedSettled]);

  const activeHidden = Boolean(
    activeReel && !isReelVisible(activeReel, hiddenReels, blockedAuthors),
  );
  useEffect(() => {
    if (!activeHidden) return;
    const next = filteredReels[0];
    setActiveReel(next ?? null);
    setActiveClip(next?.filmstripClips?.[0] || null);
    if (!next) setViewMode('grid');
  }, [activeHidden, filteredReels, setActiveReel, setActiveClip]);

  const covered = Boolean(bookingCoach || messageCoach || linkSheet || uploadOpen);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || viewMode !== 'player') return;
    if (covered) video.pause();
    else
      void video.play().catch((err: unknown) => {
        console.warn('[ReelsHub] Autoplay was blocked', err);
        setIsPlaying(false);
      });
  }, [covered, viewMode, videoRef, setIsPlaying]);

  if (!isOpen) return null;

  const playFrom = (reel: ExploreReelItem) => {
    setPlaylist(null);
    setActiveReel(reel);
    setActiveClip(reel.filmstripClips?.[0] || null);
    setViewMode('player');
  };

  const closePlayer = () => {
    setPlaylist(null);
    if (initialMode === 'grid' || initialReelId) setViewMode('grid');
    else onClose();
  };

  return (
    <div
      id="reels-hub-modal"
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
          onOpenCoach={setBookingCoach}
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
          feedLoading={feedStatus === 'idle' || feedStatus === 'loading'}
          feedError={feedError}
          onRetryFeed={() => void loadFeed(true)}
          onClose={onClose}
          onUpload={() => setUploadOpen(true)}
          onSelectReel={(reel, clip) => {
            playFrom(reel);
            if (clip) setActiveClip(clip);
          }}
        />
      )}

      <CoachProfileDrawer
        coach={bookingCoach}
        onClose={() => setBookingCoach(null)}
        onMessageCoach={(coach) => setMessageCoach(coach)}
        onOpenConsole={(action) => {
          setBookingCoach(null);
          onClose();
          openCoachConsole(action);
        }}
      />
      <CoachDirectMessageModal coach={messageCoach} onClose={() => setMessageCoach(null)} />
      <ShareLinkSheet link={linkSheet} onClose={() => setLinkSheet(null)} />
      <ReelUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onReelPublished={(title) => flash(`"${title}" is live`)}
      />

      {toast && (
        <div role="status" aria-live="polite" className="o1-toast">
          {toast}
        </div>
      )}
    </div>
  );
};
