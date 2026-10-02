import React from 'react';
import { Sun, Utensils, Moon, Box, Coffee } from 'lucide-react';
import { FuelMeals } from '../store/useFuelStore';

export type SlotKey = keyof FuelMeals;

export interface CategoryMeta {
  key: SlotKey;
  label: string;
  tagline: string;
  iconColor: string;
  badge: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    tagline: 'Morning Priming & Metabolic Ignition',
    iconColor: 'from-amber-500 to-orange-500',
    badge: 'SLOT 01',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    tagline: 'Mid-Day Sustained Energy',
    iconColor: 'from-cyan-500 to-blue-500',
    badge: 'SLOT 02',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    tagline: 'Evening Recovery & Repair',
    iconColor: 'from-blue-500 to-indigo-500',
    badge: 'SLOT 03',
  },
  {
    key: 'snack',
    label: 'Snacks',
    tagline: 'Quick Fuel & High Protein',
    iconColor: 'from-rose-500 to-pink-500',
    badge: 'SLOT 04',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    tagline: 'Hydration & Electrolytes',
    iconColor: 'from-cyan-500 to-sky-500',
    badge: 'SLOT 05',
  },
  {
    key: 'supplements',
    label: 'Supplements & Electrolytes',
    tagline: 'Vitamins, Minerals & Daily Stack',
    iconColor: 'from-violet-500 to-purple-500',
    badge: 'SLOT 06',
  },
];

export interface MealSlotConfig {
  key: SlotKey;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  plusColor: string;
}

export const MEAL_SLOTS: MealSlotConfig[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    icon: <Sun className="w-4 h-4 text-amber-500 stroke-[2.2]" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60',
    plusColor: 'text-amber-500',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    icon: <Utensils className="w-4 h-4 text-red-500 stroke-[2.2]" />,
    iconBg: 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60',
    plusColor: 'text-red-500',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    icon: <Moon className="w-4 h-4 text-purple-500 stroke-[2.2]" />,
    iconBg: 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60',
    plusColor: 'text-purple-500',
  },
  {
    key: 'snack',
    label: 'Snack',
    icon: <Box className="w-4 h-4 text-green-500 stroke-[2.2]" />,
    iconBg: 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60',
    plusColor: 'text-green-500',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    icon: <Coffee className="w-4 h-4 text-cyan-500 stroke-[2.2]" />,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60',
    plusColor: 'text-cyan-500',
  },
];
