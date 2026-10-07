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

  const tabClass = (active: boolean) =>
    active
      ? 'bg-o1-well text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs flex items-center gap-1 flex-1 justify-center transition-all cursor-pointer'
      : 'text-neutral-400 hover:text-white text-xs font-medium flex items-center gap-1 flex-1 justify-center py-1.5 transition-all cursor-pointer';

  return (
    <div className="bg-black border border-white/[0.07] p-1 rounded-full flex items-center justify-between mb-3">
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChangeTab('auto');
        }}
        className={tabClass(activeSubTab === 'auto')}
      >
        <Zap className={`w-3 h-3 ${activeSubTab === 'auto' ? 'text-o1-crimson' : ''}`} />
        <span>Auto</span>
      </button>
      <button
        type="button"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChangeTab('manual');
        }}
        className={tabClass(activeSubTab === 'manual')}
      >
        <BookOpen className={`w-3 h-3 ${activeSubTab === 'manual' ? 'text-o1-crimson' : ''}`} />
        <span>Manual</span>
      </button>
      <button
        type="button"
        id="hub-tab-blueprint"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          onChangeTab('blueprint');
        }}
        className={tabClass(isBlueprintActive)}
      >
        <Layers className={`w-3 h-3 ${isBlueprintActive ? 'text-o1-crimson' : ''}`} />
        <span>Blueprint</span>
      </button>
    </div>
  );
};
