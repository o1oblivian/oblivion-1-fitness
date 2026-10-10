import React, { useState } from 'react';
import { Star, ShieldCheck, Users, Award, Dumbbell, Check, ArrowRight, Share2 } from 'lucide-react';
import { CoachProfile, CoachMarketplaceProgram, CoachReview } from '../types/coachPlatformTypes';
import { tactileEngine } from '../../../services/tactileEngine';

export interface CoachProfileShowcaseProps {
  coach: CoachProfile | null;
  programs: CoachMarketplaceProgram[];
  reviews: CoachReview[];
  onSelectProgram: (program: CoachMarketplaceProgram) => void;
  onBookCoaching: (planType: '1-on-1' | 'Team') => void;
  onOpenReviews: () => void;
  onOpenCoachProfile?: (coachId: string) => void;
}

export const CoachProfileShowcase: React.FC<CoachProfileShowcaseProps> = ({
  coach,
  programs = [],
  reviews = [],
  onSelectProgram,
  onBookCoaching,
  onOpenCoachProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'programs' | 'about' | 'reviews'>('programs');

  if (!coach) {
    return (
      <div className="w-full p-8 rounded-2xl bg-o1-card border border-white/[0.07] text-center space-y-3 shadow-xs select-none">
        <div className="w-12 h-12 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-center mx-auto text-neutral-500">
          <Dumbbell className="w-6 h-6 stroke-[1.8]" />
        </div>
        <div className="space-y-1">
          <h4 className="font-tactical font-black text-xs tracking-wider text-white">
            No coach protocols currently published
          </h4>
          <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
            There are no verified coach blueprints or protocols currently published in the database.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenCoachDossier = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    tactileEngine.triggerSelectionBuzz();
    if (onOpenCoachProfile) {
      onOpenCoachProfile(coach.id);
    }
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* 1. Coach Hero Banner & Identity Header */}
      <div className="relative rounded-2xl overflow-hidden bg-o1-card border border-white/[0.07] shadow-sm transition-colors">
        {/* Banner Cover */}
        <div className="h-28 sm:h-36 w-full relative overflow-hidden">
          <img
            src={coach.bannerImage}
            alt={coach.name}
            className="w-full h-full object-cover brightness-75 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.07] text-white text-[10px] font-tactical font-black tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified Master Coach</span>
          </div>
        </div>

        {/* Coach Details Overlay */}
        <div className="p-4 sm:p-5 pt-0 relative">
          <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-3">
            <div
              onClick={handleOpenCoachDossier}
              className="relative cursor-pointer group/avatar"
              title="Click to view coach physique & reels"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/[0.07] overflow-hidden shadow-xl bg-o1-well group-hover/avatar:border-o1-crimson transition-colors">
                <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover group-hover/avatar:scale-105 transition-transform" />
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white/[0.07]" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  if (navigator.share) {
                    navigator.share({ title: coach.name, text: coach.bio, url: window.location.href }).catch(() => {});
                  }
                }}
                className="p-2 rounded-xl bg-white/[0.08] border border-white/[0.07] text-neutral-300 hover:text-o1-crimson transition-colors cursor-pointer"
                title="Share Coach"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerImpactPulse();
                  if (programs && programs.length > 0) {
                    onSelectProgram(programs[0]);
                  } else {
                    onBookCoaching('1-on-1');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-95 text-white text-xs font-tactical font-black tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Hire Coach</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <div
              onClick={handleOpenCoachDossier}
              className="group/name inline-flex items-center gap-2 cursor-pointer"
              title="Click to view coach physique & reels"
            >
              <h2 className="text-lg sm:text-xl font-tactical font-black text-white tracking-wide group-hover/name:text-o1-crimson transition-colors">
                {coach.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-tactical text-o1-crimson font-black tracking-wide">{coach.handle}</span>
              <span className="text-neutral-700">•</span>
              <span className="text-xs text-neutral-400 font-sans font-medium">{coach.role}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#D4A017]/20 to-o1-crimson/20 border border-[#D4A017]/50 text-[#D4A017] text-[9.5px] font-mono font-bold ">
                <ShieldCheck className="w-2.5 h-2.5 text-[#D4A017] stroke-[2.5]" />
                <span>Gov id verified master coach</span>
              </span>
            </div>

            <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed font-sans">
              {coach.bio}
            </p>

            {/* Quick Trigger to Coach Physique & Reels */}
            <button
              type="button"
              onClick={handleOpenCoachDossier}
              className="mt-3 w-full py-2.5 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.06] border border-white/[0.07] text-xs font-tactical font-black tracking-wider text-white flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-o1-crimson" />
                <span>INSPECT PHYSIQUE, REELS & PRs</span>
              </span>
              <span className="text-xs font-tactical text-o1-crimson font-black tracking-wider">
                Dossier ↗
              </span>
            </button>
          </div>

          {/* Social Proof & Key Stats HUD */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.05]">
            <div className="text-center p-2 rounded-2xl bg-o1-well border border-white/[0.07]">
              <div className="flex items-center justify-center gap-1 text-amber-500 font-tactical font-black text-sm">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{coach.rating.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-tactical font-bold tracking-wider">
                {coach.reviewsCount} Reviews
              </span>
            </div>

            <div className="text-center p-2 rounded-2xl bg-o1-well border border-white/[0.07]">
              <div className="flex items-center justify-center gap-1 text-sky-400 font-tactical font-black text-sm">
                <Users className="w-3.5 h-3.5" />
                <span>{coach.activeClientsCount}</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-tactical font-bold tracking-wider">Active Roster</span>
            </div>

            <div className="text-center p-2 rounded-2xl bg-o1-well border border-white/[0.07]">
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-tactical font-black text-sm">
                <Award className="w-3.5 h-3.5" />
                <span>{(coach?.certifications ?? []).length}</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-tactical font-bold tracking-wider">Credentials</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs */}
      <div className="w-full bg-o1-card border border-white/[0.07] p-1.5 rounded-2xl flex items-center gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setActiveTab('programs');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-tactical font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'programs'
              ? 'bg-o1-crimson text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          PROGRAMS ({programs.length})
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setActiveTab('about');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-tactical font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'about'
              ? 'bg-o1-crimson text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Methodology
        </button>
        <button
          type="button"
          onClick={() => {
            tactileEngine.triggerSelectionBuzz();
            setActiveTab('reviews');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-tactical font-bold tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-o1-crimson text-white shadow-xs'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          REVIEWS ({reviews.length})
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* PROGRAMS STOREFRONT */}
      {activeTab === 'programs' && (
        <div className="space-y-3.5">
          {programs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-o1-card border border-white/[0.07] text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-o1-well border border-white/[0.07] flex items-center justify-center mx-auto text-neutral-500">
                <Dumbbell className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-tactical font-black text-xs tracking-wider text-white">
                  No coach protocols currently published
                </h4>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  There are no verified coach blueprints or protocols currently published in the database.
                </p>
              </div>
            </div>
          ) : (
            programs.map((prog) => (
            <div
              key={prog.id}
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                onSelectProgram(prog);
              }}
              className="group rounded-2xl bg-o1-card border border-white/[0.07] hover:border-o1-crimson/60 overflow-hidden shadow-sm transition-all cursor-pointer hover:shadow-xl active:scale-[0.99]"
            >
              {/* Cinematic Specular Visual Header */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-o1-well">
                <img
                  src={prog.coverImage}
                  alt={prog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/[0.07] text-[10px] font-mono font-bold text-white">
                    {prog.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-o1-crimson text-[9.5px] font-mono font-bold text-white">
                    {prog.difficulty}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/[0.07] text-amber-400 text-xs font-mono font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{prog.rating.toFixed(2)}</span>
                  <span className="text-neutral-400 text-[10px]">({prog.enrolledCount})</span>
                </div>

                {/* Floating Preview Video Pill & Duration */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.07] text-white text-[9.5px] font-mono font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-o1-crimson animate-pulse" />
                    Preview Video Cues ▷
                  </span>
                  <span className="text-[10px] font-mono text-neutral-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/[0.07]">
                    {prog.durationWeeks} WEEKS • {prog.daysPerWeek} DAYS/WK
                  </span>
                </div>
              </div>

              {/* Card Body & Outcome Spec */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-o1-crimson transition-colors font-tactical leading-snug">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-neutral-400 font-sans line-clamp-1">
                      {prog.tagline}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-mono font-black text-white block">
                      ${prog.priceUsd}.00
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400">ONE-TIME</span>
                  </div>
                </div>

                {/* Program Curriculum Highlights Micro-Bar */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[10px] font-mono text-neutral-400">
                    ⚡ Auto-Regulated RPE
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[10px] font-mono text-neutral-400">
                    📹 Kinematic Video Setup
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-[10px] font-mono text-neutral-400">
                    🔄 Instant Tab Sync
                  </span>
                </div>

                {/* THE TRUST ANCHOR: DEDICATED COACH ROW WITH CLICK TO DOSSIER */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    tactileEngine.triggerSelectionBuzz();
                    if (onOpenCoachProfile) {
                      onOpenCoachProfile(prog.coachId);
                    }
                  }}
                  className="p-2.5 rounded-2xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-o1-crimson shrink-0 bg-white/[0.08]">
                      <img
                        src={
                          prog.coachAvatar ||
                          coach.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={prog.coachName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-tactical font-bold text-white truncate">
                        Coach {prog.coachName}
                      </div>
                      <div className="text-[10px] font-mono text-o1-crimson truncate">
                        {prog.coachTitle || 'IFBB Pro • CSCS Coach'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-neutral-300 bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/[0.07] shrink-0 hover:text-o1-crimson transition">
                    View Physique & Reels ↗
                  </span>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-white/[0.05] text-[10px] font-mono text-neutral-400">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    10% Club Guarantee • {prog.enrolledCount} Active
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      tactileEngine.triggerImpactPulse();
                      onSelectProgram(prog);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-o1-crimson text-white font-tactical font-black text-xs tracking-wider flex items-center gap-1 hover:bg-o1-crimson-hover transition shadow-sm cursor-pointer"
                  >
                    <span>Explore Protocol</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
          )}

          {/* 1-on-1 Monthly Retainer Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 via-o1-well to-o1-card border border-o1-crimson/30 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-o1-crimson/30 border border-o1-crimson/50 text-[10px] font-tactical font-black tracking-widest text-o1-crimson">
                Vip Direct CO-PILOT
              </span>
              <span className="text-sm font-mono font-black text-white">
                ${coach.pricing.monthlyOneOnOneUsd}/mo
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold font-tactical tracking-wide">
                1-on-1 Custom Programming & Daily Check-Ins
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Receive personalized daily workout dispatches straight to your Workout tab, weekly kinematic audits, and priority encrypted messaging with {coach.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerImpactPulse();
                if (programs && programs.length > 0) {
                  onSelectProgram(programs[0]);
                } else {
                  onBookCoaching('1-on-1');
                }
              }}
              className="w-full py-2.5 rounded-2xl bg-o1-crimson hover:bg-o1-crimson-hover active:scale-[0.98] text-white text-xs font-tactical font-black tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Apply for 1-ON-1 roster spot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* METHODOLOGY & CREDENTIALS */}
      {activeTab === 'about' && (
        <div className="p-4 rounded-2xl bg-o1-card border border-white/[0.07] space-y-4 shadow-sm text-white">
          <div>
            <span className="text-[10px] font-tactical font-bold text-neutral-500 tracking-wider block mb-1">
              Coach Specialties
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(coach?.specialties ?? []).map((spec) => (
                <span
                  key={spec}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.08] border border-white/[0.07] text-xs font-mono font-semibold text-neutral-300"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.05]">
            <span className="text-[10px] font-tactical font-bold text-neutral-500 tracking-wider block mb-1">
              Accreditations & Credentials
            </span>
            <div className="space-y-1.5">
              {(coach?.certifications ?? []).map((cert) => (
                <div key={cert} className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.05] space-y-2">
            <span className="text-[10px] font-tactical font-bold text-neutral-500 tracking-wider block">
              Coaching Philosophy
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              "Every working set is an empirical kinematic assessment. We prioritize strict mechanical tension, length-tension curves, and autoregulation over mindless volume. Through daily dispatch synchronization, you receive exactly what your nervous system and muscle groups need each training day."
            </p>
          </div>
        </div>
      )}

      {/* VERIFIED REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-2.5">
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
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
              </div>

              <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-[10px] font-mono font-bold text-emerald-400">
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
  );
};
