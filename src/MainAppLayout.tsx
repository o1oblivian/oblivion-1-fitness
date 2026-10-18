import React, { Suspense, lazy, useLayoutEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TabMode, NavigationDock, toTabMode } from './components/NavigationDock';
import { WorkoutHub } from './features/workout/WorkoutHub';
import { FeatureErrorBoundary } from './components/common/FeatureErrorBoundary';
import { ModalRegistry } from './components/modals/ModalRegistry';
import { BasementOfflineBanner } from './components/common/BasementOfflineBanner';
import { armAthleteReminders } from './services/athleteReminderScheduler';
import { startSync } from './services/localFirstSync';
import { RestTimerBar } from './features/workout/components/RestTimerBar';
import { useRestTimerStore } from './features/workout/store/useRestTimerStore';

// Workout is the landing tab and loads with the app. The others load on first visit, and are fetched
// in the background right after the first screen so a tab switch does not wait on the network or the disk.
const loadFuel = () => import('./features/fuel/FuelView');
const loadCoach = () => import('./features/coach/CoachView');
const loadLog = () => import('./features/log/LogView');
const FuelHub = lazy(() => loadFuel().then((m) => ({ default: m.FuelView })));
const CoachHub = lazy(() => loadCoach().then((m) => ({ default: m.CoachView })));
const LogView = lazy(() => loadLog().then((m) => ({ default: m.LogView })));

const TabLoading: React.FC = () => (
  <div
    role="status"
    aria-label="Loading"
    className="min-h-[60dvh] flex items-center justify-center"
  >
    <Loader2 className="w-5 h-5 animate-spin text-o1-muted" aria-hidden />
  </div>
);
export const MainAppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('tracker');

  const restActive = useRestTimerStore((s) => s.timer !== null);

  const mainRef = useRef<HTMLElement>(null);

  const handleTabSelect = React.useCallback((tab: TabMode) => {
    setActiveTab((prev) => (prev === tab ? prev : tab));
  }, []);

  // The page itself scrolls (the <main> grows with its content), so reset both; resetting only
  // <main> left the next tab opening part-way down. Layout effect: no flash of the old position.
  useLayoutEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [activeTab]);

  React.useEffect(() => {
    return armAthleteReminders();
  }, []);

  React.useEffect(() => startSync(), []);

  React.useEffect(() => {
    const prefetch = () => {
      void loadFuel();
      void loadCoach();
      void loadLog();
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(prefetch, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(prefetch, 1500);
    return () => window.clearTimeout(id);
  }, []);

  React.useEffect(() => {
    const handleNavEvent = (e: Event) => {
      // Links, hashes and events can name a tab that does not exist; ignore those.
      const tab = toTabMode((e as CustomEvent<unknown>).detail);
      if (tab) handleTabSelect(tab);
    };
    window.addEventListener('app_navigate_tab', handleNavEvent);
    return () => window.removeEventListener('app_navigate_tab', handleNavEvent);
  }, [handleTabSelect]);

  return (
    <div className="relative min-h-dvh w-full bg-black text-o1-bone overflow-x-hidden selection:bg-o1-crimson selection:text-o1-bone transition-colors duration-200">
      <div className="min-h-dvh w-full bg-transparent text-o1-bone flex flex-col justify-between font-sans relative">
        <BasementOfflineBanner />

        <main
          ref={mainRef}
          className="w-full overflow-y-auto"
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: `calc(${restActive ? '8rem' : '4.75rem'} + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <div className="o1-shell">
            <FeatureErrorBoundary key={activeTab} featureName={`${activeTab} View`}>
              {(activeTab === 'tracker' || activeTab === 'workout') && <WorkoutHub />}
              <Suspense fallback={<TabLoading />}>
                {activeTab === 'fuel' && <FuelHub />}
                {activeTab === 'coach' && <CoachHub />}
                {activeTab === 'client' && <LogView />}
              </Suspense>
            </FeatureErrorBoundary>
          </div>
        </main>

        <RestTimerBar />
        {/* Floating Bottom Navigation Bar */}
        <NavigationDock currentMode={activeTab} onSelectTab={handleTabSelect} />
      </div>

      {/* Centralized Modals (Mounted single source of truth inside ModalRegistry) */}
      <ModalRegistry />
    </div>
  );
};
