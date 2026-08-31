import React, { useRef, useCallback, useState } from 'react';
import { X, Instagram, MessageCircle, Link2, Flame, TrendingUp, Trophy, Check, BarChart3 } from 'lucide-react';
import { shareToInstagram, shareToX, shareToWhatsApp } from '@/utils/sharing';
import { loadSocialProfiles } from '@/utils/socialProfilesStore';

interface ShareVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteName: string;
  benchPress1RM: number;
  benchPressGain: number;
  streak: number;
  totalVolume: number;
  showToast: (msg: string) => void;
}

export const ShareVictoryModal: React.FC<ShareVictoryModalProps> = ({
  isOpen, onClose, athleteName, benchPress1RM, benchPressGain, streak, totalVolume, showToast
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const W = 1080, H = 1920;
    canvas.width = W; canvas.height = H;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0A0B0F'); grad.addColorStop(0.5, '#12141B'); grad.addColorStop(1, '#0A0B0F');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
    accentGrad.addColorStop(0, '#C8A97E'); accentGrad.addColorStop(1, '#8B9DAF');
    ctx.fillStyle = accentGrad; ctx.fillRect(0, 0, W, 8);

    ctx.fillStyle = 'rgba(200, 169, 126, 0.06)';
    ctx.beginPath(); ctx.arc(W / 2, H * 0.3, 350, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 32px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PROGRESS & PRs', W / 2, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.fillText(athleteName, W / 2, 280);

    ctx.fillStyle = '#C8A97E';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('BENCH PRESS 1RM', W / 2, 420);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 90px system-ui, sans-serif';
    ctx.fillText(`${benchPress1RM.toFixed(1)}kg`, W / 2, 520);

    ctx.fillStyle = '#3B7A57';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`+${benchPressGain.toFixed(1)}kg gain`, W / 2, 580);

    const cardW = 280, cardH = 160, gap = 30;
    const startX = (W - cardW * 3 - gap * 2) / 2, startY = 700;
    const statCards = [
      { label: 'STREAK', value: `${String(streak).padStart(2, '0')} Days`, color: '#C9A227' },
      { label: 'TOTAL VOLUME', value: `${totalVolume.toFixed(1)} MT`, color: '#C8A97E' },
      { label: 'STATUS', value: 'ACTIVE', color: '#3B7A57' },
    ];
    statCards.forEach((s, i) => {
      const x = startX + i * (cardW + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      roundRect(ctx, x, startY, cardW, cardH, 16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 20px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(s.label, x + cardW / 2, startY + 55);
      ctx.fillStyle = s.color; ctx.font = 'bold 38px system-ui, sans-serif';
      ctx.fillText(s.value, x + cardW / 2, startY + 115);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '500 24px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('OBLIVION FITNESS CLUB · Verified Telemetry', W / 2, H - 80);

    return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob), 'image/png'); });
  }, [athleteName, benchPress1RM, benchPressGain, streak, totalVolume]);

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  const handleInstagram = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], `victory_${athleteName.replace(/\s/g, '_')}.png`, { type: 'image/png' });
    const profiles = loadSocialProfiles();
    const igHandle = profiles.instagram ? `@${profiles.instagram.replace(/^@/, '')}` : '';
    await shareToInstagram({
      text: `${athleteName}${igHandle ? ` (${igHandle})` : ''} — ${benchPress1RM}kg Bench Press 1RM! +${benchPressGain}kg gain`,
      title: 'My Progress & PRs',
      imageFile: file,
      hashtags: ['O1FCFitLab', 'NewPR', 'GymLife'],
    }, showToast);
  };

  const handleWhatsApp = async () => {
    const blob = await generateImage();
    const file = blob ? new File([blob], `victory_${athleteName}.png`, { type: 'image/png' }) : undefined;
    await shareToWhatsApp({
      text: `${athleteName} just hit ${benchPress1RM}kg Bench Press 1RM! +${benchPressGain}kg gain`,
      imageFile: file,
      hashtags: ['O1FCFitLab'],
    }, showToast);
  };

  const handleTwitter = async () => {
    const profiles = loadSocialProfiles();
    const xHandle = profiles.x ? `@${profiles.x.replace(/^@/, '')}` : '';
    await shareToX({
      text: `${athleteName}${xHandle ? ` (${xHandle})` : ''} — ${benchPress1RM}kg Bench Press 1RM! +${benchPressGain}kg gain`,
      hashtags: ['O1FCFitLab', 'NewPR'],
    }, showToast);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true); showToast?.('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => showToast?.('Could not copy link'));
  };

  if (!isOpen) return null;

  const streakStr = String(streak).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-sm my-auto bg-white dark:bg-[#14171F] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-3.5 sm:p-4 space-y-3.5" onClick={(e) => e.stopPropagation()}>
        {/* 9:16 OLED Card Frame */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30 mb-4" style={{ aspectRatio: '9/16' }}>
          <canvas ref={canvasRef} className="w-full h-full" />
          {/* Close icon */}
          <button onClick={onClose} className="absolute top-3 right-3 z-30 btn-nude-close !text-white hover:!text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          {/* Live HTML preview */}
          <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0A0B0F] via-[#12141B] to-[#0A0B0F] p-3.5">
            <div className="w-full h-1 bg-gradient-to-r from-[#C8A97E] to-[#8B9DAF] rounded-full -mt-6 -mx-6 mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between mt-1">
              <div>
                <div className="text-[9px] font-bold text-cyan-400/60 tracking-widest uppercase">Progress & PRs</div>
                <h2 className="text-xl font-black text-white tracking-tight mt-0.5">{athleteName}</h2>
              </div>
              <span className="text-[8px] font-mono text-cyan-400/70 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">Verified</span>
            </div>

            {/* PR badge */}
            <div className="text-center my-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <Flame className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-300 tracking-widest">NEW PR: +{benchPressGain.toFixed(1)}kg Gain</span>
              </div>
            </div>

            {/* 1RM Trajectory Curve */}
            <div className="flex-1 flex flex-col items-center justify-center my-2">
              <div className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-white/40 mb-3">
                  <BarChart3 className="w-3 h-3" /> 1RM Trajectory
                </div>
                <div className="flex items-center justify-between gap-1">
                  {[
                    { val: '75kg', label: 'Start', pct: 40 },
                    { val: '95kg', label: 'Mid', pct: 70 },
                    { val: `${benchPress1RM.toFixed(0)}kg`, label: 'Now', pct: 100 },
                  ].map((p, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${i === 2 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.6)]' : 'bg-white/30'}`} />
                        <span className={`text-[10px] font-black ${i === 2 ? 'text-cyan-400' : 'text-white/60'}`}>{p.val}</span>
                        <span className="text-[7px] text-white/30 font-mono">{p.label}</span>
                      </div>
                      {i < 2 && (
                        <div className="flex-1 h-px bg-gradient-to-r from-white/15 to-white/25 relative">
                          <div className="absolute -top-1 right-0 text-[8px] text-red-400/60">+{(i === 0 ? 20 : (benchPressGain - 20 > 0 ? Math.round(benchPressGain - 20) : 10))}kg</div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* 3-Column Micro-Grid */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {[
                { label: 'BENCH', value: `${benchPress1RM.toFixed(1)}kg`, color: 'text-[#C8A97E]', icon: Trophy },
                { label: 'STREAK', value: `${streakStr} Days`, color: 'text-[#C9A227]', icon: Flame },
                { label: 'VOLUME', value: `${totalVolume.toFixed(1)} MT`, color: 'text-[#EA4335]', icon: TrendingUp },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-2 text-center">
                    <Icon className="w-3 h-3 mx-auto mb-1 opacity-50" />
                    <div className="text-[6px] font-bold text-white/40 tracking-wider uppercase">{s.label}</div>
                    <div className={`text-[11px] font-black ${s.color} mt-0.5`}>{s.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Watermark */}
            <div className="text-center mt-3 pb-1">
              <span className="text-[8px] text-white/25 tracking-widest font-mono">OBLIVION FITNESS CLUB · Verified Telemetry</span>
            </div>
          </div>
        </div>

        {/* Multi-Platform Social Action Bar */}
        <div className="flex items-center justify-center gap-2.5 mt-3">
          <button
            onClick={handleInstagram}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
            style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)' }}
          >
            <Instagram className="w-4 h-4" />
            <span className="hidden xs:inline">Stories</span>
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
            style={{ background: '#25D366' }}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden xs:inline">WhatsApp</span>
          </button>
          <button
            onClick={handleTwitter}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
            style={{ background: '#000000' }}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span className="hidden xs:inline">Post</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 py-3 rounded-2xl bg-gray-200 dark:bg-white/10 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {linkCopied ? <Check className="w-4 h-4 text-red-400" /> : <Link2 className="w-4 h-4" />}
            <span className="hidden xs:inline">{linkCopied ? 'Copied' : 'Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
