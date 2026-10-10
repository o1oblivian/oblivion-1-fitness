import { useState, useEffect } from 'react';
import {
  analyzeMealImageWithGemini, analyzePackageNutritionPhoto, lookupBarcodeNumber, ScannedMealBreakdown, ScanMode,
} from '../../services/mealVisionService';
import { useFuelStore, FuelMeals } from '../../features/fuel/store/useFuelStore';
import { useLogStore } from '../../stores/useLogStore';
import { tactileEngine } from '../../services/tactileEngine';
import { supabase } from '../../services/supabaseClient';
import { getAuthenticatedUserId } from '../../services/authUser';
import { useSubscription } from '../../context/SubscriptionContext';

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
  const [imageFile, setImageFile] = useState<File | Blob | null>(null);
  const [slot, setSlot] = useState<keyof FuelMeals>((targetSlot || defaultSlot || 'lunch') as keyof FuelMeals);
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
      setSlot((targetSlot || defaultSlot || 'lunch') as keyof FuelMeals);
      setSelectedImage(null);
      setImageFile(null);
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
      const userId = await getAuthenticatedUserId();
      if (!userId) return;
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
    } catch (err: any) {
      let errMsg =
        err?.message?.includes('permission') || err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Manual macro entry enabled.'
          : err?.message || 'Could not resolve meal macronutrients with Gemini Vision. Please retake photo with clear view of the food.';

      // Strictly ensure "Sensor Standby" is NEVER shown as an error for a captured photo
      if (errMsg.toLowerCase().includes('sensor standby') || errMsg.toLowerCase().includes('standby mode')) {
        errMsg = 'Could not resolve meal macronutrients with Gemini Vision. Please retake photo with clear view of the food.';
      }

      setError(errMsg);
      triggerToast('Vision analysis could not resolve plate. Switched to manual macro entry.', 'info');
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
      scanMode === 'package' ? analyzePackageNutritionPhoto(file) : analyzeMealImageWithGemini(file, scanMode)
    );
  };

  const handleBarcodeLookup = (overrideCode?: string) => {
    const code = (overrideCode || barcodeInput).trim();
    if (!code) return;
    executeScan(() => lookupBarcodeNumber(code));
  };

  return {
    scanMode, setScanMode, barcodeInput, setBarcodeInput, selectedImage, imageFile,
    isScanning, isLoading, error, scannedMeal, handleFileUpload, handleBarcodeLookup, commitAdjustedMeal, slot,
  };
}
