import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { MainAppLayout } from './MainAppLayout';
import { BootSplash } from './components/common/BootSplash';
import { useSessionGate } from './hooks/useSessionGate';
import { lockDarkTheme } from './utils/lockDarkTheme';
import { useAuthStore } from './stores/useAuthStore';
import { initMidnightRolloverListener } from './utils/midnightRollover';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AuthProvider } from './context/AuthContext';
import { ClubPassPaywallModal } from './features/membership/components/ClubPassPaywallModal';
import { OnboardingCoordinator } from './features/onboarding/OnboardingCoordinator';
import { PasswordRecoverySheet } from './features/onboarding/components/PasswordRecoverySheet';
import { InductionProtocol } from './features/induction/InductionProtocol';
import { useConsultationStore } from './features/induction/useConsultationStore';
import { revenueCatService } from './services/revenueCatService';
import { tactileEngine } from './services/tactileEngine';
import { supabase } from './services/supabaseClient';
import { safeStorage } from './utils/safeStorage';
import { Capacitor } from '@capacitor/core';
import { applyAuthCallbackUrl } from './services/oauthDeepLink';
import { captureInviteFromUrl } from './features/log/publicShare';
import { captureReelLink } from './features/reels/services/reelLinks';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { useModalStore } from './components/modals/useModalStore';

/** safeStorage JSON-parses on read, so the stored "true" comes back as a boolean. */
function onboardingCompleted(): boolean {
  return ['o1fc_onboarding_completed', 'olfc_onboarding_completed'].some(
    (key) => String(safeStorage.getItem(key)) === 'true',
  );
}

