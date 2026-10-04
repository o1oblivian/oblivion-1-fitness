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
      className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none py-1 px-0.5 select-none"
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
            className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-150 flex items-center justify-center shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#C4121A] text-white shadow-sm border border-[#C4121A]'
                : 'bg-neutral-100 text-neutral-600 border border-neutral-200 active:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:active:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
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
