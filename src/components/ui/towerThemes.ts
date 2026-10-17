/** Light tint, main colour, deep shade (the Log towers use these muted, earthy tones). */
export type TowerRamp = readonly [string, string, string];

export interface TowerTheme {
  /** Bottom → top slab colours. */
  slabs: string[];
  accent: string;
  /** Used by the bold towers: slabs shade from the light tint at the top to the deep shade at the bottom. */
  ramp: TowerRamp;
}

const channels = (hex: string) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

function blend(from: string, to: string, t: number): string {
  const a = channels(from);
  const b = channels(to);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
}

/** Colour at position t, where 0 is the light tint (top of the tower) and 1 is the deep shade (bottom). */
export function rampColor(ramp: TowerRamp, t: number): string {
  return t < 0.5 ? blend(ramp[0], ramp[1], t * 2) : blend(ramp[1], ramp[2], (t - 0.5) * 2);
}

/**
 * One hue family per weekday, never shared with another day, used by the Workout strain tracker
 * and the Log charts. Ten shades each (one per slab), mixed so neighbouring slabs never look alike.
 */
export const DAY_TOWER_THEME: Record<string, TowerTheme> = {
  Mon: {
    slabs: [
      '#930E14',
      '#D95257',
      '#700C11',
      '#C4121A',
      '#5C0A0E',
      '#E27377',
      '#A30F16',
      '#CF3238',
      '#800C11',
      '#B31118',
    ],
    accent: '#C4121A',
    ramp: ['#D08A84', '#A8473F', '#4F1E1B'],
  },
  Tue: {
    slabs: [
      '#A25C08',
      '#F59E0B',
      '#7D4506',
      '#D97706',
      '#6B3A05',
      '#F7B13D',
      '#B4670A',
      '#E58A12',
      '#8F5007',
      '#C6730B',
    ],
    accent: '#D97706',
    ramp: ['#D9B26F', '#B9822F', '#5E4116'],
  },
  Wed: {
    slabs: [
      '#145D89',
      '#4FA6D9',
      '#0E4566',
      '#0284C7',
      '#0B3A55',
      '#74B8E2',
      '#17699B',
      '#2A95D0',
      '#115178',
      '#0274B0',
    ],
    accent: '#0284C7',
    ramp: ['#8FAFC2', '#4F7F9B', '#223B4A'],
  },
  Thu: {
    slabs: [
      '#086448',
      '#34C795',
      '#064A35',
      '#059669',
      '#053D2C',
      '#5ED3AA',
      '#047857',
      '#10B981',
      '#07573F',
      '#05895F',
    ],
    accent: '#059669',
    ramp: ['#8DBBA0', '#4E8A6B', '#1F4030'],
  },
  Fri: {
    slabs: [
      '#8D3C1E',
      '#D77F57',
      '#6B2C16',
      '#C0562B',
      '#5A2412',
      '#E1956F',
      '#9E4422',
      '#CC6A40',
      '#7C341A',
      '#AF4C26',
    ],
    accent: '#C0562B',
    ramp: ['#D9A07F', '#B3633C', '#58301D'],
  },
  Sat: {
    slabs: [
      '#5B632B',
      '#9DA665',
      '#454B21',
      '#7F8A40',
      '#3A3F1C',
      '#ACB478',
      '#666F30',
      '#8E9852',
      '#505726',
      '#727B36',
    ],
    accent: '#7F8A40',
    ramp: ['#B5BA84', '#868E4F', '#3E4222'],
  },
  Sun: {
    slabs: [
      '#64625A',
      '#B7B5AA',
      '#4A4842',
      '#8A887F',
      '#3D3B35',
      '#CFCDC2',
      '#716F66',
      '#A09E94',
      '#57554E',
      '#7E7C73',
    ],
    accent: '#8A887F',
    ramp: ['#D6D3C6', '#8A887F', '#3D3B35'],
  },
};

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Weekday labels get their own theme; other spans (weeks, months) cycle through the same families. */
export function dayTowerTheme(label: string, index: number): TowerTheme {
  const key = label.slice(0, 1).toUpperCase() + label.slice(1, 3).toLowerCase();
  return DAY_TOWER_THEME[key] ?? DAY_TOWER_THEME[DAY_ORDER[index % DAY_ORDER.length]];
}
