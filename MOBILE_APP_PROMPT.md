# COPY-PASTE THIS ENTIRE PROMPT INTO A NEW BOLT MOBILE PROJECT

## HOW TO USE THIS FILE

1. Go to bolt.new and start a new project
2. Choose "Expo / React Native" as the framework (NOT web/Vite)
3. Paste the entire prompt below into the first message

---

## PROMPT STARTS HERE ↓ COPY EVERYTHING BELOW THIS LINE

Build a production-quality React Native (Expo) mobile app called "OFC — Athletic Performance Intelligence". This is a 100% port of an existing web app. Every feature, screen, and data flow must be replicated exactly. The app connects to an existing Supabase backend — do NOT create new tables, reuse the existing schema.

### SUPABASE CREDENTIALS (already provisioned — use these env vars)
- SUPABASE_URL (in .env)
- SUPABASE_ANON_KEY (in .env)
- SUPABASE_SERVICE_ROLE_KEY (in .env)

### TECH STACK
- Expo SDK (latest)
- React Native + TypeScript
- React Navigation (bottom tabs + stack modals)
- NativeWind (Tailwind CSS for React Native — same utility classes as web)
- lucide-react-native (icons — same API as lucide-react)
- @supabase/supabase-js (auth, database, realtime, RPC calls)
- react-native-reanimated + moti (animations — replaces Framer Motion)
- react-native-gifted-charts (replaces recharts)
- AsyncStorage (already in @react-native-async-storage/async-storage)
- expo-speech-recognition (replaces webkitSpeechRecognition for voice entry)
- expo-av (replaces Web Audio API for bell sounds)
- expo-location (replaces browser geolocation)
- react-native-maps (replaces Google Maps)
- @google/genai (Google Gemini AI for food photo analysis — works in RN)
- expo-google-fonts: Sora, PlusJakartaSans, SpaceGrotesk, JetBrainsMono

### DESIGN SYSTEM (replicate exactly)
- **Fonts**: Sora (display/headings, 700-800, letter-spacing -0.025em), Plus Jakarta Sans (body, 500), Space Grotesk + JetBrains Mono (numbers, tabular-nums)
- **Colors**:
  - Light mode: Background #F7F5F0, Cards #FDFCFB, Borders #EAE6DF, Text #000000
  - Dark mode: Background #0D0F14 (OLED black), Cards #161A1F, Borders #222733, Text #FFFFFF
  - Accent: #2D7FF9 (blue), Accent green: #3B624E
  - Success: #3FB98E, Warning: #E8B04A, Error: #D94F4F
  - darkMode toggled via class strategy
- **Patterns**: glassmorphism (backdrop-blur 20px saturate 180%), .lux-card (20px radius, 1px border), .card-lift (hover translateY -2px), .btn-press (active scale 0.95), .text-gradient, .shimmer
- **Spacing**: 8px base system
- **Border radius**: xl=16, 2xl=20, 3xl=24
- Premium feel: meticulous attention to detail, micro-interactions, hover states, smooth transitions

### APP STRUCTURE — 4 BOTTOM TABS

**Tab 1: Tracker (Workout Logger)** — main screen
- Weekly schedule strip: day selector (Mon-Sun) mapped to routine templates
- Exercise logger: category dropdown (weights/sports/recovery), exercise search from 30+ categories, add exercise cards, add/delete sets
- Per set: weight, reps, RPE input via rotary dial picker (circular haptic-style wheel)
- Voice entry: continuous speech recognition — speak reps→weight→auto-advance→new set; voice commands (add set, add exercise [name], delete, next, prev, done, clear)
- Rest timer: per-set timer with circular gauge + global rest timer
- Weekly progress chart: bar chart of training volume (react-native-gifted-charts)
- Step target setting (smart defaults — remembers last used values)
- Sync status indicator (online/offline + pending count)
- Coach-dispatched workouts: loads workouts sent by coach into the logger
- Commit/save workout session

