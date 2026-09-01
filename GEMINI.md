# Oblivion 1 Fitness Club (O1FC Official) Directives

- **Owner / GitHub Account**: `o1oblivianfitness@gmail.com` (`o1oblivian`)
- **Repository**: `https://github.com/o1oblivian/oblivion-1-fitness`
- **Application**: Oblivion 1 Fitness Club (O1FC Official)
- **Supabase Backend (Immutable)**: `https://qkfvepjeyreicqomatyt.supabase.co` (Ref: `qkfvepjeyreicqomatyt`)
- **Purpose**: High-performance Training OS Pro, Fuel OS, Coach Hub, Tandem Workout Engine, and Health Intelligence.
- **Rule**: Retain all OFC Official core modules, state managers, and views across all future interactions.
- **Design Standard**: 100/10 Apple-Grade Professional UI. Zero emojis in buttons/tabs/filters/headers. Use Lucide React vector icons or pure typography, refined monochrome/neutral palettes with OFC red accents, and balanced spatial geometry.

## System Guarantees & Commitments Log
### Note 1: Core Integrity, Vision Analysis & Payment Guarantees (Recorded: September 1, 2026)
1. **0% Fake Meal Templates (Absolute Invariant)**: Zero hardcoded fallback meals in frontend or backend. Meal scanning only returns genuine AI Vision analysis or explicit errors.
2. **0% Fake Subscriptions / Free Bypass (Absolute Invariant)**: Zero client-side fake activation bypasses. Paid tiers require real Stripe sessions.
3. **Strict Gemini SDK Payload Architecture**: Endpoint strictly follows `@google/genai` specification (`[{ inlineData: ... }, prompt]`) with structured JSON schema.
4. **Resilient Multi-Endpoint & Proxy Protection**: `apiFetch` validates `application/json` responses against proxy interception.

### Note 2: Comprehensive External Service Integrations Matrix (Recorded: September 1, 2026)
1. **Google Gemini AI**: `@google/genai` with `gemini-3.7-flash` & `gemini-flash-latest` for `/api/food-scan` (Meal Vision) and `/api/gemini-coach` (AI Intelligence).
2. **Stripe Payments & Coach Payouts**: Real Stripe checkout, webhook verification, Apple Pay/G-Pay/Card support, and Stripe Connect for coaches.
3. **Supabase Backend**: `https://qkfvepjeyreicqomatyt.supabase.co` for Auth, database, athlete telemetry, workout logs, coach dispatch, and edge functions.
4. **Google / Gmail Auth**: `supabase.auth.signInWithOAuth({ provider: 'google' })` configured in `AuthModal.tsx`.
5. **Apple Ecosystem**: Apple OAuth in `AuthModal.tsx`, Apple Pay in Stripe Checkout, Apple Health (HealthKit) telemetry mapping in `BiometricModal.tsx`.
6. **Unsplash Visual Engine**: `VITE_UNSPLASH_ACCESS_KEY` for athletic vault media.


