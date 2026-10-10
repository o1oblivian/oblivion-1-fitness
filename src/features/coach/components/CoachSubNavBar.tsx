import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachSubTab } from '../../../stores/useCoachStore';

export const SUB_TABS: CoachSubTab[] = ['INTEL', 'CLIENTS', 'CHECKINS', 'INBOX', 'EARNINGS'];

export const SUB_TAB_LABELS: Record<string, string> = {
  INTEL: 'Notes',
  CLIENTS: 'Roster',
  CHECKINS: 'Check-in',
  INBOX: 'Inbox',
  EARNINGS: 'Earnings',
};

interface CoachSubNavBarProps {
  currentSubTab: CoachSubTab;
  onSelectSubTab: (tab: CoachSubTab) => void;
}

export const CoachSubNavBar: React.FC<CoachSubNavBarProps> = ({ currentSubTab, onSelectSubTab }) => {
  return (
    <div
      id="coach-sub-navigation-track"
      role="tablist"
      aria-label="Coach Sub-navigation"
      className="w-full flex flex-wrap items-center justify-center gap-1.5 select-none"
    >
      {SUB_TABS.map((tab) => {
        const isActive = currentSubTab === tab;
        const label = SUB_TAB_LABELS[tab] || tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onSelectSubTab(tab);
            }}
            className={`o1-pill text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
              isActive
                ? 'bg-white text-neutral-950 border-white'
                : 'border bg-o1-well text-neutral-200 border-white/[0.07] active:bg-white/[0.06]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default CoachSubNavBar;
