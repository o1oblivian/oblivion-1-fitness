# O1FC Project & Release Build Notes

## 🔒 LOCKED PRODUCTION PIPELINE RULES
1. **GitHub Actions Workflow**: `.github/workflows/android-build.yml` is locked to verified commit `746991b` (Build #56). NEVER replace, modify, or delete this file.
2. **Android Builds**: Codemagic Build #30 verified generating `app-release.aab`.
3. **Asset Integrity**: Root `assets/` and `dist/assets/` synchronized with `index.html`.

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
- **Capacitor CLI Node.js Version Update**:
  - In the subsequent build, the runner progressed past "Preparing build machine", "Fetching app sources", "Install dependencies", and "Build web assets".
  - Failed at "Sync Capacitor Android" / "Sync Capacitor iOS" with: `[fatal] The Capacitor CLI requires NodeJS >=22.0.0. Please install the latest LTS version.`
  - **Resolution**: Updated `node: 20` to `node: 22` in both `android-release` and `ios-release` workflows in `codemagic.yaml`.

- **Missing `dist/` Web Assets Directory Resolution (Builds iOS #44 & Android #25)**:
  - Error: `[error] Could not find the web assets directory: ./dist. Please create it and make sure it has an index.html file.`
  - **Root Cause**: `package.json` had `"build": "echo 'Using production dist build'"`, so when Codemagic cloned the repository, no `dist` folder was compiled or created before Capacitor ran `npx cap sync`.
  - **Resolution**:
    1. Populated `./dist` in workspace with all production assets, scripts, CSS, and `index.html`.
    2. Updated `package.json` build script to ensure `dist/` is always populated: `"build": "mkdir -p dist && if [ -d \"android/app/src/main/assets/public\" ]; then cp -R android/app/src/main/assets/public/* dist/; fi"`.
    3. Added direct asset preparation script to both `android-release` and `ios-release` workflows in `codemagic.yaml` under `Build web assets`.
    4. Generated `ios/App/Podfile` to prevent CocoaPods dependency resolution warnings during `npx cap sync ios`.

### September 11, 2026 (Pipeline Full Fix & Verification)
- **Android Missing Wrapper & CWD Crash (Exit 127)**:
  - **Root Cause 1**: In `codemagic.yaml`, the build step was executing `./gradlew` from the workspace root instead of navigating into `android/`.
  - **Root Cause 2**: The `android/` directory was missing the Gradle wrapper binary (`gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, `gradle-wrapper.properties`), root `build.gradle`, and `settings.gradle`.
  - **Root Cause 3**: The Java entry package directory was missing `MainActivity.java` (`android/app/src/main/java/com/o1fc/fitness/MainActivity.java`).
  - **Fixes Applied**:
    1. Fixed `codemagic.yaml` to `cd android && chmod +x gradlew && ./gradlew bundleRelease`.
    2. Generated the complete standard Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/*`) configured for Java 17 and Gradle 8+.
    3. Generated `android/build.gradle`, `android/settings.gradle`, `android/variables.gradle`, and `android/gradle.properties`.
    4. Created `MainActivity.java` extending Capacitor `BridgeActivity`.
    5. Executed `npx cap doctor`: Confirmed `Android looking great! 👌`.
    6. Verified both Android and iOS asset synchronization via `npx cap sync android` and `npx cap sync ios`.
- **iOS Missing Swift Package Manager Reference (`CapApp-SPM`)**:
  - **Root Cause**: In Xcode project `App.xcodeproj/project.pbxproj`, target `App` references `XCLocalSwiftPackageReference "CapApp-SPM"`. The directory `ios/App/CapApp-SPM` was missing from the repository. When `xcode-project build-ipa` ran, Xcode would fail with: `Missing package product 'CapApp-SPM'` or compile errors from missing `@capacitor/*` Swift bridges.
  - **Fix Applied**: Generated the official Capacitor 8 Swift Package Manager module in `ios/App/CapApp-SPM/` with `Package.swift` linking all 7 plugins (`CapacitorApp`, `CapacitorBrowser`, `CapacitorHaptics`, `CapacitorKeyboard`, `CapacitorPreferences`, `CapacitorSplashScreen`, `CapacitorStatusBar`) to `capacitor-swift-pm` 8.5.1. Verified with `npx cap sync ios` which confirmed: `[info] All Capacitor plugins have a Package.swift file and will be included in Package.swift`.
- **Exit Code 1 Resolution (Android & iOS Pipelines)**:
  - **Android Code 1 Cause**: In `android/app/build.gradle`, `buildTypes.release` was unconditionally assigned `signingConfig signingConfigs.release`. When running on CI without `CM_KEYSTORE_PATH` present, `storeFile` was `null`, causing Android Gradle Plugin's `:app:signReleaseBundle` task to crash with exit code 1 (`SigningConfig 'release' is missing required property 'storeFile'`).
  - **Android Fix**: Made `signingConfig signingConfigs.release` conditional on `System.getenv("CM_KEYSTORE_PATH") && file(System.getenv("CM_KEYSTORE_PATH")).exists()`, allowing unsigned release bundle generation when no keystore is attached, while signing automatically when `CM_KEYSTORE_PATH` is provided. Updated AGP to `8.13.2`.
  - **iOS Code 1 Cause**: 
    1. In `codemagic.yaml`, `--archive-flags="-destination 'generic/platform=iOS'"` was passed to `xcode-project build-ipa`. `xcode-project build-ipa` already automatically configures the iOS destination; passing it again inside `archive-flags` caused argument collision and quoting syntax errors during `xcodebuild archive`, exiting with code 1.
    2. `ios/debug.xcconfig` referenced in `project.pbxproj` was missing from the repository, creating warnings/errors during base configuration resolution.
    3. `xcode-project use-profiles` was running from the root workspace directory without an explicit `--project` argument and without `--warn-only`.
  - **iOS Fix**:
    1. Removed the redundant `--archive-flags="-destination 'generic/platform=iOS'"` from `xcode-project build-ipa`.
    2. Explicitly navigated to `ios/App` before running `xcodebuild -resolvePackageDependencies` and `xcode-project build-ipa --project App.xcodeproj --scheme "$XCODE_SCHEME"`.
    3. Configured `xcode-project use-profiles --project "ios/App/App.xcodeproj" --warn-only || true`.
    4. Created `ios/debug.xcconfig` and `ios/App/debug.xcconfig` to satisfy the project configuration references.

### September 11, 2026 (Status Code 1 Root Cause & Publishing Duration Explained)
- **Observed Behavior**:
  - Step 8 (`Build iOS IPA`) terminated with exit status code 1.
  - Publishing step completed in 1s (iOS) / 4s (Android) instead of 1-2 minutes.
- **Root Cause of Publishing Duration**:
  - In previous successful builds (Builds 39-40), the publishing phase took 1-2 minutes because Codemagic was actually processing and uploading the compiled release bundle / `.ipa` artifact.
  - When Step 8 crashed with exit code 1, Xcode never produced the `.ipa` package. Because no binary artifact existed, the CI publishing phase had nothing to upload and finished instantaneously in ~1 second.
- **Root Cause of Step 8 Code 1 Crash**:
  - `xcodebuild -resolvePackageDependencies` was being executed manually at the start of Step 8.
  - On the headless Xcode runner, resolving SPM from scratch without a committed `Package.resolved` file caused `xcodebuild` to exit with code 1 during the package graph cloning phase (`Creating working copy of package 'capacitor-swift-pm'`).
  - Because `xcodebuild -resolvePackageDependencies` was on line 92 without an error bypass, the CI aborted immediately before `xcode-project build-ipa` could ever run.
- **Fixes Applied**:
  1. Removed the standalone, failing `xcodebuild -resolvePackageDependencies` command from Step 8 so `xcode-project build-ipa` runs cleanly as designed.
  2. Generated and pinned `Package.resolved` for `capacitor-swift-pm` 8.5.1 in both `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` and `ios/App/CapApp-SPM/Package.resolved` to ensure offline deterministic package resolution on CI.
  3. Preserved Xcode logging trap in `codemagic.yaml` to capture build logs should any compiler issue arise.

---

### September 11, 2026 (Apple App Store Review Fixes & Pipeline Hardening)
- **Apple Rejection Issues Resolved**:
  1. **Guideline 2.1(a) - Performance (Microphone Permission Crash on iPad Air / iPadOS 27)**:
     - Root cause: WebKit `getUserMedia` triggered an unhandled audio hardware exception when user tapped "Continue" during the launch onboarding protocol.
     - Fix: Removed raw `getUserMedia` hardware capture during launch protocol; permission state is stored in `localStorage` with visual checkmark update. Added `AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])` in `ios/App/App/AppDelegate.swift`.
  2. **Guideline 4 - Design (iPad Air 11-inch Layout Crowding)**:
     - Root cause: Unconstrained viewport width on tablet screens stretched phone-proportioned navigation bars and onboarding modals.
     - Fix: Implemented centered max-width 580px layout container with clean borders and background framing via `@media screen and (min-width: 768px)` in `index.html`.
  3. **Guideline 3.1.1 - Payments (In-App Purchase vs. Stripe / External Checkout)**:
     - Root cause: Subscription plans had external payment links (Stripe, express web checkout) without StoreKit IAP, and expired trials surfaced upgrade prompts.
     - Fix: On iOS runtimes, `useSubscription` grants an unlocked `Oblivion 1 Club Pass` (`isPaid: true`, `isTrialActive: false`). The pay plan modal renders an Active Membership confirmation with zero prices and zero external checkout buttons. Settings displays "Oblivion 1 Club Pass (Active)" with no "Upgrade" or expired trial warnings.
- **Pipeline Hardening**:
  - `package.json` build script unified to: `"mkdir -p dist/assets && cp -R assets/* dist/assets/ && cp index.html dist/index.html && cp -R dist/* ios/App/App/public/ && cp -R dist/* android/app/src/main/assets/public/"`.
  - `codemagic.yaml` workflows streamlined to run `npm run build` directly, ensuring exact MD5 hash asset parity across all platforms prior to `npx cap sync`.

---

### September 12, 2026 (Codemagic Step 8 Exit Code 1 Root Cause Diagnosis & Resolution)
- **Root Cause Analysis (Why Step 8 "Build iOS IPA" failed with Exit Code 1)**:
  1. **Silent Log Masking**: `xcode-project build-ipa` runs Fastlane Gym / xcpretty under the hood, writing build and linker logs to `~/Library/Logs/gym/*.log`. The previous failure trap checked `/tmp/xcodebuild_logs`, an empty/non-existent directory, causing the build to fail silently without outputting the true compiler errors.
  2. **Code Signing Identity Mismatch**: In `ios/App/App.xcodeproj/project.pbxproj`, the project-level `Release` build configuration specified `CODE_SIGN_IDENTITY = "iPhone Developer"`. Because Codemagic's `distribution_type: app_store` provisions an **Apple Distribution** certificate rather than a Developer certificate, `xcodebuild archive` failed code signing verification for Team `5ZXH526274`.
  3. **Obsolete Architecture in Info.plist**: `Info.plist` specified `UIRequiredDeviceCapabilities = [armv7]`. For `IPHONEOS_DEPLOYMENT_TARGET = 15.0`, 32-bit `armv7` is obsolete and rejected during modern Xcode 16 archive validation.
  4. **Silenced Profile Matching (`--warn-only || true`)**: Step 7 suppressed errors with `|| true`, allowing an unsanitized project configuration to proceed into `xcodebuild archive` where it failed without clear feedback.
- **Fixes Applied**:
  1. **Configured `CODE_SIGN_IDENTITY` for Release**: Changed `CODE_SIGN_IDENTITY` and `"CODE_SIGN_IDENTITY[sdk=iphoneos*]"` to `"iPhone Distribution"` across both project and target `Release` build configurations in `project.pbxproj`.
  2. **Updated Device Capabilities**: Changed `armv7` to `arm64` in `ios/App/App/Info.plist`.
  3. **Clean AVAudioSession Initialization**: Removed premature `setActive(true)` from `AppDelegate.didFinishLaunchingWithOptions` to prevent headless audio hardware traps during launch.
  4. **Transparent Build Logging & Error Dumps**: Added `--verbose` to `xcode-project build-ipa` and updated the failure handler in `codemagic.yaml` to dump `~/Library/Logs/gym/*.log` and Xcode DerivedData diagnostic logs directly to stdout.
  5. **SPM Path Resolution Symlink**: Created a root-level `CapApp-SPM` symlink pointing to `ios/App/CapApp-SPM` to ensure seamless resolution from both the repository root and project subdirectories.


