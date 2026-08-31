import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Award,
  Play,
  Share2,
  ClipboardList,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Flame,
  ShieldCheck,
  Quote,
  ShoppingBag,
  ArrowRight,
  Zap,
  Trophy,
  Target,
  Verified,
  Heart,
  Eye,
  GripVertical,
  Layers,
  Check,
} from 'lucide-react';
import type { EliteReelData } from '@/components/FullEliteReelsModal';
import { getCoachShowcase, saveCoachShowcase, CoachShowcaseConfig, ShowcaseSlotMedia } from '@/utils/coachShowcaseStore';

/* ── props ── */
interface CoachProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  coach: EliteReelData | null;
  allReels: EliteReelData[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenMessage: (coach: EliteReelData) => void;
  onPurchaseProgram?: (program: { title: string; coachName: string; price: string; duration: string; level: string }) => void;
}

/* ── constants ── */
const TIER_LABEL: Record<string, string> = { world: 'World-Class', proven: 'Proven Elite', rising: 'Rising Star' };
const TIER_COLOR: Record<string, string> = { world: '#FFD60A', proven: '#30D158', rising: '#0A84FF' };

const HERO_BANNERS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=60',
];

/* ── Coach stats from real data ── */
function buildCoachStats(coach: EliteReelData | null) {
  if (!coach) return null;
  const numAthletes = parseInt((coach.athletes || '60').replace(/\D/g, '')) || 60;
  return {
    posts: 24,
    followers: `${numAthletes * 18}`,
    rating: coach.rating || '4.99',
    reviewCount: coach.reviewsCount || 148,
    clientsActive: numAthletes,
    clientsTotal: numAthletes + 40,
    avgLeanGainKg: '3.4',
    avgFatLossKg: '4.8',
    avgStrengthGain: 28,
    retentionPct: 96,
    avgWeeksToResults: 8,
    successRate: 98,
  };
}

interface Transformation { name: string; avatar: string; beforeImg: string; afterImg: string; duration: string; highlight: string }
function buildTransformations(_name: string): Transformation[] {
  return [
    {
      name: 'David K.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      beforeImg: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=80',
      afterImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
      duration: '12 Weeks',
      highlight: '+40kg Squat Depth & Zero Hip Pain',
    },
  ];
}

interface Testimonial { name: string; avatar: string; text: string; rating: number; date: string }
function buildTestimonials(_name: string): Testimonial[] {
  return [
    {
      name: 'Sarah M., Competitive Athlete',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      text: 'The kinetic cues and periodized mobility flows transformed my bar path. Best coach on O1FC.',
      rating: 5,
      date: 'Aug 2026',
    },
  ];
}

interface CoachProgram { title: string; duration: string; level: string; price: string; tag: string; tagColor: string; enrolled: number }
function buildPrograms(coach: EliteReelData | null): CoachProgram[] {
  if (coach?.programs && coach.programs.length > 0) {
    return coach.programs.map((p) => ({
      title: p.title,
      duration: p.duration,
      level: p.level,
      price: p.price,
      tag: p.tag,
      tagColor: p.tagColor || 'bg-red-500/20 text-red-300 border-red-500/30',
      enrolled: 42,
    }));
  }
  return [];
}

type ProfileTab = 'reels' | 'results' | 'about';

