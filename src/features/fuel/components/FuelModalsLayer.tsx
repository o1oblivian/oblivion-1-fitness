import React from 'react';
import { AIMealScanModal } from '../../../components/AIMealScanModal';
import { VoiceScanModal } from './VoiceScanModal';
import { AiMealSuggestionsModal } from './AiMealSuggestionsModal';
import { AddFoodModal } from './AddFoodModal';
import { ClientCountryMarketModal } from './ClientCountryMarketModal';
import { DietaryPreferenceModal } from './DietaryPreferenceModal';
import { MealItem } from '../store/useFuelStore';
import { SlotKey } from '../constants/fuelConstants';

interface FuelModalsLayerProps {
  isCameraOpen: boolean;
  onCloseCamera: () => void;
  scanSlot: SlotKey;
  isVoiceOpen: boolean;
  onCloseVoice: () => void;
  voiceSlot: SlotKey;
  isAiSuggestionsOpen: boolean;
  onCloseAiSuggestions: () => void;
  dietPreference: string;
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFats: number;
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
  onAddMealItem: (slot: SlotKey, item: MealItem) => void;
  showToast: (msg: string) => void;
}

export const FuelModalsLayer: React.FC<FuelModalsLayerProps> = ({
  isCameraOpen,
  onCloseCamera,
  scanSlot,
  isVoiceOpen,
  onCloseVoice,
  voiceSlot,
  isAiSuggestionsOpen,
  onCloseAiSuggestions,
  dietPreference,
  remainingCalories,
  remainingProtein,
  remainingCarbs,
  remainingFats,
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
  onAddMealItem,
  showToast,
}) => {
  const handleScanMeal = () => {
    // Note: The meal is already logged cleanly once by AIMealScanModal directly to the user-selected slot in useFuelStore and useLogStore
  };

  return (
    <>
      <AIMealScanModal
        isOpen={isCameraOpen}
        onClose={onCloseCamera}
        targetSlot={scanSlot}
        defaultSlot={scanSlot}
        onConfirmMeal={handleScanMeal}
        showToast={showToast}
      />
      <VoiceScanModal
        isOpen={isVoiceOpen}
        onClose={onCloseVoice}
        category={voiceSlot}
        onConfirmFood={(name, kcal, p, c, f) => {
          onAddMealItem(voiceSlot, {
            id: `voice-${Date.now()}`,
            name,
            calories: kcal,
            protein: p,
            carbs: c,
            fats: f,
          });
          showToast(`Voice Logged: ${name} (${kcal} kcal) to ${voiceSlot}`);
        }}
      />
      <AiMealSuggestionsModal
        isOpen={isAiSuggestionsOpen}
        onClose={onCloseAiSuggestions}
        dietPreference={dietPreference}
        remainingCalories={remainingCalories}
        remainingProtein={remainingProtein}
        remainingCarbs={remainingCarbs}
        remainingFats={remainingFats}
        onLogMeal={(slot, meal) => {
          onAddMealItem(slot, {
            id: `ai-${Date.now()}`,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
          });
          showToast(`Logged Meal: ${meal.name} to ${slot}`);
        }}
      />
      <AddFoodModal
        isOpen={isAddFoodModalOpen}
        category={addFoodCategory as any}
        onClose={onCloseAddFoodModal}
        onAddFood={(_cat, item) => {
          showToast(`Logged ${item.name} (${item.calories} kcal)`);
        }}
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
