import { useState, useEffect } from 'react';
import {
  analyzeMealImageWithGemini,
  analyzePackageNutritionPhoto,
  lookupBarcodeNumber,
  ScannedMealBreakdown,
  ScanMode,
} from '../../services/mealVisionService';
import { useFuelStore, FuelMeals } from '../../features/fuel/store/useFuelStore';
import { tactileEngine } from '../../services/tactileEngine';
import { useSubscription } from '../../context/SubscriptionContext';
import { warmApi } from '../../services/apiBase';

const MEAL_SCAN_FAILED = 'Could not read this meal photo. Retake it with the food clearly in view.';

interface UseMealMacroScannerParams {
  isOpen: boolean;
  targetSlot?: keyof FuelMeals | string;
  defaultSlot?: keyof FuelMeals | string;
  onConfirmMeal?: (
    dishName: string,
    kcal: number,
    p: number,
    c: number,
    f: number,
    slotKey?: keyof FuelMeals,
  ) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useMealMacroScanner({
  isOpen,
  targetSlot,
  defaultSlot = 'lunch',
  onConfirmMeal,
  showToast,
}: UseMealMacroScannerParams) {
  const [imageFile, setImageFile] = useState<File | Blob | null>(null);
  const [slot, setSlot] = useState<keyof FuelMeals>(
    (targetSlot || defaultSlot || 'lunch') as keyof FuelMeals,
  );
  const [scanMode, setScanMode] = useState<ScanMode>('plate');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedMeal, setScannedMeal] = useState<ScannedMealBreakdown | null>(null);
  const { isPro, openPaywall } = useSubscription();

  useEffect(() => {
    if (isOpen) {
      warmApi();
      setSlot((targetSlot || defaultSlot || 'lunch') as keyof FuelMeals);
      setSelectedImage(null);
      setImageFile(null);
      setScannedMeal(null);
      setError(null);
      setBarcodeInput('');
    }
  }, [isOpen, targetSlot, defaultSlot]);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast?.(msg, type);
  };

  const commitAdjustedMeal = (name: string, kcal: number, p: number, c: number, f: number) => {
    const effectiveSlot = (slot || 'lunch') as keyof FuelMeals;
    useFuelStore.getState().addMealItem(effectiveSlot, {
      id: `meal-ai-${Date.now()}`,
      name,
      calories: kcal,
      protein: p,
      carbs: c,
      fats: f,
    });
    onConfirmMeal?.(name, kcal, p, c, f, effectiveSlot);
    triggerToast(`Added to ${effectiveSlot} · ${kcal} kcal`, 'success');
    setScannedMeal(null);
  };

  const executeScan = async (action: () => Promise<ScannedMealBreakdown>) => {
    if (!isPro) {
      openPaywall('Vision Macro & Nutrition Scanner');
      return;
    }
    setError(null);
    setScannedMeal(null);
    setIsScanning(true);
    setIsLoading(true);
    tactileEngine.triggerSelectionBuzz();

    try {
      const detected = await action();
      setScannedMeal(detected);
      tactileEngine.playPRCelebration();
    } catch (err: unknown) {
      const failure = err instanceof Error ? err : null;
      let errMsg =
        failure?.message.includes('permission') || failure?.name === 'NotAllowedError'
          ? 'Camera permission denied. Manual macro entry enabled.'
          : failure?.message || MEAL_SCAN_FAILED;

      // Provider and model errors are never shown verbatim.
      if (
        /sensor standby|standby mode|gemini|google|genai|api[\s_-]?key|quota|model|\bai\b/i.test(
          errMsg,
        )
      ) {
        errMsg = MEAL_SCAN_FAILED;
      }

      setError(errMsg);
      triggerToast(
        'Vision analysis could not resolve plate. Switched to manual macro entry.',
        'info',
      );
    } finally {
      setIsScanning(false);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setError(null);
    setImageFile(file);
    setSelectedImage(URL.createObjectURL(file));

    // Immediately dispatch the image to the genuine Gemini Vision multimodal API endpoint
    executeScan(() =>
      scanMode === 'package'
        ? analyzePackageNutritionPhoto(file)
        : analyzeMealImageWithGemini(file, scanMode),
    );
  };

  const handleBarcodeLookup = (overrideCode?: string) => {
    const code = (overrideCode || barcodeInput).trim();
    if (!code) return;
    executeScan(() => lookupBarcodeNumber(code));
  };

  return {
    scanMode,
    setScanMode,
    barcodeInput,
    setBarcodeInput,
    selectedImage,
    imageFile,
    isScanning,
    isLoading,
    error,
    scannedMeal,
    handleFileUpload,
    handleBarcodeLookup,
    commitAdjustedMeal,
    slot,
  };
}
