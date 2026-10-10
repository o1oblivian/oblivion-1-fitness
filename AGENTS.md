# Oblivion 1 Fitness Club - Engineering Standards & Operational Directives

## Architecture & Code Quality Directives (Grade A+ Senior Standards)
All future agents and contributors MUST adhere strictly to these rules:

1. **Single Genuine Application (100% Clean)**:
   - Absolutely NO secondary, mock, demo, or placeholder apps.
   - All tabs in the main layout (`Workout`, `Fuel`, `Radar`, `Coach`, `Log`) connect directly to production feature modules in `/src/features/`.
   - Never introduce speculative frameworks, dummy sidebars, or mock views.

2. **Pure OLED Only & Natural Organic Colors (Zero Neon)**:
   - Pure OLED pitch black (#000000) base canvas ONLY. Zero light mode permitted.
   - Never add dark: variants, theme toggles, or light palettes.
   - Natural, organic athletic palette: Zero neon, no electric glows or over-saturated radiants.
   - Page Canvas: g-o1-canvas (#000000).
   - Card Surfaces: g-o1-surface (#111113).
   - Elevated Modals & Sheets: g-o1-sheet (#161618).
   - Hairline Borders: order-white/[0.07].
   - Text Palette: 	ext-o1-text (bone #EAE8DF) for primary copy, 	ext-o1-muted (stone #8A887F) for secondary metadata.
   - High-Contrast Accents: Oblivion 1 Crimson #C4121A (hover #A30F16, active #800C11), slate blue #0284c7, natural amber #d97706/#f59e0b, natural emerald #059669/#10b981.
   - Navigation Dock: Frosted black backdrop with clean active crimson state and high-contrast inactive icons.

3. **Single Source of Truth State Management**:
   - Workout and telemetry operations must bind cleanly through Zustand stores.
   - No split-brain state or duplicate mutations.
   - All numerical inputs (KG, Reps, RPE, RIR) must update metrics reactively and mathematically.

4. **Code Quality & Build Verification**:
   - Zero TypeScript compilation errors (`tsc --noEmit` must pass cleanly).
   - Zero unused imports or dead variable references.
   - All interactive controls (buttons, inputs, sliders, toggles) must have complete, robust event handlers.

5. **Android Production Baseline & Permission Lockdown (Version 69 Golden Baseline)**:
   - `android/app/src/main/AndroidManifest.xml` on `main` is the locked golden baseline. Never revert, overwrite, or mutate it without explicit instructions.
   - STRICT FORBIDDEN PERMISSIONS (Never add under any circumstance):
     * `android.permission.READ_MEDIA_IMAGES`
     * `android.permission.RECORD_AUDIO`
     * `android.permission.MODIFY_AUDIO_SETTINGS`
     * `android.permission.ACTIVITY_RECOGNITION`
     * `android.permission.BODY_SENSORS`
   - ONLY PERMITTED PERMISSIONS:
     * `android.permission.INTERNET`
     * `android.permission.CAMERA`
     * `android.permission.BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN` (`neverForLocation`), `BLUETOOTH_CONNECT`
 * `com.android.vending.BILLING` (RevenueCat / Google Play subscriptions)

6. **Permanent Rule (Optical Vision Engine)**:
   - Optical Vision Engine must return `null` for non-visible metrics on watches and gym consoles. Never apply zero or estimated fallbacks. Unread metrics must render as '--'.

7. **Optical Vision unread metrics stay `--`**. Vision services may be edited when the user asks; unread watch/console metrics must still return `null` and never fake zeros.

AndroidManifest on `main` remains the permission golden baseline unless the user explicitly asks to change it.
