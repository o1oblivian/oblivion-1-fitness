import React from 'react';
import { X, Check } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

export interface DurationOption {
  minutes: number;
  label: string;
  sub: string;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 5, label: '5 Minutes', sub: '5m Express' },
  { minutes: 10, label: '10 Minutes', sub: '10m Quick' },
  { minutes: 20, label: '20 Minutes', sub: '20m Solid' },
  { minutes: 30, label: '30 Minutes', sub: '30m Power' },
  { minutes: 45, label: '45 Minutes', sub: '45m Deep' },
  { minutes: 60, label: '60 Minutes', sub: '60m Total' },
];

interface DurationSelectModalProps {
  isOpen: boolean;
  selectedMinutes: number;
  onSelect: (minutes: number) => void;
  onClose: () => void;
}

export const DurationSelectModal: React.FC<DurationSelectModalProps> = ({
  isOpen,
  selectedMinutes,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-[#121217] rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-white/10 shadow-2xl p-5 z-10 space-y-4 animate-in slide-in-from-bottom duration-200 text-neutral-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-tactical font-black text-neutral-900 dark:text-white uppercase tracking-wider">
              Select Available Duration
            </h3>
            <p className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400">
              Autoregulated volume and rest cadence
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = selectedMinutes === opt.minutes;
            return (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onSelect(opt.minutes);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-red-50/70 dark:bg-red-950/40 border-red-500/80 dark:border-red-500/60 shadow-xs'
                    : 'bg-white dark:bg-[#0E0E11] border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-tactical font-bold uppercase tracking-wider ${
                      isSelected ? 'text-[#C4121A] dark:text-red-400' : 'text-neutral-900 dark:text-white'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-neutral-400 text-xs">•</span>
                  <span
                    className={`text-xs font-sans font-medium ${
                      isSelected ? 'text-[#C4121A]/80 dark:text-red-300' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {opt.sub}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-[#C4121A] bg-[#C4121A] text-white'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
