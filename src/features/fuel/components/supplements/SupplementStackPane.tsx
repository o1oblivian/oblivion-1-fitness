import React, { useState } from 'react';
import { Globe, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import { apiFetch } from '../../../../services/apiBase';
import {
  useFuelStore,
  SupplementItem,
  SupplementTiming,
  SupplementUnit,
} from '../../store/useFuelStore';
import {
  EVIDENCE_COPY,
  LibrarySupplement,
  formatDose,
  scaledAmount,
  searchLibrary,
} from '../../data/supplementLibrary';
import {
  SupplementComposer,
  SupplementComposerResult,
  SupplementDraft,
} from './SupplementComposer';

interface OnlineResult {
  name: string;
  category?: string;
  clinicalDosage?: string;
  timing?: string;
  primaryBenefits?: string;
}

interface SupplementStackPaneProps {
  weightKg: number | null;
  onShowToast?: (msg: string) => void;
}

type ComposerState =
  { mode: 'add'; draft: SupplementDraft } | { mode: 'edit'; draft: SupplementDraft; id: string };

const UNIT_PATTERN =
  /(\d+(?:\.\d+)?)\s*(mcg|µg|mg|g|iu|ml|caps?|capsules?|tabs?|tablets?|scoops?)\b/i;

function unitFrom(raw: string): SupplementUnit {
  const u = raw.toLowerCase();
  if (u === 'µg' || u === 'mcg') return 'mcg';
  if (u === 'iu') return 'IU';
  if (u.startsWith('cap')) return 'caps';
  if (u.startsWith('tab')) return 'tabs';
  if (u.startsWith('scoop')) return 'scoop';
  return u as SupplementUnit;
}

function timingFrom(raw?: string): SupplementTiming {
  const t = (raw ?? '').toLowerCase();
  if (t.includes('pre')) return 'Pre-Workout';
  if (t.includes('post')) return 'Post-Workout';
  if (t.includes('evening') || t.includes('night') || t.includes('bed')) return 'Evening';
  if (t.includes('morning')) return 'Morning';
  return 'Anytime';
}

function draftFromLibrary(entry: LibrarySupplement, weightKg: number | null): SupplementDraft {
  const amount = scaledAmount(entry, weightKg);
  return {
    name: entry.name,
    amount: String(amount),
    unit: entry.unit,
    timing: entry.timing,
    caffeineMg: entry.caffeineMgPerUnit ? String(Math.round(amount * entry.caffeineMgPerUnit)) : '',
    category: entry.category,
    evidence: entry.evidence,
    note: entry.perKg && weightKg ? `${entry.note} Scaled to ${weightKg} kg.` : entry.note,
    caffeineMgPerUnit: entry.caffeineMgPerUnit,
  };
}

function draftFromOnline(result: OnlineResult): SupplementDraft {
  const match = result.clinicalDosage?.match(UNIT_PATTERN);
  return {
    name: result.name,
    amount: match ? match[1] : '',
    unit: match ? unitFrom(match[2]) : 'mg',
    timing: timingFrom(result.timing),
    caffeineMg: '',
    category: result.category || 'Supplement',
    note: [
      result.clinicalDosage && `Typical dose: ${result.clinicalDosage}.`,
      result.primaryBenefits,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function draftFromItem(item: SupplementItem): SupplementDraft {
  const match = item.amount == null ? item.dosage.match(UNIT_PATTERN) : null;
  return {
    name: item.name,
    amount: item.amount != null ? String(item.amount) : match ? match[1] : '',
    unit: item.unit ?? (match ? unitFrom(match[2]) : 'mg'),
    timing: item.timing,
    caffeineMg: item.caffeineMg ? String(item.caffeineMg) : '',
    category: item.category,
    evidence: item.evidence,
    note: item.benefits,
  };
}

function blankDraft(name: string): SupplementDraft {
  return { name, amount: '', unit: 'mg', timing: 'Anytime', caffeineMg: '', category: 'Custom' };
}

export const SupplementStackPane: React.FC<SupplementStackPaneProps> = ({
  weightKg,
  onShowToast,
}) => {
  const stack = useFuelStore((s) => s.supplementStack);
  const { setSupplementStack } = useFuelStore.getState();

  const [query, setQuery] = useState('');
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [online, setOnline] = useState<{
    status: 'idle' | 'loading' | 'done' | 'error';
    results: OnlineResult[];
  }>({
    status: 'idle',
    results: [],
  });

  const owned = new Set(stack.map((s) => s.name.trim().toLowerCase()));
  const isOwned = (name: string) => owned.has(name.trim().toLowerCase());
  const trimmed = query.trim();
  const libraryMatches = searchLibrary(trimmed);

  const openComposer = (state: ComposerState) => {
    tactileEngine.triggerSelectionBuzz();
    setComposer(state);
  };

  const searchOnline = async () => {
    tactileEngine.triggerSelectionBuzz();
    setOnline({ status: 'loading', results: [] });
    try {
      const res = await apiFetch(`/api/fuel/supplement-search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOnline({
        status: 'done',
        results: Array.isArray(data.supplements) ? data.supplements : [],
      });
    } catch {
      setOnline({ status: 'error', results: [] });
    }
  };

  const save = (result: SupplementComposerResult) => {
    if (!composer) return;
    const base = {
      name: result.name,
      dosage: formatDose(result.amount, result.unit),
      amount: result.amount,
      unit: result.unit,
      timing: result.timing,
      category: result.category,
      ...(result.caffeineMg ? { caffeineMg: result.caffeineMg } : {}),
      ...(result.evidence ? { evidence: result.evidence } : {}),
      ...(result.note ? { benefits: result.note } : {}),
    };
    if (composer.mode === 'edit') {
      setSupplementStack(stack.map((s) => (s.id === composer.id ? { id: s.id, ...base } : s)));
      onShowToast?.(`Updated ${result.name}`);
    } else {
      setSupplementStack([
        ...stack,
        { id: `supp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...base },
      ]);
      onShowToast?.(`Added ${result.name} · ${base.dosage}`);
      setQuery('');
      setOnline({ status: 'idle', results: [] });
    }
    setComposer(null);
  };

  const remove = (item: SupplementItem) => {
    tactileEngine.triggerSelectionBuzz();
    setSupplementStack(stack.filter((s) => s.id !== item.id));
    onShowToast?.(`Removed ${item.name}`);
  };

  if (composer) {
    return (
      <SupplementComposer
        key={composer.mode === 'edit' ? composer.id : composer.draft.name}
        mode={composer.mode}
        initial={composer.draft}
        duplicate={isOwned}
        onSubmit={save}
        onCancel={() => setComposer(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {stack.length > 0 && (
        <section aria-label="Your stack" className="space-y-1.5">
          <h5 className="text-o1-label font-semibold text-o1-muted">Your stack · {stack.length}</h5>
          {stack.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-2xl border border-white/[0.08] flex items-center gap-2"
            >
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-o1-text truncate">
                  {item.name}
                </span>
                <span className="block text-o1-label text-o1-muted mt-0.5 truncate tabular-nums">
                  {item.dosage} · {item.timing}
                  {item.caffeineMg ? ` · ${item.caffeineMg} mg caffeine` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  openComposer({ mode: 'edit', id: item.id, draft: draftFromItem(item) })
                }
                aria-label={`Edit ${item.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-o1-muted hover:text-o1-text cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Remove ${item.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-o1-muted hover:text-o1-crimson cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-o1-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOnline({ status: 'idle', results: [] });
          }}
          placeholder="Search creatine, vitamin D, magnesium…"
          aria-label="Search supplements"
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-o1-surface border border-white/[0.08] text-sm text-o1-text focus:outline-none focus:border-white/30"
        />
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {libraryMatches.map((entry) => {
          const added = isOwned(entry.name);
          const amount = scaledAmount(entry, weightKg);
          return (
            <button
              key={entry.name}
              type="button"
              disabled={added}
              onClick={() =>
                openComposer({ mode: 'add', draft: draftFromLibrary(entry, weightKg) })
              }
              className="w-full p-2.5 rounded-2xl border border-white/[0.08] flex items-center gap-2.5 text-left cursor-pointer disabled:cursor-default disabled:opacity-50 hover:border-white/20"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-o1-text truncate">{entry.name}</span>
                  <span
                    className={`shrink-0 h-4 px-1.5 rounded-full border text-o1-label font-medium inline-flex items-center ${EVIDENCE_COPY[entry.evidence].className}`}
                  >
                    {EVIDENCE_COPY[entry.evidence].label.split(' ')[0]}
                  </span>
                </span>
                <span className="block text-o1-label text-o1-muted mt-0.5 truncate tabular-nums">
                  {formatDose(amount, entry.unit)} · {entry.timing} · {entry.category}
                </span>
              </span>
              <span className="shrink-0 text-o1-label font-medium text-o1-muted">
                {added ? (
                  'Added'
                ) : (
                  <Plus className="w-4 h-4 text-o1-text" aria-label={`Add ${entry.name}`} />
                )}
              </span>
            </button>
          );
        })}

        {online.results.map((result) => (
          <button
            key={`online-${result.name}`}
            type="button"
            disabled={isOwned(result.name)}
            onClick={() => openComposer({ mode: 'add', draft: draftFromOnline(result) })}
            className="w-full p-2.5 rounded-2xl border border-white/[0.08] flex items-center gap-2.5 text-left cursor-pointer disabled:opacity-50 hover:border-white/20"
          >
            <Globe className="w-4 h-4 text-sky-600 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-o1-text truncate">
                {result.name}
              </span>
              <span className="block text-o1-label text-o1-muted mt-0.5 truncate">
                {[result.clinicalDosage, result.category].filter(Boolean).join(' · ')}
              </span>
            </span>
            <Plus className="w-4 h-4 text-o1-text shrink-0" aria-hidden />
          </button>
        ))}

        {trimmed && libraryMatches.length === 0 && online.status !== 'done' && (
          <p className="text-center py-2 text-o1-label text-o1-muted">
            {online.status === 'loading'
              ? 'Searching online…'
              : online.status === 'error'
                ? 'Online search unavailable. Add it manually below.'
                : `"${trimmed}" isn't in the library.`}
          </p>
        )}
        {online.status === 'done' && online.results.length === 0 && (
          <p className="text-center py-2 text-o1-label text-o1-muted">
            No online matches. Add it manually below.
          </p>
        )}
      </div>

      {trimmed.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {libraryMatches.length === 0 && trimmed.length >= 3 && online.status === 'idle' ? (
            <button
              type="button"
              onClick={() => void searchOnline()}
              className="h-10 rounded-xl border border-white/[0.08] text-xs font-medium text-o1-text flex items-center justify-center gap-1.5 cursor-pointer hover:border-sky-600/60"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              Search online
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={isOwned(trimmed)}
            onClick={() => openComposer({ mode: 'add', draft: blankDraft(trimmed) })}
            className="h-10 rounded-xl bg-o1-crimson hover:bg-o1-crimson-hover active:bg-o1-crimson-press disabled:opacity-30 text-o1-text text-xs font-semibold cursor-pointer truncate px-2"
          >
            Add "{trimmed}"
          </button>
        </div>
      )}
      {!trimmed && (
        <button
          type="button"
          onClick={() => openComposer({ mode: 'add', draft: blankDraft('') })}
          className="w-full h-10 rounded-xl border border-white/[0.08] text-xs font-medium text-o1-text flex items-center justify-center gap-1.5 cursor-pointer hover:border-white/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Custom supplement
        </button>
      )}
    </div>
  );
};
