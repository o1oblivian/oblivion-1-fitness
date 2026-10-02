import { useState, useEffect } from 'react';
import {
  analyzeMealImageWithGemini, analyzePackageNutritionPhoto, lookupBarcodeNumber, ScannedMealBreakdown, ScanMode,
} from '../../services/mealVisionService';
import { useFuelStore, FuelMeals } from '../../features/fuel/store/useFuelStore';
import { useLogStore } from '../../stores/useLogStore';
import { tactileEngine } from '../../services/tactileEngine';
import { useSubscription } from '../../context/SubscriptionContext';
import { supabase } from '../../services/supabaseClient';

interface UseMealMacroScannerParams {
  isOpen: boolean;
  targetSlot?: keyof FuelMeals | string;
  defaultSlot?: keyof FuelMeals | string;
  onConfirmMeal?: (dishName: string, kcal: number, p: number, c: number, f: number, slotKey?: keyof FuelMeals) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function useMealMacroScanner({
  isOpen, targetSlot, defaultSlot = 'lunch', onConfirmMeal, showToast,
}: UseMealMacroScannerParams) {
  const { isPro, openPaywall } = useSubscription();
  const [slot, setSlot] = useState<keyof FuelMeals>((targetSlot || defaultSlot || 'lunch') as keyof FuelMeals);
  const [scanMode, setScanMode] = useState<ScanMode>('plate');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedMeal, setScannedMeal] = useState<ScannedMealBreakdown | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSlot((targetSlot || defaultSlot || 'lunch') as keyof FuelMeals);
      setSelectedImage(null);
      setScannedMeal(null);
      setError(null);
      setBarcodeInput('');
    }
  }, [isOpen, targetSlot, defaultSlot]);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToast) showToast(msg, type);
    else useFuelStore.getState().showToast(msg);
  };

  const commitAdjustedMeal = async (name: string, kcal: number, p: number, c: number, f: number, weight: number) => {
    const effectiveSlot = (slot || 'lunch') as keyof FuelMeals;
    useFuelStore.getState().addMealItem(effectiveSlot, {
      id: `meal-ai-${Date.now()}`, name, calories: kcal, protein: p, carbs: c, fats: f,
    });
    try {
      const logState = useLogStore.getState();
      const n = logState.subModules?.nutrition;
      logState.updateSubModule('nutrition', {
        caloriesConsumed: (n?.caloriesConsumed || 0) + kcal,
        proteinG: (n?.proteinG || 0) + p,
        carbsG: (n?.carbsG || 0) + c,
        fatsG: (n?.fatsG || 0) + f,
      });
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || (typeof window !== 'undefined' && localStorage.getItem('o1fc_user_id')) || 'default-athlete';
      await supabase.from('nutrition_logs').insert([{
        user_id: userId, meal_slot: effectiveSlot, food_name: name, calories: kcal,
        protein: p, carbs: c, fats: f, serving_grams: weight, created_at: new Date().toISOString(),
      }]);
    } catch {}
    onConfirmMeal?.(name, kcal, p, c, f, effectiveSlot);
    triggerToast(`🎯 Logged to ${effectiveSlot}: ${name} (${p}g P / ${kcal} kcal)`, 'success');
    setScannedMeal(null);
  };

  const executeScan = async (action: () => Promise<ScannedMealBreakdown>) => {
    if (!isPro) return openPaywall('Meal Vision Nutrition Scanner');
    setError(null);
    setScannedMeal(null);
    setIsScanning(true);
    setIsLoading(true);
    tactileEngine.triggerSelectionBuzz();

    try {
      const detected = await action();
      setScannedMeal(detected);
      tactileEngine.playPRCelebration();
    } catch (err: any) {
      const errMsg =
        err?.message?.includes('permission') || err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Manual macro entry enabled.'
          : err?.message || 'Could not resolve meal macronutrients. Use manual entry.';
      setError(errMsg);
      triggerToast('Camera/scan unavailable. Switched to manual macro entry.', 'info');
    } finally {
      setIsScanning(false);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setSelectedImage(URL.createObjectURL(file));
    executeScan(() =>
      scanMode === 'package' ? analyzePackageNutritionPhoto(file) : analyzeMealImageWithGemini(file, scanMode)
    );
  };

  const handleBarcodeLookup = (overrideCode?: string) => {
    const code = (overrideCode || barcodeInput).trim();
    if (!code) return;
    executeScan(() => lookupBarcodeNumber(code));
  };

  return {
    scanMode, setScanMode, barcodeInput, setBarcodeInput, selectedImage,
    isScanning, isLoading, error, scannedMeal, handleFileUpload, handleBarcodeLookup, commitAdjustedMeal, slot,
  };
}
