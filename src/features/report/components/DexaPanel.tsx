import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { toDayKey } from '../reportEngine';
import {
  LEAN_SEGMENTS,
  deleteDexaScan,
  draftFromScan,
  emptyDraft,
  limbGap,
  parseDraft,
  readDexaScans,
  scanAgeDays,
  upsertDexaScan,
  type DexaDraft,
  type DexaScan,
  type LeanSegment,
} from '../dexaStore';
import { SectionCard } from './IntelParts';

const inputCls =
  'w-full min-h-[44px] rounded-xl bg-[#111113] border border-white/[0.07] px-3 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30';

const fmtDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ageText = (days: number) =>
  days === 0 ? 'today' : days < 60 ? `${days} days ago` : `${Math.round(days / 30)} months ago`;

const signed = (v: number, unit: string) => `${v > 0 ? '+' : ''}${Math.round(v * 100) / 100}${unit}`;

export const DexaPanel: React.FC = () => {
  const [scans, setScans] = useState<DexaScan[]>(readDexaScans);
  const [draft, setDraft] = useState<DexaDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latest = scans[0] ?? null;
  const previous = scans[1] ?? null;

  const openForm = (scan?: DexaScan) => {
    tactileEngine.selection();
    setDraft(scan ? draftFromScan(scan) : emptyDraft());
    setEditingId(scan?.id ?? null);
    setError(null);
  };

  const closeForm = () => {
    setDraft(null);
    setEditingId(null);
    setError(null);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const result = parseDraft(draft, editingId);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    tactileEngine.selection();
    setScans(upsertDexaScan(result.scan));
    closeForm();
  };

  const remove = (id: string) => {
    tactileEngine.selection();
    setScans(deleteDexaScan(id));
    if (editingId === id) closeForm();
  };

  const armGap = latest ? limbGap(latest, 'arm') : null;
  const legGap = latest ? limbGap(latest, 'leg') : null;

  return (
    <SectionCard title="DEXA scan results" subtitle="Entered by you from your clinical scan report">
      {draft ? (
        <form onSubmit={save} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500">Scan date</span>
              <input
                type="date"
                max={toDayKey(Date.now())}
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500">Body fat %</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="e.g. 14.2"
                value={draft.bodyFatPct}
                onChange={(e) => setDraft({ ...draft, bodyFatPct: e.target.value })}
                className={inputCls}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-500">
              Segmental lean mass (kg, optional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {LEAN_SEGMENTS.map((seg) => (
                <label key={seg.id} className="space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500">{seg.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={draft.lean[seg.id as LeanSegment]}
                    onChange={(e) => setDraft({ ...draft, lean: { ...draft.lean, [seg.id]: e.target.value } })}
                    className={inputCls}
                  />
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-[11px] font-mono text-[#d97706]">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 min-h-[44px] rounded-xl bg-white/5 border border-white/[0.07] text-xs font-mono font-bold tracking-wider text-neutral-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] rounded-xl bg-o1-crimson text-white text-xs font-bold tracking-wider cursor-pointer"
            >
              Save scan
            </button>
          </div>
        </form>
      ) : latest ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-3xl font-black font-mono tabular-nums leading-none">
                {latest.bodyFatPct}
                <span className="text-sm text-neutral-500"> % body fat</span>
              </div>
              <div className="text-[11px] font-mono text-neutral-500 mt-1.5">
                Scanned {fmtDate(latest.date)} · {ageText(scanAgeDays(latest))}
              </div>
              {previous && (
                <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                  {signed(Math.round((latest.bodyFatPct - previous.bodyFatPct) * 10) / 10, ' pts')} since{' '}
                  {fmtDate(previous.date)}
                </div>
              )}
            </div>
            <div className="flex items-center -mr-2 -mt-1">
              <button
                type="button"
                aria-label="Edit latest scan"
                onClick={() => openForm(latest)}
                className="w-11 h-11 flex items-center justify-center text-neutral-400 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Delete latest scan"
                onClick={() => remove(latest.id)}
                className="w-11 h-11 flex items-center justify-center text-neutral-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {LEAN_SEGMENTS.some((s) => latest.lean[s.id] !== undefined) && (
            <ul className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
              {LEAN_SEGMENTS.map((seg) => {
                const v = latest.lean[seg.id];
                const prev = previous?.lean[seg.id];
                return (
                  <li key={seg.id} className="min-h-[44px] flex items-center justify-between gap-3 text-xs">
                    <span className="text-neutral-300">{seg.label}</span>
                    <span className="font-mono">
                      <span className="text-white font-bold">{v === undefined ? '--' : `${v} kg`}</span>
                      {v !== undefined && prev !== undefined && (
                        <span className="text-neutral-500 ml-2">{signed(v - prev, '')}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {(armGap !== null || legGap !== null) && (
            <div className="rounded-xl bg-[#111113] border border-white/[0.07] px-3 py-2 text-[11px] font-mono text-neutral-400 space-y-0.5">
              {armGap !== null && <div>Arm left − right: {signed(armGap, ' kg')}</div>}
              {legGap !== null && <div>Leg left − right: {signed(legGap, ' kg')}</div>}
            </div>
          )}

          {scans.length > 1 && (
            <p className="text-[10px] font-mono text-neutral-600">{scans.length} scans saved on this device.</p>
          )}

          <button
            type="button"
            onClick={() => openForm()}
            className="w-full min-h-[44px] rounded-xl bg-white/5 border border-white/[0.07] text-xs font-mono font-bold tracking-wider text-neutral-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add a newer scan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Had a DEXA scan? Enter body fat, lean mass and the scan date from your report to keep a clinical reference
            next to your training.
          </p>
          <button
            type="button"
            onClick={() => openForm()}
            className="w-full min-h-[44px] rounded-xl bg-white text-neutral-950 text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add DEXA scan</span>
          </button>
        </div>
      )}

      <p className="text-[10px] font-mono text-neutral-600 leading-relaxed">
        Values are shown exactly as you entered them. Oblivion does not measure body composition and does not use these
        numbers in your scores or share them with your coach.
      </p>
    </SectionCard>
  );
};

export default DexaPanel;
