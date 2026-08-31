import React from 'react';
import { 
  Utensils, 
  Flame, 
  Egg, 
  Apple, 
  Coffee, 
  Milk, 
  Fish, 
  Cookie, 
  Beef, 
  Drumstick,
  Wheat,
  Pizza,
  Droplets,
  CupSoda,
  Salad,
  Sandwich,
  Layers,
  Sparkles
} from 'lucide-react';

interface FoodCategoryIconProps {
  category?: string;
  name?: string;
  className?: string;
}

export const FoodCategoryIcon: React.FC<FoodCategoryIconProps> = ({
  category = '',
  name = '',
  className = 'w-4 h-4',
}) => {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();

  // Keyword-specific Precision Vector Glyphs
  if (n.includes('egg') || n.includes('omelet')) {
    return <Egg className={`${className} text-amber-500 dark:text-amber-400`} strokeWidth={1.75} />;
  }
  if (n.includes('chicken') || n.includes('poultry') || n.includes('turkey') || n.includes('wing') || n.includes('breast') || n.includes('thigh')) {
    return <Drumstick className={`${className} text-[#FF3B30] dark:text-[#FF453A]`} strokeWidth={1.75} />;
  }
  if (n.includes('steak') || n.includes('beef') || n.includes('meat') || n.includes('pork') || n.includes('bacon') || n.includes('ribs') || n.includes('patty')) {
    return <Beef className={`${className} text-[#FF3B30] dark:text-[#FF453A]`} strokeWidth={1.75} />;
  }
  if (n.includes('salmon') || n.includes('tuna') || n.includes('fish') || n.includes('shrimp') || n.includes('seafood') || n.includes('cod') || n.includes('prawn')) {
    return <Fish className={`${className} text-[#06B6D4] dark:text-[#22D3EE]`} strokeWidth={1.75} />;
  }
  if (n.includes('milk') || n.includes('shake') || n.includes('yogurt') || n.includes('dairy') || n.includes('whey') || n.includes('casein')) {
    return <Milk className={`${className} text-sky-400 dark:text-sky-300`} strokeWidth={1.75} />;
  }
  if (n.includes('coffee') || n.includes('espresso') || n.includes('latte') || n.includes('cappuccino') || n.includes('tea') || n.includes('matcha')) {
    return <Coffee className={`${className} text-amber-700 dark:text-amber-400`} strokeWidth={1.75} />;
  }
  if (n.includes('salad') || n.includes('spinach') || n.includes('kale') || n.includes('broccoli') || n.includes('veggie') || n.includes('vegetable')) {
    return <Salad className={`${className} text-[#10B981] dark:text-[#34D399]`} strokeWidth={1.75} />;
  }
  if (n.includes('apple') || n.includes('banana') || n.includes('berry') || n.includes('fruit') || n.includes('orange') || n.includes('avocado')) {
    return <Apple className={`${className} text-[#10B981] dark:text-[#34D399]`} strokeWidth={1.75} />;
  }
  if (n.includes('sandwich') || n.includes('burger') || n.includes('wrap') || n.includes('sub')) {
    return <Sandwich className={`${className} text-amber-600 dark:text-amber-400`} strokeWidth={1.75} />;
  }
  if (n.includes('rice') || n.includes('oat') || n.includes('bread') || n.includes('pasta') || n.includes('cereal') || n.includes('grain') || n.includes('flour') || n.includes('quinoa')) {
    return <Wheat className={`${className} text-[#F59E0B] dark:text-[#FBBF24]`} strokeWidth={1.75} />;
  }
  if (n.includes('oil') || n.includes('butter') || n.includes('mayo') || n.includes('mayonnaise') || n.includes('dressing') || n.includes('ghee') || n.includes('tallow') || n.includes('omega')) {
    return <Droplets className={`${className} text-[#10B981] dark:text-[#34D399]`} strokeWidth={1.75} />;
  }
  if (n.includes('nut') || n.includes('almond') || n.includes('cashew') || n.includes('peanut') || n.includes('macadamia') || n.includes('walnut') || n.includes('seed')) {
    return <Layers className={`${className} text-amber-600 dark:text-amber-400`} strokeWidth={1.75} />;
  }
  if (n.includes('cookie') || n.includes('cake') || n.includes('chocolate') || n.includes('donut') || n.includes('sweet') || n.includes('beignet') || n.includes('candy') || n.includes('ice cream')) {
    return <Cookie className={`${className} text-rose-500 dark:text-rose-400`} strokeWidth={1.75} />;
  }
  if (n.includes('pizza') || n.includes('fry') || n.includes('fries') || n.includes('hot dog') || n.includes('cheat')) {
    return <Pizza className={`${className} text-amber-500 dark:text-amber-400`} strokeWidth={1.75} />;
  }
  if (n.includes('drink') || n.includes('soda') || n.includes('juice') || n.includes('water') || n.includes('cola') || n.includes('energy')) {
    return <CupSoda className={`${className} text-[#06B6D4] dark:text-[#22D3EE]`} strokeWidth={1.75} />;
  }

  // Category-based Fallback Glyphs
  if (cat.includes('fast food') || cat.includes('fastfood') || cat.includes('burger') || cat.includes('pizza') || cat.includes('cheat')) {
    return <Pizza className={`${className} text-amber-500 dark:text-amber-400`} strokeWidth={1.75} />;
  }
  if (cat.includes('protein') || cat.includes('meat') || cat.includes('seafood')) {
    return <Flame className={`${className} text-[#FF3B30] dark:text-[#FF453A]`} strokeWidth={1.75} />;
  }
  if (cat.includes('carb') || cat.includes('grain') || cat.includes('bakery') || cat.includes('fruit')) {
    return <Wheat className={`${className} text-[#F59E0B] dark:text-[#FBBF24]`} strokeWidth={1.75} />;
  }
  if (cat.includes('fat') || cat.includes('oil') || cat.includes('nut') || cat.includes('lipid')) {
    return <Droplets className={`${className} text-[#10B981] dark:text-[#34D399]`} strokeWidth={1.75} />;
  }
  if (cat.includes('drink') || cat.includes('beverage') || cat.includes('beverages')) {
    return <CupSoda className={`${className} text-[#06B6D4] dark:text-[#22D3EE]`} strokeWidth={1.75} />;
  }
  if (cat.includes('snack') || cat.includes('sweet')) {
    return <Sparkles className={`${className} text-rose-500 dark:text-rose-400`} strokeWidth={1.75} />;
  }

  return <Utensils className={`${className} text-zinc-500 dark:text-zinc-400`} strokeWidth={1.75} />;
};

