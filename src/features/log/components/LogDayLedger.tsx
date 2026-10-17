import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Headline } from './logHistoryFormat';

interface LogChannelRowProps {
  title: string;
  icon: React.ReactNode;
  /** Tailwind colour class for the icon. */
  iconClass: string;
  headline: Headline;
  open: boolean;
  onToggle: () => void;
  /** The day's entries for this channel, shown when the row is open. */
  children: React.ReactNode;
}

/** One logged channel: the number that matters on the right, the full entries when opened. */
export const LogChannelRow: React.FC<LogChannelRowProps> = ({ title, icon, iconClass, headline, open, onToggle, children }) => (
  <div className="border-t border-white/[0.07]">
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="w-full min-h-[56px] px-4 py-2.5 flex items-center gap-3 text-left bg-transparent border-0"
    >
      <span className={`o1-mark ${iconClass}`}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-o1-text">{title}</span>
        {headline.caption && <span className="block text-[11px] text-o1-muted truncate">{headline.caption}</span>}
      </span>
      <span className="shrink-0 font-mono text-[20px] leading-none tabular-nums text-o1-text">
        {headline.value}
        <span className="ml-1 font-sans text-[11px] text-o1-muted">{headline.unit}</span>
      </span>
      {open ? <ChevronUp className="w-4 h-4 text-o1-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-o1-muted shrink-0" />}
    </button>
    {open && <div className="px-4 pb-3 space-y-2.5">{children}</div>}
  </div>
);

export interface LogQuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

/** Channels with nothing logged yet, as buttons that start logging. The first one is the main action. */
export const LogStillToLog: React.FC<{ actions: LogQuickAction[] }> = ({ actions }) => {
  if (actions.length === 0) return null;
  return (
    <div className="border-t border-white/[0.07] px-4 pt-3 pb-3.5">
      <p className="text-[11px] text-o1-muted mb-2">Still to log</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onSelect}
            className={`o1-pill border text-xs font-semibold ${
              index === 0 ? 'bg-o1-crimson border-o1-crimson text-white' : 'bg-o1-well border-white/[0.07] text-neutral-200'
            }`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
