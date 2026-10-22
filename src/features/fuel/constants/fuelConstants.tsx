import React from 'react';
import { Sun, Utensils, Moon, Box, Coffee } from 'lucide-react';
import { FuelMeals } from '../store/useFuelStore';

export type SlotKey = keyof FuelMeals;

export interface MealSlotConfig {
  key: SlotKey;
  label: string;
  icon: React.ReactNode;
  /** Text colour of the bare line icon; the icon has no background. */
  accent: string;
}

export const MEAL_SLOTS: MealSlotConfig[] = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    icon: <Sun className="w-6 h-6 stroke-[1.75]" />,
    accent: 'text-o1-yellow',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    icon: <Utensils className="w-6 h-6 stroke-[1.75]" />,
    accent: 'text-o1-crimson',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    icon: <Moon className="w-6 h-6 stroke-[1.75]" />,
    accent: 'text-o1-teal',
  },
  {
    key: 'snack',
    label: 'Snack',
    icon: <Box className="w-6 h-6 stroke-[1.75]" />,
    accent: 'text-o1-olive',
  },
  {
    key: 'drinks',
    label: 'Drinks',
    icon: <Coffee className="w-6 h-6 stroke-[1.75]" />,
    accent: 'text-o1-lavender',
  },
];

/** The meal a photo most likely belongs to at this time of day. */
export function slotForHour(hour: number): SlotKey {
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 17) return 'snack';
  return 'dinner';
}
