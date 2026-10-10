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
    <div className="absolute top-0 inset-x-0 z-30 pt-safe px-2 flex items-center justify-end select-none pointer-events-auto">
      <div className="flex items-center gap-1 pt-2">
        <button
          type="button"
          onClick={onToggleMute}
          className="flex h-11 w-11 items-center justify-center text-white/85 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          aria-pressed={!isMuted}
        >
          {isMuted ? <VolumeX className="w-5 h-5 stroke-[1.4]" /> : <Volume2 className="w-5 h-5 stroke-[1.4]" />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex h-11 w-11 items-center justify-center text-white/85 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          aria-label="Close player"
        >
          <X className="w-5 h-5 stroke-[1.4]" />
        </button>
      </div>
    </div>
  );
};
