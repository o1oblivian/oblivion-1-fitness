import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { safeStorage } from '../../../utils/safeStorage';
import type { MacroBudget } from '../data/mealBudget';
import { PortionKeypad } from './portion/PortionKeypad';
import { PortionMacros } from './portion/PortionMacros';
import { PortionRuler } from './portion/PortionRuler';
import {
  LastPortion,
  MAX_SERVINGS,
  PortionMemory,
  Unit,
  countLabel,
  formatServings,
  maxGramsFor,
  nutritionScale,
  portionChips,
  snap,
} from './portion/portionMath';
import { usePortionDial } from './portion/usePortionDial';

export interface FoodPortionDialModalProps {
  isOpen: boolean;
  foodName?: string;
  food?: {
    id?: string;
    brand?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    serving_grams?: number;
    serving_size?: string;
  } | null;
  /** What's left today; null when targets aren't calibrated. */
  budget?: MacroBudget | null;
  onSetGrams: (grams: number) => void;
  /** Used when logging by servings; nutrition values are per one serving. */
  onSetServings?: (servings: number) => void;
  onClose: () => void;
}

const HOLD_MS = 420;
const MEMORY_KEY = 'o1fc_portion_memory';

export const FoodPortionDialModal: React.FC<FoodPortionDialModalProps> = ({
  isOpen,
  foodName,
  food,
  budget,
  onSetGrams,
  onSetServings,
  onClose,
}) => {
  const servingG = food?.serving_grams && food.serving_grams > 0 ? food.serving_grams : null;
  const label = countLabel(food?.serving_size);
  const canServings = Boolean(onSetServings) && (servingG == null || label != null);
  const canGrams = servingG != null;
  const maxG = maxGramsFor(servingG);
  const memoryKey = food?.id || foodName || '';

  const [unit, setUnit] = useState<Unit>('g');
  const [pad, setPad] = useState<string | null>(null);
  const [hold, setHold] = useState(0);
  const [width, setWidth] = useState(320);
  const [lastPortion, setLastPortion] = useState<LastPortion | null>(null);

  const rulerRef = useRef<HTMLDivElement | null>(null);
  const holdRef = useRef<number | null>(null);
  const committedRef = useRef(false);

  const max = unit === 'g' ? maxG : MAX_SERVINGS;
  const { pos, stopAnim, glideTo, jumpTo, reset, handlers } = usePortionDial(unit, max);
  const amount = Math.max(0, Math.min(max, snap(pos, unit)));

  useEffect(() => {
    if (!isOpen) return;
    const memory = safeStorage.getItem<PortionMemory>(MEMORY_KEY, {});
    const last = memoryKey ? (memory[memoryKey] ?? null) : null;
    const startUnit: Unit = !canGrams
      ? 'serv'
      : last?.unit === 'serv' && canServings
        ? 'serv'
        : 'g';
    const start =
      last && last.unit === startUnit ? last.amount : startUnit === 'g' ? (servingG ?? 100) : 1;
    setLastPortion(last);
    setUnit(startUnit);
    reset(start, startUnit);
    setPad(null);
    setHold(0);
    committedRef.current = false;
    return () => {
      stopAnim();
      if (holdRef.current != null) cancelAnimationFrame(holdRef.current);
    };
  }, [isOpen, memoryKey, canGrams, canServings, servingG, reset, stopAnim]);

  useLayoutEffect(() => {
    const el = rulerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen, pad]);

  if (!isOpen || !food) return null;

  const switchUnit = (next: Unit) => {
    if (next === unit || !servingG) return;
    tactileEngine.triggerSelectionBuzz();
    stopAnim();
    const converted =
      next === 'serv' ? snap(amount / servingG, 'serv') : snap(amount * servingG, 'g');
    const v =
      next === 'serv'
        ? Math.max(0.25, Math.min(MAX_SERVINGS, converted))
        : Math.min(maxG, converted);
    setUnit(next);
    jumpTo(v, next);
  };

  const padValue = pad != null && pad !== '' && pad !== '.' ? parseFloat(pad) : null;
  const shown = pad != null ? Math.min(max, padValue ?? 0) : amount;
  const scale = nutritionScale(unit, shown, servingG);
  const kcal = Math.round(food.calories * scale);

  const portionText =
    unit === 'g'
      ? `${shown} g${servingG && label && Math.abs(shown - servingG) < 0.5 ? ` · ${label}` : ''}`
      : `${formatServings(shown)} × ${label || 'serving'}`;

  const chips = portionChips({ unit, servingG, label, maxG, lastPortion });

  const commit = () => {
    const value = pad != null ? shown : amount;
    if (value <= 0 || committedRef.current) return;
    committedRef.current = true;
    tactileEngine.playPRCelebration();
    if (memoryKey) {
      const memory = safeStorage.getItem<PortionMemory>(MEMORY_KEY, {});
      const keys = Object.keys(memory);
      if (keys.length > 200) delete memory[keys[0]];
      delete memory[memoryKey];
      memory[memoryKey] = { unit, amount: value };
      safeStorage.setItem(MEMORY_KEY, memory);
    }
    if (unit === 'g') onSetGrams(Math.round(value));
    else if (onSetServings) onSetServings(value);
    else onSetGrams(Math.round(value * (servingG ?? 100)));
    onClose();
  };

  const startHold = () => {
    if (shown <= 0 || committedRef.current) return;
    if (holdRef.current != null) cancelAnimationFrame(holdRef.current);
    tactileEngine.triggerSelectionBuzz();
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / HOLD_MS);
      setHold(p);
      if (p >= 1) {
        holdRef.current = null;
        commit();
      } else holdRef.current = requestAnimationFrame(step);
    };
    holdRef.current = requestAnimationFrame(step);
  };

  const cancelHold = () => {
    if (holdRef.current != null) cancelAnimationFrame(holdRef.current);
    holdRef.current = null;
    setHold(0);
  };

  const pressKey = (k: string) => {
    tactileEngine.triggerDialHaptic();
    setPad((prev) => {
      const cur = prev ?? '';
      if (k === 'back') return cur.slice(0, -1);
      if (k === '.') return unit === 'serv' && !cur.includes('.') ? (cur || '0') + '.' : cur;
      if (cur.replace('.', '').length >= 4) return cur;
      const next = cur === '0' ? k : cur + k;
      return parseFloat(next) > max ? String(max) : next;
    });
  };

  const applyPad = () => {
    if (padValue != null) jumpTo(snap(Math.min(max, padValue), unit), unit);
    tactileEngine.triggerSelectionBuzz();
    setPad(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150 select-none">
      <div className="o1-sheet-card w-full bg-o1-sheet border border-white/[0.07] shadow-xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-o1-text truncate">{foodName}</p>
            <p className="text-o1-label text-o1-muted truncate">
              {[food.brand, food.serving_size].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="w-8 h-8 shrink-0 rounded-full bg-o1-surface border border-white/[0.07] flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {canGrams && canServings && (
            <div className="flex justify-center">
              <div
                className="inline-flex p-0.5 rounded-full bg-o1-surface border border-white/[0.07]"
                role="tablist"
              >
                {(['g', 'serv'] as Unit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="tab"
                    aria-selected={unit === u}
                    onClick={() => switchUnit(u)}
                    className={`px-4 py-1 rounded-full text-o1-label font-bold transition-colors cursor-pointer ${
                      unit === u ? 'bg-o1-text text-black' : 'text-o1-muted hover:text-o1-text'
                    }`}
                  >
                    {u === 'g' ? 'Grams' : 'Servings'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              if (pad == null) {
                stopAnim();
                setPad('');
              } else applyPad();
            }}
            className="w-full text-center cursor-pointer group"
            aria-label={pad == null ? 'Type an amount' : 'Done typing'}
          >
            <span className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl font-black tabular-nums tracking-tight text-o1-text leading-none">
                {kcal.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-o1-muted">kcal</span>
            </span>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold tabular-nums transition-colors ${
                pad != null
                  ? 'border-o1-crimson/60 text-o1-text'
                  : 'border-white/[0.07] text-o1-muted group-hover:text-o1-text'
              }`}
            >
              {pad != null ? (
                <>
                  <span>{pad === '' ? '0' : pad}</span>
                  <span className="w-px h-3.5 bg-o1-crimson animate-pulse" />
                  <span className="text-o1-muted">
                    {unit === 'g' ? 'g' : `× ${label || 'serving'}`}
                  </span>
                </>
              ) : (
                portionText
              )}
            </span>
            {budget && budget.kcal > 0 && (
              <span className="block mt-1.5 text-o1-label text-o1-muted tabular-nums">
                {kcal <= budget.kcal
                  ? `${Math.round((kcal / budget.kcal) * 100)}% of the ${budget.kcal.toLocaleString()} kcal left today`
                  : `${(kcal - budget.kcal).toLocaleString()} kcal over what's left today`}
              </span>
            )}
          </button>

          {pad == null ? (
            <>
              <PortionRuler
                unit={unit}
                pos={pos}
                width={width}
                max={max}
                amount={amount}
                servingG={servingG}
                rulerRef={rulerRef}
                handlers={handlers}
              />

              {chips.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {chips.map((c) => {
                    const active = Math.abs(amount - c.value) < 1e-6;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          tactileEngine.triggerSelectionBuzz();
                          glideTo(c.value);
                        }}
                        className={`px-3 py-1.5 rounded-full text-o1-label font-bold tabular-nums border transition-colors cursor-pointer ${
                          active
                            ? 'bg-o1-text text-black border-transparent'
                            : 'bg-o1-surface text-o1-muted border-white/[0.07] hover:text-o1-text'
                        }`}
                      >
                        {c.text}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <PortionKeypad
              unit={unit}
              max={max}
              padValue={padValue}
              onKey={pressKey}
              onCancel={() => {
                tactileEngine.triggerSelectionBuzz();
                setPad(null);
              }}
              onApply={applyPad}
            />
          )}

          <PortionMacros food={food} scale={scale} budget={budget} />

          <button
            type="button"
            disabled={shown <= 0}
            onPointerDown={startHold}
            onPointerUp={cancelHold}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
              if (e.detail === 0) commit();
            }}
            className="relative w-full h-11 rounded-2xl bg-o1-crimson/25 border border-o1-crimson/40 overflow-hidden text-o1-text font-semibold text-sm disabled:opacity-40 cursor-pointer touch-none"
          >
            <span
              className="absolute inset-y-0 left-0 bg-o1-crimson"
              style={{ width: `${hold * 100}%` }}
            />
            <span className="relative tabular-nums">
              {hold > 0 ? 'Keep holding…' : `Hold to log · ${kcal.toLocaleString()} kcal`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
