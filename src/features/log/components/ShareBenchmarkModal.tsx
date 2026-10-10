import React, { useRef, useState } from 'react';
import { X, Share2, Download } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { PUBLIC_SITE, shareContent, downloadFile } from '../publicShare';
import { loadImageFile, renderProgressCard } from '../shareCardCanvas';

interface ShareBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    name: string;
    handle: string;
    volume7dKg: number;
    sessions7d: number;
    streakDays: number;
    bodyweightKg?: number;
    goalWeightKg?: number;
  };
}

type Slot = 'before' | 'after';

export const ShareBenchmarkModal: React.FC<ShareBenchmarkModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const [showWeight, setShowWeight] = useState(true);
  const [showGoal, setShowGoal] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [showLift, setShowLift] = useState(true);
  const [lift, setLift] = useState('');
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [beforeImg, setBeforeImg] = useState<HTMLImageElement | null>(null);
  const [afterImg, setAfterImg] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState('');
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const weightText = metrics.bodyweightKg && metrics.bodyweightKg > 0 ? `${metrics.bodyweightKg} kg` : '--';
  const goalText = metrics.goalWeightKg && metrics.goalWeightKg > 0 ? `${metrics.goalWeightKg} kg` : '--';
  const volumeText = metrics.sessions7d > 0 ? `${metrics.volume7dKg.toLocaleString()} kg` : '--';
  const sessionText = metrics.sessions7d > 0 ? String(metrics.sessions7d) : '--';
  const streakText = metrics.streakDays > 0 ? `${metrics.streakDays} d` : '--';

  const rows = [
    showWeight ? { label: 'Body weight', value: weightText } : null,
    showGoal ? { label: 'Goal weight', value: goalText } : null,
    showLift ? { label: 'Lift', value: lift.trim() || '--' } : null,
    showVolume ? { label: '7-day volume', value: volumeText } : null,
    showSessions ? { label: 'Sessions', value: sessionText } : null,
    showStreak ? { label: 'Streak', value: streakText } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  const onPick = async (slot: Slot, file: File | undefined) => {
    if (!file) return;
    tactileEngine.triggerSelectionBuzz();
    const url = URL.createObjectURL(file);
    const img = await loadImageFile(file);
    if (slot === 'before') {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
      setBeforeUrl(url);
      setBeforeImg(img);
    } else {
      if (afterUrl) URL.revokeObjectURL(afterUrl);
      setAfterUrl(url);
      setAfterImg(img);
    }
  };

  const buildFile = () => renderProgressCard({
    name: metrics.name || 'Set your name',
    before: beforeImg,
    after: afterImg,
    rows,
  });

  const handleShare = async () => {
    tactileEngine.triggerSelectionBuzz();
    setStatus('Building the card…');
    try {
      const file = await buildFile();
      const result = await shareContent({
        title: 'Oblivion 1',
        text: `${metrics.name || 'Set your name'} on Oblivion 1`,
        url: PUBLIC_SITE,
        file,
      });
      setStatus(result === 'shared' ? 'Share sheet opened.' : result === 'copied' ? 'Link copied. The card is ready to save.' : 'Share was cancelled.');
      if (result !== 'shared') downloadFile(file);
    } catch {
      setStatus('The card could not be built on this device.');
    }
  };

  const handleSave = async () => {
    tactileEngine.triggerSelectionBuzz();
    try {
      const file = await buildFile();
      downloadFile(file);
      setStatus('Card saved. Post that image.');
    } catch {
      setStatus('The card could not be built on this device.');
    }
  };

  const toggle = (label: string, on: boolean, set: (v: boolean) => void) => (
    <button
      key={label}
      type="button"
      onClick={() => { tactileEngine.triggerSelectionBuzz(); set(!on); }}
      className={`h-8 px-3 rounded-full text-[11px] font-semibold border cursor-pointer ${
        on ? 'bg-o1-well text-white border-white/30' : 'bg-transparent text-neutral-500 border-white/[0.07]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] w-full p-4 shadow-xl relative space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Share progress</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-black border border-white/[0.07] p-3.5 text-white space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-semibold text-neutral-300">Oblivion 1</span>
            <span className="text-[11px] text-neutral-500 truncate max-w-[50%]">{metrics.handle}</span>
          </div>
          <div className="text-lg font-semibold leading-tight">{metrics.name || 'Set your name'}</div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => beforeRef.current?.click()} className="aspect-[3/4] rounded-xl bg-o1-well border border-white/[0.14] overflow-hidden flex items-center justify-center text-[11px] text-neutral-400 cursor-pointer">
              {beforeUrl ? <img src={beforeUrl} alt="Before" className="w-full h-full object-cover" /> : 'Before'}
            </button>
            <button type="button" onClick={() => afterRef.current?.click()} className="aspect-[3/4] rounded-xl bg-o1-well border border-white/[0.14] overflow-hidden flex items-center justify-center text-[11px] text-neutral-400 cursor-pointer">
              {afterUrl ? <img src={afterUrl} alt="After" className="w-full h-full object-cover" /> : 'After'}
            </button>
          </div>
          <div className="space-y-1.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between text-[12px]">
                <span className="text-neutral-500">{row.label}</span>
                <span className="font-semibold tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-neutral-500">oblivion1.club</div>
        </div>

        <p className="text-[11px] text-neutral-500 leading-snug">
          Empty frames and -- stay empty until a photo or a number exists. This is the post reviewers and athletes see.
        </p>

        <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPick('before', e.target.files?.[0])} />
        <input ref={afterRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPick('after', e.target.files?.[0])} />

        <div className="flex flex-wrap gap-1.5">
          {toggle('Weight', showWeight, setShowWeight)}
          {toggle('Goal', showGoal, setShowGoal)}
          {toggle('Lift', showLift, setShowLift)}
          {toggle('Volume', showVolume, setShowVolume)}
          {toggle('Sessions', showSessions, setShowSessions)}
          {toggle('Streak', showStreak, setShowStreak)}
        </div>

        {showLift && (
          <input
            value={lift}
            onChange={(e) => setLift(e.target.value)}
            placeholder="Lift, for example Bench 100 kg"
            className="w-full h-10 px-3 rounded-xl bg-o1-well border border-white/[0.07] text-xs text-white placeholder:text-neutral-500"
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void handleSave()} className="min-h-[44px] rounded-xl bg-o1-well border border-white/[0.07] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
            <Download className="w-4 h-4" />
            Save image
          </button>
          <button type="button" onClick={() => void handleShare()} className="min-h-[44px] rounded-xl bg-o1-crimson text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
        {status && <p className="text-[11px] text-neutral-400 text-center">{status}</p>}
      </div>
    </div>
  );
};

export default ShareBenchmarkModal;
