import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FloorCardAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
}

interface FloorAthleteCardProps {
  name: string;
  avatar?: string;
  subtitle?: string;
  meta?: string;
  stats: { label: string; value: string }[];
  lastFeedback?: string;
  actions: FloorCardAction[];
  onOpenProfile?: () => void;
}

export function AthleteAvatar({ name, avatar, size = 44 }: { name: string; avatar?: string; size?: number }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#1F1F1F] bg-[#161616]"
      style={{ width: size, height: size }}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[15px] font-semibold text-[#EAE8DF]">{initial}</span>
      )}
    </span>
  );
}

/** One athlete on the coach floor: photo first, the numbers that matter, and one-tap actions. */
export const FloorAthleteCard: React.FC<FloorAthleteCardProps> = ({
  name,
  avatar,
  subtitle,
  meta,
  stats,
  lastFeedback,
  actions,
  onOpenProfile,
}) => (
  <article className="rounded-2xl border border-[#1F1F1F] bg-black p-3">
    <button
      type="button"
      onClick={onOpenProfile}
      disabled={!onOpenProfile}
      className="flex w-full items-start gap-3 text-left active:scale-[0.99] disabled:active:scale-100"
    >
      <AthleteAvatar name={name} avatar={avatar} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-[#EAE8DF]">{name}</span>
          {meta ? <span className="shrink-0 text-[11px] text-[#8A887F]">{meta}</span> : null}
        </span>
        {subtitle ? <span className="block truncate text-[12px] text-[#8A887F]">{subtitle}</span> : null}
      </span>
    </button>

    {stats.length > 0 ? (
      <dl className="mt-3 grid grid-cols-3 gap-1.5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-[#0E0E0E] px-2 py-1.5 text-center">
            <dt className="text-[10px] text-[#8A887F]">{stat.label}</dt>
            <dd className="text-[13px] font-semibold tabular-nums text-[#EAE8DF]">{stat.value}</dd>
          </div>
        ))}
      </dl>
    ) : null}

    {lastFeedback ? (
      <p className="mt-2 truncate rounded-lg bg-[#16301f] px-2 py-1 text-[11px] font-semibold text-[#b7e0c2]">You said: {lastFeedback}</p>
    ) : null}

    <div className="mt-3 flex gap-1.5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`flex h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold active:scale-[0.98] ${
              action.primary ? 'bg-[#C4121A] text-white' : 'border border-[#1F1F1F] bg-[#0E0E0E] text-[#EAE8DF]'
            }`}
          >
            <Icon size={14} />
            {action.label}
          </button>
        );
      })}
    </div>
  </article>
);
