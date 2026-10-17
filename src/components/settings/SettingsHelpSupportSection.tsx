import React from 'react';
import { ChevronRight, FileText, Lock, ShieldAlert } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface HelpSupportSectionProps {
  onOpenTutorial: () => void;
  onOpenHelpCenter: () => void;
  onOpenContactSupport: () => void;
  onSendFeedback: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy?: () => void;
  onOpenCitations: () => void;
}

const NavRow: React.FC<{ label: string; first?: boolean; onClick: () => void }> = ({ label, first, onClick }) => (
  <button
    type="button"
    onClick={() => { tactileEngine.triggerSelectionBuzz(); onClick(); }}
    className={`w-full min-h-[44px] flex items-center justify-between gap-3 cursor-pointer group text-left ${
      first ? '' : 'border-t border-white/[0.05]'
    }`}
  >
    <span className="text-xs font-sans font-medium text-neutral-300 group-hover:text-white">{label}</span>
    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
  </button>
);

export const SettingsHelpSupportSection: React.FC<HelpSupportSectionProps> = ({
  onOpenTutorial,
  onOpenHelpCenter,
  onOpenContactSupport,
  onSendFeedback,
  onOpenTerms,
  onOpenPrivacy,
  onOpenCitations,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold px-1">
        Help, Support &amp; Legal Compliance
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-md p-3 space-y-1.5">
        <NavRow first label="System Onboarding Tutorial" onClick={onOpenTutorial} />
        <NavRow label="Help Centre & Telemetry Manual" onClick={onOpenHelpCenter} />
        <NavRow label="Contact Support & Club HQ" onClick={onOpenContactSupport} />

        <div className="pt-2 border-t border-white/[0.05] flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onSendFeedback(); }}
            className="o1-pill border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-sans font-semibold transition-all cursor-pointer active:scale-95"
          >
            Send feedback
          </button>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenTerms(); }}
            className="o1-pill border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-sans font-semibold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>Terms</span>
          </button>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); if (onOpenPrivacy) onOpenPrivacy(); else onOpenTerms(); }}
            className="o1-pill border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-xs font-sans font-semibold cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#4F8F9A]" />
            <span>Privacy</span>
          </button>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenCitations(); }}
            className="w-full min-h-[44px] text-center text-[11px] font-sans text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Health &amp; Biomechanical Disclaimers</span>
          </button>
        </div>
      </div>
    </div>
  );
};