**Tab 2: Fuel (Nutrition Dashboard)**
Composes 7 sub-sections vertically scrollable:
1. Daily Targets Card: editable macro targets (calories/protein/carbs/fat), BMR, AI auto-pilot calculator
2. Energy Balance Matrix: intake vs burn (BMR + training burn from active workout logs)
3. Daily Food Meal Logs: 4 meals (breakfast/lunch/dinner/snack) with add food (manual search, voice search, photo AI), delete items, running totals
4. Hydration Tracker: water intake logging, persists to daily_macros table
5. Macro Trends Ratio Analysis: P/C/F ratio trend visualization (toggle grams/calories view)
6. Supplement Matrix Intake Log: supplement search via edge function, categorizes results, saves to user_quick_supplements table
7. Zone 2 Cardio Longevity: zone 2 cardio tracking from workout logs + longevity score

**Tab 3: Coach (Marketplace)**
- Quality ticker banner: "Not influencer-based. Real coaches."
- Reel media card: full-bleed image/video, floating glass badges (Live, views, likes), exercise title
- Identity shield: masked coach name (locked) → unlocked reveals real name + verified badge
- Social links (Instagram/TikTok/Strava) gated behind program purchase
- Program attachment card: title, weeks, level, category, price
- Unlock CTA: "Buy Program ($X) — Unlock Coach Identity & Chat" → purchase flow
- Post-unlock: "Program & Coach Unlocked" + direct chat button
- Sample coach: Marcus Steel, "Push Pull Legs Mastery", $55, 10 weeks

**Tab 4: Log (Coach Dashboard)**
3 internal sub-tabs (Coach / Client / Reels):
- **Coach sub-tab**: system clock, athlete workout logs feed, approve/feedback workflow, form-check video review, workout dispatch to clients, AI coach insights, coach profile editing, media vault, social sharing
- **Client sub-tab**: athlete telemetry dashboard — athlete dossier cards (recovery score, volume, PRs, compliance %), full intelligence drill-down modal (training sessions, 1RM progress charts, bodyweight history, AI briefing), live HealthKit sync, dispatched workouts from coach
- **Reels sub-tab**: Instagram-style vertical scrolling reels feed (coach reels with video/photo, likes, views, program attachment)

### MODALS (all must be implemented as stack/modal routes)
1. Auth Modal: email/password sign-in & sign-up (Supabase auth)
2. Onboarding Modal: first-run profile setup (name, goals, gender, training focus)
3. Schedule Modal: weekly routine assignment per day-of-week
4. Routine Swapper Modal: swap active day's routine for another template
5. Commit Save Modal: save/commit day's workout session
6. Rotary Dial Modal: circular number picker (weight/reps/RPE/timer/step input)
7. Food Entry Modal: search food database (500+ items) + log meal item
8. Custom Food Modal: manually enter custom food macros
9. Photo AI Modal: AI food photo analysis (Google Gemini) — upload photo → estimated macros
10. Auto Pilot Modal: AI auto-pilot macro target calculator
11. Client Detail Modal: drill-down on coached athlete's history/profile
12. Edit Profile Modal: edit user's own profile
13. Edit Coach Profile Modal: coach edits marketplace profile
14. Export Help Modal: data export instructions
15. Gym Network Modal: gym partner finder using geolocation + PostGIS find_buddy_matches RPC, Google Maps integration
16. Pay Plan Hub Modal: pricing/paywall tiers (premium / coach)
17. Travel Pass Modal: travel/gym pass feature
18. Shareable Goal Card Modal: generate shareable goal achievement card
19. Community Hub Modal: community feed
20. Client Progress Share Modal: share client progress summary
21. Legal Agreements Modal: terms, privacy, health consent
22. Social Auth Modal: social auth provider buttons
23. Program Purchase Modal: purchase coach's program
24. Reel Upload Modal: coach uploads new reel (video/photo + metadata)
25. Biometric Modal: biometric/HealthKit sync display
26. Avatar Fit Modal: avatar customization
27. Up Sell Paywall Modal: upsell paywall
28. Swipeable Media Viewer: full-screen swipeable image/video gallery
29. Calories Detail Modal: calorie breakdown detail
30. AICoachInsightsModal: AI-generated coaching insights briefing
31. Media Vault Modal: media vault (video/photo storage) viewer
32. Client Roster Modal: coach's client list/roster
33. Workout Dispatch Modal: coach dispatches workout routine to client

