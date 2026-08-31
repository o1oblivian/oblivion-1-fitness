import React, { useState } from 'react';
import { X, Share2, Download, Instagram, MessageCircle, Twitter, Check, Sparkles, Trophy, Camera } from 'lucide-react';
import { shareToInstagram, shareToX, shareToWhatsApp } from '@/utils/sharing';
import { loadSocialProfiles } from '@/utils/socialProfilesStore';

interface ShareProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  benchPr?: string;
  streak?: string;
  volume?: string;
  photoUrl?: string;
}

export const ShareProgressModal: React.FC<ShareProgressModalProps> = ({
  isOpen,
  onClose,
  userName = '',
  benchPr = '105.0kg',
  streak = '07 Days',
  volume = '134.8 MT',
  photoUrl = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=80',
}) => {
  const [includePhoto, setIncludePhoto] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const shareText = `New PR Confirmed: ${benchPr} Bench Press! Perfect ${streak} streak with ${volume} volume. Verified by Coach on O1 Oblivion Fitness Club.`;

  const handleShareToPlatform = async (platform: string) => {
    const profiles = loadSocialProfiles();
    const igHandle = profiles.instagram ? `@${profiles.instagram.replace(/^@/, '')}` : '';
    const xHandle = profiles.x ? `@${profiles.x.replace(/^@/, '')}` : '';
    const hashtags = ['O1FCFitLab', 'NewPR', 'FitnessJourney'];
    const textWithHandle = `${userName}${igHandle ? ` (${igHandle})` : ''} — ${shareText}`;

    if (platform === 'instagram') {
      await shareToInstagram({ text: textWithHandle, title: `${userName} // PR & Progress`, hashtags }, (msg) => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
    } else if (platform === 'whatsapp') {
      await shareToWhatsApp({ text: `${userName} — ${shareText}`, hashtags });
    } else if (platform === 'twitter') {
      await shareToX({ text: `${userName}${xHandle ? ` (${xHandle})` : ''} — ${shareText}`, hashtags });
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1080;
      canvas.height = 1920;
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, '#0B0E14');
        grad.addColorStop(0.5, '#121620');
        grad.addColorStop(1, '#05070A');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.fillStyle = '#4A7C9B';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('PROGRESS & PRS', 80, 120);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText(userName.toUpperCase(), 80, 220);

        ctx.fillStyle = '#5B8C5A';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText(`NEW PR: ${benchPr} Bench Press`, 80, 340);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '32px monospace';
        ctx.fillText(`Streak: ${streak}`, 80, 440);
        ctx.fillText(`Total Volume: ${volume}`, 80, 500);

        ctx.fillStyle = '#6B7280';
        ctx.font = '28px monospace';
        ctx.fillText('OBLIVION FITNESS CLUB // VERIFIED TELEMETRY', 80, 1800);

        const link = document.createElement('a');
        link.download = `progress-card-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch {
      // fallback
    }
    setDownloading(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#14171F] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-3xl p-3.5 sm:p-4 shadow-2xl text-gray-900 dark:text-white space-y-3.5 my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-gray-900 dark:text-white">
                Share Progress & PRs
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">Export story-ready milestone</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-nude-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 9:16 Preview Card */}
        <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#181D29] via-[#0B0E14] to-[#05070A] border border-white/20 p-4 flex flex-col justify-between overflow-hidden shadow-2xl space-y-3">

          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono tracking-widest text-cyan-400 font-bold block uppercase">
                PROGRESS & PRS
              </span>
              <h4 className="text-sm font-black text-white">{userName}</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[9px] font-mono font-bold border border-red-500/30">
              VERIFIED
            </span>
          </div>

          {/* New PR Badge */}
          <div className="py-2 px-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-center">
            <span className="text-xs font-mono font-black text-cyan-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>NEW PR: +10.0kg Gain</span>
            </span>
          </div>

          {/* Optional Transformation Image */}
          {includePhoto && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10 shadow-md">
              <img src={photoUrl} alt="Check-in" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono font-bold text-cyan-300">
                LATEST CHECK-IN // 78.2 KG
              </span>
            </div>
          )}

          {/* 1RM Progression Tracker */}
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
            <span className="text-[9px] font-mono text-gray-400 uppercase">1RM Trajectory</span>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <div className="text-gray-400">75kg <span className="text-[8px] block text-gray-500">Start</span></div>
              <div className="text-red-400">+20kg</div>
              <div className="text-gray-400">95kg <span className="text-[8px] block text-gray-500">Mid</span></div>
              <div className="text-cyan-400">+10kg</div>
              <div className="text-cyan-300 font-black">{benchPr} <span className="text-[8px] block text-cyan-400">Now</span></div>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[8px] text-gray-400 block font-mono">BENCH</span>
              <span className="text-[11px] font-black font-mono text-cyan-300">{benchPr}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[8px] text-gray-400 block font-mono">STREAK</span>
              <span className="text-[11px] font-black font-mono text-amber-400">{streak}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-[8px] text-gray-400 block font-mono">VOLUME</span>
              <span className="text-[11px] font-black font-mono text-red-400">{volume}</span>
            </div>
          </div>

          <div className="text-center pt-1 border-t border-white/10 text-[8px] font-mono text-gray-400 tracking-wider">
            OBLIVION FITNESS CLUB // VERIFIED TELEMETRY
          </div>
        </div>

        {/* Photo Toggle */}
        <button
          onClick={() => setIncludePhoto(!includePhoto)}
          className="w-full py-2 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-mono text-gray-600 dark:text-gray-300 cursor-pointer transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Include Transformation Photo</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${includePhoto ? 'bg-cyan-400' : 'bg-gray-600'}`} />
        </button>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleShareToPlatform('instagram')}
            className="py-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-500 to-pink-600 hover:opacity-90 text-white font-mono font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <Instagram className="w-4 h-4" />
            <span className="text-[10px]">Instagram</span>
          </button>

          <button
            onClick={() => handleShareToPlatform('whatsapp')}
            className="py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[10px]">WhatsApp</span>
          </button>

          <button
            onClick={() => handleShareToPlatform('twitter')}
            className="py-3 rounded-2xl bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-mono font-black text-xs flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all cursor-pointer border border-gray-200 dark:border-white/10"
          >
            <Twitter className="w-4 h-4" />
            <span className="text-[10px]">X (Twitter)</span>
          </button>
        </div>

        {/* Download Action */}
        <button
          onClick={handleDownload}
          className="w-full py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          {downloading ? (
            <span>Generating Image...</span>
          ) : copied ? (
            <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Summary & Link Copied!</span>
          ) : (
            <span className="flex items-center gap-1"><Download className="w-4 h-4" /> Save High-Res Card (PNG)</span>
          )}
        </button>

      </div>
    </div>
  );
};
