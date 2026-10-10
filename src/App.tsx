import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { MainAppLayout } from './MainAppLayout';
import { lockDarkTheme } from './utils/lockDarkTheme';
import { useAuthStore } from './stores/useAuthStore';
import { initMidnightRolloverListener } from './utils/midnightRollover';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AuthProvider } from './context/AuthContext';
import { ClubPassPaywallModal } from './features/membership/components/ClubPassPaywallModal';
import { OnboardingCoordinator } from './features/onboarding/OnboardingCoordinator';
import { InductionProtocol } from './features/induction/InductionProtocol';
import { useConsultationStore } from './features/induction/useConsultationStore';
import { revenueCatService } from './services/revenueCatService';
import { tactileEngine } from './services/tactileEngine';
import { safeStorage } from './utils/safeStorage';
import { Capacitor } from '@capacitor/core';
import { applyAuthCallbackUrl } from './services/oauthDeepLink';
import { captureInviteFromUrl } from './features/log/publicShare';
import { captureReelLink } from './features/reels/services/reelLinks';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const isCompleted = safeStorage.getItem('o1fc_onboarding_completed') === 'true' || safeStorage.getItem('olfc_onboarding_completed') === 'true';
    const hasAuth = Boolean(safeStorage.getItem('o1fc_user_id'));
    return !isCompleted || !hasAuth;
  });
  const [onboardingReplay, setOnboardingReplay] = useState(false);
  const [membershipSuccessBanner, setMembershipSuccessBanner] = useState(false);
  const consultationLocked = useConsultationStore((state) => state.locked);

  useEffect(() => {
    lockDarkTheme();
    useAuthStore.getState().initialize();
    const cleanupRollover = initMidnightRolloverListener();
    const storedUserId = safeStorage.getItem('o1fc_user_id');
    if (typeof storedUserId === 'string' && storedUserId) {
      revenueCatService.init(storedUserId).catch(() => null);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success' || params.get('payment') === 'success') {
        setMembershipSuccessBanner(true);
        revenueCatService.getCustomerEntitlements().catch(() => null);
        tactileEngine.playPRCelebration();
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Pure client-side routing guard: prevent full-page server roundtrips & preserve auth state
      const handleGlobalLinkClicks = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement)?.closest('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('blob:') || anchor.hasAttribute('download') || anchor.getAttribute('target') === '_blank') return;
        let path = href;
        if (path.startsWith(window.location.origin)) path = path.slice(window.location.origin.length);
        else if (path.startsWith('http://') || path.startsWith('https://')) return;

        e.preventDefault();
        const tabTarget = path.replace(/^#\/?/, '').replace(/^\//, '').toLowerCase();
        if (tabTarget === 'dashboard' || tabTarget === 'tracker' || tabTarget === 'workout') {
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
          window.history.pushState(null, '', '#workout');
        } else if (tabTarget) {
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: tabTarget }));
          window.history.pushState(null, '', `#${tabTarget}`);
        }
      };
      window.addEventListener('click', handleGlobalLinkClicks);

      // In-app popstate & hash change listener for flawless client-side back/forward transitions
      const handlePopState = () => {
        const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        if (raw) {
          const target = (raw === 'dashboard' || raw === 'workout') ? 'tracker' : raw;
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: target }));
        }
      };
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('hashchange', handlePopState);

      const handleRelaunch = () => {
        const hasAuth = Boolean(safeStorage.getItem('o1fc_user_id'));
        setOnboardingReplay(hasAuth);
        setShowOnboarding(true);
      };
      window.addEventListener('o1fc_relaunch_onboarding', handleRelaunch);
      window.addEventListener('o1fc_account_deleted', handleRelaunch);

      const handleAuthUrl = async (url: string) => {
        if (!url) return;
        try {
          const ok = await applyAuthCallbackUrl(url);
          if (ok) {
            if (safeStorage.getItem('o1fc_onboarding_completed') === 'true' || safeStorage.getItem('olfc_onboarding_completed') === 'true') {
              setShowOnboarding(false);
            }
            tactileEngine.playPRCelebration();
          }
        } catch (err) {
          console.warn('[App] Error handling OAuth deep link session:', err);
        }
      };

      const webHref = window.location.href;
      if (captureInviteFromUrl(webHref)) {
        void import('./features/coach/services/coachBridge').then(({ acceptCoachInvite }) => acceptCoachInvite());
        try {
          const cleaned = new URL(webHref);
          cleaned.searchParams.delete('invite');
          window.history.replaceState({}, document.title, cleaned.pathname + cleaned.search + cleaned.hash);
        } catch {
          /* ignore */
        }
      }
      if (captureReelLink(webHref)) {
        try {
          const cleaned = new URL(window.location.href);
          cleaned.searchParams.delete('reel');
          cleaned.searchParams.delete('coach');
          window.history.replaceState({}, document.title, cleaned.pathname + cleaned.search + cleaned.hash);
        } catch {
          /* ignore */
        }
      }
      const checkoutResult = new URL(webHref).searchParams.get('checkout');
      if (checkoutResult) {
        const cleaned = new URL(webHref);
        cleaned.searchParams.delete('checkout');
        cleaned.searchParams.delete('session_id');
        window.history.replaceState({}, document.title, cleaned.pathname + cleaned.search + cleaned.hash);
        if (checkoutResult === 'success') {
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'coach' }));
          void import('./features/reels/services/coachStorefront').then(({ PROGRAMS_EVENT }) => {
            [2000, 6000].forEach((ms) => setTimeout(() => window.dispatchEvent(new CustomEvent(PROGRAMS_EVENT)), ms));
          });
        }
      }
      if (webHref.includes('access_token') || webHref.includes('code=')) {
        handleAuthUrl(webHref).then(() => {
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {
            /* ignore */
          }
        });
      }

      let appUrlListenerHandle: { remove: () => Promise<void> } | null = null;
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/app')
          .then(({ App: CapApp }) => {
            CapApp.addListener('appUrlOpen', async ({ url }) => {
              if (!url) return;
              captureInviteFromUrl(url);
              captureReelLink(url);
              void import('./features/coach/services/coachBridge').then(({ acceptCoachInvite }) => acceptCoachInvite());
              await handleAuthUrl(url);
            }).then((handle) => {
              appUrlListenerHandle = handle;
            }).catch((err) => {
              console.warn('[App] appUrlOpen listener unavailable:', err);
            });
            CapApp.getLaunchUrl().then((launch) => {
              if (!launch?.url) return;
              captureInviteFromUrl(launch.url);
              captureReelLink(launch.url);
              void import('./features/coach/services/coachBridge').then(({ acceptCoachInvite }) => acceptCoachInvite());
              void handleAuthUrl(launch.url);
            }).catch((err) => {
              console.warn('[App] getLaunchUrl unavailable:', err);
            });
          })
          .catch((err) => {
            console.warn('[App] @capacitor/app skipped on web:', err);
          });
      }

      return () => {
        cleanupRollover();
        if (Capacitor.isNativePlatform()) {
          try {
            appUrlListenerHandle?.remove();
          } catch (err) {
            console.warn('[App] appUrlOpen listener cleanup skipped:', err);
          }
        }
        window.removeEventListener('click', handleGlobalLinkClicks);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('hashchange', handlePopState);
        window.removeEventListener('o1fc_relaunch_onboarding', handleRelaunch);
        window.removeEventListener('o1fc_account_deleted', handleRelaunch);
      };
    }
    return () => cleanupRollover();
  }, []);

  return (
    <AppErrorBoundary>
    <div className="min-h-screen w-full overflow-x-hidden relative bg-black">
    <AuthProvider>
      <SubscriptionProvider>
        <MainAppLayout />
        <ClubPassPaywallModal />
        {!showOnboarding && !consultationLocked && <InductionProtocol />}
        {showOnboarding && (
          <OnboardingCoordinator
            replay={onboardingReplay}
            onComplete={() => {
              setShowOnboarding(false);
              if (!onboardingReplay && useConsultationStore.getState().locked) {
                window.dispatchEvent(new CustomEvent('o1fc_open_paywall', { detail: 'Club Pass Pro' }));
              }
              setOnboardingReplay(false);
            }}
          />
        )}
        {membershipSuccessBanner && (
          <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-4 bg-o1-card border border-white/[0.07] rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-zinc-300 shrink-0" />
              <div>
                <p className="text-xs font-tactical font-black text-white tracking-wider">Membership Activated</p>
                <p className="text-[10px] font-mono text-zinc-400">Revenuecat IN-APP purchase verified</p>
              </div>
            </div>
            <button onClick={() => setMembershipSuccessBanner(false)} className="p-1 text-neutral-400 hover:text-white rounded-full cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </SubscriptionProvider>
    </AuthProvider>
    </div>
    </AppErrorBoundary>
  );
}