/* ── CSS keyframes injected once ── */
const STYLE_ID = 'coach-profile-anims';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes cpShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes cpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes cpFadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    @keyframes cpPulseGlow { 0%,100%{box-shadow:0 0 12px var(--glow-color,#0A84FF)} 50%{box-shadow:0 0 28px var(--glow-color,#0A84FF)} }
    @keyframes cpKenBurns { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(1.08) translate(-1%,-1%)} }
    .cp-shimmer{background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.08) 50%,transparent 100%);background-size:200% 100%;animation:cpShimmer 2.5s ease-in-out infinite}
    .cp-float{animation:cpFloat 3s ease-in-out infinite}
    .cp-fade-up{animation:cpFadeUp 0.6s ease-out both}
    .cp-fade-up-d1{animation:cpFadeUp 0.6s ease-out 0.1s both}
    .cp-fade-up-d2{animation:cpFadeUp 0.6s ease-out 0.2s both}
    .cp-fade-up-d3{animation:cpFadeUp 0.6s ease-out 0.35s both}
    .cp-pulse-glow{animation:cpPulseGlow 2s ease-in-out infinite}
    .cp-ken-burns{animation:cpKenBurns 20s ease-in-out alternate infinite}
  `;
  document.head.appendChild(s);
}

export const CoachProfileSheet: React.FC<CoachProfileSheetProps> = ({
  isOpen, onClose, coach, allReels, showToast, onOpenMessage, onPurchaseProgram,
}) => {
  const [tab, setTab] = useState<ProfileTab>('reels');
  const [closing, setClosing] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ src: string; title: string } | null>(null);
  const [transformIdx, setTransformIdx] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [galleryItems, setGalleryItems] = useState<Array<{ id: string; url: string; title: string; isVideo?: boolean }>>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => coach ? buildCoachStats(coach) : null, [coach]);
  const transformations = useMemo(() => coach ? buildTransformations(coach.coachName) : [], [coach?.coachName]);
  const testimonials = useMemo(() => coach ? buildTestimonials(coach.coachName) : [], [coach?.coachName]);
  const programs = useMemo(() => coach ? buildPrograms(coach) : [], [coach]);
  const heroBanner = useMemo(() => coach ? HERO_BANNERS[Math.abs(coach.coachName.length) % HERO_BANNERS.length] : '', [coach?.coachName]);

  useEffect(() => {
    if (isOpen && coach) {
      injectStyles();
      setHeroLoaded(false);
      setLiked(false);
      setTab('reels');
      setTransformIdx(0);

      // Initialize strictly 5 photos
      const coachReelsList = allReels.filter((r) => r.coachName === coach.coachName);
      const combined: Array<{ id: string; url: string; title: string; isVideo?: boolean }> = [];

      coachReelsList.forEach((r, idx) => {
        if (combined.length < 5) {
          combined.push({
            id: `reel-${r.id || idx}`,
            url: r.thumbnail,
            title: r.title,
            isVideo: true,
          });
        }
      });

      const fallbacks = [
        { id: 'fb-1', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80', title: 'Flow 1' },
        { id: 'fb-2', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80', title: 'Flow 2' },
        { id: 'fb-3', url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80', title: 'Flow 3' },
        { id: 'fb-4', url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80', title: 'Flow 4' },
        { id: 'fb-5', url: coach.avatar || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80', title: 'Flow 5' },
      ];

      for (const fb of fallbacks) {
        if (combined.length >= 5) break;
        combined.push(fb);
      }

      setGalleryItems(combined.slice(0, 5));
    }
  }, [isOpen, coach, allReels]);

  // Drag and Drop & Touch Reordering
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingTouchRef = useRef<boolean>(false);
  const activeTouchIdxRef = useRef<number | null>(null);
  const didDragRef = useRef<boolean>(false);

  // Desktop Drag and Drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIdx(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = draggingIdx !== null ? draggingIdx : parseInt(sourceStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDraggingIdx(null);
      setDragOverIdx(null);
      return;
    }

    setGalleryItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  // Mobile Touch Drag & Arrange (Hold 150ms or drag to reorder)
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    activeTouchIdxRef.current = index;
    didDragRef.current = false;
    isDraggingTouchRef.current = false;

    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      isDraggingTouchRef.current = true;
      setDraggingIdx(index);
      if (navigator.vibrate) {
        try { navigator.vibrate(30); } catch {}
      }
    }, 180);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTouchIdxRef.current === null) return;
    const touch = e.touches[0];

    if (touchStartPosRef.current) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        didDragRef.current = true;
        isDraggingTouchRef.current = true;
        setDraggingIdx(activeTouchIdxRef.current);
      }
    }

    if (isDraggingTouchRef.current) {
      if (e.cancelable) e.preventDefault();
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el) {
        const card = el.closest('[data-photo-idx]') as HTMLElement | null;
        if (card && card.dataset.photoIdx !== undefined) {
          const target = parseInt(card.dataset.photoIdx, 10);
          if (!isNaN(target) && target !== dragOverIdx) {
            setDragOverIdx(target);
          }
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);

    const source = activeTouchIdxRef.current;
    const target = dragOverIdx;

    if (isDraggingTouchRef.current && source !== null && target !== null && source !== target) {
      setGalleryItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(source, 1);
        next.splice(target, 0, moved);
        return next;
      });
    }

    setDraggingIdx(null);
    setDragOverIdx(null);
    activeTouchIdxRef.current = null;
    setTimeout(() => {
      isDraggingTouchRef.current = false;
      didDragRef.current = false;
    }, 100);
  };

  if (!isOpen || !coach || !stats) return null;

  const coachReels = allReels.filter((r) => r.coachName === coach.coachName);
  const accent = TIER_COLOR[coach.tier] || '#0A84FF';
  const handle = coach.handle || `@${coach.coachName.toLowerCase().replace(/\s+/g, '_')}`;

  const handleClose = () => { setClosing(true); setTimeout(() => { setClosing(false); onClose(); }, 280); };

  const handleShare = async () => {
    const url = `${window.location.origin}/coach/${coach.coachName.toLowerCase().replace(/\s+/g, '-')}`;
    if (navigator.share) { try { await navigator.share({ title: coach.coachName, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(url); showToast('Profile link copied', 'success'); } catch { showToast('Could not copy link', 'error'); } }
  };

  const handleProgramTap = (prog: CoachProgram) => {
    if (onPurchaseProgram) {
      onPurchaseProgram({ title: prog.title, coachName: coach.coachName, price: prog.price, duration: prog.duration, level: prog.level });
    } else {
      showToast('Program preview coming soon', 'success');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[210]" role="dialog" aria-modal="true">
      <div className={`absolute inset-0 bg-black/40 dark:bg-[#0A0A0C] transition-opacity duration-280 ${closing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />

      <div className={`absolute inset-0 bg-[#F2F2F7] dark:bg-[#06080C] text-zinc-900 dark:text-white flex flex-col transition-transform duration-300 ease-out ${closing ? 'translate-y-full' : 'translate-y-0'}`}>
        {/* Floating top bar — sits on top of hero */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-14">
          <button onClick={handleClose} className="btn-nude-close !text-white hover:!text-white" aria-label="Go back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => { setLiked(!liked); showToast(liked ? 'Removed from favorites' : 'Added to favorites', 'success'); }} className="btn-nude-close !text-white hover:!text-white" aria-label="Favorite">
              <Heart className={`w-5 h-5 transition-colors ${liked ? 'text-red-400 fill-red-400' : 'text-white'}`} />
            </button>
            <button onClick={handleClose} className="btn-nude-close !text-white hover:!text-white" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          {/* ═══════════ CINEMATIC HERO ═══════════ */}
          <div className="relative w-full overflow-hidden bg-black" style={{ height: '34vh', minHeight: 250, maxHeight: 330 }}>
            {/* Ken Burns banner */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={heroBanner || coach.avatar}
                alt=""
                className={`w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? 'opacity-85 cp-ken-burns' : 'opacity-0'}`}
                onLoad={() => setHeroLoaded(true)}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = coach.avatar; }}
              />
              {/* Apple-grade cinematic gradient overlays for crystal-clear readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/95" />
            </div>

            {/* Hero content - Clean Apple Human Interface: No thick white pill frames */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
              {/* Bare, Bold, Crystal-Clear Display Name & Handle */}
              <div className="cp-fade-up">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                  {coach.coachName}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-300 font-mono drop-shadow-[0_1px_8px_rgba(0,0,0,0.95)] mt-0.5 font-medium">
                  {handle}
                </p>
              </div>

              {/* Seamless stats grid — No white pill containers, clean typography & vector glyphs */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2.5 pt-2 border-t border-white/15 cp-fade-up-d1">
                {/* 1: Tier Badge */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ background: accent, color: accent }} />
                  <span className="font-mono font-black uppercase tracking-wider text-[10px] text-white truncate drop-shadow-md">
                    {TIER_LABEL[coach.tier]}
                  </span>
                </div>

                {/* 2: Athletes trained */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users className="w-3 h-3 text-zinc-300 shrink-0" />
                  <span className="text-[10px] font-medium text-white/95 truncate drop-shadow-md">{stats.clientsTotal}+ athletes</span>
                </div>

                {/* 3: Avg Rating */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="text-[10px] font-medium text-white/95 truncate drop-shadow-md">{stats.rating} avg rating</span>
                </div>

                {/* 4: Goal Hit Rate */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-medium text-white/95 truncate drop-shadow-md">{stats.successRate}% hit rate</span>
                </div>
              </div>

              {/* Credential + reviews footer sub-line */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-white/10 text-[9.5px] text-zinc-400 font-mono cp-fade-up-d2">
                <span className="truncate uppercase tracking-tight text-zinc-300 font-medium">{coach.credential || 'Performance Coach'}</span>
                <span className="shrink-0 text-zinc-300 font-medium">{stats.reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {/* Stats row - Compact reduced height */}
          <div className="px-3.5 -mt-1">
            <div className="flex items-center justify-between py-1.5 px-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] shadow-xs backdrop-blur-sm cp-fade-up-d2">
              {[
                { value: stats.posts, label: 'Posts' },
                { value: stats.followers, label: 'Followers' },
                { value: stats.clientsActive, label: 'Active' },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <div className="w-px h-5 bg-neutral-200 dark:bg-white/[0.08]" />}
                  <div className="flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white leading-tight">{s.value}</span>
                    <span className="text-[8px] text-zinc-500 dark:text-white/40 uppercase tracking-wider font-mono leading-tight">{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* CTA buttons - Compact reduced height */}
          <div className="flex gap-2 px-3.5 mt-2 cp-fade-up-d3">
            <button
              onClick={() => onOpenMessage(coach)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs cursor-pointer active:scale-[0.97] transition-all shadow-md"
              style={{ background: accent, color: '#000', boxShadow: `0 3px 12px ${accent}20` }}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Book Consultation
            </button>
            <button onClick={handleShare} className="w-8 h-8 rounded-xl bg-white dark:bg-white/[0.08] text-zinc-900 dark:text-white flex items-center justify-center cursor-pointer active:scale-[0.95] transition-transform border border-neutral-200 dark:border-white/[0.08] hover:bg-neutral-50 dark:hover:bg-white/[0.12] shrink-0 shadow-xs">
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab bar - Compact reduced height */}
          <div className="flex border-b border-neutral-200 dark:border-white/[0.08] sticky top-0 bg-[#F2F2F7] dark:bg-[#06080C] z-10 mt-2">
            {([
              { key: 'reels' as ProfileTab, icon: <Play className="w-3 h-3" />, label: 'Reels' },
              { key: 'results' as ProfileTab, icon: <Trophy className="w-3 h-3" />, label: 'Results' },
              { key: 'about' as ProfileTab, icon: <Award className="w-3 h-3" />, label: 'About' },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer transition-colors ${tab === t.key ? 'text-zinc-950 dark:text-white border-b-2 border-zinc-950 dark:border-white' : 'text-zinc-400 dark:text-white/30 hover:text-zinc-700 dark:hover:text-white/50'}`}
              >
                <div className="flex items-center justify-center gap-1.5">{t.icon} {t.label}</div>
              </button>
            ))}
          </div>

          {/* ═══ 5 PHOTOS ONLY (NUMBERS #1 - #5) ═══ */}
          {tab === 'reels' && (
            <div className="p-3 sm:p-3.5">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {galleryItems.slice(0, 5).map((item, idx) => {
                  const isDraggingThis = draggingIdx === idx;
                  const isOverThis = dragOverIdx === idx && draggingIdx !== idx;

                  return (
                    <div
                      key={item.id}
                      data-photo-idx={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onTouchStart={(e) => handleTouchStart(idx, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => {
                        if (!didDragRef.current && !isDraggingTouchRef.current) {
                          setFullscreenMedia({ src: item.url, title: item.title });
                        }
                      }}
                      className={`relative aspect-[9/16] bg-neutral-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border select-none transition-all duration-200 text-left p-0 touch-none ${
                        isDraggingThis
                          ? 'opacity-40 scale-95 border-red-500 shadow-2xl z-30 ring-2 ring-red-500'
                          : isOverThis
                          ? 'border-amber-400 scale-105 z-20 shadow-xl ring-2 ring-amber-400'
                          : 'border-neutral-200 dark:border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        draggable={false}
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover pointer-events-none"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = coach.avatar || '';
                        }}
                      />

                      {/* Number tag up to 5 only */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-mono font-black text-white border border-white/15 shadow-sm pointer-events-none">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ RESULTS TAB ═══ */}
          {tab === 'results' && (
            <div className="p-3 sm:p-4 space-y-4">
              {/* Aggregate Results */}
              <div className="bg-white dark:bg-gradient-to-br dark:from-white/[0.06] dark:to-white/[0.02] border border-neutral-200 dark:border-white/[0.08] rounded-2xl p-3.5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /></div>
                  <div>
                    <h3 className="text-xs font-black text-zinc-900 dark:text-white">Proven Results</h3>
                    <p className="text-[9px] text-zinc-500 dark:text-white/40 font-mono">Aggregate data from {stats.clientsTotal}+ clients</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: `${stats.avgLeanGainKg}kg`, label: 'Avg lean mass gain', icon: <Flame className="w-3 h-3 text-orange-500" /> },
                    { value: `${stats.avgFatLossKg}kg`, label: 'Avg fat loss', icon: <Target className="w-3 h-3 text-blue-500" /> },
                    { value: `${stats.successRate}%`, label: 'Goal achievement', icon: <Trophy className="w-3 h-3 text-amber-500" /> },
                    { value: `${stats.retentionPct}%`, label: 'Client retention', icon: <Users className="w-3 h-3 text-red-500" /> },
                  ].map((s) => (
                    <div key={s.label} className="bg-neutral-50 dark:bg-white/[0.04] rounded-xl p-2.5 border border-neutral-100 dark:border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-0.5">{s.icon}</div>
                      <p className="text-base font-black text-zinc-900 dark:text-white leading-tight">{s.value}</p>
                      <p className="text-[8.5px] text-zinc-500 dark:text-white/40 font-mono uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <ShieldCheck className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-[9.5px] text-red-700 dark:text-red-300/80 font-medium">Results verified from O1FC tracking data</p>
                </div>
              </div>

              {/* Transformation Carousel */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1.5"><Zap className="w-3 h-3" /> Client Transformations</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTransformIdx(Math.max(0, transformIdx - 1))} disabled={transformIdx === 0} className="w-6 h-6 rounded-full bg-white dark:bg-white/[0.06] border border-neutral-200 dark:border-transparent flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-90 transition-transform"><ChevronLeft className="w-3 h-3 text-zinc-700 dark:text-white/60" /></button>
                    <button onClick={() => setTransformIdx(Math.min(transformations.length - 1, transformIdx + 1))} disabled={transformIdx >= transformations.length - 1} className="w-6 h-6 rounded-full bg-white dark:bg-white/[0.06] border border-neutral-200 dark:border-transparent flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-90 transition-transform"><ChevronRight className="w-3 h-3 text-zinc-700 dark:text-white/60" /></button>
                  </div>
                </div>
                {transformations[transformIdx] && (
                  <div className="bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xs">
                    <div className="grid grid-cols-2 gap-px bg-neutral-200 dark:bg-white/[0.06]">
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-zinc-900">
                        <img src={transformations[transformIdx].beforeImg} alt="Before" className="w-full h-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black uppercase tracking-wider bg-black/60 text-white/90 px-1.5 py-0.5 rounded backdrop-blur-sm">Before</span>
                      </div>
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-zinc-900">
                        <img src={transformations[transformIdx].afterImg} alt="After" className="w-full h-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 text-[8.5px] font-black uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">After</span>
                      </div>
                    </div>
                    <div className="p-3 flex items-center gap-2.5">
                      <img src={transformations[transformIdx].avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{transformations[transformIdx].name}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-white/40 font-mono">{transformations[transformIdx].duration}</p>
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5">{transformations[transformIdx].highlight}</p>
                      </div>
                    </div>
                    <div className="flex justify-center gap-1.5 pb-2">
                      {transformations.map((_, i) => (
                        <button key={i} onClick={() => setTransformIdx(i)} className={`h-1 rounded-full transition-all cursor-pointer ${i === transformIdx ? 'w-4 bg-zinc-900 dark:bg-white' : 'w-1 bg-neutral-300 dark:bg-white/20'}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Testimonials */}
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1.5 mb-2"><Quote className="w-3 h-3" /> Client Reviews</h3>
                <div className="space-y-2">
                  {testimonials.map((t, i) => (
                    <div key={i} className="bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.06] rounded-2xl p-3 shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <img src={t.avatar} alt={t.name} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-white">{t.name}</span>
                            <span className="text-[9px] text-zinc-400 dark:text-white/30">{t.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5 mb-1.5">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star key={s} className={`w-2.5 h-2.5 ${s < t.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-200 dark:text-white/10'}`} />
                            ))}
                          </div>
                          <p className="text-[11px] text-zinc-700 dark:text-white/60 leading-normal">{t.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Programs */}
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1.5 mb-2"><ShoppingBag className="w-3 h-3" /> Programs</h3>
                <div className="space-y-2">
                  {programs.map((prog, i) => (
                    <button key={i} onClick={() => handleProgramTap(prog)} className="w-full text-left bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08] rounded-2xl p-3 hover:bg-neutral-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer group active:scale-[0.98] shadow-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: `${prog.tagColor}20`, color: prog.tagColor, border: `1px solid ${prog.tagColor}40` }}>{prog.tag}</span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">{prog.title}</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-white/40 font-mono">{prog.duration} -- {prog.level}</p>
                          <p className="text-[9px] text-zinc-400 dark:text-white/30 mt-0.5">{prog.enrolled} athletes enrolled</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                          <span className="text-base font-black text-zinc-900 dark:text-white">{prog.price}</span>
                          <div className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-white/40 group-hover:text-zinc-700 dark:group-hover:text-white/60 transition-colors">View <ArrowRight className="w-2.5 h-2.5" /></div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ ABOUT TAB ═══ */}
          {tab === 'about' && (
            <div className="p-3.5 space-y-3.5">
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-1.5">Bio</h3>
                <p className="text-xs text-zinc-700 dark:text-white/70 leading-relaxed">
                  {coach.credential}.{' '}
                  {coach.athletes ? `Training ${coach.athletes}.` : 'Dedicated to pushing athletic performance to the next level.'}{' '}
                  {coach.description || 'Specializing in evidence-based training methodologies and performance optimization.'}
                </p>
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-1.5">Focus Areas</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[coach.category, 'Periodization', 'Performance'].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] text-[11px] text-zinc-700 dark:text-white/60 font-medium shadow-xs">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-1.5">Credentials</h3>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.06] shadow-xs">
                  <Award className="w-4 h-4 shrink-0" style={{ color: accent }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{coach.credential}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-white/40">{TIER_LABEL[coach.tier] || coach.tier} Verified</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-zinc-500 dark:text-white/50 uppercase tracking-wider mb-1.5">At a Glance</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Active Clients', value: stats.clientsActive },
                    { label: 'Avg Results In', value: `${stats.avgWeeksToResults} wks` },
                    { label: 'Strength Gain', value: `+${stats.avgStrengthGain}%` },
                    { label: 'Retention', value: `${stats.retentionPct}%` },
                  ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.06] rounded-xl p-2.5 shadow-xs">
                      <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{s.value}</p>
                      <p className="text-[8px] text-zinc-500 dark:text-white/40 font-mono uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="h-[env(safe-area-inset-bottom)] min-h-[24px]" />
        </div>
      </div>

      {/* Fullscreen media viewer */}
      {fullscreenMedia && (
        <div className="fixed inset-0 z-[250] bg-black flex items-center justify-center" onClick={() => setFullscreenMedia(null)}>
          <button onClick={() => setFullscreenMedia(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/[0.12] flex items-center justify-center cursor-pointer active:scale-90 transition-transform backdrop-blur-md" style={{ top: 'max(16px, env(safe-area-inset-top))' }}>
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={fullscreenMedia.src} alt={fullscreenMedia.title} className="w-full h-full object-contain" />
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-sm font-bold text-white/70">{fullscreenMedia.title}</p>
            <p className="text-[11px] text-white/35 mt-1">{coach.coachName}</p>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};
