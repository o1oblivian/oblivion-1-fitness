import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Plus } from 'lucide-react';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { useRadarStore } from '../../../stores/useRadarStore';
import { useRoleStore } from '../../../stores/useRoleStore';
import { PhotoVaultModal } from '../../log/components/PhotoVaultModal';
import { CoachVaultModal } from '../../coach/components/CoachVaultModal';
import { tactileEngine } from '../../../services/tactileEngine';
import { HomeGymField } from '../../../components/settings/HomeGymPicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyAndScan?: () => void;
}

const DISCIPLINES_LIST = [
  'Strength',
  'Hypertrophy',
  'Powerlifting',
  'Olympic',
  'Conditioning',
  'Running',
  'Run club',
  'Walking',
  'Cycling',
  'Swimming',
  'Hyrox',
  'Mobility',
  'Yoga',
  'Pilates',
  'Sauna',
  'CrossFit',
  'Calisthenics',
  'Boxing',
  'Climbing',
  'Rowing',
];

export const RadarProfileStudioModal: React.FC<Props> = ({ isOpen, onClose, onApplyAndScan }) => {
  const buddy = useBuddyProfileStore();
  const radar = useRadarStore();
  const role = useRoleStore((s) => s.role);

  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Pointer Hold & Drag State
  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [hoverDropIdx, setHoverDropIdx] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<number | null>(null);
  const dragSourceIdx = useRef<number | null>(null);
  const hoverDropIdxRef = useRef<number | null>(null);
  const pointerStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const cachedSlotRects = useRef<{ left: number; top: number; right: number; bottom: number }[]>(
    [],
  );
  const slotRefs = useRef<(HTMLElement | null)[]>([]);

  const { ageRangeMin, ageRangeMax, setAgeRange } = buddy;
  useEffect(() => {
    if (ageRangeMax < ageRangeMin || ageRangeMax < 18) {
      const repairedMin = Math.max(18, Math.min(ageRangeMin || 20, 69));
      setAgeRange(repairedMin, Math.max(repairedMin + 1, 38));
    }
  }, [ageRangeMin, ageRangeMax, setAgeRange]);

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

  const handleDone = () => {
    tactileEngine.playPRCelebration();
    radar.setRadius(buddy.maxDistanceKm);
    radar.handleRescan();
    onApplyAndScan?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex o1-sheet-scrim o1-page-scrim animate-in fade-in duration-200 select-none">
      <div className="o1-sheet-card o1-page flex flex-col overflow-hidden bg-black">
        {/* HEADER */}
        <div className="px-4 py-3 border-b border-white/[0.05] bg-o1-card/95 backdrop-blur-sm flex items-center justify-between shrink-0">
          <h2 className="text-[15px] font-semibold text-white">Your profile</h2>

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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-white">
          {/* ========================================================================= */}
          {/* TAB: EDIT PROFILE (When View Mode is EDIT)                                */}
          {/* ========================================================================= */}
          {
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Profile Photos Grid */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-tactical font-bold tracking-wider text-white">
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
                    const isHoverTarget =
                      hoverDropIdx === idx && activeDragIdx !== null && activeDragIdx !== idx;
                    const isSelected = selectedSlotForSwap === idx;

                    if (!imgUrl) {
                      return (
                        <button
                          key={`empty-${idx}`}
                          ref={(el) => {
                            slotRefs.current[idx] = el;
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
              <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-[#121214] p-4">
                <h3 className="text-[15px] font-semibold text-white">Prompts</h3>
                {[
                  { label: 'I train', placeholder: 'Push three mornings a week' },
                  { label: "I'm looking for", placeholder: 'A spotter who shows up' },
                  { label: 'A good session is', placeholder: 'Heavy, short, and done' },
                ].map((prompt, index) => {
                  const parts = buddy.partnerBio.includes('\n')
                    ? buddy.partnerBio.split('\n')
                    : [buddy.partnerBio, '', ''];
                  return (
                    <label key={prompt.label} className="block">
                      <span className="text-[12px] text-neutral-400">{prompt.label}</span>
                      <input
                        value={
                          index === 0 && !buddy.partnerBio.includes('\n')
                            ? buddy.partnerBio
                            : parts[index] || ''
                        }
                        onChange={(event) => {
                          const next = buddy.partnerBio.includes('\n')
                            ? buddy.partnerBio.split('\n')
                            : [buddy.partnerBio, '', ''];
                          while (next.length < 3) next.push('');
                          next[index] = event.target.value.slice(0, 120);
                          buddy.setPartnerBio(next.join('\n').slice(0, 300));
                        }}
                        placeholder={prompt.placeholder}
                        className="mt-1 h-11 w-full rounded-xl border border-white/[0.07] bg-[#161616] px-3 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Basic Info */}
              <div className="bg-o1-card p-4 rounded-2xl border border-white/[0.07] space-y-3 shadow-xs">
                <h3 className="text-[15px] font-semibold text-white">You</h3>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 font-bold">Name</label>
                    <input
                      type="text"
                      value={buddy.displayName}
                      onChange={(e) => buddy.setDisplayName(e.target.value)}
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-o1-crimson"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 font-bold">Age</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={18}
                      max={99}
                      placeholder="18+"
                      value={buddy.age > 0 ? buddy.age : ''}
                      onChange={(e) =>
                        buddy.setAge(Math.max(0, Math.min(99, parseInt(e.target.value, 10) || 0)))
                      }
                      className="w-full bg-o1-well border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-o1-crimson"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-o1-crimson" />
                    <span>Home Gym</span>
                  </label>
                  <HomeGymField />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold block">
                    I am
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['women', 'Woman'],
                        ['men', 'Man'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => buddy.setGender(buddy.gender === id ? '' : id)}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${buddy.gender === id ? 'bg-o1-crimson text-white' : 'border border-white/[0.07] bg-[#161616] text-neutral-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold block">
                    Where I train
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ['gym', 'Gym'],
                        ['home', 'Home'],
                        ['outdoors', 'Outdoors'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => buddy.setTrainingPlace(buddy.trainingPlace === id ? '' : id)}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${buddy.trainingPlace === id ? 'bg-o1-crimson text-white' : 'border border-white/[0.07] bg-[#161616] text-neutral-300'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fitness Disciplines */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-400 font-bold block">
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
                          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-o1-crimson text-white'
                              : 'border border-white/[0.07] bg-[#161616] text-neutral-300'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <div className="shrink-0 border-t border-white/[0.05] bg-o1-card p-3">
          <button
            type="button"
            onClick={handleDone}
            className="flex w-full items-center justify-center rounded-full bg-o1-crimson py-3 text-[13px] font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>

      {/* DIRECT MASTER VAULT INTEGRATION */}
      {isVaultOpen && role === 'coach' && (
        <CoachVaultModal isOpen onClose={() => setIsVaultOpen(false)} />
      )}
      {isVaultOpen && role !== 'coach' && (
        <PhotoVaultModal isOpen onClose={() => setIsVaultOpen(false)} />
      )}
    </div>
  );
};
