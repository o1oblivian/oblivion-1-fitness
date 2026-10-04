import React, { RefObject, useState } from 'react';
import { Camera, Upload, Scan, Video } from 'lucide-react';
import { ScanMode } from '../../services/mealVisionTypes';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface MealScanActionsProps {
  scanMode: ScanMode;
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  onBarcodeLookup: (overrideCode?: string) => void;
  isLoading: boolean;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (file: File) => void;
}

export const MealScanActions: React.FC<MealScanActionsProps> = ({
  scanMode, barcodeInput, setBarcodeInput, onBarcodeLookup,
  isLoading, cameraInputRef, fileInputRef, onFileUpload,
}) => {
  const [showLiveScanner, setShowLiveScanner] = useState(false);

  return (
    <div className="space-y-3">
      {/* Tab 1: Barcode Live Scanner or Manual Lookup */}
      {scanMode === 'barcode' && (
        <div className="space-y-2">
          {showLiveScanner ? (
            <LiveBarcodeScanner
              onDetected={(code) => {
                setBarcodeInput(code);
                onBarcodeLookup(code);
                setShowLiveScanner(false);
              }}
              onClose={() => setShowLiveScanner(false)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLiveScanner(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>Live Barcode Camera</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#18181b] border border-neutral-800 rounded-xl px-3 py-1.5">
            <Scan className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onBarcodeLookup(); }}
              placeholder="Enter UPC/EAN code or product name..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 py-1"
            />
            <button
              type="button"
              onClick={() => onBarcodeLookup()}
              disabled={!barcodeInput.trim() || isLoading}
              className="px-3 py-1 bg-[#C4121A] hover:bg-[#a50f16] text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            >
              Lookup
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Package Nutrition Facts OCR Guide Overlay */}
      {scanMode === 'package' && (
        <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-center space-y-1">
          <p className="text-xs font-mono font-bold text-amber-300">Align Nutrition Facts Table</p>
          <p className="text-[10px] text-neutral-400">Strictly extracts serving grams, calories, protein, carbs & fat</p>
        </div>
      )}

      {/* Tab 3: Plate Interactive Estimate Guide */}
      {scanMode === 'plate' && (
        <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-1">
          <p className="text-xs font-mono font-bold text-neutral-200">Plate Nutrition Vision Engine</p>
          <p className="text-[10px] text-neutral-400">Visual portion mass estimation with real-time Atwater adjustment</p>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileUpload(f);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileUpload(f);
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#C4121A] hover:bg-[#a50f16] text-white text-xs font-bold cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          <span>Take Photo</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#18181b] hover:bg-[#222227] text-neutral-200 text-xs font-bold cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Photo</span>
        </button>
      </div>
    </div>
  );
};
export default MealScanActions;
