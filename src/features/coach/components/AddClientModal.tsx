import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { Athlete } from '../services/coachService';
import { tactileEngine } from '../../../services/tactileEngine';
import { getOrCreateInviteCode } from '../../log/publicShare';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: Athlete) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const code = getOrCreateInviteCode(
    (typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_email') : '') || 'coach',
  );
  const invite = `https://oblivion1.club/join?coach=${encodeURIComponent(code)}`;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="o1-sheet-card w-full bg-o1-card border border-white/[0.07] p-5 shadow-xl space-y-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Share invite</h3>
            <p className="text-[11px] text-[#8A887F]">Copy the invite and send it.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            if (navigator?.clipboard) void navigator.clipboard.writeText(invite);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-[#161616] px-3 text-left"
        >
          <span className="truncate text-[12px] text-white">{invite}</span>
          <span className="text-[12px] font-semibold text-white">{copied ? 'Copied' : 'Copy Link'}</span>
          {copied ? <Check className="h-4 w-4 shrink-0 text-white" /> : <Copy className="h-4 w-4 shrink-0 text-neutral-300" />}
        </button>
      </div>
    </div>
  );
};
