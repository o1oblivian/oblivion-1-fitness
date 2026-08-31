import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { AuthModal } from '@/components/AuthModal';
import { BottomNavBar } from '@/components/BottomNavBar';
import { HeaderActions } from '@/components/HeaderActions';
import { Toast } from '@/components/Toast';
import { ModalsLayer } from '@/components/ModalsLayer';
import { RestTimerHUD } from '@/components/RestTimerHUD';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ViewBoundary } from '@/components/ui/ViewBoundary';
import { OAuthConsentGate } from '@/components/OAuthConsentGate';
import { WifiOff } from 'lucide-react';
import { HomeView } from '@/components/HomeView';
import { SoloView } from '@/components/SoloView';
import { FuelView } from '@/components/FuelView';
import { TandemView } from '@/components/TandemView';
import FitnessIntelligenceApp from '@/components/FitnessIntelligenceApp';
import { AthleteView } from '@/components/AthleteView';

const O1LaunchProtocol = lazy(async () => {
  const m = await import('@/components/O1LaunchProtocol');
  return { default: m.default || m.O1LaunchProtocol };
});
import { PremiumShowcaseModal } from '@/components/PremiumShowcaseModal';
import { FirstTimeOnboardingGuide } from '@/components/FirstTimeOnboardingGuide';
import { useSubscription } from '@/utils/useSubscription';
import { upsertUserProfile } from '@/utils/subscriptionStore';

