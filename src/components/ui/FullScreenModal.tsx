import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalHistory } from '@/hooks/useModalHistory';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  zIndex?: number;
  children: React.ReactNode;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  zIndex = 999,
  children,
}) => {
  useModalHistory(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-[#F8F9FA] dark:bg-[#0A0A0C] overflow-y-auto overscroll-contain font-sans"
      style={{ zIndex }}
    >
      <div className="w-full max-w-3xl mx-auto p-3.5 sm:p-5 flex flex-col gap-3 animate-slideDownFade select-none">
        {children}
      </div>
    </div>,
    document.body,
  );
};

export const ModalCloseButton: React.FC<{ onClick: () => void; size?: 'sm' | 'md' }> = ({
  onClick,
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <button
      onClick={onClick}
      className="btn-nude-close !p-1.5 shrink-0"
      title="Close"
    >
      <X className={iconSize} />
    </button>
  );
};

interface ModalHeaderProps {
  onClose: () => void;
  badge?: { label: string; color?: string };
  title: string;
  subtitle?: React.ReactNode;
  closeSize?: 'sm' | 'md';
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  onClose,
  badge,
  title,
  subtitle,
  closeSize = 'md',
}) => {
  const badgeColor = badge?.color || '#7A9382';
  return (
    <div className="flex justify-between items-start border-b border-[rgba(0,0,0,0.08)] dark:border-white/10 pb-3">
      <div>
        {badge && (
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1"
            style={{
              backgroundColor: `${badgeColor}15`,
              color: badgeColor,
              border: `1px solid ${badgeColor}30`,
            }}
          >
            {badge.label}
          </span>
        )}
        <h3 className="text-lg font-black text-[#1A1E1D] dark:text-white tracking-tight font-mono">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-[#686E6B] dark:text-gray-400 font-mono mt-0.5">{subtitle}</p>
        )}
      </div>
      <ModalCloseButton onClick={onClose} size={closeSize} />
    </div>
  );
};

export const SectionLabel: React.FC<{
  children: React.ReactNode;
  color?: string;
  className?: string;
}> = ({ children, color = 'text-[#686E6B] dark:text-gray-400', className = '' }) => (
  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${color} ${className}`}>
    {children}
  </span>
);

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg = 'bg-[#E5E5EA] dark:bg-zinc-500/15' }) => (
  <div className="bg-white dark:bg-[#14171F] border border-[rgba(0,0,0,0.08)] dark:border-white/10 rounded-2xl p-4 space-y-1">
    {icon && (
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    )}
    <p className="text-lg font-black text-[#1A1E1D] dark:text-white font-mono">{value}</p>
    <p className="text-[10px] font-mono text-[#686E6B] dark:text-gray-400 uppercase tracking-wider">{label}</p>
  </div>
);
