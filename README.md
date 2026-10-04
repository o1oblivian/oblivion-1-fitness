# Oblivion 1 Fitness Club (O1FC)

High-performance tactical mobile fitness operating system built with React, TypeScript, Tailwind CSS, and Capacitor for iOS and Android.

## App Identity & Bundle Configuration
- **App Name**: Oblivion 1 Fitness Club
- **Bundle ID / Application ID**: `com.oblivion1.fitness`
- **Platforms**: Web, iOS (App Store), Android (Google Play)
- **CI/CD**: Codemagic (`codemagic.yaml` included)

---

## 1. Exporting & Pushing to GitHub

1. In the top navigation bar of Google AI Studio, click **Share / Export** (or run `git init && git add . && git commit -m "Initial commit"`).
2. Create a new repository on GitHub: `https://github.com/your-username/oblivion1-fitness-club`.
3. Link and push your code:
   ```bash
   git remote add origin https://github.com/your-username/oblivion1-fitness-club.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Codemagic Setup (Automated App Store & Google Play Builds)

The included `codemagic.yaml` is pre-configured with two distribution workflows:
- **`ios-release`**: Builds signed `.ipa` and submits to TestFlight / App Store.
- **`android-release`**: Builds signed Android App Bundle (`.aab`) and submits to Google Play.

### Setting up Codemagic:
1. Log in to [Codemagic.io](https://codemagic.io) and click **Add application**.
2. Select your GitHub repository.
3. In **Environment Variables**:
   - For **iOS**: Add the App Store Connect API Key group (`app_store_credentials`):
     - `APP_STORE_CONNECT_KEY_IDENTIFIER`
     - `APP_STORE_CONNECT_ISSUER_ID`
     - `APP_STORE_CONNECT_PRIVATE_KEY`
   - For **Android**: Add the keystore credentials group (`google_play_credentials`):
     - `ANDROID_KEYSTORE` (base64-encoded `.keystore` or `.jks` file)
     - `ANDROID_KEYSTORE_PASSWORD`
     - `ANDROID_KEY_ALIAS`
     - `ANDROID_KEY_PASSWORD`
     - `GSERVICES_SERVICE_ACCOUNT_KEY` (Google Play API JSON key)
4. Trigger a build manually or push to the `main` branch.

---

## 3. Local Native Builds

### Prerequisites
- Node.js 20+
- Xcode 15+ (for iOS) with CocoaPods
- Android Studio Iguana+ (for Android) with JDK 17

### Commands
```bash
# Install dependencies
npm install

# Build web assets and sync native Capacitor projects
npm run cap:build

# Open in Xcode
npx cap open ios

# Open in Android Studio
npx cap open android
```
