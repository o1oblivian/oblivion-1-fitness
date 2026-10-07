import React from 'react';

export type BadgeVariant =
  | 'ruby'
  | 'neon-ruby'
  | 'cyan'
  | 'cyber-cyan'
  | 'natural-green'
  | 'green'
  | 'jade'
  | 'amber'
  | 'amber-warn'
  | 'gold'
  | 'amethyst'
  | 'violet'
  | 'titanium'
  | 'stealth-gray'
  | 'live-pulse';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  gloss?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  size = 'sm',
  pulse = false,
  gloss = false,
  icon,
  children,
  className = '',
  id,
  ...rest
}) => {
  const isPulse = variant === 'live-pulse' || pulse;

  const sizeClasses = {
    xs: 'text-[8.5px] px-2 py-0.5 tracking-wider gap-1',
    sm: 'text-[9.5px] px-2.5 py-0.5 tracking-wider gap-1.5',
    md: 'text-[10.5px] px-3 py-1 tracking-wider gap-1.5',
    lg: 'text-[11.5px] px-3.5 py-1.5 tracking-wider gap-2',
  }[size];

  const quietChip = 'bg-o1-well text-zinc-400 border-white/[0.07]';
  const variantClasses: Record<BadgeVariant, { container: string; beacon: string; ping: string }> = {
    ruby: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    'neon-ruby': { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    cyan: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    'cyber-cyan': { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    'natural-green': { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    green: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    jade: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    amber: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    'amber-warn': { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    gold: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    amethyst: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    violet: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    titanium: { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    'stealth-gray': { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
    'live-pulse': { container: quietChip, beacon: 'bg-zinc-400', ping: 'bg-zinc-500' },
  };

  const selected = variantClasses[variant] || variantClasses.cyan;

  return (
    <span
      id={id}
      className={`inline-flex items-center font-tactical font-bold uppercase rounded-full border select-none transition-all ${selected.container} ${sizeClasses} ${className}`}
      {...rest}
    >
      {isPulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selected.ping}`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${selected.beacon}`}
          />
        </span>
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default Badge;
