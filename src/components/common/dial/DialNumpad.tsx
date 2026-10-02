/**
 * Oblivion 1 Fitness Club - Fast-Touch Tactile Numpad for Dials
 * Strict File Ceiling: < 140 lines
 */

import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';

interface DialNumpadProps {
  value: number;
  unit: string;
  max: number;
  onChange: (val: number) => void;
}

export const DialNumpad: React.FC<DialNumpadProps> = ({ value, unit, max, onChange }) => {
  const handleDigit = (digit: string) => {
    tactileEngine.triggerDialHaptic();
    const str = value === 0 ? '' : String(value);
    const updated = str + digit;
    const num = parseFloat(updated);
    if (!isNaN(num)) {
      onChange(Math.min(max, num));
    }
  };

  const handleDecimal = () => {
    tactileEngine.triggerDialHaptic();
    const str = String(value);
    if (!str.includes('.')) {
      const updated = str + '.5';
      const num = parseFloat(updated);
      if (!isNaN(num)) onChange(Math.min(max, num));
    }
  };

  const handleBackspace = () => {
    tactileEngine.triggerSelectionBuzz();
    const str = String(value);
    if (str.length <= 1) {
      onChange(0);
    } else {
      const trimmed = str.slice(0, -1);
      onChange(parseFloat(trimmed) || 0);
    }
  };

  const handleClear = () => {
    tactileEngine.triggerSelectionBuzz();
    onChange(0);
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-[270px] mx-auto py-2 flex flex-col items-center select-none">
      {/* Big Digital Display */}
      <div className="w-full p-3 rounded-2xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 text-center mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
          TARGET {unit}
        </span>
        <span className="text-3xl font-mono font-black text-neutral-900 dark:text-white">
          {value} <span className="text-sm font-sans text-neutral-400">{unit}</span>
        </span>
      </div>

      {/* 3x4 Grid Keypad */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a1a1f] dark:hover:bg-[#24242b] border border-neutral-200 dark:border-neutral-800 font-mono text-lg font-bold text-neutral-900 dark:text-white active:scale-95 transition-all cursor-pointer"
          >
            {d}
          </button>
        ))}

        <button
          type="button"
          onClick={handleDecimal}
          className="h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a1a1f] dark:hover:bg-[#24242b] border border-neutral-200 dark:border-neutral-800 font-mono text-base font-bold text-neutral-900 dark:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          .5
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a1a1f] dark:hover:bg-[#24242b] border border-neutral-200 dark:border-neutral-800 font-mono text-lg font-bold text-neutral-900 dark:text-white active:scale-95 transition-all cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a1a1f] dark:hover:bg-[#24242b] border border-neutral-200 dark:border-neutral-800 font-mono text-base font-bold text-neutral-700 dark:text-neutral-300 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Clear Zero Button */}
      <button
        type="button"
        onClick={handleClear}
        className="w-full mt-2 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-[#18181b] text-neutral-500 hover:text-neutral-900 dark:hover:text-white text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset to 0</span>
      </button>
    </div>
  );
};
