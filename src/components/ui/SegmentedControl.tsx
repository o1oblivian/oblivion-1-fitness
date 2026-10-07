import React from 'react';

export interface SegmentedControlOption<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  color?: string; // Highlight color for icon or active indicator
  badge?: React.ReactNode;
  activeClassName?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[] | SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'primary' | 'sub' | 'light' | 'tactical';
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  id?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = 'primary',
  className = '',
  itemClassName = '',
  activeClassName = '',
  inactiveClassName = '',
  id,
}: SegmentedControlProps<T>): React.ReactElement {
  const containerVariants = {
    primary:
      'bg-o1-card border border-white/[0.07] rounded-2xl p-1.5 flex items-center gap-1.5 shadow-md',
    sub:
      'bg-o1-card border border-white/[0.07] rounded-xl p-1 flex items-center gap-1.5 shadow-xs',
    light:
      'flex items-center gap-1 bg-o1-card p-1 rounded-xl border border-white/[0.07]',
    tactical:
      'bg-black border border-white/[0.07] rounded-xl p-1 flex items-center gap-1 shadow-inner',
  }[variant];

  const itemBaseVariants = {
    primary:
      'flex-1 py-2 px-3 rounded-xl text-xs font-tactical font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer',
    sub:
      'flex-1 py-1.5 px-3 rounded-xl text-[10px] font-tactical font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer',
    light:
      'flex-1 py-1.5 px-2 rounded-xl text-xs font-tactical font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer',
    tactical:
      'flex-1 py-1 px-2.5 rounded-xl text-[10px] font-telemetry font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 flex items-center justify-center gap-1 cursor-pointer',
  }[variant];

  const itemActiveVariants = {
    primary: 'bg-o1-crimson text-white shadow-sm font-bold',
    sub: 'bg-o1-well text-white border border-white/[0.07] shadow-sm font-black',
    light: 'bg-o1-crimson text-white shadow-sm',
    tactical: 'bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/40 ',
  }[variant];

  const itemInactiveVariants = {
    primary: 'text-neutral-400 hover:text-white hover:bg-o1-well border border-transparent',
    sub: 'text-neutral-400 hover:text-white hover:bg-o1-well border border-transparent',
    light: 'text-neutral-400 hover:text-white',
    tactical: 'text-neutral-500 hover:text-neutral-300 border border-transparent',
  }[variant];

  return (
    <div id={id} className={`${containerVariants} ${className}`}>
      {options.map((option) => {
        const isActive = value === option.key;
        const currentActiveStyle =
          option.activeClassName || activeClassName || itemActiveVariants;
        const currentInactiveStyle = inactiveClassName || itemInactiveVariants;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`${itemBaseVariants} ${
              isActive ? currentActiveStyle : currentInactiveStyle
            } ${itemClassName}`}
          >
            {option.icon && (
              <span
                style={{
                  color: isActive && option.color ? option.color : undefined,
                }}
                className="shrink-0 flex items-center"
              >
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge && <span className="ml-1">{option.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
