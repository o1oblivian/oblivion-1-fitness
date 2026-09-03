import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Check,
  Minus,
  Plus,
  Utensils,
  Loader2,
  ScanBarcode,
  Barcode,
  Search,
  AlertCircle,
  Sunrise,
  Moon,
  Coffee,
  Zap,
  RotateCcw,
  Sparkles,
  Keyboard,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { LoggedMealItem, DailyMeals } from '../types';
import { haptic } from '../utils/haptics';
import { apiFetch } from '../utils/apiUrl';

interface ScannedFoodItem {
  name: string;
  grams: number;
  p: number;
  c: number;
  f: number;
  cals: number;
  baseP: number;
  baseC: number;
  baseF: number;
  baseCals: number;
  baseGrams: number;
  servings: number;
}

interface MealEstimation {
  title: string;
  items: ScannedFoodItem[];
  totalP: number;
  totalC: number;
  totalF: number;
  totalCals: number;
  fiber: number;
}

type MealCategory = keyof DailyMeals;

interface AIMealScanModalProps {
  isOpen: boolean;
  defaultMeal: MealCategory;
  onLogMeal: (meal: MealCategory, items: LoggedMealItem[]) => void;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenPayPlan?: (tier?: 'premium' | 'coach') => void;
}

const MEAL_CATEGORIES: { key: MealCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { key: 'lunch', label: 'Lunch', icon: Utensils },
  { key: 'dinner', label: 'Dinner', icon: Moon },
  { key: 'snack', label: 'Snack', icon: Coffee },
];

function recalcTotals(items: ScannedFoodItem[]): Omit<MealEstimation, 'title' | 'items' | 'fiber'> {
  return items.reduce(
    (acc, it) => ({
      totalP: acc.totalP + it.p,
      totalC: acc.totalC + it.c,
      totalF: acc.totalF + it.f,
      totalCals: acc.totalCals + it.cals,
    }),
    { totalP: 0, totalC: 0, totalF: 0, totalCals: 0 }
  );
}

function parseGramsFromAmount(amount: string): number {
  const gMatch = amount.match(/(\d+)\s*g/i);
  if (gMatch) return parseInt(gMatch[1], 10);
  const numMatch = amount.match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1], 10) * 30 : 100;
}

type Phase = 'viewfinder' | 'scanning' | 'results';

