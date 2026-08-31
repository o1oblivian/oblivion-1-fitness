export interface WebResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface FoodResult {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
  imageUrl?: string;
  barcode?: string;
}

export interface VenueResult {
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  distanceKm?: number;
}

export type SearchKind = 'web' | 'food' | 'venue';

export interface WebSearchResponse {
  results: WebResult[];
  error?: string;
}

export interface FoodSearchResponse {
  results: FoodResult[];
  error?: string;
}

export interface VenueSearchResponse {
  results: VenueResult[];
  error?: string;
}
