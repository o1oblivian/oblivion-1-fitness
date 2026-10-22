import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, ScanLine, Loader2 } from 'lucide-react';
import {
  analyzeConsoleTelemetry,
  CardioTelemetryResult,
} from '../../../../services/geminiVisionService';
import { processCardioScanImage } from '../../../log/services/cardioScanService';
import { Capacitor } from '@capacitor/core';
import { capturePhotoDataUrl, PhotoSource } from '../../../../services/nativeCameraService';
import { warmApi } from '../../../../services/apiBase';
import { useLogStore } from '../../../../stores/useLogStore';
import { useFuelStore } from '../../../fuel/store/useFuelStore';
import { useTelemetryHistoryStore } from '../../../log/store/useTelemetryHistoryStore';
import { localDayKey } from '../../../log/services/dayLogService';
import { addCardioSession } from '../../../log/services/cardioLogService';
import { telemetryArbitrationService } from '../../../telemetry/services/telemetryArbitrationService';
import { estimateStepsFromCardio } from '../../../telemetry/services/stepEstimate';
import { tactileEngine } from '../../../../services/tactileEngine';
import { CardioMetricsGrid, MetricItem } from './CardioMetricsGrid';

const NO_NUMBERS = {
  ok: false,
  text: 'No numbers found. Tap any number to enter it, or retake the photo.',
};
const READER_BUSY = {
  ok: false,
  retry: true,
  text: 'The photo reader is busy right now. Try again in a moment, or tap any number to enter it.',
};
const foundMessage = (
  r: Pick<CardioTelemetryResult, 'steps' | 'distanceKm' | 'elapsedMinutes' | 'deviceType'>,
) => {
  if (r.steps) {
    const where = r.deviceType === 'watch' ? 'watch' : 'screen';
    return { ok: true, text: `Read ${r.steps.toLocaleString()} steps from the ${where}.` };
  }
  const est = estimateStepsFromCardio(r.distanceKm, r.elapsedMinutes);
  return {
    ok: true,
    text: est
      ? `No steps on screen. Estimated ~${est.toLocaleString()} steps from distance.`
      : 'Numbers found.',
  };
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPostCardio?: (data: CardioTelemetryResult) => void;
}

