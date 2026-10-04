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
  iconContainerClassName = 'p-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF]',
  headerRight,
  showSwipeHandle = true,
  showCloseButton = true,
  maxWidth = 'max-w-[480px]',
  maxHeight = 'max-h-[88dvh]',
  className = '',
  bodyClassName = 'p-4 space-y-4 overflow-y-auto',
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
      className="fixed inset-0 z-50 bg-black/85 flex flex-col justify-end md:justify-center items-center p-0 md:p-4 animate-in fade-in duration-200 select-none"
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
        className={`bg-[#0D0D10] border border-neutral-800 w-full ${maxWidth} rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300 ${className}`}
      >
        {/* Optional Swipe Handle for tactile mobile affordance */}
        {showSwipeHandle && (
          <div
            className="flex justify-center pt-2.5 pb-1 bg-[#121214] select-none cursor-grab active:cursor-grabbing"
            onClick={onClose}
          >
            <div className="w-12 h-1 bg-neutral-700 rounded-full hover:bg-neutral-600 transition-colors" />
          </div>
        )}

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-800 bg-[#121214]">
            <div className="flex items-center gap-2">
              {icon && (
                <div className={`shrink-0 ${iconContainerClassName}`}>
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="font-tactical font-black text-sm uppercase tracking-wider text-white">
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
        <div className={`${maxHeight} ${bodyClassName} bg-[#0D0D10] text-neutral-100`}>
          {children}
        </div>
      </div>
    </div>
  );
};
