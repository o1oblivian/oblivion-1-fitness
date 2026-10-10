import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { revenueCatService } from '../../../services/revenueCatService';
import { isNativeStorePlatform } from '../../../services/purchasesService';
import { getAuthenticatedUserId } from '../../../services/authUser';
import { LEGAL_URLS, openLegalUrl } from '../../../services/apiBase';
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
  const nativeStore = isNativeStorePlatform();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNativeStorePurchase = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    tactileEngine.triggerSelectionBuzz();

    try {
      const uid = user?.id || (await getAuthenticatedUserId());
      if (!uid) {
        setStatusMessage('Sign in to subscribe.');
        return;
      }
      const res = await revenueCatService.purchasePackage(planId, uid);
      if (res.success) {
        tactileEngine.playPRCelebration();
        onSuccess?.(planId);
        onShowToast?.(`Subscribed to ${planName}`);
        onClose();
      } else {
        setStatusMessage(nativeStore ? res.error || 'Store billing is unavailable.' : null);
      }
    } catch (err: any) {
      setStatusMessage(nativeStore ? 'Store billing is unavailable on this device.' : null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] overflow-hidden shadow-xl flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-o1-well border border-white/[0.07] flex items-center justify-center text-[#4F8F9A]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-tactical font-black text-white tracking-wider">
                Store Checkout
              </h2>
              <p className="text-[10px] font-mono text-neutral-400">
                {nativeStore ? 'App store & google play' : 'web preview'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-2xl bg-o1-well border border-white/[0.07] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-500">
                Selected Plan
              </span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-o1-card border border-[#D4A017]/40 text-[#D4A017] font-semibold">
                Official tier
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <h3 className="text-sm font-tactical font-black text-white">
                {planName}
              </h3>
              <span className="text-sm font-sans font-semibold text-white tabular-nums">
                {price}
              </span>
            </div>
          </div>

          {/* Clean Status Banner for Native Store Billing */}
          <div className="p-3.5 rounded-2xl bg-o1-well border border-white/[0.07] text-neutral-300 text-xs font-mono flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#6B8F5E] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-white tracking-wider text-[11px]">
                {nativeStore ? 'Membership Tier Available via App Store / Google Play' : 'Pay with card — local preview'}
              </span>
              <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                {nativeStore
                  ? 'In compliance with Apple App Store Guideline 3.1.1 and Google Play Billing, all digital memberships and coaching tiers are securely managed through your operating system store account.'
                  : 'Local browser checkout grants Pro on this device for development testing. Native iOS/Android builds open the store payment sheet.'}
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.05] bg-black space-y-2.5">
          <button
            type="button"
            onClick={handleNativeStorePurchase}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-tactical font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{nativeStore ? 'Connecting to STORE...' : 'unlocking pro...'}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{nativeStore ? 'Subscribe via app store / google play' : 'subscribe'}</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-3 text-[10px] font-sans text-neutral-400">
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
              href={LEGAL_URLS.privacy}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                void openLegalUrl('privacy');
              }}
              className="hover:underline"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a
              href={LEGAL_URLS.terms}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                void openLegalUrl('terms');
              }}
              className="hover:underline"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckoutModal;
