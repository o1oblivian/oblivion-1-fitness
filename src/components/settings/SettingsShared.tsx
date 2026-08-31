import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        minWidth: '48px',
        width: '48px',
        maxWidth: '48px',
        minHeight: '26px',
        height: '26px',
        maxHeight: '26px',
      }}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none select-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${
        checked ? 'bg-[#FF3B30] dark:bg-[#FF453A]' : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span
        style={{
          width: '22px',
          height: '22px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}
        className={`pointer-events-none inline-block shrink-0 rounded-full transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-[22px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function RedToggle(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return <ToggleSwitch {...props} />;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1.5 mt-4 first:mt-1 px-1">
      <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 mt-4 first:mt-1 px-1">
      <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {children}
      </h3>
    </div>
  );
}

export function SectionSubtext({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 mb-1.5 px-1 leading-relaxed">
      {children}
    </p>
  );
}

export function SettingsGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#18181B] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden shadow-xs ${className}`}>
      {children}
    </div>
  );
}

export function SettingsCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <SettingsGroup className={className}>{children}</SettingsGroup>;
}

export function SettingsRow({
  label,
  sublabel,
  value,
  onClick,
  rightElement,
  destructive = false,
}: {
  label: string;
  sublabel?: string;
  value?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full min-h-[52px] px-3.5 py-1.5 flex items-center justify-between gap-3 text-left transition-colors ${
        onClick ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 active:bg-zinc-100 dark:active:bg-zinc-800/70' : ''
      }`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <span className={`text-sm font-medium block leading-snug ${destructive ? 'text-[#FF3B30] dark:text-[#FF453A] font-semibold' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {label}
        </span>
        {sublabel && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 block leading-normal">
            {sublabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {value && <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{value}</span>}
        {rightElement}
        {onClick && !rightElement && (
          <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
        )}
      </div>
    </Comp>
  );
}

export function NavPill({
  label,
  value,
  onClick,
  destructive = false,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[52px] flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer text-left my-1 shadow-xs"
    >
      <span className={`text-sm font-medium ${destructive ? 'text-[#FF3B30] dark:text-[#FF453A] font-semibold' : 'text-zinc-900 dark:text-white'}`}>
        {label}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {value && <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{value}</span>}
        {onClick && !destructive && <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
      </div>
    </button>
  );
}

export function SubViewHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-[#09090B] px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
      <button
        type="button"
        onClick={onBack}
        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-900 dark:text-white"
      >
        <ChevronLeft className="w-4.5 h-4.5" />
      </button>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">{title}</h2>
    </div>
  );
}
