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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 p-2 bg-[#18181b] border border-neutral-700 hover:border-neutral-500 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>
        <LoginView onSuccess={onSuccess} onClose={onClose} />
      </div>
    </div>
  );
};
