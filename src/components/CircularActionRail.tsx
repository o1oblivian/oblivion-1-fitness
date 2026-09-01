import React, { useRef } from 'react';
import { ARCHETYPE_BLUEPRINTS, ArchetypeBlueprint } from '@/data/archetypeBlueprints';
import { getArchetypeImage, PREMIUM_ARCHETYPES } from '@/data/archetypeVisuals';
import { Sparkles } from 'lucide-react';

interface CircularActionRailProps {
  onArchetypeSelect: (archetype: ArchetypeBlueprint) => void;
  onOpenEliteReels: () => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const CircularActionRail: React.FC<CircularActionRailProps> = ({
  onArchetypeSelect,
  onOpenEliteReels,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full py-1">
      {/* Edge gradient fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-4 z-10 bg-gradient-to-r from-[#FDFCFB] dark:from-[#090A0F] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 z-10 bg-gradient-to-l from-[#FDFCFB] dark:from-[#090A0F] to-transparent pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar px-3 py-2 items-center"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {/* PIN #1 AT THE VERY FRONT: Elite Reels (Frameless, clean edge-to-edge) */}
        <button
          id="btn-rail-elite-reels"
          onClick={onOpenEliteReels}
          className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer transition-transform active:scale-95 focus:outline-none min-w-[76px] sm:min-w-[68px]"
          aria-label="Open Elite Reels"
        >
          {/* Frameless pure edge-to-edge circle, slightly bigger on mobile */}
          <div className="relative w-[74px] h-[74px] sm:w-[66px] sm:h-[66px] rounded-full overflow-hidden shadow-md bg-neutral-900 transition-all duration-300 group-hover:scale-105">
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80"
              alt="Elite Reels"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-95 contrast-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

            {/* Subtle Top-Right REELS Tag */}
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[7.5px] font-black tracking-wider uppercase shadow-xs flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4121A] dark:bg-[#D91F28] animate-pulse" />
              REELS
            </div>
          </div>

          <span className="text-[10.5px] sm:text-[10px] font-black tracking-tight uppercase text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white transition-colors text-center whitespace-nowrap max-w-[82px] sm:max-w-[74px] truncate">
            Elite Reels
          </span>
        </button>

        {/* Specialized Archetype Workouts */}
        {ARCHETYPE_BLUEPRINTS.map((archetype) => {
          const coverImage = getArchetypeImage(archetype);
          const isPremium = PREMIUM_ARCHETYPES.has(archetype.id);

          return (
            <button
              key={archetype.id}
              onClick={() => onArchetypeSelect(archetype)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer transition-transform active:scale-95 focus:outline-none min-w-[76px] sm:min-w-[68px]"
              aria-label={archetype.name}
            >
              {/* Frameless Circular Photo, slightly bigger on mobile */}
              <div className="relative w-[74px] h-[74px] sm:w-[66px] sm:h-[66px] rounded-full overflow-hidden shadow-md bg-neutral-900 transition-all duration-300 group-hover:scale-105">
                <img
                  src={coverImage}
                  alt={archetype.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                {isPremium && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  </div>
                )}
              </div>

              {/* Clean Single-Line Archetype Label */}
              <span className="text-[10.5px] sm:text-[10px] font-black tracking-tight uppercase text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors text-center whitespace-nowrap max-w-[82px] sm:max-w-[74px] truncate">
                {archetype.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