### DATA FILES (port these exactly — copy the TypeScript files)
- **exerciseDatabase.ts**: EXERCISE_DATABASE (30+ categories: Chest&Triceps, Back&Biceps, Legs, Hyrox, Olympic, Strongman, Calisthenics, Yoga, Breathwork, Cold Therapy, etc.), ROUTINE_TEMPLATES (13 templates: push_a/b, pull_a/b, legs_a/b, upper, lower, full, arms, core, cardio, functional_hypertrophy, hybrid_racing), COACH_CLIENTS map
- **foodDatabase.ts**: INITIAL_FOOD_DB (500+ food items categorized: Protein, Carbs, Fats, Drinks, Cheat, Vegetables — each with icon, name, p/c/f, brand, servingGrams, servingUnit, optional sizes)
- **athleteTelemetry.ts**: ATHLETE_TELEMETRY (mock telemetry for 2 athletes — recovery scores/trends, 7 training sessions each, macroHistory 7 days, exerciseProgress 8-week 1RM/volume/RPE, PRs, bodyweight history, compliance %, AI briefing text)

### UTILITY FILES (port with RN adaptations)
- **supabase.ts**: Supabase client init + supabaseSignOut — keep as-is
- **authStorage.ts**: Session persistence using AsyncStorage instead of localStorage; getSessionUserEmail, getUserState, saveUserState, UserAppState interface
- **workoutLogsStore.ts**: Local-first workout log cache using AsyncStorage; online/offline detection (NetInfo), pending queue, load/save active logs, realtime sync subscription
- **frequencyDefaults.ts**: Smart default engine — remembers most-used values via AsyncStorage
- **voiceParser.ts**: Parse spoken voice input into reps/weight numbers & commands — keep as-is (pure logic)
- **audio.ts**: Replace Web Audio API with expo-av for bell sound on rest timer/notifications
- **foodVoiceSearch.ts**: Voice-to-text food search using expo-speech-recognition
- **geolocation.ts**: Replace browser geolocation with expo-location
- **gymNetworkStore.ts**: Gym network logic + subscribeToBuddyNotificationsRealtime (Supabase Realtime channel) — keep Supabase logic, adapt for RN
- **coachMarketplaceStore.ts**: Trial exercises, program dispatch to logger, isCoachUnlocked/setCoachUnlocked, CoachProgram type — keep as-is
- **dispatchStore.ts**: getDispatchedWorkouts / getDispatchedWorkoutsForClient — keep as-is (uses Supabase)
- **telemetryStore.ts**: fetchLiveTelemetry / getStaticTelemetry — keep as-is (uses Supabase)
- **legalContent.ts**: Legal text content — keep as-is
- **reelsTypes.ts**: TypeScript types for coach reels — keep as-is
- **accountDeletion.ts**: Account/data deletion helper — keep as-is

### TYPES (port exactly)
- AppMode = 'tracker' | 'fuel' | 'coach' | 'client'
- AuthMode = 'signin' | 'signup'
- UserSession: { email, name? }
- SetData: { id, reps, weight, rpe, rawVal1?, rawVal2? }
- ExerciseLog: { id, exerciseName, sets: SetData[] }
- FoodItem: { icon, name, p, c, f, brand?, category?, servingUnit?, defaultServingGrams?, sizes? }
- LoggedMealItem: { id, name, weight, p, c, f, cals }
- DailyMeals: { breakfast, lunch, dinner, snack } — each LoggedMealItem[]
- AthleteData: { key, name, handle, avatar, badge, todayLog, history, status?, volume? }
- TrainingSession, SessionExercise, SessionSet
- DailyMacroLog: { date, dateLabel, calories, calorieTarget, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget, hydration, hydrationTarget }
- ExerciseProgressPoint: { week, estimated1RM, topWeight, totalVolume, avgRPE }
- AthleteTelemetry: full athlete telemetry interface
- DialConfig: { isOpen, type, maxVal, currentVal, onConfirm }
- ToastMessage: { id, message, type: 'success' | 'error' }

