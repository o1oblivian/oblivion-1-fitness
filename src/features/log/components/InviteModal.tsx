import React, { useMemo, useState } from 'react';
import { X, Share2, Copy, Check, Send } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import {
  copyText,
  getOrCreateInviteCode,
  inviteUrl,
  readPendingInvite,
  savePendingInvite,
  shareContent,
} from '../publicShare';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userHandle?: string;
  isLive?: boolean;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  userHandle = '',
  isLive = false,
}) => {
  const code = useMemo(() => getOrCreateInviteCode(userHandle), [userHandle]);
  const link = inviteUrl(code);
  const shareText = `Train with me on Oblivion 1. ${link}`;
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [friendCode, setFriendCode] = useState(readPendingInvite());
  const [joining, setJoining] = useState(false);

  if (!isOpen) return null;

  const mark = (message: string) => {
    setStatus(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    tactileEngine.triggerSelectionBuzz();
    const result = await shareContent({
      title: 'Oblivion 1',
      text: 'Train with me on Oblivion 1.',
      url: link,
    });
    if (result === 'cancelled') return;
    mark(
      result === 'shared'
        ? 'Invite shared.'
        : result === 'copied'
          ? 'Invite link copied.'
          : 'Could not share. Copy the link instead.',
    );
  };

  const handleCopy = async () => {
    tactileEngine.triggerSelectionBuzz();
    const ok = await copyText(link);
    mark(ok ? 'Invite link copied.' : 'Could not copy on this preview. The link is shown above.');
  };

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = friendCode.trim();
    if (!next || joining) return;
    tactileEngine.triggerSelectionBuzz();
    savePendingInvite(next);
    if (!isLive) {
      mark('Code saved on this device. Sign in and it is used straight away.');
      return;
    }
    setJoining(true);
    try {
      const { acceptCoachInviteOutcome } = await import('../../coach/services/coachBridge');
      const outcome = await acceptCoachInviteOutcome();
      mark(
        outcome.rosterFull
          ? 'That coach has no open spot on their roster right now.'
          : outcome.coach
            ? `You joined ${outcome.coach.name}'s roster.`
            : 'That code was not found. Check it with the person who sent it.',
      );
    } catch {
      mark('Could not reach the server. The code is saved and will be tried again.');
    } finally {
      setJoining(false);
    }
  };

  const social = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      color: '#25D366',
    },
    {
      name: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Train with me on Oblivion 1.')}`,
      color: '#229ED9',
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      color: '#111111',
    },
  ];

  return (
    <div
      id="invite-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="o1-sheet-card bg-o1-card text-neutral-100 w-full p-4 shadow-xl relative space-y-3 border border-white/[0.07] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Invite</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-o1-well border border-white/[0.07] p-3 space-y-1">
          <span className="text-o1-label text-neutral-500 block">{userHandle}</span>
          <div className="text-o1-caption font-semibold tracking-wide text-neutral-200">{code}</div>
          <p className="text-o1-label text-neutral-400">
            Anyone who opens this link lands on Oblivion 1 Fitness Club.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="min-h-[44px] rounded-xl bg-o1-crimson text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share invite
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="min-h-[44px] rounded-xl bg-o1-well border border-white/[0.07] text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy link
          </button>
        </div>
        {status && <p className="text-o1-label text-neutral-300 text-center">{status}</p>}

        <div className="grid grid-cols-3 gap-2">
          {social.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => tactileEngine.triggerSelectionBuzz()}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-o1-label font-semibold text-white"
                style={{ background: item.color }}
              >
                {item.name.slice(0, 1)}
              </span>
              <span className="text-o1-label text-neutral-400">{item.name}</span>
            </a>
          ))}
        </div>

        <form onSubmit={(e) => void handleJoin(e)} className="space-y-1.5">
          <label className="text-o1-label text-neutral-400 block">
            Have a coach’s invite code?
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="Invite code"
              className="flex-1 bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={joining}
              className="w-10 h-10 rounded-xl bg-o1-crimson text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
              aria-label="Use invite code"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
