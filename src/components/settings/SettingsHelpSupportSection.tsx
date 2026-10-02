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
      <h3 className="text-xs font-tactical tracking-wider text-neutral-500 dark:text-neutral-400 font-bold uppercase px-1">
        Help, Support &amp; Legal Compliance
      </h3>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-black/5 dark:border-neutral-800 shadow-md p-4 space-y-3">
        <div
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenTutorial(); }}
          className="flex items-center justify-between gap-3 cursor-pointer group py-1"
        >
          <span className="text-xs font-sans font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-[#C4121A] dark:group-hover:text-white">
            System Onboarding Tutorial
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white shrink-0" />
        </div>

        <div
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenHelpCenter(); }}
          className="pt-2 border-t border-black/5 dark:border-neutral-800/80 flex items-center justify-between gap-3 cursor-pointer group py-1"
        >
          <span className="text-xs font-sans font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-[#C4121A] dark:group-hover:text-white">
            Help Centre &amp; Telemetry Manual
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white shrink-0" />
        </div>

        <div
          onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenContactSupport(); }}
          className="pt-2 border-t border-black/5 dark:border-neutral-800/80 flex items-center justify-between gap-3 cursor-pointer group py-1"
        >
          <span className="text-xs font-sans font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-[#C4121A] dark:group-hover:text-white">
            Contact Support &amp; Club HQ
          </span>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white shrink-0" />
        </div>

        <div className="pt-2 border-t border-black/5 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onSendFeedback(); }}
            className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#09090b] dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-tactical font-semibold uppercase transition-all cursor-pointer active:scale-[0.99]"
          >
            Send Feedback
          </button>
        </div>

        {/* Legal & App Store Compliance Links */}
        <div className="pt-3 border-t border-black/5 dark:border-neutral-800/80 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenTerms(); }}
            className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-[#09090b] dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-sans flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); if (onOpenPrivacy) onOpenPrivacy(); else onOpenTerms(); }}
            className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-[#09090b] dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-sans flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span>Privacy Policy</span>
          </button>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onOpenCitations(); }}
            className="w-full py-1.5 text-center text-[11px] font-sans text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
