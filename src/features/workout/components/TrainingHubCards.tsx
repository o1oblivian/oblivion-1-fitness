import React from 'react';
import { Dumbbell, UserRound } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

type HubTab = 'intel' | 'coach';

export interface TrainingHubCardsProps {
  expandedHubTab: HubTab | null;
  onToggleTab: (tab: HubTab) => void;
  /** Unread coach update; replaces the My Coach subtitle until the card is opened. */
  coachNote?: string | null;
}

const TABS: {
  id: HubTab;
  title: string;
  sub: string;
  icon: typeof Dumbbell;
  drawerId: string;
  tint: string;
}[] = [
  {
    id: 'intel',
    title: 'Build workout',
    sub: 'Made for today',
    icon: Dumbbell,
    drawerId: 'intel-coach-accordion-drawer',
    tint: 'text-o1-amber-deep',
  },
  {
    id: 'coach',
    title: 'My Coach',
    sub: 'From your coach',
    icon: UserRound,
    drawerId: 'my-coach-accordion-drawer',
    tint: 'text-o1-sky',
  },
];

export const TrainingHubCards: React.FC<TrainingHubCardsProps> = ({
  expandedHubTab,
  onToggleTab,
  coachNote,
}) => (
  <div
    id="training-hub-cards-section"
    className="flex items-center justify-center gap-2.5 my-2 select-none"
  >
    {TABS.map(({ id, title, sub, icon: Icon, drawerId, tint }) => {
      const active = expandedHubTab === id;
      const note = id === 'coach' ? coachNote : null;
      return (
        <button
          key={id}
          id={`card-${id === 'intel' ? 'intel-coach' : 'my-coach'}`}
          type="button"
          aria-expanded={active}
          aria-controls={drawerId}
          aria-label={note ? `${title}. ${note}` : undefined}
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onToggleTab(id);
          }}
          className={`min-w-0 min-h-[52px] rounded-full py-2 pl-2 pr-4 transition-all active:scale-[0.98] cursor-pointer flex items-center border text-white ${
            active
              ? 'bg-o1-sheet border-o1-crimson/70'
              : 'bg-o1-surface border-white/[0.07] hover:border-white/[0.14]'
          }`}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span
              className={`relative w-9 h-9 rounded-full bg-o1-well border border-white/[0.07] flex items-center justify-center shrink-0 ${tint}`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              {note && (
                <span
                  aria-hidden
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-o1-crimson"
                />
              )}
            </span>
            <span className="min-w-0 text-left">
              <span className="block font-medium text-o1-body tracking-tight truncate leading-tight">
                {title}
              </span>
              <span
                className={`block text-o1-label truncate leading-tight mt-0.5 ${note ? 'text-o1-text' : 'text-o1-muted'}`}
              >
                {note || sub}
              </span>
            </span>
          </span>
        </button>
      );
    })}
  </div>
);
