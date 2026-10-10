import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { analyzeConsoleTelemetry, CardioTelemetryResult } from '../../../../services/geminiVisionService';
import { processCardioScanImage } from '../../../log/services/cardioScanService';
import { captureNativeStill } from '../../../../services/nativeCameraService';
import { useLogStore } from '../../../../stores/useLogStore';
import { useFuelStore } from '../../../fuel/store/useFuelStore';
import { useTelemetryHistoryStore } from '../../../log/store/useTelemetryHistoryStore';
import { telemetryArbitrationService } from '../../../telemetry/services/telemetryArbitrationService';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useSubscription } from '../../../../context/SubscriptionContext';
import { CardioMetricsGrid, MetricItem } from './CardioMetricsGrid';

interface Props {
  isOpen: boolean; onClose: () => void; onPostCardio?: (data: CardioTelemetryResult) => void;
}

export const CardioTelemetryModal: React.FC<Props> = ({ isOpen, onClose, onPostCardio }) => {
  const { isPro, openPaywall } = useSubscription();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
        setStatusMessage(res.steps != null && res.steps > 0
          ? `Optical OCR extracted ${res.steps.toLocaleString()} steps directly from display.`
          : 'Display parsed. Review telemetry or tap any tile to fine-tune.');
        tactileEngine.playPRCelebration();
        setIsAnalyzing(false);
        return;
      }
    } catch {
      /* fall through to on-device OCR */
    }
    try {
      const ocr = await processCardioScanImage(base64, 'console');
      const mapped: CardioTelemetryResult = {
        deviceType: ocr.activityType?.toLowerCase().includes('watch') ? 'watch' : 'console',
        elapsedDisplay: ocr.durationMinutes || null,
        elapsedMinutes: ocr.durationMinutes || null,
        distanceKm: ocr.distanceKm || null,
        caloriesBurned: ocr.burnedKcal || null,
        speedKmh: null,
        inclinePct: null,
        avgHeartRateBpm: ocr.avgHeartRateBpm || null,
        steps: ocr.steps || null,
      };
      setTelemetry(mapped);
      const hasOcr = mapped.steps != null || mapped.distanceKm != null || mapped.caloriesBurned != null || mapped.elapsedMinutes != null;
      setStatusMessage(hasOcr
        ? (mapped.steps ? `Optical OCR extracted ${mapped.steps.toLocaleString()} steps directly from display.` : 'Display parsed. Review telemetry or tap any tile to fine-tune.')
        : 'No readable numbers detected on image. Tap any metric to enter manually or retake photo.');
      tactileEngine.playPRCelebration();
    } catch {
      setTelemetry(null);
      setStatusMessage('Display could not be resolved automatically. Tap any metric to enter manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPro) return openPaywall('Cardio & Wearable OCR Scanner');
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

  const handlePost = () => {
    if (!telemetry) return;
    const today = new Date().toISOString().slice(0, 10);
    const steps = telemetry.steps || 0, dist = telemetry.distanceKm || 0, dur = telemetry.elapsedMinutes || 0, cal = telemetry.caloriesBurned || 0, hr = telemetry.avgHeartRateBpm || 0;
    useTelemetryHistoryStore.getState().updateDayRecord(today, 'cardio', { hasData: true, distanceKm: dist, durationMinutes: dur, burnedKcal: cal, avgHeartRateBpm: hr, zone2Minutes: 0, steps: steps > 0 ? steps : undefined, activityType: telemetry.deviceType === 'watch' ? 'Watch' : 'Console' });
    try {
      useLogStore.getState().updateSubModule('cardio', { burnedKcal: cal, durationMinutes: dur, avgHeartRateBpm: hr, distanceKm: dist });
      if (cal > 0) useFuelStore.getState().logBurned(cal);
      if (telemetry.deviceType === 'watch' && steps > 0) telemetryArbitrationService.setDailyCumulative(steps);
      else telemetryArbitrationService.recordConsoleSession({ distanceKm: dist, durationMinutes: dur, steps: steps || undefined, burnedKcal: cal });
    } catch {}
    onPostCardio?.(telemetry);
    tactileEngine.playPRCelebration();
    onClose();
  };

  const metrics: MetricItem[] = [
    { id: 'steps', label: 'STEPS', num: telemetry?.steps != null ? telemetry.steps.toLocaleString() : '--', unit: 'steps' },
    { id: 'elapsed', label: 'ELAPSED', num: telemetry?.elapsedDisplay || (telemetry?.elapsedMinutes != null ? `${telemetry.elapsedMinutes} min` : '--'), unit: 'min' },
    { id: 'calories', label: 'CALORIES', num: telemetry?.caloriesBurned != null ? telemetry.caloriesBurned : '--', unit: 'kcal' },
    { id: 'distance', label: 'DISTANCE', num: telemetry?.distanceKm != null ? telemetry.distanceKm : '--', unit: 'km' },
    { id: 'heartRate', label: 'Heart Rate', num: telemetry?.avgHeartRateBpm != null ? telemetry.avgHeartRateBpm : '--', unit: 'bpm' },
    { id: 'speed', label: 'SPEED', num: telemetry?.speedKmh != null ? telemetry.speedKmh : '--', unit: 'km/h' },
    { id: 'incline', label: 'INCLINE', num: telemetry?.inclinePct != null ? telemetry.inclinePct : '--', unit: '%' },
  ];

  const handleTakePhoto = async () => {
    if (!isPro) return openPaywall('Cardio & Wearable OCR Scanner');
    try {
      const blob = await captureNativeStill();
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') handleProcessImage(reader.result);
        };
        reader.readAsDataURL(blob);
        return;
      }
    } catch {
      /* web file input fallback */
    }
    cameraInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="o1-sheet-card bg-o1-card overflow-hidden shadow-xl flex flex-col border border-white/[0.07]">
        <div className="flex items-center justify-between px-5 py-3.5 bg-black border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-o1-crimson/20 flex items-center justify-center text-o1-crimson"><Activity className="w-4 h-4" /></div>
            <div>
              <h2 className="text-xs font-tactical font-black text-white tracking-wider">Cardio & Wearable OCR</h2>
              <p className="text-[10px] font-sans font-medium text-neutral-400">Direct Multimodal Console & Watch Telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-0">
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => void handleTakePhoto()} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-[11px] font-tactical font-black tracking-wider cursor-pointer active:scale-95 transition shadow-md"><Camera className="w-3.5 h-3.5" /> Take Photo</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-o1-well hover:bg-white/[0.06] text-neutral-200 text-[11px] font-tactical font-bold tracking-wider cursor-pointer border border-white/[0.07] active:scale-95 transition"><Upload className="w-3.5 h-3.5" /> Upload Photo</button>
          </div>
          {selectedImage && (
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-48 flex items-center justify-center border border-white/[0.07]">
              <img src={selectedImage} alt="Cardio display" className="max-h-48 object-contain" />
              {isAnalyzing && <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-white font-tactical text-xs tracking-wider font-bold"><Zap className="w-4 h-4 animate-spin text-o1-crimson" /> Reading Display...</div>}
            </div>
          )}
          {statusMessage && (
            <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span className="font-sans font-medium text-[11px] leading-tight">{statusMessage}</span>
            </div>
          )}
          <CardioMetricsGrid metrics={metrics} onUpdateMetric={handleUpdateMetric} />
        </div>
        <div className="p-4 bg-black border-t border-white/[0.05]">
          <button onClick={handlePost} disabled={!telemetry || isAnalyzing} className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-neutral-950 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition"><Zap className="w-4 h-4" /> Save Telemetry to Session</button>
        </div>
      </div>
    </div>
  );
};
export default CardioTelemetryModal;
