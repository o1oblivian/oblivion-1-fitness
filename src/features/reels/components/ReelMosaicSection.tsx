import React from 'react';
import { Play } from 'lucide-react';
import { ExploreReelItem, FilmstripClip } from '../reelTypes';
import { tactileEngine } from '../../../services/tactileEngine';
import { nextReelCover, reelCover } from '../coverPresets';
import { isPlayableClip } from '../reelClips';

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

function ReelTile({
  item,
  shape,
  onSelect,
}: {
  item: ReelPostItem;
  shape: string;
  onSelect: (item: ReelPostItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={item.clip ? `Play ${item.reel.title}, ${item.clip.title}` : `Play ${item.reel.title}`}
      className={`group relative block w-full ${shape} cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0E0E0E] shadow-md transition-transform duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white`}
    >
      <img
        src={item.thumbnail}
        alt=""
        className="h-full w-full rounded-2xl object-cover object-center transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(event) => {
          const img = event.currentTarget;
          if (img.dataset.cover === '1') return;
          img.dataset.cover = '1';
          img.src = nextReelCover(img.src);
        }}
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <span className="pointer-events-none absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.07] bg-black/40 text-white/90 backdrop-blur-md">
        <Play className="h-2.5 w-2.5 translate-x-[0.5px] fill-white/90" />
      </span>
    </button>
  );
}

export const ReelMosaicSection: React.FC<ReelMosaicSectionProps> = ({ reels, onSelectReel }) => {
  const postItems = React.useMemo(() => {
    const items: ReelPostItem[] = [];
    reels.forEach((reel) => {
      items.push({
        id: `${reel.id}-main`,
        reel,
        thumbnail: reelCover(reel.id, reel.thumbnail),
        videoUrl: reel.videoUrl,
      });
      reel.filmstripClips?.forEach((clip, idx) => {
        if (isPlayableClip(clip) && (clip.thumbnail !== reel.thumbnail || idx > 0)) {
          items.push({
            id: `${reel.id}-clip-${clip.id}`,
            reel,
            clip,
            thumbnail: reelCover(`${reel.id}-${clip.id}`, clip.thumbnail),
            videoUrl: clip.videoUrl,
          });
        }
      });
    });
    return items;
  }, [reels]);

  const select = (item: ReelPostItem) => {
    tactileEngine.triggerSelectionBuzz();
    onSelectReel(item.reel, item.clip);
  };

  const tile = (item: ReelPostItem | undefined, shape: string) =>
    item ? <ReelTile key={item.id} item={item} shape={shape} onSelect={select} /> : null;

  const chunks: ReelPostItem[][] = [];
  for (let i = 0; i < postItems.length; i += 5) {
    chunks.push(postItems.slice(i, i + 5));
  }

  if (postItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-o1-card text-neutral-500 shadow-sm">
          <Play className="h-5 w-5 opacity-40" />
        </div>
        <h4 className="font-mono text-xs font-bold tracking-widest text-neutral-400">
          No posts found in this category
        </h4>
      </div>
    );
  }

  return (
    <div className="w-full select-none space-y-2 pb-6">
      {chunks.map((chunk, chunkIdx) => {
        const alternate = chunkIdx % 2 === 1;
        const [a, b, c, d, e] = chunk;
        return (
          <div key={`mosaic-chunk-${chunkIdx}`} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {alternate ? (
                <>
                  <div className="flex flex-col justify-between gap-2">
                    {tile(a, 'aspect-[16/10]')}
                    {tile(b, 'aspect-[16/10]')}
                  </div>
                  {tile(c, 'aspect-[4/5]')}
                </>
              ) : (
                <>
                  {tile(a, 'aspect-[4/5]')}
                  <div className="flex flex-col justify-between gap-2">
                    {tile(b, 'aspect-[16/10]')}
                    {tile(c, 'aspect-[16/10]')}
                  </div>
                </>
              )}
            </div>
            {d && !e ? tile(d, 'aspect-[16/9]') : null}
            {d && e ? (
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-7">{tile(d, 'aspect-[16/11]')}</div>
                <div className="col-span-5">{tile(e, 'aspect-[4/3]')}</div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default ReelMosaicSection;
