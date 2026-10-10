import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconContainerClassName?: string;
  headerRight?: React.ReactNode;
  showSwipeHandle?: boolean;
  showCloseButton?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
  id?: string;
}

export const DrawerSheet: React.FC<DrawerSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconContainerClassName = 'p-1.5 rounded-lg bg-[#4F8F9A]/10 text-[#4F8F9A]',
  headerRight,
  showSwipeHandle = true,
  showCloseButton = true,
  maxWidth = 'max-w-[420px]',
  maxHeight = 'max-h-[70dvh]',
  className = '',
  bodyClassName = 'p-2.5 space-y-2.5 overflow-y-auto',
  children,
  id,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex flex-col justify-center items-center animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        }}
        className={`o1-sheet-card bg-o1-card border border-white/[0.07] w-full ${maxWidth} flex flex-col overflow-hidden shadow-xl ${className}`}
      >
        {/* Optional Swipe Handle for tactile mobile affordance */}
        {showSwipeHandle && (
          <div
            className="flex justify-center pt-2.5 pb-1 bg-o1-card select-none cursor-grab active:cursor-grabbing"
            onClick={onClose}
          >
            <div className="w-12 h-1 bg-neutral-700 rounded-full hover:bg-neutral-600 transition-colors" />
          </div>
        )}

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/[0.05] bg-o1-card">
            <div className="flex items-center gap-2">
              {icon && (
                <div className={`shrink-0 ${iconContainerClassName}`}>
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="font-tactical font-black text-sm tracking-wider text-white">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-[10px] font-telemetry text-neutral-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {headerRight}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className={`${maxHeight} ${bodyClassName} bg-transparent text-neutral-100`}>
          {children}
        </div>
      </div>
    </div>
  );
};
