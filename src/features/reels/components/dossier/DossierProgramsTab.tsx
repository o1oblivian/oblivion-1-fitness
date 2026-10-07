import React from 'react';
import { CoachMarketplaceProgram } from '../../../coach/types/coachPlatformTypes';
import { tactileEngine } from '../../../../services/tactileEngine';

interface DossierProgramsTabProps {
  programs: CoachMarketplaceProgram[];
  onSelectProgram: (prog: CoachMarketplaceProgram) => void;
}

export const DossierProgramsTab: React.FC<DossierProgramsTabProps> = ({
  programs,
  onSelectProgram,
}) => {
  if (programs.length === 0) {
    return (
      <div className="py-8 text-center text-[10px] text-neutral-500 font-mono">
        No active programs currently published.
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="text-[10px] text-neutral-400 font-mono">
        Available Protocols
      </div>

      <div className="divide-y divide-white/[0.05]">
        {programs.map((prog) => (
          <div
            key={prog.id}
            onClick={() => {
              tactileEngine.triggerLightTick();
              onSelectProgram(prog);
            }}
            className="py-2.5 flex items-start justify-between gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="space-y-0.5 min-w-0">
              <span className="text-[9px] font-mono text-neutral-500 uppercase">
                {prog.durationWeeks} Wks • {prog.difficulty}
              </span>
              <h3 className="text-xs font-medium text-white group-hover:text-red-400 transition-colors truncate">
                {prog.title}
              </h3>
              <p className="text-[10.5px] text-neutral-400 line-clamp-1">
                {prog.description}
              </p>
            </div>

            {/* Price with no arrow */}
            <div className="text-right shrink-0 pt-0.5">
              <span className="text-xs font-mono font-medium text-white block">
                ${prog.priceUsd}
              </span>
              <span className="text-[9.5px] text-neutral-400 font-mono group-hover:text-white transition-colors">
                View
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
