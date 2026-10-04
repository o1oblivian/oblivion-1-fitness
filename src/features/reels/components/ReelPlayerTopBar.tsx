import React from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';

interface ReelPlayerTopBarProps {
  isMuted: boolean;
  onClose: () => void;
  onToggleMute: (e: React.MouseEvent) => void;
}

export const ReelPlayerTopBar: React.FC<ReelPlayerTopBarProps> = ({
  isMuted,
  onClose,
  onToggleMute,
}) => {
  return (
    <div className="absolute top-0 inset-x-0 z-30 pt-4 pb-2 px-4 flex items-center justify-end select-none pointer-events-auto">
      {/* Right-aligned thinner, translucent controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          aria-label="Sound Toggle"
        >
          {isMuted ? (
            <VolumeX className="w-4.5 h-4.5 stroke-[1.2]" />
          ) : (
            <Volume2 className="w-4.5 h-4.5 stroke-[1.2]" />
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-white/70 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          aria-label="Close Player"
        >
          <X className="w-4.5 h-4.5 stroke-[1.2]" />
        </button>
      </div>
    </div>
  );
};
