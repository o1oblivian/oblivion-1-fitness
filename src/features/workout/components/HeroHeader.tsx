import React from 'react';
import { tactileEngine } from '../../../services/tactileEngine';
import { modalActions } from '../../../components/modals/useModalStore';

export interface HeroHeaderProps {
  /** null until sleep is logged; rendered as -- */
  readinessScore: number | null;
  onOpenReadiness: () => void;
  onOpenSettings?: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  readinessScore,
  onOpenReadiness,
  onOpenSettings,
}) => (
  <div
    id="hero-header-top-bar"
    className="relative z-10 flex items-center justify-between w-full select-none"
  >
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
      className="w-11 h-11 -ml-1.5 -mt-1.5 flex flex-col items-center justify-center gap-1 bg-transparent border-0 cursor-pointer active:scale-90 transition-transform"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson" />
      <span className="w-1.5 h-1.5 rounded-full bg-o1-amber-deep" />
      <span className="w-1.5 h-1.5 rounded-full bg-o1-sky" />
    </button>

    <button
      type="button"
      id="hero-readiness-btn"
      aria-label={
        readinessScore === null
          ? 'Log sleep to see readiness'
          : `Readiness ${readinessScore} percent`
      }
      onClick={(e) => {
        e.stopPropagation();
        tactileEngine.triggerSelectionBuzz();
        onOpenReadiness();
      }}
      className="h-11 -mr-1 -mt-1.5 px-3 rounded-full flex items-center gap-1.5 bg-transparent border-0 text-white cursor-pointer active:scale-95 transition-transform"
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
    >
      {readinessScore === null ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-o1-crimson" aria-hidden="true" />
          <span className="text-o1-caption font-medium text-white/90">Log sleep</span>
        </>
      ) : (
        <>
          <span className="text-o1-label font-semibold tracking-[0.08em] text-white/75">
            Readiness
          </span>
          <span className="text-o1-control font-mono font-medium tabular-nums">
            {readinessScore}%
          </span>
        </>
      )}
    </button>
  </div>
);
