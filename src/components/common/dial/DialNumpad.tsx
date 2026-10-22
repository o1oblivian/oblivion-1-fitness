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
    <div className="o1-instrument o1-dial-stack w-full max-w-[270px] mx-auto flex flex-col items-center select-none">
      <div className="o1-dial-well w-full rounded-2xl bg-o1-well border border-white/[0.07] text-center">
        <span className="text-o1-label font-num tracking-wider text-o1-muted block">
          TARGET {unit}
        </span>
        <span className="text-3xl font-num font-light text-o1-text">
          {value} <span className="text-sm font-sans text-o1-muted">{unit}</span>
        </span>
      </div>

      {/* 3x4 Grid Keypad */}
      <div className="o1-dial-keys grid grid-cols-3 w-full">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-11 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] font-num text-lg font-normal text-white active:scale-95 transition-all cursor-pointer"
          >
            {d}
          </button>
        ))}

        <button
          type="button"
          onClick={handleDecimal}
          className="h-11 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] font-num text-base font-normal text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          .5
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-11 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] font-num text-lg font-normal text-white active:scale-95 transition-all cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-11 rounded-xl bg-o1-well hover:bg-white/[0.06] border border-white/[0.07] font-num text-base font-normal text-o1-stone active:scale-95 transition-all cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Clear Zero Button */}
      <button
        type="button"
        onClick={handleClear}
        className="w-full mt-2 py-1.5 rounded-xl hover:bg-white/[0.06] bg-o1-well text-o1-faint hover:text-white text-xs font-num font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset to 0</span>
      </button>
    </div>
  );
};
