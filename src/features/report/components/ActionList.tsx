import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ActionKind, ReportAction } from '../types';

interface ActionListProps {
  title: string;
  actions: ReportAction[];
  ctaLabel: string;
  onAction: (action: ReportAction) => void;
}

const DOT: Record<ReportAction['severity'], string> = {
  alert: 'bg-red-500',
  caution: 'bg-amber-500',
  info: 'bg-sky-500',
};

const TRAINING_KINDS: ActionKind[] = ['volume_add', 'volume_reduce', 'plateau', 'deload'];

export const ActionList: React.FC<ActionListProps> = ({ title, actions, ctaLabel, onAction }) => (
  <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-3">
    <h3 className="text-[10px] font-mono font-bold tracking-[0.18em] text-neutral-400">{title}</h3>
    {actions.length === 0 ? (
      <p className="text-xs text-neutral-500 leading-relaxed">
        Nothing flagged. Volume, progression and recovery are inside range.
      </p>
    ) : (
      <ul className="divide-y divide-white/[0.05]">
        {actions.map((action) => (
          <li key={action.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT[action.severity]}`} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="text-sm font-bold text-white">{action.title}</div>
              <p className="text-[11px] leading-snug text-neutral-400">{action.detail}</p>
            </div>
            {TRAINING_KINDS.includes(action.kind) && (
              <button
                type="button"
                onClick={() => onAction(action)}
                className="shrink-0 h-9 pl-3 pr-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono font-bold tracking-wider text-neutral-100 flex items-center gap-1 active:scale-95 transition-transform"
              >
                {ctaLabel}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default ActionList;
