import React, { useState } from 'react';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { WeeklyReportModal } from './WeeklyReportModal';

interface WeeklyReportCardProps {
  onViewFullReport?: () => void;
  onClick?: () => void;
}

export const WeeklyReportCard: React.FC<WeeklyReportCardProps> = ({ onViewFullReport, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    tactileEngine.triggerSelectionBuzz();
    if (onClick) {
      onClick();
    } else {
      setIsOpen(true);
      onViewFullReport?.();
    }
  };

  return (
    <>
      <div
        id="card-weekly-report"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Open Weekly Report Card"
        className="group bg-o1-card border border-white/[0.07] hover:border-white/[0.14] rounded-2xl px-3.5 py-2.5 shadow-sm transition-all mb-2 cursor-pointer select-none flex items-center justify-between gap-3 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Blue-ish icon container */}
          <span className="o1-mark text-o1-teal">
            <ClipboardCheck />
          </span>

          {/* Title & Subtitle */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-tactical font-black text-white tracking-wider leading-snug truncate">
              Weekly Report Card
            </h4>
            <p className="text-[11px] text-neutral-400 leading-tight truncate mt-0.5">
              Grade your week — training, nutrition, sleep &amp; steps
            </p>
          </div>
        </div>

        {/* Right Action Chevron */}
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <WeeklyReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default WeeklyReportCard;
