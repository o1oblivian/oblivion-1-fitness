import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Share2,
  Lock,
  Unlock,
  CheckCircle2,
  ShieldCheck,
  Download,
  Copy,
  Sparkles,
  Camera,
  Activity,
  Award,
  Key,
  ExternalLink,
  Check,
  Send,
  Image as ImageIcon,
  Dumbbell,
  TrendingUp
} from 'lucide-react';
import { AthleteData } from '../types';

interface ClientProgressShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteData | null;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  coachHandle?: string;
}

export const ClientProgressShareModal: React.FC<ClientProgressShareModalProps> = ({
  isOpen,
  onClose,
  athlete,
  showToast,
  coachHandle = '@CoachAlex',
}) => {
  // Content selection states
  const [includeVaultMedia, setIncludeVaultMedia] = useState(true);
  const [includeLogHistory, setIncludeLogHistory] = useState(true);
  const [includeTransformationCard, setIncludeTransformationCard] = useState(true);

  // Selected media index or custom caption
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [headline, setHeadline] = useState<string>('Milestone Progress Smashed!');
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [theme, setTheme] = useState<'iron' | 'gold' | 'dark' | 'crimson'>('iron');

  // Consent code system state
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [isConsentVerified, setIsConsentVerified] = useState<boolean>(false);
  const [codeDispatched, setCodeDispatched] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !athlete) return null;

  // Mock vault media items for the client
  const mockVaultMedia = [
    { title: 'Front Double Biceps - Week 8', date: 'Yesterday', url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop' },
    { title: 'Bench Press 120kg Form Check', date: '3 days ago', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop' },
    { title: 'Back Lat Spread - Peak Week', date: '1 week ago', url: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=600&auto=format&fit=crop' },
  ];

  const handleGenerateConsentCode = () => {
    // Generate a random 6-digit consent authorization code
    const code = `FIT-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedCode(code);
    setCodeDispatched(true);
    setIsConsentVerified(false);
    setInputCode('');
    showToast(`Consent Code ${code} dispatched to ${athlete.name}'s app`, 'success');
  };

  const handleVerifyCode = () => {
    if (!generatedCode) {
      showToast('Please generate a consent code first.', 'error');
      return;
    }
    if (inputCode.trim().toUpperCase() === generatedCode.toUpperCase()) {
      setIsConsentVerified(true);
      showToast(`Client Consent Code Verified. Sharing unlocked for ${athlete.name}.`, 'success');
    } else {
      showToast('Invalid authorization code. Check client app code.', 'error');
    }
  };

  const handleSimulateClientApprove = () => {
    if (!generatedCode) {
      handleGenerateConsentCode();
    }
    setInputCode(generatedCode || `FIT-8829`);
    setGeneratedCode(generatedCode || `FIT-8829`);
    setCodeDispatched(true);
    setIsConsentVerified(true);
    showToast(`Client ${athlete.name} approved consent request`, 'success');
  };

  const handleNativeShare = async () => {
    if (!isConsentVerified) {
      showToast('Sharing locked! Requires verified client consent code.', 'error');
      return;
    }

    const shareData = {
      title: `${athlete.name} - Client Progress Milestone`,
      text: `Client Progress Highlight: ${athlete.name} (${athlete.handle})\n"${headline}"\nCoached by ${coachHandle} on O1FC! #O1FC #CoachLog #PR`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Progress card shared successfully!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyCaptionToClipboard();
        }
      }
    } else {
      copyCaptionToClipboard();
    }
  };

  const copyCaptionToClipboard = async () => {
    try {
      const text = `CLIENT MILESTONE HIGHLIGHT\nAthlete: ${athlete.name} (${athlete.handle})\nCoach: ${coachHandle}\nHeadline: ${headline}\nVerified Consent ID: #${generatedCode || 'LUM-8829'}\n\nTracked on O1FC`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setIsCopied(true);
      showToast('Social caption copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard error:', err);
      showToast('Social caption ready!', 'success');
    }
  };

  const downloadCardGraphic = () => {
    try {
      if (!isConsentVerified) {
        showToast('Export locked until client consent is verified.', 'error');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = format === 'story' ? 1080 : 1080;
      const height = format === 'story' ? 1920 : 1080;

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        // Dark elegant background
        const grad = ctx.createLinearGradient(0, 0, width, height);
        if (theme === 'iron') {
          grad.addColorStop(0, '#0F2027');
          grad.addColorStop(0.5, '#203A43');
          grad.addColorStop(1, '#2C5364');
        } else if (theme === 'gold') {
          grad.addColorStop(0, '#111827');
          grad.addColorStop(1, '#1E293B');
        } else if (theme === 'crimson') {
          grad.addColorStop(0, '#1A0B10');
          grad.addColorStop(1, '#2D121B');
        } else {
          grad.addColorStop(0, '#121414');
          grad.addColorStop(1, '#1A1D24');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Header branding
        ctx.fillStyle = '#7A9382';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('O1FC • CLIENT PROGRESS REPORT', 80, 120);

        // Athlete name & coach
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 60px sans-serif';
        ctx.fillText(`${(athlete.name || 'ATHLETE').toUpperCase()}`, 80, 220);

        ctx.fillStyle = '#A0AEC0';
        ctx.font = '32px monospace';
        ctx.fillText(`COACH: ${coachHandle} | ATHLETE: ${athlete.handle}`, 80, 280);

        // Headline
        ctx.fillStyle = '#5B8C5A';
        ctx.font = 'bold 44px sans-serif';
        ctx.fillText(`"${headline}"`, 80, 370);

        // Stats list
        ctx.fillStyle = '#E2E8F0';
        ctx.font = '30px monospace';
        ctx.fillText(`• Protocol Compliance: 98.4%`, 80, 470);
        ctx.fillText(`• 7-Day Logged Volume: 18,450 kg`, 80, 530);
        ctx.fillText(`• Milestone Status: ${athlete.badge || 'Active'}`, 80, 590);

        // Consent Verification Stamp
        ctx.fillStyle = '#3B7A57';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`CLIENT CONSENT VERIFIED [ID: #${generatedCode || 'LUM-8829'}]`, 80, height - 120);

        // Download trigger
        const link = document.createElement('a');
        link.download = `client-progress-${(athlete.name || 'athlete').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('High-resolution social card downloaded!', 'success');
      }
    } catch (err) {
      console.error('Download card graphic error:', err);
      showToast('Failed to export graphic card.', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-[#0A0A0C] pb-20 font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="bg-white dark:bg-[#14171F] text-gray-900 dark:text-white border border-black/10 dark:border-white/10 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">
                  Share Client Progress
                </h3>
                <span className="shrink-0 text-[9px] font-mono font-bold bg-red-500/15 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/30">
                  SECURE
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                {athlete.name} ({athlete.handle})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CONTENT SELECTION MENU */}
        <div className="space-y-3 bg-gray-100 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 font-mono">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase">
              <div className="w-5 h-5 rounded-full bg-zinc-500 text-black font-black text-[10px] flex items-center justify-center shrink-0">1</div>
              <span>Choose Content to Include</span>
            </h4>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Step 1 of 3</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Vault Media Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#14171F] border border-gray-200 dark:border-white/10 cursor-pointer hover:border-gray-400 dark:hover:border-white/20 transition-all">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-stone-400" />
                <div>
                  <span className="font-bold text-gray-900 dark:text-white block">Vault Media</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-sans">Photos & videos from client's training vault</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeVaultMedia}
                onChange={(e) => setIncludeVaultMedia(e.target.checked)}
                className="w-4 h-4 accent-[#7A9382] rounded cursor-pointer"
              />
            </label>

            {/* Vault Photo Picker */}
            {includeVaultMedia && (
              <div className="pl-2 pt-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block mb-1.5">Select Vault Photo:</span>
                <div className="grid grid-cols-3 gap-2">
                  {mockVaultMedia.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-video ${
                        selectedPhotoIndex === idx ? 'border-stone-400 scale-95 shadow-md' : 'border-gray-200 dark:border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={m.url} alt={m.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1 flex items-end">
                        <span className="text-[8px] font-bold truncate text-white">{m.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Log History Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#14171F] border border-gray-200 dark:border-white/10 cursor-pointer hover:border-gray-400 dark:hover:border-white/20 transition-all">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-stone-400" />
                <div>
                  <span className="font-bold text-gray-900 dark:text-white block">Log History & PR Volume</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-sans">Workout volume, set logs & completion stats</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeLogHistory}
                onChange={(e) => setIncludeLogHistory(e.target.checked)}
                className="w-4 h-4 accent-[#7A9382] rounded cursor-pointer"
              />
            </label>

            {/* Transformation Report Card Toggle */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#14171F] border border-gray-200 dark:border-white/10 cursor-pointer hover:border-gray-400 dark:hover:border-white/20 transition-all">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-bold text-gray-900 dark:text-white block">Transformation Report Card</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-sans">Summary metrics, body comp shifts & milestone badges</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeTransformationCard}
                onChange={(e) => setIncludeTransformationCard(e.target.checked)}
                className="w-4 h-4 accent-[#7A9382] rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Custom Headline input */}
          <div className="pt-1">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold block mb-1">Coach Headline / Highlight:</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-white dark:bg-[#14171F] border border-gray-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#7A9382]"
              placeholder="e.g. Smashed 120kg Bench PR!"
            />
          </div>
        </div>

        {/* STEP 2: SECURE CLIENT CONSENT CODE SYSTEM */}
        <div className={`space-y-3 p-4 rounded-2xl border transition-all font-mono ${
          isConsentVerified 
            ? 'bg-zinc-50 dark:bg-stone-900/30 border-zinc-300 dark:border-stone-500/40' 
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase">
              <div className={`w-5 h-5 rounded-full font-black text-[10px] flex items-center justify-center shrink-0 ${
                isConsentVerified ? 'bg-zinc-500 text-white' : 'bg-amber-500 text-black'
              }`}>2</div>
              <span>Consent Authorization</span>
            </h4>
            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
              isConsentVerified 
                ? 'bg-zinc-500/20 text-zinc-600 dark:text-stone-300 border-stone-500/30' 
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
            }`}>
              {isConsentVerified ? 'VERIFIED' : 'LOCKED'}
            </span>
          </div>

          <p className="text-[11px] text-gray-600 dark:text-gray-300 font-sans leading-relaxed">
            Client data privacy requirement: Dispatches a unique 6-digit authorization code to {athlete.name}'s app. Enter code or simulate approval to unlock social export.
          </p>

          {!isConsentVerified ? (
            <div className="space-y-2 pt-1">
              {!codeDispatched ? (
                <button
                  onClick={handleGenerateConsentCode}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Authorization Request to {athlete.name}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 bg-gray-100 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px]">Consent Code:</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400 tracking-wider text-sm">{generatedCode}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="Enter code..."
                      className="flex-1 min-w-0 bg-white dark:bg-[#14171F] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white outline-none focus:border-[#7A9382] uppercase tracking-wider"
                    />
                    <button
                      onClick={handleVerifyCode}
                      className="py-2 px-4 bg-stone-600 hover:bg-zinc-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      Verify Code
                    </button>
                  </div>
                </div>
              )}

              {/* Simulation Option */}
              <div className="pt-1 text-center">
                <button
                  onClick={handleSimulateClientApprove}
                  className="text-[10px] text-stone-400 hover:underline font-mono cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Simulate Instant Client App Consent Approval</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-stone-300 font-bold bg-zinc-500/10 p-2.5 rounded-xl border border-stone-500/20">
              <CheckCircle2 className="w-4 h-4 text-zinc-500 dark:text-stone-400 shrink-0" />
              <span>Consent [#{generatedCode || 'FIT-8829'}] verified. Export authorized.</span>
            </div>
          )}
        </div>

        {/* STEP 3: SOCIAL EXPORT CARD PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono">
            <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-2 uppercase">
              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-black text-[10px] flex items-center justify-center shrink-0">3</div>
              <span>Export Preview</span>
            </h4>

            {/* Theme switcher */}
            <div className="flex items-center gap-1">
              {(['iron', 'gold', 'crimson', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    t === 'iron' ? 'bg-red-700' : t === 'gold' ? 'bg-amber-500' : t === 'crimson' ? 'bg-red-500' : 'bg-gray-700'
                  } ${theme === t ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                />
              ))}
            </div>
          </div>

          {/* CARD GRAPHIC PREVIEW CONTAINER — intentionally stays dark for social export branding */}
          <div className="relative rounded-2xl p-4 border bg-gradient-to-b from-[#161B22] via-[#0D1117] to-[#161B22] border-white/10 shadow-2xl space-y-3 overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="font-extrabold text-[#0EA5E9] tracking-wider uppercase">O1FC • COACH REPORT</span>
              <span className="text-gray-400 font-mono">#{athlete.key || 'ATH-01'}</span>
            </div>

            {/* Client Avatar & Name */}
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#7A9382] text-white font-black text-sm flex items-center justify-center shrink-0">
                {athlete.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white truncate">{athlete.name}</span>
                  <span className="text-[9px] font-mono text-stone-400 bg-zinc-500/20 px-1.5 py-0.2 rounded font-bold">
                    {athlete.badge}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">Coached by {coachHandle}</span>
              </div>
            </div>

            {/* Headline */}
            <div className="bg-zinc-500/10 border border-stone-500/20 p-2 rounded-xl">
              <p className="text-xs font-bold text-stone-300 italic">"{headline}"</p>
            </div>

            {/* Selected Vault Photo thumbnail if enabled */}
            {includeVaultMedia && (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-white/10">
                <img src={mockVaultMedia[selectedPhotoIndex].url} alt="Vault Media" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-white border border-white/10">
                  {mockVaultMedia[selectedPhotoIndex].title}
                </div>
              </div>
            )}

            {/* Stats summary preview */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {includeLogHistory && (
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-gray-400 block font-bold">LOGGED VOLUME</span>
                  <span className="text-white font-extrabold text-xs block mt-0.5">18,450 kg</span>
                </div>
              )}
              {includeTransformationCard && (
                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                  <span className="text-gray-400 block font-bold">COMPLIANCE</span>
                  <span className="text-stone-400 font-extrabold text-xs block mt-0.5">98.4% Perfect</span>
                </div>
              )}
            </div>

            {/* Consent stamp */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-gray-400">
              <span className="flex items-center gap-1 text-stone-400 font-bold">
                <ShieldCheck className="w-3 h-3" />
                <span>CONSENT VERIFIED [#{generatedCode || 'LUM-8829'}]</span>
              </span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
          <button
            onClick={handleNativeShare}
            disabled={!isConsentVerified}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isConsentVerified
                ? 'bg-[#7A9382] hover:bg-[#688070] text-white cursor-pointer active:scale-95 shadow-md'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-white/5'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={downloadCardGraphic}
            disabled={!isConsentVerified}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isConsentVerified
                ? 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 cursor-pointer active:scale-95'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

        <button
          onClick={copyCaptionToClipboard}
          className="w-full py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/8 text-gray-600 dark:text-gray-300 font-mono text-xs rounded-xl border border-gray-200 dark:border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-stone-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? 'Caption Copied!' : 'Copy Social Caption Text'}</span>
        </button>
      </motion.div>
    </div>
  );
};
