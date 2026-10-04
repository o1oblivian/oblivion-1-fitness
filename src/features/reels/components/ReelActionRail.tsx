import React from 'react';
import { Heart, MessageCircle, Bookmark, Share2, Plus, Check } from 'lucide-react';
import { ExploreReelItem, FilmstripClip, ExploreCoach } from '../../../data/reelsExploreCatalog';

interface ReelActionRailProps {
  activeReel: ExploreReelItem;
  activeClip: FilmstripClip | null;
  likedReels: Record<string, boolean>;
  savedReels: Record<string, boolean>;
  addedExercises: Record<string, boolean>;
  onToggleLike: (reelId: string, e?: React.MouseEvent) => void;
  onToggleSave: (reelId: string, e?: React.MouseEvent) => void;
  onShare: (e?: React.MouseEvent) => void;
  onAddExercise: (reel: ExploreReelItem, clip?: FilmstripClip | null) => void;
  onMessageCoach: (coach: ExploreCoach) => void;
}

export const ReelActionRail: React.FC<ReelActionRailProps> = ({
  activeReel,
  activeClip,
  likedReels,
  savedReels,
  addedExercises,
  onToggleLike,
  onToggleSave,
  onShare,
  onAddExercise,
  onMessageCoach,
}) => {
  return (
    <div
      className="absolute right-3.5 bottom-16 sm:bottom-20 z-30 flex flex-col items-center gap-3.5 select-none pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Like Button (Thinner stroke 1.2, translucent white/75) */}
      <button
        type="button"
        onClick={(e) => onToggleLike(activeReel.id, e)}
        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-90 transition-transform"
        aria-label="Like Reel"
      >
        <Heart
          className={`w-5.5 h-5.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all ${
            likedReels[activeReel.id]
              ? 'fill-red-500 text-red-500 scale-105 stroke-[1.2]'
              : 'text-white/75 group-hover:text-white stroke-[1.2] group-hover:scale-105'
          }`}
        />
        <span className="text-[10px] font-sans font-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {likedReels[activeReel.id] ? '713' : '712'}
        </span>
      </button>

      {/* Comment / Message Coach */}
      <button
        type="button"
        onClick={() => onMessageCoach(activeReel.coach)}
        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-90 transition-transform"
        aria-label="Message Coach"
      >
        <MessageCircle className="w-5.5 h-5.5 text-white/75 group-hover:text-white stroke-[1.2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform" />
        <span className="text-[10px] font-sans font-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          173
        </span>
      </button>

      {/* Save Button */}
      <button
        type="button"
        onClick={(e) => onToggleSave(activeReel.id, e)}
        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-90 transition-transform"
        aria-label="Save Reel"
      >
        <Bookmark
          className={`w-5.5 h-5.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] transition-all ${
            savedReels[activeReel.id]
              ? 'fill-amber-400 text-amber-400 scale-105 stroke-[1.2]'
              : 'text-white/75 group-hover:text-white stroke-[1.2] group-hover:scale-105'
          }`}
        />
        <span className="text-[10px] font-sans font-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          Save
        </span>
      </button>

      {/* Share Button (Fully functional with lighter, translucent stroke) */}
      <button
        type="button"
        onClick={onShare}
        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-90 transition-transform"
        aria-label="Share Reel"
      >
        <Share2 className="w-5.5 h-5.5 text-white/75 group-hover:text-white stroke-[1.2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform" />
        <span className="text-[10px] font-sans font-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          Share
        </span>
      </button>

      {/* Add To Workout Log */}
      <button
        type="button"
        onClick={() => onAddExercise(activeReel, activeClip)}
        className="flex flex-col items-center gap-0.5 group cursor-pointer active:scale-90 transition-transform"
        title="Add Exercise to Active Log"
        aria-label="Log Movement"
      >
        <div className="w-5.5 h-5.5 flex items-center justify-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {addedExercises[activeReel.id] ? (
            <Check className="w-5.5 h-5.5 text-emerald-400/90 stroke-[1.6]" />
          ) : (
            <Plus className="w-5.5 h-5.5 text-[#C4121A]/90 stroke-[1.6]" />
          )}
        </div>
        <span className="text-[10px] font-sans font-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {addedExercises[activeReel.id] ? 'Logged' : 'Log'}
        </span>
      </button>
    </div>
  );
};
