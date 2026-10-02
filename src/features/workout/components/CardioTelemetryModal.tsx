import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Activity, Zap, AlertCircle } from 'lucide-react';
import { analyzeConsoleTelemetry, CardioTelemetryResult } from '../../../services/geminiVisionService';
import { useLogStore } from '../../../stores/useLogStore';
import { useFuelStore } from '../../fuel/store/useFuelStore';
import { useTelemetryHistoryStore } from '../../log/store/useTelemetryHistoryStore';
import { telemetryArbitrationService } from '../../telemetry/services/telemetryArbitrationService';
import { tactileEngine } from '../../../services/tactileEngine';
import { useSubscription } from '../../../context/SubscriptionContext';
import { CardioMetricsGrid } from './cardio/CardioMetricsGrid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPostCardio?: (data: CardioTelemetryResult) => void;
}

export const CardioTelemetryModal: React.FC<Props> = ({ isOpen, onClose, onPostCardio }) => {
  const { isPro, openPaywall } = useSubscription();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<CardioTelemetryResult | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPro) return openPaywall('Cardio & Wearable OCR Scanner');
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      setSelectedImage(reader.result as string);
      setIsAnalyzing(true);
      tactileEngine.triggerSelectionBuzz();
      try {
        const res = await analyzeConsoleTelemetry(reader.result as string);
        setTelemetry(res);
        tactileEngine.playPRCelebration();
      } catch (err: any) {
        setError(err.message || 'Could not read console numbers. Retake photo with less glare.');
      } finally { setIsAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const distance = telemetry?.distanceKm && telemetry.distanceKm > 0 ? telemetry.distanceKm : 0;
  const derivedSteps = telemetry?.steps && telemetry.steps > 0
    ? telemetry.steps
    : (distance > 0 ? Math.round(distance * 1250) : null);
  const calories = telemetry?.caloriesBurned || (derivedSteps ? Math.round(derivedSteps * 0.04) : 0);
  const duration = telemetry?.elapsedMinutes || (derivedSteps ? Math.max(1, Math.round(derivedSteps / 100)) : 15);
  const displayElapsed = telemetry?.elapsedDisplay && telemetry.elapsedDisplay !== '--' ? telemetry.elapsedDisplay : `${duration}`;

  const handlePost = () => {
    if (!telemetry) return;
    const todayDateKey = new Date().toISOString().slice(0, 10);
    const avgHr = telemetry.avgHeartRateBpm || 0;
    const isWatch = telemetry.deviceType === 'watch';

    useTelemetryHistoryStore.getState().updateDayRecord(todayDateKey, 'cardio', {
      hasData: true, distanceKm: Number(distance.toFixed(2)), durationMinutes: duration,
      burnedKcal: calories, avgHeartRateBpm: avgHr, zone2Minutes: Math.round(duration * 0.7),
      activityType: isWatch ? 'Watch Telemetry' : 'Console Telemetry',
    });

    try {
      useLogStore.getState().updateSubModule('cardio', {
        burnedKcal: calories, durationMinutes: duration, avgHeartRateBpm: avgHr, distanceKm: distance,
      });
      if (calories > 0) useFuelStore.getState().logBurned(calories);
      if (isWatch && derivedSteps) {
        telemetryArbitrationService.setDailyCumulative(derivedSteps);
      } else {
        telemetryArbitrationService.recordConsoleSession({
          distanceKm: distance, durationMinutes: duration, steps: derivedSteps || undefined, burnedKcal: calories,
        });
      }
    } catch {}

    onPostCardio?.({ ...telemetry, steps: derivedSteps || 0, distanceKm: distance, caloriesBurned: calories, elapsedMinutes: duration, elapsedDisplay: displayElapsed });
    tactileEngine.playPRCelebration();
    onClose();
  };

  const metrics = [
    { label: 'ELAPSED', num: telemetry ? displayElapsed : '--', unit: 'min' },
    { label: 'CALORIES', num: telemetry ? calories : '--', unit: 'kcal' },
    { label: 'DISTANCE', num: telemetry ? distance : '--', unit: 'km' },
    { label: 'SPEED', num: telemetry?.speedKmh ?? '--', unit: 'km/h' },
    { label: 'INCLINE', num: telemetry?.inclinePct ?? '--', unit: '%' },
    ...(telemetry?.avgHeartRateBpm ? [{ label: 'HEART RATE', num: telemetry.avgHeartRateBpm, unit: 'bpm' }] : []),
    ...(derivedSteps ? [{ label: 'STEPS', num: derivedSteps.toLocaleString(), unit: 'steps' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85">
      <div className="w-full max-w-lg bg-[#121214] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-neutral-800">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#09090b] border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-500/20 flex items-center justify-center text-[#C4121A]"><Activity className="w-4 h-4" /></div>
            <div>
              <h2 className="text-xs font-tactical font-black text-white uppercase tracking-wider">Cardio & Wearable OCR</h2>
              <p className="text-[10px] font-sans font-medium text-neutral-400">Direct Multimodal Console Telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] text-white text-[11px] font-tactical font-black uppercase tracking-wider cursor-pointer active:scale-95 transition shadow-md"><Camera className="w-3.5 h-3.5" /> Take Photo</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#18181b] hover:bg-[#222227] border border-neutral-700/80 text-white text-[11px] font-tactical font-black uppercase tracking-wider cursor-pointer active:scale-95 transition"><Upload className="w-3.5 h-3.5" /> Upload Photo</button>
          </div>
          {selectedImage && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-neutral-800">
              <img src={selectedImage} alt="Display" className="w-full h-full object-contain" />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-[#C4121A] border-t-transparent animate-spin" /><p className="text-xs font-tactical font-bold text-white uppercase tracking-wider">Multimodal Vision Parsing...</p>
                </div>
              )}
            </div>
          )}
          {error && <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
          <CardioMetricsGrid metrics={metrics} />
        </div>
        <div className="p-3.5 bg-[#09090b] border-t border-neutral-800">
          <button onClick={handlePost} disabled={!telemetry || isAnalyzing} className="w-full py-3 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] active:scale-[0.98] disabled:opacity-40 text-white text-xs font-tactical font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition"><Zap className="w-3.5 h-3.5 fill-white text-white" /> Save Telemetry To Session</button>
        </div>
      </div>
    </div>
  );
};
export default CardioTelemetryModal;
