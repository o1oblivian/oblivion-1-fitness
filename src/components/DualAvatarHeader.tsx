import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, Copy, Share2, X, Send, ChevronRight, Check, MessageCircle } from 'lucide-react';
import { getActivePair, getPendingPair, createTandemPair, joinTandemPair, TandemPair, getPartnerProfile } from '@/utils/tandemStore';
import { supabase } from '@/utils/supabase';

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
};

interface DualAvatarHeaderProps {
  profileImage?: string;
  userName: string;
  handle: string;
  currentUserEmail: string;
  onTapSelf: () => void;
  onTapPartner: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DualAvatarHeader: React.FC<DualAvatarHeaderProps> = ({
  profileImage,
  userName,
  handle,
  currentUserEmail,
  onTapSelf,
  onTapPartner,
  showToast,
}) => {
  const [pair, setPair] = useState<TandemPair | null>(null);
  const [pendingPair, setPendingPair] = useState<TandemPair | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerImage, setPartnerImage] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [showInviteSheet, setShowInviteSheet] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [handleCopied, setHandleCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadPairState();
  }, []);

  const loadPairState = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id || '';

    const active = await getActivePair();
    if (active) {
      setPair(active);
      const partnerId = active.user_a === uid ? active.user_b : active.user_a;
      if (partnerId) {
        const profile = await getPartnerProfile(partnerId);
        if (profile) {
          setPartnerName(profile.name?.split('@')[0] || 'Partner');
          setPartnerImage(profile.profile_image || '');
        }
      }
    } else {
      const pending = await getPendingPair();
      if (pending) {
        setPendingPair(pending);
        setInviteCode(pending.invite_code);
      }
    }
    setLoaded(true);
  };

  const handleCreateInvite = async () => {
    setCreating(true);
    const { pair: newPair, error } = await createTandemPair();
    if (newPair) {
      setPendingPair(newPair);
      setInviteCode(newPair.invite_code);
    } else {
      showToast(error || 'Failed to create invite', 'error');
    }
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const { pair: joined, error } = await joinTandemPair(joinCode.trim().toUpperCase());
    if (joined) {
      setPair(joined);
      setPendingPair(null);
      setShowInviteSheet(false);
      showToast('Paired successfully!', 'success');
      loadPairState();
    } else {
      showToast(error || 'Invalid code', 'error');
    }
  };

  const getShareText = useCallback(() => {
    return inviteCode
      ? `Train with me on O1FC! Use my invite code: ${inviteCode}`
      : `Join me on O1FC! Find me by handle: ${handle}`;
  }, [inviteCode, handle]);

  const getShareUrl = useCallback(() => {
    return inviteCode
      ? `${window.location.origin}?ref=${inviteCode}`
      : window.location.origin;
  }, [inviteCode]);

  const handleCopyHandle = async () => {
    const ok = await copyToClipboard(handle || '@you');
    if (ok) {
      setHandleCopied(true);
      showToast('Handle copied!', 'success');
      setTimeout(() => setHandleCopied(false), 2000);
    } else {
      showToast('Failed to copy', 'error');
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    const ok = await copyToClipboard(inviteCode);
    if (ok) {
      setCodeCopied(true);
      showToast('Invite code copied!', 'success');
      setTimeout(() => setCodeCopied(false), 2000);
    } else {
      showToast('Failed to copy', 'error');
    }
  };

  const shareInvite = async () => {
    const text = getShareText();
    const url = getShareUrl();
    const shareData = { title: 'Join me on O1FC', text, url };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
    }

    const ok = await copyToClipboard(`${text}\n${url}`);
    if (ok) {
      showToast('Invite link copied to clipboard!', 'success');
    } else {
      showToast('Unable to share — try copying manually', 'error');
    }
  };

  const openWhatsApp = () => {
    const text = getShareText();
    const url = getShareUrl();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const openSMS = () => {
    const text = getShareText();
    const url = getShareUrl();
    window.open(`sms:?&body=${encodeURIComponent(text + ' ' + url)}`, '_self');
  };

  const openTelegram = () => {
    const text = getShareText();
    const url = getShareUrl();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!loaded) return null;

  const initials = userName ? userName.slice(0, 2).toUpperCase() : 'ME';
  const partnerInitials = partnerName ? partnerName.slice(0, 2).toUpperCase() : '?';

  return (
    <>
      <div className="flex items-center justify-between px-1 py-1.5">
        {/* Left circle — YOU */}
        <button
          onClick={onTapSelf}
          className="group flex items-center gap-2.5 cursor-pointer"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-full border-2 border-[#C4121A]/80 dark:border-[#D91F28]/80 overflow-hidden bg-stone-900 dark:bg-neutral-900 flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
              {profileImage ? (
                <img src={profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white tracking-wider">{initials}</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C4121A] dark:bg-[#D91F28] border-2 border-white dark:border-[#0A0A0C]" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">{userName || 'Athlete'}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">{handle || '@pathik23'}</p>
          </div>
        </button>

        {/* Right circle — PARTNER or INVITE */}
        {pair ? (
          <button
            onClick={onTapPartner}
            className="group flex items-center gap-2.5 cursor-pointer"
          >
            <div className="text-right">
              <p className="text-[13px] font-bold text-zinc-900 dark:text-white leading-tight">{partnerName}</p>
              <p className="text-[10px] text-[#4285F4] dark:text-[#34A853] font-medium">Online</p>
            </div>
            <div className="relative">
              <div className="w-11 h-11 rounded-full border-2 border-[#4285F4] overflow-hidden bg-stone-900 dark:bg-neutral-900 flex items-center justify-center shadow-sm group-active:scale-95 transition-transform ring-2 ring-[#4285F4]/20">
                {partnerImage ? (
                  <img src={partnerImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#34A853]">{partnerInitials}</span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4285F4] border-2 border-white dark:border-[#0A0A0C]" />
            </div>
          </button>
        ) : (
          <button
            onClick={() => setShowInviteSheet(true)}
            className="group flex items-center gap-2.5 cursor-pointer"
          >
            <div className="text-right">
              <p className="text-[12px] font-bold text-zinc-800 dark:text-white leading-tight">
                {pendingPair ? 'Waiting...' : 'Add'}
              </p>
              <p className="text-[8px] font-mono tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">INVITE</p>
            </div>
            <div className="relative">
              <div className="w-11 h-11 rounded-full border border-dashed border-zinc-300 dark:border-white/20 bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:border-stone-400 dark:group-hover:border-white/40 group-active:scale-95 transition-all">
                <UserPlus className="w-4 h-4 text-zinc-500 dark:text-zinc-300 group-hover:text-zinc-700 dark:group-hover:text-white" />
              </div>
              {pendingPair && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-[#0A0A0C]" />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Invite Sheet */}
      {showInviteSheet && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150"
          onClick={() => setShowInviteSheet(false)}
        >
          <div
            className="w-full max-w-[360px] max-h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,1.5rem)+5rem)] sm:pb-8 overscroll-contain bg-white dark:bg-[#1A1A1E] border border-zinc-200 dark:border-white/[0.06] rounded-t-2xl sm:rounded-2xl shadow-2xl transition-transform duration-200 ease-out translate-y-0 text-zinc-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/[0.04]">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white/90">Invite a Friend</h3>
              <button
                onClick={() => setShowInviteSheet(false)}
                className="btn-nude-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Share button */}
              <button
                onClick={shareInvite}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 dark:bg-white/[0.08] border border-zinc-900 dark:border-white/[0.06] text-white font-semibold text-[13px] hover:bg-zinc-800 dark:hover:bg-white/[0.12] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Invite Link
              </button>

              {/* Social share grid — compact, even */}
              <div className="grid grid-cols-6 gap-1.5">
                <button onClick={openWhatsApp} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-transparent hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span className="text-[8px] font-medium text-zinc-600 dark:text-white/40">WhatsApp</span>
                </button>
                <button onClick={openTelegram} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-transparent hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="#26A5E4" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  <span className="text-[8px] font-medium text-zinc-600 dark:text-white/40">Telegram</span>
                </button>
                <button onClick={openSMS} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-transparent hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer">
                  <MessageCircle className="w-4 h-4 text-[#34C759]" />
                  <span className="text-[8px] font-medium text-zinc-600 dark:text-white/40">iMessage</span>
                </button>
                <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText() + ' ' + getShareUrl())}`, '_blank')} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-transparent hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer">
                  <svg className="w-4 h-4 fill-zinc-900 dark:fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span className="text-[8px] font-medium text-zinc-600 dark:text-white/40">X</span>
                </button>
                <button onClick={() => { copyToClipboard(getShareText() + ' ' + getShareUrl()); showToast('Copied! Paste into Instagram DM', 'success'); }} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-transparent hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="url(#ig-grad)" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFDC80"/><stop offset="50%" stopColor="#F56040"/><stop offset="100%" stopColor="#833AB4"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  <span className="text-[8px] font-medium text-zinc-600 dark:text-white/40">Insta</span>
                </button>
                <button onClick={() => { copyToClipboard(getShareText() + ' ' + getShareUrl()); showToast('Link copied! Open Snapchat to share', 'success'); }} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-transparent hover:bg-zinc-200/80 dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer">
                  <svg className="w-4 h-4" fill="#FFFC00" viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.12-.042.195-.063.27-.063a.56.56 0 01.344.12c.18.15.243.39.185.585-.045.15-.15.270-.24.337a2.555 2.555 0 01-1.166.454c-.09.015-.18.025-.255.037-.165.024-.315.044-.405.105-.104.073-.18.24-.18.39 0 .045.008.09.015.135.09.42.444.975.944 1.517.195.211.42.42.66.623.78.66 1.695 1.2 1.965 1.8.09.195.135.42.135.6v.015c-.015.585-.51 1.065-1.095 1.215-.18.047-.36.075-.54.09-.165.015-.33.015-.51.015-.12 0-.225.01-.345.024-.255.03-.54.12-.855.24-.48.18-1.065.39-2.01.39-.06 0-.12 0-.195-.01h-.045c-.93 0-1.5-.195-1.98-.39-.314-.12-.584-.21-.839-.24a3.62 3.62 0 00-.36-.024h-.03c-.18 0-.36 0-.54-.015-.18-.015-.36-.044-.54-.09-.585-.15-1.08-.63-1.095-1.215v-.015a1.47 1.47 0 01.135-.6c.27-.6 1.185-1.14 1.965-1.8.24-.195.465-.405.66-.623.5-.537.854-1.095.944-1.517.008-.045.015-.09.015-.135 0-.15-.075-.315-.18-.39-.09-.06-.24-.08-.405-.105a2.87 2.87 0 01-.255-.037 2.555 2.555 0 01-1.166-.454.552.552 0 01-.24-.337.564.564 0 01.186-.585.56.56 0 01.344-.12c.075 0 .15.021.27.063.263.094.622.198.922.214.198 0 .326-.045.401-.09a8.882 8.882 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.65 1.07 11.007.793 11.996.793h.21z"/></svg>
                  <span className="text-[8px] font-medium text-zinc-600 dark:text-white/40">Snap</span>
                </button>
              </div>

              {/* Handle + Code compact row */}
              <div className="space-y-2">
                {/* Handle */}
                <button
                  onClick={handleCopyHandle}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.07] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex-1 text-left">
                    <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-white/30 font-semibold">Your Handle</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white/90 mt-0.5">{handle || '@you'}</p>
                  </div>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${handleCopied ? 'bg-red-500/20' : 'bg-zinc-200/80 dark:bg-white/[0.06]'}`}>
                    {handleCopied ? <Check className="w-3.5 h-3.5 text-red-500 dark:text-red-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-white/40" />}
                  </div>
                </button>

                {/* Invite code */}
                {inviteCode ? (
                  <button
                    onClick={handleCopyCode}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.07] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex-1 text-left">
                      <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-white/30 font-semibold">Invite Code</p>
                      <p className="text-base font-mono font-bold tracking-[0.2em] text-zinc-900 dark:text-white/90 mt-0.5">{inviteCode}</p>
                    </div>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${codeCopied ? 'bg-red-500/20' : 'bg-zinc-200/80 dark:bg-white/[0.06]'}`}>
                      {codeCopied ? <Check className="w-3.5 h-3.5 text-red-500 dark:text-red-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-white/40" />}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={handleCreateInvite}
                    disabled={creating}
                    className="w-full py-2.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.04] text-zinc-800 dark:text-white/70 font-semibold text-[13px] hover:bg-zinc-200 dark:hover:bg-white/[0.1] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {creating ? 'Generating...' : 'Generate Invite Code'}
                  </button>
                )}
              </div>

              {/* Join a friend */}
              <div>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 dark:text-white/30 font-semibold mb-1.5">Join a Friend</p>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="@handle or ABC123"
                    maxLength={20}
                    className="flex-1 text-[13px] font-mono tracking-wider bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] rounded-lg px-3 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 outline-none focus:border-zinc-400 dark:focus:border-white/20 transition-colors"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={joinCode.length < 3}
                    className="px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-white/[0.08] border border-zinc-900 dark:border-white/[0.06] text-white dark:text-white/70 font-semibold text-sm hover:bg-zinc-800 dark:hover:bg-white/[0.12] active:scale-95 transition-all cursor-pointer disabled:opacity-30"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
