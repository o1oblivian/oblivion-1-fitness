import React, { RefObject, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, Upload, Scan, Video } from 'lucide-react';
import { ScanMode } from '../../services/mealVisionTypes';
import {
  capturePhotoDataUrl,
  preloadNativeCamera,
  PhotoSource,
} from '../../services/nativeCameraService';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';
import { canDetectBarcodes } from '../../services/barcodeLookupService';

/** The scanner sends the photo at 1024px, so the phone is asked for no more than that. */
const SCAN_PHOTO_PX = 1024;

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
  scanMode,
  barcodeInput,
  setBarcodeInput,
  onBarcodeLookup,
  isLoading,
  cameraInputRef,
  fileInputRef,
  onFileUpload,
}) => {
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    preloadNativeCamera();
  }, []);

  const openPhoto = (source: PhotoSource) => {
    if (!Capacitor.isNativePlatform()) {
      (source === 'camera' ? cameraInputRef : fileInputRef).current?.click();
      return;
    }
    setCaptureError(null);
    void capturePhotoDataUrl(source, SCAN_PHOTO_PX)
      .then(async (dataUrl) => {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], source === 'camera' ? 'meal.jpg' : 'meal-upload.jpg', {
          type: blob.type || 'image/jpeg',
        });
        onFileUpload(file);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'The camera did not open.';
        if (/cancel/i.test(message)) return;
        setCaptureError(message);
      });
  };

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
          ) : canDetectBarcodes() ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLiveScanner(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-o1-olive hover:bg-o1-olive text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>Live Barcode Camera</span>
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 bg-o1-well border border-white/[0.07] rounded-xl px-3 py-1.5">
            <Scan className="w-4 h-4 text-o1-muted shrink-0" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onBarcodeLookup();
              }}
              placeholder="Type the barcode number"
              className="bg-transparent text-xs text-white placeholder-o1-faint focus:outline-none flex-1 py-1"
            />
            <button
              type="button"
              onClick={() => onBarcodeLookup()}
              disabled={!barcodeInput.trim() || isLoading}
              className="px-3 py-1 bg-o1-crimson hover:bg-o1-crimson-hover text-white text-o1-label font-bold rounded-xl transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            >
              Lookup
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Package Nutrition Facts OCR Guide Overlay */}
      {scanMode === 'package' && (
        <p className="text-o1-label text-o1-muted text-center">
          Fill the photo with the Nutrition Facts table.
        </p>
      )}

      {/* Tab 3: Plate Interactive Estimate Guide */}
      {scanMode === 'plate' && (
        <p className="text-o1-label text-o1-muted text-center">
          Photograph the whole plate from above.
        </p>
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

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => openPhoto('camera')}
          disabled={isLoading}
          className="h-10 flex items-center justify-center gap-2 px-3 rounded-xl bg-white text-o1-canvas text-xs font-semibold cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          <span>Take Photo</span>
        </button>
        <button
          type="button"
          onClick={() => openPhoto('photos')}
          disabled={isLoading}
          className="h-10 flex items-center justify-center gap-2 px-3 rounded-xl bg-o1-well hover:bg-white/[0.06] text-o1-ink-soft text-xs font-semibold cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Photo</span>
        </button>
      </div>
      {captureError ? <p className="text-o1-caption text-o1-crimson">{captureError}</p> : null}
    </div>
  );
};
export default MealScanActions;
