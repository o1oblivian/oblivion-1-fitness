import React, { useState } from 'react';
import { X, Share2, Copy, Check, Sparkles, Trophy, Flame } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface ShareBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyCard?: () => void;
  metrics: {
    handle: string;
    strainValue: number;
    avgVolumeKg: number;
    macroPrecision: number;
    readinessScore: number;
    benchmarkCount?: number;
    streakDays?: number;
    bodyweightKg?: number;
  };
}

export const ShareBenchmarkModal: React.FC<ShareBenchmarkModalProps> = ({
  isOpen,
  onClose,
  onCopyCard,
  metrics,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `🔥 O1FC Verified Progress Report for ${metrics.handle}:\n• Bodyweight: ${metrics.bodyweightKg ? `${metrics.bodyweightKg} kg` : 'Calibrated'}\n• Streak: ${metrics.streakDays ?? 0} Days Dedicated\n• Volume Moved: ${metrics.avgVolumeKg.toLocaleString()} kg\n• CNS Readiness: ${metrics.readinessScore}%\nTrain with me on Oblivion 1 Fitness Club: ${window.location.origin}`;

  const handleShare = async () => {
    tactileEngine.triggerSelectionBuzz();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Oblivion 1 Fitness Club Progress',
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch (e) {
        // Fallback
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    tactileEngine.triggerSelectionBuzz();
    if (onCopyCard) onCopyCard();
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 rounded-t-[32px] sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider">
                Client Progress Card
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono block">
                Verified Biometric &amp; Training Report
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Beautiful Tactical Card Graphic Preview */}
        <div className="relative rounded-2xl bg-[#09090b] border-2 border-neutral-800 p-4 space-y-3.5 text-white shadow-xl overflow-hidden">
          {/* Subtle top crimson glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#C4121A] via-cyan-500 to-[#C4121A]" />

          {/* Top card bar */}
          <div className="flex justify-between items-center text-[10px] font-mono border-b border-neutral-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-[#C4121A] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#C4121A] animate-pulse" />
              <span>O1FC VERIFIED ATHLETE</span>
            </div>
            <span className="text-neutral-400 font-medium">{metrics.handle}</span>
          </div>

          {/* Core progress headline */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black tracking-tight text-white">
                {metrics.avgVolumeKg.toLocaleString()} KG
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {metrics.streakDays ?? 0}-DAY STREAK
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Cumulative Tonnage Lifted
            </span>
          </div>

          {/* Biometric Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div className="p-2 rounded-xl bg-[#141416] border border-neutral-800 space-y-0.5">
              <span className="text-[9px] font-bold text-neutral-400 uppercase block">Bodyweight</span>
              <span className="font-mono font-bold text-white">
                {metrics.bodyweightKg ? `${metrics.bodyweightKg} kg` : 'Calibrating'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#141416] border border-neutral-800 space-y-0.5">
              <span className="text-[9px] font-bold text-neutral-400 uppercase block">CNS Readiness</span>
              <span className="font-mono font-bold text-green-500">
                {metrics.readinessScore}% Optimal
              </span>
            </div>
          </div>

          {/* Watermark brand footer */}
          <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500 pt-1">
            <span>OBLIVION 1 FITNESS CLUB</span>
            <span>POWERED BY REAL DATA</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-neutral-200 dark:border-neutral-700"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Telemetry'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-[#C4121A] hover:bg-[#a50f16] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm shadow-red-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
