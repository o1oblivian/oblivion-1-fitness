import React, { useState } from 'react';
import { X, Share2, Copy, Check, Send } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userHandle?: string;
  isLive?: boolean;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  userHandle = '@o1oblivianfitness',
  isLive = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [friendHandle, setFriendHandle] = useState('');
  const [joinedToast, setJoinedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const appShareUrl = window.location.origin;
  const inviteText = isLive
    ? `🔥 I'm training LIVE right now on Oblivion 1 Fitness Club! Tune in and train with me: ${userHandle} - ${appShareUrl}`
    : `Join me on Oblivion 1 Fitness Club! My handle is ${userHandle}. Let's crush workouts together: ${appShareUrl}`;

  const handleShareLink = async () => {
    tactileEngine.triggerSelectionBuzz();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Oblivion 1 Fitness Club Invite',
          text: inviteText,
          url: appShareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyHandle = async () => {
    tactileEngine.triggerSelectionBuzz();
    await navigator.clipboard.writeText(userHandle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = () => {
    tactileEngine.triggerSelectionBuzz();
    const randomCode = `O1-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    setInviteCode(randomCode);
  };

  const handleSocialClick = (platform: string) => {
    tactileEngine.triggerSelectionBuzz();
    const encoded = encodeURIComponent(inviteText);
    const encodedUrl = encodeURIComponent(appShareUrl);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encoded}`, '_blank');
        break;
      case 'messages':
        window.open(`sms:?&body=${encoded}`, '_blank');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(inviteText);
        setJoinedToast('Invite text copied! Open Instagram to share.');
        setTimeout(() => setJoinedToast(null), 3000);
        break;
      case 'snapchat':
        window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`, '_blank');
        break;
      default:
        break;
    }
  };

  const handleJoinFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendHandle.trim()) return;
    tactileEngine.triggerSelectionBuzz();
    setJoinedToast(`Connected to ${friendHandle.trim()}! Workout sync established.`);
    setFriendHandle('');
    setTimeout(() => setJoinedToast(null), 3500);
  };

  return (
    <div
      id="invite-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl relative space-y-4 border border-neutral-200 dark:border-neutral-800 transition-all max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white">
              Invite a Friend
            </h3>
            {isLive && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Live Broadcast
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Share Button */}
        <button
          type="button"
          onClick={handleShareLink}
          className="w-full py-3 px-4 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 stroke-[2.2]" />
          <span>{copied ? 'Link Copied to Clipboard!' : 'Share Invite Link'}</span>
        </button>

        {/* Real Social Logos Row */}
        <div className="grid grid-cols-6 gap-2 pt-1 pb-1">
          {/* WhatsApp: Official Green #25D366 with authentic phone handset in bubble */}
          <button
            type="button"
            onClick={() => handleSocialClick('whatsapp')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            title="Share via WhatsApp"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform shadow-md shadow-[#25D366]/20">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 tracking-tight">WhatsApp</span>
          </button>

          {/* Telegram: Official Blue #229ED9 with authentic paper airplane */}
          <button
            type="button"
            onClick={() => handleSocialClick('telegram')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            title="Share via Telegram"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#229ED9] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform shadow-md shadow-[#229ED9]/20">
              <svg className="w-5 h-5 fill-white -ml-0.5" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0Zm5.562 8.161c-.18.895-.97 4.544-1.373 6.326-.17.753-.45.98-.718 1.005-.584.054-1.028-.386-1.593-.756-.884-.579-1.383-.94-2.24-1.505-.99-.652-.348-1.01.216-1.596.147-.154 2.711-2.486 2.761-2.698a.2.2 0 0 0-.05-.181c-.06-.051-.147-.034-.21-.02-.09.02-1.492.948-4.22 2.791-.4.275-.762.411-1.085.404-.357-.008-1.043-.203-1.554-.369-.627-.204-1.125-.313-1.082-.66.023-.182.274-.368.753-.56 2.948-1.284 4.915-2.131 5.9-2.542 2.81-1.171 3.395-1.375 3.776-1.381.084-.001.272.02.394.119.103.083.131.196.145.276-.002.062.008.243-.004.385Z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 tracking-tight">Telegram</span>
          </button>

          {/* Messages: Official Messages Green #34C759 with speech bubble */}
          <button
            type="button"
            onClick={() => handleSocialClick('messages')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            title="Share via Messages"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#34C759] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform shadow-md shadow-[#34C759]/20">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 5.918 2 10.75c0 2.82 1.533 5.334 3.922 6.908l-.83 3.632c-.084.368.28.675.619.522l4.316-1.954c.642.128 1.306.196 1.973.196 5.523 0 10-3.918 10-8.75S17.523 2 12 2Z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 tracking-tight">Messages</span>
          </button>

          {/* X: Official Pure Black with authentic geometric X vector */}
          <button
            type="button"
            onClick={() => handleSocialClick('x')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            title="Share on X"
          >
            <div className="w-11 h-11 rounded-2xl bg-black border border-neutral-700/80 flex items-center justify-center text-white group-hover:scale-105 active:scale-95 transition-transform shadow-md shadow-black/40">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 tracking-tight">X</span>
          </button>

          {/* Instagram: Official Signature Gradient with authentic camera glyph */}
          <button
            type="button"
            onClick={() => handleSocialClick('instagram')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            title="Share on Instagram"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white group-hover:scale-105 active:scale-95 transition-transform shadow-md shadow-rose-500/20"
              style={{
                background:
                  'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
              }}
            >
              <svg
                className="w-5 h-5 fill-none stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 tracking-tight">Instagram</span>
          </button>

          {/* Snapchat: Official Snapchat Yellow #FFFC00 with authentic ghost */}
          <button
            type="button"
            onClick={() => handleSocialClick('snapchat')}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
            title="Share on Snapchat"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFFC00] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform shadow-md shadow-[#FFFC00]/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12.003 3.5c-2.99 0-4.99 1.94-4.99 4.88 0 .8.18 1.63.4 2.22-.4.21-.84.58-.84 1.11 0 .58.53.97 1.11.97.15 0 .31-.03.46-.1.2 1.09.82 1.99 1.61 2.53-.75.35-1.7.8-1.7 1.75 0 1 1.16 1.4 2.1 1.4.5 0 1.04-.12 1.43-.31.3.34.76.53 1.3.53.55 0 .99-.19 1.3-.53.39.19.93.31 1.43.31.94 0 2.1-.4 2.1-1.4 0-.95-.95-1.4-1.7-1.75.79-.54 1.41-1.44 1.61-2.53.15.07.31.1.46.1.58 0 1.11-.39 1.11-.97 0-.53-.44-.9-.84-1.11.22-.59.4-1.42.4-2.22 0-2.94-2-4.88-4.99-4.88Z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-300 tracking-tight">Snapchat</span>
          </button>
        </div>

        {/* YOUR HANDLE Card */}
        <div className="bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              YOUR HANDLE
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-neutral-900 dark:text-white">
              {userHandle}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyHandle}
            className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Copy Handle"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Generate Invite Code */}
        {inviteCode ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4121A] dark:text-red-400">
              One-Time Passcode Generated
            </span>
            <div className="font-mono font-black text-lg text-neutral-900 dark:text-white tracking-widest">
              {inviteCode}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerateCode}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Generate Invite Code
          </button>
        )}

        {/* JOIN A FRIEND */}
        <form onSubmit={handleJoinFriend} className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
            JOIN A FRIEND
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={friendHandle}
              onChange={(e) => setFriendHandle(e.target.value)}
              placeholder="@handle or ABC123"
              className="flex-1 bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#C4121A] font-medium"
            />
            <button
              type="submit"
              disabled={!friendHandle.trim()}
              className="w-10 h-10 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] disabled:opacity-40 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
              aria-label="Send Invite"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </form>

        {/* Temporary Feedback Notification */}
        {joinedToast && (
          <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-950/60 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 text-xs font-medium text-center animate-in fade-in">
            {joinedToast}
          </div>
        )}
      </div>
    </div>
  );
};
