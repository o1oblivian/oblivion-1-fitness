import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeIAP,
  purchasePro as svcPurchasePro,
  restorePurchases as svcRestorePurchases,
  verifySubscriptionWithStore,
  PLUS_ENTITLEMENT,
  type SubscriptionStatus,
} from '../services/subscriptionService';
import { getAuthenticatedUserId } from '../services/authUser';
import { useAuthStore } from '../stores/useAuthStore';

export interface SubscriptionContextType {
  /** Paid: an active store plan. */
  isPro: boolean;
  /** Everything Club Pass unlocks. Identical to `isPro`: only a store-verified plan opens Pro features. */
  hasFullAccess: boolean;
  /** The store product behind the active plan, or `null` without one. */
  currentPlan: string | null;
  purchasePro: (planId?: string) => Promise<boolean>;
  /** Asks the store whether a plan it charged for is active; never opens checkout. True only when the store confirms it. */
  activatePlan: (planId: string) => Promise<boolean>;
  /** Resolves false when the store answered with nothing to restore. Rejects with a readable message when it did not answer. */
  restorePurchases: () => Promise<boolean>;
  isLoading: boolean;
  isPaywallOpen: boolean;
  gatedFeature: string | null;
  openPaywall: (featureName?: string) => void;
  closePaywall: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const authUserId = useAuthStore((s) => s.user?.id || '');
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [gatedFeature, setGatedFeature] = useState<string | null>(null);

  /** The only place Pro is switched on or off, and only with the store's own answer. */
  const applyVerified = useCallback((verified: SubscriptionStatus): boolean => {
    if (verified.isActive) setIsPaywallOpen(false);
    setIsPro(verified.isActive);
    setCurrentPlan(verified.isActive ? verified.tierId : null);
    return verified.isActive;
  }, []);

  useEffect(() => {
    let mounted = true;
    // Whoever was signed in before never carries Pro over. It stays false until the store answers.
    setIsPro(false);
    setCurrentPlan(null);
    const init = async () => {
      const uid = await getAuthenticatedUserId();
      if (uid) await initializeIAP(uid);
      if (!mounted) return;
      setIsLoading(false);

      if (!uid) return;
      const verified = await verifySubscriptionWithStore(uid);
      if (!verified || !mounted) return;
      applyVerified(verified);
    };

    init();
    return () => {
      mounted = false;
    };
    // Runs again when someone signs in or out, so each account is checked with the store on its own.
  }, [authUserId, applyVerified]);

  const purchasePro = useCallback(
    async (planId?: string) => {
      setIsLoading(true);
      const uid = await getAuthenticatedUserId();
      const res = await svcPurchasePro(planId || PLUS_ENTITLEMENT);

      let confirmed = false;
      if (res.success && uid) {
        const verified = await verifySubscriptionWithStore(uid);
        confirmed = verified ? applyVerified(verified) : false;
      }

      setIsLoading(false);
      return confirmed;
    },
    [applyVerified],
  );

  const activatePlan = useCallback(async () => {
    const uid = await getAuthenticatedUserId();
    if (!uid) return false;
    const verified = await verifySubscriptionWithStore(uid);
    return verified ? applyVerified(verified) : false;
  }, [applyVerified]);

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    const uid = await getAuthenticatedUserId();
    const res = await svcRestorePurchases().catch((err: unknown) => {
      setIsLoading(false);
      throw err;
    });
    if (res.error) {
      // The store did not answer. That is not the same as having nothing to restore.
      setIsLoading(false);
      throw new Error(res.error);
    }
    if (res.isPro && uid) {
      const verified = await verifySubscriptionWithStore(uid);
      if (!verified) {
        setIsLoading(false);
        throw new Error('The store restored your purchase but could not confirm it. Try again.');
      }
      applyVerified(verified);
    }
    setIsLoading(false);
    return res.success;
  }, [applyVerified]);

  const openPaywall = useCallback((featureName?: string) => {
    setGatedFeature(featureName || 'Club Pass Pro Feature');
    setIsPaywallOpen(true);
  }, []);

  useEffect(() => {
    const open = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      openPaywall(typeof detail === 'string' ? detail : 'Club Pass Pro');
    };
    window.addEventListener('o1fc_open_paywall', open as EventListener);
    return () => window.removeEventListener('o1fc_open_paywall', open as EventListener);
  }, [openPaywall]);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setGatedFeature(null);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        hasFullAccess: isPro,
        currentPlan,
        purchasePro,
        activatePlan,
        restorePurchases,
        isLoading,
        isPaywallOpen,
        gatedFeature,
        openPaywall,
        closePaywall,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      isPro: false,
      hasFullAccess: false,
      currentPlan: null,
      purchasePro: async () => false,
      activatePlan: async () => false,
      restorePurchases: async () => false,
      isLoading: false,
      isPaywallOpen: false,
      gatedFeature: null,
      openPaywall: () => {},
      closePaywall: () => {},
    };
  }
  return ctx;
};
