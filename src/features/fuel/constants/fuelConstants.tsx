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
    badge: 'Slot 01',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    tagline: 'Mid-Day Sustained Energy',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'Slot 02',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    tagline: 'Evening Recovery & Repair',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'Slot 03',
  },
  {
    key: 'snack',
    label: 'Snacks',
    tagline: 'Quick Fuel & High Protein',
    iconColor: 'from-red-500 to-red-500',
    badge: 'Slot 04',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    tagline: 'Hydration & Electrolytes',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'Slot 05',
  },
  {
    key: 'supplements',
    label: 'Supplements & Electrolytes',
    tagline: 'Vitamins, Minerals & Daily Stack',
    iconColor: 'from-sky-500 to-sky-500',
    badge: 'Slot 06',
  },
];

export interface MealSlotConfig {
  key: SlotKey;
  label: string;
  icon: React.ReactNode;
  /** Text colour shared by the slot icon and its + / camera buttons. */
  accent: string;
}

export const MEAL_SLOTS: MealSlotConfig[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    icon: <Sun className="w-6 h-6 stroke-[2.2]" />,
    accent: 'text-amber-600',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    icon: <Utensils className="w-6 h-6 stroke-[2.2]" />,
    accent: 'text-red-600',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    icon: <Moon className="w-6 h-6 stroke-[2.2]" />,
    accent: 'text-sky-600',
  },
  {
    key: 'snack',
    label: 'Snack',
    icon: <Box className="w-6 h-6 stroke-[2.2]" />,
    accent: 'text-emerald-600',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    icon: <Coffee className="w-6 h-6 stroke-[2.2]" />,
    accent: 'text-[#8F6FB8]',
  },
];
