import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { ExploreReelItem, FilmstripClip, ExploreCoach } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';
import { ReelFilmstripBar } from './ReelFilmstripBar';
import { ReelActionRail } from './ReelActionRail';
import { ReelPlayerTopBar } from './ReelPlayerTopBar';
import { ReelAssetGalleryDrawer } from './ReelAssetGalleryDrawer';

interface ReelPlayerViewProps {
  activeReel: ExploreReelItem;
  activeClip: FilmstripClip | null;
  isMuted: boolean;
  isPlaying: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  likedReels: Record<string, boolean>;
  savedReels: Record<string, boolean>;
  addedExercises: Record<string, boolean>;
  onClose: () => void;
  onNextReel?: () => void;
  onPrevReel?: () => void;
  onToggleMute: (e: React.MouseEvent) => void;
  onTogglePlay: () => void;
  onToggleLike: (reelId: string, e?: React.MouseEvent) => void;
  onToggleSave: (reelId: string, e?: React.MouseEvent) => void;
  onShare: (e?: React.MouseEvent) => void;
  onAddExercise: (reel: ExploreReelItem, clip?: FilmstripClip | null) => void;
  onSelectClip: (clip: FilmstripClip) => void;
  onBookCoach: (coach: ExploreCoach) => void;
  onMessageCoach: (coach: ExploreCoach) => void;
}

export const ReelPlayerView: React.FC<ReelPlayerViewProps> = ({
  activeReel, activeClip, isMuted, isPlaying, videoRef, likedReels, savedReels,
  addedExercises, onClose, onNextReel, onPrevReel, onToggleMute, onTogglePlay,
  onToggleLike, onToggleSave, onShare, onAddExercise, onSelectClip, onBookCoach, onMessageCoach,
}) => {
  const touchStartY = useRef<number | null>(null);
  const [isAssetGalleryOpen, setIsAssetGalleryOpen] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartY.current = null;
    if (deltaY < -40 && onNextReel) {
      tactileEngine.triggerSelectionBuzz();
      onNextReel();
    } else if (deltaY > 40 && onPrevReel) {
      tactileEngine.triggerSelectionBuzz();
      onPrevReel();
    }
  };

  const cleanClips = (activeReel?.filmstripClips ?? []).filter((clip) => {
    return clip.duration !== 'Consult' && !clip.badge?.includes('Consult') && !clip.badge?.includes('PROGRAMS');
  });
  const photos = activeReel?.coach?.physiquePhotos || [];
  const assetCount = cleanClips.length + photos.length;

  return (
    <div
      className="relative flex-1 w-full h-full flex flex-col bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ReelPlayerTopBar isMuted={isMuted} onClose={onClose} onToggleMute={onToggleMute} />

      <div className="relative flex-1 w-full h-full flex items-center justify-center cursor-pointer overflow-hidden bg-neutral-950" onClick={onTogglePlay}>
        <video
          ref={videoRef}
          src={activeClip ? activeClip.videoUrl : activeReel.videoUrl}
          poster={activeClip ? activeClip.thumbnail : activeReel.thumbnail}
          className="w-full h-full object-cover sm:object-contain"
          playsInline
          loop
          autoPlay
          muted={isMuted}
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none transition-opacity">
            <div className="w-14 h-14 rounded-full bg-black/70 flex items-center justify-center text-white drop-shadow-2xl">
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            </div>
          </div>
        )}

        <ReelActionRail
          activeReel={activeReel}
          activeClip={activeClip}
          likedReels={likedReels}
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
          onSelectClip={onSelectClip}
          onBookCoach={onBookCoach}
          onOpenAssetGallery={() => setIsAssetGalleryOpen(true)}
          assetCount={assetCount}
        />

        <ReelAssetGalleryDrawer
          isOpen={isAssetGalleryOpen}
          onClose={() => setIsAssetGalleryOpen(false)}
          clips={cleanClips}
          photos={photos}
          activeClip={activeClip}
          onSelectClip={onSelectClip}
        />
      </div>
    </div>
  );
};
