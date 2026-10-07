import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeIAP,
  checkSubscriptionStatus,
  purchasePro as svcPurchasePro,
  restorePurchases as svcRestorePurchases,
  PLUS_ENTITLEMENT,
} from '../services/subscriptionService';
import {
  getAthleteTrialState,
  activateProSubscription,
  TrialState,
} from '../services/trialService';
import { getAuthenticatedUserId } from '../services/authUser';

export interface SubscriptionContextType {
  isPro: boolean;
  currentPlan: string;
  trialState: TrialState;
  purchasePro: (planId?: string) => Promise<boolean>;
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
  const [isPro, setIsPro] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<string>('o1fc_core_free');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [gatedFeature, setGatedFeature] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const uid = await getAuthenticatedUserId();
      if (uid) await initializeIAP(uid);
      const status = checkSubscriptionStatus();
      const trialInfo = getAthleteTrialState(uid || '');
      if (!mounted) return;

      setTrial(trialInfo);

      const hasProEntitlement = trialInfo.hasSubscribedPro || (status.isActive && status.tierId !== 'o1fc_core_free');
      setIsPro(Boolean(uid) && hasProEntitlement);
      setCurrentPlan(status.tierId || (hasProEntitlement ? PLUS_ENTITLEMENT : 'o1fc_core_free'));
      setIsLoading(false);
    };

    init();
    return () => { mounted = false; };
  }, []);

  const purchasePro = useCallback(async (planId?: string) => {
    setIsLoading(true);
    const uid = await getAuthenticatedUserId();
    const chosenPlan = planId || PLUS_ENTITLEMENT;
    const res = await svcPurchasePro(chosenPlan);

    if (res.success && uid) {
      activateProSubscription(uid, chosenPlan);
      const updatedTrial = getAthleteTrialState(uid);
      setTrial(updatedTrial);
      setIsPro(true);
      setCurrentPlan(chosenPlan);
      setIsPaywallOpen(false);
    }

    setIsLoading(false);
    return res.success;
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    const uid = await getAuthenticatedUserId();
    const res = await svcRestorePurchases();
    if (res.isPro && uid) {
      activateProSubscription(uid, res.status.tierId || PLUS_ENTITLEMENT);
      const updatedTrial = getAthleteTrialState(uid);
      setTrial(updatedTrial);
      setIsPro(true);
      setIsPaywallOpen(false);
    }
    setIsLoading(false);
    return res.success;
  }, []);

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
        currentPlan,
        trialState: trial,
        purchasePro,
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
      currentPlan: 'o1fc_core_free',
      trialState: getAthleteTrialState(''),
      purchasePro: async () => false,
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
