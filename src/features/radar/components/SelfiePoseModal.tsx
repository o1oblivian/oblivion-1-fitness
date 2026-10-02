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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-[#09090b] border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">ATHLETE BIOMETRIC AUDIT</h3>
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
              <h4 className="text-sm font-tactical font-black uppercase text-white tracking-wider">ATHLETE IDENTITY VERIFIED</h4>
              <p className="text-xs text-neutral-300 font-mono">Biometric match &amp; live challenge confirmed.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition"
            >
              DONE • RETURN TO RADAR
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
