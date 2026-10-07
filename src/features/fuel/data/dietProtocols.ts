export interface DietProtocol {
  key: string;
  label: string;
  short: string;
  description: string;
  icon: string;
  /** Organic accent — used on chips, not neon fills */
  accent: string;
  accentSoft: string;
  accentBorder: string;
  accentDark: string;
}

export const DIET_OPTIONS: DietProtocol[] = [
  {
    key: 'Omnivore',
    label: 'Omnivore',
    short: 'All foods',
    description: 'Meat, fish, dairy, eggs and plants',
    icon: '🥩',
    accent: '#C4121A',
    accentSoft: 'bg-red-950/30',
    accentBorder: 'border-red-900/40',
    accentDark: 'text-o1-crimson',
  },
  {
    key: 'Vegetarian',
    label: 'Vegetarian',
    short: 'No meat',
    description: 'Plants, dairy, eggs and whey — no meat or fish',
    icon: '🥗',
    accent: '#059669',
    accentSoft: 'bg-emerald-950/30',
    accentBorder: 'border-emerald-900/40',
    accentDark: 'text-emerald-400',
  },
  {
    key: 'Vegan',
    label: 'Vegan',
    short: 'Plant only',
    description: 'Tofu, legumes, grains, nuts — no animal foods',
    icon: '🌱',
    accent: '#4d7c0f',
    accentSoft: 'bg-lime-950/30',
    accentBorder: 'border-lime-900/40',
    accentDark: 'text-lime-400',
  },
  {
    key: 'Pescatarian',
    label: 'Pescatarian',
    short: 'Fish + plants',
    description: 'Fish, seafood, dairy, eggs and plants',
    icon: '🐟',
    accent: '#0284c7',
    accentSoft: 'bg-sky-950/30',
    accentBorder: 'border-sky-900/40',
    accentDark: 'text-sky-400',
  },
  {
    key: 'Carnivore',
    label: 'Carnivore',
    short: 'Animal only',
    description: 'Beef, poultry, fish and eggs — no plants',
    icon: '🍖',
    accent: '#9a3412',
    accentSoft: 'bg-orange-950/30',
    accentBorder: 'border-orange-900/40',
    accentDark: 'text-orange-400',
  },
  {
    key: 'Paleo',
    label: 'Paleo',
    short: 'Ancestral',
    description: 'Meats, fish, eggs, veg and roots — no grains or dairy',
    icon: '🥑',
    accent: '#d97706',
    accentSoft: 'bg-amber-950/30',
    accentBorder: 'border-amber-900/40',
    accentDark: 'text-amber-400',
  },
  {
    key: 'Keto',
    label: 'Keto',
    short: 'Low carb',
    description: 'High fat, moderate protein, very low carbohydrate',
    icon: '🧀',
    accent: '#57534e',
    accentSoft: 'bg-o1-well',
    accentBorder: 'border-stone-700/50',
    accentDark: 'text-stone-300',
  },
  {
    key: 'Mediterranean',
    label: 'Mediterranean',
    short: 'Olive + fish',
    description: 'Fish, olive oil, veg, legumes — limited red meat',
    icon: '🫒',
    accent: '#0f766e',
    accentSoft: 'bg-teal-950/30',
    accentBorder: 'border-teal-900/40',
    accentDark: 'text-teal-400',
  },
  {
    key: 'Halal',
    label: 'Halal',
    short: 'Halal',
    description: 'No pork or alcohol; meat from permitted sources',
    icon: '☪️',
    accent: '#047857',
    accentSoft: 'bg-emerald-950/30',
    accentBorder: 'border-emerald-900/40',
    accentDark: 'text-emerald-400',
  },
  {
    key: 'Kosher',
    label: 'Kosher',
    short: 'Kosher',
    description: 'No pork or shellfish; dairy kept separate from meat',
    icon: '✡️',
    accent: '#1d4ed8',
    accentSoft: 'bg-blue-950/30',
    accentBorder: 'border-blue-900/40',
    accentDark: 'text-blue-400',
  },
  {
    key: 'Gluten-Free',
    label: 'Gluten-Free',
    short: 'No gluten',
    description: 'No wheat, barley, rye or standard breads',
    icon: '🌾',
    accent: '#b45309',
    accentSoft: 'bg-yellow-950/20',
    accentBorder: 'border-yellow-900/40',
    accentDark: 'text-yellow-400',
  },
  {
    key: 'Dairy-Free',
    label: 'Dairy-Free',
    short: 'No dairy',
    description: 'No milk, cheese, yogurt, whey or casein',
    icon: '🥥',
    accent: '#0e7490',
    accentSoft: 'bg-cyan-950/30',
    accentBorder: 'border-cyan-900/40',
    accentDark: 'text-cyan-400',
  },
];

export function getDietProtocol(key?: string): DietProtocol {
  const found = DIET_OPTIONS.find((d) => d.key.toLowerCase() === (key || '').toLowerCase());
  return found || DIET_OPTIONS[0];
}
