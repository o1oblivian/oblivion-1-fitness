import React from 'react';

export interface MetricItem {
  label: string;
  num: string | number;
  unit: string;
}

export const CardioMetricsGrid: React.FC<{ metrics: MetricItem[] }> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
      {metrics.map((m, i) => (
        <div key={i} className="p-2 rounded-xl bg-[#18181b] border border-neutral-800 text-center flex flex-col justify-center">
          <span className="text-[8.5px] font-tactical font-bold uppercase tracking-wider text-neutral-400 block truncate">
            {m.label}
          </span>
          <span className="text-xs sm:text-sm font-mono font-bold text-white truncate block tracking-tight">
            {m.num} <span className="text-[9px] text-neutral-400 font-normal">{m.unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
};
export default CardioMetricsGrid;