### EXISTING SUPABASE DATABASE TABLES (do NOT recreate — just use)
- **workout_logs**: user_email, record_date, active_logs (jsonb), synced_at — UNIQUE(user_email, record_date)
- **daily_macros**: user_email, record_date, calories, calorie_target, protein, protein_target, carbs, carbs_target, fat, fat_target, hydration, hydration_target — UNIQUE(user_email, record_date)
- **bodyweight_logs**: user_email, record_date, weight_kg — UNIQUE(user_email, record_date)
- **user_quick_supplements**: user_email, name, brand, category, dosage, ingredients (jsonb), image_url, source, timing
- **user_consent**: user_email, health_consent, coach_liability_consent, terms_consent, app_version, accepted_at
- **coach_programs**: coach_email, title, description, category, difficulty, duration_weeks, price_cents, cover_image_url, program_content (jsonb), is_published
- **coach_reels**: coach_email, coach_name, coach_avatar, caption, media_url, media_type, thumbnail_url, program_id, workout_type, tags[], like_count, view_count, is_published
- **program_purchases**: buyer_email, program_id, coach_email, price_cents, platform_commission_pct (15%), platform_fee_cents, coach_payout_cents, status — UNIQUE(buyer_email, program_id)
- **coach_hub_unlocks**: athlete_email, coach_email, program_id, is_coach_hub_unlocked — UNIQUE(athlete_email, coach_email)
- **user_training_vectors**: user_email, user_name, gender, city_town, postcode, partner_status, venue_id, rpe_target, volume_level, training_focus, workout_preferences[], age, favorite_gym, vector_array[], bio, location (PostGIS)
- **gym_venues**: category, city, country, location, name
- **checkins, habits, profiles, health_telemetry, direct_messages, coach_feedback, dispatched_workouts, gym_passes**

### EXISTING EDGE FUNCTIONS (call via fetch from RN — already deployed)
- **food-scan**: GET ?barcode=XXX or ?q=name&country=AU — fetches Open Food Facts, returns { name, brand, p/c/f, cals, serving, imageUrl, category }
- **supplement-search**: GET ?q=query — searches Open Food Facts, filters to supplements only, categorizes into {Protein, Creatine, Pre-workout, Vitamins, Omega, Amino, Gut, Sleep, Energy, Joint, Immune, Adaptogens, General}

### AUTH FLOW
- On mount: supabase.auth.getSession() → if session, set email + authenticated
- Fallback to AsyncStorage session
- supabase.auth.onAuthStateChange subscription (SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED)
- AuthModal shown when unauthenticated
- OnboardingSetupModal for new users (name, goals, gender, training focus)
- Email confirmation OFF

### STATE MANAGEMENT
Use Zustand or React Context for global state (replaces prop drilling from web version):
- currentUserEmail, isAuthenticated
- theme: 'dark' | 'light' | 'system'
- activeLogs: ExerciseLog[] (workout logger state)
- weeklySchedule: Record<string, string> (day→routine key)
- dailyMeals: DailyMeals
- macro targets (bmr, goalCals, goalP, goalC, goalF)
- stepTarget, restTimerSecs, restTimerRunning
- syncStatus: { isOnline, pendingCount }
- toasts: ToastMessage[]

### ANIMATIONS (replace motion/react with reanimated + moti)
- Tab transitions: slide left/right based on navigation direction
- Modal transitions: scale + fade from tap origin point
- Voice waveform: animated bars (react-native-reanimated)
- Stagger children: cascading fade+slide-in
- Card lift: translateY on press
- Button press: scale 0.95 on press
- Shimmer: loading skeleton effect
- Marquee: scrolling text banner

### BOTTOM NAV BAR
- Fixed bottom, 92% width, rounded full, glassmorphism background
- 5 items: Workout, Fuel, BUDDY (center heart icon with pulsing red dot), Coach, Log
- Active tab: scaled up, accent color
- Profile menu: 3-dot menu opens popover with profile, settings, gym network, export, terms, support, logout
- Safe area padding for iPhone home indicator

