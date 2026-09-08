import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Share2,
  Download,
  Camera,
  Check,
  Sparkles,
  Flame,
  Users,
  Activity,
  Layers,
  Clock,
  RotateCcw,
} from 'lucide-react';
import QRCode from 'qrcode';
import cinematicTandemImg from '@/assets/images/o1fc_cinematic_tandem_1788652804747.jpg';

interface TandemStoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userHandle: string;
  partnerHandle: string;
  sessionTitle?: string;
  totalVolumeLbs?: number;
  totalSets?: number;
  durationMinutes?: number;
  inviteCode?: string;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PhotoFilter = 'noir' | 'obsidian' | 'crimson' | 'natural';

export const TandemStoryCardModal: React.FC<TandemStoryCardModalProps> = ({
  isOpen,
  onClose,
  userHandle,
  partnerHandle,
  sessionTitle = 'PUSH PROTOCOL',
  totalVolumeLbs = 18450,
  totalSets = 24,
  durationMinutes = 52,
  inviteCode = 'O1FC',
  showToast,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(cinematicTandemImg);
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilter>('obsidian');
  const [protocolName, setProtocolName] = useState(sessionTitle);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate QR Code linking to tandem invite
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://o1fc.app';
    const deepLink = `${origin}/?tandem=${encodeURIComponent(inviteCode)}`;
    QRCode.toDataURL(deepLink, {
      width: 140,
      margin: 1,
      color: {
        dark: '#FFFFFF',
        light: '#070709',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [inviteCode]);

  // Handle Photo Upload from User's Device
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
        showToast?.('Gym photo attached to story card', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter CSS classes for the photo container
  const getFilterClass = (filter: PhotoFilter) => {
    switch (filter) {
      case 'noir':
        return 'grayscale contrast-[1.25] brightness-90';
      case 'obsidian':
        return 'contrast-[1.15] brightness-[0.82] saturate-[0.85]';
      case 'crimson':
        return 'contrast-[1.1] brightness-[0.85] sepia-[0.3] hue-rotate-[-35deg] saturate-[1.4]';
      case 'natural':
      default:
        return 'contrast-105 brightness-95';
    }
  };

  // Render & Export with html2canvas
  const handleExportStory = async (mode: 'share' | 'download') => {
    if (!cardRef.current) return;
    setIsExporting(true);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#070709',
        scale: 2.5, // High-resolution export for Instagram 1080x1920 stories
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      if (mode === 'share' && navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            triggerDownload(canvas);
            setIsExporting(false);
            return;
          }
          const file = new File([blob], `o1fc-tandem-${Date.now()}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'O1FC Tandem Workout',
                text: `Synchronized session with @${partnerHandle || 'partner'} on Oblivion 1 Fitness Club`,
                files: [file],
              });
              showToast?.('Shared successfully to story', 'success');
            } catch (err) {
              // User cancelled share dialog
            }
          } else {
            triggerDownload(canvas);
          }
          setIsExporting(false);
        }, 'image/png');
      } else {
        triggerDownload(canvas);
        setIsExporting(false);
      }
    } catch (err) {
      console.error('Export failed:', err);
      showToast?.('Could not generate story card. Please screenshot.', 'error');
      setIsExporting(false);
    }
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `O1FC_TANDEM_${userHandle || 'ATHLETE'}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast?.('Story card saved to Photos', 'success');
  };

  const handleCopyInvite = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://o1fc.app';
    const text = `Train in Tandem with me on O1FC: ${origin}/?tandem=${inviteCode}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast?.('Tandem invite link copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0C] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center my-auto">
        {/* Modal Top Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Tandem Duo Story Card
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── THE 9:16 HIGH-CONTRAST STORY CARD CONTAINER (REF TARGET) ── */}
        <div className="w-full flex justify-center mb-4">
          <div
            ref={cardRef}
            className="relative w-[300px] h-[533px] sm:w-[320px] sm:h-[568px] rounded-3xl overflow-hidden bg-[#070709] border border-white/15 shadow-2xl flex flex-col justify-between p-4 select-none"
            style={{
              boxShadow: '0 25px 60px -15px rgba(220, 38, 38, 0.25), 0 0 40px rgba(0,0,0,0.9)',
            }}
          >
            {/* Background Photo with High-Contrast Treatment */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={photoUrl}
                alt="Tandem Workout"
                crossOrigin="anonymous"
                className={`w-full h-full object-cover transition-all duration-300 ${getFilterClass(selectedFilter)}`}
              />
              {/* Surgical Vignette Gradients for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#070709] via-transparent to-[#070709] opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent" />
              <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/80" />
            </div>

            {/* CARD HEADER */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs">
                    O1
                  </div>
                  <div>
                    <p className="text-[10px] font-mono tracking-widest uppercase text-white/90 font-black">
                      OBLIVION 1 FITNESS CLUB
                    </p>
                    <p className="text-[8px] font-mono tracking-wider text-red-400 font-semibold uppercase">
                      TANDEM PROTOCOL // LIVE SYNC
                    </p>
                  </div>
                </div>

                <div className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[9px] font-mono font-bold text-red-300 uppercase tracking-tight">
                    SYNCED
                  </span>
                </div>
              </div>

              {/* DUAL ATHLETE BADGES */}
              <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {(userHandle || 'ME').charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-white leading-tight truncate">
                      @{userHandle || 'athlete'}
                    </p>
                    <p className="text-[9px] font-mono text-white/50">LEAD ATHLETE</p>
                  </div>
                </div>

                <div className="px-2 flex flex-col items-center">
                  <span className="text-red-500 font-black text-sm">×</span>
                  <span className="text-[7px] font-mono uppercase tracking-widest text-white/40">DUO</span>
                </div>

                <div className="flex items-center gap-2 min-w-0 text-right">
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-white leading-tight truncate">
                      @{partnerHandle || 'partner'}
                    </p>
                    <p className="text-[9px] font-mono text-white/50">TANDEM PARTNER</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {(partnerHandle || 'P').charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD CENTER: PROTOCOL BANNER */}
            <div className="relative z-10 my-auto text-center space-y-1">
              <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-red-400 bg-red-950/60 border border-red-800/40 px-3 py-0.5 rounded-full">
                COMPLETED PROTOCOL
              </span>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white drop-shadow-md">
                {protocolName}
              </h3>
            </div>

            {/* CARD TELEMETRY HUD & QR FOOTER */}
            <div className="relative z-10 space-y-2.5">
              {/* Telemetry 3-Column Instrument Grid */}
              <div className="grid grid-cols-3 gap-1.5 bg-black/75 backdrop-blur-md rounded-2xl border border-white/10 p-2 text-center">
                <div className="space-y-0.5 border-r border-white/10 pr-1">
                  <p className="text-[8px] font-mono uppercase text-white/50 tracking-wider">VOLUME</p>
                  <p className="text-xs sm:text-sm font-mono font-black text-white">
                    {totalVolumeLbs.toLocaleString()}
                  </p>
                  <p className="text-[8px] font-mono text-red-400 font-bold">LBS MOVED</p>
                </div>

                <div className="space-y-0.5 border-r border-white/10 px-1">
                  <p className="text-[8px] font-mono uppercase text-white/50 tracking-wider">SYNCED SETS</p>
                  <p className="text-xs sm:text-sm font-mono font-black text-white">{totalSets}</p>
                  <p className="text-[8px] font-mono text-red-400 font-bold">SETS TOTAL</p>
                </div>

                <div className="space-y-0.5 pl-1">
                  <p className="text-[8px] font-mono uppercase text-white/50 tracking-wider">DURATION</p>
                  <p className="text-xs sm:text-sm font-mono font-black text-white">{durationMinutes}M</p>
                  <p className="text-[8px] font-mono text-red-400 font-bold">INTENSITY</p>
                </div>
              </div>

              {/* Footer with Scannable QR Code */}
              <div className="flex items-center justify-between bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-2">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-mono uppercase text-white/40 tracking-wider">
                    TRAIN IN TANDEM
                  </p>
                  <p className="text-[10px] font-mono font-bold text-white tracking-wider">
                    CODE: <span className="text-red-400">{inviteCode}</span>
                  </p>
                  <p className="text-[7px] font-mono text-white/40">o1fc.app // Training OS Pro</p>
                </div>

                {qrCodeDataUrl ? (
                  <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                    <img
                      src={qrCodeDataUrl}
                      alt="Tandem QR Code"
                      className="w-10 h-10 rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-[9px] font-mono text-white/40">
                    QR
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD CUSTOMIZATION & CONTROLS ── */}
        <div className="w-full space-y-3">
          {/* Photo Options: Upload Custom Photo */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-red-400" />
              Upload Gym Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            <button
              onClick={() => {
                setPhotoUrl(cinematicTandemImg);
                showToast?.('Reset to cinematic athletic visual', 'info');
              }}
              title="Reset to default athletic photo"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Aesthetic Filter Chips */}
          <div className="flex items-center gap-1.5 justify-center">
            {(['obsidian', 'noir', 'crimson', 'natural'] as PhotoFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono uppercase transition-all ${
                  selectedFilter === f
                    ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/30 border border-red-500'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Action Buttons: Native Share Sheet & Camera Roll Save */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleExportStory('share')}
              disabled={isExporting}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              {isExporting ? 'Generating...' : 'Share to Story'}
            </button>

            <button
              onClick={() => handleExportStory('download')}
              disabled={isExporting}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all disabled:opacity-50 active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Save Image
            </button>
          </div>

          {/* Quick Copy Link */}
          <div className="text-center">
            <button
              onClick={handleCopyInvite}
              className="text-[11px] font-mono text-white/50 hover:text-red-400 transition-colors inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-red-400" /> : <Sparkles className="w-3 h-3" />}
              {copied ? 'Link Copied!' : 'Copy Partner Invite Deep-Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
