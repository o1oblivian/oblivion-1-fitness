# Project Context: Oblivion 1 Fitness Club (O1FC Official)

## Project Owner & Identity
- **Registered Owner / GitHub**: `o1oblivianfitness@gmail.com`
- **GitHub Username**: `o1oblivian`
- **Repository**: `https://github.com/o1oblivian/oblivion-1-fitness`
- **App Identity**: Oblivion 1 Fitness Club (O1FC Official) — Training OS Pro, Fuel OS, Tandem Mode, Coach Hub & Telemetry Intelligence.
- **Supabase Backend (Immutable)**: `https://qkfvepjeyreicqomatyt.supabase.co` (Ref: `qkfvepjeyreicqomatyt`)

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

## System Guarantees & Commitments Log
### Note 1: Core Integrity, Vision Analysis & Payment Guarantees (Recorded: September 1, 2026)
1. **0% Fake Meal Templates (Absolute Invariant)**:
   - Zero hardcoded fallback meals (e.g., "Protein Oatmeal & Greek Yogurt Bowl", "Athletic High-Protein Meal Plate", etc.) in both frontend and backend.
   - Meal scanning only returns genuine AI Vision analysis from live multimodal models or explicit error states when non-food/unreadable images are provided. No synthetic mock food data will ever be presented to the user.
2. **0% Fake Subscriptions / Free Bypass (Absolute Invariant)**:
   - Zero client-side fake activation bypasses or simulated unlock buttons in the checkout workflow.
   - Coach Pro and Elite tiers require real, verified Stripe checkout sessions and webhook confirmations.
3. **Strict Gemini SDK Payload Architecture**:
   - The vision analysis endpoint must strictly adhere to the `@google/genai` specification (`[{ inlineData: ... }, prompt]`) with verified JSON schema enforcement.
4. **Resilient Multi-Endpoint & Proxy Protection**:
   - The network layer (`apiFetch`) enforces content-type validation (`application/json`) to ensure responses are not intercepted by preview proxy redirects or HTML challenge pages.

### Note 2: Comprehensive External Service Integrations Matrix (Recorded: September 1, 2026)
1. **Google Gemini AI (@google/genai)**:
   - **Key**: Configured via `GEMINI_API_KEY` in server environment.
   - **Models**: `gemini-3.7-flash`, `gemini-flash-latest`.
   - **Services Connected**:
     - `/api/food-scan`: Multimodal live computer vision for food nutrition decomposition with USDA macro schema.
     - `/api/gemini-coach`: Telemetry & performance AI intelligence analyst.
     - Supabase Edge Function (`/supabase/functions/food-scan`): Serverless failover.
2. **Stripe Payments & Coach Payouts**:
   - **Key**: Configured via `STRIPE_SECRET_KEY` in `server.ts` & environment.
   - **Endpoints Connected**:
     - `/api/create-checkout-session`: Real checkout sessions supporting Cards, Apple Pay, Google Pay, and Link for memberships (Founder Pass, Plus, Travel Pass, Coach Starter, Coach Pro, 1-on-1 packages).
     - `/api/stripe-verify-session`: Post-payment session validation with live Stripe API.
     - `/api/stripe-webhook`: Event webhooks for checkout completion and subscription lifecycle.
     - `/api/create-portal-session`: Stripe Customer Billing Portal for subscription self-management.
     - `/api/stripe-coach-onboarding` & `/api/stripe-coach-dashboard`: Stripe Connect Express for coaches to receive direct bank payouts.
3. **Supabase Backend (Auth & Database)**:
   - **Endpoint**: `https://qkfvepjeyreicqomatyt.supabase.co` (Ref: `qkfvepjeyreicqomatyt`).
   - **Anon Key**: `sb_publishable_RI2IA9KKxaOf3yWTsOJ1IA_Y7JPsnCP`.
   - **Connected Modules**: User authentication (Email/Password, Google OAuth, Apple OAuth), athlete telemetry persistence, workout logging, meal logs, coach dispatch sync, buddy radar.
4. **Google / Gmail Authentication & Ecosystem**:
   - **Connected in App**: `AuthModal.tsx` handles Google Sign-In via `supabase.auth.signInWithOAuth({ provider: 'google' })`.
   - **Production Requirement**: In Supabase Auth dashboard (`Authentication -> Providers -> Google`), ensure Google OAuth Client ID & Client Secret from Google Cloud Console are enabled.
   - **Account/Owner**: `o1oblivianfitness@gmail.com`.
5. **Apple Ecosystem (Sign-in, Apple Pay, HealthKit)**:
   - **Apple Sign-In**: Connected in `AuthModal.tsx` via `supabase.auth.signInWithOAuth({ provider: 'apple' })`. Requires Apple Services ID & Key in Supabase Auth Provider settings for live redirects.
   - **Apple Pay**: Supported automatically through Stripe Checkout for iOS Safari and Apple devices.
   - **Apple Health (HealthKit)**: UI & biometric telemetry bridge configured in `src/components/BiometricModal.tsx` and `HistoryLogView.tsx`.
6. **Unsplash Visual Engine**:
   - **Key**: Configured via `VITE_UNSPLASH_ACCESS_KEY` (`yvN-Z1XNNrn_1ulP5NuGJu2HqpTWieOG7rO3-GJmysY`) for high-fidelity fitness photography and transformation vault assets.

### Note 3: Automated CI/CD Mobile Deployment Pipeline (Recorded: September 5, 2026)
1. **Chain of Automation**:
   - **AI Studio $\rightarrow$ GitHub**: Synced/pushed to repository `github.com/o1oblivian/oblivion-1-fitness` on `main` branch.
   - **GitHub $\rightarrow$ Codemagic**: Codemagic webhook listens to `push` events on `main` branch, triggering parallel Mac mini M2 build runners.
   - **Codemagic $\rightarrow$ App Store Connect**: The `ios-release` workflow builds web assets (`vite build`), runs `npx cap sync ios`, auto-increments the TestFlight build number (e.g. Build 35), signs with Apple credentials, and submits directly to TestFlight with automatic email notifications.
   - **Codemagic $\rightarrow$ Google Play Console**: The `android-release` workflow builds web assets, runs `npx cap sync android`, generates signed production AAB (`bundleRelease`), and publishes directly to Google Play's `internal` track without draft holding.
2. **Channel Delivery Guarantees**:
   - **Internal Testing & TestFlight**: 100% automated delivery to test devices.
   - **Public Store Review**: Requires standard one-click release promotion / submission selection in the respective store dashboards (Google Play Production track rollout / App Store version build attachment).



