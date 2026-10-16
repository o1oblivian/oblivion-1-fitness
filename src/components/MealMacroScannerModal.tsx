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
    imageFile,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim">
      <div className="o1-sheet-card bg-o1-card overflow-hidden shadow-xl flex flex-col border border-white/[0.07]">
        <div className="flex items-center justify-between px-3 py-2.5 bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Meal Macro Scanner</h2>
              <p className="text-[11px] text-neutral-500">Vision · barcode · plate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/[0.06] text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2.5 space-y-2.5 overflow-y-auto flex-1">
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
          ) : scanMode !== 'barcode' && !scannedMeal && !imageFile && !isLoading && !isScanning ? (
            <div className="rounded-xl border border-white/[0.07] bg-black px-3 py-4 text-center">
              <p className="text-[11px] text-neutral-500">Your photo shows here.</p>
            </div>
          ) : null}

          {error && (
            <div role="alert" className="w-full px-3 py-2 rounded-xl bg-o1-well border border-[#C4121A]/40 text-o1-text text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px text-[#C4121A]" />
              <span className="flex-1 min-w-0 break-words leading-snug">{error}</span>
            </div>
          )}

          {scannedMeal && (
            <ScannedMealResultCard
              scannedMeal={scannedMeal}
              slotName={slot}
              onCommitMeal={(name, kcal, p, c, f) => {
                commitAdjustedMeal(name, kcal, p, c, f);
                onClose();
              }}
            />
          )}
        </div>

        <div className="px-3 py-2 bg-black flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-o1-well hover:bg-white/[0.06] text-neutral-300 text-xs font-medium cursor-pointer">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealMacroScannerModal;
