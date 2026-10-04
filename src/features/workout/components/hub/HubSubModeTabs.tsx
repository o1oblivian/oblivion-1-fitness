import React from 'react';
import { Zap, BookOpen, Layers } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';

interface HubSubModeTabsProps {
  activeSubTab: 'auto' | 'manual' | 'blueprint' | 'swapper';
  onChangeTab: (tab: 'auto' | 'manual' | 'blueprint') => void;
}

export const HubSubModeTabs: React.FC<HubSubModeTabsProps> = ({
  activeSubTab,
  onChangeTab,
}) => {
  const isBlueprintActive = activeSubTab === 'blueprint' || activeSubTab === 'swapper';

  return (
    <div className="bg-[#18181b] p-1 rounded-full flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChangeTab('auto');
        }}
        className={
          activeSubTab === 'auto'
            ? 'bg-[#C4121A] text-white rounded-full px-4 py-1 text-xs font-bold shadow-sm flex items-center gap-1 flex-1 justify-center transition-all cursor-pointer'
            : 'text-neutral-400 hover:text-white text-xs font-medium flex items-center gap-1 flex-1 justify-center py-1 transition-all cursor-pointer'
        }
      >
        <Zap className="w-3 h-3" />
        <span>AUTO</span>
      </button>
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChangeTab('manual');
        }}
        className={
          activeSubTab === 'manual'
            ? 'bg-[#C4121A] text-white rounded-full px-4 py-1 text-xs font-bold shadow-sm flex items-center gap-1 flex-1 justify-center transition-all cursor-pointer'
            : 'text-neutral-400 hover:text-white text-xs font-medium flex items-center gap-1 flex-1 justify-center py-1 transition-all cursor-pointer'
        }
      >
        <BookOpen className="w-3 h-3" />
        <span>MANUAL</span>
      </button>
      <button
        type="button"
        id="hub-tab-blueprint"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChangeTab('blueprint');
        }}
        className={
          isBlueprintActive
            ? 'bg-[#C4121A] text-white rounded-full px-4 py-1 text-xs font-bold shadow-sm flex items-center gap-1 flex-1 justify-center transition-all cursor-pointer'
            : 'text-neutral-400 hover:text-white text-xs font-medium flex items-center gap-1 flex-1 justify-center py-1 transition-all cursor-pointer'
        }
      >
        <Layers className="w-3 h-3" />
        <span>BLUEPRINT</span>
      </button>
    </div>
  );
};
