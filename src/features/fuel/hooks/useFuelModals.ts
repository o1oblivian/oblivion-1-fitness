import { useState } from 'react';
import { SlotKey } from '../constants/fuelConstants';

export function useFuelModals() {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [activePresetCategory, setActivePresetCategory] = useState<SlotKey | null>(null);
  const [energyTab, setEnergyTab] = useState<'today' | 'macro_split' | 'intel' | 'targets'>('today');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanSlot, setScanSlot] = useState<SlotKey>('lunch');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceSlot, setVoiceSlot] = useState<SlotKey>('lunch');
  const [isAiSuggestionsOpen, setIsAiSuggestionsOpen] = useState(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [addFoodCategory, setAddFoodCategory] = useState<string>('Breakfast');
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [foodSearchSlot, setFoodSearchSlot] = useState<SlotKey>('breakfast');
  const [isIntakeExpanded, setIsIntakeExpanded] = useState(true);

  return {
    isCountryModalOpen,
    setIsCountryModalOpen,
    isDietModalOpen,
    setIsDietModalOpen,
    activePresetCategory,
    setActivePresetCategory,
    energyTab,
    setEnergyTab,
    isCameraOpen,
    setIsCameraOpen,
    scanSlot,
    setScanSlot,
    isVoiceOpen,
    setIsVoiceOpen,
    voiceSlot,
    setVoiceSlot,
    isAiSuggestionsOpen,
    setIsAiSuggestionsOpen,
    isAddFoodModalOpen,
    setIsAddFoodModalOpen,
    addFoodCategory,
    setAddFoodCategory,
    isFoodSearchOpen,
    setIsFoodSearchOpen,
    foodSearchSlot,
    setFoodSearchSlot,
    isIntakeExpanded,
    setIsIntakeExpanded,
  };
}
