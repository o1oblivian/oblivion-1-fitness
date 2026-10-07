import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  User,
  Heart,
  Dumbbell,
  Flame,
  Shield,
  MapPin,
  Check,
  CheckCircle2,
  Plus,
  Eye,
  Star,
} from 'lucide-react';
import {
  useBuddyProfileStore,
  BuddyIntent,
  LookingFor,
  ExperienceLevel,
  DEFAULT_BUDDY_PHOTOS,
} from '../../../stores/useBuddyProfileStore';
import { useRadarStore } from '../../../stores/useRadarStore';
import { useRoleStore } from '../../../stores/useRoleStore';
import { PhotoVaultModal } from '../../log/components/PhotoVaultModal';
import { CoachVaultModal } from '../../coach/components/CoachVaultModal';
import { tactileEngine } from '../../../services/tactileEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyAndScan?: () => void;
  initialTab?: 'PROFILE' | 'FILTERS' | 'PREVIEW';
}

const DISCIPLINES_LIST = [
  'Hypertrophy',
  'Hyrox',
  'Powerlifting',
  'CrossFit',
  'Running',
  'Calisthenics',
  'Olympic Lifting',
  'Endurance',
];

const TIME_WINDOWS = [
  'Early Bird (5-7 AM)',
  'Morning (7-9 AM)',
  'Midday (11 AM-1 PM)',
  'Evening (5-8 PM)',
  'Late Night (8-11 PM)',
  'Weekends Only',
];

