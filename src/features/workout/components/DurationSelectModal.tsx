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
  { minutes: 15, label: '15 Minutes', sub: '15m Primer' },
  { minutes: 20, label: '20 Minutes', sub: '20m Solid' },
  { minutes: 30, label: '30 Minutes', sub: '30m Power' },
  { minutes: 45, label: '45 Minutes', sub: '45m Deep' },
  { minutes: 60, label: '60 Minutes', sub: '60m Total' },
  { minutes: 75, label: '75 Minutes', sub: '75m Volume' },
  { minutes: 90, label: '90 Minutes', sub: '90m Marathon' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 o1-sheet-scrim animate-in fade-in duration-200">
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={onClose}
      />
      <div className="o1-sheet-card relative w-full bg-o1-card border border-white/[0.07] shadow-xl p-5 z-10 space-y-4 overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div>
            <h3 className="text-sm font-tactical font-black text-white tracking-wider">
              Select Available Duration
            </h3>
            <p className="text-[11px] font-sans text-neutral-400">
              Autoregulated volume and rest cadence
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-0.5">
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
                    ? 'bg-o1-crimson border-o1-crimson shadow-xs'
                    : 'bg-o1-card border-white/[0.07] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-tactical font-bold tracking-wider ${
                      isSelected ? 'text-white' : 'text-white'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-neutral-400 text-xs">•</span>
                  <span
                    className={`text-xs font-sans font-medium ${
                      isSelected ? 'text-white/80' : 'text-neutral-400'
                    }`}
                  >
                    {opt.sub}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-o1-crimson bg-o1-crimson text-white'
                      : 'border-white/[0.07] bg-white/[0.08]'
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
