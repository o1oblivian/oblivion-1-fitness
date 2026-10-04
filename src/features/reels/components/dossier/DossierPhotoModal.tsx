import React from 'react';
import { X } from 'lucide-react';

interface DossierPhotoModalProps {
  photo: string | null;
  onClose: () => void;
}

export const DossierPhotoModal: React.FC<DossierPhotoModalProps> = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="relative max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition cursor-pointer"
          aria-label="Close Preview"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>
        <img
          src={photo}
          alt="Physique Preview"
          className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );
};
