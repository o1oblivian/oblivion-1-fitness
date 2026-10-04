export type ScanMode = 'plate' | 'package' | 'barcode';

export interface ScannedMealBreakdown {
  dishName: string;
  servingDescription: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  confidenceScore: number;
  ingredientsDetected: string[];
  barcode?: string;
  brand?: string;
}
