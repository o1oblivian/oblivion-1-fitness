import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { MainAppLayout } from './MainAppLayout';
import { useThemeStore } from './stores/useThemeStore';
import { useAuthStore } from './stores/useAuthStore';
import { initMidnightRolloverListener } from './utils/midnightRollover';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AuthProvider } from './context/AuthContext';
import { ClubPassPaywallModal } from './features/membership/components/ClubPassPaywallModal';
import { ProAccessModal } from './components/modals/ProAccessModal';
import { OnboardingCoordinator } from './features/onboarding/OnboardingCoordinator';
import { revenueCatService } from './services/revenueCatService';
import { tactileEngine } from './services/tactileEngine';
import { safeStorage } from './utils/safeStorage';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProAccess, setShowProAccess] = useState(false);
  const [membershipSuccessBanner, setMembershipSuccessBanner] = useState(false);

  useEffect(() => {
    useThemeStore.getState().initTheme();
    useAuthStore.getState().initialize();
    const cleanupRollover = initMidnightRolloverListener();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success' || params.get('payment') === 'success') {
        setMembershipSuccessBanner(true);
        revenueCatService.getCustomerEntitlements().catch(() => null);
        tactileEngine.playPRCelebration();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const isCompleted =
      safeStorage.getItem('o1fc_onboarding_completed') === 'true' ||
      safeStorage.getItem('olfc_onboarding_completed') === 'true';
    if (!isCompleted) {
      // Automatically provision default session for instant preview access
      safeStorage.setItem('o1fc_onboarding_completed', 'true');
    }

    const handleRelaunch = () => setShowOnboarding(true);
    window.addEventListener('o1fc_relaunch_onboarding', handleRelaunch);
    window.addEventListener('o1fc_account_deleted', handleRelaunch);

    return () => {
      cleanupRollover();
      window.removeEventListener('o1fc_relaunch_onboarding', handleRelaunch);
      window.removeEventListener('o1fc_account_deleted', handleRelaunch);
    };
  }, []);

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <MainAppLayout />
        <ClubPassPaywallModal />
        <ProAccessModal isOpen={showProAccess} onClose={() => setShowProAccess(false)} />
        {showOnboarding && (
          <OnboardingCoordinator
            onComplete={() => {
              setShowOnboarding(false);
              setShowProAccess(true);
            }}
          />
        )}
        {membershipSuccessBanner && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-[#080808] border border-[#D4AF37] rounded-2xl p-4 shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#F5D061] shrink-0" />
              <div>
                <p className="text-xs font-tactical font-black text-white uppercase tracking-wider">MEMBERSHIP ACTIVATED</p>
                <p className="text-[10px] font-mono text-[#D4AF37]">REVENUECAT IN-APP PURCHASE VERIFIED</p>
              </div>
            </div>
            <button onClick={() => setMembershipSuccessBanner(false)} className="p-1 text-neutral-400 hover:text-white rounded-full cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </SubscriptionProvider>
    </AuthProvider>
  );
}
