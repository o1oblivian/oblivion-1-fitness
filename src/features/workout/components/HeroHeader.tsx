import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { modalActions } from '../../../components/modals/useModalStore';

export interface HeroHeaderProps {
  readinessScore?: number;
  onOpenReadiness?: () => void;
  onCycleDayDial?: () => void;
  onOpenSettings?: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  onOpenSettings,
}) => {
  return (
    <div
      id="hero-header-top-bar"
      className="relative z-10 flex items-center justify-between pt-1 px-1 w-full select-none"
    >
      {/* Left: Bare 3 vertical dots (Crimson #C4121A, Amber #F59E0B, Pure Natural Green #059669) - Access Profile & Settings */}
      <button
        type="button"
        id="hero-settings-trigger"
        title="Settings & Athlete Profile"
        aria-label="Settings and Profile"
        onClick={(e) => {
          e.stopPropagation();
          tactileEngine.triggerSelectionBuzz();
          if (onOpenSettings) onOpenSettings();
          else modalActions.openSettings();
        }}
        className="p-1 flex flex-col items-center justify-center gap-1 bg-transparent border-0 cursor-pointer active:scale-90 transition-transform"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
      </button>

      {/* Right spacer for symmetrical top-bar balance */}
      <div className="w-6" />
    </div>
  );
};

export default HeroHeader;
