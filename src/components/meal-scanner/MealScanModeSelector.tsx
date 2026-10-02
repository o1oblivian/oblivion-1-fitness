import React from 'react';
import { Utensils, Package, Barcode } from 'lucide-react';
import { ScanMode } from '../../services/mealVisionTypes';

interface MealScanModeSelectorProps {
  scanMode: ScanMode;
  onSelectMode: (mode: ScanMode) => void;
}

export const MealScanModeSelector: React.FC<MealScanModeSelectorProps> = ({
  scanMode,
  onSelectMode,
}) => {
  const tabs = [
    { mode: 'barcode' as ScanMode, label: 'Barcode', icon: Barcode },
    { mode: 'package' as ScanMode, label: 'Package', icon: Package },
    { mode: 'plate' as ScanMode, label: 'Plate', icon: Utensils },
  ];

  return (
    <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#18181b] border border-neutral-800">
      {tabs.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelectMode(mode)}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            scanMode === mode ? 'bg-[#C4121A] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
};
