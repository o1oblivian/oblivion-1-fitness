import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { fetchUserProfile, upsertUserProfile } from '@/utils/subscriptionStore';
import { cacheCurrentTier } from '@/utils/useSubscription';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import {
  AppMode,
  AthleteData,
  DailyMeals,
  DialConfig,
  ExerciseLog,
  FoodItem,
  LoggedMealItem,
  ToastMessage,
} from '@/types';
import {
  COACH_CLIENTS,
  INITIAL_FOOD_DB,
  ROUTINE_TEMPLATES,
} from '@/data/exerciseDatabase';
import {
  getSessionUserEmail,
  getUserState,
  saveUserState,
  setSessionUserEmail,
  UserAppState,
} from '@/utils/authStorage';
import { saveMealsToCloud, loadMealsFromCloud, loadCachedDailyMeals, saveDailyMealsLocalFirst, flushMealOfflineQueue } from '@/utils/mealLogsStore';
import { supabase, supabaseSignOut } from '@/utils/supabase';
import { getSmartDefault, recordSmartInput } from '@/utils/frequencyDefaults';
import {
  getIsOnline,
  getPendingLogsQueue,
  loadCachedActiveLogs,
  saveActiveLogsLocalFirst,
  subscribeWorkoutLogsSync,
  syncPendingWorkoutLogs,
} from '@/utils/workoutLogsStore';
import {
  buildSessionFromLogs,
  saveCompletedSession,
} from '@/utils/sessionVaultStore';
import { playRealBellSound } from '@/utils/audio';
import { restTimerEngine } from '@/utils/restTimerEngine';
import { haptic } from '@/utils/haptics';
import { subscribeToBuddyNotificationsRealtime } from '@/utils/gymNetworkStore';
import {
  TrialExercise,
  CoachProgram,
  injectTrialExercise,
  isCoachUnlocked,
  setCoachUnlocked,
} from '@/utils/coachMarketplaceStore';
import { trackPageView, trackFeatureUsed } from '@/utils/analytics';
import {
  startReminderPolling,
  stopReminderPolling,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/utils/reminderEngine';
import { startMidnightRolloverScheduler, getLocalDateString } from '@/utils/midnightRolloverEngine';
import { getInputMethod } from '@/utils/inputMethodStore';
import { ProgramPreview } from '@/utils/reelsTypes';
import type { WorkoutRegistration } from '@/components/FitnessIntelligenceApp';
import { VaultMediaItem } from '@/components/MediaVaultModal';
import {
  DisplayTheme,
  applyAndSaveTheme,
  getSavedThemePreference,
} from '@/utils/themeStorage';
import { backNavManager } from '@/utils/backNavigationManager';
import { useModalBackHandler } from '@/utils/modalHistory';


export function formatDuration(secs: number): string {
  if (secs <= 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface CoachShowroomData {
  items: VaultMediaItem[];
  maskedName: string;
  realName?: string;
  isUnlocked: boolean;
  socialLinks?: { instagram?: string; tiktok?: string; strava?: string };
  programPrice?: string;
  coachEmail?: string;
  program?: CoachProgram;
}

export function useAppState() {
  // ─── Modal visibility ───
  const [isExportHelpOpen, setIsExportHelpOpen] = useState(false);
  const [isGymNetworkOpen, setIsGymNetworkOpen] = useState(false);
  const [isBuddyRadarOpen, setIsBuddyRadarOpen] = useState(false);
  const [isOwnProfileOpen, setIsOwnProfileOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showTandemPanel, setShowTandemPanel] = useState(false);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [isPayPlanOpen, setIsPayPlanOpen] = useState(false);
  const [isTravelPassOpen, setIsTravelPassOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommunityHubOpen, setIsCommunityHubOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [shareClientProgressAthlete, setShareClientProgressAthlete] = useState<AthleteData | null>(null);
  const [payPlanHighlightTier, setPayPlanHighlightTier] = useState<'premium' | 'coach'>('premium');
  const [modalOpenedFromSettings, setModalOpenedFromSettings] = useState(false);

  // ─── Auth ───
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => getSessionUserEmail() || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getSessionUserEmail());
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(() => !getSessionUserEmail());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [showWelcomeOnboarding, setShowWelcomeOnboarding] = useState(false);
  const [needsOAuthConsent, setNeedsOAuthConsent] = useState(false);

  // ─── Navigation ───
  const NAVIGATION_MODES: AppMode[] = ['tracker', 'fuel', 'coach', 'client'];
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem('o1fc_active_mode');
      if (saved && (saved === 'tracker' || saved === 'fuel' || saved === 'coach' || saved === 'client')) {
        return saved as AppMode;
      }
    } catch {}
    return 'tracker';
  });
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);

  // ─── Toasts ───
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ─── Theme ───
  const [theme, setThemeState] = useState<DisplayTheme>(() => getSavedThemePreference());

  const setTheme = (t: DisplayTheme | ((prev: DisplayTheme) => DisplayTheme)) => {
    setThemeState((prev) => {
      const nextTheme = typeof t === 'function' ? t(prev) : t;
      applyAndSaveTheme(nextTheme);
      return nextTheme;
    });
  };

  const [themeAccent, setThemeAccent] = useState<string>(() => {
    try { const s = localStorage.getItem('lumina_theme_accent'); if (s) return s; } catch {}
    return '#3B624E';
  });

  const [themePalette, setThemePalette] = useState<'natural' | 'neon'>(() => {
    try { const s = localStorage.getItem('lumina_theme_palette'); if (s === 'natural' || s === 'neon') return s; } catch {}
    return 'natural';
  });

  // ─── Solo mode ───
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>(() => {
    try { const s = localStorage.getItem('lumina_weekly_schedule'); if (s) return JSON.parse(s); } catch {}
    return { Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '' };
  });

  const getTodayDayName = (): string => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(getTodayDayName);
  const [stepTarget, setStepTargetState] = useState(() => getSmartDefault('step_target', 0));
  const [restTimerSecs, setRestTimerSecsState] = useState(() => getSmartDefault('rest_timer_secs', 0));
  const [restTimerRunning, setRestTimerRunning] = useState(false);

  const setStepTarget = (val: number) => { recordSmartInput('step_target', val); setStepTargetState(val); };
  const setRestTimerSecs: React.Dispatch<React.SetStateAction<number>> = (valueAction) => {
    setRestTimerSecsState((prev) => {
      const nextVal = typeof valueAction === 'function' ? valueAction(prev) : valueAction;
      recordSmartInput('rest_timer_secs', nextVal);
      return nextVal;
    });
  };

  // ─── Sync & workout logs ───
  const [syncStatus, setSyncStatus] = useState<{ isOnline: boolean; pendingCount: number }>(() => ({
    isOnline: getIsOnline(),
    pendingCount: getPendingLogsQueue(getSessionUserEmail() || '').length,
  }));
  const [activeLogs, setActiveLogs] = useState<ExerciseLog[]>(() => loadCachedActiveLogs(getSessionUserEmail() || ''));

  // ─── Fuel mode ───
  const [bmr, setBmrState] = useState(() => getSmartDefault('fuel_bmr', 0));
  const [goalCals, setGoalCalsState] = useState(() => getSmartDefault('fuel_goal_cals', 0));
  const [goalP, setGoalPState] = useState(() => getSmartDefault('fuel_goal_p', 0));
  const [goalC, setGoalCState] = useState(() => getSmartDefault('fuel_goal_c', 0));
  const [goalF, setGoalFState] = useState(() => getSmartDefault('fuel_goal_f', 0));

  const setBmr = (val: number) => { recordSmartInput('fuel_bmr', val); setBmrState(val); };
  const setGoalCals = (val: number) => { recordSmartInput('fuel_goal_cals', val); setGoalCalsState(val); };
  const setGoalP = (val: number) => { recordSmartInput('fuel_goal_p', val); setGoalPState(val); };
  const setGoalC = (val: number) => { recordSmartInput('fuel_goal_c', val); setGoalCState(val); };
  const setGoalF = (val: number) => { recordSmartInput('fuel_goal_f', val); setGoalFState(val); };

  const [dailyMeals, setDailyMeals] = useState<DailyMeals>(() => {
    const email = getSessionUserEmail() || '';
    const todayStr = getLocalDateString();
    // 1. Try dedicated fast meals cache
    const cached = loadCachedDailyMeals(email, todayStr);
    if (cached) return cached;
    // 2. Try userAppState
    if (email) {
      const saved = getUserState(email);
      if (saved?.dailyMeals && (!saved.mealsDate || saved.mealsDate === todayStr)) {
        return saved.dailyMeals;
      }
    }
    return { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] };
  });

  const [foodDB, setFoodDB] = useState<Record<string, FoodItem[]>>(() => {
    let custom: Record<string, FoodItem[]> = {};
    try { const r = localStorage.getItem('lumina_custom_foods'); if (r) custom = JSON.parse(r); } catch {}
    const db: Record<string, FoodItem[]> = {};
    for (const cat in INITIAL_FOOD_DB) { db[cat] = [...INITIAL_FOOD_DB[cat], ...(custom[cat] || [])]; }
    return db;
  });

  // ─── Coach / Athlete ───
  const [coachClients, setCoachClients] = useState(COACH_CLIENTS);
  const [selectedCoachClient, setSelectedCoachClient] = useState<AthleteData | null>(null);
  const [athleteName, setAthleteName] = useState('');
  const [athleteHandle, setAthleteHandle] = useState('');
  const [profileImage, setProfileImage] = useState<string>(() => {
    try { const s = localStorage.getItem('lumina_profile_image'); if (s) return s; } catch {}
    return '';
  });

  // ─── Modals ───
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRoutineSwapperOpen, setIsRoutineSwapperOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const registerWorkoutRef = useRef<((reg: WorkoutRegistration) => void) | null>(null);
  const [sessionVaultRefresh, setSessionVaultRefresh] = useState(0);
  const workoutStartRef = useRef<number>(Date.now());
  const [isAutoPilotOpen, setIsAutoPilotOpen] = useState(false);
  const [isCycleSyncOpen, setIsCycleSyncOpen] = useState(false);
  const [foodModalMeal, setFoodModalMeal] = useState<keyof DailyMeals | null>(null);
  const [customFoodQuery, setCustomFoodQuery] = useState<string | null>(null);
  const [aiScanMeal, setAiScanMeal] = useState<keyof DailyMeals | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isVaultViewerOpen, setIsVaultViewerOpen] = useState(false);
  const [vaultViewerIndex, setVaultViewerIndex] = useState(0);
  const [showReminderManager, setShowReminderManager] = useState(false);

  // ─── Coach Showroom ───
  const [isCoachShowroomOpen, setIsCoachShowroomOpen] = useState(false);
  const [programToBuy, setProgramToBuy] = useState<ProgramPreview | null>(null);
  const [coachShowroomData, setCoachShowroomData] = useState<CoachShowroomData | null>(null);

  // ─── Dial ───
  const [dialConfig, setDialConfig] = useState<DialConfig>({
    isOpen: false, type: 'Value', maxVal: 500, currentVal: 0, onConfirm: () => {},
  });

  // ─── Modal Back-Navigation Stack Integration ───
  useModalBackHandler(isScheduleModalOpen, () => setIsScheduleModalOpen(false), 'modal_schedule');
  useModalBackHandler(isRoutineSwapperOpen, () => setIsRoutineSwapperOpen(false), 'modal_routine_swapper');
  useModalBackHandler(isCommitModalOpen, () => setIsCommitModalOpen(false), 'modal_commit');
  useModalBackHandler(isAutoPilotOpen, () => setIsAutoPilotOpen(false), 'modal_autopilot');
  useModalBackHandler(isCycleSyncOpen, () => setIsCycleSyncOpen(false), 'modal_cycle_sync');
  useModalBackHandler(foodModalMeal !== null, () => setFoodModalMeal(null), 'modal_food_meal');
  useModalBackHandler(customFoodQuery !== null, () => setCustomFoodQuery(null), 'modal_custom_food');
  useModalBackHandler(aiScanMeal !== null, () => setAiScanMeal(null), 'modal_ai_scan');
  useModalBackHandler(isEditProfileOpen, () => setIsEditProfileOpen(false), 'modal_edit_profile');
  useModalBackHandler(isVaultViewerOpen, () => setIsVaultViewerOpen(false), 'modal_vault_viewer');
  useModalBackHandler(showReminderManager, () => setShowReminderManager(false), 'modal_reminders');
  useModalBackHandler(isCoachShowroomOpen, () => setIsCoachShowroomOpen(false), 'modal_coach_showroom');
  useModalBackHandler(programToBuy !== null, () => setProgramToBuy(null), 'modal_program_to_buy');
  useModalBackHandler(dialConfig.isOpen, () => setDialConfig((p) => ({ ...p, isOpen: false })), 'modal_dial');
  useModalBackHandler(isExportHelpOpen, () => setIsExportHelpOpen(false), 'modal_export_help');
  useModalBackHandler(isGymNetworkOpen, () => setIsGymNetworkOpen(false), 'modal_gym_network');
  useModalBackHandler(isBuddyRadarOpen, () => setIsBuddyRadarOpen(false), 'modal_buddy_radar');
  useModalBackHandler(isOwnProfileOpen, () => setIsOwnProfileOpen(false), 'modal_own_profile');
  useModalBackHandler(showTandemPanel, () => setShowTandemPanel(false), 'modal_tandem_panel');
  useModalBackHandler(isAIInsightsOpen, () => setIsAIInsightsOpen(false), 'modal_ai_insights');
  useModalBackHandler(isPayPlanOpen, () => setIsPayPlanOpen(false), 'modal_pay_plan');
  useModalBackHandler(isTravelPassOpen, () => setIsTravelPassOpen(false), 'modal_travel_pass');
  useModalBackHandler(isShareModalOpen, () => setIsShareModalOpen(false), 'modal_share');
  useModalBackHandler(isCommunityHubOpen, () => setIsCommunityHubOpen(false), 'modal_community');
  useModalBackHandler(isGlobalSearchOpen, () => setIsGlobalSearchOpen(false), 'modal_global_search');
  useModalBackHandler(shareClientProgressAthlete !== null, () => setShareClientProgressAthlete(null), 'modal_share_progress');

  // ═══════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════

  // Initialize Global Back Navigation Manager
  useEffect(() => {
    backNavManager.init(
      currentMode,
      (targetMode) => {
        haptic.tap();
        try {
          localStorage.setItem('o1fc_active_mode', targetMode);
        } catch {}
        const oldIdx = NAVIGATION_MODES.indexOf(currentMode);
        const newIdx = NAVIGATION_MODES.indexOf(targetMode);
        if (oldIdx !== -1 && newIdx !== -1) setSlideDirection(newIdx > oldIdx ? 'left' : 'right');
        setCurrentMode(targetMode);
        trackPageView(targetMode);
        requestAnimationFrame(() => document.querySelector('.overflow-y-auto.hide-scrollbar')?.scrollTo(0, 0));
      },
      (msg) => showToast(msg, 'success')
    );
  }, [currentMode]);


  // Global pointer tracker for modal origin animations
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      document.documentElement.style.setProperty('--click-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--click-y', `${e.clientY}px`);
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, []);

  // Ref to suppress duplicate SIGNED_IN events after handleAuthSuccess already set state
  const authHandledRef = useRef(false);

  // Auth session check + listener
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 1000)
        );
        const sessionPromise = supabase.auth.getSession();
        const { data } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (data?.session?.user?.email && isMounted) {
          const email = data.session.user.email;
          setCurrentUserEmail(email);
          setSessionUserEmail(email);
          setCurrentUserId(data.session.user.id);
          setIsAuthenticated(true);
          setIsAuthModalOpen(false);
          setIsCheckingSession(false);
          authHandledRef.current = true;
          flushMealOfflineQueue();
          
          const hasCompletedSetup = localStorage.getItem(`o1fc_quicksetup_completed_${email}`) === 'true';
          if (!hasCompletedSetup && isMounted) {
            setShowQuickSetup(true);
          }
          return;
        }
      } catch {}
      
      if (!isMounted) return;
      const savedEmail = getSessionUserEmail();
      if (savedEmail) {
        setCurrentUserEmail(savedEmail);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        authHandledRef.current = true;
        const hasCompletedSetup = localStorage.getItem(`o1fc_quicksetup_completed_${savedEmail}`) === 'true';
        if (!hasCompletedSetup) {
          setShowQuickSetup(true);
        }
      }
      setIsCheckingSession(false);
    }
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        authHandledRef.current = false;
        setCurrentUserEmail(''); setSessionUserEmail(null); setIsAuthenticated(false); setIsAuthModalOpen(true);
        return;
      }
      if (authHandledRef.current) return;
      if (session?.user?.email && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        authHandledRef.current = true;
        setCurrentUserEmail(session.user.email);
        setSessionUserEmail(session.user.email);
        setCurrentUserId(session.user.id);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
      }
    });
    return () => { authListener.subscription?.unsubscribe(); };
  }, []);

  // Stripe payment return URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      showToast('Payment successful! Your membership is now active.', 'success');
      (async () => { const p = await fetchUserProfile(); if (p?.subscription_tier) cacheCurrentTier(p.subscription_tier); })();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      showToast('Payment cancelled. You can try again anytime.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Buddy notifications realtime
  useEffect(() => {
    const userEmail = currentUserEmail || 'athlete@o1fc.app';
    const unsubscribe = subscribeToBuddyNotificationsRealtime(userEmail, (notif) => {
      try { playRealBellSound(); } catch {}
      let msg = '';
      if (notif.type === 'connection_request') msg = `Partner Request: ${notif.sender_name} sent a Gym Partner Connection Request`;
      else if (notif.type === 'meeting_suggestion') msg = `Meeting Request: ${notif.sender_name} suggested a workout meeting`;
      else if (notif.type === 'request_accepted') msg = `Request Accepted: ${notif.sender_name} accepted your connection request`;
      if (msg) setToasts((prev) => [...prev, { id: String(Date.now()), type: 'success', message: msg }]);
    });
    return () => { unsubscribe(); };
  }, [currentUserEmail]);

  // Theme palette sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme-palette', themePalette);
    document.documentElement.style.setProperty('--accent-color', themeAccent);
  }, [themePalette, themeAccent]);

  // Load user state
  useEffect(() => {
    if (!currentUserEmail) return;
    const saved = getUserState(currentUserEmail);
    // Hydrate profile from Supabase user_profiles for permanent cross-device persistence
    fetchUserProfile().then(cloudProfile => {
      if (cloudProfile) {
        if (cloudProfile.display_name) setAthleteName(cloudProfile.display_name);
        if (cloudProfile.profile_image_url) setProfileImage(cloudProfile.profile_image_url);
      }
    }).catch(() => {});

    if (saved) {
      const todayStr = getLocalDateString();
      if (saved.athleteName) setAthleteName(saved.athleteName);
      if (saved.athleteHandle) setAthleteHandle(saved.athleteHandle);
      if (saved.weeklySchedule) setWeeklySchedule(saved.weeklySchedule);

      // Only restore active workout logs if they belong to today (yesterday was auto-archived)
      if (saved.activeLogs) {
        if (!saved.activeLogsDate || saved.activeLogsDate === todayStr) {
          setActiveLogs(saved.activeLogs);
        } else {
          setActiveLogs([]);
        }
      }

      // Only restore daily meals if they were logged on today's date
      // Check local cache first, then saved user state
      const cachedMeals = loadCachedDailyMeals(currentUserEmail, todayStr);
      const isMealToday = saved.mealsDate === todayStr;
      if (cachedMeals && Object.values(cachedMeals).flat().length > 0) {
        setDailyMeals(cachedMeals);
      } else if (saved.dailyMeals && isMealToday) {
        setDailyMeals(saved.dailyMeals);
      } else if (!isMealToday) {
        setDailyMeals({ breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] });
      }

      loadMealsFromCloud(currentUserEmail, todayStr).then(c => {
        if (c) {
          const currentMeals = loadCachedDailyMeals(currentUserEmail, todayStr) || (isMealToday ? saved.dailyMeals : null);
          const currentTotal = currentMeals ? Object.values(currentMeals).flat().length : 0;
          const cloudTotal = Object.values(c).flat().length;
          if (cloudTotal >= currentTotal && cloudTotal > 0) {
            setDailyMeals(c);
            saveDailyMealsLocalFirst(currentUserEmail, c, todayStr);
          }
        }
      }).catch(() => {});

      if (saved.stepTarget) setStepTarget(saved.stepTarget);
      if (saved.bmr) setBmr(saved.bmr);
      if (saved.goalCals) setGoalCals(saved.goalCals);
      if (saved.goalP) setGoalP(saved.goalP);
      if (saved.goalC) setGoalC(saved.goalC);
      if (saved.goalF) setGoalF(saved.goalF);
      if (saved.theme) setTheme(saved.theme);
      if (saved.profileImage) setProfileImage(saved.profileImage);
      if (saved.themeAccent) setThemeAccent(saved.themeAccent);
    }
  }, [currentUserEmail]);

  // Auto-save user state (debounced meal cloud save)
  const mealSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !currentUserEmail) return;
    const todayStr = getLocalDateString();
    const userState: UserAppState = {
      athleteName, athleteHandle, weeklySchedule, activeLogs, dailyMeals,
      mealsDate: todayStr,
      activeLogsDate: todayStr,
      stepTarget, bmr, goalCals, goalP, goalC, goalF, theme, profileImage, themeAccent,
    };
    saveUserState(currentUserEmail, userState);
    if (mealSaveTimer.current) clearTimeout(mealSaveTimer.current);
    mealSaveTimer.current = setTimeout(() => {
      saveMealsToCloud(currentUserEmail, dailyMeals, todayStr).catch(() => {});
      if (athleteName || profileImage) {
        upsertUserProfile({
          display_name: athleteName || null,
          profile_image_url: profileImage || null,
        }).catch(() => {});
      }
    }, 1500);
  }, [isAuthenticated, currentUserEmail, athleteName, athleteHandle, weeklySchedule, activeLogs, dailyMeals, stepTarget, bmr, goalCals, goalP, goalC, goalF, theme, profileImage, themeAccent]);

  // Coach vault event listener
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const vaultItems: VaultMediaItem[] = (detail.items || []).map((m: any) => ({
        id: m.id, title: m.title, type: m.type === 'image' ? 'photo' : m.type,
        url: m.url, thumbnailUrl: m.thumbnailUrl || m.url,
        category: 'Transformation', date: 'RECENT', likes: 0, tags: m.tags, specialization: m.specialization,
      }));
      const coachEmail = detail.coachEmail || '';
      setCoachShowroomData({
        items: vaultItems, maskedName: detail.maskedName || 'Elite Performance Coach',
        realName: detail.realName, isUnlocked: isCoachUnlocked(coachEmail),
        socialLinks: detail.socialLinks, programPrice: detail.programPrice, coachEmail, program: detail.program,
      });
      setIsCoachShowroomOpen(true);
    };
    window.addEventListener('open_coach_vault', handler as EventListener);
    return () => window.removeEventListener('open_coach_vault', handler as EventListener);
  }, []);

  // Reminder polling
  useEffect(() => {
    if (!currentUserEmail) return;
    requestNotificationPermission();
    startReminderPolling(currentUserEmail, (reminder) => {
      showToast(reminder.title, 'success');
      showBrowserNotification(reminder.title, reminder.body);
    });
    return () => stopReminderPolling();
  }, [currentUserEmail]);

  // Automatic Midnight History Rollover
  const activeLogsRef = useRef(activeLogs);
  activeLogsRef.current = activeLogs;
  const dailyMealsRef = useRef(dailyMeals);
  dailyMealsRef.current = dailyMeals;
  useEffect(() => {
    if (!currentUserEmail) return;
    const unsub = startMidnightRolloverScheduler(
      currentUserEmail,
      () => activeLogsRef.current,
      (msg) => showToast(msg, 'success'),
      () => dailyMealsRef.current
    );
    return () => unsub();
  }, [currentUserEmail]);

  // Handle midnight rollover broadcast: clean reset to new day
  useEffect(() => {
    const handleRollover = (e: any) => {
      const todayStr = e.detail?.today || getLocalDateString();
      setDailyMeals({ breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] });
      setActiveLogs([]);
      if (currentUserEmail) {
        loadMealsFromCloud(currentUserEmail, todayStr).then(c => {
          if (c) setDailyMeals(c);
        }).catch(() => {});
      }
      showToast('New day initialized: Daily fuel & workout tracker refreshed.', 'success');
    };
    window.addEventListener('o1fc-midnight-rollover', handleRollover);
    return () => window.removeEventListener('o1fc-midnight-rollover', handleRollover);
  }, [currentUserEmail]);

  // Workout log sync subscription
  useEffect(() => {
    const unsub = subscribeWorkoutLogsSync(currentUserEmail, (status) => setSyncStatus(status));
    return () => unsub();
  }, [currentUserEmail]);

  // Batch sync toast
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.syncedCount > 0) showToast(`Online: Synced ${e.detail.syncedCount} workout log(s) to cloud`, 'success');
    };
    window.addEventListener('workout_logs_batch_synced', handler);
    return () => window.removeEventListener('workout_logs_batch_synced', handler);
  }, []);

  // Instant notification toast listener
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e.detail;
      if (detail && detail.title) {
        showToast(`${detail.title}: ${detail.body}`, 'success');
      }
    };
    window.addEventListener('ofc_instant_notification', handler);
    return () => window.removeEventListener('ofc_instant_notification', handler);
  }, []);

  // Local-first auto-save for activeLogs
  const prevActiveLogsLenRef = useRef(0);
  useEffect(() => {
    if (!activeLogs) return;
    if (prevActiveLogsLenRef.current === 0 && activeLogs.length > 0) workoutStartRef.current = Date.now();
    prevActiveLogsLenRef.current = activeLogs.length;
    saveActiveLogsLocalFirst(currentUserEmail, activeLogs).then((res) => {
      setSyncStatus({ isOnline: res.isOnline, pendingCount: res.pendingCount });
    });
  }, [activeLogs, currentUserEmail]);

  // Trial exercise / program dispatch listeners
  useEffect(() => {
    const handleTrialInject = (e: Event) => {
      const exercise = (e as CustomEvent<TrialExercise>).detail;
      if (!exercise) return;
      const newLog: ExerciseLog = {
        id: 'trial_ex_' + Math.random().toString(36).substring(2, 9),
        exerciseName: `${exercise.name} (Coach Trial)`,
        sets: Array.from({ length: exercise.sets || 3 }, () => ({
          id: 'set_' + Math.random().toString(36).substring(2, 9), reps: 0, weight: 0, rpe: 0,
        })),
      };
      setActiveLogs((prev) => [...prev, newLog]);
      showToast('Trial exercise added to your logger for today\'s workout!', 'success');
      setCurrentMode('tracker');
    };
    const handleProgramDispatch = (e: Event) => {
      const program = (e as CustomEvent<CoachProgram>).detail;
      if (!program) return;
      const newLogs: ExerciseLog[] = program.exercises.map((ex) => ({
        id: 'prog_ex_' + Math.random().toString(36).substring(2, 9),
        exerciseName: ex.name,
        sets: Array.from({ length: ex.sets || 3 }, () => ({
          id: 'set_' + Math.random().toString(36).substring(2, 9), reps: 0, weight: 0, rpe: 0,
        })),
      }));
      setActiveLogs(newLogs);
      haptic.pulse();
      showToast(`${program.programTitle} dispatched to your workout log!`, 'success');
      setCurrentMode('tracker');
    };
    window.addEventListener('trial_exercise_inject', handleTrialInject);
    window.addEventListener('coach_program_dispatch', handleProgramDispatch);
    return () => {
      window.removeEventListener('trial_exercise_inject', handleTrialInject);
      window.removeEventListener('coach_program_dispatch', handleProgramDispatch);
    };
  }, []);

  // Rest timer — backed by background Web Worker ticker & WakeLock engine
  const [restTimerPaused, setRestTimerPaused] = useState(false);

  useEffect(() => {
    const unsub = restTimerEngine.subscribe((state) => {
      setRestTimerSecsState(state.remainingSeconds);
      setRestTimerRunning(state.isRunning);
      setRestTimerPaused(state.isPaused);
    });

    const handleCompleted = (e: any) => {
      showToast(e.detail?.message || 'Rest time over! Next set ready.', 'success');
    };

    window.addEventListener('ofc_rest_timer_completed', handleCompleted);
    return () => {
      unsub();
      window.removeEventListener('ofc_rest_timer_completed', handleCompleted);
    };
  }, []);

  const startRestTimer = (seconds: number) => {
    restTimerEngine.start(seconds);
  };

  const pauseRestTimer = () => {
    restTimerEngine.pause();
  };

  const resumeRestTimer = () => {
    restTimerEngine.resume();
  };

  const addRestTime = (extraSecs: number) => {
    restTimerEngine.addTime(extraSecs);
  };

  const skipRestTimer = () => {
    restTimerEngine.stop();
  };

  // Theme sync
  useEffect(() => {
    applyAndSaveTheme(theme);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyAndSaveTheme('system');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [theme]);

  // ═══════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════

  const showToast = (msg?: string, type: 'success' | 'error' = 'success') => {
    if (!msg) return;
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message: msg, type: type === 'error' ? 'error' : 'success' }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };

  const toggleTheme = () => setTheme((prev) => prev === 'dark' ? 'light' : 'dark');

  const handleModeChange = (newMode: AppMode) => {
    if (newMode === currentMode) return;
    haptic.tap();
    try {
      localStorage.setItem('o1fc_active_mode', newMode);
    } catch {}
    const oldIdx = NAVIGATION_MODES.indexOf(currentMode);
    const newIdx = NAVIGATION_MODES.indexOf(newMode);
    if (oldIdx !== -1 && newIdx !== -1) setSlideDirection(newIdx > oldIdx ? 'left' : 'right');
    backNavManager.recordModeChange(newMode);
    setCurrentMode(newMode);
    trackPageView(newMode);
    requestAnimationFrame(() => document.querySelector('.overflow-y-auto.hide-scrollbar')?.scrollTo(0, 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, [role="dialog"], .no-swipe, [data-no-swipe="true"]')) {
      setTouchStart(null); return;
    }
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const dt = Date.now() - touchStart.time;
    if (dt < 650 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      const ci = NAVIGATION_MODES.indexOf(currentMode);
      if (ci !== -1) {
        if (dx < 0 && ci < NAVIGATION_MODES.length - 1) {
          handleModeChange(NAVIGATION_MODES[ci + 1]);
        } else if (dx > 0 && ci > 0) {
          handleModeChange(NAVIGATION_MODES[ci - 1]);
        }
      }
    }
    setTouchStart(null);
  };

  const handleSelectThemePalette = (palette: 'natural' | 'neon') => {
    const accent = palette === 'neon' ? '#C8A97E' : '#3B624E';
    setThemePalette(palette); setThemeAccent(accent);
    try { localStorage.setItem('lumina_theme_palette', palette); localStorage.setItem('lumina_theme_accent', accent); } catch {}
    document.documentElement.setAttribute('data-theme-palette', palette);
    document.documentElement.style.setProperty('--accent-color', accent);
    showToast(`Theme palette updated to ${palette === 'natural' ? 'Natural Organic' : 'Neon Cyber'}!`, 'success');
  };

  const handleUpdateProfileImage = (url: string) => {
    setProfileImage(url);
    try { localStorage.setItem('lumina_profile_image', url); } catch {}
    showToast('Profile picture updated!', 'success');
  };

  const handleUpdateThemeAccent = (hex: string) => {
    setThemeAccent(hex);
    try { localStorage.setItem('lumina_theme_accent', hex); } catch {}
    document.documentElement.style.setProperty('--accent-color', hex);
    showToast('Theme accent color updated!', 'success');
  };

  const handleExportData = () => {
    try {
      const blob = new Blob([JSON.stringify({
        athleteName, athleteHandle, profileImage, themeAccent, weeklySchedule, activeLogs, dailyMeals, stepTarget,
        exportedAt: new Date().toISOString(),
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'o1fc_athlete_backup.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('Exported athlete telemetry & logs!', 'success');
    } catch { showToast('Export failed', 'error'); }
  };

  const handleLogout = async () => {
    const prevEmail = currentUserEmail;
    try { await supabaseSignOut(); } catch {}
    setSessionUserEmail(null); setCurrentUserEmail(''); setIsAuthenticated(false); setIsAuthModalOpen(true);
    // Clear transient active logs while preserving user profile state & onboarding records for seamless sign-in
    if (prevEmail) {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes(prevEmail) && !key.includes('completed') && !key.includes('onboarding') && !key.includes('setup') && !key.includes('user_state_')) {
          localStorage.removeItem(key);
        }
      }
    }
    showToast('Logged out successfully');
  };

  const handleAuthSuccess = (email: string) => {
    authHandledRef.current = true;
    setCurrentUserEmail(email); setSessionUserEmail(email); setIsAuthenticated(true); setIsAuthModalOpen(false);
    
    // Only show Quick Setup if the user has never completed it before
    const hasCompletedSetup = localStorage.getItem(`o1fc_quicksetup_completed_${email}`) === 'true';
    if (!hasCompletedSetup) {
      setShowQuickSetup(true);
    } else {
      setShowQuickSetup(false);
    }

    showToast(`Signed in as ${email}`, 'success');
    trackFeatureUsed('auth_success');

    // Only show Welcome Onboarding if never seen before
    try {
      const hasSeenWelcome = localStorage.getItem(`o1fc_onboarding_completed_${email}`) === 'true';
      if (!hasSeenWelcome && !hasCompletedSetup) {
        setTimeout(() => setShowWelcomeOnboarding(true), 600);
      }
    } catch {}
  };

  const openDial = (type: string, maxVal: number, currentVal: number, onConfirm: (val: number) => void) => {
    setDialConfig({
      isOpen: true, type, maxVal, currentVal,
      onConfirm: (val: number) => { onConfirm(val); setDialConfig((p) => ({ ...p, isOpen: false })); },
    });
  };

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    const routineKey = weeklySchedule[day];
    if (routineKey && ROUTINE_TEMPLATES[routineKey]) {
      const newLogs: ExerciseLog[] = ROUTINE_TEMPLATES[routineKey].map((exName) => ({
        id: 'ex_' + Math.random().toString(36).substring(2, 9), exerciseName: exName,
        sets: [{ id: 'set_' + Math.random().toString(36).substring(2, 9), reps: 0, weight: 0, rpe: 0 }],
      }));
      setActiveLogs(newLogs); showToast(`Loaded ${day}: ${routineKey.toUpperCase()}`);
    } else { setActiveLogs([]); showToast(`${day}: Rest Day / Custom`); }
  };

  const handleSelectFoodForMeal = (food: FoodItem) => {
    if (!foodModalMeal) return;
    const initialGrams = food.defaultServingGrams && food.defaultServingGrams > 0 ? food.defaultServingGrams : 100;
    openDial('Portion Weight (g)', 1500, initialGrams, (weightInGrams) => {
      if (weightInGrams <= 0) return;
      const mult = weightInGrams / 100;
      const p = Math.round(food.p * mult), c = Math.round(food.c * mult), f = Math.round(food.f * mult);
      const cals = Math.round(p * 4 + c * 4 + f * 9);
      setDailyMeals((prev) => {
        const next = {
          ...prev,
          [foodModalMeal]: [...prev[foodModalMeal], {
            id: 'food_' + Math.random().toString(36).substring(2, 9),
            name: food.name, weight: weightInGrams, p, c, f, cals,
          }],
        };
        const email = currentUserEmail || getSessionUserEmail() || '';
        const todayStr = getLocalDateString();
        saveDailyMealsLocalFirst(email, next, todayStr);
        return next;
      });
      setFoodModalMeal(null);
      showToast(`Logged ${weightInGrams}g of ${food.name}`);
    });
  };

  const handleSaveCustomFood = (newFood: FoodItem) => {
    let custom: Record<string, FoodItem[]> = {};
    try { const r = localStorage.getItem('lumina_custom_foods'); if (r) custom = JSON.parse(r); } catch {}
    const category = newFood.category || 'Fast Food & Burgers';
    if (!custom[category]) custom[category] = [];
    custom[category].push(newFood);
    try { localStorage.setItem('lumina_custom_foods', JSON.stringify(custom)); } catch {}
    setFoodDB((prev) => ({ ...prev, [category]: [...(prev[category] || []), newFood] }));
    showToast(`Saved ${newFood.name} to ${category}!`);
  };

  const handleDeleteMealItem = (meal: keyof DailyMeals, id: string) => {
    setDailyMeals((prev) => {
      const next = { ...prev, [meal]: (prev[meal] || []).filter((item) => item.id !== id) };
      const email = currentUserEmail || getSessionUserEmail() || '';
      const todayStr = getLocalDateString();
      saveDailyMealsLocalFirst(email, next, todayStr);
      return next;
    });
    showToast('Item removed', 'error');
  };

  const handleClearAllMeals = () => {
    const empty: DailyMeals = { breakfast: [], lunch: [], dinner: [], snack: [], drinks: [] };
    const email = currentUserEmail || getSessionUserEmail() || '';
    const todayStr = getLocalDateString();
    saveDailyMealsLocalFirst(email, empty, todayStr);
    setDailyMeals(empty);
    if (email) {
      saveMealsToCloud(email, empty, todayStr).catch(() => {});
    }
    showToast('Food log cleared for today', 'success');
  };

  const handleAddDirectMealItem = (meal: keyof DailyMeals, item: LoggedMealItem) => {
    setDailyMeals((prev) => {
      const next = { ...prev, [meal]: [...(prev[meal] || []), item] };
      const email = currentUserEmail || getSessionUserEmail() || '';
      const todayStr = getLocalDateString();
      saveDailyMealsLocalFirst(email, next, todayStr);
      return next;
    });
    showToast(`Added to ${meal}: ${item.name} (${item.cals} kcal)`, 'success');
  };

  const handleManualSyncPendingLogs = async () => {
    showToast('Syncing cached workout logs...', 'success');
    const result = await syncPendingWorkoutLogs(currentUserEmail);
    if (result.syncedCount > 0) showToast(`Synced ${result.syncedCount} workout log(s) successfully!`, 'success');
    else if (result.remainingCount > 0) showToast('Remote sync failed. Cached safely on device.', 'error');
    else showToast('All workout logs are up to date!', 'success');
  };

  const buildVaultMediaItems = (): VaultMediaItem[] => {
    const items: VaultMediaItem[] = [];
    if (profileImage) items.push({ id: 'profile_photo', title: 'Profile Photo', type: 'photo', url: profileImage, thumbnailUrl: profileImage, category: 'Photos', date: 'CURRENT', likes: 0 });
    items.push(
      { id: 'vault_physique_1', title: 'Physique Progress - Front', type: 'photo', url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80', thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80', category: 'Physique', date: '2 DAYS AGO', likes: 12, coachNote: 'Great definition in the delts and abs. Keep the calorie surplus steady.' },
      { id: 'vault_form_1', title: 'Squat Form Check - Set 3', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80', category: 'Form Video', date: '5 DAYS AGO', likes: 8, coachNote: 'Depth is good. Watch knee cave on the ascent - drive them out hard.' },
      { id: 'vault_physique_2', title: 'Back Double Bicep', type: 'photo', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', category: 'Physique', date: '1 WEEK AGO', likes: 24, coachNote: 'Back thickness coming in nicely. Add an extra pull-down set on Wednesdays.' },
      { id: 'vault_pr_1', title: 'Deadlift PR - 180kg', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80', category: 'PR Clip', date: '2 WEEKS AGO', likes: 47, coachNote: 'Solid lockout. Hips could fire a touch faster off the floor. Great pull!' },
      { id: 'vault_physique_3', title: 'Side Chest Pose', type: 'photo', url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe51?w=800&q=80', thumbnailUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe51?w=400&q=80', category: 'Transformation', date: '3 WEEKS AGO', likes: 18, coachNote: 'Chest fullness is improving. Continue prioritising incline work.' },
    );
    return items;
  };

  const handleOpenVaultViewer = () => { setVaultViewerIndex(0); setIsVaultViewerOpen(true); };

  const handleForCurrentUserHandle = () => athleteHandle ? `@${athleteHandle}` : `@${(currentUserEmail || 'athlete').split('@')[0]}`;

  return {
    // Auth
    isAuthenticated, isCheckingSession, isAuthModalOpen, setIsAuthModalOpen, currentUserEmail, currentUserId,
    handleAuthSuccess, handleLogout, showQuickSetup, setShowQuickSetup, showWelcomeOnboarding, setShowWelcomeOnboarding,
    needsOAuthConsent, setNeedsOAuthConsent,

    // Navigation
    currentMode, slideDirection, handleModeChange, handleTouchStart, handleTouchEnd,

    // Theme
    theme, setTheme, toggleTheme, themeAccent, themePalette, handleSelectThemePalette,
    handleUpdateThemeAccent, handleUpdateProfileImage,

    // Toasts
    toasts, showToast,

    // Profile
    athleteName, setAthleteName, athleteHandle, setAthleteHandle, profileImage, setProfileImage,
    handleExportData, handleForCurrentUserHandle,

    // Solo mode
    weeklySchedule, setWeeklySchedule, selectedDay, handleSelectDay,
    stepTarget, setStepTarget, restTimerSecs, setRestTimerSecs, restTimerRunning, setRestTimerRunning,
    startRestTimer, pauseRestTimer, resumeRestTimer, addRestTime, skipRestTimer, restTimerPaused,
    activeLogs, setActiveLogs, syncStatus, handleManualSyncPendingLogs,

    // Fuel
    dailyMeals, setDailyMeals, bmr, setBmr, goalCals, setGoalCals,
    goalP, setGoalP, goalC, setGoalC, goalF, setGoalF,
    foodDB, handleSelectFoodForMeal, handleSaveCustomFood, handleDeleteMealItem, handleClearAllMeals, handleAddDirectMealItem,

    // Coach
    coachClients, selectedCoachClient, setSelectedCoachClient,

    // Dial
    dialConfig, setDialConfig, openDial,

    // Modals
    isScheduleModalOpen, setIsScheduleModalOpen,
    isRoutineSwapperOpen, setIsRoutineSwapperOpen,
    isCommitModalOpen, setIsCommitModalOpen,
    isAutoPilotOpen, setIsAutoPilotOpen,
    isCycleSyncOpen, setIsCycleSyncOpen,
    foodModalMeal, setFoodModalMeal,
    customFoodQuery, setCustomFoodQuery,
    aiScanMeal, setAiScanMeal,
    isEditProfileOpen, setIsEditProfileOpen,
    isVaultViewerOpen, setIsVaultViewerOpen, vaultViewerIndex,
    isExportHelpOpen, setIsExportHelpOpen,
    isGymNetworkOpen, setIsGymNetworkOpen,
    isBuddyRadarOpen, setIsBuddyRadarOpen,
    isOwnProfileOpen, setIsOwnProfileOpen,
    showTandemPanel, setShowTandemPanel,
    isAIInsightsOpen, setIsAIInsightsOpen,
    isPayPlanOpen, setIsPayPlanOpen,
    isTravelPassOpen, setIsTravelPassOpen,
    isShareModalOpen, setIsShareModalOpen,
    isCommunityHubOpen, setIsCommunityHubOpen,
    isGlobalSearchOpen, setIsGlobalSearchOpen,
    shareClientProgressAthlete, setShareClientProgressAthlete,
    payPlanHighlightTier, setPayPlanHighlightTier,
    modalOpenedFromSettings, setModalOpenedFromSettings,
    isCoachShowroomOpen, setIsCoachShowroomOpen,
    coachShowroomData, setCoachShowroomData,
    programToBuy, setProgramToBuy,
    showReminderManager, setShowReminderManager,

    // Refs
    registerWorkoutRef, sessionVaultRefresh, setSessionVaultRefresh,
    workoutStartRef,

    // Vault
    buildVaultMediaItems, handleOpenVaultViewer,

    // Helpers
    getInputMethod,
  };
}
