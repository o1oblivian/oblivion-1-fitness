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
        className="group bg-o1-card border border-white/[0.07] hover:border-white/[0.14] rounded-2xl px-3.5 py-2.5 shadow-sm transition-all mb-3 cursor-pointer select-none flex items-center justify-between gap-3 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Subtle tactical icon container */}
          <div className="w-9 h-9 rounded-xl bg-o1-well text-neutral-200 border border-white/[0.07] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-o1-crimson" />
          </div>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-tactical font-black text-white tracking-wider uppercase leading-snug truncate">
                Intel Coach
              </h4>
              <span className="text-[9px] font-tactical font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-400 border border-white/[0.07]">
                PRO INTEL
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight truncate mt-0.5">
              Live load telemetry, ACWR fatigue &amp; calibrated prescription
            </p>
          </div>
        </div>

        {/* Right Action Chevron */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <IntelCoachIntelligenceModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default IntelCoachIntelligenceCard;
