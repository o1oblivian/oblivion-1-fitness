import React from 'react';
import { ScanMode } from '../../services/mealVisionTypes';

interface MealScanLoadingBadgeProps {
  scanMode: ScanMode;
}

export function getScanLoadingLabel(mode: ScanMode): string {
  switch (mode) {
    case 'barcode':
      return 'Decoding barcode & product data...';
    case 'package':
      return 'Analyzing nutrition label & ingredients...';
    case 'plate':
    default:
      return 'Estimating plate macros...';
  }
}

export const MealScanLoadingBadge: React.FC<MealScanLoadingBadgeProps> = ({ scanMode }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
      <div className="w-9 h-9 rounded-full border-2 border-o1-crimson border-t-transparent animate-spin" />
      <p className="text-xs font-semibold text-white">
        {getScanLoadingLabel(scanMode)}
      </p>
    </div>
  );
};
