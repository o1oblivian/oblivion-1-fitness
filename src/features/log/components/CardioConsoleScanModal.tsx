import React, { useState, useRef } from 'react';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { telemetryArbitrationService } from '../../telemetry/services/telemetryArbitrationService';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { persistCardioLog } from '../services/cardioLogService';
import { localDayKey } from '../services/dayLogService';
import { processCardioScanImage } from '../services/cardioScanService';
import { estimateStepsFromCardio } from '../../telemetry/services/stepEstimate';
import { CardioScanUploader } from './scan/CardioScanUploader';
import { CardioScanMetricFields, ExtractedCardioData } from './scan/CardioScanMetricFields';
import { Capacitor } from '@capacitor/core';
import { capturePhotoDataUrl, PhotoSource } from '../../../services/nativeCameraService';

interface CardioConsoleScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey?: string;
  onSynced?: (message: string) => void;
}

export const CardioConsoleScanModal: React.FC<CardioConsoleScanModalProps> = ({
  isOpen, onClose, dateKey, onSynced,
}) => {
  const targetDateKey = dateKey || localDayKey(new Date().toISOString());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'console' | 'watch'>('watch');
  const [extractedData, setExtractedData] = useState<ExtractedCardioData | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessImage = async (base64Image: string) => {
    setImagePreview(base64Image);
    setIsScanning(true);
    tactileEngine.triggerSelectionBuzz();
    try {
      const data = await processCardioScanImage(base64Image, scanMode);
      setExtractedData(data);
      tactileEngine.playPRCelebration();
    } catch (err: any) {
      onSynced?.(err?.message || 'Could not parse screen numbers. Retake photo with less glare.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveTelemetry = async () => {
    if (!extractedData) return;
    const distanceKm = extractedData.distanceKm ?? 0;
    const durationMinutes = extractedData.durationMinutes ?? 0;
    const burnedKcal = extractedData.burnedKcal ?? 0;
    const isToday = targetDateKey === localDayKey(new Date().toISOString());
    const readSteps = extractedData.steps ?? 0;
    if (distanceKm <= 0 && durationMinutes <= 0 && burnedKcal <= 0 && readSteps <= 0) {
      // Nothing was read from the photo. Never save an empty session as zeros.
      onSynced?.('No numbers were readable on that screen. Retake the photo, or log it by hand.');
      return;
    }
    let loggedSteps = readSteps || estimateStepsFromCardio(distanceKm, durationMinutes) || 0;
    const syncWatchTotal = scanMode === 'watch' && readSteps > 0;

    if (isToday) {
      if (syncWatchTotal) {
        telemetryArbitrationService.setDailyCumulative(readSteps);
      } else {
        const res = telemetryArbitrationService.recordConsoleSession({
          distanceKm,
          durationMinutes,
          steps: loggedSteps,
          burnedKcal,
        });
        loggedSteps = res.sessionSteps;
      }
      if (burnedKcal > 0) useFuelStore.getState().logBurned(burnedKcal);
    }

    await persistCardioLog({
      activityType: extractedData.activityType,
      distanceKm,
      durationMinutes,
      burnedKcal,
      avgHeartRateBpm: extractedData.avgHeartRateBpm ?? 0,
      steps: loggedSteps,
      dateKey: targetDateKey,
    });

    onSynced?.(syncWatchTotal
      ? `Watch baseline synced: ${loggedSteps.toLocaleString()} cumulative steps`
      : `Session logged: +${loggedSteps.toLocaleString()} steps${readSteps > 0 ? '' : ' (est.)'}`);
    tactileEngine.playPRCelebration();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => handleProcessImage(r.result as string);
      r.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (source: PhotoSource = 'camera') => {
    setCaptureError(null);
    if (!Capacitor.isNativePlatform()) {
      (source === 'camera' ? cameraInputRef : fileInputRef).current?.click();
      return;
    }
    setIsCapturing(true);
    void capturePhotoDataUrl(source)
      .then((dataUrl) => {
        setIsCapturing(false);
        void handleProcessImage(dataUrl);
      })
      .catch((err: unknown) => {
        setIsCapturing(false);
        const message = err instanceof Error ? err.message : 'Could not open the camera.';
        setCaptureError(message);
        onSynced?.(message);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-200">
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-tactical font-black tracking-wider text-white">
                Optical Telemetry Scanner
              </h3>
              <p className="text-[10px] font-mono text-neutral-400">
                OCR Screen & Watch Ingestion
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/[0.06] text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />

        <CardioScanUploader
          scanMode={scanMode} setScanMode={setScanMode} imagePreview={imagePreview}
          isScanning={isScanning || isCapturing} cameraInputRef={cameraInputRef} fileInputRef={fileInputRef}
          onCameraCapture={() => handleCameraCapture('camera')}
          onPickPhotos={() => handleCameraCapture('photos')}
        />
        {captureError ? (
          <p role="alert" className="px-3 py-2 rounded-xl border border-[#d97706]/25 bg-[#d97706]/10 text-[11px] font-light text-[#f59e0b]">{captureError}</p>
        ) : null}

        {extractedData && (
          <div className="space-y-3 pt-1">
            <CardioScanMetricFields data={extractedData} onChange={setExtractedData} />
            <button
              type="button"
              onClick={handleSaveTelemetry}
              className="w-full py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save telemetry to session</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default CardioConsoleScanModal;
