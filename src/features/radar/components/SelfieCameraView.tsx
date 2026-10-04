import React, { useRef, useEffect } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { PoseChallenge } from '../services/poseVerificationService';

interface SelfieCameraViewProps {
  challenge: PoseChallenge;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamActive: boolean;
  capturedImage: string | null;
  onCapture: () => void;
  onRetake: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isVerifying: boolean;
}

export const SelfieCameraView: React.FC<SelfieCameraViewProps> = ({
  challenge,
  videoRef,
  streamActive,
  capturedImage,
  onCapture,
  onRetake,
  fileInputRef,
  onFileUpload,
  isVerifying,
}) => {
  return (
    <div className="space-y-3 select-none">
      {/* Tactical Challenge Pose Banner */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 text-cyan-200 space-y-1 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>RANDOMIZED POSE CHALLENGE</span>
        </div>
        <p className="text-sm font-bold text-white leading-snug">"{challenge.prompt}"</p>
        <p className="text-[11px] text-cyan-200/80 leading-relaxed font-sans">{challenge.instruction}</p>
      </div>

      {/* Live Viewport or Captured Snapshot */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-inner flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured pose" className="w-full h-full object-cover -scale-x-100" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
        )}

        {isVerifying && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center space-y-2.5 p-4 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300">
              GEMINI BIOMETRIC AUDIT IN PROGRESS...
            </p>
            <p className="text-[10px] text-neutral-400 font-sans">Matching facial landmarks &amp; pose alignment</p>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFileUpload} />

      <div className="flex items-center gap-2">
        {!capturedImage ? (
          <button
            type="button"
            onClick={onCapture}
            disabled={isVerifying}
            className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>CAPTURE POSE SELFIE</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onRetake}
            disabled={isVerifying}
            className="flex-1 py-2.5 rounded-xl bg-[#18181b] hover:bg-[#222226] text-neutral-300 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
          >
            Retake Photo
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isVerifying}
          className="px-3.5 py-3 rounded-xl bg-[#18181b] text-neutral-300 text-xs font-mono font-bold hover:text-white transition cursor-pointer"
          title="Upload selfie fallback"
        >
          Upload
        </button>
      </div>
    </div>
  );
};

export default SelfieCameraView;
