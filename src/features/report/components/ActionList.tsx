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
  alert: 'bg-o1-crimson',
  caution: 'bg-o1-yellow',
  info: 'bg-o1-teal',
};

const TRAINING_KINDS: ActionKind[] = ['volume_add', 'volume_reduce', 'plateau', 'deload'];

export const ActionList: React.FC<ActionListProps> = ({ title, actions, ctaLabel, onAction }) => (
  <section className="w-full rounded-2xl bg-black border border-white/[0.07] p-4 space-y-3">
    <h3 className="text-o1-label font-num font-bold tracking-[0.18em] text-o1-muted">{title}</h3>
    {actions.length === 0 ? (
      <p className="text-xs text-o1-faint leading-relaxed">
        Nothing flagged. Volume, progression and recovery are inside range.
      </p>
    ) : (
      <ul className="divide-y divide-white/[0.05]">
        {actions.map((action) => (
          <li key={action.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT[action.severity]}`} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="text-sm font-bold text-white">{action.title}</div>
              <p className="text-o1-label leading-snug text-o1-muted">{action.detail}</p>
            </div>
            {TRAINING_KINDS.includes(action.kind) && (
              <button
                type="button"
                onClick={() => onAction(action)}
                className="shrink-0 h-9 pl-3 pr-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-o1-label font-num font-bold tracking-wider text-o1-bone flex items-center gap-1 active:scale-95 transition-transform"
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
