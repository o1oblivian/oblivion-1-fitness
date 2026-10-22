import React, { useState } from 'react';
import { Edit3, Check } from 'lucide-react';

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

export const CardioMetricsGrid: React.FC<Props> = ({ metrics, onUpdateMetric }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempVal, setTempVal] = useState<string>('');

  const startEdit = (m: MetricItem) => {
    if (!onUpdateMetric) return;
    setEditingId(m.id);
    setTempVal(m.num === '--' || m.num == null ? '' : String(m.num));
  };

  const saveEdit = (id: string) => {
    if (tempVal.trim() !== '') {
      const numVal = parseFloat(tempVal.replace(/,/g, ''));
      onUpdateMetric?.(id, isNaN(numVal) ? tempVal.trim() : numVal);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {metrics.map((m) => {
          const isEditing = editingId === m.id;
          const isMissing = m.num == null || m.num === '--' || m.num === '';
          const displayText = isMissing ? '--' : m.num;

          return (
            <div
              key={m.id}
              onClick={() => !isEditing && startEdit(m)}
              className={`p-2 rounded-xl bg-o1-well border transition-all text-center flex flex-col justify-center relative group cursor-pointer ${
                isEditing
                  ? 'border-o1-crimson ring-1 ring-o1-crimson'
                  : 'border-white/[0.07] hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="o1-num text-o1-label font-normal text-o1-faint font-num tracking-widest block truncate">
                  {m.label}
                </span>
                {onUpdateMetric && !isEditing && (
                  <Edit3
                    className="w-2.5 h-2.5 shrink-0 text-o1-faint opacity-50 group-hover:opacity-100 transition-opacity"
                    strokeWidth={1.5}
                  />
                )}
              </div>

              {isEditing ? (
                <div
                  className="flex items-center gap-1 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={tempVal}
                    onChange={(e) => setTempVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(m.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full text-o1-control font-light tabular-nums text-white bg-o1-card border border-o1-crimson rounded px-1 py-0.5 outline-none text-center"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(m.id)}
                    className="p-1 rounded bg-o1-crimson text-white hover:bg-o1-crimson-hover"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <span className="text-o1-control font-light tabular-nums text-white truncate block">
                  {displayText}
                  {!isMissing && m.unit && (
                    <span className="ml-1 text-o1-label font-light text-o1-faint">{m.unit}</span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {onUpdateMetric && (
        <p className="text-o1-label font-light text-o1-faint text-center">
          Numbers auto-extracted from photo. Tap any number to edit.
        </p>
      )}
    </div>
  );
};
