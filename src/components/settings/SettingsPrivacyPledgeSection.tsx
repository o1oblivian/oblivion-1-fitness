import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, Ban, HardDrive, Smartphone, ChevronDown, ChevronUp, Sparkles, Check } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

export const SettingsPrivacyPledgeSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-tactical tracking-wider text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          The Oblivion 1 Athlete Trust &amp; Privacy Pledge
        </h3>
      </div>

      <div className="bg-white dark:bg-[#121214] rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 p-4 space-y-3 shadow-xs">
        {/* Top Highlight Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-tactical font-black uppercase text-neutral-900 dark:text-white">
                  PRIVATE ENCRYPTED VAULT • ZERO AD BLOAT
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-sans">
                Your personal records, biometrics, and nutrition logs are strictly isolated to your private account and encrypted in transit. Never sold or shared with 3rd parties.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer transition active:scale-95 shrink-0"
            aria-label="Expand privacy pledge details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* 3 Core Trust Badges */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Ban className="w-3 h-3" />
            </div>
            <div className="text-[10px] font-tactical font-bold uppercase text-neutral-900 dark:text-white">
              Zero Ads
            </div>
            <p className="text-[9px] text-neutral-500 font-mono leading-tight">
              No trackers, banners, or popups
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <EyeOff className="w-3 h-3" />
            </div>
            <div className="text-[10px] font-tactical font-bold uppercase text-neutral-900 dark:text-white">
              Never Sold
            </div>
            <p className="text-[9px] text-neutral-500 font-mono leading-tight">
              No 3rd-party data brokerage
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HardDrive className="w-3 h-3" />
            </div>
            <div className="text-[10px] font-tactical font-bold uppercase text-neutral-900 dark:text-white">
              Local Vault
            </div>
            <p className="text-[9px] text-neutral-500 font-mono leading-tight">
              Stored in secure sandbox storage
            </p>
          </div>
        </div>

        {/* Expanded Educational Details */}
        {isExpanded && (
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/80 space-y-2 text-[11px] text-neutral-600 dark:text-neutral-300 font-sans leading-relaxed animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-900 dark:text-white">No mandatory cloud account:</strong> You don't need to surrender your personal life, phone number, or social media to train.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-900 dark:text-white">Basement Gym Resilience:</strong> Your logs, rest timers, and formulas calculate instantly with zero cellular signal or Wi-Fi.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-900 dark:text-white">Total Ownership &amp; Export:</strong> Export your complete training vault anytime into raw JSON or delete it with a single tap.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SettingsPrivacyPledgeSection;
