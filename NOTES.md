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

### September 11, 2026 (Approx. 9:30 AM – 10:30 AM AEST)
- **Failure Analysis (Builds iOS #42 & Android #23)**:
  - Both builds failed at 11s during the "Preparing build machine" step.
  - **Root Cause**: Codemagic's runner validates workflow configuration and required publishing credentials *before* launching build scripts. Adding `publishing: google_play: credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` caused the Android machine preparation to abort because `$GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` was not present in the app's environment variables. Similarly, adding `integrations: app_store_connect: "O1FC Admin Key"` caused iOS machine preparation to fail.
- **Rollback Applied**:
  - Reverted `codemagic.yaml` back to the exact configuration that produced the successful iOS Build 41 archive without blocking machine preparation.
  - Reverted `android/app/build.gradle` back to standard clean configuration.
  - Workflows are now restored to run cleanly and produce the release `.ipa` and `.aab` artifacts without crashing at step 0.


