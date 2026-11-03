import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { IAP_PRODUCTS, IAPProductInfo } from '../../types/iap';
import { tactileEngine } from '../../services/tactileEngine';
import { isNativeStorePlatform } from '../../services/purchasesService';
import { LEGAL_URLS, openLegalUrl } from '../../services/apiBase';
import { planKind } from '../../services/revenueCatService';
import { storeCopy } from '../../utils/storeCopy';
import { useSubscription } from '../../context/SubscriptionContext';
import { MembershipPlanCard } from './components/MembershipPlanCard';
import { MembershipPlanFeatures } from './components/MembershipPlanFeatures';
import { StorePlansState } from './components/StorePlansState';
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
  IAP_PRODUCTS.premium,
];

const COACH_PRODUCTS: readonly IAPProductInfo[] = [IAP_PRODUCTS.coach_pro];

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
  const store = storeCopy();
  const currentProducts = plans.offered(
    userType === 'athletes' ? ATHLETE_PRODUCTS : COACH_PRODUCTS,
  );
  const currentSelected =
    currentProducts.find((p) => p.productId === selectedProductId) ?? currentProducts[0] ?? null;

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
    if (!currentSelected) return;
    tactileEngine.triggerSelectionBuzz();
    purchase.clearError();
    if (await purchase.buy(currentSelected.productId)) {
      tactileEngine.playPRCelebration();
      if (onCheckout) onCheckout(currentSelected.productId);
      if (onSelectPlan) onSelectPlan(currentSelected.productId);
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
      onShowToast?.(
        err instanceof Error
          ? err.message
          : 'Could not reach the store. Check your connection and try again.',
      );
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

          <StorePlansState plans={plans} offeredCount={currentProducts.length} />

          {/* Plans grid: two columns; a last plan with no partner takes the full row. */}
          {currentProducts.length > 0 && (
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
                    product={p}
                    price={plans.priceOf(p) ?? ''}
                    isSelected={currentSelected?.productId === p.productId}
                    onSelect={handleSelectPlan}
                    founder={plans.founder}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Feature Comparison Matrix */}
          <MembershipPlanFeatures
            userType={userType}
            onOpenHealth={onOpenHealth}
            onOpenDisclaimer={onOpenDisclaimer}
            onShowToast={onShowToast}
          />

          {/* Billing Notice */}
          <div className="flex items-start gap-2 pt-1 text-o1-label text-o1-muted leading-snug">
            <Shield className="w-4 h-4 text-o1-olive shrink-0 mt-0.5" />
            <span>{nativeStore ? store.subscriptionNotice : 'Billed by the store.'}</span>
          </div>

          {purchase.error && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-o1-yellow/10 border border-o1-yellow/30 text-o1-yellow text-xs font-num text-center flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{purchase.error}</span>
            </div>
          )}

          {/* Main Action Button */}
          {currentSelected && (
            <button
              type="button"
              id="btn-subscribe-master"
              onClick={handleMainAction}
              disabled={purchase.busy}
              className="w-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-tactical font-black text-xs py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {purchase.busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Opening the store...</span>
                </>
              ) : (
                <>
                  <span>{nativeStore ? store.subscribeLabel : 'Subscribe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {currentSelected && planKind(currentSelected.productId) !== 'lifetime' && (
            <p className="text-xs font-num text-o1-text text-center leading-snug">
              {currentSelected.name}. Length: 1 month.
              {plans.priceOf(currentSelected)
                ? ` Price: ${plans.priceOf(currentSelected)}.`
                : ''}
            </p>
          )}

          <p className="text-xs font-num text-o1-muted text-center leading-snug">
            {currentSelected && planKind(currentSelected.productId) === 'lifetime'
              ? `Founder Pass is a one-time, non-recurring purchase. Billed via ${store.billedBy}.`
              : store.renewalDisclosure}
          </p>

          {/* Footer Links & Restore */}
          <div className="flex items-center justify-center gap-2.5 text-o1-label font-num text-o1-muted flex-wrap">
            <span>{store.footerName}</span>
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
            <a
              href={LEGAL_URLS.appleEula}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                void openLegalUrl('eula');
              }}
              className="hover:text-white underline cursor-pointer"
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
              className="hover:text-white underline cursor-pointer"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
