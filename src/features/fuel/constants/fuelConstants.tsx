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
    iconColor: 'from-amber-500 to-amber-500',
    badge: 'SLOT 01',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    tagline: 'Mid-Day Sustained Energy',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'SLOT 02',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    tagline: 'Evening Recovery & Repair',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'SLOT 03',
  },
  {
    key: 'snack',
    label: 'Snacks',
    tagline: 'Quick Fuel & High Protein',
    iconColor: 'from-red-500 to-red-500',
    badge: 'SLOT 04',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    tagline: 'Hydration & Electrolytes',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'SLOT 05',
  },
  {
    key: 'supplements',
    label: 'Supplements & Electrolytes',
    tagline: 'Vitamins, Minerals & Daily Stack',
    iconColor: 'from-sky-500 to-sky-500',
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
    iconBg: 'bg-amber-950/40 border border-amber-800/60',
    plusColor: 'text-amber-500',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    icon: <Utensils className="w-4 h-4 text-red-500 stroke-[2.2]" />,
    iconBg: 'bg-red-950/40 border border-red-800/60',
    plusColor: 'text-red-500',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    icon: <Moon className="w-4 h-4 text-sky-500 stroke-[2.2]" />,
    iconBg: 'bg-sky-950/40 border border-sky-800/60',
    plusColor: 'text-sky-500',
  },
  {
    key: 'snack',
    label: 'Snack',
    icon: <Box className="w-4 h-4 text-emerald-500 stroke-[2.2]" />,
    iconBg: 'bg-emerald-950/40 border border-emerald-800/60',
    plusColor: 'text-emerald-500',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    icon: <Coffee className="w-4 h-4 text-sky-500 stroke-[2.2]" />,
    iconBg: 'bg-sky-950/40 border border-sky-800/60',
    plusColor: 'text-sky-500',
  },
];
