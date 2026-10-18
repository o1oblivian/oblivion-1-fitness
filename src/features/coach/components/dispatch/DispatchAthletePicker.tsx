import React, { useMemo, useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';
import { tactileEngine } from '../../../../services/tactileEngine';
import type { Athlete } from '../../services/coachService';

interface DispatchAthletePickerProps {
  athletes: Athlete[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

function statusTone(status: Athlete['status']): string {
  if (status === 'Active') return 'bg-emerald-500/10 text-emerald-400';
  if (status === 'Need Routine') return 'bg-amber-500/10 text-amber-400';
  return 'bg-white/[0.08] text-o1-muted';
}

export const DispatchAthletePicker: React.FC<DispatchAthletePickerProps> = ({
  athletes,
  selectedIds,
  onChange,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter((a) => `${a.name} ${a.handle} ${a.status}`.toLowerCase().includes(q));
  }, [athletes, query]);

  const toggle = (id: string) => {
    tactileEngine.triggerSelectionBuzz();
    onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const count = selectedIds.length;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose athletes"
    >
      <div className="w-full max-w-md bg-o1-sheet rounded-2xl border border-white/[0.07] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-o1-crimson/10 text-o1-crimson flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-o1-text">Athletes ({count})</h3>
              <p className="text-o1-label text-o1-muted">Choose who gets this workout</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center text-o1-muted"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-3 border-b border-white/[0.07] bg-o1-surface space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-o1-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or status"
              aria-label="Search athletes"
              className="w-full h-10 pl-8 pr-3 rounded-xl bg-o1-sheet border border-white/[0.07] text-xs text-o1-text placeholder:text-o1-muted outline-none focus:border-o1-crimson"
            />
          </div>
          <div className="flex items-center justify-between text-xs px-0.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onChange(athletes.map((a) => a.id));
                }}
                className="h-8 text-o1-label font-bold text-o1-crimson"
              >
                Select all ({athletes.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  tactileEngine.triggerSelectionBuzz();
                  onChange([]);
                }}
                className="h-8 text-o1-label font-medium text-o1-muted"
              >
                Clear
              </button>
            </div>
            <span className="text-o1-label text-o1-muted font-mono">
              {count} of {athletes.length}
            </span>
          </div>
        </div>

        <div className="p-3 overflow-y-auto space-y-1.5 max-h-[50vh]">
          {visible.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-xs font-semibold text-o1-muted">
                {athletes.length ? 'No athletes match.' : 'No athletes yet.'}
              </p>
              {athletes.length === 0 ? (
                <p className="text-o1-label text-o1-muted">
                  Share your invite link from the Coach tab to add athletes.
                </p>
              ) : null}
            </div>
          ) : (
            visible.map((ath) => {
              const on = selected.has(ath.id);
              return (
                <button
                  key={ath.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(ath.id)}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 ${
                    on ? 'border-o1-crimson bg-o1-crimson/10' : 'border-white/[0.07] bg-o1-sheet'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-o1-crimson border-o1-crimson text-white' : 'border-white/[0.15]'}`}
                    >
                      {on ? <Check size={12} strokeWidth={3} /> : null}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-o1-surface overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-o1-text">
                      {ath.avatar ? (
                        <img src={ath.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        ath.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-o1-text truncate">
                        {ath.name}
                      </span>
                      <span className="block text-o1-label text-o1-muted">
                        Readiness {ath.readiness != null ? `${ath.readiness}%` : '--'}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`text-o1-label px-2 py-0.5 rounded-full font-bold shrink-0 ${statusTone(ath.status)}`}
                  >
                    {ath.status}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3.5 border-t border-white/[0.07] bg-o1-surface flex items-center justify-between">
          <span className="text-xs font-semibold text-o1-muted">
            {count === 0
              ? 'No athletes selected'
              : count === 1
                ? '1 athlete gets this workout'
                : `${count} athletes get this workout`}
          </span>
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onClose();
            }}
            className="h-10 px-4 rounded-xl bg-o1-crimson text-white text-xs font-bold active:bg-o1-crimson-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
