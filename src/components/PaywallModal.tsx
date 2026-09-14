import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { purchaseSubscription, restorePurchases } from '../services/iapService';
import { X, Check, ShieldCheck, RefreshCw, ExternalLink, Loader2, Sparkles, CreditCard, AlertCircle } from 'lucide-react';

export interface IAPProductInfo {
  id: string;
  name: string;
  price: string;
  description: string;
  productId: string;
}

export const IAP_PRODUCTS: Record<string, IAPProductInfo> = {
  premium: {
    id: 'premium',
    productId: 'com.o1fc.fitness.plus_monthly',
    name: 'O1FC Plus (50km Radius)',
    price: '$9.99/mo',
    description: 'Full workout OS, Fuel macro intelligence & 50km Buddy radar',
  },
  premium_travel: {
    id: 'premium_travel',
    productId: 'com.o1fc.fitness.travel_monthly',
    name: 'O1FC Global VIP (Travel Pass)',
    price: '$15.99/mo',
    description: 'Unlimited worldwide Buddy Radar, PostGIS global matching & AI Coach Insights',
  },
  coach_pro: {
    id: 'coach_pro',
    productId: 'com.o1fc.fitness.coach_pro_monthly',
    name: 'O1FC Coach Pro (Unlimited)',
    price: '$29.99/mo',
    description: 'Unlimited athlete roster, automated workout dispatch, transformation studio & video monetization',
  },
};

export const TERMS_OF_SERVICE_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_POLICY_URL = 'https://o1fc-official-1.ai.studio';

function getAppPlatform(): 'ios' | 'android' | 'web' {
  try {
    if (Capacitor.isNativePlatform()) {
      const p = Capacitor.getPlatform();
      if (p === 'ios') return 'ios';
      if (p === 'android') return 'android';
    }
  } catch {}
  return 'web';
}

