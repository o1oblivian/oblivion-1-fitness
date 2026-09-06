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

### Note 3: Automated CI/CD Mobile Deployment Pipeline (Recorded: September 5, 2026)
1. **Chain of Automation**: AI Studio $\rightarrow$ GitHub (`main`) $\rightarrow$ Codemagic (auto-triggers `ios-release` and `android-release` on Mac M2 runners).
2. **Apple TestFlight**: `ios-release` compiles web bundle, syncs iOS Capacitor, auto-increments build number (e.g. Build 35), signs with Apple API credentials, and uploads directly to TestFlight with tester notifications.
3. **Google Play Internal Testing**: `android-release` compiles web bundle, syncs Android Capacitor, signs production AAB (`bundleRelease`), and pushes directly to Google Play's `internal` track.
4. **Public Store Submission**: Reaching test devices is 100% automated. Promoting to public production requires selecting the build in App Store Connect / promoting the release in Google Play Console.

### Note 4: iOS Release Trigger Management & Google Play Key Activation (Recorded: September 5, 2026)
1. **iOS Release Workflow State**:
   - `ios-release` automatic push trigger in `codemagic.yaml` is paused to keep **Build 35** safe during active App Store review and public testing.
   - **Unpause Instruction**: When the user requests an iOS update or asks to unpause iOS, re-enable lines 7-13 in `codemagic.yaml` to resume auto-building Build 36+ to TestFlight.
2. **Google Play Key Activation Schedule**:
   - Permanent upload key (`release-keystore.jks`) SHA1: `CC:15:7C:65:54:1D:F9:AE:6C:09:12:87:9D:17:E2:AF:98:7E:6D:BE`.
   - Security hold ends **September 7, 2026 at 1:09 PM UTC**, after which Codemagic will publish automatically.



