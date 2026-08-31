import React from 'react';
import { motion } from 'motion/react';
import { AppMode } from '../types';

interface NavigationProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentMode, onModeChange }) => {
  const modes: { id: AppMode; label: string; code: string }[] = [
    { id: 'tracker', label: 'Workout', code: 'SYS.01' },
    { id: 'fuel', label: 'Fuel', code: 'SYS.02' },
    { id: 'coach', label: 'Coach', code: 'SYS.03' },
    { id: 'client', label: 'Log', code: 'SYS.04' },
  ];

  return (
    <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-md select-none">
      <div className="bg-[#FDFCFB] border border-[rgba(0,0,0,0.08)] p-1.5 rounded-full flex justify-between items-center shadow-sm relative overflow-hidden">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all duration-300 relative z-10 flex flex-col items-center justify-center cursor-pointer ${
                isActive
                  ? 'text-[#FDFCFB] font-extrabold'
                  : 'text-[#848785] hover:text-[#3A3F3D]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-[#7A9382] rounded-full shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="tracking-wide text-xs font-sans font-extrabold flex items-center justify-center">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
