import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { ExploreReelItem, FilmstripClip, ExploreCoach } from '../reelTypes';
import { tactileEngine } from '../../../services/tactileEngine';
import { ReelFilmstripBar } from './ReelFilmstripBar';
import { ReelActionRail } from './ReelActionRail';
import { ReelPlayerTopBar } from './ReelPlayerTopBar';
import { ReelAssetGalleryDrawer } from './ReelAssetGalleryDrawer';
import { isPlayableClip } from '../reelClips';
import { ReelSafetyMenu } from './ReelSafetyMenu';
import { HEALTH_CATEGORIES, NOT_MEDICAL_ADVICE } from '../reelCategories';

interface ReelPlayerViewProps {
  activeReel: ExploreReelItem;
  activeClip: FilmstripClip | null;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  likedReels: Record<string, boolean>;
  likeCount: number | null;
  savedReels: Record<string, boolean>;
  addedExercises: Record<string, boolean>;
  /** Pauses keyboard and wheel navigation while a profile or message sheet covers the player. */
  covered?: boolean;
  onClose: () => void;
  onNextReel?: () => void;
  onPrevReel?: () => void;
  onTogglePlay: () => void;
  onPlayingChange: (playing: boolean) => void;
  onToggleLike: (reelId: string, e?: React.MouseEvent) => void;
  onToggleSave: (reelId: string, e?: React.MouseEvent) => void;
  onShare: (e?: React.MouseEvent) => void;
  onAddExercise: (reel: ExploreReelItem, clip?: FilmstripClip | null) => void;
  onSelectClip: (clip: FilmstripClip) => void;
  onBookCoach: (coach: ExploreCoach) => void;
  onMessageCoach: (coach: ExploreCoach) => void;
  onNotice: (message: string) => void;
}

const SWIPE_PX = 40;
const WHEEL_COOLDOWN_MS = 650;

export const ReelPlayerView: React.FC<ReelPlayerViewProps> = ({
  activeReel,
  activeClip,
  isPlaying,
  videoRef,
  likedReels,
  likeCount,
  savedReels,
  addedExercises,
  covered = false,
  onClose,
  onNextReel,
  onPrevReel,
  onTogglePlay,
  onPlayingChange,
  onToggleLike,
  onToggleSave,
  onShare,
  onAddExercise,
  onSelectClip,
  onBookCoach,
  onMessageCoach,
  onNotice,
}) => {
  const touchStartY = useRef<number | null>(null);
  const lastWheel = useRef(0);
  const [isAssetGalleryOpen, setIsAssetGalleryOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const paused = covered || isAssetGalleryOpen || optionsOpen;

  const src = activeClip ? activeClip.videoUrl : activeReel.videoUrl;
  const poster = activeClip ? activeClip.thumbnail : activeReel.thumbnail;

  useEffect(() => {
    setFailed(false);
    setIsAssetGalleryOpen(false);
  }, [src]);

  const latest = useRef({ onNextReel, onPrevReel, onTogglePlay, onClose });
  latest.current = { onNextReel, onPrevReel, onTogglePlay, onClose };

  useEffect(() => {
    if (paused) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      )
        return;
      const actions = latest.current;
      if (event.key === 'ArrowDown' || event.key === 'j') actions.onNextReel?.();
      else if (event.key === 'ArrowUp' || event.key === 'k') actions.onPrevReel?.();
      else if (event.key === ' ') actions.onTogglePlay();
      else if (event.key === 'Escape') actions.onClose();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused]);

  const handleWheel = (e: React.WheelEvent) => {
    if (paused || Math.abs(e.deltaY) < 30) return;
    const now = Date.now();
    if (now - lastWheel.current < WHEEL_COOLDOWN_MS) return;
    lastWheel.current = now;
    if (e.deltaY > 0) onNextReel?.();
    else onPrevReel?.();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || paused) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY < -SWIPE_PX && onNextReel) {
      tactileEngine.triggerSelectionBuzz();
      onNextReel();
    } else if (deltaY > SWIPE_PX && onPrevReel) {
      tactileEngine.triggerSelectionBuzz();
      onPrevReel();
    }
  };

  const cleanClips = (activeReel?.filmstripClips ?? []).filter(isPlayableClip);

  return (
    <div
      className="relative flex-1 w-full h-full flex flex-col bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <ReelPlayerTopBar onClose={onClose} onOpenOptions={() => setOptionsOpen(true)} />
      {HEALTH_CATEGORIES.has(activeReel.category) ? (
        <p className="absolute z-30 left-3 right-28 top-[calc(env(safe-area-inset-top)+0.9rem)] text-o1-label leading-snug text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none">
          {NOT_MEDICAL_ADVICE}
        </p>
      ) : null}

      <div
        className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer overflow-hidden bg-black"
        onClick={onTogglePlay}
        role="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <video
          key={src}
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-cover sm:object-contain"
          playsInline
          loop
          autoPlay
          muted
          onPlaying={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onEmptied={() => onPlayingChange(false)}
          onError={() => {
            setFailed(true);
            onPlayingChange(false);
          }}
        />

        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <p className="rounded-full bg-o1-card px-4 py-2 text-o1-body text-o1-text">
              This video could not load
            </p>
          </div>
        ) : !isPlaying ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none transition-opacity">
            <div className="w-14 h-14 rounded-full bg-black/70 flex items-center justify-center text-white drop-shadow-2xl">
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            </div>
          </div>
        ) : null}

        <ReelActionRail
          activeReel={activeReel}
          activeClip={activeClip}
          likedReels={likedReels}
          likeCount={likeCount}
          savedReels={savedReels}
          addedExercises={addedExercises}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          onShare={onShare}
          onAddExercise={onAddExercise}
          onMessageCoach={onMessageCoach}
        />

        <ReelFilmstripBar
          activeReel={activeReel}
          activeClip={activeClip}
          onBookCoach={onBookCoach}
          onOpenAssetGallery={() => setIsAssetGalleryOpen(true)}
          assetCount={cleanClips.length}
          onNotice={onNotice}
        />

        <ReelAssetGalleryDrawer
          isOpen={isAssetGalleryOpen}
          onClose={() => setIsAssetGalleryOpen(false)}
          clips={cleanClips}
          activeClip={activeClip}
          onSelectClip={onSelectClip}
        />
      </div>
      <ReelSafetyMenu reel={activeReel} open={optionsOpen} onClose={() => setOptionsOpen(false)} />
    </div>
  );
};
