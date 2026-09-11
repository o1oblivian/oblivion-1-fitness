# O1FC Project & Release Build Notes

## System Credentials Status (Verified Active & Untouched)
All credentials and environment configurations remain 100% intact:
- **Gemini API Key**: Active
- **Stripe Live Secret Key & Webhook**: Active
- **Supabase Production URL & Anon Key**: Active
- **Unsplash API Access Key**: Active
- **Apple Developer / Codemagic Code Signing Identities**: Untouched on Codemagic (Distribution Certificate & Provisioning Profile for `com.o1fc.fitness`)

---

## Build & Deployment Timeline (Dates & History)

### September 10, 2026
- **Initial Setup**: Configured Capacitor 8 native wrappers for Android (`android/`) and iOS (`ios/App/`).
- **Android Workflow**: Created `android-release` workflow in `codemagic.yaml` producing release `.aab` for Google Play Internal track.
- **iOS Code Signing**: Configured `ios_signing` with `distribution_type: app_store` and bundle ID `com.o1fc.fitness`.

### September 11, 2026 (Approx. 8:00 AM – 9:00 AM AEST)
- **Trials 1–40 (Issue Identification)**:
  - Codemagic iOS builds were completing in <1s or failing silently because the Xcode scheme was unshared (missing `App.xcscheme`).
  - TestFlight version collisions occurred because build version 40 was already registered on App Store Connect.
- **Fixes Applied**:
  - Generated `/ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme` so the headless runner could locate the `App` build target.
  - Automated build number incrementing via `agvtool` starting past build 41.
  - Set `CURRENT_PROJECT_VERSION = 41` in `project.pbxproj`.

### September 11, 2026 (Approx. 9:00 AM AEST)
- **iOS Build 41**:
  - Build 41 executed successfully on Codemagic using the attached Apple Developer signing identities.
  - Web assets built, Capacitor synced, Xcode compiled the archive, and the release `.ipa` artifact was produced.
  - **Issue**: Build 41 did not appear on TestFlight because `codemagic.yaml` was saving the `.ipa` as an artifact but did not include an automated upload command to TestFlight.

### September 11, 2026 (Approx. 9:30 AM – 10:20 AM AEST)
- **Integration Resolution**:
  - Verified user's Codemagic team integrations: `O1FC Key` and `O1FC Admin Key`.
  - Added `integrations: app_store_connect: "O1FC Admin Key"` directly to the `ios-release` workflow.
  - Linked `publishing: app_store_connect:` with `auth: integration` and `submit_to_testflight: true`.
  - Codemagic now has the direct link to the App Store Connect API Key to automatically upload and submit every successful iOS build to TestFlight.

- **End-to-End Audit (Point A to Point Z)**:
  - **Point A (AI Studio Web App)**: Verified production assets in `dist/`, including web manifest, app icons (192, 512, 1024), splash screen, and privacy page. Applet compiles cleanly.
  - **Bridge (Capacitor & Native Wrappers)**: Verified `capacitor.config.json` configured with appId `com.o1fc.fitness` and name `Oblivion 1`.
  - **Point Z (Apple / TestFlight)**:
    - Bundle ID `com.o1fc.fitness` matched across `project.pbxproj` and `codemagic.yaml`.
    - Shared Xcode scheme `App.xcscheme` committed and active.
    - Automatic version incrementing prevents version collision on TestFlight.
    - Automated TestFlight submission enabled via `app_store_connect: "O1FC Admin Key"`.
  - **Point Z (Google Play Console)**:
    - Application ID `com.o1fc.fitness` verified in `android/app/build.gradle` and `AndroidManifest.xml`.
    - Dynamic `versionCode` linked to `$BUILD_NUMBER` to prevent Google Play duplicate version code rejections.
    - Release signing configurations hooked to Codemagic keystore environment variables (`CM_KEYSTORE_PATH`).
    - Standardized Google Play publishing credentials pipeline in `codemagic.yaml`.

