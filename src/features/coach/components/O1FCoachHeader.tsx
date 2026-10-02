import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shield, ShoppingBag, Check } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface O1FCoachHeaderProps {
  activePerspective?: 'coach' | 'athlete';
  onChangePerspective?: (perspective: 'coach' | 'athlete') => void;
  isCoach?: boolean;
}

export const O1FCoachHeader: React.FC<O1FCoachHeaderProps> = ({
  activePerspective = 'athlete',
  onChangePerspective,
  isCoach = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (perspective: 'coach' | 'athlete') => {
    tactileEngine.triggerSelectionBuzz();
    onChangePerspective?.(perspective);
    setIsOpen(false);
  };

  if (!isCoach) {
    return (
      <div className="flex items-center justify-center px-0.5 w-full min-h-[38px]">
        <div className="px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-[#18181B] border border-neutral-200/90 dark:border-neutral-800 shadow-xs flex items-center gap-2 select-none">
          <span className="text-xs font-mono font-bold tracking-wider text-neutral-900 dark:text-white uppercase">
            O1FCoach Hub
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center px-0.5 w-full min-h-[38px] z-50">
      <button
        type="button"
        id="o1fcoach-perspective-trigger"
        onClick={() => {
          tactileEngine.triggerSelectionBuzz();
          setIsOpen((prev) => !prev);
        }}
        className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181B] dark:hover:bg-[#202025] border border-neutral-200/90 dark:border-neutral-800 shadow-xs flex items-center gap-1.5 select-none transition-all cursor-pointer active:scale-95 group"
        title="Toggle perspective: Command Center or Athlete Store"
      >
        <span className="text-xs font-mono font-bold tracking-wider text-neutral-900 dark:text-white">
          O1FCoach
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-11 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-1.5 z-50 min-w-[210px] space-y-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider text-neutral-400 uppercase border-b border-white/10">
            CREATOR PERSPECTIVE
          </div>

          <button
            type="button"
            onClick={() => handleSelect('coach')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-mono font-bold transition-all cursor-pointer ${
              activePerspective === 'coach'
                ? 'bg-[#C4121A] text-white shadow-xs'
                : 'text-neutral-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>COMMAND CENTER</span>
            </div>
            {activePerspective === 'coach' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('athlete')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-mono font-bold transition-all cursor-pointer ${
              activePerspective === 'athlete'
                ? 'bg-[#C4121A] text-white shadow-xs'
                : 'text-neutral-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>ATHLETE STORE</span>
            </div>
            {activePerspective === 'athlete' && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default O1FCoachHeader;
