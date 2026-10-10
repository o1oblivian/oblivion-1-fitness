import React, { useState, useRef } from 'react';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { telemetryArbitrationService } from '../../telemetry/services/telemetryArbitrationService';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { persistCardioLog } from '../services/cardioLogService';
import { processCardioScanImage } from '../services/cardioScanService';
import { CardioScanUploader } from './scan/CardioScanUploader';
import { CardioScanMetricFields, ExtractedCardioData } from './scan/CardioScanMetricFields';
import { captureNativeStill } from '../../../services/nativeCameraService';

interface CardioConsoleScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey?: string;
  onSynced?: (message: string) => void;
}

export const CardioConsoleScanModal: React.FC<CardioConsoleScanModalProps> = ({
  isOpen, onClose, dateKey, onSynced,
}) => {
  const targetDateKey = dateKey || new Date().toISOString().slice(0, 10);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'console' | 'watch'>('watch');
  const [extractedData, setExtractedData] = useState<ExtractedCardioData | null>(null);

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
    let loggedSteps = extractedData.steps || 0;

    if (scanMode === 'watch') {
      telemetryArbitrationService.setDailyCumulative(loggedSteps);
    } else {
      const res = telemetryArbitrationService.recordConsoleSession({
        distanceKm: extractedData.distanceKm,
        durationMinutes: extractedData.durationMinutes,
        steps: extractedData.steps,
        burnedKcal: extractedData.burnedKcal,
      });
      loggedSteps = res.sessionSteps;
    }

    if (extractedData.burnedKcal > 0) useFuelStore.getState().logBurned(extractedData.burnedKcal);
    await persistCardioLog({
      activityType: extractedData.activityType,
      distanceKm: extractedData.distanceKm,
      durationMinutes: extractedData.durationMinutes,
      burnedKcal: extractedData.burnedKcal,
      avgHeartRateBpm: extractedData.avgHeartRateBpm,
      steps: loggedSteps,
      dateKey: targetDateKey,
    });

    onSynced?.(scanMode === 'watch'
      ? `Watch baseline synced: ${loggedSteps.toLocaleString()} cumulative steps`
      : `Console session logged: +${loggedSteps.toLocaleString()} steps added`);
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

  const handleCameraCapture = async () => {
    try {
      const blob = await captureNativeStill();
      if (blob) {
        const r = new FileReader();
        r.onload = () => handleProcessImage(r.result as string);
        r.readAsDataURL(blob);
        return;
      }
    } catch {
      /* web file input fallback */
    }
    cameraInputRef.current?.click();
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
          isScanning={isScanning} cameraInputRef={cameraInputRef} fileInputRef={fileInputRef}
          onCameraCapture={() => void handleCameraCapture()}
        />

        {extractedData && (
          <div className="space-y-3 pt-1">
            <CardioScanMetricFields data={extractedData} onChange={setExtractedData} />
            <button
              type="button"
              onClick={handleSaveTelemetry}
              className="w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md"
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
