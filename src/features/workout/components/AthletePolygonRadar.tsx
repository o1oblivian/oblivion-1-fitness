import React from 'react';

interface AthletePolygonRadarProps {
  vol?: number;
  load?: number;
  fuel?: number;
  rec?: number;
  flux?: number;
  isCalibrating?: boolean;
}

export const AthletePolygonRadar: React.FC<AthletePolygonRadarProps> = ({
  vol = 76,
  load = 80,
  fuel = 18,
  rec = 84,
  flux = 98,
  isCalibrating = false,
}) => {
  // Convert 5 percentages (0-100) to polygon coordinates around center (60, 60) with radius 42
  // Axis angles: Top = -90deg, Top-Right = -18deg, Bottom-Right = 54deg, Bottom-Left = 126deg, Top-Left = 198deg
  const center = 60;
  const maxR = 42;
  const angles = [-90, -18, 54, 126, 198].map((deg) => (deg * Math.PI) / 180);
  const values = isCalibrating ? [50, 50, 50, 50, 50] : [vol, load, fuel, rec, flux];

  const pointsString = values
    .map((val, i) => {
      const r = (Math.max(15, Math.min(100, val)) / 100) * maxR;
      const x = center + r * Math.cos(angles[i]);
      const y = center + r * Math.sin(angles[i]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="bg-neutral-50 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 rounded-2xl p-3 space-y-2 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C4121A]" />
          <span className="font-mono font-bold text-[10px] uppercase text-neutral-900 dark:text-white">
            5-AXIS ATHLETE POLYGON
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
          {isCalibrating ? 'Calibrating Baseline' : 'Holistic Equilibrium'}
        </span>
      </div>

      <div className="flex items-center justify-center py-1">
        <svg viewBox="0 0 120 120" className="w-36 h-36">
          {[1, 0.75, 0.5, 0.25].map((scale, i) => (
            <polygon
              key={i}
              points="60,18 100,47 85,94 35,94 20,47"
              transform={`scale(${scale}) translate(${(60 * (1 - scale)) / scale}, ${(60 * (1 - scale)) / scale})`}
              fill="none"
              stroke="currentColor"
              className="text-neutral-200 dark:text-neutral-700/80"
              strokeWidth="1"
            />
          ))}
          {/* 5 Axis lines */}
          <line x1="60" y1="60" x2="60" y2="18" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700/80" strokeWidth="1" />
          <line x1="60" y1="60" x2="100" y2="47" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700/80" strokeWidth="1" />
          <line x1="60" y1="60" x2="85" y2="94" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700/80" strokeWidth="1" />
          <line x1="60" y1="60" x2="35" y2="94" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700/80" strokeWidth="1" />
          <line x1="60" y1="60" x2="20" y2="47" stroke="currentColor" className="text-neutral-200 dark:text-neutral-700/80" strokeWidth="1" />
          
          {/* Dynamic Polygon Data */}
          <polygon
            points={pointsString}
            className="fill-[#C4121A]/20 stroke-[#C4121A] stroke-2 transition-all duration-300"
          />
        </svg>
      </div>

      {/* 5 Axis Readouts */}
      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9px] pt-1 border-t border-neutral-200/80 dark:border-white/10">
        <div>
          <span className="text-neutral-400 dark:text-neutral-500 block">VOL</span>
          <span className="font-bold text-neutral-900 dark:text-white">{isCalibrating ? '--' : `${vol}%`}</span>
        </div>
        <div>
          <span className="text-neutral-400 dark:text-neutral-500 block">LOAD</span>
          <span className="font-bold text-neutral-900 dark:text-white">{isCalibrating ? '--' : `${load}%`}</span>
        </div>
        <div>
          <span className="text-neutral-400 dark:text-neutral-500 block">FUEL</span>
          <span className="font-bold text-neutral-900 dark:text-white">{isCalibrating ? '--' : `${fuel}%`}</span>
        </div>
        <div>
          <span className="text-neutral-400 dark:text-neutral-500 block">REC</span>
          <span className="font-bold text-neutral-900 dark:text-white">{isCalibrating ? '--' : `${rec}%`}</span>
        </div>
        <div>
          <span className="text-neutral-400 dark:text-neutral-500 block">FLUX</span>
          <span className="font-bold text-neutral-900 dark:text-white">{isCalibrating ? '--' : `${flux}%`}</span>
        </div>
      </div>
    </div>
  );
};
