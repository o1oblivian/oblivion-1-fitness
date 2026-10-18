import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFuelStore } from './store/useFuelStore';
import { useUserStore } from '../../stores/useUserStore';
import { FuelCommandHero, MacroMeter } from './components/FuelCommandHero';
import { FuelSettingsSheet } from './components/FuelSettingsSheet';
import { MifflinStJeorModal } from './components/MifflinStJeorModal';
import { SupplementsElectrolytesAccordion } from './components/SupplementsElectrolytesAccordion';
import { MealSuggestionsSection } from './components/MealSuggestionsSection';
import { FuelIntakeSection } from './components/FuelIntakeSection';
import { FuelModalsLayer } from './components/FuelModalsLayer';
import { useFuelTotals } from './hooks/useFuelTotals';
import { useFuelModals } from './hooks/useFuelModals';
import {
  hydrationGoalLiters,
  lastSevenDateKeys,
  resolveMacroTargets,
  WeekDayEntry,
} from './utils/fuelMath';
import { FuelWeekSlide } from './components/FuelWeekSlide';
import { FuelUsualsRow } from './components/FuelUsualsRow';
import { buildUsuals, slotForHour, Usual } from './utils/fuelUsuals';
import { useTelemetryHistoryStore } from '../log/store/useTelemetryHistoryStore';
import { MEAL_SLOT_SHARE, MealSlot, slotBudget } from './data/mealBudget';

