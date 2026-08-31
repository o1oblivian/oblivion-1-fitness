# Project Context: Oblivion 1 Fitness Club (O1FC Official)

## Project Owner & Identity
- **Registered Owner / GitHub**: `o1oblivianfitness@gmail.com`
- **GitHub Username**: `o1oblivian`
- **Repository**: `https://github.com/o1oblivian/oblivion-1-fitness`
- **App Identity**: Oblivion 1 Fitness Club (O1FC Official) — Training OS Pro, Fuel OS, Tandem Mode, Coach Hub & Telemetry Intelligence.

## Core Rules & Invariants
1. **Never Replace or Override with Unrelated Projects**:
   - This app is strictly the **OFC Official** platform (Fitness, Fuel, Tandem, Coach, Health Telemetry, Nutrition, Workout OS).
   - Under no circumstances should this project be replaced, overwritten, or downgraded with generic templates or unrelated concepts (e.g. wallpaper apps, generic tools, or blank starters).

2. **Core Structure**:
   - Entry: `src/App.tsx`
   - Modes:
     - `HomeView`: Main athletic dashboard & daily summary
     - `SoloView`: Training OS Pro / Workout Tracker with rotary dial & exercise logs
     - `FuelView`: Fuel OS macro & metabolic nutrition logger
     - `TandemView`: Live workout tandem / partner synchronization
     - `FitnessIntelligenceApp` / `CoachView`: Coach dashboard, client roster, workout dispatch & live telemetry
     - `HistoryLogView`: Session vault, athlete logs & progress history
   - Components & Utilities: Keep all stores (`mealLogsStore`, `workoutLogsStore`, `telemetryStore`, `dispatchStore`, `tandemStore`, `authStorage`, `supabase`) aligned with OFC Official requirements.

3. **Global Visual Standard: Apple Pro Human Interface (100/10 Premium & Professional)**:
   - **Zero Emojis in Core UI**: Strictly forbidden from using casual emojis (e.g. 📋, 🛠️, ✨, 📥, 💬, 💰, 🎯, 🌙, 🏋️, 🥗, 🏦) in buttons, navigation tabs, segmented capsule filters, cards, and headers.
   - **Vector Glyphs or Pure Typography**: Use high-precision vector line icons (Lucide React with 1.5–2px stroke) or pure typography for filter capsules and tabs.
   - **No Cheap Colors or Clashing Palettes**: Use sophisticated neutrals (pure black, deep obsidian, crisp white, refined zinc/stone) with purposeful high-performance OFC Crimson accents (`#DC2626` / `#EF4444`).
   - **Pixel-Perfect Spatial Balance**: Enforce strict padding math, nested border radius rules, optical alignment, and zero arbitrary spacing jumps.
