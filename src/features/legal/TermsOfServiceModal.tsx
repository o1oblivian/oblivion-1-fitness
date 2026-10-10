import React from 'react';
import { X, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] p-5 shadow-xl flex flex-col text-white overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-o1-crimson/10 border border-o1-crimson/30">
              <FileText className="w-4 h-4 text-o1-crimson" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-neutral-100">Terms of Service</h2>
              <p className="text-[10px] font-mono text-neutral-400">Apple &amp; Google Distribution Compliance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full bg-o1-card border border-white/[0.07] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto no-scrollbar py-4 space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-[#4F8F9A] font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1. Subscription Billing &amp; Auto-Renewal</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Club Pass Pro subscriptions ($9.99/mo) are billed directly through your Apple ID or Google Play Account. Subscriptions automatically renew unless auto-renew is cancelled at least 24 hours prior to the end of the billing cycle in App Store or Play Store account settings.
            </p>
          </div>

          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-o1-crimson font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>2. Biomechanical &amp; Physical Liability Release</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Oblivion 1 Fitness Club training protocols involve strenuous physical exertion. By utilizing workout tracking, 1RM calculators, and cardio telemetry, you certify you are medically cleared and voluntarily assume all risks of injury. Oblivion 1 disclaims all biomechanical liabilities.
            </p>
          </div>

          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <span>3. Community &amp; Spotter Code of Conduct</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Athletes utilizing the Buddy Match Radar agree to zero harassment, respect gym floor etiquette, and practice certified spotter vigilance. Harassment or misconduct results in immediate banishment and revocation of club credentials without refund.
            </p>
          </div>

          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4. Local-First Architecture &amp; Data Ownership</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Oblivion 1 operates on a local-first model. Workout data, roster files, and nutrition telemetry reside on the user's hardware. Users maintain complete ownership of their local vault and are responsible for maintaining their exported backups.
            </p>
          </div>

          <div className="py-3 border-b border-white/[0.05] space-y-1.5 last:border-0">
            <div className="text-[11px] text-neutral-200 font-bold">5. Governing Law</div>
            <p className="text-[11px] text-neutral-400">
              Governed by commercial digital distribution standards of Apple Inc. and Google LLC. Contact: legal@oblivion1.club.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => { tactileEngine.triggerSelectionBuzz(); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-neutral-950 font-mono text-xs font-semibold tracking-wide cursor-pointer transition active:scale-[0.98]"
          >
            Acknowledge &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};
export default TermsOfServiceModal;
