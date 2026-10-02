import React from 'react';
import { Flame, ArrowRight, ShieldCheck } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { CoachMarketplaceProgram } from '../types/coachPlatformTypes';

interface AthleteFeaturedProtocolsProps {
  programs: CoachMarketplaceProgram[];
  onSelectProgram: (program: CoachMarketplaceProgram) => void;
}

export const AthleteFeaturedProtocols: React.FC<AthleteFeaturedProtocolsProps> = ({
  programs,
  onSelectProgram,
}) => {
  return (
    <section className="space-y-3 select-none">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#C4121A]" />
          <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-900 dark:text-white uppercase">
            FEATURED PROTOCOLS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-500 uppercase">
          CLUB PROGRAM STORE
        </span>
      </div>

      <div className="flex items-stretch gap-3 overflow-x-auto scrollbar-none pb-1 pt-0.5">
        {programs.map((prog) => (
          <div
            key={prog.id}
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onSelectProgram(prog);
            }}
            className="w-64 sm:w-72 shrink-0 bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-all cursor-pointer shadow-sm group active:scale-[0.99]"
          >
            <div className="space-y-2.5">
              <div className="relative h-28 rounded-2xl overflow-hidden bg-neutral-900">
                <img
                  src={prog.coverImage}
                  alt={prog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#C4121A] text-white uppercase shadow-sm">
                    {prog.difficulty}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-mono">
                  <span>{prog.durationWeeks} WEEKS</span>
                  <span className="font-bold text-amber-400">${prog.priceUsd}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-[#C4121A] transition-colors">
                  {prog.title}
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {prog.tagline || prog.description}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-neutral-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>By {prog.coachName}</span>
              </div>
              <span className="font-bold text-[#C4121A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>VIEW</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
