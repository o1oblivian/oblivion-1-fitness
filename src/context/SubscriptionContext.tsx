import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeIAP,
  purchasePro as svcPurchasePro,
  restorePurchases as svcRestorePurchases,
  verifySubscriptionWithStore,
  PLUS_ENTITLEMENT,
  type SubscriptionStatus,
} from '../services/subscriptionService';
import {
  getAthleteTrialState,
  activateProSubscription,
  clearProSubscription,
  TrialState,
} from '../services/trialService';
import {
  cachedFreeAccess,
  resolveFreeAccess,
  withoutFreeAccess,
} from '../services/freeAccessService';
import { getAuthenticatedUserId } from '../services/authUser';
import { useAuthStore } from '../stores/useAuthStore';

export interface SubscriptionContextType {
  /** Paid: an active store plan. */
  isPro: boolean;
  /** Everything Club Pass unlocks: a paid plan or the 90-day full-access window. */
  hasFullAccess: boolean;
  currentPlan: string;
  trialState: TrialState;
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

const EMPTY_TRIAL = getAthleteTrialState('');

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trial, setTrial] = useState<TrialState>(EMPTY_TRIAL);
  const [isPro, setIsPro] = useState(false);
  // False only for members who joined after the first 100,000. They start on Core Free.
  const [freeAccess, setFreeAccess] = useState(true);
  const authUserId = useAuthStore((s) => s.user?.id || '');
  const [currentPlan, setCurrentPlan] = useState<string>('o1fc_core_free');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [gatedFeature, setGatedFeature] = useState<string | null>(null);

  /** The only place Pro is switched on or off, and only with the store's own answer. */
  const applyVerified = useCallback((uid: string, verified: SubscriptionStatus): boolean => {
    if (verified.isActive) {
      activateProSubscription(uid, verified.tierId);
      setIsPaywallOpen(false);
    } else {
      clearProSubscription(uid);
    }
    setTrial(getAthleteTrialState(uid));
    setIsPro(verified.isActive);
    setCurrentPlan(verified.isActive ? verified.tierId : 'o1fc_core_free');
    return verified.isActive;
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const uid = await getAuthenticatedUserId();
      if (uid) await initializeIAP(uid);
      const trialInfo = getAthleteTrialState(uid || '');
      if (!mounted) return;

      // Pro stays false here. Neither a saved flag nor a cached plan can switch it on.
      setTrial(trialInfo);
      setIsLoading(false);

      if (!uid) return;
      setFreeAccess(cachedFreeAccess(uid));
      void resolveFreeAccess(uid).then((eligible) => {
        if (mounted) setFreeAccess(eligible);
      });
      const verified = await verifySubscriptionWithStore(uid);
      if (!verified || !mounted) return;
      applyVerified(uid, verified);
    };

    init();
    return () => {
      mounted = false;
    };
    // Runs again when someone signs in or out, so a new account gets its own 90-day window.
  }, [authUserId, applyVerified]);

  const purchasePro = useCallback(
    async (planId?: string) => {
      setIsLoading(true);
      const uid = await getAuthenticatedUserId();
      const res = await svcPurchasePro(planId || PLUS_ENTITLEMENT);

      let confirmed = false;
      if (res.success && uid) {
        const verified = await verifySubscriptionWithStore(uid);
        confirmed = verified ? applyVerified(uid, verified) : false;
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
    return verified ? applyVerified(uid, verified) : false;
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
      applyVerified(uid, verified);
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

  // A saved "subscribed" flag is only a cache. Until the store confirms the plan, the 90-day clock decides.
  const clockExpired =
    trial.expiresDate !== '' && Date.now() >= new Date(trial.expiresDate).getTime();
  const sealedTrial: TrialState =
    trial.hasSubscribedPro && !isPro
      ? {
          ...trial,
          hasSubscribedPro: false,
          planId: undefined,
          isTrialActive: !clockExpired,
          isTrialExpired: clockExpired,
        }
      : trial;
  const effectiveTrial = freeAccess ? sealedTrial : withoutFreeAccess(sealedTrial);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        hasFullAccess: isPro || effectiveTrial.isTrialActive,
        currentPlan,
        trialState: effectiveTrial,
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
      currentPlan: 'o1fc_core_free',
      trialState: getAthleteTrialState(''),
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
