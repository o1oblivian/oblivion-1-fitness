import React from 'react';
import { Heart, MessageCircle, Bookmark, Share2, Plus, Check } from 'lucide-react';
import { ExploreReelItem, FilmstripClip, ExploreCoach } from '../reelTypes';

interface ReelActionRailProps {
  activeReel: ExploreReelItem;
  activeClip: FilmstripClip | null;
  likedReels: Record<string, boolean>;
  likeCount: number | null;
  savedReels: Record<string, boolean>;
  addedExercises: Record<string, boolean>;
  onToggleLike: (reelId: string, e?: React.MouseEvent) => void;
  onToggleSave: (reelId: string, e?: React.MouseEvent) => void;
  onShare: (e?: React.MouseEvent) => void;
  onAddExercise: (reel: ExploreReelItem, clip?: FilmstripClip | null) => void;
  onMessageCoach: (coach: ExploreCoach) => void;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

const BUTTON = 'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 group cursor-pointer active:scale-90 transition-transform';
const ICON = 'w-6 h-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all stroke-[1.4]';
const IDLE = 'text-white/85 group-hover:text-white group-hover:scale-105';
const LABEL = 'text-[10px] font-sans font-medium text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]';

export const ReelActionRail: React.FC<ReelActionRailProps> = ({
  activeReel,
  activeClip,
  likedReels,
  likeCount,
  savedReels,
  addedExercises,
  onToggleLike,
  onToggleSave,
  onShare,
  onAddExercise,
  onMessageCoach,
}) => {
  const liked = Boolean(likedReels[activeReel.id]);
  const saved = Boolean(savedReels[activeReel.id]);
  const logged = Boolean(addedExercises[activeReel.id]);

  return (
    <div
      className="absolute right-2 bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-30 flex flex-col items-center gap-1.5 select-none pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => onToggleLike(activeReel.id, e)}
        className={BUTTON}
        aria-label={liked ? 'Unlike reel' : 'Like reel'}
        aria-pressed={liked}
      >
        <Heart className={`${ICON} ${liked ? 'fill-[#C4121A] text-[#C4121A] scale-105' : IDLE}`} />
        <span className={LABEL}>{likeCount != null ? compact(likeCount) : 'Like'}</span>
      </button>

      {activeReel.coach ? (
        <button
          type="button"
          onClick={() => onMessageCoach(activeReel.coach)}
          className={BUTTON}
          aria-label={`Message ${activeReel.coach.name}`}
        >
          <MessageCircle className={`${ICON} ${IDLE}`} />
          <span className={LABEL}>Message</span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={(e) => onToggleSave(activeReel.id, e)}
        className={BUTTON}
        aria-label={saved ? 'Remove from vault' : 'Save to vault'}
        aria-pressed={saved}
      >
        <Bookmark className={`${ICON} ${saved ? 'fill-[#f59e0b] text-[#f59e0b] scale-105' : IDLE}`} />
        <span className={LABEL}>{saved ? 'Saved' : 'Save'}</span>
      </button>

      <button type="button" onClick={onShare} className={BUTTON} aria-label="Share reel">
        <Share2 className={`${ICON} ${IDLE}`} />
        <span className={LABEL}>Share</span>
      </button>

      <button
        type="button"
        onClick={() => onAddExercise(activeReel, activeClip)}
        className={BUTTON}
        title={logged ? 'Already in today\u2019s log' : 'Add this movement to today\u2019s log'}
        aria-label={logged ? 'Movement logged' : 'Log movement'}
        aria-pressed={logged}
      >
        {logged ? (
          <Check className={`${ICON} text-[#10b981]`} />
        ) : (
          <Plus className={`${ICON} text-white/85 group-hover:text-white`} />
        )}
        <span className={LABEL}>{logged ? 'Logged' : 'Log'}</span>
      </button>
    </div>
  );
};
