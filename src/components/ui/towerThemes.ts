export interface TowerTheme {
  /** Bottom → top slab colours. */
  slabs: string[];
  accent: string;
}

/**
 * One hue family per weekday, never shared with another day, used by the Workout strain tracker
 * and the Log charts. Ten shades each (one per slab), mixed so neighbouring slabs never look alike.
 */
export const DAY_TOWER_THEME: Record<string, TowerTheme> = {
  Mon: {
    slabs: ['#930E14', '#D95257', '#700C11', '#C4121A', '#5C0A0E', '#E27377', '#A30F16', '#CF3238', '#800C11', '#B31118'],
    accent: '#C4121A',
  },
  Tue: {
    slabs: ['#A25C08', '#F59E0B', '#7D4506', '#D97706', '#6B3A05', '#F7B13D', '#B4670A', '#E58A12', '#8F5007', '#C6730B'],
    accent: '#D97706',
  },
  Wed: {
    slabs: ['#145D89', '#4FA6D9', '#0E4566', '#0284C7', '#0B3A55', '#74B8E2', '#17699B', '#2A95D0', '#115178', '#0274B0'],
    accent: '#0284C7',
  },
  Thu: {
    slabs: ['#086448', '#34C795', '#064A35', '#059669', '#053D2C', '#5ED3AA', '#047857', '#10B981', '#07573F', '#05895F'],
    accent: '#059669',
  },
  Fri: {
    slabs: ['#8D3C1E', '#D77F57', '#6B2C16', '#C0562B', '#5A2412', '#E1956F', '#9E4422', '#CC6A40', '#7C341A', '#AF4C26'],
    accent: '#C0562B',
  },
  Sat: {
    slabs: ['#5B632B', '#9DA665', '#454B21', '#7F8A40', '#3A3F1C', '#ACB478', '#666F30', '#8E9852', '#505726', '#727B36'],
    accent: '#7F8A40',
  },
  Sun: {
    slabs: ['#64625A', '#B7B5AA', '#4A4842', '#8A887F', '#3D3B35', '#CFCDC2', '#716F66', '#A09E94', '#57554E', '#7E7C73'],
    accent: '#8A887F',
  },
};

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Weekday labels get their own theme; other spans (weeks, months) cycle through the same families. */
export function dayTowerTheme(label: string, index: number): TowerTheme {
  const key = label.slice(0, 1).toUpperCase() + label.slice(1, 3).toLowerCase();
  return DAY_TOWER_THEME[key] ?? DAY_TOWER_THEME[DAY_ORDER[index % DAY_ORDER.length]];
}
