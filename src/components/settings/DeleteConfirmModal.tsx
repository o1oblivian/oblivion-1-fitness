import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none animate-in fade-in duration-150">
      <div className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-4 shadow-xl space-y-3 text-center overflow-y-auto">
        <div className="w-10 h-10 rounded-full bg-o1-well border border-white/[0.07] text-o1-crimson flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-sans font-semibold text-white">
            Permanently delete account?
          </h3>
          <p className="text-xs font-sans text-neutral-400 leading-relaxed">
            This will wipe all workout logs, nutrition history, vault media, and personal data. This cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="py-2.5 rounded-xl border border-white/[0.07] bg-o1-well hover:bg-white/[0.06] text-neutral-300 hover:text-white text-xs font-sans font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover disabled:opacity-50 text-white text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
