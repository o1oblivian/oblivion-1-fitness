export type DietaryType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'carnivore' | 'paleo';

export interface DietaryChoice {
  id: DietaryType;
  label: string;
  shortLabel: string;
  description: string;
  badge: string;
}

export const DIETARY_OPTIONS: DietaryChoice[] = [
  {
    id: 'omnivore',
    label: 'Omnivore',
    shortLabel: 'Omni',
    description: 'All athletic whole foods (meat, poultry, fish, dairy, eggs & plants)',
    badge: 'ALL FOODS',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    shortLabel: 'Vegetarian',
    description: 'Plant-based foods, dairy, eggs, whey & legumes (no meat or fish)',
    badge: 'NO MEAT / FISH',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    shortLabel: 'Vegan',
    description: '100% plant whole foods (tofu, tempeh, legumes, grains, nuts)',
    badge: '100% PLANT',
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    shortLabel: 'Pescatarian',
    description: 'Wild fish, seafood, dairy, eggs & plants (no poultry or red meat)',
    badge: 'SEAFOOD + PLANTS',
  },
  {
    id: 'carnivore',
    label: 'Carnivore',
    shortLabel: 'Carnivore',
    description: 'Pure animal-based: beef, poultry, fish & eggs (zero plant foods)',
    badge: 'ANIMAL BASED',
  },
  {
    id: 'paleo',
    label: 'Paleo',
    shortLabel: 'Paleo',
    description: 'Unprocessed whole foods, meats, fish, eggs, veggies & nuts (no grains)',
    badge: 'WHOLE FOODS',
  },
];

const DIETARY_KEY = 'o1fc_dietary_preference';
const listeners: Array<(diet: DietaryType) => void> = [];

export function getSelectedDietary(): DietaryType {
  try {
    const saved = localStorage.getItem(DIETARY_KEY);
    if (saved && DIETARY_OPTIONS.some((d) => d.id === saved)) {
      return saved as DietaryType;
    }
  } catch {}
  return 'omnivore';
}

export function setSelectedDietary(diet: DietaryType): void {
  try {
    localStorage.setItem(DIETARY_KEY, diet);
  } catch {}
  listeners.forEach((fn) => {
    try {
      fn(diet);
    } catch {}
  });
}

export function getDietaryObj(id?: string): DietaryChoice {
  const found = DIETARY_OPTIONS.find((d) => d.id === id);
  return found || DIETARY_OPTIONS[0];
}

export function subscribeDietaryChange(listener: (diet: DietaryType) => void): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}
