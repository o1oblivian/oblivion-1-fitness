import React, { useRef, useCallback, useState } from 'react';
import { X, Instagram, MessageCircle, Link2, Flame, TrendingUp, Clock, Activity, Image as ImageIcon, BarChart3, Check } from 'lucide-react';
import { CoachLog } from './FitnessIntelligenceApp';
import { getAthleteTelemetryByCoachLog } from '../data/athleteTelemetry';
import { shareToInstagram, shareToX, shareToWhatsApp } from '@/utils/sharing';
import { loadSocialProfiles } from '@/utils/socialProfilesStore';

interface ShareResultModalProps {
  log: CoachLog | null;
  coachName: string;
  onClose: () => void;
  showToast: (msg: string) => void;
}

function calcSessionVolume(exercises: { sets: { weight: number | string; reps: number | string }[] }[]): number {
  let total = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      const w = typeof s.weight === 'number' ? s.weight : 0;
      const r = typeof s.reps === 'number' ? s.reps : 0;
      total += w * r;
    });
  });
  return total / 1000;
}

function calcAvgRPE(exercises: { sets: { rpe: number | string }[] }[]): number {
  let sum = 0, count = 0;
  exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      const r = typeof s.rpe === 'number' ? s.rpe : 0;
      if (r > 0) { sum += r; count++; }
    });
  });
  return count > 0 ? sum / count : 0;
}

