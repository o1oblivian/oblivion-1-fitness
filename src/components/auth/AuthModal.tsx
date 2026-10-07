import React from 'react';
import { X } from 'lucide-react';
import { LoginView } from './LoginView';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-200">
      <div className="o1-sheet-card relative w-full overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-2 bg-o1-well border border-white/[0.07] hover:border-white/[0.14] rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>
        <LoginView onSuccess={onSuccess} onClose={onClose} />
      </div>
    </div>
  );
};
