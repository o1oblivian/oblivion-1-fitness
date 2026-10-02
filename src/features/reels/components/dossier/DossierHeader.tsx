import React from 'react';
import { Share2, X } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';

interface DossierHeaderProps {
  onClose: () => void;
  onShare: () => void;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({ onClose, onShare }) => {
  return (
    <div className="absolute top-0 inset-x-0 z-30 pt-safe px-3 flex items-center justify-between pointer-events-none">
      <div className="h-12 flex items-center justify-between w-full pointer-events-auto">
        {/* Nude Close Icon - No background bubble, no frame, no fog */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerLightTick();
            onClose();
          }}
          className="p-2 text-white/90 hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] transition cursor-pointer active:scale-90"
          aria-label="Close Profile"
        >
          <X className="w-5 h-5 stroke-[1.75]" />
        </button>

        {/* Nude Share Icon - No background bubble, no frame, no fog */}
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerLightTick();
            onShare();
          }}
          className="p-2 text-white/90 hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] transition cursor-pointer active:scale-90"
          aria-label="Share Profile"
        >
          <Share2 className="w-4.5 h-4.5 stroke-[1.75]" />
        </button>
      </div>
    </div>
  );
};
