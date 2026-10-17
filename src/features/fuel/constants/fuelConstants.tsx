import React from 'react';
import { Sun, Utensils, Moon, Box, Coffee } from 'lucide-react';
import { FuelMeals } from '../store/useFuelStore';

export type SlotKey = keyof FuelMeals;

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
