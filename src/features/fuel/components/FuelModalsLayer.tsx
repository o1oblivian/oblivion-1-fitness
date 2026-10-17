import React from 'react';
import { MealMacroScannerModal } from '../../../components/MealMacroScannerModal';
import { AddFoodModal } from './AddFoodModal';
import { ClientCountryMarketModal } from './ClientCountryMarketModal';
import { DietaryPreferenceModal } from './DietaryPreferenceModal';
import { SlotKey } from '../constants/fuelConstants';
import type { MacroBudget } from '../data/intelMealEngine';

interface FuelModalsLayerProps {
  isCameraOpen: boolean;
  onCloseCamera: () => void;
  scanSlot: SlotKey;
  dietPreference: string;
  isAddFoodModalOpen: boolean;
  onCloseAddFoodModal: () => void;
  addFoodCategory: string;
  isCountryModalOpen: boolean;
  onCloseCountryModal: () => void;
  countryMarket: string;
  onSelectCountry: (code: string) => void;
  isDietModalOpen: boolean;
  onCloseDietModal: () => void;
  onSelectDiet: (diet: string) => void;
  showToast: (msg: string) => void;
  budget: MacroBudget | null;
}

export const FuelModalsLayer: React.FC<FuelModalsLayerProps> = ({
  isCameraOpen,
  onCloseCamera,
  scanSlot,
  dietPreference,
  isAddFoodModalOpen,
  onCloseAddFoodModal,
  addFoodCategory,
  isCountryModalOpen,
  onCloseCountryModal,
  countryMarket,
  onSelectCountry,
  isDietModalOpen,
  onCloseDietModal,
  onSelectDiet,
  showToast,
  budget,
}) => {
  return (
    <>
      <MealMacroScannerModal
        isOpen={isCameraOpen}
        onClose={onCloseCamera}
        targetSlot={scanSlot}
        defaultSlot={scanSlot}
        showToast={showToast}
      />
      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        category={addFoodCategory}
        onClose={onCloseAddFoodModal}
        onAddFood={(_cat, item) => {
          showToast(`Logged ${item.name} (${item.calories} kcal)`);
        }}
        showToast={showToast}
        budget={budget}
      />
      <ClientCountryMarketModal
        isOpen={isCountryModalOpen}
        selectedCode={countryMarket}
        onSelect={(code) => {
          onSelectCountry(code);
          showToast(`Market set to ${code}`);
        }}
        onClose={onCloseCountryModal}
      />
      <DietaryPreferenceModal
        isOpen={isDietModalOpen}
        selectedDiet={dietPreference}
        onSelect={(diet) => {
          onSelectDiet(diet);
          showToast(`Diet preference set to ${diet}`);
        }}
        onClose={onCloseDietModal}
      />
    </>
  );
};
