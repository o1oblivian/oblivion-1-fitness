import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeIAP,
  checkSubscriptionStatus,
  purchasePro as svcPurchasePro,
  restorePurchases as svcRestorePurchases,
  isNativePlatform,
  PLUS_ENTITLEMENT,
} from '../services/subscriptionService';
import {
  getAthleteTrialState,
  activateProSubscription,
  TrialState,
} from '../services/trialService';

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

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trial, setTrial] = useState<TrialState>(() => getAthleteTrialState('default-athlete'));
  const [isPro, setIsPro] = useState<boolean>(true);
  const [currentPlan, setCurrentPlan] = useState<string>(PLUS_ENTITLEMENT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [gatedFeature, setGatedFeature] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await initializeIAP('default-athlete');
      const status = checkSubscriptionStatus();
      const trialInfo = getAthleteTrialState('default-athlete');
      if (!mounted) return;

      setTrial(trialInfo);

      // Feature Gating Rule:
      // If user has purchased Pro OR is currently within their 90-day trial period, isPro = true
      // Once the 90 days expire and no Pro pass was purchased, isPro becomes false -> triggers gating paywalls
      const hasProEntitlement = trialInfo.hasSubscribedPro || (status.isActive && status.tierId !== 'o1fc_core_free');
      const active = hasProEntitlement || trialInfo.isTrialActive;

      setIsPro(active);
      setCurrentPlan(status.tierId || (hasProEntitlement ? PLUS_ENTITLEMENT : 'o1fc_core_free'));
      setIsLoading(false);
    };

    init();
    return () => { mounted = false; };
  }, []);

  const purchasePro = useCallback(async (planId?: string) => {
    setIsLoading(true);
    const chosenPlan = planId || PLUS_ENTITLEMENT;
    const res = await svcPurchasePro(chosenPlan);

    if (res.success) {
      activateProSubscription('default-athlete', chosenPlan);
      const updatedTrial = getAthleteTrialState('default-athlete');
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
    const res = await svcRestorePurchases();
    if (res.isPro) {
      activateProSubscription('default-athlete', res.status.tierId || PLUS_ENTITLEMENT);
      const updatedTrial = getAthleteTrialState('default-athlete');
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
      isPro: true,
      currentPlan: PLUS_ENTITLEMENT,
      trialState: getAthleteTrialState('default-athlete'),
      purchasePro: async () => true,
      restorePurchases: async () => true,
      isLoading: false,
      isPaywallOpen: false,
      gatedFeature: null,
      openPaywall: () => {},
      closePaywall: () => {},
    };
  }
  return ctx;
};
