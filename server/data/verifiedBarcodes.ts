// Built-in verified barcode database for popular athletic foods & supplements
export const VERIFIED_BARCODES: Record<
  string,
  {
    name: string;
    brand: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    category: string;
  }
> = {
  '850003007011': {
    name: 'Core Power Elite Chocolate (42g Protein)',
    brand: 'Fairlife',
    portion: '1 bottle (414ml)',
    calories: 230,
    protein: 42,
    carbs: 8,
    fats: 3.5,
    category: 'drinks',
  },
  '888849000018': {
    name: 'Quest Nutrition Chocolate Chip Cookie Dough Bar',
    brand: 'Quest Nutrition',
    portion: '1 bar (60g)',
    calories: 200,
    protein: 21,
    carbs: 22,
    fats: 7,
    category: 'snack',
  },
  '7350083380004': {
    name: 'Caramel Cashew Protein Bar (20g Protein)',
    brand: 'Barebells',
    portion: '1 bar (55g)',
    calories: 200,
    protein: 20,
    carbs: 16,
    fats: 8,
    category: 'snack',
  },
  '036632074345': {
    name: 'Oikos Pro 20g Protein Greek Yogurt Cup',
    brand: 'Dannon Oikos',
    portion: '1 cup (150g)',
    calories: 140,
    protein: 20,
    carbs: 8,
    fats: 3,
    category: 'snack',
  },
  '052000328677': {
    name: 'Gatorade Zero Thirst Quencher Glacier Cherry',
    brand: 'Gatorade',
    portion: '1 bottle (591ml)',
    calories: 5,
    protein: 0,
    carbs: 1,
    fats: 0,
    category: 'drinks',
  },
  '748927028669': {
    name: 'Gold Standard 100% Whey Double Rich Chocolate',
    brand: 'Optimum Nutrition',
    portion: '1 scoop (30.4g)',
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1.5,
    category: 'drinks',
  },
  '853841005012': {
    name: 'LMNT Recharge Electrolyte Drink Mix (Citrus Salt)',
    brand: 'LMNT',
    portion: '1 packet in 500ml water',
    calories: 10,
    protein: 0,
    carbs: 2,
    fats: 0,
    category: 'supplements',
  },
};
