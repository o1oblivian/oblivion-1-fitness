import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface NavigationTriggerProps {
  onOpenSettings: () => void;
  className?: string;
  ariaLabel?: string;
}

export const SettingsTriggerButton: React.FC<NavigationTriggerProps> = () => {
  // Top-right duplicate menu button eradicated completely
  return null;
};

export default SettingsTriggerButton;