export const AIMealScanModal: React.FC<AIMealScanModalProps> = ({
  isOpen,
  defaultMeal,
  onLogMeal,
  onClose,
  showToast,
  onOpenPayPlan,
}) => {
  const [phase, setPhase] = useState<Phase>('viewfinder');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<MealEstimation | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealCategory>(defaultMeal);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);

  // Unified Camera & Scanner State
  const [scanMode, setScanMode] = useState<'camera' | 'barcode'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<{
    name: string;
    p: number;
    c: number;
    f: number;
    cals: number;
    serving?: string;
  } | null>(null);
  const [barcodeError, setBarcodeError] = useState('');

  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'ofc-unified-viewfinder';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopLiveViewfinder = useCallback(async () => {
    try {
      if (html5QrRef.current) {
        const state = html5QrRef.current.getState();
        if (state === 2 || state === 3) {
          await html5QrRef.current.stop();
        }
        html5QrRef.current.clear();
        html5QrRef.current = null;
      }
    } catch {
      /* already stopped */
    }
    setIsCameraActive(false);
    setTorchOn(false);
  }, []);

  const reset = useCallback(() => {
    setPhase('viewfinder');
    setScanMode('camera');
    setImagePreview(null);
    setEstimation(null);
    setScanProgress(0);
    setScanError(null);
    setShowMealPicker(false);
    setBarcodeInput('');
    setBarcodeResult(null);
    setBarcodeError('');
    setBarcodeLoading(false);
    stopLiveViewfinder();
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, [stopLiveViewfinder]);

  const lookupBarcode = useCallback(async (code: string) => {
    await stopLiveViewfinder();
    setBarcodeLoading(true);
    setBarcodeResult(null);
    setBarcodeError('');
    const cleanCode = code.replace(/\D/g, '').trim() || code.trim();

    try {
      // 1. Try server API via apiFetch (supports Web & Native Android APK)
      let itemFound = false;
      try {
        const res = await apiFetch(`/api/food-scan?barcode=${encodeURIComponent(cleanCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.result) {
            setBarcodeResult({
              name: data.result.name,
              p: data.result.p,
              c: data.result.c,
              f: data.result.f,
              cals: data.result.cals,
              serving: data.result.serving,
            });
            itemFound = true;
          }
        }
      } catch {
        // Fallback to direct client API
      }

      // 2. Direct client-side OpenFoodFacts v2 fallback
      if (!itemFound) {
        try {
          const offRes = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`,
            {
              headers: { 'User-Agent': 'O1FC-Fitness-App/1.0 (o1oblivianfitness@gmail.com)' },
            }
          );
          if (offRes.ok) {
            const data = await offRes.json();
            if ((data.status === 1 || data.status_verbose === 'product found') && data.product) {
              const p = data.product;
              const n = p.nutriments || {};
              const servingGrams = parseFloat(p.serving_quantity) || 100;
              const ratio = servingGrams / 100;
              const prot100 = Number(n.proteins_100g || n.proteins || 0);
              const carb100 = Number(n.carbohydrates_100g || n.carbohydrates || 0);
              const fat100 = Number(n.fat_100g || n.fat || 0);
              const cal100 = Number(n['energy-kcal_100g'] || n['energy-kcal'] || prot100 * 4 + carb100 * 4 + fat100 * 9);

              setBarcodeResult({
                name: p.product_name || p.product_name_en || p.brands || `Scanned Item (${cleanCode})`,
                p: Math.round(prot100 * ratio * 10) / 10,
                c: Math.round(carb100 * ratio * 10) / 10,
                f: Math.round(fat100 * ratio * 10) / 10,
                cals: Math.round(cal100 * ratio),
                serving: p.serving_size || `${servingGrams}g`,
              });
              itemFound = true;
            }
          }
        } catch {
          // Continue to v0 fallback
        }
      }

      // 3. Fallback to OpenFoodFacts v0 standard product API
      if (!itemFound) {
        try {
          const offV0Res = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(cleanCode)}.json`,
            {
              headers: { 'User-Agent': 'O1FC-Fitness-App/1.0 (o1oblivianfitness@gmail.com)' },
            }
          );
          if (offV0Res.ok) {
            const data = await offV0Res.json();
            if (data.status === 1 && data.product) {
              const p = data.product;
              const n = p.nutriments || {};
              const servingGrams = parseFloat(p.serving_quantity) || 100;
              const ratio = servingGrams / 100;
              const prot100 = Number(n.proteins_100g || n.proteins || 0);
              const carb100 = Number(n.carbohydrates_100g || n.carbohydrates || 0);
              const fat100 = Number(n.fat_100g || n.fat || 0);
              const cal100 = Number(n['energy-kcal_100g'] || n['energy-kcal'] || prot100 * 4 + carb100 * 4 + fat100 * 9);

              setBarcodeResult({
                name: p.product_name || p.product_name_en || p.brands || `Scanned Item (${cleanCode})`,
                p: Math.round(prot100 * ratio * 10) / 10,
                c: Math.round(carb100 * ratio * 10) / 10,
                f: Math.round(fat100 * ratio * 10) / 10,
                cals: Math.round(cal100 * ratio),
                serving: p.serving_size || `${servingGrams}g`,
              });
              itemFound = true;
            }
          }
        } catch {
          // Ignore
        }
      }

      if (!itemFound) {
        setBarcodeError(`No nutritional record found for barcode "${cleanCode}". You can enter food details manually or try scanning the nutrition label.`);
      }
    } catch {
      setBarcodeError('Could not look up barcode. Check your connection or enter the numbers manually.');
    } finally {
      setBarcodeLoading(false);
    }
  }, [stopLiveViewfinder]);

  const startLiveViewfinder = useCallback(async () => {
    setBarcodeError('');
    await stopLiveViewfinder();
    await new Promise((r) => setTimeout(r, 120));

    const container = document.getElementById(scannerContainerId);
    if (!container) return;

    try {
      const scanner = new Html5Qrcode(scannerContainerId, {
        verbose: false,
        formatsToSupport: undefined, // Supports all formats (EAN-13, EAN-8, UPC-A, UPC-E, QR, Code128, etc.)
      });
      html5QrRef.current = scanner;

      const scanConfig = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.min(Math.round(viewfinderWidth * 0.85), 320),
            height: Math.min(Math.round(minDim * 0.6), 180),
          };
        },
        aspectRatio: 1.333333,
        disableFlip: false,
      };

      try {
        await scanner.start(
          { facingMode: 'environment' },
          scanConfig,
          (decodedText) => {
            haptic.thump();
            lookupBarcode(decodedText);
          },
          () => {}
        );
        setIsCameraActive(true);
      } catch {
        // Fallback to user facing camera or any default camera
        try {
          await scanner.start(
            { facingMode: 'user' },
            scanConfig,
            (decodedText) => {
              haptic.thump();
              lookupBarcode(decodedText);
            },
            () => {}
          );
          setIsCameraActive(true);
        } catch (camErr) {
          console.warn('Camera continuous stream could not start:', camErr);
          setIsCameraActive(false);
        }
      }
    } catch (err) {
      console.warn('Html5Qrcode init error:', err);
      setIsCameraActive(false);
    }
  }, [stopLiveViewfinder, lookupBarcode]);

  const startMealAiScan = useCallback(async (imgDataUrl: string) => {
    await stopLiveViewfinder();
    setImagePreview(imgDataUrl);
    setPhase('scanning');
    setScanProgress(0);
    setScanError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let prog = 0;
    scanTimerRef.current = setInterval(() => {
      prog += Math.random() * 8 + 3;
      setScanProgress(Math.min(prog, 94));
    }, 200);

    try {
      const mimeMatch = imgDataUrl.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const rawBase64 = imgDataUrl.includes(',') ? imgDataUrl.split(',')[1] : imgDataUrl;

      // 1. Primary: Server-side Gemini Vision via apiFetch (supports Web & Native Android APK)
      let data: any = null;
      try {
        const response = await apiFetch('/api/food-scan', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: rawBase64, mimeType }),
        });
        if (response.ok) {
          data = await response.json();
        } else {
          try {
            const errData = await response.json();
            if (errData?.message) {
              data = errData;
            }
          } catch {}
        }
      } catch (primaryErr) {
        console.warn('Primary food-scan fetch attempt error:', primaryErr);
      }

      // 2. Secondary Supabase Edge Function fallback
      if (!data?.success && import.meta.env.VITE_SUPABASE_URL) {
        try {
          const sUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/food-scan`;
          const sRes = await fetch(sUrl, {
            method: 'POST',
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: rawBase64, mimeType }),
          });
          if (sRes.ok) {
            data = await sRes.json();
          }
        } catch {
          /* continue */
        }
      }

      if (scanTimerRef.current) clearInterval(scanTimerRef.current);

      let vision = data?.vision;

      // If no valid vision breakdown was returned or the photo had no detectable food
      if (!data?.success || !vision || !Array.isArray(vision.breakdown) || vision.breakdown.length === 0) {
        const errorMsg = data?.message || 'Could not recognize food in this photo. Please retake photo with clearer lighting or add food item manually.';
        setScanError(errorMsg);
        setPhase('viewfinder');
        showToast(errorMsg, 'error');
        haptic.warning();
        return;
      }

      const items: ScannedFoodItem[] = (vision.breakdown || []).map((b: any) => {
        const grams = parseGramsFromAmount(b.amount || '100g');
        const p = Number(b.protein) || 0;
        const c = Number(b.carbs) || 0;
        const f = Number(b.fats) || 0;
        const cals = Number(b.calories) || Math.round(p * 4 + c * 4 + f * 9);
        return {
          name: b.item || 'Food Item',
          grams,
          p: Math.round(p * 10) / 10,
          c: Math.round(c * 10) / 10,
          f: Math.round(f * 10) / 10,
          cals: Math.round(cals),
          baseP: Math.round(p * 10) / 10,
          baseC: Math.round(c * 10) / 10,
          baseF: Math.round(f * 10) / 10,
          baseCals: Math.round(cals),
          baseGrams: grams,
          servings: 1,
        };
      });

      const totals = recalcTotals(items);
      const est: MealEstimation = {
        title: vision.name || 'Scanned Meal',
        items,
        ...totals,
        fiber: Math.round(Number(vision.fiber) || 0),
      };

      setScanProgress(100);
      setTimeout(() => {
        setEstimation(est);
        setPhase('results');
        haptic.success();
      }, 200);
    } catch (err: any) {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (err.name === 'AbortError') return;
      const errorMsg = err?.message || 'Food scan failed. Please check connection and try again.';
      setScanError(errorMsg);
      setPhase('viewfinder');
      showToast(errorMsg, 'error');
      haptic.warning();
    }
  }, [stopLiveViewfinder]);

  // Capture frame from active live video or trigger native file
  const handleSnapShutter = async () => {
    haptic.thump();
    try {
      // Check if html5QrRef is running video
      const videoEl = document.querySelector(`#${scannerContainerId} video`) as HTMLVideoElement | null;
      if (videoEl && videoEl.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          startMealAiScan(dataUrl);
          return;
        }
      }
    } catch {
      /* fallback to native camera */
    }
    // Fallback: trigger native camera input
    nativeCameraInputRef.current?.click();
  };

  const handleImageFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result !== 'string') return;
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            startMealAiScan(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);

          // Check if file contains a barcode first
          try {
            const scanner = new Html5Qrcode('barcode-file-region', { verbose: false });
            const decodedText = await scanner.scanFile(file, true);
            scanner.clear();
            if (decodedText) {
              haptic.thump();
              lookupBarcode(decodedText);
              return;
            }
          } catch {
            // Not a barcode -> run meal vision AI
          }

          startMealAiScan(compressed);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [startMealAiScan, lookupBarcode]
  );

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedMeal(defaultMeal);
      // Auto-start viewfinder when modal opens
      startLiveViewfinder();
    } else {
      stopLiveViewfinder();
    }
  }, [isOpen, defaultMeal, startLiveViewfinder, stopLiveViewfinder]);

  const toggleTorch = async () => {
    try {
      const stream = (document.querySelector(`#${scannerContainerId} video`) as any)?.srcObject as MediaStream | undefined;
      const track = stream?.getVideoTracks()[0];
      if (track && (track.getCapabilities() as any)?.torch) {
        const nextState = !torchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
        haptic.tap();
      } else {
        showToast('Torch is not supported on this device/camera', 'error');
      }
    } catch {
      showToast('Torch toggle failed', 'error');
    }
  };

  const logBarcodeResult = () => {
    if (!barcodeResult) return;
    const item: LoggedMealItem = {
      id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: barcodeResult.name,
      weight: barcodeResult.serving || '1 serving',
      p: Math.round(barcodeResult.p),
      c: Math.round(barcodeResult.c),
      f: Math.round(barcodeResult.f),
      cals: Math.round(barcodeResult.cals),
    };
    onLogMeal(selectedMeal, [item]);
    showToast(`${barcodeResult.name} logged to ${selectedMeal}`, 'success');
    handleClose();
  };

  const adjustServings = (index: number, delta: number) => {
    if (!estimation) return;
    const items = [...estimation.items];
    const item = { ...items[index] };
    const newServings = Math.max(0.25, Math.round((item.servings + delta * 0.5) * 4) / 4);
    item.servings = newServings;
    item.grams = Math.round(item.baseGrams * newServings);
    item.p = Math.round(item.baseP * newServings * 10) / 10;
    item.c = Math.round(item.baseC * newServings * 10) / 10;
    item.f = Math.round(item.baseF * newServings * 10) / 10;
    item.cals = Math.round(item.baseCals * newServings);
    items[index] = item;
    const totals = recalcTotals(items);
    setEstimation({ ...estimation, items, ...totals });
  };

  const handleLogMeal = () => {
    if (!estimation) return;
    const loggedItems: LoggedMealItem[] = estimation.items.map((it) => ({
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: it.name,
      weight: it.grams,
      p: Math.round(it.p),
      c: Math.round(it.c),
      f: Math.round(it.f),
      cals: Math.round(it.cals),
    }));
    onLogMeal(selectedMeal, loggedItems);
    showToast(`${estimation.title} logged to ${selectedMeal}`, 'success');
    handleClose();
  };

  if (!isOpen) return null;

  const macroRingData = estimation
    ? [
        { label: 'Protein', value: Math.round(estimation.totalP), color: '#4285F4', max: 200 },
        { label: 'Carbs', value: Math.round(estimation.totalC), color: '#FBBC05', max: 300 },
        { label: 'Fats', value: Math.round(estimation.totalF), color: '#EA4335', max: 100 },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end sm:justify-center items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-[#FBFBFD] dark:bg-[#0C0D10] text-zinc-900 dark:text-white rounded-t-[32px] sm:rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[85vh] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-2xl">
        {/* Apple Pill Handle */}
        <div className="w-10 h-1 bg-zinc-300 dark:bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Top Header HUD - Apple Standard Navigation Bar */}
        <div className="px-4 sm:px-5 pt-2 pb-2.5 flex items-center justify-between shrink-0 border-b border-zinc-200/80 dark:border-white/5">
          {/* iOS Circular Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/[0.08] hover:bg-zinc-200 dark:hover:bg-white/[0.15] text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* O1FC on the top center of card */}
          <div className="text-center px-2">
            <span className="text-sm font-black tracking-widest text-zinc-900 dark:text-white uppercase">
              O1FC
            </span>
          </div>

          {/* Symmetrical Meal Category Pill */}
          <button
            onClick={() => setShowMealPicker(!showMealPicker)}
            className="h-8 px-3 rounded-full bg-zinc-100 dark:bg-white/[0.08] hover:bg-zinc-200/80 dark:hover:bg-white/[0.12] border border-zinc-200/80 dark:border-white/10 text-[11.5px] font-medium text-zinc-800 dark:text-white/90 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            {(() => {
              const CurrentIcon = MEAL_CATEGORIES.find((m) => m.key === selectedMeal)?.icon || Utensils;
              return <CurrentIcon className="w-3.5 h-3.5 text-red-500" />;
            })()}
            <span className="capitalize">{selectedMeal}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </div>

        {/* Meal Category Dropdown */}
        {showMealPicker && (
          <div className="px-5 py-2 bg-zinc-50 dark:bg-stone-900 border-b border-zinc-200/80 dark:border-white/10 flex items-center gap-2 overflow-x-auto">
            {MEAL_CATEGORIES.map((m) => {
              const IconComp = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    setSelectedMeal(m.key);
                    setShowMealPicker(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedMeal === m.key
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-zinc-200/70 dark:bg-white/5 text-zinc-700 dark:text-white/70 hover:bg-zinc-300 dark:hover:bg-white/10'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 sm:pb-6 space-y-3.5 overscroll-contain">
          {/* 1. VIEWFINDER PHASE (APPLE CAMERA HUD & BARCODE LOOKUP) */}
          {phase === 'viewfinder' && !barcodeResult && (
            <>
              {scanMode === 'camera' ? (
                <div className="space-y-3">
                  {/* Error Banner */}
                  {(scanError || barcodeError) && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-snug">
                        {scanError || barcodeError}
                      </div>
                    </div>
                  )}

                  {/* Universal Viewfinder Canvas */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-zinc-200/80 dark:border-white/10 shadow-inner flex items-center justify-center">
                    {/* Real-time HTML5 Camera Viewport */}
                    <div
                      id={scannerContainerId}
                      className={`absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full ${
                        isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    />
                    <div id="barcode-file-region" className="hidden" />

                    {/* Viewfinder Overlays */}
                    {isCameraActive ? (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-3.5 z-10">
                        {/* Top HUD Row */}
                        <div className="w-full flex items-center justify-between pointer-events-auto">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-wider text-white/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>ACTIVE</span>
                          </div>
                          <button
                            onClick={toggleTorch}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              torchOn
                                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/30'
                                : 'bg-black/60 text-white border border-white/15 backdrop-blur-md'
                            }`}
                            title="Flash / Torch"
                          >
                            <Zap className={`w-3.5 h-3.5 ${torchOn ? 'fill-black' : ''}`} />
                          </button>
                        </div>

                        {/* Center Precision Target Crosshair */}
                        <div className="relative w-52 h-32 border border-white/25 rounded-xl">
                          <div className="absolute -top-px -left-px w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-red-500 rounded-tl-sm" />
                          <div className="absolute -top-px -right-px w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-red-500 rounded-tr-sm" />
                          <div className="absolute -bottom-px -left-px w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-red-500 rounded-bl-sm" />
                          <div className="absolute -bottom-px -right-px w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-red-500 rounded-br-sm" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2.5 h-2.5 rounded-full border border-red-500/70 flex items-center justify-center">
                              <div className="w-0.5 h-0.5 rounded-full bg-red-500" />
                            </div>
                          </div>
                        </div>

                        <div className="h-4" />
                      </div>
                    ) : (
                      /* Standby State: Precision Frame with Single Enable Action */
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950 z-10">
                        <div className="relative w-52 h-32 border border-white/15 rounded-xl flex items-center justify-center">
                          <div className="absolute -top-px -left-px w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-red-500 rounded-tl-sm" />
                          <div className="absolute -top-px -right-px w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-red-500 rounded-tr-sm" />
                          <div className="absolute -bottom-px -left-px w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-red-500 rounded-bl-sm" />
                          <div className="absolute -bottom-px -right-px w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-red-500 rounded-br-sm" />
                          <button
                            onClick={startLiveViewfinder}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Start Camera</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Apple Floating Micro-Controls: Library | Shutter | Barcode */}
                  <div className="pt-2 pb-1 px-6 flex items-center justify-between max-w-xs mx-auto">
                    {/* Photo Library */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/[0.08] hover:bg-zinc-200 dark:hover:bg-white/[0.15] border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Photo Library"
                    >
                      <ImageIcon className="w-5 h-5 stroke-[1.8]" />
                    </button>

                    {/* iOS Double-Ring Shutter */}
                    <button
                      onClick={handleSnapShutter}
                      className="w-18 h-18 rounded-full border-[3.5px] border-zinc-300 dark:border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg"
                      title="Snap Photo"
                    >
                      <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </button>

                    {/* Barcode Search Toggle */}
                    <button
                      onClick={() => {
                        setScanMode('barcode');
                        stopLiveViewfinder();
                      }}
                      className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/[0.08] hover:bg-zinc-200 dark:hover:bg-white/[0.15] border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Barcode Search"
                    >
                      <Barcode className="w-5 h-5 stroke-[1.8]" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Dedicated Apple Numeric Barcode Search */
                <div className="space-y-4 pt-1">
                  {/* Mode Header with Return to Camera Button */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">Barcode Search</span>
                    </div>
                    <button
                      onClick={() => {
                        setScanMode('camera');
                        setBarcodeError('');
                        startLiveViewfinder();
                      }}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Camera</span>
                    </button>
                  </div>

                  {/* Error Banner */}
                  {barcodeError && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-snug">
                        {barcodeError}
                      </div>
                    </div>
                  )}

                  {/* iOS Style Unified Search Input */}
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                      <Barcode className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter 8, 12, or 13-digit barcode"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && barcodeInput.trim()) lookupBarcode(barcodeInput.trim());
                      }}
                      autoFocus
                      className="w-full h-11 pl-10 pr-24 bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white rounded-xl text-sm font-mono placeholder:font-sans placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-zinc-200/80 dark:border-white/10 outline-none focus:border-red-500 transition-all"
                    />
                    {barcodeInput.trim() && (
                      <button
                        type="button"
                        onClick={() => lookupBarcode(barcodeInput.trim())}
                        disabled={barcodeLoading}
                        className="absolute right-1.5 h-8 px-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        {barcodeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        <span>Search</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Sample Items for Instant Testing */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-0.5">
                      Quick Test Items
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Nutella Spread', code: '3017620422003', sub: 'Ferrero' },
                        { name: 'Greek Yogurt', code: '0052159700072', sub: 'Chobani' },
                        { name: 'Organic Rolled Oats', code: '0041196910173', sub: 'Quaker' },
                        { name: 'Silk Almond Milk', code: '0025293000987', sub: 'Danone' },
                      ].map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            setBarcodeInput(item.code);
                            lookupBarcode(item.code);
                          }}
                          className="p-2.5 text-left bg-zinc-100/80 dark:bg-white/[0.04] hover:bg-zinc-200/70 dark:hover:bg-white/[0.08] border border-zinc-200/60 dark:border-white/5 rounded-xl transition-all cursor-pointer group"
                        >
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                            {item.code} &bull; {item.sub}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden File Pickers */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageFile}
              />
            </>
          )}

          {/* 2. SCANNING ANALYSIS PHASE - LUXURY OPTICAL LASER */}
          {phase === 'scanning' && (
            <div className="flex flex-col items-center gap-4 pt-2 pb-8">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-black">
                {imagePreview && (
                  <img src={imagePreview} alt="Captured Meal" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* Silky Luminous Laser Scan Beam */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-transparent to-red-500/10 pointer-events-none">
                  <div
                    className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_14px_rgba(239,68,68,0.85)]"
                    style={{ top: `${(scanProgress % 50) * 2}%`, transition: 'top 0.15s linear' }}
                  />
                </div>
                {/* Leica 1.5px Precision Crosshair Brackets */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-red-500/90 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-red-500/90 rounded-tr-sm pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-red-500/90 rounded-bl-sm pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-red-500/90 rounded-br-sm pointer-events-none" />
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600 dark:text-red-500" />
                    {scanProgress < 25
                      ? 'Analyzing optical food telemetry...'
                      : scanProgress < 50
                      ? 'Identifying food ingredients...'
                      : scanProgress < 75
                      ? 'Estimating gram weight & density...'
                      : scanProgress < 95
                      ? 'Calculating protein & macros...'
                      : 'Finalizing nutritional breakdown...'}
                  </span>
                  <span className="text-red-600 dark:text-red-500 font-mono font-bold text-xs">{Math.round(scanProgress)}%</span>
                </div>
                <div className="w-full h-[2px] bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 dark:bg-red-500 rounded-full transition-all duration-200"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. BARCODE RESULT CARD */}
          {barcodeResult && (
            <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-zinc-200/80 dark:border-white/10 p-4 space-y-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Verified Product Code
                  </span>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white leading-tight">{barcodeResult.name}</h3>
                  {barcodeResult.serving && (
                    <p className="text-[10px] text-zinc-500 dark:text-white/50 mt-0.5">{barcodeResult.serving}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-zinc-900 dark:text-white">{barcodeResult.cals}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-white/60 font-bold block">kcal</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-black/40 p-2.5 rounded-xl border border-zinc-200/80 dark:border-white/5 text-center font-mono">
                <div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">PROTEIN</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{barcodeResult.p}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">CARBS</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{barcodeResult.c}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block">FATS</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{barcodeResult.f}g</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={logBarcodeResult}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/20"
                >
                  <Check className="w-4 h-4" />
                  Log to {selectedMeal}
                </button>
                <button
                  onClick={() => {
                    setBarcodeResult(null);
                    startLiveViewfinder();
                  }}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-800 dark:text-white/80 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Rescan
                </button>
              </div>
            </div>
          )}

          {/* 4. MEAL RESULTS BREAKDOWN */}
          {phase === 'results' && estimation && (
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10">
                  <img src={imagePreview} alt="Meal Preview" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-white leading-tight">{estimation.title}</h3>
                      <p className="text-[9px] text-white/70 mt-0.5">Photometric Macro Decomposition</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-400">
                      {Math.round(estimation.totalCals)} kcal
                    </span>
                  </div>
                </div>
              )}

              {/* Hero Macros */}
              <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-zinc-200/80 dark:border-white/10 p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  {macroRingData.map((macro) => (
                    <div key={macro.label} className="flex-1 text-center">
                      <div className="relative w-12 h-12 mx-auto">
                        <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="currentColor"
                            className="text-zinc-200 dark:text-white/10"
                            strokeWidth="3.5"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke={macro.color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeDasharray={`${(Math.min(macro.value / macro.max, 1) * 125.7)} 125.7`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-900 dark:text-white">
                          {macro.value}g
                        </span>
                      </div>
                      <p className="text-[9px] font-bold mt-0.5" style={{ color: macro.color }}>
                        {macro.label}
                      </p>
                    </div>
                  ))}
                  <div className="flex-1 text-center">
                    <div className="relative w-12 h-12 mx-auto">
                      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          className="text-zinc-200 dark:text-white/10"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="#34A853"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${(Math.min(estimation.fiber / 40, 1) * 125.7)} 125.7`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-900 dark:text-white">
                        {estimation.fiber}g
                      </span>
                    </div>
                    <p className="text-[9px] font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">Fiber</p>
                  </div>
                </div>
              </div>

              {/* Itemized Breakdown with Servings Adjuster */}
              <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="px-3.5 py-2 border-b border-zinc-200/80 dark:border-white/5 flex items-center justify-between bg-zinc-50/70 dark:bg-white/[0.02]">
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider">Item Breakdown</p>
                  <span className="text-[9px] font-mono text-zinc-400 dark:text-white/40">Adjust portions</span>
                </div>
                <div className="divide-y divide-zinc-200/80 dark:divide-white/5">
                  {estimation.items.map((item, i) => (
                    <div key={i} className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-[9px] text-zinc-500 dark:text-white/50 mt-0.5 font-mono">
                          {item.grams}g &middot; P{Math.round(item.p)} C{Math.round(item.c)} F{Math.round(item.f)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => adjustServings(i, -1)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center transition cursor-pointer active:scale-90"
                        >
                          <Minus className="w-3 h-3 text-zinc-700 dark:text-white/70" />
                        </button>
                        <div className="text-center min-w-[36px]">
                          <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-white">{item.cals}</span>
                          <span className="block text-[7px] text-zinc-400 dark:text-white/40 font-bold">
                            {item.servings !== 1 ? `${item.servings}x` : 'kcal'}
                          </span>
                        </div>
                        <button
                          onClick={() => adjustServings(i, 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center transition cursor-pointer active:scale-90"
                        >
                          <Plus className="w-3 h-3 text-zinc-700 dark:text-white/70" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log CTA */}
              <div className="pt-2 pb-2 space-y-2">
                <button
                  onClick={handleLogMeal}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Log to {selectedMeal}
                </button>
                <button
                  onClick={() => {
                    reset();
                    startLiveViewfinder();
                  }}
                  className="w-full py-2 text-zinc-500 dark:text-white/50 hover:text-zinc-900 dark:hover:text-white font-bold text-xs transition cursor-pointer text-center block"
                >
                  Scan another meal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMealScanModal;
