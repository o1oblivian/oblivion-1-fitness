import React, { useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { SupplementTracker } from '../SupplementTracker';

interface SupplementMatrixIntakeLogProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  currentUserEmail: string;
}

export const SupplementMatrixIntakeLog: React.FC<SupplementMatrixIntakeLogProps> = ({ showToast, currentUserEmail }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Collapsible Header — tappable to toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs select-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0 text-left">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Supplement Matrix & Intake Log
            </h2>
            <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              {isOpen ? 'Tap to collapse matrix' : 'Intelligent chrono-timing, live catalog & bio-telemetry'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="mt-1.5 animate-in fade-in duration-150">
          <SupplementTracker showToast={showToast} currentUserEmail={currentUserEmail} />
        </div>
      )}
    </div>
  );
};

