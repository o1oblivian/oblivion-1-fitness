import React from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { useSelfieCapture } from '../hooks/useSelfieCapture';
import { SelfieCameraView } from './SelfieCameraView';

interface SelfiePoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export const SelfiePoseModal: React.FC<SelfiePoseModalProps> = ({ isOpen, onClose, onVerified }) => {
  const {
    challenge,
    capturedImage,
    isVerifying,
    isSuccess,
    errorMessage,
    videoRef,
    fileInputRef,
    hasStream,
    capturePhoto,
    uploadPhoto,
    resetCapture,
  } = useSelfieCapture(isOpen, onVerified);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] p-4 shadow-xl space-y-4 text-white overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-white">Athlete Biometric Audit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 px-3 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-tactical font-black text-white tracking-wider">Athlete Identity Verified</h4>
              <p className="text-xs text-neutral-300 font-mono">Biometric match &amp; live challenge confirmed.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider cursor-pointer shadow-lg active:scale-95 transition"
            >
              Done • return to radar
            </button>
          </div>
        ) : (
          <>
            <SelfieCameraView
              challenge={challenge}
              videoRef={videoRef}
              streamActive={hasStream}
              capturedImage={capturedImage}
              onCapture={capturePhoto}
              onRetake={resetCapture}
              fileInputRef={fileInputRef}
              onFileUpload={uploadPhoto}
              isVerifying={isVerifying}
            />
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono">
                {errorMessage}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SelfiePoseModal;
