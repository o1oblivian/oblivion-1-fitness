import React, { useRef, useState } from 'react';
import {
  X,
  Share2,
  Download,
  Flame,
  Dumbbell,
  Footprints,
  CheckCircle,
} from 'lucide-react';

export interface VictoryData {
  routineName: string;
  totalVolumeKg: number;
  steps?: number;
  durationMin?: number;
  completedExercises?: number;
  athleteHandle?: string;
}

interface VictoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VictoryData;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const VictoryShareModal: React.FC<VictoryShareModalProps> = ({
  isOpen,
  onClose,
  data,
  showToast,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handle = data.athleteHandle || '@your_handle';
  const victoryText = `ATHLETE SESSION COMPLETE\n\n${data.routineName}\nTotal Volume: ${data.totalVolumeKg.toLocaleString()}kg${data.steps ? `\nSteps: ${data.steps.toLocaleString()}` : ''}${data.durationMin ? `\nDuration: ${data.durationMin}min` : ''}${data.completedExercises ? `\nExercises: ${data.completedExercises} completed` : ''}\nAthlete: ${handle}\nCoached on O1FC Official #TrainingOS #O1FC #Oblivion1FitnessClub`;

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${data.routineName} — Complete`,
          text: victoryText,
        });
        showToast?.('Shared successfully', 'success');
      } else {
        await navigator.clipboard.writeText(victoryText);
        showToast?.('Victory text copied — paste it anywhere', 'success');
      }
    } catch (e) {
      // user cancelled
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0B0E14',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `${data.routineName.replace(/\s+/g, '_')}_victory.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast?.('Victory card downloaded', 'success');
    } catch (e) {
      showToast?.('Could not generate image — try a screenshot', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#0A0A0C] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#14171F] rounded-3xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-mono font-black tracking-tight uppercase text-gray-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-stone-400" />
            My Victory
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[44px] min-h-[44px] rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 space-y-4">
          {/* Victory Card */}
          <div className="flex justify-center">
            <div
              ref={cardRef}
              className="relative w-[260px] h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0B0E14] via-[#0E1320] to-[#0B0E14] border border-white/10 flex flex-col items-center justify-between p-3.5"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-36 bg-zinc-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 left-0 w-28 h-28 bg-zinc-500/8 rounded-full blur-3xl pointer-events-none" />

              {/* Top badge */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-zinc-500/15 border border-stone-500/30 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-stone-400" />
                </div>
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                  Workout Complete
                </span>
              </div>

              {/* Routine name */}
              <div className="relative z-10 text-center">
                <h3 className="text-lg font-black text-white tracking-tight leading-tight">
                  {data.routineName}
                </h3>
              </div>

              {/* Metrics grid */}
              <div className="relative z-10 w-full space-y-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-stone-400" />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">Total Tonnage</span>
                  </div>
                  <span className="text-sm font-black text-white font-mono">
                    {data.totalVolumeKg.toLocaleString()}kg
                  </span>
                </div>

                {data.steps != null && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">Steps</span>
                    </div>
                    <span className="text-sm font-black text-white font-mono">
                      {data.steps.toLocaleString()}
                    </span>
                  </div>
                )}

                {data.durationMin != null && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">Duration</span>
                    </div>
                    <span className="text-sm font-black text-white font-mono">
                      {data.durationMin}min
                    </span>
                  </div>
                )}
              </div>

              {/* Watermark */}
              <div className="relative z-10 w-full pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-stone-400">{handle}</span>
                <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">O1FC</span>
              </div>
            </div>
          </div>

          {/* Share actions */}
          <div className="space-y-2">
            <button
              onClick={handleNativeShare}
              className="w-full py-3 bg-stone-600 hover:bg-zinc-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-stone-600/20"
            >
              <Share2 className="w-4 h-4" />
              Share Victory
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadImage}
                className="py-2.5 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(victoryText);
                    showToast?.('Victory text copied', 'success');
                  } catch (e) {
                    showToast?.('Could not copy text', 'error');
                  }
                }}
                className="py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                Copy Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryShareModal;