export default function App() {
  const s = useAppState();
  const handle = s.handleForCurrentUserHandle();

  const [mounted, setMounted] = useState<Record<string, boolean>>({ tracker: true });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showPremiumShowcase, setShowPremiumShowcase] = useState(false);
  const { trialDaysLeft } = useSubscription();

  // Stripe Checkout return session verification
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const sessionId = urlParams.get('session_id');
      const tierParam = urlParams.get('tier');

      if (paymentStatus === 'success') {
        const activatedTier = tierParam || 'premium';
        
        // Verify session with server if session_id is present
        if (sessionId) {
          fetch(`/api/stripe-verify-session?session_id=${sessionId}`)
            .then(res => res.json())
            .then(data => {
              if (data?.session?.payment_status === 'paid') {
                s.showToast('Stripe Payment Verified — Membership Active!', 'success');
              }
            })
            .catch(() => {
              // fallback
            });
        }

        // Store active subscription
        localStorage.setItem('o1fc_active_subscription', JSON.stringify({
          tier: activatedTier,
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          stripeSessionId: sessionId || undefined,
        }));

        upsertUserProfile({ subscription_tier: activatedTier as any }).catch(() => {});
        s.showToast(`O1FC ${activatedTier.replace('_', ' ').toUpperCase()} Activated!`, 'success');

        // Clean query params from address bar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else if (paymentStatus === 'cancel') {
        s.showToast('Checkout cancelled.', 'info' as any);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  useEffect(() => {
    if (!mounted[s.currentMode]) {
      setMounted(prev => ({ ...prev, [s.currentMode]: true }));
    }
  }, [s.currentMode]);

  return (
    <ErrorBoundary>
    <div className="w-full max-w-full h-[100dvh] overflow-hidden box-border flex flex-col items-center justify-start bg-[#F2F2F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-white transition-colors duration-300 font-sans antialiased relative selection:bg-accent/20 selection:text-accent safe-top">
      <Toast toasts={s.toasts} />

      {isOffline && s.isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-center gap-2 py-1.5 bg-amber-600 text-white text-xs font-medium">
          <WifiOff size={14} />
          <span>You're offline — changes will sync when reconnected</span>
        </div>
      )}

      {s.isCheckingSession && !s.isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F2F7] dark:bg-[#000000]">
          <div className="w-10 h-10 border-3 border-current/20 border-t-current rounded-full animate-spin" />
        </div>
      )}

      {(!s.isAuthenticated || s.isAuthModalOpen) && !s.isCheckingSession && (
        <AuthModal
          onSuccess={s.handleAuthSuccess}
          onClose={s.isAuthenticated ? () => s.setIsAuthModalOpen(false) : undefined}
          showToast={s.showToast}
          isFullPage={!s.isAuthenticated}
          theme={s.theme}
          onToggleTheme={s.toggleTheme}
        />
      )}

      {/* Consent gate can be accessed from Settings/Legal when needed, no longer blocking dashboard */}

      {s.isAuthenticated && (s.showQuickSetup || s.showWelcomeOnboarding) && !s.needsOAuthConsent && (
        <Suspense fallback={null}>
          <O1LaunchProtocol
            isOpen={true}
            userEmail={s.currentUserEmail}
            initialName={s.athleteName}
            onComplete={(data) => {
              if (data.displayName) s.setAthleteName(data.displayName);
              if (data.handle) s.setAthleteHandle(data.handle);
              if (data.profileImage) s.setProfileImage(data.profileImage);
              if (data.role === 'coach') s.handleModeChange('coach');
              s.setShowQuickSetup(false);
              s.setShowWelcomeOnboarding(false);
              s.showToast('Welcome to O1 FC — Launch Protocol complete', 'success');
              try {
                if (!localStorage.getItem('o1fc_premium_showcase_shown')) {
                  localStorage.setItem('o1fc_premium_showcase_shown', '1');
                  setTimeout(() => setShowPremiumShowcase(true), 800);
                }
              } catch {}
            }}
            onNavigateTo={(target) => {
              if (target === 'tracker' || target === 'fuel' || target === 'coach' || target === 'client') {
                s.handleModeChange(target);
              } else if (target === 'community') {
                s.setIsCommunityHubOpen(true);
              } else if (target === 'goal') {
                s.setIsShareModalOpen(true);
              }
            }}
          />
        </Suspense>
      )}

      {s.isAuthenticated && !s.isAuthModalOpen && !s.showQuickSetup && !s.showWelcomeOnboarding && (
        <>
          <HeaderActions
            onOpenProfile={() => s.setIsEditProfileOpen(true)}
            onOpenVault={s.handleOpenVaultViewer}
            profileImage={s.profileImage}
            userName={s.athleteName}
            showToast={s.showToast}
            currentMode={s.currentMode}
            onModeChange={s.handleModeChange}
            syncStatus={s.syncStatus}
            onSyncPendingLogs={s.handleManualSyncPendingLogs}
            onOpenCommunityHub={() => s.setIsCommunityHubOpen(true)}
            onOpenShareGoalCard={() => s.setIsShareModalOpen(true)}
            onOpenSearch={() => s.setIsGlobalSearchOpen(true)}
            showTrigger={false}
          />

          <BottomNavBar
            currentMode={s.currentMode}
            onModeChange={s.handleModeChange}
            onOpenProfile={() => s.setIsEditProfileOpen(true)}
            currentUserEmail={s.currentUserEmail}
            userName={s.athleteName}
            isAuthenticated={s.isAuthenticated}
            onLogout={s.handleLogout}
            onOpenExportHelp={() => s.setIsExportHelpOpen(true)}
            theme={s.theme}
            onToggleTheme={s.toggleTheme}
            profileImage={s.profileImage}
            onUpdateProfileImage={s.handleUpdateProfileImage}
            themeAccent={s.themeAccent}
            onUpdateThemeAccent={s.handleUpdateThemeAccent}
            onExportData={s.handleExportData}
            onOpenGymNetwork={() => s.setIsBuddyRadarOpen(true)}
          />

          <RestTimerHUD
            seconds={s.restTimerSecs}
            running={s.restTimerRunning}
            paused={s.restTimerPaused}
            onAdd30={() => s.addRestTime(30)}
            onPauseResume={() => s.restTimerPaused ? s.resumeRestTimer() : s.pauseRestTimer()}
            onSkip={s.skipRestTimer}
          />

          <main
            onTouchStart={s.handleTouchStart}
            onTouchEnd={s.handleTouchEnd}
            className="w-full max-w-md mx-auto px-3 sm:px-4 pt-0.5 pb-[calc(env(safe-area-inset-bottom,0px)+3.75rem)] flex-1 flex flex-col items-center justify-start relative z-10 box-border overflow-y-auto overflow-x-hidden hide-scrollbar overscroll-contain"
          >
            {/* Tracker tab - always mounted */}
            <div className={`w-full flex flex-col gap-2 ${s.currentMode === 'tracker' ? 'tab-view-enter' : 'hidden'}`}>
              <ViewBoundary fallbackLabel="Athletic Overview">
                <HomeView
                  userName={s.athleteName}
                  currentUserEmail={s.currentUserEmail || 'athlete@o1fc.app'}
                  profileImage={s.profileImage}
                  dailyMeals={s.dailyMeals}
                  activeLogs={s.activeLogs}
                  weeklySchedule={s.weeklySchedule}
                  goalCals={s.goalCals}
                  goalP={s.goalP}
                  goalC={s.goalC}
                  goalF={s.goalF}
                  showToast={s.showToast}
                  onNavigate={(mode) => s.handleModeChange(mode)}
                  onOpenCycleSync={() => s.setIsCycleSyncOpen(true)}
                  onOpenHydrationTracker={() => {
                    s.handleModeChange('fuel');
                    setTimeout(() => document.getElementById('fuel-hydration-tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
                  }}
                  onOpenSupplementTracker={() => {
                    s.handleModeChange('fuel');
                    setTimeout(() => document.getElementById('fuel-supplement-tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
                  }}
                  onOpenAlcoholTracker={() => {
                    s.handleModeChange('fuel');
                    setTimeout(() => document.getElementById('fuel-alcohol-tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
                  }}
                  onOpenQuickStrike={() => {
                    document.getElementById('solo-workout-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  selectedDay={s.selectedDay}
                  onSelectDay={s.handleSelectDay}
                  onOpenScheduleModal={() => s.setIsScheduleModalOpen(true)}
                  stepTarget={s.stepTarget}
                  setStepTarget={s.setStepTarget}
                  restTimerSecs={s.restTimerSecs}
                  setRestTimerSecs={s.setRestTimerSecs}
                  restTimerRunning={s.restTimerRunning}
                  onToggleRestTimer={() => s.setRestTimerRunning(!s.restTimerRunning)}
                  onOpenDial={s.openDial}
                  onOpenCommitModal={() => s.setIsCommitModalOpen(true)}
                  theme={s.theme}
                  onOpenProfile={() => s.setIsEditProfileOpen(true)}
                  setActiveLogs={s.setActiveLogs}
                  onUpdateWeeklySchedule={(newSched) => {
                    s.setWeeklySchedule(newSched);
                    try { localStorage.setItem('lumina_weekly_schedule', JSON.stringify(newSched)); } catch {}
                  }}
                  onNavigateToTandem={() => s.setShowTandemPanel(true)}
                  onTapSelf={() => s.setIsOwnProfileOpen(true)}
                  handle={handle}
                  onUpgrade={() => { s.setPayPlanHighlightTier('premium'); s.setIsPayPlanOpen(true); }}
                />
              </ViewBoundary>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-[#E5E5EA] dark:bg-white/10" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#848785] dark:text-gray-500">Training Hub</span>
                <div className="flex-1 h-px bg-[#E5E5EA] dark:bg-white/10" />
              </div>

              <div id="solo-workout-section">
                <ViewBoundary fallbackLabel="Training Hub">
                <SoloView
                  weeklySchedule={s.weeklySchedule}
                  onUpdateWeeklySchedule={(newSched) => {
                    s.setWeeklySchedule(newSched);
                    try { localStorage.setItem('lumina_weekly_schedule', JSON.stringify(newSched)); } catch {}
                  }}
                  selectedDay={s.selectedDay}
                  onSelectDay={s.handleSelectDay}
                  onOpenScheduleModal={() => s.setIsScheduleModalOpen(true)}
                  onOpenRoutineSwapper={() => s.setIsRoutineSwapperOpen(true)}
                  onOpenCommitModal={() => s.setIsCommitModalOpen(true)}
                  onOpenDial={s.openDial}
                  showToast={s.showToast}
                  theme={s.theme}
                  onToggleTheme={s.toggleTheme}
                  activeLogs={s.activeLogs}
                  setActiveLogs={s.setActiveLogs}
                  stepTarget={s.stepTarget}
                  setStepTarget={s.setStepTarget}
                  restTimerSecs={s.restTimerSecs}
                  setRestTimerSecs={s.setRestTimerSecs}
                  restTimerRunning={s.restTimerRunning}
                  onToggleRestTimer={() => s.setRestTimerRunning(!s.restTimerRunning)}
                  onStartRestTimer={(secs) => { s.startRestTimer(secs); }}
                  syncStatus={s.syncStatus}
                  onSyncPendingLogs={s.handleManualSyncPendingLogs}
                  onOpenShareGoalCard={() => s.setIsShareModalOpen(true)}
                  currentUserEmail={s.currentUserEmail || 'athlete@o1fc.app'}
                  profileImage={s.profileImage}
                  onOpenProfile={() => s.setIsEditProfileOpen(true)}
                  onOpenAIInsights={() => s.setIsAIInsightsOpen(true)}
                  onOpenPayPlan={() => { s.setPayPlanHighlightTier('premium'); s.setIsPayPlanOpen(true); }}
                />
                </ViewBoundary>
              </div>
            </div>

            {/* Fuel tab */}
            {mounted['fuel'] && (
              <div className={`w-full flex flex-col gap-2 ${s.currentMode === 'fuel' ? 'tab-view-enter' : 'hidden'}`}>
                <ViewBoundary fallbackLabel="Fuel OS">
                  <FuelView
                    dailyMeals={s.dailyMeals}
                    activeLogs={s.activeLogs}
                    onOpenAutoPilot={() => s.setIsAutoPilotOpen(true)}
                    onOpenFoodModal={(meal) => s.setFoodModalMeal(meal)}
                    onOpenScanModal={(meal) => s.setAiScanMeal(meal)}
                    onDeleteMealItem={s.handleDeleteMealItem}
                    onAddDirectMealItem={s.handleAddDirectMealItem}
                    bmr={s.bmr} setBmr={s.setBmr}
                    goalCals={s.goalCals} setGoalCals={s.setGoalCals}
                    goalP={s.goalP} setGoalP={s.setGoalP}
                    goalC={s.goalC} setGoalC={s.setGoalC}
                    goalF={s.goalF} setGoalF={s.setGoalF}
                    showToast={s.showToast}
                    currentUserEmail={s.currentUserEmail || 'athlete@o1fc.app'}
                  />
                </ViewBoundary>
              </div>
            )}

            {/* Tandem tab */}
            {mounted['tandem'] && (
              <div className={`w-full flex flex-col gap-2 ${s.currentMode === 'tandem' ? 'tab-view-enter' : 'hidden'}`}>
                <ViewBoundary fallbackLabel="Tandem Sync">
                  <TandemView theme={s.theme} showToast={s.showToast} currentUserEmail={s.currentUserEmail} />
                </ViewBoundary>
              </div>
            )}

            {/* Coach tab */}
            {mounted['coach'] && (
              <div className={`w-full flex flex-col gap-2 ${s.currentMode === 'coach' ? 'tab-view-enter' : 'hidden'}`}>
                <ViewBoundary fallbackLabel="Coach Hub">
                <FitnessIntelligenceApp
                  initialTab="Coach"
                  showTopNavTabs={false}
                  onSelectClient={(client) => s.setSelectedCoachClient(client)}
                  currentUserEmail={s.currentUserEmail}
                  setActiveLogs={s.setActiveLogs}
                  onSwitchToWorkout={() => s.handleModeChange('tracker')}
                  registerWorkoutRef={s.registerWorkoutRef}
                  sessionVaultRefresh={s.sessionVaultRefresh}
                  profileImage={s.profileImage}
                  userName={s.athleteName}
                  handle={handle}
                  showToast={s.showToast}
                  onTapSelf={() => s.handleModeChange('client')}
                  onTapPartner={() => s.setShowTandemPanel(true)}
                />
                </ViewBoundary>
              </div>
            )}

            {/* Client/Athlete tab */}
            {mounted['client'] && (
              <div className={`w-full flex flex-col gap-2 ${s.currentMode === 'client' ? 'tab-view-enter' : 'hidden'}`}>
                <ViewBoundary fallbackLabel="Athlete Session Vault">
                  <AthleteView currentUserEmail={s.currentUserEmail} sessionVaultRefresh={s.sessionVaultRefresh} />
                </ViewBoundary>
              </div>
            )}
          </main>

          <ViewBoundary fallbackLabel="Dialogs & Overlays">
            <ModalsLayer s={s} />
          </ViewBoundary>

          <PremiumShowcaseModal
            isOpen={showPremiumShowcase}
            onClose={() => setShowPremiumShowcase(false)}
            trialDaysLeft={trialDaysLeft}
          />

          <FirstTimeOnboardingGuide />
        </>
      )}
    </div>
    </ErrorBoundary>
  );
}
