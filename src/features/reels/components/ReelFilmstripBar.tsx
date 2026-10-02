import React from 'react';
import { Play } from 'lucide-react';
import { ExploreReelItem, FilmstripClip, ExploreCoach } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

interface ReelFilmstripBarProps {
  activeReel: ExploreReelItem;
  activeClip: FilmstripClip | null;
  onSelectClip?: (clip: FilmstripClip) => void;
  onBookCoach: (coach: ExploreCoach) => void;
  onOpenAssetGallery: () => void;
  assetCount: number;
}

export const ReelFilmstripBar: React.FC<ReelFilmstripBarProps> = ({
  activeReel,
  activeClip,
  onBookCoach,
  onOpenAssetGallery,
  assetCount,
}) => {
  const currentTitle = activeClip?.title || activeReel?.title || 'Movement Protocol';

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 pb-4 pt-2 px-4 flex flex-col gap-0.5 max-w-xl pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Row 1: Coach Name & Translucent Play Button + Number in Same Row */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            if (activeReel?.coach) onBookCoach(activeReel.coach);
          }}
          className="text-left group cursor-pointer active:scale-98 transition-all"
          title="Open Coach Verified Dossier"
        >
          <span className="text-sm font-semibold text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] tracking-tight group-hover:text-red-400 transition-colors">
            {activeReel?.coach?.name || 'Club Coach'}
          </span>
        </button>

        {/* Thinner, translucent play button and asset number */}
        {assetCount > 0 && (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenAssetGallery();
            }}
            className="flex items-center gap-1 text-white/70 hover:text-white cursor-pointer active:scale-95 transition-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] group"
            title="View extra reels and biomechanics photos"
          >
            <Play className="w-3 h-3 fill-white/70 text-white/70 translate-x-0.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-normal text-white/70 tracking-wide">
              {assetCount}
            </span>
          </button>
        )}
      </div>

      {/* Row 2: Pose / Movement Protocol Line (Updates with active clip or reel) */}
      <p className="text-xs font-normal text-white/75 line-clamp-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] pr-14">
        {currentTitle}
      </p>
    </div>
  );
};
