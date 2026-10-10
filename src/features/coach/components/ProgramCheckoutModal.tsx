import React, { useState } from 'react';
import {
  X,
  Check,
  ShoppingBag,
  ShieldCheck,
  Star,
  ArrowRight,
  Play,
} from 'lucide-react';
import { CoachMarketplaceProgram } from '../types/coachPlatformTypes';
import { tactileEngine } from '../../../services/tactileEngine';

export interface ProgramCheckoutModalProps {
  program: CoachMarketplaceProgram | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollSuccess: (program: CoachMarketplaceProgram) => void;
  onOpenCoachProfile?: (coachId: string) => void;
}

export const ProgramCheckoutModal: React.FC<ProgramCheckoutModalProps> = ({
  program,
  isOpen,
  onClose,
  onEnrollSuccess,
  onOpenCoachProfile,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDayPreview, setSelectedDayPreview] = useState(0);
  const [isPlayingVideoTeaser, setIsPlayingVideoTeaser] = useState(false);

  if (!isOpen || !program) return null;

  const handleConfirmEnrollment = () => {
    setIsProcessing(true);
    tactileEngine.triggerImpactPulse();

    setTimeout(() => {
      setIsProcessing(false);
      tactileEngine.playPRCelebration();
      try {
        onEnrollSuccess(program);
      } catch (err) {
        console.warn('[Enrollment] Handled safely:', err);
      }
      onClose();
    }, 1000);
  };

  const handleCoachClick = () => {
    tactileEngine.triggerSelectionBuzz();
    if (onOpenCoachProfile) {
      onOpenCoachProfile(program.coachId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-200">
      <div className="o1-sheet-card w-full bg-black border border-white/[0.07] text-white flex flex-col shadow-xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-3.5 px-4 border-b border-white/[0.05] bg-black/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-o1-crimson" />
            <span className="font-tactical font-black text-xs tracking-[0.16em] text-white">
              Coach Program Enrollment
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/5 border border-white/[0.07] text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 flex-1 no-scrollbar">

          {/* 1. Masterclass Program Specular Header */}
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full bg-o1-well border border-white/[0.07] group">
            {isPlayingVideoTeaser ? (
              <video
                src={
                  program.videoPreviewUrl ||
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                }
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <img
                  src={program.coverImage}
                  alt={program.title}
                  className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/[0.07] text-[10px] font-mono font-bold text-white">
                    {program.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-o1-crimson text-[9.5px] font-mono font-bold text-white">
                    {program.difficulty}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/[0.07] text-amber-400 text-xs font-mono font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{program.rating.toFixed(2)}</span>
                  <span className="text-neutral-400 text-[10px]">({program.enrolledCount})</span>
                </div>

                {/* Video Teaser Button Overlay */}
                <button
                  type="button"
                  onClick={() => {
                    tactileEngine.triggerImpactPulse();
                    setIsPlayingVideoTeaser(true);
                  }}
                  className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/[0.07] text-white text-[10px] font-tactical font-bold tracking-wider hover:bg-o1-crimson transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <Play className="w-3 h-3 fill-white translate-x-[0.5px]" />
                  <span>Watch Movement Teaser</span>
                </button>
              </>
            )}
          </div>

          {/* Program Title & High-Conversion Tagline */}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-tactical font-black text-white leading-snug">
              {program.title}
            </h2>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              {program.description}
            </p>
          </div>

          {/* 2. THE TRUST ANCHOR: INTERACTIVE COACH IDENTITY STRIP (TAPS TO FULL PROFILE IN REELS) */}
          <div
            onClick={handleCoachClick}
            className="group p-3 rounded-2xl bg-o1-card border border-white/[0.07] hover:border-o1-crimson/60 flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-o1-crimson shrink-0 bg-white/[0.08]">
                  <img
                    src={
                      program.coachAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={program.coachName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white/[0.07] flex items-center justify-center text-white">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9.5px] font-mono font-bold text-o1-crimson tracking-wider">
                    Head Protocol Designer
                  </span>
                </div>
                <h4 className="text-sm font-tactical font-bold text-white group-hover:text-o1-crimson transition-colors truncate">
                  Coach {program.coachName}
                </h4>
                <span className="text-[10px] font-mono text-neutral-400 block truncate">
                  Tap to view coach physique, credentials & reels ↗
                </span>
              </div>
            </div>

            <button
              type="button"
              className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/[0.07] group-hover:border-o1-crimson/40 text-neutral-300 group-hover:text-white text-[10px] font-mono font-bold shrink-0 transition"
            >
              Profile ↗
            </button>
          </div>

          {/* 3. Program Specifications Checklist */}
          <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2">
            <span className="text-[10px] font-tactical font-bold text-neutral-400 tracking-wider block">
              Protocol Specifications
            </span>
            <div className="space-y-1.5">
              {program.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-sans text-neutral-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Sample Week Interactive Blueprint */}
          {program.sampleWeek && program.sampleWeek.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-tactical font-bold text-neutral-400 tracking-wider">
                  Sample Week Blueprint
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {program.durationWeeks} Weeks Total Curriculum
                </span>
              </div>

              {/* Day Picker Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {program.sampleWeek.map((day, idx) => (
                  <button
                    key={day.dayNumber}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setSelectedDayPreview(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-tight whitespace-nowrap border transition-all cursor-pointer ${
                      selectedDayPreview === idx
                        ? 'bg-o1-crimson text-white border-o1-crimson'
                        : 'bg-white/5 text-neutral-400 border-white/[0.07] hover:text-white'
                    }`}
                  >
                    {day.dayName}
                  </button>
                ))}
              </div>

              {/* Day Detail Box */}
              {program.sampleWeek[selectedDayPreview] && (
                <div className="p-3 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">
                      {program.sampleWeek[selectedDayPreview].focus}
                    </span>
                    <span className="text-neutral-400 text-[10px]">
                      {program.sampleWeek[selectedDayPreview].exercises.length} Movements
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {program.sampleWeek[selectedDayPreview].exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="p-2 rounded-xl bg-black/40 border border-white/[0.07] flex items-center justify-between text-xs"
                      >
                        <div className="font-medium text-neutral-200">
                          {ex.name}
                          {ex.notes && (
                            <span className="block text-[10px] text-neutral-400 font-normal">
                              {ex.notes}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-o1-crimson font-bold shrink-0 ml-2">
                          {ex.sets} × {ex.reps}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Instant Dispatch & 10% Platform Trust Guarantee */}
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-300 block">
                Instant Workout Tab Sync & 10% Club Guarantee
              </span>
              <span className="text-[10px] text-emerald-400/80">
                Immediately unlocks all {program.durationWeeks} weeks and loads Day 1 into your Daily Active Log. Verified kinematic form cues included.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Checkout Action */}
        <div className="p-3.5 px-4 border-t border-white/[0.05] bg-black flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[9.5px] font-mono text-neutral-400 block">
              Total ONE-TIME Investment
            </span>
            <span className="text-xl font-mono font-black text-white">
              ${program.priceUsd}.00
            </span>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirmEnrollment}
            className="flex-1 py-3 px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.98] text-white text-xs font-tactical font-black tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Enrolling in protocol...</span>
            ) : (
              <>
                <span>Enroll in Protocol</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
