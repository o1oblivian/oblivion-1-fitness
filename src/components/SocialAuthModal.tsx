import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, Lock, ExternalLink, Trash2, ArrowRightLeft, User } from 'lucide-react';
import { LiquidSilkBackground } from '@/components/ui/LiquidSilkBackground';

export interface SocialAuthModalProps {
  isOpen: boolean;
  platform: 'Instagram' | 'TikTok' | 'Strava' | 'YouTube' | 'X' | 'Spotify' | 'Twitch' | string;
  onClose: () => void;
  onConfirmLink: (platform: string, handle?: string) => void;
  onUnlinkPlatform?: (platform: string) => void;
  onSwapPlatform?: (oldPlatform: string, newPlatform: string) => void;
  isLinked: boolean;
  currentHandle?: string;
}

// Minimalist Vector Logos
export const InstagramLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export const TikTokLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.56-1.36 1.5-1.41 2.49-.09 1.12.33 2.26 1.13 3.01.8.76 1.95 1.09 3.03.88 1.06-.18 2.02-.91 2.45-1.89.28-.6.38-1.28.38-1.95V.02z"/>
  </svg>
);

export const StravaLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065l5.154 10.172 5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L8.379 0 3.227 12.345h4.172z"/>
  </svg>
);

export const YouTubeLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export const XLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const SpotifyLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.376 0 0 5.377 0 12s5.376 12 12 12 12-5.377 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.38-1.32 9.84-.66 13.56 1.62.36.24.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/>
  </svg>
);

export const TwitchLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143h-1.715zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
);

export const getDirectPlatformUrl = (platform: string, handle?: string): string => {
  const cleanHandle = handle ? handle.replace(/^@/, '') : '';
  switch (platform) {
    case 'Instagram':
      return cleanHandle ? `https://www.instagram.com/${cleanHandle}` : 'https://www.instagram.com';
    case 'TikTok':
      return cleanHandle ? `https://www.tiktok.com/@${cleanHandle}` : 'https://www.tiktok.com';
    case 'Strava':
      return cleanHandle ? `https://www.strava.com/athletes/${cleanHandle}` : 'https://www.strava.com';
    case 'YouTube':
      return cleanHandle ? `https://www.youtube.com/@${cleanHandle}` : 'https://www.youtube.com';
    case 'Spotify':
      return cleanHandle ? `https://open.spotify.com/user/${cleanHandle}` : 'https://open.spotify.com';
    case 'Twitch':
      return cleanHandle ? `https://www.twitch.tv/${cleanHandle}` : 'https://www.twitch.tv';
    case 'X':
    case 'Twitter':
      return cleanHandle ? `https://x.com/${cleanHandle}` : 'https://x.com';
    default:
      return cleanHandle ? `https://x.com/${cleanHandle}` : 'https://x.com';
  }
};

const AVAILABLE_PLATFORMS = [
  { id: 'Instagram', name: 'Instagram', icon: InstagramLogo, color: 'hover:text-pink-400' },
  { id: 'TikTok', name: 'TikTok', icon: TikTokLogo, color: 'hover:text-cyan-400' },
  { id: 'Strava', name: 'Strava', icon: StravaLogo, color: 'hover:text-orange-400' },
  { id: 'YouTube', name: 'YouTube', icon: YouTubeLogo, color: 'hover:text-red-400' },
  { id: 'X', name: 'X / Twitter', icon: XLogo, color: 'hover:text-slate-200' },
  { id: 'Spotify', name: 'Spotify', icon: SpotifyLogo, color: 'hover:text-red-400' },
  { id: 'Twitch', name: 'Twitch', icon: TwitchLogo, color: 'hover:text-purple-400' },
];

