import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import {
  Droplet,
  Moon,
  Pill,
  Flame,
  Plus,
  Check,
  X,
  RefreshCw,
  Droplets,
  Wine,
  ChevronRight,
  DollarSign,
  Clock,
  RotateCw,
  TrendingUp,
  Zap,
  Sunrise,
  Activity,
  Sparkles,
  Shuffle,
  Trophy,
  Heart,
  RefreshCcw,
  MoreVertical,
  AlertCircle,
  Coffee,
  Shield,
  Beer,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Edit3,
  Search,
  Globe,
  Filter,
} from 'lucide-react';
import { playSound } from '../utils/smartSounds';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { getSmartDefault, recordSmartInput } from '../utils/frequencyDefaults';
import { pedometer } from '@/utils/pedometer';
import { BiometricModal, BiometricType } from './BiometricModal';
import { WatchDial } from './WatchDial';
import { optimizeImageUrl, preloadImage } from '@/utils/imageOptimizer';

const WallpaperSettingsModal = lazy(() => import('./WallpaperSettingsModal').then(m => ({ default: m.WallpaperSettingsModal })));
const WallpaperPickerModal = lazy(() => import('./WallpaperPickerModal').then(m => ({ default: m.WallpaperPickerModal })));
import {
  type WallpaperSettings,
  loadWallpaperSettings,
  saveWallpaperSettings,
  pickNextCuratedWallpaper,
  pickPrevCuratedWallpaper,
  pickNextCustomWallpaper,
  getCuratedWallpaperById,
} from '../utils/wallpaperStore';
import {
  CURATED_100_WALLPAPERS,
  getCuratedWallpaperUrl,
} from '../data/curatedWallpapers';
import {
  type WallpaperItem,
  loadRingPalette,
  saveRingPalette,
  loadWallpaperOverride,
  saveWallpaperOverride,
  clearWallpaperOverride,
} from '../utils/wallpaperApi';
import { CardioConsoleScanModal } from './CardioConsoleScanModal';
import { Gauge } from 'lucide-react';
import { getCardioLogs } from '../utils/cardioStorage';
import {
  ALCOHOL_DATABASE,
  type AlcoholItem,
} from '../data/alcoholDatabase';
import {
  SUPPLEMENT_DATABASE,
  searchSupplementCatalog,
  type CatalogSupplement,
  type SupplementTiming,
} from '../data/supplementDatabase';
import type { CyclePhase } from './CycleSyncModal';

export type DialCategory = 'hydration' | 'menstrual' | 'supplements' | 'alcohol' | null;

interface RotatingHeroCardProps {
  currentUserEmail: string;
  profileImage?: string;
  weeklySchedule: Record<string, string>;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  stepTarget: number;
  setStepTarget: (val: number) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenProfile: () => void;
  onOpenDial?: (type: string, maxVal: number, currentVal: number, onConfirm: (val: number) => void) => void;

  onOpenCycleSync: () => void;
  onOpenSupplementTracker: () => void;
  onOpenAlcoholTracker: () => void;
  onOpenHydrationTracker: () => void;
}

// ── Constants ──
const TODAY_KEY = () => new Date().toISOString().slice(0, 10);
const HYDRATION_KEY = (email: string) => `lumina_hydration_${email}`;
const ALCOHOL_KEY = (email: string) => `lumina_alcohol_${email}`;
const CYCLE_KEY = (email: string) => `lumina_cycle_${email}`;
const SUPPLEMENT_KEY = 'lumina_supplement_matrix_logs_v3';
const HYDRATION_TARGET_LITERS = 3.0;
const ALCOHOL_DAILY_LIMIT = 2;

const DAY_FULL_NAMES: Record<string, string> = {
  Mon: 'MONDAY', Tue: 'TUESDAY', Wed: 'WEDNESDAY', Thu: 'THURSDAY',
  Fri: 'FRIDAY', Sat: 'SATURDAY', Sun: 'SUNDAY',
};

const ROUTINE_LABEL_MAP: Record<string, string> = {
  functional_hypertrophy: 'Functional Hypertrophy', hybrid_racing: 'Hybrid Racing',
  push_a: 'Push A', pull_a: 'Pull A', legs_a: 'Legs A',
  push_b: 'Push B', pull_b: 'Pull B', legs_b: 'Legs B',
  upper: 'Upper Body', lower: 'Lower Body', full: 'Full Body',
  arms: 'Arms', core: 'Core', cardio: 'Cardio',
  Rest: 'Rest Day', rest: 'Rest Day',
};

// ── Types ──
interface HydrationRecord { date: string; liters: number; }
interface AlcoholRecord { date: string; drinks: number; }
interface CycleData { lastPeriodStart: string; cycleLength: number; periodLength: number; }
export interface SupplementItem {
  id: string;
  name: string;
  brand?: string;
  dose?: string;
  taken: boolean;
  takenAt?: string;
  timeOfDay?: SupplementTiming;
  note?: string;
  category?: string;
}
type BeverageType = 'water' | 'electrolytes' | 'coffee';

// ── Helpers ──
function getCyclePhase(day: number, periodLength: number): { name: string; color: string; phase: CyclePhase } {
  if (day <= periodLength) return { name: 'MENSTRUAL', color: '#8B5CF6', phase: 'menstrual' };
  if (day <= 14) return { name: 'FOLLICULAR', color: '#30D158', phase: 'follicular' };
  if (day <= 18) return { name: 'OVULATORY', color: '#FF9F0A', phase: 'ovulation' };
  return { name: 'LUTEAL', color: '#FF453A', phase: 'luteal' };
}

function computeCycleDay(email: string): { day: number; phase: { name: string; color: string; phase: CyclePhase }; cycleLength: number; hasData: boolean } {
  try {
    const raw = localStorage.getItem(CYCLE_KEY(email));
    if (!raw) return { day: 0, phase: { name: '', color: '#8B5CF6', phase: 'menstrual' }, cycleLength: 28, hasData: false };
    const data: CycleData = JSON.parse(raw);
    const start = new Date(data.lastPeriodStart);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const dayInCycle = ((diffDays % data.cycleLength) + data.cycleLength) % data.cycleLength;
    const day = dayInCycle + 1;
    return { day, phase: getCyclePhase(day, data.periodLength), cycleLength: data.cycleLength, hasData: true };
  } catch {
    return { day: 0, phase: { name: '', color: '#8B5CF6', phase: 'menstrual' }, cycleLength: 28, hasData: false };
  }
}

function computeSoberDays(email: string): number {
  try {
    const raw = localStorage.getItem(ALCOHOL_KEY(email));
    if (!raw) return 0;
    const records: AlcoholRecord[] = JSON.parse(raw);
    const todayStr = TODAY_KEY();
    const todayRecord = records.find((r) => r.date === todayStr);
    if (todayRecord && todayRecord.drinks > 0) return 0;
    let streak = todayRecord ? 1 : 0;
    for (let i = 1; i < records.length + 1; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const checkStr = checkDate.toISOString().slice(0, 10);
      const rec = records.find((r) => r.date === checkStr);
      if (rec && rec.drinks === 0) streak++;
      else break;
    }
    return streak;
  } catch { return 0; }
}

