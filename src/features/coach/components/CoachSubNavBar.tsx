import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachSubTab } from '../../../stores/useCoachStore';

export const SUB_TABS: CoachSubTab[] = ['INTEL', 'CLIENTS', 'CHECKINS', 'INBOX', 'EARNINGS'];

export const SUB_TAB_LABELS: Record<string, string> = {
  INTEL: 'INTEL',
  CLIENTS: 'ROSTER',
  CHECKINS: 'CHECK-INS',
  INBOX: 'INBOX',
  EARNINGS: 'EARNINGS',
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
      className="-mx-4 px-4 flex items-center gap-2 overflow-x-auto overscroll-x-contain no-scrollbar scrollbar-none py-0.5 select-none after:w-2 after:shrink-0 after:content-['']"
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
            className={`min-h-[40px] px-2.5 py-2 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer ${
              isActive
                ? 'bg-o1-crimson text-white shadow-sm border border-o1-crimson'
                : 'border bg-o1-well text-neutral-400 border-white/[0.07] active:bg-white/[0.06] hover:text-white'
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
