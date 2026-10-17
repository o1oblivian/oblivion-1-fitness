import React from 'react';
import { MapPin } from 'lucide-react';

interface Props {
  count: number | null;
  threshold: number;
  locationOn: boolean | null;
  locating: boolean;
  cardLive: boolean;
  onOpenProfile: () => void;
  onEnableLocation: () => void;
}

export const FoundingLiftersQueue: React.FC<Props> = ({
  count,
  threshold,
  locationOn,
  locating,
  cardLive,
  onOpenProfile,
  onEnableLocation,
}) => {
  const safeThreshold = threshold > 0 ? threshold : 250;
  const progress =
    count == null ? 0 : Math.max(0, Math.min(100, Math.round((count / safeThreshold) * 100)));
  const locationOff = locationOn === false;
  const detail = locationOff
    ? 'Buddy uses your rough area, about 1 km, to find people near you. Your exact location is never shown.'
    : cardLive
      ? 'Your profile is in the queue. The deck opens when Buddy is switched on.'
      : 'Add your name and an age of 18 or older to join the queue.';

  return (
    <div id="founding-lifters" className="flex flex-col items-center px-5 pt-12 text-center">
      <p className="text-[12px] tracking-wide text-neutral-400">Founding lifters</p>
      <p className="o1-num mt-3 text-[42px] leading-none text-[#F2EFE6]">
        {count == null ? '—' : count}
        <span className="text-[22px] text-neutral-500"> / {safeThreshold}</span>
      </p>
      <p className="mt-2 text-[13px] text-neutral-400">lifters to unlock in your area</p>
      <div className="mt-6 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[#161616]">
        <div className="h-full bg-[#F2EFE6]" style={{ width: `${progress}%` }} />
      </div>
      {locationOff ? (
        <>
          <button
            type="button"
            onClick={onEnableLocation}
            disabled={locating}
            className="mt-6 max-w-[18rem] text-[14px] leading-relaxed text-neutral-400 underline decoration-white/20 underline-offset-4"
          >
            {detail}
          </button>
          <button
            type="button"
            onClick={onEnableLocation}
            disabled={locating}
            className="mt-6 flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-o1-crimson text-[15px] font-semibold text-white disabled:opacity-60"
          >
            <MapPin className="h-4 w-4" />
            {locating ? 'Finding you…' : 'Turn on location'}
          </button>
        </>
      ) : (
        <p className="mt-6 max-w-[18rem] text-[14px] leading-relaxed text-neutral-400">{detail}</p>
      )}
      {!cardLive && !locationOff && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-6 h-12 w-full max-w-sm rounded-full bg-o1-crimson text-[15px] font-semibold text-white active:bg-o1-crimson-press"
        >
          Build your profile
        </button>
      )}
    </div>
  );
};
