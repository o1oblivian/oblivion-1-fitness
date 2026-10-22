import React, { useState } from 'react';
import { Pencil } from 'lucide-react';

export interface MetricItem {
  id: string;
  label: string;
  num: string | number | null | undefined;
  unit: string;
}

interface Props {
  metrics: MetricItem[];
  onUpdateMetric?: (id: string, newVal: number | string) => void;
}

/** The first four metrics get the large tiles; the rest sit in a quieter row beneath. */
const HEADLINE_COUNT = 4;

const isMissing = (m: MetricItem) => m.num == null || m.num === '--' || m.num === '';

/**
 * What the scanner read, as tiles. Tap any tile to type the number yourself.
 * Surfaces only: no borders, so the numbers carry the design.
 */
export const CardioMetricsGrid: React.FC<Props> = ({ metrics, onUpdateMetric }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempVal, setTempVal] = useState('');

  const startEdit = (m: MetricItem) => {
    if (!onUpdateMetric) return;
    setEditingId(m.id);
    setTempVal(isMissing(m) ? '' : String(m.num).replace(/^~/, ''));
  };

  const saveEdit = (id: string) => {
    if (tempVal.trim() !== '') {
      const numVal = parseFloat(tempVal.replace(/,/g, ''));
      onUpdateMetric?.(id, Number.isNaN(numVal) ? tempVal.trim() : numVal);
    }
    setEditingId(null);
  };

  const renderTile = (m: MetricItem, large: boolean) => {
    const editing = editingId === m.id;
    const missing = isMissing(m);
    const valueSize = large ? 'text-3xl' : 'text-xl';
    return (
      <div
        key={m.id}
        role={editing ? undefined : 'button'}
        tabIndex={editing ? undefined : 0}
        onClick={() => !editing && startEdit(m)}
        onKeyDown={(e) => {
          if (!editing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            startEdit(m);
          }
        }}
        aria-label={
          editing ? undefined : `${m.label}: ${missing ? 'not read' : m.num}. Tap to edit.`
        }
        className={`relative text-left rounded-2xl bg-o1-well active:scale-[0.98] transition cursor-pointer ${
          large ? 'p-4' : 'p-3'
        }`}
      >
        <span className="flex items-center justify-between text-o1-label tracking-wide text-o1-muted">
          {m.label}
          {onUpdateMetric && !editing ? (
            <Pencil className="w-3 h-3 text-o1-faint" strokeWidth={1.75} aria-hidden />
          ) : null}
        </span>

        {editing ? (
          <span className="mt-2 block" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={tempVal}
              onChange={(e) => setTempVal(e.target.value)}
              onBlur={() => saveEdit(m.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(m.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              aria-label={`${m.label} value`}
              className={`w-full bg-transparent outline-none font-num font-light tabular-nums text-o1-text ${valueSize}`}
            />
            <span className="mt-1 block h-0.5 rounded-full bg-o1-yellow" aria-hidden />
          </span>
        ) : (
          <span
            className={`mt-2 block truncate font-num font-light tabular-nums ${valueSize} ${
              missing ? 'text-o1-faint' : 'text-o1-text'
            }`}
          >
            {missing ? '--' : m.num}
            {!missing && m.unit ? (
              <span className="ml-1.5 text-o1-caption text-o1-muted">{m.unit}</span>
            ) : null}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.slice(0, HEADLINE_COUNT).map((m) => renderTile(m, true))}
      </div>
      {metrics.length > HEADLINE_COUNT ? (
        <div className="grid grid-cols-3 gap-2.5">
          {metrics.slice(HEADLINE_COUNT).map((m) => renderTile(m, false))}
        </div>
      ) : null}
    </div>
  );
};
