export interface Reel {
  id: string;
  coach_email: string;
  coach_name: string;
  coach_avatar: string;
  caption: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url: string;
  program_id: string | null;
  workout_type: string;
  tags: string[];
  like_count: number;
  view_count: number;
  created_at: string;
  program?: ProgramPreview | null;
}

export interface ProgramPreview {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  price_cents: number;
  cover_image_url: string;
  coach_email: string;
  program_content?: any[];
}

export interface PurchaseRecord {
  id: string;
  buyer_email: string;
  program_id: string;
  coach_email: string;
  price_cents: number;
  platform_commission_pct: number;
  platform_fee_cents: number;
  coach_payout_cents: number;
  status: string;
  created_at: string;
}

export const PLATFORM_COMMISSION_PCT = 15;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calcCommission(priceCents: number): { fee: number; payout: number } {
  const fee = Math.round(priceCents * (PLATFORM_COMMISSION_PCT / 100));
  return { fee, payout: priceCents - fee };
}