function restingBurn(
  weightKg: number | null,
  heightCm: number | null,
  ageYears: number | null,
  sex: 'male' | 'female' | null,
): number | null {
  if (!weightKg || !heightCm || !ageYears || !sex) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

function gramsLeft(target: number | null, eaten: number): number {
  return target != null ? Math.max(0, target - eaten) : 0;
}

export const FuelView: React.FC = () => {
  const meals = useFuelStore((s) => s.meals);
  const calorieTarget = useFuelStore((s) => s.calorieTarget);
  const targetProteinG = useFuelStore((s) => s.targetProteinG);
  const targetCarbsG = useFuelStore((s) => s.targetCarbsG);
  const targetFatsG = useFuelStore((s) => s.targetFatsG);
  const burnedKcal = useFuelStore((s) => s.burnedKcal);
  const weightKg = useFuelStore((s) => s.weightKg);
  const body = useFuelStore((s) => s.body);
  const countryMarket = useFuelStore((s) => s.countryMarket);
  const dietPreference = useFuelStore((s) => s.dietPreference);
  const hydrationTargetL = useFuelStore((s) => s.hydrationTargetL);
  const hydrationCurrentL = useFuelStore((s) => s.hydrationCurrentL);
  const dateKey = useFuelStore((s) => s.dateKey);
  const weekTotals = useFuelStore((s) => s.weekTotals);
  const {
    hydrate,
    logHydration,
    addMealItem,
    removeMealItem,
    setEnergyTargets,
    setWeightKg,
    setBody,
    setCountryMarket,
    setDietPreference,
  } = useFuelStore.getState();
  const profileWeight = useUserStore((s) => s.weightKg);
  const setProfileWeight = useUserStore((s) => s.setWeightKg);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const modals = useFuelModals();

  useEffect(() => {
    void hydrate();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void hydrate();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('o1fc_day_changed', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('o1fc_day_changed', onVisible);
    };
  }, [hydrate]);

  useEffect(() => {
    if (weightKg == null && profileWeight > 0) setWeightKg(profileWeight);
  }, [weightKg, profileWeight, setWeightKg]);

  const { totals, balance, handleDeleteItem } = useFuelTotals({
    meals,
    calorieTarget,
    burnedKcal,
    removeMealItem,
    showToast,
  });

  const macroTargets = resolveMacroTargets(
    calorieTarget,
    targetProteinG,
    targetCarbsG,
    targetFatsG,
    weightKg,
  );
  const macros: MacroMeter[] = [
    { label: 'Protein', consumed: totals.protein, target: macroTargets.protein, color: '#C4121A' },
    { label: 'Carbs', consumed: totals.carbs, target: macroTargets.carbs, color: '#d97706' },
    { label: 'Fats', consumed: totals.fats, target: macroTargets.fats, color: '#059669' },
  ];
  const remainingKcal = Math.max(0, balance.remaining ?? 0);
  const remainingProtein = gramsLeft(macroTargets.protein, totals.protein);
  const remainingCarbs = gramsLeft(macroTargets.carbs, totals.carbs);
  const remainingFats = gramsLeft(macroTargets.fats, totals.fats);
  const intelRemaining = useMemo(
    () => ({
      kcal: remainingKcal,
      protein: remainingProtein,
      carbs: remainingCarbs,
      fats: remainingFats,
    }),
    [remainingKcal, remainingProtein, remainingCarbs, remainingFats],
  );
  const calibrated = calorieTarget != null && calorieTarget > 0 && macroTargets.protein != null;
  const loggedSlots = useMemo(
    () =>
      (['breakfast', 'lunch', 'dinner', 'snack'] as const).filter(
        (s) => (meals[s] || []).length > 0,
      ),
    [meals],
  );
  const slotTargets = useMemo(() => {
    if (!calorieTarget || calorieTarget <= 0) return null;
    const out: Partial<Record<MealSlot, number>> = {};
    for (const s of Object.keys(MEAL_SLOT_SHARE) as MealSlot[]) {
      if (loggedSlots.includes(s)) out[s] = Math.round(calorieTarget * MEAL_SLOT_SHARE[s]);
      else out[s] = intelRemaining.kcal < 150 ? 0 : slotBudget(s, intelRemaining, loggedSlots).kcal;
    }
    return out;
  }, [calorieTarget, intelRemaining, loggedSlots]);
  const history = useTelemetryHistoryStore((s) => s.historyByDate);
  const usualSlot = slotForHour(new Date().getHours());
  const usuals = useMemo(
    () => buildUsuals(history, dateKey, usualSlot),
    [history, dateKey, usualSlot],
  );
  const usualNames = useMemo(() => usuals.map((u) => u.name), [usuals]);
  const logUsual = useCallback(
    (usual: Usual) => {
      addMealItem(usual.slot, {
        id: '',
        name: usual.name,
        calories: usual.calories,
        protein: usual.protein,
        carbs: usual.carbs,
        fats: usual.fats,
      });
      showToast(`Logged ${usual.name} · ${usual.calories} kcal`);
    },
    [addMealItem, showToast],
  );
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekDays: WeekDayEntry[] = lastSevenDateKeys(new Date(y, m - 1, d)).map((key) =>
    key === dateKey
      ? { dateKey: key, totals: totals.calories > 0 ? totals : null, isToday: true }
      : { dateKey: key, totals: weekTotals[key] ?? null, isToday: false },
  );
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      id="fuel-view-container"
      className="w-full h-auto min-h-full bg-o1-canvas text-o1-text pt-1 pb-10 select-none space-y-3"
    >
      <FuelCommandHero
        dateLabel={dateLabel}
        balance={balance}
        eatenKcal={totals.calories}
        burnedKcal={burnedKcal}
        macros={macros}
        weekSlide={
          <FuelWeekSlide
            days={weekDays}
            targets={{
              calories: calorieTarget,
              protein: macroTargets.protein,
              carbs: macroTargets.carbs,
              fats: macroTargets.fats,
            }}
          />
        }
        waterL={hydrationCurrentL}
        waterGoalL={hydrationGoalLiters(hydrationTargetL, weightKg)}
        onAddWater={logHydration}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <FuelUsualsRow
        usuals={usuals}
        slotLabel={
          usualSlot === 'snack' ? 'Snacks' : usualSlot[0].toUpperCase() + usualSlot.slice(1)
        }
        onLog={logUsual}
      />

      <MealSuggestionsSection
        calibrated={calibrated}
        remaining={intelRemaining}
        loggedSlots={loggedSlots}
        dietPreference={dietPreference}
        country={countryMarket}
        usualNames={usualNames}
        onOpenDietModal={() => modals.setIsDietModalOpen(true)}
        onAddMealItem={addMealItem}
        showToast={showToast}
      />

      <FuelIntakeSection
        isIntakeExpanded={modals.isIntakeExpanded}
        onToggleIntake={() => modals.setIsIntakeExpanded(!modals.isIntakeExpanded)}
        meals={meals}
        slotTargets={slotTargets}
        onDeleteItem={handleDeleteItem}
        onOpenAddFoodModal={(catLabel) => {
          modals.setAddFoodCategory(catLabel);
          modals.setIsAddFoodModalOpen(true);
        }}
        onOpenScanModal={(slot) => {
          modals.setScanSlot(slot);
          modals.setIsCameraOpen(true);
        }}
      />

      <SupplementsElectrolytesAccordion onShowToast={showToast} weightKg={weightKg} />

      <FuelSettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        countryMarket={countryMarket}
        dietPreference={dietPreference}
        weightKg={weightKg}
        targets={{
          calories: calorieTarget,
          protein: macroTargets.protein,
          carbs: macroTargets.carbs,
          fats: macroTargets.fats,
        }}
        bmr={restingBurn(weightKg, body.heightCm, body.ageYears, body.sex)}
        onOpenCountry={() => modals.setIsCountryModalOpen(true)}
        onOpenDiet={() => modals.setIsDietModalOpen(true)}
        onOpenCalculator={() => setCalculatorOpen(true)}
        onSaveWeight={(kg) => {
          setWeightKg(kg);
          setProfileWeight(kg);
          showToast(`Weight saved · ${kg} kg`);
        }}
        onSaveTargets={(cal, p, c, f) => {
          setEnergyTargets(cal, p, c, f);
          showToast(`Targets saved · ${cal.toLocaleString()} kcal`);
        }}
      />

      <MifflinStJeorModal
        isOpen={calculatorOpen}
        body={{ weightKg, heightCm: body.heightCm, ageYears: body.ageYears, sex: body.sex }}
        onClose={() => setCalculatorOpen(false)}
        onApplyTargets={(cal, p, c, f, next) => {
          setEnergyTargets(cal, p, c, f, next.weightKg);
          setBody({ heightCm: next.heightCm, ageYears: next.ageYears, sex: next.sex });
          setCalculatorOpen(false);
          setSettingsOpen(false);
          showToast(`Blueprint applied · ${cal.toLocaleString()} kcal`);
        }}
      />

      <FuelModalsLayer
        isCameraOpen={modals.isCameraOpen}
        onCloseCamera={() => modals.setIsCameraOpen(false)}
        scanSlot={modals.scanSlot}
        dietPreference={dietPreference}
        isAddFoodModalOpen={modals.isAddFoodModalOpen}
        onCloseAddFoodModal={() => modals.setIsAddFoodModalOpen(false)}
        addFoodCategory={modals.addFoodCategory}
        isCountryModalOpen={modals.isCountryModalOpen}
        onCloseCountryModal={() => modals.setIsCountryModalOpen(false)}
        countryMarket={countryMarket}
        onSelectCountry={setCountryMarket}
        isDietModalOpen={modals.isDietModalOpen}
        onCloseDietModal={() => modals.setIsDietModalOpen(false)}
        onSelectDiet={setDietPreference}
        budget={calibrated ? intelRemaining : null}
        showToast={showToast}
      />

      {toast ? (
        <div role="status" aria-live="polite" className="o1-toast">
          {toast}
        </div>
      ) : null}
    </div>
  );
};
