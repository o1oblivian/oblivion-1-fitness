import React, { useState } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { copyText } from '../../log/publicShare';
import { shareLink } from '../../reels/services/reelLinks';
import { ShareLinkSheet, ShareLinkTarget } from '../../reels/components/ShareLinkSheet';

interface AddClientModalProps {
  isOpen: boolean;
  /** Registered invite code; null until it is saved to the coach's account. */
  code: string | null;
  failed: boolean;
  onRetry: () => void;
  onClose: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  code,
  failed,
  onRetry,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<ShareLinkTarget | null>(null);
  const invite = code ? `https://oblivion1.club/join?coach=${encodeURIComponent(code)}` : '';

  if (!isOpen) return null;

  const copy = async () => {
    tactileEngine.triggerSelectionBuzz();
    if (!invite || !(await copyText(invite))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!invite) return;
    tactileEngine.triggerSelectionBuzz();
    const target = {
      title: 'Train with me on Oblivion 1',
      text: 'Join my coaching roster on Oblivion 1 Fitness Club',
      url: invite,
    };
    if ((await shareLink(target)) === 'options') setSheet(target);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="o1-sheet-card w-full bg-o1-sheet border border-white/[0.07] p-5 shadow-xl space-y-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-o1-text">Invite a client</h3>
              <p className="text-o1-label text-o1-muted">
                Send this link. They join your roster when they sign up.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-full flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {failed ? (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-xl border border-o1-crimson/30 bg-o1-crimson/10 px-3 py-2"
            >
              <p className="text-o1-caption text-o1-text">Could not create your invite link.</p>
              <button
                type="button"
                onClick={onRetry}
                className="min-h-[36px] px-2 text-o1-caption font-semibold text-o1-text"
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="truncate rounded-xl border border-white/[0.07] bg-o1-surface px-3 py-3 text-o1-caption text-o1-text">
              {invite || 'Preparing your link…'}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!invite}
              onClick={() => void copy()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-o1-surface text-o1-body font-semibold text-o1-text active:scale-[0.98] disabled:opacity-40"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              disabled={!invite}
              onClick={() => void share()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-o1-crimson text-o1-body font-semibold text-white active:scale-[0.98] disabled:opacity-40"
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
