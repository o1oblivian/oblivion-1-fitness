import { useState } from 'react';
import { SlotKey } from '../constants/fuelConstants';

export function useFuelModals() {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanSlot, setScanSlot] = useState<SlotKey>('lunch');
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [addFoodCategory, setAddFoodCategory] = useState<string>('Breakfast');
  const [isIntakeExpanded, setIsIntakeExpanded] = useState(true);

  return {
    isCountryModalOpen,
    setIsCountryModalOpen,
    isDietModalOpen,
    setIsDietModalOpen,
    isCameraOpen,
    setIsCameraOpen,
    scanSlot,
    setScanSlot,
    isAddFoodModalOpen,
    setIsAddFoodModalOpen,
    addFoodCategory,
    setAddFoodCategory,
    isIntakeExpanded,
    setIsIntakeExpanded,
  };
}
