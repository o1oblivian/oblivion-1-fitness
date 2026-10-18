import React, { useState } from 'react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { sanitizeNumericInput } from '../../../../utils/numberInputUtils';
import type {
  SupplementEvidence,
  SupplementTiming,
  SupplementUnit,
} from '../../services/fuelCloud';
import { EVIDENCE_COPY } from '../../data/supplementLibrary';

export const SUPPLEMENT_TIMINGS: SupplementTiming[] = [
  'Morning',
  'Pre-Workout',
  'Post-Workout',
  'Evening',
  'Anytime',
];
const UNITS: SupplementUnit[] = ['mg', 'g', 'mcg', 'IU', 'caps', 'tabs', 'scoop', 'ml'];

export interface SupplementDraft {
  name: string;
  amount: string;
  unit: SupplementUnit;
  timing: SupplementTiming;
  caffeineMg: string;
  category: string;
  evidence?: SupplementEvidence;
  note?: string;
  caffeineMgPerUnit?: number;
}

export interface SupplementComposerResult {
  name: string;
  amount: number;
  unit: SupplementUnit;
  timing: SupplementTiming;
  caffeineMg?: number;
  category: string;
  evidence?: SupplementEvidence;
  note?: string;
}

interface SupplementComposerProps {
  mode: 'add' | 'edit';
  initial: SupplementDraft;
  duplicate: (name: string) => boolean;
  onSubmit: (result: SupplementComposerResult) => void;
  onCancel: () => void;
}

function decimalOnly(raw: string): string {
  const [whole, ...rest] = raw.replace(/[^0-9.]/g, '').split('.');
  return sanitizeNumericInput(rest.length > 0 ? `${whole}.${rest.join('').slice(0, 2)}` : whole);
}

const fieldClass =
  'w-full h-10 px-3 rounded-xl bg-o1-surface border border-white/[0.08] text-sm text-o1-text focus:outline-none focus:border-white/30';

export const SupplementComposer: React.FC<SupplementComposerProps> = ({
  mode,
  initial,
  duplicate,
  onSubmit,
  onCancel,
}) => {
  const [draft, setDraft] = useState<SupplementDraft>(initial);
  const [caffeineTouched, setCaffeineTouched] = useState(false);

  const amount = parseFloat(draft.amount);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const name = draft.name.trim();
  const isDuplicate = mode === 'add' && name.length > 0 && duplicate(name);
  const canSave = name.length > 0 && amountValid && !isDuplicate;

  const setAmount = (raw: string) => {
    const clean = decimalOnly(raw);
    setDraft((d) => {
      const next = { ...d, amount: clean };
      const n = parseFloat(clean);
      if (!caffeineTouched && d.caffeineMgPerUnit && Number.isFinite(n)) {
        next.caffeineMg = String(Math.round(n * d.caffeineMgPerUnit));
      }
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    tactileEngine.triggerImpactPulse();
    const caffeine = parseInt(draft.caffeineMg, 10);
    onSubmit({
      name,
      amount: Math.round(amount * 100) / 100,
      unit: draft.unit,
      timing: draft.timing,
      caffeineMg: Number.isFinite(caffeine) && caffeine > 0 ? caffeine : undefined,
      category: draft.category,
      evidence: draft.evidence,
      note: draft.note,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/[0.08] p-3 space-y-3 animate-in fade-in duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <h5 className="text-xs font-semibold text-o1-text">
          {mode === 'add' ? 'Add to stack' : 'Edit supplement'}
        </h5>
        {draft.evidence && (
          <span
            className={`shrink-0 h-5 px-2 rounded-full border text-o1-label font-medium inline-flex items-center ${EVIDENCE_COPY[draft.evidence].className}`}
          >
            {EVIDENCE_COPY[draft.evidence].label}
          </span>
        )}
      </div>
      {draft.note && <p className="text-o1-label text-o1-muted -mt-1.5">{draft.note}</p>}

      <label className="block">
        <span className="block text-o1-label text-o1-muted mb-1">Name</span>
        <input
          type="text"
          value={draft.name}
          maxLength={60}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Creatine monohydrate"
          className={fieldClass}
          aria-invalid={isDuplicate}
        />
        {isDuplicate && (
          <span className="block mt-1 text-o1-label text-o1-crimson">Already in your stack</span>
        )}
      </label>

      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <label className="block">
          <span className="block text-o1-label text-o1-muted mb-1">Dose</span>
          <input
            type="text"
            inputMode="decimal"
            value={draft.amount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="--"
            className={`${fieldClass} tabular-nums`}
            aria-label="Dose amount"
          />
        </label>
        <label className="block">
          <span className="block text-o1-label text-o1-muted mb-1">Caffeine mg</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft.caffeineMg}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              setCaffeineTouched(true);
              setDraft((d) => ({
                ...d,
                caffeineMg: sanitizeNumericInput(e.target.value.replace(/\D/g, '').slice(0, 4)),
              }));
            }}
            placeholder="0"
            className={`${fieldClass} w-24 tabular-nums text-center`}
            aria-label="Caffeine per dose in milligrams"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Unit">
        {UNITS.map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={draft.unit === u}
            onClick={() => setDraft((d) => ({ ...d, unit: u }))}
            className={`h-7 px-2.5 rounded-lg border text-o1-label font-medium cursor-pointer ${
              draft.unit === u
                ? 'border-o1-crimson text-o1-text'
                : 'border-white/[0.08] text-o1-muted'
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      <div>
        <span className="block text-o1-label text-o1-muted mb-1">When</span>
        <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Timing">
          {SUPPLEMENT_TIMINGS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={draft.timing === t}
              onClick={() => setDraft((d) => ({ ...d, timing: t }))}
              className={`h-8 rounded-lg border text-o1-label font-medium cursor-pointer ${
                draft.timing === t
                  ? 'border-o1-crimson text-o1-text'
                  : 'border-white/[0.08] text-o1-muted'
              }`}
            >
              {t === 'Pre-Workout' ? 'Pre' : t === 'Post-Workout' ? 'Post' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-white/[0.08] text-sm text-o1-muted hover:text-o1-text cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="h-10 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press disabled:opacity-30 disabled:cursor-not-allowed text-o1-text text-sm font-semibold cursor-pointer"
        >
          {mode === 'add' ? 'Add' : 'Save'}
        </button>
      </div>
    </form>
  );
};
