import React from 'react';
import { Activity, Apple, Dumbbell, Moon, Sparkles } from 'lucide-react';
import type { TelemetryCategory } from '../../store/useTelemetryHistoryStore';

/** Title, accent colours and icon for each kind of day log. */
export function getCategoryTheme(category: TelemetryCategory) {
  switch (category) {
    case 'workout':
      return {
        title: 'Log workout',
        color: 'text-o1-crimson',
        bg: 'bg-o1-crimson',
        icon: <Dumbbell className="w-5 h-5 text-o1-crimson" />,
      };
    case 'cardio':
      return {
        title: 'Log cardio',
        color: 'text-sky-400',
        bg: 'bg-sky-600',
        icon: <Activity className="w-5 h-5 text-sky-400" />,
      };
    case 'nutrition':
      return {
        title: 'Log food',
        color: 'text-amber-400',
        bg: 'bg-amber-600',
        icon: <Apple className="w-5 h-5 text-amber-400" />,
      };
    case 'sleep':
      return {
        title: 'Log sleep',
        color: 'text-sky-400',
        bg: 'bg-sky-600',
        icon: <Moon className="w-5 h-5 text-sky-400" />,
      };
    case 'meditation':
      return {
        title: 'Log mindful',
        color: 'text-emerald-500',
        bg: 'bg-emerald-600',
        icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      };
  }
}
