import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface NavigationTriggerProps {
  onOpenSettings: () => void;
  className?: string;
  ariaLabel?: string;
}

export const SettingsTriggerButton: React.FC<NavigationTriggerProps> = ({
  onOpenSettings,
  className = '',
  ariaLabel = 'Settings'
}) => {
  return (
    <button
      type="button"
      onClick={onOpenSettings}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`fixed top-3.5 right-4 z-[90] w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-sm hover:scale-105 active:scale-95 transition-all text-neutral-800 dark:text-neutral-100 cursor-pointer pointer-events-auto ${className}`}
    >
      <MoreVertical className="w-4.5 h-4.5" />
    </button>
  );
};

export default SettingsTriggerButton;
