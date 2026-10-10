import React, { useEffect, useState } from 'react';
import { BadgeCheck, Film } from 'lucide-react';
import { ExploreReelItem, FilmstripClip, ExploreCoach } from '../reelTypes';
import { tactileEngine } from '../../../services/tactileEngine';
import { useAuthStore } from '../../../stores/useAuthStore';
import { FOLLOW_EVENT, isFollowing, setFollowing } from '../services/coachStorefront';

interface ReelFilmstripBarProps {
  activeReel: ExploreReelItem;
  activeClip: FilmstripClip | null;
  onBookCoach: (coach: ExploreCoach) => void;
  onOpenAssetGallery: () => void;
  assetCount: number;
  onNotice: (message: string) => void;
}

export const ReelFilmstripBar: React.FC<ReelFilmstripBarProps> = ({
  activeReel,
  activeClip,
  onBookCoach,
  onOpenAssetGallery,
  assetCount,
  onNotice,
}) => {
  const currentTitle = activeClip?.title || activeReel?.title || '';
  const coach = activeReel?.coach;
  const coachId = coach?.id || '';
  const userId = useAuthStore((s) => s.user?.id || '');
  const [following, setFollowingState] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    setFollowingState(null);
    if (coachId) void isFollowing(coachId).then((on) => live && setFollowingState(on));
    const onFollow = (event: Event) => {
      const detail = (event as CustomEvent<{ coachId: string; following: boolean }>).detail;
      if (detail?.coachId === coachId) setFollowingState(detail.following);
    };
    window.addEventListener(FOLLOW_EVENT, onFollow);
    return () => {
      live = false;
      window.removeEventListener(FOLLOW_EVENT, onFollow);
    };
  }, [coachId]);

  const follow = async () => {
    if (!coachId) return;
    tactileEngine.triggerSelectionBuzz();
    setFollowingState(true);
    const ok = await setFollowing(coachId, true);
    if (ok) return;
    setFollowingState(false);
    onNotice('Sign in to follow coaches');
  };

  const showFollow = Boolean(coach) && following === false && coachId !== userId;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex max-w-xl flex-col gap-0.5 px-3 pb-4 pt-2 pr-16 pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        {coach ? (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onBookCoach(coach);
            }}
            className="flex min-h-[44px] min-w-0 items-center gap-2 text-left active:scale-[0.98]"
            aria-label={`Open ${coach.name}'s profile`}
          >
            {coach.avatar ? (
              <img src={coach.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full border border-white/30 object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E0E0E] text-[12px] font-semibold text-white">
                {coach.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              {coach.name}
              {coach.verified ? <BadgeCheck size={14} className="shrink-0 text-[#0284c7]" aria-label="Verified" /> : null}
            </span>
          </button>
        ) : null}

        {showFollow ? (
          <button
            type="button"
            onClick={() => void follow()}
            className="flex min-h-[44px] shrink-0 items-center active:scale-[0.98]"
            aria-label={`Follow ${coach?.name}`}
          >
            <span className="rounded-full border border-white/70 px-3 py-1 text-[12px] font-semibold text-white">Follow</span>
          </button>
        ) : null}

        {assetCount > 1 ? (
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenAssetGallery();
            }}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 text-white/80 hover:text-white active:scale-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            aria-label={`Show ${assetCount} clips`}
          >
            <Film className="h-4 w-4" />
            <span className="text-xs font-medium">{assetCount}</span>
          </button>
        ) : null}
      </div>

      {currentTitle ? (
        <p className="line-clamp-1 text-xs font-normal text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{currentTitle}</p>
      ) : null}
    </div>
  );
};