function getSupplements(): SupplementItem[] {
  try {
    const raw = localStorage.getItem(SUPPLEMENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [
    { id: '1', name: 'Creatine Monohydrate', brand: 'Thorne', dose: '5g', taken: false, timeOfDay: 'morning' as const, note: 'Saturation: Day 24/30 (High)' },
    { id: '2', name: 'Vitamin D3 + K2', brand: 'Thorne', dose: '5000 IU', taken: false, timeOfDay: 'morning' as const, note: 'With meal' },
    { id: '3', name: 'Omega-3 High EPA/DHA', brand: 'Life Extension', dose: '1200mg', taken: false, timeOfDay: 'morning' as const },
    { id: '4', name: 'Magnesium Bisglycinate', brand: 'Pure Encapsulations', dose: '400mg', taken: false, timeOfDay: 'evening' as const, note: 'Take 45m before sleep' },
    { id: '5', name: 'Zinc Picolinate', brand: 'NOW Foods', dose: '25mg', taken: false, timeOfDay: 'evening' as const },
  ];
}

export function getTimingDisplay(timing?: SupplementTiming): string {
  switch (timing) {
    case 'morning': return 'Morning';
    case 'pre-workout': return 'Pre-Workout';
    case 'intra-workout': return 'Intra';
    case 'post-workout': return 'Post-Workout';
    case 'afternoon': return 'Afternoon';
    case 'evening': return 'Evening';
    case 'bedtime': return 'Bedtime';
    default: return 'Daily';
  }
}

export const RotatingHeroCard: React.FC<RotatingHeroCardProps> = ({
  currentUserEmail,
  profileImage,
  weeklySchedule,
  selectedDay,
  onSelectDay,
  stepTarget,
  setStepTarget,
  showToast,
  onOpenProfile,
  onOpenDial,
  onOpenCycleSync,
  onOpenSupplementTracker,
  onOpenAlcoholTracker,
  onOpenHydrationTracker,
}) => {
  // ── Flip state ──
  const [isFlipped, setIsFlipped] = useState(false);
  const [restTimerSecs, setRestTimerSecs] = useState(90);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const handleToggleRestTimer = useCallback(() => setRestTimerRunning(r => !r), []);
  const [isFlipping, setIsFlipping] = useState(false);
  // ── Wallpaper URL computation & state (Dual-Buffer for Zero-Flicker Crossfade) ──
  const [currentWallpaperId, setCurrentWallpaperId] = useState<string>(() => {
    const settings = loadWallpaperSettings();
    return settings.selectedWallpaperId || 'gym-01';
  });

  const [wallpaperSettings, setWallpaperSettings] = useState<WallpaperSettings>(loadWallpaperSettings);
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => {
    const settings = loadWallpaperSettings();
    if (settings.mode === 'off') return '';
    if (settings.mode === 'custom' && settings.customImages.length > 0) {
      return optimizeImageUrl(settings.customImages[0], 1200, 80);
    }
    if (settings.mode === 'curated') {
      const found = getCuratedWallpaperById(settings.selectedWallpaperId || 'gym-01') || getCuratedWallpaperById('gym-01');
      return found ? found.fullUrl : getCuratedWallpaperUrl(CURATED_100_WALLPAPERS[0].photoId);
    }
    return '';
  });

  const [activeBuffer, setActiveBuffer] = useState<0 | 1>(0);
  const [bufferUrls, setBufferUrls] = useState<[string, string]>(() => {
    const initial = (() => {
      const settings = loadWallpaperSettings();
      if (settings.mode === 'off') return '';
      if (settings.mode === 'custom' && settings.customImages.length > 0) {
        return optimizeImageUrl(settings.customImages[0], 1200, 80);
      }
      if (settings.mode === 'curated') {
        const found = getCuratedWallpaperById(settings.selectedWallpaperId || 'gym-01') || getCuratedWallpaperById('gym-01');
        return found ? found.fullUrl : getCuratedWallpaperUrl(CURATED_100_WALLPAPERS[0].photoId);
      }
      return '';
    })();
    return [initial, ''];
  });

  const [isWallpaperSettingsOpen, setIsWallpaperSettingsOpen] = useState(false);
  const [isWallpaperPickerOpen, setIsWallpaperPickerOpen] = useState(false);
  const [dynamicPalette, setDynamicPalette] = useState<WallpaperItem['ringColors'] | null>(loadRingPalette());
  const [wallpaperOverride, setWallpaperOverride] = useState<string | null>(null);

  // Sync refs to guarantee zero stale closures across async timer ticks
  const currentWallpaperIdRef = useRef(currentWallpaperId);
  const wallpaperUrlRef = useRef(wallpaperUrl);
  const wallpaperSettingsRef = useRef(wallpaperSettings);
  const activeBufferRef = useRef(activeBuffer);

  useEffect(() => {
    currentWallpaperIdRef.current = currentWallpaperId;
  }, [currentWallpaperId]);

  useEffect(() => {
    wallpaperUrlRef.current = wallpaperUrl;
  }, [wallpaperUrl]);

  useEffect(() => {
    wallpaperSettingsRef.current = wallpaperSettings;
  }, [wallpaperSettings]);

  useEffect(() => {
    activeBufferRef.current = activeBuffer;
  }, [activeBuffer]);

  // Sync wallpaper settings changes across all modals and components
  useEffect(() => {
    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<WallpaperSettings>;
      const nextSettings = customEvent.detail || loadWallpaperSettings();
      setWallpaperSettings(nextSettings);
    };
    window.addEventListener('o1fc-wallpaper-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('o1fc-wallpaper-settings-updated', handleSettingsUpdated);
  }, []);

  // ── Auto-rotation runner ──
  const rotateWallpaper = useCallback(() => {
    const currentSettings = wallpaperSettingsRef.current;
    if (currentSettings.mode === 'off' || currentSettings.autoPlay === false) {
      return;
    }

    if (currentSettings.mode === 'curated') {
      const nextCurated = pickNextCuratedWallpaper(
        currentSettings.categoryFilter,
        currentWallpaperIdRef.current,
        currentSettings.shuffle ?? true
      );
      if (!nextCurated) return;

      currentWallpaperIdRef.current = nextCurated.id;
      setCurrentWallpaperId(nextCurated.id);
      const nextUrl = nextCurated.fullUrl;

      // Flip buffer seamlessly
      const nextBuf = activeBufferRef.current === 0 ? 1 : 0;
      setBufferUrls((prev) => {
        const updated = [...prev] as [string, string];
        updated[nextBuf] = nextUrl;
        return updated;
      });
      setActiveBuffer(nextBuf);

      setWallpaperUrl(nextUrl);
      wallpaperUrlRef.current = nextUrl;

      if (nextCurated.ringColors) {
        setDynamicPalette(nextCurated.ringColors);
        saveRingPalette(nextCurated.ringColors);
      }
    } else if (currentSettings.mode === 'custom' && currentSettings.customImages.length > 0) {
      const nextCustom = pickNextCustomWallpaper(
        currentSettings.customImages,
        currentSettings.shuffle ?? true
      );
      if (!nextCustom) return;
      const nextUrl = optimizeImageUrl(nextCustom.fullUrl, 1200, 80);

      const nextBuf = activeBufferRef.current === 0 ? 1 : 0;
      setBufferUrls((prev) => {
        const updated = [...prev] as [string, string];
        updated[nextBuf] = nextUrl;
        return updated;
      });
      setActiveBuffer(nextBuf);

      setWallpaperUrl(nextUrl);
      wallpaperUrlRef.current = nextUrl;
    }
  }, []);

  // ── Auto-rotation interval timer ──
  useEffect(() => {
    if (wallpaperSettings.mode === 'off' || wallpaperSettings.autoPlay === false) {
      return;
    }

    const intervalSec = Math.max(3, wallpaperSettings.refreshIntervalSec || 15);

    const timer = setInterval(() => {
      rotateWallpaper();
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [
    wallpaperSettings.mode,
    wallpaperSettings.autoPlay,
    wallpaperSettings.categoryFilter,
    wallpaperSettings.refreshIntervalSec,
    wallpaperSettings.continuousRotation,
    wallpaperSettings.customImages.length,
    rotateWallpaper,
  ]);

  const handleSkipNextWallpaper = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    rotateWallpaper();
  };

  const handleWallpaperSettingsChange = (newSettings: WallpaperSettings) => {
    const prevSettings = wallpaperSettingsRef.current;
    setWallpaperSettings(newSettings);
    saveWallpaperSettings(newSettings);
    clearWallpaperOverride();
    setWallpaperOverride(null);

    if (newSettings.mode === 'off') {
      setWallpaperUrl('');
      setBufferUrls(['', '']);
      return;
    }

    // If mode changed or user selected a distinct curated photo ID
    if (
      newSettings.mode !== prevSettings.mode ||
      (newSettings.selectedWallpaperId && newSettings.selectedWallpaperId !== currentWallpaperIdRef.current)
    ) {
      if (newSettings.mode === 'curated') {
        const found = getCuratedWallpaperById(newSettings.selectedWallpaperId || 'gym-01') || getCuratedWallpaperById('gym-01');
        if (found) {
          setCurrentWallpaperId(found.id);
          currentWallpaperIdRef.current = found.id;
          const nextBuf = activeBufferRef.current === 0 ? 1 : 0;
          setBufferUrls((prev) => {
            const updated = [...prev] as [string, string];
            updated[nextBuf] = found.fullUrl;
            return updated;
          });
          setActiveBuffer(nextBuf);
          setWallpaperUrl(found.fullUrl);
          wallpaperUrlRef.current = found.fullUrl;

          if (found.ringColors) {
            setDynamicPalette(found.ringColors);
            saveRingPalette(found.ringColors);
          }
        }
      } else if (newSettings.mode === 'custom' && newSettings.customImages.length > 0) {
        const nextUrl = optimizeImageUrl(newSettings.customImages[0], 1200, 80);
        const nextBuf = activeBufferRef.current === 0 ? 1 : 0;
        setBufferUrls((prev) => {
          const updated = [...prev] as [string, string];
          updated[nextBuf] = nextUrl;
          return updated;
        });
        setActiveBuffer(nextBuf);
        setWallpaperUrl(nextUrl);
        wallpaperUrlRef.current = nextUrl;
      }
    }
  };

  const handleSelectWallpaper = (wp: WallpaperItem) => {
    setCurrentWallpaperId(wp.id);
    currentWallpaperIdRef.current = wp.id;
    setWallpaperOverride(wp.fullUrl);
    saveWallpaperOverride(wp.fullUrl);

    if (wp.ringColors) {
      setDynamicPalette(wp.ringColors);
      saveRingPalette(wp.ringColors);
    }

    const nextBuf = activeBufferRef.current === 0 ? 1 : 0;
    setBufferUrls((prev) => {
      const updated = [...prev] as [string, string];
      updated[nextBuf] = wp.fullUrl;
      return updated;
    });
    setActiveBuffer(nextBuf);

    setWallpaperUrl(wp.fullUrl);
    wallpaperUrlRef.current = wp.fullUrl;
    showToast(`Wallpaper applied: ${wp.title}`, 'success');
  };

  // ── Activity data state ──
  const [dailySteps, setDailyStepsState] = useState<number>(() => getSmartDefault('watch_steps', 0));
  const [dailyMove, setDailyMoveState] = useState<number>(() => getSmartDefault('watch_move', 0));
  const [dailyDist, setDailyDistState] = useState<number>(() => getSmartDefault('watch_dist', 0));
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeBiometricModal, setActiveBiometricModal] = useState<BiometricType | null>(null);
  const [isCardioScanModalOpen, setIsCardioScanModalOpen] = useState<boolean>(false);

  // ── Vitals state ──
  const [activeModal, setActiveModal] = useState<DialCategory>(null);
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);
  const [alcoholSearch, setAlcoholSearch] = useState('');
  const [tick, setTick] = useState(0);
  const [hydrationLiters, setHydrationLiters] = useState(0);
  const [alcoholDrinks, setAlcoholDrinks] = useState(0);
  const [soberDays, setSoberDays] = useState(0);
  const [cycle, setCycle] = useState(() => computeCycleDay(currentUserEmail));
  const [supplements, setSupplements] = useState<SupplementItem[]>([]);
  const [beverageType, setBeverageType] = useState<BeverageType>('water');
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [suppSearchQuery, setSuppSearchQuery] = useState('');
  const [customSuppName, setCustomSuppName] = useState('');
  const [customSuppBrand, setCustomSuppBrand] = useState('');
  const [customSuppDose, setCustomSuppDose] = useState('');
  const [customSuppTime, setCustomSuppTime] = useState<SupplementTiming>('morning');
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  // Listen for external requests to open wallpaper settings (from profile menu / global search)
  useEffect(() => {
    const handler = () => setIsWallpaperSettingsOpen(true);
    window.addEventListener('open-wallpaper-settings', handler);
    return () => window.removeEventListener('open-wallpaper-settings', handler);
  }, []);

  // ── Per-day activity data (varies by selectedDay) ──
  const DAY_ACTIVITY_DATA: Record<string, { steps: number; move: number; dist: number }> = {
    Mon: { steps: 8420, move: 385, dist: 4.2 },
    Tue: { steps: 11230, move: 520, dist: 5.8 },
    Wed: { steps: 6150, move: 280, dist: 3.1 },
    Thu: { steps: 9870, move: 445, dist: 5.0 },
    Fri: { steps: 12400, move: 590, dist: 6.3 },
    Sat: { steps: 5200, move: 210, dist: 2.6 },
    Sun: { steps: 3800, move: 155, dist: 1.9 },
  };

  useEffect(() => {
    const dayData = DAY_ACTIVITY_DATA[selectedDay];
    if (dayData) {
      setDailyStepsState(dayData.steps);
      setDailyMoveState(dayData.move);
      setDailyDistState(dayData.dist);
    }
  }, [selectedDay]);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const setDailySteps = (val: number) => { recordSmartInput('watch_steps', val); setDailyStepsState(val); };
  const setDailyMove = (val: number) => { recordSmartInput('watch_move', val); setDailyMoveState(val); };
  const setDailyDist = (val: number) => { recordSmartInput('watch_dist', val); setDailyDistState(val); };

  // Sync from pedometer live data
  useEffect(() => {
    return pedometer.subscribe((state) => {
      setDailyStepsState(state.stepCount);
      setDailyMoveState(state.caloriesBurned);
      setDailyDistState(state.distanceKm);
    });
  }, []);

  // ── Vitals refresh ──
  const refreshAll = useCallback(() => {
    try {
      const raw = localStorage.getItem(HYDRATION_KEY(currentUserEmail));
      if (raw) {
        const records: HydrationRecord[] = JSON.parse(raw);
        const today = records.find((r) => r.date === TODAY_KEY());
        setHydrationLiters(today ? today.liters : 0);
      } else { setHydrationLiters(0); }
    } catch { setHydrationLiters(0); }

    try {
      const raw = localStorage.getItem(ALCOHOL_KEY(currentUserEmail));
      if (raw) {
        const records: AlcoholRecord[] = JSON.parse(raw);
        const today = records.find((r) => r.date === TODAY_KEY());
        setAlcoholDrinks(today ? today.drinks : 0);
      } else { setAlcoholDrinks(0); }
    } catch { setAlcoholDrinks(0); }
    setSoberDays(computeSoberDays(currentUserEmail));
    setCycle(computeCycleDay(currentUserEmail));
    setSupplements(getSupplements());
  }, [currentUserEmail]);

  useEffect(() => { refreshAll(); }, [refreshAll, tick]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('daily_macros')
          .select('hydration, alcohol_drinks, record_date')
          .eq('user_email', currentUserEmail)
          .order('record_date', { ascending: false })
          .limit(1);
        if (data && data.length > 0 && data[0].record_date === TODAY_KEY()) {
          if (data[0].hydration != null) setHydrationLiters(Number(data[0].hydration));
          if (data[0].alcohol_drinks != null) setAlcoholDrinks(Number(data[0].alcohol_drinks));
        }
      } catch {}
    })();
  }, [currentUserEmail]);

  // ── Cross-component sync: listen for localStorage changes from Fuel OS ──
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === HYDRATION_KEY(currentUserEmail)) {
        try {
          const records: HydrationRecord[] = e.newValue ? JSON.parse(e.newValue) : [];
          const today = records.find((r) => r.date === TODAY_KEY());
          setHydrationLiters(today ? today.liters : 0);
        } catch {}
      }
      if (e.key === ALCOHOL_KEY(currentUserEmail)) {
        try {
          const records: AlcoholRecord[] = e.newValue ? JSON.parse(e.newValue) : [];
          const today = records.find((r) => r.date === TODAY_KEY());
          setAlcoholDrinks(today ? today.drinks : 0);
          setSoberDays(computeSoberDays(currentUserEmail));
        } catch {}
      }
      if (e.key === CYCLE_KEY(currentUserEmail)) {
        setCycle(computeCycleDay(currentUserEmail));
      }
      if (e.key === SUPPLEMENT_KEY) {
        setSupplements(getSupplements());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [currentUserEmail]);

  // ── Vitals handlers ──
  const saveHydration = (liters: number) => {
    setHydrationLiters(liters);
    try {
      const raw = localStorage.getItem(HYDRATION_KEY(currentUserEmail));
      let records: HydrationRecord[] = raw ? JSON.parse(raw) : [];
      const idx = records.findIndex((r) => r.date === TODAY_KEY());
      if (idx >= 0) records[idx].liters = liters;
      else records.push({ date: TODAY_KEY(), liters });
      records = records.slice(-30);
      localStorage.setItem(HYDRATION_KEY(currentUserEmail), JSON.stringify(records));
    } catch {}
    if (isSupabaseConfigured()) {
      supabase
        .from('daily_macros')
        .upsert(
          { user_email: currentUserEmail, record_date: TODAY_KEY(), hydration: liters, hydration_target: HYDRATION_TARGET_LITERS },
          { onConflict: 'user_email,record_date' }
        )
        .then(() => {});
    }
    setTick((t) => t + 1);
  };

  const addWater = (ml: number) => {
    const efficiency = beverageType === 'electrolytes' ? 1.2 : beverageType === 'coffee' ? 0.8 : 1.0;
    const effectiveMl = Math.round(ml * efficiency);
    const next = Math.max(0, Math.round((hydrationLiters + effectiveMl / 1000) * 10) / 10);
    saveHydration(next);
    if (next >= HYDRATION_TARGET_LITERS && hydrationLiters < HYDRATION_TARGET_LITERS) {
      showToast(`Hydration goal reached! ${next}L`, 'success');
    }
  };

  const addCustomSupplement = () => {
    if (!customSuppName.trim()) {
      showToast('Enter a supplement name', 'error');
      return;
    }
    const newSupp: SupplementItem = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: customSuppName.trim(),
      brand: customSuppBrand.trim() || undefined,
      dose: customSuppDose.trim() || undefined,
      taken: false,
      timeOfDay: customSuppTime,
      category: 'Custom Stack',
    };
    try {
      const raw = localStorage.getItem(SUPPLEMENT_KEY);
      const parsed: SupplementItem[] = raw ? JSON.parse(raw) : supplements;
      const updated = [...parsed, newSupp];
      localStorage.setItem(SUPPLEMENT_KEY, JSON.stringify(updated));
      setSupplements(updated);
      setTick((t) => t + 1);
    } catch {
      setSupplements((prev) => [...prev, newSupp]);
    }
    setCustomSuppName('');
    setCustomSuppBrand('');
    setCustomSuppDose('');
    setIsManualEntryOpen(false);
    showToast(`Added ${newSupp.name} to stack`, 'success');
    playSound('pill');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const addSupplementFromCatalog = (item: CatalogSupplement) => {
    const isAlreadyInStack = supplements.some(
      (s) => s.name.toLowerCase() === item.name.toLowerCase() && (s.brand || '').toLowerCase() === item.brand.toLowerCase()
    );
    if (isAlreadyInStack) {
      showToast(`${item.name} is already in your stack`, 'error');
      return;
    }
    const newSupp: SupplementItem = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: item.name,
      brand: item.brand,
      dose: item.dose,
      taken: false,
      timeOfDay: item.timing,
      category: item.category,
    };
    try {
      const raw = localStorage.getItem(SUPPLEMENT_KEY);
      const parsed: SupplementItem[] = raw ? JSON.parse(raw) : supplements;
      const updated = [...parsed, newSupp];
      localStorage.setItem(SUPPLEMENT_KEY, JSON.stringify(updated));
      setSupplements(updated);
      setTick((t) => t + 1);
    } catch {
      setSupplements((prev) => [...prev, newSupp]);
    }
    showToast(`Added ${item.name} (${item.brand})`, 'success');
    playSound('pill');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const removeSupplement = (id: string, name: string) => {
    try {
      const raw = localStorage.getItem(SUPPLEMENT_KEY);
      const parsed: SupplementItem[] = raw ? JSON.parse(raw) : supplements;
      const updated = parsed.filter((s) => s.id !== id);
      localStorage.setItem(SUPPLEMENT_KEY, JSON.stringify(updated));
      setSupplements(updated);
      setTick((t) => t + 1);
      showToast(`Removed ${name}`, 'success');
    } catch {
      setSupplements((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredCatalogSupplements = useMemo(() => {
    return searchSupplementCatalog(suppSearchQuery);
  }, [suppSearchQuery]);

  const saveAlcohol = (drinks: number) => {
    setAlcoholDrinks(drinks);
    try {
      const raw = localStorage.getItem(ALCOHOL_KEY(currentUserEmail));
      let records: AlcoholRecord[] = raw ? JSON.parse(raw) : [];
      const idx = records.findIndex((r) => r.date === TODAY_KEY());
      if (idx >= 0) records[idx].drinks = drinks;
      else records.push({ date: TODAY_KEY(), drinks });
      records = records.slice(-30);
      localStorage.setItem(ALCOHOL_KEY(currentUserEmail), JSON.stringify(records));
    } catch {}
    if (isSupabaseConfigured()) {
      const alcoholGrams = drinks * 14;
      supabase
        .from('daily_macros')
        .upsert(
          { user_email: currentUserEmail, record_date: TODAY_KEY(), alcohol_drinks: drinks, alcohol_grams: alcoholGrams },
          { onConflict: 'user_email,record_date' }
        )
        .then(() => {});
    }
    setTick((t) => t + 1);
  };

  const addDrink = (delta: number) => {
    const next = Math.max(0, Math.round((alcoholDrinks + delta) * 10) / 10);
    saveAlcohol(next);
    if (delta > 0) showToast(`${delta} drink logged`, 'success');
  };

  const addSpecificDrink = (item: AlcoholItem) => {
    playSound('tick');
    if (navigator.vibrate) navigator.vibrate(10);
    const delta = item.stdDrinks;
    const next = Math.max(0, Math.round((alcoholDrinks + delta) * 10) / 10);
    saveAlcohol(next);
    showToast(`+${item.stdDrinks} ${item.name} (${item.country}) · ${item.cals} kcal`, 'success');
  };

  const filteredAlcoholItems = useMemo(() => {
    if (!alcoholSearch.trim()) return [];
    const q = alcoholSearch.toLowerCase().trim();
    return ALCOHOL_DATABASE.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.subType.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [alcoholSearch]);

  const toggleSupplement = (id: string) => {
    try {
      const raw = localStorage.getItem(SUPPLEMENT_KEY);
      if (raw) {
        const parsed: SupplementItem[] = JSON.parse(raw);
        const updated = parsed.map((s) =>
          s.id === id ? { ...s, taken: !s.taken, takenAt: !s.taken ? new Date().toISOString() : undefined } : s
        );
        localStorage.setItem(SUPPLEMENT_KEY, JSON.stringify(updated));
        setSupplements(updated);
        setTick((t) => t + 1);
      }
    } catch {}
  };

  const handleDialTap = (cat: DialCategory, sound: 'water' | 'chime' | 'pill' | 'flame') => {
    playSound(sound);
    if (navigator.vibrate) navigator.vibrate(8);
    setActiveModal(cat);
  };

  const handleFullTracker = (cat: DialCategory) => {
    setActiveModal(null);
    if (cat === 'hydration') onOpenHydrationTracker();
    else if (cat === 'menstrual') onOpenCycleSync();
    else if (cat === 'supplements') onOpenSupplementTracker();
    else if (cat === 'alcohol') onOpenAlcoholTracker();
  };

  // ── Flip handler ──
  const handleFlip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isFlipping) return;
    setIsFlipping(true);
    playSound('flip');
    if (navigator.vibrate) navigator.vibrate(12);
    setIsFlipped((prev) => !prev);
    setTimeout(() => setIsFlipping(false), 900);
  };

  // ── Activity handlers ──
  const handleCycleDay = () => {
    const dayList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentIndex = dayList.indexOf(selectedDay);
    const nextIndex = (currentIndex >= 0 ? currentIndex + 1 : 0) % dayList.length;
    onSelectDay(dayList[nextIndex]);
  };

  const handleOpenStepDial = () => {
    if (onOpenDial) {
      onOpenDial('Step Target', 50000, stepTarget, (newTarget) => {
        setStepTarget(newTarget);
        showToast(`Step goal set to ${newTarget.toLocaleString()} steps!`, 'success');
      });
    }
  };

  // ── Per-day ring palettes — changes instantly on day tap ──
  type RingPalette = { outer: string; middle: string; inner: string };
  const DAY_RING_PALETTES: Record<string, RingPalette> = {
    Mon: { outer: '#C8A97E', middle: '#A0856E', inner: '#8B7D6B' },
    Tue: { outer: '#8B9DAF', middle: '#7A8A9C', inner: '#A0B0BD' },
    Wed: { outer: '#B87333', middle: '#A0622D', inner: '#C4956A' },
    Thu: { outer: '#9CAF88', middle: '#7A9B6D', inner: '#B8C4A8' },
    Fri: { outer: '#D4AF37', middle: '#B8960C', inner: '#E8CC6E' },
    Sat: { outer: '#C08070', middle: '#A86858', inner: '#D4A090' },
    Sun: { outer: '#D0C8C0', middle: '#B8AFA5', inner: '#E0D8D0' },
  };


  const currentWorkoutLabel = (() => {
    const val = weeklySchedule[selectedDay];
    if (!val) return 'Rest Day';
    if (ROUTINE_LABEL_MAP[val]) return ROUTINE_LABEL_MAP[val];
    if (val.startsWith('custom_')) return 'Custom Workout';
    return val;
  })();



  // ── Derived vitals values ──
  const isHeavySession = currentWorkoutLabel !== 'Rest Day' && (currentWorkoutLabel.includes('Heavy') || currentWorkoutLabel.includes('Power') || currentWorkoutLabel.includes('Hypertrophy') || currentWorkoutLabel.includes('Legs'));
  const dynamicTarget = HYDRATION_TARGET_LITERS + (isHeavySession ? 0.6 : 0);
  const hydrationPercent = Math.min(100, Math.round((hydrationLiters / dynamicTarget) * 100));
  const hydrationLitersStr = hydrationLiters.toFixed(1);
  const targetLitersStr = HYDRATION_TARGET_LITERS.toFixed(1);
  const suppsTaken = supplements.filter((s) => s.taken).length;
  const suppsTotal = supplements.length;
  const moneySaved = soberDays * 15;
  const detoxHours = soberDays * 24;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* ── 3D Flip Card ── */}
      <div className="flip-perspective w-full" style={{ aspectRatio: '4 / 4.8' }}>
        <div className={`flip-inner ${isFlipped ? 'flipped' : ''}`}>

          {/* ══════ FRONT: Luxury Dial ══════ */}
          <div
            className="flip-face relative w-full h-full overflow-hidden rounded-3xl text-white flex flex-col justify-between select-none"
          >
            {/* Wallpaper atmosphere — Dual buffer for seamless, zero-flicker transitions */}
            {wallpaperSettings.mode !== 'off' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
                {bufferUrls[0] && (
                  <div
                    className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                      activeBuffer === 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundImage: `url(${bufferUrls[0]})` }}
                  />
                )}
                {bufferUrls[1] && (
                  <div
                    className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                      activeBuffer === 1 ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundImage: `url(${bufferUrls[1]})` }}
                  />
                )}
                {/* Cinematic vignette for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.5) 100%)' }} />
              </div>
            )}

            {/* ── Settings Button ── */}
            <div className="absolute top-0 left-0 z-30 px-4 pt-4">
              <button
                onClick={() => onOpenProfile()}
                aria-label="Open Settings"
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* ── Embedded Dial ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-2">
              <WatchDial
                weeklySchedule={weeklySchedule}
                selectedDay={selectedDay}
                onSelectDay={onSelectDay}
                onOpenScheduleModal={() => {}}
                todayDayName={selectedDay}
                stepTarget={stepTarget}
                setStepTarget={setStepTarget}
                showToast={showToast}
                restTimerSecs={restTimerSecs}
                setRestTimerSecs={setRestTimerSecs}
                restTimerRunning={restTimerRunning}
                onToggleRestTimer={handleToggleRestTimer}
                onOpenDial={onOpenDial}
                embedded={true}
                onOpenProfile={onOpenProfile}
                profileImage={profileImage}
              />
            </div>

            {/* Bottom: 3-Pill Bar: CARDIO (left) | SUN REST DAY (center) | VITALS (right) */}
            <div className="relative z-10 w-full px-3 pb-3">
              <div className="flex items-center justify-between gap-2">
                {/* Left: Cardio Scan & Log Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCardioScanModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-red-500/40 hover:border-red-500/60 hover:bg-black/50 active:scale-95 transition-all cursor-pointer group shrink-0 shadow-sm"
                  aria-label="Log Cardio Machine"
                >
                  <Gauge className="w-3 h-3 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-red-400">Cardio</span>
                </button>

                {/* Center: Day + Focus label */}
                <button
                  type="button"
                  onClick={handleCycleDay}
                  className="flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all truncate"
                >
                  <div className="flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur-md px-3 py-1.5 border border-white/10 hover:bg-black/50 transition-colors shadow-sm">
                    <span className="text-[10px] font-mono font-black tracking-widest text-white/95">{(DAY_FULL_NAMES[selectedDay]?.slice(0, 3) || selectedDay).toUpperCase()}</span>
                    <span className="w-px h-3 bg-white/20" />
                    <span className="text-[9px] font-mono font-bold tracking-wider text-white/70">{currentWorkoutLabel.toUpperCase()}</span>
                  </div>
                </button>

                {/* Right: VITALS flip button */}
                <button
                  onClick={(e) => handleFlip(e)}
                  aria-label="Flip to vitals"
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 hover:bg-black/50 active:scale-95 transition-all cursor-pointer group shrink-0 shadow-sm"
                >
                  <RotateCw className="w-3 h-3 text-red-400 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-red-400">Vitals</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </button>
              </div>
            </div>
          </div>

          {/* ══════ BACK: Kinetic Biomarker Matrix ══════ */}
          <div
            className="flip-face flip-back relative w-full h-full rounded-3xl overflow-hidden text-white p-4 flex flex-col select-none"
          >
            {/* Wallpaper — same dual buffer */}
            {wallpaperSettings.mode !== 'off' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
                {bufferUrls[0] && (
                  <div
                    className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                      activeBuffer === 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundImage: `url(${bufferUrls[0]})` }}
                  />
                )}
                {bufferUrls[1] && (
                  <div
                    className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                      activeBuffer === 1 ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundImage: `url(${bufferUrls[1]})` }}
                  />
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 pointer-events-none" />

            {/* Header row with flip-back button */}
            <div className="relative z-10 flex items-center justify-between px-1 pt-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Living Vitals</span>
              <button
                onClick={(e) => handleFlip(e)}
                aria-label="Flip back to activity"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCcw className="w-3 h-3" />
                <span className="text-[8px] font-mono uppercase tracking-wider">Activity</span>
              </button>
            </div>

            {/* Concentric Biomarker Ring HUD */}
            {(() => {
              const RO = 55, RM = 44, RI = 33;
              const CO = 2 * Math.PI * RO, CM = 2 * Math.PI * RM, CI = 2 * Math.PI * RI;
              return (
            <div className="relative z-10 flex flex-col items-center justify-center -mt-1 mb-0.5 shrink-0">
              <div className="relative w-[130px] h-[130px] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Track backgrounds */}
                  <circle cx="60" cy="60" r={RO} stroke="rgba(56, 189, 248, 0.15)" strokeWidth="3.2" fill="transparent" />
                  <circle cx="60" cy="60" r={RM} stroke="rgba(168, 85, 247, 0.15)" strokeWidth="3.2" fill="transparent" />
                  <circle cx="60" cy="60" r={RI} stroke="rgba(34, 197, 94, 0.15)" strokeWidth="3.2" fill="transparent" />

                  {/* Outer ring: Water / Hydration (Cyan / Sky Blue) */}
                  <circle
                    cx="60" cy="60" r={RO}
                    stroke="#38BDF8" strokeWidth="3.2"
                    strokeDasharray={CO}
                    strokeDashoffset={isLoaded ? CO * (1 - Math.min(1, hydrationLiters / dynamicTarget)) : CO}
                    strokeLinecap="round" fill="transparent"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.55))', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                  {/* Middle ring: Bio-Sync (Purple) */}
                  <circle
                    cx="60" cy="60" r={RM}
                    stroke="#A855F7" strokeWidth="3.2"
                    strokeDasharray={CM}
                    strokeDashoffset={isLoaded ? CM * (1 - (cycle.hasData ? 0.88 : 0.62)) : CM}
                    strokeLinecap="round" fill="transparent"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.55))', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                  {/* Inner ring: Supplements (Green) */}
                  <circle
                    cx="60" cy="60" r={RI}
                    stroke="#22C55E" strokeWidth="3.2"
                    strokeDasharray={CI}
                    strokeDashoffset={isLoaded ? CI * (1 - (suppsTotal > 0 ? suppsTaken / suppsTotal : 0)) : CI}
                    strokeLinecap="round" fill="transparent"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.55))', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                </svg>
                {/* Center score */}
                <div className="text-center z-10">
                  <div className="text-3xl font-black font-mono text-white leading-none tracking-tight">
                    {Math.round(
                      (Math.min(1, hydrationLiters / dynamicTarget) * 0.4 +
                        (cycle.hasData ? 0.88 : 0.62) * 0.35 +
                        (suppsTotal > 0 ? suppsTaken / suppsTotal : 0) * 0.25) * 100
                    )}
                  </div>
                  <div className="text-[7px] font-mono uppercase tracking-widest text-emerald-400 mt-0.5 font-bold">
                    OPTIMAL
                  </div>
                </div>
              </div>
              {/* Ring legend */}
              <div className="flex items-center gap-3.5 mt-1">
                <span className="flex items-center gap-1 text-[7.5px] font-mono uppercase tracking-wider text-[#38BDF8] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_5px_#38BDF8]" />Hydration
                </span>
                <span className="flex items-center gap-1 text-[7.5px] font-mono uppercase tracking-wider text-[#A855F7] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] shadow-[0_0_5px_#A855F7]" />Bio-Sync
                </span>
                <span className="flex items-center gap-1 text-[7.5px] font-mono uppercase tracking-wider text-[#22C55E] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shadow-[0_0_5px_#22C55E]" />Supplements
                </span>
              </div>
            </div>
              );
            })()}

            {/* 2x2 Quadrant Chips */}
            <div className="relative z-10 grid grid-cols-2 grid-rows-2 gap-2.5 px-0.5 mt-2.5 pb-0.5" style={{ gridAutoRows: '1fr' }}>
              {/* Q1: Hydration */}
              <button
                type="button"
                onClick={() => handleDialTap('hydration', 'water')}
                className="flex flex-col justify-between rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 p-3 text-left active:scale-[0.97] transition-all cursor-pointer hover:border-sky-400/40 shadow-lg overflow-hidden h-[84px]"
              >
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-neutral-300">Hydration</span>
                </div>
                <div className="flex items-baseline gap-1 my-auto">
                  <span className="font-mono text-lg font-black text-white leading-none">{hydrationLitersStr}</span>
                  <span className="text-[10px] font-mono text-neutral-400">/ {dynamicTarget.toFixed(1)}L</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono text-sky-400/90 font-medium">{hydrationPercent}% Target</span>
                </div>
              </button>

              {/* Q2: Bio-Sync */}
              <button
                type="button"
                onClick={() => handleDialTap('menstrual', 'chime')}
                className="flex flex-col justify-between rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 p-3 text-left active:scale-[0.97] transition-all cursor-pointer hover:border-purple-400/40 shadow-lg overflow-hidden h-[84px]"
              >
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-neutral-300">Bio-Sync</span>
                </div>
                <div className="font-mono text-lg font-black leading-none text-purple-400 my-auto">
                  {cycle.hasData ? `${cycle.day}d ${cycle.phase.name.slice(0, 4)}` : 'Day 14'}
                </div>
                <div className="text-[8px] font-mono text-purple-300/80 truncate">
                  {cycle.hasData ? `88% Recovery · HRV 68ms` : 'Optimal Recovery'}
                </div>
              </button>

              {/* Q3: Supplement Stack */}
              <button
                type="button"
                onClick={() => handleDialTap('supplements', 'pill')}
                className="flex flex-col justify-between rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 p-3 text-left active:scale-[0.97] transition-all cursor-pointer hover:border-emerald-400/40 shadow-lg overflow-hidden h-[84px]"
              >
                <div className="flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-neutral-300">Supplements</span>
                </div>
                <div className="font-mono text-lg font-black text-emerald-400 leading-none my-auto">
                  {suppsTaken}/{suppsTotal} Logged
                </div>
                <div className="flex items-center gap-1 overflow-hidden">
                  {supplements.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className={`text-[7.5px] font-mono px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5 ${
                        s.taken
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : 'bg-neutral-800/90 text-neutral-400 border border-white/5'
                      }`}
                    >
                      <span>{s.name.split(' ')[0].slice(0, 4)}</span>
                      {s.taken && <Check className="w-2 h-2 inline" />}
                    </span>
                  ))}
                </div>
              </button>

              {/* Q4: Habit & Clean */}
              <button
                type="button"
                onClick={() => handleDialTap('alcohol', 'flame')}
                className="flex flex-col justify-between rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 p-3 text-left active:scale-[0.97] transition-all cursor-pointer hover:border-red-400/40 shadow-lg overflow-hidden h-[84px]"
              >
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-neutral-300">Habit & Clean</span>
                </div>
                <div className={`font-mono text-lg font-black leading-none my-auto ${alcoholDrinks === 0 ? 'text-white' : 'text-red-400'}`}>
                  {alcoholDrinks} Drinks
                </div>
                <div className="text-[8px] font-mono text-red-300/80 truncate">
                  {soberDays}-Day Clean · REM Protected
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Vitals drill-down modal — full-screen overlay ── */}
      {activeModal && createPortal(
        <div
          className="fixed inset-0 z-[150] flex flex-col justify-end sm:justify-center items-center bg-black/40 dark:bg-black/60 p-0 sm:p-4 animate-in fade-in duration-150 select-none"
          onClick={() => { setActiveModal(null); setShowAddSupplement(false); }}
        >
          <div
            className="w-full max-w-lg bg-[#F7F5F0] dark:bg-[#12151E] rounded-t-3xl sm:rounded-3xl shadow-2xl text-slate-900 dark:text-white flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-slate-300 dark:bg-white/20 rounded-full" />
            </div>

            {/* Sticky Header — Nude Bare X Close Button without fog frame */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.06] dark:border-white/10 bg-[#F7F5F0] dark:bg-[#12151E] shrink-0">
              <div className="flex items-center gap-2">
                {activeModal === 'hydration' && (
                  <div className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center">
                    <Droplets className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                  </div>
                )}
                {activeModal === 'menstrual' && (
                  <div className="w-6 h-6 rounded-lg bg-fuchsia-500/15 flex items-center justify-center">
                    <Moon className="w-3.5 h-3.5 text-fuchsia-500 dark:text-fuchsia-400" />
                  </div>
                )}
                {activeModal === 'supplements' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Pill className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                )}
                {activeModal === 'alcohol' && (
                  <div className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  </div>
                )}
                <h3 className="text-xs sm:text-sm font-bold font-mono tracking-wide text-slate-900 dark:text-white">
                  {activeModal === 'hydration' && 'Hydration Intelligence'}
                  {activeModal === 'menstrual' && 'Bio-Sync Intelligence'}
                  {activeModal === 'supplements' && 'Supplement Timing'}
                  {activeModal === 'alcohol' && 'Sobriety Tracker'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setActiveModal(null); setShowAddSupplement(false); }}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer active:scale-90"
                aria-label="Close"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2">

            {activeModal === 'hydration' && (
              <>
                {/* Osmotic Progress Dial — Compact Height (72px) */}
                <div className="relative rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-[#141518] p-3 overflow-hidden shadow-xs">
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 font-semibold">
                        <Droplet className="w-3 h-3 text-sky-500" /> Osmotic Progress
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                          {hydrationLiters.toFixed(1)}
                        </span>
                        <span className="text-sm font-bold font-mono text-slate-500 dark:text-zinc-400">
                          L / {dynamicTarget.toFixed(1)}L
                        </span>
                      </div>
                      {isHeavySession && (
                        <div className="text-[8.5px] font-mono text-sky-600 dark:text-sky-400 font-medium">
                          +600ml sweat-rate load active
                        </div>
                      )}
                    </div>

                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full border border-sky-400/30 flex items-center justify-center shadow-xs" style={{ background: `conic-gradient(#38BDF8 ${hydrationPercent * 3.6}deg, rgba(0,0,0,.06) 0deg)` }}>
                        <div className="h-9 w-9 rounded-full bg-white dark:bg-[#0E0F12] flex items-center justify-center shadow-inner">
                          <span className="text-xs font-black font-mono text-slate-900 dark:text-white">{hydrationPercent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-black/50">
                    <div className="h-full rounded-full bg-sky-500 transition-all duration-700 ease-out" style={{ width: `${hydrationPercent}%` }} />
                  </div>
                </div>

                {/* Cellular State Alert Bar — Compact Height (30px) */}
                <div className={`rounded-xl border px-2.5 py-1.5 flex items-center gap-2 ${
                  hydrationPercent >= 80
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : hydrationPercent >= 50
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    hydrationPercent >= 80 ? 'bg-emerald-500' : hydrationPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-[10px] font-mono font-bold flex-1 truncate">
                    {hydrationPercent >= 80 ? 'Optimal · Low Cramp Risk' : hydrationPercent >= 50 ? 'Moderate · Maintain Cellular Intake' : 'Dehydration Risk · Increase Osmotic Load'}
                  </span>
                </div>

                {/* 1-Tap Fast Vessel Bar — Compact Height (36px) */}
                <div>
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-bold mb-1">
                    1-Tap Fast Vessel
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '250ml', sub: 'Glass', ml: 250 },
                      { label: '500ml', sub: 'Shaker', ml: 500 },
                      { label: '750ml', sub: 'Bottle', ml: 750 },
                      { label: '1.0L', sub: 'Chug', ml: 1000 },
                    ].map((v) => (
                      <button
                        key={v.ml}
                        type="button"
                        onClick={() => { playSound('water'); if (navigator.vibrate) navigator.vibrate(8); addWater(v.ml); }}
                        className="py-1.5 px-1 rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white font-mono text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all flex flex-col items-center justify-center gap-0 shadow-2xs cursor-pointer"
                      >
                        <span>{v.label}</span>
                        <span className="text-[7px] text-slate-400 dark:text-zinc-500 uppercase">{v.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beverage Type Switcher — Compact Height (38px) */}
                <div>
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-bold mb-1">
                    Beverage Type
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { type: 'water' as BeverageType, label: 'Water', icon: Droplet, efficiency: '100%' },
                      { type: 'electrolytes' as BeverageType, label: 'Electrolytes', icon: Zap, efficiency: '120%' },
                      { type: 'coffee' as BeverageType, label: 'Coffee/Tea', icon: Coffee, efficiency: '-20%' },
                    ].map((b) => {
                      const Icon = b.icon;
                      const isActive = beverageType === b.type;
                      return (
                        <button
                          key={b.type}
                          type="button"
                          onClick={() => { setBeverageType(b.type); playSound('tick'); }}
                          className={`py-1.5 px-2 rounded-xl border font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                            isActive
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white'
                              : 'bg-slate-50 dark:bg-[#141518] border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{b.label}</span>
                          <span className="text-[8px] opacity-70 font-mono">({b.efficiency})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => { playSound('tick'); saveHydration(0); }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10.5px] font-mono uppercase hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1 cursor-pointer font-bold"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => { playSound('tick'); setExpandedTracker(expandedTracker === 'hydration' ? null : 'hydration'); }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 dark:bg-white border border-slate-900 dark:border-white text-white dark:text-black text-[10.5px] font-mono uppercase font-bold hover:bg-slate-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Droplets className="w-3 h-3" /> {expandedTracker === 'hydration' ? 'Collapse History' : 'Full Tracker & History'}
                    {expandedTracker === 'hydration' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {expandedTracker === 'hydration' && (
                  <div className="bg-slate-50 dark:bg-[#141518] border border-slate-200 dark:border-white/10 rounded-2xl p-3 space-y-2 text-slate-900 dark:text-white shadow-sm animate-in fade-in duration-150">
                    <div className="text-[9.5px] font-bold font-mono text-slate-800 dark:text-white uppercase tracking-wider">
                      7-Day Intake Trend
                    </div>
                    <div className="flex items-end justify-between gap-1 h-20 px-1">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
                        const vals = [3.2, 2.8, 3.0, 2.5, 3.1, 1.9, hydrationLiters];
                        const v = vals[i]; const pct = Math.min(100, (v / dynamicTarget) * 100);
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                            <span className="text-[7.5px] font-mono text-slate-600 dark:text-zinc-400 tabular-nums">{v.toFixed(1)}L</span>
                            <div className="w-full rounded-md overflow-hidden bg-slate-200 dark:bg-white/10 h-12">
                              <div className="w-full rounded-md transition-all duration-500" style={{ height: `${pct}%`, marginTop: `${100 - pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span className={`text-[7.5px] font-mono ${i === 6 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>{day}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[9.5px] font-bold font-mono text-slate-800 dark:text-white uppercase tracking-wider mt-1.5">
                      Today's Intake Log
                    </div>
                    <div className="space-y-1">
                      {[
                        { time: '07:15 AM', amount: '500ml', vessel: 'Shaker', type: 'Water' },
                        { time: '09:30 AM', amount: '250ml', vessel: 'Glass', type: 'Coffee' },
                        { time: '11:45 AM', amount: '750ml', vessel: 'Bottle', type: 'Electrolytes' },
                        { time: '02:00 PM', amount: '500ml', vessel: 'Shaker', type: 'Water' },
                      ].map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 py-1 px-2 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/5 group">
                          <span className="text-[9.5px] font-mono text-slate-400 dark:text-zinc-500 w-14 shrink-0">{entry.time}</span>
                          <Droplet className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white flex-1">{entry.amount} {entry.vessel}</span>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400">{entry.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeModal === 'menstrual' && (
              <>
                {/* Current Phase Status Card — Compact Height (72px) */}
                <div className="relative rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-[#141518] p-3 overflow-hidden shadow-xs">
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 font-semibold">
                        <Moon className="w-3 h-3 text-fuchsia-500" /> Bio-Sync Cycle
                      </div>
                      <div className="mt-0.5 text-2xl font-black font-mono uppercase tracking-tight text-slate-900 dark:text-white">
                        {cycle.hasData ? cycle.phase.name : 'FOLLICULAR'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                        {cycle.hasData ? `DAY ${cycle.day} of ${cycle.cycleLength}` : 'DAY 14 · Estrogen Peak'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums">
                        {cycle.hasData ? cycle.day : '14'}
                      </div>
                      <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">cycle day</div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-fuchsia-500"
                      style={{ width: `${cycle.hasData ? Math.min(100, (cycle.day / cycle.cycleLength) * 100) : 50}%` }}
                    />
                  </div>
                </div>

                {/* Training Auto-Regulation Callout — Compact Height (44px) */}
                <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141518] p-2.5 flex items-center gap-2.5 shadow-2xs">
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5 text-fuchsia-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-bold">
                      Training Auto-Regulation
                    </div>
                    <p className="text-[10.5px] font-mono text-slate-800 dark:text-zinc-200 truncate mt-0.5">
                      {cycle.hasData && cycle.phase.phase === 'menstrual' && 'Low energy window. Prioritize mobility & reduce volume 20-30%.'}
                      {cycle.hasData && cycle.phase.phase === 'follicular' && 'Peak Power Window: MPS & pain tolerance highest. Target: RPE 9-10 PRs.'}
                      {cycle.hasData && cycle.phase.phase === 'ovulation' && 'Peak power output. Primed for explosive lifts & max effort.'}
                      {cycle.hasData && cycle.phase.phase === 'luteal' && 'Progesterone rising. Moderate intensity. Prioritize protein & sleep.'}
                      {!cycle.hasData && 'Peak Power Window: MPS & pain tolerance highest. Target: RPE 9-10 PRs.'}
                    </p>
                  </div>
                </div>

                {/* 4-Phase Interactive Dial — Compact Height (42px) */}
                <div>
                  <div className="text-[8.5px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-bold mb-1">
                    4-Phase Segmented Dial
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Menstrual', days: '1-5', phase: 'menstrual' },
                      { label: 'Follicular', days: '6-13', phase: 'follicular' },
                      { label: 'Ovulatory', days: '14-16', phase: 'ovulation' },
                      { label: 'Luteal', days: '17-28', phase: 'luteal' },
                    ].map((p) => {
                      const isActive = (cycle.hasData && cycle.phase.phase === p.phase) || (!cycle.hasData && p.phase === 'follicular');
                      return (
                        <div
                          key={p.label}
                          className={`rounded-xl border py-1 px-1 flex flex-col items-center justify-center transition-all shadow-2xs font-mono ${
                            isActive
                              ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-black'
                              : 'border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#141518] text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <span className="text-[8.5px] font-bold uppercase">{p.label}</span>
                          <span className="text-[7px] opacity-70">D{p.days}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => { playSound('chime'); showToast('Workout RPE & rest periods auto-regulated for current phase', 'success'); }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-[10.5px] font-mono uppercase font-bold hover:bg-slate-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Zap className="w-3 h-3" /> Auto-Regulate RPE
                  </button>
                  <button
                    type="button"
                    onClick={() => { playSound('tick'); setExpandedTracker(expandedTracker === 'menstrual' ? null : 'menstrual'); }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10.5px] font-mono uppercase font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Moon className="w-3 h-3" /> {expandedTracker === 'menstrual' ? 'Collapse' : 'Full History'}
                    {expandedTracker === 'menstrual' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {expandedTracker === 'menstrual' && (
                  <div className="bg-slate-50 dark:bg-[#141518] border border-slate-200 dark:border-white/10 rounded-2xl p-3 space-y-2 text-slate-900 dark:text-white shadow-sm animate-in fade-in duration-150">
                    <div className="text-[9.5px] font-bold font-mono text-slate-800 dark:text-white uppercase tracking-wide">
                      28-Day Cycle Timeline
                    </div>
                    <div className="flex gap-[2px] h-4 rounded-md overflow-hidden bg-slate-200 dark:bg-white/10">
                      {Array.from({ length: 28 }, (_, i) => {
                        const day = i + 1;
                        const currentDay = cycle.hasData ? cycle.day : 14;
                        const isCurrent = day === currentDay;
                        return (
                          <div
                            key={day}
                            className={`flex-1 ${isCurrent ? 'bg-fuchsia-500' : 'bg-slate-300 dark:bg-white/20'}`}
                            title={`Day ${day}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between px-1 text-[7.5px] font-mono text-slate-500 dark:text-zinc-400">
                      <span>D1 Menstrual</span>
                      <span>D6 Follicular</span>
                      <span>D14 Ovulatory</span>
                      <span>D17 Luteal</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeModal === 'supplements' && (
              <>
                {/* Daily Stack Adherence — Compact Height (70px) */}
                <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-[#141518] p-3 overflow-hidden shadow-xs">
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-zinc-400 font-semibold">
                        <Pill className="w-3 h-3 text-emerald-500" /> Daily Stack Adherence
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tabular-nums">{suppsTaken}</span>
                        <span className="text-sm font-bold font-mono text-slate-500 dark:text-zinc-400">/ {suppsTotal} Taken</span>
                      </div>
                    </div>
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-full border border-emerald-400/30 flex items-center justify-center shadow-xs" style={{ background: `conic-gradient(#10b981 ${suppsTotal ? (suppsTaken / suppsTotal) * 360 : 0}deg, rgba(0,0,0,.06) 0deg)` }}>
                        <div className="h-8 w-8 rounded-full bg-white dark:bg-[#0E0F12] flex items-center justify-center shadow-inner">
                          <span className="text-xs font-black font-mono text-slate-900 dark:text-white tabular-nums">
                            {suppsTotal ? Math.round((suppsTaken / suppsTotal) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplement Rows (Current Stack) */}
                {!showAddSupplement && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {supplements.length === 0 ? (
                      <div className="py-6 text-center text-xs font-mono text-slate-400 dark:text-zinc-500">
                        No supplements in stack yet. Tap below to add.
                      </div>
                    ) : (
                      supplements.map((sup) => (
                        <div
                          key={sup.id}
                          className={`group flex items-center justify-between py-1.5 px-2.5 rounded-xl border transition-all select-none ${
                            sup.taken
                              ? 'bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200/70 dark:border-white/5 opacity-75'
                              : 'bg-white dark:bg-[#141518] border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                        >
                          <div
                            onClick={() => { playSound('pill'); if (navigator.vibrate) navigator.vibrate(8); toggleSupplement(sup.id); }}
                            className="flex items-center gap-2 min-w-0 pr-2 flex-1 cursor-pointer"
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                              sup.taken
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800'
                            }`}>
                              {sup.taken ? <Check className="w-3 h-3 stroke-[3]" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold truncate ${sup.taken ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                  {sup.name}
                                </span>
                                {sup.brand && (
                                  <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 shrink-0">
                                    {sup.brand}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {sup.dose && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-white/5">
                                {sup.dose}
                              </span>
                            )}
                            <span className="text-[8.5px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                              {sup.timeOfDay ? getTimingDisplay(sup.timeOfDay) : 'Daily'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSupplement(sup.id, sup.name);
                              }}
                              className="p-1 text-slate-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Remove from stack"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Add Custom / Search Drawer Panel */}
                {showAddSupplement && (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15171C] p-3 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold font-mono uppercase tracking-wide text-slate-900 dark:text-white">
                          {isManualEntryOpen ? 'Manual Custom Formula' : 'Search & Add Supplement'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsManualEntryOpen((prev) => !prev)}
                          className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {isManualEntryOpen ? '← Browse Database' : '+ Custom Formula'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddSupplement(false); setIsManualEntryOpen(false); }}
                          className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isManualEntryOpen ? (
                      /* Manual Entry Form */
                      <div className="space-y-2">
                        <div>
                          <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                            Supplement Name *
                          </label>
                          <input
                            type="text"
                            value={customSuppName}
                            onChange={(e) => setCustomSuppName(e.target.value)}
                            placeholder="e.g., Creatine Monohydrate, Ashwagandha KSM-66"
                            className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                              Brand / Maker
                            </label>
                            <input
                              type="text"
                              value={customSuppBrand}
                              onChange={(e) => setCustomSuppBrand(e.target.value)}
                              placeholder="e.g., Thorne, ON, Gorilla Mind"
                              className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                              Dose / Serving
                            </label>
                            <input
                              type="text"
                              value={customSuppDose}
                              onChange={(e) => setCustomSuppDose(e.target.value)}
                              placeholder="e.g., 5g, 500mg, 1 Scoop"
                              className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Quick Dose Pills */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {['5g', '500mg', '1000mg', '1 Scoop', '2 Capsules', '5000 IU'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setCustomSuppDose(preset)}
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                                customSuppDose === preset
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Timing Selector */}
                        <div>
                          <label className="text-[9.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
                            Timing
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {(['morning', 'pre-workout', 'intra-workout', 'post-workout', 'afternoon', 'evening', 'bedtime'] as SupplementTiming[]).map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setCustomSuppTime(time)}
                                className={`text-[9.5px] font-mono uppercase px-2 py-1 rounded-lg border cursor-pointer transition-all ${
                                  customSuppTime === time
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-slate-900 dark:border-white font-bold'
                                    : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'
                                }`}
                              >
                                {getTimingDisplay(time)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={addCustomSupplement}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" /> Save to Daily Stack
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Database Search and Filter */
                      <div className="space-y-2">
                        {/* Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={suppSearchQuery}
                            onChange={(e) => setSuppSearchQuery(e.target.value)}
                            placeholder="Search by name or brand (e.g. Creatine, Thorne, Ghost)..."
                            className="w-full text-xs font-mono pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          {suppSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setSuppSearchQuery('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Search Catalog Results List */}
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                          {filteredCatalogSupplements.length === 0 ? (
                            <div className="py-5 text-center space-y-1">
                              <p className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                                No matching formula found in database.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomSuppName(suppSearchQuery);
                                  setIsManualEntryOpen(true);
                                }}
                                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Create "{suppSearchQuery || 'Custom'}" manually
                              </button>
                            </div>
                          ) : (
                            filteredCatalogSupplements.map((item, idx) => {
                              const inStack = supplements.some(
                                (s) => s.name.toLowerCase() === item.name.toLowerCase() && (s.brand || '').toLowerCase() === item.brand.toLowerCase()
                              );
                              return (
                                <div
                                  key={`${item.brand}_${item.name}_${idx}`}
                                  className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-[#121316] hover:border-slate-200 dark:hover:border-white/15 transition-all"
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {item.name}
                                      </span>
                                      <span className="text-[8.5px] font-mono px-1 py-0.2 rounded bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0 font-medium">
                                        {item.brand}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-slate-500 dark:text-zinc-400">
                                      <span>{item.dose}</span>
                                      <span>·</span>
                                      <span>{getTimingDisplay(item.timing)}</span>
                                      <span>·</span>
                                      <span className="truncate text-slate-400 dark:text-zinc-500">{item.category}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addSupplementFromCatalog(item)}
                                    disabled={inStack}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                                      inStack
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                                        : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-100 active:scale-95'
                                    }`}
                                  >
                                    {inStack ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>In Stack</span>
                                      </>
                                    ) : (
                                      '+ Add'
                                    )}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Adherence 7-Day Matrix View */}
                {expandedTracker === 'supplements' && !showAddSupplement && (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-zinc-400">
                      <span>7-Day Stack Adherence</span>
                      <span className="text-emerald-500">Target: 100%</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center font-mono">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-full h-12 rounded-lg bg-slate-100 dark:bg-zinc-800/80 p-0.5 flex flex-col justify-end">
                            <div
                              className="w-full bg-emerald-500 rounded-md transition-all duration-500"
                              style={{ height: `${i === 6 ? (suppsTotal ? (suppsTaken / suppsTotal) * 100 : 0) : Math.max(60, 100 - i * 5)}%` }}
                            />
                          </div>
                          <span className="text-[8.5px] text-slate-400 dark:text-zinc-500">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Action Buttons */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('tick');
                      setShowAddSupplement((prev) => !prev);
                      if (!showAddSupplement) setExpandedTracker(null);
                    }}
                    className={`flex-1 py-1.5 rounded-xl border text-[10.5px] font-mono uppercase font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      showAddSupplement
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Plus className="w-3 h-3" /> {showAddSupplement ? 'Close Search' : 'Add Custom / Search'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('tick');
                      setExpandedTracker(expandedTracker === 'supplements' ? null : 'supplements');
                      if (expandedTracker !== 'supplements') setShowAddSupplement(false);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-[10.5px] font-mono uppercase font-bold hover:bg-slate-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Pill className="w-3 h-3" /> {expandedTracker === 'supplements' ? 'Collapse' : 'Adherence'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'alcohol' && (
              <>
                {/* Hero Streak Matrix — 3-Pill Bento (Compact Height: 52px) */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#141518] p-2 text-center shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-red-500 mx-auto mb-0.5" />
                    <div className="text-lg font-black font-mono text-slate-900 dark:text-white tabular-nums">{soberDays}</div>
                    <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Days Clean</div>
                  </div>
                  <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#141518] p-2 text-center shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-sky-500 mx-auto mb-0.5" />
                    <div className="text-lg font-black font-mono text-slate-900 dark:text-white tabular-nums">{detoxHours}h</div>
                    <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Detoxed</div>
                  </div>
                  <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-[#141518] p-2 text-center shadow-xs">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
                    <div className="text-lg font-black font-mono text-slate-900 dark:text-white tabular-nums">${moneySaved}</div>
                    <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Saved</div>
                  </div>
                </div>

                {/* Physiological Protection Card — Compact Height (38px) */}
                <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141518] p-2 flex items-center gap-2 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-slate-800 dark:text-zinc-200 truncate">
                      {alcoholDrinks === 0
                        ? 'REM Sleep +35% · Zero MPS Inhibition · Peak Autonomic Tone'
                        : `${alcoholDrinks} drink${alcoholDrinks === 1 ? '' : 's'}: Est. -${Math.round(alcoholDrinks * 12)}% HRV penalty · ~${(alcoholDrinks * 1.1).toFixed(1)}h to clear.`}
                    </p>
                  </div>
                </div>

                {/* Universal Alcohol Search */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={alcoholSearch}
                      onChange={(e) => setAlcoholSearch(e.target.value)}
                      placeholder="Search any beer, wine, spirit, cocktail, cider..."
                      className="w-full bg-slate-50 dark:bg-[#141518] border border-slate-200/90 dark:border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono focus:border-slate-400 dark:focus:border-white/30 transition-all"
                    />
                    {alcoholSearch && (
                      <button
                        type="button"
                        onClick={() => setAlcoholSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown/List when searching */}
                  {alcoholSearch.trim() && (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5 border border-slate-200/80 dark:border-white/10 rounded-xl p-1.5 bg-slate-50/50 dark:bg-zinc-950/40">
                      {filteredAlcoholItems.length > 0 ? (
                        filteredAlcoholItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#141518] border border-slate-200/90 dark:border-white/10 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-all"
                          >
                            <div className="min-w-0 pr-2 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                                  {item.countryCode}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                                <span className="truncate">{item.subType}</span>
                                <span>·</span>
                                <span className="font-semibold text-slate-700 dark:text-zinc-300">{item.abv}% ABV</span>
                                <span>·</span>
                                <span>{item.cals} kcal</span>
                                <span>·</span>
                                <span>{item.servingSize}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                addSpecificDrink(item);
                                setAlcoholSearch('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-mono text-[10px] font-bold active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>+{item.stdDrinks}</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-5 text-center text-slate-400 dark:text-zinc-500 font-mono text-xs">
                          No matching beverages found.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Generic Increments */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {[
                    { label: 'Standard Beer', icon: Beer, delta: 1.0 },
                    { label: 'Glass Wine', icon: Wine, delta: 1.2 },
                    { label: 'Spirit Shot', icon: Wine, delta: 1.0 },
                  ].map((d, i) => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { playSound('tick'); if (navigator.vibrate) navigator.vibrate(8); addDrink(d.delta); }}
                        className="py-1.5 rounded-xl bg-slate-50 dark:bg-[#141518] border border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-zinc-200 font-mono text-[10.5px] font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Icon className="w-3 h-3 text-slate-400" />
                        <span>+{d.delta} {d.label.split(' ')[1] || d.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Today's Counter & Reset */}
                <div className="rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141518] p-2 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-[8.5px] font-mono uppercase text-slate-400">Today's Log</div>
                    <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {alcoholDrinks} {alcoholDrinks === 1 ? 'drink' : 'drinks'} <span className="text-xs font-normal text-slate-400 font-mono"> (~{Math.round(alcoholDrinks * 140)} kcal)</span>
                    </div>
                  </div>
                  {alcoholDrinks > 0 && (
                    <button
                      type="button"
                      onClick={() => { playSound('tick'); addDrink(-1); }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10px] font-bold hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <X className="w-2.5 h-2.5" /> Undo
                    </button>
                  )}
                </div>
              </>
            )}

            </div>{/* end scrollable body */}
          </div>
        </div>,
        document.body
      )}

      <Suspense fallback={null}>
        <WallpaperSettingsModal
          isOpen={isWallpaperSettingsOpen}
          onClose={() => setIsWallpaperSettingsOpen(false)}
          onChange={handleWallpaperSettingsChange}
          onOpenPicker={() => setIsWallpaperPickerOpen(true)}
        />

        <WallpaperPickerModal
          isOpen={isWallpaperPickerOpen}
          onClose={() => setIsWallpaperPickerOpen(false)}
          selectedWallpaperUrl={wallpaperOverride ?? wallpaperUrl}
          onSelectWallpaper={handleSelectWallpaper}
          onOpenSettings={() => setIsWallpaperSettingsOpen(true)}
        />
      </Suspense>

      {/* ── Biometric modal ── */}
      <BiometricModal
        type={activeBiometricModal}
        onClose={() => setActiveBiometricModal(null)}
        wearables={{ appleHealth: true, googleFit: false, whoop: true, oura: true }}
        onToggleWearable={(key) => showToast(`${key} toggled`)}
      />

      {/* ── Cardio Console Scan & Quick Telemetry Ingestion Modal ── */}
      <CardioConsoleScanModal
        isOpen={isCardioScanModalOpen}
        onClose={() => setIsCardioScanModalOpen(false)}
        onSaved={(entry) => {
          showToast(`Logged ${entry.caloriesBurned} kcal from ${entry.machineType.replace('_', ' ')}`);
          // Instantly sync step & move counts
          setDailyStepsState((prev) => prev + (entry.stepsCount || 0));
          setDailyMoveState((prev) => prev + entry.caloriesBurned);
          if (entry.distanceKm) {
            setDailyDistState((prev) => parseFloat((prev + entry.distanceKm!).toFixed(2)));
          }
        }}
      />
    </div>
  );
};

export default RotatingHeroCard;

