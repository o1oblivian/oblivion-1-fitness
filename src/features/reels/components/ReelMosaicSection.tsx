import React from 'react';
import { Play } from 'lucide-react';
import { ExploreReelItem, FilmstripClip } from '../../../data/reelsExploreCatalog';
import { tactileEngine } from '../../../services/tactileEngine';

export interface ReelPostItem {
  id: string;
  reel: ExploreReelItem;
  clip?: FilmstripClip;
  thumbnail: string;
  videoUrl: string;
}

interface ReelMosaicSectionProps {
  reels: ExploreReelItem[];
  onSelectReel: (reel: ExploreReelItem, clip?: FilmstripClip) => void;
}

export const ReelMosaicSection: React.FC<ReelMosaicSectionProps> = ({ reels, onSelectReel }) => {
  // Flatten reels and their filmstrip clips into rich individual post items
  const postItems = React.useMemo(() => {
    const items: ReelPostItem[] = [];

    reels.forEach((reel) => {
      // Primary reel post
      items.push({
        id: `${reel.id}-main`,
        reel,
        thumbnail: reel.thumbnail,
        videoUrl: reel.videoUrl,
      });

      // Individual filmstrip clips
      if (reel.filmstripClips && reel.filmstripClips.length > 0) {
        reel.filmstripClips.forEach((clip, idx) => {
          if (clip.thumbnail !== reel.thumbnail || idx > 0) {
            items.push({
              id: `${reel.id}-clip-${clip.id}`,
              reel,
              clip,
              thumbnail: clip.thumbnail,
              videoUrl: clip.videoUrl,
            });
          }
        });
      }
    });

    return items;
  }, [reels]);

  const handleItemClick = (item: ReelPostItem) => {
    tactileEngine.triggerSelectionBuzz();
    onSelectReel(item.reel, item.clip);
  };

  // Group into chunks of 5 for dynamic asymmetrical layout with varied shapes
  const chunks: ReelPostItem[][] = [];
  for (let i = 0; i < postItems.length; i += 5) {
    chunks.push(postItems.slice(i, i + 5));
  }

  if (postItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#121214] border border-neutral-800 flex items-center justify-center text-neutral-500 mb-3 shadow-sm">
          <Play className="w-5 h-5 opacity-40" />
        </div>
        <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
          NO POSTS FOUND IN THIS CATEGORY
        </h4>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 pb-6 select-none">
      {chunks.map((chunk, chunkIdx) => {
        const isAlternate = chunkIdx % 2 === 1;
        const trio = chunk.slice(0, 3);
        const duoOrSingle = chunk.slice(3, 5);

        return (
          <div key={`mosaic-chunk-${chunkIdx}`} className="space-y-2">
            {/* Pattern 1: Asymmetrical Pillar & Stack Duo (Varied Shapes) */}
            {trio.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {!isAlternate ? (
                  // Left tall 4:5 vertical | Right 2 stacked cards
                  <>
                    {trio[0] && (
                      <div
                        onClick={() => handleItemClick(trio[0])}
                        className="group relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                      >
                        <img
                          src={trio[0].thumbnail}
                          alt=""
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                          <Play className="w-2.5 h-2.5 fill-white/90 translate-x-[0.5px]" />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 justify-between">
                      {trio[1] && (
                        <div
                          onClick={() => handleItemClick(trio[1])}
                          className="group relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                        >
                          <img
                            src={trio[1].thumbnail}
                            alt=""
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                            <Play className="w-2 h-2 fill-white/90 translate-x-[0.5px]" />
                          </div>
                        </div>
                      )}

                      {trio[2] && (
                        <div
                          onClick={() => handleItemClick(trio[2])}
                          className="group relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                        >
                          <img
                            src={trio[2].thumbnail}
                            alt=""
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                            <Play className="w-2 h-2 fill-white/90 translate-x-[0.5px]" />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Left 2 stacked cards | Right tall 4:5 vertical
                  <>
                    <div className="flex flex-col gap-2 justify-between">
                      {trio[0] && (
                        <div
                          onClick={() => handleItemClick(trio[0])}
                          className="group relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                        >
                          <img
                            src={trio[0].thumbnail}
                            alt=""
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                            <Play className="w-2 h-2 fill-white/90 translate-x-[0.5px]" />
                          </div>
                        </div>
                      )}

                      {trio[1] && (
                        <div
                          onClick={() => handleItemClick(trio[1])}
                          className="group relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                        >
                          <img
                            src={trio[1].thumbnail}
                            alt=""
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                            <Play className="w-2 h-2 fill-white/90 translate-x-[0.5px]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {trio[2] && (
                      <div
                        onClick={() => handleItemClick(trio[2])}
                        className="group relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                      >
                        <img
                          src={trio[2].thumbnail}
                          alt=""
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                          <Play className="w-2.5 h-2.5 fill-white/90 translate-x-[0.5px]" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Pattern 2: Cinematic Horizon or Asymmetric Duo */}
            {duoOrSingle.length === 1 && (
              <div
                onClick={() => handleItemClick(duoOrSingle[0])}
                className="group relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.99] transition-transform duration-200 shadow-md"
              >
                <img
                  src={duoOrSingle[0].thumbnail}
                  alt=""
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                  <Play className="w-2.5 h-2.5 fill-white/90 translate-x-[0.5px]" />
                </div>
              </div>
            )}

            {duoOrSingle.length === 2 && (
              <div className="grid grid-cols-12 gap-2">
                <div
                  onClick={() => handleItemClick(duoOrSingle[0])}
                  className="col-span-7 group relative w-full aspect-[16/11] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                >
                  <img
                    src={duoOrSingle[0].thumbnail}
                    alt=""
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                    <Play className="w-2.5 h-2.5 fill-white/90 translate-x-[0.5px]" />
                  </div>
                </div>

                <div
                  onClick={() => handleItemClick(duoOrSingle[1])}
                  className="col-span-5 group relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 active:scale-[0.98] transition-transform duration-200 shadow-md"
                >
                  <img
                    src={duoOrSingle[1].thumbnail}
                    alt=""
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 pointer-events-none shadow-sm">
                    <Play className="w-2.5 h-2.5 fill-white/90 translate-x-[0.5px]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReelMosaicSection;
