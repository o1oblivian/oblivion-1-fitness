import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeIAP,
  checkSubscriptionStatus,
  purchasePro as svcPurchasePro,
  restorePurchases as svcRestorePurchases,
  verifySubscriptionWithStore,
  PLUS_ENTITLEMENT,
} from '../services/subscriptionService';
import {
  getAthleteTrialState,
  activateProSubscription,
  clearProSubscription,
  TrialState,
} from '../services/trialService';
import { getAuthenticatedUserId } from '../services/authUser';
import { useAuthStore } from '../stores/useAuthStore';

const CREATOR_EMAIL = 'o1oblivianfitness@gmail.com';
// App Store / Play review account: sees launch-gated features, but still goes through the real paywall.
const REVIEWER_EMAIL = 'o1oblivianfitness+review@gmail.com';

function signedInAs(email: string): boolean {
  try {
    const stored = (localStorage.getItem('o1fc_user_email') || '').trim().toLowerCase();
    const live = (useAuthStore.getState().user?.email || useAuthStore.getState().profile?.email || '').trim().toLowerCase();
    return stored === email || live === email;
  } catch {
    return false;
  }
}

const creatorSignedIn = (): boolean => signedInAs(CREATOR_EMAIL);
/** Launch-gated UI only. Never grants Club Pass Pro — that comes from RevenueCat / the store. */
const launchPreviewAllowed = (): boolean => creatorSignedIn() || signedInAs(REVIEWER_EMAIL);

export interface SubscriptionContextType {
  isPro: boolean;
  currentPlan: string;
  trialState: TrialState;
  purchasePro: (planId?: string) => Promise<boolean>;
  /** Reflects a plan the store already charged for; never opens checkout. */
  activatePlan: (planId: string) => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  isLoading: boolean;
  isPaywallOpen: boolean;
  gatedFeature: string | null;
  isCreator: boolean;
  /** Owner and store reviewers see features that are still behind the launch gate. */
  canPreviewLaunch: boolean;
  openPaywall: (featureName?: string) => void;
  closePaywall: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const EMPTY_TRIAL = getAthleteTrialState('');

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trial, setTrial] = useState<TrialState>(EMPTY_TRIAL);
  const [isPro, setIsPro] = useState(false);
  const [isCreator, setIsCreator] = useState(() => creatorSignedIn());
  const [canPreviewLaunch, setCanPreviewLaunch] = useState(launchPreviewAllowed);
  const authEmail = useAuthStore((s) => s.user?.email || s.profile?.email || '');
  useEffect(() => {
    setIsCreator(creatorSignedIn());
    setCanPreviewLaunch(launchPreviewAllowed());
  }, [authEmail]);
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
      setIsCreator(creatorSignedIn());
      setCanPreviewLaunch(launchPreviewAllowed());
      const hasProEntitlement = trialInfo.hasSubscribedPro || (status.isActive && status.tierId !== 'o1fc_core_free');
      setIsPro(Boolean(uid) && hasProEntitlement);
      setCurrentPlan(status.tierId || (hasProEntitlement ? PLUS_ENTITLEMENT : 'o1fc_core_free'));
      setIsLoading(false);

      if (!uid) return;
      const verified = await verifySubscriptionWithStore(uid);
      if (!verified || !mounted) return;
      if (verified.isActive) {
        if (!trialInfo.hasSubscribedPro || trialInfo.planId !== verified.tierId) activateProSubscription(uid, verified.tierId);
      } else {
        clearProSubscription(uid);
      }
      setTrial(getAthleteTrialState(uid));
      setIsPro(verified.isActive);
      setCurrentPlan(verified.isActive ? verified.tierId : 'o1fc_core_free');
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

  const activatePlan = useCallback(async (planId: string) => {
    const uid = await getAuthenticatedUserId();
    if (!uid) return;
    activateProSubscription(uid, planId);
    setTrial(getAthleteTrialState(uid));
    setIsPro(true);
    setCurrentPlan(planId);
    setIsPaywallOpen(false);
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
        isCreator,
        canPreviewLaunch,
        currentPlan,
        trialState: trial,
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
      isCreator: false,
      canPreviewLaunch: false,
      currentPlan: 'o1fc_core_free',
      trialState: getAthleteTrialState(''),
      purchasePro: async () => false,
      activatePlan: async () => {},
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
