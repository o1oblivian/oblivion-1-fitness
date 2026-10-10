import React, { useState } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { copyText, getOrCreateInviteCode } from '../../log/publicShare';
import { shareLink } from '../../reels/services/reelLinks';
import { ShareLinkSheet, ShareLinkTarget } from '../../reels/components/ShareLinkSheet';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<ShareLinkTarget | null>(null);
  const code = getOrCreateInviteCode(
    (typeof window !== 'undefined' ? localStorage.getItem('o1fc_user_email') : '') || 'coach',
  );
  const invite = `https://oblivion1.club/join?coach=${encodeURIComponent(code)}`;

  if (!isOpen) return null;

  const copy = async () => {
    tactileEngine.triggerSelectionBuzz();
    if (!(await copyText(invite))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    tactileEngine.triggerSelectionBuzz();
    const target = { title: 'Train with me on Oblivion 1', text: 'Join my coaching roster on Oblivion 1 Fitness Club', url: invite };
    if ((await shareLink(target)) === 'options') setSheet(target);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <div
          className="o1-sheet-card w-full bg-o1-sheet border border-white/[0.07] p-5 shadow-xl space-y-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-o1-text">Invite a client</h3>
              <p className="text-[11px] text-o1-muted">Send this link. They join your roster when they sign up.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="truncate rounded-xl border border-white/[0.07] bg-o1-sheet px-3 py-3 text-[12px] text-o1-text">{invite}</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void copy()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-o1-sheet text-[13px] font-semibold text-o1-text active:scale-[0.98]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-o1-crimson text-[13px] font-semibold text-o1-text active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
      <ShareLinkSheet link={sheet} onClose={() => setSheet(null)} />
    </>
  );
};
