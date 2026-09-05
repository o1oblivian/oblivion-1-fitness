import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Instagram, MessageCircle, Link2, Copy, Check, Sparkles, Award, TrendingUp } from 'lucide-react';

interface ShareableGoalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  initialTitle?: string;
  initialSubtitle?: string;
  stats?: { label: string; value: string }[];
  athleteName?: string;
}

export const ShareableGoalCardModal: React.FC<ShareableGoalCardModalProps> = ({
  isOpen,
  onClose,
  showToast,
  initialTitle = 'Bench Press PR Smashed',
  initialSubtitle = '120 kg × 5 reps • RPE 9.0 • Personal Record',
  stats = [
    { label: 'Total Volume', value: '14,250 kg' },
    { label: 'Workout Time', value: '52 min' },
    { label: 'Sets Completed', value: '18 Sets' },
    { label: 'Intensity', value: 'Zone 4 Peak' },
  ],
  athleteName = 'PRO ATHLETE',
}) => {
  const [cardTitle, setCardTitle] = useState(initialTitle);
  const [cardSubtitle, setCardSubtitle] = useState(initialSubtitle);
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story');
  const [cardTheme, setCardTheme] = useState<'iron' | 'crimson' | 'dark' | 'gold'>('iron');
  const [linkCopied, setLinkCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleNativeShare = async () => {
    const shareData = {
      title: `O1FC: ${cardTitle}`,
      text: `${cardTitle} - ${cardSubtitle}\nLogged with O1FC! #O1FCFitLab`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); showToast?.('Shared successfully!', 'success'); } catch (err) {
        if ((err as Error).name !== 'AbortError') copyToClipboard();
      }
    } else { copyToClipboard(); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`O1FC MILESTONE\n${cardTitle}\n${cardSubtitle}\n\nTracked with O1FC App #O1FCFitLab`);
    setLinkCopied(true); showToast?.('Summary copied to clipboard!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const shareText = `${cardTitle} - ${cardSubtitle}\nLogged with O1FC! #O1FCFitLab`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTwitter = () => {
    const shareText = `${cardTitle} - ${cardSubtitle} #O1FCFitLab`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const getThemeBg = () => {
    switch (cardTheme) {
      case 'iron': return 'from-slate-900 via-red-950/80 to-slate-900 border-red-500/30';
      case 'crimson': return 'from-slate-900 via-red-950/80 to-slate-900 border-red-500/30';
      case 'gold': return 'from-slate-900 via-amber-950/80 to-slate-900 border-amber-500/30';
      default: return 'from-[#121414] via-[#1A1D24] to-[#121414] border-white/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[220] bg-black/50 dark:bg-black/80 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#121414] border border-neutral-200 dark:border-white/10 p-4 sm:p-5 w-full max-w-md my-auto rounded-3xl shadow-2xl relative text-zinc-900 dark:text-white space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-[#34A853]/20 border border-red-500/20 dark:border-[#34A853]/40 text-red-600 dark:text-[#34A853] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Social Goal Card Generator</h3>
              <p className="text-[10px] text-zinc-500 dark:text-gray-400 font-mono">Create shareable milestone graphics</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-nude-close" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Customizer Inputs */}
        <div className="space-y-2 text-xs font-mono">
          <div>
            <label className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase">Milestone / Goal Headline</label>
            <input type="text" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-[#1A1D24] border border-neutral-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-white outline-none focus:border-red-500 mt-1 text-xs"
              placeholder="Headline..." />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase">Key Metric / Subtitle</label>
            <input type="text" value={cardSubtitle} onChange={(e) => setCardSubtitle(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-[#1A1D24] border border-neutral-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-white outline-none focus:border-red-500 mt-1 text-xs"
              placeholder="Subtitle..." />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase">Color Theme</label>
              <div className="flex items-center gap-2 mt-1">
                {(['iron', 'crimson', 'gold', 'dark'] as const).map((t) => (
                  <button key={t} onClick={() => setCardTheme(t)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      t === 'iron' ? 'bg-red-700' : t === 'crimson' ? 'bg-red-500' : t === 'gold' ? 'bg-amber-500' : 'bg-gray-700'
                    } ${cardTheme === t ? 'border-zinc-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-60'}`} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 dark:text-gray-400 font-bold uppercase">Format</label>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-[#1A1D24] p-1 rounded-xl border border-neutral-200 dark:border-white/10 mt-1">
                {(['story', 'square'] as const).map((fmt) => (
                  <button key={fmt} onClick={() => setAspectRatio(fmt)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg uppercase transition-all ${
                      aspectRatio === fmt ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs' : 'text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white'}`}>{fmt}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE CARD PREVIEW — 9:16 OLED Frame */}
        <div ref={cardRef}
          className={`relative rounded-2xl p-3.5 border bg-gradient-to-b ${getThemeBg()} shadow-2xl transition-all overflow-hidden ${
            aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-square'} flex flex-col justify-between`}>
          {/* Top Brand Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="font-mono text-[11px] font-black tracking-wider text-red-300 uppercase">O1FC</span>
            </div>
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded-full border border-white/10">VERIFIED LOG</span>
          </div>

          {/* Main Content */}
          <div className="space-y-2 relative z-10 my-auto py-2">
            <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">
              <Award className="w-3 h-3" /><span>MILESTONE SMASHED</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">{cardTitle}</h2>
            <p className="text-xs text-gray-300 font-mono leading-relaxed">{cardSubtitle}</p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 mt-3 font-mono">
              {stats.map((s, idx) => (
                <div key={idx} className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-[9px] text-gray-400 block uppercase font-bold">{s.label}</span>
                  <span className="text-xs text-white font-extrabold mt-0.5 block">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Watermark */}
          <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/10 font-mono text-[10px] text-gray-400">
            <span className="font-bold text-gray-300">ATHLETE: {athleteName}</span>
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="text-center mt-1">
            <span className="text-[7px] text-white/25 tracking-widest font-mono">OBLIVION FITNESS CLUB · Verified Telemetry</span>
          </div>

          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Multi-Platform Social Action Bar */}
        <div className="flex items-center justify-center gap-2.5 mt-3">
          <button onClick={handleNativeShare}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)' }}>
            <Instagram className="w-4 h-4" /><span>Stories</span>
          </button>
          <button onClick={handleWhatsApp}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
            style={{ background: '#25D366' }}>
            <MessageCircle className="w-4 h-4" /><span>WhatsApp</span>
          </button>
          <button onClick={handleTwitter}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
            style={{ background: '#000000' }}>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>Post</span>
          </button>
          <button onClick={copyToClipboard}
            className="flex-1 py-3 rounded-2xl bg-white/10 border border-white/15 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all">
            {linkCopied ? <Check className="w-4 h-4 text-red-400" /> : <Link2 className="w-4 h-4" />}
            <span>{linkCopied ? 'Copied' : 'Link'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