### KEY ADAPTATIONS FROM WEB TO NATIVE
1. **webkitSpeechRecognition** → expo-speech-recognition (continuous mode for voice workout entry)
2. **Web Audio API** → expo-av (bell sound for rest timer completion + buddy notifications)
3. **browser geolocation** → expo-location (for gym partner matching)
4. **Google Maps** → react-native-maps (gym venue maps)
5. **recharts** → react-native-gifted-charts (weekly progress + telemetry charts)
6. **motion/react** → react-native-reanimated + moti (all animations)
7. **lucide-react** → lucide-react-native (same icon API)
8. **localStorage** → AsyncStorage (all local persistence)
9. **CSS backdrop-filter** → react-native-blur (BlurView for glassmorphism)
10. **CSS scroll** → ScrollView/FlatList (all scrollable lists)
11. **input type=number** → TextInput with keyboardType="numeric"
12. **file input** → expo-image-picker + expo-document-picker
13. **CSS animations** → react-native-reanimated animations

### BUILD THIS IN PHASES
Phase 1: Project setup (Expo, NativeWind, fonts, Supabase client, auth, navigation shell with 4 tabs)
Phase 2: Tracker tab (workout logger, exercise database, rotary dial, voice entry, rest timer, weekly schedule, progress chart)
Phase 3: Fuel tab (all 7 nutrition sub-sections, food database, food entry, photo AI, hydration, supplements)
Phase 4: Coach tab (marketplace, reel card, identity shield, program purchase)
Phase 5: Log tab (coach dashboard with 3 sub-tabs, telemetry, reels feed, client roster, workout dispatch)
Phase 6: All modals (auth, onboarding, gym network, pay plan, profile editing, media vault, etc.)
Phase 7: Realtime features (buddy notifications, live workout sync, telemetry sync)
Phase 8: Polish (animations, transitions, glassmorphism, safe areas, haptics)

### IMPORTANT NOTES
- This app already has @react-native-async-storage/async-storage in dependencies
- The web version uses localStorage extensively — ALL localStorage calls must become AsyncStorage calls
- The web version uses webkitSpeechRecognition — must use expo-speech-recognition
- Charts use recharts — must use react-native-gifted-charts with equivalent chart types (bar, line, area)
- The app has a dark/light theme toggle — implement with NativeWind darkMode: 'class'
- Food items use emoji icons (no icon font needed for food)
- Exercise database has 30+ categories with hundreds of exercises — port the data file exactly
- Food database has 500+ items — port the data file exactly
- Athlete telemetry has mock data for 2 athletes — port the data file exactly
- All Supabase RLS policies use auth.uid()::text = user_email or auth.jwt() ->> 'email' pattern
- Edge functions are already deployed — just call them via fetch from the app

Make it beautiful, premium, and production-ready. Match the luxury athletic aesthetic of the web version exactly.

## PROMPT ENDS HERE ↑ COPY EVERYTHING ABOVE THIS LINE

---

## WHAT TO DO AFTER CREATING THE NEW PROJECT

1. Copy these data files from this web project into the new Expo project:
   - src/data/exerciseDatabase.ts
   - src/data/foodDatabase.ts
   - src/data/athleteTelemetry.ts

2. Copy these utility files (they're pure TypeScript/Supabase logic, minimal changes needed):
   - src/utils/supabase.ts (keep as-is)
   - src/utils/voiceParser.ts (keep as-is)
   - src/utils/coachMarketplaceStore.ts (keep as-is)
   - src/utils/dispatchStore.ts (keep as-is)
   - src/utils/telemetryStore.ts (keep as-is)
   - src/utils/legalContent.ts (keep as-is)
   - src/utils/reelsTypes.ts (keep as-is)
   - src/utils/accountDeletion.ts (keep as-is)

3. Copy src/types.ts (keep as-is)

4. These files need adaptation for React Native (replace localStorage → AsyncStorage, browser APIs → Expo APIs):
   - src/utils/authStorage.ts
   - src/utils/workoutLogsStore.ts
   - src/utils/frequencyDefaults.ts
   - src/utils/audio.ts
   - src/utils/foodVoiceSearch.ts
   - src/utils/geolocation.ts
   - src/utils/gymNetworkStore.ts

5. The Supabase migrations and edge functions are already deployed — do NOT recreate them.

6. The .env file with Supabase credentials will be auto-populated in the new Bolt project.
