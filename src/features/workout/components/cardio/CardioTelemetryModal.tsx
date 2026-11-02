import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Image as ImageIcon, Pencil, Loader2 } from 'lucide-react';
import {
  analyzeConsoleTelemetry,
  CardioTelemetryResult,
} from '../../../../services/geminiVisionService';
import { processCardioScanImage } from '../../../log/services/cardioScanService';
import { ScanError, TELEMETRY_UNREADABLE } from '../../../../services/scanErrors';
import { Capacitor } from '@capacitor/core';
import {
  capturePhotoDataUrl,
  isPhotoCancelled,
  PhotoSource,
} from '../../../../services/nativeCameraService';
import { warmApi } from '../../../../services/apiBase';
import {
  defaultScanMerge,
  hasAnyNumber,
  loggedCardioToday,
  saveCardioScan,
  type ScanMerge,
  type ScanToSave,
} from '../../../log/services/cardioScanSave';
import { tactileEngine } from '../../../../services/tactileEngine';
import { CardioMetricsGrid, MetricItem } from './CardioMetricsGrid';

const NO_NUMBERS = {
  ok: false,
  text: `${TELEMETRY_UNREADABLE} Or tap any number to enter it.`,
};

/** The reader's own failure, with a retry offered when another attempt could succeed. */
function failureMessage(err: unknown) {
  const scanErr = err instanceof ScanError ? err : null;
  const reason = err instanceof Error && err.message ? err.message : String(err);
  return {
    ok: false,
    retry: scanErr?.code === 'network' || scanErr?.code === 'server',
    text: `${reason} Tap any number to enter it.`,
  };
}

function readsAnyNumber(r: CardioTelemetryResult): boolean {
  return (
    r.steps != null || r.distanceKm != null || r.caloriesBurned != null || r.elapsedMinutes != null
  );
}

const foundMessage = (
  r: Pick<CardioTelemetryResult, 'steps' | 'distanceKm' | 'elapsedMinutes' | 'deviceType'>,
) => {
  if (r.steps) {
    const where = r.deviceType === 'watch' ? 'watch' : 'screen';
    return { ok: true, text: `Read ${r.steps.toLocaleString()} steps from the ${where}.` };
  }
  return { ok: true, text: 'Numbers found. Steps were not on screen.' };
};

