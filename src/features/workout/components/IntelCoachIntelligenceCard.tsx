import React, { useState } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { IntelCoachIntelligenceModal } from './IntelCoachIntelligenceModal';

interface IntelCoachIntelligenceCardProps {
  onOpenDesigner?: () => void;
}

export const IntelCoachIntelligenceCard: React.FC<IntelCoachIntelligenceCardProps> = ({
  onOpenDesigner,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsOpen(true);
    onOpenDesigner?.();
  };

  return (
    <>
      <div
        id="card-intel-coach-intelligence"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Open Intel Coach Intelligence"
        className="group bg-white dark:bg-[#121214] border border-black/5 dark:border-white/10 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-2xl px-3.5 py-2.5 shadow-sm transition-all mb-3 cursor-pointer select-none flex items-center justify-between gap-3 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Subtle tactical icon container */}
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#1a1a1e] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#C4121A]" />
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-tactical font-black text-neutral-900 dark:text-white tracking-wider uppercase leading-snug truncate">
                Intel Coach
              </h4>
              <span className="text-[9px] font-tactical font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                PRO INTEL
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate mt-0.5">
              Live load telemetry, ACWR fatigue &amp; calibrated prescription
            </p>
          </div>
        </div>

        {/* Right Action Chevron */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <IntelCoachIntelligenceModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default IntelCoachIntelligenceCard;
