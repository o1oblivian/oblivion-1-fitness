import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, ArrowRight, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { IAP_PRODUCTS, IAPProductInfo } from '../../types/iap';
import { tactileEngine } from '../../services/tactileEngine';
import { isNativeStorePlatform } from '../../services/purchasesService';
import { openLegalUrl } from '../../services/apiBase';
import { useSubscription } from '../../context/SubscriptionContext';
import { MembershipPlanCard } from './components/MembershipPlanCard';
import { MembershipPlanFeatures } from './components/MembershipPlanFeatures';
import { useStorePlans } from './useStorePlans';
import { useStorePurchase } from './useStorePurchase';

export interface MembershipPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (productId: string) => void;
  onCheckout?: (productId: string) => void;
  onOpenHealth?: () => void;
  onOpenDisclaimer?: () => void;
  onShowToast?: (msg: string) => void;
}

const ATHLETE_PRODUCTS: readonly IAPProductInfo[] = [
  IAP_PRODUCTS.founder_pass,
  IAP_PRODUCTS.core_free,
  IAP_PRODUCTS.premium,
];

const COACH_PRODUCTS: readonly IAPProductInfo[] = [IAP_PRODUCTS.coach_free, IAP_PRODUCTS.coach_pro];

export const MembershipPlansModal: React.FC<MembershipPlansModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  onCheckout,
  onOpenHealth,
  onOpenDisclaimer,
  onShowToast,
}) => {
  const [userType, setUserType] = useState<'athletes' | 'coaches'>('athletes');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    IAP_PRODUCTS.premium.productId,
  );
  const { restorePurchases } = useSubscription();
  const plans = useStorePlans(isOpen);
  const purchase = useStorePurchase();

  const nativeStore = isNativeStorePlatform();
  const currentProducts = userType === 'athletes' ? ATHLETE_PRODUCTS : COACH_PRODUCTS;
  const currentSelected =
    [...ATHLETE_PRODUCTS, ...COACH_PRODUCTS].find((p) => p.productId === selectedProductId) ||
    currentProducts[0];
  const isFreePlanSelected = currentSelected.isFree;
  const availability = plans.availability(currentSelected);
  const banner = purchase.error ?? plans.notice(currentSelected);

  const handleSelectPlan = (productId: string) => {
    purchase.clearError();
    setSelectedProductId(productId);
  };

  const handleSelectTab = (t: 'athletes' | 'coaches') => {
    tactileEngine.triggerSelectionBuzz();
    setUserType(t);
    handleSelectPlan(
      t === 'athletes' ? IAP_PRODUCTS.premium.productId : IAP_PRODUCTS.coach_pro.productId,
    );
  };

  const handleMainAction = async () => {
    tactileEngine.triggerSelectionBuzz();
    purchase.clearError();

    if (isFreePlanSelected) {
      tactileEngine.playPRCelebration();
      const message =
        userType === 'athletes'
          ? 'Core Free tier active • 90-day full access included!'
          : 'Coach Starter active • Up to 5 athletes, 15% fee on program sales.';
      onShowToast?.(message);
      if (onSelectPlan) onSelectPlan(selectedProductId);
      onClose();
      return;
    }

    if (availability === 'unavailable') {
      plans.retry();
      return;
    }

    if (await purchase.buy(selectedProductId)) {
      tactileEngine.playPRCelebration();
      if (onCheckout) onCheckout(selectedProductId);
      if (onSelectPlan) onSelectPlan(selectedProductId);
      onShowToast?.(`Subscribed to ${currentSelected.name}`);
      onClose();
    }
  };

  const handleRestore = async () => {
    tactileEngine.triggerSelectionBuzz();
    try {
      const success = await restorePurchases();
      if (success) {
        tactileEngine.playPRCelebration();
        onShowToast?.('Entitlements restored successfully.');
        onClose();
      } else {
        onShowToast?.('No prior active subscription found.');
      }
    } catch (err) {
      console.warn('[Membership] Restore failed:', err);
      onShowToast?.('No prior active subscription found.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      id="membership-plans-modal"
      className="fixed inset-0 z-[80] w-full bg-black o1-sheet-scrim o1-sheet-cover flex items-end justify-center select-none overflow-x-hidden"
      onClick={onClose}
    >
      <div
        className="o1-sheet-card o1-sheet-tall bg-o1-card border border-white/[0.07] text-white w-full flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b border-white/[0.05] bg-o1-card">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Choose Your Plan</h2>
            <p className="text-o1-label text-o1-muted font-num">O1FC Official Membership</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-o1-edge flex items-center justify-center text-o1-muted hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-4 sm:px-5 py-4 space-y-4 text-left flex-1 min-h-0">
          {/* Tab Switcher: Athletes | Coaches */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-o1-well rounded-2xl border border-white/[0.07]">
            {(['athletes', 'coaches'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTab(t)}
                className={`py-2 rounded-xl text-xs font-bold capitalize tracking-wider transition-all cursor-pointer ${
                  userType === t
                    ? 'bg-white/[0.08] text-white shadow-xs font-black'
                    : 'text-o1-muted hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Launch Special Banner (Athletes Tab) */}
          {userType === 'athletes' && (
            <div
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                handleSelectPlan(IAP_PRODUCTS.founder_pass.productId);
              }}
              className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between cursor-pointer hover:border-o1-crimson/50 transition-colors"
            >
              <div>
                <span className="text-o1-label font-num font-bold tracking-wider text-o1-stone">
                  Launch special
                </span>
                <p className="text-o1-label text-o1-muted mt-0.5 leading-snug">
                  <strong className="text-white">
                    {plans.priceOf(IAP_PRODUCTS.founder_pass)} Lifetime Founder Pass
                  </strong>{' '}
                  — Training OS Pro forever.
                </p>
              </div>
            </div>
          )}

          {/* Plans grid: two columns; a last plan with no partner takes the full row. */}
          <div className="grid grid-cols-2 gap-2.5">
            {currentProducts.map((p, index) => (
              <div
                key={p.productId}
                className={
                  index === currentProducts.length - 1 && currentProducts.length % 2 === 1
                    ? 'col-span-2 flex flex-col'
                    : 'flex flex-col'
                }
              >
                <MembershipPlanCard
                  product={{ ...p, price: plans.priceOf(p) }}
                  isSelected={selectedProductId === p.productId}
                  onSelect={handleSelectPlan}
                />
              </div>
            ))}
          </div>

          {/* Feature Comparison Matrix */}
          <MembershipPlanFeatures
            userType={userType}
            selectedProductId={selectedProductId}
            onOpenHealth={onOpenHealth}
            onOpenDisclaimer={onOpenDisclaimer}
            onShowToast={onShowToast}
          />

          {/* Billing Notice */}
          <div className="flex items-start gap-2 pt-1 text-o1-label text-o1-muted leading-snug">
            <Shield className="w-4 h-4 text-o1-olive shrink-0 mt-0.5" />
            <span>
              {isFreePlanSelected
                ? userType === 'athletes'
                  ? 'Core Free includes 90 days full access + permanent workout logger & hydration tracking. No credit card required.'
                  : 'Coach Starter includes up to 5 roster athletes, workout dispatch and the review studio. Program sales carry a 15% platform fee.'
                : nativeStore
                  ? 'In-App Subscription: Billed via Google Play or Apple App Store. Your Oblivion 1 Club Pass unlocks across all your devices.'
                  : 'Billed by the App Store or Google Play.'}
            </span>
          </div>

          {banner && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-o1-yellow/10 border border-o1-yellow/30 text-o1-yellow text-xs font-num text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{banner}</span>
            </div>
          )}

          {/* Main Action Button */}
          <button
            type="button"
            id="btn-subscribe-master"
            onClick={handleMainAction}
            disabled={purchase.busy || availability === 'loading'}
            className="w-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-tactical font-black text-xs py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {purchase.busy || availability === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{purchase.busy ? 'Opening the store...' : 'Loading store prices...'}</span>
              </>
            ) : isFreePlanSelected ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Continue with Free</span>
              </>
            ) : availability === 'unavailable' ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Retry store connection</span>
              </>
            ) : (
              <>
                <span>{nativeStore ? 'Subscribe with app store / google play' : 'subscribe'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {plans.detail ? (
            <p className="text-o1-label font-num text-o1-faint text-center break-words">
              {plans.detail}
            </p>
          ) : null}

          {/* Footer Links & Restore */}
          <div className="flex items-center justify-center gap-2.5 text-o1-label font-num text-o1-muted flex-wrap">
            <span>App Store or Google Play</span>
            <span>•</span>
            <span>Cancel Anytime</span>
            <span>•</span>
            <button
              type="button"
              onClick={handleRestore}
              className="hover:text-white underline cursor-pointer"
            >
              Restore Purchases
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => void openLegalUrl('terms')}
              className="hover:text-white underline cursor-pointer"
            >
              Terms of Use
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => void openLegalUrl('privacy')}
              className="hover:text-white underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
