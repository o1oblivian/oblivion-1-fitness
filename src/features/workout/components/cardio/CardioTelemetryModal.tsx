import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Activity, Loader2 } from 'lucide-react';
import { analyzeConsoleTelemetry, CardioTelemetryResult } from '../../../../services/geminiVisionService';
import { processCardioScanImage } from '../../../log/services/cardioScanService';
import { Capacitor } from '@capacitor/core';
import { capturePhotoDataUrl, PhotoSource } from '../../../../services/nativeCameraService';
import { useLogStore } from '../../../../stores/useLogStore';
import { useFuelStore } from '../../../fuel/store/useFuelStore';
import { useTelemetryHistoryStore } from '../../../log/store/useTelemetryHistoryStore';
import { localDayKey } from '../../../log/services/dayLogService';
import { addCardioSession } from '../../../log/services/cardioLogService';
import { telemetryArbitrationService } from '../../../telemetry/services/telemetryArbitrationService';
import { estimateStepsFromCardio } from '../../../telemetry/services/stepEstimate';
import { tactileEngine } from '../../../../services/tactileEngine';
import { CardioMetricsGrid, MetricItem } from './CardioMetricsGrid';

const NO_NUMBERS = { ok: false, text: 'No numbers found. Tap any number to enter it, or retake the photo.' };
const foundMessage = (r: Pick<CardioTelemetryResult, 'steps' | 'distanceKm' | 'elapsedMinutes' | 'deviceType'>) => {
  if (r.steps) {
    const where = r.deviceType === 'watch' ? 'watch' : 'screen';
    return { ok: true, text: `Read ${r.steps.toLocaleString()} steps from the ${where}.` };
  }
  const est = estimateStepsFromCardio(r.distanceKm, r.elapsedMinutes);
  return { ok: true, text: est ? `No steps on screen. Estimated ~${est.toLocaleString()} steps from distance.` : 'Numbers found.' };
};

interface Props {
  isOpen: boolean; onClose: () => void; onPostCardio?: (data: CardioTelemetryResult) => void;
}

