import React, { useState } from 'react';
import { tactileEngine } from '../../../services/tactileEngine';

/** Barbell, dumbbell, and kettlebell stay short until the row is tapped. */
export function abbreviateEquipment(name: string): string {
  return name
    .replace(/\bbarbells?\b/gi, 'BB')
    .replace(/\bdumbbells?\b/gi, 'DB')
    .replace(/\bkettlebells?\b/gi, 'KB')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface LedgerColumn {
  label: string;
  width?: string;
}

export interface LedgerDetail {
  id: string;
  name: string;
  cells: string[];
}

export interface LedgerRow {
  id: string;
  name: string;
  cells: string[];
  /** Per-set lines. The sets figure opens and closes them. */
  details?: LedgerDetail[];
}

interface LogLedgerProps {
  nameLabel: string;
  columns: LedgerColumn[];
  rows: LedgerRow[];
}

export const LogLedger: React.FC<LogLedgerProps> = ({ nameLabel, columns, rows }) => {
  const [openNameId, setOpenNameId] = useState<string | null>(null);
  const [openSetsId, setOpenSetsId] = useState<string | null>(null);

  return (
    <table className="w-full table-fixed border-collapse text-[11px] mt-2">
      <thead>
        <tr className="text-[10px] text-neutral-500">
          <th className="text-left font-medium py-1.5 pr-2 border-b border-white/[0.07]">{nameLabel}</th>
          {columns.map((column, index) => (
            <th
              key={column.label}
              className={`text-right font-medium py-1.5 pl-1 border-b border-white/[0.07] tabular-nums ${index === columns.length - 1 ? 'pr-1' : ''}`}
              style={{ width: column.width }}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const nameOpen = openNameId === row.id;
          const setsOpen = openSetsId === row.id;
          const short = abbreviateEquipment(row.name);
          const canExpandName = short !== row.name;
          const details = row.details || [];
          return (
            <React.Fragment key={row.id}>
              <tr className="border-b border-white/[0.06]">
                <td className="py-0 pr-2 align-middle overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canExpandName) return;
                      tactileEngine.triggerSelectionBuzz();
                      setOpenNameId(nameOpen ? null : row.id);
                    }}
                    className={`w-full min-h-[44px] text-left bg-transparent border-0 p-0 text-[11px] text-neutral-200 ${nameOpen ? 'whitespace-normal' : 'truncate'} ${canExpandName ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {nameOpen ? row.name : short}
                  </button>
                </td>
                {row.cells.map((cell, index) => {
                  const opensSets = details.length > 0;
                  return (
                    <td key={`${row.id}-${columns[index]?.label || index}`} className="p-0 text-right text-neutral-300 tabular-nums align-middle">
                      {opensSets ? (
                        <button
                          type="button"
                          aria-expanded={setsOpen}
                          aria-label={setsOpen ? 'Hide sets' : 'Show sets'}
                          onClick={() => {
                            tactileEngine.triggerSelectionBuzz();
                            setOpenSetsId(setsOpen ? null : row.id);
                          }}
                          className={`w-full min-h-[44px] px-1 text-right bg-transparent border-0 tabular-nums touch-manipulation ${index === row.cells.length - 1 ? 'pr-1' : ''} ${setsOpen && index === 0 ? 'text-white underline decoration-white/40 underline-offset-4' : 'text-neutral-100'}`}
                        >
                          {cell}
                        </button>
                      ) : (
                        <span className={`inline-block min-h-[44px] w-full px-1 leading-[44px] ${index === row.cells.length - 1 ? 'pr-1' : ''}`}>{cell}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              {setsOpen && details.map((detail) => (
                <tr key={detail.id} className="border-b border-white/[0.04]">
                  <td className="py-1 pr-2 pl-3 text-neutral-500 tabular-nums">{detail.name}</td>
                  {detail.cells.map((cell, index) => (
                    <td key={`${detail.id}-${index}`} className={`py-1 pl-1 text-right text-neutral-400 tabular-nums ${index === detail.cells.length - 1 ? 'pr-1' : ''}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};