export const CardioTelemetryModal: React.FC<Props> = ({ isOpen, onClose, onPostCardio }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    ok: boolean;
    text: string;
    /** Offer to read the same photo again. */
    retry?: boolean;
  } | null>(null);
  const [telemetry, setTelemetry] = useState<CardioTelemetryResult | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) warmApi();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessImage = async (base64: string) => {
    setSelectedImage(base64);
    setIsAnalyzing(true);
    setStatusMessage(null);
    tactileEngine.triggerSelectionBuzz();
    let readerBusy = false;
    try {
      const res = await analyzeConsoleTelemetry(base64);
      readerBusy = res.readerBusy === true;
      const hasAny =
        res.steps != null ||
        res.distanceKm != null ||
        res.caloriesBurned != null ||
        res.elapsedMinutes != null;
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
      const hasOcr =
        mapped.steps != null ||
        mapped.distanceKm != null ||
        mapped.caloriesBurned != null ||
        mapped.elapsedMinutes != null;
      setTelemetry(hasOcr ? mapped : null);
      setStatusMessage(hasOcr ? foundMessage(mapped) : readerBusy ? READER_BUSY : NO_NUMBERS);
      if (hasOcr) tactileEngine.playPRCelebration();
    } catch {
      setTelemetry(null);
      setStatusMessage(readerBusy ? READER_BUSY : NO_NUMBERS);
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
      const b = prev || {
        deviceType: 'watch',
        elapsedDisplay: null,
        elapsedMinutes: null,
        distanceKm: null,
        caloriesBurned: null,
        speedKmh: null,
        inclinePct: null,
        avgHeartRateBpm: null,
        steps: null,
      };
      const n = Number(val) || null;
      if (id === 'elapsed')
        return {
          ...b,
          elapsedMinutes: typeof val === 'number' ? val : parseFloat(String(val)) || null,
          elapsedDisplay: String(val),
        };
      if (id === 'calories') return { ...b, caloriesBurned: n };
      if (id === 'distance') return { ...b, distanceKm: n };
      if (id === 'speed') return { ...b, speedKmh: n };
      if (id === 'incline') return { ...b, inclinePct: n };
      if (id === 'heartRate') return { ...b, avgHeartRateBpm: n };
      if (id === 'steps')
        return {
          ...b,
          steps:
            typeof val === 'number' ? val : parseInt(String(val).replace(/,/g, ''), 10) || null,
        };
      return b;
    });
  };

  const estimatedSteps =
    telemetry && telemetry.steps == null
      ? estimateStepsFromCardio(telemetry.distanceKm, telemetry.elapsedMinutes)
      : null;

  const handlePost = () => {
    if (!telemetry) return;
    const today = localDayKey(new Date().toISOString());
    const readSteps = telemetry.steps || 0;
    const steps = readSteps || estimatedSteps || 0,
      dist = telemetry.distanceKm || 0,
      dur = telemetry.elapsedMinutes || 0,
      cal = telemetry.caloriesBurned || 0,
      hr = telemetry.avgHeartRateBpm || 0;
    if (steps <= 0 && dist <= 0 && dur <= 0 && cal <= 0 && hr <= 0) {
      // Nothing was read or entered. Never save an empty session as zeros.
      return;
    }
    const activityType = !selectedImage
      ? 'Cardio'
      : telemetry.deviceType === 'watch'
        ? 'Watch'
        : 'Console';
    const history = useTelemetryHistoryStore.getState();
    const day = addCardioSession(history.historyByDate[today]?.cardio, {
      distanceKm: dist,
      durationMinutes: dur,
      burnedKcal: cal,
      avgHeartRateBpm: hr,
      steps,
      activityType,
    });
    history.updateDayRecord(today, 'cardio', day);
    try {
      useLogStore.getState().updateSubModule('cardio', {
        burnedKcal: day.burnedKcal,
        durationMinutes: day.durationMinutes,
        avgHeartRateBpm: day.avgHeartRateBpm,
        distanceKm: day.distanceKm,
      });
      if (cal > 0) useFuelStore.getState().logBurned(cal);
      if (telemetry.deviceType === 'watch' && readSteps > 0)
        telemetryArbitrationService.setDailyCumulative(readSteps);
      else
        telemetryArbitrationService.recordConsoleSession({
          distanceKm: dist,
          durationMinutes: dur,
          steps: steps || undefined,
          burnedKcal: cal,
        });
    } catch {}
    onPostCardio?.(telemetry);
    tactileEngine.playPRCelebration();
    onClose();
  };

  const metrics: MetricItem[] = [
    telemetry?.steps != null
      ? { id: 'steps', label: 'Steps', num: telemetry.steps.toLocaleString(), unit: 'steps' }
      : {
          id: 'steps',
          label: 'Steps',
          num: estimatedSteps != null ? `~${estimatedSteps.toLocaleString()}` : '--',
          unit: estimatedSteps != null ? 'est.' : 'steps',
        },
    {
      id: 'elapsed',
      label: 'Time',
      num: telemetry?.elapsedDisplay || (telemetry?.elapsedMinutes ?? '--'),
      unit: String(telemetry?.elapsedDisplay ?? '').includes(':') ? '' : 'min',
    },
    {
      id: 'calories',
      label: 'Calories',
      num: telemetry?.caloriesBurned != null ? telemetry.caloriesBurned : '--',
      unit: 'kcal',
    },
    {
      id: 'distance',
      label: 'Distance',
      num: telemetry?.distanceKm != null ? telemetry.distanceKm : '--',
      unit: 'km',
    },
    {
      id: 'heartRate',
      label: 'Heart rate',
      num: telemetry?.avgHeartRateBpm != null ? telemetry.avgHeartRateBpm : '--',
      unit: 'bpm',
    },
    {
      id: 'speed',
      label: 'Speed',
      num: telemetry?.speedKmh != null ? telemetry.speedKmh : '--',
      unit: 'km/h',
    },
    {
      id: 'incline',
      label: 'Incline',
      num: telemetry?.inclinePct != null ? telemetry.inclinePct : '--',
      unit: '%',
    },
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

  /** The tiles appear once there is a photo to read, or the person chooses to type. */
  const showMetrics = selectedImage !== null || telemetry !== null || manualEntry;

  const canSave =
    telemetry !== null &&
    !isAnalyzing &&
    ((telemetry.steps || 0) > 0 ||
      (estimatedSteps || 0) > 0 ||
      (telemetry.distanceKm || 0) > 0 ||
      (telemetry.elapsedMinutes || 0) > 0 ||
      (telemetry.caloriesBurned || 0) > 0 ||
      (telemetry.avgHeartRateBpm || 0) > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cardio-scan-title"
      className="fixed inset-0 z-50 bg-o1-canvas select-none flex flex-col animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[420px] mx-auto h-full flex flex-col px-5">
        <header className="shrink-0 pt-[max(env(safe-area-inset-top),16px)] pb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="cardio-scan-title" className="text-2xl font-light tracking-wide text-o1-text">
              Scan
            </h2>
            <p className="mt-0.5 text-o1-caption text-o1-muted">
              Treadmill, bike or watch. The numbers fill in for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-1 shrink-0 rounded-full bg-o1-surface text-o1-text flex items-center justify-center cursor-pointer active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-4">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          {selectedImage ? (
            <>
              <div className="relative rounded-3xl overflow-hidden bg-o1-surface">
                <img
                  src={selectedImage}
                  alt="Your photo of the display"
                  className={`w-full max-h-64 object-contain transition-opacity ${
                    isAnalyzing ? 'opacity-50' : ''
                  }`}
                />
                {isAnalyzing && (
                  <div className="absolute inset-x-0 bottom-3 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-o1-canvas px-4 py-2 text-o1-caption text-o1-text">
                      <Loader2 className="w-4 h-4 animate-spin text-o1-yellow" />
                      Reading numbers. Usually a few seconds.
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCapture('camera')}
                  disabled={isCapturing || isAnalyzing}
                  className="h-11 rounded-2xl bg-o1-surface text-o1-text text-o1-caption flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" strokeWidth={1.75} />
                  {isCapturing ? 'Opening camera…' : 'Retake'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCapture('photos')}
                  disabled={isCapturing || isAnalyzing}
                  className="h-11 rounded-2xl bg-o1-surface text-o1-text text-o1-caption flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition disabled:opacity-50"
                >
                  <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
                  Another photo
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-3xl bg-o1-surface px-6 py-8 text-center">
                <span className="mx-auto w-14 h-14 rounded-full bg-o1-well text-o1-yellow flex items-center justify-center">
                  <ScanLine className="w-6 h-6" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-o1-control font-medium text-o1-text">
                  Point at the screen
                </h3>
                <ul className="mt-3 space-y-1 text-o1-caption text-o1-muted">
                  <li>Fill the frame with the display</li>
                  <li>Hold steady and avoid glare</li>
                  <li>Keep it straight on, not at an angle</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleCapture('camera')}
                disabled={isCapturing}
                className="w-full h-14 rounded-2xl bg-o1-yellow text-black text-o1-body font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition disabled:opacity-60"
              >
                <Camera className="w-5 h-5" strokeWidth={2} />
                {isCapturing ? 'Opening camera…' : 'Take photo'}
              </button>
              <button
                type="button"
                onClick={() => handleCapture('photos')}
                disabled={isCapturing}
                className="w-full h-12 rounded-2xl bg-o1-surface text-o1-text text-o1-body flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition disabled:opacity-60"
              >
                <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
                Choose from Photos
              </button>
              {!showMetrics ? (
                <button
                  type="button"
                  onClick={() => setManualEntry(true)}
                  className="w-full min-h-[44px] text-o1-caption text-o1-muted cursor-pointer"
                >
                  Or type the numbers in yourself
                </button>
              ) : null}
            </>
          )}

          {statusMessage && (
            <div role="status" className="flex items-start gap-2.5 px-1">
              <span
                className={`mt-2 w-2 h-2 rounded-full shrink-0 ${
                  statusMessage.ok ? 'bg-o1-emerald' : 'bg-o1-amber'
                }`}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-o1-body text-o1-text leading-snug">{statusMessage.text}</p>
                {statusMessage.retry && selectedImage && !isAnalyzing ? (
                  <button
                    type="button"
                    onClick={() => handleProcessImage(selectedImage)}
                    className="min-h-[44px] text-o1-body font-medium text-o1-yellow cursor-pointer"
                  >
                    Try this photo again
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {showMetrics ? (
            <CardioMetricsGrid metrics={metrics} onUpdateMetric={handleUpdateMetric} />
          ) : null}
        </div>

        <div className="shrink-0 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
          <button
            type="button"
            onClick={handlePost}
            disabled={!canSave}
            className="w-full h-14 rounded-2xl bg-o1-yellow text-black text-o1-body font-semibold flex items-center justify-center cursor-pointer active:scale-[0.99] transition disabled:opacity-30 disabled:cursor-default"
          >
            Save session
          </button>
        </div>
      </div>
    </div>
  );
};
