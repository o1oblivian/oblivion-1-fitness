import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { revenueCatService } from '../../../services/revenueCatService';
import { useAuthStore } from '../../../stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: string;
  onSuccess?: (planId: string) => void;
  onShowToast?: (msg: string) => void;
}

export const MembershipCheckoutModal: React.FC<Props> = ({
  isOpen,
  onClose,
  planId,
  planName,
  price,
  onSuccess,
  onShowToast,
}) => {
  const user = useAuthStore((s) => s.user);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNativeStorePurchase = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    tactileEngine.triggerSelectionBuzz();

    try {
      const res = await revenueCatService.purchasePackage(planId, user?.id || 'default-athlete');
      if (res.success) {
        tactileEngine.playPRCelebration();
        onSuccess?.(planId);
        onShowToast?.(`Subscribed to ${planName}`);
        onClose();
      } else {
        setStatusMessage(res.error || 'Membership Tier Available via App Store / Google Play');
      }
    } catch (err: any) {
      setStatusMessage('Membership Tier Available via App Store / Google Play');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 select-none animate-in fade-in duration-150 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] h-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C4121A]/10 border border-[#C4121A]/30 flex items-center justify-center text-[#C4121A]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-tactical font-black uppercase text-neutral-900 dark:text-white tracking-wider">
                STORE BILLING
              </h2>
              <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                APP STORE & GOOGLE PLAY
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
                Selected Plan
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C4121A]/15 text-[#C4121A] font-bold">
                OFFICIAL TIER
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <h3 className="text-sm font-tactical font-black uppercase text-neutral-900 dark:text-white">
                {planName}
              </h3>
              <span className="text-sm font-mono font-black text-[#C4121A]">
                {price}
              </span>
            </div>
          </div>

          {/* Clean Status Banner for Native Store Billing */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#C4121A] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
                Membership Tier Available via App Store / Google Play
              </span>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed">
                In compliance with Apple App Store Guideline 3.1.1 and Google Play Billing, all digital memberships and coaching tiers are securely managed through your operating system store account.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0e] space-y-2.5">
          <button
            type="button"
            onClick={handleNativeStorePurchase}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-[#C4121A] hover:bg-[#A30F16] active:bg-[#800C11] text-white font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>CONNECTING TO STORE...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>SUBSCRIBE VIA APP STORE / GOOGLE PLAY</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] font-sans text-neutral-500 dark:text-neutral-400">
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Terms of Use (EULA)
            </a>
            <span>•</span>
            <a
              href="https://www.apple.com/legal/privacy/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckoutModal;
