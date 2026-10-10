import React from 'react';
import { useFuelStore } from './store/useFuelStore';
import { useUserStore } from '../../stores/useUserStore';
import { FuelHeroDashboard } from './components/FuelHeroDashboard';
import { SupplementsElectrolytesAccordion } from './components/SupplementsElectrolytesAccordion';
import { FuelHydrationCard } from './components/FuelHydrationCard';
import { O1FCIntelMealSuggestionsSection } from './components/O1FCIntelMealSuggestionsSection';
import { FuelCustomMacroDrawer } from './components/FuelCustomMacroDrawer';
import { FuelIntakeSection } from './components/FuelIntakeSection';
import { FuelPresetsModal } from './components/FuelPresetsModal';
import { FuelModalsLayer } from './components/FuelModalsLayer';
import { useFuelTotals } from './hooks/useFuelTotals';
import { useFuelModals } from './hooks/useFuelModals';
import { useSubscription } from '../../context/SubscriptionContext';
import { hydrateFuelFromSupabase } from './services/fuelHydrationService';

export const FuelView: React.FC = () => {
  const { isPro, openPaywall } = useSubscription();
  const {
    meals,
    calorieTarget,
    burnedKcal,
    weightKg,
    countryMarket = 'AU',
    setCountryMarket,
    targetProteinG,
    targetCarbsG,
    targetFatsG,
    dietPreference = 'Omnivore',
    setDietPreference,
    hydrationTargetL,
    hydrationCurrentL,
    logHydration,
    addMealItem,
    removeMealItem,
    setEnergyTargets,
    setWeightKg,
    showToast,
  } = useFuelStore();
  const profileWeight = useUserStore((s) => s.weightKg);
  const setProfileWeight = useUserStore((s) => s.setWeightKg);

  React.useEffect(() => {
    if (profileWeight > 0 && profileWeight !== weightKg) {
      setWeightKg(profileWeight);
    } else if (profileWeight <= 0 && weightKg > 0) {
      setProfileWeight(weightKg);
    }
  }, [profileWeight, weightKg, setWeightKg, setProfileWeight]);

  const modals = useFuelModals();

  React.useEffect(() => {
    hydrateFuelFromSupabase((cloudMeals, target) => {
      const currentMeals = useFuelStore.getState().meals;
      // If store is currently empty, or cloudMeals has more data, hydrate store
      const hasCurrent = Object.values(currentMeals).some((arr) => Array.isArray(arr) && arr.length > 0);
      const hasCloud = Object.values(cloudMeals).some((arr) => Array.isArray(arr) && arr.length > 0);
      if (!hasCurrent || hasCloud) {
        useFuelStore.setState((prev) => ({
          ...prev,
          meals: cloudMeals,
          ...(target ? { calorieTarget: target, caloriesBudget: target } : {}),
        }));
      }
    });
  }, []);

  const { totals, handleDeleteItem, handleLogVerifiedPreset } = useFuelTotals({
    meals,
    calorieTarget,
    burnedKcal,
    removeMealItem,
    addMealItem,
    showToast,
  });

  const gramsLeft = (target: number, eaten: number) => {
    const a = Number.isFinite(target) ? target : 0;
    const b = Number.isFinite(eaten) ? eaten : 0;
    return Math.max(0, a - b);
  };
  const remainingProtein = gramsLeft(targetProteinG, totals.totalProtein);
  const remainingCarbs = gramsLeft(targetCarbsG, totals.totalCarbs);
  const remainingFats = gramsLeft(targetFatsG, totals.totalFats);

  return (
    <div
      id="fuel-view-container"
      className="w-full h-auto min-h-full bg-transparent text-white pt-1 pb-10 select-none space-y-2.5 transition-colors"
    >
      <FuelHeroDashboard
        countryMarket={countryMarket}
        dietPreference={dietPreference}
        weightKg={profileWeight > 0 ? profileWeight : weightKg}
        remainingKcal={totals.remainingCalories}
        eatenKcal={totals.totalCalories}
        burnedKcal={burnedKcal}
        dailyTargetKcal={calorieTarget}
        proteinG={totals.totalProtein}
        proteinTarget={targetProteinG}
        carbsG={totals.totalCarbs}
        carbsTarget={targetCarbsG}
        fatsG={totals.totalFats}
        fatsTarget={targetFatsG}
        onOpenCountry={() => modals.setIsCountryModalOpen(true)}
        onOpenDiet={() => modals.setIsDietModalOpen(true)}
        onSaveWeight={(w) => {
          setProfileWeight(w);
          setWeightKg(w);
          showToast(`Weight updated to ${w} kg`);
        }}
        onApplyTargets={(cal, p, c, f, weight) => {
          setEnergyTargets(cal, p, c, f, weight);
          showToast(`Energy Engine: ${cal} kcal · ${p}g P · ${c}g C · ${f}g F`);
        }}
      />

      {/* Hydration Section */}
      <FuelHydrationCard
        hydrationCurrentL={hydrationCurrentL}
        hydrationTargetL={hydrationTargetL}
        logHydration={logHydration}
        showToast={showToast}
      />

      {/* O1FC Intel Meal Suggestions (Directly underneath Hydration) */}
      <O1FCIntelMealSuggestionsSection
        remainingCalories={totals.remainingCalories}
        remainingProtein={remainingProtein}
        remainingCarbs={remainingCarbs}
        remainingFats={remainingFats}
        targetProteinG={targetProteinG}
        dietPreference={dietPreference}
        countryMarket={countryMarket}
        onOpenDietModal={() => modals.setIsDietModalOpen(true)}
        onAddMealItem={addMealItem}
        showToast={showToast}
      />

      {/* Custom Macro Drawer */}
      <FuelCustomMacroDrawer
        isOpen={modals.isCustomEntryOpen}
        onClose={() => modals.setIsCustomEntryOpen(false)}
        onAddMealItem={addMealItem}
        showToast={showToast}
      />

      {/* Daily Meals Intake Breakdown */}
      <FuelIntakeSection
        isIntakeExpanded={modals.isIntakeExpanded}
        onToggleIntake={() => modals.setIsIntakeExpanded(!modals.isIntakeExpanded)}
        meals={meals}
        dietPreference={dietPreference}
        onDeleteItem={handleDeleteItem}
        onOpenAddFoodModal={(catLabel) => {
          modals.setAddFoodCategory(catLabel);
          modals.setIsAddFoodModalOpen(true);
        }}
        onOpenVoiceModal={(slot) => {
          modals.setVoiceSlot(slot);
          modals.setIsVoiceOpen(true);
        }}
        onOpenScanModal={(slot) => {
          if (!isPro) {
            openPaywall('Vision Macro & Nutrition Scanner');
            return;
          }
          modals.setScanSlot(slot);
          modals.setIsCameraOpen(true);
        }}
        onQuickAddItem={(slot, item) => {
          addMealItem(slot as any, item);
          showToast(`Logged ${item.name} (+${item.calories} kcal)`);
        }}
      />

      {/* Supplements & Electrolytes Section */}
      <SupplementsElectrolytesAccordion onShowToast={showToast} />

      {/* Verified Presets Modal */}
      <FuelPresetsModal
        activePresetCategory={modals.activePresetCategory}
        onClose={() => modals.setActivePresetCategory(null)}
        onLogVerifiedPreset={handleLogVerifiedPreset}
      />

      {/* Modals Layer */}
      <FuelModalsLayer
        isCameraOpen={modals.isCameraOpen}
        onCloseCamera={() => modals.setIsCameraOpen(false)}
        scanSlot={modals.scanSlot}
        isVoiceOpen={modals.isVoiceOpen}
        onCloseVoice={() => modals.setIsVoiceOpen(false)}
        voiceSlot={modals.voiceSlot}
        isAiSuggestionsOpen={modals.isAiSuggestionsOpen}
        onCloseAiSuggestions={() => modals.setIsAiSuggestionsOpen(false)}
        dietPreference={dietPreference}
        remainingCalories={totals.remainingCalories}
        remainingProtein={remainingProtein}
        remainingCarbs={remainingCarbs}
        remainingFats={remainingFats}
        isAddFoodModalOpen={modals.isAddFoodModalOpen}
        onCloseAddFoodModal={() => modals.setIsAddFoodModalOpen(false)}
        addFoodCategory={modals.addFoodCategory}
        onOpenCustomFood={() => modals.setIsCustomEntryOpen(true)}
        isCountryModalOpen={modals.isCountryModalOpen}
        onCloseCountryModal={() => modals.setIsCountryModalOpen(false)}
        countryMarket={countryMarket}
        onSelectCountry={setCountryMarket}
        isDietModalOpen={modals.isDietModalOpen}
        onCloseDietModal={() => modals.setIsDietModalOpen(false)}
        onSelectDiet={setDietPreference}
        onAddMealItem={addMealItem}
        showToast={showToast}
      />
    </div>
  );
};

export default FuelView;
