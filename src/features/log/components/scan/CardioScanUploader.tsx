import React, { RefObject } from 'react';
import { Camera, Upload, Loader2, Sparkles, Watch, Gauge } from 'lucide-react';

interface CardioScanUploaderProps {
  scanMode: 'console' | 'watch';
  setScanMode: (mode: 'console' | 'watch') => void;
  imagePreview: string | null;
  isScanning: boolean;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onCameraCapture?: () => void;
}

export const CardioScanUploader: React.FC<CardioScanUploaderProps> = ({
  scanMode,
  setScanMode,
  imagePreview,
  isScanning,
  cameraInputRef,
  fileInputRef,
  onCameraCapture,
}) => {
  return (
    <div className="space-y-3">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-o1-well border border-white/[0.07] text-xs font-mono">
        <button
          type="button"
          onClick={() => setScanMode('console')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold cursor-pointer ${
            scanMode === 'console'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Cardio Console</span>
        </button>

        <button
          type="button"
          onClick={() => setScanMode('watch')}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold cursor-pointer ${
            scanMode === 'watch'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          <Watch className="w-3.5 h-3.5" />
          <span>Smartwatch / Steps</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div className="relative border border-dashed border-white/[0.07] hover:border-sky-500/60 rounded-2xl p-4 transition-all text-center bg-o1-card/50">
        {imagePreview ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black mb-3">
            <img src={imagePreview} alt="OCR Scan Preview" className="w-full h-full object-contain" />
            {isScanning && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 text-sky-500 animate-spin" />
                <span className="text-xs font-tactical font-black tracking-wider uppercase text-white">
                  Extracting Telemetry & Steps...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/[0.07] text-neutral-400 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              Sensor Standby
            </p>
            <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">
              {scanMode === 'watch'
                ? 'Optical sensors standby. Capture watch face or pedometer step count display.'
                : 'Optical sensors standby. Capture treadmill, bike, or rower console output.'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            onClick={() => (onCameraCapture ? onCameraCapture() : cameraInputRef.current?.click())}
            className="py-2.5 px-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-2xl bg-o1-well border border-white/[0.07] hover:bg-white/[0.06] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
};
