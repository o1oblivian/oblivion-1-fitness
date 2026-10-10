import React from 'react';

interface Props {
  count: number | null;
  threshold: number;
  locationOn: boolean | null;
  cardLive: boolean;
  onOpenProfile: () => void;
}

export const FoundingLiftersQueue: React.FC<Props> = ({
  count,
  threshold,
  locationOn,
  cardLive,
  onOpenProfile,
}) => {
  const safeThreshold = threshold > 0 ? threshold : 250;
  const progress = count == null ? 0 : Math.max(0, Math.min(100, Math.round((count / safeThreshold) * 100)));
  const detail = locationOn === false
    ? 'Location is off, so this phone cannot join an area yet.'
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
      <p className="mt-6 max-w-[18rem] text-[14px] leading-relaxed text-neutral-400">{detail}</p>
      {!cardLive && locationOn !== false && (
        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-6 h-12 w-full max-w-sm rounded-full bg-white text-[15px] font-semibold text-neutral-950"
        >
          Build your profile
        </button>
      )}
    </div>
  );
};
