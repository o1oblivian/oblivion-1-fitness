import React from 'react';
import { BadgeCheck, Pencil, Plus } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';

export interface ProfileStat {
  label: string;
  value: string;
  onPress?: () => void;
}

interface CoachProfileHeaderProps {
  name: string;
  handle?: string;
  avatar?: string;
  specialty?: string;
  bio?: string;
  verified?: boolean;
  /** Crimson ring around the photo when the coach has reels to watch. */
  hasStory?: boolean;
  onAvatarPress?: () => void;
  onAddClip?: () => void;
  onEdit?: () => void;
  stats: [ProfileStat, ProfileStat, ProfileStat];
  actions: React.ReactNode;
}

/** Shared coach header for the public Reels profile and the coach's own console. */
export const CoachProfileHeader: React.FC<CoachProfileHeaderProps> = ({
  name,
  handle,
  avatar,
  specialty,
  bio,
  verified = false,
  hasStory = false,
  onAvatarPress,
  onAddClip,
  onEdit,
  stats,
  actions,
}) => (
  <header className="space-y-3">
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onAvatarPress?.();
          }}
          disabled={!onAvatarPress}
          aria-label={hasStory ? `Watch ${name}'s reels` : `${name}'s photo`}
          className={`flex h-[92px] w-[92px] items-center justify-center rounded-full p-[3px] active:scale-[0.98] disabled:active:scale-100 ${
            hasStory ? 'bg-o1-crimson' : 'bg-white/[0.07]'
          }`}
        >
          <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-o1-canvas bg-o1-surface">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-o1-text">{name.slice(0, 1).toUpperCase()}</span>
            )}
          </span>
        </button>
        {onAddClip ? (
          <button
            type="button"
            aria-label="Add a clip"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onAddClip();
            }}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-o1-canvas bg-white text-neutral-950 active:scale-95"
          >
            <Plus size={14} />
          </button>
        ) : null}
      </div>

      <dl className="grid flex-1 grid-cols-3 text-center">
        {stats.map((stat) => {
          const body = (
            <>
              <dd className="text-[17px] font-semibold tabular-nums text-o1-text">{stat.value}</dd>
              <dt className="text-[11px] text-o1-muted">{stat.label}</dt>
            </>
          );
          return stat.onPress ? (
            <button key={stat.label} type="button" onClick={stat.onPress} className="flex min-h-[44px] flex-col-reverse items-center justify-center active:scale-[0.98]">
              {body}
            </button>
          ) : (
            <div key={stat.label} className="flex min-h-[44px] flex-col-reverse items-center justify-center">
              {body}
            </div>
          );
        })}
      </dl>
    </div>

    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <h2 className="truncate text-[15px] font-semibold text-o1-text">{name}</h2>
        {verified ? <BadgeCheck size={16} className="shrink-0 text-sky-600" aria-label="Verified" /> : null}
        {onEdit ? (
          <button type="button" onClick={onEdit} aria-label="Edit profile" className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center text-o1-muted active:scale-95">
            <Pencil size={15} />
          </button>
        ) : null}
      </div>
      {handle ? <p className="truncate text-[12px] text-o1-muted">{handle}</p> : null}
      {specialty ? <p className="text-[13px] text-o1-muted">{specialty}</p> : null}
      {bio ? <p className="line-clamp-3 pt-1 text-[13px] leading-snug text-o1-text">{bio}</p> : null}
    </div>

    <div className="flex gap-2">{actions}</div>
  </header>
);

export function ProfileActionButton({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        tactileEngine.triggerSelectionBuzz();
        onPress();
      }}
      className={`h-[44px] flex-1 rounded-xl text-[13px] font-semibold active:scale-[0.98] ${
        primary ? 'bg-o1-crimson text-white' : 'border border-white/[0.07] bg-o1-surface text-o1-text'
      }`}
    >
      {label}
    </button>
  );
}

export function compactCount(value: number | null): string {
  if (value == null) return '--';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(value);
}

export function ratingLabel(rating: number | null): string {
  return rating != null ? `★ ${rating.toFixed(1)}` : '--';
}
