import React from 'react';
import { X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { VaultView } from '../../coach/components/CoachVaultModal';

export interface PhotoVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture?: () => void;
}

/** The athlete's physique photos and training clips, stored in their cloud media_vault. */
export const PhotoVaultModal: React.FC<PhotoVaultModalProps> = ({ isOpen, onClose, onCapture }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-o1-canvas text-o1-text animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Athlete Vault"
    >
      <div className="sticky top-0 z-20 flex min-h-[52px] items-center justify-between border-b border-white/[0.07] bg-o1-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <span className="text-[14px] font-semibold text-o1-text">Athlete Vault</span>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            onClose();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-o1-muted"
          aria-label="Close vault"
        >
          <X size={15} />
        </button>
      </div>
      <div className="mx-auto w-full max-w-xl flex-1 p-3 pb-16">
        <VaultView audience="athlete" onSaved={onCapture} />
      </div>
    </div>
  );
};


