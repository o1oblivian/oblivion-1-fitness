import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { IAP_PRODUCTS, IAPProductInfo } from '../../types/iap';
import { tactileEngine } from '../../services/tactileEngine';
import { REVENUECAT_FALLBACK_MONTHLY_PACKAGE, revenueCatService } from '../../services/revenueCatService';
import { isNativeStorePlatform } from '../../services/purchasesService';
import { useSubscription } from '../../context/SubscriptionContext';
import { MembershipPlanCard } from './components/MembershipPlanCard';
import { MembershipPlanFeatures } from './components/MembershipPlanFeatures';
import { getAuthenticatedUserId } from '../../services/authUser';
import { MembershipCheckoutModal } from './components/MembershipCheckoutModal';

export interface MembershipPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (productId: string) => void;
  onCheckout?: (productId: string) => void;
  onOpenHealth?: () => void;
  onOpenDisclaimer?: () => void;
  onShowToast?: (msg: string) => void;
}

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
    REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product.identifier
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [storeStatusBanner, setStoreStatusBanner] = useState<string | null>(null);
  const [monthlyStoreProduct, setMonthlyStoreProduct] = useState<IAPProductInfo>({
    productId: REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product.identifier,
    name: REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product.title,
    price: REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product.priceString,
    periodText: '/mo',
    description: 'Full training & fuel OS',
    badge: 'PRO',
    recommended: true,
    isFree: false,
    userType: 'athlete',
  });
  const { purchasePro, restorePurchases } = useSubscription();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    revenueCatService
      .getOfferings()
      .then((offerings) => {
        if (cancelled) return;
        const pkgs = revenueCatService.listPackages(offerings);
        const pkg =
          pkgs.find((p) => p.identifier === '$rc_monthly' || p.product?.identifier === 'o1fc_monthly_pro') ||
          pkgs[0] ||
          REVENUECAT_FALLBACK_MONTHLY_PACKAGE;
        const product = pkg.product || pkg.webCheckoutProduct || REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product;
        const next: IAPProductInfo = {
          productId: String(product.identifier || pkg.identifier || REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product.identifier),
          name: String(product.title || 'Monthly Pro Access'),
          price: String(product.priceString || '$9.99'),
          periodText: '/mo',
          description: 'Full training & fuel OS',
          badge: 'PRO',
          recommended: true,
          isFree: false,
          userType: 'athlete',
        };
        setMonthlyStoreProduct(next);
        setSelectedProductId((current) =>
          current === IAP_PRODUCTS.premium.productId || current === REVENUECAT_FALLBACK_MONTHLY_PACKAGE.product.identifier
            ? next.productId
            : current
        );
      })
      .catch(() => {
        /* fallback card already seeded */
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const athleteProducts: readonly IAPProductInfo[] = useMemo(
    () => [IAP_PRODUCTS.founder_pass, IAP_PRODUCTS.core_free, monthlyStoreProduct, IAP_PRODUCTS.premium_travel],
    [monthlyStoreProduct]
  );

  const coachProducts: readonly IAPProductInfo[] = [
    IAP_PRODUCTS.coach_free,
    IAP_PRODUCTS.coach_pro,
  ];

  const nativeStore = isNativeStorePlatform();

  const currentProducts = userType === 'athletes' ? athleteProducts : coachProducts;
  const currentSelected =
    [...athleteProducts, ...coachProducts].find((p) => p.productId === selectedProductId) ||
    currentProducts[0];

  const isFreePlanSelected = currentSelected.isFree;

  const handleSelectTab = (t: 'athletes' | 'coaches') => {
    tactileEngine.triggerSelectionBuzz();
    setUserType(t);
    setSelectedProductId(t === 'athletes' ? monthlyStoreProduct.productId : IAP_PRODUCTS.coach_pro.productId);
    setStoreStatusBanner(null);
  };

  const handleMainAction = async () => {
    tactileEngine.triggerSelectionBuzz();
    setStoreStatusBanner(null);

    if (isFreePlanSelected) {
      tactileEngine.playPRCelebration();
      const message =
        userType === 'athletes'
          ? 'Core Free tier active • 90-day full access included!'
          : 'Coach Starter active • Up to 5 athletes, 15% fee on program sales.';
      onShowToast?.(message);
      if (onSelectPlan) onSelectPlan(selectedProductId);
      onClose();
    } else {
      setIsPurchasing(true);
      try {
        const uid = await getAuthenticatedUserId();
        if (!uid) {
          setStoreStatusBanner('Sign in to subscribe.');
          return;
        }
        const res = await revenueCatService.purchasePackage(selectedProductId, uid);
        if (res.success) {
          tactileEngine.playPRCelebration();
          await purchasePro(selectedProductId);
          if (onCheckout) onCheckout(selectedProductId);
          if (onSelectPlan) onSelectPlan(selectedProductId);
          onShowToast?.(`Subscribed to ${currentSelected.name}`);
          onClose();
        } else {
          setStoreStatusBanner(res.error || (nativeStore ? 'Store billing is unavailable.' : null));
        }
      } catch (err: any) {
        setStoreStatusBanner(nativeStore ? 'Store billing is unavailable on this device.' : null);
      } finally {
        setIsPurchasing(false);
      }
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
    <>
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
              <h2 className="text-sm font-bold text-white tracking-wide">
                Choose Your Plan
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                O1FC Official Membership
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
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
                      : 'text-neutral-400 hover:text-white'
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
                  setSelectedProductId(IAP_PRODUCTS.founder_pass.productId);
                }}
                className="p-3 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-between cursor-pointer hover:border-o1-crimson/50 transition-colors"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-300">
                    Launch special
                  </span>
                  <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    <strong className="text-white">{IAP_PRODUCTS.founder_pass.price} Lifetime Founder Pass</strong> — Training OS Pro + Global Radar forever.
                  </p>
                </div>
              </div>
            )}

            {/* Plans Grid: 2x2 for Athletes, 2 cols for Coaches */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentProducts.map((p) => (
                <MembershipPlanCard
                  key={p.productId}
                  product={p}
                  isSelected={selectedProductId === p.productId}
                  onSelect={setSelectedProductId}
                />
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
            <div className="flex items-start gap-2 pt-1 text-[11px] text-neutral-400 leading-snug">
              <Shield className="w-4 h-4 text-[#6B8F5E] shrink-0 mt-0.5" />
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

            {storeStatusBanner && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{storeStatusBanner}</span>
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="button"
              id="btn-subscribe-master"
              onClick={handleMainAction}
              disabled={isPurchasing}
              className="w-full bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white font-tactical font-black text-xs py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{nativeStore ? 'Connecting to store BILLING...' : 'unlocking pro access...'}</span>
                </>
              ) : isFreePlanSelected ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Continue with Free</span>
                </>
              ) : (
                <>
                  <span>{nativeStore ? 'Subscribe with app store / google play' : 'subscribe'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Footer Links & Restore */}
            <div className="flex items-center justify-center gap-2.5 text-[10px] font-mono text-neutral-400 flex-wrap">
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
            </div>
          </div>
        </div>
      </div>

      <MembershipCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        planId={selectedProductId}
        planName={currentSelected.name}
        price={currentSelected.price}
        onSuccess={async (tier) => {
          if (onCheckout) onCheckout(tier);
          if (onSelectPlan) onSelectPlan(tier);
          await purchasePro(tier);
          onClose();
        }}
        onShowToast={onShowToast}
      />
    </>,
    document.body,
  );
};
export default MembershipPlansModal;