export const SocialAuthModal: React.FC<SocialAuthModalProps> = ({
  isOpen,
  platform,
  onClose,
  onConfirmLink,
  onUnlinkPlatform,
  onSwapPlatform,
  isLinked,
  currentHandle = '',
}) => {
  const [activePlatform, setActivePlatform] = useState<string>(platform || 'Instagram');
  const [handleInput, setHandleInput] = useState<string>(currentHandle);
  const [isLinking, setIsLinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);

  useEffect(() => {
    setActivePlatform(platform || 'Instagram');
    setHandleInput(currentHandle || '');
    setShowSwapDrawer(false);
  }, [platform, currentHandle, isOpen]);

  if (!isOpen) return null;

  const getPlatformDetails = (plat: string) => {
    switch (plat) {
      case 'Instagram':
        return {
          name: 'Instagram',
          color: 'text-pink-500',
          bgColor: 'bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20',
          borderColor: 'border-pink-500/40',
          btnBg: 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500',
          icon: <InstagramLogo className="w-5 h-5 text-pink-400" />,
          placeholder: '@username'
        };
      case 'TikTok':
        return {
          name: 'TikTok',
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-500/15',
          borderColor: 'border-cyan-500/40',
          btnBg: 'bg-gradient-to-r from-cyan-600 to-black hover:from-cyan-500 text-white',
          icon: <TikTokLogo className="w-5 h-5 text-cyan-400" />,
          placeholder: '@username'
        };
      case 'Strava':
        return {
          name: 'Strava',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/15',
          borderColor: 'border-orange-500/40',
          btnBg: 'bg-orange-600 hover:bg-orange-500 text-white',
          icon: <StravaLogo className="w-5 h-5 text-orange-500" />,
          placeholder: '@athlete_id'
        };
      case 'YouTube':
        return {
          name: 'YouTube',
          color: 'text-red-500',
          bgColor: 'bg-red-500/15',
          borderColor: 'border-red-500/40',
          btnBg: 'bg-red-600 hover:bg-red-500 text-white',
          icon: <YouTubeLogo className="w-5 h-5 text-red-500" />,
          placeholder: '@channel'
        };
      case 'Spotify':
        return {
          name: 'Spotify',
          color: 'text-red-400',
          bgColor: 'bg-red-500/15',
          borderColor: 'border-red-500/40',
          btnBg: 'bg-red-600 hover:bg-red-500 text-white',
          icon: <SpotifyLogo className="w-5 h-5 text-red-400" />,
          placeholder: '@user_id'
        };
      case 'Twitch':
        return {
          name: 'Twitch',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/15',
          borderColor: 'border-purple-500/40',
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white',
          icon: <TwitchLogo className="w-5 h-5 text-purple-400" />,
          placeholder: '@channel'
        };
      case 'X':
      case 'Twitter':
      default:
        return {
          name: plat === 'Twitter' ? 'Twitter' : 'X (Twitter)',
          color: 'text-slate-200',
          bgColor: 'bg-slate-500/15',
          borderColor: 'border-slate-500/40',
          btnBg: 'bg-slate-700 hover:bg-slate-600 text-white',
          icon: <XLogo className="w-5 h-5 text-slate-200" />,
          placeholder: '@handle'
        };
    }
  };

  const details = getPlatformDetails(activePlatform);
  const directUrl = getDirectPlatformUrl(activePlatform, handleInput);

  const handleOpenDirect = () => {
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLinkClick = () => {
    setIsLinking(true);
    window.open(directUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      setIsLinking(false);
      onConfirmLink(activePlatform, handleInput);
      onClose();
    }, 600);
  };

  const handleUnlinkClick = () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      if (onUnlinkPlatform) {
        onUnlinkPlatform(activePlatform);
      }
      onClose();
    }, 400);
  };

  const handleSelectSwap = (newPlatId: string) => {
    if (newPlatId === activePlatform) {
      setShowSwapDrawer(false);
      return;
    }
    if (onSwapPlatform) {
      onSwapPlatform(activePlatform, newPlatId);
    }
    setActivePlatform(newPlatId);
    setShowSwapDrawer(false);
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-transparent backdrop-blur-xl overflow-y-auto font-mono flex items-center justify-center p-3 sm:p-5 relative"
    >
      {/* Light Liquid Silk Ambient Dynamic Simulation - Removed for 100% transparent background */}

      <div
        className="bg-black/50 text-white border border-white/15 p-5 sm:p-6 w-full max-w-lg rounded-3xl space-y-4 shadow-[0_25px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl relative z-10 select-none animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${details.bgColor} ${details.borderColor} shrink-0`}>
              {details.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-[#EA4335] uppercase tracking-wider block">
                  OAUTH 2.0 INTEGRATION
                </span>
                {isLinked && (
                  <span className="text-[8.5px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> VERIFIED
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {isLinked ? `Manage ${details.name} Account` : `Authorize & Connect ${details.name}?`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors font-bold text-xs cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Handle Customization / Edit Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[#EA4335]" />
              {details.name} Handle / Username
            </span>
            <span className="text-[9px] text-gray-500">Optional</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder={details.placeholder}
              className="w-full bg-white/5 border border-white/15 focus:border-[#EA4335] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all font-mono"
            />
          </div>
        </div>

        {/* Subtitle Body Prompt */}
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-gray-300 leading-relaxed font-sans space-y-2">
          <p>
            Seek connection authority to link your account, sync training content, and verify your performance credentials within the ecosystem.
          </p>
          <button
            type="button"
            onClick={handleOpenDirect}
            className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-mono font-bold text-cyan-300 hover:text-cyan-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open {details.name} Page Directly ({directUrl.replace('https://', '')})</span>
          </button>
        </div>

        {/* SWAP PLATFORM SECTION */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#EA4335]" />
              Swap or Change Platform
            </span>
            <button
              type="button"
              onClick={() => setShowSwapDrawer(!showSwapDrawer)}
              className="text-[10px] text-cyan-400 hover:underline font-bold"
            >
              {showSwapDrawer ? 'Close Selector' : 'Change Platform...'}
            </button>
          </div>

          {showSwapDrawer && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 bg-black/40 border border-white/10 rounded-xl animate-fadeIn">
              {AVAILABLE_PLATFORMS.map((plat) => {
                const PlatIcon = plat.icon;
                const isCurrent = plat.id === activePlatform;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => handleSelectSwap(plat.id)}
                    className={`p-2 rounded-lg border text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isCurrent
                        ? 'bg-[#EA4335]/20 border-[#EA4335] text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <PlatIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate text-[11px]">{plat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Security & Sync Details */}
        <div className="space-y-1.5 text-[10px]">
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Read-Only Media & Fitness Data Handshake</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Encrypted Token Verification • Zero Password Storage</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            {/* Delete / Unlink Button */}
            {isLinked && (
              <button
                type="button"
                onClick={handleUnlinkClick}
                disabled={isDeleting}
                className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                title="Remove / Unlink this platform"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Unlink</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLinkClick}
              disabled={isLinking}
              className={`flex-[1.5] py-2 ${details.btnBg} font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50`}
            >
              {isLinking ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Linking...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Link
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

