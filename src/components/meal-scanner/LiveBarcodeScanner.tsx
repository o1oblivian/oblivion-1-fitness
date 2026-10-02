import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { tryDetectNativeBarcode } from '../../services/barcodeLookupService';

interface LiveBarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const LiveBarcodeScanner: React.FC<LiveBarcodeScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    let scanInterval: any = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        scanInterval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          const code = await tryDetectNativeBarcode(videoRef.current);
          if (code) {
            clearInterval(scanInterval);
            onDetected(code);
          }
        }, 350);
      } catch (err: any) {
        setError('Camera permission denied or unavailable. Use manual lookup or photo upload.');
      }
    }

    startCamera();

    return () => {
      active = false;
      if (scanInterval) clearInterval(scanInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onDetected]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-neutral-700">
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
      {/* Viewfinder Target Reticle */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
        <div className="w-48 h-28 border-2 border-emerald-400/80 rounded-xl relative">
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-[11px] font-mono font-bold text-white bg-black/70 px-2.5 py-1 rounded-full mt-2">
          Align UPC/EAN Barcode in Frame
        </span>
      </div>
      {error && (
        <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center text-red-300 text-xs gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
          <button type="button" onClick={onClose} className="px-3 py-1 bg-white/10 rounded-lg text-white text-xs mt-1">
            Back to Manual Entry
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
export default LiveBarcodeScanner;
