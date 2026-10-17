import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Delete, X } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { round1 } from '../../../utils/mathUtils';
import { safeStorage } from '../../../utils/safeStorage';
import type { MacroBudget } from '../data/intelMealEngine';

type Unit = 'g' | 'serv';

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

const SCALE = {
  g: { step: 1, minor: 5, mid: 25, major: 50, ppu: 2 },
  serv: { step: 0.25, minor: 0.25, mid: 0.5, major: 1, ppu: 88 },
} as const;

const MAX_SERVINGS = 10;
const HOLD_MS = 420;
const RULER_H = 68;
const MEMORY_KEY = 'o1fc_portion_memory';

type PortionMemory = Record<string, { unit: Unit; amount: number }>;

const snap = (v: number, unit: Unit) => Math.round(v / SCALE[unit].step) * SCALE[unit].step;

const formatServings = (n: number) => {
  const whole = Math.floor(n + 1e-9);
  const frac = Math.round((n - whole) * 4) / 4;
  const glyph = frac === 0.25 ? '¼' : frac === 0.5 ? '½' : frac === 0.75 ? '¾' : '';
  if (!glyph) return String(whole);
  return whole === 0 ? glyph : `${whole}${glyph}`;
};

/** "1 burger (352g)" → "1 burger"; pure weights like "100g" → null. */
function countLabel(serving?: string): string | null {
  if (!serving) return null;
  const stripped = serving.replace(/\(?\s*\d+(?:\.\d+)?\s*(?:g|ml)\s*\)?/gi, '').trim();
  return /[a-z]/i.test(stripped) ? stripped : null;
}

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
  const maxG = servingG ? Math.min(3000, Math.max(500, Math.ceil((servingG * 5) / 100) * 100)) : 2000;
  const memoryKey = food?.id || foodName || '';

  const [unit, setUnit] = useState<Unit>('g');
  const [pos, setPos] = useState(100);
  const [pad, setPad] = useState<string | null>(null);
  const [hold, setHold] = useState(0);
  const [width, setWidth] = useState(320);
  const [lastPortion, setLastPortion] = useState<{ unit: Unit; amount: number } | null>(null);

  const rulerRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(pos);
  const animRef = useRef<number | null>(null);
  const holdRef = useRef<number | null>(null);
  const committedRef = useRef(false);
  const tickRef = useRef({ bucket: 0, at: 0, quiet: false });
  const dragRef = useRef<{ x: number; start: number; lastX: number; lastT: number; vel: number } | null>(null);

  const max = unit === 'g' ? maxG : MAX_SERVINGS;
  const cfg = SCALE[unit];
  const amount = Math.max(0, Math.min(max, snap(pos, unit)));

  const stopAnim = () => {
    if (animRef.current != null) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  };

  const place = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(max, next));
      posRef.current = clamped;
      setPos(clamped);
      const s = SCALE[unit];
      const bucket = Math.floor(snap(clamped, unit) / s.minor + 1e-9);
      const t = tickRef.current;
      if (bucket !== t.bucket) {
        t.bucket = bucket;
        const now = performance.now();
        if (!t.quiet && now - t.at > 28) {
          t.at = now;
          if (Math.abs((bucket * s.minor) % s.major) < 1e-9) tactileEngine.triggerSelectionBuzz();
          else tactileEngine.triggerDialHaptic();
        }
      }
    },
    [max, unit]
  );

  const glideTo = useCallback(
    (target: number, ms = 260) => {
      stopAnim();
      const from = posRef.current;
      const t0 = performance.now();
      tickRef.current.quiet = true;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        const eased = 1 - Math.pow(1 - p, 3);
        place(from + (target - from) * eased);
        if (p < 1) animRef.current = requestAnimationFrame(step);
        else {
          animRef.current = null;
          tickRef.current.quiet = false;
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    [place]
  );

  useEffect(() => {
    if (!isOpen) return;
    const memory = safeStorage.getItem<PortionMemory>(MEMORY_KEY, {});
    const last = memoryKey ? memory[memoryKey] ?? null : null;
    const startUnit: Unit = !canGrams ? 'serv' : last?.unit === 'serv' && canServings ? 'serv' : 'g';
    const start = last && last.unit === startUnit ? last.amount : startUnit === 'g' ? servingG ?? 100 : 1;
    setLastPortion(last);
    setUnit(startUnit);
    posRef.current = start;
    setPos(start);
    tickRef.current = { bucket: Math.floor(start / SCALE[startUnit].minor), at: 0, quiet: false };
    setPad(null);
    setHold(0);
    committedRef.current = false;
    return () => {
      stopAnim();
      if (holdRef.current != null) cancelAnimationFrame(holdRef.current);
    };
  }, [isOpen, memoryKey, canGrams, canServings, servingG]);

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
    const converted = next === 'serv' ? snap(amount / servingG, 'serv') : snap(amount * servingG, 'g');
    const v = next === 'serv' ? Math.max(0.25, Math.min(MAX_SERVINGS, converted)) : Math.min(maxG, converted);
    setUnit(next);
    posRef.current = v;
    setPos(v);
    tickRef.current.bucket = Math.floor(v / SCALE[next].minor);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stopAnim();
    tickRef.current.quiet = false;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, start: posRef.current, lastX: e.clientX, lastT: performance.now(), vel: 0 };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.vel = 0.75 * ((e.clientX - d.lastX) / dt) + 0.25 * d.vel;
    d.lastX = e.clientX;
    d.lastT = now;
    place(d.start - (e.clientX - d.x) / cfg.ppu);
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    let vel = performance.now() - d.lastT > 80 ? 0 : d.vel;
    if (Math.abs(vel) < 0.08) {
      glideTo(snap(posRef.current, unit), 120);
      return;
    }
    let prev = performance.now();
    const coast = (t: number) => {
      const dt = t - prev;
      prev = t;
      place(posRef.current - (vel * dt) / cfg.ppu);
      vel *= Math.pow(0.994, dt);
      const atEdge = posRef.current <= 0 || posRef.current >= max;
      if (Math.abs(vel) > 0.03 && !atEdge) animRef.current = requestAnimationFrame(coast);
      else {
        animRef.current = null;
        glideTo(snap(posRef.current, unit), 120);
      }
    };
    animRef.current = requestAnimationFrame(coast);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    stopAnim();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    place(snap(posRef.current + delta / cfg.ppu, unit));
  };

  const onRulerKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = e.shiftKey ? cfg.major : cfg.minor;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') place(snap(posRef.current + big, unit));
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') place(snap(posRef.current - big, unit));
    else return;
    e.preventDefault();
  };

  const padValue = pad != null && pad !== '' && pad !== '.' ? parseFloat(pad) : null;
  const shown = pad != null ? Math.min(max, padValue ?? 0) : amount;
  const scale = unit === 'g' ? (servingG ? shown / servingG : shown / 100) : shown;
  const kcal = Math.round(food.calories * scale);
  const macros = [
    { key: 'P', name: 'Protein', value: round1(food.protein * scale), left: budget?.protein, color: 'bg-o1-crimson', text: 'text-o1-crimson' },
    { key: 'C', name: 'Carbs', value: round1(food.carbs * scale), left: budget?.carbs, color: 'bg-amber-500', text: 'text-amber-500' },
    { key: 'F', name: 'Fat', value: round1(food.fats * scale), left: budget?.fats, color: 'bg-emerald-500', text: 'text-emerald-500' },
  ];

  const portionText =
    unit === 'g'
      ? `${shown} g${servingG && label && Math.abs(shown - servingG) < 0.5 ? ` · ${label}` : ''}`
      : `${formatServings(shown)} × ${label || 'serving'}`;

  const chips: { id: string; text: string; unit: Unit; value: number }[] = [];
  if (unit === 'g' && servingG) {
    chips.push(
      { id: 'half', text: '½ serve', unit: 'g', value: snap(servingG / 2, 'g') },
      { id: 'one', text: label ? `1 · ${servingG}g` : `${servingG} g`, unit: 'g', value: servingG },
      { id: 'two', text: '2 serves', unit: 'g', value: Math.min(maxG, servingG * 2) }
    );
    if (servingG !== 100) chips.push({ id: '100', text: '100 g', unit: 'g', value: 100 });
  } else if (unit === 'serv') {
    [0.5, 1, 1.5, 2, 3].forEach((v) => chips.push({ id: `s${v}`, text: `${formatServings(v)}×`, unit: 'serv', value: v }));
  }
  if (lastPortion && lastPortion.unit === unit && !chips.some((c) => c.value === lastPortion.amount)) {
    chips.unshift({
      id: 'last',
      text: `Last · ${unit === 'g' ? `${lastPortion.amount} g` : `${formatServings(lastPortion.amount)}×`}`,
      unit,
      value: lastPortion.amount,
    });
  }

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
    if (padValue != null) {
      const v = snap(Math.min(max, padValue), unit);
      posRef.current = v;
      setPos(v);
      tickRef.current.bucket = Math.floor(v / cfg.minor);
    }
    tactileEngine.triggerSelectionBuzz();
    setPad(null);
  };

  const ticks: React.ReactNode[] = [];
  const halfSpan = width / 2 / cfg.ppu + cfg.major;
  const first = Math.max(0, Math.ceil((pos - halfSpan) / cfg.minor));
  const last = Math.floor(Math.min(max, pos + halfSpan) / cfg.minor + 1e-9);
  const perMajor = Math.round(cfg.major / cfg.minor);
  const perMid = Math.round(cfg.mid / cfg.minor);
  for (let i = first; i <= last; i++) {
    const v = i * cfg.minor;
    const x = width / 2 + (v - pos) * cfg.ppu;
    const major = i % perMajor === 0;
    const mid = !major && i % perMid === 0;
    const h = major ? 28 : mid ? 18 : 10;
    const passed = v <= pos + 1e-9;
    ticks.push(
      <line
        key={i}
        x1={x}
        x2={x}
        y1={14}
        y2={14 + h}
        stroke={passed ? '#EAE8DF' : '#8A887F'}
        strokeOpacity={passed ? (major ? 0.9 : 0.55) : major ? 0.55 : 0.28}
        strokeWidth={major ? 1.6 : 1}
        strokeLinecap="round"
      />
    );
    if (major) {
      const text = unit === 'g' ? (v >= 1000 ? `${round1(v / 1000)}kg` : String(v)) : `${v}×`;
      ticks.push(
        <text
          key={`l${i}`}
          x={x}
          y={58}
          textAnchor="middle"
          fontSize="10"
          fontWeight={600}
          fill={passed ? '#EAE8DF' : '#8A887F'}
          fillOpacity={passed ? 0.85 : 0.6}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {text}
        </text>
      );
    }
  }
  const serveMarkX = unit === 'g' && servingG ? width / 2 + (servingG - pos) * cfg.ppu : null;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', unit === 'serv' ? '.' : '', '0', 'back'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 o1-sheet-scrim flex items-center justify-center animate-in fade-in duration-150 select-none">
      <div className="o1-sheet-card w-full bg-o1-sheet border border-white/[0.07] shadow-xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-o1-text truncate">{foodName}</p>
            <p className="text-[11px] text-o1-muted truncate">
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
              <div className="inline-flex p-0.5 rounded-full bg-o1-surface border border-white/[0.07]" role="tablist">
                {(['g', 'serv'] as Unit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="tab"
                    aria-selected={unit === u}
                    onClick={() => switchUnit(u)}
                    className={`px-4 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
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
                  <span className="text-o1-muted">{unit === 'g' ? 'g' : `× ${label || 'serving'}`}</span>
                </>
              ) : (
                portionText
              )}
            </span>
            {budget && budget.kcal > 0 && (
              <span className="block mt-1.5 text-[11px] text-o1-muted tabular-nums">
                {kcal <= budget.kcal
                  ? `${Math.round((kcal / budget.kcal) * 100)}% of the ${budget.kcal.toLocaleString()} kcal left today`
                  : `${(kcal - budget.kcal).toLocaleString()} kcal over what's left today`}
              </span>
            )}
          </button>

          {pad == null ? (
            <>
              <div
                ref={rulerRef}
                role="slider"
                tabIndex={0}
                aria-label={unit === 'g' ? 'Portion in grams' : 'Portion in servings'}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={amount}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                onKeyDown={onRulerKey}
                className="relative rounded-2xl bg-o1-surface border border-white/[0.07] touch-none cursor-grab active:cursor-grabbing outline-none focus-visible:border-white/20 overflow-hidden"
                style={{
                  height: RULER_H,
                  maskImage: 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)',
                  WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 16%, #000 84%, transparent)',
                }}
              >
                <svg width={width} height={RULER_H} className="block">
                  {ticks}
                  {serveMarkX != null && serveMarkX > -8 && serveMarkX < width + 8 && (
                    <circle cx={serveMarkX} cy={7} r={2.5} fill="#D4A017" />
                  )}
                  <rect x={width / 2 - 1} y={4} width={2} height={42} rx={1} fill="#C4121A" />
                  <path d={`M ${width / 2 - 5} 2 L ${width / 2 + 5} 2 L ${width / 2} 8 Z`} fill="#C4121A" />
                </svg>
              </div>

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
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold tabular-nums border transition-colors cursor-pointer ${
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
            <div className="grid grid-cols-3 gap-1.5">
              {keys.map((k, i) =>
                k === '' ? (
                  <span key={i} />
                ) : (
                  <button
                    key={k}
                    type="button"
                    onClick={() => pressKey(k)}
                    className="h-12 rounded-2xl bg-o1-surface border border-white/[0.05] text-xl font-semibold tabular-nums text-o1-text flex items-center justify-center active:bg-white/[0.1] active:scale-[0.97] transition-transform cursor-pointer"
                    aria-label={k === 'back' ? 'Delete digit' : k}
                  >
                    {k === 'back' ? <Delete className="w-5 h-5 text-o1-muted" /> : k}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  setPad(null);
                }}
                className="h-11 rounded-2xl text-xs font-bold text-o1-muted hover:text-o1-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyPad}
                className="col-span-2 h-11 rounded-2xl bg-o1-text text-black text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
              >
                Set {padValue != null ? (unit === 'g' ? `${Math.min(max, padValue)} g` : `${formatServings(snap(Math.min(max, padValue), 'serv'))}×`) : ''}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {macros.map((m) => {
              const hasBudget = budget != null && m.left != null && m.left > 0;
              const share = hasBudget ? m.value / (m.left as number) : 0;
              const over = hasBudget && share > 1;
              return (
                <div key={m.key} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-[10px] font-semibold text-o1-muted">{m.name}</span>
                    <span className={`text-xs font-bold tabular-nums ${m.text}`}>{m.value}g</span>
                  </div>
                  {hasBudget && (
                    <>
                      <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${over ? 'bg-amber-500' : m.color} transition-[width] duration-150`}
                          style={{ width: `${Math.min(100, share * 100)}%` }}
                        />
                      </div>
                      <p className={`mt-1 text-[10px] tabular-nums ${over ? 'text-amber-500' : 'text-o1-muted'}`}>
                        {over ? `+${round1(m.value - (m.left as number))}g over` : `${Math.round(share * 100)}% of left`}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

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
            <span className="absolute inset-y-0 left-0 bg-o1-crimson" style={{ width: `${hold * 100}%` }} />
            <span className="relative tabular-nums">
              {hold > 0 ? 'Keep holding…' : `Hold to log · ${kcal.toLocaleString()} kcal`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