/** "6,157 steps · 188 kcal" for what today's log already holds. */
function loggedSummary(day: {
  steps?: number;
  burnedKcal: number;
  distanceKm: number;
  durationMinutes: number;
}): string {
  return [
    day.steps ? `${day.steps.toLocaleString()} steps` : '',
    day.burnedKcal > 0 ? `${day.burnedKcal} kcal` : '',
    day.distanceKm > 0 ? `${day.distanceKm} km` : '',
    day.durationMinutes > 0 ? `${Math.round(day.durationMinutes)} min` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SECONDARY_BUTTON =
  'h-11 rounded-2xl bg-o1-well text-o1-text text-o1-caption flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition disabled:opacity-50';

export const CardioTelemetryModal: React.FC<Props> = ({ isOpen, onClose }) => {
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
  /** The person's choice for a second scan in a day. Until they choose, the device decides. */
  const [merge, setMerge] = useState<ScanMerge | null>(null);
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
    // When the server reader fails, its error is what the athlete sees if the phone reader finds nothing either.
    let serverError: unknown = null;
    try {
      const res = await analyzeConsoleTelemetry(base64);
      if (readsAnyNumber(res)) {
        setTelemetry(res);
        setStatusMessage(foundMessage(res));
        tactileEngine.playPRCelebration();
        setIsAnalyzing(false);
        return;
      }
    } catch (err) {
      console.error('[Cardio scan] Server photo reader failed', err);
      serverError = err;
    }
    try {
      const ocr = await processCardioScanImage(base64);
      const mapped: CardioTelemetryResult = {
        deviceType: ocr.deviceType,
        elapsedDisplay: ocr.durationMinutes,
        elapsedMinutes: ocr.durationMinutes,
        distanceKm: ocr.distanceKm,
        caloriesBurned: ocr.burnedKcal,
        speedKmh: null,
        inclinePct: null,
        avgHeartRateBpm: ocr.avgHeartRateBpm,
        steps: ocr.steps,
      };
      const hasOcr = readsAnyNumber(mapped);
      setTelemetry(hasOcr ? mapped : null);
      setStatusMessage(
        hasOcr ? foundMessage(mapped) : serverError ? failureMessage(serverError) : NO_NUMBERS,
      );
      if (hasOcr) tactileEngine.playPRCelebration();
    } catch (err) {
      console.error('[Cardio scan] On-device reader failed', err);
      setTelemetry(null);
      setStatusMessage(failureMessage(serverError ?? err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clearing the input lets the same photo be picked twice in a row.
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && handleProcessImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateMetric = (id: string, val: number | string) => {
    setTelemetry((prev) => {
      const b: CardioTelemetryResult = prev || {
        deviceType: null,
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

  const scanToSave = (): ScanToSave | null => {
    if (!telemetry) return null;
    const readSteps = telemetry.steps || 0;
    return {
      device: telemetry.deviceType,
      activityType:
        selectedImage && telemetry.deviceType === 'watch'
          ? 'Watch'
          : selectedImage && telemetry.deviceType === 'console'
            ? 'Console'
            : 'Cardio',
      steps: readSteps,
      readSteps,
      distanceKm: telemetry.distanceKm || 0,
      durationMinutes: telemetry.elapsedMinutes || 0,
      burnedKcal: telemetry.caloriesBurned || 0,
      avgHeartRateBpm: telemetry.avgHeartRateBpm || 0,
    };
  };

  const logged = loggedCardioToday();
  const effectiveMerge: ScanMerge = merge ?? defaultScanMerge(telemetry?.deviceType);
  const replacing = logged !== undefined && effectiveMerge === 'replace';

  const pending = scanToSave();
  const canSave = pending !== null && !isAnalyzing && hasAnyNumber(pending);

  const handlePost = () => {
    // Nothing was read or entered. Never save an empty session as zeros.
    if (!telemetry || !pending || !canSave) return;
    try {
      saveCardioScan(pending, effectiveMerge);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      // The session itself is saved, so clearing the readings stops a second tap logging it twice.
      setTelemetry(null);
      setStatusMessage({
        ok: false,
        text: `Cardio was logged, but today's totals did not update. ${reason}`,
      });
      return;
    }
    tactileEngine.playPRCelebration();
    onClose();
  };

  const metrics: MetricItem[] = [
    {
      id: 'steps',
      label: 'Steps',
      num: telemetry?.steps != null ? telemetry.steps.toLocaleString() : '--',
      unit: 'steps',
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

  /** Camera opens the camera only. Gallery opens the phone's photo library. */
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
        // Backing out of the camera is a choice, not a failure.
        if (isPhotoCancelled(err)) return;
        const message = err instanceof Error ? err.message : 'Could not open the camera.';
        setStatusMessage({ ok: false, text: message });
      });
  };

  /** The tiles appear once there is a photo to read, or the person chooses to type. */
  const showMetrics = selectedImage !== null || telemetry !== null || manualEntry;
  const busy = isCapturing || isAnalyzing;

  // Portalled to the page body: a transformed ancestor would otherwise anchor ixed to the whole page, not the screen.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cardio-scan-title"
      className="fixed inset-0 z-50 flex flex-col bg-black/60 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[420px] mx-auto max-h-[92dvh] overflow-y-auto overscroll-contain rounded-b-3xl bg-o1-surface px-4 pt-[max(env(safe-area-inset-top),16px)] pb-4 space-y-3 animate-in slide-in-from-top-6 duration-200">
        <header className="flex items-center justify-between">
          <h2 id="cardio-scan-title" className="text-xl font-light tracking-wide text-o1-text">
            Scan
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-2 rounded-full text-o1-muted flex items-center justify-center cursor-pointer active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

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
            <div className="relative rounded-2xl overflow-hidden bg-o1-well">
              <img
                src={selectedImage}
                alt="Your photo of the display"
                className={`w-full max-h-40 object-contain transition-opacity ${
                  isAnalyzing ? 'opacity-50' : ''
                }`}
              />
              {isAnalyzing && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-o1-canvas px-3.5 py-1.5 text-o1-caption text-o1-text">
                    <Loader2 className="w-4 h-4 animate-spin text-o1-yellow" />
                    Reading numbers. Usually a few seconds.
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCapture('camera')}
                disabled={busy}
                className={SECONDARY_BUTTON}
              >
                <Camera className="w-4 h-4" strokeWidth={1.75} />
                {isCapturing ? 'Opening camera…' : 'Retake'}
              </button>
              <button
                type="button"
                onClick={() => handleCapture('photos')}
                disabled={busy}
                className={SECONDARY_BUTTON}
              >
                <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
                From gallery
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleCapture('camera')}
              disabled={busy}
              className="w-full h-12 rounded-2xl bg-o1-yellow text-black text-o1-body font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition disabled:opacity-60"
            >
              <Camera className="w-5 h-5" strokeWidth={2} />
              {isCapturing ? 'Opening camera…' : 'Take photo'}
            </button>
            <div className={`grid gap-2 ${showMetrics ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <button
                type="button"
                onClick={() => handleCapture('photos')}
                disabled={busy}
                className={SECONDARY_BUTTON}
              >
                <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
                Choose from gallery
              </button>
              {!showMetrics ? (
                <button
                  type="button"
                  onClick={() => setManualEntry(true)}
                  className={SECONDARY_BUTTON}
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.75} />
                  Enter numbers
                </button>
              ) : null}
            </div>
            {!showMetrics ? (
              <p className="text-center text-o1-caption text-o1-muted">
                Fill the frame with the display. Hold steady, avoid glare.
              </p>
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
          <>
            <CardioMetricsGrid metrics={metrics} onUpdateMetric={handleUpdateMetric} />

            {logged ? (
              <div className="space-y-2">
                <p className="px-1 text-o1-caption text-o1-muted">
                  Already logged today: {loggedSummary(logged)}
                </p>
                <div
                  role="radiogroup"
                  aria-label="How to log this scan"
                  className="grid grid-cols-2 gap-1 rounded-2xl bg-o1-canvas p-1"
                >
                  {(
                    [
                      ['add', 'Add to today'],
                      ['replace', 'Replace today'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={effectiveMerge === value}
                      onClick={() => setMerge(value)}
                      className={`h-10 rounded-xl text-o1-caption cursor-pointer transition ${
                        effectiveMerge === value
                          ? 'bg-o1-well text-o1-text font-medium'
                          : 'text-o1-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePost}
              disabled={!canSave}
              className="w-full h-12 rounded-2xl bg-o1-yellow text-black text-o1-body font-semibold flex items-center justify-center cursor-pointer active:scale-[0.99] transition disabled:opacity-30 disabled:cursor-default"
            >
              {replacing ? 'Replace today’s log' : 'Log session'}
            </button>
          </>
        ) : null}
      </div>

      {/* Tap below the card to close. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="flex-1 min-h-0 w-full cursor-default"
      />
    </div>,
    document.body,
  );
};
