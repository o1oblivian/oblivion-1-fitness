/**
 * Oblivion 1 Fitness Club - State of the Art Rotary Chrono Dial Modal
 * Supports continuous polar touch tracking & direct tactile keypad
 * Dual-Theme Luxury Watch Precision
 * Strict File Ceiling: < 140 lines
 */

import React, { useState, useEffect } from 'react';
import { X, Gauge, Hash } from 'lucide-react';
import { resolveDialConfig } from './dial/dialTypes';
import { useDialDrag } from './dial/useDialDrag';
import { ChronoDialGauge } from './dial/ChronoDialGauge';
import { DialNumpad } from './dial/DialNumpad';
import { DialFooterBar } from './dial/DialFooterBar';

export interface DialInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  unit: string;
  initialValue: number;
  min?: number;
  max?: number;
  step?: number;
  presets?: number[];
  accentColor?: string;
  onConfirm: (val: number) => void;
}

export const DialInputModal: React.FC<DialInputModalProps> = ({
  isOpen,
  onClose,
  title,
  unit,
  initialValue,
  min,
  max,
  step,
  presets,
  onConfirm,
}) => {
  const config = resolveDialConfig(unit, min, max, step, title, presets);
  const [mode, setMode] = useState<'dial' | 'numpad'>('dial');
  const { value, setValue, svgRef, handlePointerDown } = useDialDrag(config, initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setMode('dial');
    }
  }, [isOpen, initialValue, setValue]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[340px] bg-white dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 rounded-[28px] p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between">
          <span className="text-[11px] font-tactical font-bold tracking-[0.14em] uppercase text-neutral-500 dark:text-neutral-400">
            {config.title}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setMode('dial')}
                className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'dial'
                    ? 'bg-white dark:bg-[#27272a] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMode('numpad')}
                className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'numpad'
                    ? 'bg-white dark:bg-[#27272a] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {mode === 'dial' ? (
          <ChronoDialGauge
            value={value}
            config={config}
            svgRef={svgRef}
            onPointerDown={handlePointerDown}
            onCenterClick={() => setMode('numpad')}
          />
        ) : (
          <DialNumpad value={value} unit={config.unit} max={config.max} onChange={(v) => setValue(v)} />
        )}

        <DialFooterBar
          value={value}
          unit={config.unit}
          presets={config.presets}
          accentColor={config.accentColor}
          onSelectPreset={(val) => setValue(val)}
          onConfirm={() => {
            onConfirm(value);
            onClose();
          }}
        />
      </div>
    </div>
  );
};

export default DialInputModal;
