import React, { useRef } from 'react';
import { X, Utensils, AlertCircle } from 'lucide-react';
import { FuelMeals } from '../features/fuel/store/useFuelStore';
import { ScannedMealResultCard } from './ScannedMealResultCard';
import { MealScanModeSelector } from './meal-scanner/MealScanModeSelector';
import { MealScanLoadingBadge } from './meal-scanner/MealScanLoadingBadge';
import { MealScanActions } from './meal-scanner/MealScanActions';
import { useMealMacroScanner } from './meal-scanner/useMealMacroScanner';

export interface MealMacroScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot?: keyof FuelMeals | string;
  defaultSlot?: keyof FuelMeals | string;
  onConfirmMeal?: (dishName: string, kcal: number, p: number, c: number, f: number, slotKey?: keyof FuelMeals) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MealMacroScannerModal: React.FC<MealMacroScannerModalProps> = (props) => {
  const { isOpen, onClose } = props;
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    scanMode,
    setScanMode,
    barcodeInput,
    setBarcodeInput,
    selectedImage,
    isScanning,
    isLoading,
    error,
    scannedMeal,
    handleFileUpload,
    handleBarcodeLookup,
    commitAdjustedMeal,
    slot,
  } = useMealMacroScanner(props);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85">
      <div className="w-full max-w-lg bg-[#121214] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-950/60 flex items-center justify-center text-[#C4121A]">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Meal Macro Scanner</h2>
              <p className="text-[11px] font-mono text-neutral-400">Gemini Vision Multimodal Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <MealScanModeSelector scanMode={scanMode} onSelectMode={setScanMode} />
          <MealScanActions
            scanMode={scanMode}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            onBarcodeLookup={handleBarcodeLookup}
            isLoading={isLoading || isScanning}
            cameraInputRef={cameraInputRef}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
          />

          {selectedImage ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <img src={selectedImage} alt="Scanned item" className="w-full h-full object-contain" />
              {(isLoading || isScanning) && <MealScanLoadingBadge scanMode={scanMode} />}
            </div>
          ) : scanMode !== 'barcode' && !scannedMeal ? (
            <div className="rounded-2xl border border-neutral-800 bg-[#09090b] p-6 text-center space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">Sensor Standby</span>
              <p className="text-[11px] text-neutral-500">Optical vision models in standby mode. Awaiting camera capture.</p>
            </div>
          ) : null}

          {error && (
            <div className="p-3 rounded-2xl bg-red-950/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {scannedMeal && (
            <ScannedMealResultCard
              scannedMeal={scannedMeal}
              slotName={slot}
              onCommitMeal={(name, kcal, p, c, f, weight) => {
                commitAdjustedMeal(name, kcal, p, c, f, weight);
                onClose();
              }}
            />
          )}
        </div>

        <div className="p-3.5 bg-[#09090b] flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-[#18181b] hover:bg-[#222227] text-neutral-300 text-xs font-medium cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealMacroScannerModal;
