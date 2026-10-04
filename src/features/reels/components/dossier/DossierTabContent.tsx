import React from 'react';
import { CoachMarketplaceProgram } from '../../../coach/types/coachPlatformTypes';
import { ExploreCoach, ExploreReelItem } from '../../../../data/reelsExploreCatalog';
import { DossierBioMetrics } from './DossierBioMetrics';
import { DossierPhysiqueTab } from './DossierPhysiqueTab';
import { DossierProgramsTab } from './DossierProgramsTab';
import { DossierCoachingTab } from './DossierCoachingTab';

interface DossierTabContentProps {
  coach: ExploreCoach;
  activeTab: 'physique' | 'programs' | 'coaching';
  setActiveTab: (t: 'physique' | 'programs' | 'coaching') => void;
  programs: CoachMarketplaceProgram[];
  displayReels: ExploreReelItem[];
  onSelectReel?: (reel: ExploreReelItem) => void;
  onSelectProgram: (prog: CoachMarketplaceProgram) => void;
  showToast: (msg: string) => void;
}

export const DossierTabContent: React.FC<DossierTabContentProps> = ({
  coach,
  activeTab,
  setActiveTab,
  programs,
  displayReels,
  onSelectReel,
  onSelectProgram,
  showToast,
}) => {
  return (
    <div className="px-4 pt-1 max-w-xl mx-auto space-y-3">
      <DossierBioMetrics coach={coach} />

      {/* Hairline Understated Segmented Navigation with Small Fonts */}
      <div className="pt-1 border-b border-white/5 grid grid-cols-3 text-center">
        <button
          type="button"
          onClick={() => setActiveTab('physique')}
          className={`pb-1.5 text-[11px] transition cursor-pointer relative ${
            activeTab === 'physique' ? 'font-medium text-white' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Physique & Cues
          {activeTab === 'physique' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C4121A]" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('programs')}
          className={`pb-1.5 text-[11px] transition cursor-pointer relative ${
            activeTab === 'programs' ? 'font-medium text-white' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Programs ({programs.length})
          {activeTab === 'programs' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C4121A]" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coaching')}
          className={`pb-1.5 text-[11px] transition cursor-pointer relative ${
            activeTab === 'coaching' ? 'font-medium text-white' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          1:1 Co-Pilot
          {activeTab === 'coaching' && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C4121A]" />}
        </button>
      </div>

      {activeTab === 'physique' && (
        <DossierPhysiqueTab
          coach={coach}
          displayReels={displayReels}
          onSelectReel={onSelectReel}
          onShowToast={showToast}
        />
      )}
      {activeTab === 'programs' && (
        <DossierProgramsTab programs={programs} onSelectProgram={onSelectProgram} />
      )}
      {activeTab === 'coaching' && (
        <DossierCoachingTab
          coach={coach}
          onApply={() => showToast(`Application submitted! ${coach.name.split(' ')[0]} will review within 4 hours.`)}
        />
      )}
    </div>
  );
};