export const RadarProfileStudioModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyAndScan,
  initialTab = 'PROFILE',
}) => {
  const buddy = useBuddyProfileStore();
  const radar = useRadarStore();
  const role = useRoleStore((s) => s.role);

  // Top Section: 'PROFILE' (Edit Profile) vs 'FILTERS'
  const [topTab, setTopTab] = useState<'PROFILE' | 'FILTERS'>(
    initialTab === 'FILTERS' ? 'FILTERS' : 'PROFILE'
  );

  // Profile View Mode: 'EDIT' vs 'PREVIEW' (toggled from bottom Preview capsule)
  const [profileViewMode, setProfileViewMode] = useState<'EDIT' | 'PREVIEW'>(
    initialTab === 'PREVIEW' ? 'PREVIEW' : 'EDIT'
  );

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);

  // Pointer Hold & Drag State
  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [hoverDropIdx, setHoverDropIdx] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<number | null>(null);
  const [activeAgeThumb, setActiveAgeThumb] = useState<'min' | 'max'>('min');

  const dragSourceIdx = useRef<number | null>(null);
  const hoverDropIdxRef = useRef<number | null>(null);
  const pointerStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const cachedSlotRects = useRef<{ left: number; top: number; right: number; bottom: number }[]>([]);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-repair corrupt age ranges (e.g. max < min)
  useEffect(() => {
    if (buddy.ageRangeMax < buddy.ageRangeMin || buddy.ageRangeMax < 18) {
      const repairedMin = Math.max(18, Math.min(buddy.ageRangeMin || 20, 69));
      const repairedMax = Math.max(repairedMin + 1, 38);
      buddy.setAgeRange(repairedMin, repairedMax);
    }
  }, [buddy.ageRangeMin, buddy.ageRangeMax]);

  if (!isOpen) return null;

  const currentPhotos = buddy.buddyPhotos || [];

  // DIRECT ACCESS TO MASTER VAULT
  const handleOpenMasterVault = () => {
    tactileEngine.triggerSelectionBuzz();
    setIsVaultOpen(true);
  };

  // Cache bounding rects for collision detection
  const updateSlotRects = () => {
    cachedSlotRects.current = slotRefs.current.map((el) => {
      if (!el) return { left: 0, top: 0, right: 0, bottom: 0 };
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    });
  };

  // Pointer Down (Mobile Touch & Mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    dragSourceIdx.current = idx;
    hoverDropIdxRef.current = idx;
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    updateSlotRects();
    setActiveDragIdx(idx);
    setHoverDropIdx(idx);
    setDragOffset({ x: 0, y: 0 });
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragSourceIdx.current === null) return;

    const dx = e.clientX - pointerStartPos.current.x;
    const dy = e.clientY - pointerStartPos.current.y;

    if (!hasMovedRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasMovedRef.current = true;
      tactileEngine.triggerLightTick();
    }

    if (hasMovedRef.current) {
      setDragOffset({ x: dx, y: dy });

      // Closest slot detection across photo slots
      const x = e.clientX;
      const y = e.clientY;
      let closestIdx = dragSourceIdx.current;
      let minDistance = Infinity;

      for (let i = 0; i < currentPhotos.length; i++) {
        const rect = cachedSlotRects.current[i];
        if (!rect || (rect.left === 0 && rect.right === 0)) continue;
        const centerX = (rect.left + rect.right) / 2;
        const centerY = (rect.top + rect.bottom) / 2;
        const dist = Math.hypot(x - centerX, y - centerY);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      if (closestIdx !== null && closestIdx !== hoverDropIdxRef.current) {
        hoverDropIdxRef.current = closestIdx;
        setHoverDropIdx(closestIdx);
        tactileEngine.triggerLightTick();
      }
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const source = dragSourceIdx.current;
    const target = hoverDropIdxRef.current;

    if (source !== null) {
      if (hasMovedRef.current && target !== null && target !== source) {
        // Successful drop & reorder
        tactileEngine.playPRCelebration();
        buddy.reorderBuddyPhotos(source, target);
      } else if (!hasMovedRef.current) {
        // Clean tap/click -> Tap to swap
        handleSlotTap(idx);
      }
    }

    dragSourceIdx.current = null;
    hoverDropIdxRef.current = null;
    hasMovedRef.current = false;
    setActiveDragIdx(null);
    setHoverDropIdx(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Pointer Cancel
  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    dragSourceIdx.current = null;
    hoverDropIdxRef.current = null;
    hasMovedRef.current = false;
    setActiveDragIdx(null);
    setHoverDropIdx(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Tap-to-swap fallback
  const handleSlotTap = (idx: number) => {
    if (selectedSlotForSwap === null) {
      setSelectedSlotForSwap(idx);
      tactileEngine.triggerSelectionBuzz();
    } else if (selectedSlotForSwap === idx) {
      setSelectedSlotForSwap(null);
    } else {
      tactileEngine.triggerDialHaptic();
      buddy.reorderBuddyPhotos(selectedSlotForSwap, idx);
      setSelectedSlotForSwap(null);
    }
  };

  // Toggle Preview / Edit from Bottom Capsule
  const handleTogglePreview = () => {
    tactileEngine.triggerSelectionBuzz();
    if (profileViewMode === 'PREVIEW') {
      setProfileViewMode('EDIT');
    } else {
      setTopTab('PROFILE');
      setProfileViewMode('PREVIEW');
    }
  };

  // Done action from Bottom Capsule
  const handleDone = () => {
    tactileEngine.playPRCelebration();
    radar.setRadius(buddy.maxDistanceKm);
    radar.handleRescan();
    onApplyAndScan?.();
    onClose();
  };

  const intents: { id: BuddyIntent; label: string; desc: string; icon: any }[] = [
    {
      id: 'both',
      label: 'Workout & Dating',
      desc: 'Training accountability and romantic dating',
      icon: Heart,
    },
    {
      id: 'partner',
      label: 'Workout Partner Only',
      desc: 'Pure fitness spotter and gym training partner',
      icon: Dumbbell,
    },
    {
      id: 'dating',
      label: 'Fitness Dating',
      desc: 'Lifestyle dating with active athletes',
      icon: Flame,
    },
    {
      id: 'hyrox',
      label: 'Hyrox / Race Team',
      desc: 'Doubles competition pairs & endurance race training',
      icon: Star,
    },
    {
      id: 'spotter',
      label: 'Heavy Barbell Spotter',
      desc: 'Safety spots on heavy bench, squat & barbell sets',
      icon: Shield,
    },
  ];

  const distancePresets = [5, 10, 25, 50, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-200 select-none">
      <div className="o1-sheet-card bg-o1-card border border-white/[0.07] shadow-xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-4 py-3 border-b border-white/[0.05] bg-o1-card/95 backdrop-blur-sm flex items-center justify-between shrink-0">
          <h2 className="text-sm font-tactical font-black uppercase tracking-wider text-white">
            {topTab === 'PROFILE' ? 'Edit Profile' : 'Filters'}
          </h2>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOP SEGMENTED CONTROL: [ Edit Profile | Filters ] */}
        <div className="px-4 pt-3 pb-2.5 bg-o1-card border-b border-white/[0.05] shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-o1-well border border-white/[0.07]">
            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setTopTab('PROFILE');
                setProfileViewMode('EDIT');
              }}
              className={`py-2 rounded-xl text-xs font-tactical font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                topTab === 'PROFILE'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-o1-crimson" />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                tactileEngine.triggerSelectionBuzz();
                setTopTab('FILTERS');
              }}
              className={`py-2 rounded-xl text-xs font-tactical font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                topTab === 'FILTERS'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-o1-crimson" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-white">
          {/* ========================================================================= */}
          {/* TAB: EDIT PROFILE (When View Mode is EDIT)                                */}
          {/* ========================================================================= */}
          {topTab === 'PROFILE' && profileViewMode === 'EDIT' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Profile Photos Grid */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                      Profile Photos ({currentPhotos.length}/6)
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-sans">
                      Hold and drag to arrange · Tap to swap
                    </p>
                  </div>
                  {/* DIRECTLY OPENS MASTER VAULT */}
                  <button
                    type="button"
                    onClick={handleOpenMasterVault}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-o1-crimson/10 hover:bg-o1-crimson/20 text-o1-crimson border border-o1-crimson/30 text-xs font-tactical font-bold transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* 6 Photo Slots: Hardware-accelerated Pointer Drag & Drop */}
                <div className="grid grid-cols-3 gap-2 relative">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const imgUrl = currentPhotos[idx];
                    const isDraggingThis = activeDragIdx === idx;
                    const isHoverTarget = hoverDropIdx === idx && activeDragIdx !== null && activeDragIdx !== idx;
                    const isSelected = selectedSlotForSwap === idx;

                    if (!imgUrl) {
                      return (
                        <button
                          key={`empty-${idx}`}
                          ref={(el) => {
                            slotRefs.current[idx] = el as any;
                          }}
                          type="button"
                          onClick={handleOpenMasterVault}
                          className="aspect-[3/4] rounded-2xl bg-o1-card hover:bg-o1-well flex flex-col items-center justify-center p-2 text-center transition-colors cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-full bg-white/[0.08] group-hover:bg-o1-crimson/20 flex items-center justify-center text-neutral-500 group-hover:text-o1-crimson transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        </button>
                      );
                    }

                    return (
                      <div
                        key={`photo-${idx}`}
                        ref={(el) => {
                          slotRefs.current[idx] = el;
                        }}
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={(e) => handlePointerUp(e, idx)}
                        onPointerCancel={handlePointerCancel}
                        style={{
                          touchAction: 'none',
                          transform: isDraggingThis
                            ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(1.06)`
                            : isHoverTarget
                            ? 'scale(0.96)'
                            : 'none',
                          zIndex: isDraggingThis ? 40 : 1,
                        }}
                        className={`aspect-[3/4] rounded-2xl relative overflow-hidden bg-o1-well select-none cursor-grab active:cursor-grabbing transition-transform ${
                          isDraggingThis
                            ? 'shadow-2xl ring-2 ring-o1-crimson opacity-90'
                            : isHoverTarget
                            ? 'ring-2 ring-emerald-500'
                            : isSelected
                            ? 'ring-2 ring-o1-crimson'
                            : ''
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover pointer-events-none select-none"
                          draggable={false}
                        />

                        {/* Minimalist Delete Button with Reliable Touch Target */}
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          onPointerUp={(e) => {
                            e.stopPropagation();
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            tactileEngine.triggerSelectionBuzz();
                            buddy.removeBuddyPhoto(idx);
                          }}
                          aria-label={`Remove photo ${idx + 1}`}
                          className="absolute top-1 right-1 z-30 p-1.5 cursor-pointer touch-manipulation group/del"
                        >
                          <div className="w-5.5 h-5.5 rounded-full bg-black/80 hover:bg-o1-crimson text-white flex items-center justify-center transition-colors shadow-md active:scale-90">
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* About Me (Bio) */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                    About Me
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {buddy.partnerBio.length}/300
                  </span>
                </div>

                <textarea
                  value={buddy.partnerBio}
                  onChange={(e) => buddy.setPartnerBio(e.target.value.slice(0, 300))}
                  rows={3}
                  placeholder="Share a little about your fitness routine, lifestyle, and what kind of partner or workout buddy you're looking for..."
                  className="w-full bg-o1-well border border-white/[0.07] rounded-xl p-3 text-xs text-white placeholder:text-neutral-400 focus:outline-none focus:border-o1-crimson transition leading-relaxed resize-none"
                />
              </div>

              {/* Basic Info */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                  Basic Info
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                      Name
                    </label>
                    <input
                      type="text"
                      value={buddy.displayName}
                      onChange={(e) => buddy.setDisplayName(e.target.value)}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-o1-crimson"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold">
                      Age
                    </label>
                    <input
                      type="number"
                      value={buddy.age}
                      onChange={(e) => buddy.setAge(parseInt(e.target.value) || 18)}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-o1-crimson"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-o1-crimson" />
                    <span>Home Gym</span>
                  </label>
                  <input
                    type="text"
                    value={buddy.homeGym}
                    onChange={(e) => buddy.setHomeGym(e.target.value)}
                    placeholder="e.g. Oblivion 1 • Downtown, Equinox..."
                    className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-o1-crimson"
                  />
                </div>

                {/* Experience Level */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Beginner', 'Intermediate', 'Advanced', 'Elite'] as ExperienceLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => buddy.setExperienceLevel(lvl)}
                        className={`py-1.5 rounded-xl font-mono text-[10.5px] font-bold transition cursor-pointer ${
                          buddy.experienceLevel === lvl
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'bg-o1-well text-neutral-400 hover:text-white border border-white/[0.07]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fitness Disciplines */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-neutral-400 font-bold block">
                    Fitness Interests
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DISCIPLINES_LIST.map((d) => {
                      const isSelected = buddy.selectedDisciplines.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            tactileEngine.triggerDialHaptic();
                            const current = buddy.selectedDisciplines;
                            const next = isSelected
                              ? current.filter((item) => item !== d)
                              : [...current, d];
                            buddy.setSelectedDisciplines(next);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-o1-crimson text-white shadow-xs'
                              : 'bg-o1-well text-neutral-400 border border-white/[0.07] hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                  Display Preferences
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-o1-well border border-white/[0.07] cursor-pointer">
                    <span className="text-xs font-medium text-neutral-200">
                      Show Lift PRs (Squat, Bench, Deadlift)
                    </span>
                    <input
                      type="checkbox"
                      checked={buddy.showLiftsOnRadar}
                      onChange={() => buddy.toggleShowLifts()}
                      className="accent-o1-crimson w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-o1-well border border-white/[0.07] cursor-pointer">
                    <span className="text-xs font-medium text-neutral-200">
                      Show Weekly Training Volume
                    </span>
                    <input
                      type="checkbox"
                      checked={buddy.showVolumeOnRadar}
                      onChange={() => buddy.toggleShowVolume()}
                      className="accent-o1-crimson w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PREVIEW PROFILE (When View Mode is PREVIEW)                           */}
          {/* ========================================================================= */}
          {topTab === 'PROFILE' && profileViewMode === 'PREVIEW' && (
            <div className="space-y-4 animate-in fade-in duration-150 pb-2">
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[3/4.6] w-72 mx-auto shadow-2xl border border-white/[0.07] select-none">
                <img
                  src={currentPhotos[previewPhotoIndex] || currentPhotos[0] || DEFAULT_BUDDY_PHOTOS[0]}
                  alt="Profile preview"
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {/* Photo Pagination Dots at Top */}
                <div className="absolute top-2.5 inset-x-3 flex gap-1 z-20">
                  {currentPhotos.map((_, dotIdx) => (
                    <button
                      key={`dot-${dotIdx}`}
                      type="button"
                      onClick={() => setPreviewPhotoIndex(dotIdx)}
                      className={`h-1 flex-1 rounded-full transition-all cursor-pointer ${
                        previewPhotoIndex === dotIdx ? 'bg-white shadow-xs' : 'bg-white/35'
                      }`}
                    />
                  ))}
                </div>

                {/* Compatibility Beacon Badge */}
                <div className="absolute top-6 left-3 z-10">
                  <div className="bg-black/80 backdrop-blur-md border border-white/[0.07] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>99% MATCH</span>
                  </div>
                </div>

                {/* Bottom Shadow Gradient & Details */}
                <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

                <div className="absolute bottom-3 inset-x-3 z-10 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-tactical font-black text-white uppercase tracking-tight">
                      {buddy.displayName || 'Jordan Vance'}, {buddy.age || 27}
                    </h4>
                    {buddy.isVerifiedBadge && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                    )}
                  </div>

                  <div className="text-[10px] text-neutral-300 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-o1-crimson shrink-0" />
                    <span>{buddy.homeGym || 'Oblivion 1 • Downtown'} • 0.8 km away</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-o1-crimson text-white text-[9px] font-tactical font-bold uppercase">
                      {buddy.intent === 'both'
                        ? 'Workout & Dating'
                        : buddy.intent === 'partner'
                        ? 'Training Partner'
                        : buddy.intent === 'dating'
                        ? 'Fitness Dating'
                        : 'Race Team'}
                    </span>
                    {buddy.selectedDisciplines.slice(0, 2).map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[9px] font-mono font-semibold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <p className="text-[10.5px] text-neutral-300 font-sans line-clamp-2 leading-tight pt-0.5">
                    "{buddy.partnerBio}"
                  </p>

                  {/* PR Telemetry Box */}
                  {buddy.showLiftsOnRadar && (
                    <div className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.07] grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[8px] text-neutral-400 uppercase block">Squat</span>
                        <span className="text-[10px] font-bold text-white">180 KG</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-neutral-400 uppercase block">Bench</span>
                        <span className="text-[10px] font-bold text-white">140 KG</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-neutral-400 uppercase block">Deadlift</span>
                        <span className="text-[10px] font-bold text-white">225 KG</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: FILTERS                                                              */}
          {/* ========================================================================= */}
          {topTab === 'FILTERS' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Intent */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <div>
                  <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                    Relationship &amp; Partner Intent
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-sans">
                    Find athletes looking for the same thing
                  </p>
                </div>

                <div className="space-y-2">
                  {intents.map((item) => {
                    const isSelected = buddy.intent === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => buddy.setIntent(item.id)}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer text-left bg-o1-well ${
                          isSelected
                            ? 'border-o1-crimson'
                            : 'border-white/[0.07] hover:border-white/[0.14]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isSelected
                                ? 'bg-o1-crimson text-white'
                                : 'bg-white/[0.08] text-neutral-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-tactical font-bold text-white block">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-sans block">
                              {item.desc}
                            </span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-o1-crimson" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Looking For */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-2.5 shadow-xs">
                <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                  Looking For
                </h3>
                <div className="grid grid-cols-3 gap-2 bg-o1-well p-1 rounded-2xl border border-white/[0.07]">
                  {(
                    [
                      { id: 'all', label: 'Everyone' },
                      { id: 'women', label: 'Women' },
                      { id: 'men', label: 'Men' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => buddy.setLookingFor(opt.id)}
                      className={`py-2 rounded-xl text-xs font-tactical font-bold transition-all cursor-pointer ${
                        buddy.lookingFor === opt.id
                          ? 'bg-o1-crimson text-white shadow-xs'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maximum Distance */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                    Maximum Distance
                  </h3>
                  <span className="text-xs font-mono font-bold text-o1-crimson">
                    {buddy.maxDistanceKm} km
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={buddy.maxDistanceKm}
                  onChange={(e) => buddy.setMaxDistanceKm(parseInt(e.target.value))}
                  className="w-full accent-o1-crimson cursor-pointer"
                />

                <div className="flex justify-between gap-1">
                  {distancePresets.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => buddy.setMaxDistanceKm(dist)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition cursor-pointer ${
                        buddy.maxDistanceKm === dist
                          ? 'bg-o1-crimson text-white'
                          : 'bg-o1-well text-neutral-400 hover:text-white border border-white/[0.07]'
                      }`}
                    >
                      {dist}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range - Tinder & Bumble Style Dual-Handle Slider Bar */}
              {(() => {
                const MIN_AGE = 18;
                const MAX_AGE = 70;
                const rawMin = typeof buddy.ageRangeMin === 'number' && !isNaN(buddy.ageRangeMin) ? buddy.ageRangeMin : 20;
                const rawMax = typeof buddy.ageRangeMax === 'number' && !isNaN(buddy.ageRangeMax) ? buddy.ageRangeMax : 38;
                const safeMin = Math.max(MIN_AGE, Math.min(rawMin, MAX_AGE - 1));
                const safeMax = Math.max(safeMin + 1, Math.min(Math.max(rawMax, safeMin + 1), MAX_AGE));

                return (
                  <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                        Age Range
                      </h3>
                      <span className="text-xs font-mono font-bold text-o1-crimson">
                        Between {safeMin} and {safeMax}{safeMax >= MAX_AGE ? '+' : ''}
                      </span>
                    </div>

                    <div className="relative w-full h-8 flex items-center select-none pt-1">
                      {/* Inactive Base Track */}
                      <div className="absolute left-0 right-0 h-1.5 bg-white/[0.08] rounded-full" />

                      {/* Active Connecting Bar */}
                      <div
                        className="absolute h-1.5 bg-o1-crimson rounded-full pointer-events-none"
                        style={{
                          left: `${((safeMin - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`,
                          width: `${((safeMax - safeMin) / (MAX_AGE - MIN_AGE)) * 100}%`,
                        }}
                      />

                      {/* Min Age Handle */}
                      <input
                        type="range"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={safeMin}
                        onChange={(e) => {
                          const nextMin = Math.min(Number(e.target.value), safeMax - 1);
                          setActiveAgeThumb('min');
                          buddy.setAgeRange(nextMin, safeMax);
                        }}
                        className="dual-range-input absolute w-full h-1.5 bg-transparent pointer-events-none appearance-none cursor-pointer"
                        style={{ zIndex: activeAgeThumb === 'min' ? 5 : 3 }}
                        aria-label="Minimum Age"
                      />

                      {/* Max Age Handle */}
                      <input
                        type="range"
                        min={MIN_AGE}
                        max={MAX_AGE}
                        value={safeMax}
                        onChange={(e) => {
                          const nextMax = Math.max(Number(e.target.value), safeMin + 1);
                          setActiveAgeThumb('max');
                          buddy.setAgeRange(safeMin, nextMax);
                        }}
                        className="dual-range-input absolute w-full h-1.5 bg-transparent pointer-events-none appearance-none cursor-pointer"
                        style={{ zIndex: activeAgeThumb === 'max' ? 5 : 4 }}
                        aria-label="Maximum Age"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-0.5">
                      <span>18</span>
                      <span>25</span>
                      <span>35</span>
                      <span>50</span>
                      <span>70+</span>
                    </div>
                  </div>
                );
              })()}

              {/* Workout Schedule */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-2.5 shadow-xs">
                <h3 className="text-xs font-tactical font-bold uppercase tracking-wider text-white">
                  Workout Schedule
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_WINDOWS.map((window) => {
                    const isSelected = buddy.preferredTimes.includes(window);
                    return (
                      <button
                        key={window}
                        type="button"
                        onClick={() => buddy.togglePreferredTime(window)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-o1-crimson text-white'
                            : 'bg-o1-well text-neutral-400 border border-white/[0.07] hover:text-white'
                        }`}
                      >
                        {window}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FIXED ACTION FOOTER: SPLIT INTO 2 CAPSULES [ PREVIEW ] and [ DONE ] */}
        <div className="p-3 bg-o1-card border-t border-white/[0.05] shrink-0 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleTogglePreview}
            className={`py-3 rounded-full text-xs font-tactical font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
              profileViewMode === 'PREVIEW'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-o1-crimson" />
            <span>{profileViewMode === 'PREVIEW' ? 'Edit' : 'Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleDone}
            className="py-3 rounded-full bg-o1-crimson hover:bg-o1-crimson-hover text-white text-xs font-tactical font-bold uppercase tracking-wider shadow-md shadow-red-950/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* DIRECT MASTER VAULT INTEGRATION */}
      {isVaultOpen && role === 'coach' && (
        <CoachVaultModal
          isOpen
          onClose={() => setIsVaultOpen(false)}
        />
      )}
      {isVaultOpen && role !== 'coach' && (
        <PhotoVaultModal
          isOpen
          onClose={() => setIsVaultOpen(false)}
        />
      )}
    </div>
  );
};

export default RadarProfileStudioModal;
