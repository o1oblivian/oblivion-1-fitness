import React from 'react';
import { MoreHorizontal, X } from 'lucide-react';

interface ReelPlayerTopBarProps {
  onClose: () => void;
  onOpenOptions: () => void;
}

const BUTTON = 'flex h-11 w-11 items-center justify-center text-white/85 hover:text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]';

export const ReelPlayerTopBar: React.FC<ReelPlayerTopBarProps> = ({ onClose, onOpenOptions }) => (
  <div className="absolute top-0 inset-x-0 z-30 pt-safe px-2 flex items-center justify-end select-none pointer-events-auto">
    <div className="flex items-center gap-1 pt-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenOptions();
        }}
        className={BUTTON}
        aria-label="Reel options: report or block"
      >
        <MoreHorizontal className="w-5 h-5 stroke-[1.4]" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={BUTTON}
        aria-label="Close player"
      >
        <X className="w-5 h-5 stroke-[1.4]" />
      </button>
    </div>
  </div>
);
