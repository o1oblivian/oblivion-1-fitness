import React, { useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Award,
  Users,
  Dumbbell,
  Play,
  Check,
  ArrowRight,
  Share2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { CoachProfile, CoachMarketplaceProgram, CoachReview } from '../types/coachPlatformTypes';
import { tactileEngine } from '../../../services/tactileEngine';

export interface CoachFullProfileModalProps {
  coach: CoachProfile | null;
  isOpen: boolean;
  onClose: () => void;
  programs?: CoachMarketplaceProgram[];
  reviews?: CoachReview[];
  onSelectProgram?: (program: CoachMarketplaceProgram) => void;
  onBookCoaching?: (coach: CoachProfile) => void;
}

export const CoachFullProfileModal: React.FC<CoachFullProfileModalProps> = ({
  coach,
  isOpen,
  onClose,
  programs = [],
  reviews = [],
  onSelectProgram,
  onBookCoaching,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeSection, setActiveSection] = useState<'physique' | 'reels' | 'programs' | 'reviews'>('physique');
  const [playingReelUrl, setPlayingReelUrl] = useState<string | null>(null);

  if (!isOpen || !coach) return null;

  const photoList = coach.physiquePhotos && coach.physiquePhotos.length > 0
    ? coach.physiquePhotos
    : [coach.bannerImage, coach.avatar];

  const coachPrograms = programs.filter(
    (p) => p.coachId === coach.id || p.coachName.toLowerCase().includes(coach.name.toLowerCase().split(' ')[0])
  );

  const displayPrograms = coachPrograms.length > 0 ? coachPrograms : programs;

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    setActivePhotoIdx((prev) => (prev + 1) % photoList.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    setActivePhotoIdx((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim select-none animate-in fade-in duration-200">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] text-white flex flex-col shadow-xl overflow-hidden">
        
        {/* Top Floating Glass Header */}
        <div className="p-3.5 px-4 border-b border-white/[0.05] bg-black/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-tactical font-black text-xs tracking-[0.16em] text-neutral-200 truncate">
              COACH DOSSIER // {coach.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                if (navigator.share) {
                  navigator.share({ title: coach.name, text: coach.bio, url: window.location.href }).catch(() => {});
                }
              }}
              className="p-1.5 rounded-xl bg-white/5 border border-white/[0.07] text-neutral-300 hover:text-white transition cursor-pointer"
              title="Share Coach"
            >
              <Share2 className="w-4 h-4" />
            </button>
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
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 no-scrollbar space-y-4 pb-6">

          {/* 1. Full-Bleed Specular Physique Gallery */}
          <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-black overflow-hidden group">
            <img
              src={photoList[activePhotoIdx]}
              alt={`${coach.name} physique`}
              className="w-full h-full object-cover transition-all duration-300 brightness-95 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-black/40" />

            {/* Left / Right Nav Touch Targets */}
            {photoList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.07] flex items-center justify-center text-white opacity-80 hover:opacity-100 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.07] flex items-center justify-center text-white opacity-80 hover:opacity-100 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/[0.07] text-[10px] font-mono font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Verified Pro Coach
              </span>
              <span className="px-2 py-0.5 rounded-full bg-o1-crimson text-[9.5px] font-mono font-bold text-white">
                O1 10% Partner
              </span>
            </div>

            {/* Bottom Photo Dots & Metric Pill */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <div className="flex items-center gap-1.5">
                {photoList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      setActivePhotoIdx(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'w-6 bg-o1-crimson' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/[0.07]">
                PHYSIQUE {activePhotoIdx + 1} / {photoList.length}
              </span>
            </div>
          </div>

          {/* 2. Coach Identity & Direct Trust Strip */}
          <div className="px-4 sm:px-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-tactical font-black text-white tracking-wide">
                    {coach.name}
                  </h1>
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-o1-crimson text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 flex-wrap">
                  <span className="text-o1-crimson font-bold">{coach.handle}</span>
                  <span>•</span>
                  <span>{coach.role}</span>
                </div>
              </div>

              {/* Slots Remaining Urgency Badge */}
              <div className="shrink-0 text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {coach.slotsRemaining ?? 2} SLOTS LEFT
                </span>
                <span className="text-[9.5px] font-mono text-neutral-400 block mt-0.5">
                  1-on-1 Direct Roster
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {coach.bio}
            </p>

            {/* Certifications & Specialties Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {(coach?.certifications ?? []).map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-0.5 rounded-xl bg-white/5 border border-white/[0.07] text-[10px] font-mono font-bold text-neutral-200"
                >
                  ✓ {c}
                </span>
              ))}
              {(coach?.specialties ?? []).map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-0.5 rounded-xl bg-o1-well border border-white/[0.07] text-[10px] font-mono text-neutral-400"
                >
                  #{s.replace(/\s+/g, '')}
                </span>
              ))}
            </div>

            {/* 3. Physical & Kinematic Benchmarks Telemetry HUD */}
            {coach.physiqueStats && (
              <div className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-tactical font-black text-neutral-400 tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-o1-crimson" />
                    Verified athletic & physique telemetry
                  </span>
                  <span className="text-neutral-400 font-tactical font-bold tracking-wider">
                    {coach.physiqueStats.experienceYears} Yrs Coaching
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.07]">
                    <span className="text-[9px] font-tactical text-neutral-400 tracking-wider block font-bold">Height</span>
                    <span className="text-xs font-tactical font-black text-white block mt-0.5 tracking-tight">
                      {coach.physiqueStats.height || "185 cm"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.07]">
                    <span className="text-[9px] font-tactical text-neutral-400 tracking-wider block font-bold">Weight / Comp</span>
                    <span className="text-xs font-tactical font-black text-white block mt-0.5 tracking-tight">
                      {coach.physiqueStats.weight || "94 kg"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/[0.07]">
                    <span className="text-[9px] font-tactical text-neutral-400 tracking-wider block font-bold">Body Fat Est.</span>
                    <span className="text-xs font-tactical font-black text-emerald-400 block mt-0.5 tracking-tight">
                      {coach.physiqueStats.bodyFatEst || "7.2% Stage"}
                    </span>
                  </div>
                </div>

                {/* Competition Lifts Bar */}
                {coach.physiqueStats.competitionLifts && (
                  <div className="pt-2 border-t border-white/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(coach.physiqueStats.competitionLifts ?? []).map((lift) => (
                      <div key={lift.label} className="p-1.5 rounded-lg bg-o1-well border border-white/[0.07]">
                        <span className="text-[8.5px] font-tactical text-neutral-400 block truncate font-bold tracking-wider">
                          {lift.label}
                        </span>
                        <span className="text-xs font-tactical font-black text-amber-400 block tracking-tight">
                          {lift.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Tabs for Modal Section */}
            <div className="grid grid-cols-3 gap-1 bg-o1-card p-1 rounded-2xl border border-white/[0.07]">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveSection('programs');
                }}
                className={`py-2 rounded-xl text-xs font-tactical font-bold tracking-wider transition-all cursor-pointer ${
                  activeSection === 'programs'
                    ? 'bg-o1-crimson text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                PROGRAMS ({displayPrograms.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveSection('reels');
                }}
                className={`py-2 rounded-xl text-xs font-tactical font-bold tracking-wider transition-all cursor-pointer ${
                  activeSection === 'reels'
                    ? 'bg-o1-crimson text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                REELS ({coach.movementReels?.length || 3})
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setActiveSection('reviews');
                }}
                className={`py-2 rounded-xl text-xs font-tactical font-bold tracking-wider transition-all cursor-pointer ${
                  activeSection === 'reviews'
                    ? 'bg-o1-crimson text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                REVIEWS ({coach.reviewsCount})
              </button>
            </div>

            {/* SECTION 1: PROGRAMS SHELF (THE MONEY MAKER) */}
            {activeSection === 'programs' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Published Protocols</span>
                  <span className="text-o1-crimson font-bold">10% Platform Guarantee</span>
                </div>

                {displayPrograms.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-o1-card border border-white/[0.07] text-center space-y-2">
                    <Dumbbell className="w-6 h-6 text-neutral-500 mx-auto" />
                    <h4 className="font-tactical font-black text-xs tracking-wider text-white">
                      NO COACH PROTOCOLS CURRENTLY PUBLISHED
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Check back soon for newly published training protocols.
                    </p>
                  </div>
                ) : (
                  displayPrograms.map((prog) => (
                  <div
                    key={prog.id}
                    onClick={() => {
                      tactileEngine.triggerSelectionBuzz();
                      if (onSelectProgram) {
                        onClose();
                        onSelectProgram(prog);
                      }
                    }}
                    className="group rounded-2xl bg-o1-card border border-white/[0.07] hover:border-o1-crimson/60 overflow-hidden transition-all shadow-md cursor-pointer"
                  >
                    <div className="relative aspect-[16/8] w-full overflow-hidden bg-o1-well">
                      <img
                        src={prog.coverImage}
                        alt={prog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/[0.07] text-[9.5px] font-mono font-bold text-white">
                          {prog.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-o1-crimson text-[9.5px] font-mono font-bold text-white">
                          {prog.difficulty}
                        </span>
                      </div>

                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs font-mono text-neutral-300">
                        <span>{prog.durationWeeks} WEEKS • {prog.daysPerWeek} DAYS/WK</span>
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{prog.rating.toFixed(2)} ({prog.enrolledCount})</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold font-tactical text-white group-hover:text-o1-crimson transition-colors leading-snug">
                            {prog.title}
                          </h3>
                          <p className="text-[11px] text-neutral-400 font-sans line-clamp-1 mt-0.5">
                            {prog.tagline}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-tactical font-black text-white block tracking-tight">
                            ${prog.priceUsd}.00
                          </span>
                          <span className="text-[9px] font-tactical font-bold text-neutral-400 tracking-wider">ONE-TIME</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                        <span className="text-[10px] font-tactical font-bold text-emerald-400 flex items-center gap-1 tracking-wider">
                          <Check className="w-3 h-3" />
                          Instant Workout Tab Sync
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl bg-o1-crimson text-white text-[10px] font-tactical font-black tracking-wider flex items-center gap-1 group-hover:bg-o1-crimson-hover transition"
                        >
                          <span>Enroll Now</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
                )}

                {/* 1-on-1 VIP Retainer Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 via-o1-well to-black border border-o1-crimson/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-o1-crimson/20 border border-o1-crimson/40 text-[9.5px] font-tactical font-black tracking-widest text-o1-crimson">
                      Vip 1-ON-1 CO-PILOT
                    </span>
                    <span className="text-sm font-tactical font-black text-white tracking-tight">
                      ${coach.pricing.monthlyOneOnOneUsd}/mo
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-tactical text-white">
                      Direct Private Coaching & Daily Dispatches
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Direct WhatsApp/app encrypted channel with {coach.name}, weekly video form reviews, and dynamic workout adjustments synced straight to your Workout tab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      tactileEngine.triggerImpactPulse();
                      if (onBookCoaching) {
                        onClose();
                        onBookCoaching(coach);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-tactical font-black tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Apply for direct 1-ON-1 roster</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 2: MOVEMENT & COACHING REELS */}
            {activeSection === 'reels' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Coach workout & movement reels</span>
                  <span className="text-neutral-400">Tap to Watch Video</span>
                </div>

                {playingReelUrl && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/[0.07] mb-3">
                    <video
                      src={playingReelUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPlayingReelUrl(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(coach.movementReels || []).map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => {
                        tactileEngine.triggerSelectionBuzz();
                        setPlayingReelUrl(
                          reel.videoUrl ||
                            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                        );
                      }}
                      className="group relative rounded-xl overflow-hidden aspect-[9/14] bg-o1-well border border-white/[0.07] cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <img
                        src={reel.thumbnail}
                        alt={reel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                        <Play className="w-2.5 h-2.5 fill-white translate-x-[0.5px]" />
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 space-y-1">
                        <span className="text-[8.5px] font-mono text-o1-crimson font-bold block">
                          {reel.exerciseFocus || 'Movement Cue'}
                        </span>
                        <h4 className="text-[11px] font-tactical font-bold text-white line-clamp-2 leading-tight">
                          {reel.title}
                        </h4>
                        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 pt-0.5">
                          <span>{reel.views && !/[kmb]$/i.test(String(reel.views).trim()) ? reel.views : '--'}</span>
                          <span>{reel.duration || '0:45'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: VERIFIED CLIENT REVIEWS */}
            {activeSection === 'reviews' && (
              <div className="space-y-2.5 pt-1">
                {reviews.length === 0 ? (
                  <p className="rounded-2xl border border-white/[0.07] bg-black px-3 py-3 text-xs text-[#F2EFE6]">
                    No reviews yet.
                  </p>
                ) : null}
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-2xl bg-o1-card border border-white/[0.07] space-y-2 shadow-sm text-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.08]">
                          <img src={rev.avatar} alt={rev.athleteName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold font-sans text-white">
                            {rev.athleteName}
                          </h5>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {rev.athleteHandle} • {rev.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>

                    <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-[10px] font-mono font-bold text-emerald-400">
                      Verified Enrollment: {rev.verifiedProgram}
                    </div>

                    <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixed Action Strip */}
        <div className="p-3.5 px-4 border-t border-white/[0.05] bg-black flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[9.5px] font-mono text-neutral-400 block">
              10% club share platform
            </span>
            <span className="text-xs font-mono font-bold text-white">
              Verified Trainer Vault
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerImpactPulse();
              if (displayPrograms.length > 0 && onSelectProgram) {
                onClose();
                onSelectProgram(displayPrograms[0]);
              } else if (onBookCoaching) {
                onClose();
                onBookCoaching(coach);
              }
            }}
            className="py-2.5 px-4 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-tactical font-black tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>View Top Protocol</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