export default function App() {
  const gate = useSessionGate();
  const [showOnboarding, setShowOnboarding] = useState(() => !onboardingCompleted());
  const [authEpoch, setAuthEpoch] = useState(0);
  const wasSignedIn = useRef(false);
  const [onboardingReplay, setOnboardingReplay] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [membershipSuccessBanner, setMembershipSuccessBanner] = useState(false);
  const consultationLocked = useConsultationStore((state) => state.locked);
  const onboardingOpen = gate === 'out' || (gate === 'in' && showOnboarding);

  // Nobody reaches the app without a Supabase session: no session means Sign In, before anything else.
  useEffect(() => {
    if (gate === 'in') {
      wasSignedIn.current = true;
    } else if (gate === 'out') {
      if (wasSignedIn.current) {
        wasSignedIn.current = false;
        setAuthEpoch((n) => n + 1);
      }
      setOnboardingReplay(false);
      setShowOnboarding(true);
    }
  }, [gate]);

  // The store customer is the verified account, never a leftover id from local storage.
  useEffect(() => {
    if (gate !== 'in') return;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        const id = data.session?.user.id;
        // Connect the store and fetch the plans now, so the paywall opens with prices already in hand.
        if (id) return revenueCatService.getOfferings(id);
        return null;
      })
      .catch(() => null);
  }, [gate]);

  useEffect(() => {
    lockDarkTheme();
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

      // Pure client-side routing guard: prevent full-page server roundtrips & preserve auth state
      const handleGlobalLinkClicks = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement)?.closest('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (
          !href ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('blob:') ||
          anchor.hasAttribute('download') ||
          anchor.getAttribute('target') === '_blank'
        )
          return;
        let path = href;
        if (path.startsWith(window.location.origin))
          path = path.slice(window.location.origin.length);
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
          const target = raw === 'dashboard' || raw === 'workout' ? 'tracker' : raw;
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
      // Sign-out ends in a reload. Show a blank holding screen until then; onboarding would flash first.
      const handleSignedOut = () => setSigningOut(true);
      window.addEventListener('o1fc_signed_out', handleSignedOut);

      const handleAuthUrl = async (url: string) => {
        if (!url) return;
        try {
          if (await applyAuthCallbackUrl(url)) tactileEngine.playPRCelebration();
        } catch (err) {
          console.warn('[App] Error handling OAuth deep link session:', err);
        }
      };

      /** Joins the coach from a saved invite. Call after sign-in has finished, never beside it. */
      const redeemInvite = () =>
        void import('./features/coach/services/coachBridge').then(({ acceptCoachInvite }) =>
          acceptCoachInvite(),
        );

      const webHref = window.location.href;
      if (captureInviteFromUrl(webHref)) {
        redeemInvite();
        try {
          const cleaned = new URL(webHref);
          cleaned.searchParams.delete('invite');
          window.history.replaceState(
            {},
            document.title,
            cleaned.pathname + cleaned.search + cleaned.hash,
          );
        } catch {
          /* ignore */
        }
      }
      if (captureReelLink(webHref)) {
        try {
          const cleaned = new URL(window.location.href);
          cleaned.searchParams.delete('reel');
          cleaned.searchParams.delete('coach');
          window.history.replaceState(
            {},
            document.title,
            cleaned.pathname + cleaned.search + cleaned.hash,
          );
        } catch {
          /* ignore */
        }
      }
      /** A paid checkout finished: show the Coach tab and re-read programs while the webhook lands. */
      const showCheckoutResult = () => {
        window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'coach' }));
        void import('./features/reels/services/coachStorefront').then(({ PROGRAMS_EVENT }) => {
          [2000, 6000, 12000].forEach((ms) =>
            setTimeout(() => window.dispatchEvent(new CustomEvent(PROGRAMS_EVENT)), ms),
          );
        });
      };
      // On the phone Stripe opens in the browser and cannot send the person back to the app, so
      // refresh when they return to it after opening a checkout.
      const onCheckoutReturn = () => {
        if (document.visibilityState !== 'visible') return;
        void import('./services/stripeConnectService').then(({ takeCheckoutPending }) => {
          if (takeCheckoutPending()) showCheckoutResult();
        });
      };
      document.addEventListener('visibilitychange', onCheckoutReturn);

      const checkoutResult = new URL(webHref).searchParams.get('checkout');
      if (checkoutResult) {
        const cleaned = new URL(webHref);
        cleaned.searchParams.delete('checkout');
        cleaned.searchParams.delete('session_id');
        window.history.replaceState(
          {},
          document.title,
          cleaned.pathname + cleaned.search + cleaned.hash,
        );
        if (checkoutResult === 'success') showCheckoutResult();
      }
      if (webHref.includes('access_token') || webHref.includes('code=')) {
        handleAuthUrl(webHref).then(() => {
          redeemInvite();
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {
            /* ignore */
          }
        });
      }

      let appUrlListenerHandle: { remove: () => Promise<void> } | null = null;
      let backButtonHandle: { remove: () => Promise<void> } | null = null;
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/app')
          .then(({ App: CapApp }) => {
            CapApp.addListener('appUrlOpen', async ({ url }) => {
              if (!url) return;
              captureInviteFromUrl(url);
              captureReelLink(url);
              await handleAuthUrl(url);
              redeemInvite();
            })
              .then((handle) => {
                appUrlListenerHandle = handle;
              })
              .catch((err) => {
                console.warn('[App] appUrlOpen listener unavailable:', err);
              });
            // Android hardware back: close an open sheet first, then step back, and only then leave the app.
            // Registering this replaces the default behaviour, so all three cases are handled here.
            CapApp.addListener('backButton', ({ canGoBack }) => {
              const { activeModal, closeModal } = useModalStore.getState();
              if (activeModal) closeModal();
              else if (canGoBack) window.history.back();
              else void CapApp.minimizeApp();
            })
              .then((handle) => {
                backButtonHandle = handle;
              })
              .catch((err) => {
                console.warn('[App] backButton listener unavailable:', err);
              });
            CapApp.getLaunchUrl()
              .then((launch) => {
                if (!launch?.url) return;
                captureInviteFromUrl(launch.url);
                captureReelLink(launch.url);
                void handleAuthUrl(launch.url).then(redeemInvite);
              })
              .catch((err) => {
                console.warn('[App] getLaunchUrl unavailable:', err);
              });
          })
          .catch((err) => {
            console.warn('[App] @capacitor/app skipped on web:', err);
          });
      }

      return () => {
        cleanupRollover();
        document.removeEventListener('visibilitychange', onCheckoutReturn);
        if (Capacitor.isNativePlatform()) {
          try {
            appUrlListenerHandle?.remove();
            backButtonHandle?.remove();
          } catch (err) {
            console.warn('[App] appUrlOpen listener cleanup skipped:', err);
          }
        }
        window.removeEventListener('click', handleGlobalLinkClicks);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('hashchange', handlePopState);
        window.removeEventListener('o1fc_relaunch_onboarding', handleRelaunch);
        window.removeEventListener('o1fc_account_deleted', handleRelaunch);
        window.removeEventListener('o1fc_signed_out', handleSignedOut);
      };
    }
    return () => cleanupRollover();
  }, []);

  return (
    <AppErrorBoundary>
      <div className="min-h-screen w-full overflow-x-hidden relative bg-black">
        <AuthProvider>
          <SubscriptionProvider>
            {gate === 'in' && <MainAppLayout />}
            {gate === 'in' && <ClubPassPaywallModal />}
            {gate === 'in' && !onboardingOpen && !consultationLocked && <InductionProtocol />}
            {gate === 'checking' && <BootSplash />}
            {onboardingOpen && (
              <OnboardingCoordinator
                key={authEpoch}
                hasSession={gate === 'in'}
                replay={onboardingReplay}
                onComplete={() => {
                  setShowOnboarding(false);
                  setOnboardingReplay(false);
                }}
              />
            )}
            <PasswordRecoverySheet />
            {signingOut && (
              <div
                role="status"
                aria-live="polite"
                className="fixed inset-0 z-[100000] flex flex-col items-center justify-center gap-3 bg-black text-o1-muted"
              >
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Signing out</span>
              </div>
            )}
            {membershipSuccessBanner && (
              <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-4 bg-o1-card border border-white/[0.07] rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-o1-stone shrink-0" />
                  <div>
                    <p className="text-xs font-tactical font-black text-white tracking-wider">
                      Membership Activated
                    </p>
                    <p className="text-o1-label font-num text-o1-muted">
                      Revenuecat IN-APP purchase verified
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMembershipSuccessBanner(false)}
                  className="p-1 text-o1-muted hover:text-white rounded-full cursor-pointer"
                >
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
