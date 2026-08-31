import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Utensils, TrendingUp, Clock, Target, Plus, Zap } from 'lucide-react';

interface CaloriesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: any;
  intakeCals?: number;
  targetCals?: number;
  bmr?: number;
  trainingBurn?: number;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const CaloriesDetailModal: React.FC<CaloriesDetailModalProps> = ({
  isOpen,
  onClose,
  stats,
  intakeCals,
  targetCals,
  bmr,
  trainingBurn,
  showToast = (_msg?: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState<'macros' | 'meals' | 'expenditure'>('macros');

  // Lock Body & HTML Scroll to strip background scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Derive values safely without NaN
  const intake = intakeCals ?? stats?.calories ?? 3120;
  const target = targetCals ?? stats?.calorieTarget ?? 2800;
  const bmrVal = bmr ?? 1850;
  const burnVal = trainingBurn ?? 650;
  const totalExpenditure = bmrVal + burnVal + 320; // 320 kcal NEAT
  const netSurplusDeficit = intake - totalExpenditure;

  // Meal timing logs
  const mealTimingLogs = [
    {
      id: 'm1',
      time: '07:30 AM',
      mealName: 'Breakfast Protocol',
      items: 'Steel Cut Oats (80g) + Whey Isolate + Blueberries + Almonds',
      cals: 580,
      macros: '42g P • 78g C • 12g F',
      badge: 'HIGH PROTEIN',
    },
    {
      id: 'm2',
      time: '12:45 PM',
      mealName: 'Intra-Day Refuel (Lunch)',
      items: 'Grilled Chicken Breast (220g) + Jasmine Rice (200g) + Avocado',
      cals: 740,
      macros: '65g P • 82g C • 16g F',
      badge: 'PERFORMANCE',
    },
    {
      id: 'm3',
      time: '04:15 PM',
      mealName: 'Pre-Workout Energy',
      items: 'Organic Rice Cakes (3x) + Almond Butter + Medjool Date',
      cals: 320,
      macros: '8g P • 52g C • 10g F',
      badge: 'GLYCOGEN SPIKE',
    },
    {
      id: 'm4',
      time: '08:00 PM',
      mealName: 'Anabolic Dinner',
      items: 'Grass-Fed Ribeye Steak (250g) + Sweet Potato + Asparagus',
      cals: 960,
      macros: '68g P • 60g C • 38g F',
      badge: 'RECOVERY',
    },
    {
      id: 'm5',
      time: '09:45 PM',
      mealName: 'Bedtime Anabolic Snack',
      items: 'Non-Fat Greek Yogurt (250g) + Micellar Casein + Honey',
      cals: 280,
      macros: '35g P • 24g C • 3g F',
      badge: 'SLOW DIGEST',
    },
  ];

  // 7-day caloric burn history
  const burnHistory = [
    { day: 'Mon', date: 'Aug 03', total: 2710, intake: 3100 },
    { day: 'Tue', date: 'Aug 04', total: 2840, intake: 2950 },
    { day: 'Wed', date: 'Aug 05', total: 2680, intake: 2800 },
    { day: 'Thu', date: 'Aug 06', total: 2860, intake: 3200 },
    { day: 'Fri', date: 'Aug 07', total: 2820, intake: 3050 },
    { day: 'Sat', date: 'Aug 08', total: 3110, intake: 3400 },
    { day: 'Sun', date: 'TODAY', total: totalExpenditure, intake: intake },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[99990] bg-black/75 backdrop-blur-sm overflow-y-auto overscroll-contain font-sans animate-fadeIn p-2 sm:p-4 flex items-start justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] w-full max-w-xl my-auto p-3.5 sm:p-4 shadow-2xl relative rounded-2xl border border-[rgba(0,0,0,0.08)] dark:border-slate-800 flex flex-col gap-2.5 select-none"
      >
        {/* Compact Header */}
        <div className="flex justify-between items-center border-b border-[rgba(0,0,0,0.08)] dark:border-slate-800 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#DC2626]" /> Energy Matrix
              </span>
              <span className="text-[10px] font-mono font-bold text-[#7A9382] bg-[#7A9382]/10 px-1.5 py-0.5 rounded-md border border-[#7A9382]/30">
                {netSurplusDeficit >= 0 ? `+${netSurplusDeficit} KCAL SURPLUS` : `${netSurplusDeficit} KCAL DEFICIT`}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#000000] dark:text-white mt-0.5 tracking-tight flex items-center gap-1.5 font-mono">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Calories In / Out Deep Breakdown</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-nude-close shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Streamlined Tab Selector */}
        <div className="flex items-center gap-1 p-0.5 bg-[#F2F2F7] dark:bg-black/60 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 font-mono text-[11px]">
          <button
            onClick={() => setActiveTab('macros')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'macros'
                ? 'bg-[#1A1E1D] dark:bg-white text-white dark:text-black shadow-2xs'
                : 'text-[#5A5F5D] dark:text-gray-400 hover:text-[#000000]'
            }`}
          >
            <Target className="w-3 h-3" /> Macros
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'meals'
                ? 'bg-[#DC2626] text-white shadow-2xs'
                : 'text-[#5A5F5D] dark:text-gray-400 hover:text-[#DC2626]'
            }`}
          >
            <Utensils className="w-3 h-3" /> Meal Logs
          </button>
          <button
            onClick={() => setActiveTab('expenditure')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'expenditure'
                ? 'bg-[#7A9382] text-white shadow-2xs'
                : 'text-[#5A5F5D] dark:text-gray-400 hover:text-[#7A9382]'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> 7-Day Burn
          </button>
        </div>

        {/* TAB 1: MACRO TARGETS & BREAKDOWN */}
        {activeTab === 'macros' && (
          <div className="space-y-2 text-xs font-mono">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-center">
                <span className="text-[9px] text-[#5A5F5D] dark:text-gray-400 font-bold uppercase">INTAKE</span>
                <span className="text-sm font-black text-[#000000] dark:text-white mt-0.5">{intake} kcal</span>
                <span className="text-[8.5px] text-[#7A9382] font-bold">Goal: {target} kcal</span>
              </div>

              <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-center">
                <span className="text-[9px] text-[#DC2626] font-bold uppercase">TRAINING BURN</span>
                <span className="text-sm font-black text-[#DC2626] mt-0.5">{burnVal} kcal</span>
                <span className="text-[8.5px] text-[#5A5F5D]">Active Session</span>
              </div>

              <div className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex flex-col justify-center">
                <span className="text-[9px] text-[#7A9382] font-bold uppercase">NET BALANCE</span>
                <span className="text-sm font-black text-[#7A9382] mt-0.5">{netSurplusDeficit > 0 ? `+${netSurplusDeficit}` : netSurplusDeficit}</span>
                <span className="text-[8.5px] text-[#5A5F5D]">kcal / day</span>
              </div>
            </div>

            {/* Macro Bars */}
            <div className="bg-white dark:bg-black/40 p-3 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-2">
              <h4 className="text-[11px] font-bold text-[#000000] dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  Macronutrient Distribution
                </span>
                <span className="text-[9px] text-[#5A5F5D]">Target Ratio: 30P / 45C / 25F</span>
              </h4>

              {/* Protein */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-[#DC2626]">Protein (4 kcal/g)</span>
                  <span className="font-black text-[#000000] dark:text-white">195g / 210g (92%)</span>
                </div>
                <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#DC2626] h-full w-[92%] transition-all duration-500" />
                </div>
              </div>

              {/* Carbohydrates */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-[#000000] dark:text-gray-300">Carbohydrates (4 kcal/g)</span>
                  <span className="font-black text-[#000000] dark:text-white">310g / 320g (96%)</span>
                </div>
                <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3A3F3D] dark:bg-gray-300 h-full w-[96%] transition-all duration-500" />
                </div>
              </div>

              {/* Fats */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-[#7A9382]">Fats (9 kcal/g)</span>
                  <span className="font-black text-[#000000] dark:text-white">72g / 75g (96%)</span>
                </div>
                <div className="w-full bg-[#E5E5EA] dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#7A9382] h-full w-[96%] transition-all duration-500" />
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <button
              onClick={() => showToast('Macro targets saved & synced with Fuel OS!', 'success')}
              className="w-full py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Save & Sync Macro Targets</span>
            </button>
          </div>
        )}

        {/* TAB 2: MEAL TIMING LOGS */}
        {activeTab === 'meals' && (
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[#5A5F5D] text-[9.5px] uppercase font-bold">5 Logged Meals Today</span>
              <button
                onClick={() => showToast('Opening Food Intel Camera Scanner...')}
                className="text-[9.5px] text-[#DC2626] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Log Meal
              </button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
              {mealTimingLogs.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-white dark:bg-black/40 p-2 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-1 hover:border-[#DC2626] transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#000000] dark:text-white text-[11px]">{meal.mealName}</span>
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
                        {meal.badge}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-[#5A5F5D] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {meal.time}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#5A5F5D] dark:text-gray-300 font-sans leading-snug">
                    {meal.items}
                  </p>

                  <div className="flex justify-between items-center text-[9.5px] pt-1 border-t border-[rgba(0,0,0,0.08)] dark:border-white/10">
                    <span className="text-[#7A9382] font-bold">{meal.macros}</span>
                    <span className="font-black text-[#000000] dark:text-white text-[11px]">{meal.cals} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 7-DAY EXPENDITURE HISTORY */}
        {activeTab === 'expenditure' && (
          <div className="space-y-2 font-mono text-xs">
            <div className="bg-white dark:bg-black/40 p-2 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-white/10 space-y-1.5">
              <div className="flex justify-between items-center pb-1 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                <span className="font-bold text-[#000000] dark:text-white text-[11px]">Daily BMR Baseline</span>
                <span className="font-black text-[#000000] dark:text-white text-[11px]">{bmrVal} kcal</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-[rgba(0,0,0,0.08)] dark:border-white/10">
                <span className="font-bold text-[#DC2626] text-[11px]">Active Training Burn (Avg)</span>
                <span className="font-black text-[#DC2626] text-[11px]">+{burnVal} kcal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#7A9382] text-[11px]">NEAT Non-Exercise Activity</span>
                <span className="font-black text-[#7A9382] text-[11px]">+320 kcal</span>
              </div>
            </div>

            {/* 7-Day History Table */}
            <div className="space-y-1">
              <span className="text-[9.5px] text-[#5A5F5D] uppercase font-bold px-0.5">7-Day Energy History</span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {burnHistory.map((item, i) => (
                  <div
                    key={i}
                    className="bg-[#F2F2F7] dark:bg-white/5 p-2 rounded-lg border border-[rgba(0,0,0,0.08)] dark:border-white/10 flex items-center justify-between text-[10.5px]"
                  >
                    <div>
                      <span className="font-bold text-[#000000] dark:text-white mr-1.5">{item.day}</span>
                      <span className="text-[9px] text-[#5A5F5D]">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] text-[#5A5F5D]">In: {item.intake}</span>
                      <span className="font-black text-[#DC2626]">Out: {item.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#1A1E1D] dark:bg-white hover:bg-[#3A3F3D] text-white dark:text-black font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs mt-1"
        >
          Close Detail View
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

