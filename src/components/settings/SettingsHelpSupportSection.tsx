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
      <h3 className="text-xs font-tactical tracking-wider text-neutral-400 font-bold uppercase px-1">
        Help, Support &amp; Legal Compliance
      </h3>

      <div className="bg-o1-card rounded-2xl border border-white/[0.07] shadow-md p-3 space-y-1.5">
        <div
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenTutorial(); }}
          className="flex items-center justify-between gap-3 cursor-pointer group py-1"
        >
          <span className="text-xs font-sans font-medium text-neutral-300 group-hover:text-white">
            System Onboarding Tutorial
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
        </div>

        <div
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenHelpCenter(); }}
          className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-3 cursor-pointer group py-1"
        >
          <span className="text-xs font-sans font-medium text-neutral-300 group-hover:text-white">
            Help Centre &amp; Telemetry Manual
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
        </div>

        <div
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenContactSupport(); }}
          className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-3 cursor-pointer group py-1"
        >
          <span className="text-xs font-sans font-medium text-neutral-300 group-hover:text-white">
            Contact Support &amp; Club HQ
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white shrink-0" />
        </div>

        <div className="pt-2 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onSendFeedback(); }}
            className="w-full py-2.5 rounded-xl border border-white/[0.07] bg-black hover:bg-white/[0.06] text-neutral-300 hover:text-white text-xs font-tactical font-semibold uppercase transition-all cursor-pointer active:scale-[0.99]"
          >
            Send Feedback
          </button>
        </div>

        {/* Legal & App Store Compliance Links */}
        <div className="pt-3 border-t border-white/[0.05] grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenTerms(); }}
            className="p-2.5 rounded-xl bg-black hover:bg-white/[0.06] border border-white/[0.07] text-neutral-300 hover:text-white text-xs font-sans flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-o1-crimson" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); if (onOpenPrivacy) onOpenPrivacy(); else onOpenTerms(); }}
            className="p-2.5 rounded-xl bg-black hover:bg-white/[0.06] border border-white/[0.07] text-neutral-300 hover:text-white text-xs font-sans flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Privacy Policy</span>
          </button>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenCitations(); }}
            className="w-full py-1.5 text-center text-[11px] font-sans text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Health &amp; Biomechanical Disclaimers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsHelpSupportSection;
