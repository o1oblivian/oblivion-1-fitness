import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { shareOrCopy } from '@/utils/sharing';
import { Share2, Eye, EyeOff, X, Award, Lock } from 'lucide-react';
import { useSubscription } from '@/utils/useSubscription';

interface TransformationData {
  clientName: string;
  clientHandle: string;
  clientAvatar: string;
  coachName: string;
  coachHandle: string;
  timeframe: string;
  beforeDate: string;
  afterDate: string;
  beforeWeight: string;
  afterWeight: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  highlightPR: string;
  adherenceRate: string;
  protocolName: string;
}

const SAMPLE_TRANSFORMATION: TransformationData = {
  clientName: '',
  clientHandle: '',
  clientAvatar: '',
  coachName: '',
  coachHandle: '',
  timeframe: '',
  beforeDate: '',
  afterDate: '',
  beforeWeight: '',
  afterWeight: '',
  beforePhotoUrl: '',
  afterPhotoUrl: '',
  highlightPR: '',
  adherenceRate: '',
  protocolName: '',
};

interface CoachTransformationStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: Partial<TransformationData>;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const CoachTransformationStudioModal: React.FC<CoachTransformationStudioModalProps> = ({
  isOpen,
  onClose,
  clientData,
  showToast,
}) => {
  const { isCoachRole } = useSubscription();
  const data = { ...SAMPLE_TRANSFORMATION, ...clientData };
  const [blurFace, setBlurFace] = useState(false);
  const [showWeight, setShowWeight] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  if (!isCoachRole) {
    return createPortal(
      <div
        id="coach-transformation-auth-guard"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#121214] p-6 text-center flex flex-col items-center gap-3.5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-2xl bg-red-600/10 dark:bg-red-500/15 border border-red-600/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <Lock size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black dark:text-white">
              Coach Pro License Required
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
              Client transformation cards, before/after media studio, and watermarked export require an active O1FC Coach Pro license.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open_pay_plan_coach'));
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Upgrade to Coach Pro
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const handleShareNative = async () => {
    const shareText = `Insane ${data.timeframe.toLowerCase()} transformation by ${data.clientName}! ${data.beforeWeight} to ${data.afterWeight} and ${data.highlightPR} with ${data.coachHandle}. Built on O1 Oblivion Fitness Club.`;
    const shared = await shareOrCopy(
      { title: `${data.clientName} ${data.timeframe} Transformation // ${data.coachName}`, text: shareText, url: window.location.href },
      showToast
    );
    if (shared && !navigator.share) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl text-zinc-900 dark:text-white space-y-4 my-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#EA4335] flex items-center justify-center border border-red-200 dark:border-red-900/40">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Coach Social Studio</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Export & share athlete wins</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 9:16 Story Card Preview */}
        <div className="relative w-full aspect-[9/14] rounded-2xl bg-gradient-to-b from-[#181D29] via-[#0B0E14] to-[#05070A] border border-white/20 p-3.5 flex flex-col justify-between overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-zinc-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top: Coach & Athlete */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={data.clientAvatar}
                alt="Athlete"
                className={`w-8 h-8 rounded-full border border-stone-400 object-cover ${blurFace ? 'blur-sm' : ''}`}
              />
              <div>
                <span className="text-[11px] font-black text-white block leading-tight">{data.clientName}</span>
                <span className="text-[9px] font-mono text-stone-300 block">{data.timeframe} Transformation</span>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              {data.coachName}
            </span>
          </div>

          {/* Center: Before & After */}
          <div className="relative z-10 grid grid-cols-2 gap-2 my-2">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] border border-white/10 bg-neutral-900 shadow-md">
              <img src={data.beforePhotoUrl} alt="Before" className={`w-full h-full object-cover ${blurFace ? 'blur-md' : ''}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-[8px] font-mono font-bold text-gray-300 border border-white/10">
                BEFORE // {data.beforeDate}
              </span>
              {showWeight && (
                <span className="absolute bottom-2 left-2 text-[11px] font-mono font-black text-gray-300">
                  {data.beforeWeight}
                </span>
              )}
            </div>
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] border-2 border-stone-400/60 bg-neutral-900 shadow-lg">
              <img src={data.afterPhotoUrl} alt="After" className={`w-full h-full object-cover ${blurFace ? 'blur-md' : ''}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-zinc-500/80 text-[8px] font-mono font-black text-black">
                AFTER // {data.afterDate}
              </span>
              {showWeight && (
                <span className="absolute bottom-2 left-2 text-[11px] font-mono font-black text-stone-400">
                  {data.afterWeight}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Highlights */}
          <div className="relative z-10 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-[8px] font-mono text-gray-400 block uppercase">Strength Metric</span>
                <span className="text-[11px] font-mono font-black text-stone-300">{data.highlightPR}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
                <span className="text-[8px] font-mono text-gray-400 block uppercase">Consistency</span>
                <span className="text-[11px] font-mono font-black text-stone-400">{data.adherenceRate}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pt-1 border-t border-white/10">
              <span className="text-white font-bold tracking-widest uppercase">O1 // OBLIVION CLUB</span>
              <span className="text-red-400 font-bold">{data.coachHandle}</span>
            </div>
          </div>
        </div>

        {/* Privacy Toggles */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F2F2F7] dark:bg-white/5 border border-[rgba(0,0,0,0.08)] dark:border-white/10 text-xs font-mono">
          <button
            onClick={() => setBlurFace(!blurFace)}
            className="flex items-center gap-1.5 text-[#1C1C1E] dark:text-gray-300 hover:opacity-80 transition-all cursor-pointer"
          >
            {blurFace ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-zinc-500" />}
            <span>{blurFace ? 'Face Blurred' : 'Blur Face'}</span>
          </button>
          <button
            onClick={() => setShowWeight(!showWeight)}
            className="flex items-center gap-1.5 text-[#1C1C1E] dark:text-gray-300 hover:opacity-80 transition-all cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${showWeight ? 'bg-stone-400' : 'bg-gray-400 dark:bg-gray-600'}`} />
            <span>{showWeight ? 'Weight Visible' : 'Weight Hidden'}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShareNative}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-stone-500 hover:opacity-90 text-white font-black text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Copied to Clipboard!' : 'Share to Instagram / WhatsApp / Socials'}
        </button>
      </div>
    </div>,
    document.body
  );
};