function applyLocalSubscription(tier: string, provider: 'apple_iap' | 'google_play' | 'stripe' = 'apple_iap') {
  try {
    localStorage.setItem(
      'o1fc_active_subscription',
      JSON.stringify({
        tier,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        provider,
        status: 'active',
      })
    );
    localStorage.setItem('o1fc_cached_tier', tier);
    window.dispatchEvent(new CustomEvent('o1fc-subscription-updated', { detail: { tier, provider } }));
    window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: { subscription_tier: tier } }));
  } catch {}
}

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTier?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  defaultTier = 'premium',
  showToast = () => {},
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>(defaultTier || 'premium');
  const [loading, setLoading] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nativeNotice, setNativeNotice] = useState<string | null>(null);
  const platform = getAppPlatform();
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isNative = isIOS || isAndroid;

  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(defaultTier || 'premium');
      setErrorMessage(null);
      setNativeNotice(null);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, defaultTier]);

  const handlePurchase = useCallback(async () => {
    setErrorMessage(null);
    setNativeNotice(null);
    setLoading(true);

    try {
      const customerInfo: any = await purchaseSubscription('com.o1fc.fitness.plus_monthly');
      const isSubscribed =
        customerInfo?.success ||
        customerInfo?.entitlements?.active?.['pro'] !== undefined ||
        customerInfo?.entitlements?.active?.['O1FC Plus (50km Radius)'] !== undefined ||
        Object.keys(customerInfo?.entitlements?.active || {}).length > 0;

      if (isSubscribed) {
        applyLocalSubscription('premium', isIOS ? 'apple_iap' : 'google_play');
        const providerName = isIOS ? 'Apple Pay' : 'Google Play';
        showToast(`${providerName} Confirmed — Membership Unlocked.`, 'success');
        onClose();
      } else {
        // DO NOT dismiss or close the modal if the purchase fails or returns an error.
        const errMsg = customerInfo?.message || 'Failed to complete transaction.';
        setErrorMessage(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      // DO NOT dismiss or close the modal if the purchase fails or returns an error.
      const errMsg = err?.message || String(err) || 'Payment transaction failed.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [isIOS, showToast, onClose]);

  const handleRestore = useCallback(async () => {
    setRestoring(true);
    setErrorMessage(null);
    setNativeNotice(null);
    try {
      const res = await restorePurchases();
      if (res && res.success) {
        showToast('Purchases restored successfully.', 'success');
        onClose();
      } else {
        const msg = res?.message || 'No active subscriptions found to restore.';
        setErrorMessage(msg);
        showToast(msg, 'info');
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err) || 'Unable to restore purchases.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setRestoring(false);
    }
  }, [showToast, onClose]);

  if (!isOpen) return null;

  const currentPlan = IAP_PRODUCTS[selectedPlan] || IAP_PRODUCTS.premium;

  const getButtonLabel = () => {
    if (loading) {
      return 'Connecting to store...';
    }
    if (isAndroid) return 'SUBSCRIBE WITH GOOGLE PLAY';
    return 'SUBSCRIBE WITH APPLE PAY';
  };

  return (
    <div
      id="paywall-overlay"
      className="fixed inset-0 z-[99990] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain p-0 sm:p-4 transition-opacity duration-200"
      style={{ minHeight: '100vh', WebkitOverflowScrolling: 'touch' }}
    >
      <div
        id="paywall-container"
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#121214] text-white border border-white/10 shadow-2xl my-auto flex flex-col max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 24px))' }}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-[#121214]/95 backdrop-blur-xl border-b border-white/10 px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C4121A] animate-pulse" />
              <h2 className="text-base font-black uppercase tracking-wider text-white">Oblivion 1 Club Pass</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isIOS
                ? 'Official Apple Subscription & Training OS'
                : isAndroid
                ? 'Official Google Play Subscription & Training OS'
                : 'Pro Subscription & Athletic Intelligence'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-4 space-y-4 flex-1">
          {/* Plan Selection Cards */}
          <div className="space-y-2.5">
            {Object.values(IAP_PRODUCTS)
              .filter((p) => p.id === 'premium' || p.id === 'premium_travel' || p.id === 'coach_pro')
              .map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#C4121A]/15 border-[#C4121A] ring-1 ring-[#C4121A]'
                        : 'bg-zinc-900/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{plan.name}</span>
                        {plan.id === 'premium' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#C4121A] text-white">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="text-sm font-extrabold text-white">{plan.price}</div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Auto-renew</div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Feature highlights */}
          <div className="bg-zinc-900/40 rounded-xl p-3.5 border border-white/5 space-y-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#C4121A] shrink-0" />
              <span>Full Workout Operating System with Telemetry Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#C4121A] shrink-0" />
              <span>50km Buddy Proximity Radar & Real-Time Partner Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#C4121A] shrink-0" />
              <span>AI Fuel Macro Intelligence & Unlimited Video Vault</span>
            </div>
          </div>

          {/* In-app Notice/Alert for Preview or Error Banner */}
          {nativeNotice && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{nativeNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="space-y-2.5 pt-1">
            <button
              id="btn-iap-subscribe"
              type="button"
              disabled={loading}
              onClick={handlePurchase}
              className="w-full h-12 min-h-[48px] rounded-full bg-[#C4121A] hover:bg-[#a50f16] active:bg-[#850b11] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{getButtonLabel()}</span>
                </>
              ) : (
                <>
                  {isNative ? <Sparkles className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  <span>{getButtonLabel()}</span>
                </>
              )}
            </button>

            {/* Footer with Security Badge and Restore Purchases Button */}
            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {isIOS
                    ? 'Apple In-App Purchase'
                    : isAndroid
                    ? 'Google Play Billing'
                    : '256-Bit SSL Encryption'}
                </span>
              </div>
              <button
                id="btn-iap-restore"
                type="button"
                disabled={restoring}
                onClick={handleRestore}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-bold underline transition-colors cursor-pointer disabled:opacity-50"
              >
                {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Restore Purchases</span>
              </button>
            </div>
          </div>

          {/* Legal Subscription Terms & Direct Links */}
          <div className="pt-2 border-t border-white/10 text-[10px] text-zinc-400 leading-relaxed space-y-1.5">
            <p>
              Subscription automatically renews monthly unless auto-renew is turned off at least 24 hours before the end of the current billing period. Manage subscriptions in Account Settings, Apple ID, or Google Play account after purchase.
            </p>
            <div className="flex items-center justify-center gap-4 pt-1 font-semibold text-zinc-300">
              <a
                href={TERMS_OF_SERVICE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-white underline flex items-center gap-1"
              >
                <span>Terms of Service</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span>•</span>
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-white underline flex items-center gap-1"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
