import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { CoachMarketplaceProgram } from '../types/coachPlatformTypes';
import { tactileEngine } from '../../../services/tactileEngine';

export interface O1FClubProgramStoreProps {
  programs?: CoachMarketplaceProgram[];
  onSelectProgram?: (program: CoachMarketplaceProgram) => void;
}

export const O1FClubProgramStore: React.FC<O1FClubProgramStoreProps> = ({
  programs = [],
  onSelectProgram,
}) => {
  const safePrograms = (programs ?? []).filter((p) => Boolean(p && p.id && p.title));

  return (
    <div className="space-y-3 select-none">
      {safePrograms.length === 0 ? (
        <div className="border border-white/[0.07] bg-o1-card rounded-2xl p-6 text-center space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
          </div>
          <h4 className="text-xs font-semibold text-neutral-200">No programs yet</h4>
          <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
            A coach’s program shows up here after they publish it.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {safePrograms.map((prog) => (
            <div
              key={prog.id}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (onSelectProgram) onSelectProgram(prog);
              }}
              className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] hover:border-o1-crimson/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                {prog.coverImage && (
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-o1-well border border-white/[0.07]">
                    <img
                      src={prog.coverImage}
                      alt={prog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[9.5px] font-mono font-bold text-o1-crimson tracking-wider">
                    {prog.difficulty || 'VERIFIED'}
                  </span>
                  {typeof prog.priceUsd === 'number' && (
                    <span className="text-xs font-mono font-bold text-white">
                      ${prog.priceUsd}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-tactical font-black text-sm text-white group-hover:text-o1-crimson transition-colors line-clamp-1">
                    {prog.title}
                  </h4>
                  {prog.description && (
                    <p className="text-[11px] text-neutral-400 font-sans line-clamp-2 mt-1">
                      {prog.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default O1FClubProgramStore;