export const CardioTelemetryModal: React.FC<Props> = ({ isOpen, onClose, onPostCardio }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [telemetry, setTelemetry] = useState<CardioTelemetryResult | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessImage = async (base64: string) => {
    setSelectedImage(base64);
    setIsAnalyzing(true);
    setStatusMessage(null);
    tactileEngine.triggerSelectionBuzz();
    try {
      const res = await analyzeConsoleTelemetry(base64);
      const hasAny = res.steps != null || res.distanceKm != null || res.caloriesBurned != null || res.elapsedMinutes != null;
      if (hasAny) {
        setTelemetry(res);
        setStatusMessage(foundMessage(res));
        tactileEngine.playPRCelebration();
        setIsAnalyzing(false);
        return;
      }
    } catch {
      /* fall through to on-device OCR */
    }
    try {
      const ocr = await processCardioScanImage(base64, 'watch', { skipServer: true });
      const mapped: CardioTelemetryResult = {
        deviceType: ocr.activityType?.toLowerCase().includes('console') ? 'console' : 'watch',
        elapsedDisplay: ocr.durationMinutes,
        elapsedMinutes: ocr.durationMinutes,
        distanceKm: ocr.distanceKm,
        caloriesBurned: ocr.burnedKcal,
        speedKmh: null,
        inclinePct: null,
        avgHeartRateBpm: ocr.avgHeartRateBpm,
        steps: ocr.steps,
      };
      const hasOcr = mapped.steps != null || mapped.distanceKm != null || mapped.caloriesBurned != null || mapped.elapsedMinutes != null;
      setTelemetry(hasOcr ? mapped : null);
      setStatusMessage(hasOcr ? foundMessage(mapped) : NO_NUMBERS);
      if (hasOcr) tactileEngine.playPRCelebration();
    } catch {
      setTelemetry(null);
      setStatusMessage(NO_NUMBERS);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && handleProcessImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateMetric = (id: string, val: number | string) => {
    setTelemetry((prev) => {
      const b = prev || { deviceType: 'watch', elapsedDisplay: null, elapsedMinutes: null, distanceKm: null, caloriesBurned: null, speedKmh: null, inclinePct: null, avgHeartRateBpm: null, steps: null };
      const n = Number(val) || null;
      if (id === 'elapsed') return { ...b, elapsedMinutes: typeof val === 'number' ? val : parseFloat(String(val)) || null, elapsedDisplay: String(val) };
      if (id === 'calories') return { ...b, caloriesBurned: n };
      if (id === 'distance') return { ...b, distanceKm: n };
      if (id === 'speed') return { ...b, speedKmh: n };
      if (id === 'incline') return { ...b, inclinePct: n };
      if (id === 'heartRate') return { ...b, avgHeartRateBpm: n };
      if (id === 'steps') return { ...b, steps: typeof val === 'number' ? val : parseInt(String(val).replace(/,/g, ''), 10) || null };
      return b;
    });
  };

  const estimatedSteps = telemetry && telemetry.steps == null ? estimateStepsFromCardio(telemetry.distanceKm, telemetry.elapsedMinutes) : null;

  const handlePost = () => {
    if (!telemetry) return;
    const today = localDayKey(new Date().toISOString());
    const readSteps = telemetry.steps || 0;
    const steps = readSteps || estimatedSteps || 0, dist = telemetry.distanceKm || 0, dur = telemetry.elapsedMinutes || 0, cal = telemetry.caloriesBurned || 0, hr = telemetry.avgHeartRateBpm || 0;
    const activityType = !selectedImage ? 'Cardio' : telemetry.deviceType === 'watch' ? 'Watch' : 'Console';
    const history = useTelemetryHistoryStore.getState();
    const day = addCardioSession(history.historyByDate[today]?.cardio, { distanceKm: dist, durationMinutes: dur, burnedKcal: cal, avgHeartRateBpm: hr, steps, activityType });
    history.updateDayRecord(today, 'cardio', day);
    try {
      useLogStore.getState().updateSubModule('cardio', { burnedKcal: day.burnedKcal, durationMinutes: day.durationMinutes, avgHeartRateBpm: day.avgHeartRateBpm, distanceKm: day.distanceKm });
      if (cal > 0) useFuelStore.getState().logBurned(cal);
      if (telemetry.deviceType === 'watch' && readSteps > 0) telemetryArbitrationService.setDailyCumulative(readSteps);
      else telemetryArbitrationService.recordConsoleSession({ distanceKm: dist, durationMinutes: dur, steps: steps || undefined, burnedKcal: cal });
    } catch {}
    onPostCardio?.(telemetry);
    tactileEngine.playPRCelebration();
    onClose();
  };

  const metrics: MetricItem[] = [
    telemetry?.steps != null
      ? { id: 'steps', label: 'Steps', num: telemetry.steps.toLocaleString(), unit: 'steps' }
      : { id: 'steps', label: 'Steps', num: estimatedSteps != null ? `~${estimatedSteps.toLocaleString()}` : '--', unit: estimatedSteps != null ? 'est.' : 'steps' },
    { id: 'elapsed', label: 'Time', num: telemetry?.elapsedDisplay || (telemetry?.elapsedMinutes ?? '--'), unit: String(telemetry?.elapsedDisplay ?? '').includes(':') ? '' : 'min' },
    { id: 'calories', label: 'Calories', num: telemetry?.caloriesBurned != null ? telemetry.caloriesBurned : '--', unit: 'kcal' },
    { id: 'distance', label: 'Distance', num: telemetry?.distanceKm != null ? telemetry.distanceKm : '--', unit: 'km' },
    { id: 'heartRate', label: 'Heart rate', num: telemetry?.avgHeartRateBpm != null ? telemetry.avgHeartRateBpm : '--', unit: 'bpm' },
    { id: 'speed', label: 'Speed', num: telemetry?.speedKmh != null ? telemetry.speedKmh : '--', unit: 'km/h' },
    { id: 'incline', label: 'Incline', num: telemetry?.inclinePct != null ? telemetry.inclinePct : '--', unit: '%' },
  ];

  const handleCapture = (source: PhotoSource) => {
    if (!Capacitor.isNativePlatform()) {
      (source === 'camera' ? cameraInputRef : fileInputRef).current?.click();
      return;
    }
    setIsCapturing(true);
    setStatusMessage(null);
    void capturePhotoDataUrl(source)
      .then((dataUrl) => {
        setIsCapturing(false);
        void handleProcessImage(dataUrl);
      })
      .catch((err: unknown) => {
        setIsCapturing(false);
        const message = err instanceof Error ? err.message : 'Could not open the camera.';
        setStatusMessage({ ok: false, text: message });
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="cardio-scan-title" className="o1-sheet-card bg-o1-card overflow-hidden flex flex-col border border-white/[0.07]">
        <div className="flex items-start justify-between gap-3 px-3 py-2.5 bg-black border-b border-white/[0.05]">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-o1-crimson/10 border border-o1-crimson/20 flex items-center justify-center text-o1-crimson"><Activity className="w-4 h-4" strokeWidth={1.75} /></div>
            <div className="min-w-0 space-y-0.5">
              <h2 id="cardio-scan-title" className="text-[14px] font-light text-white tracking-wide">Scan Cardio &amp; Watch</h2>
              <p className="text-[11px] font-light text-neutral-400 leading-snug">Take a photo of your treadmill screen, bike console, or watch dial to auto-sync your metrics.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 -mr-1 text-neutral-400 hover:text-white rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-3 py-2.5 overflow-y-auto space-y-2.5 flex-1 min-h-0">
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleCapture('camera')} disabled={isCapturing} className="flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white text-[12px] font-normal cursor-pointer active:scale-[0.98] transition disabled:opacity-60"><Camera className="w-3.5 h-3.5" strokeWidth={1.75} /> {isCapturing ? 'Opening camera…' : 'Snap Screen / Dial'}</button>
            <button type="button" onClick={() => handleCapture('photos')} disabled={isCapturing} className="flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-[12px] font-normal cursor-pointer border border-white/[0.07] active:scale-[0.98] transition disabled:opacity-60"><ImageIcon className="w-3.5 h-3.5" strokeWidth={1.75} /> Choose from Photos</button>
          </div>
          {selectedImage && (
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-48 flex items-center justify-center border border-white/[0.07]">
              <img src={selectedImage} alt="Cardio display" className="max-h-48 object-contain" />
              {isAnalyzing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-white text-[12px] font-light"><Loader2 className="w-4 h-4 animate-spin text-o1-crimson" /> Reading numbers…</div>}
            </div>
          )}
          {statusMessage && (
            <p role="status" className={`px-3 py-2 rounded-xl border text-[11px] font-light leading-snug ${
              statusMessage.ok ? 'bg-[#059669]/10 border-[#059669]/25 text-[#10b981]' : 'bg-[#d97706]/10 border-[#d97706]/25 text-[#f59e0b]'
            }`}>
              {statusMessage.text}
            </p>
          )}
          <CardioMetricsGrid metrics={metrics} onUpdateMetric={handleUpdateMetric} />
        </div>
        <div className="px-3 py-2.5 bg-black border-t border-white/[0.05]">
          <button type="button" onClick={handlePost} disabled={!telemetry || isAnalyzing} className="w-full h-10 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press text-white disabled:opacity-40 font-normal text-[13px] tracking-wide flex items-center justify-center cursor-pointer active:scale-[0.99] transition">Save Cardio Session</button>
        </div>
      </div>
    </div>
  );
};
export default CardioTelemetryModal;
