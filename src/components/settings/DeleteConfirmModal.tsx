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
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#121214] border border-red-950/60 rounded-2xl p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-900/60 text-red-400 flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-mono font-bold uppercase text-white tracking-wide">
            Permanently delete account?
          </h3>
          <p className="text-xs font-mono text-neutral-400 leading-relaxed">
            This will wipe all workout logs, nutrition history, vault media, and personal data. This cannot be undone.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="py-2.5 rounded-xl border border-neutral-800 bg-[#18181b] hover:bg-[#222228] text-neutral-300 hover:text-white text-xs font-mono font-bold uppercase transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="py-2.5 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] disabled:opacity-50 text-white text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
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
