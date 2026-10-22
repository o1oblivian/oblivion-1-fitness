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
        color: 'text-o1-teal',
        bg: 'bg-o1-blue',
        icon: <Activity className="w-5 h-5 text-o1-teal" />,
      };
    case 'nutrition':
      return {
        title: 'Log food',
        color: 'text-o1-yellow',
        bg: 'bg-o1-yellow',
        icon: <Apple className="w-5 h-5 text-o1-yellow" />,
      };
    case 'sleep':
      return {
        title: 'Log sleep',
        color: 'text-o1-teal',
        bg: 'bg-o1-blue',
        icon: <Moon className="w-5 h-5 text-o1-teal" />,
      };
    case 'meditation':
      return {
        title: 'Log mindful',
        color: 'text-o1-olive',
        bg: 'bg-o1-olive',
        icon: <Sparkles className="w-5 h-5 text-o1-olive" />,
      };
  }
}
