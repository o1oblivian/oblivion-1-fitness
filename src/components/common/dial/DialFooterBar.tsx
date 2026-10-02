/**
 * Oblivion 1 Fitness Club - Presets and Confirmation Bar
 * Strict File Ceiling: < 140 lines
 */

import React from 'react';
import { Check } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface DialFooterBarProps {
  value: number;
  unit: string;
  presets: number[];
  accentColor: string;
  onSelectPreset: (val: number) => void;
  onConfirm: () => void;
}

export const DialFooterBar: React.FC<DialFooterBarProps> = ({
  value,
  unit,
  presets,
  accentColor,
  onSelectPreset,
  onConfirm,
}) => {
  const isKg = unit.toUpperCase() === 'KG';

  return (
    <div className="w-full space-y-3 pt-2">
      {/* Presets Strip */}
      {presets.length > 0 && (
        <div className="w-full flex items-center justify-between gap-1 overflow-x-auto py-1 px-1 no-scrollbar select-none">
          {presets.map((preset) => {
            const isActive = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  tactileEngine.triggerDialHaptic();
                  onSelectPreset(preset);
                }}
                className="flex flex-col items-center cursor-pointer px-2 py-1 group shrink-0"
              >
                <span
                  style={isActive ? { color: accentColor } : undefined}
                  className={`text-xs font-mono transition-colors ${
                    isActive
                      ? 'font-bold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium'
                  }`}
                >
                  {preset}
                  <span className="text-[10px] ml-0.5 opacity-70">
                    {isKg ? 'kg' : ''}
                  </span>
                </span>
                <span
                  style={isActive ? { backgroundColor: accentColor } : undefined}
                  className={`h-0.5 rounded-full transition-all mt-1 ${
                    isActive ? 'w-4' : 'w-0 bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Confirmation CTA Button */}
      <button
        type="button"
        onClick={() => {
          tactileEngine.playPRCelebration();
          onConfirm();
        }}
        style={{ backgroundColor: accentColor }}
        className="w-full py-3.5 rounded-full hover:brightness-110 active:scale-[0.98] text-white font-tactical font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Check className="w-4 h-4 stroke-[3]" />
        <span>
          CONFIRM {value} {unit}
        </span>
      </button>
    </div>
  );
};
