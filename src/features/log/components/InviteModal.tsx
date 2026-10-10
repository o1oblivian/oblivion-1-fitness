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
    mark(result === 'shared' ? 'Share sheet opened.' : result === 'copied' ? 'Invite link copied.' : 'Share was cancelled.');
  };

  const handleCopy = async () => {
    tactileEngine.triggerSelectionBuzz();
    const ok = await copyText(link);
    mark(ok ? 'Invite link copied.' : 'Could not copy on this preview. The link is shown above.');
  };

  const handleJoin = (event: React.FormEvent) => {
    event.preventDefault();
    const next = friendCode.trim();
    if (!next) return;
    tactileEngine.triggerSelectionBuzz();
    savePendingInvite(next);
    mark('Invite saved on this device. It links both accounts once you are signed in.');
  };

  const social = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(shareText)}`, color: '#25D366' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Train with me on Oblivion 1.')}`, color: '#229ED9' },
    { name: 'Messages', href: `sms:?body=${encodeURIComponent(shareText)}`, color: '#34C759' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, color: '#111111' },
  ];

  return (
    <div
      id="invite-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="o1-sheet-card bg-o1-card text-neutral-100 w-full p-4 shadow-xl relative space-y-3 border border-white/[0.07] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">Invite</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.08] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-o1-well border border-white/[0.07] p-3 space-y-1">
          <span className="text-[10px] text-neutral-500 block">{userHandle}</span>
          <div className="text-sm font-semibold text-white break-all">{link}</div>
          <div className="text-[12px] font-semibold tracking-wide text-neutral-200">{code}</div>
          <p className="text-[11px] text-neutral-400">
            {isLive ? 'This invite is live on your account.' : 'Sign in so this invite links to your account.'}
          </p>
        </div>

        <button type="button" onClick={() => void handleShare()} className="w-full min-h-[44px] rounded-xl bg-o1-crimson text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
          <Share2 className="w-4 h-4" />
          Share invite
        </button>

        <div className="grid grid-cols-4 gap-2">
          {social.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target={item.name === 'Messages' ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={() => tactileEngine.triggerSelectionBuzz()}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-[11px] font-semibold text-white" style={{ background: item.color }}>
                {item.name.slice(0, 1)}
              </span>
              <span className="text-[10px] text-neutral-400">{item.name}</span>
            </a>
          ))}
        </div>

        <button type="button" onClick={() => void handleCopy()} className="w-full min-h-[40px] rounded-xl bg-o1-well border border-white/[0.07] text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy link
        </button>

        <form onSubmit={handleJoin} className="space-y-1.5">
          <label className="text-[11px] text-neutral-400 block">Save a friend’s invite</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="Their code"
              className="flex-1 bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none"
            />
            <button type="submit" className="w-10 h-10 rounded-xl bg-o1-crimson text-white flex items-center justify-center cursor-pointer" aria-label="Save invite">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {status && <p className="text-[11px] text-neutral-400 text-center">{status}</p>}
      </div>
    </div>
  );
};
