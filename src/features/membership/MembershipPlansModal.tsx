import React, { useState } from 'react';
import { X, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { IAP_PRODUCTS, IAPProductInfo } from '../../types/iap';
import { AthleteProfile } from '../../types/athlete';
import { tactileEngine } from '../../services/tactileEngine';
import { useSubscription } from '../../context/SubscriptionContext';
import { MembershipPlanCard } from './components/MembershipPlanCard';
import { MembershipPlanFeatures } from './components/MembershipPlanFeatures';
import { MembershipCheckoutModal } from './components/MembershipCheckoutModal';

export interface MembershipPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (productId: string) => void;
  onCheckout?: (productId: string) => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHealth?: () => void;
  onOpenDisclaimer?: () => void;
  onShowToast?: (msg: string) => void;
  athleteProfile?: AthleteProfile;
}

export const MembershipPlansModal: React.FC<MembershipPlansModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  onCheckout,
  onOpenTerms,
  onOpenPrivacy,
  onOpenHealth,
  onOpenDisclaimer,
  onShowToast,
}) => {
  const [userType, setUserType] = useState<'athletes' | 'coaches'>('athletes');
  const [selectedProductId, setSelectedProductId] = useState<string>(IAP_PRODUCTS.premium.productId);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { purchasePro, restorePurchases } = useSubscription();

  if (!isOpen) return null;

  const athleteProducts: readonly IAPProductInfo[] = [
    IAP_PRODUCTS.founder_pass,
    IAP_PRODUCTS.core_free,
    IAP_PRODUCTS.premium,
    IAP_PRODUCTS.premium_travel,
  ];

  const coachProducts: readonly IAPProductInfo[] = [
    IAP_PRODUCTS.coach_free,
    IAP_PRODUCTS.coach_pro,
  ];

  const currentProducts = userType === 'athletes' ? athleteProducts : coachProducts;
  const currentSelected =
    [...athleteProducts, ...coachProducts].find((p) => p.productId === selectedProductId) ||
    currentProducts[0];

  const isFreePlanSelected = currentSelected.isFree;

  const handleSelectTab = (t: 'athletes' | 'coaches') => {
    tactileEngine.triggerSelectionBuzz();
    setUserType(t);
    setSelectedProductId(t === 'athletes' ? IAP_PRODUCTS.premium.productId : IAP_PRODUCTS.coach_pro.productId);
  };

  const handleMainAction = () => {
    tactileEngine.triggerSelectionBuzz();
    if (isFreePlanSelected) {
      tactileEngine.playPRCelebration();
      const message =
        userType === 'athletes'
          ? 'Core Free tier active • 90-day full access included!'
          : 'Coach tier active • Full coaching command center ready!';
      onShowToast?.(message);
      if (onSelectPlan) onSelectPlan(selectedProductId);
      onClose();
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleRestore = async () => {
    tactileEngine.triggerSelectionBuzz();
    const success = await restorePurchases();
    if (success) {
      tactileEngine.playPRCelebration();
      onShowToast?.('Entitlements restored successfully.');
      onClose();
    } else {
      onShowToast?.('No prior active subscription found.');
    }
  };

  return (
    <>
      <div
        id="membership-plans-modal"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-900 dark:text-white w-full max-w-[480px] max-h-[92dvh] h-auto flex flex-col shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121214]">
            <div>
              <h2 className="text-sm font-bold uppercase text-neutral-900 dark:text-white tracking-wide">
                Choose Your Plan
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                O1FC Official Membership
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-4 sm:px-5 py-4 space-y-4 text-left flex-1 min-h-0">
            {/* Tab Switcher: Athletes | Coaches */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800">
              {(['athletes', 'coaches'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectTab(t)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize tracking-wider transition-all cursor-pointer ${
                    userType === t
                      ? 'bg-white dark:bg-[#27272a] text-neutral-900 dark:text-white shadow-xs font-black'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
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
                className="p-3 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between cursor-pointer hover:border-[#C4121A]/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-700 dark:text-neutral-300">
                      LAUNCH SPECIAL • FIRST 5,000
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C4121A] animate-pulse" />
                      5,000 Remaining
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-snug">
                    <strong className="text-neutral-900 dark:text-white">$24.00 Lifetime Founder Pass</strong> — Training OS Pro + Global Radar forever.
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
              onOpenTerms={onOpenTerms}
              onOpenPrivacy={onOpenPrivacy}
              onOpenHealth={onOpenHealth}
              onOpenDisclaimer={onOpenDisclaimer}
              onShowToast={onShowToast}
            />

            {/* Billing Notice */}
            <div className="flex items-start gap-2 pt-1 text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
              <Shield className="w-4 h-4 text-[#C4121A] shrink-0 mt-0.5" />
              <span>
                {isFreePlanSelected
                  ? userType === 'athletes'
                    ? 'Core Free includes 90 days full access + permanent workout logger & hydration tracking. No credit card required.'
                    : 'Coach tier includes full client roster, direct workout dispatch, and athlete review studio.'
                  : 'In-App Subscription: Billed via Google Play or Apple App Store. Your Oblivion 1 Club Pass unlocks across all your devices.'}
              </span>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              id="btn-subscribe-master"
              onClick={handleMainAction}
              className="w-full bg-[#C4121A] hover:bg-[#A30F16] active:bg-[#800C11] text-white font-tactical font-black text-xs uppercase py-3.5 px-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isFreePlanSelected ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONTINUE WITH FREE</span>
                </>
              ) : (
                <>
                  <span>SUBSCRIBE WITH GOOGLE PLAY</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Footer Links & Restore */}
            <div className="flex items-center justify-center gap-2.5 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span>Google Play / Apple</span>
              <span>•</span>
              <span>Cancel Anytime</span>
              <span>•</span>
              <button
                type="button"
                onClick={handleRestore}
                className="hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
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
    </>
  );
};
export default MembershipPlansModal;
