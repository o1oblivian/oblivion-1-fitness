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

  const variantClasses: Record<BadgeVariant, { container: string; beacon: string; ping: string }> = {
    ruby: {
      container: 'bg-[#C4121A] text-white border-transparent shadow-xs',
      beacon: 'bg-white',
      ping: 'bg-white',
    },
    'neon-ruby': {
      container: 'bg-red-950/60 text-red-400 border-red-800/60 shadow-xs',
      beacon: 'bg-red-500',
      ping: 'bg-red-400',
    },
    cyan: {
      container: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60 shadow-xs',
      beacon: 'bg-cyan-400',
      ping: 'bg-cyan-300',
    },
    'cyber-cyan': {
      container: 'bg-[#06b6d4] text-black font-black border-transparent shadow-xs',
      beacon: 'bg-black',
      ping: 'bg-cyan-200',
    },
    'natural-green': {
      container: 'bg-green-950/60 text-green-400 border-green-800/60 shadow-xs',
      beacon: 'bg-green-500',
      ping: 'bg-green-400',
    },
    green: {
      container: 'bg-green-950/60 text-green-400 border-green-800/60 shadow-xs',
      beacon: 'bg-green-500',
      ping: 'bg-green-400',
    },
    jade: {
      container: 'bg-[#16a34a] text-white font-black border-transparent shadow-xs',
      beacon: 'bg-black',
      ping: 'bg-green-300',
    },
    amber: {
      container: 'bg-amber-950/60 text-amber-400 border-amber-800/60 shadow-xs',
      beacon: 'bg-amber-400',
      ping: 'bg-amber-300',
    },
    'amber-warn': {
      container: 'bg-[#f59e0b] text-black font-black border-transparent shadow-xs',
      beacon: 'bg-black',
      ping: 'bg-amber-300',
    },
    gold: {
      container: 'bg-amber-400 text-black font-black border-amber-300 shadow-xs',
      beacon: 'bg-black',
      ping: 'bg-yellow-300',
    },
    amethyst: {
      container: 'bg-purple-950/60 text-purple-400 border-purple-800/60 shadow-xs',
      beacon: 'bg-purple-400',
      ping: 'bg-purple-300',
    },
    violet: {
      container: 'bg-[#8b5cf6] text-white border-transparent shadow-xs',
      beacon: 'bg-white',
      ping: 'bg-violet-300',
    },
    titanium: {
      container: 'bg-neutral-800 text-neutral-300 border-neutral-700 shadow-xs',
      beacon: 'bg-neutral-400',
      ping: 'bg-neutral-300',
    },
    'stealth-gray': {
      container: 'bg-neutral-900/80 text-neutral-400 border-neutral-800 shadow-xs',
      beacon: 'bg-neutral-500',
      ping: 'bg-neutral-400',
    },
    'live-pulse': {
      container: 'bg-red-950/80 text-red-400 border-red-800/80 shadow-xs',
      beacon: 'bg-red-500',
      ping: 'bg-red-500',
    },
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