export const ShareResultModal: React.FC<ShareResultModalProps> = ({ log, coachName, onClose, showToast }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !log) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const W = 1080, H = 1920;
    canvas.width = W; canvas.height = H;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0A0B0F'); grad.addColorStop(0.5, '#12141B'); grad.addColorStop(1, '#0A0B0F');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
    accentGrad.addColorStop(0, '#EA4335'); accentGrad.addColorStop(1, '#C9A227');
    ctx.fillStyle = accentGrad; ctx.fillRect(0, 0, W, 8);

    ctx.fillStyle = 'rgba(217, 79, 79, 0.08)';
    ctx.beginPath(); ctx.arc(W * 0.85, H * 0.15, 300, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(201, 162, 39, 0.06)';
    ctx.beginPath(); ctx.arc(W * 0.15, H * 0.8, 250, 0, Math.PI * 2); ctx.fill();

    const telemetry = getAthleteTelemetryByCoachLog(log.athleteName);
    const sessionVol = calcSessionVolume(log.exercises);
    const avgRPE = calcAvgRPE(log.exercises);
    const topPR = telemetry.prs[0];

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(log.athleteName, W / 2, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '500 28px system-ui, sans-serif';
    ctx.fillText(`Coached by ${coachName}`, W / 2, 250);

    ctx.strokeStyle = 'rgba(217, 79, 79, 0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W * 0.2, 290); ctx.lineTo(W * 0.8, 290); ctx.stroke();

    if (topPR) {
      ctx.fillStyle = '#EA4335'; ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillText('NEW PR', W / 2, 370);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 56px system-ui, sans-serif';
      ctx.fillText(`+${topPR.delta}kg ${topPR.exercise}`, W / 2, 440);
    }

    const stats = [
      { label: 'TOTAL VOLUME', value: `${sessionVol.toFixed(1)} MT`, color: '#EA4335' },
      { label: 'DURATION', value: log.duration.replace(/^00:/, ''), color: '#FFFFFF' },
      { label: 'AVG RPE', value: avgRPE.toFixed(1), color: '#C9A227' },
      { label: 'NEW PRs', value: `${telemetry.prs.length}`, color: '#3B7A57' },
    ];
    const cardW = 420, cardH = 180, gapX = 40, gapY = 30;
    const startX = (W - cardW * 2 - gapX) / 2, startY = 530;
    stats.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX), y = startY + row * (cardH + gapY);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      roundRect(ctx, x, y, cardW, cardH, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 22px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(s.label, x + 30, y + 50);
      ctx.fillStyle = s.color; ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillText(s.value, x + 30, y + 115);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '500 24px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('OBLIVION FITNESS CLUB · Verified Telemetry', W / 2, H - 80);

    return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob), 'image/png'); });
  }, [log, coachName]);

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  const handleInstagram = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], `result_${log?.athleteName?.replace(/\s/g, '_')}.png`, { type: 'image/png' });
    const profiles = loadSocialProfiles();
    const igHandle = profiles.instagram ? `@${profiles.instagram.replace(/^@/, '')}` : '';
    await shareToInstagram({
      text: `${log?.athleteName} — Client Result! Coached by ${coachName}${igHandle ? ` ${igHandle}` : ''}`,
      title: `${log?.athleteName} — Client Result`,
      imageFile: file,
      hashtags: ['O1FCFitLab', 'ClientResults', 'PersonalTrainer'],
    }, showToast);
  };

  const handleWhatsApp = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], `result_${log?.athleteName}.png`, { type: 'image/png' });
    await shareToWhatsApp({
      text: `Check out ${log?.athleteName}'s progress! Coached by ${coachName}`,
      imageFile: file,
      hashtags: ['O1FCFitLab'],
    }, showToast);
  };

  const handleTwitter = async () => {
    const blob = await generateImage();
    const file = blob ? new File([blob], `result_${log?.athleteName}.png`, { type: 'image/png' }) : undefined;
    const profiles = loadSocialProfiles();
    const xHandle = profiles.x ? `@${profiles.x.replace(/^@/, '')}` : '';
    await shareToX({
      text: `${log?.athleteName} — Client Result! Coached by ${coachName}${xHandle ? ` ${xHandle}` : ''}`,
      imageFile: file,
      hashtags: ['O1FCFitLab', 'ClientResults'],
    }, showToast);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true); showToast?.('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => showToast?.('Could not copy link'));
  };

  if (!log) return null;

  const telemetry = getAthleteTelemetryByCoachLog(log.athleteName);
  const sessionVol = calcSessionVolume(log.exercises);
  const avgRPE = calcAvgRPE(log.exercises);
  const topPR = telemetry.prs[0];
  const durationStr = log.duration.replace(/^00:/, '');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-sm my-auto" onClick={(e) => e.stopPropagation()}>
        {/* 9:16 OLED Card Frame — card content stays dark */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-red-500/30 mb-4" style={{ aspectRatio: '9/16' }}>
          <canvas ref={canvasRef} className="w-full h-full" />
          {/* Close icon — part of card overlay, stays dark */}
          <button onClick={onClose} className="absolute top-3 right-3 z-30 btn-nude-close !text-white hover:!text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          {/* Live HTML preview — card content, stays dark */}
          <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#0A0B0F] via-[#12141B] to-[#0A0B0F] p-3.5">
            {/* Accent top border */}
            <div className="w-full h-1 bg-gradient-to-r from-[#EA4335] to-[#C9A227] rounded-full -mt-6 -mx-6 mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between mt-1">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{log.athleteName}</h2>
                <p className="text-[10px] text-white/40 mt-0.5">Coached by {coachName}</p>
              </div>
              <span className="text-[8px] font-mono text-red-400/70 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 uppercase tracking-wider">Verified</span>
            </div>
            <div className="w-2/3 h-px bg-[#EA4335]/30 mx-auto my-3" />

            {/* PR badge */}
            {topPR && (
              <div className="text-center mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 shadow-[0_0_15px_rgba(217,79,79,0.3)]">
                  <Flame className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-bold text-red-300 tracking-widest">NEW PR: +{topPR.delta}kg {topPR.exercise}</span>
                </div>
              </div>
            )}

            {/* Visual Progress Canvas — 1RM Trajectory */}
            <div className="flex-1 flex flex-col items-center justify-center my-2">
              <div className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-center gap-1.5 text-[8px] font-mono uppercase tracking-widest text-white/40 mb-3">
                  <BarChart3 className="w-3 h-3" /> 1RM Trajectory
                </div>
                <div className="flex items-center justify-between gap-1">
                  {[
                    { val: '75kg', label: 'Wk 1', pct: 40 },
                    { val: '95kg', label: 'Wk 6', pct: 70 },
                    { val: '105kg', label: 'Now', pct: 100 },
                  ].map((p, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${i === 2 ? 'bg-red-400 shadow-[0_0_10px_rgba(217,79,79,0.6)]' : 'bg-white/30'}`} />
                        <span className={`text-[10px] font-black ${i === 2 ? 'text-red-400' : 'text-white/60'}`}>{p.val}</span>
                        <span className="text-[7px] text-white/30 font-mono">{p.label}</span>
                      </div>
                      {i < 2 && (
                        <div className="flex-1 h-px bg-gradient-to-r from-white/15 to-white/25 relative">
                          <div className="absolute -top-1 right-0 text-[8px] text-red-400/60">+{(i === 0 ? 20 : 10)}kg</div>
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
                { label: 'VOLUME', value: `${sessionVol.toFixed(1)} MT`, color: 'text-[#EA4335]', icon: TrendingUp },
                { label: 'DURATION', value: durationStr, color: 'text-white', icon: Clock },
                { label: 'NEW PRs', value: `${telemetry.prs.length}`, color: 'text-red-700 dark:text-red-400', icon: Flame },
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

        {/* Multi-Platform Social Action Bar — modal chrome */}
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
