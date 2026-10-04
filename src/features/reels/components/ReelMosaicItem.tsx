import React from 'react';
import { Play } from 'lucide-react';
import { ExploreReelItem } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

interface ReelMosaicItemProps {
  reel: ExploreReelItem;
  className?: string;
  onSelectReel: (reel: ExploreReelItem) => void;
}

export const ReelMosaicItem: React.FC<ReelMosaicItemProps> = ({ reel, className = '', onSelectReel }) => {
  return (
    <div
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onSelectReel(reel);
      }}
      className={`group relative rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer active:scale-[0.98] transition-transform border border-white/5 shadow-md ${className}`}
    >
      <img
        src={reel.thumbnail}
        alt=""
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-2xl"
        loading="lazy"
      />
      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
        <Play className="w-2.5 h-2.5 fill-white/90 translate-x-[0.5px]" />
      </div>
    </div>
  );
};
