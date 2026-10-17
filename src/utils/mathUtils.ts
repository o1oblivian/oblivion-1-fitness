export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const round1 = (v: number) => Math.round(v * 10) / 10;
