import React, { useState } from 'react';
import { StorefrontStats, saveStorefront } from '../../../reels/services/coachStorefront';

type Draft = { years: string; capacity: string; monthly: string };

const FIELDS: [keyof Draft, string][] = [
  ['years', 'Years coaching'],
  ['capacity', 'Athlete spots'],
  ['monthly', 'Monthly price (USD)'],
];

function wholeOrNull(raw: string): number | null {
  const n = Number(raw);
  return raw.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

interface StorefrontEditorProps {
  stats: StorefrontStats;
  onSaved: (next: Pick<StorefrontStats, 'years' | 'capacity' | 'monthlyPriceCents'>) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

/** The coach's public offer: experience, open spots, and monthly price. */
export const StorefrontEditor: React.FC<StorefrontEditorProps> = ({ stats, onSaved, onCancel, onError }) => {
  const [draft, setDraft] = useState<Draft>({
    years: stats.years != null ? String(stats.years) : '',
    capacity: stats.capacity != null ? String(stats.capacity) : '',
    monthly: stats.monthlyPriceCents != null ? String(stats.monthlyPriceCents / 100) : '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const years = wholeOrNull(draft.years);
    const capacity = wholeOrNull(draft.capacity);
    const monthlyRaw = Number(draft.monthly);
    const monthlyPriceCents = draft.monthly.trim() && Number.isFinite(monthlyRaw) && monthlyRaw >= 0 ? Math.round(monthlyRaw * 100) : null;
    setSaving(true);
    const ok = await saveStorefront({ years, capacity, monthlyPriceCents });
    setSaving(false);
    if (!ok) {
      onError('Could not save. Check your connection.');
      return;
    }
    onSaved({ years, capacity, monthlyPriceCents });
  };

  return (
    <div className="space-y-2 rounded-2xl border border-white/[0.07] bg-o1-surface p-3">
      {FIELDS.map(([key, label]) => (
        <label key={key} className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-o1-muted">{label}</span>
          <input
            inputMode="decimal"
            value={draft[key]}
            onChange={(event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }))}
            className="h-[44px] w-28 rounded-xl border border-white/[0.07] bg-o1-canvas px-3 text-right text-[13px] text-o1-text outline-none focus:border-o1-crimson"
          />
        </label>
      ))}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="h-[44px] flex-1 rounded-xl border border-white/[0.07] text-[13px] font-semibold text-o1-text">
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="h-[44px] flex-1 rounded-xl bg-o1-crimson text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Saving' : 'Save'}
        </button>
      </div>
    </div>
  );
};
